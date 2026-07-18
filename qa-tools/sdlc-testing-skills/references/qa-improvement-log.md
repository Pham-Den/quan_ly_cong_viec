# QA Improvement Log

Objective: Store memory across sprints in a machine-readable format so AI can reuse it consistently.

## Convention

- Each sprint gets its own section.
- If this is the first sprint or there is no previous baseline sprint, use `NA` for delta.
- Do not leave mandatory fields empty.
- `automated_executed_tc` counts only scripts that were actually executed during the sprint, not scripts that merely exist in the repo.

## Template

```yaml
improvement_snapshot:
  sprint: {project.sprint}
  date: {yyyy-mm-dd}
  modules:
    - module: {module}
      defect_pattern:
        - category: {Functional|Visual|UX|Console|Performance|Accessibility|Content}
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

## Sprint Entries

### Sprint: {project.sprint}

```yaml
improvement_snapshot:
  sprint: {project.sprint}
  date: {yyyy-mm-dd}
  modules:
    - module: {module-1}
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

## How to use with Skill 07/08

- Skill 07 creates an `improvement_snapshot` block after each daily run/sprint snapshot.
- Skill 08 reads this block to populate the `previous sprint` column and `signal` column per module.
- At the end of each sprint, append a new block to this file as the baseline for the next sprint.
