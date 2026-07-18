---
name: 07-review-tc
description: >
  Review and evaluate the quality of existing test cases: analyze coverage across 12 groups, complete rule inventory,
  identify gaps, propose supplemental TCs in the correct format. Gating skill — only approve when coverage is sufficient.
  Scope: manually written TCs, TCs received from external teams, TCs from previous sprints needing QA Lead sign-off.
  NOT for AI-generated TCs from skill 05 — those are reviewed inline via skill 05's embedded R1/R2/R3 pipeline.
  Trigger: review existing testcases, evaluate TCs from previous sprint, manually written TCs, TCs received from other teams,
  coverage analysis of existing TC file, gap analysis of existing testcases, còn thiếu TC nào, bổ sung TC, gap TC.
  Output: Coverage Map + Gap Analysis + Supplemental TC + Review Gate verdict.
  Sign-off: Level 2 — QA Lead review required.
---

# Review Existing Testcases

> **Scope**: This skill is for **manually written TCs** or **TCs from external teams**. For AI-generated TCs produced by skill 05, coverage review is embedded in skill 05's Steps 3–6 (R1/R2/R3) — do not run skill 07 on top of those unless QA Lead sign-off is explicitly required by governance.

> **Output language:** → See SKILL.md output rules.

> **MANDATORY**: Read this entire skill BEFORE starting. Do not skip any step.

> **WHEN STARTING EXECUTION**: Announce clearly before any step:
> `▶ Executing skill 07-review-tc | File: {tc_filename} | Sprint: {sprint}`
> Do not skip any step. Do not write "Approved" when the checklist has not passed 100%.

## Read First

- Read `project/qa-config.yaml` if it exists.
- **MANDATORY**: read `evaluation/skill-quality-rubric.md` — specifically the "Skills 05-07" rubric (10-point scale). You will score the reviewed TC file against this rubric and include the score in the Review Gate output.
- **Channel-specific**: If TCs belong to a specific channel (Web UI / API / Mobile), read the corresponding section in `references/channel-tc-checklist.md` to add check items in Step 4. Skip if channel cannot be determined.
- **MANDATORY — read document images**: When receiving a requirement `.md` file, check whether a folder with the same name (without `.md`) exists in the same directory. If so, read all image files in that folder before starting the review. Images may contain sequence diagrams, flows, or UI mockups not present in text — missing them leads to incorrect gap analysis.
- **MANDATORY — self-detect which section each image belongs to**: For each image/diagram read, determine where it is referenced in the requirement `.md` file and map it to the nearest heading/section above the image. If the image is in a same-named folder but not directly referenced in `.md`, read the image title/content to map to a relevant section; if still cannot be determined, write `Diagram-Scope-Unknown` and add a clarification question. After mapping the section, if that section is in the review scope, include all flows, error branches, events, retry, rollback, DLQ, fail-closed, and state transitions from the image into the Rule Inventory/Coverage Map; do not silently skip any image.
- Governance gate: read `governance.mode` from `project/qa-config.yaml` (default if missing: `standard`):
  - `lightweight` → proceed automatically after self-review passes; still emit sign-off summary for audit trail.
  - `standard` → L2: QA Lead review required (SLA: 24h). Do not mark Approved until confirmed.
  - `enterprise` → L2 + L3: QA Lead + Stakeholder review required (SLA: 48h).
  → See `governance/sign-off-gates.md` for exact reviewer, SLA, and request format.

## Mandatory output when running the skill

- **Output language**: The entire review report, gap analysis, supplemental TC, sign-off request, and chat summary must be written in Vietnamese with diacritical marks. Only keep English for technical codes, system names, HTTP status codes, event names, endpoints, field names, error codes, and test type/priority keywords required by the tool.
- When the user requests "review test case", "đánh giá testcase", "coverage analysis" or equivalent, **do not only return a chat summary**.
- Must create full local artifacts:
  - `testing-output/test-cases/review/review-{module-or-sprint}-{yyyy-mm-dd}-{HHmm}.md`
  - `testing-output/test-cases/functional/supplemental-{module-or-sprint}-{yyyy-mm-dd}-{HHmm}.tsv` if there are gaps requiring supplemental TCs.
- The final chat response must only be a brief summary containing: output files, gate verdict, TC count, number of Critical/High gaps, and main blockers.
- Only return a chat summary without files if the user explicitly says "do not save files, quick review only" — but still note that this is not a full Skill 07 execution.

## Inputs

