> **Hướng dẫn sử dụng template:** Nội dung dưới đây được giữ theo format tài liệu mẫu gốc. Khi dùng cho dự án mới, thay các placeholder như `[PROJECT_CODE]`, `[PROJECT_NAME]`, `[SYSTEM_NAME]`, `[ENV]`, `[OWNER]`, `[LINK]`; giữ lại các bảng, tiêu chí, checklist và các con số baseline nếu còn phù hợp. Nguồn gốc đã sanitize: `Automation Test\Hướng dẫn cấu hình các thông tin về token\Hướng dẫn cấu hình các thông tin về token.md`.

# Automation Token Configuration Guide

> **Mục đích sử dụng:** Dùng hướng dẫn cấu hình token/secret/env variable cho Automation một cách an toàn và có thể tái sử dụng.

<https://[CONFLUENCE_DOMAIN]/wiki/pages/[PAGE_ID]>

Do các thộng tin nhạy cảm như token, password ko được phép commit lên gitlab nên sẽ thực hiện lưu trữ ở máy cá nhân\
Sau đây là hướng dẫn

\
**Hướng Dẫn Cấu Hình Biến Môi Trường** `googlespace` **trên Windows**

#### **Bước 1: Tạo thư mục lưu trữ**

- Mở **File Explorer**.
- Truy cập ổ đĩa `C:` và tạo một thư mục mới với tên:

  `C:\googlespace`

#### **Bước 2: Thiết lập biến môi trường**

- Mở **Command Prompt** (CMD).
- Thực hiện lệnh sau để khai báo biến môi trường:

  `setx googlespace C:\googlespace`
- Sau khi lệnh chạy xong, **khởi động lại máy tính** để hệ điều hành cập nhật biến môi trường.

#### **Bước 3: Tải và giải nén file cấu hình**

Truy cập đường dẫn sau bằng trình duyệt:

liên hệ để nhận file

- Lưu file `.zip` về máy.
- Giải nén **toàn bộ nội dung** vào thư mục:

![Ảnh minh họa đã được lược bỏ khi template hóa]([IMAGE_PLACEHOLDER])

---

✅ **Kiểm tra biến môi trường đã được cấu hình đúng:**\
 Sau khi khởi động lại máy, mở CMD và chạy:

`echo %googlespace%`

Nếu kết quả hiển thị là `C:\googlespace`, bạn đã thiết lập thành công.







