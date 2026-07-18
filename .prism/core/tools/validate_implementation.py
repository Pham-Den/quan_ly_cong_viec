#!/usr/bin/env python3
"""validate_implementation.py — deterministic evidence for `validate implementation`.

Companion to the LLM audit (`validate implementation --mode spec|quality`), per the
VP-13/VP-14 pattern: the validate command MUST run this tool and merge its findings.
It checks only FALSIFIABLE claims — it does not judge design quality, "meaningful"
code surfaces, or spec semantics (those remain the LLM pass's job under `VAL-2`).

Rules:
  VI-1  Declared repo test delta exists in the actual change set.
        Parses the task group's `repo_test_delta_target` (Add / Modify lists) from the
        approved implementation plan. A declared file that does NOT exist on disk is a
        blocker (fabricated claim). A file that exists but is absent from the change
        set is a WARN with a --diff-base hint (the work may already be committed —
        the tool cannot distinguish that from never-changed, so it never hard-blocks).
        Declared paths win over any `no test delta` text (template guidance comments
        and the leftover `Or:` scaffold line contain that phrase). `no test delta`
        with no declared paths is recorded and skipped (justification is LLM-graded).
        Unparseable entries are reported `unverifiable` (warn), never guessed.
  VI-2  CODE-1 marker coverage — FACTS ONLY (info). Counts changed code files that
        carry a traceability marker line and lists those that don't. Grading stays
        with the LLM pass because "meaningful vs trivial" (CODE-2) is judgment.
  VI-3  Technique-evidence table (CODE-3a) is real. When a test delta ships, a
        technique-evidence table must exist in the Implement output folder; every
        `test_file` it references must exist on disk (else blocker — fabricated
        evidence). Task-group US ids missing from the AC column are warn.
        The changed-test-file trigger is scoped by `code_ownership_zones` so another
        task group's test churn in a shared working tree cannot force a table on
        this one. Tables are matched to THIS task group (declared paths / zones);
        tables that only belong to other task groups do not satisfy the check.
  VI-4  Active validate file consistency. A file whose latest conclusion is `clean`
        while it declares blocker > 0 (or still lists blocker-severity findings)
        is a blocker — the conclusion is falsified by the file's own content.
  VI-5  (--run) The plan's `validation commands to run` actually pass. Commands are
        printed before execution; non-zero exit or timeout is a blocker — EXCEPT
        exit 127/9009 (shell command-not-found: prose line or missing tool), which
        is warn `unverified`, not a proven failure.
        Meta-lines (`validate implementation ...`) are skipped. Opt-in by flag.

Change-set resolution (in order):
  1. git — `git diff --name-only <--diff-base, default HEAD>` + untracked files.
     Also computes a WHOLE-TREE delta hash (git diff --binary + untracked FILE
     blocks, sha256/12) as a freshness anchor. Note: this is deliberately NOT the
     `core/orchestrator.md § Target Fingerprint Algorithm` value — that spec scopes
     the hash to `affected_code_surfaces`, while this tool hashes the full tree so
     VI-1 can see declared files outside the zones. Record it as tool evidence,
     not as the § fingerprint value.
  2. --baseline <manifest.json> — compare a snapshot written earlier with
     --write-baseline (no-git environments).
  3. degraded — neither available: VI-1 downgrades to existence-only checks and the
     run is marked `degraded` (recorded in evidence; never silently passes).

Git is OPTIONAL — invariant: absence of git never blocks. Git is one convenience
source of the change set, never a requirement. A no-git run can only be MORE
lenient than a git run (equal or fewer blockers), never stricter: degraded mode
blocks only on filesystem-provable facts (a declared file that does not exist,
a fabricated evidence-table reference), and the degradation itself is always
warn-level (`VI-0`), never a blocker.

Exit codes:
  0  OK — no blocker findings
  1  one or more blocker findings
  2  plan file or task group not found
  3  usage / environment error
"""

from __future__ import annotations

import argparse
import fnmatch
import hashlib
import json
import re
import subprocess
import sys
import time
from dataclasses import dataclass, field
from pathlib import Path

