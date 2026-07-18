# Bug Severity & Priority Reference

> Used by: skill 01 (review-requirements), skill 09 (check-result), skill 10 (test-report),
> skill 13 (go-no-go), skill S1 (security-testing), INDEX.md

---

## Severity Levels (S1–S4)

| Level | Name | Definition | Example |
|---|---|---|---|
| S1 | Critical | Feature completely broken; no workaround; causes data loss or security breach | Login fails for all users; payment records deleted; auth token exposed |
| S2 | Major | Core feature broken or severely degraded; workaround exists but is painful | User cannot submit form due to JS error; API returns 500 in 30% of calls |
| S3 | Minor | Non-core feature broken; acceptable workaround available | Date picker shows wrong month; pagination off-by-one |
| S4 | Trivial | Cosmetic issue; no functional impact | Typo in label; misaligned button border |

---

## Priority Levels (P1–P4)

| Level | Name | Action required |
|---|---|---|
| P1 | Immediate | Fix before any further testing; block current sprint release |
| P2 | High | Fix within current sprint; include in go/no-go criteria |
| P3 | Medium | Fix in next sprint; acceptable to ship with workaround |
| P4 | Low | Backlog; fix when time allows |

**Typical mapping** (adjust based on business context):

| Severity | Default Priority |
|---|---|
| S1 | P1 |
| S2 | P2 |
| S3 | P3 |
| S4 | P4 |

Exception: S2 with no workaround → escalate to P1. S3 on critical user path → escalate to P2.

---

## 7 Defect Classification Categories

| # | Category | Description | Examples |
|---|---|---|---|
| 1 | Functional | Feature does not behave as specified in AC/BR | Wrong calculation result, wrong redirect, missing validation |
| 2 | Visual | UI rendering error, not a functional regression | Broken layout, wrong color, icon missing, overlapping elements |
| 3 | UX | Feature works but is difficult to use or confusing | Unclear error message, no loading indicator, inconsistent button label |
| 4 | Content | Wrong or missing text, labels, translations | Typo, wrong help text, untranslated string, wrong placeholder |
| 5 | Performance | Response time exceeds the defined SLA | Page load > 3s, API response > 1s under normal load |
| 6 | Console | JavaScript error / warning in browser console with no visible UI impact | Uncaught TypeError, 404 on a non-critical asset |
| 7 | Accessibility | Violation of WCAG 2.1 A/AA guideline | Missing alt text, insufficient contrast, keyboard trap |

---

## Go/No-Go Thresholds (standard defaults)

Teams override these in `project/qa-config.yaml > exit_criteria`.

| Metric | Go condition | No-Go condition |
|---|---|---|
| Pass rate | ≥ 90% | < 90% |
| S1 open bugs | 0 | ≥ 1 |
| S2 open bugs | ≤ 2 with accepted workaround | > 2, or any without workaround |
| S3 open bugs | Any (logged in backlog) | S3 on critical user path without workaround |
| TC executed rate | ≥ 80% of planned TCs | < 80% |
| Health score | ≥ 75 | < 75 |

---

## Triage Table Format

Use this format in skill 09 daily reports:

| Bug ID | Short description | Severity | Priority | Category | Assigned | Action |
|---|---|---|---|---|---|---|
| BUG-001 | {description} | S1/S2/S3/S4 | P1/P2/P3/P4 | Functional/Visual/UX/Content/Performance/Console/Accessibility | {Dev} | Fix immediately / Fix this sprint / Backlog |
