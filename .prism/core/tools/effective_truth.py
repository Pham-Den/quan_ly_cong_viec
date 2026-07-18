#!/usr/bin/env python3
"""effective_truth.py — Phase 2 production.

Compose the effective truth that AI loads as context: living truth + every
APPROVED split proposals from earlier unsealed sprints (Y < X) + the active
sprint's own approved proposals, applied in sprint order.

Per discussion doc §5.4 / §6.5. This script is read-only over living truth;
it writes nothing back to disk. Output goes to stdout (`md` format) or to
stdout as JSON (`--format json`).

`--with-drafts` (auto mode) composes a PREVIEW that ALSO includes DRAFT
proposals/change packs — the human "see the whole in-progress sprint as one
document" surface (e.g. rendered live by the docs viewer). It is banner-marked,
writes nothing, and is NEVER the AI's context: the default (approved-only) stays
the effective truth the AI and `seal_sprint.py` act on. Because it is computed
on demand from the same composer the seal uses, there is no second copy to drift.

Two modes:
  Explicit: --living PATH --proposals PATH... (caller controls order)
  Auto:     --phase PHASE [--up-to-sprint vN] [--project-root PATH]
            (enumerates proposals from prism-config.md sprints array)

CLI (per discussion doc §9.C):
  effective_truth.py --phase {product|design|architecture|testing|all}
                     [--up-to-sprint vN] [--project-root PATH]
                     [--format md|json] [--with-drafts]
  effective_truth.py --living PATH --proposals PATH1 [PATH2 ...]
                     [--format md|json]

Exit codes:
  0  OK
  1  validation fail (a proposal failed to apply)
  2  file not found
  3  config error (missing prism-config.md, malformed sprints array)
"""

from __future__ import annotations

import argparse
import difflib
import json
import re
import sys
from pathlib import Path

import yaml

sys.path.insert(0, str(Path(__file__).resolve().parent))
from apply_proposal import (  # noqa: E402
    PHASES,
    apply,
    apply_multi_target,
    extract_title_from_block,
    find_project_root,
    parse_frontmatter,
    split_proposal_sections,
)
from seal_sprint import (  # noqa: E402
    LIVING_TO_TEMPLATE,
    collect_unrecognized_split_proposal_files,
    inject_indexes,
    render_living_from_template,
)
from seal_sprint import SPLIT_PROPOSAL_PATTERNS_BY_PHASE, change_pack_sprint  # noqa: E402
from validate_proposal import (  # noqa: E402
    infer_expected_phase_from_path,
    infer_expected_target_prefixes_from_path,
    split_proposal_path_errors,
    validate,
)

YAML_BLOCK_RE = re.compile(r"```yaml\n(.*?)\n```", re.DOTALL)
SPRINT_DIR_RE = re.compile(r"^sprint-v(\d+)$")

# Prepended (md mode) when --with-drafts composes a preview that includes unapproved DRAFT
# sources. Both a machine marker (HTML comment) and a human-visible blockquote, so neither a
# renderer nor a reader mistakes the preview for sealed Living Truth.
PREVIEW_BANNER_MD = (
    "<!-- PRISM-PREVIEW: includes DRAFT (unapproved) sources; generated, not sealed; "
    "not the source of truth -->\n"
    "> ⚠ **PRISM preview — includes DRAFT (unapproved) changes.** Computed on demand, "
    "never written to disk, never the source of truth. For the approved-only view, drop "
    "`--with-drafts`."
)
# Phase 9: nested per-phase Living Truth layout. Each phase has multiple LT files; product
# additionally has dynamic epic files under `product/epics/EP-NNN-*.md` resolved at compose time.
PHASE_LIVING_FILES = {
    "product": (
        "product/prd.md",
        "product/glossary.md",
        "product/personas.md",
        "product/market-research.md",
    ),
    "design": ("design/design-system.md",),
    "architecture": (
        "architecture/architecture.md",
        "architecture/nfr.md",
        "architecture/sequence.md",
        "architecture/erd.md",
        "architecture/adr.md",
        "architecture/data-flow.md",
        "architecture/api-specs.md",
        "architecture/events.md",
        "architecture/project-reference.md",
    ),
    "testing": ("testing/test-cases.md",),
}


def discover_epic_files(project_root: Path) -> list[str]:
    """Return relative paths (under /docs/) for all epic files in product/epics/.

    Epic files are dynamic; effective_truth must compose them on demand.
    """
    epics_dir = project_root / "docs" / "product" / "epics"
    if not epics_dir.is_dir():
        return []
    out: list[str] = []
    for epic_file in sorted(epics_dir.iterdir()):
        if epic_file.is_file() and re.match(r"^EP-\d+-[a-z0-9-]+\.md$", epic_file.name):
            out.append(f"product/epics/{epic_file.name}")
    return out


def read_prism_config(config_path: Path) -> dict:
    full = config_path.read_text(encoding="utf-8")
    m = YAML_BLOCK_RE.search(full)
    if not m:
        raise ValueError("no YAML code fence in prism-config.md")
    data = yaml.safe_load(m.group(1))
    if not isinstance(data, dict):
        raise ValueError("prism-config.md YAML did not parse to a mapping")
    return data


def read_sealed_sprints(project_root: Path) -> set[int]:
    """Return the set of sprint numbers whose `sealed: true` in prism-config.md.

    Sealed sprints' proposals are NOT loaded by effective_truth — per
    `core/version-manager.md § Living Truth`, their content already lives in
    the Living Truth files. Returns empty set if config missing / malformed
    (callers fall back to treating all sprints as unsealed).
    """
    config = project_root / "prism-config.md"
    if not config.is_file():
        return set()
    try:
        data = read_prism_config(config)
    except ValueError:
        return set()
    sealed: set[int] = set()
    for entry in data.get("sprints") or []:
        if not isinstance(entry, dict):
            continue
        sid = entry.get("id")
        if not isinstance(sid, str):
            continue
        sm = re.fullmatch(r"v(\d+)", sid)
        if not sm:
            continue
        if entry.get("sealed", False):
            sealed.add(int(sm.group(1)))
    return sealed


