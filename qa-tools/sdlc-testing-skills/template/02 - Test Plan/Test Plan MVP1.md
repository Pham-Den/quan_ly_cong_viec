> **Hướng dẫn sử dụng template:** Nội dung dưới đây được giữ theo format tài liệu mẫu gốc. Khi dùng cho dự án mới, thay các placeholder như `[PROJECT_CODE]`, `[PROJECT_NAME]`, `[SYSTEM_NAME]`, `[ENV]`, `[OWNER]`, `[LINK]`; giữ lại các bảng, tiêu chí, checklist và các con số baseline nếu còn phù hợp. Nguồn gốc đã sanitize: `Test Plan\Test Plan MVP1.md`.

# Test Plan MVP1

<https://[CONFLUENCE_DOMAIN]/wiki/pages/[PAGE_ID]>

---

## 1. TỔNG QUAN

### 1.1 Mục đích

Kế hoạch kiểm thử MVP 1 nhằm đảm bảo các thành phần lõi của hệ thống [CORE_SYSTEM] hoạt động **chính xác**, **ổn định**, đồng thời phát hiện sớm các lỗi về **logic** trước khi tích hợp với các Tổ chức/đối tác ([PARTNER]) bên ngoài. MVP 1 kéo dài 2 tháng và tập trung vào các chức năng cốt lõi nhằm **Hoàn thiện toàn bộ luồng nghiệp vụ ([BUSINESS_FLOW] và xử lý tổng hợp tự động)**

### 1.2 Tổng quan

#### 1.2.1 Phạm vi kiểm thử

Danh sách các yêu cầu trong MVP 1

<https://[JIRA_OR_CONFLUENCE_DOMAIN]/issues/?filter=29357>

#### 1.2.1 Ngoài phạm vi kiểm thử

- Kiểm thử tích hợp với nhiều đối tác/tổ chức bên ngoài (MVP 2).

**1.2.2 Mục tiêu kiểm thử**

- Tích hợp kết nối inbound thành công với [PARTNER] qua môi trường giả lập
- Hoàn thiện logic xử lý [CORE_MODULE] đúng, chính xác đáp ứng yêu cầu
- Tích hợp kết nối outbound thành công với [PARTNER_A] qua môi trường giả lập
- Logic xử lý cuối kỳ và xử lý tổng hợp đáp ứng đúng yêu cầu
- Tích hợp kết nối [REGULATORY_OR_PARTNER_SCOPE] qua môi trường giả lập
- Áp dụng ký số/xác thực ký số cho các luồng kết nối
- Hoàn thiện toàn bộ luồng nghiệp vụ ([BUSINESS_FLOW] và xử lý tổng hợp tự động)

---

## 2. CHIẾN LƯỢC KIỂM THỬ

| **Giai đoạn kiểm thử** | **Mục tiêu** | **Ghi chú** |
| --- | --- | --- |
| **Unit Test** | Kiểm thử tại cấp độ module (định tuyến, xử lý nghiệp vụ, logging) | % Unit Test pass cần đạt? |
| **Functional Test**  (28/4-26/5) | Kiểm tra logic chức năng của các thành phần lõi | Sử dụng AI hỗ trợ tạo, review kịch bản kiểm thử  Sử dụng Automation để hỗ trợ kiểm tra các thông tin dữ liệu lớn đòi hỏi chính xác (30% Automation)  Kiểm thử dựa trên Risk Base Testing, ưu tiên các main function |
| **Non Funtional Test**  (Bắt đầu từ 2/6) | Thực hiện các kiểm thử Performance và Security cơ bản | Các loại kiểm thử thực hiện xem thêm [Tại đây]([GOOGLE_DOC_LINK]) (cột C) |
| **System Integration Test**  (12/5-26/5) | Đảm bảo các module lõi tích hợp đúng | Kiểm tra luồng nghiệp vụ nội bộ |
| **Smoke Test** | Kiểm tra nhanh sau mỗi đợt triển khai môi trường | Đảm bảo CI/CD ổn định, hệ thống sẵn sàng kiểm thử |

## 3. KẾ HOẠCH KIỂM THỬ THEO TIẾN ĐỘ

