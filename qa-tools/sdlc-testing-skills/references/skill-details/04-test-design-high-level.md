# Detailed Procedure: 04-test-design-high-level

> Token-saving archive of the previous full sub-skill body. Read only when the compact sub-skill needs exact legacy wording, templates, or edge-case procedures.

## ⚑ Pre-DONE Checklist

- [ ] Markdown outline has all main branches + at least 1 negative branch per important rule
- [ ] Review Gate with all 9 items ticked
- [ ] Gate result clearly stated: `Gate result: Approved` or `Not Approved`
- [ ] File saved to `testing-output/test-cases/hltc/` with timestamp in the name
- [ ] Append execution record to `governance/audit-log.md`
- [ ] Update `project/session-state.yaml` → `last_execution`, `notes`

---

**IMPORTANT NOTE:**
> **The HLTC file must be saved to the standard output path `testing-output/test-cases/hltc/` and follow the format: `hltc-{module}-{sprint}-v{semver}-{yyyy-mm-dd}_{HHmm}.md`.**

**Pre-completion checklist:**
- [ ] Have read the HLTC file saving instructions carefully
- [ ] Have identified the correct directory and file naming format
- [ ] Have completed the HLTC finalization step (review, Approved outline with team, confirmed coverage)

**Process notes:**
- If HLTC already exists, it MUST be used as input for detailed test cases (functional TC, SIT TC, etc.).
- Only proceed to writing detailed test cases after the HLTC has been reviewed/finalized with the team.
---
---



## Approval and State Synchronization Rules

- HLTC is only considered finalized when there is a review confirmation and Approved from the user or team in the current context.
- When Approved is confirmed, the HLTC file just created must be updated immediately:
  - tick `[x] Team has reviewed and finalized "Approved" high-level scope`
  - change the `Gate result` line to `Approved`
- The file must not remain in a `Not Approved` state if the latest context has already confirmed Approved.
- If Approved has not been confirmed, keep `Not Approved` and do not assume it has been finalized.
- All subsequent steps that depend on HLTC must be based on the latest state recorded in the file, not on verbal exchanges or comments that were not followed up with a file update.

## Objective

- Create a high-level test case set in Markdown outline format for quick team review.
- Finalize the test scope before entering Skill 05 (gen-tc-functional) to write detailed test cases.
- Minimize the risk of writing detailed TCs and then discovering missing case groups.

## When to Use

Use Skill 04 (qa-core/04-test-design-high-level) when any of the following applies:
- The function has many logic branches, many rules, many dependent systems.
- There are multiple processing modes (AI + Rule, fallback, override, precedence).
- The team needs a quick scope review before going into detail.

Not required for every request.

## Inputs

- AC/User Story/BR related to the function (mandatory)
- Test Plan and/or qa-config.yaml (if already available)
- List of functions/modules to review (if specified by user)

If meaningful AC/BR is missing -> write [To be added] and stop.

## Mandatory Outputs

1. Markdown outline (text-first) must strictly follow the Markmap/Markdown outline format as per the template
2. Review gate checklist (Approved/Not Approved + action)
3. Mermaid/diagram is optional only if the team needs a visual review (does not replace the main outline)

Use only the Markdown outline/Markmap format for HLTC. Do not use detailed tables or other formats.
Mandatory template:
- ../../references/test-design-mindmap-template.md

## Design Rules

1. HLTC outline must follow exactly 1 format (Markdown outline/Markmap) as per the template:
  - Main topic/Main flow
  - Function/Sub flow
  - UI (Web/App/API)
  - Validation
  - Impact
  - Abnormal case
  (See detailed examples in references/test-design-mindmap-template.md)

2. Do not use detailed listing tables, do not use an HLTC table for the high-level outline. If detailed mapping is needed, place it separately at the end of the file.

3. Prioritize high-level content; do not go into detail on individual test steps.

4. Minimum required content in branches:
- Function/Sub flow: list main AC/Sub flows
- UI: if multi-channel, must include Web/App/API
- Validation: authorization + important business validation
- Impact: current functions + data impact/cut-off data
- Abnormal case: timeout + network/system error

5. If there are rule priority rules:
- Describe precedence clearly in the outline.
- If multiple rules apply, clearly state the criteria for choosing the priority rule.

## Review Gate (mandatory)

Evaluate against the following checklist (must use exactly these items, do not add or remove):

- [ ] All main Function/Sub flow branches covered
- [ ] UI covered for the correct channels (Web/App/API)
- [ ] Validation covered: authorization + key business rules
- [ ] Impact covered: current functions and data impact
- [ ] Abnormal case covered: timeout and network/system error
- [ ] At least 1 negative branch per important rule covered
- [ ] Branches requiring Smoke testing clearly identified
- [ ] No obvious contradictions with AC/BR
- [ ] Team has reviewed and finalized "Approved" high-level scope

Gate result: Approved / Not Approved

Gate decision:
- Approved: Proceed to Skill 05 (gen-tc-functional) to write detailed TCs
- Not Approved: Update HLTC outline, re-review before entering Skill 05

Next steps if Approved:
- Skill 05 (gen-tc-functional): Write detailed Functional TCs
- Skill 06 (gen-tc-sit): Write detailed SIT TCs if integration is involved

If Approved is received after the file has been created:
- Reopen the current HLTC file and update the checklist/gate first
- Save the HLTC file
- Only then proceed with Skill 05 (gen-tc-functional) / Skill 06 (gen-tc-sit)

## Save file to

`output_paths.test_cases.hltc` from qa-config (default: `testing-output/test-cases/hltc/`)
-> `hltc-{module}-{sprint}-v{semver}-{yyyy-mm-dd}_{HHmm}.md`

## Definition of Done

- Valid Markdown outline, readable, easy to review
- Review gate checklist (9 standard items) and a result line: `Gate result: Approved / Not Approved`
- File saved to the correct `test-cases/hltc/` directory, with version and timestamp in the filename
- If Approved has been confirmed, the file must accurately reflect the final state: Approved checklist is ticked and gate = Approved
- If Not Approved, must not conclude that detailed TC writing can proceed

## File saving compliance checklist (mandatory)

- [ ] File saved to the correct directory `testing-output/test-cases/hltc/` or path override from qa-config
- [ ] Filename follows the pattern: `hltc-{module}-{sprint}-v{semver}-{yyyy-mm-dd}_{HHmm}.md`
- [ ] File content includes: Markdown outline, 9-item standard review gate checklist, Approved/Not Approved result line
- [ ] Version, timestamp, module, and sprint in the filename have been verified
