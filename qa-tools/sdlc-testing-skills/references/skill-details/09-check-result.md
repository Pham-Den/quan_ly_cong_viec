# Detailed Procedure: 09-check-result

> Token-saving archive of the previous full sub-skill body. Read only when the compact sub-skill needs exact legacy wording, templates, or edge-case procedures.

## Pre-DONE Checklist

> **L2 — QA Lead review required (SLA: 4h).** Do not send output to the user until "Approved" is received. See the Sign-off section at the end of this file.

- [ ] Daily report complete: pass/fail/blocked, bug triage, health score calculated
- [ ] Action items are clear with specific assignees
- [ ] L2 sign-off request has been emitted, awaiting QA Lead reply
- [ ] Append execution record to `governance/audit-log.md`
- [ ] Update `project/session-state.yaml` → `last_execution`, `sprint_progress`, `pending_sign_offs`

---

## Step 0 — Read improvement log

Before analyzing results, read `feedback/improvement-log.md` to:
- Review `top_actions` from the previous sprint that are still `pending` → prioritize monitoring those actions today
- Identify which modules have an increasing `delta_vs_prev` → monitor more carefully during today's triage
- Apply lessons learned to defect pattern analysis and coverage delta

If the file does not yet exist → skip, start from zero.

---

## Inputs

