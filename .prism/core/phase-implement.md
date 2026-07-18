# Phase Engine: Implement

## Trigger

`start implement` — requires: implementation plan APPROVED.

### Trigger forms (user cheat sheet)

The user picks the scope size that produces a small, high-quality code generation. Smaller scope per prompt → tighter context → higher code quality. Large scopes degrade gen quality and increase rework risk.

| Form | When to use | Example |
|------|-------------|---------|
| `start implement` | First entry into the phase; the engine asks which task group / phase to start. | `start implement` |
| `start implement: <task-group-id>` | Recommended default. One task group per prompt. Smallest unit that keeps context tight. | `start implement: 1.1`, `start implement: TG-2.3` |
| `start implement: phase <name-or-number>` | Only when every task group in the phase fits one short prompt comfortably (typically ≤ 2 small task groups). The engine MUST refuse if the phase contains a task group sized > 2 days, and tell the user to fall back to the per-task-group form. | `start implement: phase 1` |
| `start implement: <free-scope>` | When the user has a custom slice (e.g. a single endpoint inside a task group). The engine MUST restate the scope, the affected `code_ownership_zones`, and ask the user to confirm before writing code. | `start implement: only POST /payments/authorize from TG 2.1` |

### Typical happy-path workflow

1. `start implement: <task-group-id>` — engine confirms scope + asks any remaining execution-context questions.
2. Engine reads contracts, loads standards, generates code + unit tests, runs auto-test (see step 11 below), and reports findings inline.
3. User reviews the generated diff. If gaps remain, send a `feedback:` message.
4. User runs `validate implementation --mode spec` (runtime evidence + spec match).
5. User runs `validate implementation --mode quality` (standards compliance, design principles, thresholds).
6. Fix any `blocker` findings (loop back to step 3 if needed).
7. Start the next task group only after the current task group's spec and quality validate modes are clean.
8. Once `test` is APPROVED and all implemented task groups have clean validate modes: `approve implement`.

### After-gen guidance shown to the user

Every code-gen turn MUST end with at minimum an `Auto-test summary` block listing what the engine attempted (with `✓` / `✗` / `⊝ skipped — <reason>` per row). When any applicable step could not be auto-run locally (e.g. no Docker daemon, no headless browser), the engine ALSO appends a `User self-test steps` block telling the user exactly which commands to run, expected outputs, and how to make the next turn auto-runnable. The `User self-test steps` block is a delivery requirement on the AI; it is NOT a gate — it does not block `approve implement`. The actual runtime gate is `validate implementation --mode spec`, which the user runs. See step 11.

After every task-group implementation turn, the engine MUST explicitly suggest:

```text
Next for this task group:
1. validate implementation --mode spec
2. validate implementation --mode quality
   (or run both in order with one command: validate implementation)
3. Fix any blockers before starting the next task group.
4. (Optional) Run mutation testing on the changed code — ~<ETA> via <tool for stack> (e.g. Stryker / PIT / mutmut / muter). Say "run mutation" and I'll run it (I modify source to do so) and write the report to the Implement folder.
```

Line 4 is **optional and non-blocking** (`CODE-3d`): include it with a realistic ETA from `unit-test-standards.md §9` (note Swift `muter` is slow). Drop the line only when the whole task slice is in the exclusion list (no meaningful logic to mutate). Suggest it more insistently for sensitive code (auth / payment / PII / money / data-loss).

## Behavior

1. **Artifact Verification — BEFORE writing any code**: Read and cross-check these 5 sources. If any is missing or contradictory, STOP and report the gap to the user before proceeding:

   | Artifact | What to verify |
   |----------|----------------|
   | `/docs/architecture/api-specs.md` | Endpoint path, HTTP method, request field names + types, response schema, all error codes. These are the contract — code must match exactly. |
   | `/docs/architecture/erd.md` | Table names, column names, column types, FK constraints, NOT NULL constraints. Code column references must match DDL exactly — no guessing. |
   | `/docs/architecture/sequence.md` | Transaction boundaries `[TX BEGIN/COMMIT/ROLLBACK]`, timeout values `[TO: Xms]`, retry intents `[RETRY: n]`, async patterns `[ASYNC]`. These are implementation instructions, not just documentation. |
   | `nfr-v{X}.md §8` | Config Mapping Table — read the recommended values for `http.client.timeout-ms`, `db.pool.max-size`, `rate-limiter.*`, `circuit-breaker.*`, `deployment.replicas.min`. Apply these values in `application.yml` / IaC, not hardcoded in code. |
   | `/docs/architecture/project-reference.md` | Module / package boundaries, public entrypoints, naming expectations, and allowed structural drift. Code should stay within this contract unless the user re-opens Architecture. |

   If any of these files is missing → STOP → inform the user: "I cannot start coding — [file] is missing or incomplete. Please run/complete the Architecture phase first."

