# Detailed Procedure: 03-accessibility-testing

> Token-saving archive of the previous full sub-skill body. Read only when the compact sub-skill needs exact legacy wording, templates, or edge-case procedures.

## Pre-DONE Checklist

> **L2 - QA Lead review required.** Report must not be sent to stakeholders until "Approved" is received. See the Sign-off section at the end of this file.

- [ ] WCAG 2.1 AA scope covered (automated + manual)
- [ ] Lighthouse score measured and compared against target
- [ ] Top 3 action items clearly defined
- [ ] L2 sign-off emitted
- [ ] Append execution record to governance/audit-log.md
- [ ] Update project/session-state.yaml -> last_execution, pending_sign_offs

---

## Inputs

| Information | Required |
|---|---|
| Test environment URL | ✅ |
| List of pages / flows to test | ✅ |
| Testing tier (Quick / Standard / Exhaustive) | ✅ |
| Standard to apply (default: WCAG 2.1 AA) | Recommended |
| Special user groups (if known) | Recommended |

If the project has `qa-config.yaml` → read it first:
- `accessibility.required` → if `false`, remind the user to confirm before proceeding
- `accessibility.wcag_level` → AA or AAA (default AA)
- `accessibility.lighthouse_score_min` → minimum score threshold
- `environments.staging.url` → test URL
- `scope.exploratory_tier` → tier to apply (Quick/Standard/Exhaustive)

If required information is missing → write `[Needs to be provided]`, ask again. Do not guess.

---

## Step 1 — Run automated scan first

Automated tools detect ~30–57% of WCAG errors. Run first to get a quick overview.

### Preferred tools

| Tool | How to run | Output |
|---|---|---|
| **axe DevTools** | Chrome extension → Analyze page | List of errors with WCAG references |
| **Lighthouse** | Chrome DevTools → Lighthouse → Accessibility | Score 0–100 + issues |
| **WAVE** | wave.webaim.org or extension | Visual overlay of errors on the page |

### Record automated results

- Lighthouse Accessibility Score: {N}/100
- axe error count: Critical [{N}] / Serious [{N}] / Moderate [{N}] / Minor [{N}]
- Most common errors: {list top 3}

> Automated scan is a **starting point**, not an endpoint. Always manual test afterwards.

---

## Step 2 — Keyboard navigation test

Put the mouse away. Use only the keyboard. Read section 2 of `../../references/accessibility-checklist.md`.

**Process:**
1. Open the page, press Tab — observe where focus appears first
2. Tab through the entire page and note:
   - Is the focus indicator visible?
   - Is the Tab order logical?
   - Are there any points where focus gets trapped?
3. For each interactive element: press Enter/Space to activate, verify it works correctly
4. For modal/dialog: check focus trap (Tab does not escape outside), Escape closes it
5. For dropdown/menu: Arrow keys navigate, Escape closes, Enter selects

**Record errors immediately when discovered** — do not leave them until the end of the session.

---

## Step 3 — Form accessibility

Read section 3 of `../../references/accessibility-checklist.md`.

For each form on the page:

- [ ] Click on label text — does the input receive focus? (check `for`/`id` association)
- [ ] Required fields are marked by more than just color
- [ ] Submitting empty — error message appears near the erroneous field, with a specific description
- [ ] Error is readable by screen readers (`aria-describedby` or `aria-live`)
- [ ] Placeholder does not replace label (label must always be visible)

---

## Step 4 — Color contrast

Read section 4 of `../../references/accessibility-checklist.md`.

**WCAG 2.1 AA thresholds:**
- Normal text: minimum **4.5:1**
- Large text (≥ 18pt / 14pt bold): minimum **3:1**
- UI components (input border, icon): minimum **3:1**

**How to measure:**
1. Chrome DevTools → select element → Accessibility tab → Contrast ratio
2. Or: WebAIM Contrast Checker — enter foreground/background hex color

Record: element, foreground color, background color, measured ratio, required ratio.

---

## Step 5 — Screen reader test (Exhaustive tier only)

