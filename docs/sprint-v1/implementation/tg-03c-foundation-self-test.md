---
status: IN_PROGRESS
version: v1
sprint: 1
phase: implement
sprint_id: sprint-v1
task_group: TG-03C
change_pack: v1.7.21-oidc-session-error-contracts
created: 2026-07-20
updated: 2026-07-20
---

# TG-03C — CODE-10 Foundation Self-Test Evidence

> Completion remains pending commit/branch provenance and approval of change pack `v1.7.21-oidc-session-error-contracts`.

## Scope Result

The isolated five-service harness contains four long-running services—MySQL 8.4, IAM fake, key-provider fake and backend—plus the profile-gated one-shot self-test. The runner covers the login/session/logout happy path and distinct IAM/key/store 503 paths. Every dependency 503 is passed through an extracted, unit-covered response-contract assertion that checks bounded body/header equality, correlation and recursive protected-payload absence. `up --wait` intentionally excludes the profile-gated runner; `--profile self-test run --rm foundation-self-test` is the required second command. All runtime values are inline synthetic non-secrets; protected repository configuration files are bind-masked with `/dev/null`. Root and backend `node_modules` are executable UID/GID-aligned `tmpfs` mounts, so container `npm ci`/Prisma generation cannot modify the bind-mounted host dependency tree and disappears with the container.

## Traceability

- Plan: TG-03C; CODE-10; NFR-002/004/006/008/010; API-017–020/024.
- Test: TC-065, TC-068, TC-070 and TC-073.
- Candidate pack: `v1.7.21-oidc-session-error-contracts`.

## CODE-1 Authoritative Slice Inventory

The slice fingerprint is the exact path set below; validation inventories only these owned surfaces, not the repository tree:

`backend/scripts/self-test-foundation.ts`; `backend/scripts/foundation-response-contract.ts`; `backend/scripts/foundation-response-contract.test.ts`; `backend/test/compose/foundation.compose.yml`; `backend/test/compose/config/foundation.env.example`; `backend/test/compose/fixtures/**`.

## CODE-3a Technique Evidence

| test_file | test_case | requirement | technique | observable_assertion |
|---|---|---|---|---|
| `backend/scripts/self-test-foundation.ts` | happy login/session/logout | API-017–020; CODE-10 | Docker SIT + state transition | real HTTP flow crosses IAM fake, backend and MySQL; API-018 returns `200 {returnTo}` + cookie, CSRF logout succeeds and response correlation is present |
| `backend/scripts/self-test-foundation.ts` | IAM/key/store dependency outcomes | API-024; FLOW-004 | Fault injection + decision table | each dependency control returns the distinct 503 code and delegates to the same response-contract assertion |
| `backend/scripts/foundation-response-contract.test.ts` | dependency response invariant | API-024; CODE-10 | BVA + negative partition + recursive leak injection | retry detail/header are equal integers in `[1,86400]`; missing/unequal/out-of-range values and nested actor/CSRF/session/callback fields reject |
| `backend/test/compose/foundation.compose.yml` | profile-gated one-shot topology | CODE-10 | Configuration/topology assertion | four long-running services reach health before the explicit fifth-service self-test command; cleanup removes project resources |

## Verification Evidence

| Check | Command | Result |
|---|---|---|
| Compose syntax | `docker compose --env-file /dev/null -p api-lab-foundation -f backend/test/compose/foundation.compose.yml config` | PASS |
| Response-contract unit tests | `node --import tsx --test backend/scripts/foundation-response-contract.test.ts` | PASS — 4 tests, 0 failed |
| Response-contract coverage | `node --experimental-test-coverage --import tsx --test backend/scripts/foundation-response-contract.test.ts` | PASS — helper 100% line / 93.75% branch; aggregate 100% line / 95.45% branch |
| Compose health | explicit four-service `up --build --wait` command from the Plan, using `--env-file /dev/null` | PASS — four long-running services healthy |
| One-shot contract | explicit profile-gated `run --rm foundation-self-test` command from the Plan, using `--env-file /dev/null` | PASS — happy plus IAM/key/store cases |
| Cleanup | `down -v --remove-orphans` plus container/volume assertions | PASS — no project resources remain |
| Host dependency isolation | SHA-256 over root shims/package metadata plus backend Prisma client before and after the complete Compose cycle | PASS — fingerprint `03fa34202e8c80dc1754ffd1d33cb459e4da64bd9f8216172a80fc7de7fb6670` unchanged; post-Compose typecheck, frontend/backend builds and 10/10 callback Playwright cases pass without dependency repair |

The one-shot runner's argument parsing, real-network orchestration and cleanup shell are covered by the Compose execution rather than synthetic unit mocks. All extracted response-validation logic remains inside the measured unit-coverage scope; no validation branch is excluded.

The fixture initializes only identity/session and shell-project tables so this pack does not absorb unrelated legacy full-schema work.
