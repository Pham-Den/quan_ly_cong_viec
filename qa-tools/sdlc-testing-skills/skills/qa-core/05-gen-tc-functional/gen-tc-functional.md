---
name: 05-gen-tc-functional
description: >
  Generate comprehensive functional test cases covering 12 groups per IEEE 29119 / ISTQB standard
  from AC, BR, User Story. Trigger: write testcase, gen TC, create functional test case,
  design testcase, test case functional. Mandatory output: exactly 1 main TSV file with a Test Level column.
  Coverage review R1/R2/R3 is an internal step to fill missing TCs before exporting the final TSV.
---

# Generate Functional Test Cases

> **Output language:** → See SKILL.md output rules.

> **MANDATORY**: Read this entire skill BEFORE creating any TC. Do not skip any step.
> Output that has not gone through all 12 groups + R1/R2/R3 + Rule Inventory is **invalid**.

> **WHEN STARTING EXECUTION**: Announce clearly before performing any step:
> `▶ Executing skill 05-gen-tc-functional | Module: {module} | Sprint: {sprint} | Input: {brief description}`
> Do not skip any step. Do not terminate early before completing R1/R2/R3 and self-review Step 7.

## Pre-read

- `project/qa-config.yaml` — project code, module, output path, domain rules.
- Governance gate: L1 — auto-complete; no QA Lead review required.
- **MANDATORY**: `references/tc-template.tsv` — standard 16-column format. Summary: `[US-ID][Flow-n][ALT-n][AC-n][Type] Verify...` — include only the IDs that apply (omit parts not applicable); Techniques go in column 16, not in Summary.
- **MANDATORY**: `evaluation/skill-quality-rubric.md` — "Skills 05-07" section; use in Step 7 self-score.
- **MANDATORY — images**: if a requirement `.md` has a same-name folder → read all images before analysis (diagrams, flows, UI mockups).
- **MANDATORY — sequence diagram**: if a sequence diagram is present, apply **Type A (flow-based ordering)** — see "TC Order (full)" in `references/skill-details/05-gen-tc-functional.md`.
- **MANDATORY — payload and mapping examples**: if the spec contains example payloads, data flow mappings, or field transform definitions (e.g., `output.summary → input.context`), parse field names and data types explicitly before Step 1. A field-name transform is a distinct behavioral contract from value propagation — register as a separate `[Implicit-Transform]` Rule ID, not merged into state-propagation TCs.
- **By channel**: read `references/channel-tc-checklist.md` section for `## Web UI`, `## API`, or `## Mobile` if applicable.
- **MANDATORY — output language**: Read the project `SKILL.md` output language rule before writing the first TC row. Wrong language = C03 violation.
- **DO NOT** load all references at start — only when needed.

## Input Data & HLTC Rules

Input: AC / User Story (required); BR, team checklist, environment info (if available); HLTC from Skill 04 (optional, preferred).

HLTC: no HLTC → create from AC/BR directly. HLTC available → only proceed when HLTC **file** records `Gate result: Approved` (chat-only not acceptable; update file if not yet Approved). All branches must be fully covered — TC count per branch follows technique application (a simple branch may need 3 TCs; a branch with state machine + multi-role auth may need 15). No ratio target.

## Mandatory Process (in order)

> **Meta-principle — Scenario completeness, not count gates**
> Every step below works by enumerating (System-state × Input → Expected-outcome) triples.
> For every triple that has no TC, create one — regardless of how many TCs that produces.
> "≥N" minimums in the groups below are floors for sparse ACs; they never cap coverage.
> A Rule ID is fully covered only when **every distinct triple it implies has a TC** — not when the TC count reaches a number.
> Apply this principle to both explicit ACs (Step 2) and implicit rules (Step 1).
> The applicable technique in column 16 defines when coverage is complete: EP → 1 TC per equivalence class; BVA → 1 TC per boundary point (on / just-below / just-above); ST → 1 TC per state transition in both valid and invalid direction; DT → 1 TC per unique condition-outcome combination.

### Step 0 — Check for existing TC files

