> **Hướng dẫn sử dụng template:** Nội dung dưới đây được giữ theo format tài liệu mẫu gốc. Khi dùng cho dự án mới, thay các placeholder như `[PROJECT_CODE]`, `[PROJECT_NAME]`, `[SYSTEM_NAME]`, `[ENV]`, `[OWNER]`, `[LINK]`; giữ lại các bảng, tiêu chí, checklist và các con số baseline nếu còn phù hợp. Nguồn gốc đã sanitize: `Performance Test\Performance Test Plan\[PROJECT_CODE]-MVP0.5] PT Master Plan\[PROJECT_CODE]-MVP0.5] PT Master Plan.md`.

# Performance Test Master Plan

> **Mục đích sử dụng:** Dùng cho kế hoạch hiệu năng tổng thể trước golive hoặc trước một phase lớn. Giữ các phần SLA, workload model, loại test, môi trường, dữ liệu, timeline, entry/exit criteria, risk và dependency.

<https://[CONFLUENCE_DOMAIN]/wiki/pages/[PAGE_ID]>

# References

| **No** | **Document** | **Note** |
| --- | --- | --- |
| 1 | Functional requirement | III - [PROJECT_CODE] Product Requirement |
| 2 | Non-functional requirement | [[ORG_NAME]][[CORE_MODULE]&[RECONCILIATION_MODULE]] - Non Functional Requirements |
| 3 | [BUSINESS_DOMAIN] [CORE_MODULE] System SAD | [ORG_NAME] [BUSINESS_DOMAIN] [CORE_MODULE] System SAD |
| 4 | Sequence Diagram | [SYSTEM_NAME]] Sequence Diagram |
| 5 | Data Model & Database Design | [SYSTEM_NAME]] Normalized Data Model [MVP 0 - 15/09] |
| 6 | Deployment Diagram | [ORG_NAME] [BUSINESS_DOMAIN] [CORE_MODULE] System SAD |
| 7 | Infrastructure Design | Hybrid Architecture Design |
| 8 | Performance Testing Strategy | <[GOOGLE_DOC_LINK]> |
| 9 | Performance Test Case | <[GOOGLE_DOC_LINK]> |
| 10 | Performance Testing Plan | [PROJECT_CODE]-MVP0.5] PT Detail Plan |

# SLA

## [BUSINESS_DOMAIN]

Tham khảo các thông tin từ Biz cung cấp và số liệu monitor kết hợp báo [MARKET_BENCHMARK] gửi cho [PARTNER_A] vào Q2/2025.

- Lượng nghiệp vụ thứ 2 gấp 1.2 nghiệp vụ ngày thường.
- Lượng nghiệp vụ ngày lễ tăng X2 so với ngày thường
- Lượng nghiệp vụ peak hour ngày lễ tăng X4 so với ngày thường
- Tỉ lệ nghiệp vụ thành công: 98%
- Tỉ lệ nghiệp vụ do lỗi người dùng: 0.76%
- Tỉ lệ nghiệp vụ lỗi do network/infra: 1.24%
- Nghiệp vụ Inquiry gấp 3 lần nghiệp vụ [BUSINESS_DOMAIN] [BUSINESS_FLOW].
- Theo số liệu monitor từ [PARTNER_A], thời điểm giờ cao điểm lúc 16-17h ngày 24/01/2025 so với lượng nghiệp vụ [BUSINESS_FLOW] cả ngày 24/01/2025 là: 120,000/1,600,000 = 7.50%

Số liệu Biz cung cấp theo số dự phóng tham khảo từ [MARKET_BENCHMARK]:

|  |  |  |  |  |
| --- | --- | --- | --- | --- |
|  |  | **2025** | **2026** | **2027** |
| **[SYSTEM_NAME]** | Per year |  | 1,200,000,000 | 2,400,000,000 |
| **[SYSTEM_NAME]** | per month |  | 100,000,000 | 200,000,000 |
| **[SYSTEM_NAME]** | per day |  | 3,300,000 | 6,600,000 |
| **[MARKET_BENCHMARK]** | Per year | **5,000,000,000** | **6,000,000,000** | **7,000,000,000** |

Số liệu Transaction [MARKET_BENCHMARK] cung cấp cho [PARTNER_A] trong Q2/2025:

