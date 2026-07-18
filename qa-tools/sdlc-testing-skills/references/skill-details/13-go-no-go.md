# Detailed Procedure: 13-go-no-go

> Token-saving archive of the previous full sub-skill body. Read only when the compact sub-skill needs exact legacy wording, templates, or edge-case procedures.

## Pre-DONE Checklist

> L3 - PM/PO/Tech Lead Approval BLOCKING (SLA: 4h). After generating the report: STOP. Do not publish to Confluence, do not update Jira until a reply is received. See the Approval section at the end of this file.

- [ ] Go/No-Go report complete: exit criteria comparison, risks, clear decision
- [ ] UAT sign-off received first (prerequisite)
- [ ] L3 Approval received: GO / NO-GO / GO with conditions
- [ ] Append execution record to governance/audit-log.md
- [ ] Update project/session-state.yaml -> last_execution, pending_sign_offs

---

## Step 0 — Read qa-config.yaml (if available)

If the project has `qa-config.yaml` → read and use the following values directly, no need to ask again:

| Field in config | Used for |
|---|---|
| `exit_criteria.*` | Gate 1 — thresholds: pass_rate, health_score_baseline, max_s1_open, max_s2_open, tc_executed_rate |
| `uat.required`, `uat.stakeholders` | Gate 2 — confirm whether the UAT gate applies |
| `security.focus` | Gate 3 — list of OWASP categories to check |
| `accessibility.required`, `accessibility.lighthouse_score_min` | Gate 3.5 — accessibility threshold |
| `performance.*` | Gate 4 — p95 and error rate thresholds |
| `environments.production.*` | Gate 5 — deploy readiness checklist |
| `team.qc_lead` | Person signing the Go/No-Go report |

If `qa-config.yaml` is not available → read Exit Criteria from the Test Plan. Clearly state the source being used at the top of the report.

## Inputs

| Information | Required |
|---|---|
| End-of-sprint Test Report (or aggregated test results) | ✅ |
| `qa-config.yaml` (preferred source) **or** original Test Plan (fallback) | ✅ one of the two |
| List of open bugs (ID, severity, priority) | ✅ |
| UAT sign-off result (if `uat.required: true` in config) | Per config |
| Security test / performance test results (if available) | Recommended |
| Expected deploy date | ✅ |

If required information is missing → write `[Needs to be provided]`, ask again. Do not infer results.

## Step 1 — Evaluate each gate

Assess each gate in sequence. Each gate must have a **clear Pass or Fail** — do not write "N/A" without a valid reason.

### Gate 1 — Testing quality

Read `../../references/report-template.md` and `../../references/bug-severity.md` for standard thresholds.

| Metric | Exit Criteria | Actual | Result |
|---|---|---|---|
| Pass rate | ≥ {x}% (from Test Plan) | {x}% | ✅ / ❌ |
| Health Score | ≥ {N}/100 | {N}/100 | ✅ / ❌ |
| S1 (Critical) bugs still open | = 0 | {N} | ✅ / ❌ |
| S2 (High) bugs still open | ≤ {N} | {N} | ✅ / ❌ |
| TCs not executed (Not Run) | = 0 | {N} | ✅ / ❌ |
| Regression test pass rate | = 100% | {x}% | ✅ / ❌ |

### Gate 2 — UAT (if applicable)

| Metric | Requirement | Actual | Result |
|---|---|---|---|
| UAT sign-off | Sign-off from key stakeholder | ✅ / ❌ | ✅ / ❌ |
| S1 UAT bugs still open | = 0 | {N} | ✅ / ❌ |
| % of users completing UAT | ≥ {N}% | {x}% | ✅ / ❌ |

### Gate 3 — Security (if security test was performed)

| Metric | Requirement | Actual | Result |
|---|---|---|---|
| S1 (Critical) vulnerabilities still open | = 0 | {N} | ✅ / ❌ |
| S2 (High) vulnerabilities still open | = 0 (or ≤ N with risk acceptance) | {N} | ✅ / ❌ |

### Gate 3.5 — Accessibility (if accessibility test was performed or qa-config `accessibility.required: true`)

