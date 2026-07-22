---
status: IN_PROGRESS
version: v1
sprint: 1
phase: implement
sprint_id: sprint-v1
task_group: TG-02C
change_pack: v1.7.21-oidc-session-error-contracts
created: 2026-07-20
updated: 2026-07-20
---

# TG-02C — Browser Session Cutover Evidence

> Completion remains pending commit/branch provenance and approval of change pack `v1.7.21-oidc-session-error-contracts`.

## Scope Result

The Vue public root auth shell now receives Central-IAM `code/state` at SCREEN-009 route `/auth/callback` before any session exists; it does not mount `ProtectedLayout` or protected content. It submits API-018 exactly once as a JSON-body POST through the shared credentialed Axios client without router/link prefetch and navigates to a validated same-origin `returnTo` only on success. After the one permitted pre-claim retry fails, `Quay lại đăng nhập` clears callback/retry/error state with zero network request; the next ordinary, explicitly activated login POSTs API-017 with `returnTo=/`, receives `authorizationUrl`, then navigates without reusing stale route/callback input. Post-claim and malformed-contract recovery discard callback context and start API-017 only with fixed `returnTo=/`; a non-API-018 `RESTART_LOGIN` value is non-actionable. It restores API-020 through cookie credentials, keeps CSRF only in memory, sends it only on unsafe requests, clears it on 401/logout, and initiates API-017 for login. DS-COMP-012 distinguishes the bounded pre-claim Axios callback retry, post-claim fresh API-017 recovery and fail-closed malformed-contract recovery across all seven specified states. Project selection may remain in local storage, but no bearer, refresh, session selector or CSRF credential is persisted there.

## Traceability

- Plan: TG-02C; API-017–020; PR-001; NFR-004/008/010; SCREEN-009; DS-COMP-012.
- Test: TC-065, TC-068, TC-072 and the focused browser/Playwright contracts.
- Candidate pack: `v1.7.21-oidc-session-error-contracts`.

## CODE-1 Authoritative Slice Inventory

The slice fingerprint is the exact path set below; validation inventories only these owned surfaces, not the repository tree:

`frontend/src/core/auth/**`; `frontend/src/main.ts`; `frontend/src/router/**`; `frontend/src/services/api.ts`; `frontend/src/stores/session.ts`; `frontend/src/views/auth/**`; `tests/e2e/callback-recovery.config.ts`; `tests/e2e/callback-recovery.spec.ts`; `docs/evidence/accessibility/TC-072/**`.

## CODE-3a Technique Evidence

