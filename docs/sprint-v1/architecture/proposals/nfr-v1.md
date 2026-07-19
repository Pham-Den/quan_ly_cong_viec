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

# Non-Functional Requirements Proposal — Sprint v1

**Architecture package references:** entrypoint `architecture-v1.md` (`ARCH-OVERVIEW-001`); companion set `adr-v1.md`, `api-specs-v1.md`, `data-flow-v1.md`, `erd-v1.md`, `events-v1.md`, `nfr-v1.md`, `project-reference-v1.md`, `sequence-v1.md`.

## New

<!-- ID: NFR-001 -->
### NFR-001: Interactive Performance

| Field | Value |
|---|---|
| Category | Performance |
| Target | Workspace CRUD p95 ≤500 ms/p99 ≤1 s; execution observation p95 ≤1 s; 50-row History p95 ≤750 ms |
| Source | Product PRD targets + `sprint-brief-v1.md` `ARCH-DEC-008` |
| Priority | Must |
| Applies to | API, worker, SPA, MySQL |
| Verification | OTel p95/p99 load test in SIT with representative 20-step data |

| Scenario | Context | System response | Metric |
|---|---|---|---|
| Workspace CRUD | 50 concurrent authenticated sessions, normal dataset | Complete API CRUD without provider call | p95 ≤500 ms, p99 ≤1 s over 15 min |
| Execution observation | Provider response/step transition committed | UI observes new state | ≤1 s at p95 using active polling |
| History page | 1M retained execution rows, indexed filters | Return 50-row page | p95 ≤750 ms |

Measure at API ingress with OTel histograms; exclude target-provider latency from CRUD but report it separately.

<!-- ID: NFR-002 -->
### NFR-002: Availability And Graceful Degradation

| Field | Value |
|---|---|
| Category | Availability |
| Target | Monthly availability ≥99.5%; accepted execution survives one API pod loss and recovers API routing within 30 seconds |
| Source | `sprint-brief-v1.md` `ARCH-DEC-008` |
| Priority | Must |
| Applies to | API, worker, MySQL, IAM, Vault, provider integrations |
| Verification | monthly SLI plus dependency-failure drills in SIT |

- **Target:** API Lab monthly availability ≥99.5%, excluding approved maintenance; health checks every 30 seconds.
- **Scenario:** if a target provider is unavailable, workspace CRUD/history remain available and only the affected execution fails with typed evidence.
- **Scenario:** if telemetry export is unavailable, business traffic continues with bounded local buffering; if MySQL, IAM or key provider required for the action is unavailable, fail closed.
- **Deployment baseline:** production API minimum 2 replicas; worker minimum 2 replicas where platform capacity allows.

| Context | System response | Metric |
|---|---|---|
| One API pod terminates during 20 active workflows | ingress routes new calls to healthy pod; workers continue via leases | no accepted execution lost; API recovers within 30 seconds |
| Provider/telemetry unavailable | only affected execution fails/retries; CRUD/history continue | monthly availability ≥99.5%; zero raw dependency stack traces in UI |

<!-- ID: NFR-003 -->
### NFR-003: Capacity And Execution Reliability

| Field | Value |
|---|---|
| Category | Scalability |
| Target | Exactly 20 active Workflow executions maximum; ≤20 Steps/Workflow; retry count 0–5; zero duplicate attempts |
| Source | Product capacity/retry rules |
| Priority | Must |
| Applies to | admission, worker, job/execution stores |
| Verification | concurrent admission/lease/idempotency stress test |

- At most **20 workflow executions** may be `PENDING|RUNNING` globally; a job in `RETRY_WAIT` keeps its owning Execution `RUNNING`, so it remains counted. The 21st is rejected atomically with HTTP 429.
- One workflow contains at most **20 steps**; retry count is 0–5.
- Retry delay is the configured fixed `retryDelaySeconds` for every retry, default 1 second, and only the current failed Step is retried. This intentionally preserves Product US-008, which places advanced backoff strategies out of scope; ADR-005 records the bounded resilience-standard exception.
- Standalone API execution is one implicit Step with Architecture-selected lower bound `retryCount=0` (`maxAttempts=1`) because approved Design exposes retry configuration only on a saved Workflow Step. API-012 accepts no override; `Chạy lại` creates another Execution. Workflow Steps retain the configured 0–5 range and fixed delay.
- Worker lease is 60 seconds, heartbeat every 15 seconds, claim batch 1 per worker loop; maximum 3 lease-claim failures before `DEAD` and alert.
- Admission/idempotency must produce at most one execution per actor/route/idempotency key/payload during a 24-hour window.
- Capacity test: 20 concurrent 20-step workflows plus 30 history readers must retain NFR-001 and zero duplicate attempts.