|  |  |  |  |  |
| --- | --- | --- | --- | --- |
| **Sprint** | **Tuần** | **Hoạt động chính** | **Đầu ra kỳ vọng** | **PIC** |
| **Sprint 1** | 15/4/2025 - 28/4/2025 | - Tìm hiểu hệ thống - Nghiên cứu các công cụ AI hỗ trợ tạo testcase/ review testcase tự động - Tạo các tài liệu/ thư mục liên quan đến kiểm thử - Viết test plan - Hoàn thiện test case chức năng của các yêu cầu đã hoàn thiện & được review - Dựng môi trường Automation - Đào tạo đội ngũ (Robot framework), WOW và các quy định của team - Nghiên cứu công cụ cách thức test performance DB/temporal | - Hoàn thành cấu trúc các thư mục kiểm thử - Test plan 50%. - Thử nghiệm với các kịch bản và đánh giá được được độ đáp ứng theo yêu cầu - 100% test case hoàn thành & review bởi QC lead - Công cụ kiểm thử tự động sẵn sàng. - Tài liệu đào tạo đã có đưa lên folder chung | QC Lead    QC Engineer |
| **Sprint 2** | 28/4/2025 - 12/5/2025 | - Hoàn thiện test case chức năng của các trong Sprint 2 & được review - Chọn lọc các US có thể **Automation** để thực hiện auotmation (**Tiêu chí xem** [**Tại đây**](https://[JIRA_OR_CONFLUENCE_DOMAIN]/wiki/spaces/[ORG_NAME]/pages/[PAGE_ID]/Ti+u+ch+ch+n+User+Story+US+th+c+hi+n+Autotrong+Sprint)**)** - Thực hiện kiểm thử các tính năng đã hoàn thiện - Test tích hợp BExFE Web simulator (E2E từ [PARTNER] tới [PARTNER_A]) | - 100% test case hoàn thành & review bởi QC lead - Báo cáo tiến độ viết testcase, chạy hàng ngày - Hoàn thiện test các main case tích hợp BExFE Web simulator (E2E từ [PARTNER] tới [PARTNER_A]) - Smoke xong Sandbox giả lập phản hồi từ [PARTNER_A] | QC Lead  QC Engineer |
| **Sprint 3** | 20/5/2025 - 26/5/2025 | - Hoàn thiện test case chức năng của các trong Sprint 3 & được review - Chọn lọc các US có thể **Automation** để thực hiện auotmation (**tài liệu API đầy đủ, chi tiết)** - Thực hiện kiểm thử các tính năng đã hoàn thiện - SIT [BUSINESS_FLOW] [BUSINESS_FLOW] - **Smoke môi trường QC** - **SIT [CORE_MODULE] [BUSINESS_FLOW] x [CLEARING_MODULE] full luồng** | - Danh sách lỗi khắc phục - Báo cáo kiểm thử | QC Lead  QC Engineer |
| **Sprint 4** | 26/5/2025 - 7/6/2025 | - Hoàn thiện test case chức năng của các trong Sprint 4 & được review - Chọn lọc các US có thể **Automation** để thực hiện auotmation (**tài liệu API đầy đủ, chi tiết)** - Nghiệm thu full luồng sau chuyển đổi hạ tầng - Bàn giao tài liệu (test case, báo cáo lỗi, báo cáo hiệu năng). - Đánh giá rủi ro và Lessons learned. - Chuẩn bị cho MVP 2 (đề xuất cải tiến).<br>- - Hoàn thành phê duyệt vào 15/6/2025. | - Tài liệu bàn giao. - Báo cáo rủi ro và Lessons learned - Kế hoạch sơ bộ MVP 2. | QC Lead  QC Engineer |

**Daily QA Standup**: Cập nhật tiến độ, báo cáo blocker (15 phút/ngày).\
 **Weekly QC Status Report**: Gửi cho team core, bao gồm tiến độ, lỗi, rủi ro.

---

## 4. NGUỒN LỰC KIỂM THỬ

### 4.1 Nhân sự

| **Vai trò** | **Số lượng** | **Nhiệm vụ** | **Kỹ năng yêu cầu** | **Ghi chú** |
| --- | --- | --- | --- | --- |
| QC Lead | 1 | Lập kế hoạch, giám sát, báo cáo  Quản lý tiến độ, chất lượng kiểm thử  Phân công, điều phối công việc trong team  Review testcase, test script, excecute test | Quản lý dự án, Agile,  Chuyên môn kiểm thử,  Quản lý nhóm |  |
| Kỹ sư Kiểm thử Thủ công | 6 | Review requirement  Viết test case function/SIT  Review testcase/ SIT  Tạo dữ liệu kiểm thử  Kiểm thử function/SIT | Kiểm thử thủ công  Phân tích yêu cầu | **4 bạn join từ đầu sprint**  **2 bạn join từ 6/5** |
| Kỹ sư kiểm thử tự động | 1 | Dựng khung Automation  Xây dựng các lib/key chính phục vụ Automation  Triển khai các test script  Training hướng dẫn team triển khai auto theo famework | Robot framework  Lập trình  Postman |  |
| Kỹ sư Kiểm thử Phi chức năng | 1 | Nghiên cứu các công cụ để thực hiện kiểm thử hiệu năng  Phối hợp với DEV chuẩn bị môi trường công cụ, kịch bản để thực hiện các kiểm thử hiệu năng cơ bản | JMeter, phân tích hiệu năng | Part-time, chủ yếu nghiên cứu các công cụ và cách thức để triển khai performance |

### 4.2 Công cụ và cơ sở hạ tầng

| **Loại** | **Tên** | **Mục đích** | **Ghi chú** |
| --- | --- | --- | --- |
| Quản lý kiểm thử | QMetry, Jira, Confluence | Quản lý test case, theo dõi lỗi |  |
| Theo dõi tiến độ | Confluence, Google Sheet | Lập kế hoạch, theo dõi tiến độ |  |
| Kiểm thử chức năng | Postman, Robot Framework, Jmeter  **Trình duyệt Chrome, Edge, Firefox (Version???)** | API (Component)  Kiểm thử giao diện |  |
| Kiểm thử tích hợp | Robot Framework, Postman | Kiểm tra thông điệp [DOMAIN_STANDARD] 8583, API  API Integration |  |

---

## 5. MÔI TRƯỜNG KIỂM THỬ

| **Môi trường** | **Mục đích** | **Yêu cầu** |
| --- | --- | --- |
| QC | Kiểm thử chức năng  Kiểm thử tích hợp (SIT) | - Cấu hình tương tự môi trường thực. - Dữ liệu kiểm thử đầy đủ. |
| UAT | Kiểm thử Regression  Kiểm thử nghiệm thu người dùng | - Cấu hình tương tự môi trường thực. - Dữ liệu kiểm thử đầy đủ. |
| PRD | Triển khai Technical golive | Môi trường, dữ liệu thực, cấu hình đáp ứng đủ các yêu cầu non functional |

---

## 6. TIÊU CHÍ HOÀN THÀNH

| **Tiêu chí** | **Điều kiện hoàn thành** |
| --- | --- |
| Kịch bản kiểm thử | **98% kịch bản function/ integeration kiểm thử được thực hiện (98% Pass???)**  **100% kịch bản UAT được thực hiện (100% Pass???)** |
| Lỗi tồn đọng | Không còn lỗi nghiêm trọng (Severity : Critical, Major)  Các lỗi còn lại tồn đọng <= 5% |
| Yêu cầu chức năng | Đáp ứng các yêu cầu về chức năng |
| Yêu cầu phi chức năng | Đáp ứng 80% các yêu cầu về phi chức nang theo [check list thực hiện]([GOOGLE_DOC_LINK])??? |
| UT | UT pass đạt xx %??? |

---

## 7. BÁO CÁO & THEO DÕI

- **Daily QC Standup**: 15 phút/ngày, cập nhật tiến độ, báo cáo blocker.
- **Weekly QC Status Report**: Gửi cho core team, bao gồm:

  - Tiến độ kiểm thử (% hoàn thành).
  - Số lượng lỗi (mới, đã sửa, còn lại).
  - Rủi ro và blocker.
- **Test Summary Report** (cuối phase): Bao gồm:

  - Kết quả kiểm thử (chức năng, tích hợp, usability).
  - Số lượng lỗi và trạng thái.
  - Đánh giá chất lượng MVP 1.
  - Lessons learned (bài học rút ra).
- **Lessons learned**: Tài liệu các vấn đề gặp phải (lỗi tích hợp, hiệu năng, môi trường) và đề xuất cải tiến cho MVP 2.

---

## 8. QUẢN LÝ RỦI RO

| **Rủi ro** | **Mức độ** | **Biện pháp giảm thiểu** |
| --- | --- | --- |
| **Tiến độ trễ do lỗi phát triển** | **Cao** | - **Phối hợp chặt chẽ với đội Dev để sửa lỗi sớm.** - **Ưu tiên kiểm thử chức năng cốt lõi.** |
| **Môi trường chưa sẵn sàng** | **Cao** | - **Yêu cầu môi trường Non PRD (QC) cần có trong Sprint 2** - Môi trường UAT cần có trong đầu Sprint 3 |
| Thiếu dữ liệu kiểm thử | Trung | - Sinh dữ liệu giả lập từ Tuần 1. - Phối hợp với BA/DEV để thiết lập các dữ liệu kiểm thử |
| Tài liệu chưa đầy đủ rõ ràng | Trung | Phối hợp với PO/TO để làm rõ các yêu cầu và bổ sung các tài liệu từ sớm để phục vụ kiểm thử (manual + Automation) |

---

## 9. KẾT QUẢ BÀN GIAO

| **Tài liệu** | **Mô tả** |
| --- | --- |
| Test Plan | Kế hoạch kiểm thử MVP 1, lưu trong Confluence |
| Test Case | Kịch bản kiểm thử chức năng, tích hợp, lưu trong Qmetry/ goolge sheet |
| Báo cáo Kiểm thử | Kết quả kiểm thử (lỗi, hiệu năng, bảo mật, tích hợp), lưu trong Jira/ Confluence |
| Đánh giá Rủi ro | Rủi ro phát hiện và đề xuất cho MVP 2 |
| Lessons learned | Bài học rút ra từ MVP 1, đề xuất cải tiến |

## 10. PHÊ DUYỆT KẾ HOẠCH KIỂM THỬ

| Vai trò | Họ tên | Vai trò trong dự án | Trạng thái |
| --- | --- | --- | --- |
| Workstream Lead |  | Quản lý toàn bộ Workstream |  |
| PO Lead |  | Xác nhận phạm vi nghiệp vụ |  |
| TechLead |  | Đảm bảo phù hợp kỹ thuật |  |
| SA |  | Đảm bảo phù hợp kỹ thuật |  |







