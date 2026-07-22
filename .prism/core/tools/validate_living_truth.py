#!/usr/bin/env python3
"""validate_living_truth.py — post-merge Living Truth contract checks.

Validates generated Living Truth markdown after sprint seal:
  - Markdown comment hygiene (no nested/stray HTML comment markers).
  - Frontmatter approval metadata for sealed truth files.
  - Anchor parseability and duplicate IDs.
  - Optional sprint snapshot byte parity.
  - Optional proposal-vs-living block parity for approved sealed proposals.
  - Lightweight content hygiene warnings for awkward generated prose patterns.
  - LTV-COV: every Must FR is traced in the ARCH-OVERVIEW-001 traceability map (ARCH-1).
  - LTV-SHRINK: an ARCH-OVERVIEW-001 regeneration does not silently drop a still-live
    traceability row (catches full-regen content loss; cross-phase removals are exempt).
  - LTV-DESIGN-COV: every Must FR is traced in the DESIGN-OVERVIEW-001 Design-to-FR map (DESIGN-1).
  - LTV-PKGIDX: every architecture companion doc that has anchored content is listed in the
    ARCH-OVERVIEW-001 §2 Package Index (the AI-authored manifest cannot silently omit one).
"""

from __future__ import annotations

import argparse
import re
import sys
from dataclasses import dataclass
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))
from apply_proposal import (  # noqa: E402
    EPIC_TAG_RE,
    EPIC_FILE_RE,
    US_TAG_RE,
    derive_lt_for_anchor,
    discover_existing_epic_slugs,
    discover_us_to_epic,
    extract_routing_tag,
    extract_title_from_block,
    parse_anchored_blocks,
    parse_frontmatter,
    slug_from_title,
    split_anchor_id,
    split_proposal_sections,
)
from precommit_living_truth import (  # noqa: E402
    LIVING_TRUTH_FILES,
)


STRICT_ID_RE = re.compile(r"^[A-Z]+(?:-[A-Z]+)*-\d{3,}$")
PLACEHOLDER_ANCHOR_RE = re.compile(r"<!--\s*ID:\s*[A-Z]+(?:-[A-Z]+)*-(?:NNN|XXX)\s*-->")
H2_RE = re.compile(r"^##\s+")
H3_RE = re.compile(r"^###\s+")
BOLD_NAME_RE = re.compile(r"^\*\*[A-Z]+(?:-[A-Z]+)*-\d{3,}\b")
INLINE_ASSUMPTION_RE = re.compile(
    r"^>\s*Assumption:\s*.+\s+/\s*Validate:\s*.+\s+/\s*Change trigger:\s*.+",
    re.IGNORECASE,
)
MERGEABLE_DELTA_FILENAME_RE = re.compile(
    r"^(product|design|architecture|testing)-delta-.+\.md$"
)


@dataclass(frozen=True)
class Finding:
    level: str  # "blocker" | "warn"
    rule: str
    path: str
    message: str


def candidate_pack_mergeable_deltas(pack_dir: Path) -> list[Path]:
    """Return only Living-Truth mergeable deltas from one candidate pack.

    Plan absorption documents deliberately use ``plan-delta-*`` naming but are
    sprint-scoped work-process artifacts. They are validated by the Plan gate,
    never by proposal structure or Living Truth composition.
    """
    return sorted(
        path
        for path in pack_dir.iterdir()
        if path.is_file() and MERGEABLE_DELTA_FILENAME_RE.match(path.name)
    )


def _rel(path: Path, root: Path) -> str:
    try:
        return path.relative_to(root).as_posix()
    except ValueError:
        return path.as_posix()


def _line_no(text: str, offset: int) -> int:
    return text.count("\n", 0, offset) + 1


def check_html_comment_hygiene(text: str, path: Path, root: Path) -> list[Finding]:
    """Detect raw nested comments and stray close markers.

    Markdown preview engines treat HTML comments as non-nesting. A literal
    ``<!-- ID: ... -->`` inside a larger comment closes the comment early and
    leaks the remaining tool instruction as visible page text.
    """
    out: list[Finding] = []
    pos = 0
    while pos < len(text):
        start = text.find("<!--", pos)
        close = text.find("-->", pos)
        if close != -1 and (start == -1 or close < start):
            line_start = text.rfind("\n", 0, close) + 1
            line_end = text.find("\n", close)
            if line_end == -1:
                line_end = len(text)
            # Mermaid and sequence diagrams commonly use arrows such as `A --> B`.
            # Treat only a standalone close marker as a likely Markdown leak.
            if text[line_start:line_end].strip() != "-->":
                pos = close + 3
                continue
            out.append(
                Finding(
                    "blocker",
                    "LTV-HTML",
                    _rel(path, root),
                    f"stray HTML comment close marker at line {_line_no(text, close)}",
                )
            )
            pos = close + 3
            continue
        if start == -1:
            break
        close = text.find("-->", start + 4)
        if close == -1:
            out.append(
                Finding(
                    "blocker",
                    "LTV-HTML",
                    _rel(path, root),
                    f"unclosed HTML comment starting at line {_line_no(text, start)}",
                )
            )
            break
        inner = text[start + 4 : close]
        nested = inner.find("<!--")
        if nested != -1:
            out.append(
                Finding(
                    "blocker",
                    "LTV-HTML",
                    _rel(path, root),
                    "raw nested HTML comment marker inside comment at "
                    f"line {_line_no(text, start + 4 + nested)}; escape literal examples "
                    "as &lt;!-- ... --&gt;",
                )
            )
        pos = close + 3
    return out


