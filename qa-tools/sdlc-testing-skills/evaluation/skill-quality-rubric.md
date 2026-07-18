# Skill Output Quality Rubric

Rubric for evaluating the output quality of each skill. Used for:
1. QA Lead reviewing output before approving (L2/L3 gates)
2. Monthly audits to detect AI drift
3. Benchmarking quality by sprint

---

## Scoring framework — 4 dimensions (10 points total)

| Dimension | Max | Description |
|---|---|---|
| Completeness | 3 | All mandatory sections of the skill are present |
| Format compliance | 3 | Correct format (headers, tables, TSV columns, field names) |
| Accuracy | 2 | Consistent logic, numbers add up, traces are correct |
| Actionability | 2 | Output is specific enough to act on immediately, no follow-up questions needed |

**Score scale:**
- 9–10: Excellent — enterprise quality
- 7–8: Good — minor issues, acceptable
- 5–6: Acceptable — notable gaps, requires manual fix
- 3–4: Poor — major rework needed
- 0–2: Failed — output is unusable

**Gate threshold**: Score ≥7 is required before marking DONE. Half-point scores are valid (e.g., 6.5 does NOT pass the ≥7 threshold — round down for gate evaluation).

---

## Rubric by skill

### Skills 01–03 (Requirements Review + Test Plan)

#### Part A — Objective gates (AI self-check)
AI can reliably evaluate these criteria automatically:

| Criterion | Pass | Fail |
|---|---|---|
| All mandatory sections per skill spec present | ✓ | Any mandatory section missing |
| Traceability IDs present on every row/item | ✓ | Any row/item missing an ID |
| File naming follows convention | ✓ | File name deviates from convention |
| TSV/MD headers match required schema | ✓ | Any header missing or renamed |
| No placeholder or template-literal text left in output | ✓ | Any `{placeholder}` or `[TBD]` found |

**Part A gate**: All criteria must pass before marking DONE. Any failure → fix immediately.

#### Part B — Advisory (human confirmation recommended)
AI evaluation here is unreliable due to domain blind spots and confirmation bias:

| Criterion | Advisory check |
|---|---|
| BA/Dev can act on the output immediately without follow-up questions | QA Lead reads output end-to-end |
| Effort/time estimates are reasonable for the scope described | QA Lead judgment against sprint history |
| No contradictions between sections (e.g., scope vs. risk, acceptance criteria vs. test approach) | QA Lead cross-checks key sections |
| Secondary sections are meaningful, not boilerplate filler | QA Lead spot-check 2–3 sections |

**Part B advisory**: AI self-reports a score (1–5) on each dimension. QA Lead confirms or overrides. Does NOT block DONE automatically — only blocks if QA Lead explicitly flags.

---

### Skill 05 / Skill 07 (Functional TC Generation + Review)

#### Part A — Objective gates (AI self-check)
AI can reliably evaluate these criteria automatically:

| Criterion | Pass | Fail |
|---|---|---|
| All 12 TC groups present (or N/A with reason) | ✓ | Missing a group with no N/A |
| All 16 columns present in every data row | ✓ | Any row has fewer than 16 columns |
| No vague Expected results (forbidden phrases absent) | ✓ | Any forbidden phrase found |
| No placeholder Test Data | ✓ | Any `[valid data]` or `[any value]` found |
| Priority = High/Medium/Low (no P1/P2/P3) | ✓ | Any P1/P2/P3 found |
| Smoke = Y when Priority = High (or HighPriority-NoSmoke in Trace) | ✓ | High Priority + Smoke=N + no reason |
| Auto ≥ 80% file-wide | ✓ | < 80% |
| ET rows present at end of file; all 6 SFDPOT dimensions explored; 1 row per identified risk area | ✓ | No ET rows, or SFDPOT dimensions not documented |
| Trace not empty on any row | ✓ | Any empty Trace |
| Component not empty on any row | ✓ | Any empty Component |

**Part A gate**: All criteria must pass before marking DONE. Any failure → fix immediately.

#### Part B — Advisory (human confirmation recommended)
AI evaluation here is unreliable due to domain blind spots and confirmation bias:

