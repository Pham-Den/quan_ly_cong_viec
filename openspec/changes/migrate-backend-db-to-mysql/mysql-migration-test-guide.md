# MySQL Migration Test Guide

## Current Local Databases

- Dev: `my-job`
- Backend test: `my-job_test`
- Playwright e2e: `my-job_e2e`

## Data Migration

Exported SQLite dev data:

```bash
npm --workspace backend run db:export-sqlite
```

Output:

- `.dev/mysql-migration/sqlite-dev-export.json`
- `.dev/mysql-migration/dev.db.backup-*`

Imported into MySQL:

```bash
npm --workspace backend run db:push
npm --workspace backend run db:import-mysql
npm --workspace backend run db:verify-migration
```

Expected result:

- Exported rows: `739`
- Imported rows: `739`
- Verify message: `MySQL counts match the SQLite export.`

## Validation Commands

```bash
npm --workspace backend run prisma:validate
npm --workspace backend run typecheck
npm --workspace backend run test
npm run test:ui
npm run build
```

Expected result:

- Prisma schema is valid.
- Backend typecheck passes.
- Backend tests pass on `my-job_test`.
- Playwright smoke tests pass on `my-job_e2e`.
- Root build passes.

## Rollback

Do not delete any SQLite DB files during review.

Rollback options:

- Keep using the MySQL import as the primary dev database.
- Re-import from `.dev/mysql-migration/sqlite-dev-export.json` with:

```bash
npm --workspace backend run db:import-mysql -- --truncate
npm --workspace backend run db:verify-migration
```

- If you need the original SQLite file for inspection, use the backup in
  `.dev/mysql-migration/dev.db.backup-*` or the untouched source file at
  `backend/prisma/dev.db`.