# VI-2 scans every changed text file EXCEPT clearly-non-code ones. A blacklist of
# docs/data/assets is stack-invariant; a whitelist of "code extensions" is not —
# any new stack (Elixir, C++, PHP, Rust, ...) would silently fall out of the
# marker inventory until someone edits the tool. Unknown extensions are scanned
# (facts-only, so over-inclusion is harmless); binary content is skipped by a
# null-byte probe, not by extension guessing.
NONCODE_EXTS = {
    ".md", ".markdown", ".rst", ".adoc", ".txt", ".json", ".jsonl", ".yaml", ".yml",
    ".toml", ".ini", ".cfg", ".conf", ".properties", ".lock", ".csv", ".tsv",
    ".svg", ".png", ".jpg", ".jpeg", ".gif", ".webp", ".ico", ".pdf", ".drawio",
    ".zip", ".gz", ".tar", ".woff", ".woff2", ".ttf", ".otf", ".map",
}
# CODE-1 markers may be one canonical line or a multi-line docblock; require the
# Sprint field plus at least one linkage field anywhere in the file (facts-only,
# so favoring recall over precision is the right trade).
MARKER_SPRINT_RE = re.compile(r"Sprint:\s*\S+", re.IGNORECASE)
MARKER_LINK_RE = re.compile(r"(Task Group\s*:|US:\s*US-\d|Feature:\s*\S|\bUS-\d+\b|\bFR-\d+\b)")
# Test-file conventions across stacks: pytest / jest / vitest / go / JVM / Swift /
# Dart / RSpec. Deliberately convention-based, NOT `"test" in path` (which would
# false-trigger on e.g. `src/latest.py` or `src/contest.js`).
TESTISH_RE = re.compile(
    r"(^|/)(tests?|__tests__|spec|src/test)/"        # test directories
    r"|(^|/)test_[^/]+$"                              # pytest test_*.py
    r"|_test\.[^/.]+$"                                # go / python *_test.ext
    r"|\.(test|spec)\.[^/.]+$"                        # jest / vitest *.test.ts, *.spec.ts
    r"|_spec\.[^/.]+$"                                # rspec *_spec.rb
    r"|Tests?\.(java|kt|kts|swift|cs|scala)$",        # JVM / Swift *Test(s).ext
    re.IGNORECASE,
)
US_ID_RE = re.compile(r"\bUS-\d+\b")
# Parens/brackets/@/+ allowed: real path conventions use them — Next.js route
# groups `app/(marketing)/`, dynamic routes `app/[locale]/`, SvelteKit
# `+page.svelte`, scoped npm dirs `@org/`. Only a TRAILING parenthetical is an
# annotation.
PATHISH_RE = re.compile(r"^[\w./\\()\[\]@+\-]+$")
MAX_SCAN_BYTES = 1_000_000
SNAPSHOT_IGNORE_DIRS = {
    ".git", "node_modules", ".venv", "venv", "__pycache__", "dist", "build",
    ".next", "target", "Pods", ".dart_tool", ".gradle", "coverage", ".idea",
}


def is_testish(path: str) -> bool:
    return bool(TESTISH_RE.search(path))


def norm_path(p: str) -> str:
    """Normalize a plan-declared path for comparison: `./x`, backslashes → posix."""
    p = p.replace("\\", "/").strip()
    while p.startswith("./"):
        p = p[2:]
    return p


def has_marker(text: str) -> bool:
    return bool(MARKER_SPRINT_RE.search(text) and MARKER_LINK_RE.search(text))


@dataclass
class Finding:
    severity: str  # blocker | warn | info
    rule: str
    message: str


@dataclass
class Report:
    findings: list[Finding] = field(default_factory=list)
    facts: dict = field(default_factory=dict)
    degraded: bool = False

    def add(self, severity: str, rule: str, message: str) -> None:
        self.findings.append(Finding(severity, rule, message))

    @property
    def blockers(self) -> int:
        return sum(1 for f in self.findings if f.severity == "blocker")


# ---------------------------------------------------------------- plan parsing

def extract_task_group_section(plan_text: str, task_group: str) -> str | None:
    """Return the markdown section for `### Task Group <id>...` up to the next
    heading of the SAME or higher level — a deeper sub-heading (e.g. `####`
    inside a `###` task group) must not truncate the section."""
    tg = re.escape(task_group.strip().removeprefix("TG-").removeprefix("TG "))
    pattern = re.compile(
        rf"^(#{{3,4}})\s+Task Group\s+{tg}\b.*?$", re.MULTILINE | re.IGNORECASE
    )
    m = pattern.search(plan_text)
    if not m:
        return None
    level = len(m.group(1))
    rest = plan_text[m.end():]
    nxt = re.search(rf"^#{{2,{level}}}\s+", rest, re.MULTILINE)
    return rest[: nxt.start()] if nxt else rest