|  |  |  |  |  |
| --- | --- | --- | --- | --- |
| **Tổng hợp** | **Tổng nghiệp vụ Q2** | **Tỷ lệ GD [PARTNER_A] so với toàn [MARKET_BENCHMARK]** | **Gia dịch thành công** | **Tỷ lệ thành công** |
| [PARTNER_A] | 150,000,000 | 15.00% | 149,700,000 | 99.80% |
| [MARKET_BENCHMARK] | 900,000,000 | 100% | 898,000,000 | 99.75% |

Số liệu monitor respone time các nghiệp vụ [PARTNER_A] đi qua [MARKET_BENCHMARK]:

![Ảnh minh họa đã được lược bỏ khi template hóa]([IMAGE_PLACEHOLDER])

Căn cứ trên tất cả các số liệu trên, team PT đưa ra số liệu SLA hệ thống [SYSTEM_NAME] cần đáp ứng cho năm 2026 và 2027 như sau:

| **SLA** | **Requirement Source** | **Note** | **2026** | **2026** | **2026** | **2027** | **2027** | **2027** | **Respone time (ms)** | **Error rate (%)** |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| **SLA** | **Requirement Source** | **Note** | **Total tnx of Day of 2026** | **TPS (2026) - [BUSINESS_DOMAIN]**   - **1 peak hour = 8.41% tnx of days** | **TPS (2026) - Inquiry** **= increase 3 times compare with [BUSINESS_DOMAIN]** | **Total tnx of Day of 2027** | **TPS (2027) - [BUSINESS_DOMAIN]**   - **1 peak hour = 8.41% tnx of days** | **TPS (2027) - Inquiry** **= increase 3 times compare with [BUSINESS_DOMAIN]** | **Respone time (ms)** | **Error rate (%)** |
| **AVG day** | **[1] [PROJECT_NAME] Biz** |  | 3,300,000 | 257.46 | 772.39 | 6,600,000 | 496.29 | 1,488.88 | 400 | 0.08 |
| **Peak day (Thứ 2)** | **[2] [PROJECT_NAME] Biz** | - Total tnx of day = 1.2 \* AVG day [1] | 13,200,000 | 308.96 | 926.87 | 25,500,000 | 595.55 | 1,786.65 | 400 | 0.08 |
| **Peak day (Thứ 2)** | **[3] [PROJECT_NAME] Tech** | - Total tnx of day = 0.5 \* Avg day of [MARKET_BENCHMARK] | 22,200,000 | 519.10 | 1,557.30 | 26,000,000 | 606.83 | 1,820.48 | 400 | 0.08 |
| **Holiday** | **[4] [PROJECT_NAME] Biz** | - Total tnx of day = 2 \* Peak day [2] - TPS peak hour = 4 \* TPS of AVG day [1] | 26,400,000 | 1,030.00 | 3,090.00 | 51,000,000 | 2,380.00 | 7,150.00 | 800 | 0.16 |
| **Holiday** | **[5] [PROJECT_NAME] Tech** | - Total tnx of day = 2 \* Peak day [3] - TPS peak hour = 4 \* TPS of AVG day [3] | 44,400,000 | 2,075.00 | 6,230.00 | 52,000,000 | 2,430.00 | 7,280.00 | 800 | 0.16 |

## [BATCH_PROCESSING_MODULE]

|  |  |  |  |
| --- | --- | --- | --- |
| **Type** | **Volume**  **(txn/day)** | **Number of session**  **(per day)** | **Calculation time end-to-end** **(s)** |
| [BATCH_PROCESSING_MODULE] flow with external partners | 10 mil. | 2 | 7200 |
| [RECONCILIATION_MODULE] flow with [REGULATORY_OR_PARTNER_SCOPE] | 10 mil. | 2 | 7200 |

## Management Portal

|  |  |  |  |  |
| --- | --- | --- | --- | --- |
| **Type** | **Concurrency user** | **Response time of normal functions** **(ms)** | **Response time of report functions** **(ms)** | **Error rate**  **(%)** |
| [USER_PORTAL] | 250 | 500 | 5000 | 0.03 |
| [OPS_PORTAL] | 50 | 500 | 5000 | 0.03 |

# Scenario

## **High level test cases**

![Ảnh minh họa đã được lược bỏ khi template hóa]([IMAGE_PLACEHOLDER])

## Data strategy

