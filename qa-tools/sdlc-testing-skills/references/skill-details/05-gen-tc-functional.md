---
name: 05-gen-tc-functional
description: >
  Generate complete functional test cases covering 12 groups per IEEE 29119 / ISTQB standards
  from AC, BR, User Story. Trigger: write testcase, gen TC, create functional test case,
  design testcase, functional test case. Mandatory output: exactly 1 main TSV file with a Test Level column.
  R1/R2/R3 coverage review is an internal step to add missing TCs before exporting the final TSV.
---

# Functional Testcase Generation

## Supplemental Details for Skill 05

### DataDriven Example — email field

BEFORE (6 separate TCs): TC-n [Happy], TC-n+1 [Neg] empty, TC-n+2 [Neg] wrong format, TC-n+3 [Corner] 255 chars, TC-n+4 [Corner] 256 chars, TC-n+5 [Auth] role_A/role_B

AFTER (2 DataDriven TCs):
- TC-n [Happy]: valid email → 200 (Smoke=Y)
- TC-n+1 [Neg]: Test Data: ""; "notanemail"; "@domain.com"; "a"×256+"@test.com" → HTTP 400 (Technique=EP+BVA)
- TC-n+2 [Auth]: role_A→allow; role_B→deny (Technique=DT)

### Field Validation 3-category rule (Group 2)

For ACs with field/parameter input, Group 2 must cover all 3 categories:

| Category | Test | Error type |
|---|---|---|
| Missing required field | Specific required field absent from request | `MISSING_REQUIRED_FIELD` / HTTP 400 |
| Invalid format / characters | Disallowed chars or wrong pattern in field value | `INVALID_FORMAT` / `SCHEMA_ERROR` |
| Length BVA | N chars → PASS; N+1 chars → FAIL | `SCHEMA_ERROR` (max length exceeded) |
| Injection (free-text fields only) | SQL injection + command injection payload → rejected | `SCHEMA_ERROR` or HTTP 400; no execution |

DataDriven-merge across categories only if they all return the same error code. Otherwise keep as separate rows.

### Auto=N Exception List

Auto=N ONLY when:
- Subjective UX evaluation (colors, layout, experience)
- Physical devices, hardware, uncontrollable environments
- Exploratory TCs (always N)
- Complex race conditions difficult to reproduce in CI/CD
- Complex manual drag-and-drop on Visual Builder UI
- Framework/tool not yet ready → record `Manual-Pending-Auto` in Trace (temporary)

### Priority Guidance

- High: main flow (happy path, basic flow), security critical, data integrity — must pass before release
- Medium: boundary, EP, integration, state transition, regression — must pass within the sprint
- Low: exploratory, rare edge cases, cosmetic UX, secondary BVA

### TC Order (full)

Determine the requirement type before ordering — pick exactly one:

**Type A — Flow/Saga/Diagram-driven** (requirement has a sequence diagram or step-by-step flow with ≥4 sequential steps across multiple services/systems):
→ Order TCs by **flow step top-to-bottom following the diagram**. Each step/node in the diagram forms one TC group:
  - Happy + state TCs for that step → first in the group
  - Error paths / ALT paths for that step → immediately below, in the same group
  - Goal: reviewer scans the diagram top-to-bottom and finds the corresponding TC immediately — no jumping between AC sections

**Type B — Feature/AC-list driven** (no sequence diagram; ACs are independent behaviors):
→ Order by AC: AC-1 → AC-2 → ...; within each AC: Happy → Neg → Auth → State → Corner

**Both types** — after all flow steps / individual ACs:
- E2E / Impact — full flow and cross-module
- Regression
- Exploratory — **always at end of file**

DataDriven cross-AC TCs: place after the last related flow step / AC.

### Pre-DONE Checklist (full)

