---
name: 04-test-design-high-level
description: >
  Design a high-level test design as a Markdown outline for functions with complex logic,
  enabling a quick review before writing detailed test cases. This step is optional
  and should only be run when needed. Mandatory output: Markdown outline + 9-item review gate checklist.
---

# High-Level Test Design

> **Output language:** → See SKILL.md output rules.

> **MANDATORY**: Read this entire skill BEFORE starting. Do not skip any step.

## When to use this skill

Use when one or more of the following signals are present:
- Function has many logic branches, many rules, or many dependent systems.
- Multiple processing modes exist (AI + Rule, fallback, override, precedence).
- Team needs a quick scope review before writing detailed test cases.

**Not required** for every request.

## Read First

- Read `project/qa-config.yaml` if it exists.
- Governance gate: L1 — auto-complete; no QA Lead review required.
- Read `references/test-design-mindmap-template.md` to get the Markdown outline template.
- **MANDATORY — read document images**: When reading a requirement `.md` file, check whether a folder with the same name (without `.md`) exists in the same directory. If so, read all image files in that folder before analysis. Images may contain diagrams, flows, or UI mockups not present in the text.

## Inputs

- AC/User Story/BR for the relevant function (required)
- Test Plan and/or qa-config.yaml (if available)
- List of functions/modules to review (if specified by user)

If AC/BR with meaningful content is missing, write `[Needs to be added]` and stop.

## Mandatory Workflow

### Step 1 — Define boundary and actors

- Feature boundary, actors, states, critical paths.
- All relevant UI channels (Web / App / API).

### Step 2 — Generate Markdown outline (required format)

Use **exactly 1 format**: Markdown outline/Markmap. Do not use tables or other formats.

Required structure:
```
# HLTC: [Feature name]
## Main flow
### [Sub flow 1]
#### UI (Web / App / API)
#### Validation
- Authorization: [required permissions]
- Business rule: [important rules]
#### Impact
- Affects: [module/data]
#### Abnormal case
- Timeout
- Network/system error
### [Sub flow 2]
...
```

Mandatory branches with minimum content:
- **Function/Sub flow**: list primary AC/sub flows
- **UI**: if multi-channel, must include Web/App/API
- **Validation**: authorization + important business validation
- **Impact**: current functions + data impact/cut-off data
- **Abnormal case**: timeout + network/system error
- **Negative**: at least 1 negative branch for each important rule

If there are precedence rules: describe them clearly in the outline, state the criteria for selecting the priority rule.

### Step 3 — Review Gate (mandatory, exactly 9 items)

Evaluate exactly these 9 items (do not add or remove any):

- [ ] All main Function/Sub flow branches are covered
- [ ] UI coverage matches the required channels (Web/App/API)
- [ ] Validation covered: authorization + important business rules
- [ ] Impact covered: current functions and data impact
- [ ] Abnormal cases covered: timeout and network/system error
- [ ] At least 1 negative branch per important rule is covered
- [ ] Smoke branches are clearly identified
- [ ] No obvious contradictions with AC/BR
- [ ] Team has reviewed and confirmed "Approved" high-level scope

Required gate result line (must appear in the file):
```
Gate result: Approved / Not Approved
```

### Step 4 — Handle gate result

**Approved**: proceed to Skill 05 (gen-tc-functional) to write detailed TCs.

**Not Approved**: update the HLTC outline, re-review before proceeding to Skill 05.

## Approved / file state rules

- The HLTC is considered finalized only when an explicit review confirmation and Approved status from the user/team exists in the current context.
- When Approved is confirmed, immediately update the HLTC file:
  - Tick `[x] Team has reviewed and confirmed "Approved" high-level scope`
  - Change the `Gate result` line to `Approved`
- Do not leave the file in `Not Approved` state if the latest context has confirmed Approved.
- All subsequent steps that depend on the HLTC must be based on the state recorded in the file — not on verbal exchanges in chat.

## File save path

`testing-output/test-cases/hltc/hltc-{module}-{sprint}-v{semver}-{yyyy-mm-dd}_{HHmm}.md`
→ Prefer `output_paths.test_cases.hltc` from qa-config if available.

## Completion Status

| Status | Condition |
|---|---|
| `DONE` | Valid Markdown outline + 9-item checklist + clear `Gate result` line + file saved to correct path |
| `BLOCKED` | Missing AC/BR with meaningful content |
| `NEEDS_CONTEXT` | AC/BR insufficient to determine scope — list clarification questions |

## Checklist before DONE

- [ ] Markdown outline covers all main branches + at least 1 negative branch per important rule
- [ ] Review Gate 9 items fully ticked
- [ ] Gate result line is clear: `Gate result: Approved` or `Not Approved`
- [ ] File saved to `testing-output/test-cases/hltc/` with version and timestamp in filename
- [ ] Execution record appended to `governance/audit-log.md`
- [ ] `project/session-state.yaml` updated → `last_execution`

## Stop Conditions

- Missing AC/BR and cannot be inferred from existing artifacts.
- Task requires external publishing but governance approval is not present.
- Action is outside the scope of this skill.