def check_frontmatter(
    text: str,
    path: Path,
    root: Path,
    *,
    sealed: bool,
    sprint_n: int | None = None,
) -> list[Finding]:
    out: list[Finding] = []
    rel = _rel(path, root)
    try:
        fm, _body = parse_frontmatter(text)
    except ValueError as e:
        return [Finding("blocker", "LTV-FM", rel, str(e))]
    if not fm:
        return [Finding("blocker", "LTV-FM", rel, "missing YAML frontmatter")]
    required_keys = ["status", "version", "sprint", "phase", "sprint_id", "created", "updated", "approved_by"] if sealed else ["status", "approved_by"]
    for key in required_keys:
        if key not in fm:
            out.append(Finding("blocker" if sealed else "warn", "LTV-FM", rel, f"frontmatter missing {key}"))
    if sealed:
        status = str(fm.get("status", "")).upper()
        if status not in ("APPROVED", "REMOVED"):
            out.append(Finding("blocker", "LTV-FM", rel, f"sealed Living Truth status must be APPROVED or REMOVED, got {status!r}"))
        for key in ("version", "sprint", "phase", "sprint_id", "created", "updated", "approved_by"):
            if str(fm.get(key, "") or "").strip() == "":
                out.append(Finding("blocker", "LTV-FM", rel, f"sealed Living Truth {key} is empty"))
        try:
            fm_sprint = int(str(fm.get("sprint", "")))
        except ValueError:
            out.append(Finding("blocker", "LTV-FM", rel, f"sprint must be an integer, got {fm.get('sprint')!r}"))
            fm_sprint = None
        if fm_sprint is not None:
            if str(fm.get("version", "")) != f"v{fm_sprint}":
                out.append(Finding("blocker", "LTV-FM", rel, f"version must match sprint v{fm_sprint}, got {fm.get('version')!r}"))
            if str(fm.get("sprint_id", "")) != f"sprint-v{fm_sprint}":
                out.append(Finding("blocker", "LTV-FM", rel, f"sprint_id must match sprint-v{fm_sprint}, got {fm.get('sprint_id')!r}"))
            if sprint_n is not None and fm_sprint > sprint_n:
                out.append(Finding("blocker", "LTV-FM", rel, f"sprint must be <= sealed sprint {sprint_n}, got {fm.get('sprint')!r}"))
        expected_phase = expected_phase_for_path(path, root)
        if expected_phase and str(fm.get("phase", "")) != expected_phase:
            out.append(Finding("blocker", "LTV-FM", rel, f"phase must be {expected_phase!r}, got {fm.get('phase')!r}"))
    return out


def expected_phase_for_path(path: Path, root: Path) -> str:
    try:
        rel = path.relative_to(root / "docs").as_posix()
    except ValueError:
        return ""
    if rel.startswith("product/"):
        return "product"
    if rel.startswith("design/"):
        return "design"
    if rel.startswith("architecture/"):
        return "architecture"
    if rel.startswith("testing/"):
        return "testing"
    return ""


def check_anchors(text: str, path: Path, root: Path) -> list[Finding]:
    out: list[Finding] = []
    rel = _rel(path, root)
    if PLACEHOLDER_ANCHOR_RE.search(text):
        out.append(Finding("blocker", "LTV-ANCHOR", rel, "placeholder anchor ID leaked into Living Truth"))

    _preamble, blocks = parse_anchored_blocks(text)
    seen: set[str] = set()
    for aid, lines in blocks:
        if aid in seen:
            out.append(Finding("blocker", "LTV-ANCHOR", rel, f"duplicate anchor {aid}"))
        seen.add(aid)
        if not STRICT_ID_RE.match(aid):
            out.append(Finding("blocker", "LTV-ANCHOR", rel, f"anchor {aid} is not strict PREFIX-NNN format"))
        title_line = ""
        for line in lines[1:6]:
            s = line.strip()
            if not s or s.startswith("<!--"):
                continue
            title_line = s
            break
        if not title_line:
            out.append(Finding("blocker", "LTV-ANCHOR", rel, f"{aid} has no heading/bold title line after anchor"))
        elif not (H3_RE.match(title_line) or BOLD_NAME_RE.match(title_line)):
            out.append(Finding("blocker", "LTV-ANCHOR", rel, f"{aid} title line is not an H3 or bold ID label: {title_line!r}"))
        for line in lines[1:]:
            stripped = line.strip()
            if H2_RE.match(stripped):
                out.append(
                    Finding(
                        "blocker",
                        "LTV-STRUCT",
                        rel,
                        f"{aid} contains unanchored H2 section {stripped!r}; split it into its own anchored block or move it before the first anchor",
                    )
                )
    return out


def check_content_hygiene(text: str, path: Path, root: Path, *, strict_content: bool) -> list[Finding]:
    out: list[Finding] = []
    level = "blocker" if strict_content else "warn"
    for idx, line in enumerate(text.splitlines(), start=1):
        if INLINE_ASSUMPTION_RE.match(line):
            out.append(
                Finding(
                    level,
                    "LTV-CONTENT",
                    _rel(path, root),
                    f"line {idx}: inline Assumption/Validate/Change trigger block is hard to read; use a small table or bullets",
                )
            )
    return out