- Requirements document (US/AC/BR, each requirement has its own ID) — **required**
- Existing TC file (TSV, Excel, or Markdown; Functional or SIT) — **required**
- `qa-config.yaml` (if available → read `scope.modules` to group coverage by module)

If requirements document or TC file is missing → write `[Needs Supplement]`, list clarification questions, stop.

## Mandatory Workflow (in order)

> **SIT mode detection**: If the TC input file is in SIT format (header has `Final Result` or `Expected Result (B)`) → use **8 SIT groups** in Step 2 instead of 12 functional groups. Coverage Map and Gap Analysis also use SIT groups.

### Step 1 — Build Rule Inventory

Before reviewing TCs, create a Rule Inventory from the requirements document:

1. Read all AC/US/BR.
2. Assign IDs to each rule/AC/BR if not already present (AC-01, AC-02, BR-01...).
3. Read all Alternative Flows / Error Handling / Detailed Flow / sequence diagrams in the review scope.
4. Create separate Rule IDs for flows/rules not in Acceptance Criteria:
   - `ALT-01`, `ALT-02`... for Alternative Flow / Error Handling.
   - `FLOW-01`, `FLOW-02`... for step-by-step flow or use case flow.
   - `DIAG-01`, `DIAG-02`... for rules that appear only in images/sequence diagrams.
5. Do not treat images/diagrams as supplementary material. If an image is in the review scope, every error branch, event, retry, rollback, DLQ, fail-closed, and state transition in the image must be added to the Rule Inventory or Gap Analysis.

> **Note:** Many requirements documents do not number AC/BR separately. In such cases, assign sequential IDs (AC-1, AC-2...) in the order they appear in the document and clearly state in the review that these are AI-assigned reference labels, not IDs from the original document.

6. Create the inventory list:

| Rule ID | Short description | Type | Complexity | Module |
|---|---|---|---|---|
| AC-01 | [Rule description] | AC / BR / US | High / Medium / Low | [module if applicable] |

**Do not omit any rule** — every requirement must be in the inventory.

### Step 2 — Analyze coverage by 12 groups

For each Rule ID, check which of the 12 groups below are covered by the existing TC file:

| # | Group | Required? |
|---|---|---|
| 1 | Happy path — Main flow works correctly with valid data | Every AC |
| 2 | Negative / Invalid input — Wrong, missing, or malformed data | ACs with input |
| 3 | Boundary Value — Boundary values (min, max, min-1, max+1); EP invalid partition | ACs with numeric/length values |
| 4 | Authorization & Security — RBAC boundary (correct role/blocked role), multi-tenancy isolation, OWASP injection boundary | ACs involving auth/permissions |
| 5 | Error handling — System error, timeout, network error, service down | ACs with external calls |
| 6 | State transition — Correct state change sequence, entity lifecycle | ACs with workflow/state |
| 7 | Regression — Existing features not affected | ACs changing core behavior |
| 8 | Performance — Response time, high load, SLA | ACs with SLA |
| 9 | Data integrity — Data stored/processed correctly, idempotency, no loss/corruption | ACs with data persistence |
| 10 | UI / UX — Correct display, responsive, basic a11y | ACs with UI |
| 11 | Integration / API — Contract between services, response schema, E2E flow | ACs with API call / cross-service |
| 12 | Edge case / Exploratory — Rare scenarios, race conditions, special combinations | Depends on complexity |

**Scenario completeness check per group**: For each covered group, enumerate all distinct **(Precondition × Action × Expected Outcome)** combinations that exist in the requirement for that group. If any combination does not have a corresponding TC, flag as coverage gap — do not mark the group as "covered" just because ≥1 TC exists. Flag: `→ [Rule ID][G{n}]: uncovered scenario — Precondition: <X>, Action: <Y>, Expected: <Z>`. Gaps classified `High` risk if G1/G2/G4, `Medium` for G3/G5/G9/G11, `Low` for G7/G8/G10/G12.

**Skill 05 Type → Review group mapping**: → see **`references/tc-type-taxonomy.md`** (section "Type → Review group mapping").

**8 SIT groups (use as replacement in SIT mode):**

