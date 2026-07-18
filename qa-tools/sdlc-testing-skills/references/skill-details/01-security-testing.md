# Detailed Procedure: 01-security-testing

> Token-saving archive of the previous full sub-skill body. Read only when the compact sub-skill needs exact legacy wording, templates, or edge-case procedures.

## Pre-DONE Checklist

> **L2 - QA Lead review required.** Report must not be sent to stakeholders until "Approved" is received. See the Sign-off section at the end of this file.

- [ ] OWASP Top 10 scope covered per qa-config (or confirmed scope)
- [ ] Every S1/S2 bug has complete reproduction steps
- [ ] Remediation recommendations are specific, not generic
- [ ] L2 sign-off emitted
- [ ] Append execution record to governance/audit-log.md
- [ ] Update project/session-state.yaml -> last_execution, pending_sign_offs

---

## Inputs

| Information | Required |
|---|---|
| Test environment URL (staging — do not use production) | ✅ |
| List of features / flows to security-test | ✅ |
| Test accounts with multiple roles (admin, regular user, guest) | ✅ |
| Domain information: app type (web, API, mobile API) | Recommended |
| qa-config.yaml (if it contains security scope configuration) | Recommended |

> **Warning:** Only test on environments for which authorization has been granted. Do not test on production without explicit approval.

If the project has `qa-config.yaml` → read it first:
- `environments.staging.url` → test URL
- `test_accounts` → required roles (admin, user, guest)
- `security.focus` → prioritized OWASP categories (if empty → test all A01–A10)

If required information is missing → write `[Needs to be provided]`, ask again. Do not guess.

---

## Step 1 — Define scope and feature type

Classify features to apply the appropriate checklist from `../../references/owasp-checklist.md`:

| Feature type | Priority checklist |
|---|---|
| Auth / Login / Session | A01, A02, A07 |
| Input forms, search | A03 (Injection, XSS) |
| File upload | A03, A08 |
| API endpoint | A01, A04, A05 |
| Payment / Fintech | A02, A04, A08 |
| Feature that fetches URL from input | A10 (SSRF) |

---

## Step 2 — Execute OWASP Top 10 checks

Read `../../references/owasp-checklist.md` for detailed payloads and testing techniques.

Execute in priority order (S1 first):

### A01 — Broken Access Control (highest priority)

- [ ] IDOR: access another user's resource via ID manipulation
- [ ] Privilege escalation: add `role=admin` to request
- [ ] Access admin/restricted pages without authorization
- [ ] HTTP method tampering: try DELETE/PUT on a GET-only endpoint
- [ ] JWT payload manipulation (change user_id, role)

### A02 — Cryptographic Failures

- [ ] Check HTTPS enforcement (redirect from HTTP)
- [ ] Cookie flags: `Secure`, `HttpOnly`, `SameSite`
- [ ] Tokens and API keys do not appear in URLs
- [ ] API responses do not return excessive sensitive data (password_hash, ssn, full card number)

### A03 — Injection

- [ ] SQL Injection: `' OR '1'='1`, observe SQL errors in response
- [ ] XSS Reflected: `<script>alert(1)</script>` in URL params
- [ ] XSS Stored: save payload, check that the page re-renders it
- [ ] Path Traversal: `../../../etc/passwd` in file-related endpoints

### A04 — Insecure Design

- [ ] Rate limiting: send >100 requests/minute to login form, OTP
- [ ] Password reset token: does it expire? Can it be guessed?
- [ ] Business logic: place an order with a negative price, skip steps in a workflow

### A05 — Security Misconfiguration

- [ ] Default credentials: `admin/admin`, `admin/password`
- [ ] Error responses reveal stack trace, library names, versions
- [ ] HTTP security headers (check response headers)
- [ ] Swagger/API docs are public on staging/prod

### A06 — Vulnerable and Outdated Components

- [ ] Check `Server`, `X-Powered-By` headers — do they reveal framework/server version?
- [ ] Swagger UI / API docs — do they list library versions?
- [ ] Check publicly exposed package versions (if `package.json`, `pom.xml` is accessible) — compare against known CVE vulnerabilities
- [ ] Third-party scripts (CDN) — are versions pinned, or using `latest`?

### A07 — Authentication Failures

- [ ] Brute force: attempt multiple passwords in succession — is the account locked?
- [ ] Session invalidation after logout (use old cookie to call API)
- [ ] JWT algorithm `none`: send token without signature
- [ ] Password change does not require the current password

