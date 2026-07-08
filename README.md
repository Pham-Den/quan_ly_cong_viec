# quan_ly_cong_viec

Mini app quan ly cong viec ca nhan theo task, branch, release va main.

## Bootstrap

```bash
cp .env.example .env
npm install
npm run dev
```

Frontend mac dinh chay o `http://localhost:5173`.
Backend mac dinh chay o `http://localhost:4000`.

## Database bootstrap

```bash
npm --workspace backend run prisma:validate
npm --workspace backend run db:push
npm --workspace backend run db:seed
```

## First run login

After starting the app, open `http://localhost:5173`. If there is no user yet,
the app redirects to `/setup` so you can create the first local account. After
that, use `/login` with the same email and password.

## Docker Compose

```bash
cp .env.example .env
docker compose up
```
