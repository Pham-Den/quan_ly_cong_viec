> **Hướng dẫn sử dụng template:** Nội dung dưới đây được giữ theo format tài liệu mẫu gốc. Khi dùng cho dự án mới, thay các placeholder như `[PROJECT_CODE]`, `[PROJECT_NAME]`, `[SYSTEM_NAME]`, `[ENV]`, `[OWNER]`, `[LINK]`; giữ lại các bảng, tiêu chí, checklist và các con số baseline nếu còn phù hợp. Nguồn gốc đã sanitize: `Test Plan\[MVP0] Master Test Plan [PROJECT_CODE]\[MVP0] Master Test Plan [PROJECT_CODE].md`.

# [MVP0] Master Test Plan [PROJECT_CODE]

<https://[CONFLUENCE_DOMAIN]/wiki/pages/[PAGE_ID]>

## 1. GIỚI THIỆU

### 1.1 Mục đích

Kế hoạch Kiểm thử Tổng thể nhằm định nghĩa chiến lược kiểm thử, lịch trình, nguồn lực, công cụ và môi trường để đảm bảo chất lượng hệ thống [CORE_SYSTEM], đáp ứng các yêu cầu khắt khe về hiệu suất, bảo mật, và độ chính xác, tuân thủ theo các tiêu chuẩn [DOMAIN_STANDARD].

### 1.2 Tổng quan

Dự án triển khai trong các mốc MVP sát nhau, yêu cầu kiểm thử lặp lại và linh hoạt. Kế hoạch này cung cấp lộ trình kiểm thử toàn diện, từ kiểm thử chức năng đến phi chức năng, bảo mật, và chấp nhận người dùng (UAT), đồng thời quản lý rủi ro và đảm bảo tuân thủ các tiêu chuẩn ngành.

![Ảnh minh họa đã được lược bỏ khi template hóa]([IMAGE_PLACEHOLDER])

#### 1.2.1 Phạm vi kiểm thử

- Kiểm thử các thành phần hệ thống: module lõi, module xử lý nghiệp vụ, portal người dùng/vận hành, module đối chiếu dữ liệu và ghi nhận kế toán, tác vụ nền/định kỳ, API, báo cáo, giao diện người dùng.
- Kiểm thử tích hợp với tổ chức trung gian ([PARTNER]) như đối tác/tổ chức bên ngoài, hệ thống đối tác với các loại nghiệp vụ luồng nghiệp vụ chính [BUSINESS_FLOW]
- Kiểm thử tích hợp với 2 thành viên đối tác/tổ chức bên ngoài
- Các loại kiểm thử:

  - Chức năng
  - **Phi chức năng bao gồm:**

1. **Performance & Reliability (Nhóm hiệu năng & độ ổn định)**

   1. Load Testing: Đánh giá khả năng xử lý trong điều kiện tải bình thường.
   2. Stress Testing: Kiểm tra hệ thống khi bị quá tải.
   3. Soak/Endurance Testing: Chạy lâu dài để phát hiện rò rỉ bộ nhớ hoặc suy giảm hiệu năng.
   4. Spike Testing: Kiểm tra khi tải tăng đột biến.
   5. Scalability Testing: Đánh giá khả năng mở rộng theo chiều ngang/dọc.
   6. Reliability Testing: Đảm bảo hệ thống hoạt động ổn định trong thời gian dài.
   7. Capacity Testing: Xác định giới hạn tối đa mà hệ thống có thể chịu được.
   8. Latency Testing: Đo lường thời gian xử lý end-to-end của nghiệp vụ để đảm bảo đáp ứng yêu cầu thời gian thực (ví dụ: dưới 500ms).
2. **Security & Compliance (Nhóm bảo mật, tuân thủ)**

   1. Security Testing: Xác thực, phân quyền, kiểm tra lỗ hổng, mã hóa, chống SQLi/XSS...
   2. Penetration Testing: Giả lập tấn công thực tế (white/gray/black box).
   3. Vulnerability Scanning: Dò tìm lỗ hổng tự động bằng công cụ (Nessus, OpenVAS...).
