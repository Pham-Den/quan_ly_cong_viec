---
name: 09-check-result
description: >
  Analyze test execution results: aggregate pass/fail/blocked, triage bugs by severity,
  identify blockers, propose retest scope, generate Daily Report. Trigger: test results,
  pass/fail, bug triage, daily report, result analysis, retest, progress check.
  Output: Daily Report Markdown + HTML + DOCX + action item list +
  structured improvement snapshot for reuse in Skill 08 and the next sprint.
---

# Daily Result Check

> **Output language:** → See SKILL.md output rules.

Compact workflow. Read the detailed procedure only when exact legacy wording or edge cases are needed:
`references/skill-details/09-check-result.md`.

## Read First

- Read `project/qa-config.yaml` only if it exists and the task needs project config.
- Use `references/INDEX.md` to choose optional references; do not open all references.
- Governance gate: L2 — save artifacts, emit sign-off request, wait for explicit approval before publishing.

## Inputs

- Run result, TC execution summary, bugs, blockers, evidence links, environment status

## Core Workflow

1. Aggregate pass/fail/blocked/not-run and open bug state.
2. Classify defects by severity, priority, category, owner, and retest action.
3. Compare against exit/suspension criteria from qa-config or plan fallback.
4. Produce daily report, sprint snapshot, action items, and next-day focus.
5. Emit L2 sign-off request before publishing externally.

## Outputs

- Daily report markdown/html/docx as needed
- Run result manifest

## References

- references/report-template.md
- shared-schema/report.schema.yaml
- references/bug-severity.md
- feedback/improvement-log.md

## Stop Conditions

- Required input is missing and cannot be inferred from provided artifacts.
- The task requires external publishing but the required governance approval is not present.
- The requested action is outside the skill scope selected by `SKILL.md`.
