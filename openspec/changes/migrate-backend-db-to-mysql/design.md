## Current State

The current backend database path is simple but SQLite-specific:

- `backend/prisma/schema.prisma` has `provider = "sqlite"`.
- `backend/src/env.ts` only exposes `databaseUrl`.
- `backend/src/db.ts` sets `process.env.DATABASE_URL` if missing.
- `backend/package.json` scripts default to `file:./dev.db` and `file:./test.db`.
- `playwright.config.ts` uses `file:./e2e.db`.
- `dev.sh` defaults to `DATABASE_URL=file:./dev.db`.
- `docker-compose.yml` overrides `DATABASE_URL` to `file:/workspace/backend/data/dev.db`.

This means adding `DB_HOST`, `DB_PORT`, etc. alone will not affect Prisma until the backend builds a MySQL `DATABASE_URL` and the Prisma provider becomes `mysql`.

## Target State

Database config should have a single source of truth:

```text
.env
  DB_CONNECTION=mysql
  DB_HOST=172.30.0.1
  DB_PORT=3306
  DB_DATABASE=my-job
  DB_USERNAME=root
  DB_PASSWORD=root

backend/src/db/config.ts
  reads DB_* and DATABASE_URL
  builds mysql://... URL when DB_CONNECTION=mysql
  keeps DATABASE_URL as explicit override
  exposes app database config

backend/src/env.ts
  consumes db/config.ts

backend/src/db.ts
  receives resolved databaseUrl
  creates PrismaClient
```

Prisma target:

```prisma
datasource db {
  provider = "mysql"
  url      = env("DATABASE_URL")
}
```

## Migration Phases

### Phase 1: Config Foundation

- Add `backend/src/db/config.ts`.
- Build `DATABASE_URL` from `DB_*` when `DATABASE_URL` is not explicitly set.
- Validate `DB_CONNECTION`; initially support `sqlite` and `mysql` while the provider is still unchanged.
- Update `.env.example`.
- Keep Prisma provider as `sqlite` for this phase.
- Verify current SQLite dev/test still passes.

Rationale: this organizes the backend DB config without changing DB behavior yet.

### Phase 2: MySQL Provider Switch

- Change Prisma datasource provider to `mysql`.
- Run `prisma format` and `prisma validate`.
- Fix schema incompatibilities if Prisma reports any.
- Add MySQL-specific database URLs for dev/test/e2e.
- Update scripts so `DATABASE_URL` resolves to MySQL by default.
- Generate Prisma Client.

Rationale: provider switch is behavior-changing and should happen only after config is stable.

### Phase 3: Schema Creation And Seed Verification

- Create MySQL database `my-job`.
- Run Prisma schema creation against MySQL.
- Run seed against MySQL.
- Verify auth setup, task APIs, branch APIs, Api Lab, System Manager APIs.
- Update Docker/dev docs.

Rationale: ensure a fresh MySQL install works before migrating existing data.

### Phase 4: Test/E2E Migration

- Create isolated DBs:
  - `my-job_test`
  - `my-job_e2e`
- Update backend tests to reset MySQL cleanly.
- Update Playwright setup to reset/seed MySQL e2e DB.
- Remove assumptions about deleting SQLite `.db` files.

Rationale: test isolation must be explicit with MySQL.

### Phase 5: Existing Dev Data Migration

Preferred safe path:

1. Keep SQLite files as backup.
2. Export data from SQLite using a script or Prisma Client before provider switch, or use a temporary branch/script that can read SQLite.
3. Import into MySQL using current MySQL Prisma Client.
4. Verify record counts and core workflows.

Potential tooling:

- `backend/scripts/export-sqlite-data.ts`
- `backend/scripts/import-mysql-data.ts`

Do not delete SQLite files until MySQL dev data is verified.

## Important Prisma Notes

- Prisma datasource provider is not meant to switch dynamically per request/runtime.
- Once `provider = "mysql"` is committed, SQLite URLs are no longer valid for that schema.
- `DB_CONNECTION` should validate/build URL and document the selected DB, not make Prisma multi-provider at runtime.
- `DATABASE_URL` should remain supported as an override for CI or one-off commands.

## Risks

- MySQL reserved words or index limits may expose schema issues not seen in SQLite.
- Existing tests rely on fast local SQLite reset; MySQL reset can be slower.
- The current database name `my-job` contains a hyphen. It is acceptable in MySQL as a database name, but scripts must not interpolate it into raw SQL without quoting.
- `root/root` is acceptable for local dev only, not staging/production.

## Rollback

- Before provider switch: rollback is removing DB_* config usage.
- After provider switch: rollback requires reverting Prisma provider/scripts and using the untouched SQLite DB files.
- For dev data: keep `backend/prisma/dev.db` backups until the MySQL data is confirmed.
