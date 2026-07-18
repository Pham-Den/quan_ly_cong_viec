# Channel-Specific TC Checklist

> Read the section corresponding to the channel of the module being tested. Skip sections that are not relevant.
> Skills reference: skill 05 (gen), skill 06 (SIT), skill 07 (review).

---

## Web UI

Applies when: the module has a user interface running in a browser.

### Session Management — mandatory for auth/session/login modules

- Logout → session cookie deleted, redirect to login page, protected route returns 302
- Refresh token → access token renewed without interrupting the user session
- Session idle timeout → expires after the configured idle period (read config/NFR)
- Concurrent session (same user, 2+ devices/browsers) → behavior per spec (allow/block/notify)
- Session isolation → logout on device A does not affect the session on device B

### Security Input — mandatory when the module has form input to an IdP/auth service

- SQL injection in username/password field → safe rejection, no DB error exposed
- XSS payload in input field → sanitized output, payload does not execute in browser
- Bruteforce protection → account lockout after N failed attempts (get N from config; if no config → test 5 attempts)
- Empty required field → validation message shown, no request sent
- Overly long input (>1000 chars) → handled gracefully, no crash

### Multi-IdP — when qa-config.test_accounts has multiple IdP entries

- Test happy path separately for each IdP (TCB, MAG, etc.) — at least 1 successful login TC per IdP
- Use real test accounts from `qa-config.yaml → test_accounts.idp` — do not use generic `user@company.com`
- If no real accounts exist in qa-config → write `[Needs real IdP account from team]` in Test Data
- Test domain-based entity detection if multiple IdPs share a similar domain pattern

### Form & UI State

- Browser back after submit → no duplicate request sent
- Page reload while filling form → form resets without crashing
- Tab/keyboard navigation through input fields — no required field is skipped

---

## API

Applies when: the module is a REST/GraphQL API with no UI.

### Auth & Headers

- Bearer token: valid → 200; expired → 401; malformed → 400/401; missing → 401
- API key: valid → 200; revoked → 401; wrong format → 400
- Rate limiting: normal request → 200; exceeds rate limit → 429 with Retry-After header
- CORS preflight (OPTIONS) → correct Access-Control-Allow-Origin for cross-origin callers

### Schema & Contract

- Response structure matches the expected schema — all required fields present with correct types
- Pagination: first page, last page, empty result — cursor/offset values are correct
- Backward compat: deprecated fields still returned in the response for older API versions
- Error response format is consistent (error code, message, traceId)

### Idempotency & Safety

- POST with the same idempotency-key → same response as the first call, no duplicate record created
- Concurrent identical requests → exactly 1 side effect in DB/event
- DELETE on already-deleted resource → 404 (not 200 a second time)

---

## Mobile

Applies when: the module is a native Android/iOS app.

### Native Behavior

- Biometric auth (fingerprint/face) → success flow; fallback to PIN/password when biometric fails
- Deep link / universal link → navigates to the correct screen with correct params passed
- Push notification → tap notification → navigates to the correct destination
- App background → foreground → session is still valid or re-auth is handled gracefully

### Device & Platform

- Offline mode → appropriate message displayed, no crash, no data loss
- Network switch (WiFi → Mobile data) → session not dropped, automatic retry
- Device rotation (portrait ↔ landscape) → UI layout intact, data not lost
- OS permission dialog (camera, location, notification) → both allow and deny are handled
- Low battery / low storage → app does not crash, warning displayed if needed