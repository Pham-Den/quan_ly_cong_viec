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

# Data Flow Proposal — Sprint v1

**Architecture package references:** entrypoint `architecture-v1.md` (`ARCH-OVERVIEW-001`); companion set `adr-v1.md`, `api-specs-v1.md`, `data-flow-v1.md`, `erd-v1.md`, `events-v1.md`, `nfr-v1.md`, `project-reference-v1.md`, `sequence-v1.md`.

## New

<!-- ID: FLOW-001 -->
### FLOW-001: Developer Configuration Flow

#### Data Flow Package Contract

#### DFD Notation And Source

| Element | Shape | Usage |
|---|---|---|
| External actor/system | Rectangle | Developer, QA, Operator, Secret Manager and Target API Provider outside the owning process boundary |
| Process | Circle/ellipse | Verb-noun business/data-processing step |
| Data store | Open-ended rectangle (`partialRectangle`, left/right open) | Authoritative MySQL-backed state, durable execution evidence, or an authoritative signed read-only manifest consumed by a process |
| Data flow | Directed labeled arrow | Data/action payload moving only actor↔process, process↔process or process↔store; never actor↔store |

- **Editable source:** `docs/sprint-v1/architecture/assets/api-lab-data-flow.drawio`.
- **Status:** present; XML-valid; three user-group pages.
- **Routing contract:** connectors cannot cross shapes; unavoidable crossings use `jumpStyle=arc`; every arrow ID and direction must match the text inventory.
- **User split:** Developer configuration, QA execution/evidence and Operator recovery remain separate because actors, permissions and data paths materially differ.

#### Data Flow Inventory

| Flow ID | Business flow | External actors/systems | Processes | Data stores | Draw.io page | Notes |
|---|---|---|---|---|---|---|
| FLOW-001 | Create/read/update/delete Host Environment bindings and configure API/Workflow after authentication | Developer, Secret Manager | P1 Authenticated Config API; P2 Encrypt + Version + Validate | D1 MySQL configuration/version/audit; D2 Signed Approved Address Set Manifest | `Developer-Configuration` | Starts after Central IAM authentication; API-002 creates/updates, API-023 deletes; restricted credentials encrypted before persistence; D2 is mounted read-only and verified before D1 create/update |
| FLOW-002 | Admit and execute API/Workflow; inspect evidence | QA User, Secret Manager, Target API Provider | P1 Admit + Snapshot; P2 Worker + Masking Gateway; P3 Execution Query API | D1 Execution/Job/Attempt/Artifact/Secret Snapshot | `QA-Execution` | Key handle returns only to worker memory; polling passes through P3 |
| FLOW-003 | Preview API/Host impact, mutate lifecycle, Undo, review, validate and enable | System Operator | P1 Dependency Impact Scan; P2 Confirmed Lifecycle Mutation; P3 Undo/Review/Validate/Enable | D1 Host/API Lifecycle + Idempotency + Audit; D2 Workflow Dependency + Recovery | `Operator-Recovery` | Host transitions affect future admission; Undo never auto-enables a Workflow |

#### Data Ownership And Consistency

| Data | Master context | Consistency |
|---|---|---|
| Host/binding/credential | System Catalog | strong ACID |
| Tree/API | API Workspace | strong ACID |
| Workflow/version/dependency/report | Workflow Definition | strong ACID within save/validate transaction |
| Execution/job/artifact | Execution | strong state transitions; append-only attempts |
| Telemetry | Observability platform | eventual, redacted |

This table identifies each flow's single master only. The canonical cross-context `Master / Consume / —` dependency matrix is `erd-v1.md` §4; FLOW-001–003 must not introduce a consumer absent from that matrix.

#### Failure And Recovery Notes

| Failure mode | Expected behavior | Recovery strategy |
|---|---|---|
| IAM/session invalid or idle >15 minutes | No protected flow or store read; 401 and safe return URL | Central-IAM reauthentication; no client-state trust |
| Secret Manager unavailable | Key-dependent Environment create/update or restricted-value encryption does not start; admitted run fails with typed evidence. Environment delete remains available when IAM, database and manifest dependencies are healthy | 503 + `Retry-After`; breaker/bulkhead; retry safe key reads only; delete never requests key material |
| Target provider timeout/failure | Only current Step follows configured retry; later Steps stay NOT_RUN | Persist attempt, apply ADR-005 fixed delay, surface masked error |
| Worker lease expires | Another worker may reclaim without duplicating terminal attempt | Lease/idempotency checks; DEAD alert/runbook after three claim failures |
| Undo deadline expires | API remains deleted and Workflows remain DISABLED | Recovery requires replacement/review/validation; no late Undo |
| Telemetry exporter unavailable | Business transaction continues without raw payload export | Bounded buffer/drop metric and alert |

