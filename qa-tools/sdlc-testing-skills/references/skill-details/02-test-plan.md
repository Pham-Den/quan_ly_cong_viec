# Detailed Procedure: 02-test-plan

> Token-saving archive of the previous full sub-skill body. Read only when the compact sub-skill needs exact legacy wording, templates, or edge-case procedures.

## ⚑ Pre-DONE Checklist

- [ ] All 11 mandatory sections present, no remaining `{...}` placeholders
- [ ] Section 11 — Approval: names of approvers filled in (minimum QC Lead + PM)
- [ ] `project/qa-config.yaml` has all mandatory fields exported
- [ ] Append execution record to `governance/audit-log.md`
- [ ] Update `project/session-state.yaml` → `last_execution`, `current_sprint`

---

## Mandatory Inputs

| Information | Required |
|---|---|
| List of tickets / epics / features (key, summary, status) | ✅ |
| Project timeline / milestones (start – end dates) | ✅ |
| QC team roster and roles | ✅ |
| Environments and tools | ✅ |
| Project name, version, milestone | ✅ |

Missing information → write `[To be added]`, ask again. Do not guess.

## Step 0 — Read qa-config.yaml (if available)

If the project already has `qa-config.yaml` → read it and use the following values directly, without asking again:

| Field in config | Used for Test Plan section |
|---|---|
| `project.name`, `project.sprint` | Section 1 — General Information |
| `project.domain`, `project.architecture` | Section 3 — Approach & Risk |
| `team.*` | Section 8 — Team |
| `environments.*` | Section 8 — Environments |
| `tools.*` | Section 3 — Tools, Section 10 — Deliverables |
| `scope.modules` | Section 2 — Scope |
| `exit_criteria.*` | Section 5 — Exit Criteria |
| `suspension_criteria.*` | Section 6 — Suspension Criteria |
| `uat.required`, `uat.stakeholders` | Section 2 — Scope, Section 10 |
| `accessibility.required` | Section 2 — Test types applied |

If `qa-config.yaml` does not exist → proceed with Step 1 as normal, then perform Step 4 to export qa-config.yaml.

## Step 0.5 — Read all feature files in the project directory (mandatory)

Before generating content, **read all `.md` files in the folder containing feature requirements (e.g., `docs/features/`)** (skip `feature-template.md`).

From each feature file, map to the Master Test Plan:

| Field in feature file | Used for section |
|---|---|
| `Module`, `Feature`, `Ticket IDs` | Section 1 — Ticket list, scope |
| `Business goal` | Section 1 — Context, Section 3 — Strategy |
| `In scope` | Section 2 — In Scope |
| `Out of scope` | Section 2 — Out of Scope |
| `Acceptance criteria` | Section 2, Section 4 — Additional Entry Criteria |
| `Business rules` | Section 3 — Test techniques |
| `Main flow`, `Alternate flows`, `Negative flows` | Section 3 — Approach, basis for estimation |
| `Dependencies` | Section 2 — Out of Scope (if external), Section 9 — Risks |
| `Preconditions` | Section 8 — Test accounts & data |
| `Open questions` | Section 9 — Risks ("Unclear requirement") |

**Rules:**
- If `scope.modules` in config still has placeholders → ignore config, use `Module` from feature files.
- If the `features/` directory does not exist → write `[No feature requirements available]` and continue.

## Step 1 — Identify domain, architecture, and overall scope

Read tickets/features/BRD to determine:
- Domain: fintech / ecommerce / logistics / SaaS / healthcare...
- Architecture: monolith / microservices / mobile / API-only
- Overall scope: number of modules, workstreams/sprints, features

## Step 2 — Generate content for 11 sections

Read `../../references/test-plan-template.md` for the detailed structure.

**11 mandatory sections of the Master Test Plan:**

1. **General Information** — project name, milestone, document code, author/approver, feature scope
2. **Test Scope** — In Scope / Out of Scope / test types applied (Functional, NFT, UAT...)
3. **Approach & Strategy** — domain/arch, risk-based strategy, TC techniques, **execution schedule** (timeline working backward from go-live), **strategy matrix**, NFT breakdown
4. **Entry Criteria** — conditions that MUST be met before testing begins
5. **Exit Criteria** — PASS conditions for release, FAIL conditions, **separate test completion vs go-live conditions**
6. **Suspension & Resumption Criteria** — specific thresholds (%, hours), not vague
7. **KPI & Metrics** — DRE, automation %, coverage by risk level, pass rate target
8. **Schedule & Timeline** — estimate by complexity, not evenly distributed
9. **Team & Environments** — team roles, environments, test accounts
10. **Risks & Contingency Plans** — ≥ 4 realistic risks, not generic
11. **Deliverables & Approval** — deliverables table, **official sign-off cells**

