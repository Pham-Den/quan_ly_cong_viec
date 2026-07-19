---
status: DRAFT
version: v1
sprint: 1
phase: architecture
sprint_id: sprint-v1
created: 2026-07-18
updated: 2026-07-19 09:35
approved_by:
applied_to_living: false
---

# API Specifications Proposal — Sprint v1

**Architecture package references:** entrypoint `architecture-v1.md` (`ARCH-OVERVIEW-001`); companion set `adr-v1.md`, `api-specs-v1.md`, `data-flow-v1.md`, `erd-v1.md`, `events-v1.md`, `nfr-v1.md`, `project-reference-v1.md`, `sequence-v1.md`.

## New

<!-- ID: API-001 -->
### API-001: `GET /api/v1/hosts/{hostId}/api-lab`

#### Package-Wide API Contract

Endpoint request/response field tables are local to each API. Error responses are normative through §4 **Per-Endpoint Error Response Table**: every API row enumerates each applicable HTTP status and concrete code, while §2 supplies the exact condition and §2.1 supplies message/retry/category metadata. Inline `Errors` summaries are convenience indexes only and cannot add or override a §4 code.

Each endpoint's `Auth`, `Roles`, `Idempotent` and `Rate limit` metadata is normative. An endpoint marked idempotent because it requires `Idempotency-Key` uses the Execution-owned `IdempotencyCoordinator`: actor/route/key/payload lookup, the owning module mutation, bounded masked original response persistence and audit share one caller-supplied MySQL `UnitOfWork`; identical retries replay the stored response, while a different payload returns `IDEMPOTENCY_KEY_REUSED`. Before commit the coordinator serializes the projected response and enforces `IDEMPOTENCY_RESPONSE_MAX_BYTES=65536`; overflow rolls back every domain/audit/idempotency write and returns `422 IDEMPOTENCY_RESPONSE_TOO_LARGE`. Safe reads and naturally/keylessly idempotent operations do not persist ENT-015 records. Rate-limit values map to NFR-004 configuration keys and every 429 includes `Retry-After`.

Every API endpoint inherits the correlation-header contract below. Cloudflare/ingress accepts a client `X-Request-ID` only when it is a single 1–64 character `[A-Za-z0-9_-]+` value; otherwise it discards the untrusted value and generates a UUIDv7. The accepted/generated ID is stable across a client retry only when the client deliberately resends it. OpenTelemetry creates or continues the trace using W3C `traceparent`, replaces any direct untrusted `X-Trace-ID`, and injects the authoritative trace ID. API responses echo `X-Request-ID` and `X-Trace-ID`; every API/worker downstream HTTP call forwards both, including Host-bound provider calls. Durable jobs persist `request_id` and `trace_id` in their envelope/snapshot so worker spans continue the admission trace. Neither header is authorization or idempotency evidence.

| Header | Request behavior | Response/downstream behavior |
|---|---|---|
| `X-Request-ID` | Validate one bounded value or generate UUIDv7 at ingress | Echo on response; forward unchanged to downstream HTTP and durable job |
| `X-Trace-ID` | Ignore direct untrusted value; derive from OTel/W3C trace context | Echo authoritative trace ID; OTel injects it downstream |
| `X-Correlation-ID` | Optional bounded business correlation; never trusted for auth | Forward only after validation/redaction; omit when absent |

#### API-001 Endpoint Contract

| Attribute | Value |
|---|---|
| Auth | Required |
| Roles | Authenticated user; Host/resource ABAC |
| Idempotent | Yes |
| Rate limit | 120 requests/minute per actor/route; burst 20 |

| Request field | In | Type | Required | Default | Validation | Example |
|---|---|---|---|---|---|---|
| `hostId` | path | UUID | yes | — | logical Host | `a3f...` |
| `environment` | query | string | no | Host default | existing binding key | `UAT` |
| `resourceId` | query | UUID | no | null | same workspace | `b42...` |

| Response field | Type | Required | Description | Example |
|---|---|---|---|---|
| `host` | HostContext | yes | logical Host projection | `{"status":"ACTIVE"}` |
| `environments` | array<EnvironmentContext> | yes | all authorized bindings for list/read navigation; empty when none | `[{"key":"UAT","missingRequired":0}]` |
| `environment` | EnvironmentContext|null | yes | selected binding completeness; no secret | `{"key":"UAT","missingRequired":0}` |
| `workspace` | WorkspaceSummary | yes | Workspace identity and counts | `{"resourceCount":12}` |
| `selectedResource` | ResourceNode|null | yes | selected resource projection | `null` |

**Success:** HTTP `200 OK`; body is the complete authorized context projection above.

**Errors:** `400 INVALID_REQUEST` malformed ID/query; `401 AUTH_REQUIRED`; `403 ACCESS_DENIED`; `404 HOST_OR_RESOURCE_NOT_FOUND`; `409 HOST_CONTEXT_CONFLICT`; `422 INVALID_QUERY_COMBINATION`; `429 RATE_LIMIT_EXCEEDED`; `500 INTERNAL_ERROR`.

<!-- ID: API-002 -->
### API-002: `PUT /api/v1/hosts/{hostId}/api-lab/environments/{environmentKey}`

| Attribute | Value |
|---|---|
| Auth | Required |
| Roles | Authenticated user; Host/resource ABAC |
| Idempotent | Yes — `Idempotency-Key`, actor/route/payload scoped for 24 h |
| Rate limit | 120 requests/minute per actor/route; burst 20 |

Creates or atomically replaces one Environment binding and the supplied Host-wide variable schema/value projection. A missing binding is created with `If-None-Match: *`; an existing binding is updated with `If-Match`. Supplying neither precondition, both preconditions, or the wrong precondition returns a typed conflict. Schema removal is rejected while other bindings still depend on the key unless values are migrated in the same command.

| Request field | In | Type | Required | Default | Validation | Example |
|---|---|---|---|---|---|---|
| `hostId` | path | UUID | yes | — | existing logical Host | `a3f...` |
| `environmentKey` | path | string | yes | — | binding key, 1–64; unique within Host | `UAT` |
| `Idempotency-Key` | header | string | yes | — | actor/route scoped; max 128 | `env-7` |
| `If-Match` | header | integer ETag | conditional | — | required only when replacing an existing binding | `7` |
| `If-None-Match` | header | literal `*` | conditional | — | required only when creating a missing binding | `*` |
| `X-CSRF-Token` | header | string | yes | — | session-bound | `csrf...` |
| `baseUrl` | body | HTTPS URL | yes | — | no userinfo/fragment; allowlistable | `https://uat.example` |
| `approvedTargetCidrs` | body | array<CIDR> | yes | — | 1–64 canonical IPv4/IPv6 CIDRs; no duplicates; every resolved/redirect target must remain inside the set | `["203.0.113.0/24"]` |
| `addressSetApprovalRef` | body | string | yes | — | 1–191 reference that must exist in the signed read-only Approved Address Set manifest and match the canonical CIDR hash | `SEC-NET-2026-014` |
| `variableSchema` | body | array<VariableSchemaItem> | yes | `[]` | Host-wide unique keys | `[... ]` |
| `values` | body | array<EnvironmentValueItem> | yes | `[]` | exactly one per supplied key | `[... ]` |
| `credential` | body | string/null | conditional | keep existing | write-only replacement | `Bearer ...` |

`VariableSchemaItem`, `EnvironmentValueItem` and `EnvironmentValueProjection` are defined field-by-field in §3; sensitive request values remain write-only.

| Response field | Type | Required | Description | Example |
|---|---|---|---|---|
| `environmentKey` | string | yes | saved binding | `UAT` |
| `revision` | integer | yes | new Environment binding revision | `8` |
| `schemaRevision` | integer | yes | new Host-wide schema revision | `3` |
| `variableSchema` | array<VariableSchemaItem> | yes | common Host schema | `[... ]` |
| `values` | array<EnvironmentValueProjection> | yes | masked when sensitive | `[{"key":"token","masked":true}]` |
| `credentialMasked` | boolean | yes | credential exists, never value | `true` |
| `approvedTargetCidrs` | array<CIDR> | yes | current authorized address set; never inferred from DNS | `["203.0.113.0/24"]` |
| `addressSetHash` | SHA-256 | yes | canonical set hash pinned to this binding revision | `abc...` |
| `addressSetApprovalRef` | string | yes | immutable approval evidence reference | `SEC-NET-2026-014` |
| `addressSetRecordedBy` | string | yes | authenticated requester recorded by server; approval authority remains the signed manifest | `user-17` |
| `addressSetRecordedAt` | UTC timestamp | yes | server commit time of this verified address-set revision | `2026-07-19T02:25:00Z` |
| `addressSetManifestVersion` | string | yes | verified signed manifest version returned by registry | `2026-07-19.3` |

**Success:** HTTP `201 Created` for a new binding or `200 OK` for replacement; body is the committed masked Environment projection and new revisions above. Before any key lookup or write, `ApprovedAddressSetRegistry` verifies the signed IaC-generated manifest signature/version and requires the supplied approval ref, Host/Environment identity and canonical CIDR hash to match one Security + Host-owner reviewed record. The server also verifies `baseUrl` DNS results are inside the set, then commits binding/revision/verified approval reference plus the authenticated requesting actor/timestamp and audit fact atomically. Any address-set change requires a new manifest record and increments the same binding revision; key lookup/encryption completes before that short transaction.

**Errors:** `400 INVALID_REQUEST`; `401 AUTH_REQUIRED`; `403 CSRF_INVALID|ACCESS_DENIED`; `404 HOST_NOT_FOUND`; `409 REVISION_CONFLICT|ENVIRONMENT_PRECONDITION_FAILED|SCHEMA_IN_USE|IDEMPOTENCY_KEY_REUSED`; `422 INVALID_URL|INVALID_TARGET_CIDR_SET|INVALID_VARIABLE_SCHEMA|MISSING_REQUIRED_VALUE|IDEMPOTENCY_RESPONSE_TOO_LARGE`; `429 RATE_LIMIT_EXCEEDED`; `503 KEY_PROVIDER_UNAVAILABLE|SERVICE_UNAVAILABLE`; `500 INTERNAL_ERROR`.

> Assumption: The 24-hour keyed-mutation replay window and 65,536-byte masked response ceiling are v1 operational bounds for API-002/004–007/009/011–013/016/022; Product confirms idempotent behavior but does not prescribe these storage values.
> Validate: Technical Owner verifies ENT-015 storage/load behavior and replay fidelity in SIT before `approve plan`; Test owns boundary cases at exactly 65,536 and 65,537 bytes.
> Change trigger: Measured retry horizon or masked response size cannot fit these bounds without rejecting a valid Product workflow.

<!-- ID: API-003 -->
### API-003: `GET /api/v1/hosts/{hostId}/api-lab/resources`

| Attribute | Value |
|---|---|
| Auth | Required |
| Roles | Authenticated user; Host/resource ABAC |
| Idempotent | Yes |
| Rate limit | 120 requests/minute per actor/route; burst 20 |

| Request field | In | Type | Required | Default | Validation | Example |
|---|---|---|---|---|---|---|
| `hostId` | path | UUID | yes | — | existing Host | `a3f...` |
| `q` | query | string | no | null | 1–120 | `customer` |
| `type` | query | enum[] | no | all | allowed node types | `API,FOLDER` |
| `sort` | query | enum | no | `rank,sortOrder` | allowlist | `name` |
| `fields` | query | string[] | no | standard set | allowlist | `id,name,path` |
| `cursor` | query | string | no | null | opaque | `eyJpZCI...` |
| `pageSize` | query | integer | no | 100 | 1–200 | `100` |

| Response field | Type | Required | Description | Example |
|---|---|---|---|---|
| `items` | array<ResourceNode> | yes | selected fields; full parent path in search | `[... ]` |
| `nextCursor` | string/null | yes | opaque continuation | `null` |
| `ranking` | enum | yes | `tree|search` | `search` |

**Success:** HTTP `200 OK`; body is one cursor page of the authorized resource projection.

**Errors:** `400 INVALID_REQUEST`; `401 AUTH_REQUIRED`; `403 ACCESS_DENIED`; `404 HOST_OR_WORKSPACE_NOT_FOUND`; `409 WORKSPACE_STATE_CONFLICT`; `422 INVALID_FILTER|INVALID_SORT|INVALID_FIELDS`; `429 RATE_LIMIT_EXCEEDED`; `500 INTERNAL_ERROR`.

