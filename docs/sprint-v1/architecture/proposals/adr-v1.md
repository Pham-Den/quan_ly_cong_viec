---
status: DRAFT
version: v1
sprint: 1
phase: architecture
sprint_id: sprint-v1
created: 2026-07-18
updated: 2026-07-19 09:15
approved_by:
applied_to_living: false
---

# Architecture Decision Records Proposal — Sprint v1

**Architecture package references:** entrypoint `architecture-v1.md` (`ARCH-OVERVIEW-001`); companion set `adr-v1.md`, `api-specs-v1.md`, `data-flow-v1.md`, `erd-v1.md`, `events-v1.md`, `nfr-v1.md`, `project-reference-v1.md`, `sequence-v1.md`.

## New

<!-- ID: ADR-001 -->
### ADR-001: Modular Monolith With Explicit Internal Ports

| Field | Value |
|---|---|
| Owner / approver | `khanh-pham`; `sprint-brief-v1.md` `ARCH-DEC-002` |
| Affected artifacts | ARCH-COMP-001–008, PR-001–008, implementation module tree |
| Reversibility cost | Medium; ports permit extraction but data/API split requires migration |
| Revisit trigger | Independent team/scale/compliance boundary cannot be met in one deployable |
| Follow-up | Plan module ownership and dependency-lint tasks |

- **Status:** Accepted for Sprint v1 by `khanh-pham`, project Architecture authority, through confirmed `ARCH-DEC-002`.
- **Context:** Existing Vue/Fastify/Prisma application already deploys as one backend; v1 adds substantial workflow behavior but has no independent team/scale boundary requiring microservices.
**Options considered**

| Option | Pros | Cons | Outcome |
|---|---|---|---|
| Extend the route monolith | Lowest initial code movement; reuses current deployment directly | Increases route coupling, weakens ownership and makes isolated testing harder | Rejected |
| Modular monolith | Retains one deployable while creating explicit ports, ownership and extraction seams | Requires dependency discipline, module contracts and composition-root work | Selected |
| Split microservices | Independent deployment and scaling boundaries | Adds network, broker, data-split and operational cost without a current Product/team driver | Rejected |
- **Decision:** modular monolith with bounded contexts, inward dependencies and independently runnable API/worker composition roots.
- **Consequences:** one deployable codebase and DB remain operationally simple; module public surfaces and table ownership become mandatory; future extraction remains possible through ports.
- **Rejected:** route monolith fails cohesion/testability; microservices add broker/network/operational cost without a Product driver.

<!-- ID: ADR-002 -->
### ADR-002: Logical Host Independent Of Environment

| Field | Value |
|---|---|
| Owner / approver | `khanh-pham`; `sprint-brief-v1.md` `ARCH-DEC-001` |
| Affected artifacts | ENT-001–003/016, API-001/002/021/022/023, SEQ-001/005 |
| Reversibility cost | High after data migration |
| Revisit trigger | Product changes ownership from Host-centric to Environment-centric |
| Follow-up | Migration preview, collision mapping and rollback rehearsal |

- **Status:** Accepted for Sprint v1 by `khanh-pham`, project Architecture authority, through confirmed `ARCH-DEC-001`.
- **Context:** Product navigation starts from one Host and switches Environment; current schema scopes Host to Environment.
**Options considered**

| Option | Pros | Cons | Outcome |
|---|---|---|---|
| Retain duplicated Host per Environment | Smallest migration and schema change | Duplicates workspace/dependencies and permits cross-Environment drift | Rejected |
| Logical Host with Environment bindings | Matches Host-first navigation and keeps one workspace/dependency identity | Requires collision-aware migration and binding-level revision handling | Selected |
| Global URL only | Simplest persisted endpoint model | Cannot isolate Environment values, credentials or lifecycle safely | Rejected |
- **Decision:** `SystemHost` is the stable identity; `SystemHostEnvironment` owns base URL, values and credential for each Environment.
- **Consequences:** workspace/dependencies attach to Host once; migration needs collision preview and explicit mapping for ambiguous legacy rows.
- **Rollback:** keep legacy fields during expand/migrate/contract window and switch the read feature flag back. Each migration also ships a reviewed down script and must pass `up → down → up` in CI/staging; production uses it only within declared rollback preconditions, otherwise restores the verified backup and retained legacy fields through the runbook.

<!-- ID: ADR-003 -->
### ADR-003: Normalized Resource Tree And Immutable Definition Versions

| Field | Value |
|---|---|
| Owner / approver | `khanh-pham`; `sprint-brief-v1.md` `ARCH-DEC-007` |
| Affected artifacts | ENT-004–010/017, API-003–011, SEQ-002/005 |
| Reversibility cost | High; version/history references depend on stable IDs |
| Revisit trigger | Measured storage growth requires version compaction without breaking retained executions |
| Follow-up | JSON Schema versioning and dependency-index property tests |