| Criterion | Advisory check |
|---|---|
| Expected results accurate for the domain (correct status codes, entity states, field values) | QA Lead spot-check 20% of TCs |
| Test steps are executable without ambiguity | QA Lead reads 3 random TCs end-to-end |
| Test Data reflects real system constraints (field lengths, formats, valid ranges) | QA Lead compares with actual API spec |
| Coverage is proportional to risk (high-risk ACs have more TCs) | QA Lead judgment |
| No duplicate TCs with different names | QA Lead spot-check |

**Part B advisory**: AI self-reports a score (1–5) on each dimension. QA Lead confirms or overrides. Does NOT block DONE automatically — only blocks if QA Lead explicitly flags.

> **Note on TC count**: TC count is not a quality metric — coverage completeness is. A file with 15 well-designed TCs covering all distinct triples is higher quality than a file with 60 TCs with overlapping coverage. Do not flag low count as a defect; flag uncovered scenarios instead.

---

### Skill 06 (SIT — System Integration Test)

#### Part A — Objective gates (AI self-check)
AI can reliably evaluate these criteria automatically:

| Criterion | Pass | Fail |
|---|---|---|
| All 8 SIT groups present (SIT-1 to SIT-8) | ✓ | Any SIT group missing with no N/A reason |
| All 19 columns present in every data row | ✓ | Any row has fewer than 19 columns |
| Group header rows formatted correctly | ✓ | Any group header missing or malformed |
| R1/R2/R3 gap rows merged correctly | ✓ | Any unmerged gap row |
| Rollback states explicit on every applicable row (not "success" or similar vague text) | ✓ | Any rollback state left vague |
| No placeholder Test Data | ✓ | Any `[valid data]`, `[any value]`, or similar found |
| Every business flow has complete E2E TC covering all involved systems from entry to final outcome | ✓ | Any mapped business flow without a complete E2E TC |
| Trace not empty on any row | ✓ | Any empty Trace |

**Part A gate**: All criteria must pass before marking DONE. Any failure → fix immediately.

#### Part B — Advisory (human confirmation recommended)
AI evaluation here is unreliable due to domain blind spots and confirmation bias:

| Criterion | Advisory check |
|---|---|
| Expected Result (A) and (B) are accurate for the actual integrated services (correct states, response codes, side-effects) | QA Lead or integration engineer spot-check 20% of TCs |
| Integration engineer can execute steps without needing to look up additional documentation | QA Lead reads 3 random TCs end-to-end |
| Test Data respects real service constraints (token formats, payload limits, valid entity IDs) | QA Lead compares with API/service spec |
| Coverage is proportional to integration risk (critical flows have more TCs and rollback paths) | QA Lead judgment |

**Part B advisory**: AI self-reports a score (1–5) on each dimension. QA Lead confirms or overrides. Does NOT block DONE automatically — only blocks if QA Lead explicitly flags.

---

### Skills 09–10 (Daily + Sprint Report)

#### Part A — Objective gates (AI self-check)
AI can reliably evaluate these criteria automatically:

| Criterion | Pass | Fail |
|---|---|---|
| Daily: triage section, health score, and sprint snapshot all present | ✓ | Any of the three sections missing |
| Sprint: all 5 required report items present | ✓ | Any required item missing |
| Markdown + HTML follow template structure | ✓ | Template structure missing or significantly deviated |
| YAML improvement_snapshot is syntactically valid | ✓ | Invalid YAML syntax |
| Numbers add up: pass + fail + blocked = total (no arithmetic error) | ✓ | Any numerical inconsistency |
| Health score formula applied correctly | ✓ | Health score inconsistent with underlying numbers |
| Every action item has an assignee and a deadline | ✓ | Any action item missing assignee or deadline |

**Part A gate**: All criteria must pass before marking DONE. Any failure → fix immediately.

#### Part B — Advisory (human confirmation recommended)
AI evaluation here is unreliable due to domain blind spots and confirmation bias:

| Criterion | Advisory check |
|---|---|
| Action items are specific enough for the assignee to act without follow-up questions | QA Lead reads all action items |
| Health score rating (Green/Yellow/Red) is reasonable given the sprint context | QA Lead judgment against sprint history |
| Trend interpretation (Up/Down/Stable) is accurate relative to previous sprint data | QA Lead cross-checks with prior report |
| Risk items reflect actual project risks, not generic filler | QA Lead spot-check |

**Part B advisory**: AI self-reports a score (1–5) on each dimension. QA Lead confirms or overrides. Does NOT block DONE automatically — only blocks if QA Lead explicitly flags.

---

### Skills 12–14 (UAT + Go/No-Go + Smoke)

#### Part A — Objective gates (AI self-check)
AI can reliably evaluate these criteria automatically:

| Criterion | Pass | Fail |
|---|---|---|
| All required gates evaluated (none skipped without explicit N/A reason) | ✓ | Any gate missing with no N/A |
| Decision line present and unambiguous (GO / NO-GO / STABLE / ROLLBACK) | ✓ | Decision absent or ambiguous |
| Gate pass/fail logic is consistent (no S1 open issue mapped to GO) | ✓ | Any S1 open → GO without override justification |
| Rollback trigger condition explicitly stated | ✓ | Rollback trigger absent or vague |
| Sign-off request present with named stakeholder(s) | ✓ | Sign-off section missing or unnamed |
| Audit log entry complete | ✓ | Audit log entry missing or incomplete |

**Part A gate**: All criteria must pass before marking DONE. Any failure → fix immediately.

#### Part B — Advisory (human confirmation recommended)
AI evaluation here is unreliable due to domain blind spots and confirmation bias:

| Criterion | Advisory check |
|---|---|
| Stakeholders can determine what to do immediately after reading (no follow-up meeting needed) | QA Lead reads decision section cold |
| Gate severity classifications are accurate for the actual defects logged | QA Lead spot-check defect list |
| Rollback steps are realistic and executable within the stated time window | QA Lead or release manager review |
| Risk summary reflects the actual release context, not generic language | QA Lead judgment |

**Part B advisory**: AI self-reports a score (1–5) on each dimension. QA Lead confirms or overrides. Does NOT block DONE automatically — only blocks if QA Lead explicitly flags.

---

## How to use the rubric

### Monthly audit (recommended on the 1st of each month):

1. Randomly select 3–5 outputs from the most recent sprint
2. Run the **Part A auto-gate** for each output: verify every objective criterion passes. Any failure is a hard defect — log it and trigger a fix before the output is counted as acceptable.
3. Run the **Part B advisory** checks: AI self-scores each dimension (1–5) and flags any dimension scoring ≤ 2 for QA Lead review. QA Lead confirms or overrides the AI scores.
4. Compare overall quality trend with the previous month.
5. Record in `evaluation/audit-history.md` (create if it does not exist).

### Red flags requiring immediate action:

| Signal | Threshold | Action |
|---|---|---|
| Average score drops for 2 consecutive months | Drop > 1 point | Review and update the relevant skill file |
| Part A gate failures appear as a pattern | Same criterion failing > 30% of outputs | Add checklist enforcement to the skill |
| Part B advisory score ≤ 2 on Actionability frequently | > 20% of outputs affected | Add examples to the skill file |
| Missing section appears as a pattern | Same section repeatedly omitted | Add checklist enforcement to the skill |

---

## audit-history.md template

```markdown
# Skill Quality Audit History

## {yyyy-mm} — {Month}

| Skill | Part A (pass/fail) | Part B score (1–5 each dim) | Notes | Sample output |
|---|---|---|---|---|
| 09-check-result | PASS | Completeness:5 Format:4 Accuracy:4 Actionability:3 | Action items vague | testing-output/reports/daily/daily-2026-05-01.md |
| 13-go-no-go | PASS | Completeness:5 Format:5 Accuracy:4 Actionability:4 | — | testing-output/reports/gate/go-no-go-Sprint12.md |

**Trend:** Up / Down / Stable vs. previous month
**Action items:**
- [ ] {action if any}
```