Read section 5 of `../../references/accessibility-checklist.md`.

**Recommended environment:**
- Windows: NVDA (free) + Chrome
- Mac: VoiceOver (built-in) + Safari

**Basic process:**
1. Turn on screen reader, open the page
2. Listen to the page title — does it accurately describe the content?
3. Use screen reader shortcut to hear the heading list — is there a logical hierarchy?
4. Navigate through landmarks (nav, main, footer)
5. Interact with the form — hear the label of each field before typing
6. Submit the form — is the error notification read aloud?

---

## Step 6 — Per-page checklist

For each page in scope, run the checklist from `../../references/exploratory-checklist.md` — focus on section 1 (Visual Scan) and section 2 (Interactive Elements) to detect visual accessibility errors.

---

## Output Format — Accessibility Test Report

```markdown




| Field | Value |
|---|---|
| **Test date** | [dd/mm/yyyy] |
| **Standard** | WCAG 2.1 Level AA |
| **Tier** | Quick / Standard / Exhaustive |
| **Pages tested** | [N] pages |
| **Tester** | [Name] |
| **Tools** | axe DevTools, Lighthouse, Keyboard manual |

---

## Summary

| Metric | Result |
|---|---|
| Lighthouse Accessibility Score | [N]/100 |
| axe: Critical | [N] |
| axe: Serious | [N] |
| axe: Moderate | [N] |
| axe: Minor | [N] |
| Manual errors (not detected by automated) | [N] |

**Overall level:** 🔴 Needs significant improvement / 🟡 Has errors to fix / 🟢 Meets basic standard

---

## Error list

### A11Y-001: [Short title]

| Field | Value |
|---|---|
| **WCAG Criteria** | [1.1.1 / 1.4.3 / 2.1.1 / ...] |
| **Severity** | S1 / S2 / S3 |
| **Page** | [URL] |
| **Element** | [CSS selector or element description] |
| **Status** | Open / Fixed |

**Issue:** [What actually exists — how it violates WCAG]

**Impact:** [Which users are affected — blind users, keyboard users, low-vision users]

**Fix recommendation:** [Specific solution — add `alt`, increase contrast from X to Y, add `aria-label`]

---

## Keyboard Navigation Results

| Page | Tab order | Focus visible | Keyboard trap | Result |
|---|---|---|---|---|
| [Page] | ✅ / ❌ | ✅ / ❌ | None / Exists at [element] | ✅ Pass / ❌ Fail |

---

## Contrast Results

| Element | Text color | BG color | Measured ratio | Required | Pass? |
|---|---|---|---|---|---|
| Body text | #[hex] | #[hex] | [N]:1 | 4.5:1 | ✅ / ❌ |
| Placeholder | #[hex] | #[hex] | [N]:1 | 4.5:1 | ✅ / ❌ |

---

## Conclusion

**Ready to release?**
- ❌ No — [N] S1 errors remain (keyboard trap, dangerous for users)
- ⚠️ Conditionally — S1 fixed, [N] S2 errors (contrast, label) need to be fixed next sprint
- ✅ Yes — Meets WCAG 2.1 AA basic standard, Lighthouse score ≥ [N]

**Top 3 priority actions:**
1. [Specific fix]
2. [Specific fix]
3. [Specific fix]
```

---

**Save file to:** `output_paths.reports.accessibility` from qa-config (default: `testing-output/reports/accessibility/`)
→ `reports/accessibility-report-{project.sprint}.md`

## Sign-off Request (L2)



After receiving Approved: update project/session-state.yaml, remove item from pending_sign_offs.

---

## Completion Status

- **DONE** — Automated scan + manual test complete, report has full WCAG references
- **DONE_WITH_CONCERNS** — Complete but: {Some pages could not be tested / Screen reader test skipped / Score below target}
- **BLOCKED** — Cannot test due to: {No tool available / Page requires auth without an account / Environment unstable}
- **NEEDS_CONTEXT** — Additional input needed: {List of pages to test / Tier to apply / WCAG standard level}
