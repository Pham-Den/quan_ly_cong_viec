---
status: APPROVED
version: v1
sprint: 1
phase: architecture
sprint_id: sprint-v1
created: 2026-07-18
updated: 2026-07-19 11:17
approved_by: khanh-pham
applied_to_living: false
---

# Project Reference Proposal — Sprint v1

**Architecture package references:** entrypoint `architecture-v1.md` (`ARCH-OVERVIEW-001`); companion set `adr-v1.md`, `api-specs-v1.md`, `data-flow-v1.md`, `erd-v1.md`, `events-v1.md`, `nfr-v1.md`, `project-reference-v1.md`, `sequence-v1.md`.

## New

<!-- ID: PR-001 -->
### PR-001: Identity And Session Module

- **Purpose:** OIDC callback/session/CSRF boundary plus authoritative Central-IAM account lifecycle enforcement; replaces browser-managed local JWT for API Lab.
- **Backend path:** `backend/src/modules/identity/{delivery,application,domain,infrastructure}`.
- **Frontend path:** `frontend/src/core/auth/`.
- **Public entrypoints:** `requireActor`, `requireCsrf`; API-017–020 define `/api/v1/auth/login`, `/callback`, `/logout`, and `/session`. `requireActor` verifies the immutable IAM subject and authoritative active/session status, applies immediate termination revocation and fails closed on uncertain status; it never positively caches an active status.
- **Allowed dependencies:** Central-IAM/OIDC adapter and session repository only; domain modules consume actor context, never provider SDKs. Password verification, inactivity deactivation and failed-authentication blocking remain Central-IAM responsibilities rather than application-domain behavior.
- **Refs:** ARCH-COMP-001, ADR-006, NFR-004.

<!-- ID: PR-002 -->
### PR-002: System Catalog Module

- **Purpose:** logical Host and Environment binding configuration.
- **Backend path:** `backend/src/modules/system-catalog/`.
- **Public entrypoints:** `HostContextReader`, `ConfigureEnvironment`, `DeleteEnvironment`, `ApprovedAddressSetRegistry`, API-001/002/021/022/023. `ApprovedAddressSetRegistry` reads only the signed, IaC-generated manifest mounted at deployment; it verifies signature/version and exact approval-ref + Host + Environment + canonical CIDR-hash match, and fails closed when missing, invalid, stale or unavailable. `ConfigureEnvironment` then verifies base-URL resolution membership, persists the verified hash/reference plus requesting actor in ENT-002, increments the binding revision and appends the audit fact in one caller-owned transaction.
- **Owns:** ENT-001–003/016 and their Prisma repositories.
- **Dependency rule:** other modules may read through `system-catalog/index.ts`; no direct Prisma access to catalog tables. Domain/application code sees the registry port only; the signed-manifest parser/verifier is an infrastructure adapter wired by the API composition root.

<!-- ID: PR-003 -->
### PR-003: API Workspace Module

- **Purpose:** resource tree, API definitions, impact scan, delete/undo.
- **Backend path:** `backend/src/modules/api-workspace/`.
- **Frontend path:** `frontend/src/features/api-lab-workspace/`.
- **Public entrypoints:** `ApiDefinitionReader`, `DependencyImpactReader`, API-003–007.
- **Owns:** ENT-004–006/017.
- **Refs:** SEQ-001/002/005, ADR-003.

<!-- ID: PR-004 -->
### PR-004: Workflow Definition Module

- **Purpose:** workflow draft/version/validation/dependency recovery.
- **Backend path:** `backend/src/modules/workflow-definition/`.
- **Frontend path:** `frontend/src/features/workflow-editor/` and `workflow-validation/`.
- **Public entrypoints:** `WorkflowVersionReader`, `WorkflowImpactService`, `WorkflowValidationService`, API-008–011. `WorkflowImpactService` owns `listByHost`, `listByApi` and `disableImpactedWorkflows(ids, reason, unitOfWork)`; its command joins only a caller-supplied `UnitOfWork` and never opens a nested transaction.
- **Owns:** ENT-007–010.
- **Dependency rule:** validation consumes immutable API/Host projections; it cannot call provider APIs.

<!-- ID: PR-005 -->
### PR-005: Execution Module