| Metric | Requirement | Actual | Result |
|---|---|---|---|
| Lighthouse Accessibility Score | ≥ {N} (typically ≥ 80) | {N}/100 | ✅ / ❌ |
| S1 accessibility errors (keyboard trap, dangerous) | = 0 | {N} | ✅ / ❌ |
| S2 accessibility errors (contrast, label, focus) | ≤ {N} or has fix plan | {N} | ✅ / ❌ |

### Gate 4 — Performance (if performance test was performed)

| Metric | Requirement | Actual | Result |
|---|---|---|---|
| P95 response time | ≤ SLA | {N}ms | ✅ / ❌ |
| Error rate under load | < 1% | {x}% | ✅ / ❌ |

### Gate 5 — Deploy readiness

| Item | Status | Notes |
|---|---|---|
| Release notes prepared | ✅ / ❌ | |
| Rollback plan confirmed | ✅ / ❌ | |
| DB backup before deploy | ✅ / ❌ | |
| Stakeholder / user notification | ✅ / ❌ | |
| Monitoring / alerting ready | ✅ / ❌ | |
| Maintenance window announced (if needed) | ✅ / ❌ / N/A | |

## Step 2 — Assess open bugs

For each open bug, evaluate the **risk acceptance** position for deployment:

| Bug ID | Severity | Description | Impact if deployed | Decision |
|---|---|---|---|---|
| BUG-001 | S2 | {Description} | {Impact} | Fix first / Accept risk / Defer |
| BUG-002 | S3 | {Description} | {Impact} | Fix first / Accept risk / Defer |

**Principles:**
- S1 still open → **DO NOT deploy** (no exceptions)
- S2 still open → Deploy only with **written risk acceptance** from the Product Owner / authorized stakeholder
- S3/S4 still open → Deployable; clearly record in the release's Known Issues

## Step 3 — Deployment risk analysis

| Risk | Likelihood | Impact | Mitigation |
|---|---|---|---|
| {Technical risk — DB migration, breaking API change} | High / Medium / Low | {Description} | {Action} |
| {Business risk — new feature affecting existing flows} | High / Medium / Low | {Description} | {Action} |
| {Environment risk — deploying during peak hours} | High / Medium / Low | {Description} | {Action} |

## Step 4 — Define rollback plan

If the deploy fails or an S1 emerges after deploy:

| Step | Action | Owner | Estimated time |
|---|---|---|---|
| 1 | Detect critical issue | QC / Dev On-call | Immediately |
| 2 | Notify emergency channel | [Slack channel / Chat group] | 5 minutes |
| 3 | Rollback decision | [Authorized person] | 10 minutes |
| 4 | Execute rollback | Dev / DevOps | [N] minutes |
| 5 | Verify after rollback | QC | [N] minutes |
| 6 | Announce completion | PM / stakeholder | Immediately after verify |

## Output Format — Go/No-Go Report

```markdown




| Field | Value |
|---|---|
| **Assessment date** | [dd/mm/yyyy] |
| **Planned deploy** | [dd/mm/yyyy HH:mm] |
| **Environment** | Production |
| **Assessed by** | [QC Lead name] |
| **Final approver** | [PM / PO / Tech Lead name] |

---

## Gate Results

| Gate | Key metrics | Result |
|---|---|---|
| Gate 1 — Test quality | Pass rate [x]% / Health Score [N] / S1 open: [N] | ✅ Pass / ❌ Fail |
| Gate 2 — UAT | Sign-off: [N/N] users / S1 UAT open: [N] | ✅ Pass / ❌ Fail / ⬜ Skip |
| Gate 3 — Security | S1 sec open: [N] / S2 sec open: [N] | ✅ Pass / ❌ Fail / ⬜ Skip |
| Gate 3.5 — Accessibility | Lighthouse: [N]/100 / S1 a11y: [N] | ✅ Pass / ❌ Fail / ⬜ Skip |
| Gate 4 — Performance | P95: [N]ms / Error rate: [x]% | ✅ Pass / ❌ Fail / ⬜ Skip |
| Gate 5 — Deploy readiness | Rollback plan, monitoring, notifications | ✅ Pass / ❌ Fail |

---

## Open bugs at time of deploy

| Bug ID | Severity | Description | Decision | Approver |
|---|---|---|---|---|
| BUG-XXX | S2 | [Description] | Accept risk | [PO name] |

---

## Risks and Mitigation

| Risk | Likelihood | Impact | Mitigation |
|---|---|---|---|
| [Risk] | Low / Medium / High | [Description] | [Action] |

---

## Rollback Plan

- **Trigger:** [Conditions that trigger rollback — e.g., error rate > 5% in the first 10 minutes]
- **Rollback time:** [N] minutes
- **Decision maker:** [Name + contact]
- **Rollback method:** [Revert deploy / Restore DB backup / Feature flag off]

---

## DECISION

> ### ✅ GO — Proceed with deploy as scheduled
> **Reason:** All gates passed. No S1 open. Health Score [N]/100 meets exit criteria.

> ### ⚠️ CONDITIONAL GO — Deploy approved, monitor closely post-deploy
> **Conditions:** [S2 bug BUG-XXX accepted as risk by [PO name]. Roll back immediately if error rate > [N]%.]

> ### ❌ NO-GO — Stop, deploy conditions not met
> **Reason:** [S1 BUG-XXX still open / Pass rate [x]% below exit criteria [y]% / UAT gate has no sign-off]
> **Next steps:** [Fix BUG-XXX, retest, reassess on [dd/mm]]

---

*This report is the official basis for the deploy decision. Any changes after sign-off require re-approval.*
```

