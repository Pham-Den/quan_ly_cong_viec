---
status: ACTIVE
id: BUG-001
slug: pack-scoped-collision-resolver
severity: normal
doc_impact: none
linked_change:
allowed_diff_boundary:
  - .prism/core/tools/seal_sprint.py
  - .prism/core/tools/test_seal_sprint.py
affected_code_surfaces:
  - .prism/core/tools/seal_sprint.py
  - .prism/core/tools/test_seal_sprint.py
reproducible: true
created: 2026-07-19T12:03:05Z
updated: 2026-07-19T12:04:14Z
resolved_by:
---

# Bug Report — BUG-001: Pack-scoped collision resolver misses Plan-only change packs

## 1. Symptom

The scoped same-sprint collision check reports that an existing, structurally valid Plan-only change pack does not exist.

## 2. Reproduction

From the repository root, run:

```bash
python3 .prism/core/tools/seal_sprint.py \
  --sprint v1 \
  --check-overlaps-only \
  --pack v1.7.20-canonical-task-group-headings
```

The command exits `2` and prints `matched no change pack`. The same pack is resolved successfully by `--check-pack-structure`, and its directory contains `change-request.md`, `impact-matrix.md`, and a canonical `plan-delta-*` file.

## 3. Expected vs Actual

- **Expected**: `--check-overlaps-only --pack` resolves any canonical change-pack directory, including a pack with only a Plan delta, then returns `0` when no collision involving that pack exists.
- **Actual**: resolution is derived only from mergeable proposal/delta sources; a Plan-only pack contributes no such source and is incorrectly treated as missing.

## 4. Classification — this is a defect, not a new feature (`ORIGIN-1` / D-F)

`.prism/core/change-manager.md § Same-Sprint Collision Check` and the `seal_sprint.py --help` contract already state that `--pack` accepts a full pack id, version, or slug and that exit `2` means no matching or ambiguous pack. The existing canonical directory matches the requested full id, so the implementation violates its documented contract. The defect predates the current application implementation pass; the Plan-only pack only exposes it.

## 5. Allowed Scope & Affected Code Surfaces

- **allowed_diff_boundary**: `.prism/core/tools/seal_sprint.py`; focused regression test `.prism/core/tools/test_seal_sprint.py`
- **affected_code_surfaces**: scoped pack resolution in `run_overlap_check`; focused Python regression coverage

## 6. Doc-Impact Assessment

- **doc_impact**: `none`
- Evidence: the documented PRISM behavior is already correct; only the collision resolver implementation and regression coverage require repair.
- **linked_change**: none

## 7. Regression Test (`VERIFIES: BUG-001`)

- Test ref(s): `.prism/core/tools/test_seal_sprint.py`
- Status: PASS — `python3 .prism/core/tools/test_seal_sprint.py`

## 8. Resolution Notes

Pack directories are now resolved independently from mergeable delta sources. Ambiguity handling remains intact, and overlap filtering uses the resolved full pack id. The original repository reproduction now exits `0` and reports no collision involving the Plan-only pack.

## Self-Review Checklist

- [x] This is a defect against an already-intended behavior (not a disguised new feature) — D-F
- [x] Reproduction is proven
- [x] Fix stays inside `allowed_diff_boundary`
- [x] Regression test exists, is tagged `VERIFIES: BUG-001`, and PASSES
- [x] `doc_impact` is `none` because the documented contract remains unchanged