- **Purpose:** shared mutation idempotency, admission, jobs, sequential attempts, evidence, history and rerun.
- **Backend path:** `backend/src/modules/execution/`.
- **Frontend path:** `frontend/src/features/execution-inspector/` and `execution-history/`.
- **Public entrypoints:** `IdempotencyCoordinator`, `ExecutionAdmission`, `JobClaimer`, `ExecutionQuery`, `ExecutionResponseSchemaReader`, API-012–016. `IdempotencyCoordinator` owns ENT-015 and may wrap another module's mutation handler in the caller-supplied MySQL `UnitOfWork`; consumers never access the table directly. `ExecutionQuery` projects every attempt by stable `executionAttemptId` plus nullable `executionStepId`/`stepKey`, and every artifact carries the required attempt join key; standalone projections keep Step identity null. `ExecutionResponseSchemaReader` returns only the latest authorized masked response-field projection for validation and never exposes artifacts or raw bodies.
- **Owns:** ENT-011–014/018/020/021 and idempotency records in ENT-015.
- **Dependency rule:** workers consume saved snapshots; they do not depend on HTTP handlers or mutable editor state.
- **Snapshot boundary:** admission locks the Environment revision and copies its existing ciphertext/nonce/tag/key ID plus canonical approved target CIDRs/hash/reference/recording actor/timestamp/manifest version into ENT-020 inside the admission `UnitOfWork`; manifest authority remains external to the requester. Missing address policy/evidence rejects admission and a revision race fails closed. Only the worker resolves the pinned key ID and decrypts in memory; the Gateway authorizes DNS/connect/redirect targets only against the pinned set. Routine key rotation cannot remove a key still referenced by retained ENT-020 rows.

<!-- ID: PR-006 -->
### PR-006: Outbound, Audit And Scheduled Runtime

- **Purpose:** provider HTTP gateway, telemetry/audit adapters and scheduled retention/recovery.
- **Paths:** `backend/src/platform/{outbound,audit,observability,scheduler}/`; worker composition root `backend/src/worker.ts`.
- **Public entrypoints:** `ProviderGateway`, `AuditSink`, `Telemetry`, `runRetention`, `recoverExpiredLeases`. The scheduler invokes retention/recovery application ports backed by owning repositories and emits facts/alerts through its Scheduler Observability Adapter; it never calls an API handler or the Execution Runner component. `ProviderGateway` forwards the authoritative `X-Request-ID` and OTel trace context on every outbound HTTP call; `Telemetry` preserves the same correlation identifiers across job enqueue/claim boundaries.
- **Allowed dependencies:** platform implements application ports; domain/application layers never import Axios/undici, Pino, Sentry or secret-manager SDKs.
- **Refs:** ARCH-COMP-006–008, ADR-004/005/007.

<!-- ID: PR-007 -->
### PR-007: Frontend Feature And API Boundaries

- **Source tree:** route pages under `frontend/src/pages/`; domain UI under `frontend/src/features/<feature>/`; generic primitives under `frontend/src/shared/`; Axios/session/router/config under `frontend/src/core/`.
- **Public entrypoints:** every feature exports only through `index.ts`; no cross-feature internal imports.
- **Server state:** typed API services and query composables; Pinia only for cross-route client state such as selected Host/Environment and panel layout.
- **Deleted-Host history:** `/systems/:host_id/api-lab/history` may resolve from the read-only System Manager Host tombstone. It mounts only execution-history/inspector services against API-014/015 and must not mount Workspace editors, Environment configuration, Run/rerun or mutation entrypoints.
- **Polling:** execution composable owns one-second polling and stops on terminal state, route exit or hidden tab.
- **Correlation:** `frontend/src/core/api/client.ts` accepts or generates the bounded request ID, records the response request/trace IDs and exposes them to the error UI without treating either value as identity or authorization evidence.
- **Frontend observability:** `frontend/src/core/observability/sentry.ts` is the only Sentry adapter. It enforces the NFR-006 event/context schema, `sendDefaultPii=false`, redaction before enqueue and the bounded offline-envelope policy; features never import the Sentry SDK directly.
- **Delivery boundary:** production source maps are hidden CI artifacts uploaded and verified against the immutable Sentry release, then removed before public asset publication; no upload credential enters frontend source or runtime configuration.
- **Design refs:** SCREEN-001–008, DS-COMP-001–011.

