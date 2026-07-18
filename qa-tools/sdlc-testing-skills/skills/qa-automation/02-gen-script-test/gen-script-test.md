---
name: 02-gen-script-test
description: >
  Generate automation test scripts from test cases: Robot Framework using the Playwright library. Trigger: automation script, gen script,
  write test code, Robot Framework, test
  automation.
  Output: immediately runnable code files, CI-ready.
---

# Generate Automation Script

> **Output language:** → See SKILL.md output rules.

Compact workflow. Read the detailed procedure only when exact legacy wording or edge cases are needed:
`references/skill-details/02-gen-script-test.md`.

## Read First

- Read `project/qa-config.yaml` only if it exists and the task needs project config.
- Use `references/INDEX.md` to choose optional references; do not open all references.
- Governance gate: L2 — save artifacts, emit sign-off request, wait for explicit approval before publishing.

## Inputs

- Approved TC file or selected TC rows, test data, target framework/tool, environment/auth details

## Prerequisite

Skill A1 (setup-automation) **must have run first** to create the project scaffold under `testing-output/automation/`. If the scaffold does not exist, stop and run skill A1 before proceeding.

## Core Workflow

1. Select only TC rows marked automation-ready or explicitly requested.
2. **MANDATORY — Mapping Matrix before any code**: Output a table `TC ID | Step description | Existing keyword (path) | New keyword needed` for every selected TC. Do not write a single line of code until this table is complete and confirmed. Reuse keywords from `KeywordLibraries/CommonKeyword/` — never regenerate what already exists there.
3. Generate scripts using the configured framework; default Robot Framework only when no framework is specified.
4. Keep data and credentials externalized; never hard-code secrets or environment URLs.
5. Emit L2 Dev/QA review request before publishing or marking done.

## Outputs

- Automation script files, keyword/resource files, data files, and mapping matrix

## References

- references/ai-execution-spec.md — mandatory for all frameworks
- references/automation-framework-policy.md — organization project policy
- references/rf-keyword-convention.md — overview of 3-layer Robot Framework architecture
- references/rf-ui-rule.md — detailed rules for generating UI keywords (Browser/Playwright)
- references/rf-api-rule.md — detailed rules for generating API keywords (RESTinstance/Swagger)

## Stop Conditions

- Required input is missing and cannot be inferred from provided artifacts.
- The task requires external publishing but the required governance approval is not present.
- The requested action is outside the skill scope selected by `SKILL.md`.