def enumerate_proposals(
    project_root: Path,
    phase: str,
    up_to_sprint: int | None,
    draft_sprint: int | None = None,
    include_drafts: bool = False,
    draft_allowlist: set[str] | None = None,
) -> list[Path]:
    """Return ordered list of approved proposal paths for the given phase.

    - Walks canonical split `docs/sprint-v*/<phase>/proposals/**/*-v*.md`.
    - Filters to those with status: APPROVED. Two INDEPENDENT opt-in DRAFT inclusions:
      `draft_sprint` (approve-time gate) ALSO includes DRAFT proposals from THAT sprint
      number only — the approval CANDIDATE — scoped to one sprint so another unsealed
      sprint's DRAFT never leaks into a gate; `include_drafts=True` (human "preview incl.
      drafts" surface ONLY, never AI context) ALSO includes ALL DRAFT proposals. Default
      (neither) = approved-only, the AI's / seal's effective truth.
    - SKIPS sprints with `sealed: true` in prism-config.md (per
      `core/version-manager.md § Living Truth` — their content is already
      in Living Truth, re-applying would duplicate).
    - Sorts by sprint number ascending.
    - If `up_to_sprint` is provided, drops any sprint > that number.
    """
    docs = project_root / "docs"
    if not docs.is_dir():
        return []
    sealed = read_sealed_sprints(project_root)

    candidates: list[tuple[int, Path]] = []
    for sprint_dir in docs.iterdir():
        if not sprint_dir.is_dir():
            continue
        m = SPRINT_DIR_RE.match(sprint_dir.name)
        if not m:
            continue
        n = int(m.group(1))
        if up_to_sprint is not None and n > up_to_sprint:
            continue
        if n in sealed:
            continue
        proposal_paths: list[Path] = []
        phase_dir = sprint_dir / phase
        for pattern in SPLIT_PROPOSAL_PATTERNS_BY_PHASE.get(phase, []):
            proposal_paths.extend(sorted(phase_dir.glob(pattern.format(N=n))))

        for proposal in proposal_paths:
            if not proposal.is_file():
                continue
            try:
                fm, _ = parse_frontmatter(proposal.read_text(encoding="utf-8"))
            except ValueError:
                continue
            status = fm.get("status")
            if status != "APPROVED":
                if status != "DRAFT":
                    continue
                # A DRAFT is composed if it is the approve-gate candidate (draft_sprint), OR it
                # is preview-included (include_drafts) AND — when a selection allowlist is given
                # — its path is in it. `draft_allowlist` is the viewer's per-document selection;
                # None means "all drafts" (default --with-drafts).
                rel = proposal.relative_to(project_root).as_posix()
                selected = include_drafts and (draft_allowlist is None or rel in draft_allowlist)
                if not (n == draft_sprint or selected):
                    continue
            candidates.append((n, proposal))

    candidates.sort(key=lambda kv: kv[0])
    return [p for _n, p in candidates]


def enumerate_unrecognized_split_proposals(
    project_root: Path,
    phase: str,
    up_to_sprint: int | None,
) -> list[Path]:
    """Return proposal-looking files that canonical discovery would ignore."""
    docs = project_root / "docs"
    if not docs.is_dir():
        return []
    sealed = read_sealed_sprints(project_root)
    unknown: list[Path] = []
    for sprint_dir in docs.iterdir():
        if not sprint_dir.is_dir():
            continue
        m = SPRINT_DIR_RE.match(sprint_dir.name)
        if not m:
            continue
        n = int(m.group(1))
        if up_to_sprint is not None and n > up_to_sprint:
            continue
        if n in sealed:
            continue
        unknown.extend(collect_unrecognized_split_proposal_files(project_root, n, phase))
    return sorted(unknown, key=lambda p: p.relative_to(project_root).as_posix())


