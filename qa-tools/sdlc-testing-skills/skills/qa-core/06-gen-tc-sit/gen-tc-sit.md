---
name: 06-gen-tc-sit
description: >
  Generate test cases for System Integration Testing (SIT) focused on integration flows, API contracts,
  retry/rollback, async events, and service dependencies. Trigger: SIT, integration test,
  integration testing, API contract test, service integration, cross-module flow.
  Mandatory output: 18-column SIT table grouped by functional cluster (nhóm nghiệp vụ) + coverage review R1/R2/R3 + merge supplementary TCs from R3
  into the main table. Must not terminate early. Test Summary is plain Vietnamese description — no US/AC tags.
---

# SIT Testcase Generation

> **Output language:** → See SKILL.md output rules.

> **MANDATORY**: Read this entire skill BEFORE generating any TC. Do not skip any step.

> **WHEN STARTING**: Announce clearly before each step:
> `▶ Executing skill 06-gen-tc-sit | Module: {module} | Sprint: {sprint} | Input: {brief description}`
> Do not skip any step. Do not terminate early before completing R1/R2/R3 and the self-review in Step 5.

## Difference from Skill 05 (gen-tc-functional)

This skill does **not** generate single-function test cases — refer to Skill 05 if needed.
It focuses entirely on:
- End-to-end flows across multiple services/modules
- API contracts and schema validation
- Error scenarios: timeout, 4xx, 5xx, network partition
- Retry logic and idempotency at the integration layer
- Rollback / compensating transactions
- Async events: message queues, webhooks, event-driven flows
- Data consistency after a full API chain completes

## Read First

- Read `project/qa-config.yaml` if it exists.
- Governance gate: L1 — auto-complete; no QA Lead review required.
- **By channel**: If the SIT flow involves Web UI / API / Mobile, read the corresponding section in `references/channel-tc-checklist.md` to add additional checks. Skip if the channel cannot be determined.
- **MANDATORY — read document images**: When reading a requirement `.md` file, check whether a directory with the same name (without `.md`) exists in the same folder. If so, read all image files in that directory before analysis. Images may contain diagrams, flows, or UI mockups not present in the text.
- **MANDATORY**: read `evaluation/skill-quality-rubric.md` — specifically the "Skill 06 (SIT)" rubric section. Use this rubric in Step 5 to self-score the output.

## Inputs

- API spec / sequence diagram / service dependency map (required)
- HLTC outline from Skill 04 (recommended when available)
- qa-config.yaml (if available)

If the API spec or service dependency map is missing, write `[Needs supplement]` and stop.

## HLTC Input Rules

- If no HLTC is available, generate SIT TCs directly from the API spec, sequence diagram, and service dependency map.
- If an HLTC is available, only generate TCs when the HLTC file states `Gate result: Approved`.
- Do not treat an "Approved" status that only exists in chat as valid — read the HLTC file to confirm.
- If the HLTC has not been Approved: update the HLTC file first, then generate SIT TCs.
- If the HLTC and API spec/sequence diagram conflict: prioritize the latest spec and note the conflict in the output.

## Mandatory Workflow (in order)

### Step 1 — Map the Integration Topology

- Identify: systems, contracts, events, data handoffs, idempotency, retry, timeout, rollback, and monitoring points.
- Create a list of actual integration business flows (e.g., "Agent deploy flow", "Status sync flow").

### Step 2 — Draft the SIT Table (8 mandatory groups)

Classify TCs into 8 SIT groups:

| # | SIT Group | Coverage guidance |
|---|---|---|
| SIT-1 | **Happy path** | **How:** List all distinct business flows from the spec/diagram. For each flow, write TC covering entry-to-final-outcome across all involved systems. **Done when:** EVERY business flow has a complete E2E TC — no identified flow without one. |
| SIT-2 | **API Contract** | **How:** List every API call boundary from the integration map. Per call: verify schema (required fields, types, nesting), response structure, headers, auth token presence and validity. **Done when:** Every API call boundary has a contract TC; all required fields, types, and auth headers verified. |
| SIT-3 | **Failure scenarios** | **How:** From sequence diagram, list every external service call. Per call: enumerate distinct failure modes (timeout, 4xx, 5xx, network partition, malformed response). **Done when:** Every external call listed; every distinct failure mode has a TC. DataDriven only when same failure type produces identical error code AND identical recovery path. |
| SIT-4 | **Retry & Idempotency** | **How:** Per retry-capable flow: identify idempotency key. Write TC submitting duplicate call with same key, verifying no duplicate side-effect. **Done when:** Every retry-capable flow has TC verifying idempotency key prevents duplicate processing. `N/A` if no retry mechanism with reason. |
| SIT-5 | **Rollback / Compensating** | **How:** Per multi-step saga: identify each partial failure point. For each point, write TC verifying rollback leaves all entities in consistent clean state (no orphan records, no partial state). **Done when:** Every partial failure point has TC; every affected entity's post-rollback state verified. `N/A` if no multi-step saga with reason. |
| SIT-6 | **Async Event** | **How:** Per event/queue interaction: identify produced event, queue/topic state, consumed event, and expected outcome. Write TC verifying message produced correctly, consumed exactly once, and resulting system state reflects the event. **Done when:** Every event/queue interaction TC-covered; message delivery and state outcome verified. `N/A` if no event/queue with reason. |
| SIT-7 | **Data Consistency** | **How:** Per multi-service write chain: identify all data stores updated. Write TC verifying integrity across all stores after chain completes; include eventual-consistency check delay if relevant. **Done when:** Every multi-service write chain has TC verifying data integrity across all affected data stores. |
| SIT-8 | **Compatibility** | **How:** Per changed API/schema version: list existing consumers. Write TC verifying consumer behavior unaffected by the change. **Done when:** Every changed API/schema version has TC verifying existing consumers unaffected. `N/A` if no version change with reason. |

