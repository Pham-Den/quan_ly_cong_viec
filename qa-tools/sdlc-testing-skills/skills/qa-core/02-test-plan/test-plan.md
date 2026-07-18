---
name: 02-test-plan
description: >
  Create a comprehensive Master Test Plan & Strategy for a project or major milestone (MVP, launch, kickoff).
  Includes: Entry/Exit Criteria, Strategy matrix, NFT breakdown, KPI metrics, Approval section.
  Trigger: master test plan, overall test plan, QA strategy, test plan MVP, project test plan.
  Output: complete .md file with 11 sections following IEEE 829 / ISTQB standard.
---

# Master Test Plan

> **Output language:** → See SKILL.md output rules.

Compact workflow. Read the detailed procedure only when exact legacy wording or edge cases are needed:
`references/skill-details/02-test-plan.md`.

## Read First

- Read `project/qa-config.yaml` only if it exists and the task needs project config.
- Use `references/INDEX.md` to choose optional references; do not open all references.
- Governance gate: L1 — auto-complete; save artifacts, update audit/session state.
- **MANDATORY — read document images**: When reading a requirement `.md` file, check whether a folder with the same name (without `.md`) exists in the same directory. If so, read all image files in that folder before analysis. Images may contain diagrams, flows, or UI mockups not present in the text.

## Inputs

- Project/milestone scope, timeline, team, environments, tools, target release, risks, and requirement source

## Core Workflow

1. Read existing qa-config only if present; otherwise collect required planning fields.
2. Define scope, test levels, strategy, environments, entry/exit/suspension criteria, roles, schedule, risks, and artifacts.
3. Use the test plan template only for exact section structure.
4. Generate qa-config from the plan using the schema; keep secrets as env references only.
5. Save artifacts using project folder convention and update governance state.

## Outputs

- Master Test Plan markdown
- project/qa-config.yaml or project-local equivalent

## References

- references/test-plan-template.md
- references/qa-config-schema.yaml
- references/project-folder-convention.md

## Stop Conditions

- Required input is missing and cannot be inferred from provided artifacts.
- The task requires external publishing but the required governance approval is not present.
- The requested action is outside the skill scope selected by `SKILL.md`.
