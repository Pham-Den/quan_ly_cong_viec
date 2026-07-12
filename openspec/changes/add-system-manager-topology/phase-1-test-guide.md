# Phase 1 Test Guide: System Manager Frontend Mock

Guide này kiểm tra những gì đã làm trong phase 1 của `add-system-manager-topology`.

Phase 1 chỉ là frontend mock:

- Không backend API cho System Manager.
- Không Prisma/database.
- Không scanner.
- Không import JSON/YAML.

## Automatic Verification

Chạy từ root repo:

```bash
npm --workspace frontend run typecheck
npm --workspace frontend run build
npx playwright test tests/e2e/system-manager.spec.ts --project=chromium
```

Kỳ vọng:

- Typecheck pass.
- Frontend build pass.
- Playwright test `system manager mock topology graph, search, edge detail, and flow` pass.

Ghi chú: frontend build hiện có warning chunk lớn do Vue Flow bundle. Warning này không chặn phase 1.

## Manual Review Setup

Chạy app local:

```bash
npm run dev
```

Mở:

```text
http://localhost:5173/system-manager
```

Nếu chưa đăng nhập, dùng flow login/setup hiện có của app.

## Manual Checklist

### 1. Open Module

- Sidebar có menu `System Manager`.
- Route là `/system-manager`.
- Trang hiển thị heading `System Manager`.
- Có segmented control `Local | Dev`.
- Có graph canvas, search input, và side panel.

### 2. Environment Switch

- Chọn `Local`.
- Graph hiển thị các node global `B2P`, `MariaDB`, `Redis`, `Kafka`, `SAP API`, `Mail`, `OCR`.
- Chọn `Dev`.
- Graph chuyển sang dữ liệu `Dev`, ví dụ `MariaDB Dev`, `Redis Dev`, `Kafka Dev`.

### 3. Collapsed App View

- Mặc định B2P đang collapsed.
- Graph vẫn hiển thị dependency tổng hợp từ B2P tới service.
- Edge label có dạng `DB_HOST`, `REDIS_HOST +3`, `KAFKA_BROKER +1`, `SAP_URL`.

### 4. Expand App Components

- Click `Bung component`.
- Graph hiển thị:
  - `B2P Web/API`.
  - `B2P Queue Worker`.
  - `B2P Scheduler`.
  - `B2P Consumer`.
- Click `Thu gọn B2P` để quay lại collapsed view.
- Có thể double click app/component để đổi trạng thái expanded/collapsed.

### 5. Node Detail

- Click node `Redis`.
- Side panel mở tab `Overview`.
- Kiểm tra các tab:
  - `Overview`.
  - `Runtime`.
  - `Configs`.
  - `Dependencies`.
  - `Flow`.
  - `Notes`.
- Tab `Runtime` hiển thị host, IP, container, image, port, network.

### 6. Edge Config Detail

- Search `DB_HOST`.
- Chọn kết quả config.
- Graph highlight edge liên quan.
- Side panel hiển thị `Config detail`.
- Có các field:
  - From.
  - To.
  - Connection.
  - Port.
  - Description.
  - Config line.

### 7. Multi Config Edge

- Chọn edge `REDIS_HOST +3`.
- Side panel liệt kê nhiều config line:
  - `REDIS_HOST=...`
  - `REDIS_PORT=...`
  - `CACHE_DRIVER=redis`
  - `SESSION_DRIVER=redis`

### 8. Secret Reveal And Copy

- Mở tab `Configs`.
- Secret như `APP_KEY`, `DB_PASSWORD`, `REDIS_PASSWORD`, `SAP_TOKEN` được masked bằng `********`.
- Click `Hiện` để xem value mock.
- Click `Ẩn` để masked lại.
- Click `Copy` để copy full config line, ví dụ `DB_HOST=mariadb-local.company.local`.

### 9. Search

Thử các query:

```text
DB_HOST
redis
127.0.0.1
khanh-dev-laptop
```

Kỳ vọng:

- Kết quả nhóm theo Apps, Services, Hosts, Configs, IPs.
- Chọn result node thì graph highlight node và mở side panel.
- Chọn result config thì graph highlight edge và mở config detail.

### 10. Flow Viewer

- Click node `B2P` hoặc `B2P Web/API`.
- Click `Start flow` trong side panel.
- Tab `Flow` được chọn.
- Graph highlight downstream dependencies và dim phần không liên quan.
- Side panel liệt kê flow step theo component.
- Click `Clear` để reset highlight.

## Known Scope Limits

Những phần chưa có ở phase 1:

- CRUD service/dependency.
- Backend API.
- Database persistence.
- Scanner đọc source/docker-compose/.env.
- JSON/YAML import.
- Health check thật.
- Incident timeline.
- SSH/logs/docker inspect.
- Mobile responsive.

## Review Notes

Khi review, tập trung trả lời:

- Graph có dễ hiểu với workflow dev không?
- Collapsed/expanded B2P có đúng cách nhìn mong muốn không?
- Edge label config key có đủ rõ không?
- Side panel có thiếu field quan trọng nào không?
- Search/flow có đúng kiểu debug bạn cần không?
