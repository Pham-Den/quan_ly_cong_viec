---
name: 10-test-report
description: >
  Compile a complete Sprint Test Report: aggregate results from daily reports,
  calculate the end-of-sprint Health Score, analyze bugs by severity and category,
  assess Ship Readiness, analyze defect patterns and coverage delta by module.
  Trigger: test report, sprint report, test summary,
  testing report, sprint wrap-up. Output: Markdown report following
  references/report-template.md and an HTML version in the same format.
---

# Sprint Test Report

> **Output language:** → See SKILL.md output rules.

Compact workflow. Read the detailed procedure only when exact legacy wording or edge cases are needed:
`references/skill-details/10-test-report.md`.

## Read First

- Read `project/qa-config.yaml` only if it exists and the task needs project config.
- Use `references/INDEX.md` to choose optional references; do not open all references.
- Governance gate: L2 — save artifacts, emit sign-off request, wait for explicit approval before publishing.

## Inputs

- Daily report snapshots or aggregate TC result, bug list, coverage delta, exit criteria

## Core Workflow

1. Aggregate sprint metrics and validate totals.
2. Calculate health score and compare against exit criteria.
3. Summarize defect trends, coverage delta, residual risks, and ship readiness.
4. Append improvement snapshot for the next sprint.
5. Emit L2 sign-off request before external publishing.

## Outputs

- Sprint test report markdown/html/docx as needed
- Improvement snapshot

## References

- references/report-template.md
- shared-schema/report.schema.yaml
- references/bug-severity.md
- feedback/improvement-log.md

## Stop Conditions

- Required input is missing and cannot be inferred from provided artifacts.
- The task requires external publishing but the required governance approval is not present.
- The requested action is outside the skill scope selected by `SKILL.md`.
