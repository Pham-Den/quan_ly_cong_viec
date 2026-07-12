## Why

Backend hiện đang dùng Prisma với SQLite local (`DATABASE_URL=file:./dev.db`). Cách này tiện cho MVP nhưng không phù hợp khi dữ liệu bắt đầu quan trọng hơn, nhiều môi trường hơn, và cần database bền vững/chia sẻ như MySQL.

Cần migrate backend DB sang MySQL nhưng phải làm theo từng bước để không làm gãy dev flow, test, Playwright, seed, System Manager, Api Lab và branch/task data.

## What Changes

- Tổ chức lại phần backend DB config để có một chỗ build/validate database connection.
- Thêm hỗ trợ biến `.env` dạng:

```env
DB_CONNECTION=mysql
DB_HOST=172.30.0.1
DB_PORT=3306
DB_DATABASE=my-job
DB_USERNAME=root
DB_PASSWORD="root"
```

- Chuyển Prisma datasource từ `sqlite` sang `mysql` sau khi config đã sẵn sàng.
- Tạo Prisma migration baseline cho MySQL.
- Cập nhật scripts `db:push`, `db:seed`, `test`, Playwright setup, `dev.sh`, `docker-compose.yml`, docs.
- Chuẩn bị đường data migration từ SQLite dev DB hiện tại sang MySQL.
- Giữ migration có rollback rõ ràng trước khi xóa SQLite dev DB.

## Scope

Included:

- DB config organization.
- MySQL env URL builder.
- Prisma provider migration plan.
- MySQL schema migration.
- Seed/test/dev/e2e script updates.
- Data migration checklist/tooling.

Not included in the first implementation pass:

- Production deployment.
- Production data migration.
- Multi-tenant DB support.
- Read/write replica.
- Runtime switching between SQLite and MySQL after Prisma provider has changed.

## Impact

- Backend runtime DB moves from SQLite file to MySQL.
- Tests need a MySQL test database instead of SQLite test DB.
- E2E setup needs a MySQL e2e database instead of deleting `backend/prisma/e2e.db`.
- Prisma schema will use `provider = "mysql"`.
- Existing SQLite data must be exported/imported before relying on MySQL.

## Safety

- Do not switch `DATABASE_URL` to MySQL while Prisma provider is still `sqlite`.
- Keep SQLite DB files untouched until MySQL schema and seed are verified.
- Run migration on a fresh MySQL database before migrating existing dev data.
- Use a separate test database, for example `my-job_test`.
- Use a separate e2e database, for example `my-job_e2e`.
