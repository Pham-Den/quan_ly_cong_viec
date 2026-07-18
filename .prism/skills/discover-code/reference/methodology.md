# Methodology — reading code STRICTLY · NOTHING MISSED · NO FABRICATION

> The backbone of `discover-code`. Goal: reflect the **correct current state**, with **coverage evidence** (not gut feeling), with **no fabrication**.
> Corresponding standard methods: artifact enumeration · call-graph reachability from roots · specification/behavior mining from control-flow · module dependency analysis · reflexion/adversarial verify · determinism-first.

---

## 0. Cross-cutting principles (anti-fabrication)
- **Deterministic first, LLM second.** Tool/AST produces the ground-truth list; the LLM only narrates each item. When tool and LLM diverge → **tool wins**.
- **Cite-or-drop.** A mechanism claim without `path:line` → not a fact → demote to `inferred`/`unknown` or drop.
- **In-scope read literal, NO sampling/guessing ALLOWED** (BMAD deep-dive). `inferred` is permitted but must record *what was checked / what was not checked*.
- **Observed ≠ correct.** Running behavior is not necessarily correct → suspecting an error = `suspected defect` (Open Question), not turned into an AC.

---

## Step 1 — CENSUS (enumerate BEFORE reading) ⚓ completeness anchor #1

Use tool/AST/grep to enumerate **completely** every artifact by type — this is the **checklist**, coverage = checklist − done. Prefer deterministic sources:

| Artifact type | Deterministic source (preferred) | Fallback |
|---|---|---|
| Tech stack & build | manifest: `package.json`/`pom.xml`/`build.gradle`/`pyproject.toml`/`go.mod`/`Cargo.toml`/`*.csproj` | census by file extension |
| Module/package + dependency | import/dependency analyzer; AST import; build module decl | grep import at entrypoint |
| **Entry-points** (route/CLI/job/consumer/public export) | router/framework introspection; OpenAPI; `main`/`cmd`; annotation handler | grep route/handler decorator |
| DB schema | migrations; ORM model; introspect DB | grep `CREATE TABLE`/entity |
| Events | broker client; topic/queue/exchange; handler registration | grep publish/subscribe |
| External integration | config; SDK client import; env var **name** (do not read value!) | grep base URL / SDK |
| Config/feature-flag | config loader; flag registry | grep flag key |

→ Record every item into the **coverage ledger** (`templates/coverage-ledger.md`) in `pending` state.
> Do not read every file. Census is a *list*, not a deep-read. Respect secrets — do not read/echo secret files.

---

## Step 1.5 — GIT mining (supplementary source: history + intent)

Git gives both WHAT-context and WHY clues — but git/commit/Jira are **desired-intent → `assumed`, NOT `verified`**; code remains the arbiter for mechanism.
- **Commit message:** clue to *why* something was added/changed (WHY). `assumed`, cross-check code.
- **History / blame / churn:** an area changed a lot = hotspot/risk; a file long untouched **and** not reached from any entry → suspected **dead-code** (flag, do not auto-remove from the doc); who/when (context).
- **Jira/ticket in commit:** grep commits for Jira key `[A-Z]+-\d+` / URL → open the ticket via **MCP (Atlassian)** to get the *original requirement/intent* (a precious WHY source). `assumed` + source=ticket; cross-check code (the ticket may have drifted). *(MCP is absent in headless → record the link into the Skip Register for a person to open.)*
- Tool: `git log --follow <path>` · `git log --since` · `git blame` · `git shortlog` · grep message.

⚠️ Contradiction ticket/commit-vs-code → **code wins** for the mechanism description; the intent stays `assumed`, ask for confirmation if it matters.

---

## Step 2 — REACHABILITY from entry-point ⚓ anchor #2

- For **each** entry-point in the census, trace the **forward call-graph** to the leaves → this is the entirety of the *live behavior*. Code not reachable from any entry → **dead code / unenumerated entry** (flag, do not skip).
- **Dependency graph** (BMAD): node = file/module, edge = import. Find: entry = *not-imported-by-anyone-in-scope*, leaf = *imports-no-one*, **cycle** (flag).
- These two complement each other: reachability covers behavior; the dependency graph covers structure + reveals missed entries.

---

## Step 3 — Read literal each unit (in-scope)

For each entry/module in scope, read fully (no sampling), extract:
- signature (param/type/return) · input + **validation** · **EVERY branch/guard/error-path** · side-effect (DB/IO/external/state) · data touched · pattern (controller/service/repo/middleware…) · TODO/FIXME.
- Each finding = `- [confidence] <claim> — path:line` (see `templates/confidence-tags.md`).

---

## Step 4 — BRANCH/RULE INVENTORY → FR/AC ⚓ anchor #3

> This is how to turn "reading behavior" into *systematic coverage* (≈ specification mining from control-flow).

