# Human Approval Protocol

Human approval process for QA skill outputs. This document is for **the AI** (to know when to stop and request approval) and for **QA Leads / PMs** (to know what they need to do).

---

## For the AI — When to stop and request approval

### Rule 1: Do not proceed past L3 gates on your own
After completing the output of skills 12, 13, or 14 → stop completely, emit an approval request, and wait for a response from the user.

### Rule 2: Do not push artifacts until approved
Tool integrations (Confluence push, Jira update, QMetry import) may only be executed after:
- L2: QA Lead confirms
- L3: Stakeholder approves

### Rule 3: Write to the audit log immediately after completion
Whether DONE or BLOCKED, always append an execution_record to `governance/audit-log.md`.

### Rule 4: Rollback does not require approval
In skill 14-smoke-production, if the conclusion is ROLLBACK → do not wait for approval, notify immediately and write to the log.

---

## For QA Leads / PMs — How to approve

### When receiving a Sign-Off Request (L2):

1. Open the output file at the specified path
2. Verify using the checklist for the corresponding skill
3. Reply in the AI chat:
   - `"Approved"` → AI updates audit log and proceeds
   - `"Approved with note: [content]"` → AI updates log and proceeds
   - `"Needs revision: [specific content]"` → AI revises and requests review again

### When receiving an Approval Request (L3):

1. Read the full output (go-no-go report / UAT sign-off / smoke result)
2. Verify all gates have passed
3. Reply:
   - **Go-no-go**: `"GO"` / `"NO-GO"` / `"GO with condition: [...]"`
   - **UAT**: `"Signed off"` / `"Fix first: [bug IDs]"`
   - **Smoke**: `"STABLE"` / `"ROLLBACK"` / `"MONITOR [N] minutes"`
4. The AI will:
   - Update the audit log with the approval
   - Execute tool integration (push artifacts)
   - Continue the next step of the flow (or stop if NO-GO/ROLLBACK)

---

## Traceability matrix

Every L3 decision must be traceable from:
```
Requirement → Test Case → Test Execution → Bug → Go/No-Go Decision → Deploy
```

The AI maintains traceability by:
- Trace field in every TC (linking to US/AC ID)
- Bug ID in daily report linking to failed TC
- Go/No-Go report referencing sprint report + UAT result
- Audit log linking execution records to each other

---

## List of approvers (configured in qa-config.yaml)

```yaml
team:
  qc_lead: "QC Lead Name"
  dev_lead: "Dev Lead Name"
  pm: "PM Name"
  product_owner: "PO Name"
  stakeholders:
    - name: "Name"
      role: "Business Analyst / End User Rep / ..."
      uat_required: true
```

If `qa-config.yaml` does not exist yet → the AI asks the user to provide the approver names before emitting an approval request.
