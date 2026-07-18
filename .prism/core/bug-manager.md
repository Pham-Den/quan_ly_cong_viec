# Bug Manager — Sprint-Independent Defect Record

> **Guided mode only.** Freedom mode has no bug lane (no gate). This engine owns the **BUG origin** referenced by `core/orchestrator.md § Traceable-Origin Gate (ORIGIN-1)`.

## Core Concept

A **bug record** is the tracked origin for fixing code that does **not** do what an already-correct, already-intended spec says — a defect in code that has been accepted (sealed) or otherwise lives in the live codebase. It is one of the two doors that authorize a code mutation in Guided mode (the other is a requirement under an open implement pass / change). Without an authorized origin, `ORIGIN-1` refuses to edit code.

A bug is **sprint-independent**: it is about the live codebase (the cumulative result of all sealed sprints), not a deliverable of any one sprint. Bug records live in a project-level registry and run on their own lifecycle, decoupled from the sprint cycle.

## What Qualifies As A Bug (guardrail)

Open `start bug:` ONLY when:

1. There is an **already-intended behavior, contract, or acceptance criterion** that the code is **violating** (the behavior was supposed to hold).
2. There is a **reproduction** that proves it is broken (proven steps; or `reproducible: false` with a substantive justification — never a trivial/blank reason).

If the "expected behavior" was **never specified or intended anywhere**, this is a **new requirement, not a bug** — route to the requirement door (`start product` / `start arch` / `start change:`), never `start bug:`. Bug is never a backdoor for unspecified features, refactors, or spec changes.

If the defect **only reproduces because of changes the current sprint's own still-open implement pass has itself introduced** — i.e. it did NOT reproduce against the code as it stood before this pass touched it — this is **iteration, not a bug**: route to `feedback: implement` instead, never `start bug:`. This test is about which change caused the defect, not which sprint the surrounding file originated in — a pre-existing defect in code this pass merely happens to sit next to (or even edit elsewhere in the same file) is still a legitimate bug. When it is unclear whether the defect predates this pass or was introduced by it, do not guess — ask which door applies (same default as `ORIGIN-1` § Step 4: ambiguous → stop and ask).

`severity: urgent` (production defect) selects the hotfix variant (see § Hotfix). Bug-fix only — never new features.

## Registry & Naming

- One folder per bug at the project level (sprint-independent): `docs/bugs/BUG-NNN-{slug}/`.
- `BUG-NNN` is issued by `python .prism/core/tools/get_next_id.py --type BUG` (project-wide counter in `prism-config.md → id_counters`).
- Files inside the folder:
  - `bug-report.md` — the record (`core/templates/bug-report-template.md`).
  - `validate-bug.md` — the active validate file for this bug (bug is sprint-independent, so it does NOT use a sprint `tempo/` folder).
- Git: fix on a `fix/BUG-NNN-{slug}` branch (`hotfix/{slug}` for the urgent variant), per `core/safety-guard.md` git hygiene.

## Public Commands