- **FR** = what an entry-point *does* (1 capability = 1 action + result).
- **AC** = **each branch/outcome** of that FR: happy path + *every* validation + *every* error code/exception + *every* state-transition + *every* guard.
- Rule: **every `if`/`switch`/`try-catch`/guard in the flow = one rule recorded**. Any branch not yet turned into an AC = not yet covered.
- Backend without UI: FR/AC at the **internal capability rule** level (e.g. "when X and Y then reject with code Z") must still be explicit — do not leave blank.

---

## Step 5 — Remaining strata (FIXED order → repeatable)

1. **Data model** — table/column/key/index/migration (DDL coarse), where defined.
2. **Events** — topic/queue, who publishes, who subscribes, delivery semantics.
3. **Integrations** — third-party + internal service; direction (calls-out/listens); protocol; where client/config is.
4. **Cross-cutting** — auth/authz · error handling · transaction boundary · logging · config loading. (This is the "house rules", high-value.)
5. **Cross-repo edges** (multi-repo) — confirm cross-repo calls from real client code/config.

---

## Step 6 — SELF-VERIFY (5 steps)

Per `reference/verify.md` (because PRISM does not verify on your behalf): traceability sweep · tool cross-check · adversarial refute · intent-boundary audit · confidence recompute.

---

## Step 7 — RECONCILE COMPLETENESS (evidence NOTHING MISSED)

- Sweep the **coverage ledger**: every census item must be in state `documented (citation)` OR `deferred (reason)`. No silent `pending` left.
- **Completeness critic** asks hard:
  - Which entry-point has no FR yet?
  - Which table/entity is not yet described?
  - Which topic/integration is not yet recorded?
  - Which branch/error-path in an already-read unit has not become an AC?
  - Which artifact type was **never enumerated** (a whole type missed)?
- Final output = artifacts + **closed coverage ledger** = coverage evidence.

---

## Chunk a large repo (keep rigor without blowing context)
- **Boundary-first:** census everything (cheap) first; deep-read *per module/slice*, do not read indiscriminately.
- **Parallel fan-out:** one agent per module, return a finding-list with citations; the orchestrator does not swallow file contents.
- **Write-then-flush-context:** for each slice: read → write as-built + update ledger → flush detail out of context, keep a 1-2 sentence summary.
- **Resume:** ledger + progress log allow stop/continue; expand via `--paths`.
- **Sample only when MANDATORY + must log:** if a type has too many identical instances, read a representative sample, **state clearly the total / how many read**, the rest `inferred`. No silent sampling.

---

## Plug more gaps (examine BMAD/gsd/spec-kit)

- **Exclude generated/vendored code** (do not document as hand-written): census drops by path/ext (`node_modules`,`dist`,`build`,`.next`,`__pycache__`,`*.min.js`,`*.map`,lockfile) **+ read `.gitignore`** + recognize the marker `Code generated … DO NOT EDIT` + vendored bundle. Migration is read only for the **data-model**, not treated as business logic.
- **Census by per-type pattern** (not a generic checklist): use a pattern table per *project type* (web/backend/mobile/cli/lib) — entry-point/auth/migration/event/**test** pattern — to enumerate correctly & completely by type (the BMAD `documentation-requirements.csv` idea).
- **Tests = CORROBORATION source for AC (net-new — no framework does this):** read tests (already in the census `test_file_patterns`); test name + assertion = *expected behavior* → cross-check against the branch-inventory: test matches code → raise confidence in the AC (still `assumed`/`inferred`, the test may also be stale/wrong); test **contradicts** observed code → flag **suspected defect / stale test** (Open Question, do not decide yourself). It is also a *completeness cross-check*: which branch has a test but has not become an AC?
- **Static blind-spots — DO NOT pretend `verified`:** DI/reflection/plugin/dynamic-dispatch/dynamic registry → static reading does not see it all → tag `inferred` + Open Question, **never `verified`**. (This is a discipline of its own — no framework has it.)
- **Config/feature-flag = a runtime BRANCH → a rule:** do not merely record "has config". Treat each flag like a guard in the branch-inventory: AC "flag X on → Y; off → Z". Census enumerates the flag; branch-inventory turns it into a rule.
- **Incremental re-scan (consume-the-diff):** the Map already has `scanned_at_commit` (half a marker). Refresh = `git diff --name-status <commit> HEAD` → classify path (migration>route>barrel>new_dir) → group to top-level prefix → **re-discover only those `--paths`** → re-stamp the commit. (the gsd `drift.cjs`/`verify.cjs` mechanism.)
- **Fan-out = subagent writes the artifact, returns a receipt:** one agent per module → it writes `docs/inbox/` itself + returns **only citations + line counts**; the orchestrator does NOT swallow file contents (gsd map-codebase).
- **Per-unit risk note (BMAD):** while reading each unit, capture "risk/gotcha/thing you must know before changing it" (e.g. "double-send if retry") → it often reveals a rule/AC or a suspected-defect.
