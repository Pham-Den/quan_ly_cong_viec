---
name: 06-gen-tc-sit
description: >
  Generate integration test cases (SIT) focused on integration flows, API contracts,
  retry/rollback, async events, and service dependencies. Trigger: SIT, integration test,
  integration testing, API contract test, service integration, cross-module flow.
  Mandatory output: SIT table with 19 columns + R1/R2/R3 coverage review + merge supplemental TCs from R3
  into the main table. Must not terminate early.
---

# SIT Testcase Generation

> **MANDATORY**: Read this entire skill BEFORE generating any TC. Do not skip any step.

## Differences from Skill 05 (gen-tc-functional)

This skill does **not** generate standalone functional TCs (refer to Skill 05 if needed).
Focuses entirely on:
- End-to-end flows spanning multiple services/modules
- API contracts and schema validation
- Failure scenarios: timeout, 4xx, 5xx, network partition
- Retry logic and idempotency at the integration layer
- Rollback / compensating transactions
- Async events: message queues, webhooks, event-driven flows
- Data consistency after completing an API chain

## Read before starting

- Read `project/qa-config.yaml` if it exists.
- Read `governance/GOVERNANCE.md` before finalizing.
- Governance gate: `L1` — no QA Lead review required before proceeding.
- **MANDATORY read document images**: When reading a requirement `.md` file, check if there is a folder with the same name (without `.md`) in the same directory. If there is → read all image files in that folder before analysis. Images may contain diagrams, flows, or UI mockups not present in the text.

## Inputs

- API spec / sequence diagram / service dependency map (mandatory)
- HLTC outline from Skill 04 (recommended when available)
- qa-config.yaml (if available)

If API spec or service dependency map is missing → write `[To be added]`, stop.

## Rules for input from HLTC

- If no HLTC → generate SIT TCs directly from API spec, sequence diagram, service dependency map.
- If HLTC exists → TCs may only be generated when the HLTC file records `Gate result: Approved`.
- Do not use an "Approved" status that only exists in chat — must read the HLTC file to confirm.
- If HLTC is not yet Approved: update the HLTC file first, then generate SIT TCs.
- If HLTC and API spec/sequence diagram contradict each other: prioritize the latest spec, note the contradiction in the output.

## Mandatory workflow (in order)

### Step 1 — Map integration topology

- Identify: systems, contracts, events, data handoff, idempotency, retry, timeout, rollback, monitoring points.
- Create a list of actual business integration flows (e.g.: "Agent deployment flow", "Status sync flow").

### Step 2 — Generate draft SIT table (8 mandatory groups)

Classify TCs into the 8 SIT groups:

| # | SIT Group | Coverage guidance |
|---|---|---|
| SIT-1 | **Happy path** | **How:** List all distinct business flows from the spec/diagram. For each flow, write TC covering entry-to-final-outcome across all involved systems. **Done when:** EVERY business flow has a complete E2E TC — no identified flow without one. |
| SIT-2 | **API Contract** | **How:** List every API call boundary from the integration map. Per call: verify schema (required fields, types, nesting), response structure, headers, auth token presence and validity. **Done when:** Every API call boundary has a contract TC; all required fields, types, and auth headers verified. |
| SIT-3 | **Failure scenarios** | **How:** From sequence diagram, list every external service call. Per call: enumerate distinct failure modes (timeout, 4xx, 5xx, network partition, malformed response). **Done when:** Every external call listed; every distinct failure mode has a TC. DataDriven only when same failure produces identical error code AND identical recovery path. |
| SIT-4 | **Retry & Idempotency** | **How:** Per retry-capable flow: identify idempotency key. Write TC submitting duplicate call with same key, verifying no duplicate side-effect. **Done when:** Every retry-capable flow has TC verifying idempotency key prevents duplicate processing. `N/A` if no retry mechanism with reason. |
| SIT-5 | **Rollback / Compensating** | **How:** Per multi-step saga: identify each partial failure point. For each point, write TC verifying rollback leaves all entities in consistent clean state (no orphan records, no partial state). **Done when:** Every partial failure point has TC; every affected entity's post-rollback state verified. `N/A` if no multi-step saga with reason. |
| SIT-6 | **Async Event** | **How:** Per event/queue interaction: identify produced event, queue/topic state, consumed event, and expected outcome. Write TC verifying message produced correctly, consumed exactly once, and resulting state reflects the event. **Done when:** Every event/queue interaction TC-covered; message delivery and state outcome verified. `N/A` if no event/queue with reason. |
| SIT-7 | **Data Consistency** | **How:** Per multi-service write chain: identify all data stores updated. Write TC verifying integrity across all stores after chain completes; include eventual-consistency check delay if relevant. **Done when:** Every multi-service write chain has TC verifying data integrity across all affected data stores. |
| SIT-8 | **Compatibility** | **How:** Per changed API/schema version: list existing consumers. Write TC verifying consumer behavior unaffected by the change. **Done when:** Every changed API/schema version has TC verifying existing consumers unaffected. `N/A` if no version change with reason. |

### Step 3 — Internal coverage verification (DO NOT include in output)

Create a draft **Business flow × SIT Group** table:

| Business flow | SIT-1 | SIT-2 | SIT-3 | SIT-4 | SIT-5 | SIT-6 | SIT-7 | SIT-8 |
|---|---|---|---|---|---|---|---|---|
| [Flow name 1] | ? | ? | ? | ? | ? | ? | ? | ? |

