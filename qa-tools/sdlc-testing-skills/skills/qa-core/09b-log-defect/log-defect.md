---
name: 09b-log-defect
description: >
  Log a confirmed defect to Jira FDP as a Defect issue with full QC-standard fields:
  severity, priority, platform, environment found, quality activity, steps to reproduce,
  actual/expected result, screenshot attachments, and US/parent link. Trigger: log bug,
  tao defect, tao bug jira, push defect, report loi, confirm bug, bug confirmed.
---

# Log Defect to Jira

> **Scope:** Tạo 1 Defect issue trên Jira FDP với đầy đủ thông tin QC chuẩn.
> Chỉ chạy sau khi QC hoặc user **đã xác nhận** bug — không tự suy đoán.

## Required inputs (hỏi nếu thiếu)

| Field | Mô tả | Ví dụ |
|---|---|---|
| `summary` | Tiêu đề — format bắt buộc: `[US-ID][TC-ID] Mô tả lỗi ngắn gọn` | `[FDP-827][AGENT_16] Thiếu X-Agent-ID trả về RAG_MISSING_CALLER_IDENTITY` |
| `sprint` | Sprint ID (số nguyên) — auto-detect sprint active nếu không cung cấp; user có thể ghi tên sprint để AI tra và điền ID | `29697` hoặc `FDP_Sprint 3` |
| `us-id` | Jira Story/US ID liên quan (tra Jira nếu chưa biết; script sẽ tự link) | `FDP-827` |
| `tc-id` | ID test case / scenario liên quan | `AGENT_16` |
| `run-id` | Run ID phát hiện bug (pattern `DD/MM-R#`) | `12/06-R1` |
| `precondition` | Điều kiện tiên quyết — **phải có ID/giá trị cụ thể** (KB ID, user, env) | `KB ID: 4f331435-c81e-4ec7-a29f-efcac7adf998 đã tồn tại trên QC` |
| `steps` | Steps to reproduce — **phải dùng data thật** (URL, ID, payload, headers cụ thể, không dùng placeholder) | `1. POST https://aip-portal-qc.../agentic-search\n2. Body: {"query":"test"}\n3. Bỏ header X-Agent-ID` |
| `actual` | Kết quả thực tế (kèm error code/HTTP status nếu là API) | `HTTP 400 — RAG_MISSING_CALLER_IDENTITY` |
| `expected` | Kết quả mong muốn | `HTTP 400 — RAG_MISSING_AGENT` |
| `severity` | S1/S2/S3/S4 (default: S3) | `S3` |
| `platform` | APP / BE / FE / External / Other | `BE` |
| `env-found` | DEV / QC / UAT / PILOT / SANDBOX / PRODUCTION | `QC` |
| `quality-activity` | Functional Test / UAT / Regression Test / ... | `Functional Test` |
| `assigned` | Tên dev được giao fix (hoặc `TBD`) | `Nguyễn Văn A` |
| `env-url` | URL môi trường đang test | `https://aip-portal-qc.ops.onenexus.dev` |
| `attachments` | Đường dẫn ảnh (cách nhau bởi space) | `C:\screens\bug1.png` |

**Optional:**
- `--parent KEY` — set Parent issue trên Jira (ví dụ Epic key: `FDP-800`)
- `--env-pass` — mật khẩu (nếu cần)
- `--env-branch` — branch/build đang test
- `--defect-type` — Code defect / Design defect / Document defect / System defect (default: Code defect)
- `--assignee-id` — accountId Jira của dev để assign tự động qua API

> **Sprint auto-detect:** Nếu không truyền `--sprint`, script đọc sprint từ chính US issue (`us-id.customfield_10018`) — đảm bảo Defect cùng sprint với US. Nếu US không có sprint, fallback tìm sprint active trên board. Truyền `--sprint 0` để tạo issue không gán sprint.
>
> **US linking:** Nếu `--us-id` được cung cấp, script tự động tạo issue link "Relates to" từ Defect → US sau khi tạo issue. Nếu không cung cấp, script tự extract `[FDP-XXX]` đầu tiên trong summary để dùng làm us-id.

## Severity mapping

| Input | Jira Severity | Jira Priority |
|---|---|---|
| S1 | Critical | Highest |
| S2 | Major | High |
| S3 | Normal | Medium |
| S4 | Minor | Low |

## Workflow

### Bước 1 — Thu thập và confirm thông tin (L2 gate)

Nếu user cung cấp một đoạn mô tả bug (dạng text, test result, hoặc screenshot), hãy **tự phân tích và điền sẵn** tất cả field bên trên — đặc biệt lấy data thật cho steps (URL, ID, payload) từ context — rồi hiển thị cho user confirm.

Để tìm `us-id`: tra Jira bằng keyword liên quan đến tính năng (xem `scrum-master:jira` hoặc gọi API trực tiếp).

> **Governance (L2):** Không được đẩy lên Jira trước khi user xác nhận "yes". Lần xác nhận này là L2 sign-off.

Format confirm:

