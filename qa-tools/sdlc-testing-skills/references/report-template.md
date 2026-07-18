# Test Report: {PROJECT_NAME}

| Field | Value |
|---|---|
| **Project** | {Project name} |
| **Sprint / Version** | {Sprint X / v1.0.0} |
| **Report date** | {dd/mm/yyyy} |
| **Environment** | {Staging / UAT / Production} |
| **URL** | {https://...} |
| **Tester** | {QC name} |
| **Test scope** | {Module / flow tested} |
| **Duration** | {X days / X hours} |
| **Total TCs executed** | {N} |
| **Test Plan reference** | {Test plan file name} |

---

## Health Score: {SCORE}/100

> Health Score reflects the overall quality of the application at the time of testing.
> Formula: Weighted sum of 8 categories (each category scored 0–100).

| Category | Weight | Score | Weighted Score |
|---|---:|---:|---:|
| Console / Errors | 15% | {0-100} | {N} |
| Functional | 20% | {0-100} | {N} |
| UX | 15% | {0-100} | {N} |
| Accessibility | 15% | {0-100} | {N} |
| Visual / UI | 10% | {0-100} | {N} |
| Performance | 10% | {0-100} | {N} |
| Content | 5% | {0-100} | {N} |
| Links | 10% | {0-100} | {N} |
| **Total** | **100%** | — | **{SCORE}** |

> **Links category rule:** If the sprint did not include link checking → set Links score = 100 (no deduction). Health Score is always calculated on a /100 scale.

**Score deduction rules by severity (each category starts at 100):**
- Critical bug (S1): −25 points
- High bug (S2): −15 points
- Medium bug (S3): −8 points
- Low bug (S4): −3 points
- Minimum per category: 0 points

---

## Top 3 Issues to Address

1. **{BUG-NNN}: {title}** — {one-line description, impact}
2. **{BUG-NNN}: {title}** — {one-line description, impact}
3. **{BUG-NNN}: {title}** — {one-line description, impact}

---

## Results Summary

| Status | TC count | Percentage |
|---|---:|---:|
| Pass | {N} | {x}% |
| Fail | {N} | {x}% |
| Blocked | {N} | {x}% |
| Not Run | {N} | {x}% |
| **Total** | **{N}** | |

**Pass rate:** {x}% | **Exit criteria:** {x}% | **Status:** ✅ Met / ❌ Not met

---

## Bug Distribution by Severity & Category

### By Severity

| Severity | Count | Fixed | Open |
|---|---:|---:|---:|
| S1 — Critical | {N} | {N} | {N} |
| S2 — High | {N} | {N} | {N} |
| S3 — Medium | {N} | {N} | {N} |
| S4 — Low | {N} | {N} | {N} |
| **Total** | **{N}** | **{N}** | **{N}** |

### By Category

| Category | Count |
|---|---:|
| Functional | {N} |
| Visual / UI | {N} |
| UX | {N} |
| Console / Errors | {N} |
| Performance | {N} |
| Accessibility | {N} |
| Content | {N} |

---

## Bug List

### BUG-001: {Short title}

| Field | Value |
|---|---|
| **Severity** | S1 / S2 / S3 / S4 |
| **Priority** | P1 / P2 / P3 / P4 |
| **Category** | Functional / Visual / UX / Content / Performance / Console / Accessibility |
| **URL** | {URL where bug occurs} |
| **Status** | Open / Fixed / Verified / Deferred |
| **Assignee** | {Dev name / Leave blank} |

**Description:** {What actually happens — what was expected.}

**Repro Steps:**

1. Navigate to {URL}
2. {Action}
3. **Observe:** {What goes wrong}

**Screenshot/Evidence:** {File path or link}

---

## Console Health

| Error | Count | First page seen |
|---|---:|---|
| {Console error content} | {N} | {URL} |

---

## Blockers & Risks

| Type | Description | Impact | Recommended Action |
|---|---|---|---|
| Blocker | {Bug / environment / data blocking tests} | {N TCs affected} | {Specific action} |
| Risk | {Potential issue} | {Impact if it occurs} | {Mitigation} |

---

## Retest Scope

| TC to retest | Related bug | Reason | Priority |
|---|---|---|---|
| {TC-XXX} | {BUG-NNN} | {Bug fixed / Environment stable} | P1 / P2 / P3 |

---

## Ship Readiness

| Metric | Value | Target | Met? |
|---|---|---|---|
| Health Score | {N}/100 | ≥ {N}/100 | ✅ / ❌ |
| Pass rate | {x}% | ≥ {x}% | ✅ / ❌ |
| Open S1 bugs | {N} | = 0 | ✅ / ❌ |
| Open S2 bugs | {N} | ≤ {N} | ✅ / ❌ |
| TCs not run | {N} | = 0 | ✅ / ❌ |

**Recommendation:** ✅ Ready to release / ⚠️ Conditional release ({conditions}) / ❌ Not ready to release

**Reason:** {1-2 sentence summary of current status and key risks}

---

## Regression vs Baseline (if applicable)

| Metric | Baseline | Current | Delta |
|---|---|---|---|
| Health Score | {N} | {N} | {+/-N} |
| Total bugs | {N} | {N} | {+/-N} |
| Pass rate | {x}% | {x}% | {+/-x}% |

**Bugs fixed since baseline:** {list}
**Newly introduced bugs:** {list}

---

## Completion Status

- **DONE** — Full scope completed, sufficient evidence collected
- **DONE_WITH_CONCERNS** — Completed but with issues to note: {list}
- **BLOCKED** — Stopped due to: {reason} | Attempted: {actions taken} | Recommendation: {next steps}
- **NEEDS_CONTEXT** — Requires additional: {missing information}