def enumerate_change_packs(
    project_root: Path,
    phase: str,
    up_to_sprint: int | None,
    draft_pack: str | None = None,
    include_drafts: bool = False,
    draft_allowlist: set[str] | None = None,
) -> list[Path]:
    """Return ordered approved `*-delta-v{X}.{Y}.{Z}-{slug}.md` files for the phase.

    Change packs live under `sprint-v{X}/changes/v{X}.{Y}.{Z}-{slug}/` and contain
    delta files following the same anchor format as proposals. Approval state is
    read from each delta's frontmatter (`status: APPROVED`). With `include_drafts=True`
    (preview only), DRAFT deltas are ALSO included.

    When `draft_pack` (a pack folder name, e.g. `v2.1.0-fix`) is given, DRAFT deltas from
    THAT one pack are ALSO included — used ONLY by an `approve changes` gate to validate the
    approval CANDIDATE ("if I approve this pack, does coverage hold?"; per
    `core/change-manager.md`: base + APPROVED deltas + this selected DRAFT pack's delta).
    Scoped two ways on purpose: (1) to that single pack name — `core/change-manager.md §
    validate changes` forbids pulling DRAFT deltas from unrelated packs; and (2) to the sprint
    being approved (`up_to_sprint`) — a pack from a different (earlier, still-unsealed) sprint
    must never be composed as the candidate, mirroring the DRAFT-proposal sprint scoping.

    Phase-to-delta filename match (per `core/templates/delta-template.md`
    convention): the filename starts with `{phase}-delta-`.
    """
    docs = project_root / "docs"
    if not docs.is_dir():
        return []
    sealed = read_sealed_sprints(project_root)

    packs: list[tuple[tuple[int, int, int, str], Path]] = []
    for sprint_dir in sorted(docs.iterdir()):
        m = SPRINT_DIR_RE.match(sprint_dir.name)
        if not m:
            continue
        n = int(m.group(1))
        if up_to_sprint is not None and n > up_to_sprint:
            continue
        if n in sealed:
            continue
        changes_dir = sprint_dir / "changes"
        if not changes_dir.is_dir():
            continue
        for pack_dir in changes_dir.iterdir():
            if not pack_dir.is_dir():
                continue
            pm = re.match(r"^v(\d+)\.(\d+)\.(\d+)-(.+)$", pack_dir.name)
            if not pm:
                continue
            # Invariant (shared helper): a pack id encodes its sprint — `vX.Y.Z-slug` must live
            # under `sprint-vX/`. A pack whose version prefix disagrees with its containing sprint
            # folder is malformed (manual misplacement) and is skipped, never composed under the
            # wrong sprint — seal enforces the same invariant as a hard blocker.
            if change_pack_sprint(pack_dir.name) != n:
                continue
            key = (int(pm.group(1)), int(pm.group(2)), int(pm.group(3)), pm.group(4))
            for delta in pack_dir.glob(f"{phase}-delta-*.md"):
                try:
                    fm, _ = parse_frontmatter(delta.read_text(encoding="utf-8"))
                except ValueError:
                    continue
                if fm.get("phase") != phase:
                    continue
                status = fm.get("status")
                # DRAFT candidate only from the named pack AND only when that pack lives in the
                # sprint being approved (`up_to_sprint`). A pack id encodes its sprint (`vX...`
                # under `sprint-vX/`), so `--sprint v3 --candidate-pack v2.1.0-x` must NOT compose
                # the v2 pack — same sprint-scoping discipline as DRAFT proposals. `include_drafts`
                # (human preview only) instead includes ALL DRAFT deltas.
                is_candidate = (
                    status == "DRAFT" and pack_dir.name == draft_pack and n == up_to_sprint
                )
                rel = delta.relative_to(project_root).as_posix()
                selected = (
                    include_drafts
                    and status == "DRAFT"
                    and (draft_allowlist is None or rel in draft_allowlist)
                )
                if status != "APPROVED" and not is_candidate and not selected:
                    continue
                packs.append((key, delta))

    packs.sort(key=lambda kv: kv[0])
    return [p for _k, p in packs]


def find_misplaced_change_packs(project_root: Path, up_to: int | None) -> list[tuple[str, int, int]]:
    """Change-pack folders that `enumerate_change_packs` SKIPS because they are misplaced — the
    folder name is a valid pack id (`vX.Y.Z-slug`) but its `vX` names a different sprint than the
    `sprint-vN/` folder it sits in. PRISM never creates these (only a manual rename/move does);
    they are skipped from compose and hard-block the seal. Scoped to the same in-window, unsealed
    sprints as the enumerators. Returned so the `--with-drafts` preview can warn the human ON THE
    PAGE (rename + refresh re-includes them). Each item: (rel_folder_path, folder_sprint, id_sprint)."""
    docs = project_root / "docs"
    if not docs.is_dir():
        return []
    sealed = read_sealed_sprints(project_root)
    out: list[tuple[str, int, int]] = []
    for sprint_dir in sorted(docs.iterdir()):
        m = SPRINT_DIR_RE.match(sprint_dir.name)
        if not m:
            continue
        n = int(m.group(1))
        if up_to is not None and n > up_to:
            continue
        if n in sealed:
            continue
        changes_dir = sprint_dir / "changes"
        if not changes_dir.is_dir():
            continue
        for pack_dir in sorted(changes_dir.iterdir()):
            if not pack_dir.is_dir():
                continue
            id_sprint = change_pack_sprint(pack_dir.name)
            if id_sprint is not None and id_sprint != n:
                out.append((pack_dir.relative_to(project_root).as_posix(), n, id_sprint))
    return out


def misplaced_warning_md(misplaced: list[tuple[str, int, int]]) -> str:
    """Render the on-page (`--with-drafts` preview) warning for misplaced change-pack folders."""
    lines = [
        "> ⚠ **Change pack(s) left out — folder name points at the wrong sprint.** A folder below "
        "is a valid change-pack id, but its `vX` names a different sprint than the `sprint-vN/` it "
        "sits in, so PRISM skips it here (and the seal will hard-block on it). **Rename the folder "
        "to its real sprint and refresh — it is picked up automatically:**",
    ]
    for rel, folder_n, id_n in misplaced:
        lines.append(
            f">   - `{rel}` — id says **v{id_n}**, but it is under **sprint-v{folder_n}/** → "
            f"rename to `v{folder_n}.<minor>.<patch>-<slug>`."
        )
    return "\n".join(lines)


def validate_source_contracts(project_root: Path, phase: str, sources: list[Path]) -> list[str]:
    """Return validation blocker strings for proposal/delta sources.

    Effective truth is a preview of the same content seal_sprint will merge, so
    it must enforce the same proposal contract before composing.
    """
    blockers: list[str] = []
    for source in sources:
        expected_prefixes, target_label = infer_expected_target_prefixes_from_path(source)
        report = validate(
            source.read_text(encoding="utf-8"),
            expected_phase=infer_expected_phase_from_path(source),
            expected_target_prefixes=expected_prefixes,
            target_label=target_label,
            source_path=source,
        )
        for finding in report.blockers:
            blockers.append(
                f"{source.relative_to(project_root)}: [{finding.rule}] {finding.message}"
            )
    return blockers