| Context | System response | Metric |
|---|---|---|
| Two API replicas concurrently admit the 20th/21st workflow | serialized capacity transaction accepts exactly one | exactly 20 active; rejected request creates zero Execution/History row |
| Worker dies after an attempt commit | next worker reclaims expired lease without replaying terminal attempt; third exhausted recovery atomically fails Execution and releases capacity | zero duplicate attempt numbers; recovery begins ≤75 seconds; no leaked active counter |
| Qualified workload doubles while job oldest-age exceeds 30 seconds and worker CPU exceeds 70% for 5 minutes | HPA scales Execution workers from 2 toward 4 without increasing the Product cap of 20 active Workflows, then scales down after 15 stable minutes | NFR-001 latency and NFR-002 availability remain within target; oldest job returns ≤30 seconds within 5 minutes; worker compute cost is ≤2.2× the two-worker baseline at 2× qualified load |

> Assumption: The v1 worker scale event uses 70% CPU plus 30-second oldest-job age, maximum four workers and a 2.2× compute-cost ceiling; Product fixes business concurrency but does not prescribe infrastructure scaling economics.
> Validate: Platform/SRE and FinOps verify the two-worker baseline, HPA event, latency/availability and cost ratio in SIT before `approve plan`.
> Change trigger: Qualified load cannot recover within five minutes, provider quotas prevent four workers, or measured cost exceeds the ceiling.

<!-- ID: NFR-004 -->
### NFR-004: Security And Secret Protection

| Field | Value |
|---|---|
| Category | Security |
| Target | TLS ≥1.3; reauthenticate after >15 minutes inactivity; immediately revoke terminated accounts; deactivate accounts inactive >90 days; block authentication 15 minutes after five consecutive failures; zero raw credential/configured sensitive value in persisted artifacts, UI, logs, traces, errors or telemetry |
| Source | FR-002/012, security standards and `sprint-brief-v1.md` `ARCH-DEC-004/005/006` |
| Priority | Must |
| Applies to | browser/API, Catalog, worker, DB, Vault, provider gateway, telemetry |
| Verification | threat tests, SSRF corpus, log/DOM scan, key-rotation drill |

- TLS **≥1.3** is mandatory for browser/API, database, IAM, secret-manager, telemetry and target-provider transport. Connections that cannot negotiate an approved version fail closed; certificate verification cannot be disabled.
- Credentials at rest use AES-256-GCM with unique 96-bit nonce, authentication tag and key ID; key material exists only in the runtime secret manager.
- Execution admission copies an existing authenticated ciphertext/nonce/tag/key-ID tuple unchanged into its immutable snapshot and therefore does not reuse a nonce for new encryption. Routine rotation retains referenced key versions for every non-expired 30-day snapshot; emergency Security revocation is allowed to make affected executions fail closed.
- Secure/HttpOnly/SameSite session cookie; CSRF token for every mutation; CSP without `unsafe-inline`/`unsafe-eval` unless a future ADR.
- Server-side session inactivity greater than 15 minutes invalidates the session before any protected payload is returned; the client receives `401 AUTH_REQUIRED` with `details.reason=IDLE_TIMEOUT` and reauthenticates through Central IAM.
- Central IAM assigns the immutable unique subject ID, disables/deletes accounts inactive for more than 90 days, revokes account access and active sessions immediately on termination, and blocks authentication for 15 minutes after five consecutive failed attempts. The application never implements a parallel password database. `requireActor` validates the authoritative IAM session state without a positive-status cache; revocation or IAM uncertainty fails closed before protected data access.
- No password, token, credential or configured sensitive path may appear in DOM copy affordances, logs, traces, Sentry payloads or API errors.
- Outbound gateway rejects loopback, link-local, private/reserved IP unless explicitly allowlisted for that Host; DNS and every redirect are revalidated.
- Every system-to-system integration is restricted to its Architecture §7.3a approved IP/CIDR set. API, worker and scheduler Kubernetes workloads require Agent Security admission/runtime coverage; Security Testing, CVSS 3.1 disposition and comprehensive risk-assessment evidence are production promotion gates.