> Assumption: API-003 uses cursor pagination with `pageSize=100`, maximum 200, because Product defines the resource tree/search behavior but not its transport page size.
> Validate: Technical Owner verifies tree/search latency and stable cursor ordering with the representative Workspace dataset before `approve plan`.
> Change trigger: A supported Workspace needs more than 200 visible nodes per fetch or cursor ordering cannot preserve tree/search state.

<!-- ID: API-004 -->
### API-004: `POST /api/v1/hosts/{hostId}/api-lab/resource-commands`

| Attribute | Value |
|---|---|
| Auth | Required |
| Roles | Authenticated user; Host/resource ABAC |
| Idempotent | Yes — `Idempotency-Key`, actor/route/payload scoped for 24 h |
| Rate limit | 120 requests/minute per actor/route; burst 20 |

| Request field | In | Type | Required | Default | Validation | Example |
|---|---|---|---|---|---|---|
| `hostId` | path | UUID | yes | — | existing logical Host | `a3f...` |
| `Idempotency-Key` | header | string | yes | — | actor/route scoped; max 128 | `cmd-123` |
| `X-CSRF-Token` | header | string | yes | — | current session-bound token | `csrf...` |
| `command` | body | enum | yes | — | `CREATE|RENAME|MOVE|COPY|DELETE_RESOURCE|PREVIEW_API_DELETE|PREVIEW_API_METHOD_CHANGE` | `MOVE` |
| `resourceId` | body | UUID|null | conditional | null | required for target commands; same Workspace | `b42...` |
| `parentId` | body | UUID|null | conditional | null | valid same-Workspace parent for create/move/copy | `c51...` |
| `name` | body | string|null | conditional | null | trimmed 1–120 for create/rename/copy | `Billing` |
| `type` | body | enum|null | conditional | null | `COLLECTION|FOLDER|API|WORKFLOW` per command | `FOLDER` |
| `revision` | body | integer | conditional | null | mutation target revision | `4` |
| `proposedMethod` | body | HTTP method | conditional | null | method preview only | `POST` |

| Response field | Type | Required | Description | Example |
|---|---|---|---|---|
| `resource` | ResourceNode/null | yes | mutation result | `{...}` |
| `impactToken` | string/null | yes | signed 5-minute token bound to API/revision/change | `impact...` |
| `affectedWorkflows` | array<ImpactItem> | yes | workflowId/name/stepKey/reason | `[... ]` |

**Success:** HTTP `200 OK`; command result and any bound impact preview are returned in the body above. This polymorphic endpoint does not use `201` because create, update, move and preview commands share one response contract.

**Errors:** `400 INVALID_COMMAND`; `401 AUTH_REQUIRED`; `403 CSRF_INVALID|ACCESS_DENIED`; `404 RESOURCE_OR_PARENT_NOT_FOUND`; `409 REVISION_CONFLICT|DUPLICATE_SIBLING|TREE_CYCLE|RESOURCE_NOT_EMPTY|IDEMPOTENCY_KEY_REUSED`; `422 INVALID_NAME|INVALID_TARGET|INVALID_METHOD|IDEMPOTENCY_RESPONSE_TOO_LARGE`; `429 RATE_LIMIT_EXCEEDED`; `500 INTERNAL_ERROR`.

> Assumption: Impact tokens issued by API-004/021 are signed, single-target/revision/change bound and expire after five minutes; Product requires explicit impact confirmation but does not specify token format or lifetime.
> Validate: Security/Technical Owner verifies tamper, replay, expiry and revision-binding tests before `approve plan`.
> Change trigger: The confirmation journey legitimately exceeds five minutes or the deployment uses a different approved anti-TOCTOU mechanism.

<!-- ID: API-005 -->
### API-005: `DELETE /api/v1/hosts/{hostId}/api-lab/apis/{apiId}`

| Attribute | Value |
|---|---|
| Auth | Required |
| Roles | Authenticated user; Host/resource ABAC |
| Idempotent | Yes — `Idempotency-Key`, actor/route/payload scoped for 24 h |
| Rate limit | 120 requests/minute per actor/route; burst 20 |

| Request field | In | Type | Required | Default | Validation | Example |
|---|---|---|---|---|---|---|
| `hostId` | path | UUID | yes | — | existing logical Host | `a3f...` |
| `apiId` | path | UUID | yes | — | API belongs to Host Workspace | `a71...` |
| `If-Match` | header | integer ETag | yes | — | API revision | `5` |
| `Idempotency-Key` | header | string | yes | — | actor/route scoped; max 128 | `del-1` |
| `X-CSRF-Token` | header | string | yes | — | current session-bound token | `csrf...` |
| `impactToken` | body | string | yes | — | same API/revision, unexpired | `impact...` |

| Response field | Type | Required | Description | Example |
|---|---|---|---|---|
| `status` | enum | yes | `DELETED_UNDOABLE` | `DELETED_UNDOABLE` |
| `undoDeadline` | UTC datetime | yes | server now +10 seconds | `2026-07-18T15:00:10Z` |
| `disabledWorkflowIds` | UUID[] | yes | atomically disabled | `["..."]` |

**Success:** HTTP `200 OK`; the body carries the reversible tombstone state and server-authoritative Undo deadline, so `204` is not used.

**Errors:** `400 INVALID_REQUEST`; `401 AUTH_REQUIRED`; `403 CSRF_INVALID|ACCESS_DENIED`; `404 API_NOT_FOUND`; `409 REVISION_CONFLICT|IMPACT_TOKEN_INVALID|API_STATE_CONFLICT|IDEMPOTENCY_KEY_REUSED`; `422 API_NOT_DELETABLE|IDEMPOTENCY_RESPONSE_TOO_LARGE`; `429 RATE_LIMIT_EXCEEDED`; `500 DELETE_TRANSACTION_FAILED`.

<!-- ID: API-006 -->
### API-006: `POST /api/v1/hosts/{hostId}/api-lab/apis/{apiId}/undo-deletion`

| Attribute | Value |
|---|---|
| Auth | Required |
| Roles | Authenticated user; Host/resource ABAC |
| Idempotent | Yes — `Idempotency-Key`, actor/route/payload scoped for 24 h |
| Rate limit | 120 requests/minute per actor/route; burst 20 |

| Request field | In | Type | Required | Default | Validation | Example |
|---|---|---|---|---|---|---|
| `hostId` | path | UUID | yes | — | existing logical Host | `a3f...` |
| `apiId` | path | UUID | yes | — | deleted API identity belongs to Host | `a71...` |
| `Idempotency-Key` | header | string | yes | — | actor/route scoped; max 128 | `undo-1` |
| `X-CSRF-Token` | header | string | yes | — | current session-bound token | `csrf...` |
| `deletionRevision` | body | integer | yes | — | deletion result revision | `6` |

| Response field | Type | Required | Description | Example |
|---|---|---|---|---|
| `api` | ApiProjection | yes | same ID/config/current version/tree location | `{...}` |
| `recoveryRequired` | boolean | yes | workflows remain disabled | `true` |
| `disabledWorkflowIds` | UUID[] | yes | recovery list | `["..."]` |

**Success:** HTTP `200 OK`; body is the restored API projection plus the still-required Workflow recovery list.

**Errors:** `400 INVALID_REQUEST`; `401 AUTH_REQUIRED`; `403 CSRF_INVALID|ACCESS_DENIED`; `404 API_TOMBSTONE_NOT_FOUND`; `409 API_UNDO_WINDOW_EXPIRED|API_STATE_CONFLICT|REVISION_CONFLICT|IDEMPOTENCY_KEY_REUSED`; `422 RESTORE_COLLISION|IDEMPOTENCY_RESPONSE_TOO_LARGE`; `429 RATE_LIMIT_EXCEEDED`; `500 API_UNDO_FAILED`—transaction rolls back restore, then a recovery transaction advances `DELETED_UNDOABLE→DELETED` and audits failure; if that recovery transaction fails, critical alert fires and API remains hidden/fail-closed.

<!-- ID: API-007 -->
### API-007: `PUT /api/v1/hosts/{hostId}/api-lab/apis/{apiId}`

| Attribute | Value |
|---|---|
| Auth | Required |
| Roles | Authenticated user; Host/resource ABAC |
| Idempotent | Yes — `Idempotency-Key`, actor/route/payload scoped for 24 h |
| Rate limit | 120 requests/minute per actor/route; burst 20 |

| Request field | In | Type | Required | Default | Validation | Example |
|---|---|---|---|---|---|---|
| `hostId` | path | UUID | yes | — | existing logical Host | `a3f...` |
| `apiId` | path | UUID | yes | — | API belongs to Host Workspace | `a71...` |
| `Idempotency-Key` | header | string | yes | — | actor/route scoped; max 128 | `api-save-7` |
| `If-Match` | header | integer ETag | yes | — | loaded API revision | `6` |
| `X-CSRF-Token` | header | string | yes | — | current session-bound token | `csrf...` |
| `method` | body | HTTP method | yes | — | configured allowlist | `POST` |
| `path` | body | string | yes | — | relative path starts `/`; no absolute URL | `/orders` |
| `query` | body | array<KeyValueRow> | yes | `[]` | enabled keys unique/nonblank | `[]` |
| `headers` | body | array<KeyValueRow> | yes | `[]` | enabled keys unique/nonblank; protected headers forbidden | `[]` |
| `body` | body | RequestBody | yes | `{type:"none"}` | JSON parses when type JSON | `{...}` |
| `timeoutSeconds` | body | integer/null | no | null→Host 30 | 1–300 | `60` |
| `sensitivePaths` | body | string[] | yes | `[]` | unique valid paths | `response.token` |
| `impactToken` | body | string/null | conditional | null | required when method differs; from API-004 | `impact...` |

| Response field | Type | Required | Description | Example |
|---|---|---|---|---|
| `apiId` | UUID | yes | stable API identity | `a71...` |
| `revision` | integer | yes | new metadata revision | `7` |
| `versionId` | UUID | yes | new immutable API version identity | `v91...` |
| `versionNo` | integer | yes | monotonically increasing version number | `4` |
| `definitionHash` | SHA-256 | yes | canonical version hash | `abc...` |
| `disabledWorkflowIds` | UUID[] | yes | method-change impact, otherwise empty | `[]` |

**Success:** HTTP `200 OK`; body is the updated API identity, revision and immutable version projection.

**Errors:** `400 INVALID_REQUEST`; `401 AUTH_REQUIRED`; `403 CSRF_INVALID|ACCESS_DENIED`; `404 API_OR_HOST_NOT_FOUND`; `409 REVISION_CONFLICT|IMPACT_TOKEN_REQUIRED|IMPACT_TOKEN_INVALID|IDEMPOTENCY_KEY_REUSED`; `422 INVALID_METHOD|INVALID_PATH|INVALID_BODY|INVALID_TIMEOUT|INVALID_SENSITIVE_PATH|IDEMPOTENCY_RESPONSE_TOO_LARGE`; `429 RATE_LIMIT_EXCEEDED`; `500 VERSION_TRANSACTION_FAILED`.

**Canonical sensitive-field mapping:** Product, Design, domain and persistence use `sensitive_fields`; the camelCase HTTP representation is `sensitivePaths`. These names represent one property and must never create independent configuration. Request decoding maps `sensitivePaths → sensitive_fields`; response/OpenAPI serialization maps `sensitive_fields → sensitivePaths`. Validation and masking operate on the canonical domain value after boundary mapping.

<!-- ID: API-008 -->
### API-008: `GET /api/v1/hosts/{hostId}/api-lab/workflows/{workflowId}`

| Attribute | Value |
|---|---|
| Auth | Required |
| Roles | Authenticated user; Host/resource ABAC |
| Idempotent | Yes |
| Rate limit | 120 requests/minute per actor/route; burst 20 |

| Request field | In | Type | Required | Default | Validation | Example |
|---|---|---|---|---|---|---|
| `hostId` | path | UUID | yes | — | existing logical Host | `a3f...` |
| `workflowId` | path | UUID | yes | — | Workflow belongs to Host | `w82...` |
| `versionId` | query | UUID | no | current | belongs to workflow | `...` |

| Response field | Type | Required | Description | Example |
|---|---|---|---|---|
| `workflow` | WorkflowProjection | yes | status/revision/current version | `{...}` |
| `definition` | WorkflowDefinition | yes | variables and ordered steps ≤20 | `{...}` |
| `latestValidation` | LatestValidation|null | yes | counts/report/stale | `null` |

**Success:** HTTP `200 OK`; body is the selected immutable Workflow version and latest validation projection.

