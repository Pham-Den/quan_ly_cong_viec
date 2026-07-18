# Version Manager — Sprint + Change Pack Model

## Core Concept

A **sprint** is one incremental SDLC cycle: product → design → architecture → plan → test → implement. The boundary that promotes a sprint's content into the project's canonical state is the **sprint seal** (`approve implement`), not a release-style rebaseline. See §Living Truth and `core/sprint-manager.md` for the parallel-sprint rules.

Inside an open sprint:
- approved base artifacts stay frozen,
- same-sprint corrections happen through immutable change packs `v.x.y.z-slug`.

After `approve implement`, the sprint is sealed for further same-sprint changes; this is the moment its proposals merge into Living Truth via `core/tools/seal_sprint.py`.

## Status Model

Base artifacts:

```text
DRAFT → APPROVED
  ↑     │
  └─────┘ feedback and review stay within DRAFT until approval
```

Change packs:

```text
DRAFT → APPROVED
```

When a new sprint starts, the previous sprint remains a historical baseline folder. `new sprint` does not rewrite old document statuses.

## Frontmatter Timestamp Contract

- `created` is set once when the artifact is first written or first imported. Never change it afterward.
- `updated` MUST be refreshed on every write, revision, import save, and auto-save. Use `YYYY-MM-DD HH:MM`.
- If one user action writes multiple files in the same lane or change pack, stamp that set with the same `updated` value.
- On `status` or `resume`, if `updated` is missing or malformed, fall back to the file's modified timestamp for that turn and normalize the frontmatter on the next write.

## Immutable Rules

1. Each sprint creates a separate folder: `/docs/sprint-v{X}/`
2. APPROVED base documents are never overwritten in place.
3. While the sprint is open, changes to APPROVED artifacts go through `start change:` and immutable change packs.
4. `new sprint` is allowed when product + design are `APPROVED` in the latest sprint and no DRAFT change pack remains open in that latest sprint.
5. After `approve implement`, no new change pack may open in that sprint.
6. Dev always implements from the latest effective truth in the current active sprint.

## Living Truth

**Living Truth** is the project's canonical, sprint-agnostic state. Phase 9 introduced a per-phase folder layout with 15 root LT files + per-epic files:

```
/docs/
├── product/
│   ├── prd.md                  Vision, business rules (BR), exec summary, epic index
│   ├── glossary.md             Domain terminology (GLOSS-NNN anchors)
│   ├── personas.md             User personas (PERSONA-NNN anchors)
│   ├── market-research.md      Market evidence (MR-NNN anchors)
│   └── epics/
│       └── EP-NNN-{slug}.md    One file per epic; contains EP info + FR-NNN + US-NNN + AC-NNN anchored items
├── design/
│   └── design-system.md        Screens (SCREEN-NNN) + UI components (DS-COMP-NNN)
├── architecture/
│   ├── architecture.md         Overview + module boundaries (ARCH-NNN, ARCH-COMP-NNN)
│   ├── nfr.md                  Non-functional requirements (NFR-NNN)
│   ├── sequence.md             Sequence diagrams (SEQ-NNN)
│   ├── erd.md                  ERD entities (ENT-NNN)
│   ├── adr.md                  Architecture decision records (ADR-NNN)
│   ├── data-flow.md            Data flows (FLOW-NNN)
│   ├── api-specs.md            API endpoints (API-NNN)
│   ├── events.md               Event contracts (EVT-NNN)
│   └── project-reference.md    Module map + naming conventions (PR-NNN)
└── testing/
    └── test-cases.md           Test cases (TC-NNN with VERIFIES: ID-NNN trace tag)
```

These files contain only content from **sealed sprints**. AI never writes them directly. They are updated by `core/tools/seal_sprint.py`, which atomically merges each sprint's APPROVED proposals (and APPROVED same-sprint change-pack deltas) at sprint seal (`approve implement`).

Working Process artifacts — implementation plan, test plan, change packs (`docs/sprint-v{X}/changes/`), snapshots (`docs/sprint-v{X}/snapshots/`), `tempo/` working notes — stay sprint-scoped forever and do not promote to Living Truth.

### Living Truth update flow

