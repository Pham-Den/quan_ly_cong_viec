---
name: discover-code
description: >-
  Reverse-engineer rigorous, no-fabrication "as-built" documentation from EXISTING code,
  for PRISM brownfield onboarding. The ONLY component that reads source code to reverse-document
  it. Use when: onboarding an existing codebase into PRISM (genesis full LT, or per-area), or a
  requirement touches un-governed existing code (a "reflect" step). Produces cited,
  confidence-tagged as-built artifacts into docs/inbox/ + a coverage Map. NEVER fabricates;
  reflects only what the code actually does; PRISM assigns IDs and seals — this skill does not
  touch prism-config.md or seal.
---

# discover-code

> Read existing code → produce **as-built** documentation (true to the current state, with citations, no fabrication) for PRISM.
> This is the **only code reader** in the PRISM brownfield system. Design rationale: `DISCUSSION.md`.

## Hard boundary (invariant — must not be broken)

- **Reading code:** only this skill. **PRISM never reads code to reverse-document.**
- **Do NOT write `prism-config.md`, do NOT create sprints, do NOT seal, do NOT assign IDs, do NOT set slugs/anchors.** Only write to `docs/inbox/` + update the **Map**. PRISM is what assigns the real IDs (via `get_next_id`) at `import` + seal.
- **Read-only on source.** Do not modify code. Do not read secrets (`.env`, `*secret*`, `*.key`…).
- **Inputs:** the code + any existing docs the user supplies — default **`docs/legacy/`** (not mandatory; ask where they are, or to confirm none, if unclear). Triage per `reference/legacy-and-interview.md`.

## Five hard rules

1. **No fabrication / no guessing.** Every mechanism claim must include `path:line`. Cannot point back to code → `unknown` / Open Question, **drop it**, do not keep.
2. **Deterministic first, LLM after.** Tool/AST enumerates the ground-truth; the LLM only *narrates* each enumerated item. The LLM does not "come up with" items.
3. **Observed ≠ correct.** Document the *currently running* behavior. Suspect it is wrong → flag **suspected defect** (Open Question), do NOT turn it into an AC. *Do not legitimize an old bug.*
4. **WHY is not inferred from code.** Intent/KPI/reason comes from **old documentation (including the heap of dumped PRD/SAD) + git commit messages + Jira links (via MCP) + interviews** (`reference/legacy-and-interview.md`); none available → **skip** + Skip Register, do not fabricate. *(These sources are `assumed`, not `verified` — code is still the arbiter for WHAT.)*
5. **Do NOT assign IDs/slugs.** The parent-child relationship is expressed by **STRUCTURE** (nesting EP→FR→US→AC), NOT by slug — topic-based slugs have no common scheme, every place does it differently → cross-refs break. **PRISM `import` assigns the real IDs** via `get_next_id`. Two exceptions that use real IDs immediately: (a) code already has a **marker-ID** (the project was once built by PRISM) → reuse it verbatim; (b) referencing an item **already in Living Truth** → use the real ID directly (read read-only).

## Three modes

| Mode | What it does | Output |
|---|---|---|
| `shell` | scan **the whole repo in one shot**, structure/boundaries/entry-points only (cheap, shallow) | **Map** (coverage ledger + `scanned_at_commit`) |
| `full <area>` | deep-read **one coherent slice** (coherent: product+arch+design/N-A) → complete as-built | as-built bundle → `docs/inbox/` |
| `deepen <area>` | dig further into the detail of an area that already exists | additional as-built |
| `update` | re-scan **only the changed part** since `scanned_at_commit` (`git diff` → `--paths`) | as-built/Map of the changed area |

Rule: `shell` may stay shallow freely (Map only); **whatever will go into Living Truth must be `full`** (enough for PRISM's LT structure validator to pass).

**Disciplined deep-reading** (details in `reference/methodology.md`): **tests** (corroborate AC; contradiction = suspected-defect) · **config/feature-flag** = one runtime branch → one rule · **static blind-spots** (DI/reflection/plugin → `inferred`, not `verified`) · **exclude generated/vendored code** (path/ext + `.gitignore` + marker) · **conflict log** when code diverges from doc/ticket (code wins, but record exactly where it diverges / which document).

## The `full` flow — ORDERED pipeline (nothing missed) + coverage evidence

Per `reference/methodology.md`. Summary of 7 steps, each step tied to 1 **completeness anchor**:

1. **Census** — tool enumerates *exhaustively* every artifact (entry-point/route/job/consumer/table/topic/client/flag) → **checklist** ⚓.
2. **Reachability** — trace the call-graph from *each* entry-point down to the leaves → cover the entire live behavior ⚓.
3. **Literal read of each unit** (in-scope: no sampling/guessing) — signature, input/validation, **every branch/error-path**, side-effect.
4. **Branch → FR/AC** — FR = what the entry does; **AC = each branch/outcome** ⚓ (each `if` = 1 recorded rule).
5. **Fixed strata** — data model → events → integrations → cross-cutting (auth/error/tx/log/config).
6. **Self-verify in 5 steps** — `reference/verify.md` (because PRISM does not check it for you).
7. **Reconcile** — cross-check against the census checklist: every item is *recorded-with-citation* OR *"not yet covered + why"*. Completeness critic.

**3 no-miss anchors:** census-checklist · entry-point reachability · branch-inventory. Plus a `coverage-ledger` = **coverage evidence** (not "I think it's done").

## Output (see `reference/output-contract.md`)

- As-built items go into `docs/inbox/` **following exactly the PRISM inbox-naming + template** (resolve via `INDEX.md`), relationship expressed by **structure** (do NOT assign IDs/anchors yourself — `import` assigns them), **one coherent bundle** (product+arch+design/N-A), each item: claim · `path:line` · confidence.
- **Map** updated: which area exists, where, `scanned_at_commit` (multi-repo: per-repo `{repo_id,path,commit,dirty}`).
- **Coverage ledger** (`templates/coverage-ledger.md`) + **Skip Register** (`templates/skip-register.md`) attached.
- After that, PRISM opens a **reflect sprint** (`kind: reflect` — AI-driven, no hand-edit) → `import` synthesizes proposals (assign IDs via `get_next_id`) → approve → seal. discover-code stops here.

## When to call
- Onboarding a new repo into PRISM: `shell` to see the scale → Type 1 (`full` the whole system → PRISM genesis) or Type 2 (`full` per-area when touched).
- A Type 2 requirement touches an **un-governed** area that needs to be modified/removed/built-upon → PRISM hands off to `full <area>` (reflect). For context-only, read temporarily, do not onboard.

## Related documentation
`DISCUSSION.md` (design) · `PLAN.md` (PRISM integration) · `WALKTHROUGH.md` (how the user types).