**Errors:** `400 INVALID_REQUEST`; `401 AUTH_REQUIRED`; `403 ACCESS_DENIED`; `404 WORKFLOW_OR_VERSION_NOT_FOUND`; `409 WORKFLOW_STATE_CONFLICT`; `422 VERSION_NOT_IN_WORKFLOW`; `429 RATE_LIMIT_EXCEEDED`; `500 INTERNAL_ERROR`.

<!-- ID: API-009 -->
### API-009: `PUT /api/v1/hosts/{hostId}/api-lab/workflows/{workflowId}`

| Attribute | Value |
|---|---|
| Auth | Required |
| Roles | Authenticated user; Host/resource ABAC |
| Idempotent | Yes — `Idempotency-Key`, actor/route/payload scoped for 24 h |
| Rate limit | 120 requests/minute per actor/route; burst 20 |

| Request field | In | Type | Required | Default | Validation | Example |
|---|---|---|---|---|---|---|
| `hostId` | path | UUID | yes | — | existing logical Host | `a3f...` |
| `workflowId` | path | UUID | yes | — | Workflow belongs to Host | `w82...` |
| `Idempotency-Key` | header | string | yes | — | actor/route scoped; max 128 | `workflow-save-4` |
| `If-Match` | header | integer ETag | yes | — | loaded Workflow revision | `4` |
| `X-CSRF-Token` | header | string | yes | — | current session-bound token | `csrf...` |
| `name` | body | string | yes | — | trimmed 1–120 | `Create order` |
| `variables` | body | array<WorkflowVariable> | yes | `[]` | unique key, nonblank value | `[{"key":"orderId","value":"1"}]` |
| `steps` | body | array<WorkflowStep> | yes | `[]` | 0–20, unique immutable stepKey | `[... ]` |

`WorkflowVariable`, `WorkflowStep` and `Mapping` are defined field-by-field in §3. `retryDelaySeconds` is the fixed wait applied before each retry, preserving Product US-008; ADR-005 governs the bounded exception from the general exponential-backoff standard.

| Response field | Type | Required | Description | Example |
|---|---|---|---|---|
| `workflowId` | UUID | yes | stable Workflow identity | `w82...` |
| `revision` | integer | yes | new Workflow revision | `5` |
| `versionId` | UUID | yes | immutable version identity | `v12...` |
| `versionNo` | integer | yes | monotonically increasing version number | `3` |
| `definitionHash` | SHA-256 | yes | canonical definition hash | `abc...` |
| `status` | enum | yes | DRAFT or remains DISABLED | `DRAFT` |

**Success:** HTTP `200 OK`; body is the committed new immutable Workflow version and owning Workflow revision.

**Errors:** `400 INVALID_REQUEST`; `401 AUTH_REQUIRED`; `403 CSRF_INVALID|ACCESS_DENIED`; `404 WORKFLOW_OR_API_VERSION_NOT_FOUND`; `409 WORKFLOW_REVISION_CONFLICT|IDEMPOTENCY_KEY_REUSED`; `422 INVALID_WORKFLOW_NAME|STEP_LIMIT_EXCEEDED|DUPLICATE_STEP_KEY|INVALID_MAPPING|INVALID_RETRY|IDEMPOTENCY_RESPONSE_TOO_LARGE`; `429 RATE_LIMIT_EXCEEDED`; `500 VERSION_TRANSACTION_FAILED`.

<!-- ID: API-010 -->
### API-010: `POST /api/v1/hosts/{hostId}/api-lab/workflows/{workflowId}/versions/{versionId}/validations`

| Attribute | Value |
|---|---|
| Auth | Required |
| Roles | Authenticated user; Host/resource ABAC |
| Idempotent | No — each accepted request persists a new report |
| Rate limit | 120 requests/minute per actor/route; burst 20 |

| Request field | In | Type | Required | Default | Validation | Example |
|---|---|---|---|---|---|---|
| `hostId` | path | UUID | yes | — | existing logical Host | `a3f...` |
| `workflowId` | path | UUID | yes | — | Workflow belongs to Host | `w82...` |
| `versionId` | path | UUID | yes | — | immutable version belongs to Workflow | `v12...` |
| `X-CSRF-Token` | header | string | yes | — | session-bound | `csrf...` |
| `recoveryRevision` | body | integer/null | no | null | required in recovery | `2` |

| Response field | Type | Required | Description | Example |
|---|---|---|---|---|
| `reportId` | UUID | yes | persisted report | `...` |
| `passed` | integer | yes | Passed finding total, non-negative | `12` |
| `warnings` | integer | yes | Warning finding total, non-negative | `1` |
| `errors` | integer | yes | Error finding total, non-negative | `0` |
| `findings` | array<ValidationFinding> | yes | exact actionable list | `[... ]` |
| `readyEligible` | boolean | yes | current version and errors=0 | `true` |

`ValidationFinding` is defined field-by-field in §3. Warning codes are exclusively `MAPPING_SAMPLE_MISSING`, `HOST_TIMEOUT_INHERITED`, `SENSITIVE_PATHS_EMPTY`; every other Product-invalid condition is `ERROR`.

**Success:** HTTP `201 Created`; body is the newly persisted immutable validation report above.

**Errors:** `400 INVALID_REQUEST`; `401 AUTH_REQUIRED`; `403 CSRF_INVALID|ACCESS_DENIED`; `404 WORKFLOW_OR_VERSION_NOT_FOUND`; `409 VERSION_NOT_CURRENT|RECOVERY_REVISION_CONFLICT`; `422 DEFINITION_SCHEMA_INVALID`; `429 RATE_LIMIT_EXCEEDED`; `500 VALIDATION_REPORT_FAILED`.

<!-- ID: API-011 -->
### API-011: `POST /api/v1/hosts/{hostId}/api-lab/workflows/{workflowId}/enable`

| Attribute | Value |
|---|---|
| Auth | Required |
| Roles | Authenticated user; Host/resource ABAC |
| Idempotent | Yes — `Idempotency-Key`, actor/route/payload scoped for 24 h |
| Rate limit | 120 requests/minute per actor/route; burst 20 |

| Request field | In | Type | Required | Default | Validation | Example |
|---|---|---|---|---|---|---|
| `hostId` | path | UUID | yes | — | existing logical Host | `a3f...` |
| `workflowId` | path | UUID | yes | — | Workflow belongs to Host | `w82...` |
| `Idempotency-Key` | header | string | yes | — | actor/route scoped; max 128 | `enable-1` |
| `X-CSRF-Token` | header | string | yes | — | current session-bound token | `csrf...` |
| `reviewRevision` | body | integer | yes | — | current recovery session | `2` |
| `validationReportId` | body | UUID | yes | — | current version, 0 errors | `...` |
| `warningAcknowledged` | body | boolean | yes | false | true when warnings>0 | `true` |

| Response field | Type | Required | Description | Example |
|---|---|---|---|---|
| `workflowId` | UUID | yes | enabled Workflow identity | `w82...` |
| `revision` | integer | yes | new Workflow revision | `8` |
| `status` | enum | yes | READY | `READY` |

**Success:** HTTP `200 OK`; body is the explicitly enabled Workflow projection and new revision.

**Errors:** `400 INVALID_REQUEST`; `401 AUTH_REQUIRED`; `403 CSRF_INVALID|ACCESS_DENIED`; `404 WORKFLOW_OR_REPORT_NOT_FOUND`; `409 REVIEW_STALE|REPORT_STALE|VALIDATION_ERRORS_EXIST|WARNING_ACK_REQUIRED|IDEMPOTENCY_KEY_REUSED`; `422 INVALID_LIFECYCLE_TRANSITION|IDEMPOTENCY_RESPONSE_TOO_LARGE`; `429 RATE_LIMIT_EXCEEDED`; `500 ENABLE_TRANSACTION_FAILED`.

<!-- ID: API-012 -->
### API-012: `POST /api/v1/hosts/{hostId}/api-lab/api-runs`

| Attribute | Value |
|---|---|
| Auth | Required |
| Roles | Authenticated user; Host/resource ABAC |
| Idempotent | Yes — `Idempotency-Key`, actor/route/payload scoped for 24 h |
| Rate limit | 120 requests/minute per actor/route; burst 20 |

| Request field | In | Type | Required | Default | Validation | Example |
|---|---|---|---|---|---|---|
| `hostId` | path | UUID | yes | — | existing logical Host | `a3f...` |
| `Idempotency-Key` | header | string | yes | — | actor/route scoped; max 128 | `run-api-1` |
| `X-CSRF-Token` | header | string | yes | — | current session-bound token | `csrf...` |
| `apiId` | body | UUID | yes | — | active API in Host | `a71...` |
| `apiVersionId` | body | UUID | yes | — | saved version belongs to API and is current | `v91...` |
| `environmentKey` | body | string | yes | — | complete binding; revision pinned atomically | `UAT` |

Standalone execution is one implicit API Step. Product permits retry count 0–5, while approved Design exposes retry editing only on a Workflow Step; therefore Architecture selects the lower bound `retryCount=0` (`maxAttempts=1`) for standalone runs without adding a new UI/API control. API-012 accepts no retry override; `retryDelaySeconds=1` remains the domain default but is unused. A user-initiated `Chạy lại` creates a new Execution rather than an automatic retry. Workflow runs continue to use each saved Step's `retryCount` 0–5.

| Response field | Type | Required | Description | Example |
|---|---|---|---|---|
| `executionId` | UUID | yes | durable accepted execution | `...` |
| `status` | enum | yes | PENDING | `PENDING` |
| `pollUrl` | URI | yes | API-014 | `/api/v1/...` |

**Success:** HTTP `202 Accepted`; admission, pinned snapshot, initial job and idempotency response are durable before this body is returned.

**Errors:** `400 INVALID_REQUEST`; `401 AUTH_REQUIRED`; `403 CSRF_INVALID|ACCESS_DENIED`; `404 API_VERSION_OR_BINDING_NOT_FOUND`; `409 HOST_INACTIVE|API_NOT_ACTIVE|ENVIRONMENT_INCOMPLETE|ENVIRONMENT_REVISION_CONFLICT|IDEMPOTENCY_KEY_REUSED`; `422 API_DEFINITION_INVALID|IDEMPOTENCY_RESPONSE_TOO_LARGE`; `429 RATE_LIMIT_EXCEEDED`; `503 SERVICE_UNAVAILABLE` for pre-admission IAM uncertainty only; `500 ADMISSION_TRANSACTION_FAILED`.

<!-- ID: API-013 -->
### API-013: `POST /api/v1/hosts/{hostId}/api-lab/workflow-runs`

| Attribute | Value |
|---|---|
| Auth | Required |
| Roles | Authenticated user; Host/resource ABAC |
| Idempotent | Yes — `Idempotency-Key`, actor/route/payload scoped for 24 h |
| Rate limit | 120 requests/minute per actor/route; burst 20 |

| Request field | In | Type | Required | Default | Validation | Example |
|---|---|---|---|---|---|---|
| `hostId` | path | UUID | yes | — | existing logical Host | `a3f...` |
| `Idempotency-Key` | header | string | yes | — | actor/route scoped; max 128 | `run-wf-1` |
| `X-CSRF-Token` | header | string | yes | — | current session-bound token | `csrf...` |
| `workflowId` | body | UUID | yes | — | current READY Workflow | `w82...` |
| `versionId` | body | UUID | yes | — | current saved version | `v12...` |
| `validationReportId` | body | UUID | yes | — | non-stale report for version with 0 errors | `r64...` |
| `environmentKey` | body | string | yes | — | complete binding; revision pinned atomically | `UAT` |
| `warningAcknowledged` | body | boolean | yes | false | true when warnings>0 | `true` |

| Response field | Type | Required | Description | Example |
|---|---|---|---|---|
| `executionId` | UUID | yes | new durable execution identity | `e73...` |
| `pollUrl` | relative URI | yes | API-014 status URL | `/api/v1/...` |
| `status` | enum | yes | PENDING | `PENDING` |
| `activeWorkflowCount` | integer | yes | 1–20 after admission | `20` |

**Success:** HTTP `202 Accepted`; admission, pinned Workflow/Environment snapshots, initial job, active-count increment and idempotency response are durable before this body is returned.

