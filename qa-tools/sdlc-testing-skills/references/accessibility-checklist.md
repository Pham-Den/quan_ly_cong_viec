# Accessibility Testing Checklist

> Skill 15 reads this file to perform accessibility testing according to WCAG 2.1 AA standards.
> Each item includes: specific check points, how to test, and severity if an issue is found.
> Reference: WCAG 2.1 Level AA (the minimum standard for most B2B/B2C applications).

---

## 1. Images and Media

### 1.1 Alt text for images
- [ ] Every `<img>` with meaningful content must have an `alt` attribute describing its meaning, not the file name
  - Wrong: `alt="image_001.jpg"` or `alt="photo"`
  - Correct: `alt="Q3 revenue chart — up 15% compared to Q2"`
- [ ] Decorative images (carrying no information) use `alt=""` (empty string, not omitted)
- [ ] Meaningful icons: must have `aria-label` or visually hidden text for screen readers
- [ ] Images inside links: `alt` describes the destination, not the image itself

**How to test:** Inspect element, look for `<img>` missing `alt` or with meaningless `alt`.
Use browser extensions: axe DevTools, WAVE, Lighthouse.

**Severity if missing:** S3 (Medium) — S2 (High) if the image is the primary content

---

### 1.2 Video and Audio
- [ ] Videos have synchronised captions — not just inaccurate auto-generated ones
- [ ] Audio has an accompanying text transcript
- [ ] Autoplaying video has no sound — or has a clearly visible mute button
- [ ] Player has full controls: play/pause/stop accessible by keyboard

**Severity if missing:** S3 (Medium)

---

## 2. Keyboard Navigation

### 2.1 Logical tab order
- [ ] Pressing Tab from the top of the page moves focus in a logical order (left → right, top → bottom)
- [ ] No focus traps outside modals: after tabbing through the whole page, the user is not stuck
- [ ] A skip navigation link ("Skip to main content") is available at the top of the page

**How to test:** Put the mouse aside and use Tab to navigate the entire page. Record the focus order.

**Severity if failing:** S2 (High) — keyboard users cannot operate the application

---

### 2.2 Visible focus
- [ ] Focus indicator is clearly visible — not hidden by CSS `outline: none` or `outline: 0`
- [ ] Focus indicator has sufficient contrast (at least 3:1 against the background)
- [ ] Custom components (dropdowns, sliders, tabs) show a focus indicator when active

**How to test:** Tab through each element and observe whether a focus ring is visible.

**Severity if missing:** S2 (High)

---

### 2.3 Keyboard traps
- [ ] Modal/dialog: focus is trapped inside while open (correct behaviour), ESC closes it, focus returns to the trigger element on close
- [ ] Dropdown/menu: Escape closes it, focus returns to the button that opened it
- [ ] Date picker, combobox: fully operable by keyboard (arrow keys, enter, escape)

**Severity if failing:** S1 (Critical) — users are trapped with no way to escape

---

## 3. Form Accessibility

### 3.1 Labels for inputs
- [ ] Every input has an associated `<label>` (using `for`/`id` or wrapping)
  - Wrong: placeholder used as a substitute for a label (placeholder disappears on input)
  - Correct: `<label for="email">Email</label><input id="email">`
- [ ] Required fields are clearly marked (not by colour alone)
- [ ] Groups of radio buttons/checkboxes use `<fieldset>` and `<legend>`

**How to test:** Click the label — does the input receive focus? Verify with axe DevTools.

**Severity if missing:** S2 (High)

---

### 3.2 Error messages
- [ ] Form error messages are descriptive — not just "This field is invalid"
  - Wrong: "Format error"
  - Correct: "Email must be in the format example@domain.com"
- [ ] Errors are linked to the specific field (`aria-describedby` or placed directly beneath the field)
- [ ] Screen reader announces errors on submit (`aria-live` or focus moved to an error summary)
- [ ] Colour is not the only signal for an error — an icon or text must accompany it

**Severity if missing:** S2 (High)

---

### 3.3 Input hints
- [ ] Complex formats have instructions shown before the user types (not only after an error)
  - Example: "Enter date in DD/MM/YYYY format" displayed directly beneath the field
- [ ] Password requirements are shown before the user submits

**Severity if missing:** S3 (Medium)

---

## 4. Color and Contrast

