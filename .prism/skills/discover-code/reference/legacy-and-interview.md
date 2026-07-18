# Legacy docs + Interview (getting WHY without fabricating)

> Code gives **WHAT** (the mechanism). **WHY** (goal/KPI/reason/"how it should be") is not in the code → get it from (by strength): **the original Jira/ticket (via MCP) · git commit message · old documentation (including a multi-file dump pile of PRD/SAD) · interview**; if missing then **skip** (do not fabricate). All of it is `assumed` (desired-intent) — code remains the arbiter for WHAT.

---

## A. Triage scattered old documentation (if any)

> **Where they live:** default **`docs/legacy/`** (not mandatory). If that folder is empty or you are unsure, **ask the user** where existing docs are — or to confirm there are none — before concluding there are none.

Old documentation is often already out of sync with the code → **code is the arbiter**. For each old doc:

| Verdict | Meaning | Action |
|---|---|---|
| **Aligned** | matches the code | use it; cite both the doc + the confirming code |
| **Conflicts** | contradicts the code | **code wins**; record both, flag the conflict, do not trust the doc |
| **Stale/obsolete** | describes something changed/removed | quarantine, do NOT put into the inbox |
| **Intent-only** | WHY (goal/reason) cannot be verified from code | **keep — this is gold**; tag `assumed` until a person confirms |
| **Unclear** | not clear whether it is still correct | move it into the interview questions |

- Dedupe repeated statements across docs; keep the most specific version.
- **Quarantine ≠ inbox:** stale/obsolete must not get mixed into the as-built.

## A2. Large doc dump pile + Git + Jira

**Large dump (user dumps many PRD/SAD/…):** process it in batches, do not read sequentially and blindly — (1) **inventory** all of it (name/path/last-modified/type); (2) **classify** each doc → inbox target (product/arch/design…); (3) **dedupe** across-file; (4) **verdict** as in §A; (5) **extract intent**. Stale → quarantine. Prioritize reading what is *relevant to the slice being worked on* first.

**Git commit:** mine the message for WHY (why something was added/changed) + history/blame/churn (hotspots, suspected dead-code). `assumed`, cross-check the code. *(detail: `reference/methodology.md` Step 1.5)*

**Jira (via MCP):** grep commits for a Jira key (`[A-Z]+-\d+`)/URL → open the ticket via **MCP Atlassian** to get the original requirement/intent — the strongest WHY source, but `assumed` (the ticket may already be out of sync with the code) → cross-check + ask for confirmation if important. MCP absent (headless/cron) → record the Jira link into the Skip Register for a person to open.

**Whole-vs-sharded collision (BMAD):** if a doc exists both as a whole version (`prd.md`) and a sharded version (`prd/`) → **flag + ask the user which one is canonical**, do not choose on your own.

**Tests as a source of *expected behavior*:** a test is also a form of intent (the author *expects* the code to do something) → corroborate the AC; a test contradicting the code = suspected-defect/stale. Detail in `reference/methodology.md` (section "Tests = corroboration").

## B. Interview to get WHY (when code/doc is not enough)

**Skip-contract (in bold, applies to every question):**
> *"Any question you don't remember / aren't sure about / isn't important → just skip it. I will record it as not-yet-clear (Skip Register), I will NOT fabricate."*

Questioning principles:
- **Show what-already-exists FIRST, then ask about intent.** *"I see the code is doing X (`path:line`). What is the goal/intent behind it?"* — confirm/correct is cheaper than an open-ended question.
- **Batch** related questions into clusters; reuse intent salvaged from old docs as confirm/reject.
- **Recognition over recall:** offer choices (multiple-choice derived from what the code suggests) — recognizing is easier than recalling. Still allow skip.
- **Prioritize:** ask must-confirm (rules/constraints that affect correctness) first; mark nice-to-have as optional.

Question set (only ask what is still missing after reading code + doc):
- **Product/intent:** what problem, for whom? success metric (even rough)? which feature is core / about to be dropped?
- **Business rule:** the rule behind the conditional branch seen in the code? an always-true invariant?
- **Real NFR:** real peak load / latency / uptime — or "don't know".
- **Compliance/constraints:** only confirm/reject, do NOT assert the regulation yourself.

## C. Handling answers
- Answer → fold into the as-built (intent tagged `assumed`/`verified-by-human`, not `verified`).
- **Skip / "don't remember"** → record a **Skip Register row** (`templates/skip-register.md`, `type: intent`/`unknown`) + plant an inline `[NEEDS CLARIFICATION: <what is missing> — not in code/ticket]` marker at the item. Do **not** leave a bare `TBD` — a bare `TBD` trips PRISM's content-completeness and the KPI/NFR-vague gate; the structured Skip Register row is what PRISM `import` turns into a §10b open risk / §11 deferred question instead. Do not re-ask within the same round.
- **Conflict (doc/ticket/commit vs code)** → **code wins for the mechanism description**, BUT **a mandatory Conflict Log entry** (point 1): the diverging source (**doc name / Jira-ID / commit hash**) · **location** (section/path within the doc) · *what the doc says* vs *what the code does* (with the code `path:line`) · classification (old doc? bug? different intent?). Ask which one is the *desired intent* (it may become an ADR/known-gap). **Do not choose on your own, do not stay silent** — every divergence must leave a trace of "where it diverges, against which document". (Record into the Skip Register as type `conflict`.)

## D. The WHAT/WHY boundary (important)
- WHAT (mechanism) → from code, `verified` + citation.
- WHY (intent) → from people/docs, at most `assumed`; **never `verified`** just because there is code. Code does not prove intent.
- "Code does X" = WHAT (recordable). "Whether X is *correct* / *should* be that way" = WHY (ask/skip, or suspected-defect).