def field_block(section: str, name: str) -> str:
    """Text after `- **<name>**:` up to the next `- **field**` bullet (sub-bullets included).

    Accepts `-` or `*` bullets so plan formatting variants keep parsing.
    """
    pattern = re.compile(
        rf"^[-*]\s+\*\*{re.escape(name)}\*\*:\s*(.*?)(?=^[-*]\s+\*\*|\Z)",
        re.MULTILINE | re.DOTALL | re.IGNORECASE,
    )
    m = pattern.search(section)
    return m.group(1) if m else ""


def _clean_token(tok: str) -> str:
    """Strip annotations from one declared-path token WITHOUT mangling the path:
    trailing ` — reason` and a TRAILING `(unit)` note are annotations; a
    parenthesized path segment mid-token (Next.js `app/(marketing)/…`) is not."""
    tok = re.sub(r"<!--.*?-->", "", tok, flags=re.DOTALL)
    tok = re.sub(r"\s+—.*$", "", tok)            # trailing " — reason"
    tok = re.sub(r"\s+\([^)]*\)\s*$", "", tok)   # trailing " (unit)" annotation only
    return tok.strip("`").strip()


def extract_paths(line: str) -> tuple[list[str], list[str]]:
    """Return (paths, unverifiable_tokens) from an Add:/Modify: line."""
    backticked = re.findall(r"`([^`]+)`", line)
    tokens = backticked if backticked else [
        t.strip() for t in re.sub(r"<!--.*?-->", "", line, flags=re.DOTALL).split(",") if t.strip()
    ]
    paths: list[str] = []
    unverifiable: list[str] = []
    for tok in tokens:
        tok = _clean_token(tok)
        if not tok:
            continue
        if ("/" in tok or re.search(r"\.\w+$", tok)) and PATHISH_RE.match(tok):
            paths.append(tok)
        else:
            unverifiable.append(tok)
    return paths, unverifiable


def parse_test_delta(section: str) -> dict:
    block = field_block(section, "repo_test_delta_target")
    result: dict = {"add": [], "modify": [], "no_test_delta": False, "unverifiable": []}
    for kind in ("add", "modify"):
        for m in re.finditer(rf"^\s*[-*]\s*{kind}:\s*(.+)$", block, re.MULTILINE | re.IGNORECASE):
            paths, unv = extract_paths(m.group(1))
            result[kind].extend(norm_path(p) for p in paths)
            result["unverifiable"].extend(unv)
    # Declared paths WIN over any `no test delta` text: the template's guidance
    # comments and its leftover `Or:` scaffold line both contain the phrase, so
    # matching it while concrete Add/Modify paths exist would silently disable
    # VI-1 for every plan generated from the template. Strip HTML comments before
    # searching so guidance text never counts as a declaration.
    if not result["add"] and not result["modify"]:
        stripped = re.sub(r"<!--.*?-->", "", block, flags=re.DOTALL)
        m = re.search(r"no test delta[^\n]*", stripped, re.IGNORECASE)
        # An unfilled template scaffold (`no test delta — <substantive reason>` /
        # `[substantive reason]`) is NOT a declaration — treat it as unparseable
        # so VI-1 emits the "no parseable paths" warn instead of skipping.
        if m and not re.search(r"<[^>]*>|\[[^\]]*\]", m.group(0)):
            result["no_test_delta"] = True
    return result


def parse_validation_commands(section: str) -> list[str]:
    # Strip comments over the WHOLE block first (DOTALL): a multi-line comment
    # stripped per-line leaks its body as prose commands and its closing `-->`
    # as the shell command `>` — a false VI-5 blocker.
    block = re.sub(r"<!--.*?-->", "", field_block(section, "validation commands to run"), flags=re.DOTALL)
    commands: list[str] = []
    for raw in block.splitlines():
        line = raw.strip().lstrip("-*").strip()
        if not line:
            continue
        m = re.search(r"`([^`]+)`", line)
        cmd = m.group(1) if m else line
        if cmd.lower().startswith("validate implementation"):
            continue  # meta-command: that's the LLM audit itself
        if "validate_implementation.py" in cmd:
            continue  # this tool's own invocation — running it would recurse
        commands.append(cmd)
    return commands


def parse_zones(section: str) -> list[str]:
    # DOTALL comment strip over the whole block — see parse_validation_commands.
    block = re.sub(r"<!--.*?-->", "", field_block(section, "code_ownership_zones"), flags=re.DOTALL)
    zones: list[str] = []
    for raw in block.splitlines():
        line = raw.strip().lstrip("-*").strip().strip("`")
        if line and PATHISH_RE.match(line.replace("*", "x").replace("{", "").replace("}", "")):
            zones.append(line)
    return zones


def parse_user_stories(section: str) -> list[str]:
    return sorted(set(US_ID_RE.findall(field_block(section, "User Stories"))))


