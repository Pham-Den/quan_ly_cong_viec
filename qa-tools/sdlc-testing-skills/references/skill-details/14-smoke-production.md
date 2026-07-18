# Detailed Procedure: 14-smoke-production

> Token-saving archive of the previous full sub-skill body. Read only when the compact sub-skill needs exact legacy wording, templates, or edge-case procedures.

## Pre-DONE Checklist

> L3 - On-call Confirmation BLOCKING (SLA: 30 minutes). After smoke test ends: STOP. Wait for On-call to reply STABLE / ROLLBACK / MONITOR. See the Confirmation section at the end of this file.

- [ ] Smoke result is clear: STABLE / MONITOR / ROLLBACK + reason
- [ ] Every CUJ has been verified or has a note explaining why it was skipped
- [ ] On-call confirmation received
- [ ] Append execution record to governance/audit-log.md
- [ ] Update project/session-state.yaml -> last_execution, sprint_progress

---

## Inputs

| Information | Required |
|---|---|
| Production URL after deploy | ✅ |
| List of critical user journeys to verify | ✅ |
| Test account on production (dedicated test account — do not use real accounts) | ✅ |
| Deploy info: version/commit deployed, deploy time | ✅ |
| Rollback trigger conditions | Recommended |
| Smoke test results from the previous run (for baseline comparison) | Recommended |

> **Important:** Production smoke testing must be **fast** (target ≤ 15–30 minutes) and cover only CRITICAL flows. Do not test edge cases, do not test all features on production.

If the project has `qa-config.yaml` → read it first (do not ask again for values already in config):
- `environments.production.url` → production URL
- `critical_user_journeys` → list of CUJs to verify (use directly, no need to ask)
- `test_accounts` → test accounts on production
- `performance.rollback_error_rate` → error rate threshold triggering rollback
- `performance.api_p95_ms` → P95 baseline for post-deploy comparison
- `tools.communication.escalation` → channel to escalate when rollback is needed

If required information is missing → stop, ask before testing.

---

## Step 1 — Identify Critical User Journeys (CUJ)

Select a maximum of **5–10 most important flows** — those whose failure would require an immediate rollback:

**CUJ selection criteria:**
1. Direct revenue flows (payment, order placement, contract signing)
2. Flows that users use daily and most frequently
3. Flows that this deploy directly changed
4. Auth/login flows — if broken, nobody can access the system

**Do not include in smoke test:**
- Internal admin features used by few people
- Rare edge cases
- Features unrelated to this sprint

---

## Step 2 — Execute smoke test per checklist

Run each CUJ and record results immediately. **Execution principles:**

- Each CUJ is tested in **≤ 3 minutes** — do not debug, do not investigate deeply
- If a failure occurs → record it, continue testing the next CUJ, assess rollback afterwards
- Do not create real data (real orders, real payments) unless using a dedicated test account

### Standard smoke test checklist

**Auth flow (required for every deploy):**
- [ ] Login successful with test account
- [ ] Logout successful, session cleared
- [ ] Protected pages cannot be accessed after logout

**Core business flows (application-specific):**
- [ ] [CUJ 1]: [Action description + expected result]
- [ ] [CUJ 2]: [Action description + expected result]
- [ ] [CUJ 3]: [Action description + expected result]

**Basic technical checks:**
- [ ] Homepage loads successfully (HTTP 200, no critical console errors)
- [ ] No critical JavaScript errors in the console (F12 → Console)
- [ ] API health endpoint responds OK (if `/health` or `/api/status` exists)
- [ ] Features deployed in this sprint work correctly

---

## Step 3 — Monitor after deploy

While smoke testing, simultaneously check:

| Metric | Tool | Warning threshold |
|---|---|---|
| Error rate (5xx) | Grafana / Datadog / CloudWatch | > 1% → warning, > 5% → rollback |
| P95 response time | APM tool | Increases > 50% vs pre-deploy |
| CPU / Memory | Server monitoring | CPU > 90% continuously for 5 minutes |
| Active users | Analytics | Unusual drop immediately after deploy |
| Exception count | Sentry / logging | Sudden spike vs baseline |

**Observation period:** At least 15 minutes after deploy before concluding "stable".

---

## Step 4 — Go / Rollback decision

### Rollback immediately (no waiting) if:
- Any CUJ fails — especially auth, payment, core flows
- 5xx error rate > 5% for 5 consecutive minutes
- P95 response time increases > 100% and is not decreasing
- Data corruption detected
- Many users reporting inability to access the system

### Monitor closely (do not rollback immediately) if:
- Secondary CUJ fails but core CUJ is fine
- Error rate increases slightly (1–5%) and is trending down
- A new feature has a minor bug that does not affect existing flows

### Stable if:
- All CUJs pass
- Error rate < 1%, not increasing
- Response time within baseline
- Monitoring normal after 15 minutes

---

## Output Format — Smoke Test Result

