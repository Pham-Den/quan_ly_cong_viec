# Onboard an existing project into PRISM — Design

> **Goal:** from **existing code + scattered old documentation**, produce a PRD/Architecture **importable into PRISM** so we can **continue development under governance** — natural, usable for both new projects (greenfield) and existing projects (brownfield).
>
> Read in order: §1–§6 are the core design, §7 is the example, §8–§13 are the details + decisions.

---

## 1. Context & what "complete" means

- Large project (possibly multiple repos); old documentation (if any) is usually already out of sync with the code.
- We need documentation **sufficient for PRISM to allow continuing work** (passing its gates), **without needing exhaustive detail**.
- **"Complete" = enough coverage to pass the gate**: Acceptance Criteria = a description of *the behavior currently running*; architecture derived from code; the intent part (goal/KPI/rationale) comes from interviews or old docs, and what's missing is marked rather than fabricated.

---

## 2. Six foundational principles

1. **Map ≠ Specification.** A navigation map ("find what, where") is different from a specification with IDs + gates.
2. **Onboard is a *step in*, not a *mode*.** Once done, you're back to the normal process.
3. **Grow incrementally with the work.** Documentation tracks the real work; govern only the part we truly need.
4. **Separate WHAT / WHY.** The *mechanism* (module, call, schema) comes from the **code** — verifiable. The *intent* is not in the code → **ask people; if not remembered, skip it, don't fabricate.** The worst error is writing speculated intent as if it were fact.
5. **Code is the source of truth about what is RUNNING** — but it *is not guaranteed correct* (it may contain bugs). Assert the mechanism with `path:line` + a confidence label; where something is suspected wrong → record **observed behavior + suspected defect / open question**, do NOT legitimize an old bug into an AC. (C6)
6. **PRISM does NOT read code TO REVERSE-DOCUMENT** — only `discover-code` does that. *(The implement phase still reads/edits code normally — that is build, not reverse-documentation.)* (C1)

---

## 3. The core model

### 3.1 Two layers of documentation

| Layer | What it is | Properties |
|---|---|---|
| **Map** | A ledger listing *every* area that exists in the code + where. Grouped by **capability/domain** (e.g. "notifications"), not just by the directory tree. | Always-present, cheap. Both orientation and a **boundary** for "is this area governed yet". |
| **Living Truth (LT)** | PRISM's *governed + verified* documentation. | Exists only for the part already onboarded; **grows incrementally** with what we need to govern. |

### 3.2 Routing each requirement area touched (a process, not a one-time check)

| That area… | → What to do |
|---|---|
| Already in LT (already governed) | **Use the docs. Do NOT read code.** |
| Not governed, but we **need it under governance** (will modify/remove it, or formally build on top of it) | **Reflect sprint** (§5): `discover-code` writes as-built → bring into LT first, then act |
| Not governed, only needs reading as **context** for new independent work | `discover-code` reads *temporarily* to integrate correctly; the old area is **left as-is in the Map**, not onboarded |
| Completely new | `to-build` (build new). Do NOT read code |

- **Greenfield never reads code:** there's no Map (no old code) → it only falls into "already in LT" or "completely new". v1 or v50, it's the same.
- **It is a process:** `start product` spawns many things; the impact scope is revealed gradually as you deep-read — route each area as it appears.

### 3.3 Item state
`done` (built + in LT) · **`reflected`** (reverse-documented from code, just written to docs — **provenance/confidence**, NOT a gate flag; comes from a reflect sprint) · `to-build` / `to-update` / `to-remove`.

> **Terminology (renamed for clarity):**
> - **`kind: reflect`** = a GATE flag at the **sprint** level (this is what decides build-gate exemption).
> - **`reflected`** = a per-item **provenance** label, displayed in LT as `**Provenance**: reflected — path:line (confidence)`. Placed in the **body of the block** (survives seal).
> - **"as-built"** is just a *generic term* = "code-reverse-documented documentation". Drop using it as a per-item label, because **after seal EVERY LT item reflects code-already-built** → "as-built" no longer distinguishes anything. What's worth distinguishing is *reflected (reverse-documented, possibly untested/intent assumed)* vs *built-via-PRISM (already spec'd + tested)*.