**Errors:** `400 INVALID_REQUEST`; `401 AUTH_REQUIRED`; `403 CSRF_INVALID|ACCESS_DENIED`; `404 WORKFLOW_VERSION_REPORT_OR_BINDING_NOT_FOUND`; `409 HOST_INACTIVE|WORKFLOW_NOT_READY|REPORT_STALE|WARNING_ACK_REQUIRED|ENVIRONMENT_REVISION_CONFLICT|IDEMPOTENCY_KEY_REUSED`; `422 SNAPSHOT_INVALID|IDEMPOTENCY_RESPONSE_TOO_LARGE`; `429 WORKFLOW_CAPACITY_REACHED|RATE_LIMIT_EXCEEDED` with `Retry-After`; `503 SERVICE_UNAVAILABLE` for pre-admission IAM uncertainty only; `500 ADMISSION_TRANSACTION_FAILED`.

<!-- ID: API-014 -->
### API-014: `GET /api/v1/hosts/{hostId}/api-lab/executions/{executionId}`

| Attribute | Value |
|---|---|
| Auth | Required |
| Roles | Authenticated user; Host/resource ABAC |
| Idempotent | Yes |
| Rate limit | 60 requests/minute per actor/execution; burst 5 |

| Request field | In | Type | Required | Default | Validation | Example |
|---|---|---|---|---|---|---|
| `hostId` | path | UUID | yes | — | retained logical Host in `ACTIVE|INACTIVE|DELETED`; `DELETED` permits read-only retained evidence | `a3f...` |
| `executionId` | path | UUID | yes | — | Execution belongs to Host | `e73...` |
| `If-None-Match` | header | ETag | no | null | prior projection ETag | `W/"7"` |
| `include` | query | enum[] | no | `steps` | `steps|attempts|artifacts` | `steps,attempts` |

**Success variants**

| HTTP | Condition | Required response headers | Body |
|---:|---|---|---|
| 200 | `If-None-Match` absent or does not equal the current authorized projection ETag | `ETag: W/"{projectionRevision}"`; `Cache-Control: private, no-cache` | Response fields below |
| 304 | `If-None-Match` exactly equals the current authorized projection ETag after actor/Host authorization | Same current `ETag`; `Cache-Control: private, no-cache` | Empty; no JSON envelope and no execution/artifact fields |

| Response field | Type | Required | Description | Example |
|---|---|---|---|---|
| `execution` | ExecutionSummary | yes | status/version/env/timing | `{...}` |
| `steps` | array<StepEvidence> | conditional | ordered state | `[... ]` |
| `attempts` | array<AttemptEvidence> | conditional | stable attempt ID plus nullable Step identity, attemptNo/status/duration/httpStatus/errorCode/retryable | `[... ]` |
| `artifacts` | array<ArtifactEvidence> | conditional | stable attempt association plus nullable Step identity and masked/truncated body metadata | `[... ]` |
| `etag` | string | yes | state revision | `W/"8"` |

**Errors:** `400 INVALID_REQUEST`; `401 AUTH_REQUIRED`; `403 ACCESS_DENIED`; `404 EXECUTION_NOT_FOUND_OR_EXPIRED`; `409 EXECUTION_PROJECTION_CONFLICT`; `422 INVALID_INCLUDE`; `429 POLL_RATE_LIMIT_EXCEEDED`; `500 INTERNAL_ERROR`.

<!-- ID: API-015 -->
### API-015: `GET /api/v1/hosts/{hostId}/api-lab/executions`

| Attribute | Value |
|---|---|
| Auth | Required |
| Roles | Authenticated user; Host/resource ABAC |
| Idempotent | Yes |
| Rate limit | 120 requests/minute per actor/route; burst 20 |

| Request field | In | Type | Required | Default | Validation | Example |
|---|---|---|---|---|---|---|
| `hostId` | path | UUID | yes | — | retained logical Host in `ACTIVE|INACTIVE|DELETED`; `DELETED` permits read-only retained history | `a3f...` |
| `dateFrom` | query | UTC date | no | now minus 30 days | not after `dateTo` | `2026-07-01` |
| `dateTo` | query | UTC date | no | now | on/after `dateFrom`; range ≤30 days | `2026-07-18` |
| `status` | query | enum[] | no | all | execution status allowlist | `FAILED` |
| `environment` | query | string | no | all | existing Host binding key | `UAT` |
| `workflow` | query | UUID | no | all | Workflow belongs to Host | `w82...` |
| `sort` | query | enum | no | `-createdAt` | `±createdAt|±duration` | `-createdAt` |
| `fields` | query | string[] | no | summary set | allowlist | `id,status,duration` |
| `page` | query | integer | no | 1 | ≥1 | `1` |
| `pageSize` | query | integer | no | 50 | 1–50 | `50` |

| Response field | Type | Required | Description | Example |
|---|---|---|---|---|
| `items` | array<ExecutionSummary> | yes | masked selected fields | `[... ]` |
| `page` | integer | yes | current server page | `1` |
| `pageSize` | integer | yes | rows requested/returned per page | `50` |
| `total` | integer | yes | total matching rows | `81` |
| `pages` | integer | yes | total pages | `2` |

**Success:** HTTP `200 OK`; body is one authorized server-filtered History page.

**Errors:** `400 INVALID_REQUEST`; `401 AUTH_REQUIRED`; `403 ACCESS_DENIED`; `404 HOST_NOT_FOUND`; `409 HISTORY_QUERY_CONFLICT`; `422 INVALID_DATE_RANGE|INVALID_FILTER|INVALID_SORT|INVALID_FIELDS|INVALID_PAGE`; `429 RATE_LIMIT_EXCEEDED`; `500 INTERNAL_ERROR`.

For API-014/015, a soft-deleted logical Host still “exists” until the last retained Execution expires. An actor who retains Host/resource ABAC access may open the deleted Host's read-only System Manager tombstone and follow `/systems/{hostId}/api-lab/history`; the page calls API-015 directly without loading the editable Workspace, and API-014 remains available for detail. The shell displays Host status `DELETED` and exposes only History/Inspector plus navigation back to System Manager—Environment, Resource Tree, editor, Run, rerun and mutation controls are absent. `HOST_NOT_FOUND` applies only when the logical Host row is physically absent/outside retention; unauthorized scope remains `403 ACCESS_DENIED`.

<!-- ID: API-016 -->
### API-016: `POST /api/v1/hosts/{hostId}/api-lab/executions/{executionId}/reruns`

| Attribute | Value |
|---|---|
| Auth | Required |
| Roles | Authenticated user; Host/resource ABAC |
| Idempotent | Yes — `Idempotency-Key`, actor/route/payload scoped for 24 h |
| Rate limit | 120 requests/minute per actor/route; burst 20 |

| Request field | In | Type | Required | Default | Validation | Example |
|---|---|---|---|---|---|---|
| `hostId` | path | UUID | yes | — | existing logical Host | `a3f...` |
| `executionId` | path | UUID | yes | — | source Execution belongs to Host | `e73...` |
| `Idempotency-Key` | header | string | yes | — | actor/route scoped; max 128 | `rerun-1` |
| `X-CSRF-Token` | header | string | yes | — | current session-bound token | `csrf...` |
| `latestVersionId` | body | UUID | yes | — | explicit current API/Workflow version confirmation | `v12...` |
| `environmentKey` | body | string | yes | — | explicit current complete binding confirmation | `UAT` |
| `validationReportId` | body | UUID/null | conditional | null | workflow only | `...` |
| `warningAcknowledged` | body | boolean | conditional | false | workflow warnings | `true` |

| Response field | Type | Required | Description | Example |
|---|---|---|---|---|
| `executionId` | UUID | yes | new Execution identity | `e74...` |
| `sourceExecutionId` | UUID | yes | immutable source Execution link | `e73...` |
| `status` | enum | yes | always `PENDING` on acceptance | `PENDING` |
| `pollUrl` | relative URI | yes | API-014 status URL | `/api/v1/...` |

**Success:** HTTP `202 Accepted`; a new Execution and its latest definition/Environment snapshot are durable, while the source Execution remains unchanged.

**Errors:** `400 INVALID_REQUEST`; `401 AUTH_REQUIRED`; `403 CSRF_INVALID|ACCESS_DENIED`; `404 SOURCE_OR_LATEST_DEFINITION_OR_BINDING_NOT_FOUND`; `409 LATEST_STATE_INVALID|WARNING_ACK_REQUIRED|IDEMPOTENCY_KEY_REUSED`; `422 SOURCE_NOT_RERUNNABLE|IDEMPOTENCY_RESPONSE_TOO_LARGE`; `429 WORKFLOW_CAPACITY_REACHED|RATE_LIMIT_EXCEEDED`; `503 SERVICE_UNAVAILABLE` for pre-admission IAM uncertainty only; `500 ADMISSION_TRANSACTION_FAILED`.

<!-- ID: API-017 -->
### API-017: `GET /api/v1/auth/login`

| Attribute | Value |
|---|---|
| Auth | Optional |
| Roles | Public pre-authentication route |
| Idempotent | No — each initiation creates new state/nonce/PKCE material |
| Rate limit | 30 requests/minute per source IP; burst 5 |

| Request field | In | Type | Required | Default | Validation | Example |
|---|---|---|---|---|---|---|
| `returnTo` | query | relative URI | no | `/` | same-origin allowlist | `/systems/1/api-lab` |

| Response field | Type | Required | Description | Example |
|---|---|---|---|---|
| `Location` | header | URI | yes | IAM authorize URI with PKCE/state/nonce | `https://iam/...` |

**Success:** 302. **Errors:** `400 INVALID_RETURN_URL`; `401` N/A initiation; `403 ACCESS_DENIED`; `404` N/A; `409 LOGIN_ALREADY_ACTIVE`; `422 OIDC_CONFIG_INVALID`; `429 RATE_LIMIT_EXCEEDED`; `503 IAM_UNAVAILABLE`.

<!-- ID: API-018 -->
### API-018: `GET /api/v1/auth/callback`

| Attribute | Value |
|---|---|
| Auth | Optional — validates one-time OIDC state |
| Roles | Public pre-authentication route |
| Idempotent | No — callback state is single-use |
| Rate limit | 30 requests/minute per source IP/state; burst 5 |

| Request field | In | Type | Required | Default | Validation | Example |
|---|---|---|---|---|---|---|
| `code` | query | string | yes | — | single-use authorization code | `abc` |
| `state` | query | string | yes | — | session/nonce/PKCE bound and single-use | `xyz` |

| Response field | Type | Required | Description | Example |
|---|---|---|---|---|
| `Set-Cookie` | header | cookie | yes | Secure/HttpOnly/SameSite session, issued only after required MFA `amr`/`acr` assurance is verified | `session=...` |
| `Location` | header | relative URI | yes | validated return URL | `/systems/1/api-lab` |

The callback validates the tenant-required MFA `amr`/`acr` assurance before creating the local session. Missing or insufficient assurance rejects the token as `OIDC_TOKEN_REJECTED`; the safe return URL is retained and the existing unauthenticated sign-in journey restarts. No protected mutation has started, so phase 1 requires no action-resume state.

**Success:** 302. **Errors:** `400 OIDC_CALLBACK_INVALID`; `401 OIDC_TOKEN_REJECTED`; `403 ACCESS_DENIED`; `404 SESSION_STATE_NOT_FOUND`; `409 CALLBACK_REPLAYED`; `422 CLAIM_MAPPING_INVALID`; `429 RATE_LIMIT_EXCEEDED`; `503 IAM_OR_SESSION_STORE_UNAVAILABLE`.

<!-- ID: API-019 -->
### API-019: `POST /api/v1/auth/logout`

| Attribute | Value |
|---|---|
| Auth | Required |
| Roles | Authenticated user; own session only |
| Idempotent | Yes — repeated intent cannot restore or duplicate a session |
| Rate limit | 30 requests/minute per actor/session; burst 5 |

| Request field | In | Type | Required | Default | Validation | Example |
|---|---|---|---|---|---|---|
| `X-CSRF-Token` | header | string | yes | — | session-bound | `csrf...` |
| `allSessions` | body | boolean | no | false | central IAM support required | `false` |

| Response field | Type | Required | Description | Example |
|---|---|---|---|---|
| `loggedOut` | boolean | yes | local session invalidated | `true` |

**Success:** HTTP `200 OK`; body confirms local-session invalidation. Repeated logout intent remains safe but an already absent session follows the catalogued `404` contract.

**Errors:** `400 INVALID_REQUEST`; `401 AUTH_REQUIRED`; `403 CSRF_INVALID`; `404 SESSION_NOT_FOUND`; `409 LOGOUT_IN_PROGRESS`; `422 GLOBAL_LOGOUT_UNSUPPORTED`; `429 RATE_LIMIT_EXCEEDED`; `503 SESSION_STORE_UNAVAILABLE`.