```
Defect sắp tạo trên FDP:
  Summary        : [US-ID][TC-ID] ...
  TC ID          : ...           | Run ID  : DD/MM-R#
  Sprint         : <Tên sprint> (ID: XXXXX, auto-detect hoặc user nhập)
  US liên quan   : FDP-XXX (sẽ tự link sau khi tạo)
  Severity       : [Critical|Major|Normal|Minor]
  Priority       : [Highest|High|Medium|Low]
  Platform       : ...           | Env Found      : ...
  Quality Activity: ...          | Defect Type    : ...
  Assigned       : ...
  Trạng thái     : Open (tự động)
  Precondition   : <data thật — ID, user, env cụ thể>
  Steps          :
    1. <URL/endpoint thật>
    2. <headers/payload thật>
    3. ...
  Actual         : ...
  Expected       : ...
  Env URL        : ...
  Attachments    : ...

[L2] Xác nhận tạo Defect? (yes / chỉnh sửa field nào)
```

### Bước 2 — Chạy script (chỉ sau khi user confirm "yes")

Chạy lệnh từ thư mục gốc của `fdp-testing-skill`:

```bash
python tools/jira_create_bug.py \
  --project FDP \
  --summary "[US-ID][TC-ID] <mô tả lỗi>" \
  --us-id <FDP-XXX> \
  --tc-id "<tc-id>" \
  --run-id "<DD/MM-R#>" \
  --env-url "<env-url>" \
  --env-user "<env-user>" \
  --precondition "<precondition với data thật>" \
  --steps "<steps với data thật>" \
  --actual "<actual>" \
  --expected "<expected>" \
  --severity <S1|S2|S3|S4> \
  --platform <APP|BE|FE|External|Other> \
  --env-found <DEV|QC|UAT|PILOT|SANDBOX|PRODUCTION> \
  --quality-activity "<quality-activity>" \
  --assigned "<tên dev hoặc TBD>" \
  [--sprint <sprint-id>] \
  [--parent <FDP-XXX>] \
  [--defect-type "<defect-type>"] \
  [--attachments file1.png file2.png ...]
```

### Bước 3 — Báo kết quả và ghi audit log

Sau khi script chạy xong:

1. Output link Jira issue cho user:
   ```
   Defect đã tạo : FDP-XXXX
   Link US       : https://onemount.atlassian.net/browse/FDP-XXX → FDP-XXXX (Relates to)
   https://onemount.atlassian.net/browse/FDP-XXXX
   ```

2. Append vào `governance/audit-log.md` (tạo file nếu chưa có):
   ```
   | yyyy-mm-dd HH:mm | 09b-log-defect | FDP-XXXX | S? | DD/MM-R# | <confirmed-by> | DONE |
   ```

   Header mẫu khi tạo file lần đầu:
   ```markdown
   | Date | Skill | Jira Issue | Severity | Run ID | Confirmed by | Status |
   |---|---|---|---|---|---|---|
   ```

Nếu có lỗi 400/403 từ Jira API → đọc error message, giải thích nguyên nhân, không tự retry loop.

## Custom fields FDP (tham khảo khi cần debug)

| Jira Field | customfield ID | Type | Allowed values |
|---|---|---|---|
| Severity | `customfield_10082` | single-select | Critical, Major, Normal, Minor |
| Environment found | `customfield_10100` | multi-select | DEV, QC, UAT, PILOT, SANDBOX, PRODUCTION |
| Quality Activity | `customfield_10202` | single-select | Functional Test, User Acceptance test, Regression Test, System Integration test, Unit test, Review, Security Test, Final inspection |
| Platform | `customfield_11021` | multi-select | APP, BE, FE, External, Other |
| Defect Type | `customfield_10205` | single-select | Code defect, Design defect, Document defect, System defect |

## Stop Conditions

- User chưa confirm bug (chỉ nghi ngờ, chưa reproduce được) → không chạy script.
- Thiếu bất kỳ field required nào (`summary`, `us-id`, `run-id`, `precondition`, `steps`, `actual`, `expected`, `severity`, `assigned`) → hỏi bổ sung trước.
- Steps không có data thật (chứa placeholder như `{kb_id}`, `<url>`) → yêu cầu điền giá trị thực trước.
- User chưa trả lời "yes" ở bước confirm (L2 gate) → không gọi script, không push Jira.
- Script báo lỗi 403/permission → hướng dẫn user nhờ Jira admin grant `Create Issues` trên project FDP.

## Schema compliance (defect.schema.yaml v2.0)

| Schema field | Nguồn trong skill | Ghi chú |
|---|---|---|
| Bug ID | Jira tự sinh (FDP-XXXX) | Không cần nhập |
| Mô tả ngắn | `summary` (format `[US-ID][TC-ID] ...`) | Required |
| Severity | `severity` S1–S4 → Jira Critical/Major/Normal/Minor | Required |
| Priority | Tự suy từ severity | Required |
| Assigned | `assigned` (tên dev hoặc TBD) | Required |
| Trạng thái | Auto = Open khi tạo Jira | Không cần nhập |
| Run ID phát hiện | `run-id` (DD/MM-R#) | Required |