| Context | System response | Metric |
|---|---|---|
| Malicious path/redirect resolves to private address | gateway rejects before connect and audits reason | 100% SSRF corpus blocked; zero outbound packet to denied range |
| Credential/sensitive value traverses a run | pin encrypted snapshot, decrypt only in worker memory, mask before persistence/export | zero raw matches in DB artifact/UI/log/trace/Sentry scans |
| Account terminated, inactive >90 days or reaches five consecutive failed authentications | Central IAM revokes/deactivates/blocks; `requireActor` rejects authoritative inactive or uncertain status | zero protected payload returned after revocation; five-failure block lasts 15 minutes |

> Assumption: Five consecutive failures followed by a 15-minute authentication block is the Sprint v1 internal brute-force default; the approved security standard requires a blocking control but does not prescribe these two numbers.
> Validate: The project owner acting as Security reviewer verifies Central-IAM support and the integration test evidence before production promotion.
> Change trigger: Central IAM enforces a stricter policy, an independent security review requires another threshold, or external-user/commercial deployment begins.

<!-- ID: NFR-005 -->
### NFR-005: Durability And Disaster Recovery

| Field | Value |
|---|---|
| Category | Availability |
| Target | MySQL RPO ≤15 minutes and service RTO ≤4 hours; zero accepted run without atomic durable execution/job/snapshot/idempotency |
| Source | `sprint-brief-v1.md` `ARCH-DEC-008` |
| Priority | Must |
| Applies to | MySQL, migrations, execution admission |
| Verification | quarterly restore drill and migration rollback rehearsal |

- **RPO:** ≤15 minutes for MySQL authoritative state.
- **RTO:** ≤4 hours for API Lab service.
- Daily encrypted backups plus binlog/PITR; quarterly restore rehearsal records achieved RPO/RTO.
- Execution admission transaction is ACID; no accepted `202` without durable execution and job.
- Schema changes use Prisma versioned expand/migrate/contract migrations, staging dry run and one-release rollback window.

| Context | System response | Metric |
|---|---|---|
| Primary database unavailable/corrupted | restore latest backup and binlog to replacement instance | RPO ≤15 minutes; RTO ≤4 hours |
| API returns accepted run | execution, pinned secret snapshot, idempotency and job are durable atomically | zero accepted `202` without all four records |

<!-- ID: NFR-006 -->
### NFR-006: Observability And Audit

| Field | Value |
|---|---|
| Category | Observability |
| Target | 100% correlated structured logs; execution evidence searchable within 5 minutes; audit online 6 months and retained 12 months |
| Source | Security/DevSecOps standards + `sprint-brief-v1.md` `ARCH-DEC-009` |
| Priority | Must |
| Applies to | API, worker, scheduler, audit DB, OTel/Sentry |
| Verification | telemetry contract tests, alert injection and audit-retention query |

- Every Pino JSON log line uses the mandatory base schema: `timestamp`, `level`, `service`, deployment `environment`, `trace_id`, `request_id`, masked-or-null `user_id`, `operation`, `message`, `duration_ms`, `http_status`, `error_code` and `error_message`. `span_id`, Execution/definition/version IDs and `api_lab.environment_key` remain OpenTelemetry span attributes or metric labels rather than unapproved base-log extensions. Adding any base field requires an ADR and schema version. Logs, traces, metrics and Sentry never carry raw secrets/bodies by default.
- Cloudflare/ingress validates or generates `X-Request-ID`; OpenTelemetry owns `X-Trace-ID`; responses echo both and every downstream HTTP/job boundary propagates them. Direct untrusted `X-Trace-ID` is replaced, malformed/duplicate request IDs are replaced, and correlation values never participate in authorization or idempotency.
- The Vue Sentry adapter captures uncaught errors/unhandled rejections, router/navigation errors, fetch/XHR `>=400` or network failures, Vue render-boundary failures and LCP/INP/CLS. Every envelope carries `app_version`, immutable `build_id`, session ID, masked user ID, device/OS/browser/viewport/network class and the latest 10 redacted breadcrumbs. `sendDefaultPii=false`; tokens, credentials, raw bodies and full email/phone never leave the browser. Up to 100 already-redacted envelopes may queue in IndexedDB for 24 hours while offline and retry on reconnect; overflow/expiry drops with a metric.
- Frontend production source maps are hidden CI artifacts, uploaded against the immutable Sentry release ID, verified, and removed before CDN publication. The upload credential is CI-only; any public `.map`, missing verified upload or release mismatch fails the production gate.
- Metrics: request latency/errors, job depth/age, active workflow count, lease recoveries, step attempts, provider latency/errors, retention lag and masking failures.
- Security/business audit is append-only, queryable online for 6 months and retained for 12 months; all privileged/config/destructive/run actions include actor, target, outcome and timestamp.
- Alert: job oldest age >60 s for 5 min, dead job >0, retention lag >48 h, error rate >5% for 5 min, or active-count invariant mismatch.