1. AI writes mergeable split proposal files by Living Truth target under concrete phase `proposals/` folders, per `core/templates/proposal-template.md`. Each proposal contains anchored items in `## New / ## Updated / ## Removed` sections.
2. AI never touches `/docs/product/*.md`, `/docs/design/*.md`, `/docs/architecture/*.md`, `/docs/testing/*.md` directly. A pre-commit hook (`core/tools/precommit_living_truth.py`) blocks accidental direct edits to all 15 root LT files + the `product/epics/EP-*.md` glob.
3. On `approve implement`, `seal_sprint.py` runs:
   - validates every APPROVED proposal + change-pack delta via `validate_proposal.py`;
   - at sprint v1, bootstraps all 15 root LT files from their templates atomically as clean skeletons (`bootstrap_all_living_v1`); only the header + anchor-convention note above each template's `<!-- PRISM:LT-SKELETON-END -->` sentinel is kept — example blocks / placeholder sections / Self-Review Checklist are stripped;
   - routes each anchored item from split proposals to the correct LT file by **ID prefix** (and `<!-- EPIC: -->` tag for FR/US/AC items) via `apply_proposal.apply_multi_target`. New epic files (`EP-NNN-{slug}.md`) are bootstrapped on demand when a proposal `## New` introduces a new epic;
   - regenerates each LT file's `## Index` from its anchored items (`inject_indexes` — IDs preserved, sorted ascending; `prd.md` also gets an Epic Index derived from the epic files);
   - atomically writes merged content with tmp + rename;
   - writes byte-for-byte snapshots to `docs/sprint-v{X}/snapshots/{phase}/{name}-at-v{X}-sealed.md` (nested mirrors LT, chmod 444);
   - sets `sprints[].sealed = true` and `sprints[].sealed_at` in `prism-config.md`;
   - invokes `scan_drift.py` to emit cross-sprint drift warnings on newer unsealed sprints.

### ID prefix routing (anchor → LT file)

| Prefix | Target file | Routing notes |
|---|---|---|
| `BR-NNN` | `/docs/product/prd.md` | Business rule |
| `PRD-OVERVIEW-001` | `/docs/product/prd.md` | Singleton PRD narrative (Exec Summary, vision...); `## New` in v1, `## Updated` later — ID never changes |
| `EP-NNN` | `/docs/product/epics/EP-NNN-{slug}.md` (creates file if new) | Epic file root; slug derived from heading |
| `FR-NNN`, `US-NNN` | `/docs/product/epics/EP-XXX-{slug}.md` | Routed by `<!-- EPIC: EP-XXX -->` tag |
| `AC-NNN` | inside US block of epic file | Routed by `<!-- US: US-XXX -->` tag |
| `GLOSS-NNN` | `/docs/product/glossary.md` | |
| `PERSONA-NNN` | `/docs/product/personas.md` | |
| `MR-NNN` | `/docs/product/market-research.md` | |
| `SCREEN-NNN`, `DS-COMP-NNN` | `/docs/design/design-system.md` | |
| `DESIGN-OVERVIEW-001` | `/docs/design/design-system.md` | Singleton design narrative; `## New` in v1, `## Updated` later — ID never changes |
| `ARCH-NNN`, `ARCH-COMP-NNN` | `/docs/architecture/architecture.md` | |
| `ARCH-OVERVIEW-001` | `/docs/architecture/architecture.md` | Singleton architecture narrative; `## New` in v1, `## Updated` later — ID never changes |
| `NFR-NNN` | `/docs/architecture/nfr.md` | |
| `SEQ-NNN`, `ENT-NNN`, `ADR-NNN`, `FLOW-NNN`, `API-NNN`, `EVT-NNN`, `PR-NNN` | `/docs/architecture/{name}.md` | One file per prefix |
| `TC-NNN` | `/docs/testing/test-cases.md` | `<!-- VERIFIES: ID-XXX -->` is a trace tag, not routing |

## Effective Truth

For an active sprint **vX**, the *effective truth* AI loads is composed at read time:

```
Living Truth (from all 15 root LT files + all /docs/product/epics/EP-*.md)
  + APPROVED split proposals for every earlier UNSEALED sprint Y < X
  + APPROVED change-pack deltas in those earlier unsealed sprints
  + own sprint vX's APPROVED split proposals and approved change-pack deltas
```

Compose on demand with `core/tools/effective_truth.py --phase {product|design|architecture|testing|all} --up-to-sprint vX`. Output is read-only; this helper never modifies living truth.

### Composition rules

- There is no implied replay sequence across approved change packs within a sprint. They are referenced by pack id / slug.
- If a selected DRAFT change pack touches an artifact already changed by another APPROVED pack in the same sprint, the DRAFT pack must absorb the current effective truth for that artifact before `approve changes` can succeed.
- Sealed sprint folders (`docs/sprint-v{Y}/` with `sealed: true`) are NOT loaded by `effective_truth.py` — their content already lives inside the living-truth files. Snapshots are for audit only.

