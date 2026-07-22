---
status: IN_PROGRESS
version: v1
sprint: 1
phase: implement
sprint_id: sprint-v1
task_group: TG-02B
change_pack: v1.7.21-oidc-session-error-contracts
created: 2026-07-20
updated: 2026-07-20
---

# TG-02B — Backend Identity Delivery Evidence

> Completion remains pending commit/branch provenance and approval of change pack `v1.7.21-oidc-session-error-contracts`.

## Scope Result

Implemented API-017–020 over the reviewed TG-02 ports, added the pure fail-closed NFR-010 startup configuration contract, and replaced protected-route Bearer validation with opaque server-session and CSRF middleware. API-017/018 are public pre-session POST operations with JSON bodies; every success and error response emits `Cache-Control: no-store, private` and `Pragma: no-cache`, while replay safety remains enforced by the 10-minute one-time state and atomic single-consumer callback claim. The pre-cutover password/JWT source and `User`/`RefreshToken` schema remain dormant brownfield migration inventory per ADR-006; runtime composition imports/registers none of their route/password/token modules and exposes no local-token endpoint. Physical removal is outside this pack. Browser cutover is recorded separately by TG-02C; no schema, error generator, package manifest or composition root was authored in this slice.

| Contract | Implemented evidence |
|---|---|
| API-017 login | Explicit SPA POST only; safe same-origin `returnTo` body, `200 {authorizationUrl}`, opaque one-time state/nonce, PKCE S256 material, 10-minute persistence and mandatory no-store/no-cache headers |
| API-018 callback | POST body requires both `code` and `state`; atomic state consumption, nonce/MFA/absolute-expiry validation, `200 {returnTo}` plus opaque HttpOnly/SameSite cookie, commit-dependent recovery metadata, replay rejection and mandatory no-store/no-cache headers |
| API-019 logout | One direct 2-second IAM status request for ACTIVE sessions, no discovery/cache/retry, digest-based CSRF validation, local-only `allSessions=false` and monotonic session invalidation; repeated `LOGOUT` tombstone makes no IAM call |
| API-020 session | Local lifecycle → authoritative IAM → bounded activity refresh; ETag 200/304 contract; matching 304 performs no CSRF decrypt or activity write |
| Protected middleware | Every unsafe existing protected route inherits session validation followed by CSRF validation before its handler |
| Failure separation | IAM uncertainty `SERVICE_UNAVAILABLE`; key failure `KEY_PROVIDER_UNAVAILABLE`; store failure `SESSION_STORE_UNAVAILABLE`; inactive/expired session `AUTH_REQUIRED` |
| Startup configuration | All seven exact NFR-010 numeric values and two distinct canonical Secret Manager references are required; missing/non-canonical values fail before runtime composition |

## Traceability

- Candidate pack: `v1.7.21-oidc-session-error-contracts`.
- Plan: TG-02B; NFR-002/004/010; API-017–020/024; ADR-006 public pre-session POST contract; ARCH-COMP-001; SEQ-001; FLOW-004.
- Test: TC-065 and TC-068 focused delivery evidence; TG-26 retains broader integrated security refutation.
- Tracking IDs: N/A — none declared.

## CODE-1 Authoritative Slice Inventory

The slice fingerprint is the exact path set below; validation inventories only these owned surfaces, not the repository tree:

`backend/src/auth/**`; `backend/src/modules/identity/application/**`; `backend/src/modules/identity/delivery/**`; `backend/src/modules/identity/config.ts`; `backend/src/modules/identity/infrastructure/http-central-iam-adapter.ts`; `backend/src/modules/identity/index.ts`; `backend/src/modules/identity/identity.contract.test.ts`.

## CODE-3a Technique Evidence

| test_file | test_case | requirement | technique | observable_assertion |
|---|---|---|---|---|
| `backend/src/modules/identity/identity.contract.test.ts` | login/callback/replay | API-017/018; ADR-006 | State transition + negative partition | valid callback creates one session; replay fails; cookie contains approved attributes; login/callback success, validation failure and replay all emit exact no-store/no-cache headers |
| `backend/src/modules/identity/identity.contract.test.ts` | session 200/304 | API-020; SEQ-001 | Decision table + spy | matching current ETag returns empty 304 with zero decrypt/activity write |
| `backend/src/modules/identity/identity.contract.test.ts` | IAM/key/store outcomes | API-019/020/024 | Fault injection | each dependency failure maps to its distinct canonical 503; IAM uncertainty leaves revision unchanged |
| `backend/src/modules/identity/identity.contract.test.ts` | logout/CSRF/global/repeated | API-019 | Negative security partition + state transition | global logout is rejected; missing/wrong CSRF fails before invalidation; repeated local logout remains idempotent with 200 and never exposes a session 404 |
| `backend/src/modules/identity/identity.contract.test.ts` | callback post-claim dependency failure | API-018; SEQ-001 | Fault injection + state transition | IAM/key/store dependency failure creates no session and returns `recovery_action=RESTART_LOGIN`; token/claim/unexpected non-dependency errors never receive that action; callback replay remains rejected |
| `backend/src/modules/identity/identity.contract.test.ts` | route throttles | API-017–020 | BVA + token-bucket state | burst boundary succeeds and the next request returns 429 with matching body/header retry delay |
| `backend/src/modules/identity/identity.contract.test.ts` | Central IAM discovery/PKCE/JWKS/status | ADR-006; SEQ-001 | Contract + decision table + fault injection | login discovery retries only safe GETs; authorize/token fields are complete; RS256 issuer/audience/expiry failures reject; cold protected-status lookup calls the configured status endpoint once without discovery |
| `backend/src/modules/identity/identity.contract.test.ts` | NFR-010 configuration | NFR-010 | BVA + missing/invalid partition | exact values map to milliseconds/cache behavior; each missing/non-canonical value, invalid key reference and equal key IDs fail startup resolution |
| `backend/src/modules/identity/identity.contract.test.ts` | shared route guard | US-001–010; API-024 | Handler spy | auth/CSRF rejection invokes no protected business handler |
| `backend/src/modules/identity/identity.contract.test.ts` | corrupt actor/MFA persisted projection | ENT-023; API-020/024 | Corruption injection + dependency spies | unknown actor keys or invalid MFA assurance return `SESSION_CLAIMS_INVALID`; IAM status and activity persistence both remain at zero calls |

## Verification Evidence

| Check | Command | Result |
|---|---|---|
| Typecheck | `npm run typecheck` | PASS |
| Focused contract | `node --import tsx --test backend/src/modules/identity/identity.contract.test.ts` | PASS — 22 tests, 0 failed |
| Identity integration | contract + persistence files | PASS — 27 tests, 0 failed |
| Identity + observability focused rerun | identity delivery + runtime observability suites | PASS — 31 tests, 0 failed |
| Identity coverage | contract + persistence coverage run | PASS — identity service 99.11% line / 92.44% branch; delivery plugin 100% / 92.42%; rate limiter 100% / 100%; Central IAM adapter 100% / 91.25%; Prisma repositories 100% / 92.45% |
| Build | `npm run build` | PASS; configured internal-only 1.75 MiB chunk budget emits no advisory |

Mutation testing is optional and was not run. No focused StrykerJS configuration exists; estimated setup and execution time is 15–25 minutes.