Check `testing-output/test-cases/functional/` for an existing file for this module/sprint. If found → append; if not → proceed.

### Step 1 — Build the Rule Inventory (MANDATORY before creating any TC)

Extract all Rule IDs; create table `Rule ID | Brief description | Covered STT | Status | Group | Gap`. Cannot mark DONE unless every Rule's scenarios are **fully covered** — every distinct (System-state × Input → Expected-outcome) triple for that Rule has a TC — or is explicitly marked `N/A + reason`. A Rule with only 1 Happy TC is NOT "done" if other triples (error paths, pre-condition variants, enforcement scenarios) exist for that Rule.

**After listing explicit AC rules → scan for implicit requirements** not stated directly in AC/BR but implied by system architecture, spec structure, and cross-service contracts. Tag these rules as `[Implicit]` in the inventory table.

For each category below: **enumerate every distinct (violated-state × action × expected-outcome) triple** implied by that dimension — do not stop at one rule per category. Each distinct triple that has no explicit AC TC becomes its own `[Implicit-X]` Rule ID.

- **Auth boundary**: for every write/delete action → enumerate separately: who is allowed (each allowed role) and who is blocked (each blocked role/context).
- **Audit / Event**: which Kafka events or audit log entries must be published after each state change? Enumerate per event type.
- **Idempotency**: which operations must be retry-safe (same input → same outcome, no duplicates)?
- **Non-blocking**: which operations must not block the caller's transaction (async, fire-and-forget)?
- **Multi-layer auth**: identify ALL auth layers separately — entry-point layer (CI pipeline / API gateway / middleware) AND service-API layer (RBAC endpoint). Enumerate each layer as a separate Rule ID. Tag `[Implicit-AuthLayer1]` / `[Implicit-AuthLayer2]`.
- **Bypass path**: if the protected action is accessed via a workflow layer (GitOps PR, UI wizard, CLI), check whether a direct API endpoint also exists. If yes → add TC verifying the direct API also enforces auth. Tag `[Implicit-Bypass]`.
- **Pre-condition violation**: for every stated pre-condition in the spec, enumerate each distinct "pre-condition not met" variant as a separate Rule ID (e.g., agent registered-but-not-deployed is a different triple from agent-not-registered). Each variant must have a TC verifying the system rejects the action or fails gracefully with a clear error. Tag `[Implicit-Precond-X]`.
- **Configured-parameter enforcement**: for every field that is both (a) configurable and (b) has a runtime effect — timeout, retry_count, fallback, quota, threshold — enumerate all distinct scenarios where that parameter is exercised at runtime: normal trigger, boundary trigger, parameter-absent trigger, interaction between parameters. A field that exists in the definition but is never enforced is a runtime gap. Tag `[Implicit-Enforce-X]`.
- **Integration routing path**: if the spec states or implies "action X routes through service Y" (e.g., LLM calls via gateway, events via Kafka, auth via OPA) → add a TC verifying calls are NOT served by bypassing Y. Each routed dependency is a separate Rule ID. Tag `[Implicit-Routing-X]`.
- **Derived-state / computed-view**: for any view, list, or status that uses the word "active", "current", "pending", or "live" → enumerate the FULL state machine of that view: when does an entry appear, when does it disappear, what triggers each transition. Each direction of the transition is a distinct triple. Tag `[Implicit-DerivedState-X]`.
- **Payload transform vs passthrough**: if spec defines a mapping rule (e.g., `field-A.output.X → field-B.input.Y`) → the field-name transformation is a separate behavioral contract from value propagation. Enumerate: correct transform, identity passthrough (not transform), transform with null value, transform with type mismatch. Tag `[Implicit-Transform-X]`.

**Implicit Rule → Technique mapping:** After extracting all implicit Rule IDs, assign each to its applicable technique. Coverage follows the same stopping criterion as explicit Rule IDs — technique determines when done, not a count.