# ------------------------------------------------------------ change-set logic

def git_change_set(root: Path, diff_base: str) -> tuple[list[str], dict] | None:
    def run(*args: str) -> subprocess.CompletedProcess:
        return subprocess.run(
            ["git", "-C", str(root), *args], capture_output=True, text=True, timeout=60
        )
    try:
        if run("rev-parse", "--git-dir").returncode != 0:
            return None
        untracked = run("ls-files", "--others", "--exclude-standard")
        if untracked.returncode != 0:
            return None
        untracked_files = sorted(ln.strip() for ln in untracked.stdout.splitlines() if ln.strip())

        head_proc = run("rev-parse", "HEAD")
        unborn = head_proc.returncode != 0  # fresh `git init`, no commit yet
        if unborn:
            # No commit to diff against: staged files (`ls-files --cached`) are
            # part of the change set too, not only untracked ones.
            cached = run("ls-files", "--cached")
            if cached.returncode == 0:
                untracked_files = sorted(
                    set(untracked_files)
                    | {ln.strip() for ln in cached.stdout.splitlines() if ln.strip()}
                )
        diff_files: set[str] = set()
        diff_bytes = b""
        if not unborn:
            # --relative: when --repo-root is a subdirectory of the git repo, both
            # the reported paths and the plan's declared paths must share the same
            # base, or every comparison silently misses.
            diff = run("diff", "--relative", "--name-only", diff_base)
            if diff.returncode != 0:
                return None  # bad --diff-base → caller falls through to baseline/degraded
            diff_files = {ln.strip() for ln in diff.stdout.splitlines() if ln.strip()}
            binary = subprocess.run(
                ["git", "-C", str(root), "diff", "--relative", "--binary", diff_base],
                capture_output=True, timeout=120,
            )
            diff_bytes = binary.stdout

        changed = sorted(diff_files | set(untracked_files))
        # Delta hash per core/orchestrator.md § Target Fingerprint Algorithm.
        hasher = hashlib.sha256(diff_bytes)
        for rel in untracked_files:
            fp = root / rel
            if fp.is_file():
                content = fp.read_bytes()
                if not content.endswith(b"\n"):
                    content += b"\n"
                hasher.update(f"---FILE {rel}---\n".encode())
                hasher.update(content)
                hasher.update(b"---END FILE---\n")
        meta = {
            "source": "git",
            "head": "unborn" if unborn else head_proc.stdout.strip(),
            "diff_base": "(unborn — untracked files only)" if unborn else diff_base,
            "delta_hash": hasher.hexdigest()[:12],
            "delta_hash_scope": "whole-tree (not the § Target Fingerprint value)",
        }
        return changed, meta
    except (OSError, subprocess.SubprocessError):
        return None


def snapshot_manifest(root: Path, zones: list[str]) -> dict[str, str]:
    manifest: dict[str, str] = {}
    for fp in sorted(root.rglob("*")):
        if not fp.is_file() or SNAPSHOT_IGNORE_DIRS.intersection(fp.parts):
            continue
        rel = fp.relative_to(root).as_posix()
        if not in_zones(rel, zones):
            continue
        try:
            manifest[rel] = hashlib.sha256(fp.read_bytes()).hexdigest()
        except OSError:
            continue
    return manifest


def baseline_change_set(root: Path, baseline_path: Path) -> tuple[list[str], dict]:
    """Change detection must be FULL-repo (ignore dirs only), never zone-scoped:
    declared test files often live outside `code_ownership_zones` (e.g. a plan
    scoping zones to src/ only), and a zone-scoped manifest would hide them from
    the change set — turning VI-1 into a guaranteed false positive."""
    old = json.loads(baseline_path.read_text(encoding="utf-8"))
    now = snapshot_manifest(root, [])
    changed = sorted(
        [p for p, h in now.items() if old.get(p) != h]
        + [p for p in old if p not in now]
    )
    return changed, {"source": "baseline", "baseline": str(baseline_path)}


def in_zones(rel: str, zones: list[str]) -> bool:
    """Path-boundary-aware zone match: `src/payments/**` must NOT match `src/payments2/x`."""
    if not zones:
        return True
    for z in zones:
        if fnmatch.fnmatch(rel, z):
            return True
        prefix = z.rstrip("*").rstrip("/")
        if prefix and (rel == prefix or rel.startswith(prefix + "/")):
            return True
    return False


# -------------------------------------------------------------------- checks

