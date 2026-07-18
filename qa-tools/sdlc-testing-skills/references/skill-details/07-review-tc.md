# Detailed Procedure: 07-review-tc

> Token-saving archive of the previous full sub-skill body. Read only when the compact sub-skill needs exact legacy wording, templates, or edge-case procedures.

## ⚑ Pre-DONE Checklist

> ⚠️ **L2 — QA Lead review mandatory (SLA: 24h).** Do not send output to the user until "Approved" is received. See the Sign-off section at the end of this file.

- [ ] Coverage Map with 19 columns complete
- [ ] Gap Analysis + Supplemental TCs merged into the main TSV
- [ ] Gate verdict clearly stated: `Approved` or `Not Approved`
- [ ] L2 sign-off request emitted, awaiting QA Lead reply
- [ ] Append execution record to `governance/audit-log.md`
- [ ] Update `project/session-state.yaml` → `last_execution`, `pending_sign_offs`

---

## Quick Reference

| | |
|---|---|
| **Mandatory input** | Requirements document (US/AC/BR) + TC file (TSV/Markdown/Excel) |
| **Output** | 3 tables (Coverage Map, Gap Analysis, Supplemental TC) + Gate verdict |
| **Time estimate** | 30–90 minutes depending on the number of TCs and ACs |
| **Sign-off** | L2 — QA Lead confirms before moving to data/automation |
| **Gate result** | Approved / Not Approved |

---

## Inputs

| Field | Required? | Description |
|---|---|---|
| Requirements document | ✔ | US / AC / BR — each requirement has its own ID |
| Test case file | ✔ | List of written TCs (TSV, Excel, or Markdown; Functional or SIT) |
| qa-config.yaml | Recommended | If available → read `scope.modules` to group coverage by module |

If the requirements document or TC file is missing → write `[To be added]`, list clarification questions, stop.

---

## Step 1 — Build Rule Inventory

Before reviewing TCs, create a Rule Inventory from the requirements document:

1. Read all AC/US/BR
2. Assign IDs to each rule/AC/BR if not already assigned (AC-01, AC-02, BR-01...)
3. Create the inventory list:

| Rule ID | Brief description | Type | Complexity | Module |
|---|---|---|---|---|
| AC-01 | [Rule description] | AC / BR / US | High / Medium / Low | [module if available] |

**Do not miss any rule** — every requirement must be in the inventory.

---

## Step 2 — Analyze coverage by 12 groups

For each Rule ID, check which groups the current TC file has covered:

| # | Group | Description | Required? |
|---|---|---|---|
| 1 | Happy path | Main flow works correctly with valid data | All ACs |
| 2 | Negative / Invalid input | Wrong data, missing data, wrong format | ACs with input |
| 3 | Boundary Value | Boundary values (min, max, min-1, max+1) | ACs with numeric values |
| 4 | Authorization | Correct role permissions, blocks incorrect roles | ACs involving auth |
| 5 | Error handling | System errors, timeout, network errors | ACs with external calls |
| 6 | State transition | Correct state changes in sequence | ACs with workflows |
| 7 | Regression | Existing features not affected | ACs changing core functionality |
| 8 | Performance | Response time, high load | ACs with SLA requirements |
| 9 | Data integrity | Data stored/processed correctly, no loss/corruption | ACs with data persistence |
| 10 | UI / UX | Displays correctly, responsive, basic a11y | ACs with interface |
| 11 | Integration / API | Contract between services, response schema | ACs with API calls |
| 12 | Edge case / Exploratory | Rare scenarios, special condition combinations | Depending on complexity |

---

## Table 1 — Coverage Map

Each row = 1 Rule ID/AC/BR from the requirements document.
Standard 15-column header (synchronized with references/tc-template.tsv) + 4 additional columns:

```
STT	Summary	Test Level	Precondition	Test Data	Step summary	Expected result	Priority	Story Linkages	Test Type	Smoke	Auto	Phụ thuộc TC	Teardown	Trace	Rule ID	Nhóm cover	Nhóm còn thiếu	Coverage score
```

Coverage score: `Full` (ALL applicable groups covered; stopping criterion met per covered group) / `Partial` (some applicable groups covered, ≥1 mandatory group missing or stopping criterion not met) / `Minimal` (< half of applicable groups covered)

---

## Table 2 — Gap Analysis (Per-rule)