| Implicit category | Technique | Stopping criterion |
|---|---|---|
| Auth boundary | Decision Table | All (role × action) combinations mapped; every non-N/A cell covered |
| Audit / Event | Checklist-Based | Every event type: published + correct payload + correct timing has TC |
| Idempotency | Idem | Same input → same output; no duplicate side effects per operation |
| Non-blocking | Async verification | Caller not blocked; async result confirmed independently |
| Multi-layer auth | DT per auth layer | Each auth layer has own DT; all layers independently verified |
| Bypass path | Fault Injection | Direct API call bypassing workflow also asserts rejection |
| Pre-condition violation | State Transition | Each distinct wrong-state precondition has TC asserting rejection |
| Configured-parameter enforcement | EP on parameter values | Valid, boundary, absent, and inter-parameter interaction covered |
| Integration routing path | Contract test | Call routes through correct service; bypass is rejected |
| Derived-state / computed-view | State Transition | All transition directions (appear / update / disappear) covered |
| Payload transform | EP + BVA | Correct transform, identity passthrough, null value, type mismatch covered |


### Step 2 — Draft TSV (12 mandatory groups + Exploratory)

**BEFORE writing any TC — perform Matrix Mapping to prevent redundancy:**
1. List all (Flow step × Alternative × AC) combinations that share the same Given + Expected outcome.
2. Groups sharing the same business behaviour → merge into 1 TC; include all relevant IDs in Summary + Story Linkages.
3. Rule: if 2 TCs have identical Precondition + Expected result → **merge immediately**, do not create 2 separate rows.
4. Do NOT merge: sub-step failures in a saga/multi-step flow — each has a different precondition (set of already-completed steps differs) → 1 TC per sub-step failure type.
5. Do NOT merge: different infrastructure/network failure variants within the same ALT scenario (e.g., network-A failure ≠ network-B failure — different fault signatures, different preconditions).

Create TCs covering all 12 groups (maps to Skill 07 review groups):

| # | Group | Coverage guidance |
|---|---|---|
| 1 | Happy path | **How:** Read each AC line by line; each (condition → expected success outcome) pair = 1 scenario. List all scenarios before writing any TC. **Done when:** Every identified success scenario has a TC — no AC success path without one. |
| 2 | Negative / Invalid | **How:** Per field: identify invalid classes — (a) missing required field, (b) wrong format/characters, (c) BVA max+1 fail. Free-text field: add injection class. List all classes before writing. **Done when:** Every invalid class per field has a representative TC. DataDriven when same error code across classes in same field. → Detail: "Field Validation 3-cat" in skill-details. |
| 3 | DataDriven Consolidation *(step, not TC group)* | **How:** After G1+G2 TCs drafted — group by (Precondition × Steps × OutcomeType). Mark merge candidates. Apply merges. **Done when:** All merge candidates consolidated; no two TCs share identical (Precondition × Steps × OutcomeType). Output: `"G3: N TCs merged into M DataDriven TCs."` No new TCs generated here. Mark `Applied ✓` in coverage matrix. |
| 4 | Authorization boundary | **How:** Build (role × action) matrix from RBAC spec. Mark each cell: Permitted / Denied / N/A. Multi-layer: repeat per auth layer. **Done when:** Every non-N/A cell covered. DataDriven for denied roles with identical error response. Matrix fully covered = done. |
| 5 | Error handling / Failure | **How:** From sequence diagram: list every external call; per call enumerate distinct failure modes (timeout, 4xx, 5xx, network partition, partial response, malformed response). **Done when:** Every listed failure mode has a TC. DataDriven only when same failure → identical error code AND identical recovery path. Separate when recovery path differs. |
| 6 | State transition | **How:** Draw state diagram from requirements. List all transitions: (From-state, Event, To-state) — valid and invalid directions. **Done when:** 100% transition coverage — every valid transition exercised (forward direction) AND every invalid transition attempt asserts rejection. Count follows the diagram. |
| 7 | Integration / E2E | **How:** List all distinct business scenarios in the US; list all integration points with defined schemas. **Done when:** Every business scenario has E2E TC. Every integration point with schema has contract TC. No scenario or integration point uncovered. |
| 8 | Non-Functional | **How:** List all SLA-bound operations from requirements; list all OWASP-applicable surfaces (input fields, auth endpoints, file uploads). **Done when:** Every SLA-bound operation has Perf TC. Every OWASP surface has Security TC. See Group 8 minimum detail below. |
| 9 | Data integrity | **How:** Per AC that writes data: list each field written + each constraint (unique, non-null, FK, cascade) + idempotency requirement. **Done when:** Every listed field verified for correct persistence. Every constraint verified. Every idempotency requirement tested with duplicate call. G9 ≠ G1 write-success — field-level verification mandatory. |
| 10 | Regression | **How:** List shared resources — DB tables written, API endpoints modified, events published, state entities changed. Per resource: identify other features/flows using the same resource. **Done when:** Every identified adjacent flow has a spot-check TC. No shared resource without adjacent flow check. |
| 11 | UI/UX | **How:** List all distinct UI states from spec/mockup: loading, success, error (per error type), empty, disabled; list accessibility-critical interactions. **Done when:** Every listed UI state has TC. Every accessibility-critical interaction verified. `N/A` if API-only — must include reason. |
| 12 | Edge / Corner | **How:** Per resource/operation: ask "concurrent access → what happens?" and "unexpected retry → what happens?" List identified scenarios. **Done when:** Every identified race condition, concurrent op, and idempotency-at-concurrency scenario has TC. |
| ET | Exploratory | **How:** Apply **SFDPOT** — **S**tructure (component interaction anomalies), **F**unction (misbehavior under unusual conditions), **D**ata (encoding/null/overflow/Unicode/injection), **P**latform (env/OS/browser variations), **O**perations (concurrency/timing), **T**ime (timeout/scheduling/date edges). Per dimension: list identified risk areas. Write 1 ET row per risk area. **Done when:** All 6 SFDPOT dimensions explored; heuristic analysis yields no new risk areas. Count follows analysis — no target, no cap. |

