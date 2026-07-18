---
name: 08-gen-data-test
description: >
  Generate detailed test datasets from a test case list: BVA boundary values,
  EP partitions, synthetic PII-safe data, datasets for Data-Driven TCs, teardown scripts.
  Trigger: data test, test data, generate data, test data, prepare test data.
  Output: TSV Master dataset + TC Coverage Map + Data-Driven table + SQL/script teardown.
---

# Generate Test Data

> **Output language:** → See SKILL.md output rules.

Compact workflow. Read the detailed procedure only when exact legacy wording or edge cases are needed:
`references/skill-details/08-gen-data-test.md`.

## Read First

- Read `project/qa-config.yaml` only if it exists and the task needs project config.
- Use `references/INDEX.md` to choose optional references; do not open all references.
- Governance gate: L1 — auto-complete; save artifacts, update audit/session state.

## Inputs

- Approved TC files, data rules, environment constraints, reset/teardown constraints

## Core Workflow

1. Identify data classes from TC preconditions and test data fields.
2. Generate valid, invalid, boundary, permission, stateful, and dependency data sets.
3. Mark sensitive values as placeholders or env references; do not include real secrets.
4. Add teardown or reset instructions where state changes matter.
5. Save under `output_paths.test_data` or default test-data folder.

## Format output — 2 options

**Format A — Standard 6-column** (default, use for BVA/EP with multiple variants):
```
TC_ID	Dataset_ID	Test_Data	Type	Teardown	Notes
```
- `Test_Data`: all field=value pairs on one line, separated by `; `
- `Type`: `BVA-min` / `EP-valid` / `EP-invalid` / `Normal` / `Corner`
- A TC may have multiple rows if multiple variants are needed (BVA sub-values, EP partitions)

**Format B — Flat all-in-one** (use when each TC has exactly one data set, or when the TSV file is the sole source for running automation):
- 1 row per TC, all fields as separate columns (no Dataset_ID)
- Complex payloads (JSON, container image, API payload) inline in their respective column
- Preferred when: TC is a happy path, no BVA/EP variants needed, and the team uses TSV for review instead of YAML

Example header for Format B:
```
TC_ID	TC_Summary	Role	Account_Email	Entity_ID	Workspace_ID	Stage_ID	Agent_Name	Agent_Type	Agent_Version	Container_Image	Flow_JSON	Expected_HTTP	Expected_Status	Teardown	Notes
```

**When to use each format:**
| Situation | Format |
|---|---|
| TC has multiple BVA/EP variants | A (6-column) |
| Happy path, 1 data set per TC | B (flat) |
| Team uses YAML for RF, TSV only for review | B (flat, export YAML when needed) |
| Need to import into QMetry or Google Sheet | A (6-column) |

## Outputs

- Master test data file (Format A or B depending on the situation)
- Optional teardown/cleanup notes or scripts

## References

- references/project-folder-convention.md

## Stop Conditions

- Required input is missing and cannot be inferred from provided artifacts.
- The task requires external publishing but the required governance approval is not present.
- The requested action is outside the skill scope selected by `SKILL.md`.