- **Status:** Accepted for Sprint v1 by `khanh-pham`, project Architecture authority, through confirmed `ARCH-DEC-007`.
- **Context:** tree operations need sibling uniqueness/move/search, while executions and validation require reproducible definitions.
**Options considered**

| Option | Pros | Cons | Outcome |
|---|---|---|---|
| JSON tree with mutable definitions | Simple aggregate writes and reads for small trees | Weak sibling queries, dependency indexing, history and execution reproducibility | Rejected |
| Adjacency tree with mutable definitions | Efficient tree operations and uniqueness constraints | Saved executions and validations can no longer reproduce the exact definition | Rejected |
| Adjacency tree plus immutable API/workflow versions | Supports tree queries, dependency checks, deterministic validation and reproducible execution | Adds version storage, migration and later compaction concerns | Selected |
- **Decision:** normalized adjacency nodes; versioned API/workflow definition documents; dependency index derived transactionally from each workflow version.
- **Consequences:** reliable history/conflict/validation and simpler tree queries; version storage grows and is governed by retention/compaction later.

<!-- ID: ADR-004 -->
### ADR-004: MySQL Lease Queue, Atomic Admission And Idempotency

| Field | Value |
|---|---|
| Owner / approver | `khanh-pham`, Architecture/Operations owner; `sprint-brief-v1.md` `ARCH-DEC-003` |
| Affected artifacts | ENT-011–015/018/020/021, API-012–016, SEQ-003/004/006 |
| Reversibility cost | Medium; execution ports allow broker replacement |
| Revisit trigger | Capacity test misses NFR-001/003 after query/index tuning |
| Follow-up | Lease race, idempotency, dead-job recovery/runbook and 20-run admission stress tests |
| Standards exception | MySQL `DEAD` state + durable alert/runbook is the v1 DLQ-equivalent; no broker DLQ. Architecture approval accepts the manual recovery cost for this bounded workload. |

- **Status:** Accepted for Sprint v1 by `khanh-pham`, project Architecture/Operations authority, through confirmed `ARCH-DEC-003` and `EXC-QUEUE-001`.
- **Context:** executions must survive API restarts, run sequentially, expose attempts, and reject above 20 active workflows; no Kafka/Redis selected.
**Options considered**

| Option | Pros | Cons | Outcome |
|---|---|---|---|
| Synchronous HTTP execution | Simple request lifecycle and minimal persistence machinery | Cannot reliably survive restart or support long sequential workflows | Rejected |
| In-memory queue | Low latency and simple worker loop | Loses work on restart and cannot coordinate multiple instances safely | Rejected |
| MySQL job table with leases | Transactional admission/idempotency and no new infrastructure | Creates polling/contention risk and requires explicit dead-job recovery | Selected |
| External broker | Mature scalable queueing and native DLQ patterns | Adds infrastructure, operations and event contracts beyond the bounded v1 workload | Rejected |
- **Decision:** transactionally persist execution/job/idempotency, claim with leases, heartbeat during work, and serialize capacity admission on a singleton counter/lock row.
- **Consequences:** no new infrastructure and strong acceptance semantics; database contention and polling load require NFR tests. Dead jobs use a durable `DEAD` state, immediate critical alert, named Operations owner and runbook instead of a broker DLQ; exhausted recovery atomically fails the owning Execution and releases its capacity slot. Architecture §7.6 records this accepted bounded deviation as `EXC-QUEUE-001`; Plan/Test must preserve dead-job alert, inspection, authorized manual recovery and capacity-release coverage.
- **Change trigger:** sustained workload cannot meet NFR-001/003 after index/query tuning.

<!-- ID: ADR-005 -->
### ADR-005: Host-Bound Gateway And Envelope-Encrypted Credentials

| Field | Value |
|---|---|
| Owner / approver | `khanh-pham`, Security/Architecture owner; `sprint-brief-v1.md` `ARCH-DEC-005/006` |
| Affected artifacts | ENT-002/016/020, FLOW-001/002, SEQ-003/004, NFR-004 |
| Reversibility cost | High for stored ciphertext/key rotation; medium for gateway adapter |
| Revisit trigger | New provider protocol or secret manager cannot satisfy `KeyProvider` contract |
| Follow-up | Vault mount/auth confirmation, SSRF corpus and key-rotation rehearsal |
| Standards exception | Product US-008 permits retry count 0–5 with a configured delay and excludes advanced backoff. For target-provider Step calls only, the Product contract overrides the standard max-3/exponential rule; all other outbound dependency retries remain max 3 with exponential jitter. |

- **Status:** Accepted for Sprint v1 by `khanh-pham`, project Security/Architecture authority, through confirmed `ARCH-DEC-005/006` and `EXC-RETRY-001`.
- **Context:** users configure dynamic target APIs and credentials; arbitrary outbound URLs would create SSRF and secret exposure risk.
**Options considered**