---

## 4. Who does what: `discover-code` ↔ PRISM

| | **`discover-code`** (separate skill) | **PRISM** |
|---|---|---|
| Read code? | ✅ the **only** code reader | ❌ **never** |
| Write `prism-config.md` / create sprint / seal? | ❌ never | ✅ **fully owns** |
| Task | read the designated part → write `as-built` (with citations) into `docs/inbox/`; update the "what's in the code" half of the Map | governance: sprint, gate, import, seal, orchestration |

Not merged together; connected via **2 shared files**: **Map** + **inbox**.

> `discover-code` does not seal/write `prism-config.md` itself: `seal` is a heavy machine (atomic merge + validator + snapshot + drift warning + ID assignment) — copying it = duplication/fragile; both sides writing config = contention. Orchestrating "don't let 2 sprints onboard the same area" can also only be done by PRISM (only it sees the entire sprint state).

### 4.1 ID assignment — who numbers them?
`discover-code` does **NOT** assign IDs, does **not** write `prism-config.md`. It only **creates inbox docs** as-built — relationships are expressed via **STRUCTURE** (nesting), **not by setting IDs/slugs** — with citations. **Only PRISM assigns the real IDs** when `import` synthesizes into the reflect sprint — via `get_next_id.py` (PRISM is the **ONLY** writer of `id_counters`) → real IDs (`FR-002`, `ARCH-COMP-005`), guaranteeing **atomic, no duplicates**. seal afterwards runs `reconcile_id_counters` (scans all LT) covering every ID present across the entire Living Truth.
- If as-built references something **ALREADY** in LT → use the real ID directly (read read-only from effective_truth), don't assign a new one.
- → satisfies both constraints: **only PRISM writes `prism-config`**, and **numbers are always correct/no collision**.

---

## 5. Two kinds of brownfield (how to minimize "machinery added to PRISM")

Each kind has one mechanism. **Type 1 barely touches PRISM.**

### Type 1 — Code just enough: the whole LT can be rebuilt → **Genesis = one whole-repo reflect sprint**
- `discover-code` (a few rounds) builds the **entire LT** (product+arch+design) for the whole system → **one reflect sprint (v1) covering the whole repo** seals it into LT → from there PRISM runs **pure greenfield**.
- **Safe + consistent (NOT a direct-LT-write):** genesis goes through the **normal seal pipeline** (validators + snapshot + atomic), exactly like an incremental reflect sprint — just whole-repo scope. At t=0 there is no concurrency (LT empty, no other sprint), so it is the cleanest case, but it is still a **sealed reflect sprint, not a bypass** — the keystone ("LT changes only at seal") holds.
- **HARD precondition (C8):** genesis only when **LT empty + sprint v1 fresh + no DRAFT/concurrency + working tree clean**. If the project **has already partially run PRISM** → **NO genesis**, must switch to **incremental reflect (Type 2)**.
- **Light:** as a reflect sprint, genesis **skips the build/spec gates** (plan/test/implement) — the code already exists, nothing is built. After it seals, every item is baseline → later sprints treat it as carried.
- **No new tool:** reuses the existing reflect sprint + `seal_sprint.py`; core unchanged. **Covers the bulk of a small project in one pass.**

### Type 2 — Code very large: can't rebuild it all → **Incremental, reflect-then-act**
- When a requirement needs an area **not yet governed** under governance → run a **reflect sprint** to write as-built (into LT via seal), then **act** in a normal sprint. Details in §6.
- Only this kind needs added machinery, and we use a **sprint-level flag** to keep it light (Option C, §6.4).

> **Selection criterion:** "can discover-code rebuild the full LT in a few rounds at an acceptable cost?" → **Yes = Type 1 (genesis)**; No = **Type 2**. You can **genesis the core + incremental for the long tail.**

---

## 6. Type 2 in detail: reflect-then-act

