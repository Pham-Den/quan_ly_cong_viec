---
name: 13-go-no-go
description: >
  Execute the Go/No-Go decision: consolidate all quality metrics, compare against exit
  criteria, assess risks, and deliver a deploy recommendation. Trigger: go/no-go, deploy
  decision, release assessment, confirm deploy, release gate, is it ready to release.
  Output: Go/No-Go Report with a clear recommendation.
---

# Go/No-Go Decision

> **Output language:** → See SKILL.md output rules.

Compact workflow. Read the detailed procedure only when exact legacy wording or edge cases are needed:
`references/skill-details/13-go-no-go.md`.

## Read First

- Read `project/qa-config.yaml` only if it exists and the task needs project config.
- Use `references/INDEX.md` to choose optional references; do not open all references.
- Governance gate: L3 — save artifacts, emit blocking approval request, stop until explicit stakeholder approval.

## Inputs

- Sprint report, UAT result if required, open bugs, security/performance/accessibility results, release readiness evidence

## Core Workflow

1. Collect quality, UAT, security, performance, accessibility, deployment, rollback, and monitoring evidence.
2. Evaluate gates against configured criteria and document source of each threshold.
3. State GO, CONDITIONAL GO, NO-GO, or BLOCKED with reasons and residual risks.
4. List required actions, owners, and deadlines.
5. Emit blocking L3 approval request; do not publish/update systems before approval.

## Outputs

- Go/No-Go report and recommendation

## References

- references/report-template.md
- references/bug-severity.md
- references/performance-baseline.md

## Stop Conditions

- Required input is missing and cannot be inferred from provided artifacts.
- The task requires external publishing but the required governance approval is not present.
- The requested action is outside the skill scope selected by `SKILL.md`.
