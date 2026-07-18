# Skip Register — the "unclear / not-remembered / suspected-wrong" ledger

> The SOLE place to record everything **that cannot be obtained from code** + user skips, every **suspected defect**, every `unknown`. Goal: "unclear" gets *tracked*, NOT *fabricated* to fill the gap. Copy this file into each slice's output (`_skip.md`).

| ID | Type | Topic | What is missing/suspected | Why it matters | Who knows | Status | Resolution |
|----|------|--------|----------------|-------------------|---------|-----------|------------|
| SK-001 | intent | checkout KPI | no current target | measure success | PO/analytics | open | — |
| SK-002 | unknown | column `legacy_status` | why parallel to `status` | clarify data model | former DB owner | open | — |
| SK-003 | suspected-defect | refund | code allows refund > amount collected (`refund.py:55`), no guard seen | money risk | platform lead | open | — |
| SK-004 | intent | approval rule > $500 | in the code? or added on our own? | business rule | ops | open | — |

## Columns
- **ID** `SK-NNN` sequential.
- **Type** `intent` (missing WHY) · `unknown` (cannot be derived from code) · `suspected-defect` (observed but suspected wrong) · `conflict` (person-vs-code / doc-vs-code).
- **What is missing/suspected** stated so it can be answered later.
- **Why it matters** or "low impact".
- **Who knows** the person/role to ask.
- **Status** `open`/`closed`; **Resolution** `—` when open.

## Rules
- Record immediately upon encountering anything that cannot be obtained from code / user skip / suspected wrong.
- **Never replace a skip row with a guess.** A guess (if any) is a separate `assumed` claim with a source — not "resolved".
- **Source-supplied ≠ skip.** Intent a legacy doc / ticket / commit supplies → an `assumed` as-built claim (cite the source), NOT a row here. Only what **no** source (code / doc / ticket) gives goes here — that is what PRISM defers. (Doc-vs-code WHAT conflict → code wins + a `conflict` row.)
- **Suspected-defect does NOT become an AC.** It is an open question about *correctness*, not a specification.
- Do not re-ask an item that is `open` within the same turn.
- An item the user considers unimportant: keep the row, "Why: low impact".
- **A `conflict` row (point 1) must record fully:** the diverging source (doc name / Jira-ID / commit) · **location within the source** · *what the source says* vs *what the code does* (with `path:line`). Code wins for the description, but the divergence trail must not be lost.

## Rollup (end of turn)
```
- Total: N | open X | closed Y
- suspected-defect: <list> (needs owner review)
- intent missing, blocks a later gate (if acted on): <list>
```