def check_vi1(report: Report, delta: dict, changed: list[str] | None, root: Path,
              diff_label: str) -> None:
    if delta["no_test_delta"]:
        report.add("info", "VI-1", "plan declares `no test delta` — justification is LLM-graded, skipping file checks")
        return
    declared = delta["add"] + delta["modify"]
    if not declared:
        report.add(
            "warn", "VI-1",
            "repo_test_delta_target has no parseable Add/Modify file paths — unverifiable; "
            "list concrete paths in the plan so this check can run",
        )
        return
    for tok in delta["unverifiable"]:
        report.add("warn", "VI-1", f"unverifiable repo_test_delta_target entry (not a file path): {tok!r}")
    # Severity rule: BLOCKER only for what is unambiguously false (the declared
    # file does not exist — a fabricated claim). A file that exists but is absent
    # from the change set is ambiguous — the task group's work may already be
    # committed and the caller ran with the wrong --diff-base — so that is a WARN
    # with the actionable hint, never a false block.
    changed_set = {norm_path(p) for p in changed} if changed is not None else None
    not_in_diff_hint = (
        f"exists on disk but is NOT in the change set vs {diff_label} — if this task group's "
        "work was already committed, re-run with --diff-base <commit before the task group>; "
        "otherwise this change did not produce it"
    )
    for kind, verb in (("add", "Add"), ("modify", "Modify")):
        for path in delta[kind]:
            if not (root / path).is_file():
                report.add(
                    "blocker", "VI-1",
                    f"declared {verb} test file does not exist: {path}"
                    + (" (degraded: existence-only)" if changed_set is None else ""),
                )
            elif changed_set is not None and path not in changed_set:
                report.add("warn", "VI-1", f"declared {verb} test file {path}: {not_in_diff_hint}")
    if changed_set is None:
        existing = sum(1 for p in declared if (root / p).is_file())
        report.add(
            "info", "VI-1",
            f"degraded existence-only: {existing}/{len(declared)} declared files verified on disk "
            "(no git required — change-set membership not checked in this mode)",
        )
    report.facts["vi1_declared"] = {"add": delta["add"], "modify": delta["modify"]}


def check_vi2(report: Report, changed: list[str] | None, zones: list[str], root: Path) -> None:
    if changed is None:
        candidates = [p for p in snapshot_manifest(root, zones)] if zones else []
        if not candidates:
            report.add("info", "VI-2", "degraded run without code_ownership_zones — marker scan skipped")
            return
    else:
        candidates = changed
    code_files = [
        p for p in candidates
        if Path(p).suffix.lower() not in NONCODE_EXTS
        and in_zones(p, zones) and (root / p).is_file()
    ]
    marked, unmarked = [], []
    scanned = 0
    for rel in code_files:
        fp = root / rel
        try:
            if fp.stat().st_size > MAX_SCAN_BYTES:
                continue
            raw = fp.read_bytes()
            if b"\x00" in raw[:8192]:  # binary, regardless of extension
                continue
            text = raw.decode("utf-8", errors="ignore")
        except OSError:
            continue
        scanned += 1
        (marked if has_marker(text) else unmarked).append(rel)
    inventory = "changed-files" if changed is not None else "zone-inventory (degraded — includes unchanged files)"
    report.facts["vi2_marker_coverage"] = {
        "changed_code_files": scanned,
        "inventory": inventory,
        "with_marker": len(marked),
        "without_marker": unmarked,
    }
    report.add(
        "info", "VI-2",
        f"CODE-1 marker facts ({inventory}): {len(marked)}/{scanned} code files carry a marker"
        + (f"; without marker: {', '.join(unmarked[:20])}" if unmarked else "")
        + " — grading (meaningful vs trivial, CODE-2) is the LLM pass's job",
    )


def find_evidence_tables(implement_dir: Path) -> list[tuple[Path, list[dict]]]:
    """Find ALL markdown tables whose header includes test_file + technique columns.

    A file may hold several evidence tables (e.g. one per test file or per slice);
    every one of them counts toward existence and US-coverage checks.
    """
    tables = []
    if not implement_dir.is_dir():
        return tables
    for md in sorted(implement_dir.rglob("*.md")):
        try:
            lines = md.read_text(encoding="utf-8", errors="ignore").splitlines()
        except OSError:
            continue
        idx = 0
        while idx < len(lines):
            line = lines[idx]
            if "|" not in line:
                idx += 1
                continue
            header = [c.strip().lower() for c in line.strip().strip("|").split("|")]
            if not (
                any("test_file" in c or "test file" in c for c in header)
                and any("technique" in c for c in header)
            ):
                idx += 1
                continue
            col_file = next(n for n, c in enumerate(header) if "test_file" in c or "test file" in c)
            col_ac = next(
                (n for n, c in enumerate(header)
                 if "ac" in c.split() or "ac/" in c or "/ac" in c or "requirement" in c or "acceptance" in c),
                None,
            )
            rows = []
            idx += 2  # skip header + separator
            while idx < len(lines) and "|" in lines[idx]:
                cells = [c.strip() for c in lines[idx].strip().strip("|").split("|")]
                idx += 1
                if len(cells) <= col_file or set("".join(cells)) <= {"-", ":", " "}:
                    continue
                rows.append({
                    "test_file": cells[col_file].strip("`"),
                    "ac": cells[col_ac] if col_ac is not None and len(cells) > col_ac else "",
                })
            if rows:
                tables.append((md, rows))
    return tables