ARCH_LT_REL = ("docs", "architecture", "architecture.md")
ARCH_OVERVIEW_ID = "ARCH-OVERVIEW-001"
DESIGN_LT_REL = ("docs", "design", "design-system.md")
DESIGN_OVERVIEW_ID = "DESIGN-OVERVIEW-001"
# Architecture companion LT docs enumerated by the ARCH-OVERVIEW-001 §2 Package Index.
ARCH_COMPANION_BASENAMES = (
    "project-reference.md", "erd.md", "api-specs.md", "sequence.md",
    "nfr.md", "adr.md", "data-flow.md", "events.md",
)
FR_REF_RE = re.compile(r"\bFR-\d{3,}\b")
TABLE_ROW_RE = re.compile(r"^\s*\|.*\|\s*$")
MUST_WORD_RE = re.compile(r"\bMust\b", re.IGNORECASE)
STABLE_ID_REF_RE = re.compile(r"\b[A-Z]+(?:-[A-Z]+)*-\d{3,}\b")
# FR priority lives in the epic Product Traceability Map row ("| ... | FR-013 | ... | Must / covered |")
# — and, as a fallback, on an FR block carrying an explicit `**Priority**: Must`.
PRIORITY_MUST_RE = re.compile(r"\*\*Priority\*\*\s*:?[^\n]*\bMust\b", re.IGNORECASE)
# Explicit author marker, placed INSIDE the `*-OVERVIEW-001` block, declaring that this phase
# intentionally carries NO FR-level traceability (e.g. Design-N/A — a backend slice or reflected
# scope with no UI). ONLY this explicit marker lets the coverage gate pass with zero FR refs; an
# empty/unfilled map without it is a real coverage gap (a Must FR present but untraced). Tường
# minh on purpose: a deliberate, auditable opt-out, never a silent pass. Format:
#   <!-- COVERAGE: N/A — <reason> -->
COVERAGE_NA_RE = re.compile(r"<!--\s*COVERAGE:\s*N/A\b", re.IGNORECASE)


def collect_must_frs(epic_text: str) -> set[str]:
    """Must-priority FR IDs declared in one epic: Product Traceability Map rows tagged Must
    (primary, matches epic-template schema), plus FR blocks with `**Priority**: Must` (fallback)."""
    must: set[str] = set()
    for line in epic_text.split("\n"):
        if TABLE_ROW_RE.match(line) and MUST_WORD_RE.search(line):
            must.update(FR_REF_RE.findall(line))
    try:
        _pre, blocks = parse_anchored_blocks(epic_text)
    except Exception:
        blocks = []
    for aid, block_lines in blocks:
        if aid.rsplit("-", 1)[0] == "FR" and PRIORITY_MUST_RE.search("\n".join(block_lines)):
            must.add(aid)
    return must


def _resolve_text(path: Path, texts_by_path: dict[Path, str]) -> str | None:
    """Prefer the in-memory merged overlay; fall back to on-disk content."""
    if path in texts_by_path:
        return texts_by_path[path]
    if path.is_file():
        try:
            return path.read_text(encoding="utf-8")
        except OSError:
            return None
    return None


def _check_overview_fr_coverage(
    texts_by_path: dict[Path, str],
    project_root: Path,
    *,
    lt_rel: tuple[str, ...],
    overview_id: str,
    rule: str,
    map_label: str,
) -> list[Finding]:
    """Generic backstop: every Must-priority FR in the product epics must be traced in the
    given `*-OVERVIEW-001` traceability map. Powers LTV-COV (Architecture Traceability Map)
    and LTV-DESIGN-COV (Design-to-FR map).

    `texts_by_path` is the merged overlay — at seal it is the in-memory merged Living Truth
    (only files this sprint touches); files absent from it fall back to disk so the check
    reflects the post-merge state. This closes the gap where new FRs merge but the AI-authored
    map (which can only live inside the anchored overview block) is never refreshed, leaving the
    requirement silently untraced.

    An overview with ZERO FR refs is a coverage gap (every Must FR is untraced) UNLESS it carries
    the explicit `<!-- COVERAGE: N/A -->` marker declaring this phase intentionally does no
    FR-level tracing (e.g. Design-N/A). The marker is the only way to pass with an empty map —
    an unfilled map no longer slips through silently (a deliberate, auditable opt-out)."""
    lt_path = project_root.joinpath(*lt_rel)
    lt_text = _resolve_text(lt_path, texts_by_path)
    if lt_text is None:
        return []  # no Living Truth for this phase yet
    try:
        _pre, blocks = parse_anchored_blocks(lt_text)
    except Exception:
        return []
    overview = next((lines for aid, lines in blocks if aid == overview_id), None)
    if overview is None:
        return []  # overview not authored yet — anchor/bootstrap checks cover that
    overview_text = "\n".join(overview)
    covered = set(FR_REF_RE.findall(overview_text))
    if not covered and COVERAGE_NA_RE.search(overview_text):
        return []  # explicitly declared no FR-level tracing (e.g. Design-N/A) — intentional
    # else: a populated map is checked per-FR below; an empty map WITHOUT the N/A marker now flags
    # every Must FR as untraced (an unfilled map is a coverage gap, not a silent pass).

    epic_paths: set[Path] = set()
    epics_dir = project_root / "docs" / "product" / "epics"
    if epics_dir.is_dir():
        epic_paths.update(p for p in epics_dir.iterdir() if p.is_file() and EPIC_FILE_RE.match(p.name))
    epic_paths.update(p for p in texts_by_path if EPIC_FILE_RE.match(p.name))

    findings: list[Finding] = []
    for epic_path in sorted(epic_paths, key=lambda p: p.name):
        text = _resolve_text(epic_path, texts_by_path)
        if text is None:
            continue
        for fr in sorted(collect_must_frs(text)):
            if fr not in covered:
                findings.append(Finding(
                    "blocker", rule, _rel(lt_path, project_root),
                    f"Must FR {fr} ({epic_path.name}) is not traced in the {overview_id} "
                    f"{map_label}; re-author the map via "
                    f"`## Updated {overview_id}` so it covers the new requirement",
                ))
    return findings


