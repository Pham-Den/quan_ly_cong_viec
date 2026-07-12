# quan_ly_cong_viec

Mini app quan ly cong viec ca nhan theo task, branch, release va main.

## Bootstrap

```bash
cp .env.example .env
npm install
sh dev.sh
```

Frontend mac dinh chay o `http://localhost:5173`.
Backend mac dinh chay o `http://localhost:4000`.

Dung dev server:

```bash
sh stop.sh
```

## Database bootstrap

```bash
npm --workspace backend run db:ensure
npm --workspace backend run prisma:validate
npm --workspace backend run db:push
npm --workspace backend run db:seed
```

The backend uses MySQL by default. `.env.example` contains the local database
settings for `my-job`, `my-job_test`, and `my-job_e2e`.

## First run login

After starting the app, open `http://localhost:5173`. If there is no user yet,
the app redirects to `/setup` so you can create the first local account. After
that, use `/login` with the same email and password.

## UI smoke test

```bash
npm run test:ui
```

The Playwright test uses the separate MySQL database `my-job_e2e` and test-only
ports `4100` and `5174`.

## Docker Compose

```bash
cp .env.example .env
docker compose up
```