def check_vi3(report: Report, delta: dict, changed: list[str] | None,
              implement_dir: Path | None, us_ids: list[str], zones: list[str],
              root: Path) -> None:
    # Trigger scoped by code_ownership_zones: a test file changed by ANOTHER task
    # group sharing the working tree must not force an evidence table on THIS one
    # (the multi-feature-commit case). With no zones declared there is no scoping.
    declared_delta = bool(delta["add"] or delta["modify"])
    heuristic_trigger = changed is not None and any(
        is_testish(p) and in_zones(p, zones) for p in changed
    )
    ships_tests = declared_delta or heuristic_trigger
    if delta["no_test_delta"] and not ships_tests:
        report.add("info", "VI-3", "no test delta declared and none detected — evidence table not required")
        return
    if not ships_tests and not delta["no_test_delta"]:
        # Nothing declared parseable and nothing test-like changed in-zone: VI-1
        # already warned about unverifiable targets; demanding a table here would
        # be a false positive.
        report.add("info", "VI-3", "no test delta detected for this task group — evidence table not required")
        return
    if implement_dir is None:
        report.add("warn", "VI-3", "Implement output folder not resolvable — pass --implement-dir to enable the CODE-3a evidence-table check")
        return
    tables = find_evidence_tables(implement_dir)
    if not tables:
        if declared_delta:
            # The plan itself declares tests ship — the missing table is a provable
            # CODE-3a violation.
            report.add(
                "blocker", "VI-3",
                f"a test delta ships but no technique-evidence table (CODE-3a) was found under {implement_dir} — "
                "emit the table (test_file → test_case → AC → technique → observable_assertion) in the Implement output folder",
            )
        else:
            # Heuristic-only trigger (TESTISH name-convention match, possibly
            # zone-less): ambiguous — the changed test files may belong to another
            # task group or be incidental churn. Ambiguity is never a blocker.
            report.add(
                "warn", "VI-3",
                "test-like files changed but no technique-evidence table (CODE-3a) was found — "
                "if these tests belong to this task group, emit the table; if they belong to "
                "another task group or are incidental, record that in the active validate file",
            )
        return
    # Relevance: the Implement folder accumulates tables from every task group.
    # A table counts for THIS task group when it references a declared delta path
    # or a file inside this group's zones; otherwise this group's tests would pass
    # on another group's evidence (false negative) and US coverage would be
    # computed against the wrong table.
    declared_set = set(delta["add"]) | set(delta["modify"])

    def relevant(rows: list[dict]) -> bool:
        for row in rows:
            tf = norm_path(row["test_file"])
            if tf in declared_set or (zones and in_zones(tf, zones)):
                return True
        return False

    relevant_tables = [(md, rows) for md, rows in tables if relevant(rows)]
    if not relevant_tables:
        report.add(
            "warn", "VI-3",
            "technique-evidence tables exist but none reference this task group's declared test files "
            "or code_ownership_zones — ensure the CODE-3a table for THIS task group was emitted",
        )
    use_tables = relevant_tables or tables
    referenced_files: set[str] = set()
    ac_text = ""
    for md, rows in use_tables:
        for row in rows:
            tf = norm_path(row["test_file"])
            if tf and tf.upper() not in {"N/A", "-"}:
                referenced_files.add(tf)
            ac_text += " " + row["ac"]
    missing = sorted(tf for tf in referenced_files if not (root / tf).is_file())
    # A ghost reference in THIS task group's own table is provable fabrication →
    # blocker. In the fallback case (no table matched this group) the ghost lives
    # in some OTHER group's table — a fact about that group, not this run → warn.
    ghost_severity = "blocker" if relevant_tables else "warn"
    for tf in missing:
        report.add(
            ghost_severity, "VI-3",
            f"technique-evidence table references a test file that does not exist: {tf} — evidence is fabricated or stale"
            + ("" if relevant_tables else " (found only in another task group's table — flag it there)"),
        )
    covered = set(US_ID_RE.findall(ac_text))
    uncovered = [u for u in us_ids if u not in covered]
    if uncovered:
        report.add(
            "warn", "VI-3",
            f"task-group user stories not referenced in any evidence-table AC column: {', '.join(uncovered)}",
        )
    report.facts["vi3_evidence"] = {
        "tables": [str(md) for md, _ in tables],
        "relevant_tables": [str(md) for md, _ in relevant_tables],
        "referenced_test_files": sorted(referenced_files),
        "us_covered": sorted(covered & set(us_ids)),
        "us_uncovered": uncovered,
    }