def check_arch_traceability_coverage(
    texts_by_path: dict[Path, str], project_root: Path
) -> list[Finding]:
    """LTV-COV (ARCH-1): every Must FR is traced in the `ARCH-OVERVIEW-001` Architecture
    Traceability Map. See `_check_overview_fr_coverage`."""
    return _check_overview_fr_coverage(
        texts_by_path, project_root,
        lt_rel=ARCH_LT_REL, overview_id=ARCH_OVERVIEW_ID,
        rule="LTV-COV", map_label="Architecture Traceability Map (ARCH-1)",
    )


def check_design_traceability_coverage(
    texts_by_path: dict[Path, str], project_root: Path
) -> list[Finding]:
    """LTV-DESIGN-COV (DESIGN-1): every Must FR is traced in the `DESIGN-OVERVIEW-001`
    Design-to-FR Traceability map. Mirror of LTV-COV for the design phase — the AI authors the
    map inside the design overview singleton; this fails the seal if a Must FR is silently
    missing."""
    return _check_overview_fr_coverage(
        texts_by_path, project_root,
        lt_rel=DESIGN_LT_REL, overview_id=DESIGN_OVERVIEW_ID,
        rule="LTV-DESIGN-COV", map_label="Design-to-FR Traceability map (DESIGN-1)",
    )


def _overview_block(text: str, anchor_id: str) -> list[str] | None:
    try:
        _pre, blocks = parse_anchored_blocks(text)
    except Exception:
        return None
    for aid, lines in blocks:
        if aid == anchor_id:
            return lines
    return None


def _table_ids(block_lines: list[str]) -> set[str]:
    """Stable IDs referenced in markdown table rows (coverage/traceability rows)."""
    ids: set[str] = set()
    for line in block_lines:
        if TABLE_ROW_RE.match(line):
            ids.update(STABLE_ID_REF_RE.findall(line))
    return ids


def _all_anchor_ids(texts_by_path: dict[Path, str], project_root: Path) -> set[str]:
    """Every anchor ID present in the effective truth (merged overlay ∪ on-disk Living Truth)."""
    ids: set[str] = set()
    for path in set(living_paths(project_root)) | set(texts_by_path):
        text = texts_by_path.get(path)
        if text is None and path.is_file():
            try:
                text = path.read_text(encoding="utf-8")
            except OSError:
                text = None
        if text is None:
            continue
        try:
            _pre, blocks = parse_anchored_blocks(text)
        except Exception:
            continue
        ids.update(aid for aid, _ in blocks)
    return ids


def check_arch_overview_no_shrink(
    texts_by_path: dict[Path, str], project_root: Path
) -> list[Finding]:
    """LTV-SHRINK: a `## Updated ARCH-OVERVIEW-001` fully regenerates the singleton, so the
    merge replaces the whole block. Catch a regeneration that silently DROPS a traceability-
    table row whose ID is still a live item — i.e. lost coverage that is not an intentional
    removal. Compares the new (merged overlay) overview against the current on-disk overview;
    a dropped ID is flagged only if it still resolves to a live anchor in the effective truth
    (so legitimate cross-phase removals are not false-flagged). Runs at approve (--effective)
    and seal."""
    arch_path = project_root.joinpath(*ARCH_LT_REL)
    on_disk = arch_path.read_text(encoding="utf-8") if arch_path.is_file() else None
    new_text = texts_by_path.get(arch_path, on_disk)
    if new_text is None or on_disk is None:
        return []
    new_ov = _overview_block(new_text, ARCH_OVERVIEW_ID)
    old_ov = _overview_block(on_disk, ARCH_OVERVIEW_ID)
    if new_ov is None or old_ov is None:
        return []  # no prior version (v1 `## New`) — nothing to compare
    dropped = (_table_ids(old_ov) - _table_ids(new_ov)) - {ARCH_OVERVIEW_ID}
    if not dropped:
        return []
    live = _all_anchor_ids(texts_by_path, project_root)
    return [
        Finding(
            "blocker", "LTV-SHRINK", _rel(arch_path, project_root),
            f"{aid} was dropped from the {ARCH_OVERVIEW_ID} traceability map by the regenerated "
            f"`## Updated` block but is still a live item — re-add its row, or remove the item "
            f"itself via `## Removed` if it is genuinely retired",
        )
        for aid in sorted(dropped)
        if aid in live
    ]


