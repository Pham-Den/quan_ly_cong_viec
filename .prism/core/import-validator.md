# Import Validator

Rules for validating externally-created documents imported into PRISM.

## Trigger

`import [phase]` — AI reads document(s) from `docs/inbox/` using the phase-based naming convention.

### Inbox Scan Procedure

1. Check `docs/inbox/` for files matching the target phase (see table below). Prefer standard names; if names differ, classify obvious files by content.
2. If multiple files found for a phase (e.g., architecture supplemental files, or product supplementals like epics/user-stories/glossary): read all of them
3. If no matching or classifiable file is found: report `"No inbox file found. Use the inbox naming table below, drop the matching file(s) into docs/inbox/, and run import again."` — do not proceed
4. If file found: proceed to validation steps below

### Supplemental Merge Rules

#### Product — `import product`

| Inbox File | Product Proposal Mapping | Merge Strategy |
|---|---|---|
| `product.md` | `product/proposals/prd-v{X}.md` + epic proposals as needed; any NFR items → `architecture/proposals/nfr-v{X}.md` | BR / EP / FR / US / AC items (NFRs cross-route to the architecture NFR proposal) |
| `epics.md` | `product/proposals/epics/EP-NNN-{slug}-v{X}.md` | EP items and nested FR / US / AC items |
| `user-stories.md` | `product/proposals/epics/EP-NNN-{slug}-v{X}.md` | US / AC items with required routing tags |
| `glossary.md` | `product/proposals/glossary-v{X}.md` | GLOSS items |
| `personas.md` | `product/proposals/personas-v{X}.md` | PERSONA items |
| `market-research.md` | `product/proposals/market-research-v{X}.md` | MR items |
| `product-assets/` | `assets/` | Images / PDFs copied to `sprint/product/assets/`, linked from the relevant Product package files |

#### Design — `import design`

| Inbox File | Design Target Section | Merge Strategy |
|---|---|---|
| `design.md` | Full design proposal input | Fold into the standard design-system proposal; split sections by content |
| `design-system.md` | §1 Design Principles + §4 UI Components + §5 Design Tokens | Brand guidelines → §1. Components → §4. Tokens → §5 |
| `wireframes.md` | §3 Wireframe Descriptions | Screen-by-screen annotations. Link to wireframe images from assets |
| `user-flows.md` | §2 User Flows | Flow diagrams and step tables per feature |
| `prototype.md` | Referenced in §2 + §3 | Prototype links (Figma, InVision) embedded as references |
| `design-assets/` | Referenced inline | Mockups, wireframe PNGs, Figma exports copied to `sprint/design/assets/` |

#### Architecture — `import arch`

Architecture import folds each inbox file into the matching `docs/sprint-v{X}/architecture/proposals/*-v{X}.md`; `/docs/architecture/*.md` files are Living Truth targets updated only at sprint seal.

| Inbox File | Architecture Target Section | Merge Strategy |
|---|---|---|
| `architecture.md` | ARCH / ARCH-COMP items + `ARCH-OVERVIEW-001` | Overall architecture document and package entrypoint |
| `sad.md` | ARCH / ARCH-COMP items + `ARCH-OVERVIEW-001` | Alias for `architecture.md` / SAD input |
| `c4.md` | C4 Summary / Architecture Overview | Text-readable C4 context/container/component descriptions for all 3 required C4 levels replace template placeholders; Draw.io/XML source belongs under `arch-assets/` |
| `project-reference.md` | PR-NNN items | Project engineering contract, source-tree / package organization, module map, public entrypoints, dependency boundaries |
| `sequence.md` | SEQ-NNN items | Sequence diagrams; normalize any ASCII/plaintext ladder art into fenced Mermaid `sequenceDiagram` blocks, or ask if the flow cannot be inferred safely |
| `erd.md` | ENT-NNN items | ERD, schema notes, indexes, migrations; normalize any ASCII/plaintext ER diagram into a fenced Mermaid `erDiagram` block, or ask if the relationships cannot be inferred safely |
| `adr.md` | ADR-NNN items | Architecture decisions |
| `data-flow.md` | FLOW-NNN items | At least 1 DFD text inventory plus Draw.io/XML source using standard DFD notation (`ARCH-2`); split by user group when actors, permissions, or data paths materially differ; assets belong under `arch-assets/` |
| `api-specs.md` | API-NNN items | Endpoints, request/response, auth |
| `events.md` | EVT-NNN items | Event contracts and delivery semantics |
| `nfr.md` | NFR-NNN items | Measurable non-functional requirements |
| `arch-assets/` | Referenced inline | Infrastructure diagrams, C4 / DFD Draw.io / XML source, and supporting images copied to `sprint/architecture/assets/` |

