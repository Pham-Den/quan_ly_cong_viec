# Master Test Plan Structure — 11 Sections (IEEE 829 / ISTQB)

> Skill 01 reads this file to determine the structure and content of each section.
> Mandatory rules:
> - All 11 sections must be present, none may be omitted
> - No empty placeholders remaining in the main content
> - Estimates must be justified, NOT split evenly across tickets
> - Suspension Criteria must have specific thresholds (%, number of hours) — vague language is not allowed
> - Entry Criteria must specify who confirms and how
> - Exit Criteria must separate Test Completion from Go-Live Decision
> - KPIs must have specific targets (numbers, percentages)
> - Write in English
>
> Standard workflow:
> - Complete all 11 sections of the Master Test Plan (skill 02 — qa-core/02-test-plan)
> - Complete Step 4 in skill 02 to export `qa-config.yaml`
> - From the next sprint onwards, use skill 03 (qa-core/03-sprint-test-plan) — concise, reuses config

---

## Section 1 — General Information

Includes:
- Project name, version, milestone (e.g. MVP1, Sprint 12)
- Document ID: `TP-{ProjectCode}-{Milestone}-{YYYYMMDD}`
- Author, approver, creation date, status (Draft / Review / Approved)
- List of features/tickets in scope (key, summary, WS/sprint, estimated complexity: Low / Medium / High)
- Reference documents: BRD/PRD, sprint board, environment, repo

---

## Section 2 — Test Scope

Includes:
- **In Scope:** List each module/feature to be tested, test types applied (Functional / Regression / Smoke / SIT / Performance / Security / UAT), reason for prioritisation
- **Out of Scope:** List what will NOT be tested and specific reasons (no changes / environment not ready / dependency on another team)
- **Test types applied:** Mark each type:

| Test type | Applied | Notes |
|---|---|---|
| Functional | ✅ / ❌ | |
| Integration / SIT | ✅ / ❌ | |
| Regression | ✅ / ❌ | |
| Smoke | ✅ / ❌ | |
| Performance | ✅ / ❌ | Skill 11 |
| Security | ✅ / ❌ | Skill 10 |
| Accessibility | ✅ / ❌ | Skill 15 |
| UAT | ✅ / ❌ | Skill 12 |

---

## Section 3 — Test Approach & Strategy

Includes:
- **Domain and architecture:** Fintech / Ecommerce / Logistics / SaaS / Healthcare and Monolith / Microservices / Mobile / API-only
- **Strategy:** Risk-based testing — prioritise by degree of code change + impact on core flow
- **TC design techniques:** EP, BVA, Decision Table, State Transition, Error Guessing, Exploratory — specify which technique applies to which type of feature
- **Execution process:** Smoke → Functional → Integration → Regression → Retest → Report
- **Tools:** Specific tool names for each purpose

### Strategy Matrix

Map module → risk level → test type → priority:

| Module/Feature | Risk Level | Test Types | Priority | Notes |
|---|---|---|---|---|
| {module} | High/Med/Low | Functional, SIT, Performance, Security | P1/P2/P3 | |

### NFT Breakdown

| NFT Type | Scope | Tool | Target Metric | Skill |
|---|---|---|---|---|
| Performance | {endpoint/flow} | k6 / JMeter | p95 < {N}ms, TPS ≥ {N} | skill 11 |
| Security | {module} | OWASP ZAP | Critical = 0, High = 0 | skill 10 |
| Accessibility | {page} | axe-core | WCAG 2.1 AA ≥ {N}% | skill 15 |

### 3a — Execution Acceleration Strategy

> Required if TC count > 50 or test duration ≤ 5 working days.

- **Group rules/TCs by pattern:** List TC groups with the same input-output structure that can be run in batch
- **Execution priority order:** Which rules/TCs must run first (highest S1 risk), which groups to defer if time runs out
- **Mutation strategy:** Start from the golden dataset then mutate each criterion
- **Automation-first:** Which TCs run automatically, which are manual — state the target ratio
- **Parallel execution:** Which TC groups can run in parallel

### 3b — Test Data Strategy

> Required — do not leave blank.

- **Golden dataset:** Describe one standard dataset used as the base for mutation
- **Data types needed:** BVA boundary values, EP partitions, normalise variants, threshold values
- **Tool / generation method:** Automated JSON/TSV script or manual
- **Traceability:** Data files stored at `testing-output/test-data/`
- **Teardown:** How to reset data after each run

---

## Section 4 — Entry Criteria

Conditions that MUST be met **before** testing begins. Each condition must state who confirms it and how:

| Condition | Confirmed by | Confirmation method |
|---|---|---|
| Build successfully deployed to staging | Dev Lead | CI/CD log or confirmation email |
| Smoke test pass rate ≥ {N}% | QC | Smoke test result |
| Test data ready and verified | QC | Data verification checklist |
| Requirements frozen or change log clearly documented | BA/PM | Confluence page |
| Environment stable for ≥ {N} hours before testing | Ops/Dev | Uptime monitoring |
| Test Plan approved | QC Lead + PM | Sign-off in Section 11 |

---

## Section 5 — Exit Criteria

### Part A — Test Completion (QC decision)

**PASS conditions:**
- Pass rate: ≥ {X}% (project-specific)
- Open S1 (Critical) bugs: = 0
- Open S2 (High) bugs: ≤ {N}
- TCs executed: ≥ {X}%
- Regression pass rate: = 100%

**FAIL conditions (signals to stop / not release):**
- Pass rate: < {X}%
- Open S1 bugs: ≥ 1
- Environment instability: > {X} hours in a day

### Part B — Go-Live Decision (PM/Product decision)

Based on Test Completion (Part A) + business risk:
- All Part A Test Completion conditions met
- No unresolved business blockers
- UAT sign-off from {stakeholder} (if required)
- Risk acceptance from {approver} if any S2 bugs remain open at release

---

## Section 6 — Suspension & Resumption Criteria

> ⚠️ Mandatory rule: ALL suspension conditions must have specific numeric thresholds.

**Suspension conditions:**

| Condition | Specific threshold | Immediate action |
|---|---|---|
| Blocked TC rate | > {30}% of total TCs | Stop testing, notify QC Lead, hold triage meeting |
| Environment unavailable | > {4} continuous hours in one day | Stop, escalate to Dev/Ops, log the incident |
| S1 blocking bug (environment) | ≥ 1 | Stop the related flow, confirm root cause |
| Test data corrupted | > {10}% of data invalid | Stop, rebuild data |
| Sudden pass rate drop | < {60}% in one day after previously reaching {80}% | Stop, analyse, hold urgent meeting |

**Resumption conditions:**
- Environment is stable and confirmed by Dev/Ops
- S1 blocking bug is fixed and deployed to staging
- Test data has been rebuilt and verified
- QC Lead authorises resumption in writing (Slack / email)

---

## Section 7 — KPIs & Metrics

| KPI | Formula | Target | Notes |
|---|---|---|---|
| Pass Rate | pass / (pass + fail) × 100% | ≥ {N}% | Blocked TCs excluded |
| Defect Removal Efficiency (DRE) | bugs found in test / total bugs × 100% | ≥ {N}% | Measured after release |
| Automation Coverage | automated TCs / total TCs × 100% | ≥ {N}% | Only counts executed TCs |
| Coverage by Risk | high-risk TCs executed / total high-risk TCs | = 100% | Required before release |
| TC Execution Rate | TCs executed / total planned TCs | ≥ {N}% | |
| Bug Detection Rate | bugs / TCs | < {N} | Baseline from previous sprint |
| Health Score | Formula in `references/report-template.md` | ≥ {N}/100 | |

---

## Section 8 — Testing Tasks & Schedule

> ⚠️ DO NOT split hours evenly across tickets. Estimates must be based on actual complexity.

Estimation guide:
- **Low** (simple CRUD, single flow): 2–4h writing TCs + 2–3h testing
- **Medium** (business logic, multiple cases): 4–8h writing TCs + 4–6h testing
- **High** (integration, complex states, security/payment): 8–16h writing TCs + 8–12h testing

| # | Task | Related tickets | Complexity | Assignee | Timeline | Effort | Notes |
|---|---|---|---|---|---|---:|---|
| 1 | Write Functional + SIT TCs | {Ticket A, B} | High | {QC} | {Day N–M} | {N}h | |
| 2 | Write Functional TCs | {Ticket C} | Low | {QC} | {Day N} | {N}h | |
| 3 | Prepare Test Data | All | Medium | {QC} | {Day N} | {N}h | |
| 4 | Execute Smoke Test | All | — | {QC} | {Day N} | {N}h | |
| 5 | Execute Functional Test | {Ticket A, B, C} | — | {QC} | {Day N–M} | {N}h | |
| 6 | Regression Test | Core flows | — | {QC} | {Day N} | {N}h | |
| 7 | Retest after fixes | Per bug report | — | {QC} | {Day N–M} | {N}h | |
| 8 | Compile Sprint Report | — | — | QC Lead | {Day N} | {N}h | |
| **Total** | | | | | | **{N}h** | |

