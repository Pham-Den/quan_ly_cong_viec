## 1. Scope Gate

- [x] 1.1 Confirm this change is backend DB migration only, not a feature change.
- [x] 1.2 Confirm local target DB values from `.env`.
- [x] 1.3 Confirm existing SQLite dev data must be migrated.
- [x] 1.4 Confirm MySQL test/e2e database names: `my-job_test`, `my-job_e2e`.

## 2. DB Config Foundation

- [x] 2.1 Add a backend DB config helper that reads `DATABASE_URL` and `DB_*`.
- [x] 2.2 Build a MySQL URL from `DB_CONNECTION=mysql`, `DB_HOST`, `DB_PORT`, `DB_DATABASE`, `DB_USERNAME`, and `DB_PASSWORD`.
- [x] 2.3 Keep `DATABASE_URL` as explicit override.
- [x] 2.4 Update `loadEnv()` to use the DB config helper.
- [x] 2.5 Update `.env.example` with both SQLite legacy and MySQL target examples.
- [x] 2.6 Verify current SQLite behavior still works before provider switch.

## 3. MySQL Provider Migration

- [x] 3.1 Change Prisma datasource provider from `sqlite` to `mysql`.
- [x] 3.2 Run Prisma format/validate and fix provider-specific schema issues.
- [x] 3.3 Update backend npm scripts to use resolved MySQL URL instead of SQLite defaults.
- [x] 3.4 Update `dev.sh` DB setup defaults for MySQL.
- [x] 3.5 Update `docker-compose.yml` DB environment behavior.
- [x] 3.6 Generate Prisma Client.

## 4. MySQL Schema And Seed Verification

- [x] 4.1 Create local MySQL database `my-job`.
- [x] 4.2 Run schema creation/migration against MySQL.
- [x] 4.3 Preserve migrated dev data instead of reseeding fresh; seed remains used for empty/test/e2e DBs.
- [x] 4.4 Verify auth bootstrap/setup/login.
- [x] 4.5 Verify task/branch APIs.
- [x] 4.6 Verify Api Lab APIs.
- [x] 4.7 Verify System Manager APIs and UI.

## 5. Test And E2E Migration

- [x] 5.1 Add MySQL test database config.
- [x] 5.2 Update backend tests to reset MySQL safely.
- [x] 5.3 Update Playwright config to use MySQL e2e DB.
- [x] 5.4 Remove SQLite `.db` delete assumptions from e2e setup.
- [x] 5.5 Run backend tests.
- [x] 5.6 Run Playwright smoke tests.

## 6. Dev Data Migration

- [x] 6.1 Decide whether to migrate current SQLite data or start fresh.
- [x] 6.2 If migrating, create SQLite export script.
- [x] 6.3 If migrating, create MySQL import script.
- [x] 6.4 Verify migrated record counts.
- [x] 6.5 Keep SQLite backup until review passes.

## 7. Documentation And Review

- [x] 7.1 Update backend README.
- [x] 7.2 Add MySQL migration test guide.
- [x] 7.3 Document rollback.
- [x] 7.4 Stop for review before deleting any SQLite DB files or backups.
