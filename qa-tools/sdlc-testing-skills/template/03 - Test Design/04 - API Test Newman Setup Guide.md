> **Hướng dẫn sử dụng template:** Nội dung dưới đây được giữ theo format tài liệu mẫu gốc. Khi dùng cho dự án mới, thay các placeholder như `[PROJECT_CODE]`, `[PROJECT_NAME]`, `[SYSTEM_NAME]`, `[ENV]`, `[OWNER]`, `[LINK]`; giữ lại các bảng, tiêu chí, checklist và các con số baseline nếu còn phù hợp. Nguồn gốc đã sanitize: `Testing Guideline\Hướng Dẫn Cài Đặt và Chạy Newman với Node\Hướng Dẫn Cài Đặt và Chạy Newman với Node.md`.

# API Test Newman Setup Guide

> **Mục đích sử dụng:** Dùng hướng dẫn setup/chạy API test bằng Newman/Node và xuất report.

<https://[CONFLUENCE_DOMAIN]/wiki/pages/[PAGE_ID]>

Hướng dẫn này cung cấp các bước chi tiết để cài đặt và chạy script Postman JSON bằng Newman trên Windows, sử dụng Node.js portable (không cần quyền admin). Nội dung phù hợp cho người mới bắt đầu.

## 1. Giới Thiệu về Newman, Node.js và npm

- **Node.js là gì?**

  - Node.js là một môi trường runtime mã nguồn mở, cho phép chạy mã JavaScript bên ngoài trình duyệt. Nó sử dụng động cơ V8 của Chrome để thực thi mã nhanh chóng, và được thiết kế để xây dựng các ứng dụng mạng có khả năng mở rộng cao. Mục đích chính là hỗ trợ phát triển ứng dụng backend, bao gồm cả việc chạy công cụ như Newman.
- **npm là gì?**

  - npm (Node Package Manager) là công cụ quản lý gói đi kèm với Node.js, dùng để cài đặt, quản lý và chia sẻ các thư viện hoặc công cụ JavaScript. Nó cho phép tải về các gói như Newman hoặc newman-reporter-htmlextra từ kho lưu trữ npm, giúp đơn giản hóa việc tích hợp công cụ vào dự án.
- **Newman là gì?**

  - Newman là một công cụ dòng lệnh, được phát triển bởi Postman, dùng để chạy các bộ sưu tập (collections) API đã tạo trong Postman mà không cần mở giao diện người dùng. Mục đích của Newman là tự động hóa kiểm thử API, tạo báo cáo, và tích hợp với hệ thống CI/CD, giúp đội ngũ phát triển và QA đánh giá hiệu suất API một cách hiệu quả.

## 2. Tải và Giải Nén Node.js Portable

- **Tải Node.js**:

  - Truy cập <http://nodejs.org> vào mục download.

<https://nodejs.org/en/download>

![Ảnh minh họa đã được lược bỏ khi template hóa]([IMAGE_PLACEHOLDER])![Ảnh minh họa đã được lược bỏ khi template hóa]([IMAGE_PLACEHOLDER])

- Tải file zip phiên bản LTS (ví dụ: node-v22.17.0-win-x64.zip) cho Windows.

  - Lưu vào thư mục, ví dụ: D:\
- **Giải nén**:

  - Sử dụng WinRAR hoặc 7-Zip để giải nén vào thư mục, ví dụ: D:\
- **Kiểm tra Node.js và npm**:

  - Mở Command Prompt, di chuyển đến thư mục:
  - Chạy các lệnh:
  - Nếu hiển thị phiên bản (ví dụ: v22.17.0 cho Node.js và 10.x.x cho npm), Node.js và npm đã sẵn sàng.

## 2. Tạo Dự Án và Cài Newman cùng Reporter

Newman sẽ được cài đặt cục bộ trong một thư mục dự án bằng npm.

- **Tạo thư mục dự án**:
- **Khởi tạo dự án**:

  - Sau khi vào thư mục dự án gõ lệnh sau:
  - Chạy lệnh để tạo file package.json:
- **Cài Newman**:

  - Cài Newman cục bộ bằng npm:
  - Sau khi cài, thư mục node\_modules\newman sẽ xuất hiện trong D:\my-newman-project.
- **Kiểm tra Newman**:

  - Chạy lệnh để xác nhận Newman đã cài đặt:
  - Nếu hiển thị phiên bản (ví dụ: 5.3.2), Newman đã sẵn sàng.
- **Cài đặt Reporter HTMLEXTRA (cho báo cáo đẹp)**:

  - Cài gói newman-reporter-htmlextra để tạo báo cáo với giao diện nâng cao:
  - Lưu ý: Tùy chọn --legacy-peer-deps giải quyết xung đột phiên bản giữa newman và reporter.
- **Kiểm tra cài đặt**:

  - Kiểm tra Newman:
  - Kiểm tra thư mục reporter:
  - Nếu hiển thị phiên bản (ví dụ: 6.2.1 cho Newman) và thư mục newman-reporter-htmlextra tồn tại, cài đặt thành công.

