# Detailed Procedure: 10-test-report

> Token-saving archive of the previous full sub-skill body. Read only when the compact sub-skill needs exact legacy wording, templates, or edge-case procedures.

## Pre-DONE Checklist

> **L2 — QA Lead review required (SLA: 8h).** Do not send output to the user until "Approved" is received. See the Sign-off section at the end of this file.

- [ ] All sections present per report-template.md
- [ ] Health Score calculated with the correct formula, breakdown per category clearly stated
- [ ] Ship Readiness compared against `exit_criteria` from `qa-config.yaml`
- [ ] No remaining `{...}` placeholders in the main content
- [ ] L2 sign-off request has been emitted, awaiting QA Lead reply
- [ ] Append execution record to `governance/audit-log.md`
- [ ] Update `project/session-state.yaml` → `last_execution`, `sprint_progress`, `pending_sign_offs`

---

## Step 0 — Read improvement log

Before aggregating the report, read `feedback/improvement-log.md` to:
- Compare `defect_pattern` for this sprint vs the previous sprint (column `vs prev sprint`)
- Check whether `top_actions` from the previous sprint have `status: done` → record in Structured Lessons Learned
- Identify which modules have a positive / negative trend to highlight in Ship Readiness

If the file does not yet exist → set `delta_vs_prev = NA` for all modules.
After completing the report, **append a new `improvement_snapshot` block** to `feedback/improvement-log.md`.

---

## Inputs

| Information | Required |
|---|---|
| Sprint Snapshot from the last day of the sprint (the `Sprint Snapshot` block from Skill 07) | ✅ (preferred) |
| Aggregated TC results (pass/fail/blocked/not run) — if no Sprint Snapshot | ✅ (fallback) |
| Complete bug list (ID, description, severity, priority, status) — if no Sprint Snapshot | ✅ (fallback) |
| Original Test Plan (to obtain scope if config is not available) | Recommended |
| Sprint name, start date / end date | ✅ |

> **Prefer Sprint Snapshot:** The `Sprint Snapshot` block from Skill 07 already accumulates all TC counts + complete bug list from every day → paste directly, no manual aggregation needed.
> If no Sprint Snapshot exists (e.g., Skill 07 was not used during the sprint) → provide fallback: aggregated TC results + complete bug list.

If the project has `qa-config.yaml` → read it first, taking precedence over the Test Plan:
- `exit_criteria.*` → pass_rate, health_score_baseline, max_s1_open, max_s2_open, tc_executed_rate
- `suspension_criteria.*` → to assess whether any suspension occurred during the sprint
- `team.*` → names of team members for the report header
- `definition_of_done` → to assess whether the sprint met the DoD
- `tools.communication` → channel to send the report

Precedence rule when thresholds conflict:
- If `qa-config.yaml` and the Test Plan differ, use `qa-config.yaml` as the primary source.
- The report must clearly state the source of thresholds used: `qa-config` or `test-plan-fallback`.

If required information is missing → write `[Needs to be provided]`, ask again. Do not guess.

---

## Step 1 — Aggregate metrics for the full sprint

**If Sprint Snapshot exists (from Skill 07 on the last day):**
- Take cumulative TC counts and bug list directly from the `Sprint Snapshot` block — already complete, no recalculation needed.
- Proceed directly to Step 2.

**If no Sprint Snapshot (fallback):**
- Total TCs by status: pass / fail / blocked / not run
- Pass rate = pass / (pass + fail) × 100%
- Total bugs: by severity (S1/S2/S3/S4) and status (open/fixed/verified/deferred)

Compare against Exit Criteria from `qa-config.yaml` (if available) or the Test Plan (fallback).

---

## Step 2 — Calculate Health Score

Read `../../references/report-template.md` for the formula and weights.
Read `../../references/bug-severity.md` to classify bugs into 7 categories.

**Formula:**
- Each category starts at 100 points
- Deduct points by severity: S1 = −25, S2 = −15, S3 = −8, S4 = −3
- Multiply by weight: Functional 20%, Console 15%, UX 15%, Accessibility 15%, Visual 10%, Performance 10%, Links 10%, Content 5% (total = 100%)
- If link checking was not tested in the sprint → Links = 100 points (no deduction)
- Health Score = sum of weighted scores

Record Health Score compared to the baseline at the start of the sprint (if available).

---

## Step 3 — Trend analysis

If the Sprint Snapshot records `Date discovered` for each bug → use it to analyze:
- New bugs by day: which days / modules had the highest concentration?
- Retest cycle: how long after discovery were bugs fixed (status Fixed/Verified)?
- Health Score by day: if Skill 07 calculated Health Score daily → list the trajectory.

If no daily data is available → skip this section, note clearly "No daily data available for trend analysis".

**Table A — Defect Pattern by Module:**

| module | category | count | vs prev sprint | signal |
|---|---|---|---|---|
| {module} | {Functional/Visual/UX/Console/Performance/Accessibility/Content} | {N} | {+N / -N / —} | {increase/decrease/new/stable/—} |

- `module`: taken from `scope.modules` in `qa-config.yaml` to use as the join key with Coverage Delta
- `vs prev sprint`: if this is the first sprint or no baseline/qa-improvement-log data exists, write `—`, do not leave blank
- `signal`: inferred from delta per module-category; write `—` if data is insufficient

