---
status: IN_PROGRESS
version: v1
sprint: 1
phase: implement
sprint_id: sprint-v1
task_group: TG-03B
change_pack: v1.7.21-oidc-session-error-contracts
created: 2026-07-20
updated: 2026-07-20
---

# TG-03B — Observability And Runtime Composition Evidence

> Completion remains pending commit/branch provenance and approval of change pack `v1.7.21-oidc-session-error-contracts`.

## Scope Result

Composed the reviewed TG-02B Identity plugin and TG-03 error catalog into the Fastify runtime, added redacting audit/telemetry ports and bounded correlation adapters. The CODE-10 harness is recorded separately by TG-03C; no feature-domain behavior or canonical catalog/schema contract was expanded.

| Contract | Implemented evidence |
|---|---|
| Live composition | `buildApplication` invokes the reviewed fail-closed Identity config validator before constructing dependencies, then registers Identity, common protected routes, CORS credentials, correlation hooks and Prisma lifecycle; legacy JWT routes are not composed |
| Error/correlation | Canonical error envelopes echo authoritative request/trace IDs; client request IDs accept only 1–64 allowlisted characters and generated replacements are UUIDv7 |
| Telemetry isolation | Exact NFR-006 base record, redaction before export, FIFO buffer of 100, 101st drop counter and exporter failure cannot alter the business response |
| Audit boundary | Write-only `AuditSink` plus recursive restricted-field redaction before adapter append and an injected clock for deterministic timestamps; the foundation runtime uses the in-memory local adapter while durable retention remains in TG-27 |
| Frontend boundary | Request/response correlation adapter and redacted bounded 100-envelope/24-hour/10-breadcrumb queue with `sendDefaultPii=false` |

## Traceability

- Candidate pack: `v1.7.21-oidc-session-error-contracts`.
- Plan: TG-03B; NFR-002/004/006/008/010; API-017–020/024; ARCH-COMP-001/007; PR-001/006/008; FLOW-004.
- Test: TC-061/064/070/073 focused runtime evidence; TG-27 retains broader observability/alert/source-map refutation.
- Tracking IDs: N/A — none declared.

## CODE-1 Authoritative Slice Inventory

The slice fingerprint is the exact path set below; validation inventories only these owned surfaces, not the repository tree:

`backend/package.json`; `backend/src/app.ts`; `backend/src/server.ts`; `backend/src/platform/audit/**`; `backend/src/platform/observability/**`; `backend/src/shared/errors/index.ts`; `backend/src/shared/errors/error-observability.contract.test.ts`; `frontend/src/core/api/**`; `frontend/src/core/observability/**`; `frontend/vite.config.ts`; `package-lock.json`.

## CODE-3a Technique Evidence

| test_file | test_case | requirement | technique | observable_assertion |
|---|---|---|---|---|
| `backend/src/shared/errors/error-observability.contract.test.ts` | correlation boundary | API-024; PR-008 | BVA + equivalence partition | valid 1/64-char IDs echo; empty/65/invalid/duplicate forms are replaced |
| `backend/src/shared/errors/error-observability.contract.test.ts` | exporter unavailable | NFR-006 | Fault injection + BVA | response commits; 100 records buffer; 101st drops; recovery drains FIFO |
| `backend/src/shared/errors/error-observability.contract.test.ts` | audit/telemetry redaction and error attribution | ARCH-COMP-007 | Synthetic marker scan + contract assertion | restricted values are redacted before append/export and canonical runtime error code reaches telemetry |
| `backend/src/shared/errors/error-observability.contract.test.ts` | live composition and legacy-auth quarantine | ARCH-COMP-001; ADR-006 | Route probe + production/test-mode partition | health/meta and store gate are composed; dormant `/api/auth/login` remains unregistered; production defaults expose no test control |
| `backend/src/modules/identity/identity.contract.test.ts` | audit time seam | NFR-006/008 | Injected clock assertion | emitted Identity audit fact uses the supplied deterministic time exactly |
| `backend/src/shared/errors/error-observability.contract.test.ts` | key-provider adapter | NFR-004; API-024 | Fault injection + response partition | valid bounded key material resolves; unavailable or malformed dependency output fails closed with the canonical key error |

## Verification Evidence

| Check | Command | Result |
|---|---|---|
| Typecheck | `npm run typecheck` | PASS |
| Build | `npm run build` | PASS; configured internal-only 1.75 MiB chunk budget emits no advisory |
| Catalog freshness | `npm --workspace backend run errors:check` | PASS |
| Focused contracts | identity delivery + error/observability rerun | PASS — 31 tests, 0 failed |
| Coverage | focused identity-delivery + observability run | PASS — new config validator 94.44% line / 100% branch; delivery plugin 100% / 94.20%; `backend/src/app.ts` 100% line / 89.19% branch; audit 100% line/branch; observability 100% line / 97.06% branch. The changed fail-closed configuration and injected-clock logic exceed the ≥90% governed-logic threshold; unrelated composition alternatives remain outside that changed-logic denominator. |

Mutation testing is optional and was not run. No focused StrykerJS configuration exists; estimated setup and execution time is 15–25 minutes.
