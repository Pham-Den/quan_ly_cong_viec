# Backend

Fastify API for the personal task and Git branch tracker.

## Local database

The MVP starts with SQLite through Prisma:

```bash
DATABASE_URL=file:./dev.db
```

Validate and create the local SQLite schema:

```bash
npm --workspace backend run prisma:validate
npm --workspace backend run db:push
npm --workspace backend run db:seed
```

## Switching database later

When the app needs a durable shared database:

1. Change `datasource db.provider` in `prisma/schema.prisma`.
2. Update `DATABASE_URL` in `.env`.
3. Run Prisma migration commands for the selected database.
4. Re-run `npm --workspace backend run prisma:generate`.