**Save file to:** `output_paths.reports.gate` from qa-config (default: `testing-output/reports/gate/`)
→ `reports/go-no-go-{project.sprint}-{yyyy-mm-dd}_{HHmm}.md`

## Completion Status

- **DONE** — Go/No-Go report complete, decision clear, approval received
- **DONE_WITH_CONCERNS** — Decision is GO but risks require post-deploy monitoring
- **BLOCKED** — Cannot assess due to: {Missing test report / No UAT sign-off / No security test results}
- **NEEDS_CONTEXT** — Additional input needed: {Exit criteria from Test Plan / List of open bugs / Final test results}




---

## Final Step — Tool Integration + Approval + Audit Log (Level 3)

### 1. Approval Request (L3 — BLOCKING before publish)

AI stops completely after generating the report. Do not push to Confluence, do not update Jira until approval is received:

```
---
🔴 APPROVAL REQUIRED — 13-go-no-go (Level 3 — PM/PO/Tech Lead)
Approvers:
  - PM: [team.pm from qa-config]
  - Product Owner: [team.product_owner from qa-config]
  - Tech Lead: [team.dev_lead from qa-config]
Deadline: [current date + 4h]
Output: testing-output/reports/gate/go-no-go-{sprint}-{date}.md
Required actions:
  - Review the DECISION section in the report
  - Reply "GO" / "NO-GO" / "GO with conditions: [...]"
After receiving reply → AI will publish to Confluence and update Jira.
---
```

### 2. Post-approval Tool Integration

Only execute AFTER receiving an approval reply:

**Publish Go/No-Go report to Confluence:**
```bash
python tools/confluence_publish_markdown.py \
  --file "testing-output/reports/gate/go-no-go-{sprint}-{date}.md" \
  --parent-page "{confluence.parent_pages.team_root}/Release Gates"
```

**Update Jira sprint:**
```bash
python tools/jira_sync.py --action transition \
  --issue "{sprint_ticket_id}" \
  --status "Ready for Release" \
  --comment "Go/No-Go: [GO/NO-GO]. Report: [Confluence link]"
```

**If NO-GO:**
```bash
python tools/jira_sync.py --action comment \
  --issue "{sprint_ticket_id}" \
  --comment "NO-GO: [Reason]. Need to fix: [bug IDs]. Deploy postponed."
```

### 3. Audit Log

```yaml
execution_record:
  id: "{yyyy-mm-dd}-{HHmm}-13-gng"
  timestamp: "{yyyy-mm-ddTHH:mm}"
  skill: "13-go-no-go"
  project: "{project.name}"
  sprint: "{project.sprint}"
  executor: "{executor}"
  input_summary: "Go/No-Go {sprint}: Pass {N}%, Health {N}/100, S1 open {N}, Deploy {date}"
  output_paths:
    - "testing-output/reports/gate/go-no-go-{sprint}-{date}.md"
  status: "DONE | DONE_WITH_CONCERNS | BLOCKED"
  requires_human_review: true
  reviewer: null
  reviewed_at: null
  sign_off_status: "PENDING"
```