<!-- ID: API-020 -->
### API-020: `GET /api/v1/auth/session`

| Attribute | Value |
|---|---|
| Auth | Required |
| Roles | Authenticated user; own session only |
| Idempotent | Yes |
| Rate limit | 120 requests/minute per actor/route; burst 20 |

| Request field | In | Type | Required | Default | Validation | Example |
|---|---|---|---|---|---|---|
| `If-None-Match` | header | ETag | no | null | prior session projection | `W/"2"` |

**Success variants**

| HTTP | Condition | Required response headers | Body |
|---:|---|---|---|
| 200 | `If-None-Match` absent or does not equal the current authorized session projection ETag | `ETag: W/"{sessionRevision}"`; `Cache-Control: private, no-cache` | Response fields below |
| 304 | `If-None-Match` exactly equals the current session projection ETag after idle/absolute-expiry validation and activity refresh | Same current `ETag`; `Cache-Control: private, no-cache` | Empty; no JSON envelope, actor, CSRF token or session fields |

| Response field | Type | Required | Description | Example |
|---|---|---|---|---|
| `actor` | ActorProjection | yes | minimal actor; no raw token/claims | `{...}` |
| `expiresAt` | UTC datetime | yes | absolute session expiry | `2026-07-18T16:00:00Z` |
| `lastActivityAt` | UTC datetime | yes | server-observed last protected request | `2026-07-18T15:44:00Z` |
| `idleExpiresAt` | UTC datetime | yes | `lastActivityAt + 15 minutes` | `2026-07-18T15:59:00Z` |
| `csrfToken` | string | yes | session-bound mutation token | `csrf...` |

Before any protected endpoint returns data, `requireActor` compares server time with the server-side `lastActivityAt`. Inactivity greater than 15 minutes atomically invalidates the session and returns the existing `401 AUTH_REQUIRED` envelope with `details.reason="IDLE_TIMEOUT"`; no protected payload is returned. The SPA shows MSG-024, preserves only the allowlisted return URL and starts Central-IAM reauthentication. A successful protected request refreshes `lastActivityAt` at most once per minute to avoid write amplification.

**Errors:** `400 INVALID_REQUEST`; `401 AUTH_REQUIRED`; `403 ACCESS_DENIED`; `404 SESSION_NOT_FOUND`; `409 SESSION_STATE_CONFLICT`; `422 SESSION_CLAIMS_INVALID`; `429 RATE_LIMIT_EXCEEDED`; `503 SESSION_STORE_UNAVAILABLE`.

<!-- ID: API-021 -->
### API-021: `POST /api/v1/hosts/{hostId}/lifecycle-impact`

| Attribute | Value |
|---|---|
| Auth | Required |
| Roles | Authenticated user; Host/resource ABAC |
| Idempotent | No — each preview issues a new signed impact token |
| Rate limit | 120 requests/minute per actor/route; burst 20 |

| Request field | In | Type | Required | Default | Validation | Example |
|---|---|---|---|---|---|---|
| `hostId` | path | UUID | yes | — | existing logical Host | `a3f...` |
| `X-CSRF-Token` | header | string | yes | — | session-bound | `csrf...` |
| `proposedStatus` | body | enum | yes | — | `ACTIVE|INACTIVE|DELETED` | `DELETED` |
| `revision` | body | integer | yes | — | Host revision | `5` |

| Response field | Type | Required | Description | Example |
|---|---|---|---|---|
| `impactToken` | string | yes | signed Host/status/revision token | `impact...` |
| `affectedWorkflows` | array<ImpactItem> | yes | exact dependent list | `[... ]` |
| `historyPreserved` | boolean | yes | always true | `true` |

**Success:** HTTP `200 OK`; body is the current-revision impact preview and signed confirmation token; no Host lifecycle mutation has occurred.

**Errors:** `400 INVALID_REQUEST`; `401 AUTH_REQUIRED`; `403 CSRF_INVALID|ACCESS_DENIED`; `404 HOST_NOT_FOUND`; `409 REVISION_CONFLICT`; `422 INVALID_HOST_TRANSITION`; `429 RATE_LIMIT_EXCEEDED`; `500 IMPACT_SCAN_FAILED`.

<!-- ID: API-022 -->
### API-022: `PATCH /api/v1/hosts/{hostId}`

| Attribute | Value |
|---|---|
| Auth | Required |
| Roles | Authenticated user; Host/resource ABAC |
| Idempotent | Yes — `Idempotency-Key`, actor/route/payload scoped for 24 h |
| Rate limit | 120 requests/minute per actor/route; burst 20 |

| Request field | In | Type | Required | Default | Validation | Example |
|---|---|---|---|---|---|---|
| `hostId` | path | UUID | yes | — | existing logical Host | `a3f...` |
| `If-Match` | header | integer ETag | yes | — | loaded Host revision | `5` |
| `Idempotency-Key` | header | string | yes | — | actor/route scoped; max 128 | `host-1` |
| `X-CSRF-Token` | header | string | yes | — | current session-bound token | `csrf...` |
| `status` | body | enum | yes | — | valid transition | `INACTIVE` |
| `impactToken` | body | string | conditional | null | required for destructive/invalidating transition | `impact...` |

| Response field | Type | Required | Description | Example |
|---|---|---|---|---|
| `hostId` | UUID | yes | updated logical Host identity | `a3f...` |
| `revision` | integer | yes | new Host revision | `6` |
| `status` | enum | yes | updated `ACTIVE|INACTIVE|DELETED` state | `INACTIVE` |
| `disabledWorkflowIds` | UUID[] | yes | atomically disabled | `[... ]` |

**Success:** HTTP `200 OK`; body is the committed Host lifecycle projection and exact dependent Workflow set disabled in the same transaction.

**Errors:** `400 INVALID_REQUEST`; `401 AUTH_REQUIRED`; `403 CSRF_INVALID|ACCESS_DENIED`; `404 HOST_NOT_FOUND`; `409 REVISION_CONFLICT|IMPACT_TOKEN_REQUIRED|IMPACT_TOKEN_INVALID|IDEMPOTENCY_KEY_REUSED`; `422 INVALID_HOST_TRANSITION|IDEMPOTENCY_RESPONSE_TOO_LARGE`; `429 RATE_LIMIT_EXCEEDED`; `500 HOST_TRANSITION_FAILED`.

An accepted `INACTIVE|DELETED` transition disables dependent Workflow definitions but never mutates an already admitted Execution. Active executions continue against their pinned Host/API/Environment snapshots; only new admissions observe the new Host state and are rejected by API-012/013 when inactive.

<!-- ID: API-023 -->
### API-023: `DELETE /api/v1/hosts/{hostId}/api-lab/environments/{environmentKey}`

| Attribute | Value |
|---|---|
| Auth | Required |
| Roles | Authenticated user; Host/resource ABAC |
| Idempotent | Yes — `Idempotency-Key`, actor/route/payload scoped for 24 h |
| Rate limit | 120 requests/minute per actor/route; burst 20 |

| Request field | In | Type | Required | Default | Validation | Example |
|---|---|---|---|---|---|---|
| `hostId` | path | UUID | yes | — | existing logical Host | `a3f...` |
| `environmentKey` | path | string | yes | — | existing binding in Host | `UAT` |
| `If-Match` | header | integer ETag | yes | — | current binding revision | `8` |
| `Idempotency-Key` | header | string | yes | — | actor/route scoped; max 128 | `env-delete-1` |
| `X-CSRF-Token` | header | string | yes | — | current session-bound token | `csrf...` |

| Response field | Type | Required | Description | Example |
|---|---|---|---|---|
| `deletedEnvironmentKey` | string | yes | removed binding key | `UAT` |
| `remainingEnvironmentCount` | integer | yes | may be zero | `0` |
| `schemaRevision` | integer | yes | unchanged Host-wide schema revision | `3` |

**Success:** HTTP `200 OK`; binding values, encrypted credential reference and immutable audit fact are deleted atomically. Deleting the last Environment is allowed and produces the Design `environment-empty` state; the Host-wide variable schema remains so the next API-002 create can supply/migrate values deliberately. Existing Executions retain immutable ENT-020 snapshots, while new runs cannot select the deleted binding.

**Errors:** `400 INVALID_REQUEST`; `401 AUTH_REQUIRED`; `403 CSRF_INVALID|ACCESS_DENIED`; `404 HOST_OR_ENVIRONMENT_NOT_FOUND`; `409 REVISION_CONFLICT|IDEMPOTENCY_KEY_REUSED`; `422 IDEMPOTENCY_RESPONSE_TOO_LARGE`; `429 RATE_LIMIT_EXCEEDED`; `503 SERVICE_UNAVAILABLE`; `500 ENVIRONMENT_DELETE_FAILED`.

#### 1. Standard Error Envelope

```json
{"error":{"code":"WORKFLOW_CAPACITY_REACHED","message":"Đã đạt giới hạn 20 workflow đang chạy.","request_id":"req-uuid","trace_id":"trace-id","details":{"active":20}}}
```

#### 2. Error Code Catalog