def compose(
    living_text: str,
    proposal_texts: list[str],
    verbose: bool = False,
) -> tuple[int, str]:
    current = living_text
    for idx, proposal_text in enumerate(proposal_texts, start=1):
        code, payload = apply(proposal_text, current, verbose=verbose)
        if code != 0:
            return code, f"proposal #{idx} failed:\n{payload}"
        current = payload
    return 0, current


def compose_multi_target(
    project_root: Path,
    phase: str,
    living_files: tuple[str, ...],
    source_paths: list[Path],
    verbose: bool = False,
) -> tuple[int, dict[Path, str] | str]:
    """Compose effective truth for a Phase 9 phase using the same router as seal.

    A single proposal can contain anchors for multiple Living Truth files, so
    composing each LT independently with the legacy single-target merger leaks
    every anchor into every file. This function keeps a per-target in-memory
    state and lets `apply_multi_target` route anchors by ID/tag.

    For sprint v1 before seal, root LT files may not exist yet because setup
    defers bootstrapping until seal. Effective truth is still needed by later
    phases, so missing root LT files are rendered into this in-memory state only.
    """
    state: dict[Path, str] = {}
    bootstrap_missing = should_bootstrap_missing_roots(project_root, source_paths)
    for living_name in living_files:
        living_path = project_root / "docs" / living_name
        if living_path.is_file():
            state[living_path] = living_path.read_text(encoding="utf-8")
        elif bootstrap_missing and living_name in LIVING_TO_TEMPLATE:
            rendered = render_living_from_template(living_path, project_root)
            if rendered is None:
                return 2, f"cannot bootstrap missing Living Truth in memory: {living_path}"
            state[living_path] = rendered
        else:
            sys.stderr.write(f"WARN: living truth not found, skipping: {living_path}\n")

    for idx, source in enumerate(source_paths, start=1):
        code, payload = apply_multi_target(
            source.read_text(encoding="utf-8"),
            project_root,
            project_name=project_root.name,
            current_state=state,
            verbose=verbose,
        )
        if isinstance(payload, str):
            return code, f"proposal #{idx} failed ({source.relative_to(project_root)}):\n{payload}"
        state.update(payload)

    # Parity with seal: regenerate `## Index` sections so the preview reflects the
    # combined (sealed + unsealed) anchored content, not a stale sealed-only index.
    inject_indexes(state, project_root)

    return 0, state


def compose_effective_state(
    project_root: Path,
    phases: tuple[str, ...],
    up_to: int | None = None,
    candidate_phases: tuple[str, ...] = (),
    candidate_pack: str | None = None,
) -> tuple[int, dict[Path, str] | str]:
    """Compose the merged (pre-seal) Living Truth state across `phases` into one dict.

    Returns (0, {living_path: merged_text}) or (code, error_message). This is the same
    in-memory merge seal performs, exposed so approve-time validators can check the
    EFFECTIVE truth (living + this sprint's approved proposals/deltas) without waiting
    for seal. Used by `validate_living_truth.py --effective` (LTV-COV at approve).

    `candidate_phases` names phases whose DRAFT proposals — scoped to the sprint being
    approved (`up_to`) — are composed too, so an approve-time gate validates the approval
    CANDIDATE: "if I approve this DRAFT, does coverage hold?" — instead of deadlocking on
    approved-only content (the gate runs while the proposal being approved is still DRAFT;
    its status flips to APPROVED only after the gate passes). Drafts are scoped to `up_to`,
    NOT all unsealed sprints ≤ up_to, so a different unsealed sprint's in-progress draft is
    never pulled in. Change packs stay approved-only: a stray DRAFT pack must not silently
    satisfy a base approve gate. Requires `up_to` to be set when `candidate_phases` is
    non-empty (otherwise there is no sprint to scope drafts to — caller must pass --sprint).
    Default `()` = approved-only, the AI/seal effective truth.

    `candidate_pack` (a pack folder name) is the change-pack twin: it composes that ONE
    pack's DRAFT deltas across every phase, so an `approve changes` gate validates "if I
    approve this pack, does coverage hold?" — the deadlock fix for change packs. Scoped to
    the named pack only; a different pack's DRAFT deltas are never pulled in."""
    merged: dict[Path, str] = {}
    for phase in phases:
        living_files: tuple[str, ...] = PHASE_LIVING_FILES.get(phase, ())
        if phase == "product":
            living_files = living_files + tuple(discover_epic_files(project_root))
        draft_sprint = up_to if phase in candidate_phases else None
        sources = (
            enumerate_proposals(project_root, phase, up_to, draft_sprint=draft_sprint)
            + enumerate_change_packs(project_root, phase, up_to, draft_pack=candidate_pack)
        )
        code, payload = compose_multi_target(project_root, phase, living_files, sources)
        if isinstance(payload, str):
            return code, payload
        merged.update(payload)
    return 0, merged


def should_bootstrap_missing_roots(project_root: Path, source_paths: list[Path]) -> bool:
    """Return True when composing unsealed sprint-v1 proposals before LT bootstrap.

    Sealed sprint v1 means its content should already be on disk in Living Truth,
    so missing files remain warnings/errors. This function is intentionally
    conservative: it only enables in-memory bootstrap when a source is from v1.
    """
    if 1 in read_sealed_sprints(project_root):
        return False
    for source in source_paths:
        try:
            fm, _ = parse_frontmatter(source.read_text(encoding="utf-8"))
        except ValueError:
            continue
        sprint = fm.get("sprint")
        if sprint == 1 or sprint == "1":
            return True
        version = fm.get("version")
        if version == "v1":
            return True
        if any(part == "sprint-v1" for part in source.parts):
            return True
    return False