| Context | System response | Metric |
|---|---|---|
| Step fails after retries | correlated log/trace/metric/audit identify execution/step/attempt without secret | evidence searchable by request/trace/execution ID within 5 minutes |
| Telemetry exporter unavailable | bounded buffer/drop metric; business transaction continues | no business rollback; exporter-loss alert within 5 minutes |

<!-- ID: NFR-007 -->
### NFR-007: Retention And Payload Bounds

| Field | Value |
|---|---|
| Category | Compliance |
| Target | Execution evidence retained 30 days; masked persisted body ≤200 KiB; delete Undo deadline exactly 10 seconds server time |
| Source | Product BR-007/BR-012 + 200 KiB existing runner bound |
| Priority | Must |
| Applies to | execution, attempts, artifacts, secret snapshots, API tombstones, audit |
| Verification | controllable-clock retention/undo tests and oversized-payload test |

- Execution/history/artifact records are retained **30 days**, then deleted in daily batches of at most 5,000 rows/transaction.
- Persisted request/response artifact body is capped at **200 KB** after masking; larger bodies store prefix plus `truncated=true`, original byte count and digest.
- Latest successful masked response schema used by Variable Browser remains available only while its source artifact is retained.
- API delete undo deadline is server-authoritative **10 seconds**; expired soft-deleted API data may be physically purged after 30 days, but audit remains per NFR-006.

| Context | System response | Metric |
|---|---|---|
| Daily cleanup crosses 30-day boundary | delete only records older than boundary in bounded transactions | exact 30-day record remains; batch ≤5,000 rows |
| Provider returns >200 KB | mask, persist prefix/digest/count and set truncated | stored body ≤204,800 bytes; UI explicitly shows truncation |

<!-- ID: NFR-008 -->
### NFR-008: Platform, Accessibility And Quality Gates

| Field | Value |
|---|---|
| Category | Accessibility |
| Target | Editor only on physical `screen.width ≥1280px`; supported-screen critical flows remain keyboard-operable at 200% zoom; WCAG 2.2 AA |
| Source | Approved `docs/sprint-v1/changes/v1.7.18-api-lab-undo-warning-viewport/product-delta-v1.7.18-api-lab-undo-warning-viewport.md` anchors `AC-044`/`AC-045`; approved `docs/sprint-v1/design/proposals/design-system-v1.md` §10/11 |
| Priority | Must |
| Applies to | desktop SPA, CI quality gates |
| Verification | Playwright with mocked physical `screen.width`, 200% zoom, axe and keyboard/screen-reader checks |

- Workflow editor support is determined by physical browser `screen.width >= 1280px`, not the zoom-reduced CSS content viewport. On a supported screen, zoom through 200% keeps Save/Run/validation keyboard-operable via compact panels and localized horizontal scroll; physical screens below 1280px render no editor/Run controls.
- WCAG 2.2 AA for in-scope desktop flows; automated axe checks plus keyboard/screen-reader checks for all eight screens.
- New backend/frontend business code meets line and branch coverage ≥90%; contract tests validate OpenAPI/error catalog; Playwright covers Empty/Loading/Populated/Error and critical recovery paths.
- Production initial-route budgets are JavaScript ≤200 KB gzip and CSS ≤50 KB gzip. The supported desktop flow targets LCP ≤2.5 s at p75 under the CI mobile-4G profile, INP ≤200 ms, CLS ≤0.1 and Lighthouse Performance ≥90; exceeding any budget blocks production promotion unless an approved, expiring exception records owner and recovery date.
- All user-facing strings use the existing `vue-i18n` boundary with Vietnamese (`vi`) as default while preserving the canonical technical terms approved by Product. Dates, times and numbers use locale-aware formatters; pluralization uses ICU messages; CSS logical properties support direction changes. CI runs pseudolocalization and an RTL layout smoke test even though phase 1 ships no additional locale.
- Architecture does not introduce a mobile/touch editor commitment.

