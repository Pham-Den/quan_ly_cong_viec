# Detailed Procedure: 12-uat-support

> Token-saving archive of the previous full sub-skill body. Read only when the compact sub-skill needs exact legacy wording, templates, or edge-case procedures.

## Pre-DONE Checklist

> L3 - Stakeholder Approval BLOCKING (SLA: 48h). After generating the UAT Summary: STOP. Do not send to the user until PO/Business signs off. See the Approval section at the end of this file.

- [ ] UAT Guide + Feedback Summary + Sign-off Tracker complete
- [ ] Every bug raised during UAT has been classified (blocking/non-blocking)
- [ ] L3 Approval received: record approver name and date
- [ ] Append execution record to governance/audit-log.md
- [ ] Update project/session-state.yaml -> last_execution, pending_sign_offs

---

## Inputs

| Information | Required |
|---|---|
| List of user stories / features to UAT | ✅ |
| List of UAT participants (name, role, department) | ✅ |
| UAT environment (URL, accounts) | ✅ |
| UAT period (start date – end date) | ✅ |
| Acceptance criteria from tickets / Test Plan | Recommended |
| Feedback template currently in use (if any) | Recommended |

If the project has `qa-config.yaml` → read it first:
- `uat.required` → confirm whether UAT is mandatory
- `uat.stakeholders` → list of participants and sign-off owners
- `environments.uat.url` → UAT environment URL
- `test_accounts` → test accounts for UAT participants
- `tools.communication.channel` → channel for receiving feedback

If required information is missing → write `[Needs to be provided]`, ask again.

---

## Step 1 — Prepare UAT guidance documents

Create documentation for **end users** — not technical testers. Language must be:
- Simple, no technical jargon (do not write "test case", "regression", "API")
- Describe actions from the user's perspective ("Go to page X, click button Y...")
- Include screenshots / instructional videos if the feature is complex

Document structure:

### 1.1 General information
- UAT purpose: "We need you to try the new features and confirm they work correctly for your business."
- Period: [start date – end date]
- How to provide feedback: [link to form / email / Slack channel]
- Contact for support: [name, contact]

### 1.2 Test scenarios

For each feature, write a scenario in this format:

```
Scenario [N]: [Scenario name — written in business terms]

Context: [Describe the situation the user is encountering]

You need to:
  1. Go to [specific URL]
  2. [Specific action]
  3. [Next action]

Expected result: [What you should see after completing the steps]

Feedback questions:
  - Did this scenario work as you expected? (Yes / No / Partially)
  - If No or Partially: Describe what was wrong?
  - Does this feature help with your daily work?
```

### 1.3 How to report issues

Guide users on reporting problems:
- Take a screenshot when encountering an error
- Clearly describe: what you were doing, what you saw, what you expected
- Clearly state: browser name, device (if relevant)

---

## Step 2 — Track UAT progress

Create a tracking sheet for each participant:

| User | Department | Scenario 1 | Scenario 2 | Scenario 3 | Sign-off |
|---|---|---|---|---|---|
| [Name] | [Dept] | ✅ Pass / ❌ Fail / ⏳ Not tried | ... | ... | ⏳ Pending |

**Escalate when:** a user has not provided feedback after 2 days → proactively follow up.

---

## Step 3 — Consolidate and classify feedback

When receiving user feedback, classify it as:

### Type 1 — Real bug (must fix before go-live)
- Feature does not work according to acceptance criteria
- Error blocking an important business flow
- **Action:** Hand off to QA team, create a bug ticket with severity

### Type 2 — Change Request
- Feature works per spec but user wants something different
- Example: "I want this column displayed before that column"
- **Action:** Log to backlog, do NOT fix in this sprint. Record for Product review.

### Type 3 — Misunderstanding / Needs more guidance
- User reports a "bug" but it is actually due to unfamiliarity with the feature
- **Action:** Provide guidance, update the documentation if needed

### Type 4 — Enhancement / Nice-to-have
- Non-mandatory improvement suggestion
- **Action:** Log to backlog with an "Enhancement" label

---

## Step 4 — Manage Sign-off

UAT is only complete when a clear sign-off is received from an authorized person.

