# Detailed Procedure: 11-demo-preparation

> Token-saving archive of the previous full sub-skill body. Read only when the compact sub-skill needs exact legacy wording, templates, or edge-case procedures.

## Inputs

| Information | Required |
|---|---|
| List of DONE tickets in the sprint (key, summary) | ✅ |
| Sprint name, demo date, allowed duration | ✅ |
| Attendee list (stakeholders, PO, Dev, QC) | Recommended |
| Demo environment (staging URL, test accounts) | ✅ |
| List of presenters | Recommended |

If the project has `qa-config.yaml` → read it first:
- `environments.staging.url` → default demo URL
- `team.qc_lead`, `team.qc_engineers` → potential presenter list
- `uat.stakeholders` → demo attendee list

If required information is missing → write `[Needs to be provided]`, ask again. Do not guess.

---


## Pre-DONE Checklist

> **L2 — QA Lead review required.** See the Sign-off section at the end of this file.

- [ ] Demo script complete: main flow, presenter, data, estimated timing
- [ ] Pre-demo checklist complete (environment, accounts, backup plan)
- [ ] L2 sign-off request has been emitted, awaiting QA Lead reply
- [ ] Append execution record to `governance/audit-log.md`
- [ ] Update `project/session-state.yaml` → `last_execution`, `pending_sign_offs`

---

## Step 1 — Filter and group demo tickets

From the DONE ticket list, identify:
- **Demable:** tickets with clear UI / user flows that have passed testing
- **Not directly demable:** backend-only, config, or technical hotfix tickets → add a short note under "Technical Updates"
- **Handle with care:** new features, breaking changes → prioritize stable demonstrations first

Sort demo order by the following principles:
1. Large features / high business value → demo first
2. Related flows → demo seamlessly without jumping around
3. Features with minor bugs → demo last or skip, with a clear note

---

## Step 2 — Design demo flows

For each feature group, design **1 continuous user scenario** (do not demo individual tickets separately).

Example: instead of demoing "Ticket-101: Add filter" → "Ticket-102: Export CSV" separately, combine into:
> "The user opens the report page, applies a filter by month, then exports the results to CSV."

Each demo flow must define:
- **Starting point:** specific URL / screen
- **Steps:** user actions described in business language, not technical clicks
- **End point:** the expected result the stakeholder will see
- **Estimated time:** actual time (not including Q&A)

---

## Step 3 — Prepare demo data

For each demo flow, identify what data must be ready in advance:

| Flow | Data to prepare | Account | Notes |
|---|---|---|---|
| {Flow 1} | {Data description} | {user/pass} | {Special notes} |

Data preparation principles:
- Data must be **realistic** — do not use "test123", "aaa", "1111"
- Avoid real sensitive data (real emails, ID numbers, card numbers)
- Prepare a **backup copy** if demo actions modify data (e.g., form submit → need to reset)
- Clearly document the data reset steps after each flow if needed

---

## Step 4 — Assignment and timing

Summarize into an assignment table:

| # | Demo flow | Presenter | Time | Related tickets |
|---|---|---|---|---|
| 1 | {Flow name} | {Name} | {X min} | {PROJ-XXX} |

Balance total time: leave **at least 20%** for Q&A.

---

## Step 5 — Environment checklist before demo

Create a specific checklist to verify **at least 1 day before** and **30 minutes before** the demo:

### 1 day before
- [ ] Staging environment is stable, no new deploys scheduled during the demo window
- [ ] Test accounts can log in with the correct roles / permissions
- [ ] Demo data has been prepared and verified
- [ ] All demo flows have been successfully dry-run at least once
- [ ] Demo URL has been shared with all presenters
- [ ] Backup plan identified (if environment fails → use video / screenshot)

### 30 minutes before demo
- [ ] Notifications turned off (Slack, email, system)
- [ ] Zoom / Meet / Teams link is working, screen share tested
- [ ] Browser cache cleared, at the correct starting URL
- [ ] Demo data is intact (not modified by anyone)
- [ ] Demo script document open for reference during presentation

---

## Output Format — Demo Script

```markdown




**Demo date:** [dd/mm/yyyy] | **Duration:** [X minutes]
**Environment:** [staging URL]
**Attendees:** [List]

---

## Sprint Overview

> [1-2 sentence summary of what was accomplished this sprint — written from a business perspective, not technical]

**Total tickets completed:** [N] | **Demable:** [N] | **Technical updates:** [N]

---

## Demo Scenarios

### [1. Flow name — X minutes] — Presenter: [Name]

**Objective:** [What the stakeholder will see/understand after this section]

**Starting at:** [URL / screen]

**Steps:**
1. [User action — written in business language]
2. [Next action]
3. **Highlight:** [New feature / improvement the stakeholder should notice]

**Expected result:** [What the stakeholder sees]
**Tickets:** [PROJ-XXX, PROJ-YYY]

---

### [2. Flow name — X minutes] — Presenter: [Name]

[Same as above]

---

## Technical Updates (not directly demable)

| Item | Description | Impact |
|---|---|---|
| [Ticket] | [Short description] | [Benefit / improvement] |

---

## Q&A — [X minutes]

[Leave blank — capture questions during the demo]

---

## Pre-Demo Checklist

### 1 day before
- [ ] Staging environment stable
- [ ] Test accounts OK
- [ ] Demo data ready
- [ ] Dry-run successful

### 30 minutes before
- [ ] Notifications off
- [ ] Screen share tested
- [ ] Browser at correct starting URL
- [ ] Demo data intact
```

---

**Save file to:** `output_paths.demo` from qa-config (default: `testing-output/demo/`)
→ `demo/demo-script-{project.sprint}.md`

---

## Presentation notes

- **Speak in business language** — do not explain implementation details, do not mention table names or APIs
- **Do not demo features that have not passed testing** — if required, warn upfront: "This section is still being finalized, we are demoing to collect feedback"
- **Environment issues** → do not over-apologize; switch to the backup (video / screenshot) and continue
- **Running over time** → cut less important flows, do not rush the current flow

---


## Sign-off Request (L2)



After receiving Approved: update project/session-state.yaml, remove item from pending_sign_offs.

---

## Completion Status

- **DONE** — Script complete, checklist sufficient, assignments done, data ready
- **DONE_WITH_CONCERNS** — Complete but: {Environment not stable / Some flows not yet dry-run / Missing presenter}
- **BLOCKED** — Cannot prepare due to: {Tickets not DONE / No environment available / Missing demo information}
- **NEEDS_CONTEXT** — Additional input needed: {DONE ticket list / Environment URL / Demo duration}