| Option | Pros | Cons | Outcome |
|---|---|---|---|
| Unrestricted HTTP runner | Maximum endpoint flexibility and minimal gateway code | Exposes SSRF, redirect, credential and unbounded-response risks | Rejected |
| Static partner adapters | Strong protocol-specific controls | Cannot support user-configured dynamic APIs without continual adapter development | Rejected |
| Host-bound generic provider gateway | Preserves dynamic APIs while centralizing egress, TLS, timeout, masking and retry controls | Requires allowlist operations, DNS/redirect validation and key-rotation discipline | Selected |
- **Decision:** relative API paths resolve only against the selected Environment binding; gateway enforces scheme/host/port allowlist, DNS/IP checks, redirect revalidation, TLS ≥1.3 with certificate verification, bounded timeout/response capture and retry of only the current failed Step. Each Workflow-Step retry waits the saved fixed `retryDelaySeconds` (default 1 second), up to the Product-configured count 0–5; no advanced backoff is introduced in v1. For standalone API execution, Architecture selects Product's permitted lower bound `retryCount=0` because approved Design exposes retry editing only for Workflow Steps; its `Chạy lại` action creates a new Execution.
- **Consequences:** dynamic providers remain supported safely; operations must configure egress/allowlists and rotate active/previous keys. Architecture §7.6 records the Product-owned fixed-delay deviation as `EXC-RETRY-001`; its contract tests prove exact attempt count/delay/error class, current-Step isolation and max-3 exponential jitter for non-provider dependencies. Revisit through Product if advanced backoff enters scope.

<!-- ID: ADR-006 -->
### ADR-006: Central OIDC With Server-Set Secure Session Cookies

| Field | Value |
|---|---|
| Owner / approver | `khanh-pham`, acting as Security + Product Owner + Technical Owner + ANBM reviewer for the personal-project scope; `sprint-brief-v1.md` `ARCH-DEC-004` |
| Affected artifacts | API-017–020, PR-001, frontend auth core |
| Reversibility cost | Medium; session and callback migration |
| Revisit trigger | Central IAM mandates a different approved browser profile |
| Follow-up | Register clients/redirect URIs; configure tenant-level MFA, immediate termination revocation, >90-day inactive-account disable/delete and five-failure/15-minute brute-force blocking; remove localStorage JWT compatibility after cutover; obtain independent security review before external/public/commercial deployment |
| Authorization model | Single-role ABAC: authenticated actor + Host/resource ownership/lifecycle attributes; server defaults deny-all. Role splitting is out of scope, not authorization bypass. |
| Approval evidence | **APPROVED:** `ARCH-001`, decision date `2026-07-19`; `khanh-pham` explicitly consolidated Security + Product Owner + Technical Owner + ANBM reviewer roles for the personal-project/internal/non-commercial scope |

- **Status:** Accepted for the personal-project/internal/non-commercial scope. Independent security review is mandatory before external-user, public-production or commercial deployment.
- **Context:** selected central IAM conflicts with current local JWT/password and localStorage token handling.
**Options considered**

| Option | Pros | Cons | Outcome |
|---|---|---|---|
| Keep local JWT/password | Reuses current login implementation | Conflicts with Central IAM and retains browser token/local lifecycle risk | Rejected |
| OIDC tokens in browser storage | Uses Central IAM with a mostly client-side integration | Exposes bearer tokens to browser script and complicates revocation/idle enforcement | Rejected |
| OIDC Authorization Code + PKCE with server-set Secure/HttpOnly/SameSite cookies | Centralizes identity, removes browser-readable bearer tokens and supports CSRF/MFA/idle controls | Requires callback, server-session and compatibility migration | Selected |
- **Decision:** use the third option; API validates session, Central-IAM `amr`/`acr` and CSRF server-side. Phase 1 retains one authenticated role but authorizes through ABAC attributes. Central IAM requires MFA in the ordinary login/reauthentication policy for every API Lab user, assigns the immutable subject ID, revokes access and active sessions immediately on termination, disables/deletes accounts inactive for more than 90 days, and blocks authentication for 15 minutes after five consecutive failures. Login/token exchange has a 5-second timeout and at most three exponential-jitter retries for idempotent provider calls; exhaustion creates or refreshes no session. The callback creates a local session only when current subject/session status and required MFA assurance are present. Each protected request performs one authoritative status verification with a 2-second timeout, no positive-status cache and no request-level retry; revoked, blocked, breaker-open or uncertain status fails closed with typed 503 and no protected payload even when a local session has not expired. Phase 1 has no action-time step-up or interrupted-mutation resume branch; a missing/insufficient assurance claim rejects the callback and returns through the existing unauthenticated sign-in journey. The server stores `lastActivityAt`; inactivity greater than 15 minutes invalidates the local session before protected data access and requires Central-IAM reauthentication. Successful protected requests refresh activity at most once per minute.
- **Consequences:** lower XSS token exposure and centralized lifecycle; every protected request depends on authoritative IAM status and must fit NFR-001 through connection pooling/circuit isolation while still failing closed. Callback/session migration, tenant lifecycle/MFA policy and CSP/CSRF/revocation tests are required. `ARCH-001` records the consolidated personal-project approval. Architecture §7.6 records `EXC-AUTH-001` as the accepted browser-session exception to the preferred Bearer header, with Plan/Test obligations and a scope/revisit trigger. A future action-time step-up flow requires a Product/Design change before API adoption, and any external-user/public-production/commercial deployment requires independent security review evidence before release.

