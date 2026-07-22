---
status: IN_PROGRESS
version: v1
sprint: 1
phase: implement
sprint_id: sprint-v1
task_group: TG-02
change_pack: v1.7.21-oidc-session-error-contracts
created: 2026-07-19
updated: 2026-07-20
---

# TG-02 — Identity Persistence And Cryptography Evidence

> Completion remains pending commit/branch provenance and approval of change pack `v1.7.21-oidc-session-error-contracts`.

## Scope Result

Implemented the candidate ENT-022/023 MySQL schema/migration, Identity domain ports, Prisma repository adapters, selector hashing and AES-256-GCM adapter. Prisma validation now copies only `schema.prisma` into an ephemeral directory and supplies a synthetic URL explicitly, so the check does not load repository environment files. No auth HTTP route, browser cutover, composition-root or package-manifest surface was changed; those remain TG-02B/TG-03B work.

| Contract | Public surface | Evidence |
|---|---|---|
| One-time OIDC state | `OidcLoginStateRepository` | Exact 10-minute expiry; atomic unexpired/unconsumed claim; concurrent claim has one winner; transaction failure restores unconsumed state |
| Server session lifecycle | `AuthSessionRepository` | Absolute expiry, idle `>15m`, activity write `>=60s`, revision increment once per window and monotonic invalidation |
| Recoverable protected values | `IdentityKeyPort`, `Aes256GcmIdentityKeyAdapter` | AES-256-GCM with 32-byte key, unique/injected 12-byte nonce, 16-byte tag and persisted key ID |
| Selector protection | `sha256` | State, nonce, session and CSRF comparison selectors persist only as 32-byte digests |
| Failure separation | `IdentityKeyProviderUnavailableError`, `IdentitySessionStoreUnavailableError` | Key failures use `KEY_PROVIDER_UNAVAILABLE`; repository failures use `SESSION_STORE_UNAVAILABLE` |
| Prisma runtime portability | generated client binary targets | Linux OpenSSL 1.1 and 3.0 engines are generated explicitly in addition to native, so the Compose build cannot replace the host-compatible engine set |

TG-02B integration tightened the public repository seam without changing storage shape: `resolve` performs local lifecycle checks without an activity write, while `refreshActivity` runs only after authoritative IAM returns `ACTIVE`. This preserves SEQ-001 fail-closed behavior: IAM uncertainty cannot mutate session activity or revision.

## Traceability

- Candidate pack: `v1.7.21-oidc-session-error-contracts`.
- Plan: TG-02; NFR-002/004/010; API-017–020/024; ENT-022/023; PR-001; FLOW-004.
- Test: TC-065 and TC-068 partial persistence/crypto evidence. TG-02B, TG-03B and TG-26 still own route, live dependency and browser security refutation.
- Design: N/A — persistence and cryptography foundation only.
- Tracking IDs: N/A — none declared.

## CODE-1 Authoritative Slice Inventory

The slice fingerprint is the exact path set below; validation inventories only these owned surfaces, not the repository tree:

`backend/prisma/schema.prisma`; `backend/prisma/migrations/202607190001_identity_session/**`; `backend/scripts/validate-prisma-schema.ts`; `backend/src/modules/identity/domain/**`; `backend/src/modules/identity/infrastructure/identity-crypto.ts`; `backend/src/modules/identity/infrastructure/prisma-identity-repositories.ts`; `backend/src/modules/identity/identity.persistence.integration.test.ts`.

## CODE-3a Technique Evidence

| test_file | test_case | AC/requirement | technique | observable_assertion |
|---|---|---|---|---|
| `backend/src/modules/identity/identity.persistence.integration.test.ts` | AES-GCM round-trip/tamper/key failure | NFR-004; ENT-022/023 | Round-trip + negative security partition | Plaintext recovers only with matching key/tag; malformed nonce/tag/key and provider outage return the exact key-provider failure |
| `backend/src/modules/identity/identity.persistence.integration.test.ts` | ENT-022 exact TTL/claim concurrency/rollback | ENT-022; TC-065 | BVA + race/state transition | `10m-1ms` is claimable, exactly `10m` is expired, two claims have one winner, failed transactional read leaves `consumedAt=null` |
| `backend/src/modules/identity/identity.persistence.integration.test.ts` | ENT-023 idle boundaries | ENT-023; TC-065 | BVA | `15m-1ms` and `15m` stay valid; `15m+1ms` invalidates as `IDLE_TIMEOUT` |
| `backend/src/modules/identity/identity.persistence.integration.test.ts` | ENT-023 activity boundaries | ENT-023; NFR-010 | BVA + state transition | `59,999ms` does not write; `60,000ms` and `60,001ms` write once and increment revision once |
| `backend/src/modules/identity/identity.persistence.integration.test.ts` | expiry/invalidation/store outage | API-024; TC-065 | Decision table + fault injection | Absolute expiry fails closed; invalidation is monotonic; repository outage remains `SESSION_STORE_UNAVAILABLE` |

The focused adapter integration harness exercises the production Prisma repository classes through a transaction-capable deterministic Prisma seam. The safe Prisma wrapper covers generated client/schema compatibility from an ephemeral schema copy with an explicit synthetic connection string and a temporary working directory. Live MySQL, route and Compose evidence is intentionally deferred to the candidate TG-03B/TG-26 integration owners.

## Verification Evidence

| Check | Command | Result |
|---|---|---|
| Prisma schema | `npm --workspace backend run prisma:validate` | PASS |
| Typecheck | `npm run typecheck` | PASS |
| Focused test | `node --import tsx --test backend/src/modules/identity/identity.persistence.integration.test.ts` | PASS — 5 tests, 0 failed |
| Coverage | `node --experimental-test-coverage --import tsx --test backend/src/modules/identity/identity.persistence.integration.test.ts` | PASS — all reported files 99.71% line / 94.52% branch; runtime adapter files ≥99.09% line / ≥91.67% branch |
| Build | `npm run build` | PASS; existing frontend chunk-size advisory remains outside TG-02 |
| Post-integration identity suite | `node --import tsx --test backend/src/modules/identity/identity.contract.test.ts backend/src/modules/identity/identity.persistence.integration.test.ts` | PASS — 27 tests, 0 failed; IAM uncertainty and corrupt actor/MFA no-write assertions included |
| Patch hygiene | `git diff --check` | PASS |
| Scoped marker scan | runtime/schema/generator paths | PASS — zero private-key/bearer/client-secret assignment matches |

Mutation testing is optional and was not run. A focused StrykerJS setup is not present; estimated setup plus execution time is 15–25 minutes.