#### Format & Structure
- [ ] Correct directory `testing-output/test-cases/functional/` or path override from qa-config
- [ ] Filename matches pattern: `tc-{module}-{sprint}-{HHmmss}.tsv`
- [ ] TSV file starts with the header row on line 1 — **no `#` comment rows**
- [ ] Exactly 16 columns; each data row has exactly **16 tab-separated values** — `Test Level` and `Technique` are not empty
- [ ] STT is consecutive integers; Priority `High`/`Medium`/`Low`; Smoke/Auto `Y`/`N`; Test Level lowercase

#### Coverage
- [ ] Rule Inventory built — every Rule ID is covered or noted N/A + reason
- [ ] All 12 test groups present (Checklist-Based may be N/A if no checklist exists)
- [ ] All cross-feature impact scenarios identified have `[Impact]` TCs; if fewer than 2 exist, verify whether only 1 (or 0) cross-feature impact was genuinely identified — **do not** merge `[Impact]` with `[Corner]`
- [ ] Non-Functional TCs present: Security (OWASP), Performance (SLA), Reliability
- [ ] R1/R2/R3 fully executed, all gaps merged into the main TSV
- [ ] Execution record appended to `governance/audit-log.md`
- [ ] `project/session-state.yaml` updated → `last_execution`

---

> **MANDATORY**: Read this entire skill BEFORE generating any TC. Do not skip any step.
> Output that has not gone through all 12 groups + R1/R2/R3 + Rule Inventory is **invalid**.

## Read before starting

- Read `project/qa-config.yaml` if it exists to get project code, module, output path, domain rules.
- Read `governance/GOVERNANCE.md` before finalizing or publishing.
- Governance gate: `L1` — no QA Lead review required before proceeding.
- **MANDATORY** read `references/tc-template.tsv` to get the standard format (16 columns). Summary format: `[US-ID][AC-n][Type] Verify...` — see the **Type taxonomy** table in the "Format output TSV" section. Test techniques (EP, BVA, DT...) go in the `Technique` column (column 16), **not** in the Summary. Do not infer the format independently — the template is the only correct source.
- **MANDATORY read document images**: When reading a requirement `.md` file, check if there is a folder with the same name (without `.md`) in the same directory. If there is → read all image files in that folder before analysis. Images may contain diagrams, flows, or UI mockups not present in the text.
- **DO NOT** read all references from the start; only read when needed to verify a specific edge case.

## Inputs

- AC / User Story (mandatory)
- BR — Business Rules (if available)
- Team checklist (if available)
- Environment information (if available)
- HLTC outline from Skill 04 (optional, preferred when available)

## Rules for input from HLTC

- If no HLTC → generate TCs directly from AC / BR / User Story.
- If HLTC exists → TCs may only be generated when the HLTC file records `Gate result: Approved`.
- Do not use an "Approved" status that only exists in chat — must read the HLTC file to confirm.
- If HLTC is not yet Approved: update the HLTC file first, then generate TCs.
- Every branch in the Approved HLTC must have TCs fully covering it — no branches may be omitted. For each branch, generate additional more detailed cases including edge cases, boundary values, and negative variants per the 12 test groups in Step 2. TC count per branch follows technique application — a simple branch may need 3 TCs; a branch with state machine + multi-role auth may need 15. No ratio target.


## Mandatory workflow (in order)

### Step 0 — Check for existing TC files

Before generating new TCs:
1. Check `testing-output/test-cases/functional/` for existing TC files for this module/sprint.
2. If already exists → read that file, understand the structure, add to it rather than creating a duplicate.
3. If not yet exists → continue with the steps below.

### Step 1 — Build Rule Inventory (MANDATORY before generating TCs)

Extract all Rule IDs from the requirements document. Create a table:

| Rule ID | Brief description | Covered STT | Status | Group | Gap |
|---|---|---|---|---|---|
| AC-01 | ... | | Not covered | | |

Rules:
- Cannot be DONE if any Rule has: no TC mapping (Covered STT is empty), or no explicit `N/A + reason` if not applicable.
- Each Rule must have TCs covering ALL distinct (State × Input → Outcome) triples it implies. The Covered STT column lists ALL TCs for that Rule — not just 1. A Rule with only 1 happy-path TC is not done if error paths, pre-condition variants, or enforcement scenarios also exist for that Rule.