def _inventory_item(project_root, n, phase, kind, path, pack=None):
    try:
        fm, _ = parse_frontmatter(path.read_text(encoding="utf-8"))
        status = str(fm.get("status") or "UNKNOWN")
    except (ValueError, OSError):
        status = "MALFORMED"
    item = {
        "sprint": f"v{n}",
        "sprint_n": n,
        "phase": phase,
        "type": kind,
        "status": status,
        "path": path.relative_to(project_root).as_posix(),
    }
    if pack:
        item["pack"] = pack
    return item


def inventory_sources(project_root: Path, up_to: int | None = None) -> dict:
    """Return the composable-source inventory for the docs-viewer source picker.

    Sealed sprints are NOT listed as sources — their content already lives in Living Truth (the
    always-on base) — but their ids are returned under `sealed_sprints` so the picker can show a
    locked base node. For every UNSEALED sprint (≤ `up_to`) it lists each split proposal +
    change-pack delta with sprint / phase / type / status / project-root-relative `path`. The
    viewer renders a checkbox tree (APPROVED = locked-on, DRAFT = toggleable); `path` is exactly
    what `--include-draft` takes back to compose the selection.
    """
    docs = project_root / "docs"
    sealed = read_sealed_sprints(project_root)
    sources: list[dict] = []
    if docs.is_dir():
        for sprint_dir in sorted(docs.iterdir(), key=lambda p: p.name):
            m = SPRINT_DIR_RE.match(sprint_dir.name)
            if not m or not sprint_dir.is_dir():
                continue
            n = int(m.group(1))
            if up_to is not None and n > up_to:
                continue
            if n in sealed:
                continue
            for phase in PHASES:
                phase_dir = sprint_dir / phase
                for pattern in SPLIT_PROPOSAL_PATTERNS_BY_PHASE.get(phase, []):
                    for p in sorted(phase_dir.glob(pattern.format(N=n))):
                        if p.is_file():
                            sources.append(_inventory_item(project_root, n, phase, "proposal", p))
            changes_dir = sprint_dir / "changes"
            if changes_dir.is_dir():
                for pack_dir in sorted(changes_dir.iterdir(), key=lambda p: p.name):
                    if not pack_dir.is_dir() or not re.match(r"^v\d+\.\d+\.\d+-.+$", pack_dir.name):
                        continue
                    if change_pack_sprint(pack_dir.name) != n:
                        continue
                    for phase in PHASES:
                        for delta in sorted(pack_dir.glob(f"{phase}-delta-*.md")):
                            sources.append(
                                _inventory_item(project_root, n, phase, "change-pack", delta, pack=pack_dir.name)
                            )
    return {"sealed_sprints": [f"v{x}" for x in sorted(sealed)], "sources": sources}


def main_list_sources(args: argparse.Namespace) -> int:
    project_root = Path(args.project_root) if args.project_root else find_project_root(Path.cwd())
    if project_root is None:
        sys.stderr.write("ERROR: project root not found (no prism-config.md in cwd or parents)\n")
        return 3
    up_to: int | None = None
    if args.up_to_sprint:
        m = re.fullmatch(r"v(\d+)", args.up_to_sprint)
        if not m:
            sys.stderr.write(f"ERROR: --up-to-sprint must be format vN (got {args.up_to_sprint!r})\n")
            return 3
        up_to = int(m.group(1))
    sys.stdout.write(json.dumps(inventory_sources(project_root, up_to), indent=2, ensure_ascii=False))
    sys.stdout.write("\n")
    return 0


def _resolve_draft_selection(args: argparse.Namespace) -> tuple[bool, set[str] | None]:
    """Map the draft CLI flags to (include_drafts, draft_allowlist) — shared by compose and
    change-summary so the two never diverge on what "selected" means. See main_auto for the
    semantics: None allowlist = all drafts; a set = exactly those; empty set = preview, no drafts.
    """
    include_draft_args = getattr(args, "include_draft", []) or []
    preview = (
        bool(getattr(args, "with_drafts", False))
        or bool(getattr(args, "preview", False))
        or bool(include_draft_args)
    )
    if not preview:
        return False, None
    if include_draft_args:
        return True, set(include_draft_args)
    if getattr(args, "with_drafts", False):
        return True, None
    return True, set()


def change_summary(
    project_root: Path,
    up_to: int | None,
    include_drafts: bool,
    draft_allowlist: set[str] | None,
) -> dict:
    """Summarize what the INCLUDED DRAFT sources change — the `## New` / `## Updated` /
    `## Removed` anchors they declare (id + title + which source). This is the "what changed"
    view for the docs-viewer preview: it answers "if I include these drafts, what do they
    add/change/remove" vs the approved baseline. APPROVED sources are not listed (already
    decided). Reuses the same anchor parsing as merge/seal — no second parser to drift.
    """
    inv = inventory_sources(project_root, up_to)
    changes: list[dict] = []
    for s in inv["sources"]:
        if s["status"] != "DRAFT" or not include_drafts:
            continue
        if draft_allowlist is not None and s["path"] not in draft_allowlist:
            continue
        try:
            _fm, body = parse_frontmatter((project_root / s["path"]).read_text(encoding="utf-8"))
        except (ValueError, OSError):
            continue
        sections = split_proposal_sections(body)
        for op in ("New", "Updated", "Removed"):
            for aid, block_lines in sections.get(op, []):
                entry = {
                    "op": op,
                    "id": aid,
                    "title": extract_title_from_block(block_lines) or "",
                    "phase": s["phase"],
                    "sprint": s["sprint"],
                    "source": s["path"],
                }
                if s.get("pack"):
                    entry["pack"] = s["pack"]
                changes.append(entry)
    return {"changes": changes}