### General Merge Rules

**Merge precedence**: If primary documents and supplementals both define the same content, merge non-overlapping entries. Flag duplicates for user decision — never silently discard.

**Single-file product decomposition**: If `import product` only receives `product.md`, split it into the standard product proposal sections and align routed items to the Product LT templates.

**Supplementals-only import**: If no primary file exists but supplementals do, construct the full package from supplementals, then ask targeted questions for any missing, unclear, conflicting, below-quality, or keep / drop decision items that remain.

**Product package completeness rule**: Always create one standard Product proposal with routed BR / GLOSS / PERSONA / MR / EP / FR / US / AC items. If a source area is missing or explicitly deferred, record a concise note of the missing material and any accepted downstream impact in the proposal.

**Asset handling**: Asset folders (`{phase}-assets/`) are copied to the canonical phase folder's `assets/` subdirectory. Use the same folder map as `core/orchestrator.md § Phase Folder Map`: Product -> `product/`, Design -> `design/`, Architecture -> `architecture/`, Plan -> `planning/`, Test -> `testing/`. AI reads images it can process, notes others as "human review required". Assets are referenced by relative path in documents.

**Architecture package completeness rule**: Always create one standard Architecture proposal with routed ARCH / ARCH-COMP / PR / SEQ / ENT / ADR / FLOW / API / EVT / NFR items. If a source area has no current data, is not applicable in this scope, or is explicitly deferred, record the absence and accepted downstream impact in the proposal.

## Validation Process

### Step 1: Structural Validation

Check document against the corresponding template resolved via `<paths.templates>/INDEX.md` (`paths.templates` from `prism.json`, default `.prism/core/templates`). INDEX is the authoritative artifact→template map. Adapter MUST-load tables may enumerate the specific templates a phase loads, but those lists must stay consistent with INDEX (a release sync test guards this); never invent a template mapping that disagrees with INDEX.

| Check | Action if Missing |
|-------|------------------|
| YAML frontmatter present | Add frontmatter with status: DRAFT |
| Required sections exist | List missing sections |
| Section headers match template | Map non-standard headers to template sections |
| Traceability IDs present (FR-xxx, etc.) | Flag as optional but recommended |

### Step 2: Phase-Quality Audit

Evaluate the imported material against the same detailed phase quality standard used by `validate *` in `core/phase-quality-standards.md`.

### Step 3: Content Completeness

For each required section, check if content is substantive (not empty or placeholder):

- **Empty sections**: Report "Section X is empty — add content or mark as N/A"
- **Placeholder content**: Detect generic text like "TBD", "TODO", "Fill in later" → flag, except a structured risk / issue / assumption note that explicitly names the missing decision plus its owner or validator
- **Minimum depth**: Key sections must have actionable detail, not just headers

### Step 4: Content Classification

Classify imported material before asking follow-up questions or writing sprint outputs:

- **Accepted as-is**: Clear, sufficient, already aligned to the target phase standard
- **Needs normalization**: Correct intent but weak structure, wording, traceability, or section placement
- **Needs improvement**: Material exists, but it is still below the PRISM quality bar and needs stronger specificity, better rationale, or better coverage
- **Missing**: Required material is absent
- **Unclear**: Material exists but is ambiguous, underspecified, or not decision-ready
- **Conflicting**: Two imported statements disagree with each other, with existing content in the same-phase draft, or with approved upstream truth
- **Redundant / out of scope**: Duplicate, obsolete, or phase-inappropriate material that should be merged, deferred, or dropped

If content is clearly usable but poorly organized, normalize it in the sprint output instead of treating it as missing.
If content is present but still below the phase quality bar, treat it as **Needs improvement** and include it in the clarification batch.

### Step 5: Cross-Reference Consistency

If prior phases are already approved, validate against them:

| Imported Phase | Check Against |
|---|---|
| product | Internal consistency across the Product package: every US-xxx maps to at least one FR-xxx, every FR-xxx has acceptance criteria, every epic has a `PROD-4` Product Traceability Map (`EP -> FR -> related US`) with one row per FR and no stale FR / US coverage, personas align with stories, lifecycle-state rules satisfy `PROD-3` where applicable, glossary terms are used consistently, and the PRD overview matches the companion files |
| design | PRD features (every FR-xxx should have a design reference) |
| architecture | PRD features + NFRs + internal architecture package consistency (Must Have FRs covered in the Architecture Traceability Map, and `/docs/architecture/project-reference.md` aligned with the declared module / package / boundary model) |
| plan | Product + Design + Architecture docs (every task group references the required implementation inputs, QA intent, repo test delta target, and external QA readiness when relevant) |
| test | PRD features + approved QA context (`api-specs`, `nfr`, and supporting architecture artifacts) so every Must Have feature has test coverage, rule / branch inventory, functional/SIT coverage, test data requirements, automation intent, external QA handoff when relevant, and generated TSV companions derived from the normalized testing `proposals/test-cases-v{X}.md` |

### Step 6: Clarification Batch

Ask one batched follow-up that covers only:

- Missing required material
- Unclear or ambiguous statements
- Below-quality items that need stronger user input, sharper targets, or a better decision
- Conflicts that need a user decision
- Redundant / out-of-scope items that require an explicit keep / drop / defer choice

Never re-ask content that is already clear and sufficient.

If no open questions remain after the audit, skip questions and proceed directly to synthesis.

### Step 7: Synthesis

Produce normalized sprint outputs that align to the PRISM template and the phase quality bar.

- Preserve the original inbox files by moving them to `docs/inbox/processed/`
- Normalize section structure, wording, traceability, and cross-links when intent is clear
- Preserve valid local numbering, heading, table, and ID schema when the imported source already uses a coherent structure; only normalize the full related set if deliberate normalization is necessary
- Do not silently upgrade below-quality decisions that require stronger scope choices, sharper targets, or richer coverage from the user
- Do not silently invent missing facts or silently resolve ambiguity / conflicts
- If the user leaves unresolved issues open, save the phase as `DRAFT` and append an `## Open Issues` section listing all unresolved items (see schema below)

### Step 8: Report

Output a structured import audit report:

```
Import Audit: [phase]
━━━━━━━━━━━━━━━━━━━━━

✓ Frontmatter: valid
✓ Accepted as-is:
  - Existing FR catalog is usable after ID normalization
  - Personas match the imported user stories

~ Normalized by PRISM:
  - Re-mapped custom headings into template sections
  - Consolidated duplicate glossary entries

^ Needs improvement:
  - KPI target says "high adoption" — needs a measurable target
  - Error-handling flow exists but does not cover retry and timeout states

? Clarifications needed:
  - "Enterprise SSO" is mentioned twice with different protocols

! Conflicts:
  - Imported NFR says p95 < 500ms, but approved upstream target is p95 < 200ms

- Redundant / out of scope:
  - Legacy migration appendix belongs in a downstream implementation note, not the phase artifact

✗ Missing:
  - Accessibility target
  - Test data strategy

Next action:
  1. Answer the clarification batch so PRISM can finalize the draft, OR
  2. Tell PRISM to save the current normalized DRAFT (PRISM appends an `## Open Issues` section for all unresolved items)
