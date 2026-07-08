# Phase 9 Test Guide - Workflow Settings And UI Polish

Mục tiêu phase này là kiểm tra cấu hình status workflow, màu status, label tiếng Việt, và việc áp dụng màu/label đồng bộ trên dashboard, task, branch, timeline.

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

## 2. Test Workflow Settings

Vào `Cài đặt`, chọn tab `Workflow`.

Kỳ vọng:

- Thấy bảng `Task status`.
- Thấy bảng `Branch status`.
- Mỗi status có key, label, màu, thứ tự, bật/tắt, nút `Lưu`.
- Key chỉ để đọc; không chỉnh trực tiếp.

## 3. Test Đổi Label Và Màu Task Status

Ở bảng `Task status`:

1. Tìm status `DONE`.
2. Đổi label thành `Hoàn tất`.
3. Đổi màu nếu muốn.
4. Bấm `Lưu`.

Kỳ vọng:

- Dòng status giữ label/màu mới sau khi lưu.
- Vào `Tất cả task`, task done hiển thị label/màu mới.
- Dashboard bucket và danh sách task dùng màu status tương ứng.

## 4. Test Đổi Label Và Màu Branch Status

Ở bảng `Branch status`:

1. Tìm status `MERGED_MAIN`.
2. Đổi label hoặc màu.
3. Bấm `Lưu`.

Kỳ vọng:

- Vào `Nhánh`, branch table và branch board dùng label/màu mới.
- Branch drawer vẫn hiển thị status có chữ và màu.

## 5. Test Tắt Status Khỏi Filter

Ở tab `Workflow`:

1. Tắt một status ít dùng, ví dụ `CANCELLED`.
2. Bấm `Lưu`.

Kỳ vọng:

- Status bị tắt không còn xuất hiện trong select filter/tạo mới.
- Record cũ nếu đang có status đó không bị hỏng dữ liệu.

## 6. Test Màu Note Status

Vào `Inbox`.

Kỳ vọng:

- Note `Đang chờ`, `Đã lưu trữ`, `Đã thành task` có màu phân biệt.
- Label chữ vẫn luôn hiển thị, không phụ thuộc chỉ vào màu.

## 7. Test Label Tiếng Việt

Kỳ vọng:

- Sidebar hiển thị `Tất cả task`, `Nhánh`, `Dòng thời gian`.
- Heading các màn chính dùng tiếng Việt.
- Nút/form/filter vẫn rõ nghĩa bằng tiếng Việt.

## 8. Test Tự Động

Chạy:

```bash
npm run test:ui
```

Luồng tự động đang kiểm thêm Phase 9:

- Mở tab `Workflow`.
- Đổi label `DONE` thành `Hoàn tất`.
- Merge branch vào main.
- Kiểm task done hiển thị label `Hoàn tất`.

## Checklist Review

- [ ] Workflow settings API lưu được label/màu/thứ tự/bật tắt.
- [ ] Cài đặt có tab `Workflow`.
- [ ] Task status dùng màu/label trong dashboard, All Tasks, drawer, timeline.
- [ ] Branch status dùng màu/label trong board, table, drawer, timeline.
- [ ] Note status có màu đơn giản và vẫn có label chữ.
- [ ] Navigation chính đã Việt hóa.
