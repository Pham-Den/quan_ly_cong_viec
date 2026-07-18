# Detailed Procedure: 01-review-requirements

> Token-saving archive of the previous full sub-skill body. Read only when the compact sub-skill needs exact legacy wording, templates, or edge-case procedures.

## ⚑ Pre-DONE Checklist

- [ ] Reviewed from all 3 perspectives: QC Expert, End User, BA/Dev
- [ ] TSV issues list has all required columns, no unexplained blank rows
- [ ] Completion Status clearly stated: DONE / DONE_WITH_CONCERNS / NEEDS_CONTEXT / BLOCKED
- [ ] Append execution record to `governance/audit-log.md`
- [ ] Update `project/session-state.yaml` → `last_execution.skill`, `last_execution.status`, `notes`

---

## Purpose

Review requirements documents from 3 practical perspectives: **QC Expert · End User · BA/Senior Dev**

Applicable to any domain and architecture.
Output focuses on issues that genuinely block development and testing —
not a long checklist-style academic listing.

---

## Input Variables

| Variable | Description | Example |
|------|-------|-------|
| `{DOCUMENT}` | Requirements document to review | Paste content or specific section |
| `{DOMAIN}` | Business domain | ecommerce / AI platform / fintech / data platform |
| `{ARCHITECTURE}` | Technical architecture | Microservice / Monolith / Event-driven / API-first |
| `{COMPLIANCE}` | Compliance requirements if any | PCI-DSS / GDPR / Decree 356 / N/A |

---

## ROLE 1 — QC EXPERT

You are a QC Lead with 10 years of experience. You read requirements with one single goal: to write complete and accurate test cases.

Raise and flag issues when:

**Cannot write test cases due to missing information**
- Expected output is undefined: when X happens, what does the system return?
- Pass/fail conditions are unclear: "the system processes quickly" — how quickly, in ms?
- Preconditions are unclear: what data/state is needed before running this test case?
- Actor is ambiguous: is this action performed by the user, the system, or an external service?

**Incomplete flows**
- Happy path exists but failure cases are missing: what happens if step X fails?
- Edge cases are ignored: empty values, null, upper/lower limits, timeout, concurrent requests?
- Cancel/rollback flows are not described: if the user cancels mid-way at step X, what is the system state?
- State transitions are incomplete: from state A, what states can be reached?

**Contradictions that make testing difficult**
- 2 requirements say opposite things about the same behavior
- Non-functional requirements are not measurable
- The same concept is referred to by multiple names throughout the document

---

## ROLE 2 — END USER

You are an actual end user of the system in the `{DOMAIN}` domain.
You do not care about technical details — you only care about the experience.

Raise and flag issues when:

**Business flows feel unnatural**
- Are the required steps reasonable for real-world usage?
- Is the order of actions consistent with how users actually work?
- Are there any redundant steps or unnecessary friction?

**Insufficient messages and feedback**
- When an error occurs, does the user know what went wrong and what to do next?
- Is the processing state communicated to the user (loading, pending, completed)?
- Are success/failure results clear to the user?

**Missing real-world use cases**
- What scenarios do users encounter most often that the document has not covered?
- Are there cases where a user does something wrong or differently from the expected flow that are not handled?
- Are permissions and access rights appropriate for each type of user?

---

## ROLE 3 — BA / SENIOR DEV

You are a BA or Senior Dev with many years of experience in `{ARCHITECTURE}`.
You read requirements to estimate, design, and implement.

Raise and flag issues when:

**Business rules are not clear enough to implement**
- Calculation logic has no specific formula: how is it calculated, is there rounding?
- Branching conditions are not fully covered: if A and B are both true, which takes priority?
- Priority between conflicting rules is not defined
- Business limits/constraints are not defined: what is the maximum, the minimum?

**Integration and dependencies are unclear**
- Which services/systems need to be integrated, who calls whom, in what flow?
- What data is needed from other services, in what format, and how is it handled when that service is unavailable?
- Are there any async flows? If so, how are intermediate states handled?
- With `{ARCHITECTURE}`: are the responsibility boundaries between services/modules clear?

**Technical contradictions or omissions**
- Does this requirement conflict with known technical constraints?
- Is any requirement not feasible with the `{ARCHITECTURE}` architecture?
- Is the performance expectation realistic?
- With `{COMPLIANCE}`: does the requirement adequately satisfy the compliance requirements?

**Data and state not sufficiently defined**
- Has the data model/schema needed for this feature been described?
- Is the state machine of the main object complete (all states + transitions)?
- Who owns the data, who is allowed to read/write?
- Is versioning and backward compatibility considered?

---

## Output Format

Output consists of 2 parts:

### PART 1 — TSV (paste directly into Google Sheet)

Print the header row and all issues in TSV format.
Each issue = 1 row. Columns separated by TAB.
DO NOT use commas as separators. DO NOT wrap in a code block.
If a cell's content contains a TAB or newline, replace it with a space.

Header row (copy as-is):
ID	Role	Issue Type	Location	Issue	Why It Matters	Question / Suggestion	Severity	Status

Column explanations:

| Column | Allowed Values | Notes |
|-----|-----------------|---------|
| ID | RV-001, RV-002... | Incrementing |
| Role | QC / END_USER / BA_DEV | Role that identified the issue |
| Issue Type | Missing failure case / Ambiguous / Contradiction / Not testable / Missing business rule / Missing integration spec / Missing data spec / Not feasible | Choose the closest type |
| Location | AC name / specific section | Example: AC1.2, AC3.1, Precondition |
| Issue | Brief description, max 30 words | Concise, no lengthy explanation |
| Why It Matters | Specific impact if not clarified | Example: cannot write TC, dev implements incorrectly |
| Question / Suggestion | Question for BA/PM or suggested fix | Actionable, specific |
| Severity | Blocker / Major / Minor | Blocker = must clarify before dev starts |
| Status | Open | Default Open — BA/PM updates afterward |

Example TSV row (illustration):
RV-001	QC	Missing failure case	AC3.2	No behavior described when payment gateway times out	Cannot write negative TC, dev implements arbitrarily	When GW times out after X seconds, what does the system do? What state is the order in?	Blocker	Open

---

### PART 2 — SUMMARY (after TSV)

After printing all TSV rows, also print:

```
Total issues: [N]
- Blocker: [n] — [list IDs]
- Major:   [n] — [list IDs]
- Minor:   [n] — [list IDs]

Overall assessment: [ready for dev / needs clarification before dev / needs significant rework]
Reason: [1-2 short sentences]
```

---

## Usage Notes

- If the document is long, split by section and run the prompt part by part
- TSV results should be reviewed by the QC Lead before sending to BA/PM
- Copy the entire TSV section → paste into Google Sheet cell A1 → Data > Split text to columns (separator: Tab)
- Do not use real data (PII, credentials) when pasting into the prompt
- For domains with specific compliance requirements (fintech, healthcare, AI law): fill in `{COMPLIANCE}` fully to give the AI the appropriate context

---

## Completion Status

- **DONE** — Reviewed from all 3 perspectives, TSV is complete, summary is clear
- **DONE_WITH_CONCERNS** — Completed but the document had too little information for a deep review
- **NEEDS_CONTEXT** — Needs to be supplemented: {Domain / Architecture / Compliance not provided}
- **BLOCKED** — Document is unreadable or too short for a meaningful review