**Table B — Coverage Delta by Module:**

| module | planned TC | executed | automated (*) | gap |
|---|---|---|---|---|
| {module} | {N} | {N} | {N / —} | {executed - automated / —} |

`(*) automated = scripts executed in this sprint; does not count scripts that exist in the repo but were not run in the sprint`

- Use the same `module` key to join with Table A
- If automation execution data is missing, fill `—` for `automated` and `gap`

---

## Step 4 — Assess Ship Readiness

Compare against Exit Criteria from `qa-config.yaml` (if available) or the Test Plan (fallback):

| Metric | Target (Exit Criteria) | Actual | Met? |
|---|---|---|---|
| Pass rate | ≥ {x}% | {x}% | ✅ / ❌ |
| Health Score | ≥ {N}/100 | {N}/100 | ✅ / ❌ |
| S1 still open | = 0 | {N} | ✅ / ❌ |
| S2 still open | ≤ {N} | {N} | ✅ / ❌ |
| TCs not run | = 0 | {N} | ✅ / ❌ |
| Regression pass | = 100% | {x}% | ✅ / ❌ |

**Ship recommendation:**
- ✅ **Ready to release** — All exit criteria met
- ⚠️ **Conditional release** — Mandatory criteria met, {N} minor issues remain to monitor post-release
- ❌ **Not ready** — {Specific reason: S1 still open / Pass rate {x}% below target {y}%}

---

## Step 5 — Export report

Read `../../references/report-template.md` for the complete standard format.

Additions beyond the base template:
- **Sprint Trend section** (if daily data exists): table-style chart of pass rate by day
- **Structured Lessons Learned** (required, machine-readable):

| # | Type | Description | Module/Skill source | Action next sprint |
|---|---|---|---|---|
| 1 | {TC Design / Automation / Process / Environment} | {specific observation} | {module or skill number} | {targeted action} |

Classifications:
- **TC Design** — coverage gaps or test case design quality issues
- **Automation** — scripts insufficient or not executed in the sprint
- **Process** — collaboration, triage, handoff, or cadence issues
- **Environment** — environment, data, or infrastructure issues for test execution

Export formats:
- Markdown: used directly in the conversation
- HTML: same content as Markdown, preserving sections and tables per `report-template.md`
- Need .docx → use `tools/md_to_docx.py` after the .md file is ready

**Common report directory (required):**
- Prefer `output_paths.reports.root` from `qa-config.yaml`
- If no config or `root` is not declared → use default `reports/`

**Save files in the following formats:**
- Markdown: `output_paths.reports.sprint` (default: `testing-output/reports/sprint/`)
- HTML: `output_paths.reports.html` (default: `testing-output/reports/html/`)

**File naming rules:**
- `sprint-report-{project.sprint}-{yyyy-mm-dd}_{HHmm}-v{semver}.md`
- `sprint-report-{project.sprint}-{yyyy-mm-dd}_{HHmm}-v{semver}.html`

**Run/result traceability for sprint aggregation:**
- Recommended to also export `run-result-{yyyy-mm-dd}_{HHmm}-R{N}.yaml` (or `sprint-result-{yyyy-mm-dd}_{HHmm}.yaml`) at `output_paths.reports.sprint`
- Include keys: `artifact_version`, `timestamp`, `result`, `metrics`, `ship_readiness`, `report_files`

---

## Pre-export checklist

- [ ] All sections present per report-template.md
- [ ] Health Score calculated with the correct formula and breakdown per category clearly stated
- [ ] Ship Readiness table compared against exit criteria from `qa-config.yaml` or Test Plan fallback
- [ ] No remaining `{...}` placeholders in the main content
- [ ] Ship recommendation includes a specific reason, not vague
- [ ] Defect Pattern table has all 5 columns: module, category, count, vs prev sprint, signal
- [ ] Coverage Delta table uses the same module key; `automated` column counts only scripts executed in the sprint
- [ ] Structured Lessons Learned has all 5 columns, actions are specifically targeted

---

## Output for next-sprint improvement cycle

After exporting the Sprint Report, extract an additional standard block for reuse in the next sprint (append to the project's `references/qa-improvement-log.md`):

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

---

## Sign-off Request (L2)

```
---
⏳ SIGN-OFF REQUEST — 10-test-report (Level 2 — QA Lead)
Reviewer: [team.qc_lead from qa-config]
SLA: 8 hours
Output: testing-output/reports/sprint/sprint-report-{sprint}-{date}.md
Action: Reply "Approved" or "Needs adjustment: [details]"
---
```

After receiving Approved → update `project/session-state.yaml`: remove item from `pending_sign_offs`.

---

## Completion Status

- **DONE** — Report complete, health score calculated, ship readiness clear
- **DONE_WITH_CONCERNS** — Complete but: {S1 still open / Low pass rate / Insufficient coverage}
- **BLOCKED** — Missing: {Complete bug list / Exit criteria from `qa-config.yaml` or Test Plan / TC results}
- **NEEDS_CONTEXT** — Additional input needed: {Specific information}