def _source_meta(project_root: Path, source: Path) -> dict:
    """sprint / status / type / pack metadata for a proposal or change-pack delta path."""
    rel = source.relative_to(project_root).as_posix()
    try:
        fm, _ = parse_frontmatter(source.read_text(encoding="utf-8"))
        status = str(fm.get("status") or "UNKNOWN")
    except (ValueError, OSError):
        status = "UNKNOWN"
    m = re.search(r"sprint-v(\d+)", rel)
    n = int(m.group(1)) if m else 0
    is_pack = "/changes/" in rel
    meta = {
        "sprint": f"v{n}",
        "sprint_n": n,
        "status": status,
        "type": "change-pack" if is_pack else "proposal",
        "path": rel,
    }
    if is_pack:
        pm = re.search(r"/changes/([^/]+)/", rel)
        if pm:
            meta["pack"] = pm.group(1)
    return meta


def per_source_diff(
    project_root: Path,
    phases: tuple[str, ...],
    up_to: int | None,
    include_drafts: bool,
    draft_allowlist: set[str] | None,
    with_content: bool = False,
) -> list[dict]:
    """Per-source line-level diff of the effective truth.

    Composes the selection incrementally (the SAME apply the seal/compose use), and for each source
    — in sprint order, honouring the same APPROVED/DRAFT selection as `--phase` — emits a unified
    diff of every Living Truth doc that source changes. This is the docs-viewer "show the diffs"
    surface: each entry is one proposal / change-pack delta, tagged with its sprint + DRAFT/APPROVED
    so the viewer can render git-style diffs grouped by sprint. Best-effort: an un-appliable draft
    is skipped (its diff is omitted) rather than aborting the whole view.
    """
    out: list[dict] = []
    for phase in phases:
        living_files: tuple[str, ...] = PHASE_LIVING_FILES.get(phase, ())
        if phase == "product":
            living_files = living_files + tuple(discover_epic_files(project_root))
        sources = (
            enumerate_proposals(
                project_root, phase, up_to, include_drafts=include_drafts, draft_allowlist=draft_allowlist
            )
            + enumerate_change_packs(
                project_root, phase, up_to, include_drafts=include_drafts, draft_allowlist=draft_allowlist
            )
        )
        if not sources:
            continue

        # Initial in-memory base — same bootstrap rule as compose_multi_target.
        state: dict[Path, str] = {}
        bootstrap_missing = should_bootstrap_missing_roots(project_root, sources)
        for living_name in living_files:
            living_path = project_root / "docs" / living_name
            if living_path.is_file():
                state[living_path] = living_path.read_text(encoding="utf-8")
            elif bootstrap_missing and living_name in LIVING_TO_TEMPLATE:
                rendered = render_living_from_template(living_path, project_root)
                if rendered is not None:
                    state[living_path] = rendered

        for source in sources:
            meta = _source_meta(project_root, source)
            meta["phase"] = phase
            before = dict(state)
            code, payload = apply_multi_target(
                source.read_text(encoding="utf-8"),
                project_root,
                project_name=project_root.name,
                current_state=state,
            )
            # ALWAYS emit the source (so the viewer never shows a misleading "0 sources" when sources
            # exist) — with a `note` explaining why there is no diff, if so.
            if isinstance(payload, str):
                meta["diffs"] = []
                meta["note"] = f"could not apply in preview: {payload.splitlines()[0] if payload else 'merge failed'}"
                out.append(meta)
                continue
            state.update(payload)

            diffs: list[dict] = []
            for target_path in payload:
                after_text = state.get(target_path, "")
                before_text = before.get(target_path, "")
                if before_text == after_text:
                    continue
                try:
                    rel = target_path.relative_to(project_root / "docs").as_posix()
                except ValueError:
                    rel = target_path.name
                ud = "".join(
                    difflib.unified_diff(
                        before_text.splitlines(keepends=True),
                        after_text.splitlines(keepends=True),
                        fromfile=f"a/{rel}",
                        tofile=f"b/{rel}",
                        n=3,
                    )
                )
                if ud.strip():
                    entry = {"living": rel, "diff": ud}
                    # With --with-content, also carry the FULL before/after markdown of the doc (not
                    # just the n=3 hunk) so the docs-viewer can render a block-level rich diff with
                    # whole tables/lists intact. Opt-in to keep the default payload lean.
                    if with_content:
                        entry["before"] = before_text
                        entry["after"] = after_text
                    diffs.append(entry)

            meta["diffs"] = diffs
            if not diffs:
                meta["note"] = "no change vs the current base (content already present?)"
            out.append(meta)
    return out


def main_per_source_diff(args: argparse.Namespace) -> int:
    project_root = Path(args.project_root) if args.project_root else find_project_root(Path.cwd())
    if project_root is None:
        sys.stderr.write("ERROR: project root not found (no prism-config.md in cwd or parents)\n")
        return 3
    up_to: int | None = None
    if args.up_to_sprint:
        m = re.fullmatch(r"v(\d+)", args.up_to_sprint)
        if not m:
            sys.stderr.write(f"ERROR: --up-to-sprint must be format vN (got {args.up_to_sprint!r})\n")
            return 3
        up_to = int(m.group(1))
    phases = tuple(PHASES) if args.phase in (None, "all") else (args.phase,)
    include_drafts, draft_allowlist = _resolve_draft_selection(args)
    data = per_source_diff(
        project_root, phases, up_to, include_drafts, draft_allowlist, with_content=bool(getattr(args, "with_content", False))
    )
    sys.stdout.write(json.dumps(data, indent=2, ensure_ascii=False))
    sys.stdout.write("\n")
    return 0