| Code | HTTP | Retryable | Condition |
|---|---:|---|---|
| `INVALID_REQUEST` | 400 | after correction | malformed syntax, identifier or body envelope |
| `INVALID_COMMAND` | 400 | after correction | unsupported resource command or missing command discriminator |
| `INVALID_RETURN_URL` | 400 | after correction | login return URL is not same-origin/allowlisted |
| `OIDC_CALLBACK_INVALID` | 400 | no | callback parameters/state are malformed |
| `AUTH_REQUIRED` | 401 | after login | no or expired authenticated session |
| `OIDC_TOKEN_REJECTED` | 401 | after login | IAM token exchange/validation rejected identity |
| `ACCESS_DENIED` | 403 | no | actor cannot access scoped Host/resource |
| `CSRF_INVALID` | 403 | after refresh | missing, expired or mismatched CSRF token |
| `HOST_OR_RESOURCE_NOT_FOUND` | 404 | no | Host or selected resource absent in scope |
| `HOST_OR_ENVIRONMENT_NOT_FOUND` | 404 | no | Host or Environment binding absent |
| `HOST_OR_WORKSPACE_NOT_FOUND` | 404 | no | Host or Workspace absent |
| `RESOURCE_OR_PARENT_NOT_FOUND` | 404 | no | command target or parent absent |
| `API_NOT_FOUND` | 404 | no | API absent in Host Workspace |
| `API_TOMBSTONE_NOT_FOUND` | 404 | no | undoable deletion record absent |
| `API_OR_HOST_NOT_FOUND` | 404 | no | API or owning Host absent |
| `WORKFLOW_OR_VERSION_NOT_FOUND` | 404 | no | Workflow or requested version absent |
| `WORKFLOW_OR_API_VERSION_NOT_FOUND` | 404 | no | Workflow or referenced API version absent |
| `WORKFLOW_OR_REPORT_NOT_FOUND` | 404 | no | Workflow or validation report absent |
| `API_VERSION_OR_BINDING_NOT_FOUND` | 404 | no | API version or Environment binding absent |
| `WORKFLOW_VERSION_REPORT_OR_BINDING_NOT_FOUND` | 404 | no | Workflow version, report or binding absent |
| `EXECUTION_NOT_FOUND_OR_EXPIRED` | 404 | no | Execution absent or outside retention |
| `HOST_NOT_FOUND` | 404 | no | logical Host absent |
| `SOURCE_OR_LATEST_DEFINITION_OR_BINDING_NOT_FOUND` | 404 | no | rerun source/latest definition/binding absent |
| `SESSION_STATE_NOT_FOUND` | 404 | no | OIDC callback session state absent/expired |
| `SESSION_NOT_FOUND` | 404 | no | authenticated session record absent |
| `HOST_CONTEXT_CONFLICT` | 409 | after refresh | selected Host context changed |
| `REVISION_CONFLICT` | 409 | after refresh | optimistic revision is stale |
| `ENVIRONMENT_PRECONDITION_FAILED` | 409 | after refresh | create/update precondition does not match Environment existence |
| `SCHEMA_IN_USE` | 409 | after correction | schema key removal would orphan Environment values |
| `WORKSPACE_STATE_CONFLICT` | 409 | after refresh | Workspace state changed during query/mutation |
| `DUPLICATE_SIBLING` | 409 | after correction | sibling name already exists |
| `TREE_CYCLE` | 409 | after correction | move would create an ancestry cycle |
| `RESOURCE_NOT_EMPTY` | 409 | after correction | non-empty resource cannot be removed by command |
| `IMPACT_TOKEN_INVALID` | 409 | after preview | impact token absent, expired, mismatched or stale |
| `API_STATE_CONFLICT` | 409 | after refresh | API lifecycle state disallows action |
| `API_UNDO_WINDOW_EXPIRED` | 409 | no | server-authoritative 10-second undo deadline elapsed |
| `WORKFLOW_STATE_CONFLICT` | 409 | after refresh | Workflow lifecycle state disallows read/action |
| `WORKFLOW_REVISION_CONFLICT` | 409 | after refresh/copy | Workflow optimistic revision is stale |
| `IDEMPOTENCY_KEY_REUSED` | 409 | with new key/correct payload | same scoped key used with a different payload hash |
| `IDEMPOTENCY_RESPONSE_TOO_LARGE` | 422 | after reducing response-producing input | projected successful response exceeds 65,536 bytes; coordinator rolls back before commit |
| `VERSION_NOT_CURRENT` | 409 | after refresh | validation target is not current saved version |
| `RECOVERY_REVISION_CONFLICT` | 409 | after refresh | recovery session revision is stale |
| `REVIEW_STALE` | 409 | after new review | recovery review no longer matches current definition |
| `REPORT_STALE` | 409 | after validation | report does not match current saved version |
| `VALIDATION_ERRORS_EXIST` | 409 | after correction/validation | current report contains Error findings |
| `WARNING_ACK_REQUIRED` | 409 | after explicit acknowledgement | current report has Warning findings without confirmation |
| `IMPACT_TOKEN_REQUIRED` | 409 | after preview | contract-changing action lacks impact token |
| `HOST_INACTIVE` | 409 | after Host activation | Host lifecycle blocks run |
| `API_NOT_ACTIVE` | 409 | after refresh | API lifecycle blocks run |
| `ENVIRONMENT_INCOMPLETE` | 409 | after configuration | required Environment value is missing |
| `ENVIRONMENT_REVISION_CONFLICT` | 409 | after refresh | admission binding revision changed |
| `WORKFLOW_NOT_READY` | 409 | after validation/enable | Workflow lifecycle blocks run |
| `EXECUTION_PROJECTION_CONFLICT` | 409 | after refresh | requested projection/ETag conflicts with state |
| `HISTORY_QUERY_CONFLICT` | 409 | after correction | filters identify incompatible query scopes |
| `LATEST_STATE_INVALID` | 409 | after correction | latest definition/Environment is not rerunnable |
| `LOGIN_ALREADY_ACTIVE` | 409 | no | login initiation conflicts with active login state |
| `CALLBACK_REPLAYED` | 409 | no | OIDC callback state/code was already consumed |
| `LOGOUT_IN_PROGRESS` | 409 | after completion | logout already executing for session |
| `SESSION_STATE_CONFLICT` | 409 | after refresh/login | session projection changed unexpectedly |
| `INVALID_QUERY_COMBINATION` | 422 | after correction | query parameters are semantically incompatible |
| `INVALID_URL` | 422 | after correction | Environment base URL violates HTTPS/format policy |
| `INVALID_TARGET_CIDR_SET` | 422 | after Security/Host-owner correction | target CIDR set is absent, empty, malformed, duplicated, excludes current base-URL resolution, or its ref/Host/Environment/hash does not match the signed Approved Address Set manifest |
| `INVALID_VARIABLE_SCHEMA` | 422 | after correction | variable schema key/shape/uniqueness invalid |
| `MISSING_REQUIRED_VALUE` | 422 | after correction | required Environment value missing |
| `INVALID_FILTER` | 422 | after correction | filter value/name invalid |
| `INVALID_SORT` | 422 | after correction | sort field/direction not allowlisted |
| `INVALID_FIELDS` | 422 | after correction | field-selection name not allowlisted |
| `INVALID_NAME` | 422 | after correction | resource name invalid |
| `INVALID_TARGET` | 422 | after correction | resource command target type/location invalid |
| `INVALID_METHOD` | 422 | after correction | HTTP method invalid or not allowlisted |
| `API_NOT_DELETABLE` | 422 | after correction | API cannot enter delete transition |
| `RESTORE_COLLISION` | 422 | after correction | original tree location/name cannot be restored safely |
| `INVALID_PATH` | 422 | after correction | API path is not a valid relative path |
| `INVALID_BODY` | 422 | after correction | API request body invalid for selected type |
| `INVALID_TIMEOUT` | 422 | after correction | timeout outside 1–300 seconds |
| `INVALID_SENSITIVE_PATH` | 422 | after correction | sensitive path syntax/uniqueness invalid |
| `VERSION_NOT_IN_WORKFLOW` | 422 | after correction | requested version belongs to another Workflow |
| `INVALID_WORKFLOW_NAME` | 422 | after correction | Workflow name invalid |
| `STEP_LIMIT_EXCEEDED` | 422 | after correction | Workflow has more than 20 Steps |
| `DUPLICATE_STEP_KEY` | 422 | after correction | immutable Step key duplicated |
| `INVALID_MAPPING` | 422 | after correction | mapping namespace/path/direction invalid |
| `INVALID_RETRY` | 422 | after correction | retry count/base delay invalid |
| `DEFINITION_SCHEMA_INVALID` | 422 | after correction | saved definition cannot be validated structurally |
| `INVALID_LIFECYCLE_TRANSITION` | 422 | after correction | requested Workflow transition invalid |
| `API_DEFINITION_INVALID` | 422 | after correction | saved API version cannot execute |
| `SNAPSHOT_INVALID` | 422 | after correction | immutable run snapshot cannot be created |
| `INVALID_INCLUDE` | 422 | after correction | execution expansion not allowlisted |
| `INVALID_DATE_RANGE` | 422 | after correction | history range invalid or exceeds 30 days |
| `INVALID_PAGE` | 422 | after correction | page/pageSize outside contract |
| `SOURCE_NOT_RERUNNABLE` | 422 | after correction | source Execution type/state cannot rerun |
| `OIDC_CONFIG_INVALID` | 422 | after configuration | IAM issuer/client/redirect configuration invalid |
| `CLAIM_MAPPING_INVALID` | 422 | after IAM correction | required identity claim mapping invalid |
| `GLOBAL_LOGOUT_UNSUPPORTED` | 422 | after correction | all-session logout unsupported by IAM |
| `SESSION_CLAIMS_INVALID` | 422 | after login correction | stored actor claims cannot produce session projection |
| `INVALID_HOST_TRANSITION` | 422 | after correction | proposed Host lifecycle transition invalid |
| `RATE_LIMIT_EXCEEDED` | 429 | yes | actor/route request rate exceeded; `Retry-After` required |
| `WORKFLOW_CAPACITY_REACHED` | 429 | yes | 20 Workflow executions already active; `Retry-After` required |
| `POLL_RATE_LIMIT_EXCEEDED` | 429 | yes | execution polling rate exceeded; `Retry-After` required |
| `INTERNAL_ERROR` | 500 | policy-dependent | redacted unexpected internal failure |
| `SERVICE_UNAVAILABLE` | 503 | yes | required dependency, bulkhead or process capacity is transiently unavailable; `Retry-After` required |
| `KEY_PROVIDER_UNAVAILABLE` | 503 | yes | secret-manager key operation unavailable/timed out; `Retry-After` required |
| `DELETE_TRANSACTION_FAILED` | 500 | policy-dependent | API delete/disable transaction failed |
| `API_UNDO_FAILED` | 500 | policy-dependent | restore transaction failed and fail-closed recovery runs |
| `VERSION_TRANSACTION_FAILED` | 500 | policy-dependent | immutable version transaction failed |
| `VALIDATION_REPORT_FAILED` | 500 | policy-dependent | validation report persistence failed |
| `ENABLE_TRANSACTION_FAILED` | 500 | policy-dependent | recovery enable transaction failed |
| `ADMISSION_TRANSACTION_FAILED` | 500 | policy-dependent | execution/idempotency/job admission failed |
| `IAM_UNAVAILABLE` | 503 | yes | IAM login dependency unavailable; `Retry-After` required |
| `IAM_OR_SESSION_STORE_UNAVAILABLE` | 503 | yes | IAM or session store unavailable during callback; `Retry-After` required |
| `SESSION_STORE_UNAVAILABLE` | 503 | yes | server-side session store unavailable; `Retry-After` required |
| `IMPACT_SCAN_FAILED` | 500 | policy-dependent | Host/API dependency scan failed |
| `HOST_TRANSITION_FAILED` | 500 | policy-dependent | Host lifecycle/disable transaction failed |
| `ENVIRONMENT_DELETE_FAILED` | 500 | policy-dependent | Environment binding/value/audit delete transaction failed |

#### 2.1 Error Catalog Metadata Contract

Every §2 row has a complete generated `backend/errors.yml` record even when the compact catalog displays only its core columns:

| Metadata field | Normative derivation |
|---|---|
| `message_key` | `errors.api_lab.<lowercase_code>`; for example `WORKFLOW_CAPACITY_REACHED` → `errors.api_lab.workflow_capacity_reached` |
| `retryable` | The §2 `Retryable` cell is authoritative. `yes` means retry only after the supplied delay; `after ...` means retry only after the stated user/system correction; `no` means never automatically retry. |
| `retry_after_seconds` / header | Required and positive for every 429/503 response; emitted in both catalog metadata and HTTP `Retry-After`. Null for other statuses. |
| `category` | 400/422 → `validation`; 401/403 → `auth`; 404/409 → `business`; 429 → `throttling`; 500/503 → `system`. |

The OpenAPI generator and contract tests fail when a code lacks any of these four metadata fields or when an endpoint/status differs from §4.

#### 3. Shared Field-Level Schemas