<!-- ID: PR-008 -->
### PR-008: Stable Engineering Conventions

| Concern | Contract |
|---|---|
| Backend layers | `delivery → application → domain ← infrastructure`; composition roots resolve adapters |
| Module imports | only `<module>/index.ts`; direct internal or foreign Prisma repository import is forbidden |
| HTTP | `/api/v1`, camelCase JSON, UTC ISO-8601, OpenAPI, standard error envelope; ingress validates/generates and responses echo `X-Request-ID`/`X-Trace-ID`, while downstream HTTP/jobs propagate the authoritative values |
| Errors | typed `errors.yml` catalog generates TS constants and OpenAPI responses |
| Transactions | application service owns short transaction; no outbound HTTP inside transaction |
| Nondeterminism | inject `Clock`, `IdGenerator`, `LeaseOwner`; tests use fakes |
| Naming | DB `snake_case`, TypeScript `camelCase`, types/classes `PascalCase`, IDs UUID/ULID strings |
| Traceability | CODE-1 markers cite FR/US, API/Design, PR item and task group |
| Testing | domain/application unit tests; Prisma integration; Fastify inject; schema contracts; Playwright states |
| Security | no secret/token/raw sensitive payload in browser storage, logs, traces, errors or accessible DOM |

Accepted standards deviations are governed exceptions, not implicit implementation freedom: browser session-cookie/BFF authentication is limited by `EXC-AUTH-001`/ADR-006; the Fastify/Vue brownfield stack by `EXC-STACK-001`/ADR-008; MySQL `DEAD` recovery by `EXC-QUEUE-001`/ADR-004; and Product fixed-delay provider retries by `EXC-RETRY-001`/ADR-005. Architecture §7.6 is the normative handoff matrix. Plan/Test must inherit every named owner, control, contract test and re-review trigger; widening a scope requires Architecture feedback or a change pack.

#### 1. Ownership And Update Rules

| Concern | Contract |
|---|---|
| Artifact owner | Architecture owns PR-001–008 and resolves conflicts with Architecture, API, ERD, sequence and NFR proposals. |
| Consumers | Plan cites PR IDs and paths; Test cites public entrypoints and boundaries; Implement follows the allowed dependency and stable-surface contracts. |
| DRAFT updates | Architecture feedback may update this proposal while preserving PR IDs and recording a new `updated` timestamp. |
| APPROVED updates | Same-sprint corrections require an approved change pack; a later sprint uses an `## Updated` delta against the same stable PR ID. |
| Validation | `validate architecture` checks this file against the repository, upstream Product/Design contracts and all sibling Architecture proposals. |

Update this reference whenever a module owner, source path, public entrypoint, import boundary, source-of-truth location or active naming convention changes. A code-only deviation is not authoritative until the Architecture contract is updated through the applicable PRISM lane.

#### 2. Source-Of-Truth Index

| Subject | Sprint v1 proposal source | Living Truth target after sprint seal |
|---|---|---|
| Product requirements, glossary and personas | `docs/sprint-v1/product/proposals/` + approved `docs/sprint-v1/changes/v1.7.18-api-lab-undo-warning-viewport/product-delta-v1.7.18-api-lab-undo-warning-viewport.md` covering `FR-001/003/007/011`, `BR-005/011/012` and `AC-044–059` | `docs/product/prd.md`, `docs/product/glossary.md`, `docs/product/personas.md`, `docs/product/epics/` |
| Design screens, interaction states and component contracts | `docs/sprint-v1/design/proposals/design-system-v1.md` | `docs/design/design-system.md` |
| Module ownership, paths and stable surfaces | `docs/sprint-v1/architecture/proposals/project-reference-v1.md` | `docs/architecture/project-reference.md` |
| System topology and component contracts | `docs/sprint-v1/architecture/proposals/architecture-v1.md` | `docs/architecture/architecture.md` |
| HTTP contracts and error codes | `docs/sprint-v1/architecture/proposals/api-specs-v1.md` | `docs/architecture/api-specs.md` |
| Data ownership and schema | `docs/sprint-v1/architecture/proposals/erd-v1.md` | `docs/architecture/erd.md` |
| Runtime ordering and failure paths | `docs/sprint-v1/architecture/proposals/sequence-v1.md` | `docs/architecture/sequence.md` |
| Persona-sensitive data flows and trust crossings | `docs/sprint-v1/architecture/proposals/data-flow-v1.md` | `docs/architecture/data-flow.md` |
| Published-event decision and durable job alternative | `docs/sprint-v1/architecture/proposals/events-v1.md` | `docs/architecture/events.md` |
| Quality budgets and operational configuration | `docs/sprint-v1/architecture/proposals/nfr-v1.md` | `docs/architecture/nfr.md` |
| Audit/observability ownership and evidence | `ARCH-COMP-007`, `NFR-006`, `ENT-019`, API error/correlation contracts | `docs/architecture/architecture.md`, `docs/architecture/nfr.md`, `docs/architecture/erd.md`, `docs/architecture/api-specs.md` |
| Decisions and exceptions | `docs/sprint-v1/architecture/proposals/adr-v1.md` | `docs/architecture/adr.md` |

