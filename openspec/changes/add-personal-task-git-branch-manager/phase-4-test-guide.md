# Phase 4 Test Guide - Project And Repository Workspace

Mục tiêu phase này là kiểm tra quản lý dự án, nhóm task, repository và preview mã task theo project/group.

## 1. Chuẩn bị

Chạy từ root project:

```bash
cd /home/khanh-pham/Documents/MH/Tools/quan_ly_cong_viec
sh dev.sh
```

Nếu port đang bận:

```bash
sh stop.sh
sh dev.sh
```

Mở:

```text
http://localhost:5173
```

Đăng nhập bằng account đã tạo ở Phase 3.

## 2. Vào Màn Cài Đặt

Trên sidebar, bấm `Cài đặt`.

Kỳ vọng:

- URL là `/settings`.
- Thấy heading `Cài đặt`.
- Thấy block `Dự án`.
- Thấy block `Cấu hình dự án đang chọn`.

## 3. Test Project CRUD

Trong block `Dự án`, tạo project mới:

- Mã dự án: `OPS`
- Tên dự án: `Dự án vận hành`
- Ghi chú: tùy chọn

Bấm `Thêm dự án`.

Kỳ vọng:

- Project `OPS - Dự án vận hành` xuất hiện trong table.
- Project selector trên header chuyển sang project mới.
- Dòng project đang chọn có tag `Đang chọn`.
- Hover/click vào cả dòng project có thể chọn project, không cần bấm nút riêng.
- Có thể bấm `Sửa`, đổi tên rồi `Lưu dự án`.

Chỉ test `Xóa` với project test, không xóa project mẫu nếu còn cần review tiếp.

## 4. Test Nhóm Task

Khi project `OPS` đang được chọn, ở tab `Nhóm task` tạo nhóm:

- Mã nhóm: `BE`
- Tên nhóm: `Backend`
- Đang dùng: bật

Bấm `Thêm nhóm`.

Kỳ vọng:

- Nhóm `BE - Backend` xuất hiện trong table.
- Cột mã task kế tiếp hiển thị dạng `OPS-BE-001`.
- Có thể `Sửa` nhóm, bật/tắt trạng thái `Đang dùng`.
- Có thể `Xóa` nhóm test.

## 5. Test Repository

Chuyển sang tab `Repository`, tạo repository:

- Tên repository: `backend-api`
- Provider: `GitLab self-hosted`
- GitLab URL: `https://gitlab.local`
- GitLab project path: `team/backend-api`
- Access token: nhập chuỗi test bất kỳ
- Default branch: `main`
- Production branch: `main`
- Release pattern: `release/DDMMYYYY`
- Repository mặc định: bật nếu muốn

Bấm `Thêm repository`.

Kỳ vọng:

- Repository `backend-api` xuất hiện trong table.
- Project path `team/backend-api` hiển thị.
- Có tag `Có token`.
- Branch path hiển thị `main -> release/DDMMYYYY -> main`.
- Nếu bật mặc định thì có tag `Mặc định`.
- Khi sửa repository, token không hiện lại dạng plain text.
- Có thể dùng `Xóa token` khi sửa repository.

## 6. Test UI Tự Động Bằng Browser

Chạy:

```bash
npm run test:ui
```

Kỳ vọng:

```text
1 passed
```

Test này dùng database riêng `backend/prisma/e2e.db`, backend port `4100` và frontend port `5174`. Không ảnh hưởng database review `backend/prisma/dev.db`.

Luồng tự động đang kiểm thêm Phase 4:

- Vào `/settings`.
- Tạo project `OPS`.
- Tạo nhóm task `BE`.
- Kiểm mã preview `OPS-BE-001`.
- Tạo repository `backend-api`.
- Kiểm GitLab path và token flag.

## 7. API Smoke Test

Sau khi login trên browser, có thể dùng UI là chính. Nếu muốn kiểm nhanh backend, mở devtools Network và xác nhận các API sau trả `200`:

- `GET /api/projects`
- `GET /api/projects/:projectId/task-groups`
- `GET /api/projects/:projectId/repositories`
- `GET /api/projects/:projectId/task-code-preview`

## 8. Kết Thúc Review

Dừng server:

```bash
sh stop.sh
```

## 9. Checklist Review

- [ ] Vào được `/settings`.
- [ ] Tạo/sửa/chọn project được.
- [ ] Project selector cập nhật sau khi tạo project.
- [ ] Tạo/sửa/xóa nhóm task được.
- [ ] Mã task preview đúng dạng project/group.
- [ ] Tạo/sửa/xóa repository được.
- [ ] Repository hỗ trợ GitLab self-hosted fields.
- [ ] Token repository không bị trả plain text ra UI.
- [ ] `npm run test:ui` pass.