| Context | System response | Metric |
|---|---|---|
| Physical screen 1280px, browser zoom 200% | compact panels/technical-region scroll preserve focused controls | all critical flows complete by keyboard with no unsupported notice |
| Physical screen 1279px | render exact unsupported-device state and Host return action | editor and Run controls absent in 100% tested browsers |
| Production initial route under the CI mobile-4G profile | collect bundle and synthetic performance evidence before deploy | JS ≤200 KB gzip; CSS ≤50 KB gzip; LCP p75 ≤2.5 s; INP ≤200 ms; CLS ≤0.1; Lighthouse Performance ≥90 |
| Pseudolocale and RTL smoke suites | expand strings, flip direction and exercise all eight screens | no clipped critical control, untranslated literal or direction-dependent navigation failure |

<!-- ID: NFR-009 -->
### NFR-009: Cost Governance

| Field | Value |
|---|---|
| Category | Cost efficiency / FinOps |
| Target | 100% of deployable resources carry required allocation tags; monthly right-sizing evidence exists; no non-production idle resource remains beyond its approved TTL |
| Source | Architecture Principles §7 and sprint-v1 deployment topology |
| Priority | Must |
| Applies to | IaC, Kubernetes workloads, MySQL, Vault, Prisma Access, Cloudflare, Sentry and CI-created resources |
| Verification | policy-as-code tag gate, daily orphan/idle scan, monthly utilization and showback report |

- Every deployable resource must expose `cost_center`, `business_unit`, `product`, `environment` and `owner` through native tags or the nearest equivalent label. Missing allocation metadata blocks deployment.
- Platform/SRE reviews CPU, memory, database, storage, network and job utilization monthly and records retain/resize/remove decisions with an owner and due date.
- Non-production resources created for ephemeral validation default to a 24-hour idle TTL. Exceptions require an owner, reason and explicit expiry; the daily recovery job reports and removes expired idle resources through the normal provider-safe deletion path.
- Shared Kubernetes, MySQL, Vault, Prisma Access, Cloudflare and Sentry costs use showback by namespace, allocation tags and measurable usage where supported. Direct chargeback is **not applicable in v1** until Finance approves an allocation model; this decision does not waive collection of showback evidence.

| Context | System response | Metric |
|---|---|---|
| IaC plan contains a deployable resource without a required allocation tag | policy gate rejects the plan | zero untagged resources promoted |
| Monthly utilization review finds sustained over-provisioning | owner records resize/removal action and due date | 100% reviewed resources have a decision |
| Ephemeral non-production resource is idle past its TTL | daily job reports, safely removes and audits it | zero unapproved idle resource older than 24 hours |

> Assumption: The 24-hour non-production idle TTL and monthly review cadence are internal provisional defaults, not external compliance requirements.
> Validate: Platform/FinOps confirms provider feasibility and ownership before `approve plan`.
> Change trigger: Finance introduces chargeback or a provider/resource class requires a different safe recovery window.

### 8. Implementation Configuration Mapping

