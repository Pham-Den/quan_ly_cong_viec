> **Hướng dẫn sử dụng template:** Nội dung dưới đây được giữ theo format tài liệu mẫu gốc. Khi dùng cho dự án mới, thay các placeholder như `[PROJECT_CODE]`, `[PROJECT_NAME]`, `[SYSTEM_NAME]`, `[ENV]`, `[OWNER]`, `[LINK]`; giữ lại các bảng, tiêu chí, checklist và các con số baseline nếu còn phù hợp. Nguồn gốc đã sanitize: `Test Information\Hướng dẫn cài đặt SQL Developer [IP_OR_HOST].1826 (Windows 64-bit)\Hướng dẫn cài đặt SQL Developer [IP_OR_HOST].1826 (Windows 64-bit).md`.

# SQL Developer Setup Guide

> **Mục đích sử dụng:** Dùng hướng dẫn setup SQL Developer/client DB phục vụ kiểm tra dữ liệu test.

<https://[CONFLUENCE_DOMAIN]/wiki/pages/[PAGE_ID]>

### ✅ Bước 1: Tải SQL Developer

Truy cập đường dẫn sau (sao chép và dán vào trình duyệt — **nhớ tắt Warp hoặc VPN**) và **thực hiện cắm dây mạng để download dược nhanh nhất - down bằng wifi thường sẽ rất chậm:**

🔗 [Tải SQL Developer bản ZIP](http://[IP_OR_HOST]/userContent/aaaa/sqldeveloper-[IP_OR_HOST].1826-x64.zip)

> **Lưu ý:** Đây là bản `.zip`, không cần cài đặt, chỉ cần giải nén.

### ✅ Bước 2: Giải nén

Sau khi tải về thành công, bạn **giải nén** file `sqldeveloper-[IP_OR_HOST].1826-x64.zip` vào một thư mục tùy chọn.

### ✅ Bước 3: Import cấu hình kết nối

Tải file **[ORG_NAME]\_db\_3.json** về máy\

1. Mở SQL Developer từ thư mục vừa giải nén.
2. Vào menu **File → Import Connections... hoặc chuột phải vào như hình bên dưới**

![Ảnh minh họa đã được lược bỏ khi template hóa]([IMAGE_PLACEHOLDER])

3. Chọn file kết nối đã được cung cấp ở trên **[ORG_NAME]\_db\_3.json**
4. Khi được yêu cầu mật khẩu, nhập:\
   🔐 **Liên hệ vs**  để lấy MK ở màn hình dưới\

   ![Ảnh minh họa đã được lược bỏ khi template hóa]([IMAGE_PLACEHOLDER])

### ⚠️ Lưu ý quan trọng:

- **Phải bật Warp (VPN)** trước khi kết nối đến cơ sở dữ liệu nếu bạn đang sử dụng mạng nội bộ.
- Nếu gặp lỗi kết nối, kiểm tra lại kết nối mạng và quyền truy cập.







