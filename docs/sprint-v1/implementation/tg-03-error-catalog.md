---
status: IN_PROGRESS
version: v1
sprint: 1
phase: implement
sprint_id: sprint-v1
task_group: TG-03
change_pack: v1.7.21-oidc-session-error-contracts
created: 2026-07-19
updated: 2026-07-20
---

# TG-03 — Canonical Error Catalog Generation Evidence

> Completion remains pending commit/branch provenance and approval of change pack `v1.7.21-oidc-session-error-contracts`.

## Scope Result

Implemented canonical `backend/errors.yml`, a deterministic build-time generator, generated TypeScript metadata/`ErrorCode`, generated OpenAPI response components and isolated catalog contract tests. The catalog contains 111 active codes and API-001–023 mappings, then applies the candidate API-024 protected-route inheritance and identity overrides. Runtime adapters, Fastify composition, manifests and Compose remain TG-03B work.

| Contract | Public surface | Evidence |
|---|---|---|
| Typed catalog | `ERROR_METADATA`, `ErrorCode` | Every code has HTTP, `message_key`, `retryable`, retry detail, category and condition metadata; API-018 dependency codes additionally declare the allowed `RESTART_LOGIN` recovery enum |
| Endpoint mappings | `ENDPOINT_ERROR_CODES` | Per-endpoint status/code resolution plus protected `AUTH_REQUIRED`, `SERVICE_UNAVAILABLE`, `SESSION_STORE_UNAVAILABLE` inheritance |
| Identity failure meanings | generated TypeScript/OpenAPI | API-017–020 preserve distinct service/key/store 503 outcomes; API-019 omits key failure; API-020 includes it |
| Deprecated alias rejection | generator validation | `IAM_UNAVAILABLE` and `IAM_OR_SESSION_STORE_UNAVAILABLE` cannot become active code or endpoint output |
| Deterministic/stale-safe generation | `generateErrorCatalogFiles` and CLI | Byte-identical outputs, isolated staging, transactional backup/commit/rollback across both outputs, missing or stale output fails check mode |

`errors.yml` uses the JSON-compatible YAML 1.2 subset. This keeps the catalog a valid YAML artifact while avoiding a new parser dependency/manifest change that belongs exclusively to TG-03B.

## Traceability

- Candidate pack: `v1.7.21-oidc-session-error-contracts`.
- Plan: TG-03; NFR-006/008; API-024; ADR-008; PR-008.
- Test: TC-061/064/070/073 partial catalog/generator evidence. TG-03B/TG-27 retain live routing, correlation, telemetry and exporter evidence.
- Tracking IDs: N/A — none declared.

## CODE-1 Authoritative Slice Inventory

The slice fingerprint is the exact path set below; validation inventories only these owned surfaces, not the repository tree:

`backend/errors.yml`; `backend/scripts/generate-errors.ts`; `backend/src/shared/errors/generator.ts`; `backend/src/shared/errors/generated.ts`; `backend/src/shared/errors/openapi.generated.json`; `backend/src/shared/errors/error-catalog.contract.test.ts`.

## CODE-3a Technique Evidence

| test_file | test_case | AC/requirement | technique | observable_assertion |
|---|---|---|---|---|
| `backend/src/shared/errors/error-catalog.contract.test.ts` | deterministic generation/stale check | PR-008; TC-070 | Round-trip + state transition | Two generations are byte-identical; check passes only for current outputs; canonical input remains byte-identical |
| `backend/src/shared/errors/error-catalog.contract.test.ts` | second-output commit failure | PR-008; TC-070 | Fault injection + rollback state transition | a synthetic failure after the first staged commit restores both prior outputs byte-for-byte and exposes no partial generated state |
| `backend/src/shared/errors/error-catalog.contract.test.ts` | API-024 inheritance/503 separation | API-024 | Decision table | API-019 resolves service/store only; API-020 resolves key/service/store; each 503 has bounded positive retry metadata |
| `backend/src/shared/errors/error-catalog.contract.test.ts` | invalid catalog matrix | TC-070 | Equivalence partition + fault injection | Missing metadata, duplicate, status drift, deprecated alias, retry drift and synthetic marker all fail before output exists |
| `backend/src/shared/errors/error-catalog.contract.test.ts` | `[PBT]` duplicate codes | catalog uniqueness invariant | Seeded property-based validation | 100 generated duplicate positions using seed `20260719` all reject |
| `backend/src/shared/errors/error-catalog.contract.test.ts` | schema/inheritance decision rows | API-024/PR-008 | Decision table | Invalid version, shape, naming, category, retry, endpoint and inheritance references reject deterministically |

## Verification Evidence

| Check | Command | Result |
|---|---|---|
| Generated output freshness | `node --import tsx backend/scripts/generate-errors.ts --check` | PASS |
| Typecheck | `npm run typecheck` | PASS |
| Focused test | `node --import tsx --test backend/src/shared/errors/error-catalog.contract.test.ts` | PASS — 7 tests, 0 failed; property run 100 cases |
| Coverage | `node --experimental-test-coverage --import tsx --test backend/src/shared/errors/error-catalog.contract.test.ts` | PASS — all reported files 97.30% line / 97.80% branch; generator 99.43% line / 97.50% branch |
| Build | `npm run build` | PASS; existing frontend chunk-size advisory remains outside TG-03 |
| Patch hygiene | `git diff --check` | PASS |

Mutation testing is optional and was not run. A focused StrykerJS setup is not present; estimated setup plus execution time is 15–25 minutes.
