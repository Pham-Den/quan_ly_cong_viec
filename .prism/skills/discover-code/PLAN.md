# Implementation plan (HOW)

> Turns the design in `DISCUSSION.md` into concrete work: which files to change, where, what is in `prism/` and what is outside.
> ⚠️ The specific *rule* location (function name/line) must be re-confirmed against the real code while doing the work — the "thin slice" step (§6) is exactly there to verify before going broad.

---

## 0. Architecture: 3 blocks

| Block | Where it lives | Role |
|---|---|---|
| **A. Skill `discover-code`** | `discover_code/` (OUTSIDE `prism/`) | The ONLY code reader → produces `as-built` + Map into `docs/inbox/` |
| **B. PRISM tweaks** | inside `prism/` | So PRISM accepts as-built/genesis/reflect while staying safe |
| **C. Design documentation + Map** | `discover_code/` + the target project's `docs/` | Not running code; the Map is the coverage ledger |

Invariant boundary: **A reads code, does not write `prism-config.md`/seal. B owns sprint/seal, does not read code.** Connected through 2 files: **Map** + **inbox**.

---

## 1. Renaming & directory structure

- ✅ Already renamed `import_project/` → `discover_code/`.
- **Target structure of `discover_code/`:**
  ```
  discover_code/
    DISCUSSION.md     — design & rationale (source of truth)
    WALKTHROUGH.md    — step-by-step usage
    PLAN.md           — this file
    SKILL.md          — discover-code skill (to be written — Block A)
    principles.md     — merged from 00-principles.md (code-is-oracle, WHAT/WHY, citation, confidence)
    templates/        — confidence-and-traceability, skip-register (kept); inbox-file-map (updated)
  ```
- **Cleanup:** `00-principles.md` → merged into `principles.md`. `01..07` + `README.md` were the **first draft** (oriented toward "generate full PRISM artifacts via import") → **already obsolete** versus the current reflect/seal design → the still-useful parts have already been **folded into `SKILL.md` / `reference/` then deleted** (the first draft no longer exists).

---

## 2. Block A — Skill `discover-code` (outside PRISM)

**Files to create:** `discover_code/SKILL.md` (+ `principles.md`, `templates/`).

The skill must do:
0. **Follow the STRICT/NO-OMISSION/NO-FABRICATION code-reading method** — `DISCUSSION.md §8.1`: pipeline census → reachability → literal-read → branch-inventory → strata → verify → reconcile; with **3 no-omission anchors** (census-checklist · entry-point reachability · branch-inventory) + coverage ledger. This is the *backbone* of the skill, not an option.
1. **3 modes:** `shell` (shell of the whole repo → Map), `full <area>` (deep → as-built into LT), `deepen <area>`.
2. **Multi-pass:** progress ledger (what has been scanned) to resume; parallel fan-out by area; write-then-release-context.
3. **Produce coherent as-built:** product + arch + design (or Design-N/A) for **one slice** → so the LT structure validator passes.
4. **Examine the impact scope** (when modifying/removing): trace every link (caller/dependent/consumer); detect not-yet-onboarded dependents → report cascade.
5. **Evidence + self-verify:** each item carries `path:line` + confidence; **observed≠correct** (suspected wrong → suspected-defect, does not become an AC); run the **5-step verify** (`reference/verify.md`) because PRISM does not check on your behalf.
6. **Idempotent:** before producing, read effective_truth → if the area already exists, skip (anti-duplication).
7. **Write out:** `docs/inbox/` (as-built) + update the **Map** (with `scanned_at_commit`).
8. **Sources outside code:** git commit message + history/blame/churn; **Jira link → MCP (Atlassian)** to get the original intent; the pile of doc dumps (PRD/SAD…) triaged in batches. All `assumed`, cross-checked against code.
9. **Output bound to PRISM:** fill according to `core/templates/*` (resolved via `INDEX.md`) + inbox-naming (`import-validator.md`); relationships via **structure**, NOT by self-assigning ID/slug/anchor. `import` is what builds anchor/routing (`proposal-template.md`), assigns numbers (`get_next_id`) and runs `validate_proposal.py` (VP-1..19). discover-code does NOT call `get_next_id`.

> The structure can be borrowed from gsd (`map-codebase`, 4 parallel agents) + BMAD (state file resume). Check the LICENSE if copying verbatim.