| # | SIT group | Required? | Stopping criterion |
|---|---|---|---|
| SIT-1 | Happy path — Successful E2E integration flow | Every business flow | Every identified business flow has a complete E2E TC from entry to final outcome across all involved systems |
| SIT-2 | API Contract — Schema, response structure, header, auth token | Every API call | Every API call boundary has a schema-contract TC; all required fields, types, and auth headers verified |
| SIT-3 | Failure scenarios — 4xx, 5xx, timeout, network partition | Every external call | Every external call enumerated; every distinct failure mode (timeout, 4xx, 5xx, network partition, malformed response) has a TC |
| SIT-4 | Retry & Idempotency — Retry with same key, no duplicate data | Flows with retry logic | Every retry-capable flow has a TC verifying idempotency key prevents duplicate processing |
| SIT-5 | Rollback / Compensating — Entity state after rollback is clear | Multi-step flows | Every multi-step saga has a TC verifying clean compensated state after each partial failure point |
| SIT-6 | Async Event — Queue/topic state, message consumed correctly | Flows with event/queue | Every event/queue interaction has TC verifying message produced correctly, consumed exactly once, and state reflects event |
| SIT-7 | Data Consistency — Integrity after API chain; eventual consistency | Multi-service flows | Every multi-service write chain has TC verifying data integrity across all affected data stores |
| SIT-8 | Compatibility — Backward compat, breaking change detection | When version changes | Every changed API/schema version has TC verifying existing consumers are unaffected |

### Step 3 — Create Coverage Map (Table 1)

Each row = 1 Rule ID/AC/BR from the requirements document.
Standard 16-column header (aligned with `references/tc-template.tsv`) + 4 additional columns:

```
STT	Summary	Test Level	Precondition	Test Data	Step summary	Expected result	Priority	Story Linkages	Test Type	Smoke	Auto	TC Dependencies	Component	Trace	Technique	Rule ID	Covered groups	Missing groups	Coverage score
```

Coverage score: `Full` (ALL applicable groups covered; stopping criterion met per covered group) / `Partial` (some applicable groups covered, ≥1 mandatory group missing or stopping criterion not met) / `Minimal` (< half of applicable groups covered)

### Step 4 — Check quality of existing TCs

For each TC in the original file, apply criteria C01–C11 from **`references/tc-step7-checklist.md`** (Skill 07 "Flag" column). Report each failure as `TC-XXX: [C-nn] <description>`.

**Additional check — Auth/Session module** (only applies when module is auth/login/session):

