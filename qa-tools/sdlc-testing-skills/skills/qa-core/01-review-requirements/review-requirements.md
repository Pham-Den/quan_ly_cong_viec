---
name: 01-review-requirements
description: >
  Review requirement documents from 3 perspectives: QC Expert, End User, BA/Senior Dev.
  Identify issues that block development and testing before writing test cases.
  Trigger: review requirements, review AC, review BR, assess requirements, check requirements, analyse requirements.
  Output: TSV issues list (paste into Google Sheet) + summary.
---

# Review Requirements

> **Output language:** → See SKILL.md output rules.

Compact workflow. Read the detailed procedure only when exact legacy wording or edge cases are needed:
`references/skill-details/01-review-requirements.md`.

## Read First

- Read `project/qa-config.yaml` only if it exists and the task needs project config.
- Use `references/INDEX.md` to choose optional references; do not open all references.
- Governance gate: L1 — auto-complete; save artifacts, update audit/session state.
- **MANDATORY — read document images**: When reading a requirement `.md` file, check whether a folder with the same name (without `.md`) exists in the same directory. If so, read all image files in that folder before analysis. Images may contain diagrams, flows, or UI mockups not present in the text.

## Inputs

- Requirement documents: AC, BR, PRD, user story, API spec, or synced Confluence/Jira content

## Core Workflow

1. Identify requirement scope and source documents.
2. Extract actors, business rules, acceptance criteria, flows, NFRs, dependencies, and constraints.
3. Check testability, consistency, completeness, edge cases, negative flows, permission rules, data rules, and observability.
4. Classify each finding by impact and owner; do not invent missing requirements.
5. Return a concise review report with `[Needs to be added]` for missing mandatory information.

## Outputs

- Requirement review report with gaps, risks, ambiguities, missing AC, and clarification questions

## References

- references/bug-severity.md only when classifying requirement defects

## Stop Conditions

- Required input is missing and cannot be inferred from provided artifacts.
- The task requires external publishing but the required governance approval is not present.
- The requested action is outside the skill scope selected by `SKILL.md`.