**Exploratory Testing (SIT)**: Apply **SFDPOT** focused on integration-relevant dimensions — **O**perations (multiple concurrent actors, rapid sequential calls), **T**ime (timing anomalies, delayed events, orphaned states), **F**unction (integration behavior under unexpected sequences). Per dimension: list identified risk areas. Write 1 ET row per risk area. Priority=`Low`, Automation Level=`Manual`. STT continues from last row. **Done when:** O, T, F dimensions all explored; no new risk areas surface. No count target.

### Step 3 — Internal Coverage Verification (DO NOT output externally)

Create a draft **Business Flow × SIT Group** matrix:

| Business Flow | SIT-1 | SIT-2 | SIT-3 | SIT-4 | SIT-5 | SIT-6 | SIT-7 | SIT-8 |
|---|---|---|---|---|---|---|---|---|
| [Flow name 1] | ? | ? | ? | ? | ? | ? | ? | ? |

- TC already exists → write TC ID
- No TC yet but applicable → **add TC immediately**
- Not applicable → write `N/A + reason`

Only output the SIT table once coverage has been confirmed and no cells remain unhandled.

### Step 4 — Coverage Review R1/R2/R3 (DO NOT output separate files)

Run 3 internal review rounds:

After each round, output 1 summary line:
- `R1 complete: {N} business flows covered, {N} partially covered.`
- `R2 complete: {N} gaps found — [SIT group missing per flow].`
- `R3 complete: {N} TCs added (rows {start}–{end}).`

**R1 — Coverage map:**
```
Business Flow | Related API/Event | TCs covered | Status | SIT Groups covered | Notes
```

**R2 — Gap analysis:**
```
Business Flow | Missing groups | Gap description | Proposed supplementary TCs | Priority | Clarification questions
```

**R3 — Supplementary TCs from gaps:**
```
No | Testcase ID | Test Summary | Precondition | Test Data | Steps | {Hệ thống A} Expected Result | {Hệ thống A} Actual Result | {Hệ thống A} Test Result | {Hệ thống B} Expected Result | {Hệ thống B} Actual Result | {Hệ thống B} Test Result | Final Result | Priority | ID Bugs | Link evidence | Màn hình test | Thời gian test | Note
```
- `Note` column: write `GAP: [Flow] - [SIT Group]`
- `Test Summary`: plain Vietnamese description — same style as main table, no `[TL:]` tags.
- **After R3: merge these TCs into the main SIT table** — do not keep R3 as a separate file. Drop the `Note` column on merge.

### Step 5 — Self Quality Review (MUST NOT be skipped)

Before saving the file, scan all TCs and verify:

→ Apply criteria from **`references/tc-step7-checklist.md`** (Skill 05 "fix" column) where applicable to SIT format.

| Criterion | Action if not met |
|---|---|
| Test Summary format `[TL:level][US-ID][AC-n][Type] Description...` | Rewrite to correct format |
| Priority uses `High`/`Medium`/`Low` — do not use P1/P2/P3 | Convert to correct format |
| Expected Result (A) and/or (B) is specific — must not contain vague phrases like "success", "works correctly" | Rewrite with HTTP code, field values, entity states |
| Test Data contains no placeholders such as `[valid data]`, `[any value]` | Fill in specific, realistic values |
| Rollback TCs clearly state entity state after rollback (Expected Result must not be empty) | Add final entity state |

Write a brief result: number of TCs corrected and types of issues found, or "Self-review: OK".

### Step 6 — Finalize and Save the SIT Table

## SIT Output Format (18 columns)

