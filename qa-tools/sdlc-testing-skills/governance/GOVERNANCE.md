# Governance

Apply these rules for every skill execution.

## Gates

| Level | Meaning | Action |
|---|---|---|
| L1 | Auto-complete | Save artifacts, update audit log and session state, report completion. |
| L2 | QA/Dev review | Save artifacts, emit sign-off request, wait for explicit approval before publishing or proceeding. |
| L3 | Stakeholder/Ops approval | Save artifacts, emit blocking approval request, stop until explicit approval. |

See `governance/sign-off-gates.md` for the exact reviewer, SLA, and request format per skill.

## Audit Log — When and What to Write

**Trigger:** Append one execution record to `governance/audit-log.md` (or `project/audit-log.md` if it exists) **immediately after every skill execution** — regardless of outcome (DONE, BLOCKED, SKIPPED, PARTIAL).

**Record format (YAML block, separator `---`):**

```yaml
---
skill: "03-sprint-test-plan"
executed_at: "2026-05-27T10:30:00+07:00"
executed_by: "user@example.com"
team_id: "ai-platform"              # from project/qa-config.yaml > project.code (or hostname if absent)
sprint: "S2"                        # from qa-config.yaml > project.sprint
outcome: "DONE"                     # DONE | BLOCKED | SKIPPED | PARTIAL
gate_level: "L1"                    # L1 | L2 | L3
sign_off_status: null               # null | PENDING | APPROVED | REJECTED (L2/L3 only)
reviewer: null                      # name of reviewer if L2/L3
output_path: "testing-output/test-plan/Sprint_Test_Plan_v2.1_2026-05-27.md"
published_to: null                  # URL if pushed to Confluence/Jira/QMetry; null otherwise
notes: "Brief summary of what was done or why it was blocked"
```

**Outcome values:**
- `DONE` — skill completed, output saved, gate cleared
- `BLOCKED` — awaiting L2/L3 approval; do not proceed until reviewer responds
- `SKIPPED` — not applicable this sprint; explain in `notes`
- `PARTIAL` — output created but sections deferred; document in `notes`

**Why this matters:** Without audit log entries, there is no record that skills ran, no traceability from requirement → test execution → decision, and no way to audit the QA process. Every skill execution — even auto-complete L1 — must produce a record.

## Required State Updates

- Append execution record to audit log (format above) after every skill run.
- Update `project/session-state.yaml` when it exists.
- Use reviewer names and escalation chain from `project/qa-config.yaml` when present.
- Include `team_id` in every execution record (value from `project/qa-config.yaml > project.code`, or hostname if not set).

## External Tools

Do not push to Confluence, update Jira, import QMetry, or publish reports before
the required L2/L3 approval. Dry-run and local export are always allowed at any gate level.

## Runtime Isolation

For shared/team use, keep runtime files project-local: `project/`,
`testing-output/`, `.env*`, and real tool configs. Shared skill files must stay
stable across teams — do not modify them per project.