```

## Open Issues Section

PRISM appends an `## Open Issues` section to any DRAFT when an issue cannot be resolved in the current turn. This applies to `import [phase]`, `start [phase]`, and `feedback:`.

Table format:

```markdown
## Open Issues

| ID | Summary | Status | Resolution |
|----|---------|--------|------------|
| OI-001 | Goal "high adoption" needs a measurable target | open | — |
| OI-002 | Enterprise SSO protocol conflict — decide: OAuth 2.0 or SAML | open | — |
| OI-003 | Accessibility target added | closed | Added WCAG 2.1 AA to §4 NFRs |
```

**Fields:**
- `ID`: sequential within the document — `OI-001`, `OI-002`, ...
- `Summary`: one-line description; include the impacted section or context when helpful
- `Status`: `open` or `closed`
- `Resolution`: `—` when open; a brief note of the decision or action taken when closed

**Write rules:**
- PRISM adds a row whenever an issue cannot be resolved in the current turn
- New rows always get the next sequential ID within the document
- Rows are never deleted — closed issues remain in the table as historical record

**Close rules:**
- An issue is closed when the user provides the required answer, target, or decision
- PRISM fills in `Resolution` and sets `Status` to `closed`
- All rows must be `closed` before `approve [phase]` is permitted

**Approve guard:**
- `approve [phase]` is hard-blocked while any row has `status: open`
- `validate [phase]` surfaces all open rows prominently in the validate output

**Freedom mode:**
- The section is informational only; it does not block saving or prevent any action in freedom mode

## User Response Options

After the import audit:
- **Answer the clarification batch**: AI resolves missing, unclear, below-quality, conflicting, or redundant decision items, then synthesizes the draft
- **Save current normalized draft**: AI saves the `DRAFT` and appends an `## Open Issues` section for all unresolved items, so the user can continue resolving them later
- **Reject / replace source**: User provides a different document set

## Rules

**Normalize when clear** — restructure and clean imported content when intent is clear, but only for editorial / structural improvements that do not change the user's intended decision
- **Never invent or silently resolve** missing facts, ambiguity, or conflicts
- **Never reject outright** — always offer targeted clarification or a saved `DRAFT`
- **Preserve original source files** by moving them to `docs/inbox/processed/`; sprint outputs should be normalized to PRISM templates
- Imported documents are always saved as `DRAFT`, never auto-approved
- Do not suggest `approve [phase]` while the DRAFT's `## Open Issues` section has open rows. Direct the user to the clarification batch or tell them to resolve the open issues first
- When imported content is saved into a sprint document, set `created` on first save and refresh `updated` to the current write time
- If one import action writes multiple files in the same phase or lane, stamp that file set with the same `updated` value

## Import Into A Change Pack (phase APPROVED in an open sprint)

When the target phase is already `APPROVED` in the resolved open sprint (sprint resolution per `core/sprint-manager.md § Cross-Sprint Routing`), the import runs exactly as specified above — same inbox scan, audit steps, clarification batch, Open Issues handling, and `docs/inbox/processed/` move — with only the synthesis destination changed:

- **Destination**: the pack's `{phase}-delta-v{X}.{Y}.{Z}-{slug}.md` file(s) per `core/change-manager.md § Delta target` and `core/templates/delta-template.md` — never phase proposals, never Living Truth.
- **Pack resolution**: fold into the DRAFT pack in focus for that phase (selection per `core/change-manager.md § Pack Selection And Disambiguation`); if none exists, create one — the imported material supplies the change request content and pack creation runs normally (`core/change-manager.md § Pack Creation Flow`). Do not ask first: `import` with inbox files is explicit intent and the pack is the only valid editable surface. Report the pack id and note it can be discarded on request before approval.
- **Anchor ops**: compose against effective truth (base + APPROVED deltas). New items → `## New` with IDs via `get_next_id`; revisions of existing anchors → `## Updated`; removals → `## Removed`. Cross-routed items (e.g. NFRs inside `product.md`) follow the pack's normal propagation per `core/change-manager.md § Current Downstream Rule`.
- **Report**: phase was APPROVED, pack id used or created, op counts (New / Updated / Removed), next step `validate changes [pack-id|slug]`.