### Step 2 — Generate draft TSV (12 mandatory groups + Exploratory)

Create TCs covering all 12 of the following groups + Exploratory section at the end. No applicable group may be omitted:

| # | Group | Coverage guidance |
|---|---|---|
| 1 | **Happy path** | **How:** Read each AC line by line; each (condition → expected success outcome) pair = 1 scenario. List all scenarios before writing any TC. **Done when:** Every identified success scenario has a TC — no AC success path without one. |
| 2 | **Negative / Invalid** | **How:** Per field: identify invalid classes — (a) missing required field, (b) wrong format/characters, (c) BVA max+1 fail. Free-text field: add injection class. List all classes before writing. **Done when:** Every invalid class per field has a representative TC. DataDriven when same error code across classes in same field. → Detail: "Field Validation 3-cat" below. |
| 3 | **DataDriven Consolidation** *(step, not TC group)* | **How:** After G1+G2 TCs drafted — group by (Precondition × Steps × OutcomeType). Mark merge candidates. Apply merges. **Done when:** All merge candidates consolidated. Output: `"G3: N TCs merged into M DataDriven TCs."` No new TCs generated. Mark `Applied ✓` in coverage matrix. |
| 4 | **Authorization boundary** | **How:** Build (role × action) matrix from RBAC spec. Mark each cell: Permitted / Denied / N/A. Multi-layer: repeat per auth layer. **Done when:** Every non-N/A cell covered. DataDriven for denied roles with identical error response. |
| 5 | **Error handling / Failure** | **How:** From sequence diagram: list every external call; per call enumerate distinct failure modes (timeout, 4xx, 5xx, network partition, partial response, malformed response). **Done when:** Every listed failure mode has TC. DataDriven only when same failure → identical error code AND identical recovery path. |
| 6 | **State transition** | **How:** Draw state diagram. List all transitions (From-state, Event, To-state) — valid and invalid. **Done when:** 100% transition coverage — every valid transition exercised AND every invalid transition asserts rejection. |
| 7 | **Integration / E2E** | **How:** List all distinct business scenarios; list all integration points with defined schemas. **Done when:** Every scenario has E2E TC. Every schema-bound integration point has contract TC. |
| 8 | **Non-Functional** | **How:** List SLA-bound operations; list OWASP-applicable surfaces. **Done when:** Every SLA operation has Perf TC. Every OWASP surface has Security TC. |
| 9 | **Data integrity** | **How:** Per AC that writes data: list each field written + each constraint + idempotency requirement. **Done when:** Every field verified for correct persistence. Every constraint verified. Every idempotency requirement tested with duplicate call. G9 ≠ G1 write-success. |
| 10 | **Regression** | **How:** List shared resources (DB tables, API endpoints, events, state entities). Per resource: identify other features/flows using same resource. **Done when:** Every identified adjacent flow has spot-check TC. |
| 11 | **UI/UX** | **How:** List all distinct UI states (loading, success, error per type, empty, disabled); list accessibility-critical interactions. **Done when:** Every listed UI state has TC. Every accessibility-critical interaction verified. `N/A` if API-only with reason. |
| 12 | **Edge / Corner** | **How:** Per resource/operation: ask "concurrent access?" and "unexpected retry?" List identified scenarios. **Done when:** Every identified race condition and idempotency-at-concurrency scenario has TC. |
| ET | **Exploratory Testing** | **How:** Apply **SFDPOT** — **S**tructure, **F**unction, **D**ata, **P**latform, **O**perations, **T**ime. Per dimension: list identified risk areas. Write 1 ET row per risk area. **Done when:** All 6 SFDPOT dimensions explored; no new risk areas surface. Count follows analysis — no target. |

**ET rows format**: Test Type=`Exploratory`, Priority=`Low`, Smoke/Auto=`N`, Test Data=`—`. STT: sequential from last scripted TC. Each row targets a distinct risk area — do not merge. Typical SFDPOT-driven vectors:

| SFDPOT dimension | Focus | Example targets |
|---|---|---|
| **D**ata | Malformed or unexpected input | UTF-16, null bytes, Unicode IDs, empty payload, 5MB+ file, duplicate keys |
| **O**perations | Multiple actors or rapid sequential ops | Concurrent submissions, rapid state transitions |
| **F**unction + **T**ime | Failures and timing anomalies | Stuck PENDING states, orphaned resources, timeout-at-specific-step |
| **S**tructure | Component interaction anomalies | Unexpected internal routing, missing middleware call |
| **P**latform | Environment variations | OS, browser, network condition differences |

Summary format: `[Module][Exploratory] <goal>` — no "Charter:" prefix.

**TC order in output file (mandatory):**
Groups 1–12 are used for internal coverage analysis. When exporting the final TSV file, **reorder as follows**:

1. Each AC in order AC-1 → AC-2 → ... Within each AC: `Happy` → `Neg` → `Auth` → `State` → `Corner`
2. `Impact` — cross-feature, after all individual ACs
3. `E2E` / BasicFlow — full flow with multiple ACs, actors
4. `Security` / `Perf` / `Reliability` — Non-Functional
5. `Regression`
6. `Exploratory` — **always last**

TCs belonging to multiple ACs (DecisionTable, cross-AC): place after the last related AC.

**Group 3 — DataDriven merging rules**: merge multiple data combinations into 1 TC, list them in the Test Data column (use `\n` or `;` as separators), do not create multiple TCs with identical logic. Do NOT merge: Happy path (keep Smoke=Y separate), Security (different steps), State transition (different preconditions). Sub-step failures in a saga (each failure point has a different precondition — set of completed steps differs → 1 TC per sub-step). Infrastructure failure variants within the same ALT (network-A fail ≠ network-B fail — different fault signatures, different preconditions → separate TCs).

**Group 4 — Multi-layer Auth TCs**: When the system enforces auth at multiple layers, create 1 TC per layer:

| Layer | What to test | Typical error |
|---|---|---|
| Entry-point (CI / gateway / middleware) | Unauthorized actor rejected before reaching service | `CI_PURPOSE_NOT_AUTHORIZED`, `GATEWAY_401` |
| Service API (RBAC endpoint) | Unauthorized role rejected inside the service | `HTTP 403 PERMISSION_DENIED` |
| Bypass path (direct API call) | Direct call skipping workflow layer also rejected | Same as Service API layer |

Rule: If entry-point + service API both exist → ≥2 separate Auth TCs. If direct bypass path exists → +1 TC.

**Group 8 — Non-Functional minimum**:
- Security: authentication boundary, authorization (RBAC), multi-tenancy isolation, relevant OWASP Top 10 (SSRF, injection, broken access control)
- Performance: latency SLA (p95), throughput, graceful degradation
- Reliability: retry with idempotency key, rollback, heartbeat

### Step 3 — Internal coverage verification before export (DO NOT include in output)

Create a draft AC × Group table:
- Has TC → write TC STT
- No TC but applicable → **add TC immediately, do not skip**
- Not applicable → write `N/A + reason`

### Step 4 — R1: Internal coverage map (DO NOT export to file)

```
Requirement code | Requirement description | TCs covered | Status | Test groups covered | Notes
```

### Step 5 — R2: Internal gap analysis (DO NOT export to file)

```
Requirement code | Missing groups | Gap description | Suggested additional TCs | Priority | Clarification questions
```

### Step 6 — R3: Additional TCs from gaps (DO NOT export as separate file)

```
STT | Summary | Test Level | Precondition | Test Data | Step summary | Expected result | Priority | Story Linkages | Test Type | Smoke | Auto | Phụ thuộc TC | Component | Trace | Technique | Note
```

