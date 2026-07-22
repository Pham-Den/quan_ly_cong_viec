---
status: DRAFT
base_sprint: v1
change_pack: v1.7.21-oidc-session-error-contracts
source_phase: architecture
impacted_phases: [design, architecture, plan, test, implement]
created: 2026-07-19 19:30
updated: 2026-07-20 16:20
approved_by:
---

# Change Request — v1.7.21-oidc-session-error-contracts

## 1. Summary

Unblock TG-02 and TG-03 by completing the approved identity persistence and generated-error contracts. The pack adds durable MySQL OIDC login-state and server-session entities, standardizes authoritative-IAM uncertainty as `503 SERVICE_UNAVAILABLE`, preserves distinct `503 KEY_PROVIDER_UNAVAILABLE` and `503 SESSION_STORE_UNAVAILABLE` conditions, and opens the exact Plan ownership zones required to implement persistence, runtime cutover, local self-test and `backend/errors.yml` generation surfaces.

## 2. Why This Change Exists

The TG-02 and TG-03 pre-code contract gates found two delivery-blocking contradictions in approved effective truth:

1. ADR-006 and API-017–020 require one-time state, PKCE, absolute/idle session validation and atomic activity/invalidation behavior, but ERD v1 contains no durable identity entity or explicit non-ERD store contract.
2. SEQ-001 and ADR-006 require a typed `503` for uncertain authoritative IAM status, while ARCH-COMP-001 says `401/403` and API-019/020 catalog only session-store failure.
3. PR-008 and API Specs require canonical `backend/errors.yml` generation, but TG-03 cannot create the catalog, generator or manifest changes within its approved ownership boundary.

At pack creation, no implementation had been attempted against these gaps. The pack corrected the contracts before code generation instead of permitting invented schema, errors or out-of-bound files; implementation then proceeded only through the six candidate-truth slices declared below.

## 3. Earliest Affected Phase

Design — API-018 introduces a user-visible post-claim dependency-failure recovery state with a bounded wait, fresh API-017 restart and consumed-callback prohibition. Architecture remains the source phase for the underlying persistence/API correction.

## 4. Current Downstream Phase

- Design: `APPROVED` — add explicit pre-claim retry and post-claim restart state/copy contracts.
- Architecture: `APPROVED` — absorb the architecture delta.
- Plan: `APPROVED` — expand TG-02/TG-03 ownership, test targets and validation commands.
- Test: `APPROVED` — refine TC-065 and TC-070 with exact persistence, expiry, error and generator assertions, and TC-072 with all DS-COMP-012 valid/malformed recovery states.
- Current downstream phase for this pack: Implement. TG-01 was already completed; TG-02/TG-02B/TG-02C and TG-03/TG-03B/TG-03C now have candidate implementation and runnable evidence, but remain `IN_PROGRESS` until branch/commit provenance is reconciled and this pack is approved. The normal implementation spec/quality and `approve implement` gates remain authoritative.

## 5. Scope Notes

- Product is not impacted. Design adds public SCREEN-009, `DS-COMP-012` and MSG-046/047/048 for the two valid API-018 dependency-failure boundaries plus malformed-contract fail-closed recovery. The public root auth shell, not `ApiLabWorkspaceShell`, permits one delayed same-callback retry only before claim commit and never mounts protected content. If that retry fails, `Quay lại đăng nhập` clears callback/retry/error state with zero network request; the next ordinary login starts API-017 with fixed `returnTo=/`. After claim commit or when API-018 retry metadata is unsafe, recovery starts fresh API-017 with fixed `returnTo=/` and never resubmits or derives navigation from the consumed callback. A recovery action on any non-API-018 response is non-actionable. Ordinary protected-route 503 retry remains separate.
- ADR-006 records API-017/018 as public pre-session POST operations: API-017 returns an authorization URL for explicit SPA navigation and API-018 accepts callback code/state in a JSON body. Both routes require no-store/no-cache headers on every outcome, explicit activation/validated callback input, no prefetch/speculative invocation, rate limits, one-time state and replay controls; ordinary GET APIs remain read-only/idempotent.
- OIDC login state uses MySQL/InnoDB with a 10-minute lifetime. State/nonce/token selectors are stored as hashes; the PKCE verifier is encrypted. A callback atomically consumes state before external token exchange, and the consumed row remains until expiry to reject replay deterministically.
- Server sessions use an opaque-cookie hash, CSRF comparison hash plus recoverable AES-256-GCM ciphertext, minimal actor/MFA projection, IAM-derived absolute expiry, 15-minute idle expiry, 60-second activity-write throttle, revision and explicit invalidation metadata. CSRF plaintext exists only in request-local memory; raw IAM tokens and full claims are never persisted.
- Authoritative IAM unavailability/uncertainty returns `503 SERVICE_UNAVAILABLE`, Identity key failure returns `503 KEY_PROVIDER_UNAVAILABLE`, and repository failure returns `503 SESSION_STORE_UNAVAILABLE`; each includes `Retry-After` on API-017–020/protected routes. Revoked/disabled/blocked/expired identity remains `401 AUTH_REQUIRED`.
- TG-03 owns `backend/errors.yml`, generator, generated TypeScript/OpenAPI and focused generator tests. TG-03B is the sole package-manifest/lockfile and live composition owner; TG-03C alone owns the Compose/self-test harness. Application modules consume generated exports through `backend/src/shared/errors/index.ts`.
- Implement absorption means the open lane executes six bounded slices against this selected candidate truth: TG-02/TG-02B/TG-02C and TG-03/TG-03B/TG-03C. Merge/closure remains prohibited until the pack is approved. Runnable runtime, coverage and CODE-10 evidence must never be fabricated; both pack-cycle and normal completion spec/quality gates remain mandatory after delivery.

## 6. Open Questions

None. The project owner selected all recommended options in one decision batch on 2026-07-19.

## Self-Review Checklist

- [x] Quality Contract refs satisfied: `DOC-1`, `DOC-2`, `DOC-3`, `LINK-1`, `LINK-2`, `ORB-1`, `ORB-2`
- [x] Base sprint, pack id, source phase, impacted phases and earliest affected phase are explicit
- [x] Root causes, exact downstream artifacts and implementation stop condition are traceable
- [x] No approval evidence, implementation result or runtime behavior is fabricated