| NFR ID | NFR Target | Config Key | Recommended Value | Who Sets It | Notes |
|---|---|---|---|---|---|
| NFR-001 | Workspace CRUD p95 ≤500 ms | `API_LAB_CRUD_P95_TARGET_MS` | `500` | App/SRE | OTel SLI threshold |
| NFR-001 | Workspace CRUD p99 ≤1 s | `API_LAB_CRUD_P99_TARGET_MS` | `1000` | App/SRE | OTel load-test and SLO evidence |
| NFR-001 | History p95 ≤750 ms | `API_LAB_HISTORY_P95_TARGET_MS` | `750` | App/SRE | 50-row indexed query |
| NFR-001 | Execution observation p95 ≤1 s | `EXECUTION_POLL_INTERVAL_MS` | `1000` | Frontend | Active executions only |
| NFR-002 | Monthly availability ≥99.5% | `API_LAB_AVAILABILITY_TARGET` | `0.995` | SRE | Excludes approved maintenance |
| NFR-002 | API recovery/routing ≤30 s | `API_MIN_REPLICAS` / `HEALTH_CHECK_INTERVAL_SECONDS` | `2` / `30` | IaC | Production baseline |
| NFR-002 | Dependency circuit opens after sustained failure | `DEPENDENCY_CB_FAILURE_RATE` / `DEPENDENCY_CB_WINDOW_SECONDS` / `DEPENDENCY_CB_OPEN_SECONDS` | `0.50` / `30` / `60` | App/SRE | Per IAM, Vault and target-provider dependency |
| NFR-002 | Dependency isolation | `PROVIDER_BULKHEAD_MAX_CONCURRENT` / `DB_POOL_MAX` | `5` per Host / `20` per process | App/SRE | Prevent one dependency from exhausting workers/connections |
| NFR-003 | Active Workflow cap | `WORKFLOW_ACTIVE_LIMIT` | `20` | Backend | Atomic global admission counter |
| NFR-003 | Lease recovery ≤75 s | `EXECUTION_LEASE_SECONDS` / `EXECUTION_HEARTBEAT_SECONDS` / `EXECUTION_CLAIM_BATCH` | `60` / `15` / `1` | Worker | Lease/heartbeat/reclaim budget |
| NFR-003 | Dead after three claim failures | `EXECUTION_MAX_CLAIM_FAILURES` | `3` | Worker | Emits critical dead-job alert |
| NFR-003 | Idempotency window 24 h | `IDEMPOTENCY_TTL_HOURS` | `24` | Backend | Actor/route/key/payload scope |
| NFR-003 | Idempotency replay response bound | `IDEMPOTENCY_RESPONSE_MAX_BYTES` | `65536` | Backend | Serialize before commit; overflow rolls back and returns 422 `IDEMPOTENCY_RESPONSE_TOO_LARGE` |
| NFR-003 | Product retry delay/count | `RETRY_STRATEGY` / `RETRY_DELAY_DEFAULT_SECONDS` / `RETRY_COUNT_MAX` | `fixed` / `1` / `5` | Worker | ADR-005 bounded standards exception; current failed Step only |
| NFR-003 | Standalone API retry policy | `STANDALONE_API_RETRY_COUNT` | `0` | Worker/API | One implicit Step, one attempt; no API-012 override; rerun creates a new Execution |
| NFR-003 | Capacity qualification | `CAPACITY_TEST_WORKFLOWS` / `CAPACITY_TEST_STEPS` / `CAPACITY_TEST_HISTORY_READERS` | `20` / `20` / `30` | Test/SRE | Must retain NFR-001 and zero duplicates |
| NFR-003 | Worker scale event and cost ceiling | `EXECUTION_WORKER_MIN_REPLICAS` / `EXECUTION_WORKER_MAX_REPLICAS` / `EXECUTION_HPA_CPU_PERCENT` / `JOB_AGE_SCALE_SECONDS` / `WORKER_SCALE_COST_RATIO_MAX` | `2` / `4` / `70` / `30` / `2.2` | IaC/SRE/FinOps | Scale within five minutes; 15 stable minutes before scale-down; no Product-cap increase |
| NFR-004 | Provider timeout | `PROVIDER_TIMEOUT_DEFAULT_MS` / `PROVIDER_TIMEOUT_MAX_MS` | `30000` / `300000` | Backend | Per-API override within bound |
| NFR-004 | Provider response bound | `PROVIDER_RESPONSE_MAX_BYTES` | `204800` | Worker | After masking |
| NFR-004 | Key provider timeout | `KEY_PROVIDER_TIMEOUT_MS` | `2000` | Backend/Worker | Fail closed with typed 503 |
| NFR-004 | Idle-session reauthentication | `SESSION_IDLE_TIMEOUT_MINUTES` / `SESSION_ACTIVITY_WRITE_MIN_SECONDS` | `15` / `60` | Identity/API | Invalidate when inactivity is greater than 15 minutes; throttle activity writes only, never validation |
| NFR-004 | Credential key selection | `CREDENTIAL_KEY_ACTIVE_ID` | Secret-manager key reference | SRE/Security | No key material in app config |
| NFR-004 | Snapshot key-version retention | `SNAPSHOT_KEY_MIN_RETENTION_DAYS` | `30` | SRE/Security | Routine rotation cannot remove a key ID referenced by retained ENT-020; emergency revocation overrides availability |
| NFR-004 | Request throttling | `API_RATE_LIMIT_PER_MINUTE` / `API_RATE_LIMIT_BURST` | `120` / `20` | API/SRE | 429 with `Retry-After` |
| NFR-004 | Execution poll throttling | `EXECUTION_POLL_RATE_LIMIT_PER_MINUTE` / `EXECUTION_POLL_RATE_LIMIT_BURST` | `60` / `5` | API/SRE | API-014 one-second polling budget; 429 `POLL_RATE_LIMIT_EXCEEDED` with `Retry-After` |
| NFR-004 | Authentication route throttling | `AUTH_RATE_LIMIT_PER_MINUTE` / `AUTH_RATE_LIMIT_BURST` | `30` / `5` | Identity/API/SRE | API-017–019 source-IP/state/session scopes; 429 with `Retry-After` |
| NFR-004 | TLS and certificate verification | `TLS_MIN_VERSION` / `TLS_CERT_VERIFY_REQUIRED` | `1.3` / `true` | IaC/Platform | Browser, DB, IAM, Vault, telemetry and provider connections fail closed |
| NFR-004 | Zero-secret telemetry/DOM gate | `TELEMETRY_BODY_CAPTURE_ENABLED` / `SENSITIVE_DATA_SCAN_MAX_FINDINGS` | `false` / `0` | App/Frontend/CI | DB artifact, DOM, logs, traces, errors and Sentry scan blocks promotion |
| NFR-004 | Central-IAM account lifecycle | `IAM_ACCOUNT_INACTIVE_DAYS` / `IAM_FAILED_AUTH_MAX` / `IAM_AUTH_BLOCK_MINUTES` / `IAM_POSITIVE_STATUS_CACHE_SECONDS` | `90` / `5` / `15` / `0` | IAM/Security | Immediate termination revocation; authoritative status uncertainty fails closed |
| NFR-004 | Central-IAM status verification | `IAM_STATUS_TIMEOUT_MS` | `2000` | Identity/API/SRE | Per protected request; typed 503 and no protected payload when status is uncertain |
| NFR-004 | Central-IAM login/token exchange | `IAM_LOGIN_TIMEOUT_MS` / `IAM_LOGIN_RETRY_MAX` | `5000` / `3` | Identity/API/SRE | Idempotent discovery/token/userinfo only; no session created/refreshed on exhaustion |
| NFR-004 | Integration address control | `INTEGRATION_IP_ALLOWLIST_REQUIRED` / `ADDRESS_MANIFEST_SIGNATURE_REQUIRED` | `true` / `true` | Platform/Security | Infrastructure sets are IaC-managed; dynamic target ref/Host/Environment/hash must match the signed read-only manifest before ENT-002 persistence and ENT-020 pinning; deny missing/invalid/stale/unavailable manifest or any DNS/connect/redirect mismatch |
| NFR-004 | Kubernetes workload protection | `AGENT_SECURITY_REQUIRED` | `true` | Platform/Security | API, worker and scheduler admission/runtime verification blocks promotion when absent |
| NFR-004 | Release security gate | `SECURITY_TEST_LEAD_DAYS` / `VULNERABILITY_SCORING` | `3` / `CVSS_3_1` | Security/Release | High+ blocks release; Medium/lower requires owned remediation/retest plan |
| NFR-004 | Comprehensive risk assessment | `SECURITY_RISK_ASSESSMENT_REQUIRED` | `true` | Security/Technical Owner | Evidence linked before UAT exit and production promotion |
| NFR-005 | Database recovery | `BACKUP_RPO_MINUTES` / `RECOVERY_RTO_HOURS` | `15` / `4` | DBA/SRE | Verified quarterly |
| NFR-006 | Audit retention | `AUDIT_ONLINE_MONTHS` / `AUDIT_RETENTION_MONTHS` | `6` / `12` | Security/DBA | Append-only |
| NFR-006 | Operational alert thresholds | `JOB_AGE_ALERT_SECONDS` / `RETENTION_LAG_ALERT_HOURS` / `ERROR_RATE_ALERT_PERCENT` / `ALERT_WINDOW_MINUTES` | `60` / `48` / `5` / `5` | SRE | Dead-job and active-counter mismatch alert immediately |
| NFR-006 | Sentry release/source-map gate | `SENTRY_RELEASE` / `SENTRY_SOURCEMAP_UPLOAD` / `SENTRY_DELETE_AFTER_UPLOAD` | immutable build ID / `true` / `true` | CI/Platform | CI injects the short-lived upload credential from its protected secret store; never expose it to app config, image or browser |
| NFR-006 | Correlation propagation | `REQUEST_ID_MAX_LENGTH` / `CORRELATION_HEADERS_REQUIRED` | `64` / `X-Request-ID,X-Trace-ID` | API/Worker/OTel | Validate/generate at ingress, echo response, forward HTTP/job; untrusted trace ID replaced |
| NFR-006 | Frontend error/performance capture | `SENTRY_SEND_DEFAULT_PII` / `SENTRY_BREADCRUMB_LIMIT` / `FRONTEND_ERROR_QUEUE_MAX` / `FRONTEND_ERROR_QUEUE_TTL_HOURS` / `FRONTEND_PERF_METRICS` | `false` / `10` / `100` / `24` / `LCP,INP,CLS` | Frontend/CI | Required event/context schema contract; queue contains redacted envelopes only |
| NFR-007 | Execution retention and batch | `EXECUTION_RETENTION_DAYS` / `RETENTION_BATCH_SIZE` | `30` / `5000` | Worker/DBA | Daily bounded cleanup |
| NFR-007 | API delete Undo | `API_DELETE_UNDO_SECONDS` | `10` | Backend | Server-authoritative monotonic deadline |
| NFR-008 | Physical screen gate | `WORKFLOW_EDITOR_MIN_WIDTH_PX` | `1280` | Frontend | Evaluate `screen.width`, not CSS viewport |
| NFR-008 | Supported-screen zoom keyboard gate | `WORKFLOW_EDITOR_ZOOM_TEST_PERCENT` / `A11Y_KEYBOARD_CRITICAL_FLOW_GATE` | `200` / `true` | Frontend/CI | All eight screens; Save/Run/validation reachable without unsupported notice |
| NFR-008 | WCAG 2.2 AA promotion gate | `A11Y_STANDARD` / `AXE_CRITICAL_VIOLATIONS_MAX` / `SCREEN_READER_RELEASE_CHECK_REQUIRED` | `WCAG_2_2_AA` / `0` / `true` | Frontend/QA/CI | Automated axe plus keyboard/NVDA release evidence |
| NFR-008 | Code coverage gates | `COVERAGE_LINE_MIN` / `COVERAGE_BRANCH_MIN` | `90` / `90` | CI | New business code |
| NFR-008 | Public source-map absence | `PUBLIC_SOURCEMAP_COUNT_MAX` | `0` | CI | Scan final CDN artifact; production promotion fails above zero |
| NFR-008 | HTML cache policy | `HTML_CACHE_CONTROL` | `no-cache, must-revalidate` | CDN/Frontend | HTML shell revalidates every use; never immutable |
| NFR-008 | Hashed static-asset cache policy | `STATIC_ASSET_CACHE_CONTROL` / `STATIC_ASSET_MAX_AGE_SECONDS` | `public, max-age=31536000, immutable` / `31536000` | CDN/Frontend | Strong content-hash ETag plus build-timestamp `Last-Modified` |
| NFR-008 | Static-asset cache key and invalidation | `STATIC_CACHE_KEY_FIELDS` / `STATIC_CACHE_PURGE_MODE` | `build_id,path,content_hash,content_encoding` / `versioned-url` | CDN/CI | Deploy/rollback switches manifest; audited exact purge only for exceptional URL/tag removal |
| NFR-008 | Initial route bundle budgets | `FRONTEND_JS_INITIAL_GZIP_MAX_KB` / `FRONTEND_CSS_INITIAL_GZIP_MAX_KB` | `200` / `50` | Frontend/CI | Production route assets; promotion-blocking |
| NFR-008 | Web performance budgets | `WEB_LCP_P75_MAX_MS` / `WEB_INP_MAX_MS` / `WEB_CLS_MAX` / `LIGHTHOUSE_PERFORMANCE_MIN` | `2500` / `200` / `0.1` / `90` | Frontend/CI | Fixed mobile-4G CI profile; supported desktop flow |
| NFR-008 | Localization quality gate | `I18N_DEFAULT_LOCALE` / `I18N_PSEUDOLOCALE_CI` / `RTL_SMOKE_TEST_REQUIRED` | `vi` / `true` / `true` | Frontend/CI | Externalized strings, ICU pluralization and logical layout |
| NFR-009 | Required cost allocation metadata | `COST_ALLOCATION_REQUIRED_TAGS` | `cost_center,business_unit,product,environment,owner` | IaC/Platform | Missing tag blocks deployment |
| NFR-009 | Non-production idle recovery | `NONPROD_IDLE_TTL_HOURS` | `24` | Platform/SRE | Exceptions require owner and expiry |
| NFR-009 | Right-sizing review cadence | `RIGHTSIZING_REVIEW_INTERVAL_DAYS` | `30` | Platform/SRE | Monthly utilization decision evidence |
| NFR-009 | Shared-service allocation mode | `SHARED_SERVICE_COST_ALLOCATION_MODE` | `showback` | FinOps/Platform | v1 chargeback not applicable pending Finance approval |

### 9. Open NFR Risks

None. Provider-specific SLA is intentionally not inherited by this system; each failure is surfaced explicitly.

## Updated

## Removed

### Self-Review Checklist

- [x] Every target is measurable or explicitly bounded.
- [x] Significant scenarios contain context, response and metric.
- [x] Every important target maps to an application/IaC configuration owner.
