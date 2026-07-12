# Phase 2 Test Guide: System Manager Backend Seed + Read API

Guide này kiểm tra phase 2 của `add-system-manager-topology`.

Phase 2 thêm persistence foundation:

- Prisma models cho System Manager.
- Seed B2P topology cho Local và Dev.
- Authenticated read API.
- Frontend load topology từ API thay vì hard-code mock là nguồn chính.

Phase 2 vẫn chưa làm:

- CRUD service/dependency.
- JSON/YAML import.
- Scanner.
- Health check thật.
- Incident timeline.
- SSH/logs/docker inspect.

## Automatic Verification

Chạy từ root repo:

```bash
npm --workspace backend run prisma:validate
npm --workspace backend run db:push
npm --workspace backend run db:seed
npm --workspace backend run build
npm --workspace backend run test
npm --workspace frontend run typecheck
npm --workspace frontend run build
npx playwright test tests/e2e/system-manager.spec.ts --project=chromium
```

Kỳ vọng:

- Prisma schema hợp lệ.
- DB được push schema mới.
- Seed chạy thành công.
- Backend build/test pass.
- Frontend typecheck/build pass.
- Playwright System Manager test pass.

Ghi chú: frontend build hiện có warning chunk lớn do Vue Flow bundle. Warning này không chặn phase 2.

## Manual API Check

Chạy app:

```bash
npm run dev
```

Đăng nhập trong UI, sau đó lấy access token từ browser devtools nếu muốn gọi API thủ công:

```js
localStorage.getItem('qlcv.accessToken')
```

Gọi API:

```bash
curl -H "Authorization: Bearer <token>" http://127.0.0.1:4000/api/system-manager/environments
curl -H "Authorization: Bearer <token>" "http://127.0.0.1:4000/api/system-manager/topology?environment=dev"
```

Kỳ vọng:

- Environments trả về `local`, `dev`.
- Topology `dev` có node `b2p-web`, `svc-redis`, `svc-mariadb`.
- Edge `web-db` có:
  - `source: b2p-web`
  - `target: svc-mariadb`
  - `label: DB_HOST`

## Manual UI Review

Mở:

```text
http://localhost:5173/system-manager
```

Kiểm tra:

- Tag trên header là `Backend seed`.
- Segmented control vẫn có `Local | Dev`.
- Chọn Local/Dev sẽ gọi dữ liệu tương ứng từ backend.
- Graph vẫn giữ behavior phase 1:
  - collapsed app view.
  - expanded component view.
  - edge labels.
  - node/edge click.
  - search `DB_HOST`.
  - Start flow.
  - secret reveal/copy.

## Review Notes

Khi review phase 2, tập trung kiểm tra:

- API response có đúng shape cho graph/side panel không.
- Seed có đủ giống dữ liệu phase 1 để tiếp tục review UI không.
- Có cần thêm field vào model trước khi làm CRUD/import không.
- Environment global như hiện tại có đúng mong muốn không.
- Read-only API đã đủ để sang phase CRUD hay cần chỉnh data model trước.
