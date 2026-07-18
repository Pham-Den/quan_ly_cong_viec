> **Hướng dẫn sử dụng template:** Nội dung dưới đây được giữ theo format tài liệu mẫu gốc. Khi dùng cho dự án mới, thay các placeholder như `[PROJECT_CODE]`, `[PROJECT_NAME]`, `[SYSTEM_NAME]`, `[ENV]`, `[OWNER]`, `[LINK]`; giữ lại các bảng, tiêu chí, checklist và các con số baseline nếu còn phù hợp. Nguồn gốc đã sanitize: `Performance Test\PT MOM\[20251113] [[PROJECT_NAME]] Weekly Performance Test.md`.

# Performance Test MOM Tracking

> **Mục đích sử dụng:** Dùng để theo dõi daily/weekly khi đang chạy PT nhiều vòng. Giữ summary, phân tích bottleneck, baseline/breaking point, action items, owner và next plan.

<https://[CONFLUENCE_DOMAIN]/wiki/pages/[PAGE_ID]>

### **A. Tóm tắt nội dung chính đã trao đổi**

1. **Kết quả Performance Test (PT) hiện tại (Good News):**

   - Hệ thống đã đạt được trạng thái ổn định sau các cải tiến gần đây (tách nhóm partner/tenant).
   - Với kịch bản tải mô phỏng (short test), hệ thống chạy ổn định, không có lỗi và đáp ứng được SLA về thời gian phản hồi (response time dưới 400ms) và tỷ lệ lỗi (error rate).
   - Năng lực hiện tại của hệ thống đã đáp ứng được yêu cầu về khối lượng nghiệp vụ (volume) dự kiến cho thời điểm Go-live vào tháng 3/2026 (bao gồm cả mức peak)
2. **Phân tích và hạn chế của hệ thống:**

   - **Tài nguyên chưa được tối ưu:** Monitoring cho thấy tầng Database (Oracle) chỉ đang sử dụng dưới 5% năng lực, trong khi tầng Application đã chịu tải cao. Điều này cho thấy tài nguyên phần cứng chưa được tận dụng hiệu quả.
   - **Nút thắt cổ chai (Bottleneck):** Vấn đề chính nằm ở tầng **Orchestration ([WORKFLOW_ENGINE])**. Hệ thống không thể mở rộng (scale) một cách tu[PERF_LEAD] tính. Việc chỉ tăng thêm tài nguyên phần cứng (CPU, RAM) sẽ không giúp tăng TPS tương ứng, vì giới hạn nằm ở khả năng điều phối của [WORKFLOW_ENGINE].
   - **Network Latency:** Độ trễ mạng giữa GCP và CMC Public Cloud dao động ở mức 100-200ms, cũng là một yếu tố ảnh hưởng đến performance chung.
3. **Xác định Baseline và Ngưỡng của hệ thống:**

   - Cả nhóm đang thảo luận về việc xác định con số "baseline" cuối cùng của hệ thống.
   - **Baseline:** Là ngưỡng TPS mà hệ thống có thể xử lý một cách ổn định và đáp ứng SLA. Con số này đủ để Go-live.
   - **Ngưỡng chịu tải (Breaking Point):** Là ngưỡng TPS tối đa mà hệ thống có thể chịu được trước khi bắt đầu xảy ra lỗi và suy giảm hiệu năng. Cần thực hiện thêm bài test chịu tải (Stress Test) để tìm ra con số này.
4. **Kế hoạch và các bài test tiếp theo:**

   - Vẫn còn các bài test trong kế hoạch cần hoàn thành, bao gồm:

     - Test tích hợp với AML (swap test).
     - Test kịch bản vận hành (OIT).
     - Test chịu tải (Stress Test) để tìm ra ngưỡng tối đa của hệ thống.
   - Mục tiêu là có được con số cuối cùng để báo cáo và làm cơ sở cho các quyết định kinh doanh cũng như kế hoạch tái kiến trúc (re-architect) trong tương lai.

### **B. Các hành động cần thực hiện (Action Items)**

1. **Hoàn thành các bài Performance Test còn lại:**

   - **Thực hiện Stress Test:** Chạy bài test tăng tải liên tục để tìm ra 2 con số quan trọng:

     - Ngưỡng TPS tối đa mà hệ thống vẫn hoạt động ổn định (đáp ứng SLA).
     - Ngưỡng TPS làm hệ thống bắt đầu sụp đổ (breaking point).
   - **Hoàn thành Test tích hợp:** Thực hiện nốt bài test tích hợp với AML và OAT để có kết quả đầy đủ.
2. **Tổng hợp và Công bố Baseline cuối cùng:**

   - Dựa trên kết quả của tất cả các bài test (short test, stress test, integration test), nhóm sẽ tổng hợp và đưa ra một bộ số liệu cuối cùng về năng lực của hệ thống.
   - Bộ số liệu này sẽ bao gồm:

     - **Normal Day:** TPS, Response Time, Error Rate trong điều kiện hoạt động bình thường.
     - **Peak/Holiday:** TPS, Response Time, Error Rate trong điều kiện tải cao.
3. **Chuẩn bị báo cáo cho Ban Lãnh đạo:**

   - Sử dụng các con số đã được xác thực để chuẩn bị báo cáo cho cuộc họp với Ban Lãnh đạo vào tuần tới, khẳng định hệ thống đã sẵn sàng cho Go-live và cung cấp dữ liệu cho các kế hoạch tương lai.
4. **Lên kế hoạch cho giai đoạn tiếp theo:**

   - Dựa trên baseline và các hạn chế đã xác định, bắt đầu lên kế hoạch cho việc tái kiến trúc (re-architect) hệ thống trong tương lai (dự kiến cho version 2) để giải quyết các vấn đề về khả năng mở rộng.









