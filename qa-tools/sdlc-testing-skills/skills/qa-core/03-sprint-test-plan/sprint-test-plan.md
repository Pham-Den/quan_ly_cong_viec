---
name: 03-sprint-test-plan
description: >
  Create a concise Sprint Test Plan — 5-section structure matching the team's current practice.
  Sprint-specific content: objectives, ticket scope + risk, schedule, resources + capacity,
  exit criteria, references. Strategy, test techniques, and KPIs reference the Master Test Plan.
  Trigger: sprint test plan, test plan sprint, sprint test planning, QA plan sprint N.
  Prerequisite: a Master Test Plan must already exist. If not → use skill 02 (qa-core/02-test-plan) first.
  Output: .md file with 5 sections.
---

# Sprint Test Plan

> **Output language:** → See SKILL.md output rules.

Compact workflow. Read the detailed procedure only when exact legacy wording or edge cases are needed:
`references/skill-details/03-sprint-test-plan.md`.

## Read First

- Read `project/qa-config.yaml` only if it exists and the task needs project config.
- Use `references/INDEX.md` to choose optional references; do not open all references.
- Governance gate: L1 — auto-complete; save artifacts, update audit/session state.
- **MANDATORY — read document images**: When reading a requirement `.md` file, check whether a folder with the same name (without `.md`) exists in the same directory. If so, read all image files in that folder before analysis. Images may contain diagrams, flows, or UI mockups not present in the text.

## Inputs

- Sprint scope, selected stories/features, Master Test Plan or qa-config.yaml, team capacity, environment availability

## Core Workflow

1. Read qa-config if present and reuse project strategy/criteria.
2. Identify sprint-specific scope, exclusions, risk changes, target artifacts, ownership, and schedule.
3. Reuse Master Test Plan sections by reference instead of duplicating unchanged content.
4. Call out dependencies, blockers, and deviations from the master plan.
5. Save the sprint plan and update audit/session state.

## Outputs

- Sprint Test Plan markdown

## References

- references/test-plan-template.md
- references/project-folder-convention.md

## Stop Conditions

- Required input is missing and cannot be inferred from provided artifacts.
- The task requires external publishing but the required governance approval is not present.
- The requested action is outside the skill scope selected by `SKILL.md`.