| Type.field | Type | Required | Default | Validation / semantics | Example |
|---|---|---|---|---|---|
| `HostContext.id` | UUID | yes | — | logical Host identity | `a3f...` |
| `HostContext.name` | string | yes | — | trimmed 1–120 | `Billing` |
| `HostContext.status` | enum | yes | — | `ACTIVE|INACTIVE|DELETED` | `ACTIVE` |
| `HostContext.revision` | integer | yes | — | optimistic revision, non-negative | `7` |
| `EnvironmentContext.key` | string | yes | — | binding belongs to Host | `UAT` |
| `EnvironmentContext.revision` | integer | yes | — | binding revision, non-negative | `3` |
| `EnvironmentContext.missingRequired` | integer | yes | `0` | non-negative missing-value count | `0` |
| `EnvironmentContext.credentialMasked` | boolean | yes | `false` | reports presence only; never returns credential | `true` |
| `EnvironmentContext.approvedTargetCidrs` | array<CIDR> | yes | — | canonical non-empty binding policy | `["203.0.113.0/24"]` |
| `EnvironmentContext.addressSetHash` | SHA-256 | yes | — | hash of canonical CIDR JSON at this revision | `abc...` |
| `EnvironmentContext.addressSetApprovalRef` | string | yes | — | Security/Host-owner approval evidence reference | `SEC-NET-2026-014` |
| `EnvironmentContext.addressSetRecordedBy` | string | yes | — | immutable server-recorded requester; not approval authority | `user-17` |
| `EnvironmentContext.addressSetRecordedAt` | UTC timestamp | yes | — | verified policy commit time for this revision | `2026-07-19T02:25:00Z` |
| `EnvironmentContext.addressSetManifestVersion` | string | yes | — | verified manifest version pinned to binding revision | `2026-07-19.3` |
| `WorkspaceSummary.id` | UUID | yes | — | Workspace belongs to Host | `d61...` |
| `WorkspaceSummary.resourceCount` | integer | yes | `0` | non-negative | `12` |
| `WorkspaceSummary.workflowCount` | integer | yes | `0` | non-negative | `3` |
| `ResourceNode.id` | UUID | yes | — | stable resource identity | `b42...` |
| `ResourceNode.parentId` | UUID|null | yes | `null` | same Workspace; acyclic parent | `null` |
| `ResourceNode.type` | enum | yes | — | `COLLECTION|FOLDER|API|WORKFLOW` | `API` |
| `ResourceNode.name` | string | yes | — | trimmed 1–120, unique among siblings | `Orders` |
| `ResourceNode.path` | string | yes | — | canonical full parent path | `/Core/Orders` |
| `ResourceNode.revision` | integer | yes | `0` | non-negative | `4` |
| `ResourceNode.sortOrder` | integer | yes | `0` | non-negative sibling order | `10` |
| `ImpactItem.workflowId` | UUID | yes | — | dependency-index hit | `w82...` |
| `ImpactItem.stepKey` | string | yes | — | immutable dependent Step key | `step_get_order` |
| `ImpactItem.workflowName` | string | yes | — | display name | `Sync order` |
| `ImpactItem.reason` | enum | yes | — | `API_DELETE|METHOD_CHANGE|HOST_LIFECYCLE` | `API_DELETE` |
| `VariableSchemaItem.id` | UUID | conditional | server-generated | omitted only for new schema key | `s32...` |
| `VariableSchemaItem.key` | string | yes | — | `[A-Za-z_][A-Za-z0-9_]*`, max 64, Host-wide unique | `token` |
| `VariableSchemaItem.required` | boolean | yes | `false` | required in every Environment when true | `true` |
| `VariableSchemaItem.sensitive` | boolean | yes | `false` | value is write-only/masked when true | `true` |
| `VariableSchemaItem.revision` | integer | conditional | server-generated | required when updating existing schema item | `2` |
| `EnvironmentValueItem.schemaId` | UUID | conditional | — | exactly one of `schemaId` or `key` selects schema item | `s32...` |
| `EnvironmentValueItem.key` | string | conditional | — | exactly one of `schemaId` or `key` selects schema item | `token` |
| `EnvironmentValueItem.value` | string | yes | — | request-only; non-empty when schema item required | `secret` |
| `EnvironmentValueProjection.key` | string | yes | — | schema key | `token` |
| `EnvironmentValueProjection.masked` | boolean | yes | `false` | true for sensitive value | `true` |
| `EnvironmentValueProjection.value` | string|null | yes | `null` when masked | raw sensitive value forbidden | `null` |
| `KeyValueRow.key` | string | yes | — | nonblank and unique among enabled rows in section | `Accept` |
| `KeyValueRow.value` | string | yes | — | expression permitted where Design allows | `application/json` |
| `KeyValueRow.enabled` | boolean | yes | `true` | disabled row is not sent | `true` |
| `RequestBody.type` | enum | yes | `none` | `none|json|text` | `json` |
| `RequestBody.content` | string|null | yes | `null` | valid JSON when type `json`; null when `none` | `{"id":1}` |
| `WorkflowDefinition.variables` | array<WorkflowVariable> | yes | `[]` | variable keys unique | `[]` |
| `WorkflowDefinition.steps` | array<WorkflowStep> | yes | `[]` | ordered 0–20 Steps | `[...]` |
| `WorkflowVariable.key` | string | yes | — | `[A-Za-z_][A-Za-z0-9_]*`, max 64, unique | `orderId` |
| `WorkflowVariable.value` | string | yes | — | saved literal/expression string | `1` |
| `WorkflowStep.stepKey` | string | yes | server-generated on create | immutable, unique within Workflow | `step_create_order` |
| `WorkflowStep.label` | string | yes | — | trimmed 1–120; duplicate labels allowed | `Create order` |
| `WorkflowStep.apiId` | UUID | yes | — | API in same Host Workspace | `a71...` |
| `WorkflowStep.apiVersionId` | UUID | yes | — | immutable version belongs to API | `v91...` |
| `WorkflowStep.mappings` | array<Mapping> | yes | `[]` | unique target fields; only env/workflow/prior-Step sources | `[]` |
| `WorkflowStep.retryCount` | integer | yes | `0` | 0–5 | `2` |
| `WorkflowStep.retryDelaySeconds` | number | yes | `1` | ≥0; fixed delay before each retry; ADR-005 | `1` |
| `Mapping.targetField` | string | yes | — | supported request field path, unique per Step | `body.orderId` |
| `Mapping.expression` | string | yes | — | canonical `${{source.path}}`; source is literal `env`, `workflow`, or a prior immutable `step_key`; no alias, current/forward Step or implicit namespace | `${{step_01.data.customer.id}}` |

Canonical positive examples are `${{env.tenant_id}}`, `${{workflow.order_id}}` and `${{step_01.data.customer.id}}`. Invalid examples include `${{environment.tenant_id}}` (unsupported alias), `${{tenant_id}}` (missing namespace), `${{current_step.value}}` and any current/forward `step_key`. Parser, OpenAPI examples, Variable Browser insertion and validation findings must use the exact `env|workflow|<prior-step_key>` grammar.
| `WorkflowProjection.id` | UUID | yes | — | stable Workflow identity | `w82...` |
| `WorkflowProjection.name` | string | yes | — | trimmed 1–120 | `Create order` |
| `WorkflowProjection.status` | enum | yes | — | `DRAFT|READY|DISABLED` | `READY` |
| `WorkflowProjection.revision` | integer | yes | — | optimistic revision | `5` |
| `WorkflowProjection.currentVersionId` | UUID|null | yes | `null` | belongs to Workflow | `"..."` |
| `LatestValidation.reportId` | UUID | yes | — | persisted report identity | `r64...` |
| `LatestValidation.versionId` | UUID | yes | — | version belongs to same Workflow | `v12...` |
| `LatestValidation.passed` | integer | yes | `0` | non-negative | `12` |
| `LatestValidation.warnings` | integer | yes | `0` | non-negative | `1` |
| `LatestValidation.errors` | integer | yes | `0` | non-negative | `0` |
| `LatestValidation.stale` | boolean | yes | `false` | stale blocks Run/Enable | `false` |
| `ApiProjection.id` | UUID | yes | — | stable API identity | `a71...` |
| `ApiProjection.revision` | integer | yes | — | current metadata revision | `7` |
| `ApiProjection.currentVersionId` | UUID | yes | — | current immutable version | `v91...` |
| `ApiProjection.method` | HTTP method | yes | — | current version method | `POST` |
| `ApiProjection.path` | string | yes | — | relative path starts `/` | `/orders` |
| `ApiProjection.status` | enum | yes | — | `ACTIVE|DELETED_UNDOABLE|DELETED` | `ACTIVE` |
| `ValidationFinding.findingId` | UUID | yes | — | stable finding identity within report | `f22...` |
| `ValidationFinding.code` | string | yes | — | deterministic catalogued validation code | `MAPPING_SAMPLE_MISSING` |
| `ValidationFinding.severity` | enum | yes | — | `PASSED|WARNING|ERROR` | `WARNING` |
| `ValidationFinding.stepKey` | string|null | yes | `null` | immutable Step target when Step-scoped | `step_a` |
| `ValidationFinding.apiId` | UUID|null | yes | `null` | API target when API-scoped | `a71...` |
| `ValidationFinding.fieldPath` | string | yes | — | stable definition field path | `steps[0].mapping` |
| `ValidationFinding.focusTarget` | string | yes | — | stable editor control hook | `mapping-input` |
| `ValidationFinding.messageKey` | string | yes | — | localized message key | `validation.mapping_sample_missing` |
| `ValidationFinding.details` | object | yes | `{}` | non-sensitive structured evidence with documented per-code keys | `{}` |
| `ActorProjection.id` | string | yes | — | stable IAM subject projection | `user-17` |
| `ActorProjection.displayName` | string | yes | — | no raw identity token/claims | `Nguyen QA` |
| `ExecutionSummary.id` | UUID | yes | — | Execution identity | `e73...` |
| `ExecutionSummary.kind` | enum | yes | — | `API|WORKFLOW` | `WORKFLOW` |
| `ExecutionSummary.status` | enum | yes | — | `PENDING|RUNNING|SUCCEEDED|FAILED`; no cancel in v1 | `FAILED` |
| `ExecutionSummary.versionId` | UUID | yes | — | pinned immutable definition version | `v12...` |
| `ExecutionSummary.environmentId` | UUID | yes | — | pinned Environment identity | `n44...` |
| `ExecutionSummary.environmentKey` | string | yes | — | pinned display key | `UAT` |
| `ExecutionSummary.environmentRevision` | integer | yes | — | pinned binding revision | `3` |
| `ExecutionSummary.snapshotAt` | UTC datetime | yes | — | immutable admission snapshot time | `2026-07-18T15:00:00Z` |
| `ExecutionSummary.createdAt` | UTC datetime | yes | — | acceptance time | `2026-07-18T15:00:00Z` |
| `ExecutionSummary.sourceExecutionId` | UUID|null | yes | `null` | set only for rerun | `"..."` |
| `ExecutionSummary.durationMs` | integer|null | yes | `null` while active | non-negative | `1240` |
| `ExecutionSummary.initiatedBy` | string | yes | — | actor ID projection only | `user-17` |
| `StepEvidence.executionStepId` | UUID | yes | — | stable persisted Step-execution identity | `es31...` |
| `StepEvidence.stepKey` | string | yes | — | immutable Step key | `step_a` |
| `StepEvidence.index` | integer | yes | — | ordered 1–20 | `1` |
| `StepEvidence.status` | enum | yes | — | `PENDING|RUNNING|SUCCEEDED|FAILED|NOT_RUN` | `FAILED` |
| `AttemptEvidence.executionAttemptId` | UUID | yes | — | stable ENT-018 identity; artifact join key | `at52...` |
| `AttemptEvidence.executionStepId` | UUID|null | yes | `null` for standalone | must belong to the same Execution | `es31...` |
| `AttemptEvidence.stepKey` | string|null | yes | `null` for standalone | immutable Workflow Step key projection | `step_a` |
| `AttemptEvidence.attemptNo` | integer | yes | — | append-only within the Step; standalone scope starts at 1 | `2` |
| `AttemptEvidence.status` | enum | yes | — | `RUNNING|SUCCEEDED|FAILED` | `FAILED` |
| `AttemptEvidence.durationMs` | integer|null | yes | `null` while running | non-negative | `30100` |
| `AttemptEvidence.httpStatus` | integer|null | yes | `null` | provider status when response exists | `503` |
| `AttemptEvidence.errorCode` | string|null | yes | `null` | typed provider/runtime error | `HTTP_5XX` |
| `AttemptEvidence.retryable` | boolean | yes | `false` | follows SEQ-004 exact list | `true` |
| `ArtifactEvidence.artifactId` | UUID | yes | — | stable ENT-014 identity | `ar83...` |
| `ArtifactEvidence.executionAttemptId` | UUID | yes | — | required ENT-018 FK and API join key | `at52...` |
| `ArtifactEvidence.executionStepId` | UUID|null | yes | `null` for standalone | equals the referenced attempt's Step identity | `es31...` |
| `ArtifactEvidence.stepKey` | string|null | yes | `null` for standalone | immutable Workflow Step key projection | `step_a` |
| `ArtifactEvidence.attemptNo` | integer | yes | — | projection from the referenced attempt, not independent storage | `2` |
| `ArtifactEvidence.type` | enum | yes | — | `REQUEST|RESPONSE|ERROR` | `RESPONSE` |
| `ArtifactEvidence.bodyMasked` | string|null | yes | `null` | never contains raw configured sensitive value | `{"token":"•••"}` |
| `ArtifactEvidence.byteCount` | integer | yes | `0` | original non-negative byte count | `204800` |
| `ArtifactEvidence.truncated` | boolean | yes | `false` | true when original exceeds 200 KiB | `true` |
| `ArtifactEvidence.sha256` | string|null | yes | `null` | digest of original bounded input when retained | `abc...` |

#### 4. Normative Per-Endpoint Error Response Table

This is the required per-endpoint Status/Code/Condition/Details contract in consolidated form. Every cell names the endpoint-specific codes for that status; the exact Condition comes from the corresponding §2 row and Details come from §2.1 plus the endpoint's field/state rules. `N/A` means the status is not applicable. A 503 cell covers transient dependency/bulkhead/process unavailability and always includes `Retry-After`; a 500 cell is limited to unexpected or transaction-internal failure and is never used for ordinary dependency unavailability.

