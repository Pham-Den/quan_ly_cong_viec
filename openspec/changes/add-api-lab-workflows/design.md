## Context

The app already centers work around projects, tasks, branches, and timeline events. API testing is currently outside that flow, so request examples, tokens, test payloads, and evidence for a task can become scattered in chat, notes, browser tabs, or separate API clients.

API Lab adds a compact internal request runner inside the app. It must stay project/task-aware, local-first, authenticated, and useful for repeated personal workflows. The most important behavior is flow execution: request B can use values captured from request A.

## Goals / Non-Goals

**Goals:**

- Add a new `API Lab` menu that works by selected project and optionally links requests/flows/runs to a task.
- Store reusable environments, variable variants, saved requests, flows, flow steps, assertions, and minimal run history.
- Execute requests through the backend so browser CORS does not block internal API tests.
- Support multi-request flow runs where previous responses provide variables for later request URL, query, headers, or body.
- Support cURL import in the MVP for quickly creating saved requests from existing examples.
- Support drag-and-drop for both flow step ordering and mapping fields from a response preview into a later request.
- Keep the UI compact: collection/flow list, editor, response/history area, and task link controls.
- Mask sensitive variables in UI and stored run logs.
- Allow important run results to be attached to the task timeline.

**Non-Goals:**

- Do not build a full Postman/Insomnia clone.
- Do not add team sharing, public workspaces, or external cloud sync in the first version.
- Do not implement load testing, performance benchmarking, mock servers, or OpenAPI schema generation in MVP.
- Do not automatically infer task status from API test success.
- Do not implement code before the user reviews and explicitly approves this change.

## Decisions

### Decision 1: Execute requests through the backend

The frontend sends an execution request to Fastify, and the backend performs the outbound HTTP call.

Rationale: internal APIs often block browser calls through CORS, and backend execution allows one place to enforce auth, timeout, response size limits, secret masking, minimal run logging, and later proxy/network rules.

Alternative considered: execute directly in browser. This is simpler but would fail often for internal APIs and would make secret/history controls weaker.

### Decision 2: Store requests and flows separately

Use saved API requests as reusable building blocks. A flow contains ordered steps that reference a saved request or contain an inline override.

Rationale: a user can test a single endpoint quickly, then reuse the same endpoint inside a login-create-read-update flow without copying everything.

Alternative considered: store only flows. This makes one-off testing awkward and creates duplication between flows.

### Decision 3: Use a small variable and capture engine

Support template variables such as `{{baseUrl}}`, `{{token}}`, `{{task.code}}`, and variables captured from earlier steps. Capture rules read from JSON body paths, response headers, status code, or raw text.

Rationale: the core need is to pass output from API A into API B. A small engine is enough for IDs, tokens, pagination cursors, and generated codes.

Alternative considered: embed a scripting runtime. This is powerful but too broad for the personal MVP and creates security and complexity concerns.

The UI should support both explicit JSON path entry, such as `$.data.id`, and drag-and-drop mapping from a response JSON preview into a later request URL, query, header, or body field.

### Decision 4: Keep assertions declarative

Assertions should be configured as simple rules: status equals, JSON path exists, JSON path equals, body contains, header exists, and duration below threshold.

Rationale: simple assertions cover the common "did this internal API behave correctly?" checks and are easy to show in a compact UI.

Alternative considered: arbitrary JavaScript assertions. This would be flexible but harder to validate, store safely, and explain in UI.

### Decision 5: Persist minimal run logs by default

Each run stores minimal metadata by default: request id/name, flow id/name when applicable, environment, started/finished time, status code, duration, assertion results, captured variables needed for the flow, and error state. Response body is not stored by default.

Response body can be saved only when the user explicitly uses `Luu ket qua`, attaches the run to a task as evidence, or enables response storage for that request/flow. Secret variables are masked in logs and saved response records.

Rationale: most runs only need proof that an API was called and whether assertions passed. Avoiding default response-body storage keeps SQLite light and reduces the chance of storing sensitive internal data.

Alternative considered: store every response body automatically. This helps debugging but can grow the local database quickly and can accidentally persist sensitive data.

### Decision 6: Integrate with tasks through optional links

Requests, flows, and runs can be project-only or linked to one task. A task detail can show related API Lab runs later, but API Lab should still be usable without a task.

Rationale: some internal tests are task-specific, while others are reusable project utilities such as login or health checks.

Alternative considered: force every request to belong to a task. That would make shared utility requests harder to manage.

### Decision 7: Seed common environment types and allow variants

API Lab should support default environment types `local`, `dev`, `uat`, `prod`, plus custom environments. Variables can have variants so the user can switch between tokens, accounts, or internal test identities without rewriting request definitions.

Rationale: the user tests internal APIs across several environments, and token/account variants are common in daily work.

Alternative considered: a single key/value environment only. This is simpler but forces constant manual edits when switching accounts or tokens.

### Decision 8: Add cURL import in MVP

The request editor should import a cURL command and convert method, URL, headers, query, and body into a saved request draft.

Rationale: internal API examples are often shared as cURL. Importing them reduces friction and makes API Lab useful immediately.

Alternative considered: postpone cURL import. The rest of the lab would still work, but initial request creation would be slower.

## Risks / Trade-offs

- Secret leakage in history -> Mask variables marked secret before saving run logs or optional response bodies, avoid logging secret values, and show clear secret indicators in UI.
- Outbound request abuse or accidental calls to wrong systems -> Require login, project scope, configurable timeout, and response size cap; do not add destructive-method confirmation in MVP.
- Variable resolution becomes too magical -> Keep syntax explicit with `{{variableName}}`, show a resolved preview, and record captured variables per step.
- Large responses slow the local SQLite app -> Do not store response body by default; when the user explicitly saves a response, enforce a size cap and mark truncated bodies.
- Flow failures become hard to debug -> Save per-step status, captured variables, assertion result details, and first failure reason.
- Users may expect full API-client features -> Keep MVP scope narrow and document later backlog for export, advanced auth helpers, and OpenAPI support.

## Migration Plan

1. Add Prisma models for API Lab entities with optional `projectId` and `taskId` relations where appropriate.
2. Add backend route module for API Lab CRUD and execution, guarded by existing auth.
3. Add frontend service and `API Lab` route/menu.
4. Add UI in phases: shell/list, single request runner, flow runner, history, then task timeline attachment.
5. Add tests for variable resolution, drag/drop capture mapping, cURL import, assertions, minimal history logging, response-save opt-in, and browser smoke flow.
6. Stop after each phase for user review.

Rollback strategy: API Lab is additive. If needed, remove the sidebar route and disable backend route registration while leaving existing task/branch behavior unchanged.

## Open Questions

- Should saved response bodies attached to a task include full body by default, or should the attach dialog offer summary-only and include-body choices?
