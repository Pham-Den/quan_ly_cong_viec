# Backend

Fastify API for the personal task and Git branch tracker.

## Local database

Backend now uses MySQL through Prisma. The default local values are read from
the repository `.env` file:

```bash
DB_CONNECTION=mysql
DB_HOST=172.30.0.1
DB_PORT=3306
DB_DATABASE=my-job
DB_TEST_DATABASE=my-job_test
DB_E2E_DATABASE=my-job_e2e
DB_USERNAME=root
DB_PASSWORD="root"
```

Validate and create the local MySQL schema:

```bash
npm --workspace backend run db:ensure
npm --workspace backend run prisma:validate
npm --workspace backend run db:push
npm --workspace backend run db:seed
```

`DATABASE_URL` is still supported as an explicit one-off override. If it is not
set, backend scripts build it from `DB_*`.

## SQLite dev data migration

The old SQLite dev database is kept as a backup source only. To export it:

```bash
npm --workspace backend run db:export-sqlite
```

This writes `.dev/mysql-migration/sqlite-dev-export.json` and copies the source
SQLite DB into `.dev/mysql-migration/`.

To import that export into MySQL:

```bash
npm --workspace backend run db:import-mysql
npm --workspace backend run db:verify-migration
```

If a target MySQL database already has data and you intentionally want to replace
it, run:

```bash
npm --workspace backend run db:import-mysql -- --truncate
```

Auth APIs are available under `/api/auth`:

- `GET /api/auth/bootstrap`
- `POST /api/auth/setup`
- `POST /api/auth/login`
- `POST /api/auth/refresh`
- `POST /api/auth/logout`
- `GET /api/auth/me`

## Tests

Backend tests use `my-job_test` and reset it before running:

```bash
npm --workspace backend run test
```