3. **Resilience, Failover, DR (Nhóm khả năng chịu lỗi & phục hồi)**

   1. Resilience Testing: Đánh giá khả năng tự phục hồi khi xảy ra lỗi cục bộ.
   2. Failover Testing: Kiểm tra chuyển đổi sang hệ thống dự phòng (active-passive, active-active).
   3. Disaster Recovery Testing: Giả lập sự cố nghiêm trọng, kiểm tra khôi phục dữ liệu và vận hành.
   4. Chaos Testing: Tạo lỗi ngẫu nhiên để kiểm tra tính kiên cường toàn hệ thống.
   5. Message Relay Testing: Kiểm tra độ tin cậy của message queue (Kafka, RabbitMQ) trong việc chuyển tiếp tin nhắn, đảm bảo không mất tin nhắn và xử lý lỗi retry.
4. **Compatibility & Interoperability (Nhóm tương thích & tích hợp )**

   1. Compatibility Testing: Kiểm tra với OS, trình duyệt, thiết bị, phiên bản DB...
   2. Interoperability Testing: Kiểm tra tương tác với các hệ thống khác (hệ thống đối tác, đối tác/tổ chức bên ngoài, chuẩn [DOMAIN_STANDARD], API...)
5. **Availability & Monitoring (Nhóm tính sẵn sàng & giám sát)**

   1. Availability Testing: Kiểm tra khả năng duy trì uptime (ví dụ: 99.999%).
   2. Monitoring/Alert Testing: Đảm bảo hệ thống giám sát và cảnh báo hoạt động chính xác.
   3. Observability Testing: Kiểm tra khả năng quan sát, tracing, và phân tích root cause khi có lỗi.
6. **Maintainability & Operability (Nhóm vận hành & bảo trì)**

   1. Maintainability Testing: Kiểm tra hệ thống dễ bảo trì, cập nhật không gây lỗi.
   2. Operability Testing: Đảm bảo vận hành dễ dàng, thao tác chuẩn hóa, log rõ ràng.
   3. Logging/Tracing Testing: Kiểm tra hệ thống ghi log đầy đủ và có thể trace khi cần điều tra.
   4. Configuration Testing: Kiểm tra hệ thống với các cấu hình khác nhau để đảm bảo hoạt động đúng và không gây lỗi.
7. **UAT, OAT (Nhóm trải nghiệm người dùng & sử dụng nội bộ)**

   1. Usability Testing: Đảm bảo giao diện vận hành (nếu có) dễ sử dụng, dễ thao tác.
   2. Accessibility Testing: Đảm bảo người khuyết tật có thể sử dụng hệ thống (nếu áp dụng, ví dụ: dashboard quản trị) =????
8. **Nhóm quản lý dữ liệu**

   1. Data Integrity Testing
   2. Data Validation Testing
   3. Data Retention Testing
   4. Data Archiving Testing
   5. Data Purging Testing
9. **Tuân thủ quy định**

   1. Regulatory Compliance Testing
   2. Audit Trail Testing
10. **Cô lập**

    1. Tenant Isolation Testing
    2. Resource Isolation Testing
11. **Phát hiện gian lận**

    1. Fraud Detection Testing
    2. KYC/AML Testing

[**Bảng phân loại các nhóm kiểm thử, giai đoạn thực hiện và PIC**]([GOOGLE_DOC_LINK])

#### 1.2.2 Ngoài phạm vi kiểm thử

- Kiểm thử phần cứng vật lý (do nhà cung cấp cơ sở hạ tầng đảm nhiệm).
- Kiểm thử ứng dụng bên thứ ba không thuộc hệ thống [CORE_SYSTEM].
- Kiểm thử dữ liệu thực tế của khách hàng (ngoài dữ liệu làm mờ).
- **Tất cả các version trình duyệt, các thiết bị đang chưa rõ thông tin????**

**1.3 CÁC CHỈ SỐ ĐO LƯỜNG & MỤC TIÊU KIỂM THỬ**

Để đo lường hiệu quả và tiến độ của quá trình kiểm thử, các chỉ số hiệu suất chính (KPIs) sau sẽ được theo dõi và báo cáo định kỳ:

- **1.3.1 Độ bao phủ Kiểm thử (Test Coverage):** Đạt trung bình **95%** độ bao phủ dựa trên các yêu cầu nghiệp vụ và luồng nghiệp vụ đã được định nghĩa.

| **Mức Độ Bao Phủ** | **Luồng Nghiệp Vụ** | **Mức Độ Rủi Ro** | **Trọng Tâm & Phạm Vi Kiểm Thử** | **Cách Đo Lường (RTM)** |
| --- | --- | --- | --- | --- |
| **Toàn diện (100%)** | - Luồng nghiệp vụ chính - Luồng xử lý bổ sung | Rất cao | - Tất cả happy paths (thành công). - Tất cả lỗi đã biết (hết tiền, thông tin không hợp lệ). - Validation rules (dữ liệu đầu vào theo [DOMAIN_STANDARD]). - Tính toàn vẹn dữ liệu sau nghiệp vụ (đối chiếu dữ liệu). | - **RTM**: 100% yêu cầu (REQ) có test case (TC) trong TestRail/Qmetry. - **KPI**: Tỷ lệ lỗi <0.01% (10 lỗi/100.000 nghiệp vụ). - Báo cáo trạng thái: Passed/Failed. |
| **Cao (98%)** | - Xử lý yêu cầu nghiệp vụ/Khiếu nại | Cao | - Quy trình xử lý yêu cầu nghiệp vụ chuẩn (tích hợp [PARTNER]). - Kịch bản thành công/thất bại (tranh chấp đúng/sai). - Tích hợp với đối tác/tổ chức bên ngoài/ví điện tử. - 2% còn lại: Kịch bản hiếm (tranh chấp đa bên, lỗi hệ thống bên thứ ba). | - **RTM**: 98% REQ có TC, 2% kịch bản hiếm được ghi chú. - **KPI**: Tỷ lệ lỗi <0.05%. - Báo cáo tuân thủ Nghị định 13/2023. |
| **Trung bình (90%)** | - Truy vấn Trạng thái Nghiệp vụ - Copy Nghiệp vụ | Trung bình | - Trạng thái trả về chính xác (thành công, thất bại). - Copy đúng các trường dữ liệu quan trọng (số tiền, ID nghiệp vụ). - Giảm kiểm thử bộ lọc phức tạp hoặc thông tin phụ (metadata không critical). | - **RTM**: 90% REQ có TC, 10% kịch bản phức tạp ghi chú. - **KPI**: Tỷ lệ lỗi <0.1%. |
| **Cơ bản (80%)** | - Truy vấn (dữ liệu chung) | Thấp | - Chức năng tìm kiếm với điều kiện cơ bản (ngày, loại nghiệp vụ). - Xử lý có/không kết quả trả về. - Không tập trung edge cases của giao diện/dữ liệu (ví dụ: tìm kiếm với ký tự đặc biệt). | - **RTM**: 80% REQ có TC, 20% kịch bản phụ không ưu tiên. - **KPI**: Tỷ lệ lỗi <0.5%. |

- **1.3.2. Hiệu quả Loại bỏ Lỗi (Defect Removal Efficiency - DRE):** Đạt tối thiểu **95%**.

  - *Công thức: DRE = [Số lỗi QA tìm thấy / (Số lỗi QA tìm thấy + Số lỗi UAT/Production tìm thấy)] x 100%.*
- **1.3.3. Tỷ lệ Tự động hóa Kiểm thử (Test Automation Coverage):** Đạt **80%** trên tổng số các kịch bản kiểm thử hồi quy.

## 2. LỊCH TRÌNH KIỂM THỬ VÀ NGUỒN LỰC

### 2.1 Lịch trình kiểm thử

Lịch trình kiểm thử được chia theo các mốc MVP, với các giai đoạn kiểm thử lặp lại để phù hợp với tiến độ triển khai tính năng và tích hợp [PARTNER]. Nguồn lực bao gồm nhân sự, công cụ, và môi trường kiểm thử, được phân bổ linh hoạt để đáp ứng thời gian gấp rút.

[**Lịch trình kiểm thử chi tiết cho các mốc**]([GOOGLE_DOC_LINK])