| test_file | test_case | requirement | technique | observable_assertion |
|---|---|---|---|---|
| `frontend/src/core/auth/session.contract.test.ts` | cookie and memory-only credential boundary | US-001; API-017–020; PR-001 | Executable request-policy partition plus source secret scan | Request interceptor injects request-local CSRF only for unsafe methods; bearer/refresh/session/CSRF credentials are absent from browser persistence calls |
| `frontend/src/core/auth/session.contract.test.ts` | API-020 restore branches | API-020 | Executable decision table + state transition | 200 accepts the complete actor/CSRF projection; matching 304 preserves the prior session; 401 expires it |
| `frontend/src/core/auth/session.contract.test.ts` | post-claim restart | API-017/018; DS-COMP-012 | Executable decision table + boundary | only matching 503 body/header retry metadata exposes `RESTART_LOGIN`; the CTA starts fresh API-017 and never reuses callback input |
| `frontend/src/core/auth/session.contract.test.ts` | pre-claim retry classification | API-018/024; DS-COMP-012 | Endpoint/security partition + BVA | only the exact same-origin API-018 callback with equal positive body/header delay exposes retry; protected-route and cross-origin 503 responses do not |
| `frontend/src/core/auth/session.contract.test.ts` | SPA callback handoff | API-018; ADR-006 | Request/return-path partition | code/state uses a credentialed Axios POST body and never the API URL; success accepts a safe relative return path and rejects absolute, scheme-relative, backslash and non-string targets |
| `frontend/src/core/auth/callback-recovery.contract.test.ts` | seven recovery transitions | DS-COMP-012; MSG-046/047/048 | State transition + action spy | Waiting reaches Ready; pre-claim failure reaches Exhausted and cannot invoke callback twice; post-claim/malformed recovery uses only fresh API-017 |
| `frontend/src/core/auth/callback-recovery.contract.test.ts` | lifecycle/router integration | DS-COMP-012; API-017–020 | Router spy + concurrency state | pre-claim and post-claim handlers route to LoginView with only their permitted state/return target; concurrent expiry redirects are coalesced |
| `frontend/src/core/auth/callback-recovery.contract.test.ts` | injected countdown scheduler | DS-COMP-012; NFR-008 | Deterministic scheduler seam | both countdowns advance synchronously without wall-clock sleep and clear scheduled work at Ready |
| `tests/e2e/callback-recovery.spec.ts` | seven rendered recovery states | TC-072; DS-COMP-012 | Browser rendering + focus/action assertion | every stable hook renders with heading focus and correct CTA disabled/enabled state; screenshots and focus logs are retained under `docs/evidence/accessibility/TC-072/` |
| `tests/e2e/callback-recovery.spec.ts` | public callback handoff | API-018; ADR-006; SCREEN-009 | Browser network interception + navigation assertion | `/auth/callback` renders `auth-callback-processing` outside `ProtectedLayout`, POSTs exact code/state to API-018 exactly once without prefetch or query leakage, and follows the validated relative `returnTo` |
| `tests/e2e/callback-recovery.spec.ts` | post-claim/malformed CTA | API-017/018; DS-COMP-012 | Browser click + network refutation | both CTAs send only `returnTo=/`; stale callback code/state never reaches API-017 |
| `tests/e2e/callback-recovery.spec.ts` | pre-claim exhausted clear-to-login | API-017/018; DS-COMP-012 | Browser click + zero-call/safe-next-call refutation | exhausted CTA performs zero network request and clears recovery; the next ordinary login sends only `returnTo=/` with no stale code/state |

## Verification Evidence

| Check | Command | Result |
|---|---|---|
| Browser contracts | `node --import tsx --test frontend/src/core/auth/session.contract.test.ts frontend/src/core/auth/callback-recovery.contract.test.ts` | PASS — 20 tests, 0 failed |
| SCREEN-009 + DS-COMP-012 Playwright | start Vite on `127.0.0.1:5174` with an explicit empty temporary `VITE_ENV_DIR`, then run `CALLBACK_E2E_BASE_URL=http://127.0.0.1:5174 npx playwright test --config=tests/e2e/callback-recovery.config.ts`; stop Vite afterward | PASS — SCREEN-009 login-entry/processing/invalid public-shell states, focused invalid heading, exact-one POST callback request, 7 recovery states, 2 fixed-landing CTA refutations and pre-claim exhausted zero-call/safe-next-login refutation (12 tests), 0 failed; 10 screenshots and seven recovery focus logs retained |
| Frontend typecheck | `npm --workspace frontend run typecheck` | PASS |
| Focused coverage | `node --experimental-test-coverage --import tsx --test frontend/src/core/auth/session.contract.test.ts frontend/src/core/auth/callback-recovery.contract.test.ts` | PASS — runtime lines: API client 96%, correlation 100%, auth lifecycle 92.68%, auth messages 92%, callback recovery 93.02%, API service 100%, session store 99.02%; all governed runtime branches ≥92.50%; aggregate 98.76% line / 95.73% branch |
| Production build | `npm --workspace frontend run build` | PASS — configured internal-only 1.75 MiB chunk budget emits no advisory |

The tests execute the request/session decision functions, refute bearer/credential persistence, assert cookie credentials and memory-only CSRF, exercise the real SPA→Axios API-018 handoff, pin one pre-claim callback retry versus fresh post-claim login, and exercise the actual Vue route/view for every DS-COMP-012 state. Malformed-contract navigation failure stays on `auth-callback-recovery-invalid`; `auth-restart-error` remains post-claim only.
