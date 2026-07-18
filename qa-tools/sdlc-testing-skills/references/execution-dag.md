# Execution DAG

## Execution order within a sprint

```
Review & Planning Phase
  01 (Review Requirements) ──────────────────  AC / BR / PRD → TSV issues list
  02 (Test Plan) ─────────────────────────────  → Master Test Plan + qa-config.yaml
  03 (Sprint Test Plan) ──────────────────────  → Sprint Test Plan (each sprint)

Design & Preparation Phase                          Required artifacts
  04 (High-Level Test Design, optional) ──────  AC / BR → HLTC Markdown outline
  05 (Gen TC Functional) ─────────────────────  AC / BR (+ HLTC from 04 if available)
  06 (Gen TC SIT) ────────────────────────────  API spec / sequence diagram
  07 (Review TC) ─────────────────────────────  Output of 05 / 06, or existing TCs
  08 (Gen Data Test) ─────────────────────────  Output of 05 / 06

Automation (run in parallel when needed)
  qa-automation/01 (Setup Automation) ────────  First run for the project
  qa-automation/02 (Gen Script Test) ─────────  TCs approved from 05/06/07 + qa-config.yaml

Execution Phase
  09 (Check Result) ──────────────────────────  Pass/fail results from test run
  09 ──► 09 ──► … (runs daily, accumulates Sprint Snapshot)

Reporting Phase
  10 (Test Report) ───────────────────────────  Sprint Snapshot from 09

Release Phase
  11 (Demo Preparation) ──────────────────────  List of DONE tickets
  12 (UAT Support) ───────────────────────────  TCs + UAT environment
  13 (Go/No-Go) ──────────────────────────────  Output of 09/10 + specialist results (if any)
  14 (Smoke Production) ──────────────────────  Deployment complete + approval from 13

Specialist testing — runs in parallel when needed, no order dependency among themselves
  qa-specialist/01 (Security Testing) ────────  Staging URL + test accounts
  qa-specialist/02 (Performance Testing) ─────  Staging URL + API list
  qa-specialist/03 (Accessibility Testing) ───  Staging URL + page list
```

## Starting mid-sprint (no artifacts from previous steps)

- TC already exists → skip 01–06, go directly to 07 (review) or 08 (data)
- Complex function logic but no detailed TCs needed yet → run 04 (HLTC) first, then proceed to 05 and 06
- No `qa-config.yaml` → skill can still run; use information provided directly by the user (see Group B)
- No Sprint Snapshot → skill 10 accepts fallback: TC results + manually compiled bug list

## Gate conditions

| From → To | Condition |
|---|---|
| 01 → 03/04/05 | No remaining Blocker issues in TSV |
| 04 → 05/06 | HLTC gate = Approved |
| 07 → 08 | Review gate = Approved, no unaddressed gaps |
| 09/10/12 → 13 | Sprint Report complete + specialist results (if any) |
| 13 → 14 | Go/No-Go decision is GO |
