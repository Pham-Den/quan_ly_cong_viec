# Phase 5 Test Guide - Inbox And Task Planning

Mục tiêu phase này là kiểm tra ghi nhanh note, chuyển note thành task, quản lý task, filter task và status task đi theo branch thay vì nhập tay.

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

## 2. Test Dashboard Quick Note

Ở `Tổng quan`, block `Inbox nhanh`:

1. Nhập nội dung note, ví dụ `Tạo API export báo cáo`.
2. Nhập nguồn tùy chọn, ví dụ `Họp sáng`.
3. Bấm `Thêm note`.

Kỳ vọng:

- Form reset sau khi thêm.
- Note được lưu vào inbox của dự án đang chọn.

## 3. Test Inbox

Trên sidebar, bấm `Inbox`.

Kỳ vọng:

- URL là `/inbox`.
- Thấy note vừa tạo.
- Filter `Tất cả`, `Đang chờ`, `Đã lưu trữ` hoạt động.
- `Tất cả` chỉ hiện note còn có thể xử lý trong Inbox, gồm note đang chờ và note lưu trữ.
- Ô tìm note lọc theo nội dung.

## 4. Test Archive Note

Với note đang `Đang chờ`:

1. Bấm `Lưu trữ`.
2. Đổi filter sang `Đã lưu trữ`.

Kỳ vọng:

- Note xuất hiện trong danh sách archived.
- Note không còn nằm trong filter `Đang chờ`.
- Note archived vẫn có thể bấm `Chuyển task`.

## 5. Test Convert Note Thành Task

Tạo một note mới hoặc dùng note đã lưu trữ rồi ở `Inbox`:

1. Bấm `Chuyển task`.
2. Kiểm tra drawer `Chuyển note thành task`.
3. Chọn nhóm task nếu có.
4. Chọn priority/type/target date nếu cần.
5. Bấm `Tạo task`.

Kỳ vọng:

- Note chuyển sang status `CONVERTED`.
- Note đã chuyển task không còn hiện trong Inbox vì lúc này cần theo dõi ở bảng task.
- Task mới xuất hiện ở bảng task.
- Task có mã tự sinh theo project/group, ví dụ `OPS-BE-001`.
- Timeline ghi event tạo task.

## 6. Test Tạo Task Thủ Công

Ở `Inbox` hoặc `All Tasks`, bấm `Tạo task`.

Nhập:

- Tiêu đề task
- Nhóm task
- Ưu tiên
- Loại
- Target date
- Mô tả

Bấm `Tạo task`.

Kỳ vọng:

- Task xuất hiện trong bảng.
- Task có mã tự sinh.
- Timeline có event tạo task.

## 7. Test All Tasks Và Filter

Trên sidebar, bấm `All Tasks`.

Kỳ vọng:

- URL là `/tasks`.
- Bảng task hiển thị task đã tạo.
- Filter hoạt động theo:
  - text query
  - nhóm task
  - trạng thái
  - ưu tiên
  - loại
  - branch text

Branch filter sẽ hữu ích hơn sau Phase 6 khi branch lifecycle được thêm dữ liệu.

## 8. Test Task Detail Drawer

Trong bảng task:

1. Bấm `Chi tiết`.
2. Sửa tiêu đề/priority/type/target date/mô tả.
3. Bấm `Lưu task`.

Kỳ vọng:

- Task cập nhật trong bảng.
- Trạng thái task chỉ hiển thị dạng tag/summary, không có field sửa tay.
- Drawer có khu vực `Timeline`.

## 9. Test Quyền Sửa Task Theo Branch

Trong bảng task hoặc drawer:

1. Kiểm tra không có nút hoặc field `Sẵn sàng main`.
2. Với task chưa lên main/prod, sửa thông tin và lưu bình thường.
3. Với task đã `DONE` hoặc branch active đã vào `main`, mở drawer chi tiết.

Kỳ vọng:

- Task chưa lên main/prod cho phép sửa và xóa.
- Task đã lên main/prod vẫn hiện đủ thông tin nhưng field, nút lưu và nút xóa bị disable kèm lý do.
- Task chỉ về `DONE` khi branch/release đã merge vào `main`.

## 10. Test UI Tự Động Bằng Browser

Chạy:

```bash
npm run test:ui
```

Kỳ vọng:

```text
1 passed
```

Luồng tự động đang kiểm thêm Phase 5:

- Quick-add note từ dashboard.
- Vào inbox.
- Chuyển note thành task.
- Vào All Tasks và thấy task vừa tạo.

## 11. Kết Thúc Review

Dừng server:

```bash
sh stop.sh
```

## 12. Checklist Review

- [ ] Dashboard thêm note nhanh được.
- [ ] Inbox hiển thị note theo filter `Tất cả`, `Đang chờ`, `Đã lưu trữ`.
- [ ] Note đã thành task không còn hiện trong Inbox.
- [ ] Note đã lưu trữ vẫn chuyển thành task được.
- [ ] Archive note hoạt động.
- [ ] Convert note thành task hoạt động.
- [ ] Tạo task thủ công hoạt động.
- [ ] Task table filter được theo text, nhóm, status, priority, type, branch.
- [ ] Detail drawer sửa task được.
- [ ] Không còn nút/field `Sẵn sàng main` trên màn task.
- [ ] Task đã lên main/prod bị disable sửa/xóa.
- [ ] Timeline có event tạo task và các event branch làm đổi trạng thái task.
- [ ] `npm run test:ui` pass.