### 4.1 Text contrast ratio
- [ ] Normal text (< 18pt): minimum **4.5:1** contrast ratio against the background
- [ ] Large text (≥ 18pt or 14pt bold): minimum **3:1**
- [ ] Placeholder text: minimum 4.5:1 (often overlooked — placeholders tend to be too light)
- [ ] Text on images/gradients: calculate contrast against the darkest/lightest area behind it

**How to test:** Chrome DevTools → Accessibility tab → view contrast ratio.
Tools: WebAIM Contrast Checker, axe DevTools.

**Severity if below threshold:** S2 (High) — causes reading difficulty for users with low vision

---

### 4.2 Colour is not the sole means of conveying information
- [ ] Links are distinguished from body text by both colour AND underline or icon
- [ ] Status indicators (success/error/warning) include an icon + text — not only green/red/yellow colour
- [ ] Charts: lines/bars are distinguishable by pattern/shape — not colour alone

**Severity if violated:** S2 (High)

---

## 5. ARIA and Semantic HTML

### 5.1 Landmark regions
- [ ] Page includes `<main>`, `<nav>`, `<header>`, `<footer>` or equivalent ARIA roles
- [ ] Only one `<main>` element per page
- [ ] Navigation (`<nav>`) has `aria-label` when multiple nav elements exist (e.g. "Main navigation", "Breadcrumb")

**How to test:** Inspect HTML structure; use a screen reader (NVDA, VoiceOver) to listen to landmarks.

**Severity if missing:** S3 (Medium)

---

### 5.2 ARIA attributes
- [ ] `aria-hidden="true"` is used correctly (decorative icons, not real content)
- [ ] `aria-expanded` reflects the correct state (true when open, false when closed)
- [ ] `aria-live` regions are used for dynamic content (notifications, search results, loading states)
- [ ] ARIA roles are not misapplied (e.g. `role="button"` on a `<div>` with no keyboard handler)

**Severity if wrong:** S2 (High) — screen reader reads incorrect information

---

### 5.3 Page title and heading hierarchy
- [ ] Every page has a `<title>` describing its content (not just the app name)
  - Wrong: `<title>MyApp</title>`
  - Correct: `<title>Order List — MyApp</title>`
- [ ] Headings follow a proper hierarchy: H1 → H2 → H3 (no skipping from H1 to H3)
- [ ] Only one H1 per page

**Severity if failing:** S3 (Medium)

---

## 6. Motion and Animation

- [ ] Animations lasting > 5 seconds can be paused, stopped, or hidden
- [ ] No content flashes more than 3 times per second (risk of triggering seizures)
- [ ] `prefers-reduced-motion` is respected: CSS animations are reduced or disabled when the user opts in

**Severity if violated:** S1 (Critical) for dangerous flashing content, S3 for general animations

---

## 7. Responsive Design and Zoom

- [ ] Layout does not break when zoomed to 200% on desktop
- [ ] No horizontal scrollbar appears at 200% zoom
- [ ] Text is not clipped or overflowing when the user increases the system font size
- [ ] Touch targets on mobile: minimum 44×44px (iOS) or 48×48dp (Android)

**Severity if failing:** S2 (High) — affects low-vision users and mobile users

---

## Quick Testing Tools

| Tool | Type | Detects |
|---|---|---|
| **axe DevTools** (Chrome extension) | Automated | ~57% of WCAG issues automatically |
| **WAVE** (WebAIM) | Automated | Contrast, structure, ARIA |
| **Lighthouse** (Chrome DevTools) | Automated | Overall accessibility score |
| **NVDA** (Windows) + Chrome | Screen reader | Keyboard nav, ARIA, reading order |
| **VoiceOver** (Mac/iOS) + Safari | Screen reader | Mobile, native behaviour |
| **Keyboard only** (Tab, Enter, Escape, Arrow) | Manual | Focus, traps, order |

---

## Default Severity by Issue Type

| Issue | Severity | WCAG Criteria |
|---|---|---|
| Unescapable focus trap | S1 | 2.1.2 |
| Dangerous flashing content | S1 | 2.3.1 |
| Input without label | S2 | 1.3.1 |
| Focus not visible | S2 | 2.4.7 |
| Contrast < 4.5:1 | S2 | 1.4.3 |
| Missing alt text on content image | S2 | 1.1.1 |
| Non-descriptive error message | S2 | 3.3.1 |
| Incorrect heading hierarchy | S3 | 1.3.1 |
| Missing landmarks | S3 | 1.3.1 |
| Animation does not support reduced-motion | S3 | 2.3.3 |