For each Rule ID with a Coverage score of Partial or Minimal:

```
Rule ID	Missing groups	Gap description	Risk (Critical/High/Medium/Low)	Suggested additional TCs	Priority	Clarification questions
```

Risk: Critical = missing happy path/auth; High = missing negative/boundary; Medium = missing regression; Low = missing edge cases.

---

## Table 3 — Supplemental TCs

New TCs to fill gaps. Use the exact 15 standard columns + Note column:

```
STT	Summary	Test Level	Precondition	Test Data	Step summary	Expected result	Priority	Story Linkages	Test Type	Smoke	Auto	Phụ thuộc TC	Teardown	Trace	Note
```

Rules: STT continues from the end of the original file. Note: "Added from review {yyyy-mm-dd} — Gap: {missing group}".
Supplemental TCs must be merged into the main TSV before gate = Approved.

---

## Step 3 — Check quality of existing TCs

For each TC in the original file, check against shared-schema/testcase.schema.yaml:

| Criterion | Flag if failing |
|---|---|
| Summary ≥ 10 characters, clearly describes action + object | TC-XXX: Summary too short |
| Expected result is specific, does not contain "works correctly" / "success" | TC-XXX: Vague expected result |
| Trace field has a value mapping to an existing Rule ID | TC-XXX: Trace empty or incorrect |
| Priority is appropriate (P1 → Smoke=Yes) | TC-XXX: P1 but Smoke=No |
| Precondition is not empty (write None if there is none) | TC-XXX: Precondition empty |

List all TCs needing correction at the end of Table 2.

---

## Review Gate — Checklist must pass 100%

- [ ] Rule Inventory is complete — all AC/BR are in the list
- [ ] Every Rule ID has at least 1 TC mapped in the Coverage Map
- [ ] Trace field valid in all TCs — not empty, not pointing to non-existent IDs
- [ ] Happy path: ALL applicable Rule IDs have complete success-path TCs (every identified success scenario covered)
- [ ] Negative/Invalid input: ALL Rule IDs with input constraints covered across all 3 categories (missing required field, invalid format, BVA)
- [ ] Supplemental TCs from gap analysis merged into the main TSV file
- [ ] No TC has a vague Expected result (per forbidden_phrases in schema)
- [ ] Coverage score "Minimal" = 0 — no Rule ID is below the minimum level

**Gate result:**
- **Approved** → emit L2 sign-off request, proceed to skill 08 after QA Lead confirms
- **Not Approved** → list failing items, do not proceed

---

## Sign-off Request (L2) + Audit Log

Emit after completion — whether Approved or Not Approved:

```
---
⏳ SIGN-OFF REQUEST — 07-review-tc (Level 2 — QA Lead)
Reviewer: [team.qc_lead from qa-config]
SLA: 24 hours
Output: testing-output/test-cases/review/review-{sprint}-{date}.md
Gate verdict: Approved / Not Approved
Action: Reply "Approved" or "Needs revision: [details]"
---
```

Append to governance/audit-log.md:
```yaml
execution_record:
  id: "{yyyy-mm-dd}-{HHmm}-07-review"
  timestamp: "{yyyy-mm-ddTHH:mm}"
  skill: "07-review-tc"
  project: "{project.name}"
  sprint: "{project.sprint}"
  executor: "{executor}"
  input_summary: "TC file: {filename}, {N} AC/BR, {N} TC existing"
  output_paths:
    - "testing-output/test-cases/review/review-{sprint}-{date}.md"
    - "testing-output/test-cases/functional/supplemental-{sprint}-{date}.tsv"
  status: "DONE"
  requires_human_review: true
  reviewer: null
  reviewed_at: null
  sign_off_status: "PENDING"
```

---

## Save files

- Coverage Map + Gap Analysis: `testing-output/test-cases/review/review-{sprint}-{yyyy-mm-dd}.md`
- Supplemental TC: `testing-output/test-cases/functional/supplemental-{sprint}-{yyyy-mm-dd}.tsv`

## Definition of Done

- [ ] Rule Inventory is complete
- [ ] Coverage Map table (19 columns) is in the output
- [ ] Gap Analysis table with classified risks
- [ ] Supplemental TC table written and merged into the main TSV
- [ ] Gate verdict clearly stated: Approved / Not Approved
- [ ] Sign-off request emitted
- [ ] Audit log entry appended