def main_change_summary(args: argparse.Namespace) -> int:
    project_root = Path(args.project_root) if args.project_root else find_project_root(Path.cwd())
    if project_root is None:
        sys.stderr.write("ERROR: project root not found (no prism-config.md in cwd or parents)\n")
        return 3
    up_to: int | None = None
    if args.up_to_sprint:
        m = re.fullmatch(r"v(\d+)", args.up_to_sprint)
        if not m:
            sys.stderr.write(f"ERROR: --up-to-sprint must be format vN (got {args.up_to_sprint!r})\n")
            return 3
        up_to = int(m.group(1))
    include_drafts, draft_allowlist = _resolve_draft_selection(args)
    summary = change_summary(project_root, up_to, include_drafts, draft_allowlist)
    sys.stdout.write(json.dumps(summary, indent=2, ensure_ascii=False))
    sys.stdout.write("\n")
    return 0


def main_auto(args: argparse.Namespace) -> int:
    project_root = Path(args.project_root) if args.project_root else find_project_root(Path.cwd())
    if project_root is None:
        sys.stderr.write("ERROR: project root not found (no prism-config.md in cwd or parents)\n")
        return 3
    config = project_root / "prism-config.md"
    if not config.is_file():
        sys.stderr.write(f"ERROR: prism-config.md not found at {config}\n")
        return 2

    up_to: int | None = None
    if args.up_to_sprint:
        m = re.fullmatch(r"v(\d+)", args.up_to_sprint)
        if not m:
            sys.stderr.write(f"ERROR: --up-to-sprint must be format vN (got {args.up_to_sprint!r})\n")
            return 3
        up_to = int(m.group(1))

    phases = list(PHASES) if args.phase == "all" else [args.phase]
    # Preview-mode + draft selection (docs-viewer source picker), shared with --change-summary.
    #   preview mode (lenient gates + banner) is on for --with-drafts, --preview, or any
    #     --include-draft. The default (none) stays the strict, approved-only effective truth.
    #   draft_allowlist: None = ALL drafts (--with-drafts); a set = exactly those (--include-draft);
    #     empty set = NO drafts but still preview (--preview alone — the "all unticked" case).
    # APPROVED sources are always composed regardless.
    include_drafts, draft_allowlist = _resolve_draft_selection(args)
    # Preview-with-drafts is best-effort: structural gates that hard-fail the approved view
    # (unknown files, path errors, contract blockers) downgrade to warnings so an in-progress
    # DRAFT still renders. The merge itself (compose_multi_target) is still allowed to fail —
    # a genuinely un-mergeable draft cannot be previewed, and saying so is honest.
    strict = not include_drafts
    outputs: dict[str, dict] = {}
    for phase in phases:
        living_files: tuple[str, ...] = PHASE_LIVING_FILES.get(phase, ())
        # Phase 9: product phase additionally includes dynamic epic files.
        if phase == "product":
            living_files = living_files + tuple(discover_epic_files(project_root))
        label = "ERROR" if strict else "WARNING"
        unknown = enumerate_unrecognized_split_proposals(project_root, phase, up_to)
        if unknown:
            sys.stderr.write(
                f"[{phase}] {label}: unrecognized split proposal file(s) under proposals/:\n"
            )
            for path in unknown:
                sys.stderr.write(f"  - {path.relative_to(project_root)}\n")
            if strict:
                return 1
        proposals = enumerate_proposals(
            project_root, phase, up_to, include_drafts=include_drafts, draft_allowlist=draft_allowlist
        )
        path_errors = [
            (path, error)
            for path in proposals
            for error in split_proposal_path_errors(path)
        ]
        if path_errors:
            sys.stderr.write(f"[{phase}] {label}: invalid split proposal path(s):\n")
            for path, error in path_errors:
                sys.stderr.write(f"  - {path.relative_to(project_root)}: {error}\n")
            if strict:
                return 1
        change_packs = enumerate_change_packs(
            project_root, phase, up_to, include_drafts=include_drafts, draft_allowlist=draft_allowlist
        )
        sources = proposals + change_packs
        blockers = validate_source_contracts(project_root, phase, sources)
        if blockers:
            sys.stderr.write(f"[{phase}] {label}: proposal validation blocker(s):\n")
            for blocker in blockers:
                sys.stderr.write(f"  - {blocker}\n")
            if strict:
                return 1
        applied_files = [str(p.relative_to(project_root)) for p in sources]
        code, payload = compose_multi_target(
            project_root,
            phase,
            living_files,
            sources,
            verbose=args.verbose,
        )
        if code != 0:
            sys.stderr.write(f"[{phase}] {payload}\n")
            return code
        assert isinstance(payload, dict)
        for living_path, content in sorted(
            payload.items(),
            key=lambda kv: kv[0].relative_to(project_root).as_posix(),
        ):
            try:
                living_name = living_path.relative_to(project_root / "docs").as_posix()
            except ValueError:
                living_name = living_path.relative_to(project_root).as_posix()
            outputs[f"{phase}:{living_name}"] = {
                "phase": phase,
                "living": str(living_path.relative_to(project_root)),
                "applied_proposals": applied_files,
                "includes_drafts": include_drafts,
                "content": content,
            }

    if args.format == "json":
        sys.stdout.write(json.dumps(list(outputs.values()), indent=2, ensure_ascii=False))
        sys.stdout.write("\n")
    else:
        if include_drafts:
            sys.stdout.write(PREVIEW_BANNER_MD + "\n\n")
            # On the page (not just stderr): a misplaced pack is silently skipped from compose, so
            # tell the human why it's missing + how to fix it — the docs viewer silences stderr.
            misplaced = find_misplaced_change_packs(project_root, up_to)
            if misplaced:
                sys.stdout.write(misplaced_warning_md(misplaced) + "\n\n")
        if len(outputs) == 1:
            sys.stdout.write(next(iter(outputs.values()))["content"])
        else:
            for key, entry in outputs.items():
                sys.stdout.write(f"<!-- effective truth for {key} -->\n")
                sys.stdout.write(entry["content"])
                sys.stdout.write("\n")
    return 0


