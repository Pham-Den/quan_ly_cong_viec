---
status: DRAFT
id: BUG-{{NNN}}
slug: {{SLUG}}
severity: normal
doc_impact: none
linked_change:
allowed_diff_boundary: []
affected_code_surfaces: []
reproducible: true
created: {{TIMESTAMP}}
updated: {{TIMESTAMP}}
resolved_by:
---

# Bug Report — BUG-{{NNN}}: {{TITLE}}

> `status`: `DRAFT` → `ACTIVE` (fix in progress) → `RESOLVED` (after `approve bug`).
> `severity`: `normal` | `urgent` (urgent = hotfix variant; code may be fixed on a `hotfix/` branch first, but this record + validate + approve still apply).
> `doc_impact`: `none` | `suspected` | `yes`. `suspected`/`yes` block `approve bug` until resolved (see § Doc-Impact).

## 1. Symptom

{{SYMPTOM}}

## 2. Reproduction

{{REPRO_STEPS}}

<!-- If not reproducible (reproducible: false), give a substantive justification: why it cannot be reproduced here, what evidence exists, and what the regression test pins instead. A blank/trivial reason is not acceptable. -->

## 3. Expected vs Actual

- **Expected**: {{EXPECTED}}
- **Actual**: {{ACTUAL}}

## 4. Classification — this is a defect, not a new feature (`ORIGIN-1` / D-F)

Which already-intended behavior / contract / acceptance criterion is being violated, and how the repro proves it is broken:

{{VIOLATED_INTENT}}

<!-- If no prior intended behavior is being violated (the behavior was never specified anywhere), this is a REQUIREMENT, not a bug. Stop and route to the requirement door (start product / arch / change), not start bug. -->

## 5. Allowed Scope & Affected Code Surfaces

- **allowed_diff_boundary**: {{ALLOWED_DIFF_BOUNDARY}}
- **affected_code_surfaces**: {{AFFECTED_CODE_SURFACES}}

<!-- The fix must stay inside this declared boundary. Out-of-boundary edits are caught by CODE-5 / Scope Discipline after ORIGIN-1 grants the lane. -->

## 6. Doc-Impact Assessment

- **doc_impact**: `{{DOC_IMPACT}}`
- Evidence + affected docs/anchors (required when `suspected` or `yes`): {{DOC_IMPACT_EVIDENCE}}
- **linked_change**: {{LINKED_CHANGE}}  <!-- change-pack id when the doc part is routed via start change: / new sprint -->

## 7. Regression Test (`VERIFIES: BUG-{{NNN}}`)

- Test ref(s): {{TEST_REFS}}
- Status: {{TEST_STATUS}}  <!-- must PASS before approve bug -->

## 8. Resolution Notes

{{RESOLUTION_NOTES}}

## Self-Review Checklist

- [ ] This is a defect against an already-intended behavior (not a disguised new feature) — D-F
- [ ] Reproduction is proven, or `reproducible: false` carries a substantive justification
- [ ] Fix stays inside `allowed_diff_boundary`
- [ ] Regression test exists, is tagged `VERIFIES: BUG-{{NNN}}`, and PASSES
- [ ] `doc_impact` assessed with evidence; if `suspected`/`yes`, a linked change is opened/approved (or reclassified to `none` with evidence) before `approve bug`
