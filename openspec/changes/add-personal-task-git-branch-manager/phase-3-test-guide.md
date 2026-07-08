# Phase 3 Test Guide - Auth And App Shell

Mục tiêu phase này là kiểm tra setup account lần đầu, login/logout, session restore, route guard và app shell tiếng Việt.

## 1. Chuẩn bị

Chạy từ root project:

```bash
cd /home/khanh-pham/Documents/MH/Tools/quan_ly_cong_viec
./dev.sh
```

`dev.sh` sẽ tự chạy `db:push`, `db:seed`, start backend và frontend. Nếu trước đó bạn đã chạy server bằng cách cũ hoặc port đang bận, dừng trước bằng:

```bash
./stop.sh
./dev.sh
```

Mở:

```text
http://localhost:5173
```

Backend health:

```bash
curl http://localhost:4000/health
```

Kỳ vọng:

```json
{"ok":true,"service":"quan-ly-cong-viec-api"}
```

## 2. Test Setup Account Lần Đầu

Nếu database chưa có user, mở `http://localhost:5173` phải tự chuyển sang:

```text
/setup
```

Nhập:

- Tên hiển thị
- Email
- Mật khẩu tối thiểu 8 ký tự

Bấm `Tạo tài khoản`.

Kỳ vọng:

- Vào màn `Tổng quan`.
- Thấy sidebar: `Tổng quan`, `All Tasks`, `Branches`, `Timeline`, `Cài đặt`.
- Thấy project selector có `PERSONAL - Cong viec ca nhan`.
- Thấy nút user ở góc phải.

## 3. Test Logout

Trên dashboard:

1. Bấm nút user ở góc phải.
2. Chọn `Đăng xuất`.

Kỳ vọng:

- App chuyển về `/login`.
- Không còn truy cập dashboard nếu chưa login lại.

## 4. Test Login Lại

Ở `/login`, nhập email/password vừa tạo.

Kỳ vọng:

- Login thành công.
- App chuyển về dashboard `Tổng quan`.
- User button vẫn hiển thị đúng tên.

## 5. Test Session Restore

Sau khi login thành công:

1. Reload browser.
2. Hoặc đóng tab rồi mở lại `http://localhost:5173`.

Kỳ vọng:

- Vẫn ở dashboard.
- Không bị văng về `/login`.

## 6. Test Route Guard

Khi đã có account:

```text
http://localhost:5173/setup
```

Kỳ vọng:

- Không cho setup lại.
- App chuyển về dashboard nếu đang login, hoặc `/login` nếu chưa login.

Khi đã logout:

```text
http://localhost:5173/
```

Kỳ vọng:

- App chuyển về `/login`.

## 7. Test API Bootstrap

Trước khi tạo user:

```bash
curl http://localhost:4000/api/auth/bootstrap
```

Kỳ vọng:

```json
{"setupRequired":true}
```

Sau khi tạo user:

```bash
curl http://localhost:4000/api/auth/bootstrap
```

Kỳ vọng:

```json
{"setupRequired":false}
```

## 8. Test UI Tự Động Bằng Browser

Chạy:

```bash
npm run test:ui
```

Kỳ vọng:

```text
1 passed
```

Test này dùng Chromium headless, database riêng `backend/prisma/e2e.db`, backend port `4100` và frontend port `5174`. Test không ảnh hưởng account đang review ở `backend/prisma/dev.db`.

Luồng tự động đang kiểm:

- First-run setup redirect.
- Tạo account đầu tiên.
- Vào protected dashboard.
- Logout từ user menu.
- Login lại.
- Reload và restore session.

Nếu muốn thấy browser mở thật:

```bash
npm run test:ui:headed
```

## 9. Reset Database Để Test Lại Từ Đầu

Nếu muốn quay lại trạng thái chưa có user:

```bash
./stop.sh
rm -f backend/prisma/dev.db backend/prisma/dev.db-journal
./dev.sh
```

Sau đó mở lại:

```text
http://localhost:5173
```

Kỳ vọng app quay lại flow `/setup`.

Sau khi review xong, dừng cả frontend và backend:

```bash
./stop.sh
```

## 10. Checklist Review

- [ ] `/setup` chỉ xuất hiện khi chưa có user.
- [ ] Tạo account đầu tiên thành công.
- [ ] Không thể setup account lần hai.
- [ ] Login đúng email/password thành công.
- [ ] Logout đưa về `/login`.
- [ ] Route guard chặn dashboard khi chưa login.
- [ ] Reload sau khi login vẫn giữ session.
- [ ] Dashboard hiển thị layout tiếng Việt và project mẫu.
- [ ] `npm run test:ui` pass.