def check_arch_package_index_completeness(
    texts_by_path: dict[Path, str], project_root: Path
) -> list[Finding]:
    """LTV-PKGIDX: the `ARCH-OVERVIEW-001` §2 Package Index is an AI-authored manifest of the
    architecture companion docs. Fail if a companion Living Truth file that has anchored content
    is NOT referenced (by filename) anywhere in the overview block — so the manifest cannot
    silently omit a populated companion. The `≥1 anchored item` guard skips empty/skeleton
    companions (legitimately not yet listed). Runs at sprint seal."""
    arch_path = project_root.joinpath(*ARCH_LT_REL)
    arch_text = _resolve_text(arch_path, texts_by_path)
    if arch_text is None:
        return []
    overview = _overview_block(arch_text, ARCH_OVERVIEW_ID)
    if overview is None:
        return []  # overview not authored yet — anchor/bootstrap checks cover that
    overview_text = "\n".join(overview)
    findings: list[Finding] = []
    for base in ARCH_COMPANION_BASENAMES:
        comp_text = _resolve_text(project_root / "docs" / "architecture" / base, texts_by_path)
        if comp_text is None:
            continue
        try:
            _pre, blocks = parse_anchored_blocks(comp_text)
        except Exception:
            blocks = []
        if not blocks:
            continue  # no anchored content yet → not required in the manifest
        if base not in overview_text:
            findings.append(Finding(
                "blocker", "LTV-PKGIDX", _rel(arch_path, project_root),
                f"architecture companion `{base}` has anchored content but is not listed in the "
                f"{ARCH_OVERVIEW_ID} Package Index (§2); add its row via "
                f"`## Updated {ARCH_OVERVIEW_ID}`",
            ))
    return findings


# A relative `assets/<file>.<ext>` reference inside a Living Truth markdown file. The
# lookbehind rejects a `/assets/` that is part of a longer path (e.g. a stray
# `../sprint-v1/architecture/assets/x` reference) so only bare, file-local `assets/...`
# links are checked. `{` is outside the class, so unreplaced `{{PLACEHOLDER}}` template
# tokens never match. Requires a `.ext`, so bare `assets/` prose is ignored.
ASSET_REF_RE = re.compile(r"(?<![\w./-])assets/([A-Za-z0-9._/\-]+\.[A-Za-z0-9]+)")


def check_asset_references(
    texts_by_path: dict[Path, str],
    project_root: Path,
    *,
    sealed: bool = False,
) -> list[Finding]:
    """Flag Living Truth `assets/<file>` references whose target file does not exist.

    References resolve relative to the referencing markdown file's own directory (standard
    relative-link semantics): `docs/<phase>/<file>.md` → `docs/<phase>/assets/<file>`. A
    missing target is a blocker on a sealed project (a dangling diagram/image link that
    survived an asset removal or a typo) and a warning otherwise. This MUST run against the
    on-disk asset tree (post copy + removal), so it is invoked from `validate_project`, not
    from the in-memory pre-write `validate_living_texts` pass during seal.
    """
    out: list[Finding] = []
    level = "blocker" if sealed else "warn"
    for path, text in sorted(texts_by_path.items(), key=lambda kv: _rel(kv[0], project_root)):
        seen: set[Path] = set()
        for m in ASSET_REF_RE.finditer(text):
            rel_ref = m.group(1)
            target = path.parent / "assets" / rel_ref
            if target in seen:
                continue
            seen.add(target)
            if not target.is_file():
                out.append(
                    Finding(
                        level,
                        "LTV-ASSET",
                        _rel(path, project_root),
                        f"asset reference `assets/{rel_ref}` at line {_line_no(text, m.start())} "
                        f"has no file at {_rel(target, project_root)}",
                    )
                )
    return out


def check_cross_file_duplicate_ids(
    texts_by_path: dict[Path, str], project_root: Path
) -> list[Finding]:
    """LTV-DUP: an anchored ID must live in at most ONE Living Truth file.

    The per-file `check_anchors` LTV-ANCHOR pass only catches a duplicate within a single
    file. A brownfield reflect sprint that preserves code-marker IDs (e.g. `FR-002`) can
    leave `id_counters` behind the highest ID in Living Truth; if a later sprint's `get_next_id`
    then re-issues that number into a *different* file, the per-file pass would miss the
    collision. This cross-file pass hard-blocks any anchor present in two or more files so
    a desync surfaces at validate / seal time instead of silently corrupting the ID space.
    Seal also reconciles `id_counters` to prevent the desync in the first place; this is the
    defense-in-depth detector behind that."""
    out: list[Finding] = []
    id_to_files: dict[str, list[Path]] = {}
    for path, text in texts_by_path.items():
        _preamble, blocks = parse_anchored_blocks(text)
        for aid, _lines in blocks:
            bucket = id_to_files.setdefault(aid, [])
            if path not in bucket:
                bucket.append(path)
    for aid, paths in sorted(id_to_files.items()):
        if len(paths) > 1:
            locs = ", ".join(sorted(_rel(p, project_root) for p in paths))
            out.append(Finding(
                "blocker", "LTV-DUP", locs,
                f"anchor {aid} appears in {len(paths)} Living Truth files (IDs must be unique across the tree): {locs}",
            ))
    return out