The proposal sources govern Sprint v1 until sealing. After sealing, the Living Truth targets govern; sprint snapshots remain immutable evidence rather than active edit surfaces.

The canonical module data-dependency contract is `erd-v1.md` §4 Data Ownership Matrix. A module marked `Master` alone may write canonical rows; `Consume` must resolve through the public entrypoints below, immutable Execution snapshots or `AuditSink`, never foreign-table SQL.

#### 3. Module Map Summary

| Module | Owns | Public entrypoints | Companion refs |
|---|---|---|---|
| Identity | session actor projection | `requireActor`, `requireCsrf` | API-017–020, ADR-006 |
| System Catalog | Host/env configuration | `HostContextReader` | API-001/002/021/022 |
| API Workspace | tree/API definitions | `ApiDefinitionReader` | API-003–007 |
| Workflow Definition | workflow versions/validation/dependencies | `WorkflowVersionReader`, `WorkflowImpactService` | API-008–011, API-021/022 |
| Execution | jobs/executions/attempts/artifacts/secret snapshots/idempotency | `IdempotencyCoordinator`, `ExecutionAdmission`, `ExecutionQuery`, `ExecutionResponseSchemaReader` | API-002/004–007/009/011–013/016/022 |
| Platform | outbound/audit/telemetry/scheduler | declared ports only | NFR-004/006/007 |

#### 4. Source Tree And Package Organization

```text
backend/
  src/
    modules/
      identity/{delivery,application,domain,infrastructure}/
      system-catalog/{delivery,application,domain,infrastructure}/
      api-workspace/{delivery,application,domain,infrastructure}/
      workflow-definition/{delivery,application,domain,infrastructure}/
      execution/{delivery,application,domain,infrastructure}/
    platform/{outbound,audit,observability,scheduler}/
    app.ts
    worker.ts
  prisma/{schema.prisma,migrations/}
frontend/
  src/
    pages/
    features/{api-lab-workspace,workflow-editor,workflow-validation,execution-inspector,execution-history}/
    core/{api,auth,router,config,observability}/
    shared/
```

Module folders export their supported surface only from `index.ts`. Tests are colocated as `*.test.ts` for unit behavior and under repository integration/E2E suites for cross-boundary contracts; generated OpenAPI/error artifacts are outputs, never hand-edited sources of truth.

#### 5. Public Entrypoints And Stable Code Surfaces

| Surface | Stability contract |
|---|---|
| `<backend module>/index.ts` | Only supported cross-module import path; exported application ports and DTOs are versioned deliberately. |
| `backend/src/app.ts` | API composition root; may wire adapters but contains no domain rules. |
| `backend/src/worker.ts` | Worker composition root and job-handler registration; no HTTP delivery dependency. |
| `frontend/src/features/<feature>/index.ts` | Only supported cross-feature import path. |
| `frontend/src/core/api/client.ts` | Shared authenticated HTTP transport; feature-specific routes remain in typed feature API modules. |
| `frontend/src/core/observability/sentry.ts` | Sole frontend Sentry integration; owns event classification, required context, redaction and bounded offline delivery. |
| `/api/v1` OpenAPI document | External browser/API contract generated from route schemas and the concrete error catalog. |
| `backend/prisma/schema.prisma` plus migrations | Persistence source; repository adapters shield other modules from tables. |