### A08 — Integrity Failures

- [ ] File upload: rename `.exe` file to `.jpg`, try to upload
- [ ] MIME type is actually validated (not based solely on extension)

### A09 — Security Logging and Monitoring Failures

- [ ] Perform a failed action (wrong login, unauthorized access) — does the system log this event?
- [ ] Do logs contain sensitive information? (password, token, PII in log lines)
- [ ] Is there an alert / notification for multiple consecutive failed logins?
- [ ] Error responses do not reveal internal paths, stack traces, or SQL queries

### A10 — SSRF

- [ ] Feature that fetches URL from input: try `http://localhost`, `http://169.254.169.254/`

---

## Step 3 — Record and classify vulnerabilities

For each discovered vulnerability, record fully:

| Field | Content |
|---|---|
| ID | SEC-001, SEC-002... |
| OWASP category | A01–A10 |
| Severity | S1/S2/S3 (see severity table in owasp-checklist.md) |
| Description | Expected vs Actual |
| Repro steps | Sufficient for Dev to reproduce independently |
| Payload used | (if injection/XSS) |
| Evidence | Screenshot / response body |
| Fix recommendation | Specific, not generic |

> **Note:** Never write actual payloads in public bug trackers. Use internal security channels for S1/S2.

---

## Step 4 — Check HTTP Security Headers

For every response, check the following headers:

| Header | Expected value | Missing → Severity |
|---|---|---|
| `Strict-Transport-Security` | `max-age=31536000; includeSubDomains` | S2 |
| `X-Content-Type-Options` | `nosniff` | S3 |
| `X-Frame-Options` | `DENY` or `SAMEORIGIN` | S3 |
| `Content-Security-Policy` | Has a valid value | S2 |
| `Referrer-Policy` | `no-referrer` or `same-origin` | S3 |
| `Permissions-Policy` | Restricts camera, microphone if not needed | S3 |

---

## Output Format — Security Test Report

```markdown




| Field | Value |
|---|---|
| **Test date** | [dd/mm/yyyy] |
| **Environment** | [staging URL] |
| **Scope** | [List of features tested] |
| **Test accounts** | [Roles used] |
| **Tester** | [Name] |

---

## Summary

| Severity | Count |
|---|---:|
| S1 — Critical | [N] |
| S2 — High | [N] |
| S3 — Medium | [N] |
| **Total** | **[N]** |

**Overall risk level:** 🔴 High / 🟡 Medium / 🟢 Low

---

## Vulnerability list

### SEC-001: [Short title]

| Field | Value |
|---|---|
| **OWASP** | A0X — [Category name] |
| **Severity** | S1 / S2 / S3 |
| **Endpoint** | [URL / endpoint] |
| **Status** | Open / Fixed / Accepted Risk |

**Description:** [Expected vs Actual — do not paste dangerous payload directly]

**Repro Steps:**
1. [Step 1]
2. [Step 2]
3. **Observed:** [Result]

**Recommendation:** [Specific solution — parameterized query / input validation / header config]

---

## HTTP Security Headers

| Header | Current value | Pass? |
|---|---|---|
| HSTS | [value or Missing] | ✅ / ❌ |
| X-Content-Type-Options | [value or Missing] | ✅ / ❌ |
| X-Frame-Options | [value or Missing] | ✅ / ❌ |
| CSP | [value or Missing] | ✅ / ❌ |

---

## Conclusion & Recommendations

**Ready to release?**
- ❌ No — [N] S1 vulnerabilities not yet fixed
- ⚠️ Conditionally — S1 fixed, [N] S2/S3 remain to monitor
- ✅ Yes — No critical vulnerabilities

**Top 3 priority actions:**
1. [Specific action]
2. [Specific action]
3. [Specific action]
```

---

**Save file to:** `output_paths.reports.security` from qa-config (default: `testing-output/reports/security/`)
→ `reports/security-report-{project.sprint}.md`

## Sign-off Request (L2)



After receiving Approved: update project/session-state.yaml, remove item from pending_sign_offs.

---

## Completion Status

- **DONE** — Full scope tested, report complete, all S1 bugs have reproduction steps
- **DONE_WITH_CONCERNS** — Complete but: {S1 still open / Some endpoints could not be tested / Missing role X account}
- **BLOCKED** — Cannot test due to: {No test account / Environment unstable / Authorization not granted}
- **NEEDS_CONTEXT** — Additional input needed: {Environment URL / List of features to test / Multi-role accounts}
