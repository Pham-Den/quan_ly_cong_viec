# QA Improvement Log

> **Purpose:** Tracks sprint-over-sprint defect patterns and improvement actions.
> Skill 10 (test-report) appends a new `improvement_snapshot` block here after each sprint report.
> Skill 09 (check-result) reads `top_actions` to check pending actions from the previous sprint.
>
> **How to use:**
> - Do NOT edit manually unless correcting a data entry error.
> - Each block is appended by the AI; newest sprint at the bottom.
> - If the file does not exist yet, skill 10 creates it automatically.

---

## Format reference

Each sprint appends one block in YAML:

```yaml
improvement_snapshot:
  sprint: {Sprint-X}
  date: {yyyy-mm-dd}
  modules:
    - module: {module-name}
      defect_pattern:
        - category: Functional       # one of: Functional/Visual/UX/Content/Performance/Console/Accessibility
          count: 0
          delta_vs_prev: NA          # +N | -N | 0 | NA (first sprint)
      coverage_delta:
        planned_tc: 0
        executed_tc: 0
        automated_executed_tc: NA
        gap: NA
  top_actions:
    - type: TC Design                # one of: TC Design | Automation | Process | Environment
      owner: QC Lead
      action: {specific action to take}
      due_in_sprint: Sprint-{X+1}
      status: pending                # pending | done
```

---

<!-- Skill 10 appends improvement_snapshot blocks below this line -->