- `start bug: [symptom]`
- `feedback: [changes]` (a bug is a valid target of the orchestrator's Feedback Target Resolution; the explicit form `feedback bug:` / `feedback BUG-NNN:` is only needed to disambiguate)
- `validate bug [BUG-NNN|slug]`
- `approve bug [BUG-NNN|slug]`
- `status`, `resume` / `continue`

When more than one DRAFT/ACTIVE bug exists, identify the target by `BUG-NNN`, id prefix, or slug — same disambiguation machinery as multi change-pack. If exactly one is plausibly in scope, act on it directly; otherwise ask.

## Lifecycle

### `start bug: [symptom]`

1. Load this engine + `core/templates/bug-report-template.md` + (if it exists) the effective truth of the suspected scope (the AC/contract the bug may violate). On brownfield with no PRISM docs, the expected behavior must still come from **credible existing intent/evidence** — prior working behavior, an existing failing test, production logs showing a regression, a UI/API contract, an obvious domain invariant, or user-confirmed expected behavior. "No PRISM docs" does NOT waive the need for intended behavior; it only allows that intent to come from such evidence instead of a PRISM artifact. If the expected behavior is merely new or desired (no prior intent), it is a **requirement, not a bug** → requirement door (per the guardrail above).
2. Apply the guardrail above. If it is actually a new requirement, stop and route to the requirement door. If the defect is caused by the current sprint's own still-open implement pass, stop and route to `feedback: implement` instead. If it is unclear which applies, ask rather than guess.
3. Issue `BUG-NNN`, create `docs/bugs/BUG-NNN-{slug}/bug-report.md` (`status: DRAFT`) **before** editing any code, capturing at minimum: symptom, reproduction (proven or best-effort + justification), expected vs actual, severity, `allowed_diff_boundary`, affected code surfaces, `doc_impact`. Questions for missing fields follow the ask-with-recommended-default rule (`core/phase-quality-standards.md § How To Apply`) — e.g. propose a severity or repro path derived from the evidence at hand; **expected behavior** is never defaulted from best practice, only from the credible intent/evidence sources in step 1 (else it is a requirement, not a bug).
4. Only after that minimal record (with its declared scope) exists does `ORIGIN-1` authorize code edits **under this bug**. The fix targets the declared scope and ships a regression test tagged `VERIFIES: BUG-NNN`. (Whether an edit actually stays inside the boundary is caught by `validate bug` / `CODE-5` / Scope Discipline afterwards — `ORIGIN-1` only checks the bug origin exists, it does not re-do that math.)
5. Set `status: ACTIVE` while the fix is in progress.

### `validate bug [BUG-NNN]`

Read-only audit; writes/updates `docs/bugs/BUG-NNN-{slug}/validate-bug.md`. The fix is code, so the run follows `VAL-2` (canonical protocol: `core/phase-implement.md § Independent verification protocol`): fresh-context reviewer agent by default with the reviewer input contract, expected behavior re-derived from the bug record (repro / expected / actual) and effective truth, and the repro + `VERIFIES: BUG-NNN` regression test (re-)run by this validate run — the fixing turn's claims are inputs to verify, never evidence. The plan-scoped deterministic tool (`validate_implementation.py`) does not apply; the re-run itself is the runtime evidence. Concludes `issues-found` unless ALL hold:

- (a) **Reproduction demonstrated** (repro → fix → no longer reproduces). If `reproducible: false`, not required, but the justification must be substantive.
- (b) The regression test tagged `VERIFIES: BUG-NNN` exists and **PASSES**.
- (c) The fix stays inside the declared `allowed_diff_boundary`. **Out-of-scope edits are blockers** here (this is where scope is enforced, not at `ORIGIN-1`) until the bug's declared scope is explicitly widened with rationale, or the work is escalated to a requirement/change.
- (d) **Doc-impact assessed**: if `suspected` or `yes`, the validate must name the evidence, the affected docs/anchors, and the change route to open. It must NOT conclude clean with a generic statement.

`VERIFIES: BUG-NNN` is detected by content grep — the regression test may carry it as a code comment or test-name metadata per the repo's idiom; an HTML comment is not required.

### `approve bug [BUG-NNN]`

Hard gate — ALL required:

1. `validate bug` is clean and **fresh**: the active `validate-bug.md` reuses the freshness contract of `core/orchestrator.md § Validate Active Files` (target fingerprint, not stale, approval-time re-run). If the code changed after the last validate, re-run `validate bug` first.
2. The regression test passes.
3. The fix is inside the declared scope.
4. **Doc-impact resolved** (see § Doc-Impact): `none`, OR a linked change is APPROVED, OR an explicit reclassification to `none` with evidence.

On success: set `status: RESOLVED`. `approve bug` does **not** seal anything and does not touch Living Truth.

## Doc-Impact Routing

`doc_impact` is measured against **PRISM governed artifacts** only.

- `none` — spec is correct, only code was wrong (the common case). Fix code + regression test → `approve bug`. No sprint/change needed.
- `yes` — the fix changes behavior described by an approved governed artifact, or reveals the spec is wrong/missing/contradictory. Do **not** `approve bug` until the doc part is routed: `start change:` if the artifact is APPROVED in an open sprint; if the owning sprint is already sealed, route per `core/sprint-manager.md § Cross-Sprint Routing` (newest open sprint, or `new sprint` if none is open — a change pack cannot open in a sealed sprint, see `core/version-manager.md` Immutable Rule 5). Record the change id in `linked_change`; the doc part follows the normal change validate/approve.
- `suspected` — `validate bug` must produce evidence to demote to `none` or promote to `yes`. `suspected` must not pass `approve bug`.

This reuses the existing change machinery; bugs never create a new path into Living Truth (which is updated only by `seal_sprint.py` at sprint seal).

## Hotfix (urgent production defect) — `severity: urgent` variant

The hotfix flow is a bug with `severity: urgent`. Start with `start bug:` and a minimal record **before** the AI edits code; the code may then go on a `hotfix/` branch and skip the normal sprint-requirement cycle for speed, but it does **not** skip the bug record / `validate bug` / `approve bug`. Doc-impact still routes through the change gate as above. If a human already hotfixed outside PRISM, PRISM accepts a post-hoc record only — that is never a precedent for the AI to mutate code without an origin. Bug-fix only; never features/refactors/spec changes. (This supersedes the old standalone hotfix flow in `core/change-manager.md`.)

## Non-Gating Rule (sprint lifecycle)

Bugs are **sprint-independent and non-gating**:

- An open (DRAFT/ACTIVE) bug does **not** block `approve implement` / sprint seal, nor `new sprint`.
- Rationale: a bug fixes **code**; sprint seal writes **docs** (Living Truth) — they do not touch the same artifacts (and the fix lives on its own branch).
- The only coupling that matters (doc-impact) is already handled: a doc-impacting bug opens a change pack, and an unresolved DRAFT change pack already blocks `approve implement` for the sprint it lives in.
- Tracking is by visibility, not blocking: `status` lists all DRAFT/ACTIVE bugs (present but non-gating, like the product backlog) and highlights `severity: urgent` ones.

## Relationship To Other Engines

- `ORIGIN-1` (orchestrator) decides *whether* a code mutation has a valid origin (open implement pass / change vs bug). Bug is the second door.
- `CODE-5` / Scope Discipline (phase engines / `core/phase-quality-standards.md`) enforce that the edit stays within the declared boundary — **after** `ORIGIN-1` grants the lane. The bug engine does not duplicate that check.
- In-flight code in an open implement pass is iteration (`feedback: implement`), not a bug — enforced by `§ What Qualifies As A Bug`'s in-flight exclusion above, not re-derived here.