- STT continues from the main TSV.
- `Note` column: write `GAP: [Requirement code] - [Group]` (same pattern as Skill 07 supplemental TCs).
- `Trace` column: write Rule ID (e.g., `AC-01`).
- **After R3: merge these TCs into the main TSV** — do not keep R3 as a separate file. The `Note` column is dropped on merge; GAP info is retained in `Trace`.

### Step 7 — Mandatory self-review (DO NOT skip)

Before saving the file, scan every TC in the TSV and check against the following table. Every TC that fails must be fixed immediately — do not export a file with errors:

| Criterion | Action when failing |
|---|---|
| Priority uses `High`/`Medium`/`Low` — do not use P1/P2/P3 | Change to correct format |
| When Priority = `High` → Smoke = `Y` | Fix Smoke = Y or lower Priority to Medium |
| Auto ≥80% of all TCs; every `Auto = N` has a reason in the Trace column | Set Auto = Y if TC can be asserted; if keeping N, write the reason |
| Expected result does not contain vague phrases: "works correctly", "success", "displays normally" | Rewrite specifically: HTTP code, field value, entity state |
| Trace field is not empty and maps to a Rule ID that exists in Rule Inventory | Add Trace or fix incorrect Rule ID |
| Test Data does not contain placeholders: `[valid data]`, `[any value]`, `...` | Fill in specific values |
| `Component` column (column 14) is not empty | Fill `{ProjectAbbr}-{FeatureFolder}` |
| ≥2 ET rows at the end of the file with sequential integer STTs, Test Type=Exploratory, Auto=N | Add ET rows if missing |
| `Technique` column (column 16) has a valid value from the taxonomy table for every row — must not be empty | Fill `—` if no special technique applies |
| TC order: Happy → Neg → Corner per AC; Impact; E2E; Security/Perf/Reliability; Regression; Exploratory last | Reorder before saving the final file |

Self-review result: **briefly list the number of TCs fixed and which issues** (e.g.: "Fixed 3 TCs Priority P1→High, 1 TC vague Expected result"). If no violations, write "Self-review: OK — no violations found".

### Step 8 — Finalize and save main TSV

Merge R3 into the main TSV. Verify the entire checklist before reporting DONE.

## Format output TSV

Mandatory header (16 columns, in order):
```
STT	Summary	Test Level	Precondition	Test Data	Step summary	Expected result	Priority	Story Linkages	Test Type	Smoke	Auto	Phụ thuộc TC	Component	Trace	Technique
```

### Type taxonomy — valid values for `[Type]` in Summary

| Type | When to use |
|---|---|
| `Happy` | Valid input, main success flow |
| `Neg` | Erroneous input, invalid conditions, system rejection |
| `Corner` | Edge/boundary **within** the feature: BVA, EP, EG, race condition, idempotency |
| `Impact` | Effect **on** another feature/service: cascade, API contract, cross-module state |
| `E2E` | Full flow with multiple ACs, actors, services |
| `Security` | OWASP, JWT tamper, injection, broken auth, multi-tenancy boundary |
| `Perf` | Latency SLA, throughput, concurrent load |
| `Reliability` | Retry, fail-closed, DLQ, eventual consistency |
| `Regression` | Existing flows not affected by the new change |
| `Exploratory` | Free-form, unscripted — always last in file |

**Distinguishing Corner vs Impact:**
- `Corner`: edge condition of the feature under test itself (e.g.: JWT exp boundary, aud mismatch, double-submit)
- `Impact`: a state change in this feature that triggers a change in another feature/service (e.g.: role revoke → IAC-03 invalidate → re-auth)

### Technique column (column 16) — valid values

| Value | Meaning |
|---|---|
| `—` | Basic Happy/Neg, no special technique applies |
| `EP` | Equivalence Partitioning |
| `BVA` | Boundary Value Analysis |
| `DT` | Decision Table |
| `ST` | State Transition |
| `EG` | Error Guessing |
| `Idem` | Idempotency |
| `Race` | Race condition / concurrency |
| `DataDriven` | Multiple data combinations grouped in 1 TC |
| `Security` | OWASP, injection, auth bypass, multi-tenancy |
| `Perf` | Latency SLA, throughput |
| `Reliability` | Retry, DLQ, fail-closed |

