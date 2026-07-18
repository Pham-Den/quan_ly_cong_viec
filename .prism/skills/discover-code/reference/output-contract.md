# Output contract — what to produce, where to write it, in WHICH SHAPE of PRISM

> discover-code **only creates files** into `docs/inbox/` + updates the **Map**. It does NOT assign IDs, does NOT write `prism-config.md`, does NOT seal. PRISM opens a **reflect sprint** (`kind: reflect`) → `import` → synthesize → assign IDs (via `get_next_id`) → **split proposals** → approve → seal.
> **Output alignment principle: stick exactly to PRISM's template + convention so that import barely has to guess.**
>
> **Inputs:** the **code** (read-only) + any raw existing docs. Default drop-zone is **`docs/legacy/`** — **not mandatory**: the user may keep docs elsewhere, so if it is empty / unclear, **ask** where they live (or confirm there are none) rather than assuming none. Triaged per `reference/legacy-and-interview.md`; stale docs quarantined, never copied raw into `docs/inbox/` (import's input).

---

## 1. Write out to `docs/inbox/` following PRISM's EXACT inbox-naming

PRISM `import` reads the inbox according to the standard naming table (see `core/import-validator.md`). discover-code fills in these files:

| Inbox file | Content | (→ PRISM split proposal, prefix) |
|---|---|---|
| `product.md` | FR/US/AC by epic + BR | epics `EP/FR/US/AC`, prd `BR` |
| `glossary.md` · `personas.md` · `market-research.md` | terms · personas · research | `GLOSS` · `PERSONA` · `MR` |
| `architecture.md` (or `sad.md`) · `c4.md` | module/boundary + overview | `ARCH/ARCH-COMP/ARCH-OVERVIEW` |
| `project-reference.md` | source-tree, module map, entrypoint, boundary, convention | `PR` |
| `api-specs.md` · `erd.md` · `events.md` · `nfr.md` | endpoint · entity/DDL · event · NFR | `API` · `ENT` · `EVT` · `NFR` |
| `sequence.md` · `adr.md` · `data-flow.md` | sequence · decision · DFD | `SEQ` · `ADR` · `FLOW` |
| `design.md` / `wireframes.md` / `user-flows.md` | UI (if any) | `SCREEN/DS-COMP/DESIGN-OVERVIEW` |
| `*-assets/` | C4/DFD drawio, images | copy into `{phase}/assets/` |

## 2. The structure of each file = follow the PRISM TEMPLATE (resolve via INDEX)

- Before writing, **resolve the template** for each artifact via `.prism/core/templates/INDEX.md` (artifact→template map). Fill in following the exact **section of the corresponding template** (`prd-template.md`, `architecture-template.md`, `api-specs-template.md`, `erd-template.md`, …). The closer it matches the section, the less import has to guess.
- **Don't fabricate your own structure** — use the structure PRISM has already defined.

## 3. discover-code does NOT set IDs/slugs — write inbox docs, `import` assigns the real numbers

PRISM accepts the anchor `<!-- ID: PREFIX-NNN -->` (regex `[A-Z]+(?:-[A-Z]+)*-\d{3,}` — **must have a number**; a slug like `@email-fr` does not match → FAIL VP-2). discover-code **does NOT fabricate IDs/slugs**: topic-based slugs have no common scheme → each file/agent sets a different style, cross-refs break, re-reading is incomprehensible. Instead:

- **Write inbox docs** with the correct import-table names (`docs/inbox/architecture.md`, `erd.md`, `api-specs.md`, `product.md`, `epics.md`…). PRISM's `import [phase]` **synthesizes → splits proposals** and **assigns the real numbers** via `get_next_id`.
- **Parent-child relationship = STRUCTURE, not slug:** AC nested under US, US under EP (see `core/import-validator.md` — "EP + nested FR/US/AC"). `import` attaches the routing tag `<!-- EPIC: EP-xxx -->` / `<!-- US: US-xxx -->` at the moment of assigning numbers.
- **Use REAL IDs only in 2 places:** (a) code that already has a **marker ID** (project previously built by PRISM) → reuse that exact ID; (b) item **already in Living Truth** → point directly to the real ID (read read-only effective_truth). A brand-new item → set NOTHING, leave it for `import` to assign.
- **Singleton overview:** if the as-built has ARCH-COMP/SCREEN → also build `ARCH-OVERVIEW`/`DESIGN-OVERVIEW` (traceability map) as the template requires (PROP-18/VP-11), so that import does not break coverage.

> ⚠️ **HARD BLOCKER (verified with `validate_proposal.py` + `validate_living_truth.py` — seal will FAIL if missing, NOT exempt even when `kind: reflect`):**
> - **VP-6 routing tags:** every `FR`/`US` must have `<!-- EPIC: EP-xxx -->`, `AC` must have `<!-- US: -->`, `TC` must have `<!-- VERIFIES: -->`. ⇒ an as-built FR must **sit under a real epic** (including an as-built epic), with an epic tag.
> - **VP-11 overview-sync:** adding `ARCH-COMP` ⇒ must (re)author `ARCH-OVERVIEW-001`; adding `SCREEN` ⇒ `DESIGN-OVERVIEW-001`.
> - **LTV-COV/DESIGN-COV:** every Must FR must have a row in ARCH-OVERVIEW (and DESIGN-OVERVIEW, or Design-N/A).
> - **LTV-PKGIDX:** each companion architecture carrying anchored content (`erd.md`/`api-specs.md`/`sequence.md`/`adr.md`/`data-flow.md`/`events.md`/`nfr.md`/`project-reference.md`) MUST have a row in **§2 Architecture Package Index** of `ARCH-OVERVIEW-001`. ⇒ a bundle that has `ENT`/`API`/`SEQ`/… must have ARCH-OVERVIEW declare the corresponding companion in §2 (not only §3b Traceability Map). *(verified: housing B-run — seal FAILs when §2 is missing, PASSes after adding it.)*
> → This is an *obligation of the reflect bundle that `import` produces*, not a place where PRISM relaxes. A "product-only" reflect bundle, or one missing a tag/overview = **fail seal**.
>
> **Where Provenance goes:** discover-code writes `**Provenance**: reflected — path:line (confidence)` in the inbox doc; `import` carries it **VERBATIM** into the **BODY of the block** of the proposal (under H3) — paraphrasing the as-built fact is forbidden. Do NOT put it in the file-frontmatter (seal re-stamps the frontmatter → it is lost); the block body is copied verbatim into Living Truth. *(verified with `seal_sprint.py` + `apply_proposal.py`; provenance-survive-seal has a test.)*

## 4. A coherent BUNDLE (atomic)
A single slice produces ENOUGH of the related files (product + architecture + design/`Design N/A — no UI`) → import/validate **together**. Do not emit product while missing arch (PRISM's LT structure validator will fail).

## 5. Map — the FIXED file `docs/codebase-map.md` (contract with PRISM)
- **Fixed location: `docs/codebase-map.md`** (exactly 1 file). PRISM **always reads this file** to route + scope reflect — see PRISM `core/sprint-manager.md § Codebase Map`. Template/schema: `discover_code/templates/codebase-map.md`.
- **Schema:** YAML frontmatter `kind: codebase-map` · `schema_version` · `repos: [{repo_id, path, scanned_at_commit, dirty}]`; body = `## Areas` table (Area/capability · repo · key paths (dir) · entry points + **citation `file:line`** · `onboarded` (hint) · LT refs). Should include coupling edges + external integrations when multi-module (for impact-assessment).
- **Citation `file:line` for the entry point is MANDATORY** (orientation + scope). But a detailed line-RANGE is NOT to be put in the map — line numbers drift each time code is edited → the map goes stale instantly + fights with drift (the map tracks fresh/stale at the file+commit level). The fine-grained range `path:line-line` lives in the **provenance** at reflect time, and is frozen in the snapshot at seal.
- **Role:** an inventory of "which area **EXISTS** in the code + where". **Governance is decided by Living Truth** (`onboarded` is only a hint updated at seal time). PRISM intersects Map (exists) ∩ LT (governed) → 3 routing branches.
- **Does NOT** go into Living Truth. `shell` creates/refreshes it; `update` updates the changed parts + bumps `scanned_at_commit`. Absent file → PRISM treats it as greenfield.

## 6. Accompanying artifacts
- **Coverage ledger** (`templates/coverage-ledger.md`) — evidence of no-omission (pending = 0).
- **Skip Register** (`templates/skip-register.md`) — WHY it is missing / suspected-defect / unknown.
- **Verify report** (5-step, `reference/verify.md`).

## 7. WHAT discover-code TAKES FROM PRISM (don't recreate it yourself)

| Take from PRISM | Use for |
|---|---|
| `core/templates/INDEX.md` | resolve the template for each artifact |
| `core/templates/*-template.md` | section structure to fill in (prd/arch/api/erd/…) |
| `core/templates/proposal-template.md` | the proposal format that **`import`** builds (anchor + routing + `## New/Updated/Removed`) — discover-code only cross-checks it so the inbox map carries over cleanly, **does NOT set anchors/IDs itself** |
| `core/import-validator.md` | the inbox-naming table + how import normalizes/synthesizes |
| `core/tools/validate_proposal.py` (VP-1..19) | **`import` runs** it on the proposal it synthesizes — discover-code does **NOT** run VP. discover-code only **self-checks the inbox**: shape (inbox-naming + section template) · provenance (every claim has `path:line`) · coverage (ledger `pending=0`) |
| ID prefixes (EP/FR/US/AC/BR/NFR/TC/SCREEN/DS-COMP/ARCH-COMP/ARCH/GLOSS/PERSONA/MR/SEQ/ENT/ADR/FLOW/API/EVT/PR) | know the TYPE of item so as to write it into the correct inbox doc; `import` assigns numbers by type via `get_next_id` |

> discover-code does NOT call `get_next_id.py` (PRISM writes `id_counters` at `import` time). When reusing an existing **marker-ID**, **seal auto-reconciles** `id_counters = max(counter, highest ID across the WHOLE Living Truth)` (full-sweep, self-healing old drift too) → a later sprint won't assign a duplicate (**R3**, deterministic at seal); plus **LTV-DUP** cross-file hard-blocks if one still slips through. *(both have tests.)*

## 8. Handoff
discover-code stops after writing the inbox + Map. PRISM then: opens a **reflect sprint** (`kind: reflect` — AI sets it, no hand-edit) → `import` (synthesize → split proposals, **assign numbers via `get_next_id` / keep marker-ID**, carry provenance verbatim, validate VP) → approve → seal (reconcile `id_counters`). See `DISCUSSION.md §5–§6`, `PLAN.md`.