![Ảnh minh họa đã được lược bỏ khi template hóa]([IMAGE_PLACEHOLDER])

### 2.2 Chi tiết các công việc, nguồn lực và tài liệu bàn giao

#### 2.2.1 Nhân sự và vai trò

| **Vai trò** | **Số lượng** | **Nhiệm vụ** | **Giai đoạn tham gia** |
| --- | --- | --- | --- |
| **QC Lead** | 1 | Lập kế hoạch, giám sát, báo cáo, đầu mối trao đổi và điều phối công việc chung của cả team.  Thiết lập các quy tắc làm việc trong team, nghiên cứu các công cụ hỗ trợ kiểm thử.  Review kịch bản kiểm thử, thực hiện kiểm thử | 1 nhân sự từ ngày 15/4 |
| **QC Manual** | 9 | Kiểm thử chức năng  Kiểm thử tích hợp  Hỗ trợ kiểm thử UAT | 2 nhân sự từ 21/4  2 nhân sự từ 7/5  4 nhân sự từ 1/6 |
| **Automation Tester** | 3 | Phát triển các kịch bản tự động | 2 hân sự từ 21/4  1 nhân sự từ 1/6 |
| **Performance Tester** | 2 | Thực hiện các kiểm thử Performance toàn bộ hệ thống | 1 nhân sự từ 21/4  **1-2 chuyên gia thuê bên ngoài từ 15/8** |
| **Security** | ? | Kiểm thử bảo mật toàn hệ thống | Từ ngày 15/4 |
| **Tổng nguồn lực** | **15** (chưa bao gồm Security) |  |  |

#### **2.2.2 Phân bổ nhân sự theo từng giai đoạn và tài liệu bàn giao**

| **MVP** | **Thời gian** | **Công việc Kiểm thử** | **Nguồn lực** | **Tài liệu Bàn giao** |
| --- | --- | --- | --- | --- |
| MVP 1 | 15/4-15/6 | - Kiểm thử chức năng (đơn vị, tích hợp, hệ thống) - Tạo các test script (kiểm thử tự động) | 7 QC thủ công  2 Kiểm thử tự động  1 kiểm thử Performance  ? kỹ sư bảo mật  **Total 10 nhân sự** (chưa tính bảo mật) | - Kịch bản kiểm thử - Báo cáo kiểm thử - Báo cáo lỗi |
| MVP 2 | 15/6-15/8 | - Kiểm thử chức năng - Kiểm thử tích hợp với 2-3 đối tác/tổ chức bên ngoài - Kiểm thử phi chức năng - Kiểm thử bảo mật nâng cao | 10 QC thủ công  3 kỹ sư tự động  2 kiểm thử Performance (1-2 chuyên gia bên ngoài)  kỹ sư bảo mật  **Total 15 nhân sự** | - Kịch bản kiểm thử - Báo cáo kiểm thử - Báo cáo lỗi |
| MVP 3 | 15/8-15/9 | - Kiểm thử hệ thống - Kiểm thử phi chức năng nâng cao toàn bộ hệ thống - Kiểm thử bảo mật chuyên sâu - UAT, OAT - **Smoke môi trường PRD (cách thức thực hiện, dữ liệu thực hiện…)** | 10 QC thủ công  3 kỹ sư tự động  2 kiểm thử Performance(1-2 chuyên gia bên ngoài)  kỹ sư bảo mật  **Total 15 nhân sự** (chưa tính bảo mật) | - Báo cáo kiểm thử - Báo cáo phi chức năng - Báo cáo UAT |

---

## 3. CÔNG CỤ VÀ MÔI TRƯỜNG KIỂM THỬ

### 3.1 Công cụ Kiểm thử

Các công cụ kiểm thử được lựa chọn dựa trên yêu cầu của từng giai đoạn kiểm thử, với phương pháp thực hiện cụ thể.