### Mandatory format rules

| Column | Valid values | Rules |
|---|---|---|
| STT | Sequential integers: `1`, `2`, `3`... (including ET rows) | Do not use `TC-001`; ET rows continue STT from last |
| Summary | `[US-ID][AC-n][Type] Verify...` | Type from taxonomy above; do not put Technique here |
| Test Level | `component` / `integration` / `e2e` | Lowercase; do not use `unit` |
| Priority | `High` / `Medium` / `Low` | Do not use `P1/P2/P3` |
| Smoke | `Y` / `N` | Do not use `Yes/No` |
| Auto | `Y` / `N` | Default `Y`; only `N` when in the exception list below |
| Test Data | Specific data | Do not use `[valid data]` or placeholders |
| Expected result | Specific, verifiable result | Not vague |
| Component | `{ProjectAbbr}-{FeatureFolder}` | Must not be empty |
| Technique | Value from Technique table above | `—` if no special technique applies |

**Priority guidelines:**
- `High`: main flows (happy path, basic flow), security critical, data integrity — must pass before release
- `Medium`: boundary, EP, integration, state transition, regression — needs to pass within the sprint
- `Low`: exploratory, rarely occurring edge cases, UX cosmetic, secondary BVA

**Auto rules — default `Y`, target ≥80% of all TCs:**

`Auto = Y` when TC has:
- Clearly defined input/output (API, form field, response body)
- Specific expected result that can be asserted by code
- Does not depend on subjective judgment by the tester

`Auto = N` **only** in one of the following cases:
- TC requires subjective evaluation of UX, color, layout, experience
- TC depends on a physical device, hardware, or uncontrollable environment
- TC is Exploratory (always `N`)
- TC tests complex race conditions that are difficult to reproduce consistently in CI/CD
- TC requires complex manual interaction on a Visual Builder drag-and-drop UI for which no automation framework is available

When setting `Auto = N`, write a brief reason in the `Trace` column (e.g.: `Manual-UX`, `Manual-VB-DragDrop`, `Manual-HW`).

**Default Test Level:**
- Full functional flow, multiple services → `e2e`
- Single-point logic, one screen/endpoint, few dependencies → `component`
- Integration of 2–3 services → `integration`

**Smoke = Y** only when: TC is independent, has no TC dependencies, and has a short execution time.

**TSV separator**: use only `|` single pipe — never use `\|`.

**Language**: → See SKILL.md output rules. Narrative content (test steps, expected results, descriptions) in Vietnamese with diacritics; keep technical codes in English (IDs, endpoints, field names, status codes, HTTP methods, system keywords).

### File save path

`testing-output/test-cases/functional/tc-{module}-{sprint}-{HHmmss}.tsv`
→ Prefer `output_paths.test_cases.functional` from qa-config if available.
→ `{HHmmss}` = current time — avoids filename collisions when multiple QCs run the skill simultaneously.

### Mandatory constraints when writing TSV files

- **DO NOT add comment lines (`#`) at the top of the TSV file** — the file must begin with the header row on line 1. Comment metadata about the HLTC source should only be written in chat, not in the file.
- **The `Test Level` column MUST have a value** on every data row (`e2e` / `integration` / `component`) — must not be empty, must not be omitted. The TSV file must have exactly 15 tab-separated values on every data row. If `Test Level` is missing, all subsequent columns will be shifted by 1 position and the file cannot be uploaded to QMetry.

## 14 Mandatory Principles