| **No** | **Item** | **Detail** |
| --- | --- | --- |
| 1 | external partner organization | Phân bổ nghiệp vụ cho 20 đối tác/tổ chức bên ngoài tham gia vào hệ thống như sau, dữ liệu tại các bảng trong database cần phân bổ theo tỉ lệ partner như sau:   - 3 đối tác/tổ chức bên ngoài lớn chiếm 45% tổng nghiệp vụ ==> khoảng 1.2M nghiệp vụ/đối tác/tổ chức bên ngoài/ngày - 5 đối tác/tổ chức bên ngoài trung bình chiếm 35% nghiệp vụ ==> 500K nghiệp vụ/đối tác/tổ chức bên ngoài/ngày - 12 đối tác/tổ chức bên ngoài nhỏ chiến 20% nghiệp vụ ==> 150K nghiệp vụ/đối tác/tổ chức bên ngoài/ngày |
| 2 | Historical Data | Cần tạo historical data theo chiến lược archive dữ liệu DBA - Môi trường sizing = production theo thiết kế từ DAB.   - Tầng hot: Quy tắc lưu trữ dữ liệu trong 2 ngày gần nhất. Cần tạo bộ data [BUSINESS_DOMAIN] trong 2 ngày khoảng 30M. Dữ liệu cần có thời gian tạo nghiệp vụ 50% vào các thời điểm: 10-11h và 15h-16h (theo đúng lượng nghiệp vụ peak [BUSINESS_DOMAIN] thông thường) - Tầng warm: Quy tắc lưu trữ trong 6 tháng, partition 1 tháng. Cần tạo ít nhất 300M bản ghi cho 1 partition trong 1 tháng hiện tại. - Tầng cold: Quy tắc lưu trữ file trên S3 khoảng 10 năm, mỗi ngày 1 file. Tạo 30 files tháng trước trên S3. Đảm bảo data mới tạo từ tầng warm được đẩy sang S3 theo luồng. |
| 3 | Synthetic Data | - Tỷ lệ success và error: Tạo data 98% happy case, 0,76% error cases do lỗi nhập sai từ Khách hàng. 1,24% error cases do network timeout, system error, not enough limit (theo partner) - Test case individual [BUSINESS_DOMAIN]: Tạo bộ data đủ thực hiện load từ normal - peak load với tps từ 424 - 1k tps. Chú ý bộ data cần đảm bảo chỉ tạo 1 lần theo tỉ lệ các partner trong mục 1 và có thể sử dụng được trong các lần chạy sau không cần tạo lại.   Chú ý Mockup partner nhận: Cần quy định tiền tố để đảm bảo mockup xử lý được các tình huống happy case, unhappy case cho inquiry và [BUSINESS_DOMAIN], refund.   - Testcase [BATCH_PROCESSING_MODULE]: 1 phiên nghiệp vụ 7,6M transaction. Cần update timestamp nghiệp vụ trong DB để có thể chạy lại testcase nhiều lần. |

## Detail Test cases