## Modification Refusal

If the user tries to change an APPROVED artifact in an open sprint:

```text
⚠ [phase] in sprint-v{X} is APPROVED and frozen as a base artifact.
→ To change it in this sprint: start change: [what changed]
→ To inspect differences first: diff [phase]
```

If the current sprint is already sealed:

```text
⚠ [phase] cannot be changed in this sealed sprint.
→ Make the change in the newest open sprint; if none is open, new sprint
→ To inspect differences first: diff [phase]
```

If a newer sprint is also open, being *older* is **not** a refusal — only being *sealed* (above) is. Resolve the target per `core/sprint-manager.md § Cross-Sprint Routing`: an explicitly named or in-progress **unsealed** older sprint is a valid routed target; if its change touches an anchor a newer open sprint also carries, warn the user to re-review that newer sprint (else it can be overwritten when the newer sprint seals).

## Parallel Work Model

```text
Sprint v1:
  base docs v1 + approved change packs v1.3.8-fix-payment, v1.7.2-auth-contract, ...

Sprint v2:
  created only when the user explicitly runs `new sprint`
```

- Same-sprint change packs update the current open sprint.
- `approve implement` is the **sprint seal boundary**: the moment a sprint's proposals merge into Living Truth (implemented by `seal_sprint.py`).
- `new sprint` opens the next cycle (it is the start-of-sprint, not the rebaseline).
- PO can still open a new sprint when needed; that choice remains explicit.
- More than one DRAFT change pack may coexist until the user explicitly chooses which one to continue.

## On `new sprint`

1. Verify product + design phases in the latest sprint are `APPROVED` (architecture, plan, test, implement are not required).
2. Verify no DRAFT change pack remains open in the latest sprint.
3. Create `/docs/sprint-v{X+1}/` folder structure (see § Folder Structure Per Sprint below).
4. Make the new sprint active without rewriting the old sprint's status fields.

There is no changelog file to create on `new sprint`. Cross-sprint change summaries are captured directly inside the phase's split proposal files (`## New` / `## Updated` / `## Removed` sections) and, where needed, `sprint-brief-v{X}.md` per `core/phase-product.md`, `core/phase-design.md`, `core/phase-architecture.md`.

## Folder Structure Per Sprint

```text
/docs/sprint-v{X}/
├── product/
│   ├── sprint-brief-v{X}.md      # review context; not merged
│   └── proposals/
│       ├── prd-v{X}.md
│       ├── glossary-v{X}.md
│       ├── personas-v{X}.md
│       ├── market-research-v{X}.md
│       └── epics/EP-NNN-{slug}-v{X}.md
├── design/
│   └── proposals/design-system-v{X}.md
├── architecture/
│   ├── sprint-brief-v{X}.md      # review context; not merged
│   └── proposals/
│       ├── architecture-v{X}.md
│       ├── nfr-v{X}.md
│       ├── sequence-v{X}.md
│       ├── erd-v{X}.md
│       ├── adr-v{X}.md
│       ├── data-flow-v{X}.md
│       ├── api-specs-v{X}.md
│       ├── events-v{X}.md
│       └── project-reference-v{X}.md
├── planning/                     # sprint-only work process (implementation-plan-v{X}.md)
│   └── implementation-plan-v{X}.md
├── testing/                      # sprint-only test-plan + LT proposal (TC-NNN → /docs/testing/test-cases.md)
│   ├── test-plan-v{X}.md         # sprint-only (planning artifact, no promotion)
│   └── proposals/test-cases-v{X}.md
├── tempo/
│   ├── in-progress/              # auxiliary working files: discuss, analysis, active validate files
│   └── completed/                # immutable; ignored by orchestration after closure
├── changes/                      # change packs (same-sprint corrections)
│   └── v{X}.{Y}.{Z}-{slug}/
│       ├── change-request.md
│       ├── impact-matrix.md
│       └── {phase}-delta-v{X}.{Y}.{Z}-{slug}.md
└── snapshots/                    # created at sprint seal (nested mirrors LT, chmod 444)
    ├── product/
    │   ├── prd-at-v{X}-sealed.md
    │   ├── glossary-at-v{X}-sealed.md
    │   ├── personas-at-v{X}-sealed.md
    │   ├── market-research-at-v{X}-sealed.md
    │   └── epics/
    │       └── EP-NNN-{slug}-at-v{X}-sealed.md
    ├── design/design-system-at-v{X}-sealed.md
    ├── architecture/
    │   ├── architecture-at-v{X}-sealed.md
    │   ├── nfr-at-v{X}-sealed.md
    │   └── {sequence,erd,adr,data-flow,api-specs,events,project-reference}-at-v{X}-sealed.md
    └── testing/test-cases-at-v{X}-sealed.md
```