Mandatory principles:
- Do not spread estimates evenly — base them on actual complexity of each ticket/module
- Suspension Criteria must have specific thresholds (%, number of hours)
- Entry Criteria must clearly state "who confirms" and "how"
- Exit Criteria must separate 2 parts: test completion conditions vs go-live decision conditions — **both must include a clear list of FAIL conditions**
- KPIs must have a specific baseline or target (number, %)
- Severity/Priority must be written in full (Severity Critical, Severity High, Priority Critical...) — do not use S1/S2/P1/P2
- Personnel: only fill in confirmed names; use `[To be confirmed]` for unknowns — do not guess or pull names from other documents

**Master Test Plan vs Sprint Test Plan boundary — mandatory:**

| Belongs to Master Test Plan (strategic) | Belongs to Sprint Test Plan / Jira (tactical) |
|---|---|
| Strategy matrix by risk group (4–5 rows) | Per-feature automation % in detail |
| Test approach + automation milestone target | TC design technique mapping per feature |
| NFT types + approach + owner | Specific golden dataset spec |
| Phase-level schedule (5 phases) | Task-by-task with sprint/person/hours |
| AI Policy: 1 summary table | Execution acceleration tactics |
| Test data: principles + tools | Sprint execution checklist |

### Section 3.1 Detail — Manual vs Automation

Method table by test type with **milestone-based automation targets** (not flat throughout the project):

| Test type | Method | Automation target | Framework |
|---|---|---|---|
| Functional — API | Automation preferred + Manual edge cases | ≥ 70% | Robot Framework |
| Integration | Manual first run + Auto after flow stabilizes | ≥ 40% | Robot Framework |
| Regression | Full automation, CI-triggered | = 100% | Robot Framework |
| Performance | Tool-driven | = 100% | k6 / JMeter |
| UAT | Manual user walkthrough | 0% | — |

**Overall target:** milestone-based — e.g.: ≥ 60% during functional phase, ≥ 75% entering SIT/NFT.

**TC design techniques:** Summarize in one sentence in this section — do not create a separate section. E.g.: "Apply EP, BVA, Decision Table for APIs; State Transition for Saga/GitOps; OWASP Top 10 for Security; Idempotency for Audit."

---

### Section 3.2 Detail — AI Policy

**Write only 1 single summary table** — do not write as a policy document with multiple sub-sections:

| AI-supported activity | Mandatory QC review | Data constraints |
|---|---|---|
| Generate Test Plan / Sprint Plan / HLTC | QC Lead reviews and signs off | Do not feed architecture details or credentials into AI |
| Generate draft Test Cases | QC Engineer reviews each TC against FRS | Do not feed real PII into AI — violates Decree 13/2023 |
| Generate synthetic test data | QC Engineer verifies no real PII | Synthetic data only |
| Generate draft Automation Scripts | Pass DoD checklist before commit | — |
| Compile Reports | QC Lead reviews before publishing | — |

---

### Section 3.3 Detail — Strategy Matrix

**Group by risk group (4–5 rows)** — do not list individual features separately. Detailed automation % belongs in Sprint Plan.

| Risk group | Representative features | Test types applied | Coverage level |
|---|---|---|---|
| Very high | {auth, core API, data access} | Functional + Integration + Security + NFT | 100% — hard blocker |
| High | {audit, identity, governance} | Functional + Integration + Security/Compliance | 100% — compliance sign-off |
| Medium | {catalog, metadata, search} | Functional + Integration | ≥ 95% |
| Low | {view, report, UI} | Functional | ≥ 90% |

### Section 3.4 Detail — NFT Breakdown

For each NFT type in scope, describe scope + tool + metric + owner. The **Owner** column is important — Security is typically owned by the Security Team; QA only supports the environment.

