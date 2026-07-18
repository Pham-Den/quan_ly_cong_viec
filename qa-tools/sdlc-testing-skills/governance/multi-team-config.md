# Multi-Team Configuration Guide

How to deploy the QA Skill Suite for multiple teams within the same organisation.

---

## Deployment model

```
Shared skill suite (this repo)
├── skills/                  ← Shared across all teams, do not modify per project
├── references/              ← Shared templates
├── governance/              ← Shared governance rules
└── evaluation/              ← Shared evaluation rubrics

Per-team (each project repo or branch)
├── project/
│   └── qa-config.yaml       ← Team-specific config (REQUIRED: team.id field)
├── testing-output/
│   └── {team.id}/           ← Output namespaced by team
└── governance/
    └── audit-log.md         ← Team-specific audit log
```

---

## qa-config.yaml — Multi-team extensions

Add the following fields to each team's `qa-config.yaml`:

```yaml
team:
  id: "team-alpha"                    # unique ID, no spaces, lowercase
  name: "Team Alpha — Payments"
  qc_lead: "Jane QC"
  dev_lead: "John Dev"
  pm: "Alice PM"
  product_owner: "Bob PO"
  stakeholders:
    - name: "Charlie Business"
      role: "Finance Business Analyst"
      uat_required: true
  escalation_chain:
    - role: "QC Lead"
      name: "Jane QC"
      contact: "@jane-qc"
      sla_hours: 4
    - role: "PM"
      name: "Alice PM"
      contact: "@alice-pm"
      sla_hours: 8
    - role: "Director"
      name: "Director Name"
      contact: "@director"
      sla_hours: 24

output_paths:
  root: "testing-output/team-alpha"
  test_plan: "testing-output/team-alpha/test-plan/"
  test_cases:
    functional: "testing-output/team-alpha/test-cases/functional/"
    sit: "testing-output/team-alpha/test-cases/sit/"
    hltc: "testing-output/team-alpha/test-cases/hltc/"
  test_data: "testing-output/team-alpha/test-data/"
  reports:
    daily: "testing-output/team-alpha/reports/daily/"
    sprint: "testing-output/team-alpha/reports/sprint/"
    gate: "testing-output/team-alpha/reports/gate/"
    html: "testing-output/team-alpha/reports/html/"
  automation: "testing-output/team-alpha/automation/"
```

---

## Isolation rules

| Level | Rule |
|---|---|
| Output files | All output must be under `testing-output/{team.id}/` |
| Audit log | Each team has its own `governance/audit-log.md` in its project repo |
| qa-config.yaml | Each team has its own file — never share across teams |
| Skill files | Read from shared repo — do not override per project |

---

## When the skill suite is used by multiple projects simultaneously

The AI must:
1. Read `project/qa-config.yaml` in the current working project to get `team.id`
2. Use `team.id` as namespace for all output paths
3. Append audit log entries only to the current project's log (no cross-team writes)
4. Send sign-off requests to the people listed in the current project's `team.escalation_chain`

---

## Shared Confluence space — when multiple teams share one Confluence instance

```yaml
confluence:
  base_url: "https://company.atlassian.net"
  space_key: "QA"                             # shared space
  parent_pages:
    team_root: "QA / Team Alpha"              # team-specific root page
    test_plan: "QA / Team Alpha / Test Plans"
    reports: "QA / Team Alpha / Reports"
```

`tools/confluence_sync.py` uses `parent_pages.team_root` to ensure each team's
content does not overwrite another team's pages.

---

## Onboarding checklist for a new team

- [ ] Fork or clone the skill suite repo
- [ ] Create `project/qa-config.yaml` with a unique `team.id`
- [ ] Set all `output_paths` namespaced under `team.id`
- [ ] Set `team.escalation_chain` with correct names and SLAs
- [ ] Create a dedicated Confluence parent page for the team
- [ ] Run one trial skill (recommended: `03-sprint-test-plan`) to verify output lands in the correct namespace
- [ ] Add team to the organisation master list (if central tracking exists)