## 3. Chuẩn Bị File Collection và Environment

Bạn cần file collection Postman và (tùy chọn) file environment để chạy Newman.

- **Xuất Collection từ Postman**:

  1. Mở Postman, chọn collection (ví dụ: MyCollection).
  2. Nhấn **...** > **Export**, chọn định dạng **Collection v2.1**, lưu thành my\_collection.json.
  3. Sao chép file my\_collection.json vào D:\my-newman-project.
- **Xuất Environment (nếu cần)**:

  1. Trong Postman, vào **Environments**, chọn môi trường (ví dụ: MyEnvironment).
  2. Nhấn **Export**, lưu thành my\_environment.json (hoặc env.json nếu bạn đã có).
  3. Sao chép file vào thư mục dự án.
- **Kiểm tra file**:

  - File collection (my\_collection.json) chứa danh sách request (có trường "item").
  - File environment (my\_environment.json hoặc env.json) chứa các biến (như "key": "baseUrl", "value": "<https://api.example.com>").
  - Mở file bằng Notepad hoặc VS Code để xác nhận nội dung.

## 4. Chạy Script Postman bằng Newman

- **Di chuyển đến thư mục dự án**:
- **Chạy Collection cơ bản**:
- **Chạy với Environment**:
- **Chạy với Environment, Dữ liệu và Báo cáo HTMLEXTRA**:

  - --reporters htmlextra: Sử dụng reporter HTMLEXTRA.
  - --reporter-htmlextra-export report.html: Xuất báo cáo vào file report.html.
  - --reporter-htmlextra-title: Thêm tiêu đề cho báo cáo.
  - --reporter-htmlextra-orientation landscape: Định dạng ngang cho báo cáo.

## 5. Tạo File Batch để Đơn Giản Hóa

Để tránh gõ lệnh dài, tạo file batch chạy Newman.

- Tạo file run-newman.bat trong D:\my-newman-project bằng Notepad:
- Chạy lệnh ngắn gọn:

## 6. Tùy Chỉnh Giao Diện Báo Cáo

- **Mở và chỉnh sửa file** report.html:

  - Sau khi chạy, mở file report.html bằng VS Code hoặc trình soạn thảo khác.
- **Thêm CSS tùy chỉnh**:

  - Thêm đoạn mã CSS vào phần <head> hoặc <style>:
- **Thêm logo**:

  - Chuẩn bị file logo.png và đặt cùng thư mục với report.html.
  - Thêm mã HTML vào đầu file:
- **Xem kết quả**:

  - Sau khi chạy lệnh kết quả sẽ xuất ra file **report.html** ở thực mục Project hiện tại trong trình duyệt (như Chrome) để kiểm tra giao diện.

## 7. Bổ sung thêm log các dữ liệu từ response trả về để phục vụ check kết quả

- Cài đặt gói Express trong thư mục project (chỉ cần cài một lần - chạy Command line):
- Sao chép file server.js vào thư mục project.
- Khởi động node server (chạy hàng ngày khi mở máy - chạy Command line) trong thư mục project:

- Thêm 1 đoạn code để lấy giá trị trả về trong response

![Ảnh minh họa đã được lược bỏ khi template hóa]([IMAGE_PLACEHOLDER])

- Cập nhật collection trong Postman: Thêm một API call để lưu file, sao chép toàn bộ mã JS của API PASC 008 từ ví dụ tham khảo đính kèm.
- ![Ảnh minh họa đã được lược bỏ khi template hóa]([IMAGE_PLACEHOLDER])
- Sau khi chạy collection bằng Newman như trước, trong thư mục project sẽ có file file.txt chứa sẵn câu query để lấy log theo message\_id. Sau khi chạy, sao chép cột error message và dán vào file để đảm bảo đúng thứ tự cột.

## 8. Xử Lý Lỗi Thường Gặp

- **Lỗi "could not find 'htmlextra' reporter"**:

  - Cài lại:
- **Lỗi "Cannot find module ... newman.js"**:

  - Kiểm tra:
  - Nếu không có, cài lại:
- **Lỗi file JSON/CSV không hợp lệ**:

  - Mở Inquiry.json, env.json, và inquiry.csv để kiểm tra cú pháp.
  - Đảm bảo Inquiry.json xuất ở **Collection v2.1**.
- **Lỗi kết nối API**:

  - Kiểm tra URL và biến trong env.json.
  - Đảm bảo mạng và API hoạt động.

## 9. Lưu Ý

- **Xác minh file**: Đảm bảo Inquiry.json là collection, env.json là environment, và inquiry.csv có định dạng đúng.
- **Bảo mật**: Không chia sẻ file JSON/CSV chứa thông tin nhạy cảm (như API key).
- **Tài liệu tham khảo**:

  - Newman GitHub
  - HTMLEXTRA







