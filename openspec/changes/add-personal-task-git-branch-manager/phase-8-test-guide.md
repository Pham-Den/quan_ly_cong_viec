# Phase 8 Test Guide - Work Visibility

Mục tiêu phase này là kiểm tra các màn nhìn nhanh tình trạng công việc: dashboard tín hiệu, grouped All Tasks, branch board, global search, task chưa có branch, branch chưa vào main, và branch path trong task detail.

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

## 2. Test Dashboard

Vào `Tổng quan`.

Kỳ vọng:

- Bucket count hiển thị task theo nhóm: chưa làm, đang tiến hành, review/test, release, sẵn sàng main, done, blocked.
- Có block `Task đang chạy`.
- Có block `Sắp/đã tới hạn`.
- Có block `Blocked`.
- Có block `Branch cần chú ý`.
- Có block `Inbox chưa xử lý`.
- Có block `Timeline gần đây`.

## 3. Test All Tasks Grouped View

Vào `All Tasks`.

Kỳ vọng:

- Có board nhóm task theo trạng thái thực tế.
- Mỗi group có count và tối đa vài task để scan nhanh.
- Bấm task trong group mở drawer chi tiết task.
- Nếu task chưa link branch thì block `Task chưa có branch` hiển thị mã task.

## 4. Test Branch Path Trong Task Detail

Trong `All Tasks`, mở chi tiết một task đã link branch.

Kỳ vọng:

- Drawer có khu vực `Branch path`.
- Thấy đường đi dạng `checkout source -> release target -> actual/main`.
- Thấy status branch.
- Tab `Timeline` vẫn hoạt động.

## 5. Test Branch Board

Vào `Branches`.

Kỳ vọng:

- Có board branch grouped theo lifecycle status.
- Có block `Branch chưa vào main` nếu còn branch chưa merge main.
- Bấm branch từ board hoặc block này mở drawer chi tiết branch.

## 6. Test Global Search

Ở header, nhập:

- task code, ví dụ `OPS-001`
- branch name, ví dụ `feature/OPS-001`
- branch alias nếu có

Kỳ vọng:

- Search trả kết quả task/branch/note.
- Chọn task sẽ mở `All Tasks` và drawer task.
- Chọn branch sẽ mở `Branches` và drawer branch.

## 7. Test Tự Động

Chạy:

```bash
npm run test:ui
```

Luồng tự động đang kiểm thêm Phase 8:

- Dashboard hiển thị các block visibility.
- Global search tìm branch.
- Chọn branch từ search mở drawer branch.

## Checklist Review

- [ ] Dashboard không còn placeholder trống.
- [ ] All Tasks group theo trạng thái và mở drawer được.
- [ ] Task detail hiển thị branch path.
- [ ] Branches có board theo status và block branch chưa vào main.
- [ ] Global search tìm được task/branch/note.
- [ ] Search task/branch mở đúng drawer.