def check_vi4(report: Report, validate_file: Path) -> None:
    if not validate_file.is_file():
        report.add("warn", "VI-4", f"active validate file not found: {validate_file}")
        return
    text = validate_file.read_text(encoding="utf-8", errors="ignore")
    # A line offering BOTH values (`clean` | `issues-found`) is template/quoted
    # text, not a recorded conclusion — skipping it prevents a trailing template
    # line from overriding an honest `issues-found`.
    conclusions = []
    for cm in re.finditer(r"latest conclusion:([^\n]*)", text, re.IGNORECASE):
        vals = {v.lower() for v in re.findall(r"(clean|issues-found)", cm.group(1), re.IGNORECASE)}
        if len(vals) == 1:
            conclusions.append(vals.pop())
    blocker_m = re.findall(r"^\s*-\s*blocker:\s*(\d+)", text, re.MULTILINE | re.IGNORECASE)
    conclusion = conclusions[-1] if conclusions else None
    declared_blockers = int(blocker_m[-1]) if blocker_m else None
    finding_rows = len(re.findall(r"^\|\s*(?:[✗x]\s*)?blocker\s*\|", text, re.MULTILINE | re.IGNORECASE))
    report.facts["vi4_validate_file"] = {
        "file": str(validate_file), "conclusion": conclusion,
        "declared_blockers": declared_blockers, "blocker_finding_rows": finding_rows,
    }
    if conclusion == "clean" and ((declared_blockers or 0) > 0 or finding_rows > 0):
        report.add(
            "blocker", "VI-4",
            f"{validate_file.name} concludes `clean` while declaring blocker={declared_blockers} "
            f"and listing {finding_rows} blocker finding row(s) — the conclusion is falsified by the file itself",
        )
    if conclusion is None:
        report.add("warn", "VI-4", f"{validate_file.name} has no parseable `latest conclusion:` line (VAL-1)")


def check_vi5(report: Report, commands: list[str], root: Path, timeout: int) -> None:
    if not commands:
        report.add("info", "VI-5", "no runnable validation commands declared in the plan (only the validate-implementation meta-commands)")
        return
    results = []
    for cmd in commands:
        print(f"VI-5 running: {cmd}", flush=True)
        start = time.monotonic()
        try:
            proc = subprocess.run(
                cmd, shell=True, cwd=root, capture_output=True, text=True, timeout=timeout
            )
            duration = round(time.monotonic() - start, 1)
            tail = (proc.stdout + proc.stderr)[-2000:]
            results.append({"cmd": cmd, "exit": proc.returncode, "seconds": duration, "tail": tail})
            if proc.returncode in (127, 9009):
                # Shell "command not found" (127 POSIX, 9009 Windows): the line is
                # prose or the tool is not installed — that is UNVERIFIABLE, not a
                # proven failure. Blocking here would false-positive on plans that
                # note task-specific checks in prose form.
                report.add(
                    "warn", "VI-5",
                    f"validation command is not runnable here (exit {proc.returncode}): {cmd} — "
                    "install the tool or rewrite the plan line as a runnable command; recorded as unverified",
                )
            elif proc.returncode != 0:
                report.add("blocker", "VI-5", f"validation command failed (exit {proc.returncode}): {cmd}")
            else:
                report.add("info", "VI-5", f"validation command passed in {duration}s: {cmd}")
        except subprocess.TimeoutExpired:
            results.append({"cmd": cmd, "exit": None, "seconds": timeout, "tail": "TIMEOUT"})
            report.add("blocker", "VI-5", f"validation command timed out after {timeout}s: {cmd}")
    report.facts["vi5_runs"] = results


# ---------------------------------------------------------------------- main

def resolve_implement_dir(plan_path: Path, explicit: str | None) -> Path | None:
    if explicit:
        return Path(explicit)
    # docs/sprint-vX/planning/implementation-plan-vX.md → docs/sprint-vX/implementation
    candidate = plan_path.parent.parent / "implementation"
    return candidate if candidate.is_dir() else None


