# OWASP Security Testing Checklist

> Skill 10 reads this file to apply security testing.
> Based on OWASP Top 10 2021 + OWASP Testing Guide v4.2.
> For each item: identify check points, techniques, and severity if an issue is found.

---

## OWASP Top 10 — 2021

### A01: Broken Access Control ⚠️ Most Common

**Description:** Users can perform actions beyond their authorised permissions.

**Checks:**
- [ ] Directly access a resource URL belonging to another user (IDOR — Insecure Direct Object Reference)
  - Example: `/api/orders/123` with an order belonging to another user → must return 403, not 200
- [ ] Modify role/permission values in the request (parameter tampering)
  - Example: send `role=admin` in the request body or query string
- [ ] Access admin pages without the required permission
  - Example: log in as a regular user, navigate to `/admin`, `/dashboard/settings`
- [ ] Perform actions using HTTP methods that are not permitted
  - Example: endpoint only allows GET but try DELETE/PUT
- [ ] JWT token: alter the payload (user_id, role) without a valid signature
- [ ] CORS: inspect response headers when sending a request from a different origin

**Severity if found:** S1 (Critical)

---

### A02: Cryptographic Failures

**Description:** Sensitive data is not encrypted, or is encrypted weakly.

**Checks:**
- [ ] Sensitive data (passwords, tokens, PII) transmitted over HTTP (not HTTPS)
- [ ] Passwords stored as plaintext or using MD5/SHA1 in the database
  - Check via API responses or error messages that leak hashes
- [ ] Tokens or API keys appearing in URLs (logged into server logs)
  - Example: `/reset-password?token=abc123` → token must be in the body/header
- [ ] Cookies missing the `Secure` and `HttpOnly` flags
  - Check: DevTools → Application → Cookies
- [ ] API responses returning unnecessary sensitive data
  - Example: returning `password_hash`, `ssn`, or a full `card_number` in the response

**Severity if found:** S1 (Critical)

---

### A03: Injection

**Description:** Malicious data is injected into an interpreter (SQL, OS, LDAP, etc.).

**Checks — SQL Injection:**
- [ ] Enter payloads in form fields or query parameters: `' OR '1'='1`, `'; DROP TABLE users--`
- [ ] Observe the response: does a SQL error appear? Is unexpected data returned?
- [ ] Time-based SQLi: `'; WAITFOR DELAY '0:0:5'--` (SQL Server) / `'; SELECT SLEEP(5)--` (MySQL)

**Checks — XSS (Cross-Site Scripting):**
- [ ] Enter into form inputs: `<script>alert(document.cookie)</script>`
- [ ] Stored XSS: save the payload, then check whether another page renders it
- [ ] Reflected XSS: payload in a URL parameter is rendered directly on the page

**Checks — Command Injection:**
- [ ] If the app processes files or shell commands: try `; ls -la`, `| cat /etc/passwd`

**Checks — Path Traversal:**
- [ ] Try: `../../../etc/passwd`, `..%2F..%2Fetc%2Fpasswd`

**Severity if found:** S1 (Critical)

---

### A04: Insecure Design

**Description:** Missing security controls at the design level.

**Checks:**
- [ ] Rate limiting: send requests continuously (>100 times/minute) — is throttling applied?
  - Example: brute-force the login form, spam OTP requests
- [ ] "Forgot password" feature: does the token expire? Can the token be guessed?
- [ ] Business logic: can an order be placed with a negative price? Can multiple discount codes be stacked?
- [ ] Workflow bypass: can the user reach step 3 without completing steps 1–2?

**Severity if found:** S2 (High) to S1 (Critical) depending on impact

---

### A05: Security Misconfiguration

**Description:** Misconfiguration exposes information or widens the attack surface.

**Checks:**
- [ ] Default credentials still active: `admin/admin`, `admin/password`, `root/root`
- [ ] Error pages return stack traces, library names, versions, or DB queries
  - Example: submit input that causes an error, inspect the response body and headers
- [ ] Missing HTTP security headers:
  - `X-Content-Type-Options: nosniff`
  - `X-Frame-Options: DENY`
  - `Content-Security-Policy`
  - `Strict-Transport-Security` (HSTS)
- [ ] Directory listing enabled on the web server: access `/uploads/`, `/assets/`
- [ ] Swagger/OpenAPI UI publicly accessible in production: `/swagger-ui`, `/api-docs`
- [ ] Debug mode enabled in production: `DEBUG=True`, `APP_ENV=development`