## Canonical Artifact Naming

Use these names exactly for generated Markdown artifacts. Plan and Test intentionally use `planning/` and `testing/` folders.

| Phase | Sprint folder | Sprint output | Routes to Living Truth |
|---|---|---|---|
| Product | `product/` | `sprint-brief-v{X}.md` + `proposals/{prd,glossary,personas,market-research}-v{X}.md` + `proposals/epics/EP-NNN-{slug}-v{X}.md` | `PRD-OVERVIEW-001` + `BR-NNN→prd.md`; `GLOSS→glossary.md`; `PERSONA→personas.md`; `MR→market-research.md`; `EP-NNN→epics/EP-NNN-{slug}.md` (creates file); `FR/US/AC` + `<!-- EPIC: -->` tag → routed inside that epic file |
| Design | `design/` | `proposals/design-system-v{X}.md` | `DESIGN-OVERVIEW-001`, `SCREEN`, `DS-COMP → design/design-system.md` |
| Architecture | `architecture/` | `sprint-brief-v{X}.md` + `proposals/{architecture,nfr,sequence,erd,adr,data-flow,api-specs,events,project-reference}-v{X}.md` | `ARCH-OVERVIEW-001`, `ARCH`, `ARCH-COMP → architecture.md`; `NFR→nfr.md`; `SEQ→sequence.md`; `ENT→erd.md`; `ADR→adr.md`; `FLOW→data-flow.md`; `API→api-specs.md`; `EVT→events.md`; `PR→project-reference.md` |
| Plan | `planning/` | `implementation-plan-v{X}.md` | _Sprint-only_; never promotes |
| Test | `testing/` | `test-plan-v{X}.md` + `proposals/test-cases-v{X}.md` | `test-plan-v{X}.md` sprint-only; `test-cases-v{X}.md` with `TC-NNN` items routes to `testing/test-cases.md` |
| Implement | code / session lane | no canonical phase Markdown document; use code changes, repo tests, and active validate files | Code lives in repo |
| Change pack | `changes/v{X}.{Y}.{Z}-{slug}/` | `change-request.md`, `impact-matrix.md`, `{phase}-delta-v{X}.{Y}.{Z}-{slug}.md` | Same-sprint correction; APPROVED deltas merge into routed LT files at sprint seal |
| Snapshot | `snapshots/{phase}/...` | `{name}-at-v{X}-sealed.md` (mirrors LT structure) | Byte-for-byte clone at seal moment (chmod 444 audit) |

Test may also contain deterministic generated companions under `testing/generated/` (`test-cases-functional-v{X}.tsv`, `test-cases-sit-v{X}.tsv`, `test-cases-export-manifest-v{X}.json`). These are export views derived from the active `testing/proposals/test-cases-v{X}.md` during the sprint; after seal, the same `TC-NNN` items live in `/docs/testing/test-cases.md`. Generated TSV files are not canonical Markdown artifacts.

Naming rules:

- Sprint output filenames are lowercase kebab-case with a `-v{X}.md` suffix (`prd-v{X}.md`, `api-specs-v{X}.md`, `implementation-plan-v{X}.md`, `test-plan-v{X}.md`).
- Living Truth filenames are **versionless** (`prd.md`, `glossary.md`, `architecture.md`, etc.) since they accumulate across sprints.
- Epic Living Truth files: `EP-NNN-{slug}.md`. Slug derives from epic title at creation (`slug_from_title`, max 40 chars, kebab, ASCII-only with Vietnamese diacritic stripping); slug stable once set even if title later changes.
- Change-pack filenames use `*-delta-v{X}.{Y}.{Z}-{slug}.md`, where `slug` is lowercase kebab-case.
- Active validate files use cycle-scoped names `validate-<command>-<cycle>.md` (`<cycle>` = `base` or `pack-<slug>`); they live in `tempo/in-progress/` while running and in `tempo/completed/` once sealed by approval. Full naming and lifecycle rules are in `core/orchestrator.md § Validate Active Files`.
- Module, package, namespace, public entrypoint, dependency-boundary, and code-surface names are authored in `/docs/architecture/project-reference.md` (LT, anchored `PR-NNN`) and then reused verbatim by Plan, Test, and Implement unless an Architecture change pack updates them.
- Imported artifacts may have arbitrary inbox filenames, but normalized sprint outputs must use the canonical names above.