**Row 1 — Group header:** Replace `{Hệ thống A}` and `{Hệ thống B}` with actual system names from the integration context (e.g., "Checkout Service", "Payment Gateway").
```
						{Hệ thống A}			{Hệ thống B}
```

**Row 2 — Data header:**
```
No	Testcase ID	Test Summary	Precondition	Test Data	Steps	{Hệ thống A} Expected Result	{Hệ thống A} Actual Result	{Hệ thống A} Test Result	{Hệ thống B} Expected Result	{Hệ thống B} Actual Result	{Hệ thống B} Test Result	Final Result	Priority	ID Bugs	Link evidence	Màn hình test	Thời gian test
```

**Section/subsection rows (Nhóm nghiệp vụ):**
- Add a business group row: `1. Luồng thanh toán thành công`, `2. Xử lý lỗi gateway`
- Fill only the `No` column; leave all other columns empty.
- **Group by functional cluster (nhóm nghiệp vụ) — do NOT group by User Story or AC.**

### Column Fill Rules

| Column | Rule |
|---|---|
| `No` | Sequential number within section: `1`, `2`, `3`... |
| `Testcase ID` | Format `{MODULE}_{FEATURE}_{N}` — e.g., `OMP_PAY_1`, `INQ_OI_1`. Do not use US-xxx format. |
| `Test Summary` | Plain Vietnamese description of the integration scenario. Describe WHAT the integration flow does, which systems interact, and what outcome is expected. Do NOT use `[TL:level][US-ID][AC-n]` tags. Example: `Verify Checkout gọi Payment Gateway thành công và trừ số dư ví sau khi nhận callback SUCCESS` |
| `Test Data` | Specific data — no placeholders |
| `{Hệ thống A} Expected Result` | Caller-side: expected result visible at the upstream system (UI, API Gateway, upstream service) |
| `{Hệ thống B} Expected Result` | Receiver-side: expected result visible at the downstream system (middleware, downstream service) |
| `Final Result`, `ID Bugs`, `Link evidence`, `Màn hình test`, `Thời gian test` | Leave empty when creating new TCs |
| `Priority` | `High` / `Medium` / `Low` |

**Each TC must have at least 1 expected result** in system A or B column. If verifying both sides, fill in both.

**For async flows**: clearly describe the required queue/topic state in Precondition.

**For rollback**: Expected result must clearly state the final state of each affected entity.

## 7 Mandatory Rules

1. Missing API spec or service dependency map → write `[Needs supplement]`, stop.
2. Do not generate single-function test cases — refer to Skill 05 if needed.
3. Expected result for rollback must clearly state the final state of each entity.
4. R1/R2/R3 are internal steps — do not output separate review files; output only 1 SIT file after ensuring full coverage.
5. TC content is written in Vietnamese with diacritics; keep technical codes in English (endpoint, status code, field name).
6. Group TCs by business flow/integration flow, not purely by technical type.
7. Distinguish `[Corner]` (edge within 1 service) from `[Impact]` (cascade to another service) — **do not merge them**.

## File Save Path

`testing-output/test-cases/sit/sit-{module}-{sprint}-{HHmmss}.tsv`
→ Prefer `output_paths.test_cases.sit` from qa-config if available.
→ `{HHmmss}` = current time — avoids filename collisions when multiple QCs run the skill simultaneously.

## Completion Status

| Status | Condition |
|---|---|
| `DONE` | 19-column SIT table in correct format + R1/R2/R3 with no unmerged gaps |
| `BLOCKED` | Missing API spec, missing sequence diagram, or unclear service dependency |
| `NEEDS_CONTEXT` | API spec, flow description, or SLA timeout threshold needs to be provided |

## Checklist before DONE

- [ ] File saved to `testing-output/test-cases/sit/` or the override path from qa-config
- [ ] Filename matches pattern: `sit-{module}-{sprint}-{HHmmss}.tsv`
- [ ] 18-column SIT table with correct group header format (system names replace generic {Hệ thống A/B})
- [ ] All 8 SIT groups (SIT-1 through SIT-8) are covered; non-applicable groups marked N/A + reason
- [ ] R1/R2/R3 have been run — all gaps merged into the main table
- [ ] No separate R1/R2/R3 output files
- [ ] Expected results for rollback / compensating transactions clearly state the final state of each entity
- [ ] Execution record added to `governance/audit-log.md`
- [ ] `project/session-state.yaml` updated → `last_execution`
- [ ] **Rubric score ≥7/10** — score against `evaluation/skill-quality-rubric.md` Skill 06 rubric; report `Rubric: X/10`. Score < 7 blocks DONE.

## Stop Conditions

- Required inputs are missing and cannot be inferred from existing artifacts.
- The task requires external publication but governance approval has not been obtained.
- The action is outside the scope of this skill.