def validate_living_texts(
    texts_by_path: dict[Path, str],
    project_root: Path,
    *,
    sealed: bool = False,
    strict_content: bool = False,
    sprint_n: int | None = None,
) -> list[Finding]:
    findings: list[Finding] = []
    for path, text in sorted(texts_by_path.items(), key=lambda kv: _rel(kv[0], project_root)):
        findings.extend(check_html_comment_hygiene(text, path, project_root))
        findings.extend(check_frontmatter(text, path, project_root, sealed=sealed, sprint_n=sprint_n))
        findings.extend(check_anchors(text, path, project_root))
        findings.extend(check_content_hygiene(text, path, project_root, strict_content=strict_content))
    findings.extend(check_arch_traceability_coverage(texts_by_path, project_root))
    findings.extend(check_arch_overview_no_shrink(texts_by_path, project_root))
    findings.extend(check_arch_package_index_completeness(texts_by_path, project_root))
    findings.extend(check_design_traceability_coverage(texts_by_path, project_root))
    findings.extend(check_cross_file_duplicate_ids(texts_by_path, project_root))
    return findings


def living_paths(project_root: Path) -> list[Path]:
    paths = [project_root / rel for rel in sorted(LIVING_TRUTH_FILES)]
    epics_dir = project_root / "docs" / "product" / "epics"
    if epics_dir.is_dir():
        paths.extend(sorted(p for p in epics_dir.iterdir() if p.is_file() and EPIC_FILE_RE.match(p.name)))
    return [p for p in paths if p.is_file()]


def validate_snapshot_parity(project_root: Path, sprint_n: int) -> list[Finding]:
    findings: list[Finding] = []
    snap_root = project_root / "docs" / f"sprint-v{sprint_n}" / "snapshots"
    if not snap_root.is_dir():
        return findings
    suffix = f"-at-v{sprint_n}-sealed.md"
    for snap in sorted(snap_root.rglob("*.md")):
        if not snap.name.endswith(suffix):
            continue
        rel = snap.relative_to(snap_root)
        living_name = snap.name[: -len(suffix)] + ".md"
        living = project_root / "docs" / rel.parent / living_name
        if not living.is_file():
            findings.append(Finding("blocker", "LTV-SNAPSHOT", _rel(snap, project_root), f"snapshot has no matching Living Truth file: {_rel(living, project_root)}"))
        elif snap.read_bytes() != living.read_bytes():
            findings.append(Finding("blocker", "LTV-SNAPSHOT", _rel(snap, project_root), f"snapshot bytes differ from {_rel(living, project_root)}"))
    return findings


def _sealed_proposals(project_root: Path, sprint_n: int) -> list[Path]:
    sprint_root = project_root / "docs" / f"sprint-v{sprint_n}"
    if not sprint_root.is_dir():
        return []
    proposals = sorted(sprint_root.glob("*/proposals/**/*.md"))
    from seal_sprint import change_pack_sprint  # noqa: E402

    deltas: list[tuple[tuple[int, int, int, str], Path]] = []
    changes = sprint_root / "changes"
    if changes.is_dir():
        for pack_dir in sorted(changes.iterdir()):
            if not pack_dir.is_dir():
                continue
            pack_match = re.match(r"^v(\d+)\.(\d+)\.(\d+)-(.+)$", pack_dir.name)
            if not pack_match:
                continue
            # Shared invariant: a pack id encodes its sprint; a pack misplaced under the wrong
            # sprint folder is skipped here too (seal blocks it; effective_truth skips it).
            if change_pack_sprint(pack_dir.name) != sprint_n:
                continue
            key = (
                int(pack_match.group(1)),
                int(pack_match.group(2)),
                int(pack_match.group(3)),
                pack_match.group(4),
            )
            for path in sorted(pack_dir.iterdir()):
                if re.match(r"^(product|design|architecture|testing)-delta-", path.name):
                    deltas.append((key, path))
    candidates = proposals + [path for _key, path in sorted(deltas, key=lambda item: item[0])]
    out: list[Path] = []
    for path in candidates:
        try:
            fm, _ = parse_frontmatter(path.read_text(encoding="utf-8"))
        except ValueError:
            continue
        if fm.get("status") == "APPROVED" and str(fm.get("applied_to_living", "")).lower().startswith("true"):
            out.append(path)
    return out