def main() -> int:
    parser = argparse.ArgumentParser(
        description="Deterministic evidence checks for `validate implementation` (VI-1..VI-5)."
    )
    parser.add_argument("--plan", required=True, help="Path to the approved implementation plan markdown")
    parser.add_argument("--task-group", required=True, help="Task group id, e.g. 1.1 or 2.3")
    parser.add_argument("--repo-root", default=".", help="Repository root (default: cwd)")
    parser.add_argument("--diff-base", default="HEAD", help="Git diff base for the change set (default: HEAD)")
    parser.add_argument("--implement-dir", help="Implement output folder holding CODE-3a evidence tables (default: <plan>/../implementation)")
    parser.add_argument("--validate-file", help="Active validate file to consistency-check (VI-4)")
    parser.add_argument("--run", action="store_true", help="Execute the plan's `validation commands to run` (VI-5)")
    parser.add_argument("--run-timeout", type=int, default=900, help="Per-command timeout in seconds for --run (default 900)")
    parser.add_argument("--baseline", help="Baseline manifest JSON for no-git change detection")
    parser.add_argument("--write-baseline", help="Write a baseline manifest JSON (scoped to code_ownership_zones) and exit")
    parser.add_argument("--json", dest="json_out", help="Write the evidence JSON to this path")
    args = parser.parse_args()

    root = Path(args.repo_root).resolve()
    plan_path = Path(args.plan)
    if not plan_path.is_file():
        print(f"plan file not found: {plan_path}", file=sys.stderr)
        return 2
    section = extract_task_group_section(plan_path.read_text(encoding="utf-8"), args.task_group)
    if section is None:
        print(f"task group {args.task_group!r} not found in {plan_path}", file=sys.stderr)
        return 2

    zones = parse_zones(section)

    if args.write_baseline:
        # Full-repo (ignore dirs only), NOT zone-scoped — see baseline_change_set.
        manifest = snapshot_manifest(root, [])
        Path(args.write_baseline).write_text(json.dumps(manifest, indent=0), encoding="utf-8")
        print(f"baseline written: {args.write_baseline} ({len(manifest)} files)")
        return 0

    report = Report()
    changed: list[str] | None = None
    resolved = git_change_set(root, args.diff_base)
    if resolved is not None:
        changed, meta = resolved
    elif args.baseline and Path(args.baseline).is_file():
        changed, meta = baseline_change_set(root, Path(args.baseline))
    else:
        meta = {"source": "none"}
        report.degraded = True
        report.add(
            "warn", "VI-0",
            "no usable change set (missing git repo, unborn HEAD, bad --diff-base, or no --baseline manifest) — "
            "running DEGRADED existence-only checks; record this degradation in the active validate file",
        )
    report.facts["change_set"] = {"meta": meta, "files": changed if changed is not None else "unknown"}
    report.facts["task_group"] = args.task_group
    report.facts["degraded"] = report.degraded

    delta = parse_test_delta(section)
    us_ids = parse_user_stories(section)
    diff_label = meta.get("diff_base") or meta["source"]
    check_vi1(report, delta, changed, root, diff_label)
    check_vi2(report, changed, zones, root)
    check_vi3(report, delta, changed, resolve_implement_dir(plan_path, args.implement_dir), us_ids, zones, root)
    if args.validate_file:
        check_vi4(report, Path(args.validate_file))
    if args.run:
        check_vi5(report, parse_validation_commands(section), root, args.run_timeout)

    icons = {"blocker": "✗", "warn": "⚠", "info": "ℹ"}
    print(f"\nvalidate_implementation — task group {args.task_group} — source: {meta['source']}"
          + (" (DEGRADED)" if report.degraded else ""))
    print("━" * 60)
    for f in sorted(report.findings, key=lambda f: {"blocker": 0, "warn": 1, "info": 2}[f.severity]):
        print(f"{icons[f.severity]} {f.severity} [{f.rule}]: {f.message}")
    print(f"\nblocker: {report.blockers} | warn: {sum(1 for f in report.findings if f.severity == 'warn')} "
          f"| info: {sum(1 for f in report.findings if f.severity == 'info')}")

    if args.json_out:
        payload = {
            "findings": [f.__dict__ for f in report.findings],
            "facts": report.facts,
            "blockers": report.blockers,
        }
        Path(args.json_out).write_text(json.dumps(payload, indent=2, ensure_ascii=False), encoding="utf-8")
        print(f"evidence JSON: {args.json_out}")

    return 1 if report.blockers else 0


if __name__ == "__main__":
    sys.exit(main())