| API | 400 | 401 | 403 | 404 | 409 | 422 | 429 | 500 | 503 |
|---|---|---|---|---|---|---|---|---|---|
| API-001 | INVALID_REQUEST | AUTH_REQUIRED | ACCESS_DENIED | HOST_OR_RESOURCE_NOT_FOUND | HOST_CONTEXT_CONFLICT | INVALID_QUERY_COMBINATION | RATE_LIMIT_EXCEEDED | INTERNAL_ERROR | SERVICE_UNAVAILABLE |
| API-002 | INVALID_REQUEST | AUTH_REQUIRED | CSRF_INVALID/ACCESS_DENIED | HOST_NOT_FOUND | REVISION_CONFLICT/ENVIRONMENT_PRECONDITION_FAILED/SCHEMA_IN_USE/IDEMPOTENCY_KEY_REUSED | INVALID_URL/INVALID_TARGET_CIDR_SET/INVALID_VARIABLE_SCHEMA/MISSING_REQUIRED_VALUE/IDEMPOTENCY_RESPONSE_TOO_LARGE | RATE_LIMIT_EXCEEDED | INTERNAL_ERROR | KEY_PROVIDER_UNAVAILABLE/SERVICE_UNAVAILABLE |
| API-003 | INVALID_REQUEST | AUTH_REQUIRED | ACCESS_DENIED | HOST_OR_WORKSPACE_NOT_FOUND | WORKSPACE_STATE_CONFLICT | INVALID_FILTER/INVALID_SORT/INVALID_FIELDS | RATE_LIMIT_EXCEEDED | INTERNAL_ERROR | SERVICE_UNAVAILABLE |
| API-004 | INVALID_COMMAND | AUTH_REQUIRED | CSRF_INVALID/ACCESS_DENIED | RESOURCE_OR_PARENT_NOT_FOUND | REVISION_CONFLICT/DUPLICATE_SIBLING/TREE_CYCLE/RESOURCE_NOT_EMPTY/IDEMPOTENCY_KEY_REUSED | INVALID_NAME/INVALID_TARGET/INVALID_METHOD/IDEMPOTENCY_RESPONSE_TOO_LARGE | RATE_LIMIT_EXCEEDED | INTERNAL_ERROR | SERVICE_UNAVAILABLE |
| API-005 | INVALID_REQUEST | AUTH_REQUIRED | CSRF_INVALID/ACCESS_DENIED | API_NOT_FOUND | REVISION_CONFLICT/IMPACT_TOKEN_INVALID/API_STATE_CONFLICT/IDEMPOTENCY_KEY_REUSED | API_NOT_DELETABLE/IDEMPOTENCY_RESPONSE_TOO_LARGE | RATE_LIMIT_EXCEEDED | DELETE_TRANSACTION_FAILED | SERVICE_UNAVAILABLE |
| API-006 | INVALID_REQUEST | AUTH_REQUIRED | CSRF_INVALID/ACCESS_DENIED | API_TOMBSTONE_NOT_FOUND | API_UNDO_WINDOW_EXPIRED/API_STATE_CONFLICT/REVISION_CONFLICT/IDEMPOTENCY_KEY_REUSED | RESTORE_COLLISION/IDEMPOTENCY_RESPONSE_TOO_LARGE | RATE_LIMIT_EXCEEDED | API_UNDO_FAILED | SERVICE_UNAVAILABLE |
| API-007 | INVALID_REQUEST | AUTH_REQUIRED | CSRF_INVALID/ACCESS_DENIED | API_OR_HOST_NOT_FOUND | REVISION_CONFLICT/IMPACT_TOKEN_REQUIRED/IMPACT_TOKEN_INVALID/IDEMPOTENCY_KEY_REUSED | INVALID_METHOD/INVALID_PATH/INVALID_BODY/INVALID_TIMEOUT/INVALID_SENSITIVE_PATH/IDEMPOTENCY_RESPONSE_TOO_LARGE | RATE_LIMIT_EXCEEDED | VERSION_TRANSACTION_FAILED | SERVICE_UNAVAILABLE |
| API-008 | INVALID_REQUEST | AUTH_REQUIRED | ACCESS_DENIED | WORKFLOW_OR_VERSION_NOT_FOUND | WORKFLOW_STATE_CONFLICT | VERSION_NOT_IN_WORKFLOW | RATE_LIMIT_EXCEEDED | INTERNAL_ERROR | SERVICE_UNAVAILABLE |
| API-009 | INVALID_REQUEST | AUTH_REQUIRED | CSRF_INVALID/ACCESS_DENIED | WORKFLOW_OR_API_VERSION_NOT_FOUND | WORKFLOW_REVISION_CONFLICT/IDEMPOTENCY_KEY_REUSED | INVALID_WORKFLOW_NAME/STEP_LIMIT_EXCEEDED/DUPLICATE_STEP_KEY/INVALID_MAPPING/INVALID_RETRY/IDEMPOTENCY_RESPONSE_TOO_LARGE | RATE_LIMIT_EXCEEDED | VERSION_TRANSACTION_FAILED | SERVICE_UNAVAILABLE |
| API-010 | INVALID_REQUEST | AUTH_REQUIRED | CSRF_INVALID/ACCESS_DENIED | WORKFLOW_OR_VERSION_NOT_FOUND | VERSION_NOT_CURRENT/RECOVERY_REVISION_CONFLICT | DEFINITION_SCHEMA_INVALID | RATE_LIMIT_EXCEEDED | VALIDATION_REPORT_FAILED | SERVICE_UNAVAILABLE |
| API-011 | INVALID_REQUEST | AUTH_REQUIRED | CSRF_INVALID/ACCESS_DENIED | WORKFLOW_OR_REPORT_NOT_FOUND | REVIEW_STALE/REPORT_STALE/VALIDATION_ERRORS_EXIST/WARNING_ACK_REQUIRED/IDEMPOTENCY_KEY_REUSED | INVALID_LIFECYCLE_TRANSITION/IDEMPOTENCY_RESPONSE_TOO_LARGE | RATE_LIMIT_EXCEEDED | ENABLE_TRANSACTION_FAILED | SERVICE_UNAVAILABLE |
| API-012 | INVALID_REQUEST | AUTH_REQUIRED | CSRF_INVALID/ACCESS_DENIED | API_VERSION_OR_BINDING_NOT_FOUND | HOST_INACTIVE/API_NOT_ACTIVE/ENVIRONMENT_INCOMPLETE/ENVIRONMENT_REVISION_CONFLICT/IDEMPOTENCY_KEY_REUSED | API_DEFINITION_INVALID/IDEMPOTENCY_RESPONSE_TOO_LARGE | RATE_LIMIT_EXCEEDED | ADMISSION_TRANSACTION_FAILED | SERVICE_UNAVAILABLE |
| API-013 | INVALID_REQUEST | AUTH_REQUIRED | CSRF_INVALID/ACCESS_DENIED | WORKFLOW_VERSION_REPORT_OR_BINDING_NOT_FOUND | HOST_INACTIVE/WORKFLOW_NOT_READY/REPORT_STALE/WARNING_ACK_REQUIRED/ENVIRONMENT_REVISION_CONFLICT/IDEMPOTENCY_KEY_REUSED | SNAPSHOT_INVALID/IDEMPOTENCY_RESPONSE_TOO_LARGE | WORKFLOW_CAPACITY_REACHED/RATE_LIMIT_EXCEEDED | ADMISSION_TRANSACTION_FAILED | SERVICE_UNAVAILABLE |
| API-014 | INVALID_REQUEST | AUTH_REQUIRED | ACCESS_DENIED | EXECUTION_NOT_FOUND_OR_EXPIRED | EXECUTION_PROJECTION_CONFLICT | INVALID_INCLUDE | POLL_RATE_LIMIT_EXCEEDED | INTERNAL_ERROR | SERVICE_UNAVAILABLE |
| API-015 | INVALID_REQUEST | AUTH_REQUIRED | ACCESS_DENIED | HOST_NOT_FOUND | HISTORY_QUERY_CONFLICT | INVALID_DATE_RANGE/INVALID_FILTER/INVALID_SORT/INVALID_FIELDS/INVALID_PAGE | RATE_LIMIT_EXCEEDED | INTERNAL_ERROR | SERVICE_UNAVAILABLE |
| API-016 | INVALID_REQUEST | AUTH_REQUIRED | CSRF_INVALID/ACCESS_DENIED | SOURCE_OR_LATEST_DEFINITION_OR_BINDING_NOT_FOUND | LATEST_STATE_INVALID/WARNING_ACK_REQUIRED/IDEMPOTENCY_KEY_REUSED | SOURCE_NOT_RERUNNABLE/IDEMPOTENCY_RESPONSE_TOO_LARGE | WORKFLOW_CAPACITY_REACHED/RATE_LIMIT_EXCEEDED | ADMISSION_TRANSACTION_FAILED | SERVICE_UNAVAILABLE |
| API-017 | INVALID_RETURN_URL | N/A | ACCESS_DENIED | N/A | LOGIN_ALREADY_ACTIVE | OIDC_CONFIG_INVALID | RATE_LIMIT_EXCEEDED | N/A | IAM_UNAVAILABLE |
| API-018 | OIDC_CALLBACK_INVALID | OIDC_TOKEN_REJECTED | ACCESS_DENIED | SESSION_STATE_NOT_FOUND | CALLBACK_REPLAYED | CLAIM_MAPPING_INVALID | RATE_LIMIT_EXCEEDED | N/A | IAM_OR_SESSION_STORE_UNAVAILABLE |
| API-019 | INVALID_REQUEST | AUTH_REQUIRED | CSRF_INVALID | SESSION_NOT_FOUND | LOGOUT_IN_PROGRESS | GLOBAL_LOGOUT_UNSUPPORTED | RATE_LIMIT_EXCEEDED | N/A | SESSION_STORE_UNAVAILABLE |
| API-020 | INVALID_REQUEST | AUTH_REQUIRED | ACCESS_DENIED | SESSION_NOT_FOUND | SESSION_STATE_CONFLICT | SESSION_CLAIMS_INVALID | RATE_LIMIT_EXCEEDED | N/A | SESSION_STORE_UNAVAILABLE |
| API-021 | INVALID_REQUEST | AUTH_REQUIRED | CSRF_INVALID/ACCESS_DENIED | HOST_NOT_FOUND | REVISION_CONFLICT | INVALID_HOST_TRANSITION | RATE_LIMIT_EXCEEDED | IMPACT_SCAN_FAILED | SERVICE_UNAVAILABLE |
| API-022 | INVALID_REQUEST | AUTH_REQUIRED | CSRF_INVALID/ACCESS_DENIED | HOST_NOT_FOUND | REVISION_CONFLICT/IMPACT_TOKEN_REQUIRED/IMPACT_TOKEN_INVALID/IDEMPOTENCY_KEY_REUSED | INVALID_HOST_TRANSITION/IDEMPOTENCY_RESPONSE_TOO_LARGE | RATE_LIMIT_EXCEEDED | HOST_TRANSITION_FAILED | SERVICE_UNAVAILABLE |
| API-023 | INVALID_REQUEST | AUTH_REQUIRED | CSRF_INVALID/ACCESS_DENIED | HOST_OR_ENVIRONMENT_NOT_FOUND | REVISION_CONFLICT/IDEMPOTENCY_KEY_REUSED | IDEMPOTENCY_RESPONSE_TOO_LARGE | RATE_LIMIT_EXCEEDED | ENVIRONMENT_DELETE_FAILED | SERVICE_UNAVAILABLE |

API-012/013/016 use `503 SERVICE_UNAVAILABLE` only when the mandatory pre-admission Central-IAM protected-request verification is unavailable/uncertain (or another admission dependency/bulkhead is unavailable), before any Execution is created. A missing/empty CIDR set or approval evidence makes the binding incomplete and returns `409 ENVIRONMENT_INCOMPLETE`; a concurrent CIDR-set revision change returns `409 ENVIRONMENT_REVISION_CONFLICT`. Admission atomically byte-copies the selected binding's existing ciphertext, nonce, authentication tag, immutable key ID, canonical target CIDRs, address-set hash, approval reference, recording actor, timestamp and manifest version into ENT-020 with the durable job and returns 202. Only the worker contacts the key provider; a later key-provider outage becomes masked terminal Execution evidence through SEQ-003/004/006 and never rewrites the accepted response. Routine rotation retains referenced key IDs through the 30-day snapshot lifetime; emergency Security revocation fails the worker closed.

All endpoints use camelCase JSON, UTC ISO-8601, HTTPS and OpenAPI. `backend/errors.yml` generates typed TypeScript codes and OpenAPI response components; contract tests verify every endpoint schema and error reference.

## Updated

## Removed

### Self-Review Checklist

- [x] All 23 endpoints declare normative `Auth`, `Roles`, `Idempotent` and `Rate limit` metadata.
- [x] Every endpoint has field/type/required/default/validation/example request and response contracts.
- [x] Every endpoint defines 400/401/403/404/409/422/429/500/503 conditions or an explicit N/A condition through the normative per-endpoint table.
- [x] Collection filtering/sorting/field-selection/pagination and the centralized catalog are explicit.
- [x] Environment CRUD, Host/API/method impact, auth/session, warning severity, attempt evidence and same-identity Undo are contractible.