**Severity if found:** S2–S3

---

### A06: Vulnerable and Outdated Components

**Description:** Libraries and frameworks with known vulnerabilities.

**Checks:**
- [ ] Check version in response headers: `X-Powered-By: Express 3.x`, `Server: Apache/2.2`
- [ ] Look up CVEs for the version in use: https://nvd.nist.gov
- [ ] JavaScript libraries: check the version in the HTML source or `package.json`
- [ ] Report to Dev if a dependency with a CVE score ≥ 7.0 is found

**Severity if found:** S2–S3 (depending on CVE score)

---

### A07: Identification and Authentication Failures

**Description:** Weak authentication or insecure session management.

**Checks:**
- [ ] Brute force: try many passwords in succession — is the account locked after N attempts?
- [ ] Session ID: after logout, does the old session still work?
  - Capture the cookie before logout, then use that cookie to call the API after logout
- [ ] JWT: try the `none` algorithm — send a token with no signature
- [ ] Modify the session ID in the cookie — is it rejected?
- [ ] "Remember me": how long is the token stored? Can it be revoked?
- [ ] Password change feature: is the current password required?

**Severity if found:** S1–S2

---

### A08: Software and Data Integrity Failures

**Description:** Code and infrastructure do not verify integrity.

**Checks:**
- [ ] Deserialization: if the app accepts serialised data (JSON, XML, binary) — is it validated?
- [ ] File upload: is the actual MIME type verified (not just the file extension)?
  - Try renaming `malware.exe` to `image.jpg` and uploading it
- [ ] Webhook/callback: is the signature of third-party requests validated?

**Severity if found:** S1–S2

---

### A09: Security Logging and Monitoring Failures

**Description:** Security events are not logged, and attacks are not detected.

**Checks:**
- [ ] Multiple failed login attempts: are they logged? (Check via admin dashboard or ask Dev)
- [ ] Sensitive actions (account deletion, permission changes, data export) have an audit log?
- [ ] Do the logs contain sensitive data (passwords, tokens)? (Check if access is granted)

**Severity if found:** S3 (Medium)

---

### A10: Server-Side Request Forgery (SSRF)

**Description:** The application sends requests to a URL controlled by an attacker.

**Checks:**
- [ ] Features that fetch a URL from user input (import from URL, webhook URL, avatar URL): try internal URLs
  - Payload: `http://169.254.169.254/latest/meta-data/` (AWS metadata)
  - Payload: `http://localhost:8080/admin`
  - Payload: `http://192.168.1.1`
- [ ] Observe the response: does it return data from an internal server?

**Severity if found:** S1 (Critical)

---

## Supplemental Checklist — By Feature Type

### Auth / Login Feature
- [ ] A01: IDOR after login
- [ ] A02: Cookie flags (Secure, HttpOnly, SameSite)
- [ ] A03: XSS in the login form
- [ ] A07: Brute force, session fixation, session invalidation on logout

### Payment / Fintech Feature
- [ ] A02: Card number and CVV not leaked in logs or responses
- [ ] A04: Manipulate the price value in the request body
- [ ] A08: Signature verification of payment webhooks
- [ ] A01: Cannot access another user's transaction

### File Upload Feature
- [ ] A03: File name contains path traversal (`../../../etc/passwd`)
- [ ] A08: Actual MIME type checked, not just the extension
- [ ] A05: File size limit enforced (DoS prevention)

### API Endpoints
- [ ] A01: Authentication required on every protected endpoint
- [ ] A05: Sensitive information not exposed in error responses
- [ ] A04: Rate limiting applied to critical endpoints

---

## Default Severity by Vulnerability Type

| Vulnerability | Default Severity | Notes |
|---|---|---|
| SQL Injection | S1 | Can dump the entire database |
| Stored XSS | S1 | Affects multiple users |
| Reflected XSS | S2 | Requires social engineering |
| IDOR | S1 or S2 | Depends on data sensitivity |
| Broken Auth | S1 | If entire auth is bypassed |
| SSRF internal | S1 | If metadata or internal services are reachable |
| Missing security headers | S3 | |
| Information disclosure (stack trace) | S2 | |
| Weak session management | S2 | |
| Missing rate limiting | S3 | |