| **Loại Kiểm thử** | **Công cụ** | **Ghi chú** |
| --- | --- | --- |
| Unit Test - Chức năng (đơn vị) | **???** | - Viết các test case tự động cho từng module (ví dụ: logic định tuyến) - Chạy test trong môi trường phát triển (DEV) để xác nhận chức năng riêng lẻ. |
| Chức năng (API/UI) | Postman  Robot Framework  Trình duyệt Firefox, Edge, Chrome | - Tạo request HTTP để kiểm tra API (GET, POST, PUT…), xác nhận phản hồi, mã lỗi, và định dạng dữ liệu - Kiểm tra luồng tích hợp nghiệp vụ, kiểm tra chức năng của từng Component - Tạo kịch bản tự động để kiểm tra giao diện người dùng. |
| Quản lý kiểm thử | QMetry/ Google sheet/ Confluence | - Quản lý kịch bản kiểm thử và kết quả. - Theo dõi tiến độ và báo cáo lỗi cho từng MVP. |
| Phi chức năng (Performance) | JMeter | - Mô phỏng tải nghiệp vụ cao để kiểm tra độ trễ, thông lượng. - Thực hiện kiểm thử áp lực và độ bền để xác định giới hạn hệ thống. |
| Quản lý lỗi | Jira | - Lưu lỗi phát hiện trong quá trình triển khai |
| Capture tool | Snapgit | - Chụp ảnh lỗi |

### 3.2 Môi trường Kiểm thử

| **Môi trường** | **Mục đích** | **Yêu cầu** |
| --- | --- | --- |
| DEV | Kiểm thử đơn vị | Cơ sở dữ liệu nhỏ, cấu hình đơn giản, dữ liệu giả lập |
| QC | Kiểm thử chức năng, tích hợp, hệ thống  Kiểm thử phi chức năng | Cơ sở dữ liệu lớn, cấu hình đầy đủ tương tự môi trường thật, dữ liệu giả lập |
| UAT | Kiểm thử nghiệm thu người dùng  Kiểm thử phi chức năng | Tương tự sản xuất, dữ liệu giả lập, khả năng mô phỏng tải cao |
| SandBox (Production-like) | Kiểm thử tích hợp [PARTNER] | Phản ánh môi trường thực tế, dữ liệu làm mờ, tích hợp với các [PARTNER] |

---

## 4. CHIẾN LƯỢC KIỂM THỬ

Chiến lược kiểm thử được chia thành các nhóm kiểm thử, các loại kiểm thử, các kỹ thuật kiểm thử, phạm vi, kỹ thuật, công cụ, các loại kiểm thử thực hiện và các thành phần đặc thù của hệ thống.

