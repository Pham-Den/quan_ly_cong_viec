> **Hướng dẫn sử dụng template:** Nội dung dưới đây được giữ theo format tài liệu mẫu gốc. Khi dùng cho dự án mới, thay các placeholder như `[PROJECT_CODE]`, `[PROJECT_NAME]`, `[SYSTEM_NAME]`, `[ENV]`, `[OWNER]`, `[LINK]`; giữ lại các bảng, tiêu chí, checklist và các con số baseline nếu còn phù hợp. Nguồn gốc đã sanitize: `Performance Test\Performance Test Guide\[GitLab + Jenkins] Hướng dẫn cấu hình + chạy performance test trên VM\[GitLab + Jenkins] Hướng dẫn cấu hình + chạy performance test trên VM.md`.

# Performance Test Guide

> **Mục đích sử dụng:** Dùng làm hướng dẫn thao tác chạy performance test bằng JMeter/GitLab/Jenkins/VM và đọc kết quả round test. Bổ sung thêm hướng dẫn monitor/tools theo dự án nếu cần.

<https://[CONFLUENCE_DOMAIN]/wiki/pages/[PAGE_ID]>

## 1. Các phần cần lưu ý

## 2. Các bước update Test Plan

### **Bước 1**: Clone repository từ GitLab về và switching sang nhánh `dev`

![Ảnh minh họa đã được lược bỏ khi template hóa]([IMAGE_PLACEHOLDER])

### **Bước 2**: Chỉnh sửa Test Plan (tệp `.jmx`)

Nếu muốn chỉnh sửa Test Plan (tệp `.jmx`) bất kỳ, thì mở tệp đó bằng JMeter Local và sửa đổi.

![Ảnh minh họa đã được lược bỏ khi template hóa]([IMAGE_PLACEHOLDER])![Ảnh minh họa đã được lược bỏ khi template hóa]([IMAGE_PLACEHOLDER])

### Bước 3: Push code vừa thay đổi lên GitLab

Nếu có chỉnh sửa Test Plan (tệp `.jmx`), thì sau khi sửa xong, truy cập vào thư mục source code đã pull về máy, và push code vừa thay đổi lên GitLab và merge vào nhánh `dev`.

![Ảnh minh họa đã được lược bỏ khi template hóa]([IMAGE_PLACEHOLDER])

### **Bước 4**: Truy cập Jenkins để chạy pipeline

Truy cập Jenkins, chọn tab `Build with Parameters` để sửa các thông số cần cho Round test, cuối cùng bấm `Build`.

![Ảnh minh họa đã được lược bỏ khi template hóa]([IMAGE_PLACEHOLDER])

### Bước 5: Xem và download kết quả Round test

![Ảnh minh họa đã được lược bỏ khi template hóa]([IMAGE_PLACEHOLDER])