- Has TC → write TC ID
- No TC but applicable → **add TC immediately**
- Not applicable → write `N/A + reason`

Only export the SIT table when coverage is confirmed sufficient, with no blank cells left unhandled.

### Step 4 — R1/R2/R3 coverage review (DO NOT export as separate files)

Run 3 internal review passes:

**R1 — Coverage map:**
```
Business flow | Related APIs/Events | TCs covered | Status | SIT groups covered | Notes
```

**R2 — Gap analysis:**
```
Business flow | Missing groups | Gap description | Suggested additional TCs | Priority | Clarification questions
```

**R3 — Supplemental TCs from gaps:**
```
No | Testcase ID | Test Summary | Precondition | Test Data | Steps | Expected Result (A) | Actual Result (A) | Test Result (A) | Expected Result (B) | Actual Result (B) | Test Result (B) | Final Result | Priority | ID Bugs | Link evidence | Màn hình test | Thời gian test | Automation Level | Note
```
- `Note` column: write `GAP: [Flow] - [SIT Group]`
- **After R3: merge these TCs into the main SIT table** — do not keep R3 separate.

### Step 5 — Finalize and save the SIT table

## Format output SIT (19 columns)

**Row 1 — Group header:**
```
						Hệ thống A			Hệ thống B
```

**Row 2 — Data header:**
```
No	Testcase ID	Test Summary	Precondition	Test Data	Steps	Expected Result	Actual Result	Test Result	Expected Result	Actual Result	Test Result	Final Result	Priority	ID Bugs	Link evidence	Màn hình test	Thời gian test	Automation Level
```

**Section/subsection rows:**
- Insert business group rows: `1. Valid query`, `1.1. Account exists`
- Fill only the `No` column; leave all other columns empty.

### Rules for each column

| Column | Rules |
|---|---|
| `No` | Sequential number within section: `1`, `2`, `3`... |
| `Testcase ID` | Static text like `INQ_OI_1`; or Excel formula if user requests |
| `Test Summary` | Format: `[TL:{level}][US-ID][AC-n][Type] Description...` — `[Type]` uses the same taxonomy as functional TCs: `Happy`/`Neg`/`Corner`/`Impact`/`E2E`/`Security`/`Perf`/`Reliability`. Example: `[TL:integration][IAC-01][AC-2][Impact] Verify Kafka fail → async retry...` |
| `Test Data` | Specific data — do not use placeholders |
| `Expected Result (A)` | Calling system side: UI, API Gateway, upstream system |
| `Expected Result (B)` | Receiving system side: middleware, downstream service |
| `Final Result`, `ID Bugs`, `Link evidence`, `Màn hình test`, `Thời gian test` | Leave empty when generating new |
| `Automation Level` | `integration` by default; `e2e` when verifying across multiple systems end-to-end |
| `Priority` | `High` / `Medium` / `Low` |

**Test Level in Test Summary:**
- `[TL:integration]`: standard SIT flow (2–3 services)
- `[TL:e2e]`: end-to-end across multiple systems from entry point to final result
- Do not use `unit`
- Prefer `automation_rules.test_level_policy.mapping_rules` from qa-config if available.

**Each TC must have at least 1 expected result** in cluster A or B. If verifying both sides → fill in both.

**For async flows**: clearly describe in Precondition the required queue/topic state.

**For rollback**: Expected result must clearly state the final state of each affected entity.

## 6 Mandatory Principles

1. Missing API spec or service dependency map → write `[To be added]`, stop.
2. Do not generate standalone functional TCs — refer to Skill 05 if needed.
3. Rollback expected results must clearly state the final state of each entity.
4. R1/R2/R3 are internal steps — do not export separate review files; only export 1 SIT file after ensuring sufficient coverage.
5. TC content in English; keep technical codes in English (endpoint, status code, field name).
6. Prioritize grouping TCs by business flow/integration flow, not purely by technique type.
7. Distinguish `[Corner]` (edge condition within 1 service) and `[Impact]` (cascade to another service) — **do not** group them together.

## File save path

`testing-output/test-cases/sit/sit-{module}-{sprint}.tsv`
→ Prefer `output_paths.test_cases.sit` from qa-config if available.

## Completion Status

| Status | Condition |
|---|---|
| `DONE` | SIT table with 19 columns in correct format + R1/R2/R3 has no unmerged gaps |
| `BLOCKED` | Missing API spec, missing sequence diagram, or service dependencies are unclear |
| `NEEDS_CONTEXT` | Need to add API spec, flow description, or SLA timeout threshold |

## Pre-DONE Checklist

- [ ] File saved to `testing-output/test-cases/sit/` or path override from qa-config
- [ ] Filename follows pattern: `sit-{module}-{sprint}.tsv`
- [ ] SIT table with 19 columns and correctly formatted group header
- [ ] All 8 SIT groups covered (SIT-1 to SIT-8); unapplicable groups marked N/A + reason
- [ ] R1/R2/R3 completed — all gaps merged into main table
- [ ] No separate R1/R2/R3 output files
- [ ] Teardown / rollback expected results are complete
- [ ] Execution record appended to `governance/audit-log.md`
- [ ] `project/session-state.yaml` updated → `last_execution`

## Stop Conditions

- Required input is missing and cannot be inferred from existing artifacts.
- Task requires publishing externally but governance approval has not been obtained.
- Action is outside the scope of this skill.