### The operational "guts" already folded into `SKILL.md` (from the first draft, now deleted)

| What `SKILL.md` needs | Content (folded from the first draft, now deleted) |
|---|---|
| Read code the right way (tools-first) | `02-discover-code.md` — the "deterministic sources by target" table (stack/deps/entrypoint/API/schema/integration/event) |
| Chunk a large repo | `02` — boundary-first · sample-then-log · parallelize-by-module · stop-at-coarse |
| What to capture | `02` — 8 items (identity, module map, dependency boundaries, entrypoints, schema, integrations, cross-edges, **cross-cutting** auth/error/tx/config) |
| **Self-verify (MANDATORY — because PRISM does not check on your behalf)** | `06-verify-against-code.md` — 5 checks: traceability sweep · tool cross-check (tool wins) · **adversarial refute** (a separate agent tries to refute) · intent-boundary audit ("wrong intent") · confidence recompute + report |
| Get WHY when missing | `04-interview-intent.md` — skip-contract · question bank · recognition-over-recall |
| Handle disparate legacy documentation | `03-triage-legacy-docs.md` — classify · verdict (aligned/conflict/stale/intent-only) · extract intent · quarantine |
| Confidence label + citation + as-of | `templates/confidence-and-traceability.md` (the as-of-commit mark ↔ is exactly the Map's `scanned_at_commit`, §3-B8) |
| The "don't remember" ledger | `templates/skip-register.md` |
| Cross-cutting → house-rules | `templates/house-rules.md` |

**Obsolete (don't carry the *framing*, only take the *craft*):** `07-handoff-to-prism.md` (import→approve→full-artifact) and the "map-to-inbox-for-import" part in `05-synthesize.md` + `templates/inbox-file-map.md` — because the output now goes through **reflect/seal**, not `import`. Specifically `06` (verify) and `02` (discover) are **used almost as-is**.

---

## 3. Block B — Tweaks into `prism/` (table: change → file → work)

| # | Change | File in `prism/` | Work |
|---|---|---|---|
| 1 | **Provenance `reflected` (line inside the BODY block)** | `core/templates/proposal-template.md` (body convention) | discover-code writes `**Provenance**: reflected — path:line`; NOT in frontmatter (seal restamp → lost); survive seal (has a test) |
| 2 | **Sprint flag `kind: reflect`** | `prism-config.md` (`sprints[]` schema); `core/sprint-manager.md` | add the `kind` field; define the reflect sprint (pure as-built, fast seal, empty build-scope) |
| 3 | **Gate skipped when reflect** (1 coarse check/gate) | `core/orchestrator.md` (gate matrix); `core/phase-product.md` (PROD-1/PROD-4 + `validate user story`); `core/phase-design.md` (DES + the Design-N/A backend path); `core/phase-plan.md` (PLAN-1); `core/phase-test.md` (TEST-1/2 + Design-State); `core/phase-implement.md` (+ `approve implement`-needs-test) | each gate: `if sprint.kind == reflect → skip` the spec-rigor + build checks |
| 4 | **LT structure validator STILL runs but accepts reflect/baseline provenance** | `core/tools/validate_living_truth.py` (`check_frontmatter`, parity); LTV-COV/LTV-DESIGN-COV kept unchanged | accept that the originating sprint is reflect/baseline; Design-N/A for backend; traceability still mandatory |
| 5 | **Genesis (Type 1) = whole-repo reflect sprint** | none — reuses the reflect sprint + `seal_sprint.py` | a whole-repo reflect sprint v1 seeds the full LT through the normal seal (snapshot + `id_counters` reconcile included); **no separate seed tool** |
| 6 | **Ledger-lookup routing + calling discover-code** | `core/orchestrator.md` (or a new core file `routing.md`); `core/phase-product.md` / `phase-implement.md` | "touching a not-yet-onboarded area that needs governing → open a reflect sprint, call discover-code; if it is only context → read temporarily" |
| 7 | **Serialize ledger for "area being onboarded"** | `prism-config.md` (or a sidecar `.prism/onboarding.json`); `core/orchestrator.md` | prevent 2 reflect sprints running in parallel on the same area |
| 8 | **Drift Map↔code** | Map file (external, the project's `docs/`); `core/tools/scan_drift.py` (or a new check); `core/status-format.md` | `scanned_at_commit` + `git diff --stat` → warn "Map stale" at `status` (does not block) |
| 9 | **Adapter aware of brownfield mode** | `adapters/shared/guided.md` (+ `scripts/generate_adapters.py`) | load the "brownfield rules" (reflect/as-built/discover-code handoff) — **lies dormant with greenfield** |
| 10 | **Tests** | `prism/tests/` | reflect-seal, genesis-seed, serialize, drift-Map, as-built provenance |

> Warning: the backbone principle **"Living Truth only changes at seal"** must not be broken. Genesis (Block B-5) is the ONLY exception, safe because it is at t=0 (no sprint is open).

### Refinements from review (already in DISCUSSION — tightening the rows above)
- **B-2/B-3 — Reflect's seal Contract (C2/C4):** `approve product`+`arch`(+`design`/N-A) → **`approve implement` no-op** (empty build, test exempted per the flag) → seal. The `kind:reflect` flag is exactly what lets the final gate pass when there is no code/test (don't let it get stuck).
- **B-3 — Skipping the gate ≠ skipping quality (C10):** reflect must still reach the **description min-bar** (clear FR/AC or capability-rule · arch comp/event/API/schema · dependency+citation+confidence). Thin reflect is forbidden.
- **B-6 — Reflect = atomic BUNDLE (C5):** produce a full product+arch+design/N-A → validate **together** → only then approve/seal (no separate import phase). Cascade stop-rule (C3): reflect to the **contract boundary** first; deeper → ask the user. Code = running **≠ correct** (C6): record *observed + suspected defect*, do not legitimize a bug into an AC.
- **B-5 — HARD genesis precondition (C8):** only when LT is empty + no real sprint yet + clean tree; a project that has already run PRISM partially → incremental reflect.
- **B-8 — Drift handled firmly per context (C7):** general status does not block; but an area *about to act/reflect* has changed after `scanned_at_commit` (dirty tree) → **refresh discover-code BEFORE routing**. **Multi-repo (C9):** the Map records per-repo `{repo_id,path,commit,dirty}`. **`scan_drift` only compares IDs** (C11) → dependency-warning is discover-code's job, not scan_drift's.

---

## 4. What is NOT inside PRISM

- **Skill `discover-code`** (Block A) — an independent skill (e.g. `.claude/skills/discover-code/`), PRISM only *hands off* to it.
- **Map** — the coverage ledger, kept in the project's `docs/`, read by the agent.
- **Design documentation** (`discover_code/*.md`).

→ PRISM core only adds Block B; greenfield + Type 1 are barely touched (the brownfield rules lie dormant).

---

## 5. What is NEW vs MODIFIED

- **New:** the `discover-code` skill; the serialize ledger; Map + drift-check; the brownfield rules in the adapter. (No genesis tool — genesis is just a whole-repo reflect sprint.)
- **Modified (adding 1 coarse check):** the phase gates + gate matrix; `validate_living_truth.py` / `validate_proposal.py` (accept provenance); `prism-config.md` (the `kind` field).

---

## 6. Roadmap (do the thin slice first)

1. **End-to-end thin slice (1 area, Type 2):** pick 1 small module in 1 real repo → reflect (B-1,2,3,4) → act (remove/modify) → seal. The goal is to test **the 2 hardest spots**: (a) discover-code's impact-scope detection, (b) discover-code's quality/trustworthiness (because PRISM does not check on your behalf).
2. **Genesis (Type 1):** B-5 + try it on 1 small repo → a whole-repo reflect sprint seeds the full LT → run greenfield.
3. **Finishing:** serialize (B-7), drift Map (B-8), adapter (B-9), tests (B-10).
4. **Clean up `discover_code/`:** the old 01–07 have been folded into `SKILL.md` / `reference/` and the first draft deleted.

---

## 7. Execution risks to keep an eye on (from the audit)

- **Gate surface (B-3):** ~6 gates, each one a `kind==reflect` check. Miss one gate → wrongly block the reflect sprint. The thin slice must touch all the gates to expose the gaps.
- **Impact-scope detection:** the softest; missing a coupling → removing it breaks things silently. The safety net: discover-code's self-verify + reading code at implement time.
- **Trusting discover-code:** PRISM does not check on your behalf → the self-verify layer (cross-checking/refutation) is mandatory from the prototype onward.
- **Two-tier LT:** a reflected item is a *description* (not test/US) → the `reflected` label (provenance) must be displayed clearly so no one mistakes it for already-tested.