**ET rows format**: Test Type=`Exploratory`, Priority=`Low`, Smoke/Auto=`N`, Test Data=`—`. Each row targets a distinct risk area — do not merge multiple vectors into 1 row. Summary format: `[Module][Exploratory] <goal>` — no "Charter:" prefix.

**Group 3 — Merge EP + BVA + DT into DataDriven TCs** when: same precondition + same steps + same result type. List all Test Data values separated by `;`. Do NOT merge: Happy path (keep Smoke=Y separate), Security (different steps), State transition (different preconditions).
→ DataDriven merging rules and examples: see `references/skill-details/05-gen-tc-functional.md`.

**Group 8 — Minimum Non-Functional:** Security (RBAC, OWASP Top 10) if input/auth exists; Performance (SLA) if defined; Reliability (retry + idempotency key, rollback).

**TC depth — scenario-driven, no upper cap**: Write **1 TC per unique (Precondition × Action × Expected Outcome) combination**. Do NOT limit to 2–6 TCs/AC. If 2 TCs share the same action/outcome but have different preconditions, keep both — different preconditions = different scenarios. >8 TCs/AC is correct when the AC has many distinct scenarios. Merge DataDriven ONLY when: same precondition + same step sequence + different test data values (e.g., multiple valid inputs for the same field). Never merge when preconditions differ even slightly.

**Output order:** Type A (sequence diagram present) → order by flow step top-to-bottom, error paths immediately below each step; Type B (no diagram) → by AC (AC-1 → AC-2 → ...), within each AC: Happy → Neg → Auth → State → Corner; both types: E2E/Impact → Regression → Exploratory last. See "TC Order (full)" in skill-details.

### Step 2b — Final Dedup Scan (MANDATORY — run after G3 consolidation, before Step 3)

Scan every TC pair for duplicate **(Precondition × Action × Expected Outcome)** triples:
- **Same all 3** → merge immediately: DataDriven if test data differs, else delete the duplicate row
- **Same precondition + different action** → keep both (different execution paths)
- **Different precondition + same outcome** → keep both (different scenario contexts; do NOT merge)
- **Sub-story input**: scan within each sub-story's block independently; cross-sub-story dedup only when precondition + action + outcome are truly identical

