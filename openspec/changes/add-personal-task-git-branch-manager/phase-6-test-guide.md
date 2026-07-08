# Phase 6 Test Guide - Branch Lifecycle

Mục tiêu phase này là kiểm tra tạo branch từ app, link task, theo dõi checkout source, merge target, release/main merge, và rule task chỉ `DONE` khi branch lineage đã vào `main`.

## 1. Chuẩn Bị

Chạy từ root project:

```bash
cd /home/khanh-pham/Documents/MH/Tools/quan_ly_cong_viec
sh dev.sh
```

Mở:

```text
http://localhost:5173
```

Đăng nhập bằng account đã tạo ở Phase 3.

## 2. Tạo Task Để Link Branch

Vào `Inbox` hoặc `All Tasks`:

1. Tạo một task mới hoặc dùng task đã có.
2. Không cần đánh dấu ready-main; task sẽ đi theo branch active.

Kỳ vọng:

- Task có mã như `OPS-BE-001`.
- Task hiện trong `All Tasks`.

## 3. Tạo Branch A Từ Main

Vào sidebar `Branches`, bấm `Tạo branch`.

Nhập/chọn:

- Repository
- Task liên quan
- Tên branch, ví dụ `feature/OPS-BE-001-export-report`
- `Checkout từ`: `main`
- `Dự định merge vào`: release hiện tại, ví dụ `release/08072026`

Bấm `Tạo branch`.

Kỳ vọng:

- Branch xuất hiện trong bảng.
- Branch hiển thị repo, status, task linked, checkout source, merge target.
- Drawer có preview lệnh checkout.

## 4. Merge Branch A Vào Release

Ở bảng `Branches`, bấm `Merge release` trên branch A.

Kỳ vọng:

- Branch chuyển status `MERGED_RELEASE`.
- `Đã merge vào` là release branch.
- Task liên quan chưa chuyển `DONE`; task chuyển `MERGED_RELEASE` khi active branch đã vào release.
- Timeline ghi event merge release.

## 5. Tạo Branch B Từ Branch A

Bấm `Tạo branch`.

Nhập/chọn:

- `Branch nguồn đã tracking`: branch A
- Giữ bật `Kế thừa task từ branch nguồn`
- Tên branch B, ví dụ `feature/OPS-BE-001-export-report-fix`

Bấm `Tạo branch`.

Kỳ vọng:

- Branch B có `Checkout từ` là branch A.
- Branch B tự mang task linked từ branch A.
- Branch B cùng lineage với branch A để khi B vào main thì task được tính hoàn tất.

## 6. Merge Branch B Vào Main

Ở bảng `Branches`, bấm `Merge main` trên branch B.

Kỳ vọng:

- Branch B chuyển status `MERGED_MAIN`.
- `Đã merge vào` là `main`.
- Task liên quan chuyển `DONE`, dù branch A chỉ mới vào release.
- Timeline ghi event branch vào main và task done bởi main merge.

## 7. Test Main Merge Không Cần Ready Main

Tạo task/branch/release flow khác, sau đó merge release vào `main`.

Kỳ vọng:

- UI không yêu cầu ready-main ở task.
- Hệ thống ghi nhận main merge vì `main` là source of truth.
- Task đủ điều kiện chuyển `DONE`.

## 8. Test Alias Và Search

Trong drawer branch:

1. Nhập alias, mỗi dòng một alias.
2. Lưu branch.
3. Tìm theo alias trong ô search.

Kỳ vọng:

- Search tìm được branch qua alias.

## 9. Test Tự Động

Chạy:

```bash
npm run test:ui
```

Luồng tự động đang kiểm thêm Phase 6:

- Tạo branch A từ main và link task.
- Merge A vào release.
- Tạo branch B từ A và kế thừa task.
- Merge B vào main.
- Kiểm tra task chuyển `DONE`.

## Checklist Review

- [ ] Sidebar `Branches` mở được.
- [ ] Tạo branch với task linked hoạt động.
- [ ] Lệnh checkout preview đúng source branch.
- [ ] Branch A merge release không làm task `DONE`.
- [ ] Branch B tạo từ A kế thừa task.
- [ ] Branch B merge main làm task `DONE`.
- [ ] Main merge không yêu cầu ready-main ở task.
- [ ] Search theo branch name, task code, alias hoạt động.