| **Nhóm Kiểm Thử** | **Mức Độ Kiểm Thử** | **Loại Kiểm Thử** | **Mục Tiêu** | **Phạm Vi** | **Kỹ Thuật Kiểm Thử** | **Công Cụ/Cách Thực Hiện** | **Cách thức thực Hiện** |
| --- | --- | --- | --- | --- | --- | --- | --- |
| **Kiểm Thử Chức Năng** | **Unit Testing (Kiểm Thử Đơn Vị)** | - Unit Testing | Phát hiện sớm lỗi trong từng module để giảm chi phí sửa chữa | Module riêng lẻ: định tuyến nghiệp vụ, xử lý nghiệp vụ, logging, xác thực [PARTNER] | - Statement Coverage - Branch Coverage - Condition Coverage - Path Coverage - Specification-Based Testing | - JUnit (Java), PyTest (Python) - IDE (Eclipse, VS Code) | - Developer thực hiện - Tích hợp vào pipeline CI/CD (Jenkins) |
|  | **Integration Testing (Kiểm Thử Tích Hợp)** | - Integration Testing - API Testing - Regression Testing | Đảm bảo dữ liệu được truyền đi và nhận về giữa các module một cách chính xác, đúng định dạngg  Đảm bảo luồng dữ liệu đi qua một chuỗi các module được xử lý đúng ở từng bước. | Tích hợp module: kết nối API ([DOMAIN_STANDARD]), luồng dữ liệu giữa [PARTNER] | - Risk-Based Testing - Equivalence Partitioning - Boundary Value Analysis - Decision Table Testing - State Transition Testing - API Contract Testing - Error Guessing - Pairwise Testing | - Postman (test API) - Jmeter - Robot Framework - AI Gemini: | - QC thực hiện - Postman: Tự động hóa test API - Robot Framework **:** Tự động hóa kiểm thử chức năng, tích hợp các module, các luồng nghiệp vụ chính giao diện quản trị - AI Gemini: Hỗ trợ trong việc tạo kịch bản, review kịch bản, tạo dữ liệu kiểm thử |
|  | **System Testing (Kiểm Thử Hệ Thống)** | - Smoke Testing - Functional Testing - Error Handling Testing - Regression Testing - Exploratory Testing | Xác thực toàn bộ hệ thống đã được tích hợp hoàn chỉnh có hoạt động đúng theo yêu cầu nghiệp vụ từ đầu đến cuối (End-to-End) hay không | Luồng end-to-end: luồng nghiệp vụ chính [BUSINESS_FLOW], đối chiếu dữ liệu, báo cáo | - Risk-Based Testing - Equivalence Partitioning - Boundary Value Analysis - Decision Table Testing - State Transition Testing - Use Case Testing - Error Guessing - Checklist-Based Testing | - Robot Framework - Jmeter - Postman - AI Gemini | - QC thực hiện - Postman: Tự động hóa các luồng kiểm thử - Robot Framework **:** Tự động hóa kiểm thử chức năng, tích hợp các module, các luồng nghiệp vụ chính giao diện quản trị - AI Gemini: Hỗ trợ trong việc tạo kịch bản, review kịch bản, tạo dữ liệu kiểm thử |
|  | **Acceptance Testing (Kiểm Thử Chấp Nhận)** | - User Acceptance Testing (UAT) - Regression Testing - Compliance Testing | Đảm bảo hệ thống đáp ứng yêu cầu người dùng, nghiệp vụ, và quy định pháp lý (Nghị định 13/2023) | Chức năng chính: luồng nghiệp vụ chính, chức năng nghiệp vụ trọng yếu, truy vấn dữ liệu nghiệp vụ, tuân thủ quy định | - Use Case Testing - Equivalence Partitioning - Boundary Value Analysis - Decision Table Testing - Experience-Based Testing - Checklist-Based Testing | - Qmetry (quản lý UAT) - Manual testing (stakeholder) | - Stakeholder/end-user thực hiện - Báo cáo tuân thủ quy định |
| **Kiểm Thử Phi Chức Năng** | **System Testing** | - Performance Testing - Security Testing - Scalability Testing - Recovery Testing | Đảm bảo hệ thống đáp ứng yêu cầu về hiệu năng, bảo mật, khả năng mở rộng | Độ trễ, thông lượng, hiệu năng, độ ổn định, tin cậy, mã hóa dữ liệu | - Load Testing - Stress Testing - Configuration Testing - Recovery Testing - …. | - JMeter (load/stress) | - DEV thực hiện Performance - Cyber Security thực hiện test bảo mật - OAT thực hiện kiểm thử các phần liên quan đến hệ thống |

**Kiểm thử Thành phần Đặc thù có độ ưu tiên cao**:

| **Thành phần** | **Mô tả** | **Kỹ thuật Kiểm thử** | **Công cụ/ Cách thực hiên** | **Phương pháp Thực hiện** |
| --- | --- | --- | --- | --- |
| [CORE_PROCESSING_MODULE] | Định tuyến nghiệp vụ giữa các tổ chức | - Kiểm thử luồng nghiệp vụ - Kiểm thử lỗi - Kiểm thử hiệu năng | JMeter, Postman, SQL queries  Robot Framework | - **JMeter**: Kiểm tra hiệu năng định tuyến với tải cao. - **Postman**: Kiểm tra API định tuyến. - **SQL queries**: Xác minh dữ liệu nghiệp vụ trong cơ sở dữ liệu. - **Robot Framework**: Hỗ trợ kiểm tra các dữ liệu lớn lặp lại - Kiểm thử thủ công đảm bảo các chức năng hoạt động đúng |
| [BUSINESS_PROCESSING_MODULE] | Quy trình xử lý nghiệp vụ và đối chiếu dữ liệu | - Kiểm thử tính đầy đủ, toàn vẹn dữ liệu - Kiểm thử tác vụ nền/định kỳ | SQL queries  Postman  Qmetry  Robot Framework | - **SQL queries**: Kiểm tra tính toàn vẹn dữ liệu xử lý nghiệp vụ. - **Postman**: Kiểm tra API xử lý nghiệp vụ. - **Qmetry**: Quản lý kịch bản đối chiếu dữ liệu. - **Robot Framework**: Hỗ trợ kiểm tra các dữ liệu lớn lặp lại - Kiểm thử thủ công đảm bảo các chức năng hoạt động đúng |
| [BATCH_JOB] | Tác vụ định kỳ (đối chiếu dữ liệu, báo cáo) | - Kiểm thử lịch trình - Kiểm thử khối lượng lớn - Kiểm thử hiệu năng | JMeter | - **JMeter**: Kiểm tra hiệu năng xử lý batch. - Kiểm thử thủ công đảm bảo các chức năng hoạt động đúng |
| API | Giao tiếp với [PARTNER] và hệ thống nội bộ (API liên quan đến các luồng luồng nghiệp vụ chính, luồng xử lý bổ sung) | - Kiểm thử API - Kiểm thử bảo mật - Kiểm thử tải | Postman  JMeter  Robot Framework | - **Postman**: Kiểm tra chức năng API, kiểm tra validate các trường yêu cầu trong APi (sử dụng Runner/ Newman để hỗ trợ việc kiểm tra nhiều trường thông tin) - **JMeter**: Kiểm tra tải API. - **Robot Framework**: Kiểm tra tích hợp các chức năng - Kiểm thử thủ công đảm bảo các chức năng hoạt động đúng |
| Hệ thống Báo cáo | Báo cáo nghiệp vụ, đối chiếu dữ liệu | - Kiểm thử tính chính xác - Kiểm thử hiệu năng - Kiểm thử giao diện | SQL queries,  QMetry  Robot Framework  User Testing | - **SQL queries**: Kiểm tra dữ liệu báo cáo. - **Robot Framework**: Tự động hóa kiểm tra dự liệu báo cáo - Kiểm thử thủ công đảm bảo các chức năng hoạt động đúng |
| Giao diện Người dùng | Giao diện quản trị và vận hành | - Kiểm thử khả năng sử dụng - Kiểm thử chức năng giao diện | User Testing | - **User Testing**: Kiểm thử manual để kiểm tra về chức năng và trải nghiệm |

---

## 5. TIÊU CHÍ KIỂM THỬ

**5.1 Tiêu chí bắt đầu (Entry Criterial)**

| **STT** | **Tiêu chí** | **Điều kiên bắt đầu** |
| --- | --- | --- |
| 1 | Tài liệu về yêu cầu và thiết kế | 1. Yêu cầu phần mềm (SRS, BRD, PRD, v.v.) đã được hoàn thiện và phê duyệt 2. Thiết kế chi tiết đã có (High level, Low level) 3. Kế hoạch kiểm thử và test cases đã được viết và review |
| 2 | Môi trường kiểm thử | 1. Hệ thống hoặc bản build đã được triển khai lên môi trường kiểm thử 2. Cơ sở dữ liệu, server, API đã sẵn sàng hoạt động 3. Dữ liệu test (test data) đã được chuẩn bị |
|  |  |  |

**5.2 Tiêu chí kết thúc (Exit Criterial)**

| **STT** | **Tiêu chí** | **Điều kiện Kết thúc kiểm thử** | **Điều kiện golive** |  |
| --- | --- | --- | --- | --- |
| 1 | Kịch bản kiểm thử | 98% kịch bản kiểm thử được thực hiện (Function, SIT, UAT) | 98 % Function PASS  100% SIT PASS  100% UAT PASS |  |
| 2 | Lỗi tồn đọng | Không còn tồn đọng lỗi nghiêm trọng (Severity Critical, Major)  Các lỗi còn lại tồn đọng không quá <=2% và cần được xác nhận bởi PO Lead, Dev Lead | Không còn tồn đọng lỗi nghiêm trọng (Severity Critical, Major)  Các lỗi còn lại tồn đọng không quá <=2% và cần được xác nhận bởi PO Lead, Dev Lead |  |
| 3 | Yêu cầu phi chức năng | Đáp ứng các yêu cầu về non functional | Theo yêu cầu của hệ thống, mô tả chi tiết trong phần Performance/OAT |  |
| 4 | Yêu cầu bảo mật | Đáp ứng yêu cầu về bảo mật | Theo yêu cầu của hệ thống, mô tả chi tiết trong phần Performance |  |

