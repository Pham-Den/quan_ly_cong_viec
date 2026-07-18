# Exploratory Testing — Per-Page Checklist & Session Guide

> Skill 07 and Skill 15 reference this file for exploratory testing.
> Source: OWASP Testing Guide + qa/references/issue-taxonomy.md (gstack).
> Use when no specific test case is available — test by intuition and experience.

---

## Per-Page Exploration Checklist

Apply **to each page** in an exploratory testing session. Goal: < 5 minutes/page for Quick tier, no limit for Exhaustive.

### 1. Visual Scan
- [ ] Take a full-page screenshot (annotate if tooling supports it)
- [ ] Is the layout broken? Elements overlapping? Text clipped?
- [ ] Do all images load? No broken image icons?
- [ ] Is content aligned to the grid? Consistent spacing?
- [ ] Are colors and fonts consistent with other pages?

### 2. Interactive Elements
- [ ] Click every button — does it respond? Is the action correct?
- [ ] Click every link — does it go to the right destination? No 404?
- [ ] Hover state displays correctly (cursor changes, tooltip appears)?
- [ ] Dropdowns, accordions, tabs — do they toggle correctly?
- [ ] Icon buttons — do they have a tooltip or aria-label explanation?

### 3. Forms
- [ ] Submit empty form — does validation appear correctly?
- [ ] Submit form with valid data — does it process successfully?
- [ ] Submit form with boundary data (very long string, special characters, negative numbers)?
- [ ] Validation messages are clear and point to the correct field?
- [ ] After successful submission — is there a confirmation message?
- [ ] Tab order in the form is logical (top-to-bottom, left-to-right)?

### 4. Navigation
- [ ] Breadcrumb reflects the current location correctly?
- [ ] Browser Back button works correctly?
- [ ] Deep link (paste URL directly) lands on the correct page?
- [ ] Links in menu/sidebar go to the correct destination?
- [ ] No dead-ends (pages with no exit path)?

### 5. States
- [ ] **Empty state:** When no data — what is displayed? Is there guidance?
- [ ] **Loading state:** While loading — is there a spinner/skeleton?
- [ ] **Error state:** When API fails — what message is shown?
- [ ] **Full/overflow state:** When there is too much data — pagination? Scroll? Truncation?
- [ ] Page refresh — is data preserved? Is the form reset?

### 6. Console Check
- [ ] Open DevTools → Console before interacting
- [ ] Perform actions on the page
- [ ] Check: any new JavaScript errors (red) appearing?
- [ ] Check Network tab: any 4xx/5xx requests?
- [ ] Note important warnings too (not just errors)

### 7. Responsiveness (if relevant)
- [ ] DevTools → Toggle Device Toolbar → Mobile (375px)
- [ ] Is the layout still usable? No horizontal scrollbar?
- [ ] Are touch targets large enough (≥ 44px)?
- [ ] No overlapping text?
- [ ] Mobile navigation (hamburger menu) works correctly?

---

## Testing Tiers

### Quick Tier (~15–30 minutes)
**Scope:** Critical and High flows only — anything that blocks the core workflow.

- Pages covered: 3–5 main pages
- Checklist: items 2 (Interactive) and 6 (Console) only
- Bug report: S1 and S2 only
- Use when: hotfix review, pre-deploy smoke, time-boxed check

### Standard Tier (~1–2 hours)
**Scope:** Critical + High + Medium — all main features.

- Pages covered: all pages in sprint scope
- Checklist: items 1–6 in full
- Bug report: S1, S2, S3
- Use when: Sprint review, routine regression test

### Exhaustive Tier (~3+ hours)
**Scope:** Entire application — including edge cases and cosmetic issues.

- Pages covered: full app + edge cases + rare flows
- Checklist: items 1–7 in full + accessibility + basic security
- Bug report: S1, S2, S3, S4
- Use when: Major pre-release, after full redesign, UAT prep

---

## Session-Based Exploratory Testing (SBET)

Instead of ad-hoc testing, use **goal-oriented sessions** (charters):

### Session structure

```
Charter: [Goal — 1 sentence]
Scope: [Specific feature or flow]
Duration: [30 / 60 / 90 minutes]
Tester: [Name]

--- During session ---
Quick notes:
  + Finding: [issue]
  ? Question: [thing to confirm]
  i Idea: [additional test case]

--- After session ---
Bugs found: [N]
Unanswered questions: [N]
Areas not yet tested: [Description]
```

### Examples of effective charters

- "Test the checkout flow from the perspective of a first-time buyer — goal is to identify points of confusion"
- "Test all error scenarios in the registration form — boundary data input, network failure, duplicate email"
- "Explore the user management page with admin role — find actions that lack a confirmation dialog"

### Ineffective charters

- "Test the whole app" — too broad, no focus
- "Find bugs" — no goal
- "Check the new feature" — unclear which feature, unclear testing criteria

---

## Links Checking

Links are a separate category in the Health Score (weight 10%). Check:

| Link type | How to check | Severity if broken |
|---|---|---|
| Internal links (within app) | Click, verify the destination URL | S2 if 404, S3 if wrong destination |
| External links | Hover to see href, open in new tab to verify | S3 if 404 |
| Links in email/PDF | Check in the receiving environment | S2 if 404 |
| Deep links (share URL) | Paste URL into a new tab | S2 if it does not resolve |
| Anchor links (#section) | Click, does it scroll to the correct section | S3 |
| Links with `target="_blank"` | Does it have `rel="noopener noreferrer"` (security) | S3 |

**Tooling:** Chrome extension "Link Checker" or a simple crawler for large applications.

---

## Before/After Evidence

When a bug is found during exploratory testing, capture enough evidence for:
1. Dev to reproduce independently (no follow-up questions needed)
2. Comparison after fix to verify the resolution

### Evidence template

```
Bug: [ID] — [Short title]

Before (broken state):
  URL: [Specific URL]
  Action: [What was done]
  Result: [What was seen — incorrect]
  Screenshot: [file/link]

After (expected state):
  Expected result: [What should be seen]
  Reference screenshot: [If available — design / another page that works correctly]

Console output at the time of the error: [If relevant]
```
