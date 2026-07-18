---
name: 03-accessibility-testing
description: >
  Test accessibility against WCAG 2.1 AA standards: keyboard navigation, screen reader,
  color contrast, form labels, ARIA, focus management. Trigger: accessibility test,
  a11y, WCAG, accessibility testing, screen reader, keyboard navigation, contrast.
  Output: Accessibility Test Report with a list of issues classified by WCAG criteria.
---

# Accessibility Testing

> **Output language:** → See SKILL.md output rules.

Compact workflow. Read the detailed procedure only when exact legacy wording or edge cases are needed:
`references/skill-details/03-accessibility-testing.md`.

## Read First

- Read `project/qa-config.yaml` only if it exists and the task needs project config.
- Use `references/INDEX.md` to choose optional references; do not open all references.
- Governance gate: L2 — save artifacts, emit sign-off request, wait for explicit approval before publishing.

## Inputs

- Accessibility scope, pages/components, target WCAG level, browsers/devices, assistive tech constraints

## Core Workflow

1. Confirm target WCAG level and tested surfaces.
2. Check keyboard navigation, focus order, semantics, labels, contrast, forms, errors, screen reader behavior, and responsive states.
3. Separate blocker issues from advisory improvements.
4. Map findings to WCAG criteria and affected user impact.
5. Emit L2 review request.

## Outputs

- Accessibility test report with WCAG mapping and remediation guidance

## References

- references/accessibility-checklist.md
- references/exploratory-checklist.md

## Stop Conditions

- Required input is missing and cannot be inferred from provided artifacts.
- The task requires external publishing but the required governance approval is not present.
- The requested action is outside the skill scope selected by `SKILL.md`.