Output mandatory dedup summary before proceeding: `Dedup Scan: {N} duplicates found — {M} merged, {K} removed. Final TC count: {total}`

Do not proceed to Step 3 until dedup scan is output.

### Step 3 — Coverage matrix (MUST output in chat — do not save as separate file)

Build and **output the full AC × Group matrix in chat**. This is mandatory visible output — the user must see it to verify completeness. Do NOT summarize or skip; every cell must be filled before proceeding to Step 4.

For each Rule ID from Step 1 × each of the 12 groups:
- Covered → write TC STT(s)
- Not applicable → write `N/A — <reason>`
- Missing → write `GAP` → add TC immediately in Step 6 (R3); do not leave `GAP` unresolved

Output format (one row per Rule ID):

| Rule ID | G1 Happy | G2 Neg | G3 BVA | G4 Auth | G5 Error | G6 State | G7 Regression | G8 Perf | G9 DataInteg | G10 UI | G11 Integration | G12 Edge | Coverage |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| AC-01 | TC-1 | TC-16 | N/A | TC-19 | N/A | N/A | TC-29 | N/A | N/A | TC-3 | TC-5 | TC-33 | Full |

Coverage score per Rule ID: `Full` (all applicable groups covered) / `Partial` (≥1 applicable group missing) / `Minimal` (only G1 covered).

**Do not proceed to Step 4 until every cell is explicitly filled. An empty cell = incomplete — not N/A.**

### Step 4 — R1: Coverage summary

Output summary line: `R1 complete: {N} Rules covered (Full), {N} Partial, {N} Minimal/not covered.`

For every Rule ID with `Partial` or `Minimal` score, list explicitly:
`→ [Rule ID]: missing [Group name(s)] — reason: <why applicable>`

**R1 also checks scenario completeness**: For each Rule ID marked `Full`, enumerate all distinct **(Precondition × Action × Expected Outcome)** combinations that exist in the requirement. Each combination that does not have a corresponding TC is a gap — flag: `→ [Rule ID]: uncovered scenario — Precondition: <X>, Action: <Y>, Expected: <Z> — add TC in R3`. Coverage is only truly `Full` when every distinct scenario combination has a TC, regardless of TC count.

This list becomes the input for R2. Do not proceed if any Rule ID row in Step 3 is blank.

### Step 5 — R2: Gap analysis

For each gap from Step 3–4, output 1 row per missing group per Rule ID:

| Rule ID | Missing group | Risk | Proposed TC (brief) |
|---|---|---|---|
| AC-02 | G5 Error handling | High | Per-node "error" state when LLM call fails during Playground |

Risk mapping: Group 1 or 4 missing → `Critical`; Group 2, 6, or 11 missing → `High`; Group 3, 5, or 9 missing → `Medium`; Group 7, 8, 10, or 12 missing → `Low`.

Output summary: `R2 complete: {N} gaps — Critical: {N}, High: {N}, Medium: {N}, Low: {N}.`

Every gap with Risk ≥ Medium must get a TC in R3. Low-risk gaps may be skipped only if total supplemental TCs > 20 and the gap is explicitly noted as accepted.

### Step 6 — R3: Additional TCs from gaps (merge into main TSV — no separate file)

For each R2 gap row, add ≥1 TC. STT continues from main TSV. Add `GAP: [Rule ID] - [Group]` in Trace column.

Output summary: `R3 complete: {N} TCs added (STT {start}–{end}).`

### Step 7 — Mandatory self-review (DO NOT skip)

Apply checklist from **`references/tc-step7-checklist.md`** (C01–C11). Fix every failure immediately. Report: `"Fixed N TCs: [issue types]"` or `"Self-review: OK — no violations"`.

**Rubric score**: score against Skills 05-07 rubric in `evaluation/skill-quality-rubric.md`. Record inline: `Rubric: X/10 — Completeness: X, Format: X, Accuracy: X, Actionability: X`. Score < 7 → fix before Step 8. DONE is not allowed at < 7.