## Reflect Mode (brownfield as-built import)

When `prism-config.md` marks the active sprint `kind: reflect` (brownfield onboarding — see `core/sprint-manager.md § Reflect Sprint`), `import [phase]` synthesizes **reflected as-built** proposals. (`import` here is an AI-driven authoring step — you read the inbox and write the proposal files, calling `get_next_id` yourself; there is no `import.py` script.) The inbox files are produced by an external discover step (e.g. `discover-code`) from the code itself, so the audit posture changes: it records *what the code does*, it does not demand *what a forward spec would require*.

**ID assignment**
- An inbox item that already carries a **real ID** present as a code marker (project previously built by PRISM) or already in Living Truth → **preserve that ID verbatim**; do NOT mint a new one.
- Genuinely new items → assign IDs via `get_next_id` as usual. Parent/child relationships come from document **structure** (nested EP → FR → US → AC); attach routing tags (`<!-- EPIC: EP-xxx -->`, `<!-- US: US-xxx -->`, `<!-- VERIFIES: … -->`) at synthesis.
- **Mint ABOVE the markers you reuse (avoid a same-bundle collision).** `get_next_id` reads only the counter and is blind to the marker IDs you preserve — so on a fresh project it can hand you `API-001` while the bundle ALSO reuses a code-marker `API-001`. Before minting, gather the marker IDs you reuse; for each prefix, ensure every newly-minted ID is **greater than the highest reused marker** of that prefix (bump the counter past them, or re-mint if a minted ID equals a reused one). Seal reconcile + `LTV-DUP` are the backstop, but fixing it at mint time keeps the failure from surfacing far from its cause.
- Reusing a marker ID can leave `id_counters` behind the real maximum. Do NOT hand-edit `id_counters`: `seal_sprint.py` reconciles `id_counters = max(counter, highest ID anywhere in Living Truth)` at seal (a full-tree sweep, not just the files touched this seal), and `validate_living_truth.py` `LTV-DUP` hard-blocks any cross-file ID collision that slips through.

**Provenance (required)**
- Copy each `**Provenance**: reflected — path:line (confidence: verified|inferred)` line **verbatim** from the inbox doc into the synthesized proposal **block body** (below the H3). Never paraphrase, summarize, or drop it; never move it to frontmatter (seal restamps frontmatter and would lose it).

**Quality posture — apply the phase Gate reflect exemptions; do NOT raise these as `Missing` / `Needs improvement` / Open-Issue blockers:**
- A reflected FR with no Must-Have user story; an FR/US without forward-style acceptance criteria where the code has none; a backend capability with no UI (Design N/A); and missing C4 / DFD diagram assets are **expected** for as-built material.
- **`Must`-FR caution (`LTV-DESIGN-COV`):** that validator fires on every **Must** FR. Do NOT tag a reflected backend FR `Must` unless you also supply a `DESIGN-OVERVIEW-001` that either traces it or declares Design-N/A with an explicit `<!-- COVERAGE: N/A -->` marker (a markerless empty map does NOT satisfy the gate — it reads as an unfilled map) — otherwise seal demands a design-to-FR map you have no UI for. Reflected FRs are normally `Should` / `Could` (they describe running code, not committed forward scope).
- Structural obligations STILL hold and are not exempt: routing tags (`VP-6`), singleton overview (`VP-11`), `ARCH-OVERVIEW-001` §2 Package Index (`LTV-PKGIDX`), and `validate_proposal.py` checks on each synthesized proposal.
- Do NOT silently upgrade or normalize away an observed fact to fit a template — reflected content mirrors running code, it does not invent the gaps a forward spec would fill.