---

## Section 9 — Resources & Environment

**Team:**

| Role | Name | Main responsibilities | % Time |
|---|---|---|---:|
| QC Lead | {Name} | Review TCs, reporting, escalate blockers, decide on suspension | {N}% |
| QC Engineer | {Name} | Write TCs, execute tests, log bugs | {N}% |

**Environment:**

| Environment | URL | Status | Auth | Notes |
|---|---|---|---|---|
| Staging | {URL} | {Ready / Pending deploy} | {Basic auth / OAuth} | Latest deploy: {date} |
| UAT | {URL} | {Ready / Not available} | | |

**Test accounts to prepare:**

| Account type | Username | Role / Permissions |
|---|---|---|
| Admin | {email} | Full access |
| Standard user | {email} | Basic permissions |
| User without permission X | {email} | For negative case testing |

---

## Section 10 — Risks & Contingencies

List a minimum of 4 realistic risks — no generic entries:

| # | Risk | Likelihood | Impact | Contingency |
|---|---|---|---|---|
| R1 | Staging environment instability | High | Blocks {N}% of TCs | Backup environment / coordinate with Ops from day {N} |
| R2 | Requirement changes mid-sprint | Medium | Must rewrite {N}% of TCs | Daily ticket review, checkpoint on day {N} |
| R3 | Insufficient test data | Medium | Blocks functional testing | Prepare data script from day {1} of sprint |
| R4 | S1 bug near sprint deadline | Medium | Release risk | Clear escalation path, exit criteria already defined |
| R5 | QC member unexpected absence | Low | Delay by {N} days | Cross-training, full TC documentation |

---

## Section 11 — Deliverables & Approval

| Document | Generating skill | Format | Author | Deadline | Storage location |
|---|---|---|---|---|---|
| Master Test Plan | skill 02 (qa-core/02-test-plan) | `Test_Plan_{code}_{milestone}_v{ver}_{date}.md` | QC Lead | Before test start date | `testing-output/test-plan/` |
| Sprint Test Plan | skill 03 (qa-core/03-sprint-test-plan) | `Sprint_Test_Plan_{code}_{sprint}_v{ver}_{date}.md` | QC Lead | Start of sprint | `testing-output/test-plan/` |
| High-Level Test Design | skill 04 (qa-core/04-test-design-high-level) | `hltc-{module}-{sprint}-v{ver}-{date}.md` | QC Lead | Day {N} of sprint | `testing-output/test-cases/hltc/` |
| Functional Test Cases | skill 05 (qa-core/05-gen-tc-functional) | `tc-functional-{module}-{sprint}-v{ver}-{date}.tsv` | QC | Day {N} of sprint | `testing-output/test-cases/functional/` |
| SIT Test Cases | skill 06 (qa-core/06-gen-tc-sit) | `tc-sit-{module}-{sprint}-v{ver}-{date}.tsv` | QC | Day {N} of sprint | `testing-output/test-cases/sit/` |
| Test Data | skill 08 (qa-core/08-gen-data-test) | `master-dataset-{sprint}-v{ver}-{date}.tsv` | QC | Before test start date | `testing-output/test-data/` |
| Automation Script | skill qa-automation/02-gen-script-test | Robot Framework `.robot` | QC | Day {N} of sprint | `testing-output/automation/` |
| Daily Test Report | skill 09 (qa-core/09-check-result) | `.md` + `.html` | QC | Each test day | `testing-output/reports/daily/` |
| Sprint Summary Report | skill 10 (qa-core/10-test-report) | `.md` + `.html` | QC Lead | Last day of sprint | `testing-output/reports/sprint/` |
| Bug Report | — | Jira ticket | QC | Same day as discovery | Jira project {X} |

**Document approval:**

| Role | Name | Date signed | Signature / Confirmation |
|---|---|---|---|
| QC Lead / Test Manager | {Name} | | |
| Tech Lead / Dev Lead | {Name} | | |
| Product Manager / BA | {Name} | | |
| Project Manager | {Name} | | |

> This document may only be enacted once at least the QC Lead and PM have signed off.

> **Mandatory notes:**
> - Once the TC list is complete → immediately run **skill 08 (qa-core/08-gen-data-test)** to generate test data
> - For any TC that can be automated → run **skill qa-automation/02-gen-script-test** to generate scripts
> - All output files must include `v{semver}` + `{yyyy-mm-dd}_{HHmm}` in the filename