def validate_proposal_living_parity(project_root: Path, sprint_n: int) -> list[Finding]:
    findings: list[Finding] = []
    epic_slugs = discover_existing_epic_slugs(project_root)
    us_to_epic = discover_us_to_epic(project_root)
    living_block_cache: dict[Path, dict[str, list[str]]] = {}
    expected: dict[str, tuple[Path, list[str] | None, Path]] = {}

    def blocks_for(path: Path) -> dict[str, list[str]]:
        if path not in living_block_cache:
            _pre, blocks = parse_anchored_blocks(path.read_text(encoding="utf-8"))
            living_block_cache[path] = {aid: lines for aid, lines in blocks}
        return living_block_cache[path]

    for proposal in _sealed_proposals(project_root, sprint_n):
        text = proposal.read_text(encoding="utf-8")
        _fm, body = parse_frontmatter(text)
        sections = split_proposal_sections(body)
        for aid, lines in sections.get("New", []):
            try:
                prefix, _ = split_anchor_id(aid)
            except ValueError:
                continue
            if prefix == "EP" and aid not in epic_slugs:
                title = extract_title_from_block(lines)
                epic_slugs[aid] = slug_from_title(title) if title else "untitled"

        for section_name, items in sections.items():
            for aid, lines in items:
                epic_tag = extract_routing_tag(lines, EPIC_TAG_RE)
                us_tag = extract_routing_tag(lines, US_TAG_RE)
                target = derive_lt_for_anchor(
                    aid,
                    epic_tag,
                    project_root,
                    epic_slugs,
                    us_to_epic=us_to_epic,
                    us_tag=us_tag,
                )
                if target is None:
                    findings.append(Finding("blocker", "LTV-PARITY", _rel(proposal, project_root), f"{aid} cannot be routed to Living Truth"))
                    continue
                expected[aid] = (target, None if section_name == "Removed" else lines, proposal)

    for aid, (target, lines, source) in expected.items():
        if not target.is_file():
            findings.append(Finding("blocker", "LTV-PARITY", _rel(source, project_root), f"{aid} target missing: {_rel(target, project_root)}"))
            continue
        living_lines = blocks_for(target).get(aid)
        if lines is None:
            try:
                prefix, _ = split_anchor_id(aid)
            except ValueError:
                prefix = ""
            if prefix == "EP":
                try:
                    fm, _body = parse_frontmatter(target.read_text(encoding="utf-8"))
                except ValueError:
                    fm = {}
                if str(fm.get("status", "")).upper() == "REMOVED":
                    continue
            if living_lines is not None:
                findings.append(Finding("blocker", "LTV-PARITY", _rel(source, project_root), f"{aid} should have been removed from {_rel(target, project_root)}"))
            continue
        if living_lines is None:
            findings.append(Finding("blocker", "LTV-PARITY", _rel(source, project_root), f"{aid} missing from {_rel(target, project_root)}"))
        elif living_lines != lines:
            findings.append(Finding("blocker", "LTV-PARITY", _rel(source, project_root), f"{aid} block differs from {_rel(target, project_root)}"))
    return findings


def validate_project(
    project_root: Path,
    *,
    sprint_n: int | None = None,
    sealed: bool = False,
    strict_content: bool = False,
) -> list[Finding]:
    texts = {path: path.read_text(encoding="utf-8") for path in living_paths(project_root)}
    findings = validate_living_texts(
        texts,
        project_root,
        sealed=sealed,
        strict_content=strict_content,
        sprint_n=sprint_n,
    )
    # On-disk only: resolves `assets/...` links against the final synced asset tree.
    findings.extend(check_asset_references(texts, project_root, sealed=sealed))
    if sprint_n is not None:
        findings.extend(validate_snapshot_parity(project_root, sprint_n))
        findings.extend(validate_proposal_living_parity(project_root, sprint_n))
    return findings


def format_findings(findings: list[Finding]) -> str:
    if not findings:
        return "Living Truth validation passed."
    lines: list[str] = []
    for f in findings:
        lines.append(f"{f.level.upper()} [{f.rule}] {f.path}: {f.message}")
    return "\n".join(lines)


