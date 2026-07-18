# Sprint Manager

Rules for multi-sprint parallel preparation. Applies in guided mode. Freedom mode ignores sprint gates entirely.

## Concept

A single sprint is one versioned working cycle: product → design → architecture → plan → test → implement. Each sprint has exactly one implementation pass: `approve plan` opens it, and `approve implement` closes it and seals the sprint. When product and design for the next cycle are ready before the current implementation closes, `new sprint` can open a new sprint early — but plan, test, and implement in the new sprint stay gated until the previous sprint seals.

Change packs remain same-sprint corrections. They are branch-friendly, live inside `changes/`, and may exist in more than one DRAFT state at the same time. PRISM resolves ambiguity by asking the user which pack to continue.

## Sprint Sealed Flag

Each sprint carries a `sealed` flag, tracked in `prism-config.md`:

```yaml
sprints:
  - id: v1
    sealed: false    # becomes true when approve implement succeeds
    kind: reflect    # OPTIONAL — brownfield onboarding sprint (reflected items only). Absent = normal. See § Reflect Sprint.
  - id: v2
    sealed: false
```

**Opening a reflect sprint:** the **AI** sets `kind: reflect` on a fresh sprint entry as part of the onboard-before-build gate (§ Codebase Map) — PRISM writes `prism-config.md` (same as `new sprint`), so **no hand-edit is needed**. Hand-setting is only a manual fallback. The sprint then follows § Reflect Sprint (build/spec gates skipped, still seals).

`sealed: true` means the sprint is fully closed — `approve implement` was approved and no further changes are possible in that sprint.

If `sprints` is absent from `prism-config.md`, treat all existing sprints whose highest phase is `APPROVED` (`implement`) as sealed.

## Reflect Sprint (brownfield onboarding)

A **reflect sprint** records EXISTING code as `reflected` documentation so it enters Living Truth — **without doing new build work**. It is marked `kind: reflect` on its `prism-config.md` sprint entry (§ Sprint Sealed Flag). Brownfield onboarding uses it: a separate `discover-code` skill reads the code → produces `reflected` proposals → a reflect sprint → seal. This is the **canonical definition**; the per-phase gates below point here.

**Rules:**

1. **Content = `reflected` only.** Its proposals carry only items reverse-documented from existing code (no `to-build`). Provenance lives in **each item's body** as a line `**Provenance**: reflected — <path:line> (confidence: …)` — a body line so it survives the merge; do **not** put it in file frontmatter (seal restamps frontmatter).
2. **Build/spec gates are SKIPPED** (these are markdown gates, not `seal_sprint.py` checks):
   - `approve product` — exempt from Must-Have story rules (`PROD-1` story readiness; Must-FR→Must-US mapping). `PROD-4` traceability map + `validate_proposal` structural checks STILL apply. A KPI / NFR / intent the code cannot quantify is **not** exempted but **not** fabricated either: `import` routes it to the PRD §10b Open Risks (deferred open risk) / §11 deferred Open Question, so it passes `PROD-2` legitimately and resurfaces at `new sprint` / `start change` (detail: `core/import-validator.md § Reflect Mode → Deferred intent`).
   - `approve design` — exempt from `DES-1`/`DES-2` (4 states / exact error copy / state identifiers); a reflected UI is captured by description + screenshot, and a backend slice declares **Design-N/A** (a `DESIGN-OVERVIEW-001` with an explicit `<!-- COVERAGE: N/A -->` marker). `validate_proposal` structural checks + `LTV-DESIGN-COV` STILL apply (a markerless empty map fails — see `core/phase-design.md § Gate`).
   - Test lane — not run. `approve test` not required; `TEST-*` gates do not apply.
   - `approve implement` — runs as a **no-op build acceptance**: test-APPROVED and `validate implementation --mode spec/quality` are skipped (build scope is empty by construction), then proceeds to seal.
   - **The `validate [phase]` audit applies the SAME exemption as its gate** — it must not raise a blocker the gate waives (e.g. a reflected FR with no Must-Have story, or `DES-1`/`DES-2` on a reflected UI); otherwise the gate's "active validate file clean" check would silently re-impose the waived rule. Each `phase-*.md` Gate states its phase's exact waiver.