#### Compliance And Retention Notes

| Data class | Constraint | Notes |
|---|---|---|
| Restricted credential/sensitive values | Encrypt AES-256-GCM at rest; TLS ≥1.3; never log/trace/return raw | Decrypt only in worker memory; mask before persistence/export |
| Confidential masked execution evidence | Retain 30 days; body ≤200 KiB after masking | P3 returns authorized masked projection only |
| Internal definitions/dependency metadata | Immutable versions and optimistic revisions | No direct actor→store access |
| Security/business audit | Append-only, queryable 6 months, retained 12 months | Actor/action/target/outcome/time; no secret/token/PII payload |

#### FLOW-001 Runtime Detail

#### FLOW-001.1 External Actors / Systems

| Actor / system | Boundary | Role |
|---|---|---|
| Developer | External authenticated actor | Configures Host, Environment, API and Workflow |
| Secret Manager | External provider | Supplies active key handle by key ID; never receives business payload |

#### FLOW-001.2 Processes

| Process | Responsibility | Owner | References |
|---|---|---|---|
| P1 Authenticated Config API | Authorize an already-authenticated actor, then validate CSRF/revision and create/read/update/delete commands | Identity + System Catalog | FR-001–004, API-001–009/023 |
| P2 Encrypt + Version + Validate | Verify signed manifest and exact address approval, encrypt restricted values for create/update, canonicalize/hash approved target CIDRs, delete bindings without key access, persist immutable versions and validate definitions | Catalog + Workspace + Workflow | FR-002/004/006/007, SEQ-001/002 |

#### FLOW-001.3 Data Stores

| Store | Stored data | Source of truth? | Owner / consistency |
|---|---|---|---|
| D1 MySQL | Host/Environment including approved CIDR set/hash/reference, encrypted credential/value, tree, versions, validation and audit | Yes | Owning modules; ACID transaction per command |
| D2 Signed Approved Address Set Manifest | Versioned ref + Host + Environment + canonical CIDR hash + Security/Host-owner approval | Yes for network approval | CI-generated, signed and mounted read-only; `ApprovedAddressSetRegistry` verifies before D1 write |

| Element | Detail |
|---|---|
| Actor | Authenticated Developer |
| Processes | Post-authentication Host/Environment configuration, tree/API/workflow save and validation |
| Stores | System Catalog, Workspace, Workflow Version, Validation Report, Audit |
| Sensitive data | credential and sensitive variables: Restricted; API definitions: Internal |
| Controls | CSRF, optimistic revision, signed-manifest exact-match gate, AEAD before DB write, masked response, immutable version, audit |
| Retention | definitions until lifecycle deletion; audit 12 months |

FLOW-001 begins only after the OIDC callback/session flow in API-017–020 has completed. Central IAM token/claims exchange is therefore an explicit precondition, not a data movement inside this configuration DFD; authentication lifecycle remains specified by ADR-006 and SEQ-001. From that boundary, the browser sends configuration over TLS → API validates actor/revision → Registry verifies signed manifest plus exact ref/Host/Environment/CIDR hash → key provider supplies key material → credential is encrypted → short MySQL transaction commits configuration and audit. Missing/invalid/stale/unavailable manifest stops before key or DB access. Validation reads immutable versions and masked response-schema projections; it never calls a target provider.

#### FLOW-001.4 Data Flows

| Arrow ID | From → To | Label / classification |
|---|---|---|
| `d-e1` | Developer → P1 Authenticated Config API | `Authenticated Environment CRUD/config command + CSRF` / Internal + Restricted input |
| `d-e2` | P1 → P2 Encrypt + Version + Validate | `Validated command` / Internal |
| `d-e3` | P2 → Secret Manager | `Key by ID` / Restricted |
| `d-e4` | P2 → D1 MySQL | `AEAD ciphertext + verified CIDR hash/ref/manifest version + immutable version` / Confidential + internal security evidence |
| `d-e5` | Secret Manager → P2 Encrypt + Version + Validate | `Active key handle` / Restricted; process memory only |
| `d-e6` | P2 Encrypt + Version + Validate → D2 Signed Approved Address Set Manifest | `Verify ref + Host + Environment + CIDR hash` / Internal security metadata |
| `d-e7` | D2 Signed Approved Address Set Manifest → P2 Encrypt + Version + Validate | `Signed approved record/version or fail closed` / Internal security metadata |

#### FLOW-001.5 Draw.io/XML Source

- **Page:** `Developer-Configuration` in `assets/api-lab-data-flow.drawio`.
- **Trace:** FR-001–004/006/007, API-001–011/023, NFR-004/006.
- **Notation check:** actors/systems are rectangles, processes are ellipses, D1 and read-only D2 are open-ended stores, and every arrow is labeled; the manifest has exactly one classification: D2 data store.