def main() -> int:
    parser = argparse.ArgumentParser(description="Validate PRISM Living Truth output after merge/seal.")
    parser.add_argument("--project-root", default=".", help="Project root containing docs/")
    parser.add_argument("--sprint", help="Sprint version for snapshot/proposal parity, e.g. v1")
    parser.add_argument("--sealed", action="store_true", help="Require sealed metadata: status APPROVED/REMOVED and non-empty approved_by")
    parser.add_argument("--strict-content", action="store_true", help="Treat content hygiene warnings as blockers")
    parser.add_argument(
        "--effective",
        action="store_true",
        help="Run LTV-COV on the pre-seal EFFECTIVE truth (living + this sprint's approved "
        "proposals) instead of on-disk Living Truth — for approve-time gates, so ARCH-1 "
        "coverage is enforced before seal. Use with --sprint v{X}. Pair with "
        "--candidate-phase to validate the approval candidate (the still-DRAFT proposal).",
    )
    parser.add_argument(
        "--candidate-phase",
        action="append",
        metavar="PHASE",
        choices=("architecture", "design"),
        help="With --effective, treat this phase's DRAFT proposals (scoped to the --sprint "
        "being approved) as the approval CANDIDATE when composing the effective truth, so the "
        "coverage check answers 'if I approve this DRAFT, does coverage hold?' rather than "
        "deadlocking on approved-only content (the gate runs while the proposal being "
        "approved is still DRAFT). Also selects which coverage runs: `approve arch` uses "
        "--candidate-phase architecture (LTV-COV + LTV-SHRINK); `approve design` uses "
        "--candidate-phase design (LTV-DESIGN-COV). Requires --sprint. Findings stay HARD "
        "blockers (this is the approval gate, not a lenient preview); change packs stay "
        "approved-only unless --candidate-pack names one.",
    )
    parser.add_argument(
        "--candidate-pack",
        metavar="PACK_ID",
        help="With --effective, treat this ONE change pack's DRAFT deltas (folder name, e.g. "
        "v2.1.0-fix) as the approval CANDIDATE — the `approve changes` twin of the base "
        "candidate, so coverage answers 'if I approve this pack, does it hold?' instead of "
        "deadlocking when the pack's still-DRAFT delta carries the only trace for a Must FR. "
        "REQUIRES --candidate-phase {architecture|design} (which coverage to run; without it "
        "the gate would default to architecture and skip a design pack) and --sprint (the "
        "pack's sprint). Scoped to the named pack AND that sprint: a different pack's, or a "
        "different sprint's, DRAFT deltas are never pulled in (per core/change-manager.md).",
    )
    args = parser.parse_args()

    sprint_n: int | None = None
    if args.sprint:
        m = re.fullmatch(r"v(\d+)", args.sprint)
        if not m:
            sys.stderr.write(f"ERROR: --sprint must be vN, got {args.sprint!r}\n")
            return 1
        sprint_n = int(m.group(1))

    root = Path(args.project_root).resolve()

    if args.effective:
        from effective_truth import compose_effective_state  # noqa: E402

        candidate_phases = tuple(dict.fromkeys(args.candidate_phase or ()))
        if args.candidate_pack and not candidate_phases:
            sys.stderr.write(
                "ERROR: --candidate-pack requires --candidate-phase {architecture|design} to "
                "name which coverage to validate; without it the gate silently defaults to "
                "architecture and would skip a design pack's coverage\n"
            )
            return 1
        if (candidate_phases or args.candidate_pack) and sprint_n is None:
            sys.stderr.write(
                "ERROR: --candidate-phase / --candidate-pack require --sprint v{X} (the sprint "
                "being approved) so DRAFT candidates are scoped to it; refusing otherwise\n"
            )
            return 1
        if args.candidate_pack:
            # Fail early + clearly on a bad pack reference. Without this a typo or a wrong-sprint
            # pack id silently composes nothing, and the gate then reports a coverage (LTV-COV)
            # blocker — making it look like the trace is missing when really the candidate pack
            # was never found. Validate format, sprint match, and existence up front, reusing the
            # shared pack-id→sprint helper so the format/sprint rule cannot drift from discovery.
            from seal_sprint import change_pack_sprint  # noqa: E402
            pack_sprint = change_pack_sprint(args.candidate_pack)
            if pack_sprint is None:
                sys.stderr.write(
                    f"ERROR: --candidate-pack {args.candidate_pack!r} is not a valid pack id "
                    "(expected vX.Y.Z-slug)\n"
                )
                return 1
            if pack_sprint != sprint_n:
                sys.stderr.write(
                    f"ERROR: --candidate-pack {args.candidate_pack!r} belongs to sprint "
                    f"v{pack_sprint}, not --sprint v{sprint_n}; a pack lives under its own sprint\n"
                )
                return 1
            pack_dir = root / "docs" / f"sprint-v{sprint_n}" / "changes" / args.candidate_pack
            if not pack_dir.is_dir():
                sys.stderr.write(
                    f"ERROR: --candidate-pack {args.candidate_pack!r} not found at "
                    f"docs/sprint-v{sprint_n}/changes/{args.candidate_pack}/ (typo? not created?)\n"
                )
                return 1
            # Validate the pack's delta files STRUCTURALLY before composing. enumerate_change_packs
            # silently drops a delta whose frontmatter `phase` disagrees with its filename (e.g.
            # `architecture-delta-*.md` tagged `phase: design`) — composing nothing, so the gate
            # would then report a misleading "Must FR untraced" (LTV-COV) when the real fault is a
            # malformed delta (VP-7). Surface that structural blocker here instead.
            from effective_truth import validate_source_contracts  # noqa: E402
            pack_deltas = candidate_pack_mergeable_deltas(pack_dir)
            src_blockers = validate_source_contracts(root, None, pack_deltas)
            if src_blockers:
                sys.stderr.write(
                    f"ERROR: --candidate-pack {args.candidate_pack!r} has source validation "
                    "blocker(s) — fix the delta(s), not the traceability map:\n"
                )
                for b in src_blockers:
                    sys.stderr.write(f"  • {b}\n")
                return 1
        # Which phase's coverage this gate enforces ("subject"). The historical --effective gate
        # is the architecture gate, so a bare `--effective` (no --candidate-phase) defaults to
        # architecture for back-compat. Change-pack gates always name the subject explicitly
        # (`--candidate-phase architecture|design` + `--candidate-pack`), since --candidate-pack
        # is refused on its own. `approve design` passes --candidate-phase design.
        subjects = candidate_phases or ("architecture",)
        compose_phases = ("product",) + tuple(p for p in ("architecture", "design") if p in subjects)
        code, state = compose_effective_state(
            root, compose_phases, up_to=sprint_n,
            candidate_phases=candidate_phases, candidate_pack=args.candidate_pack,
        )
        if isinstance(state, str):
            sys.stderr.write(f"ERROR: cannot compose effective truth: {state}\n")
            return 1
        findings = []
        if "architecture" in subjects:
            findings += check_arch_traceability_coverage(state, root)  # LTV-COV
            findings += check_arch_overview_no_shrink(state, root)     # LTV-SHRINK
        if "design" in subjects:
            findings += check_design_traceability_coverage(state, root)  # LTV-DESIGN-COV
        print(format_findings(findings))
        return 1 if any(f.level == "blocker" for f in findings) else 0

    findings = validate_project(
        root,
        sprint_n=sprint_n,
        sealed=args.sealed,
        strict_content=args.strict_content,
    )
    print(format_findings(findings))
    return 1 if any(f.level == "blocker" for f in findings) else 0


if __name__ == "__main__":
    sys.exit(main())