<!-- ID: ADR-007 -->
### ADR-007: One-Second Conditional Polling Instead Of Streaming Events

| Field | Value |
|---|---|
| Owner / approver | `khanh-pham`; `sprint-brief-v1.md` `ARCH-DEC-010` |
| Affected artifacts | API-014, SEQ-003/004, EVT-001, NFR-001 |
| Reversibility cost | Low through `ExecutionQuery` contract |
| Revisit trigger | Measured polling load misses NFR-001 or active-run cap increases materially |
| Follow-up | Conditional ETag polling and hidden-tab stop tests |

- **Status:** Accepted for Sprint v1 by `khanh-pham`, project Architecture authority, through confirmed `ARCH-DEC-010`.
- **Context:** Design requires status visible within one second after response; user selected no Kafka/webhook and current app has no SSE infrastructure.
**Options considered**

| Option | Pros | Cons | Outcome |
|---|---|---|---|
| WebSocket/SSE | Low-latency server push | Introduces connection lifecycle, reconnect, authorization and proxy operations | Rejected |
| Broker-backed push | Decouples producers/consumers and scales event distribution | Requires broker infrastructure and event contracts outside v1 scope | Rejected |
| Conditional REST polling | Reuses existing REST/auth path; ETag and active-only polling bound traffic | Adds predictable read load that must be capacity-tested | Selected |
- **Decision:** poll execution projection every second only while active; support `ETag`/`If-None-Match`; stop on terminal/hidden/unmounted.
- **Consequences:** simple and observable; API read load is bounded by 20 active workflows plus standalone runs. Revisit if measured concurrency makes polling miss NFR-001.

<!-- ID: ADR-008 -->
### ADR-008: Preserve Existing Fastify And Vue Stack As Brownfield Exception

| Field | Value |
|---|---|
| Owner / approver | `khanh-pham`, project architecture authority; `sprint-brief-v1.md` `ARCH-DEC-002` explicitly preserves the existing stack |
| Affected artifacts | Technology stack, PR-001–008, CI/test tooling |
| Reversibility cost | High; framework rewrite would touch every route/component/test |
| Revisit trigger | A new standalone service/UI is approved, or supported runtime reaches end-of-support |
| Follow-up | Record exception in Plan, enforce framework-idiomatic boundaries and re-evaluate at the next major sprint |

- **Status:** Accepted for Sprint v1 brownfield continuity.
- **Context:** Company preference tables prioritize Java/Spring and list React/Angular/NextJS, while this repository already runs Fastify/Node and Vue with established modules, tests and deployment assets.
**Options considered**

| Option | Pros | Cons | Outcome |
|---|---|---|---|
| Rewrite before feature work | Aligns immediately with preferred framework standards | Expands scope, delays Product value and combines platform migration with behavior change | Rejected |
| Preserve stack without governance | Fastest short-term delivery | Creates an untraceable standards deviation and no revisit controls | Rejected |
| Preserve stack through an explicit exception | Maintains brownfield continuity with ownership, boundaries and revisit triggers | Requires ongoing version monitoring and exception review | Selected |
- **Decision:** preserve Fastify 5/Node ≥20.20 and Vue 3/Vite for this bounded increment. This ADR is the project architecture authority's deviation record; it does not approve these technologies for unrelated greenfield services.
- **Consequences:** avoids a high-risk rewrite and keeps implementation scope focused; requires strict PR-008 boundaries, OpenAPI/error contracts, security controls, version monitoring and framework-idiomatic implementation. Architecture §7.6 records `EXC-STACK-001` as accepted only for this brownfield increment; Plan must budget its integration/testing ownership and no downstream phase may extend it to a new standalone service/UI.
- **Rejected:** immediate rewrite delays Product value and mixes platform migration with workflow behavior; silent preservation fails standards traceability.

## Updated

## Removed

### Self-Review Checklist

- [x] Significant, costly and standards-affecting decisions have options and consequences.
- [x] Rejected options and change triggers are explicit.
- [x] Decisions cross-link to components, sequences and NFRs.