**Sign-off conditions:**
- [ ] All mandatory scenarios have been attempted by at least [N]% of users
- [ ] No Type 1 (real) bugs remain open
- [ ] Change Requests have been reviewed and classified by the Product Owner
- [ ] Key stakeholder users have signed off

**Minimum sign-off form:**

```
I, [Name], [Title], confirm that I participated in UAT for [Feature name / Sprint]
from [dd/mm] to [dd/mm/yyyy].

Result: ✅ Accepted / ❌ Not accepted (reason: ...)

Conditions for deploy (if not fully accepted): [...]

Signature: _______________ Date: _______________
```

---

## Output Format — UAT Feedback Summary

```markdown




| Field | Value |
|---|---|
| **UAT period** | [dd/mm] – [dd/mm/yyyy] |
| **Participants** | [N] users / [N] departments |
| **Scenarios** | [N] scenarios |
| **Total feedback received** | [N] |

---

## Results by scenario

| Scenario | Pass | Fail | Partial | Not tried |
|---|---:|---:|---:|---:|
| Scenario 1: [Name] | [N] | [N] | [N] | [N] |

---

## Feedback classification

| Type | Count | Notes |
|---|---:|---|
| Real bug (must fix) | [N] | [Ticket IDs] |
| Change Request | [N] | [Move to backlog] |
| Misunderstanding / needs guidance | [N] | |
| Enhancement | [N] | |

---

## Bugs raised during UAT

| Bug ID | Description | Reported by | Severity | Status |
|---|---|---|---|---|
| BUG-UAT-001 | [Description] | [Name] | S1/S2/S3 | Open / Fixed |

---

## Sign-off Status

| User | Department | Status | Notes |
|---|---|---|---|
| [Name] | [Dept] | ✅ Signed / ❌ Rejected / ⏳ Pending | [Conditions if any] |

**Conclusion:**
- ✅ UAT passed — Can proceed to go-live
- ⚠️ UAT passed with conditions — Need to fix [N] bugs before go-live, [N] CRs moved to next sprint
- ❌ UAT not passed — [Specific reason]
```

---

## Completion Status

- **DONE** — UAT documentation complete, feedback consolidated, sign-off received
- **DONE_WITH_CONCERNS** — Complete but: {Some users have not tried / Change Requests still unclassified / Conditional sign-off}
- **BLOCKED** — Cannot proceed due to: {UAT environment not ready / Users not participating / No acceptance criteria}
- **NEEDS_CONTEXT** — Additional input needed: {Participant list / Acceptance criteria / UAT period}




---

## Final Step — Sign-off + Audit Log (Level 3 — Stakeholder)

### 1. Publish UAT Summary to Confluence

```bash
python tools/confluence_publish_markdown.py \
  --file "testing-output/reports/gate/uat-summary-{sprint}.md" \
  --parent-page "{confluence.parent_pages.team_root}/UAT"
```

### 2. Approval Request (L3 — BLOCKING)

AI stops completely. Do not proceed with any steps until approval is received:

```
---
🔴 APPROVAL REQUIRED — 12-uat-support (Level 3 — Stakeholder)
Approvers:
  - Product Owner: [team.product_owner from qa-config]
  - Business Rep: [team.stakeholders[] with uat_required=true]
Deadline: [current date + 48h]
Output: testing-output/reports/gate/uat-summary-{sprint}.md
Required actions:
  - Review the UAT Sign-off Status table
  - Reply "Signed off" (if passed) or "Need to fix: [bug IDs]"
No further actions until a reply is received.
---
```

### 3. Audit Log

```yaml
execution_record:
  id: "{yyyy-mm-dd}-{HHmm}-12-uat"
  timestamp: "{yyyy-mm-ddTHH:mm}"
  skill: "12-uat-support"
  project: "{project.name}"
  sprint: "{project.sprint}"
  executor: "{executor}"
  input_summary: "UAT {sprint}: {N} users, {N} scenarios, {N} bugs raised"
  output_paths:
    - "testing-output/reports/gate/uat-summary-{sprint}.md"
  status: "DONE | DONE_WITH_CONCERNS | BLOCKED"
  requires_human_review: true
  reviewer: null
  reviewed_at: null
  sign_off_status: "PENDING"
```