<!-- ID: FLOW-002 -->
### FLOW-002: QA Execution And Evidence Flow

#### FLOW-002.1 External Actors / Systems

| Actor / system | Boundary | Role |
|---|---|---|
| QA User | External authenticated actor | Starts a run and polls masked evidence |
| Secret Manager | External provider | Resolves the pinned key ID and returns a key handle to worker memory only |
| Target API Provider | External provider trust boundary | Receives Host-bound request and returns bounded response/error |

#### FLOW-002.2 Processes

| Process | Responsibility | Owner | References |
|---|---|---|---|
| P1 Admit + Snapshot | Validate readiness/capacity/idempotency and non-empty approved address policy; lock Environment revision and byte-copy ciphertext/nonce/tag/key ID plus CIDRs/hash/approval reference into immutable ENT-020 without key-provider access | Execution Orchestrator | FR-005/008/010, API-012/013/016 |
| P2 Worker + Masking Gateway | Claim lease, resolve mappings, re-resolve DNS/connect/redirect targets against the pinned CIDR set, call provider, mask and persist attempts/evidence | Worker + Outbound Gateway | FR-008/009/012, SEQ-004 |
| P3 Execution Query API | Read authorized execution projection and return masked polling/history payload | Execution Query | FR-008/010/012, API-014/015 |

#### FLOW-002.3 Data Stores

| Store | Stored data | Source of truth? | Owner / consistency |
|---|---|---|---|
| D1 Execution Store | Execution, job, Step, attempt, masked artifact, pinned secret/address-policy snapshot and audit links | Yes | Execution; ACID state transitions, append-only attempts |

| Element | Detail |
|---|---|
| Actor | Authenticated QA user |
| Processes | run admission, job claim, mapping resolution, provider call, attempt persistence, polling/history |
| Stores | Execution, Step, Job, Artifact, Idempotency, Audit |
| Sensitive data | resolved headers/body/credential: Restricted in memory; masked artifacts: Confidential |
| Controls | Host-bound gateway, IP/DNS checks, TLS, timeout, response cap, masking before persistence, idempotency |
| Retention | execution/artifact 30 days; audit 12 months |

Admission copies already encrypted bytes and their original nonce/tag/key ID plus canonical approved CIDRs/hash/approval reference from the locked Environment revision into D1; no plaintext or key handle enters P1. Missing policy rejects admission, and a revision race rolls back. At execution time, the pinned key ID flows Secret Manager → worker memory and the decrypted credential flows only after Gateway DNS/connect/redirect validation against the pinned set; neither returns to browser or telemetry. Provider response flows gateway → masking/truncation → D1; P3 reads the authorized masked projection and returns it to the UI.

#### FLOW-002.4 Data Flows

| Arrow ID | From → To | Label / classification |
|---|---|---|
| `q-e1` | QA User → P1 Admit + Snapshot | `Run + Idempotency-Key` / Internal |
| `q-e2` | P1 → D1 Execution Store | `Durable execution/job + byte-copied ciphertext/nonce/tag/key ID snapshot` / Confidential |
| `q-e3` | D1 → P2 Worker + Masking Gateway | `Lease + encrypted snapshot` / Restricted |
| `q-e4` | P2 → Target API Provider | `Host-bound HTTPS; credential in memory` / Restricted |
| `q-e5` | P2 Worker + Masking Gateway → D1 | `Masked attempt + evidence` / Confidential |
| `q-e6` | QA User → P3 Execution Query API | `1s poll + execution ID/ETag` / Internal |
| `q-e7` | D1 → P3 Execution Query API | `Authorized masked projection` / Confidential |
| `q-e8` | P3 Execution Query API → QA User | `Masked status/evidence + ETag` / Internal/Confidential |
| `q-e9` | P2 Worker + Masking Gateway → Secret Manager | `Pinned key ID` / Restricted identifier |
| `q-e10` | Secret Manager → P2 Worker + Masking Gateway | `Key handle` / Restricted; worker memory only |

#### FLOW-002.5 Draw.io/XML Source

- **Page:** `QA-Execution` in `assets/api-lab-data-flow.drawio`.
- **Trace:** FR-005/008/009/010/012, API-012–016, NFR-003/004/006/007.
- **Notation check:** polling and evidence cross P3/P2 processes; no data store connects directly to an actor.

<!-- ID: FLOW-003 -->
### FLOW-003: Operator Dependency Recovery Flow

#### FLOW-003.1 External Actors / Systems

| Actor / system | Boundary | Role |
|---|---|---|
| System Operator | External authenticated/MFA actor | Confirms destructive action and performs recovery checklist |

#### FLOW-003.2 Processes