def main_explicit(args: argparse.Namespace) -> int:
    """Explicit single-file preview: apply the given proposals to ONE living file via the
    single-target merger. This intentionally does NOT do multi-target ID routing or regenerate
    the `## Index` — use `--phase` (auto mode) for output that matches what `seal_sprint.py`
    produces at seal.
    """
    living_path = Path(args.living)
    if not living_path.is_file():
        sys.stderr.write(f"ERROR: living truth not found: {living_path}\n")
        return 2
    proposal_texts: list[str] = []
    proposal_files: list[str] = []
    for p in args.proposals:
        pp = Path(p)
        if not pp.is_file():
            sys.stderr.write(f"ERROR: proposal not found: {pp}\n")
            return 2
        proposal_texts.append(pp.read_text(encoding="utf-8"))
        proposal_files.append(str(pp))

    living_text = living_path.read_text(encoding="utf-8")
    code, payload = compose(living_text, proposal_texts, verbose=args.verbose)
    if code != 0:
        sys.stderr.write(payload + "\n")
        return code

    if args.format == "json":
        out = {
            "phase": None,
            "living": str(living_path),
            "applied_proposals": proposal_files,
            "content": payload,
        }
        sys.stdout.write(json.dumps(out, indent=2, ensure_ascii=False))
        sys.stdout.write("\n")
    else:
        sys.stdout.write(payload)
    return 0


def main() -> int:
    parser = argparse.ArgumentParser(
        description="Compose effective truth from living + approved proposals (Phase 2 production).",
    )
    # Explicit mode
    parser.add_argument("--living", help="Path to living-truth markdown (explicit mode)")
    parser.add_argument(
        "--proposals", nargs="+",
        help="Ordered paths to approved proposal markdown files (explicit mode, earliest first)",
    )
    # Auto mode
    parser.add_argument(
        "--phase", choices=list(PHASES) + ["all"],
        help="Auto-enumerate proposals for this phase (auto mode)",
    )
    parser.add_argument("--up-to-sprint", help="Restrict auto-enumeration to sprints v1..vN")
    parser.add_argument(
        "--project-root", help="Project root containing prism-config.md (default: walk up from CWD)",
    )
    parser.add_argument(
        "--list-sources",
        action="store_true",
        help=(
            "Print (JSON) the composable-source inventory for the docs-viewer source picker: "
            "`sealed_sprints` (the Living Truth base) + every unsealed proposal / change-pack "
            "delta with sprint / phase / type / status / path. Standalone mode; ignores --phase."
        ),
    )
    parser.add_argument(
        "--change-summary",
        action="store_true",
        help=(
            "Print (JSON) what the INCLUDED DRAFT sources add/update/remove (`## New` / "
            "`## Updated` / `## Removed` anchors: op + id + title + source), honouring the same "
            "--include-draft / --with-drafts / --preview selection. The 'what changed' view."
        ),
    )
    parser.add_argument(
        "--per-source-diff",
        action="store_true",
        help=(
            "Print (JSON) a per-source line-level diff of the effective truth: for each proposal / "
            "change-pack delta (in sprint order, honouring --up-to-sprint + the same DRAFT selection "
            "as --with-drafts/--include-draft/--preview), a unified diff of every Living Truth doc it "
            "changes, tagged with sprint + status. The docs-viewer 'show diffs' surface."
        ),
    )
    parser.add_argument(
        "--with-content",
        action="store_true",
        help=(
            "With --per-source-diff, also include each changed doc's FULL before/after markdown "
            "(not just the hunk) so a consumer can render a block-level rich diff. Opt-in (larger "
            "output); used by the docs-viewer 'rendered diff' view."
        ),
    )
    parser.add_argument(
        "--preview",
        action="store_true",
        help=(
            "Preview mode (lenient gates + banner) WITHOUT forcing all drafts. Alone = "
            "approved-only preview (the 'all drafts unticked' case); combine with "
            "--include-draft to choose specific drafts."
        ),
    )
    parser.add_argument(
        "--include-draft",
        action="append",
        default=[],
        metavar="RELPATH",
        help=(
            "Compose only this DRAFT source (project-root-relative path, as printed by "
            "--list-sources). Repeatable. APPROVED sources are always composed; passing any "
            "--include-draft selects exactly which drafts to add (implies preview). With none, "
            "--with-drafts composes all drafts."
        ),
    )
    # Output / behavior
    parser.add_argument("--format", choices=("md", "json"), default="md")
    parser.add_argument(
        "--with-drafts",
        action="store_true",
        help=(
            "PREVIEW only (auto mode): also compose DRAFT proposals/change packs, not just "
            "APPROVED, and downgrade structural gates to warnings so an in-progress sprint "
            "still renders. Output is banner-marked. NEVER use this for AI context — it is "
            "the human 'preview incl. drafts' surface; the default (approved-only) is the "
            "effective truth the AI and seal act on."
        ),
    )
    parser.add_argument("--verbose", action="store_true")
    args = parser.parse_args()

    if args.list_sources:
        return main_list_sources(args)
    if args.change_summary:
        return main_change_summary(args)
    if args.per_source_diff:
        return main_per_source_diff(args)

    explicit = bool(args.living) or bool(args.proposals)
    auto = bool(args.phase)
    if explicit and auto:
        sys.stderr.write("ERROR: use either --living/--proposals OR --phase, not both\n")
        return 1
    if explicit and not (args.living and args.proposals):
        sys.stderr.write("ERROR: --living and --proposals must be specified together\n")
        return 1
    if not explicit and not auto:
        sys.stderr.write("ERROR: provide --living/--proposals OR --phase\n")
        return 1

    return main_auto(args) if auto else main_explicit(args)


if __name__ == "__main__":
    sys.exit(main())