2. Read the approved implementation plan and the supporting Product, Design, Architecture, `/docs/architecture/project-reference.md`, and architecture artifacts it references. Then load the applicable standards via the standards INDEX before writing code or running the generation-time self-check:
   - Resolve standards location: read `prism.json` → `paths.standards` (default `.prism/core/standards`).
   - Read `<paths.standards>/INDEX.md` first. If missing, halt and instruct the user to run `setup.sh` or check `prism.json`.
   - Load every "Always load" standard listed in INDEX.
   - Load conditional standards according to INDEX scope rules — only those that match the selected task slice (backend / frontend / AI / IoT), plus `unit-test-standards.md` whenever the slice ships a repo test delta (unit / integration tests).
   - **Framework idioms are NOT enumerated in PRISM standards.** Each coding standards file (`coding-standards-backend.md §8`, `coding-standards-frontend.md §11`, `coding-standards-ai.md §9`) carries only a short note pointing at this rule. The AI applies framework idioms from its training knowledge of the chosen stack (Spring Boot conventions, Go style, React hook rules, Flutter widget patterns, Claude SDK usage, etc.). When training knowledge is uncertain or the framework has shipped a relevant change since cutoff, the AI may consult official framework documentation — this is a narrow exception specifically for **framework idioms** (public ecosystem knowledge), not for **project standards**.
   - Never bypass INDEX or load **project standards** (security, compliance, architecture, naming, design tokens, etc.) from web / training data. Project standards must come through INDEX. The narrow exception above applies only to general framework idioms, not to PRISM project standards. If a true project rule is missing, surface a `feedback:` to the user proposing an addition rather than inventing one.