| NFT Type | Scope | Tool | Target metric | Owner |
|---|---|---|---|---|
| Performance — Load | {core API endpoint} | k6 / JMeter | p95 < {N}ms at {N} concurrent users `[Pending PO]` | QA — Skill 11 |
| Performance — Stress | {core API} | k6 | Find breaking point — error rate > 5% | QA — Skill 11 |
| Performance — Soak | {long-running service} | k6 | 80% load × 2–4h; no memory leak | QA — Skill 11 |
| Performance — Spike | {auth/entry API} | k6 | 0 → peak in 30s; measure recovery time | QA — Skill 11 |
| Availability / Uptime | Full platform | Grafana monitoring | ≥ {N}% uptime `[Pending PO]` | QA + Ops |
| Resilience | {fail-closed, circuit breaker} | Manual + API test | System blocks requests when dependency is down | QA |
| Observability / Alert | {monitoring stack} | Alert validation | Alerts fire at correct threshold; no silent failure | QA + Ops |
| Security | {IAM, API layer} | OWASP ZAP + Burp Suite | Critical = 0, High = 0 | **Security Team** — QA supports env + evidence |
| Accessibility | {UI page} | axe-core | WCAG 2.1 AA ≥ {N}% | QA — Skill 15 |

**Note:** If the SRS has NFR fields still marked TBD → **mandatory: create an NFR Open Questions table to send to PO** right in this section. Do not leave placeholders silently — test results without an SLA target have no sign-off value.

**NFR Open Questions template:**

| # | Question | Why needed | Impact if missing | Who to ask | Deadline |
|---|---|---|---|---|---|
| NFR-01 | Maximum concurrent users? | Design load scenario | Load test has no baseline | PO / SA | Before NFT Sprint |
| NFR-02 | Data volume / dataset size? | p95 latency of query engine | Query SLA cannot be determined | PO / Data Architect | Before NFT Sprint |

### Section 3 Detail — Execution Schedule (3.6)

> Must be presented **working backward from go-live** — not just a technical dependency chain.

**Must include all 5 parts:**

1. **Sprint-level timeline overview** — table of sprint × phase × feature coverage + list of hard milestones working backward from go-live (go-live → UAT sign-off → SIT start → Functional test end → ...)
2. **Functional Test Schedule** — which phase, which sprint, which module, entry conditions for each phase, execution dependency chain
3. **SIT Schedule** — specific dates, entry conditions, cross-module scope, responsible parties, exit condition
4. **UAT Schedule** — dates, user journey scope, participants (actual roles), sign-off deadline
5. **Performance Test Schedule** — dates, tool, entry conditions, and **4 test types with scenario + target for each:**

   | Type | Goal | Sample scenario |
   |---|---|---|
   | **Load test** | Confirm SLA under normal load (expected concurrent users) | Hold {N} users × 30 minutes; measure p95 |
   | **Stress test** | Find breaking point | Gradually increase → 2× → 3× users until error rate > 5% |
   | **Soak test** | Detect memory leaks, resource exhaustion | 80% expected load × 2–4 continuous hours |
   | **Spike test** | Evaluate recovery from burst traffic | 0 → peak in 30 seconds; measure recovery time |

### Section 4 Detail — Entry Criteria

| Condition | Confirmed by | Confirmation method |
|---|---|---|
| Build successfully deployed to staging | Dev Lead | Jenkins/CI log or confirmation email |
| Smoke test passes ≥ {N}% | QC | Smoke test result |
| Test data is ready | QC | Data verification script |
| Requirements frozen or change log is clear | BA/PM | Confluence page |
| Environment stable for ≥ {N} hours before testing | Ops | Uptime monitoring |

### Section 5 Detail — Exit Criteria

**Part A — Test Completion (QC decides):**

| Metric | Threshold |
|---|---|
| Overall pass rate | ≥ {N}% |
| Pass rate for Very High / High risk group | = 100% |
| Open bugs with Severity Critical | = 0 |
| Open bugs with Severity High | ≤ {N} (accepted with PM/Tech Lead confirmation) |
| TC executed / total planned TC | ≥ 95% |
| Regression pass rate | = 100% |

**FAIL conditions — mandatory to list (not just PASS):**
- Pass rate < {N}% (below warning threshold)
- Any Severity Critical bug still open
- Auth bypass detected (endpoint returns 200 without valid token)
- Audit log can be modified/deleted
- Raw PII found in storage layer (if privacy feature exists)
- Fail-Closed violated (asset with no policy is still accessible)

