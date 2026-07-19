---
status: COMPLETED
version: v1
sprint: 1
phase: implement
sprint_id: sprint-v1
task_group: TG-01
created: 2026-07-19
updated: 2026-07-19 17:35
---

# TG-01 — Shared Contracts Implementation Evidence

## Scope Result

Implemented the caller-owned `UnitOfWork`, idempotency coordination, workflow-impact, masked response-schema and signed address-manifest ports declared by TG-01. The change adds no HTTP route, database schema, external integration or feature behavior.

| Contract | Public surface | Evidence |
|---|---|---|
| Caller-owned transaction; no nested transaction | `CallerOwnedUnitOfWork`, `UnitOfWork` | Nested execution rejects with `NESTED_UNIT_OF_WORK`; module commands receive the caller token |
| Keyed mutation replay | `IdempotencyCoordinator`, `StandardIdempotencyCoordinator` | Same actor/route/key/hash replays the committed status/body/resource ID without invoking the handler |
| Idempotency conflict and bounds | `IdempotencyKeyReusedError`, `IdempotencyResponseTooLargeError` | Different hash rejects; 65,536 bytes commits; 65,537 bytes rolls back; TTL boundary is 24 hours |
| Workflow dependency impact | `WorkflowImpactService` | Disable command requires a caller-supplied `UnitOfWork` |
| Validation response fields | `ExecutionResponseSchemaReader` | Port returns authorized masked field projections only |
| Signed network approval | `ApprovedAddressSetRegistry` | Exact approval-ref/Host/Environment/CIDR-hash request and verified CIDRs/manifest version; failure is represented fail-closed |

## Traceability

- Plan: TG-01; `NFR-003/004`; `API-004–007/009/011/021/022`; `PR-002/004/005/008`.
- Architecture: ADR-001/004; ARCH-COMP-002/004/005; SEQ-001/005; ENT-015.
- Approved Test reconciliation: `TC-061` module-boundary contract and `TC-067` 24-hour/65,536-byte idempotency boundaries.
- Design: N/A — infrastructure contracts only.
- Tracking IDs: N/A — none declared for TG-01.

## CODE-3a Technique Evidence

| test_file | test_case | AC/requirement | technique | observable_assertion |
|---|---|---|---|---|
| `backend/src/modules/execution/application/idempotency/shared-contracts.contract.test.ts` | `rejects a nested transaction and keeps the outer transaction usable` | TG-01 caller-owned transaction; SEQ-001/005 | State transition + negative contract test | Nested execution returns `NESTED_UNIT_OF_WORK`; outer/current token remains unchanged and clears after completion |
| same | `replays the committed original response without invoking the handler again` | TG-01 DOD; API package-wide idempotency contract | Decision table: new vs identical replay | Second call returns the original response and handler call count remains one |
| same | `rejects reuse with a different request hash before invoking the handler` | API `IDEMPOTENCY_KEY_REUSED` | Equivalence partition: same key/different payload | Error code is exact and conflicting handler call count remains zero |
| same | `accepts exactly 65536 UTF-8 bytes and rolls back all writes at 65537 bytes` | NFR-003; API response ceiling; TC-067 | Boundary value analysis + rollback state transition | Exact boundary commits; boundary+1 returns exact error and neither domain nor idempotency write commits |
| same | `expires a replay record at the exact 24-hour boundary` | NFR-003; ENT-015 TTL; TC-067 | Boundary value analysis with controllable clock | `24h-1ms` replays; exactly `24h` executes again |
| same | `[PBT] replays a deterministic corpus of JSON values without semantic drift` | Idempotent response serializer/parser invariant | Property-based deterministic generated corpus | For 40 nested/unicode/null/numeric bodies, replay is structurally equal and handler executes once |
| same | `expose masked response schemas and caller-transaction workflow impact only` | ARCH-COMP-004/005; PR-004/005 | Cross-module public contract test | Masked field projection is returned through Execution index; impact command observes the exact caller token |
| same | `requires exact signed-manifest evidence and represents fail-closed verification` | NFR-004; PR-002; API-002 | Decision table: exact match vs mismatch | Exact tuple returns pinned CIDRs/version; mismatched approval ref rejects with `MISMATCH` |

Integration surface: the final two cases import only module public `index.ts` entrypoints and exercise cross-module port interoperability. No database/service integration applies because TG-01 deliberately contains contracts and deterministic fakes only; Prisma implementations begin in downstream task groups.

## Verification Evidence

| Check | Command | Result |
|---|---|---|
| Typecheck | `npm --workspace backend run typecheck` | PASS |
| Build | `npm --workspace backend run build` | PASS |
| Contract tests + coverage | `node --experimental-test-coverage --import tsx --test backend/src/modules/execution/application/idempotency/shared-contracts.contract.test.ts` | PASS — 8 tests, 0 failed; all reported files 97.09% line / 100% branch; changed runtime coordination files 100% line / 100% branch |
| Patch hygiene | `git diff --check` | PASS |

Mutation testing is optional and was not run. A focused StrykerJS setup is not present in the repository; estimated setup plus run time is 10–20 minutes.