3. Resolve the selected task slice's code-linkage inputs from the approved plan before writing code:
   - feature refs (`FR-xxx`, `NFR-xxx`, or explicit feature names),
   - user stories (`US-xxx`),
   - task group reference (use the plan's task group number + title),
   - target modules / packages,
   - public entrypoints impacted,
   - inherited architecture obligations,
   - allowed diff boundary,
   - external QA readiness from the plan when testers / QC automation execute outside the product repo,
   - relevant API / contract references,
   - active sprint id and selected change-pack id / slug when implementing a same-sprint correction,
   - ticket / task / board IDs only when explicitly provided by the plan or the user.

   If a ticket or task ID is not present in approved inputs, do not invent one.

4. **Ask about execution context**:
   - Which plan phase or task group should be executed first?
   - Branch / environment constraints for this execution pass?
   - Team capacity: how many developers? Availability?
   - Any repository-specific coding conventions or deployment constraints not captured in the plan?
   - If the selected slice has external QA readiness needs: where should the QA Handoff Bundle point for environment URL, build/commit/version, seed/reset refs, account-role secret refs, feature flags/config, and evidence location?
   - Any blockers that require returning to planning before coding?

5. Execute the approved plan by writing code and unit tests for the selected tasks.

6. **Code traceability marker (`CODE-1`) — canonical `CODE-1 Traceability Contract`**: this step is the single source of truth for `CODE-1`. The rule registry (`core/phase-quality-standards.md`), shared adapters, and stack coding standards point here; they may add stack-specific placement examples but must not restate, weaken, or redefine the field list or narrow the surface list.

    Every **new or materially changed in-scope meaningful code surface** in the selected task slice must carry a concise traceability marker comment or header. *Materially changed* means the surface's behavior, contract, or control flow changes — renames, formatting, and comment-only edits do not count. A surface is *meaningful* when it carries observable behavior or a contract (API / data / event / design); trivial helpers, boilerplate, generated code, DTOs, plain accessors, and pure presentational primitives are not — marker noise there is `CODE-2`.

    **In-scope surfaces**:

    - **Backend / runtime**: API handlers, controllers, application / domain services, event handlers / consumers, scheduled or background jobs, migrations, and non-trivial business functions.
    - **Frontend / UI**: pages, routes, business-facing components, hooks, store slices, API services, and migration / build-time artifacts.
    - **AI / ML**: inference handlers, agent capabilities / tools, training or evaluation steps, evaluators, guardrails, and model-dependent orchestration functions.

    **Required marker fields**:

    - active sprint id
    - Feature refs (`FR-xxx`, `NFR-xxx`, or approved feature names)
    - User Story refs (`US-xxx`) when the task has user-story scope
    - Task Group number + title
    - relevant contract refs (API / design / sequence / ADR / NFR / project-reference / model card as applicable)
    - pack id / slug when implementing a change pack
    - `Tracking IDs / ticket / task / board IDs` only when explicitly provided by the approved plan, current branch, or user; never invent them

    In Freedom mode without sprint / plan artifacts, fill only the fields whose sources exist (e.g. feature / task description refs) and omit the rest — never invent sprint or task-group ids to complete the format.

    Short example:

    ```text
    // Sprint: v2 | Feature: FR-018 | US: US-042 | Task Group: 2.1 Retry failed payment
    // Contract: api-specs-v2.md §3.2 POST /payments/authorize | Project: project-reference-v2.md §5
    // Pack: v2.3.8-fix-payment | Tracking: PAY-114
    ```

    Omit `Pack:` when the scope is not from a change pack. Omit `Tracking:` when no approved `Tracking IDs / ticket / task / board IDs` exist. Do not add `Rule: CODE-1` to every comment.

    **Precedence and scope**:

    - `CODE-1` overrides local no-comment legacy style. Nearby old code without traceability markers is not a valid pattern to copy.
    - Do not bulk-retrofit untouched legacy code just to satisfy this rule; apply it to the current task scope only.
    - Do not spray markers across trivial helpers (`CODE-2`).
    - Place the marker at the nearest stable boundary reviewers see first: file header for a single-surface file, or immediately above the route / class / function / component / job / migration declaration. Stack coding standards give language-specific placement examples.

6b. **No-orphan code + Layered comment guidance (`CODE-1` extension)**: Building on the traceability marker above:

   - **No orphan code**: every non-trivial new or changed code MUST trace to at least one US, FR, NFR, ADR, sequence flow, API spec entry, or `project-reference.md` boundary. If a piece of code has no such link, surface it back as either a missing planning input (return to `start plan` / `start arch`) or as scope drift (flag to user). Do not silently ship orphan code.
   - **Layered comments** — use comments at the layer that matches the intent:
     - **File header**: file purpose, primary feature / US it implements, owner (when known from plan)
     - **Function / method**: complex logic, business rules, non-obvious decisions; explain *why*, not *what*
     - **Inline**: non-trivial branches, edge case rationale, performance / security / contract trade-off notes
     - **TODO / FIXME tags**: temporary workaround with intended fix path and ticket / issue ref where available; bare `TODO` without context is not acceptable
   - **Explain rules** — when code enforces a rule (validation, threshold, retry policy, idempotency key, rate limit, audit step), the comment MUST explain WHY the rule exists with a concrete link (PRD section / ADR / NFR / sequence flow), not just describe WHAT the code does. Future maintainers should be able to decide whether the rule still applies from the comment alone.

6c. **Consistent patterns**: Read existing codebase first before writing new code. Follow existing patterns (naming, file layout, error handling, test structure, dependency injection style, etc.) for the touched module. `CODE-1` overrides local no-comment legacy style: nearby old code without traceability markers is not a valid pattern to copy. Do not introduce a new pattern alongside an existing one without explicit user approval — propose the change as `feedback:` and wait for sign-off before generating. If existing patterns are clearly inconsistent (legacy + new mixed), surface the inconsistency back to the user instead of silently picking one.

7. When `feedback:` revises the current implementation lane, preserve or update those traceability markers so they continue to match the delivered scope.

8. **Repo test delta (`CODE-3`, hard rule)**: Every non-trivial code change in a task group MUST ship a corresponding repo test delta — added or modified unit / integration / contract / component tests in the codebase — that matches the change scope. The intended delta is declared in the plan's `repo_test_delta_target`. If the actual delta will diverge, update the rationale in the same PR / change scope and explain why.

   `no test delta` is acceptable only with substantive justification (e.g., "config-only change covered by existing schema validation tests"). Trivial or blank reasons are not acceptable when `quality_profile.repo_test_delta_required` is `true` (default). Repo test delta is dev-owned and distinct from the QA test intent owned by Phase Test (`qa_test_refs`).

8a. **Test design quality (`CODE-3a..3d`)**: The repo test delta MUST follow `core/standards/unit-test-standards.md` (loaded in step 2) — the single source for techniques, the integration-surface definition, deterministic rules, property classification, exclusions, evidence format, and the per-stack tool matrix. Do not restate those lists here.

   - **`CODE-3a` (structural gate)**: every non-excluded test carries technique evidence — emit a **technique-evidence table** (`test_file → test_case → AC/requirement → technique → observable_assertion`) into the Implement output folder in the same turn as the tests; integration tests when the surface needs them, else `N/A — reason`; `N/A — reason` (not bulk-tagging) when no technique fits; tests are **deterministic**. Missing evidence on an in-scope surface, or non-deterministic tests, is a blocker.
   - **`CODE-3c` (structural gate, light)**: `property_required` surfaces ship ≥1 real-invariant property test; `property_or_examples` accept a property OR an explicit invariant/boundary example set.
   - **`CODE-3b` (coverage DOD target)**: on new/changed code, **line ≥ `quality_profile.coverage_min_new_code`%** AND **branch ≥ `quality_profile.coverage_branch_min_new_code`%** (both default 90; region for Swift in place of branch) — flat, no tiers. PRISM runs available local test commands (step 11) and reads coverage when the local run produces it; exclusions per the standard §8.
   - **`CODE-3d` (mutation — OPTIONAL, suggested, never auto-run)**: PRISM does **not** run mutation automatically and never blocks on it. It **suggests** running mutation in the after-gen guidance block (see below) with an estimated time, and runs it **only on user request** (writing the report into the Implement output folder). Suggest it more insistently on sensitive code (auth / payment / PII / money / data-loss).

   Reports/evidence live in the Implement output folder (e.g. `docs/sprint-v{X}/implementation/`). In Freedom mode the structural checks (`CODE-3a` / `CODE-3c`) run as self-review (no blocking gate).

8b. **Local Docker Compose stack (`CODE-10`, hard rule for runtime projects)**: Every runtime project / service implementation scope MUST provide a local Docker Compose self-test path unless the repository is explicitly not runnable locally (for example SaaS-only managed runtime, hardware-only dependency, or docs/library-only scope). The local stack contract includes:
   - compose file path (`docker-compose.yml`, `compose.yaml`, `infra/docker-compose.dev.yml`, or project-declared equivalent)
   - startup command and teardown command
   - required services and healthchecks
   - environment sample / secret placeholder strategy without committing secrets
   - seed / reset support when stateful flows are implemented
   - at least one happy-path and one error-path local self-test command for changed runtime surfaces

   Missing local compose support for a runtime scope is a quality gap that must be surfaced and either fixed in the task group or recorded as an explicit blocker/open issue. If Docker is unavailable on the user's machine or in the current execution environment, do not block solely because the engine cannot run it; emit `User self-test steps` with copy-pasteable commands and explain how to make the next turn auto-runnable.

9. **QA Handoff Bundle for external QC**: When the approved plan's `external_qa_readiness` is not N/A, or the approved Test package declares external QA handoff for the selected scope, Implementation MUST provide a lightweight QA Handoff Bundle with the delivered slice. Include build / commit / version, target environment URL, changed endpoints / screens, API contract refs or export location, selector map / stable DOM hooks for UI flows, seed/reset instructions or endpoint/script refs, test account roles with secret source references only, feature flags/config, known limitations / deferred issues, and where runtime evidence lives. This is a handoff note, not a QC automation pack and not proof that external QC executed.

10. **Spec review and code quality review are two separate passes**: Implementation must run two distinct review passes before claiming the scope is ready for human backstop:
   - `spec review` — does the code do what it should? Run via `validate implementation --mode spec`.
   - `code quality review` — does the code meet the quality bar and standards? Run via `validate implementation --mode quality`.

   Both passes are user-invoked. Both must complete with no `blocker`-level findings before `approve implement`. Manual human review is a final backstop, not a substitute for either pass.

11. Before presenting implementation changes back to the user, run the shared self-check in `core/phase-quality-standards.md` using the Implementation Standard plus the approved plan / architecture artifacts. Proactively fix any contract drift, missing test/config update, stale traceability marker, missing QA handoff item, or below-quality issue that does not require new human input.

   In addition, every code-gen turn MUST attempt to actually run the change before output, report results to the user, and — when a step cannot be auto-run — hand the user a concrete self-test script with strong language asking them to either run it or install the missing tooling so the next turn can auto-run.

   The engine works through this checklist. Each step is conditional on the kind of change being made and on the local tooling actually available. A step the engine *attempts and fails* becomes a `blocker` in the auto-test summary. A step the engine *cannot attempt at all* (no docker daemon, no browser binary, no sandboxed shell) is NOT a blocker — instead, the engine MUST surface that step in the `User self-test steps` block (see below) and insist that the user run it manually.

   1. **Static checks** (always, when a linter / type checker is configured): run it over the changed files. A failure is a blocker.
   2. **Unit tests** (always, when the touched language has a unit-test command and at least one new / changed unit test was shipped): run only the impacted slice (`mvn test -Dtest=...`, `pytest -q tests/...`, `go test ./...`, `bun test`, `npm test`). Record the exact command. A failure is a blocker.
   3. **Integration / contract tests** (only when `repo_test_delta_target` includes integration or contract tests): run them. A failure is a blocker.
   4. **Local service / docker** (when the change requires a running service — API handler, DB migration, event handler, scheduled job — or otherwise touches runtime behavior): verify the project has a local Docker Compose self-test path per `CODE-10`, bring the stack up (`docker compose up -d` or equivalent), wait for health, exercise the changed endpoint(s) / runtime surface(s) with one happy + one error case, capture startup log + sample request / response, and tear down. A failure of an attempted docker-backed run is a blocker. If no local compose path exists for a runtime project, surface a `CODE-10` blocker/open issue instead of silently skipping. **Skip this step entirely only when the change is pure docs / library-only / non-runtime code or the repository has an explicit accepted no-local-runtime rationale.**
   5. **Browser / UI verification — frontend changes only**: SKIP this step when the task slice touches only backend / data / config / non-UI code. When the change does touch UI (web component, mobile screen, PWA flow), drive the screen with the project's browser / device automation tool (Playwright / Cypress / `puppeteer` / Flutter integration test driver / iOS simulator + Android emulator). Capture one screenshot per Design state declared for the FR (Empty / Loading / Populated / Error / Disabled). A captured screenshot that disagrees with the Design mockup is a blocker. A failure to launch the automation is NOT a blocker — fall through to the user self-test block.
   6. **Auto-test summary block**: at the end of the turn, emit ONLY the rows that applied:

      ```text
      Auto-test summary
      ━━━━━━━━━━━━━━━━━
      ✓ lint: <command> — pass
      ✓ unit: <command> — N passed, 0 failed
      ✓ integration: <command> — N passed, 0 failed
      ✓ docker: <command> — service healthy in Xs
      ✓ browser: screenshots saved to <path> — Empty / Loading / Populated / Error
      ⊝ browser: skipped — no UI change in this task slice
      ```

      Then emit the task-group validation suggestion block from `After-gen guidance shown to the user`.

      Use `✗` and add a `blocker` finding for any step that was actually attempted and failed. Use `⊝ skipped — <reason>` only for steps that do not apply (e.g. backend-only change skipping browser, docs-only change skipping docker). A runtime scope with no local compose path is a `CODE-10` gap, not a silent skip.

   **User self-test steps (when the engine could not auto-run a step that *did* apply)**: if any step that should have run cannot be executed in the current environment (Docker daemon not available, headless browser missing, no shell sandbox capable of long-running processes, environment lacks the required SDK), the engine MUST NOT silently skip and MUST NOT block `approve implement`. Instead, the engine emits a `User self-test steps` block at the end of the turn. The block exists to (a) make sure the user actually runs the missing step before they invoke `validate implementation --mode spec`, and (b) push the user to install or expose the tooling so the next turn can auto-run it.

   - Name exactly which step could not be auto-run and why (one line each).
   - List the commands the user should run, copy-pasteable, in order.
   - List the expected output / pass criteria for each command.
   - State the requirement that must be true before the user runs `validate implementation --mode spec`.
   - End the block with a **"To make the next turn auto-runnable"** note: which tool the user can install / which sandbox flag to grant / which env var to set so the engine can take over next time.

   Example:

   ```text
   User self-test steps (engine could not auto-run docker — daemon not reachable)
   ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
   1. docker compose -f infra/docker-compose.dev.yml up -d payments-svc
      Expect: log "Started PaymentsApplication in Xs"
   2. curl -X POST http://localhost:8080/payments/authorize -d @samples/happy.json
      Expect: HTTP 200, body field "status": "AUTHORIZED"
   3. curl -X POST http://localhost:8080/payments/authorize -d @samples/declined.json
      Expect: HTTP 402, body field "error.code": "PAYMENT_DECLINED"
   4. After these pass, run: validate implementation --mode spec

   To make the next turn auto-runnable: start the local Docker daemon (Docker Desktop / colima) and re-run the same `start implement` or `feedback:` prompt — the engine will then bring the compose stack up itself.
   ```

   The `User self-test steps` block is **not** a gate. `approve implement` does not refuse because the engine could not auto-run; it still requires the user to clear `validate implementation --mode spec` (which is where the runtime evidence is the user's responsibility, see §Validate Implementation Command below). The block is a delivery requirement on the AI: never silently hand back code without telling the user how to verify it. Silently outputting a code change with neither an `Auto-test summary` nor a `User self-test steps` block IS a self-check failure on the AI side — but it does not block the user's approve gate; the user's runtime evidence in `--mode spec` still does.

12. If implementation reveals missing requirements, conflicting test expectations, external QA readiness gaps, or architecture gaps → STOP → ask the user whether to amend the plan, test, or architecture before continuing.

## Input Context

- Required: `implementation-plan-v{X}.md`, `prd`, `design`, `architecture`, `/docs/architecture/project-reference.md`, `/docs/architecture/sequence.md`, `erd`, `api-specs`, `nfr` (all APPROVED), plus applicable standards files resolved via `<paths.standards>/INDEX.md` (per `prism.json` → `paths.standards`, default `.prism/core/standards`). INDEX dictates which standards are always loaded vs conditional based on the selected task slice scope.
- Optional: `/docs/architecture/adr.md`, `/docs/architecture/data-flow.md`, `/docs/architecture/events.md`, `test-plan-v{X}.md`, `/docs/testing/test-cases.md`, `prism-config.md`
- NEVER load: unrelated draft documents from other sprints

When approved change packs exist in the current sprint, load effective truth for every referenced artifact rather than only the base files.

## Output

- Code changes in the target codebase with `CODE-1` feature-linkage markers on in-scope meaningful code surfaces
- Unit tests written alongside implementation where appropriate
- QA Handoff Bundle when required by `external_qa_readiness` / approved Test external QA handoff, or when the user explicitly asks for external QC handoff
- Optional execution notes only if the user explicitly asks for execution results

When the sprint's implementation scope is complete and the user accepts it, `approve implement` closes the sprint's only implementation pass and seals the sprint (the **sprint seal boundary** per `core/version-manager.md § Core Concept`). The orchestrator invokes `python .prism/core/tools/seal_sprint.py --sprint v{X}` which performs:

1. Pre-flight validate every APPROVED split proposal (product/design/architecture/testing) and every APPROVED change-pack delta via `validate_proposal.py`. Any blocker aborts seal.
2. Atomic merge proposals + deltas into the Living Truth tree (`/docs/product/**`, `/docs/design/design-system.md`, `/docs/architecture/**`, `/docs/testing/test-cases.md`) via `seal_sprint.py` → `apply_proposal.py` / `apply_proposal.apply_multi_target`. All merges are computed in-memory first; failure leaves Living Truth untouched.
3. Write byte-for-byte snapshots to `docs/sprint-v{X}/snapshots/{phase}/.../{name}-at-v{X}-sealed.md` (chmod 444), mirroring every Living Truth file.
4. Set `sprints[v{X}].sealed = true` and `sprints[v{X}].sealed_at` in `prism-config.md`.
5. Stamp `applied_to_living: true <commit-hash>` on every merged source file's frontmatter.
6. Invoke `scan_drift.py --trigger seal --sprint v{X}` → emit drift warnings to newer unsealed sprints' `.drift-warnings.json` (see `core/sprint-manager.md § Cross-Sprint Drift Warning`).

This is a delivery acknowledgement, not a document status transition.

Implementation output must satisfy `CODE-1`, `CODE-2`, `CODE-3`, applicable code-quality rules `CODE-4..CODE-9`, `CODE-10` for runtime scopes, `ORB-1`, and `ORB-2` when the scope includes a same-sprint change pack.

## Execution Boundary

- `start implement` does NOT create planning artifacts.
- The planning lane should already have produced an approved implementation plan.
- `start implement` consumes that plan and turns it into code and unit tests.
- External QA / QC execution remains outside this phase, but local implementation verification is part of this phase: the engine must run applicable lint / unit / integration / runtime / browser checks per §11 or emit `User self-test steps` when it cannot auto-run them.
- External QC automation and execution remain outside this phase; Implementation only provides the QA Handoff Bundle when the plan/Test contract requires it.

## Relationship To Planning

```
Planning lane:
  Product / Design / Architecture → Plan → approved implementation plan

Implementation lane:
  approved implementation plan → code + unit tests
```

During `start implement`:
1. Dev selects the approved plan and the task slice to execute
2. Implementation proceeds according to the approved task order and test expectations
3. Code and unit tests are written in the repository
4. If external QC is in scope, Dev includes the QA Handoff Bundle for the runnable slice
5. If the plan no longer fits reality, pause and return to `start plan` or `start test` for updates
6. PRISM safety rules remain active throughout execution
7. If a same-sprint change pack is approved while implementation is in progress, the current implementation pass must absorb that effective truth. Do not open a second implementation pass.

## Gate

`approve plan` opens this phase.

Each sprint has exactly one implementation pass. `approve plan` opens that pass; `approve implement` closes it and seals the sprint. Do not open a second implementation pass in the same sprint.

`approve implement` closes the sprint's only implementation pass after the selected code scope is accepted by the user.

**Reflect-sprint exception (`kind: reflect` — see `core/sprint-manager.md § Reflect Sprint`):** a reflect sprint has no implementation pass, so `approve plan` is **not** a prerequisite. `approve implement` runs as a **no-op build acceptance** and proceeds straight to seal: gates **1 (`test` APPROVED)** and **2 (both `validate implementation` modes)** are **skipped** (no code/test is produced by a reflect sprint). Gate **3 (no unresolved DRAFT change pack)** still applies. The structural seal validators (`validate_proposal.py` / `validate_living_truth.py` — incl. `LTV-COV`) still run as usual, so a malformed/incoherent reflected bundle still fails.

For a normal (non-reflect) sprint, the following gates ALL must be satisfied:

1. **`test` is APPROVED** — if test is still DRAFT or not started, block with:

   ```
   ⚠ Cannot approve implement — test is not yet APPROVED.
   → QA must complete and approve test-plan + test-cases first.
   → Use: approve test
   → Or check status: status
   ```

2. **Both `validate implementation --mode spec` AND `--mode quality` have been run on the current scope and neither has remaining `blocker`-level findings** (not "one of the two" — both are required). If either has not been run, or either still has blockers, block with:

   ```
   ⚠ Cannot approve implement — validate implementation has not cleared both required modes.
   → Required: validate implementation --mode spec  (status: [run | not run] | blockers: N)
   → Required: validate implementation --mode quality (status: [run | not run] | blockers: M)
   → Run any missing mode, fix blockers, then approve implement.
   → Or check status: status
   ```

   See `core/orchestrator.md § Validate Active Files` for how the active validate files are recorded and consumed by this gate.

3. **No DRAFT change pack in this sprint is still unresolved**. If one or more remain:

   ```
   ⚠ Cannot approve implement — a DRAFT change pack in this sprint has not fully propagated to the current downstream phase.
   → Finish the relevant pack with: feedback: ... / validate changes [pack-id|slug] / approve changes
   → Or check blockers: status
   ```

Code review, CI validation, and release procedures may still happen inside or outside this step depending on team practice. Manual human review is a final backstop on top of these gates, not a substitute for them.

## Validate Implementation Command

`validate implementation` is a user-invoked audit command with two required modes.

**Aggregate form**: `validate implementation` with no `--mode` is the aggregate convenience form (same pattern as `validate changes`): it runs `--mode spec` first, then `--mode quality`, in one pass. Each mode still executes its full contract — spec including the `VAL-2` Independent verification protocol and the deterministic tool — and writes or updates its own active validate file. It is not a third audit surface, owns no validate file of its own, and does not change the `approve implement` gate, which still reads both mode files.

- **Spec mode** includes runtime verification: the agent MUST start the app/service in dev mode, run the repo test suite shipped in the task slice, and (for UI changes) capture screenshot per Design state to compare with the mockup. Spec mode is "clean" only when the app starts without uncaught error, the test suite passes, runtime evidence is recorded next to the validation report, and code-vs-spec gap is zero.
- **Quality mode** operates read-only against the applicable standards files. It produces a structured report without mutating code.

Each mode writes or updates its own active validate file (named per `core/orchestrator.md § Validate Active Files`). Both must be run and must clear `blocker`-level findings before `approve implement`. `approve implement` is BLOCKED if `--mode spec` runtime evidence (logs / test summary / screenshots) is missing, even if the static checks pass.

During normal Implement generation (including `start implement` and `feedback:` passes), the engine must already self-apply both validate dimensions (`--mode spec` and `--mode quality`) before outputting code changes.

`approve implement` requires both active validate files (`--mode spec` and `--mode quality`) to already be present and clean, then re-runs both modes in console-only mode as a final full confirmation pass. If either approval-time run finds any blocker or material gap, do not approve; show the findings to the user first and ask whether they want to update the active validate file(s) into follow-up checklists.

### `--mode spec` — does the code do what it should?

#### Independent verification protocol (`VAL-2` — canonical definition, mandatory in spec mode)

Spec mode is an adversarial audit, not a confirmation pass. The generating turn grading its own output is the primary failure mode this rule exists to prevent.

1. **Fresh eyes**: run the audit with a context that did not write the code. **Default conduct: spawn a fresh-context reviewer agent for this pass** (a new agent / subagent session, e.g. via a Task / agent tool). Do not pre-judge from the prompt whether the platform "supports" one — attempt the spawn; fall back only when the environment actually provides no way to open a fresh context. Fallback conduct: re-read the diff and contracts from disk and take the reviewer stance below — in-context claims from the generation turn are not carried over as facts.

   **Reviewer input contract (anti-contamination)**: the reviewer's prompt carries ONLY (a) the validate command contract — the rule-source file paths to load, (b) the target + cycle identifiers, and (c) the file paths to read. It NEVER carries the generating turn's summaries, claims, diff descriptions, or prior validate text — those reach the reviewer only as file content it reads from disk itself. The reviewer returns graded findings with evidence; this run records them in the active validate file. Fail signal: a reviewer prompt that tells the reviewer what was built or that it "should pass".
2. **Re-derive expectations**: reconstruct what the code SHOULD do from effective truth (FR / US acceptance criteria, Design states, Architecture contracts, the plan's task group) BEFORE reading generation-turn claims. The generation turn's summaries, `Auto-test summary` blocks, and prior validate text are inputs to be verified — never evidence.
3. **Refute per AC**: treat the feature as NOT working until proven otherwise. For every in-scope AC / Design state / error path, actively look for a counterexample (wrong branch, missing state, contract drift, unhandled error). Mark an AC satisfied only on a concrete observation: runtime output, a test run this validate run executed, or a code path read end-to-end. When in doubt, grade `blocker`, not `warn`.
4. **Re-run, don't trust**: self-reported runtime evidence from the generation turn is not acceptable as verification. The runtime verification below must be (re-)executed by this validate run. Evidence that cannot be reproduced or re-observed is recorded `unverified` and is a `blocker` for a `clean` conclusion.

**Deterministic checks (required)**: run

```bash
python .prism/core/tools/validate_implementation.py --plan <plan> --task-group <id> [--validate-file <active spec file>] [--run] [--json <evidence path>]
```

and merge its findings into the report. A tool `blocker` is a validate `blocker`. The tool checks falsifiable claims only; full check semantics live in the tool's own docstring — in brief:

- `VI-1` — declared `repo_test_delta_target` files are actually present in the diff
- `VI-2` — the tool does not judge "meaningful": CODE-1 marker coverage is reported as facts for the LLM pass to grade
- `VI-3` — the CODE-3a technique-evidence table exists, references real test files, and covers the task group's user stories
- `VI-4` — the active validate file's conclusion does not contradict its own blocker counts
- `VI-5` (`--run`) — the plan's `validation commands to run` actually pass. A command that cannot run here is recorded `unverified` — not auto-blocking by itself, but pillar 4 still applies: `clean` requires that verification obtained another way (re-run by this validate run, or user-supplied runtime evidence)

**The tool never requires git**: git is one convenience source of the change set, not a requirement. Without git (and without a `--baseline` manifest) it runs clearly-labeled degraded existence-only checks — the degradation itself is warn-level, never a blocker, and a no-git run can only be more lenient than a git run (equal or fewer blockers), never stricter. Record any degradation in the active validate file.

**Static cross-check** of the current code scope against the upstream contract:

- `VAL-1` — the active validate file records target fingerprint, runtime / static evidence, rule coverage including `SEM-1`, semantic integrity evidence, findings, and conclusion.
- `VAL-2` — the run followed the Independent verification protocol above: fresh-eyes context, expectations re-derived from effective truth, per-AC refutation attempted, runtime evidence (re-)executed by this run, and the deterministic tool evidence (`VI-1..VI-5`) recorded in the active validate file.
- `SEM-1` — run the semantic integrity pass across code behavior, repo test delta, approved Plan, and effective Product / Design / Architecture / Test truth: catch code that contradicts intended behavior, duplicates a business rule under another implementation path, uses stale assumptions after change packs, drifts from glossary/API/module terminology, or implements redundant / out-of-scope behavior.
- Product package — Must Have FR / NFR / KPI behaviour the code is supposed to implement
- User Stories — `US-xxx` IDs in the active task slice and their acceptance criteria
- Design — UI states, error copy, validation behavior for the touched FR
- Architecture package — `api-specs` (endpoints, fields, error catalog), `erd` (DDL), `sequence` (TX boundaries, timeouts, retry, async), `events` (payload schema, DLQ), `nfr §8` (config mapping)
- Plan — task group scope, `target_modules_packages`, `public_entrypoints_impacted`, `inherited_architecture_obligations`, `allowed_diff_boundary`, `affected_code_surfaces`, `qa_test_refs`, `repo_test_delta_target`, `external_qa_readiness`, `review_mode`
- `CODE-1` markers — do in-scope meaningful code surfaces satisfy the canonical `CODE-1 Traceability Contract` (step 6), including explicit pack / `Tracking IDs / ticket / task / board IDs` when provided?
- Repo test delta (`CODE-3`, `CODE-3a..3d`) — does the actual repo test delta match `repo_test_delta_target` and cover the `qa_test_refs` intent (or, when pending, the FR / NFR / US scoped against)? Do tests carry technique evidence and stay deterministic (`CODE-3a`), include integration tests when the surface needs them (else `N/A + reason`), and include property tests for `property_required` surfaces (`CODE-3c`)? Coverage on new code targets line ≥ `coverage_min_new_code`% AND branch ≥ `coverage_branch_min_new_code`% (`CODE-3b`, region for Swift). Mutation (`CODE-3d`) is optional/suggested — not checked here, never a blocker.
- External QA readiness — when `external_qa_readiness` is not N/A or Test declares external QA handoff, does the delivered scope include a QA Handoff Bundle with build/env, changed surfaces, selectors/API refs, seed/reset refs, account-role secret refs, feature flags/config, known limitations, and evidence location?

**Runtime verification (mandatory in spec mode — (re-)executed by this validate run per `VAL-2`, never inherited from the generation turn):**

1. Start app/service in dev mode. Capture startup log; flag any uncaught error as `blocker`.
2. Run the repo test suite shipped in the task slice (unit + integration + contract). Record pass/fail summary and coverage delta.
3. For UI changes: screenshot every UI state defined in Design (Empty / Loading / Populated / Error / Disabled / etc.). Visual-compare with mockup `docs/design/design-system.md` (Living Truth) + active sprint's `design/proposals/design-system-v{X}.md`; note discrepancies as `blocker`.
4. For backend changes: invoke each new/changed endpoint with one happy-path and one error case; record response status and body shape.
5. For mobile / Flutter: launch on iOS simulator AND Android emulator; capture screenshot of the main flow plus device log.

Runtime evidence (screenshots, logs, test summary) MUST be embedded or linked in the active `validate-implementation-spec-<cycle>.md` (see `core/orchestrator.md § Validate Active Files`). Spec mode is "clean" only when both the static checks AND the runtime verification pass with zero blocker. Findings are graded `blocker` / `warn` / `info`; any `blocker` blocks `approve implement`.

### `--mode quality` — does the code meet the quality bar and standards?

Quality mode shares pillar 1 of the `VAL-2` protocol above — run it with the same fresh-eyes conduct (fresh-context reviewer agent by default, same reviewer input contract), treating generation-turn claims about quality as inputs to verify, never evidence. Pillars 2–4 (re-derived AC expectations, per-AC refutation, runtime re-run) are spec-mode concerns.

Cross-check the current code scope against the applicable standards loaded via `<paths.standards>/INDEX.md` (resolve `paths.standards` from `prism.json`, default `.prism/core/standards`). The "always load" standards from INDEX plus the conditional ones INDEX maps to the task slice scope are all in play. In addition:

- `VAL-1` — the active validate file records target fingerprint, standards / rule coverage including `SEM-1`, semantic integrity evidence, findings, and conclusion.
- `SEM-1` — run the semantic integrity pass across changed code and standards / architecture contracts: catch conflicting domain semantics across modules, duplicated business logic that changes one rule in two places, naming or boundary drift from project-reference, stale implementation assumptions, and redundant code paths whose behavior can diverge.
- `/docs/architecture/project-reference.md` — module / package boundaries, public entrypoints, dependency direction, active naming conventions, stable code surfaces
- Repo-local standards — any project-specific style / lint / test rules expressed in repo configuration
- Maintainability and testability — naming, function size, layering, dependency direction, test seams, log / metric placement
- Software design principles (`CODE-4..CODE-9`) — single responsibility, declared dependency direction and module boundaries (including `code_ownership_zones` from the plan), size / complexity thresholds from the language's coding standards file, test seams (injected clock / random / IO), and absence of copy-pasted business logic
- Test design quality (`CODE-3a` / `CODE-3c`) — generated unit / integration tests follow `unit-test-standards.md`: technique evidence present, deterministic, `N/A + reason` instead of bulk-tagging, property tests for `property_required` surfaces. Coverage on new code targets line ≥ `coverage_min_new_code`% AND branch ≥ `coverage_branch_min_new_code`% (`CODE-3b`, region for Swift). Mutation (`CODE-3d`) is optional/suggested, never run as a gate
- **Framework idioms** — code follows the idiomatic patterns of the chosen language / framework. PRISM does not enumerate them in this file; the AI applies them from its training knowledge of the chosen stack (and may consult official framework docs when uncertain — see `phase-implement.md` step 2). Do not paste idioms across ecosystems. Idiom drift surfaces as `warn`; measurable defects from drift (perf, leak, security, contract mismatch) escalate to `blocker`.
- Code traceability comment (`CODE-1`) — every new or materially changed in-scope meaningful code surface satisfies the canonical `CODE-1 Traceability Contract` (step 6). The `VI-2` marker-coverage facts from `validate_implementation.py` (spec-mode run) may be reused here as the file inventory; grading meaningful-vs-trivial remains this pass's job.

Findings are graded `blocker` / `warn` / `info`. A `blocker` finding blocks `approve implement`.

### Output

Each mode produces a structured report ordered from `blocker` to `info`:

```text
validate implementation --mode spec: [task group reference]
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
✗ blocker [CODE-1]: POST /payments/authorize handler lacks sprint / FR / task group marker
✗ blocker [CODE-3]: repo_test_delta_target listed adding payment_retry_test.py but the diff has no such file
⚠ warn:    US-042 AC mentions retry banner; UI handler does not surface retry state
ℹ info:    sequence-v2 timeout is 800ms but client timeout is 1000ms — outside scope but worth confirming
```

```text
validate implementation --mode quality: [task group reference]
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
✗ blocker: secret read from env without masking — security-standards §6 mandates redaction in logs
⚠ warn [CODE-6]: handler function is 220 lines — coding-standards-backend.md §7.1 caps at 80 (blocker at 120)
ℹ info:    consider extracting validation into a separate module — maintainability hint
```

Both active validate files are named and lifecycled per `core/orchestrator.md § Validate Active Files` (cycle-scoped: `validate-implementation-spec-<cycle>.md` and `validate-implementation-quality-<cycle>.md` in `tempo/in-progress/` while running, sealed and moved to `tempo/completed/` on approval success). `approve implement` reads both files' latest explicit results, freshness markers, and approval-time re-run outcomes to decide whether to allow approval.

### Order of execution

Run `--mode spec` first, then `--mode quality`. Spec failures usually produce code or contract changes that affect quality findings, so running spec first reduces noise on the quality pass.

The aggregate `validate implementation` (no `--mode`) applies this order automatically in one pass. When spec ends with blockers, quality still runs and reports honestly — but its report notes that quality findings may shift once the spec blockers are fixed, and both active files record their real conclusions (`issues-found` where applicable).

## Quality Standard

Implement like a **Staff Engineer** — disciplined execution, high-quality code and unit tests, strict adherence to the approved plan unless a human re-opens planning.