---

## 6. CÁC RỦI RO CỦA DỰ ÁN

| **Rủi ro** | **Mức độ** | **Biện pháp Giảm thiểu** |
| --- | --- | --- |
| Tiến độ gấp rút | **Cao** | - Ưu tiên kiểm thử tính năng quan trọng, luồng chính giao tiếp với bên ngoài **(risk based testing)** - Tự động hóa kiểm thử hồi quy, kiểm thử API (Component, system) |
| Lỗ hổng bảo mật | **Cao** | - Kiểm thử bảo mật định kỳ - Áp dụng phân tích mã tĩnh từ sớm |
| Thiếu nhân sự chuyên sâu về Performance | **Cao** | - **Thuê ngoài chuyên gia về kiểm thử hiệu năng (thời gian bắt đầu 15/7 ?????)** - Kế hoạch dự phòng (đào tạo nhân sự) |
| Thiếu nguồn lực kiểm thử | **Cao** | - Tăng cường nhân sự tạm thời (thuê ngoài) - Xây dựng kế hoạch dự phòng về nguồn lực (plan OT, mượn, huy động nguồn lực nội bộ trong những giai đoạn gấp rút) |
| Rủi ro về môi trường kiểm thử và môi trường tích hợp | **Cao** | - Cần có kế hoạch dựng môi trường kiểm thử/ tích hợp sớm - Smoke trước để đảm bảo môi trường Ready trước khi thực hiện |
| Tích hợp với các [PARTNER] | Trung | - Kiểm thử sandbox sớm - Phối hợp chặt chẽ với [PARTNER] - Sử dụng giả lập [PARTNER] trong giai đoạn đầu |
| Tài liệu/ yêu cầu chưa đầy đủ | Trung | - Làm rõ các yêu cầu với đội phát triển ngay từ đầu giai đoạn - Phối hợp chặt chẽ với PO/TO để đảm bảo các tài liệu được cập nhật kịp thời (SAD, BRD, PRD…) |

---

## 7. TÀI LIỆU THAM KHẢO

| **Tài liệu** | **Mô tả** |
| --- | --- |
| Yêu cầu Nghiệp vụ | Tài liệu mô tả các tính năng và luồng nghiệp vụ của hệ thống |
| [DOMAIN_STANDARD]  [DOMAIN_STANDARD] 8583 | Integration Standard |
| Hướng dẫn Kiểm thử ISTQB | Tham khảo các kỹ thuật và phương pháp kiểm thử |
| Tài liệu Công cụ | Hướng dẫn sử dụng JMeter, Postman, Robot Framework |

## 8. KẾT QUẢ BÀN GIAO

| **Tài liệu** | **Mô tả** | **Nơi lưu trữ** | **PIC** |
| --- | --- | --- | --- |
| Kịch bản Kiểm thử | Kịch bản kiểm thử chức năng, tích hợp, phi chức năng, bảo mật, | Google Sheet/ Qmetry | QC |
| Báo cáo Kiểm thử | Kết quả kiểm thử (lỗi, hiệu năng, bảo mật), lưu trong Jira | Confluence/Google Sheet/ Jira | QC, CyberSecurity, TO |
| Báo cáo kết quả kiểm thử UAT/OAT | Kết quả nghiệm thử người dùng và vận hành | Confluence/Google Sheet | PO/BA |

## 9. PHÊ DUYỆT KẾ HOẠCH KIỂM THỬ

| Vai trò | Họ tên | Vai trò trong dự án | Trạng thái |
| --- | --- | --- | --- |
| Workstream Lead |  | Quản lý toàn bộ Workstream |  |
| PO Lead |  | Xác nhận phạm vi nghiệp vụ |  |
| TechLead |  | Đảm bảo phù hợp kỹ thuật |  |
| SA |  | Đảm bảo phù hợp kỹ thuật |  |