| Information | Required |
|---|---|
| TC results (pass/fail/blocked — text/TSV/paste format) | ✅ |
| List of newly discovered bugs (if any) | Recommended |
| Sprint Snapshot from yesterday (paste from the `Sprint Snapshot` block of the previous day's Daily Report) | Recommended |
| Run type: `Full` / `Re-run` / `Smoke` (default `Full` if not specified) | Recommended |
| Run sequence number for the day — if running multiple times on the same day (default `1`) | Recommended |
| Original test plan (for progress comparison) | Recommended |
| Current date and sprint end date | Recommended |

> **How to use Sprint Snapshot:**
> - First day: no snapshot → start from zero.
> - Subsequent days: paste the `### Sprint Snapshot` block from yesterday's Daily Report here → Skill 07 auto-merges and updates cumulative totals.
> - End of sprint: paste the `### Sprint Snapshot` block from the last day into Skill 08 — all data is already included, no manual aggregation needed.
> - The machine-readable block required for auto-merge is the YAML `improvement_snapshot` block; if only a Markdown table is present, fall back to manual run and mark `DONE_WITH_CONCERNS`.

If the project has `qa-config.yaml` → read it before analyzing:
- `exit_criteria.*` → pass rate threshold, health score, max S1/S2 open for comparison
- `suspension_criteria.*` → blocked_tc_rate and env_down_hours thresholds to assess whether to suspend
- `tools.communication` → channel to escalate when blockers arise
- `scope.modules` → use as the standard `module` key for defect pattern and coverage delta

## Analysis

### 1. Aggregate metrics

If a Sprint Snapshot from yesterday exists → use the TC list and statuses from the snapshot as the base, then update the latest status of TCs run today.
If none → start from zero.

> **TC accumulation rule:** Each TC is counted **only once** by its **most recent status**. If TC-001 was Fail yesterday and Pass today → count as Pass; do not add the old Fail. Total = number of unique TCs by current status.

- Total cumulative TCs: pass / fail / blocked / not run (most recent status per TC, not summing run counts)
- Pass rate = pass / (pass + fail) × 100%
- Block rate = blocked / total × 100%
- Progress vs plan: executed / total TCs to run

### 2. Bug triage
Read `../../references/bug-severity.md` to apply the correct classification.
For each new bug today: assign Severity (S1–S4) + Priority (P1–P4) + Category + proposed action.
If a Sprint Snapshot from yesterday exists → keep the existing bug list and append today's new bugs to the cumulative list.

**Standard triage table:**

| Bug ID | Short description | Severity | Priority | Category | Assigned | Action |
|---|---|---|---|---|---|---|
| BUG-001 | {description} | S1/S2/S3/S4 | P1/P2/P3/P4 | Functional/Visual/UX/Content/Performance/Console/Accessibility | {Dev} | Fix immediately / Fix this sprint / Backlog |

### 2.5 Bug classification by Category (7 types)
Read `../../references/bug-severity.md` section "7 Defect Classification Categories".
Assign exactly 1 of 7 categories to each bug: Visual, Functional, UX, Content, Performance, Console, Accessibility.

Summarize the distribution by category to identify the most problematic areas.

### 2.6 Defect Pattern by module (for sprint handoff)
- Use the `module` key from `scope.modules` in `qa-config.yaml`.
- Aggregate by `module + category` to build the standard pattern table.
- If no baseline from the previous sprint is available, fill `vs prev sprint = —` and `signal = —`.

**Defect Pattern by Module table:**

| module | category | count | vs prev sprint | signal |
|---|---|---|---|---|
| {module} | {Functional/Visual/UX/Console/Performance/Accessibility/Content} | {N} | {+N / -N / —} | {increase/decrease/new/stable/—} |

### 3. Calculate Health Score
Read `../../references/report-template.md` to obtain the formula, weights for 8 categories, and deduction rules by severity.

> **Links category rule:** If link checking was not tested in the sprint → set Links score = 100 (no deduction).

Compare the result with `exit_criteria.health_score_baseline` in `qa-config.yaml` (or the Exit Criteria in the Test Plan if config is not available).

### 4. Identify blockers and risks
- Which P1 bugs are blocking further execution?
- Which TC groups are blocked due to environment / data / dependency issues?
- Current Health Score vs exit criteria — is there a risk of not meeting the threshold?
- Should testing be suspended per `suspension_criteria.*` in `qa-config.yaml`?

### 5. Retest scope
List TCs that need retesting after fixes, prioritized P1 → P2 → P3.

### 6. Coverage Delta by module (for sprint handoff)
- Use the same `module` key to join with Defect Pattern.
- `automated` counts only scripts executed in this sprint.
- Do not count scripts that exist in the repo but were not run.

**Coverage Delta by Module table:**

| module | planned TC | executed | automated (*) | gap |
|---|---|---|---|---|
| {module} | {N} | {N} | {N / —} | {executed - automated / —} |

`(*) automated = scripts executed in this sprint; does not count scripts that exist in the repo but were not run in the sprint`

## Output Format — Daily Report

**Common report directory (required):**
- Prefer `output_paths.reports.root` from `qa-config.yaml`
- If no config or `root` is not declared → use default `reports/`

**Save files in the following formats:**
- Markdown: `output_paths.reports.daily` (default: `testing-output/reports/daily/`)
- HTML: `output_paths.reports.html` (default: `testing-output/reports/html/`)
- Need .docx → use `tools/md_to_docx.py` after the .md file is ready

**File naming rules:**
- `daily-report-{yyyy-mm-dd}_{HHmm}-R{N}-v{semver}.md`
- `daily-report-{yyyy-mm-dd}_{HHmm}-R{N}-v{semver}.html`

**Run result manifest (required for each run):**
- Also save: `run-result-{yyyy-mm-dd}_{HHmm}-R{N}.yaml` at `output_paths.reports.daily` (default: `testing-output/reports/daily/`)
- Minimum content: `run_id`, `run_type`, `artifact_version`, `timestamp`, `result`, `metrics`, `bug_summary`, `report_files`
- `result` uses one of 4 standard values: `SUCCESS|PARTIAL|FAILED|BLOCKED`

Run ID is auto-generated using the rule: `{dd/mm/yyyy}-R{N}` where N is the sequence number of the run on that day (R1, R2...).
Example: on 15/04, first run → `15/04/2024-R1`; re-run after fix → `15/04/2024-R2`.

```markdown
## Daily Test Report — [dd/mm/yyyy] | Run [dd/mm/yyyy]-R[N]

**Sprint:** [Sprint name] | **Day:** [X/Y of sprint]
**Run type:** Full / Re-run (after fix [BUG-ID]) / Smoke | **Time:** [HH:mm]
**Scope of this run:** [All TCs / Retest only: TC-XXX, TC-YYY / Smoke suite]

### Progress this run
| Status | TC count | % |
|---|---:|---:|
| Pass | [n] | [x]% |
| Fail | [n] | [x]% |
| Blocked | [n] | [x]% |
| Not Run | [n] | [x]% |
| **Total in scope** | **[n]** | |

**Pass rate this run:** [x]% | **Exit criteria target:** [x]%
**Health Score this run:** [N]/100 (Functional: [N] | Console: [N] | UX: [N] | Visual: [N])

### New bugs in this run
| Bug ID | Description | Severity | Priority | Category | Assigned | Run ID |
|---|---|---|---|---|---|---|

### Bug distribution by Category
| Category | Total | Open | Fixed |
|---|---:|---:|---:|
| Functional | | | |
| Visual / UI | | | |
| UX | | | |
| Console / Errors | | | |
| Performance | | | |
| Accessibility | | | |
| Content | | | |

### Blockers requiring immediate action
[List if any — state bug ID, impact, owner]

### Plan for tomorrow
[Retest scope + new TCs to run — P1 first]

### Risks
[State clearly if progress is behind plan or Health Score is below threshold]

---

### Sprint Snapshot — Cumulative to [dd/mm/yyyy]-R[N]

> This block is used to hand off to the next day (paste at the start of Skill 07) or to Skill 08 at end of sprint.

**Run history:**
| Run ID | Type | Time | Scope | Pass | Fail | Blocked |
|---|---|---|---|---:|---:|---:|
| [dd/mm]-R1 | Full | HH:mm | All TCs | [n] | [n] | [n] |
| [dd/mm]-R2 | Re-run | HH:mm | TC-XXX, TC-YYY | [n] | [n] | [n] |

**Cumulative TCs (most recent status per TC):**
| Status | Cumulative total |
|---|---:|
| Pass | [n] |
| Fail | [n] |
| Blocked | [n] |
| Not Run | [n] |
| Total in scope | [n] |

**Cumulative bug list (all bugs since start of sprint):**
| Bug ID | Short description | Severity | Priority | Category | Status | Run ID discovered |
|---|---|---|---|---|---|---|
| BUG-001 | ... | S? | P? | ... | Open/Fixed/Verified | [dd/mm]-R1 |

**Cumulative Health Score:** [N]/100
(Functional: [N] | Console: [N] | UX: [N] | Accessibility: [N] | Visual: [N] | Performance: [N] | Links: [N] | Content: [N])

**Defect Pattern by Module (snapshot):**
| module | category | count | vs prev sprint | signal |
|---|---|---|---|---|
| [module] | [category] | [n] | [+/−/—] | [signal] |

**Coverage Delta by Module (snapshot):**
| module | planned TC | executed | automated (*) | gap |
|---|---:|---:|---:|---:|
| [module] | [n] | [n] | [n/—] | [n/—] |

`(*) automated = scripts executed in this sprint; does not count scripts that exist in the repo but were not run in the sprint`

### improvement_snapshot (machine-readable)

```yaml
improvement_snapshot:
  sprint: {project.sprint}
  date: {yyyy-mm-dd}
  modules:
    - module: {module}
      defect_pattern:
        - category: {category}
          count: {N}
          delta_vs_prev: {+N|-N|0|NA}
      coverage_delta:
        planned_tc: {N}
        executed_tc: {N}
        automated_executed_tc: {N|NA}
        gap: {N|NA}
  top_actions:
    - type: {TC Design|Automation|Process|Environment}
      owner: {role/name}
      action: {specific action}
      due_in_sprint: {Sprint-X}
```

If no baseline from a previous sprint is available, use `NA` for delta.
```

Minimum required schema for this block: `sprint`, `date`, `modules[]`, `top_actions[]`.

## When pass rate < exit criteria

Automatically warn and propose one of three actions:
1. Accelerate retesting if many bugs have already been fixed
2. Reduce P3 scope if time is short
3. Escalate to QC Lead / PM if P1 is still open

## Completion Status

At the end of each day's analysis, report the status:

- **DONE** — Results fully analyzed, daily report complete, health score calculated
- **DONE_WITH_CONCERNS** — Complete but: {Pass rate below expectation / Health Score below threshold / S1 still open / Sprint Snapshot contains only Markdown, missing YAML `improvement_snapshot` block / Run result manifest recorded as `PARTIAL`}
- **BLOCKED** — Cannot analyze due to: {Insufficient results / Missing bug information / Environment not stable}
- **NEEDS_CONTEXT** — Additional input needed: {Complete bug list / Test plan for progress comparison / Sprint end date}



---

## Final Step — Tool Integration + Sign-off + Audit Log

### 1. Publish artifacts (after report is complete)

If the project has Confluence config in qa-config.yaml:
```bash
python tools/confluence_publish_markdown.py \
  --file "testing-output/reports/daily/daily-report-{date}-R{N}.md" \
  --parent-page "{confluence.parent_pages.reports}"
```

If the project has Jira config → update sprint status:
```bash
python tools/jira_sync.py --action comment \
  --issue "{sprint_ticket_id}" \
  --comment "Daily report {date}: Pass {N}%, Health {N}/100. Details: [Confluence link]"
```

**Only perform tool integration when:** QA Lead has confirmed or the user explicitly requests a push.

### 2. Sign-off Request (L2)

```
---
⏳ SIGN-OFF REQUEST — 09-check-result (Level 2 — QA Lead)
Reviewer: [team.qc_lead from qa-config]
SLA: 4 hours
Output: testing-output/reports/daily/daily-report-{date}-R{N}.md
Action: Reply "Approved" or "Needs adjustment: [details]"
---
```

### 3. Audit Log

Append to `governance/audit-log.md`:
```yaml
execution_record:
  id: "{yyyy-mm-dd}-{HHmm}-09-check"
  timestamp: "{yyyy-mm-ddTHH:mm}"
  skill: "09-check-result"
  project: "{project.name}"
  sprint: "{project.sprint}"
  executor: "{executor}"
  input_summary: "Run {run_id}: Pass {N}, Fail {N}, Blocked {N}, {N} new bugs"
  output_paths:
    - "testing-output/reports/daily/daily-report-{date}-R{N}.md"
    - "testing-output/reports/daily/run-result-{date}-R{N}.yaml"
  status: "DONE | DONE_WITH_CONCERNS | BLOCKED"
  requires_human_review: true
  reviewer: null
  reviewed_at: null
  sign_off_status: "PENDING"
```
