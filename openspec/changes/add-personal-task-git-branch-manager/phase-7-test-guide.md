# Phase 7 Test Guide - Timeline And Audit

Mục tiêu phase này là kiểm tra timeline chung của dự án, filter theo task/branch/event/date, comment thủ công, và timeline tab trong drawer task/branch.

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

## 2. Tạo Dữ Liệu Timeline

Tạo hoặc dùng dữ liệu từ Phase 5/6:

1. Tạo note trong `Inbox`.
2. Chuyển note thành task.
3. Bấm `Sẵn sàng main` cho task.
4. Tạo branch liên quan task.
5. Merge branch vào release.
6. Merge branch hoặc branch kế thừa vào main.

Kỳ vọng:

- Timeline có event note tạo/lưu trữ/chuyển task.
- Timeline có event task tạo/đổi trạng thái/sẵn sàng main/done bởi main merge.
- Timeline có event branch tạo/link task/merge release/merge main.

## 3. Test Màn Timeline

Trên sidebar, bấm `Timeline`.

Kỳ vọng:

- URL là `/timeline`.
- Thấy danh sách event mới nhất của dự án đang chọn.
- Mỗi event có title, event type, thời gian, project tag, task tag hoặc branch tag nếu có.

## 4. Test Filter

Ở block `Bộ lọc`:

1. Chọn task.
2. Chọn branch.
3. Chọn loại event, ví dụ `Branch merge main`.
4. Chọn date range nếu cần.

Kỳ vọng:

- Timeline chỉ còn event đúng filter.
- Bỏ filter thì danh sách quay lại đầy đủ.

## 5. Test Ghi Chú

Ở block `Ghi chú`:

1. Nhập tiêu đề, ví dụ `Review release`.
2. Chọn task hoặc branch nếu muốn gắn ngữ cảnh.
3. Nhập nội dung.
4. Bấm `Thêm ghi chú`.

Kỳ vọng:

- Ghi chú xuất hiện trên timeline với event type `TIMELINE_COMMENT`.
- Nếu chọn task/branch thì event có tag task/branch tương ứng.

## 6. Test Timeline Tab Trong Drawer

Vào `All Tasks`:

1. Bấm `Chi tiết` task.
2. Mở tab `Timeline`.

Vào `Branches`:

1. Bấm `Chi tiết` branch.
2. Mở tab `Timeline`.

Kỳ vọng:

- Task drawer hiện timeline của task.
- Branch drawer hiện timeline của branch.

## 7. Test Tự Động

Chạy:

```bash
npm run test:ui
```

Luồng tự động đang kiểm thêm Phase 7:

- Tạo note/task/branch.
- Merge branch vào main để sinh timeline.
- Mở `Timeline`.
- Thêm comment và kiểm comment xuất hiện.

## Checklist Review

- [ ] Sidebar `Timeline` mở được.
- [ ] Timeline lọc được theo task, branch, event type, date range.
- [ ] Comment thủ công lưu được.
- [ ] Event có context task/branch/project rõ ràng.
- [ ] Task drawer có tab `Timeline`.
- [ ] Branch drawer có tab `Timeline`.