### 6.1 A single pattern — do NOT mix
Bringing old code into governance = a separate **reflect sprint** (only writes as-built); the real work (add/change/remove) is done in a **normal sprint afterward**. *Do not mix as-built + to-build in the same sprint.*

### 6.2 Why reflect must come FIRST (the mechanism reason)
PRISM changes LT via `New` (add new) and `Updated`/`Removed` (modify/remove an item **already in LT**). `Updated`/`Removed` must point at an item currently in LT — **you can't cross out a name that isn't on the list yet**. Old code is only in the code, *not yet in LT* → to modify/remove it you must **reflect (bring it into LT) first**.

### 6.3 Four rules of the reflect step
1. **Surfacing what-already-exists is UNCONDITIONAL + early.** Whenever an area with code is touched, PRISM always states clearly *"X already exists (code at …)"* **first**, then asks about intent. Recording the reality is the default; **do not guess intent** (don't say "this seems to be a replace" — only say "email already exists; do you want to add or replace?").
2. **Always record the FULL current state** — don't reduce detail even when you know it's about to be removed. **Do not assume** what the user does next; only capture the reality honestly, **the user decides in a later sprint**.
3. **Examine ALL related areas (impact scope).** Modifying/removing the old = assessing the impact of the whole. `discover-code` follows **every linked place** (who calls/triggers, who depends, who uses the result). Bound it by **real links** (not the whole system); broad links → broad scan — that is a **risk signal worth knowing**.
4. **Cascade — a concrete stop rule (C3):** reflect goes **to the CONTRACT boundary first** (the item touched + the *direct interface* of dependents: what it reads/what it writes), does NOT deep-read the internals of dependents. Deeper dependents → **ask the user: onboard more / keep-contract (commit not to change the interface) / stop**. That's how a large repo doesn't blow up scope.

### 6.4 The gate-exemption mechanism: the SPRINT-LEVEL flag `kind: reflect` (Option C)
- The reflect sprint is marked `kind: reflect`. Each gate only needs **one coarse check**: *"reflect sprint → skip."* No per-item logic needed. The areas turned off are the gates that demand *full-specification + build + test*: `validate user story` (Must FR needs US), TEST, implement, `approve implement`-needs-test. (as-built is a *description*, not a specification/already-tested.)
- **But the LT structural validator STILL runs.** `kind: reflect` does not turn off the checks ensuring LT is *consistent* (traceability FR↔arch map, package index, assets) — they still run at seal. → reflect must write **a coherent slice** (product + arch + design, or *Design N/A* for backend) for full traceability; **do not reflect product-only**. This is a constraint on `discover-code`. *(Benefit: a reflected item has a real `sprint_id` so it passes the frontmatter validator — something `adopt` writing-directly used to get stuck on.)*
- **Why choose C (not per-item exemption):** we **don't need to mix** as-built + to-build in one sprint → a sprint-level flag is enough, and **much lighter** (1 coarse line per gate instead of per-item logic). The `reflect` rule lives in **one brownfield rule file**, **lying dormant for greenfield**.
- The reflect sprint **still goes through seal** (safe, not write-directly-to-LT); it's just that the build-gate is turned off by the flag. A pure as-built reflect sprint → **seals fast** → doesn't block for long.
- An item in a reflect sprint still carries the `reflected` label (for **provenance** — a later person/agent knows this is documentation reverse-documented from code, possibly untested).
- **The reflect seal contract (C2/C4):** the concrete sequence — `approve product` + `approve arch` (+ `approve design` or Design-N/A) for the reflect slice → then **`approve implement` runs no-op** (empty build-scope, test exempted by flag) → seal. It's the `kind: reflect` flag itself that lets `approve implement` pass when there's no code/test → **not stuck at the final gate**.
- **Reflect = one atomic BUNDLE (C5):** a slice produces **all** related proposals (product + arch + design/N-A) → **validate together** → only then approve/seal. Do NOT import each phase separately (import product then arch fails → LT/proposal left half-done).
- **Skip gate ≠ skip quality (C10):** reflect drops the build/test gate **but does NOT** drop the description standard. discover-code must produce **minimal PRISM-native**: FR/AC (or internal-capability rule) clearly · arch component/event/API/schema · dependency + citation + confidence. A reflect too thin = sealing impoverished documentation → **forbidden**.

> **track-then-remove (not "remove directly"):** reflect brings email into LT first → when a later sprint does `Removed`/`Updated`, `scan_drift` warns about items **that already have an ID in LT/proposal** that reference email. ⚠️ **`scan_drift` only COMPARES IDs, does NOT analyze code/dependency (C11):** a dependent **not yet onboarded** (e.g. report reads `email_log`) → scan_drift *doesn't know on its own* — catching it is the job of **discover-code's impact-analysis at reflect time** (§6.3 #3). The two mechanisms complement each other: discover-code catches the not-yet-onboarded dependent; scan_drift protects the already-has-an-ID dependent. "Removing directly" (without tracking) loses both.

*(An already-onboarded area, when modified/removed, is just a normal `Updated`/`Removed`, no reflect needed.)*

### 6.5 The "onboard-before-build" gate + late detection (operational anchor)
Invariant: **don't spec/build on a not-yet-governed area** — blocked at 2 points (operative: `prism/core/sprint-manager.md § Codebase Map`):
- **Start of sprint (routing):** not-yet-governed area → the AI opens a reflect sprint to onboard it FIRST (the AI writes `prism-config.md`, **not hand-edit**) → seal → then build. Catches most up front, so onboarding naturally stands before.
- **Mid-sprint** — 2 cases that are totally different:
  - *Adding a NEW area Y* → **block** Y from the current sprint (the sprint is not touched). Onboard Y separately when you want to build on it — a new valid step, not a missed prerequisite.
  - *Missing a dependency X that the current work relies on* → that work is **ungrounded**, can't seal like this → **back-up:** keep DRAFT (pending, do NOT delete) → onboard X first (takes the slot first, the DRAFT resumes in the next slot) → continue, now grounded. Always surface, don't mix, no concurrency. **Rare** (the start gate catches most) — this is the inherent cost of "having built on a baseline that wasn't there", and every workaround (mixing / tracking separately / sealing-ungrounded) breaks the framework.

**Genesis vs incremental — ASK when ambiguous, don't default:** user specifies → do it; LT empty + has code (both valid) → **ask**; LT already governed → incremental only. `kind: reflect` can only be set on a sprint that has no spec/build yet (no mixing).

**Decision: do NOT add a greenfield/brownfield config.** The ONLY signal = `docs/codebase-map.md` (absent = greenfield; present = brownfield; the `onboarded` column ∩ LT → fully vs partial). Adding a separate flag = recreating the mode-toggle we eliminated + easily drifts from the Map + forces greenfield to carry extra things. Determining it is **observation** (is there code? is there a Map? is LT empty?) at the time of the first request, not a pre-stored flag (flags easily go stale). `status` can **infer** onboard progress from the Map for display — infer, don't store. discover-code is loaded from `.prism/skills/` when needed; absent → tell the user to install it; **PRISM core does not depend on it** (greenfield never loads it).

### 6.6 Intent (WHY) deferral — don't ask the dev, don't fabricate, don't block *(added post-2.2.1, while dog-fooding genesis)*

**The trap found:** running genesis (`discover all code → import product`) did **not** surface the missing intent (KPI / goal / persona / rationale) needed to finish the PRD, and then `validate user story` *blocked* on a vague/`TBD` KPI/NFR (`phase-product.md` bullet 4, `PROD-2`). Root cause: reflect mode exempted only the *forward-spec* gates (PROD-1, Must-US, C4/DFD, DES-1/2) but **not the intent-absence gates**; and the intent *interview* had been assigned to `discover-code` yet was never wired into its `full` pipeline (the fallback was "skip → Skip Register", never "ask"). So intent fell through **both** ends — never asked, then blocked.

**Why we do NOT just turn the interview on at discovery:** the person running `discover-code` is typically a **dev, not the PO**. Asking them for intent invites *guessed* answers — the exact "speculated intent written as fact" failure principle 4 (C4) forbids. So **don't ask at discovery, and don't fabricate.**

**Decision — WHY-gap deferral.** Code supplies WHAT; WHY is *declared-deferred*, tracked, never a hard blocker:
- Each gap lands by **one generic selection** (measurable TBD → a risk-managed-`TBD` ledger; non-measurable WHY → the owning phase's `HOÃN` open-questions ledger — a new gate needs no new mechanism): product KPI/constraint → PRD **§10b Open Risks** (satisfies `PROD-2` legitimately — *not* an exemption); architecture NFR target → **`nfr.md` §9 Open NFR Risks** (new, mirrors §10b); ADR rationale / standards-deviation → **architecture §12 Risks And Open Questions** (+ an in-block ADR note); STRIDE → `N/A — known gap` (§10); broader product intent (problem / §3 goals / TO-BE / persona-rationale) → a PRD **§11 Open Question of the `HOÃN` (later-sprint) kind**; Design (no ledger of its own) → PRD §11, its UI/UX WHY being product-owned. Source = the discover-code Skip Register (`type: intent`/`unknown`); **`import` does the routing** (discover-code still never writes config/IDs).
- **Resurface at the right authority + time:** a §11 `HOÃN` question is picked up by **`new sprint`** as a candidate and surfaced by **`start change`** on that area — so the **PO** supplies the intent when they next govern it (recognition-over-recall, with the running feature to point at). Lazy, not up-front-from-the-wrong-person.
- **Reflect-only — never leaks.** A forward sprint (greenfield, OR brownfield adding/changing requirements) keeps every intent obligation in full force and **ASKS the user** up front. Deferral is how as-built avoids fabrication; it is never a way to skip authoring a real requirement.

**Where it lives (for maintainers):** `core/sprint-manager.md § Reflect Sprint` rule 8 (cross-phase principle + reflect-only guard + home-map) · `core/import-validator.md § Reflect Mode → Deferred intent` (routing) · per-phase reflect notes in `phase-product.md` / `phase-architecture.md` / `phase-design.md` · `core/templates/nfr-template.md` §9 · `core/phase-quality-standards.md` (fixed homes on the risk-managed-`TBD` rule). discover-code side: `templates/confidence-tags.md` handoff gate ("no *untracked* marker remains") + `reference/legacy-and-interview.md` (structured Skip Register row, not a bare `TBD`). Guarded by `prism/tests/test_brownfield_reflect_seal.py` + `prism/tests/test_discover_code_skill_contract.py`.

---

## 7. A real example

**The "OrderHub" system** — an order-management backend (FastAPI), running in production, ~80k LOC, no PRISM documentation → **Type 2 (incremental)**. Current state in the code:
- `src/orders/` — create/update orders
- `src/payments/stripe_client.py` — collect money via Stripe
- `src/notifications/email.py` — send email on the `order.completed` event (via SendGrid)
- `src/reports/daily.py` — reports, reads the `email_log` table

**T0 — Setup.** Install PRISM (guided). `discover-code shell` → **Map** (lists orders/payments/notifications/reports + paths). LT empty.
*(If OrderHub is small enough to build the full LT in a few rounds → Type 1: one whole-repo reflect sprint, then run greenfield. Below illustrates Type 2.)*

**Sprint 1 — "Add SMS sending when an order completes" — new INDEPENDENT work → 1 normal sprint:**
- SMS just *also* listens to the `order.completed` event, doesn't modify email → email is only *context*.
- `discover-code` reads `notifications/email.py` *temporarily* so SMS plugs into the right event spot; **email is left as-is in the Map** (not onboarded).
- Proposal: `FR-001 [to-build]` Send SMS via Twilio on `order.completed`.
- plan/test/implement (SMS only) → seal. **LT: FR-001.** Email is still outside governance.

**Sprint 2 (`kind: reflect`) + Sprint 3 (normal) — "Change email SendGrid → AWS SES" — MODIFYING the old not-yet-governed → reflect-then-act:**
- Modifying `email.py` = `Updated`, needs email in LT first.
- **Sprint 2 (reflect):** `discover-code full` writes as-built **a coherent slice** + **examines all related**:
  - `FR-002 [reflected]` Send email on `order.completed` — `notifications/email.py:30` (SendGrid)
  - `ARCH-COMP-005 [reflected]` EmailSender — `email.py`
  - **Examining related discovers:** `reports/daily.py:88` reads the `email_log` table → report **depends on** email (report not yet onboarded) → **cascade**: surface to user — *"changing provider may change the `email_log` format, affecting the daily report (not documented). Onboard report too / or commit to keeping the log schema unchanged?"* → user chooses **keep the schema unchanged** → record the constraint, no need to onboard report.
  - The spec/build gate is **off** (kind: reflect); the LT structural validator (traceability `FR-002 ↔ ARCH-COMP-005`) **still runs & passes**. Seal fast → email into LT.
- **Sprint 3 (act):** `FR-002 [to-update]` EmailSender uses SES instead of SendGrid, **keeping the `email_log` schema unchanged** → plan/test/implement → seal. *(report is safe thanks to **discover-code having caught the dependency in Sprint 2** + the keep-schema constraint — NOT thanks to `scan_drift`: report is not yet onboarded, has no ID so scan_drift doesn't see it. C11.)*

**Takeaway:** independent work → 1 light sprint (don't onboard neighbors); modifying the old → reflect (record fully + examine all related) then act; **the cascade surfaces for the user to decide, not silently** — thanks to **discover-code's impact-analysis** (not scan_drift). *(After Sprint 2, email is an already-governed area → next time just use docs; and every already-has-an-ID item that references email from now on is protected by `scan_drift`.)*

---

## 8. `discover-code` — depth & multi-pass scanning

- **Depth:** `shell` (shell: structure/boundary/entry-point — scans the whole repo in one shot, cheap → Map) / `full` (deep: C4/DFD/schema/API for one area → into LT) / `deepen <area>` (deep-read more later).
- **Rule:** `shell` is freely shallow (Map only); anything going into LT must be `full`.
- **Multi-pass scanning (a large repo in one pass isn't enough):** a progress ledger to resume/recover; run multiple agents in parallel by area; write-then-flush-context; expand gradually via `--paths`.

> **The operational "guts" part of discover-code** (from the first draft, now folded into `SKILL.md` + `reference/` and deleted):
> - `02-discover-code.md` — read code **tools-first** (a deterministic source table: stack/deps/entrypoint/API/schema/integration/event) + a **large-repo chunk** strategy (boundary-first · sample-then-log · parallelize-by-module · stop-at-coarse) + 8 capture items (including cross-cutting auth/error/tx/config) + finding format `[confidence] claim — path:line` + coverage log.
> - **`06-verify-against-code.md` — 5-step SELF-VERIFY (MANDATORY because PRISM does not check on your behalf):** traceability sweep · tool cross-check (tool wins) · **adversarial refute** (a separate agent tries to refute) · intent-boundary audit ("wrong intent") · confidence recompute + report.
> - `04-interview-intent.md` (WHY + skip-contract + recognition-over-recall) · `03-triage-legacy-docs.md` (scattered old documentation) · `templates/confidence-and-traceability.md` (confidence label + **as-of-commit** mark ↔ which is exactly the Map's `scanned_at_commit`).
> - **Obsolete (take only the *craft*, drop the *framing*):** `07-handoff` + "map-to-inbox-for-import" in `05` — because now the output goes through reflect/seal. Detailed map: `PLAN.md §2`.

### 8.1 Code-reading method (TIGHT · NO MISSES · NO FABRICATION)

> Requirement: reflect **exactly the present**, **no fabrication/no guessing**, **ordered parsing so nothing is missed**. Guarantee "no misses" via **3 completeness anchors** + a coverage ledger.

**Foundational principle (anti-fabrication):**
- **Deterministic first, LLM after:** tool/AST enumerates the ground-truth; the LLM only *narrates* each item with `path:line`. The LLM does not "make up" items itself.
- **Cite-or-drop:** a claim that can't be traced back to code → downgrade to `unknown`/open-question, **don't keep it**.
- **Observed ≠ correct:** record the behavior *currently running*; suspected wrong → flag a **suspected defect** (open-question), do NOT turn it into an AC. WHY not derivable from code → ask/skip.
- **In-scope read literally, NO sample/guess** (learned from BMAD deep-dive). `inferred` is allowed but must clearly state *what was checked / what wasn't checked*.

**Ordered pipeline — each step bound to one completeness anchor:**

1. **Census (ENUMERATE before reading) — ⚓anchor #1.** The tool enumerates **fully** every artifact by type: entry-points (route/CLI/job/event-consumer/public export) · table/entity · event topic · external client · config/flag. → this is the **checklist**; *coverage = checklist − done*. Nothing is dropped silently.
2. **Reachability from entry-points — ⚓anchor #2.** For **each** entry-point, trace the call-graph **downstream to leaves** → cover all *live behavior*. Code not reachable from any entry → dead/separate-entry (flag). With a dependency graph (entry = not-imported · leaf · cycle — learned from BMAD).
3. **Read each unit tightly:** signature · input/validation · **EVERY branch/guard/error-path** · side-effect (DB/IO/external) · data touched.
4. **Branch/rule inventory → FR/AC — ⚓anchor #3.** FR = what the entry-point *does*; **AC = each branch/outcome** (happy + each validation + each error + each state-transition). *Each `if` = one rule recorded* → cover all behavior (≈ specification mining from control-flow).
5. **Remaining strata (fixed order):** data model (table/column/key/migration) → events (topic/pub/sub) → integrations (client/config) → cross-cutting (auth/error/tx/log/config).
6. **Verify (5-step, `reference/verify.md`):** traceability sweep · tool cross-check (tool wins) · **adversarial refute** · intent-boundary · confidence recompute.
7. **Reconcile completeness (EVIDENCE of no-miss):** cross-check against the census checklist — every entry/table/topic/integration is either *recorded (with citation)* OR *listed as "not covered + why"*. **Completeness critic** asks: which entry has no FR? which table has no entity? which branch has no AC? which artifact type was not enumerated?

**3 "no-miss" anchors:** ① census-checklist · ② entry-point reachability · ③ branch-inventory — plus the coverage ledger = evidence of coverage (not "I think it's done").

> Corresponds to standard methods: *artifact enumeration · call-graph reachability from roots · specification/behavior mining from control-flow · module dependency analysis · reflexion/adversarial verify · determinism-first*.

---

## 9. Two kinds of "drift" and how to handle them

| Kind | Description | How to handle |
|---|---|---|
| **LT ↔ running sprint** | Multiple parallel sprints modify the same item | **Solve at the root:** LT *only changes at seal*; seal is **sequential (oldest first)** + **automatically fires `scan_drift`** warning other sprints. No writing LT mid-stream → no "silent overwrite". ⚠️ `scan_drift` only compares **ID** (doesn't analyze code) → only protects items **that already have an ID** (C11). |
| **Map/docs ↔ real code** | Someone edits code *outside* PRISM → Map is stale → wrong routing | The Map carries `scanned_at_commit`; `git diff <commit>..HEAD --stat` → warns "Map is stale". **General status: do NOT block.** **(C7) But if the requirement touches exactly the area changed after `scanned_at_commit` (especially when the working tree is *dirty*) → it is MANDATORY to refresh `discover-code` for that area BEFORE routing**, otherwise routing is wrong. |
| **(C9) Multi-repo** | Multiple repos → can't have one shared `scanned_at_commit` | The Map records **per-repo** `{repo_id, path, commit, dirty}`; the drift check runs per repo; cross-repo edges are **explicit contracts**. |

---

## 10. Solutions: chosen / rejected + why

### ✅ CHOSEN
- **Type 1: Genesis bootstrap** — build full LT → seed at t=0 → greenfield. Barely touches PRISM.
- **Type 2: reflect-then-act + sprint flag `kind: reflect` (Option C)** — as-built goes through seal (keeps the keystone "LT only changes at seal"); build-gate turned off by the sprint-level flag; no mixing.
- **WHY-gap deferral (§6.6)** — intent the code can't supply is declared-deferred to fixed homes (PRD §10b · `nfr.md` §9 · §11 `HOÃN`), never asked from the dev at discovery, never fabricated, never a hard blocker; the PO supplies it at the next forward sprint. Reflect-only — forward/greenfield keep full intent rules + ASK the user.

### ❌ REJECTED

| Approach | Why rejected |
|---|---|
| **`adopt` writing directly to LT *mid-stream*** | Breaks the keystone "LT only changes at seal": ID collision with an open sprint, validator rejects, `scan_drift` blind — **reproduces the openspec data-loss accident**. *(Genesis at t=0 is safe because no concurrency — that's Type 1.)* |
| **Per-item exemption (Option A)** | No need to mix as-built+to-build → the sprint-level flag (C) is enough and lighter (1 coarse line/gate instead of per-item logic). |
| **An `onboard` command + a "special" separate sprint** | Redundant. Reflect is *a normal sprint with a `kind` flag*, woven into the product/change phase. |
| **"Remove directly" (supersede)** | Loses the trail — can't tell whether the removal was reasonable, no dependent warning. Must reflect, then remove. |
| Forcing **full system-wide documentation first** then code | Obsolete immediately, wrong optimization. *(Type 1 is different: build full only when the code is small enough + use it as greenfield input.)* |
| "Docs first, fall back to code-probing just in case" | Greenfield also probes code → replaced by the §3.2 routing. |
| Pushing a BMAD/gsd map through PRISM `import` | Wrong type — a map is navigation, not a specification. |

---

## 11. What must change in PRISM + the risks it solves

| Need to do | Solves what risk | Scale |
|---|---|---|
| **`discover-code` skill** (read code → inbox; `shell/full/deepen`; multi-pass; doesn't produce items duplicating existing ones) | the-only-code-reader; prevents duplicate onboard | new |
| **Type 1: whole-repo reflect sprint** (one v1 reflect, normal seal) | seed full LT at t=0 through the seal pipeline; run greenfield afterward | small |
| **Type 2: `kind: reflect` flag** + 1 coarse check "reflect → skip build gate" at the gates + `reflected` label (provenance) | reflected passes seal without being blocked by the build-gate; greenfield untouched (the rule lies dormant) | medium-small |
| **Orchestration ledger** "which area is being onboarded in which sprint" | prevents 2 parallel reflect sprints on the same area → duplication | small |
| **`scanned_at_commit` + non-blocking drift warning** | stale Map when code is edited outside PRISM | small |
| **Design as-built**: the "Design N/A — no UI" route (backend); for UI "observe the app + screenshot"; coarse C4 | Design is *intent*, code doesn't provide it → the weakest link | small |

Greenfield + Type 1 → **don't touch the gates**. Only Type 2 adds the `reflect` flag (lies dormant for greenfield).

---

## 12. What to learn from other frameworks

- **BMAD (`document-project`):** pick depth shallow/medium/deep (✓); a *state file* for multi-pass scanning (✓). But **no stale detection** (✗ — don't learn that).
- **gsd (`map-codebase` + drift gate):** multiple parallel agents; **anchor by git commit**, drift = `git diff`, **non-blocking bell + refresh command** (✓ — that's exactly §9). Parallel work is *isolated + build/test*.
- **openspec:** 2 changes modifying the same thing, no base stored → **overwrite data loss (a real incident)** → exactly the reason we **only write LT at seal, sequentially**.

---

## 13. Open decisions

1. **How to package `discover-code`:** a single SKILL.md (superpowers style) or generated from a template (gstack style); whether to have subagent fan-out like gsd.
2. **Roadmap:** prototype a thin end-to-end slice first (1 area: reflect → remove) to test the 2 hardest spots (impact-scope detection; `discover-code` quality, because PRISM can't check on your behalf) — then go broad.
3. **License** when borrowing a gsd/BMAD template verbatim.