Execution evidence DTOs treat `executionAttemptId` as the artifact join key. `attemptNo` is display/order metadata scoped to a Step (or the standalone Execution) and must never be used alone to associate artifacts.

Anything not listed as a public entrypoint is internal and may change within its owning module without cross-module compatibility guarantees.

#### 6. Dependency And Import Boundaries

- Backend direction is `delivery → application → domain`; infrastructure implements application/domain ports and is wired only at a composition root.
- A bounded context may import another context only through that context's `index.ts`; direct foreign repository, Prisma model or internal-file imports are forbidden.
- Domain and application code cannot import Fastify, Prisma, provider HTTP clients, Pino, Sentry, Vault SDKs or Vue/browser packages.
- Execution depends on immutable Catalog/Workspace/Workflow projections captured at admission; workers cannot read mutable editor state during a run.
- Frontend features may import `core`, `shared` and another feature's `index.ts`, but never another feature's internal files.
- Platform adapters depend inward on declared ports. No domain module depends outward on a specific IAM, secret-manager, telemetry or provider SDK.
- Identity infrastructure may call Central IAM only through the declared adapter; `requireActor` consumes its authoritative status contract and fails closed, while other modules receive only the verified actor projection.

#### 7. Active Naming And Structural Conventions

| Scope | Active convention |
|---|---|
| Backend directories/files | kebab-case module folders; camelCase TypeScript files/functions; PascalCase types/classes |
| Frontend features/components | kebab-case feature folders; PascalCase Vue components; `useXxx` composables |
| Database | plural `snake_case` tables/columns; named `fk_`, `uq_`, `ix_`, `ck_` constraints/indexes; MySQL primary keys use inline `PRIMARY KEY`/engine name `PRIMARY`; migration lint rejects `uk_` and non-registered prefixes |
| HTTP | `/api/v1` plural resources; camelCase JSON; UTC ISO-8601 timestamps; exact catalogued error codes |
| Identifiers | UUID/ULID strings across API boundaries; immutable domain keys such as `step_key` never derive from display labels |
| Public imports | package/module `index.ts` only; no barrel export of infrastructure implementations |
| Tests | behavior-oriented names; reference FR/API/SEQ/PR IDs at integration and acceptance boundaries |

#### 8. Stable Change Triggers

Revisit PR-001–008 and dependent artifacts when any of the following occurs:

- a bounded context gains or loses data ownership, a public entrypoint or a runtime process;
- an implementation needs a cross-module import not allowed here;
- an API route/version, error envelope, DB naming rule or generated-contract source changes;
- a new broker/cache/provider SDK or browser state mechanism is introduced;
- the source tree moves, a stable code surface is renamed, or a current brownfield mapping becomes obsolete;
- security requires secrets, credentials or sensitive payloads to cross a boundary not already documented.
- an accepted exception (`EXC-AUTH-001`, `EXC-STACK-001`, `EXC-QUEUE-001` or `EXC-RETRY-001`) changes scope, compensating control, owner or review trigger;
- correlation-header ownership, static-asset cache semantics or the frontend telemetry event/context schema changes.

#### 9. Existing-To-Target Mapping

| Existing surface | Target |
|---|---|
| `backend/src/api-lab/routes.ts` | thin delivery routes split across PR-003–005 |
| `backend/src/api-lab/runner.ts` | PR-006 provider gateway adapter |
| `backend/src/system-manager/routes.ts` | PR-002 delivery layer |
| `backend/prisma/schema.prisma` | module-grouped models plus versioned Prisma migrations |
| `frontend/src/features/api-lab/` | PR-003/004/005/007 feature packages |
| `frontend/src/services/api.ts` | `frontend/src/core/api/client.ts` plus typed feature APIs |

## Updated

## Removed

### Self-Review Checklist

- [x] Every context has code paths, owned data and public entrypoints.
- [x] Cross-module imports and dependency direction are explicit.
- [x] Existing source surfaces map to bounded target modules.
- [x] Plan/Test/Implement can cite stable PR IDs.
- [x] Ownership, source-of-truth, source tree, stable surfaces, boundaries, naming and change triggers are explicit.
