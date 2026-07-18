# Sign-Off Gates — QA Skill Suite

Defines human approval gates for each skill. The AI **must not** mark Completion Status as `DONE` for Level 2/3 skills without explicit confirmation from the user.

---

## Gate table by skill

| Skill | Level | Approver | SLA | DONE condition |
|---|---|---|---|---|
| 01-review-requirements | L1 — Auto | Not required | — | AI completes on its own |
| 02-test-plan | L1 — Auto | Not required | — | AI completes on its own |
| 03-sprint-test-plan | L1 — Auto | Not required | — | AI completes on its own |
| 04-test-design-high-level | L1 — Auto | Not required | — | AI completes on its own (HLTC gate is internal) |
| 05-gen-tc-functional | L1 — Auto | Not required | — | AI completes on its own |
| 06-gen-tc-sit | L1 — Auto | Not required | — | AI completes on its own |
| 07-review-tc | L2 — QA Review | QA Lead | 24h | QA Lead confirms coverage is sufficient |
| 08-gen-data-test | L1 — Auto | Not required | — | AI completes on its own |
| 09-check-result | L2 — QA Review | QA Lead | 4h | QA Lead reviews and confirms daily report |
| 10-test-report | L2 — QA Review | QA Lead | 8h | QA Lead reviews and signs sprint report |
| 11-demo-preparation | L1 — Auto | Not required | — | AI completes on its own |
| 12-uat-support | **L3 — Stakeholder** | Product Owner + Business Rep | 48h | Stakeholder signs UAT sign-off form |
| 13-go-no-go | **L3 — Stakeholder** | PM / PO / Tech Lead | 4h | Decision is signed by the authorized person |
| 14-smoke-production | **L3 — Ops** | QC Lead + On-call Dev | 30min | STABLE/ROLLBACK confirmed within 30 minutes |
| qa-automation/01 | L1 — Auto | Not required | — | AI completes on its own |
| qa-automation/02 | L2 — Dev Review | QC Lead + Dev | 24h | Code review + test run passes without errors |
| qa-specialist/01-03 | L2 — QA Review | QA Lead | 24h | QA Lead reviews report |

---

## governance_mode overrides

When `project/qa-config.yaml` sets `governance.mode`:
- `lightweight` — L2 skills emit a sign-off summary for audit trail but do not block on approval. L3 skills are **not** affected — they always block.
- `standard` (default) — All L2/L3 gates apply as defined above.
- `enterprise` — L2 escalates to L2+L3 (QA Lead + Stakeholder). SLA doubles.

---

## Level definitions

### Level 1 — Auto-complete
AI completes the output and marks itself DONE. No approval required.
Applies to: skills explicitly listed as L1 in the gate table above (currently: 01–06, 08, 11, qa-automation/01).

### Level 2 — QA Review Required
AI completes the output and emits a **sign-off request**. DONE only after QA Lead/reviewer confirms.
AI must not proceed to the next skill without that confirmation.

**Sign-off request format (emitted by AI at the end of an L2 skill):**
```
---
⏳ SIGN-OFF REQUEST — [Skill Name]
Reviewer required: [QA Lead name from qa-config]
SLA: [N] hours
Output saved at: [path]
Action required: Review output → reply "Approved" or "Needs revision: [content]"
---
```

### Level 3 — Stakeholder Approval Required
AI completes the output and **stops completely**. No action of any kind (including Confluence push, Jira update) until approval is received.

**Approval request format (emitted by AI at the end of an L3 skill):**
```
---
🔴 APPROVAL REQUIRED — [Skill Name] — BLOCKING
Approver: [Name + role]
Deadline: [yyyy-mm-dd HH:mm]
Output saved at: [path]
Mandatory action: Read output → confirm "GO" / "NO-GO" / "Needs revision"
No further action will be taken until a response is received.
---
```

---

## Escalation when SLA is exceeded

| Situation | Action |
|---|---|
| L2 review not received after 24h | AI reminds the user, does not self-proceed |
| L3 approval past deadline | AI escalates to PM/sponsor and records in audit log |
| Approver not available | Follow the escalation chain in `qa-config.yaml > team` |

---

## Audit log integration

After each sign-off/approval:
- AI updates `governance/audit-log.md`:
  - `sign_off_status`: `APPROVED` or `REJECTED`
  - `reviewer`: name of the approver
  - `reviewed_at`: date of approval
