---
status: ACTIVE
id: BUG-002
slug: candidate-pack-plan-delta-filter
severity: normal
doc_impact: none
linked_change:
allowed_diff_boundary:
  - .prism/core/tools/validate_living_truth.py
  - .prism/core/tools/test_validate_living_truth.py
affected_code_surfaces:
  - .prism/core/tools/validate_living_truth.py
  - .prism/core/tools/test_validate_living_truth.py
reproducible: true
created: 2026-07-19T12:30:00Z
updated: 2026-07-19T12:35:00Z
resolved_by:
---

# Bug Report — BUG-002: Candidate-pack validator misclassifies Plan deltas

## 1. Symptom

An Architecture-originated mixed change pack containing canonical Architecture, Plan and Testing deltas cannot reach candidate effective-truth validation. `validate_living_truth.py` glob-validates `plan-delta-*.md` as a mergeable proposal and rejects its correct `phase: plan` and Plan-specific sections.

## 2. Reproduction

```bash
python3 .prism/core/tools/validate_living_truth.py \
  --effective --sprint v1 --candidate-phase architecture \
  --candidate-pack v1.7.21-oidc-session-error-contracts
```

Before the fix, the command exits non-zero with VP-1/VP-2 findings against `plan-delta-v1.7.21-oidc-session-error-contracts.md` before composing the Architecture candidate.

## 3. Expected vs Actual

- **Expected:** Candidate source validation checks only mergeable delta prefixes `product|design|architecture|testing`, matching `effective_truth.py`, `seal_sprint.py` and the documented two-tier model. Plan absorption remains readable by phase validation but is never passed to `validate_proposal.py` or Living Truth composition.
- **Actual:** `pack_dir.glob("*-delta-*.md")` includes Plan deltas and treats them as mergeable proposals.

## 4. Classification

This is a defect against the documented change-pack model, not a new feature. `core/change-manager.md` explicitly states that `plan-delta-*` never merges into Living Truth, and the normal effective-truth enumerator already filters to the four mergeable phase prefixes.

## 5. Allowed Scope & Affected Code Surfaces

- `validate_living_truth.py`: filter candidate source validation to mergeable phase delta filenames.
- `test_validate_living_truth.py`: regression proving a mixed pack includes Architecture/Testing deltas and excludes Plan absorption from proposal validation.
- No project contract, pack artifact, seal merge ordering or phase semantics change.

## 6. Doc-Impact Assessment

- `doc_impact: none`
- The framework documentation already describes the intended filter correctly; implementation alone is wrong.

## 7. Regression Test (`VERIFIES: BUG-002`)

- Test ref: `.prism/core/tools/test_validate_living_truth.py`
- Required branches: mergeable Architecture/Testing selected; Plan delta excluded; similarly named noncanonical file excluded; deterministic ordering retained.

## 8. Resolution Notes

`candidate_pack_mergeable_deltas` now selects only canonical Product, Design, Architecture and Testing delta filenames before proposal validation. Focused BUG-002 regressions pass, the existing BUG-001 collision suite remains green, and the original mixed-pack command now completes with `Living Truth validation passed.` The bug remains `ACTIVE` until an explicit `validate bug BUG-002` and `approve bug BUG-002` close it.

## Self-Review Checklist

- [x] Existing intended behavior is cited
- [x] Reproduction is concrete and currently failing
- [x] Scope is limited to resolver plus focused regression test
- [x] Doc impact is assessed as none with evidence