**Deferred intent — the as-built WHY-gap (record + track, never fabricate, never silently block):**
Code yields WHAT, never WHY — so a reflected PRD legitimately has no real KPI / NFR target / business goal / persona rationale, and the person who ran `discover-code` (often a dev, not the PO) is the wrong authority to invent them. Do NOT fabricate them, and do NOT leave them as a bare `TBD` (a bare `TBD` trips Content-Completeness *and* the `validate user story` KPI/NFR-vague blocker — `phase-product.md` bullet "a KPI / NFR / important constraint is vague or `TBD`…"). Instead, route every such gap into the owning phase proposal's deferral ledger so it is *recorded, tracked, and non-blocking* (one generic home-selection — `core/sprint-manager.md § Reflect Sprint` rule 8; the product cases below are the common ones, architecture uses `nfr.md` §9 / arch §12, design uses PRD §11):
- **A KPI / NFR / measurable constraint** the reflected material references but cannot quantify from code (sourced from the `discover-code` Skip Register rows `type: intent` / `type: unknown`, or surfaced during synthesis) → emit one row in the PRD's **§10b Open Risks** (`prd-template.md §10b`): *what is vague · why it matters (downstream impact) · default = the value observed in code if any, else `—` · who validates = PO / area owner · deadline = "next time this area is governed"*. A §10b row is exactly what `PROD-2` accepts, so the `validate user story` KPI/NFR-vague blocker then **passes legitimately** — you are not exempting the check, you are satisfying it the same way a forward sprint would.
- **Broader intent** (problem statement, business goal, rationale, "why this feature exists", persona intent) that code cannot prove → emit a **§11 Open Question** of the deferred (`HOÃN`) kind, **targeted at a later sprint** with an owner (`prd-template.md §11`). A later-targeted open question does NOT block the current reflect sprint, and `new sprint` automatically picks it up as a candidate while `start change` on the area surfaces it too — so deferred intent resurfaces for the **PO** (the right authority, at the right time) rather than being asked of whoever happened to run `discover-code`.
- **Carry the Skip Register through synthesis** — do not let it die in `docs/inbox/processed/`. Every Skip Register `intent` / `unknown` row must land as either a §10b row or a §11 deferred question; `suspected-defect` / `conflict` rows follow the Conflict-logging rule below.

**Conflict logging (code wins, but record where)**
- When a user-supplied doc-dump in the inbox (legacy PRD / SAD / wiki export) contradicts the code, the **code wins** — but log the discrepancy as an Open Issue / note that names *which document and where* it disagrees. Never silently discard the document's claim.

**Approval & seal — reflect STILL flips proposals to APPROVED**
- Reflect waives the build/spec *checks*, NOT the status flow. You still run `approve product` / `approve arch` (+ `approve design`, or Design-N/A) to move each proposal DRAFT → APPROVED, then `approve implement` runs the no-op build acceptance and seals. `seal_sprint.py` hard-requires every merged source to be `status: APPROVED` — DRAFT proposals do NOT seal. "Gates skipped" means the checks are waived, not that you can seal straight from DRAFT.

**Trigger summary:** reflect-mode is gated solely by `kind: reflect`. A normal (forward) sprint imports exactly as the rest of this document specifies; greenfield / pure-PRISM projects never enter reflect-mode.

## Freedom Mode Exceptions

When `prism-config.md` `mode: freedom`, override the following:

| Default rule | Freedom override |
|---|---|
| Add `status: DRAFT` frontmatter | Add freedom frontmatter (no `status`, no `approved_by`) |
| Append `## Open Issues` section when issues remain | Omit — in freedom mode the section is informational only and does not block saving |
| "saved as DRAFT, never auto-approved" | Saved immediately — no status flow |
| § Import Into A Change Pack (APPROVED destination) | Not applicable — freedom mode has no approval state and no change packs |
| Step 5 cross-reference: load approved docs | Load any matching docs regardless of status |
