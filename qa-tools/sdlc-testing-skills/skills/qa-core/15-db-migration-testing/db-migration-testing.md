---
name: 15-db-migration-testing
description: >
  Test database migrations end-to-end: verify pre-migration readiness, execute migration
  scripts (Flyway / Liquibase / manual), validate schema and data integrity post-migration,
  test rollback procedure, and confirm application compatibility. Trigger: db migration test,
  schema migration, data migration, Flyway, Liquibase, migration rollback.
  Output: Migration Test Report saved to testing-output/.
---

# DB Migration Testing

> **Output language:** → See SKILL.md output rules.

Compact workflow for database migration testing. Read the detailed procedure only when exact
legacy wording or edge cases are needed: `references/skill-details/15-db-migration-testing.md`.

## Read First

- Read `project/qa-config.yaml` for DB connection info (`database.*`), environment details, and migration tool config.
- Use `references/INDEX.md` to choose optional references; do not open all references.
- Governance gate: L1 — auto-complete; save artifacts, update audit/session state.

## Inputs (Required)

| Input | Description |
|---|---|
| Migration script path | Path to Flyway / Liquibase changelog or manual SQL script |
| Target DB environment | e.g., `staging`, `uat`, `production` |
| Rollback script | Path to down-migration / rollback SQL or procedure |

## Core Workflow

### Phase 1 — Pre-migration

1. Verify DB backup exists and is restorable (confirm backup timestamp and size).
2. Review schema diff: compare current schema against migration script to understand all DDL/DML changes.
3. Confirm rollback plan is documented and the rollback script is present and syntactically valid.
4. Check environment readiness: DB server reachable, correct DB version, sufficient disk space, no blocking connections.

### Phase 2 — Migration Execution

5. Run migration script via Flyway (`flyway migrate`) / Liquibase (`liquibase update`) / manual SQL.
6. Monitor execution output for errors, warnings, or timeouts.
7. Verify exit code = 0 and all migration steps report `SUCCESS`.

### Phase 3 — Post-migration Validation

8. **Schema validation:** confirm all expected tables, columns, indexes, and constraints exist; confirm dropped objects are gone.
9. **Data integrity:** check row counts in affected tables match expectations; verify FK constraints are satisfied; spot-check critical data rows.
10. **Application smoke test:** run a targeted smoke test against the migrated DB to confirm the app reads/writes correctly.

### Phase 4 — Rollback Testing

11. Trigger the rollback procedure (Flyway repair + down-script / Liquibase rollback / manual script).
12. Verify schema reverts to the pre-migration baseline (re-run schema diff in reverse).
13. Verify data is not corrupted after rollback; row counts and FK integrity match pre-migration baseline.

### Phase 5 — Application Compatibility

14. Run app startup check against the migrated DB (confirm no startup errors related to DB schema).
15. Run critical API smoke tests that exercise DB-backed endpoints.
16. Check application logs for runtime errors related to DB changes (missing columns, type mismatches, etc.).

## Outputs

- Migration test report saved to `testing-output/migration-test-report-{date}.md`
- Report includes: pre-migration checklist, migration execution log, schema diff result, data integrity summary, rollback test result, app compatibility verdict, and PASS / FAIL / ROLLBACK verdict.

## References

- `project/qa-config.yaml` (DB connection, environment)

## Stop Conditions

- Required input (migration script, target environment, or rollback script) is missing and cannot be inferred.
- DB backup is not confirmed before migration execution begins.
- The task requires external publishing but the required governance approval is not present.