| Process | Responsibility | Owner | References |
|---|---|---|---|
| P1 Dependency Impact Scan | Read Catalog/Workspace target revision and query Workflow-owned dependency projection through `WorkflowImpactService`; issue bound impact token | Catalog or Workspace orchestrator + Workflow query port | FR-011, API-004/021 |
| P2 Confirmed Lifecycle Mutation | Validate impact/revision, run Execution-owned `IdempotencyCoordinator`, mutate Host or API lifecycle and disable exact dependent Workflows in one `UnitOfWork` | Catalog or Workspace + Execution idempotency + Workflow disable port | FR-011, API-005/007/022 |
| P3 Undo/Review/Validate/Enable | Restore API identity within 10 seconds, review dependencies, validate and explicitly enable | Workspace + Workflow | FR-007/011, API-006/010/011 |

#### FLOW-003.3 Data Stores

| Store | Stored data | Source of truth? | Owner / consistency |
|---|---|---|---|
| D1 Host/API Lifecycle + Idempotency + Audit | Host state/revision, API tombstone/deadline, impact token binding, bounded original mutation response and audit | Yes | Catalog/Workspace own lifecycle rows; Execution owns ENT-015; Audit owns ENT-019; one shared ACID `UnitOfWork` |
| D2 Workflow Dependency + Recovery | Host/API dependency projection, Workflow DISABLED state, recovery revision and validation report | Yes | Workflow Definition owns dependency/recovery rows and exposes query/disable ports |

| Element | Detail |
|---|---|
| Actor | Authenticated System operator |
| Processes | Host/API impact scan, confirmed Host/API lifecycle mutation, workflow disable, 10-second API undo, review/validate/enable |
| Stores | Host/API state and revision, idempotency response, Workflow dependency/recovery, validation report, audit |
| Sensitive data | no credential required; object names and dependency metadata are Internal |
| Controls | named-object confirmation, idempotency, server clock, atomic state transition, current report hash |
| Retention | API tombstone ≥30 days; audit 12 months |

Undo restores the API identity at the prior tree location but deliberately does not restore READY. Enable requires a current review session and zero-error validation report; warnings require explicit acknowledgement.

#### FLOW-003.4 Data Flows

| Arrow ID | From → To | Label / classification |
|---|---|---|
| `o-e1` | System Operator → P1 Dependency Impact Scan | `Target type + ID + proposed status/method + revision` / Internal |
| `o-e2` | D1 Host/API Lifecycle → P1 | `Current Host/API state + revision` / Internal |
| `o-e3q` | P1 → D2 Workflow Dependency | `Host/API dependency query` / Internal |
| `o-e3r` | D2 Workflow Dependency → P1 | `Exact affected Workflow IDs/names/step keys/reasons` / Internal |
| `o-e4` | P1 → System Operator | `Impact token + named affected workflows` / Internal |
| `o-e5` | System Operator → P2 Confirmed Lifecycle Mutation | `Confirmed target/count + impact token + Idempotency-Key` / Internal |
| `o-e6` | P2 → D1 Host/API Lifecycle + Idempotency + Audit | `Atomic Host/API transition + original response + audit` / Internal |
| `o-e7` | P2 → D2 Workflow Dependency + Recovery | `Disable exact affected Workflows + recovery revision` / Internal |
| `o-e8a` | D1 Host/API Lifecycle + Idempotency + Audit → P3 Undo/Review/Validate/Enable | `API tombstone + Undo deadline` / Internal |
| `o-e8b` | D2 Workflow Dependency + Recovery → P3 Undo/Review/Validate/Enable | `Current recovery + validation report` / Internal |
| `o-e9` | P3 → System Operator | `Restored API or validated READY result` / Internal |

For a Host `INACTIVE|DELETED` transition, P2 updates the Catalog-owned Host revision and Workflow-owned dependent states. Already admitted Executions are absent from this flow because they continue from immutable snapshots; future admission reads the new Host state and fails closed when inactive. For API delete, P2 also records the server-authoritative 10-second Undo deadline consumed by P3.

#### FLOW-003.5 Draw.io/XML Source

- **Page:** `Operator-Recovery` in `assets/api-lab-data-flow.drawio`.
- **Trace:** FR-007/011, API-004–007/010/011/021/022, NFR-006/007.
- **Notation check:** actor communicates only through P1/P2/P3; store edges are process-bound.

## Updated

## Removed

### Self-Review Checklist

- [x] FLOW-001 owns the package-wide notation, inventory, ownership, failure and retention contract inside its valid routed anchor.
- [x] Meaningful flows are split when user groups materially differ.
- [x] Every flow includes actors, processes, stores, classification, controls and retention.
- [x] Credential and provider-response paths explicitly show masking/encryption boundaries.