> Skill 07 not required for AI-generated TCs that passed self-review. Run Skill 07 for manually written TCs or when QA Lead review is required by governance.

### Step 8 — Finalize and save the main TSV

Merge R3 into the main TSV. Verify the full checklist before reporting DONE.

If running from workspace root: `python tools/validate_skill_package.py --strict-schema` — any `ERROR` or `WARN` output blocks DONE. Fix issues before reporting status.

## TSV Output Format

Header (16 columns): `STT | Summary | Test Level | Precondition | Test Data | Step summary | Expected result | Priority | Story Linkages | Test Type | Smoke | Auto | Phụ thuộc TC | Component | Trace | Technique`

→ Type taxonomy and Technique values: see **`references/tc-type-taxonomy.md`**.

### Key format rules

- STT: consecutive integers; no `TC-001`. Summary: `[US-ID][Flow-n][ALT-n][AC-n][Type] Verify...` — include only the IDs that apply; omit parts not applicable (e.g. no AC → omit `[AC-n]`; no specific flow step → omit `[Flow-n]`)
- Test Level: `component` / `integration` / `e2e` (lowercase). Priority: `High`/`Medium`/`Low`. Smoke/Auto: `Y`/`N`
- Test Data: specific realistic values; use actual values from `qa-config.yaml`; no placeholders
- Component: `{ProjectAbbr}-{FeatureFolder}`; Technique: from taxonomy or `—`
- Smoke=Y: independent TC with short execution time. Default Test Level: `e2e` (multi-service), `component` (single point), `integration` (2–3 services)
- Delimiter: `|` only — never `\|`. Language: Vietnamese with diacritics; English for technical codes
- File starts with header row line 1 — **no `#` comment rows**; exactly 16 tab-separated values per row; `Test Level` must never be empty

→ Priority guidance and Auto=N exception list: see `references/skill-details/05-gen-tc-functional.md`.

### File save path

`testing-output/test-cases/functional/tc-{module}-{sprint}-{HHmmss}.tsv` (prefer `output_paths.test_cases.functional` from qa-config; `{HHmmss}` avoids collisions).

## Mandatory Rules

1. Missing AC/Basic Flow → `[Needs supplement]`, stop, do not infer.
2. DataDriven: merge same-logic TCs; no duplicate content.
3. Full flow required: draft TSV → R1/R2/R3 → gaps filled → DONE. No early stop.
4. Cannot mark DONE with unmerged gaps or incomplete Rule Inventory.
5. Check for existing TC file before creating a new one.
6. TCs Robot Framework–compatible if automation required.

## Output

Exactly 1 TSV `tc-{module}-{sprint}-{HHmmss}.tsv`. No separate R1/R2/R3 files — all reviews merged into main TSV.

## Completion Status

`DONE` — TSV correct + R1/R2/R3 no unmerged gaps + Rule Inventory complete | `DONE_WITH_CONCERNS` — complete but has BA-confirm assumptions | `BLOCKED` — missing AC/Basic Flow or HLTC not Approved | `NEEDS_CONTEXT` — AC/BR insufficient; list questions

## Pre-DONE Checklist

→ Full checklist: see `references/skill-details/05-gen-tc-functional.md`.

Key gates:
- [ ] Directory `testing-output/test-cases/functional/`; filename `tc-{module}-{sprint}-{HHmmss}.tsv`
- [ ] 16 columns; STT consecutive; Priority/Smoke/Auto/Test Level correct values; ET rows present (all SFDPOT dimensions explored; 1 row per identified risk area)
- [ ] Rule Inventory complete; all 12 groups addressed (G3 Applied ✓); all cross-feature impact scenarios have `[Impact]` TCs; Non-Functional present
- [ ] R1/R2/R3 done, all gaps merged; audit-log + session-state updated
- [ ] Implicit scanning complete (C12): all 10 categories from Step 1 applied — each has ≥1 `[Implicit-X]` Rule ID in inventory table, or explicit `N/A + reason`; no category left unexamined

## Stop Conditions

Missing required input; publishing without governance approval; action outside skill scope.