|  |  |  |  |  |
| --- | --- | --- | --- | --- |
| **No** | **Follow** | **Function** | **SLA 12/2026** | **Risk performance testing** |
| 1 | Testcase 01 - Individual normal Inquiry transsaction | Inquiry transaction (From gateway ==> response to source partner) Note: Mockup response time From destination partner to [SYSTEM_NAME]: 300ms) | Response time: <500ms TPS ~ 800 Error rate: < 0.03% | Một số điểm có thể gây cao tải:   - [IDENTITY_SERVICE] Authentication: Verify client and create JWT token. - [WORKFLOW_ENGINE]: Điều phối tất cả các luồng nghiệp vụ. Có thể bị nghẽn tại đây, do chưa tạo hết các transaction trước đấy - HSM: 2 lần kí vật lí/transaction làm tăng throughput cho HSM. Chưa đưa ra được threshold của HSM có đảm bảo kì vọng không. - Identity/[USER_OR_PARTNER] service: verify chữ ký (2 lần/transaction) ==> tăng tải cho services này. |
| 2 | Testcase 02 - Individual peal Inquiry transaction | Inquiry transaction (From gateway ==> response to source partner) Note: Mockup response time From destination partner to [SYSTEM_NAME]: 300ms) | Response time: <1s TPS ~ 3000 Error rate: < 0.03% | Một số điểm có thể gây cao tải:   - [IDENTITY_SERVICE] Authentication: Verify client and create JWT token. - [WORKFLOW_ENGINE]: Điều phối tất cả các luồng nghiệp vụ. Có thể bị nghẽn tại đây, do chưa tạo hết các transaction trước đấy - HSM: 2 lần kí vật lí/transaction làm tăng throughput cho HSM. Chưa đưa ra được threshold của HSM có đảm bảo kì vọng không. - Identity/[USER_OR_PARTNER] service: verify chữ ký (2 lần/transaction) ==> tăng tải cho services này. |
| 3 | Testcase 03 - Individual normal [BUSINESS_DOMAIN] | record to record ( From revice request ==> [BUSINESS_DOMAIN] success) | Response time: <500ms TPS ~ 400 Error rate: < 0.03% | - Ngoài các service chung với Inquiry, [BUSINESS_DOMAIN] [BUSINESS_FLOW] có rủi ro hiệu năng liên quan Database:    - 1 transaction [BUSINESS_FLOW] cần 9 lần tương tác tới DB: 6 lần insert, 2 update status, 1 select transaction ==> Có thể làm tăng connection pool, tăng tải Database cũng như kéo dài transaction duration.   - Database [BUSINESS_LEDGER]: Mỗi ngày 10M bản ghi, partition theo tháng, lưu tối đa 6 tháng: ==> Chậm treo trong các hoạt động liên quan đến search (management), report. Database có nguy cơ gặp vấn đề về hiệu năng liên quan hot partition.   - OGG: Kéo dữ liệu từ host qua warm phục vụ báo cáo ==> 10M/ngày có thể xảy ra lag time. |
| 3 | Testcase 03 - Individual normal [BUSINESS_DOMAIN] | Refund | Response time: <500ms TPS ~ 5 Error rate: < 0.03% | - Ngoài các service chung với Inquiry, [BUSINESS_DOMAIN] [BUSINESS_FLOW] có rủi ro hiệu năng liên quan Database:    - 1 transaction [BUSINESS_FLOW] cần 9 lần tương tác tới DB: 6 lần insert, 2 update status, 1 select transaction ==> Có thể làm tăng connection pool, tăng tải Database cũng như kéo dài transaction duration.   - Database [BUSINESS_LEDGER]: Mỗi ngày 10M bản ghi, partition theo tháng, lưu tối đa 6 tháng: ==> Chậm treo trong các hoạt động liên quan đến search (management), report. Database có nguy cơ gặp vấn đề về hiệu năng liên quan hot partition.   - OGG: Kéo dữ liệu từ host qua warm phục vụ báo cáo ==> 10M/ngày có thể xảy ra lag time. |
| 4 | Testcase 04 - Individual peak [BUSINESS_DOMAIN] | record to record ( From revice request ==> [BUSINESS_DOMAIN] success) | Response time: <1s TPS ~ 1500 Error rate: < 0.03% | - Ngoài các service chung với Inquiry, [BUSINESS_DOMAIN] [BUSINESS_FLOW] có rủi ro hiệu năng liên quan Database:    - 1 transaction [BUSINESS_FLOW] cần 9 lần tương tác tới DB: 6 lần insert, 2 update status, 1 select transaction ==> Có thể làm tăng connection pool, tăng tải Database cũng như kéo dài transaction duration.   - Database [BUSINESS_LEDGER]: Mỗi ngày 10M bản ghi, partition theo tháng, lưu tối đa 6 tháng: ==> Chậm treo trong các hoạt động liên quan đến search (management), report. Database có nguy cơ gặp vấn đề về hiệu năng liên quan hot partition.   - OGG: Kéo dữ liệu từ host qua warm phục vụ báo cáo ==> 10M/ngày có thể xảy ra lag time. |
| 4 | Testcase 04 - Individual peak [BUSINESS_DOMAIN] | Refund | Response time: <1s TPS ~ 10 Error rate: < 0.03% | - Ngoài các service chung với Inquiry, [BUSINESS_DOMAIN] [BUSINESS_FLOW] có rủi ro hiệu năng liên quan Database:    - 1 transaction [BUSINESS_FLOW] cần 9 lần tương tác tới DB: 6 lần insert, 2 update status, 1 select transaction ==> Có thể làm tăng connection pool, tăng tải Database cũng như kéo dài transaction duration.   - Database [BUSINESS_LEDGER]: Mỗi ngày 10M bản ghi, partition theo tháng, lưu tối đa 6 tháng: ==> Chậm treo trong các hoạt động liên quan đến search (management), report. Database có nguy cơ gặp vấn đề về hiệu năng liên quan hot partition.   - OGG: Kéo dữ liệu từ host qua warm phục vụ báo cáo ==> 10M/ngày có thể xảy ra lag time. |
| 5 | Testcase 05 - Individual Non Financial | Inquiry status | Response time: <1s TPS > 10 error rate <0.03% |  |
| 5 | Testcase 05 - Individual Non Financial | Copy transaction | Response time: <1s TPS > 10 error rate <0.03% |  |
| 5 | Testcase 05 - Individual Non Financial | Dispute transaction | Response time: <1s TPS > 10 error rate <0.03% |  |
| 6 | Testcase 06 - Individual [BATCH_PROCESSING_MODULE] flow with external partners | Number of partners: 20 Number of tnx: 5M  Number of rows in file: 10k row/file  Number of files/partners: 200-300 files/partner/Day | Duration From run job to push files in sFTP server < 7200s | - Rủi ro về Database Performance: Số lượng partner code hiện tại sẽ tương ứng với số procedure tổng hợp report được tạo ra để gửi đến từng đối tác/tổ chức bên ngoài. Điều này có thể gây quá tải cho database khi số lượng đối tác/tổ chức bên ngoài tăng cao. Cần xác định:    - Ngưỡng tối đa số procedure đồng thời mà hệ thống có thể xử lý ổn định   - Cấu hình giới hạn số lượng procedure trong configuration file   - Cài đặt queue mechanism để kiểm soát concurrent execution - Rủi ro về Network và File Transfer:    - Băng thông mạng được phê duyệt có đủ để xử lý volume transfer (Xin mở kết nối dự kiến từ đầu)   - Giới hạn tối đa số file được chuyển đồng thời qua SFTP đến các đối tác/tổ chức bên ngoài (Chưa có số liệu này trong DAB)   - Cấu hình SFTP connection limits phù hợp với network capacity |
| 7 | Testcase 07 - Individual [BATCH_PROCESSING_MODULE] flow with [REGULATORY_OR_PARTNER_SCOPE] | Run job with 5M transactions | Duration From run job to push file in sFTP server < 7200s | - Rủi ro hiệu năng liên quan xử lý bất đồng bộ trạng thái thủ công nhiều. Luồng [BUSINESS_DOMAIN] thiếu cơ chế xử lý chi tiết khi xảy ra lỗi bất đồng bộ trạng thái giữa partner nguồn, [SYSTEM_NAME] và partner đích. Vì vậy cần phải xử lý thủ công nhiều trước khi thực hiện báo cáo [REGULATORY_OR_PARTNER_SCOPE] - Đề xuất: Tạo job định kỳ chạy trước job [REGULATORY_OR_PARTNER_SCOPE]. Tự động kiểm tra và sync trạng thái trong các trường họ transaction trả về các mã lỗi có khả năng gây bất đồng bộ như connection timeout, network interrupt, service unavaiable…. |
| 8 | Testcase 08 - Individual Operation management | CCU: 50 Number of transaction: 10 mil. txn/day \* 2 day = 20 mil. txn | Respone time< 5s  Error rate < 0.03% |  |
| 9 | Testcase 09 - Individual User/partner management | CCU: 250 Number of transaction: 10 mil. txn/day \* 2 day = 20 mil. txn | Respone time < 5s  Error rate < 0.03% |  |
| 10 | Testcase 10 - Load mix normal day | - Precondition: Prepare historical data 2 days - Inquiry transaction - [BUSINESS_DOMAIN] [BUSINESS_FLOW] - Refund - Inquiry status - Copy Transaction - Dispute transaction - [BATCH_PROCESSING_MODULE] jobs | - TPS [BUSINESS_DOMAIN]: 400 tps - Respone time [BUSINESS_DOMAIN] < 500ms - Respone time [BATCH_PROCESSING_MODULE] < 7200s - Respone time for Management < 5s - Error rate < 0.03% |  |
| 11 | Testcase 11 - Load mix holiday day | - Inquiry transaction - [BUSINESS_DOMAIN] [BUSINESS_FLOW] - Refund - Inquiry status - Copy Transaction - Dispute transaction - [BATCH_PROCESSING_MODULE] jobs | - TPS [BUSINESS_DOMAIN]: 1k5 tps - Respone time [BUSINESS_DOMAIN] < 1s - Respone time [BATCH_PROCESSING_MODULE] < 7200s - Respone time for Management < 5s - Error rate < 0.03% |  |
| 12 | Testcase 12 - Stress test [BUSINESS_DOMAIN] | Simulate tps at binary level to find system thresholds   - Inquiry transaction - [BUSINESS_DOMAIN] [BUSINESS_FLOW] - Refund - Inquiry status - Copy Transaction - Dispute transaction |  |  |
| 13 | Testcase 13 - Stress test [BATCH_PROCESSING_MODULE] | Simulate tps at binary level to find system thresholds   - [BATCH_PROCESSING_MODULE] jobs |  |  |
| 14 | Testcase 14 - Scale up | - Inquiry transaction - [BUSINESS_DOMAIN] [BUSINESS_FLOW] - Refund   Increase volume From normal to peak (x5 times) | when scale up pod/server not impact transaction processing   - Respone time [BUSINESS_DOMAIN] < 500ms - Error rate < 0.03% | Rủi ro không bảo toan transaction khi hệ thống thực hiện scale up/ scale down. Ví dụ:   - Transaction đang xử lý bị terminate khi server down - Dữ liệu trong memory buffer chưa được flush xuống database |
| 13 | Testcase 15 - Scale down | - Inquiry transaction - [BUSINESS_DOMAIN] [BUSINESS_FLOW] - Refund   (Decrease transaction From peak to normal) | when scale down pod/server not impact transaction processing   - Respone time [BUSINESS_DOMAIN] < 500ms - Error rate < 0.03% | Rủi ro không bảo toan transaction khi hệ thống thực hiện scale up/ scale down. Ví dụ:   - Transaction đang xử lý bị terminate khi server down - Dữ liệu trong memory buffer chưa được flush xuống database |
| 14 | Testcase 16 - Soak test | - Precondition:    - Prepare historical data 1 days   - Simulate 2 working days (8 - 12 hour)   - setup data for 20 partners - Inquiry transaction - [BUSINESS_DOMAIN] [BUSINESS_FLOW] - Refund - [BATCH_PROCESSING_MODULE] jobs - Management | No memory leak   - Respone time [BUSINESS_DOMAIN] < 500ms - Respone time [BATCH_PROCESSING_MODULE] < 7200s - Respone time for Management < 5s - Error rate < 0.03% |  |
| 15 | Testcase 17 - Load test E2E [BUSINESS_DOMAIN] | - From [PARTNER_A] to [PARTNER_B]/other partner    - Inquiry transaction (other partner) - 1.2M transactions/h   - [BUSINESS_DOMAIN] [BUSINESS_FLOW] (other partner) - 1M transactions/h - From other partner to [PARTNER_A]    - Inquiry transaction -   - [BUSINESS_DOMAIN] [BUSINESS_FLOW] - From two configured partners [PARTNER_A]/[PARTNER_B]    - Inquiry transaction   - [BUSINESS_DOMAIN] [BUSINESS_FLOW]   - Refund   - Inquiry status   - Copy Transaction   - Dispute transaction | - TPS [BUSINESS_DOMAIN]: 400 tps - Respone time [BUSINESS_DOMAIN] < 500ms - Respone time [BATCH_PROCESSING_MODULE] < 7200s - Respone time for Management < 5s - Error rate < 0.03% |  |
| 16 | Testcase 18 - Load mix E2E [BATCH_PROCESSING_MODULE] | - From [SYSTEM_NAME] to configured partners - From [SYSTEM_NAME] to other partner (SFTP servers) - From [SYSTEM_NAME] to [REGULATORY_OR_PARTNER_SCOPE] | - Respone time [BUSINESS_DOMAIN] < 1s - Respone time [BATCH_PROCESSING_MODULE] < 7200s - Respone time for Management < 5s - Error rate < 0.03% |  |

# Plan

## Overview

|  |  |  |  |
| --- | --- | --- | --- |
| **Task** | **Manday** | **Start** | **End** |
| Prepare before performance testing | 31 | 8-Aug | 06-Sep |
| Execute performance testing | 70.75 | 08-Sep | 18-Oct |
| Summary report & sign off | 3 | 20-Oct | 21-Oct |
| Buffer (15%) | 16 | 20-Oct | 25-Oct |
| **Total** | **120** |  |  |

## Detail

- [PROJECT_CODE]-MVP0.5] PT Detail Plan