```markdown




| Field | Value |
|---|---|
| **Deploy time** | [dd/mm/yyyy HH:mm] |
| **Version / Commit** | [v1.2.3 / abc1234] |
| **Smoke test time** | [HH:mm] – [HH:mm] (total [N] minutes) |
| **Tester** | [Name] |
| **Environment** | Production — [URL] |

---

## CUJ Results

| # | Critical User Journey | Result | Duration | Notes |
|---|---|---|---|---|
| 1 | Login | ✅ Pass / ❌ Fail | [N]s | |
| 2 | [Core flow 1] | ✅ Pass / ❌ Fail | [N]s | |
| 3 | [Core flow 2] | ✅ Pass / ❌ Fail | [N]s | |

**Total:** [N] Pass / [N] Fail / [N] Skip

---

## Monitoring snapshot (15 minutes after deploy)

| Metric | Before deploy | After deploy | Status |
|---|---|---|---|
| Error rate (5xx) | [x]% | [x]% | ✅ / ⚠️ / ❌ |
| P95 response time | [N]ms | [N]ms | ✅ / ⚠️ / ❌ |
| CPU | [x]% | [x]% | ✅ / ⚠️ / ❌ |

---

## Issues found

### [SMOKE-001: Issue name] — If any

| Field | Value |
|---|---|
| **Affected CUJ** | [CUJ name] |
| **Description** | [Expected vs Actual] |
| **Screenshot** | [Link] |
| **Decision** | Rollback / Monitor / Accept |

---

## FINAL DECISION

> ### ✅ STABLE — Deploy successful
> All [N] CUJs passed. Monitoring stable. Error rate [x]%. Deploy confirmed successful.

> ### ⚠️ MONITOR — Continue monitoring
> [N]/[N] CUJs passed. Minor issue at [CUJ name] but does not affect core flows.
> **Action:** Monitor for [N] more minutes. Escalate if error rate > [x]%.

> ### ❌ ROLLBACK — Execute rollback immediately
> **Reason:** [CUJ X failed — payment flow not working / Error rate [x]% / ...]
> **Execute:** [Rollback owner name] initiating rollback at [HH:mm].
> **Notify:** [Notification channel — Slack #deploy-alerts / on-call group]

---

*Smoke test end time: [HH:mm] | Conclusion: [STABLE / MONITOR / ROLLBACK]*
```

---

## Post-smoke checklist (after STABLE conclusion)

- [ ] Notify team: deploy successful, smoke test passed
- [ ] Update release notes / changelog
- [ ] Close sprint / release ticket
- [ ] Log deploy time and version in deploy history
- [ ] Cleanup: delete test data created on production (if any)

---

## Completion Status

- **DONE** — Smoke test complete, decision clear (Stable / Monitor / Rollback)
- **DONE_WITH_CONCERNS** — Stable but items require further monitoring: {Error rate slightly above normal / Secondary CUJs not verified}
- **BLOCKED** — Cannot smoke test due to: {No test account on production / Environment is down / Deploy not yet complete}
- **NEEDS_CONTEXT** — Additional input needed: {Production URL / CUJ list / Production test account}




---

## Final Step — Sign-off (L3 — Ops) + Audit Log

### 1. Smoke result confirmation (L3 — SLA: 30 minutes)

```
---
🔴 CONFIRMATION REQUIRED — 14-smoke-production (Level 3 — On-call)
Confirmers:
  - QC Lead: [team.qc_lead from qa-config]
  - On-call Dev: [team.dev_lead from qa-config]
Deadline: 30 minutes after smoke test ends
Output: testing-output/reports/gate/smoke-{sprint}-{date}.md
Required actions:
  - Reply "STABLE" / "ROLLBACK" / "MONITOR [N] minutes"
If ROLLBACK → execute immediately, no further approval needed.
---
```

**Special case — ROLLBACK:** No need to wait for approval. Notify immediately and log with status=ROLLBACK.

### 2. Post-smoke Tool Integration

After receiving confirmation:

```bash
# Publish smoke result
python tools/confluence_publish_markdown.py \
  --file "testing-output/reports/gate/smoke-{sprint}-{date}.md" \
  --parent-page "{confluence.parent_pages.team_root}/Production Deployments"

# If STABLE — update Jira
python tools/jira_sync.py --action transition \
  --issue "{sprint_ticket_id}" \
  --status "Done" \
  --comment "Smoke STABLE: {N}/{N} CUJ pass. Deploy confirmed {date} {time}."

# If ROLLBACK — update Jira urgent
python tools/jira_sync.py --action comment \
  --issue "{sprint_ticket_id}" \
  --comment "ROLLBACK triggered: [reason]. Notify @oncall-dev."
```

### 3. Audit Log

```yaml
execution_record:
  id: "{yyyy-mm-dd}-{HHmm}-14-smoke"
  timestamp: "{yyyy-mm-ddTHH:mm}"
  skill: "14-smoke-production"
  project: "{project.name}"
  sprint: "{project.sprint}"
  executor: "{executor}"
  input_summary: "Smoke production {version}: {N}/{N} CUJ, decision: STABLE/MONITOR/ROLLBACK"
  output_paths:
    - "testing-output/reports/gate/smoke-{sprint}-{date}.md"
  status: "DONE | DONE_WITH_CONCERNS | BLOCKED"
  requires_human_review: true
  reviewer: null
  reviewed_at: null
  sign_off_status: "PENDING | APPROVED (STABLE) | APPROVED (ROLLBACK)"
```
