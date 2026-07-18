# Detailed Procedure: 03-sprint-test-plan

> Token-saving archive of the previous full sub-skill body. Read only when the compact sub-skill needs exact legacy wording, templates, or edge-case procedures.

## ⚑ Pre-DONE Checklist

- [ ] All 5 sections present, Exit Criteria has clear pass_rate and health_score_baseline
- [ ] No remaining `{...}` placeholders in the main content
- [ ] `qa-config.yaml` has been read (or user has been prompted to run skill 02 first)
- [ ] Append execution record to `governance/audit-log.md`
- [ ] Update `project/session-state.yaml` → `last_execution`, `current_sprint`

---

## Principles

The Sprint Test Plan records only what **changes in this sprint**. Strategy, test techniques, KPI targets, and suspension criteria are already in the Master Test Plan — **reference them, do not rewrite**.

## Mandatory Inputs

| Information | Required |
|---|---|
| Sprint name, start / end dates | ✅ |
| Ticket list (key, summary) | ✅ |
| QC assignees and number of available days | ✅ |

Missing → write `[To be added]`, ask again.

## Step 0 — Read config sources

1. Read `qa-config.yaml` if available → `project.name`, `project.code`, `exit_criteria`, `environments`, `tools`
2. Read Master Test Plan if available → determine risk rules, coverage targets by flow to fill in section 1.2

---

## Generate Sprint Test Plan — 5 sections

**Header:**

| | |
|---|---|
| **Project name** | {project.name} |
| **Timeline** | {dd/mm/yyyy} to {dd/mm/yyyy} |
| **Version** | 1.0 |
| **Master Test Plan** | {link — strategy, KPIs, test techniques available here} |

---

### 1. Sprint Overview

#### 1.1 Test objectives

Briefly state what QC needs to achieve in this sprint:
- Example: "All Sprint 3 features tested, full SIT flow for fund transfer — 100% PASS"
- Example: "Regression pass = 100% before release cut on {dd/mm}"

#### 1.2 Test scope

**Ticket list:**

| Ticket | Summary | Risk | Notes |
|---|---|---|---|
| {KEY-001} | {summary} | High / Medium / Low | |

> Risk Level per Master Test Plan: High = core/payment flows, Medium = integration/reconciliation, Low = query/UI.
> Coverage targets by risk see Master Test Plan.
>
> Many tickets → may replace the table with a Jira filter: `project = X AND sprint = Y`

#### 1.3 Test schedule

| Timeline | Activities | Notes |
|---|---|---|
| {dd/mm–dd/mm} | {Write TC / Prepare data / Smoke / Functional / SIT / Regression} | |

#### 1.4 Test types to be executed

List only test types **actually applied in this sprint**. Techniques and tools see Master Test Plan.

| No. | Test type | Purpose | Notes |
|---|---|---|---|
| 1 | Functional Testing | New features meet the User Story requirements | |
| 2 | Integration / SIT | Verify module/API/E2E integration | Fill in only if SIT is in this sprint |
| 3 | Smoke Testing | Verify core flows before full testing | |
| 4 | Sanity / Retest | Confirm bug fixes are correct and no new bugs introduced | |
| 5 | Regression Testing | New changes do not break existing functionality | |
| 6 | Performance | {specific scope — endpoint/flow} | Metric: {p95 < Nms} — tool see Master |
| 7 | Security | {module} | Tool see Master Test Plan |
| 8 | UAT | Sign-off with {stakeholder} | If required in this sprint |

> Remove rows that do not apply. Notes column: write scope/metric for NFT, write stakeholder name for UAT.

---

### 2. Test Tools & Environments

> If unchanged from Master Test Plan: "Per Master Test Plan / qa-config.yaml — see: {link}."
> Only record changes or additions for this sprint.

#### 2.1 Test tools

| Activities | Tools | Version | Notes |
|---|---|---|---|
| TC management | QMetry / Google Sheet | | |
| API test / Automation | Postman + Robot Framework | | |
| Bug tracking | Jira | | |
| Performance (if any) | JMeter | | Sprint scope: {endpoint} |

#### 2.2 Test environments

| System | Environment | Link | Notes |
|---|---|---|---|
| {service} | {QC / Staging / UAT} | {URL} | Latest deploy: {date} |

---

### 3. Test Resources

| Name | Role | Days | Allocation | Notes |
|---|---:|---:|---:|---|
| {Name} | QC Lead | {N} | 100% | |
| {Name} | QC | {N} | {N}% | Off {N} days |
| **Total** | | **{N}** | | |

**Capacity analysis:**

| | Hours |
|---|---:|
| Total effort needed (estimate) | {N}h |
| Total available hours ({N} days × 7h) | {N}h |
| **Difference** | **{+/−N}h** |

> Shortfall → propose a specific plan: reduce P3 scope / overtime / defer to next sprint.

**Detailed estimate:** {link to Google Sheet / QMetry if available}

---

### 4. Test Completion Conditions

**Entry Criteria** (conditions to start testing — fill in if status tracking is needed):

| Condition | Confirmed by | Status |
|---|---|---|
| Build successfully deployed to {environment} | Dev Lead | Ready / Pending |
| TCs written and reviewed | QC Lead | Ready / Pending |
| Test data is ready | QC | Ready / Pending |

**Exit Criteria — Test Completion** (QC decides):

Read `exit_criteria.*` from `qa-config.yaml` (if available) as the primary source. Clearly state the source: `qa-config` or `master-test-plan-fallback`.

| Metric | Source field | Target for this sprint | Notes |
|---|---|---|---|
| Pass rate | `exit_criteria.pass_rate` | ≥ {N}% | High-risk TC: 100% |
| TC Execution Rate | `exit_criteria.tc_executed_rate` | ≥ {N}% | |
| Health Score | `exit_criteria.health_score_baseline` | ≥ {N}/100 | Calculated per skill 09 (qa-core/09-check-result) |
| S1/Critical open | `exit_criteria.max_s1_open` | = 0 | Hard blocker |
| S2/High open | `exit_criteria.max_s2_open` | ≤ {N} | Confirmed by QC Lead + Dev |
| SIT pass rate | — | = 100% | If SIT is in this sprint |
| Regression pass | — | = 100% | |

> If the sprint has no changes from the Master Test Plan: write "Per `exit_criteria` in qa-config.yaml — no changes this sprint" and skip the table above.
> If the sprint has adjustments (relaxed or tightened): fill in the full table and state the reason in the Notes column.

**Go-Live Decision** (PM/Product decides): Per Master Test Plan.
**Suspension Criteria:** Per Master Test Plan / `suspension_criteria.*` in qa-config.yaml.

---

### 5. Reference Documents

| Document | Link |
|---|---|
| Master Test Plan (strategy, KPIs, techniques) | {Confluence link} |
| Requirement / BRD / PRD | {link} |
| Jira Board | {link} |
| TC Sheet (QMetry / Google Sheet) | {link} |
| Test Data | {link if available} |

---

## Export file

**Naming:** `Sprint_Test_Plan_{project.code}_{sprint}_v{semver}_{yyyy-mm-dd}_{HHmm}.md`

**Save to:** `output_paths.test_plan` from qa-config (default: `testing-output/test-plan/`)

After completion, suggest:
- **skill 04 (qa-core/04-test-design-high-level)** for modules with complex logic → HLTC before writing TCs
- **skill 05 (qa-core/05-gen-tc-functional)** → generate functional TCs
- **skill 08 (qa-core/08-gen-data-test)** → generate test data right after TCs are ready
