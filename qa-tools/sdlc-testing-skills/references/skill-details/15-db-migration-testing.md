---
name: 15-db-migration-testing
description: >
  Detailed procedure for DB migration testing: pre-migration checklist, execution,
  post-validation, rollback, and application compatibility. Supplemental detail for
  the compact skill at skills/qa-core/15-db-migration-testing/db-migration-testing.md.
---

# DB Migration Testing — Detailed Procedure

Supplemental details for Skill 15 compact workflow. Read when exact legacy wording,
edge case handling, or extended checklists are needed.

---

## Pre-migration Checklist (detailed)

| # | Check | Pass condition | Blocker? |
|---|---|---|---|
| 1 | DB backup exists and is restorable | Backup timestamp ≤ 24h before migration; verified via restore-dry-run | Yes |
| 2 | Schema diff reviewed | DDL diff output reviewed by DBA or tech lead | Yes |
| 3 | Rollback script present and syntactically valid | `flyway repair` / `liquibase rollback` succeeds on dry-run; SQL script passes linter | Yes |
| 4 | DB server reachable from test runner | `SELECT 1` returns in < 2s | Yes |
| 5 | Correct DB version | Matches `qa-config.yaml > database.version` | Yes |
| 6 | Disk space ≥ 2× current DB size | df/du check passes | Yes |
| 7 | No blocking connections / open transactions | `pg_stat_activity` or `SHOW PROCESSLIST` shows no blocking | Yes |
| 8 | Migration script version not already applied | Flyway/Liquibase history does not contain this version | Yes |

---

## Migration Execution — Error Handling

| Error type | Action |
|---|---|
| Exit code ≠ 0 | Stop immediately; capture full log; trigger rollback |
| Timeout > configured threshold | Stop; check for long-running DDL locks; rollback |
| Warning in Flyway/Liquibase output | Log and escalate; do not proceed until reviewed |
| Partial apply (some scripts passed, some failed) | Rollback all; never leave schema in partial state |

---

## Post-migration Validation — Schema Diff

Run schema diff tool (e.g., `pg_dump --schema-only` → diff, or Liquibase `diff` command) and verify:

- All expected `CREATE TABLE` / `ALTER TABLE` / `CREATE INDEX` changes are present.
- All `DROP` operations are accounted for in the migration plan.
- No unexpected columns, constraints, or indexes were created or dropped.

---

## Post-migration Validation — Data Integrity Queries

Run these queries for every table affected by the migration:

```sql
-- Row count sanity check (compare with pre-migration snapshot)
SELECT COUNT(*) FROM {table};

-- FK constraint check (PostgreSQL)
SELECT conname, conrelid::regclass, confrelid::regclass
FROM pg_constraint
WHERE contype = 'f' AND NOT convalidated;

-- Spot-check critical rows
SELECT {key_columns} FROM {table} WHERE {critical_condition} LIMIT 10;
```

---

## Rollback — Verification Queries

After rollback, confirm schema matches the pre-migration baseline:

```sql
-- Column existence check (PostgreSQL)
SELECT column_name, data_type FROM information_schema.columns
WHERE table_name = '{table}' ORDER BY ordinal_position;

-- Index existence check
SELECT indexname, indexdef FROM pg_indexes WHERE tablename = '{table}';
```

---

## Application Compatibility — Startup Check

After migration, before declaring PASS:

1. Restart the application service pointing to the migrated DB.
2. Wait for healthy status (health check endpoint returns HTTP 200).
3. Check startup logs for: `column does not exist`, `relation does not exist`, `invalid input syntax`, or `type mismatch`.
4. Run API smoke tests listed in `qa-config.yaml > smoke_tests.db_migration` if present.

---

## Report Template

```markdown
# DB Migration Test Report — {migration-version} — {date}

## Pre-migration
| Check | Result | Notes |
|---|---|---|
| Backup exists | PASS/FAIL | {timestamp, size} |
| Schema diff reviewed | PASS/FAIL | {reviewer} |
| Rollback script valid | PASS/FAIL | {dry-run result} |
| ...remaining checks... | | |

## Migration Execution
- Tool: Flyway {version} / Liquibase {version} / Manual SQL
- Command: `{command}`
- Exit code: {0 / non-zero}
- Duration: {Xs}
- Output: {SUCCESS / ERROR — paste relevant log lines}

## Post-migration Validation
- Schema diff: PASS / FAIL — {summary of differences}
- Row count check: PASS / FAIL — {table: before → after}
- FK integrity: PASS / FAIL
- Spot-check: PASS / FAIL — {sample rows verified}

## Application Compatibility
- Startup: PASS / FAIL — {health check URL + status}
- API smoke: PASS / FAIL — {endpoints tested}
- Runtime errors: None / {list errors found}

## Rollback Test
- Rollback triggered: YES / NO (if NO, state reason)
- Schema reverted: PASS / FAIL
- Data integrity after rollback: PASS / FAIL

## Verdict
**PASS** / **FAIL** / **ROLLBACK**

Reason: {one sentence}
```

---

## Stop Conditions

- DB backup is not confirmed before migration execution begins — always a blocker.
- Rollback script cannot be validated on dry-run — do not proceed.
- Any pre-migration check marked `Blocker? = Yes` has not passed.