3. **Structural Living-Truth validators STILL run at seal — keep on, do NOT exempt.** `validate_proposal.py` (anchors, routing tags `VP-6`, overview-sync `VP-11`) and `validate_living_truth.py` (`LTV-COV` Must-FR↔`ARCH-OVERVIEW-001`, `LTV-DESIGN-COV`). So a reflect bundle MUST be **coherent**: product + architecture (+ design, or an explicit Design-N/A — a `DESIGN-OVERVIEW-001` carrying a `<!-- COVERAGE: N/A -->` marker — for backend slices), with proper routing tags and overview traceability. A product-only / untagged reflect bundle FAILS seal — by design (forces a complete as-is picture). This is an obligation on the `discover-code` output, not something to disable.
4. **Seal is normal.** `approve implement` triggers `seal_sprint.py` exactly as usual; **Living Truth changes only at seal** (keystone unchanged). `check_sprint_sealable` already permits this (it never gated on test/implement). *(Note: the FIRST seal of a project — sprint v1, common for a genesis or first reflect onboarding — scaffolds the FULL Living Truth tree: all ~15 companion files are created, empty where your slice didn't touch them. This is normal; your reflected slice only populates a few. Later seals touch only merged files.)*
5. **Seal-chain order unchanged.** A reflect sprint is an ordinary sprint for the chain (earlier sprints must be sealed first); it seals fast because there is no build pass.
6. **IDs.** Items get real IDs via `get_next_id.py` when `import` synthesizes the reflect proposals — discover-code emits inbox docs with **no IDs/slugs** (parent/child carried by document structure); `import` assigns IDs then, preserving any marker IDs already present in code / Living Truth. Seal then runs `reconcile_id_counters` (full Living-Truth sweep) so `id_counters` always covers every merged / pre-existing ID, and `LTV-DUP` hard-blocks any cross-file collision. discover-code never writes `prism-config.md` or IDs.
7. **Freedom mode:** no seal/proposal model → `kind: reflect` is N/A; freedom onboards by editing docs in place.
8. **WHY-gap deferral — the cross-phase reflect principle.** Any obligation that demands *intent / WHY / analysis the code cannot supply* — a KPI / NFR target or Architecturally Significant Scenario, an ADR's rationale / trade-offs, a STRIDE threat model, a PRD §2 Problem Statement / §3 Goals & Success Metrics / §4 TO-BE flow / market research / persona *rationale-goals* (not the code-derivable actor identity), or the *conformance of pre-existing code to current company standards* — is recorded as **declared-deferred** (never fabricated and never a hard blocker). **Home selection — one generic rule, no per-gate mechanism (so it scales to new gates):** a *measurable* TBD → the risk-managed-`TBD` ledger of the owning phase (product KPI / constraint → PRD §10b Open Risks; architecture NFR target → `nfr.md` §9 Open NFR Risks); a *non-measurable* WHY → a **`HOÃN` (later-sprint-targeted, non-blocking) row in the owning phase's open-questions / risks ledger** (PRD §11; architecture §12 Risks And Open Questions — which also takes ADR rationale and standards-deviation, plus an in-block ADR note; STRIDE → an `N/A — known gap` note in its own §10). A phase whose template has **no** such ledger (Design) parks its UI/UX WHY in **PRD §11**, since that WHY is product-owned. A brand-new intent gate needs no new machinery — classify it measurable-vs-not and apply this same selection. Obligations the code CAN supply (contracts, schemas, branch→AC inventory, module map, traceability structure) STILL hold in full, and each `validate [phase]` audit applies the same deferral so it does not re-raise these WHY-gaps as blockers. The goal is **no unreasonable block** for an as-built bundle, with the gap *tracked*, not erased.
   - **Reflect-only — this relaxation does NOT leak to forward work.** A normal (non-reflect) sprint — greenfield, OR a brownfield sprint that adds / changes requirements — keeps every intent obligation in **FULL force** and must **ASK the user** for the missing KPI / NFR / rationale / persona / threat model / etc. (it is real forward spec authored with the PO, not reverse-documented from whoever ran discover-code). The items a reflect sprint parked **resurface here**: `new sprint` picks up §11 deferred Open Questions as candidates and `start change` on the area surfaces them, so the PO supplies the intent at the right time. Deferral is how as-built avoids fabrication — it is never a way to skip authoring a genuine new requirement.

After a reflect sprint seals, the onboarded area is ordinary Living Truth — future changes use the standard change / new-sprint flow (no reflect needed).

## Codebase Map (brownfield only)

> **Greenfield / pure-PRISM projects have NO Map and never need one.** `discover-code` is the ONLY thing that writes `docs/codebase-map.md`, and it runs ONLY for brownfield onboarding. **If `docs/codebase-map.md` is absent, this whole section does not apply** — routing is the normal greenfield flow: every area is either in Living Truth (governed → use docs) or brand-new (`to-build`). There is **no** "exists-but-un-governed" branch without a Map, and PRISM never creates/expects one in greenfield.

For **brownfield** projects, `discover-code` maintains ONE fixed coverage file **`docs/codebase-map.md`** — an inventory of every code area that EXISTS (capability, key paths, entry points) per repo, plus `scanned_at_commit` freshness. It is **not** Living Truth; **governance is decided by Living Truth, not by this file** (the Map's `onboarded` column is only a hint).

**When the Map exists, PRISM reads it:**
- **To route a requirement** (`start product` / `start change`): for each code area the requirement touches, classify by intersecting Map (exists?) with Living Truth (governed?):
  - in Living Truth → **governed** → use docs; do not read code.
  - in Map but NOT in Living Truth → **exists-but-un-governed** — split by what the requirement does to it:
    - will **modify / remove / formally build on** it → **onboard it first** via a reflect sprint (scope `discover-code` to those paths). **This is the only point where code is incrementally deep-read.**
    - needs it ONLY as **read-only integration context** (not changing it) → `discover-code` may read it *temporarily* to integrate correctly; it stays **un-onboarded** (left as-is in the Map) — no reflect sprint.
  - in neither → **brand-new** → `to-build`.
- **To run a reflect sprint:** read the Map to scope which paths `discover-code` deep-reads; after seal, refresh that area's `onboarded` hint + LT refs.
- **Freshness:** if a touched area changed since `scanned_at_commit` (especially a dirty working tree), re-run `discover-code` on it before trusting the routing.

**The onboard-before-build gate (core invariant): no sprint may spec/build on an exists-but-un-governed area — it must be onboarded (a reflect sprint) first.** Enforced at two points:
- **At sprint entry** (routing `start product` / `start change`): a touched un-governed area → open a reflect sprint for it FIRST (the AI sets `kind: reflect` on a fresh sprint entry — PRISM writes `prism-config.md`; `discover-code` never does), seal, then proceed with the build sprint. This catches almost everything up front, so onboarding naturally precedes building.
- **Mid-sprint**, two sub-cases:
  - **A new un-governed area is added** (extra scope) → **block** it from the current sprint; the sprint continues on its grounded scope. Onboard that area separately when you actually want to build on it (a later reflect→build — a legitimate new step, not a missed prerequisite).
  - **A missing dependency** the in-progress work already rests on is discovered → that work is **not grounded and MUST NOT seal as-is**. **Back up:** preserve the in-progress DRAFT (pending, never deleted), onboard the dependency first (it takes the earlier sprint slot; the DRAFT resumes as the next sprint), then continue — now grounded. Always surface this; never silently mix or seal un-grounded. Rare by construction (the entry gate catches most).

**Genesis vs incremental — ASK when ambiguous, never default:** if the user already said which, do that. If Living Truth is empty AND code exists (both valid), **ask** — genesis (whole repo in one reflect sprint) or incremental (one area per reflect sprint). Once Living Truth is governed, only incremental applies. `kind: reflect` can be set only on a sprint with no spec/build work yet (no mixing) — genesis uses a fresh empty v1, incremental a fresh empty sprint.

Genesis (whole-repo v1) snapshots the entire codebase in one pass, so it needs a **stable baseline and no other open / DRAFT sprint**:
- **If the repo is under git** — require a **clean working tree** before scanning. Uncommitted changes make the reflected citations / snapshot not match the `scanned_at_commit` the Map records, so the Map reads as stale the instant it is written (see the Freshness note above). Ask the user to commit or stash first.
- **If the project is NOT under version control** — there is no commit to anchor to, so this guard does not apply: record the Map with an empty `scanned_at_commit` and tell the user freshness can't be auto-detected (drift checks are git-based — re-scan manually after code changes). Genesis may still proceed.

Incremental reflect is scoped to a few paths, so it does not need the whole tree stable — but still re-scan a touched area whose code moved since its last `scanned_at_commit` (Freshness note above).

**Loading `discover-code`:** the onboarding step reads code via the bundled skill at `.prism/skills/discover-code/SKILL.md` — load and follow it when onboarding an un-governed area. If that path is absent (skill not installed), tell the user to install `discover-code`; PRISM core never reads code itself and has **no other dependency** on the skill (greenfield never loads it).

Schema = whatever `discover-code` produces (see that skill's output contract); PRISM only relies on the area list + `scanned_at_commit`.

## New Sprint Guard (relaxed)

`new sprint` is allowed when the **latest open sprint** satisfies **all** of:

1. `product` → `APPROVED`
2. `design` → `APPROVED`
3. No DRAFT change pack remains open in that latest sprint

Plan, test, and implement do **not** need to be approved.

**Block message when not satisfied:**

```text
⚠ Cannot create new sprint.
→ Conditions not yet met in sprint-v{X}:
  [list only the unsatisfied ones, e.g.:]
  - design: DRAFT (not yet approved)
  [or]
  - DRAFT change pack v{X}.{Y}.{Z}-{slug} is still open — approve it first
→ New sprint opens when product + design are APPROVED and no DRAFT change pack remains open in the latest sprint.
```

## Backlog & Deferred-Scope Candidates At New Sprint

When `new sprint` succeeds, surface — informational, non-blocking, **never auto-carry** — the candidate scope the new sprint could pull from, then let the user choose during `start product`:

1. **Product Backlog** — relevant Active items in `docs/product-backlog.md`, per `core/phase-product.md § Product Backlog (PROD-6)`.
2. **In-sprint deferrals already sealed into Living Truth** — scan product / architecture Living Truth for items deferred to this sprint: PRD Out-of-Scope tagged `[scheduled vN]`, Open Questions naming this phase / sprint, and ADR `Revisit vN` triggers.

Carrying a Backlog item follows `core/phase-product.md § Product Backlog (PROD-6)` (diff effective truth → seed `start product` → archive the `#n`). PRISM never carries anything automatically.

## Plan Gate

`start plan`, `start test`, and `start implement` in sprint-v{X+1} require **all previous sprints** to be `sealed: true`.

**Block message:**

```text
⚠ Cannot start [plan|test|implement] in sprint-v{X+1}.
→ sprint-v{X} is not yet sealed: [implement|test] is still DRAFT.
→ [plan|test|implement] unlocks when sprint-v{X} approves implement.
→ sprint-v{X} current state: test [status]  implement [status]
```

**Auto-unlock on seal:**

When `approve implement` succeeds in sprint-v{X}, the orchestrator invokes `core/tools/seal_sprint.py --sprint v{X}` which performs the full seal pipeline (per discussion doc §9.E):

1. Pre-flight validate all APPROVED proposals + APPROVED same-sprint change-pack deltas via `validate_proposal.py`. Any blocker aborts seal.
2. **Same-sprint cross-source collision guard.** If the same anchor ID carries a state-asserting op (`## Updated` or `## Removed`) in **2+ distinct sources** this seal (any mix of proposals + change-pack deltas), abort. The merge applies sources in order (proposals, then deltas by pack version) and the last one wins — but pack versions are minted per-author/per-machine, so they are **not** a reliable global sequence; silently keeping only the last-applied source would drop the other(s). `## New` does not count (creation, not a competing replacement; a duplicate `New` is already hard-blocked by `apply_proposal`), so the normal "sprint adds an item, then one change pack refines it" flow is untouched. The blocker names each colliding source per ID. Resolve by **consolidating** the change into a single source, or — if the version-order outcome is intentional — re-run with `--accept-overlap ID=WINNER` where WINNER is the **full pack id** the block prints (e.g. `BR-100=v1.2.0-fix`), not a slug/version; repeatable / comma-separated; a bare `ID` without `=WINNER` is rejected; unlisted overlaps still block. The orchestrator surfaces the collision and asks the user before re-running; it never auto-passes `--accept-overlap`. This enforces, deterministically at seal, the soft `approve changes` invariant in `core/change-manager.md` (an overlapping pack must already reflect current effective truth).
3. Atomic merge proposals + deltas into the Living Truth tree (`/docs/product/**`, `/docs/design/design-system.md`, `/docs/architecture/**`, `/docs/testing/test-cases.md`) via `seal_sprint.py` → `apply_proposal.py` / `apply_proposal.apply_multi_target`. All merges computed in-memory first; failure leaves living truth untouched.
4. Regenerate each merged Living Truth file's `## Index` from its anchored items via `inject_indexes` (operates on the in-memory merged text before snapshot/write, so IDs are preserved and re-sorted ascending; prd also gets its Epic Index).
5. Write byte-for-byte snapshots `docs/sprint-v{X}/snapshots/{phase}/.../{name}-at-v{X}-sealed.md` (chmod 444), mirroring every Living Truth file.
6. Sync the sprint's phase assets into the Living Truth tree `docs/<phase>/assets/**`. **Copy** `docs/sprint-v{X}/<phase>/assets/**` (override on filename collision — the sprint folder keeps the historical copy), so the `assets/...` diagram/image references that merged into Living Truth (C4 / DFD Draw.io sources, wireframe PNGs, PDFs) resolve against the live tree. **Remove** every path listed in that phase's `docs/sprint-v{X}/<phase>/assets/.removed` manifest (one path per line, relative to `docs/<phase>/assets/`, `#` comments + blank lines ignored). Copy is additive across sprints — earlier sprints' assets carry over untouched; the manifest is the only way to delete one. Removal is idempotent (an already-absent path is reported, not an error); listing a path that is also present in the sprint (add+remove the same asset) is a seal blocker; the `.removed` manifest itself is never copied into Living Truth. Binary assets are not re-snapshotted — each sprint's `assets/` folder already preserves that sprint's contribution. After the sync, the post-seal validator (`LTV-ASSET` in `validate_living_truth.py`) blocks the seal if any `assets/...` reference in a Living Truth file resolves to a missing file — so a removal (or a typo) that would leave a dangling diagram/image link is caught and rolled back.
7. Set `sprints[v{X}].sealed = true` and `sprints[v{X}].sealed_at` in `prism-config.md`.
8. Stamp `applied_to_living: true <commit-hash> (sealed <ts>)` on every merged source file's frontmatter (falls back to `true <ts>` when not in a git repo).
9. Invoke `scan_drift.py --trigger seal --sprint v{X}` → emit drift warnings to newer unsealed sprints' `.drift-warnings.json` (see § Cross-Sprint Drift Warning below).

Report after seal:

```text
✅ sprint-v{X} sealed.
→ Merged {N} source(s) into {M} Living Truth file(s).
→ Snapshots written under docs/sprint-v{X}/snapshots/ (chmod 444).
→ Assets copied into Living Truth docs/<phase>/assets/ (if any).
→ sprint-v{X+1} plan and test are now open.
→ Drift warnings (if any): see status output.
→ To continue: start plan  or  start test
```

## Parallel Sprint Chain

Multiple in-progress sprints are allowed. No hard limit.

`new sprint` always checks the **most recent sprint** (highest v-number) for the trigger conditions. Example:

```text
sprint-v1: plan ✅, test 🔄, implement 🔄
sprint-v2: product ✅, design ✅, arch 🔄, no DRAFT change pack
→ new sprint → allowed → creates sprint-v3
→ sprint-v3 plan/test/implement blocked until v2 seals (which is blocked until v1 seals first)
```

## Cross-Sprint Drift Warning

Drift warnings fire on **two triggers** (per discussion doc §7.2 / §7.3). Both are implemented by `core/tools/scan_drift.py` — same code path, two CLI flags:

### Trigger A — Change pack approval

When a change pack is approved in sprint-v{X} and one or more newer unsealed sprints exist, `scan_drift.py --trigger change-pack --pack docs/sprint-v{X}/changes/v{X}.{Y}.{Z}-{slug}` runs and:

1. Reads the pack's `{phase}-delta-*.md` files, collecting `## Updated` + `## Removed` anchor IDs.
2. For each newer unsealed sprint v{N} (N > X), scans all mergeable split proposals in that sprint under `docs/sprint-v{N}/{phase}/proposals/`.
3. Writes a drift warning entry to `docs/sprint-v{N}/.drift-warnings.json` for each overlap.

### Trigger B — Sprint seal

When `approve implement` succeeds in sprint-v{X}, `seal_sprint.py` invokes `scan_drift.py --trigger seal --sprint v{X}` automatically after merging proposals into Living Truth. The scanner:

1. Reads all APPROVED proposals in sprint-v{X} (across product / design / architecture phases).
2. Collects `## Updated` + `## Removed` anchor IDs — these are the IDs the seal just merged into Living Truth.
3. For each newer unsealed sprint v{N} (N > X), scans the proposals there for matching anchor IDs.
4. Writes drift warning entries to `docs/sprint-v{N}/.drift-warnings.json`.

### Warning shape

Each entry in `.drift-warnings.json`:

```json
{
  "emitted_at": "YYYY-MM-DD HH:MM",
  "source_sprint": "v{X}",
  "source_event": "seal" | "change-pack v{X}.{Y}.{Z}-{slug}",
  "affected_items": ["FR-014", "FR-007"],
  "dismissed": false
}
```

User-facing rendering in `status` output:

```text
⚠ Drift warning on sprint-v{N} from source_event in sprint-v{X}:
  affected IDs: FR-014, FR-007
→ PRISM does not modify any newer sprint automatically.
→ To handle: validate [phase]  /  feedback: [changes]  /  ignore if unrelated
```

**Rule**: PRISM never auto-modifies any newer sprint document as a result of an older sprint's change or seal. The user reconciles manually (`start change:`) or dismisses.

Dismissal flips `dismissed: true` in the JSON entry:

```text
dismiss sprint-v{N} drift warning
```

## Multi-DRAFT Packs (Branch-Based Collaboration)

Change packs are intentionally branch-friendly. It is valid for different feature branches — and even different sprints — to each carry their own DRAFT change pack.

**Detection:** scan `/docs/sprint-v*/changes/*/change-request.md` for `status: DRAFT`.

Behavior:

1. `status` always works and lists all DRAFT change packs.
2. `resume`, `feedback:`, `validate changes`, and `approve changes` must resolve to exactly one target pack.
3. If a command is ambiguous, PRISM asks the user to choose rather than blocking the workflow or requiring deletion.
4. The user may answer with a sprint, pack id, id prefix, or slug.

**Standard prompt:**

```text
⚠ I found multiple DRAFT change packs:
  sprint-v1 / v1.3.8-fix-payment
  sprint-v2 / v2.7.2-new-auth
→ Which one should I use?
→ Reply with: v1.3.8 / sprint-v1 / fix-payment / v2.7.2 / new-auth
```

PRISM does not rename, merge, or delete packs automatically.

## Status Display With Multiple Sprints

`status` MUST use `core/status-format.md` as the canonical shape.

Multi-sprint specifics:

1. Render sprint blocks oldest to newest.
2. Use only these sprint labels: `[running]`, `[prep — plan/test/implement blocked until v{X} seals]`, `[sealed]`.
3. When a lane is blocked by an earlier sprint that is not sealed, render `⛔ blocked (sprint-v{X} not sealed)`.
4. For every started phase / lane, include the canonical `files:` line defined in `core/status-format.md`.
5. Place any drift warning directly under the affected sprint block.
6. End with one canonical `next:` line, not a list of suggestions.

## Cross-Sprint Routing

Which open sprint a command acts on, when more than one sprint is open. Every routing command — `start change`, `feedback`, `resume`, `import`, and direct-edit routing — resolves its target through these rules; no command carries its own older-vs-newer logic.

1. **Default = the newest open (unsealed) sprint.** Anything with no explicit target and no in-progress draft to continue — new work, or a change to an already-approved artifact — routes here (an approved artifact is reachable via effective truth). **Then apply the command's own preconditions in that sprint:** e.g. `start change` opens a pack only when the source is `APPROVED` there; a still-`DRAFT` source routes to `feedback:` instead, not a new pack. (Implicit detection — newest sprint number for new work, most-recently-updated DRAFT only to *continue* existing work — is in § Working Sprint Detection below.)
2. **Sealed = read-only.** A sealed sprint is historical and cannot be edited; route the change to the newest open sprint (as a change pack there — its delta targets that sprint's proposal and merges to Living Truth only at seal, per `core/change-manager.md`), or to `new sprint` if none is open. **Being *older* is not, by itself, a reason to refuse — only being *sealed* is.**
3. **Explicit or in-focus target.** An open sprint other than the newest is the target when the user **names it** (`... in sprint-v{X}`), **or** when the **session's current working focus is that (still-open) sprint** — the user is mid-flight finishing it, or continuing work that lives there. Provided the command's preconditions hold (e.g. `start change` needs the artifact `APPROVED` and reachable in that sprint's effective truth — not necessarily first-approved there). An older **unsealed** sprint reached this way is a valid target, not a refusal.
4. **Shared-anchor warning (cross-sprint).** The same anchor ID may be in flight in more than one open sprint. When a mutation in an older sprint touches an anchor ID that a newer open sprint's proposals also carry, **warn**: name that newer sprint and tell the user to re-review it — the cross-sprint overlap is *advisory only*; the hard collision block runs only within a single sprint at seal (§ Plan Gate seal step 2), so an unreconciled change can be **overwritten and lost when the newer sprint seals later**. Proceed on the user's acknowledgment. (Semantic dependencies that do not share an anchor ID are caught by that re-review, not automatically.)
5. **Uncertain → ask.** Whenever the intended sprint is not clear — more than one open sprint is plausible, or the session focus is ambiguous — ask; never guess.
6. **Never auto-modify a newer sprint.** A change in an older sprint never edits a newer sprint automatically; the older→newer drift warning (§ Cross-Sprint Drift Warning) surfaces in `status` as the backstop.

## Working Sprint Detection

When a user runs a phase command without specifying a sprint, PRISM resolves the target per § Cross-Sprint Routing: **new work defaults to the newest open sprint**, while **continuing existing work** uses the sprint with the most recently updated DRAFT file (by `updated` frontmatter). User can be explicit: `resume design in sprint-v1` or `resume design in sprint-v2`.

If exactly one active target exists in scope, PRISM may use it automatically.

If a single DRAFT change pack exists and no unrelated active draft or current implementation scope competes with it in the current session, prefer that pack over ordinary phase drafts.

If multiple plausible targets exist and the command or current chat does not clearly identify one, ask the user to choose one. Do not guess.

If both sprints have DRAFT work with the same timestamp, prefer the higher sprint number.
