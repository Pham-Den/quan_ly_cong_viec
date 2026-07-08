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

## Docker Compose

```bash
cp .env.example .env
docker compose up
```