| Check | Flag if missing |
|---|---|
| TC for logout → session deleted, redirect to login? | `[AUTH-GAP] Missing TC: logout` |
| TC for refresh token → session extended without interrupt? | `[AUTH-GAP] Missing TC: refresh token` |
| TC for session idle timeout → expires per config? | `[AUTH-GAP] Missing TC: session timeout` |
| TC for concurrent session (2+ device/browser)? | `[AUTH-GAP] Missing TC: concurrent session` |
| TC for session isolation (logout on 1 device doesn't affect others)? | `[AUTH-GAP] Missing TC: session isolation` |

**Additional check — Security Input** (only applies when module has form input to IdP/auth):

| Check | Flag if missing |
|---|---|
| TC for SQL injection in username/password? | `[SEC-GAP] Missing TC: SQL injection` |
| TC for XSS payload in input field? | `[SEC-GAP] Missing TC: XSS` |
| TC for bruteforce/account lockout? | `[SEC-GAP] Missing TC: bruteforce protection` |

**Additional check — Real IdP / Multi-IdP** (only applies when qa-config has multiple IdP entries):

| Check | Flag if fail |
|---|---|
| Each IdP has at least 1 separate happy path TC? | `[IDP-GAP] IdP {name} has no login TC` |
| Test Data uses real accounts from qa-config (not generic `user@company.com`)? | `[IDP-GAP] TC {id}: Test Data uses generic account, not a real IdP account` |

**Additional check — Multi-layer auth** (only applies when module has a workflow-layer entry point: GitOps PR, UI wizard, CLI triggering a protected action):

| Check | Flag if missing |
|---|---|
| TC for entry-point auth rejection (CI / gateway / middleware layer)? | `[AUTH-GAP] Missing TC: entry-point layer auth` |
| TC for service API RBAC rejection (direct endpoint call)? | `[AUTH-GAP] Missing TC: service API RBAC layer` |
| TC for bypass path (direct API call skipping workflow layer also rejected)? | `[AUTH-GAP] Missing TC: bypass path direct API` |

**Additional check — Group 2 field validation** (only applies when ACs have field-input validation):

| Check | Flag if missing |
|---|---|
| TC for missing specific required field → field-specific error code? | `[NEG-GAP] Missing TC: missing required field` |
| TC for invalid format/characters in field value? | `[NEG-GAP] Missing TC: invalid format/characters` |
| TC for length BVA (max valid PASS; max+1 FAIL)? | `[NEG-GAP] Missing TC: length BVA` |

**Additional check — Duplicate TCs** (applies to all modules):

| Check | Flag if failing |
|---|---|
| No 2 TCs with same (Precondition × Action × Expected result) triple? | `[DEDUP-GAP] TC-{n} and TC-{m}: identical Precondition+Action+Outcome — merge into 1 TC or DataDriven` |
| DataDriven TCs merged only when: same precondition + same step sequence + different test data values? | `[DEDUP-GAP] TC-{n}: DataDriven merge invalid — preconditions differ; must be separate TCs` |
| No TC with vague "verify system works correctly" outcome that duplicates another TC's outcome at different granularity? | `[DEDUP-GAP] TC-{n}: outcome too generic — overlaps with TC-{m}; specify distinct assertion` |

**Additional check — Saga/multi-step flow** (only applies when module has a multi-step saga or provisioning flow with ≥3 sequential sub-steps):

| Check | Flag if failing |
|---|---|
| Different sub-step failures in separate TCs (not merged into 1)? | `[SAGA-GAP] Over-merged: TC-{n} covers multiple sub-step failures — split required` |
| Different infrastructure/network failure types in separate TCs? | `[SAGA-GAP] Infra variants merged: TC-{n} covers {failure-A+B} — split required` |

List all TCs that need fixing at the end of Table 2 — Gap Analysis.

### Step 5 — Gap Analysis (Table 2)

Scope: **every Rule ID with Coverage score `Partial` or `Minimal`**, plus every Rule ID (including `Full`) missing mandatory groups (1/2/4/6). List **1 separate row per missing group** — do not merge multiple groups into 1 row.

```
Rule ID	Missing groups	Gap description	Risk	Proposed supplemental TC	Priority	Clarification questions
```

**Mandatory groups** — always generate supplemental TCs if missing, regardless of coverage score:
- Group 1 (Happy path): every AC
- Group 2 (Negative/Invalid): every AC with input field
- Group 4 (Authorization): every AC involving permissions/roles
- Group 6 (State Transition): every AC with workflow, state flow, or session

Risk: `Critical` = missing group 1/4; `High` = missing group 2/6/11; `Medium` = missing group 3/5/9; `Low` = missing group 7/8/10/12.

### Step 6 — Supplemental TC (Table 3)

New TCs to fill gaps. **Generate ≥1 TC for each gap row in Step 5** (1 missing group = 1 TC). Do not skip any gap with Risk ≥ `Medium`. Gaps with Risk `Low` may be skipped only with documented risk acceptance and QA Lead sign-off — not automatically by TC count.

Use exactly 16 standard columns + Note column:

```
STT	Summary	Test Level	Precondition	Test Data	Step summary	Expected result	Priority	Story Linkages	Test Type	Smoke	Auto	TC Dependencies	Component	Trace	Technique	Note
```

Rules:
- STT continues from the last STT in the original file.
- Note: `"Added from review {yyyy-mm-dd} — Gap: [Rule ID][Group]"`.
- Priority: mapped from Risk — `Critical`→`High`; `High`→`High`; `Medium`→`Medium`; `Low`→`Low`.
- Auto: `Y` by default; `N` only when subjective UX, hardware, Visual Builder drag-drop UI, race conditions hard to reproduce in CI/CD, or Exploratory — when `N` must write short reason in Trace column.
- Supplemental TCs must be merged into the main TSV before gate = `Approved`.

## Review Gate — Checklist must pass 100%

- [ ] Rule Inventory complete — all AC/BR are in the list
- [ ] Every Rule ID has at least 1 TC mapped in Coverage Map
- [ ] Trace field valid in all TCs — not empty, not pointing to non-existent IDs
- [ ] Happy path: ALL applicable Rule IDs have complete success-path TCs (every identified success scenario covered)
- [ ] Negative/Invalid input: ALL Rule IDs with input constraints covered across all 3 categories (missing required field, invalid format, BVA)
- [ ] Supplemental TCs from gap analysis merged into main TSV file
- [ ] No TCs with vague Expected result
- [ ] **No duplicate TCs** — 0 pairs with identical (Precondition × Action × Expected result); all DEDUP-GAP flags resolved
- [ ] **Scenario completeness** — every distinct (Precondition × Action × Expected Outcome) combination in the requirement has a corresponding TC; no uncovered scenario combinations remain from Step 2 depth check
- [ ] Coverage score "Minimal" = 0 — no Rule ID below minimum level
- [ ] **Priority uses `High`/`Medium`/`Low` — no P1/P2/P3 in file**
- [ ] **When Priority = `High` → Smoke = `Y`; exceptions must have reason `HighPriority-NoSmoke: <reason>` in Trace**
- [ ] **Auto ≥80% of whole file; every Auto=N has a reason in Trace column**
- [ ] **ET rows present at end of file; STT are consecutive integers from last scripted TC; all 6 SFDPOT dimensions explored; 1 ET row per identified risk area; no count target**
- [ ] **Type semantic correctness — no TCs using wrong Type (Reliability≠Neg; Impact≠Corner)**
- [ ] **BR/AC ID accuracy — every `[AC-n]`/`[BR-n]` tag in Summary and Trace maps to an actual ID in Rule Inventory**
- [ ] **Technique column (column 16) has valid values in all TCs — not empty**
- [ ] **Rubric score ≥7/10** — score against `evaluation/skill-quality-rubric.md` Skills 05-07 rubric; report `Rubric: X/10 (Completeness: X, Format: X, Accuracy: X, Actionability: X)`. Score < 7 blocks Approved.
- [ ] **Validator passes** — if workspace contains `tools/validate_skill_package.py`, run `python tools/validate_skill_package.py --strict-schema`; any `ERROR` output blocks Approved.

**Gate result:**
- **Approved** → emit sign-off request at the governance level from `qa-config.yaml` (`governance.mode`); proceed to skill 08 after approval.
- **Not Approved** → list failing items (including rubric dimension scores if rubric fails), do not proceed.

## Sign-off Request (L2)

Emit after completion — whether Approved or Not Approved:

```
---
⏳ SIGN-OFF REQUEST — 07-review-tc (Level 2 — QA Lead)
Reviewer: [team.qc_lead from qa-config]
SLA: 24 hours
Output: testing-output/test-cases/review/review-{module-or-sprint}-{yyyy-mm-dd}-{HHmm}.md
Gate verdict: Approved / Not Approved
Action: Reply "Approved" or "Needs revision: [details]"
---
```

Append to `governance/audit-log.md`:
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
    - "testing-output/test-cases/review/review-{module-or-sprint}-{yyyy-mm-dd}-{HHmm}.md"
    - "testing-output/test-cases/functional/supplemental-{module-or-sprint}-{yyyy-mm-dd}-{HHmm}.tsv"
  status: "DONE"
  requires_human_review: true
  reviewer: null
  reviewed_at: null
  sign_off_status: "PENDING"
```

## File save path

- Coverage Map + Gap Analysis: `testing-output/test-cases/review/review-{module-or-sprint}-{yyyy-mm-dd}-{HHmm}.md`
- Supplemental TC: `testing-output/test-cases/functional/supplemental-{module-or-sprint}-{yyyy-mm-dd}-{HHmm}.tsv`
→ Prefer `output_paths.test_cases.review` from qa-config if available.

## Completion Status

| Status | Condition |
|---|---|
| `DONE` | Coverage Map + Gap Analysis + Supplemental TC + gate verdict + sign-off emitted |
| `BLOCKED` | Missing requirements document or TC file cannot be read |
| `NEEDS_CONTEXT` | AC/BR insufficient to evaluate coverage — list clarification questions |

## Checklist before DONE

- [ ] Rule Inventory complete
- [ ] Coverage Map table (20 columns) in output
- [ ] Gap Analysis table with classified risks
- [ ] Supplemental TC table (16 columns + Note) written and merged into main TSV
- [ ] Gate verdict clear: `Approved` or `Not Approved`
- [ ] No P1/P2/P3 in the reviewed TC file
- [ ] Auto ≥80% and every Auto=N has a reason
- [ ] ET rows ≥2 at end of file with consecutive integer STT
- [ ] Type semantic correctness: no TCs using wrong Type
- [ ] BR/AC ID accuracy: every tag maps to an actual ID in Rule Inventory
- [ ] Technique column has valid values in all TCs
- [ ] Sign-off request emitted
- [ ] Execution record appended to `governance/audit-log.md`
- [ ] `project/session-state.yaml` updated → `last_execution`, `pending_sign_offs`

## Stop Conditions

- Required input is missing and cannot be inferred from existing artifacts.
- Task requires external publishing but governance approval is not present.
- Action is outside the scope of this skill.