**Part B — Go-Live Decision (PM/Product decides):**
- Test completion meets Part A
- Security audit: Severity Critical = 0, Severity High = 0
- Performance passes at baseline load (from NFR PO)
- UAT sign-off from {stakeholder}
- Compliance/Legal sign-off if there are Privacy/PII/IDR features
- Written risk acceptance from PM/Tech Lead if any Severity High bugs remain open at release

### Section 7 Detail — KPI & Metrics

| KPI | Formula | Target | Notes |
|---|---|---|---|
| Pass Rate — Overall | pass / (pass + fail) × 100% | ≥ {N}% | Does not include blocked |
| Pass Rate — Highest risk group | pass_critical / total_critical × 100% | = 100% | Hard requirement before release |
| Defect Removal Efficiency (DRE) | bugs QA / (bugs QA + bugs UAT/Prod) × 100% | **≥ 95%** for compliance/PII systems; ≥ 85% for standard systems | Measured after release |
| Automation Coverage | TC automated executed / total TC executed × 100% | Milestone-based — see section 3.1 | Counts only executed TCs |
| TC Execution Rate | TC executed / total planned TC | ≥ 95% | |
| Audit / Privacy Compliance | Number of violations found | = 0 | Hard requirement — regulatory |
| Health Score | See `references/report-template.md` | ≥ {N}/100 | Input Skill 07/08 — not used for go-live decision |

### Section 8 Detail — Schedule & Timeline

**Use a phase-level table (4–6 rows)** — DO NOT list task-by-task. Detailed tasks belong in Sprint Plan / Jira.

| Phase | Sprint | Timeline | Main activities | Responsible team | Estimated effort |
|---|---|---|---|---|---|
| Preparation | {sprint} | {dates} | TC writing, test data scripts | {team} | {N}h |
| Functional Test | {sprint} | {dates} | Execute Functional Tests per dependency chain | {team} | {N}h |
| SIT + NFT | {sprint} | {dates} | Cross-module integration test; Performance; Security (Security Team) | {team} | {N}h |
| UAT + Retest | {sprint} | {dates} | UAT support; bug retest | {team} | {N}h |
| Go/No-Go | {sprint} | {dates} | Final sign-off; production smoke checklist | QC Lead | {N}h |

Also include: **Capacity check** = total effort / (capacity/sprint × number of sprints) = % utilization.

---

### Section 11 Detail — Approval

| Role | Name | Date signed | Signature |
|---|---|---|---|
| QC Lead / Test Manager | {Name} | | |
| Tech Lead / Dev Lead | {Name} | | |
| Product Manager / BA | {Name} | | |
| Project Manager | {Name} | | |
| Compliance / Legal | {Name} | | |

> The document may only be deployed once at least QC Lead and PM have signed.
> **If the project has Privacy/PII/IDR features** → Compliance/Legal must sign before go-live.

## Step 3 — Export file

Export complete Markdown with all 11 sections.

**Naming convention** (per `references/project-folder-convention.md`):
`Test_Plan_{project.code}_{milestone}_v{semver}_{yyyy-mm-dd}_{HHmm}.md`

**Save to:** `output_paths.test_plan` from qa-config (default: `testing-output/test-plan/`)

**Do not overwrite existing files** — each creation/edit produces a new file with a new timestamp.

## Step 4 — Export qa-config.yaml

After the Master Test Plan is complete, automatically extract it as `project/qa-config.yaml` per the schema at `references/qa-config-schema.yaml`.

**Mandatory minimum fields — return NEEDS_CONTEXT if missing:**
- `project` (name, code, sprint, domain, architecture)
- `environments.staging` (url, auth_required)
- `tools` (test_management, bug_tracker, automation.ui/api)
- `scope` (type, modules)
- `exit_criteria` (pass_rate, health_score_baseline, max_s1_open, max_s2_open, tc_executed_rate)

**Extraction rules:**
- Strictly follow key order and naming per `references/qa-config-schema.yaml`
- Set optional fields to `~` if the Test Plan does not mention them
- Do not leave `<...>` placeholders in the final output

**Save file:** `project/qa-config.yaml` (or `testing-output/qa-config.yaml` if the project/ directory does not exist yet)

After creation, suggest the user use **03-sprint-test-plan** for subsequent sprints — it is shorter and reuses this config.
