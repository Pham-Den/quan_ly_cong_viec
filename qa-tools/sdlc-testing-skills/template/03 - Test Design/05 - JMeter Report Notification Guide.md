> **Hướng dẫn sử dụng template:** Nội dung dưới đây được giữ theo format tài liệu mẫu gốc. Khi dùng cho dự án mới, thay các placeholder như `[PROJECT_CODE]`, `[PROJECT_NAME]`, `[SYSTEM_NAME]`, `[ENV]`, `[OWNER]`, `[LINK]`; giữ lại các bảng, tiêu chí, checklist và các con số baseline nếu còn phù hợp. Nguồn gốc đã sanitize: `Testing Guideline\Hướng dẫn gửi report jmeter vào google chat\Hướng dẫn gửi report jmeter vào google chat.md`.

# JMeter Report Notification Guide

> **Mục đích sử dụng:** Dùng hướng dẫn gửi report JMeter hoặc kết quả test vào kênh thông báo chung.

<https://[CONFLUENCE_DOMAIN]/wiki/pages/[PAGE_ID]>

## 🎯 **Mục tiêu**

Sau khi chạy *Performance Test (PT)* trên Jenkins, hệ thống sẽ tự động sinh báo cáo JMeter Dashboard. Trong báo cáo này có file `statistics.json`, chứa toàn bộ metric hiệu năng của test.

Mục tiêu của hướng dẫn này:

1. **Đọc file** `statistics.json` được sinh ra từ JMeter Dashboard sau mỗi lần chạy test (đường dẫn file nằm trong các bản build mục Console Output, VD: `C:\JMETER_REPORT\MIX_HOLIDAY\STAGING\ReportJTL\118\report\statistics.json`)
2. **Trích xuất các metric quan trọng**, bao gồm:

   - Tổng số mẫu (samples)
   - Tỷ lệ lỗi (error %)
   - Average response time
   - Percentile (90/95/99 – tùy cấu hình, thường là `pct3ResTime`)
   - Throughput (TPS)
3. **Format lại nội dung report thành message dễ đọc**, rõ ràng, đầy đủ thông tin.
4. **Gửi báo cáo hiệu năng vào Google Chat** thông qua webhook để team có thể theo dõi kết quả nhanh chóng, không cần mở báo cáo trực tiếp.

Hướng dẫn này mô tả toàn bộ quy trình từ việc đọc file JSON → xử lý dữ liệu → build message → gửi vào Google Chat.

# 🛠️ **Chuẩn Bị**

## **1. Tạo Google Space để nhận thông báo**

Để nhận được báo cáo kết quả Performance Test (PT) gửi từ Jenkins, trước tiên cần tạo một Google Space riêng cho team.

### **Bước 1 — Tạo Google Space mới**

1. Mở Google Chat.
2. Chọn **“Create Space / Tạo không gian”**.
3. Đặt tên theo format khuyến nghị, ví dụ:

   - `#pt-report`
   - `#perf-test-monitoring`
   - `#qa-performance-alerts`
4. Thêm các thành viên liên quan: QA, Dev, DevOps hoặc team vận hành.

---

## **2. Yêu cầu Helpdesk thêm Webhook vào Google Space**

Do tổ chức hạn chế quyền tạo webhook, nhân sự chỉ được phép thêm qua Helpdesk.

### **Bước 2 — Tạo Ticket Helpdesk**

Gửi ticket với nội dung:

- **Tiêu đề**: Request enable Google Chat webhook
- **Không gian**: Tên Google Space vừa tạo
- **Mục đích**: Nhận báo cáo JMeter tự động từ Jenkins
- **Yêu cầu**:

  - Bật tính năng incoming Webhook
  - Cấp webhook URL
  - Đảm bảo quyền gửi từ Jenkins server được phép truy cập

Sau khi Helpdesk xử lý, bạn sẽ nhận được **Google Chat Webhook URL**, ví dụ:

Bạn sẽ sử dụng URL này trong stage gửi báo cáo từ Jenkins.

# **Lưu Webhook vào Jenkins Credentials**

**Lưu ý : phần này nhờ admin của jenkins xử lý.**

Sau khi nhận được **Google Chat Webhook URL** từ Helpdesk, bạn cần lưu token trong URL này vào Jenkins Credentials để đảm bảo bảo mật và dễ tái sử dụng trong pipeline.

## **Bước 1 — Truy cập trang quản lý Credentials**

1. Mở Jenkins.
2. Vào menu:\
   **Manage Jenkins → Credentials → System → Global credentials (unrestricted)**

Nếu Jenkins dùng folder/project riêng, hãy vào đúng folder và chọn **Credentials** của folder đó.

---

## **Bước 2 — Tạo Credential mới**

1. Nhấn **“Add Credentials”**
2. Chọn loại Credential:

   - **Kind:** *Secret text*
3. Nhập thông tin:

   - **Secret:**\
     Dán *token ở trong link webhook*
   - **ID:**\
     Nên đặt rõ ràng để dùng trong pipeline:
   - **Description:**
4. Click **OK** để lưu.

✔ Webhook đã được lưu an toàn trong Jenkins và có thể dùng cho bất kỳ job nào mà ko sợ bị lộ token

## **🚀 Triển khai trong Pipeline**

\
Sau khi đã có webhook lưu trong Jenkins Credentials, bạn có thể triển khai bước gửi report bằng cách thêm **một stage mới** vào pipeline.

Stage này sẽ:

1. Đọc file `statistics.json` từ JMeter Dashboard
2. Lấy các metric quan trọng
3. Format message
4. Gửi sang Google Chat

📌 Chú ý : `def payload` sẽ tổng hợp toàn bộ thông tin được khai báo hoặc sinh ra trong pipeline, bao gồm các thông tin về job (ENV, SYSTEM\_NAME, BUILD\_NUMBER…), danh sách mention, worker node… cùng với các metric đã được bóc tách từ file `statistics.json`. Tất cả các giá trị này sẽ được đưa vào nội dung message gửi sang Google Chat.

Thì sẽ lấy các thông

Kết quả\

![Ảnh minh họa đã được lược bỏ khi template hóa]([IMAGE_PLACEHOLDER])