1. Missing AC or Basic Flow → write `[To be added]`, stop, do not infer on your own.
2. TSV uses only `|` (single pipe), never use `\|`.
3. Data-Driven: merge into 1 TC, list data combinations in the Test Data column, do not create TCs with duplicate logic.
4. `Component` column (column 14) must not be empty — fill `{ProjectAbbr}-{FeatureFolder}`.
5. `Smoke = Y` only when TC is independent and has a short execution time.
6. Do not create duplicate TCs with the same content even if they have different names.
7. Expected result must be specific and verifiable — not vague.
8. Test Data must be specific — do not use placeholders like `[valid data]`.
9. TCs must be compatible with Robot Framework if automation is required.
10. Always run the full flow: generate draft TSV → R1/R2/R3 → fill gaps → then DONE. Do not stop after draft TSV.
11. Cannot be DONE if R1/R2/R3 still has gaps not yet merged into the main TSV.
12. TC content in English; keep technical codes in English.
13. Check for existing TC files before creating a new one — avoid creating duplicate files.
14. Priority = `High`/`Medium`/`Low`; Auto default `Y` — only `N` for subjective UX, hardware, Visual Builder drag-drop, difficult-to-reproduce race conditions, or Exploratory; target Auto ≥80% of all TCs; ET rows continue STT sequentially, at the end of the file.

## Outputs

- Exactly 1 main TSV file `tc-*.tsv`
- Do not generate separate R1/R2/R3 files — all review results must be merged into the main TSV

## Completion Status

| Status | Condition |
|---|---|
| `DONE` | TSV correct format + R1/R2/R3 has no unmerged gaps + Rule Inventory complete |
| `DONE_WITH_CONCERNS` | TSV is complete but there are still assumptions or points needing BA confirmation |
| `BLOCKED` | Missing AC or Basic Flow; or HLTC does not record `Gate result: Approved` in the file |
| `NEEDS_CONTEXT` | AC/BR insufficient to generate or cross-check — list clarification questions |

## Pre-DONE Checklist

### Format
- [ ] Correct directory `testing-output/test-cases/functional/` or path override from qa-config
- [ ] Filename matches pattern: `tc-{module}-{sprint}-{HHmmss}.tsv`
- [ ] TSV file begins with header row on line 1 — **no `#` comment lines**
- [ ] Exactly 16 columns per standard header, including `Test Level` and `Technique` columns
- [ ] Each data row has exactly **16 tab-separated values** — `Test Level` and `Technique` must not be empty
- [ ] STT uses sequential integers throughout the file including ET rows — do not use `TC-001` or text labels
- [ ] Priority uses `High`/`Medium`/`Low` — do not use P1/P2/P3
- [ ] Smoke/Auto use `Y`/`N`, Test Level lowercase (`component`/`integration`/`e2e`)
- [ ] Auto = `Y` for ≥80% of TCs; every `Auto = N` has a brief reason in Trace column (test techniques go in the `Technique` column, not in Trace)
- [ ] ≥2 Exploratory Testing rows at end of file: sequential STT, Test Type=Exploratory, Auto=N
- [ ] `Technique` column (column 16) filled for every row, using values from taxonomy — `—` if not applicable
- [ ] TC order correct: Happy→Neg→Corner per AC; Impact; E2E; Security/Perf/Reliability; Regression; Exploratory last

### Coverage
- [ ] Rule Inventory built — every Rule ID covered or marked N/A + reason
- [ ] All 12 mandatory test groups covered (Checklist-Based may be N/A if no checklist in input)
- [ ] ≥2 TCs `[Impact]` for cross-feature (cascade, API contract, retry/rollback) — **not** grouped with `[Corner]`
- [ ] Non-Functional TCs present: Security (OWASP), Performance (SLA), Reliability

### Quality gates
- [ ] Full R1/R2/R3 completed, all gaps merged into main TSV
- [ ] No separate coverage review output files
- [ ] `Component` column (column 14) filled for every TC — format `{ProjectAbbr}-{FeatureFolder}`
- [ ] No placeholders in Test Data or Expected result
- [ ] Execution record appended to `governance/audit-log.md`
- [ ] `project/session-state.yaml` updated → `last_execution`, `sprint_progress.tc_total`

## Stop Conditions

- Required input is missing and cannot be inferred from existing artifacts.
- Task requires publishing externally but governance approval has not been obtained.
- Action is outside the scope of this skill.
