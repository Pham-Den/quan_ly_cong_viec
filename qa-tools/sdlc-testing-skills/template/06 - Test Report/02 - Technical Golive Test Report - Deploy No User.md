> **Hướng dẫn sử dụng template:** Nội dung dưới đây được giữ theo format tài liệu mẫu gốc. Khi dùng cho dự án mới, thay các placeholder như `[PROJECT_CODE]`, `[PROJECT_NAME]`, `[SYSTEM_NAME]`, `[ENV]`, `[OWNER]`, `[LINK]`; giữ lại các bảng, tiêu chí, checklist và các con số baseline nếu còn phù hợp. Nguồn gốc đã sanitize: `Test Report\[Release 30.06.2025] Testing Report\[Release 30.06.2025] Testing Report.md`.

# Technical Golive Test Report - Deploy No User

> **Mục đích sử dụng:** Dùng cho mốc technical golive hoặc deploy kỹ thuật chưa có người dùng thật. Mẫu này xác nhận chất lượng bản build, trạng thái defect, SIT/UAT nếu có, và rủi ro còn lại trước giai đoạn pilot/golive thật.

<https://[CONFLUENCE_DOMAIN]/wiki/pages/[PAGE_ID]>

# **1. Tổng quan kiểm thử**

## 1.1 Mục tiêu kiểm thử

- Tập trung kiểm thử chức năng hệ thống [BUSINESS_FLOW] bao gồm các luồng truy vấn, luồng nghiệp vụ chính, đối chiếu dữ liệu ngưỡng nghiệp vụ.
- Đảm bảo hệ thống chạy đúng, ổn định.
- Đảm bảo các chức năng đáp ứng yêu cầu về nghiệp vụ về hệ thống.

## **1.2 Phạm vi kiểm thử**

- Kiểm thử các tính năng liên của luồng truy vấn, luồng nghiệp vụ chính, đối chiếu dữ liệu, ngưỡng nghiệp vụ (*tổng cộng 42 User Story và 50 Task)*

## **1.3 Các hạng mục kiểm thử theo lộ trình dự án**

Theo chiến lược triển khai theo từng giai đoạn của dự án, các hạng mục kiểm thử dưới đây sẽ được thực hiện bởi các nhóm chuyên trách hoặc trong các giai đoạn tiếp theo, trước khi hệ thống vận hành chính thức với các đối tác.

- Kiểm thử trên các loại trình duyệt đối với Siumlator không ưu tiên thực hiện
- Kiểm thử các phần thiết kế DB so với thực thế (phần này đội DEV đã thực hiện)
- **Kiểm thử Bảo mật (Security Testing):**

  - **Đơn vị thực hiện:** Đội Bảo mật.
  - **Ghi chú:** Sẽ thực hiện quét lỗ hổng và kiểm thử xâm nhập trước khi tích hợp với đối tác/tổ chức bên ngoài thật.
- **Kiểm thử Hiệu năng (Performance Testing):**

  - **Đơn vị thực hiện:** Đội DEV
  - **Ghi chú:** Sẽ thực hiện kiểm thử tải (load test), kiểm thử sức bền (endurance test) với dữ liệu lớn để đảm bảo đáp ứng TPS mục tiêu trước khi vận hành chính thức trên môi trường DR sau Go-live kỹ thuật
- **Kiểm thử Hạ tầng trên môi trường OAT (OAT Hardware Testing):**

  - **Đơn vị thực hiện:** Đội Hạ tầng.
- **Các loại kiểm thử Phi chức năng khác (HA, DR, Resilience...):**

  - **Ghi chú:** Các kịch bản kiểm thử về tính sẵn sàng cao (Failover) và phục hồi sau thảm họa (Disaster Recovery) sẽ được ưu tiên thực hiện trong giai đoạn giám sát sau Go-live kỹ thuật.

*Xem thêm chi tiết các loại kiểm thử non functional theo từng giai đoạn* [*Tại đây*]([GOOGLE_DOC_LINK])

## 1.4 Các loại kiểm thử thực hiện

|  |  |  |
| --- | --- | --- |
| **STT** | **Loại kiểm thử** | **Mục đích** |
| 1 | Functional Testing | Kiểm tra các tính năng có đáp ứng đúng yêu cầu trong User Story/ PRD |
| 2 | Integration Testing | Kiểm tra tích hợp giữa các module/API |
| 3 | System Integration Testing (SIT) | Kiểm tra tích hợp toàn bộ hệ thống End-to End (nội bộ và đối tác) |
| 4 | Smoke Testing | Kiểm tra các chức năng cốt lõi nhất của toàn hệ thống mỗi khi deploy lên môi trường mới |
| 5 | Sanity Testing | Kiểm tra các thay đổi mới (sửa lỗi) có **hoạt động đúng** không? |
| 6 | Regresion Testing | Kiểm tra các thay đổi mới có **làm hỏng** các chức năng cũ đang chạy ổn định không? |
| 6 | User Accepteance Testing | Kiểm thử chấp nhận người dùng, đảm bảo chức năng thực hiện đúng/ đủ theo yêu cầu |

# **2. Công cụ, môi trường kiểm thử**

## 2.1 Công cụ kiểm thử

|  |  |  |  |
| --- | --- | --- | --- |
| **Activities** | **Tools** | **Version** | **Note** |
| Quản lý test case | QMetry/Google Sheet |  |  |
| Kiểm soát lỗi | Jira |  |  |
| Kiểm thử API | Postman |  |  |
| Trình duyệt | Chrome |  |  |
| Kiểm thử tự động | Robot Framework |  |  |
| Kiểm thử hiệu năng | Jmeter |  | Hỗ trợ các kịch bản tạo nhiều đơn để kiểm tra đổi soát |
| Kiểm tra DB | Các tool hỗ trợ kết nối MySQL, Oracle |  |  |

## 2.2 Môi trường kiểm thử

|  |  |  |  |
| --- | --- | --- | --- |
| **Hệ thống** | **Môi trường** | **Link** | **Note** |
| [SIMULATOR] | QC | <https://simulator-[SYSTEM_NAME]-qc.ops.[ORG_NAME].mobi/simulator/transfer> |  |
| [WORKFLOW_ENGINE] | QC | <https://[SYSTEM_NAME]-temporal.ops.[ORG_NAME].mobi/namespaces/[SYSTEM_NAME]-qc/workflows> |  |
| API | QC | https://api-[SYSTEM_NAME]-qc.int.[ORG_NAME].mobi/ |  |

# **3. Kết quả kiểm thử**

## 3.1 Tóm tắt kết quả thực hiện

[Các kịch bản kiểm thử đã thực hiện]([GOOGLE_DOC_LINK])

**Diễn giải:** Con số "100% PASS" thể hiện trạng thái cuối cùng của các kịch bản, sau khi tất cả các lỗi được phát hiện trong quá trình kiểm thử đã được đội ngũ phát triển khắc phục và đội ngũ kiểm thử đã xác nhận lại thành công.

| **STT** | **Loại Test case** | **Tổng số testcase** | **Kết quả thực hiện** | **Ghi chú** |
| --- | --- | --- | --- | --- |
| 1 | Test case Function | 2987 | **2935 ~ 98.26% PASS**  **20 ~ 0.67% FAIL**  32 ~ 1.07% N/A là những case không thực hiện do khó giả lập |  |
| 2 | SIT (System Integration Testing) | 329 | **329 ~ 100 % PASS** |  |
| 3 | UAT (User Acceptance Testing) | 130 | **100% PASS** |  |

![Ảnh minh họa đã được lược bỏ khi template hóa]([IMAGE_PLACEHOLDER])![Ảnh minh họa đã được lược bỏ khi template hóa]([IMAGE_PLACEHOLDER])

## 3.2 Tóm tắt lỗi

[Danh sách các lỗi tìm được theo độ nghiêm trọng và độ ưu tiên](https://[JIRA_OR_CONFLUENCE_DOMAIN]/issues/?filter=31580)

![Ảnh minh họa đã được lược bỏ khi template hóa]([IMAGE_PLACEHOLDER])![Ảnh minh họa đã được lược bỏ khi template hóa]([IMAGE_PLACEHOLDER])

**Trạng thái các lỗi**

![Ảnh minh họa đã được lược bỏ khi template hóa]([IMAGE_PLACEHOLDER])

**Lỗi tìm được trên các môi trường**

![Ảnh minh họa đã được lược bỏ khi template hóa]([IMAGE_PLACEHOLDER])![Ảnh minh họa đã được lược bỏ khi template hóa]([IMAGE_PLACEHOLDER])![Ảnh minh họa đã được lược bỏ khi template hóa]([IMAGE_PLACEHOLDER])

**Nhận xét**

Lỗi tập trung chủ yếu tại **môi trường QC (89%)**. **Lỗi code chiếm 79%**, phản ánh cần siết chặt review và unit test. Ngoài ra, có lỗi tài liệu (15), lỗi hệ thống (7) và 1 lỗi thiết kế, cho thấy bất cập ở khâu đồng bộ tài liệu và cấu hình môi trường. Dù xuất hiện lỗi ngay từ DEV (18) và lọt tới UAT (6 trong đó 3 2 bugs nghiệp vụ phát hiện ra, còn lại do QC smoke môi trường UAT), toàn bộ lỗi đã được xử lý (**100% Closed/Obsolete**), đảm bảo không còn tồn đọng trước golive

**Phân tích chất lượng dựa trên lỗi:**

- **Xử lý lỗi nghiêm trọng:** Quy trình kiểm thử đã thành công trong việc phát hiện và phối hợp loại bỏ toàn bộ **59 lỗi ở mức độ Critical và Major**, cho thấy các rủi ro lớn nhất về mặt chức năng đã được xử lý triệt để trước khi kết thúc giai đoạn.
- **Phân tích lỗi "OBSOLETE":** 33 lỗi được chuyển sang trạng thái "OBSOLETE" chủ yếu do các nguyên nhân như: thay đổi yêu cầu, lỗi trùng lặp, hoặc không tái lập được sau khi môi trường được cập nhật.

**Phân tích xu hướng lỗi**

Biểu đồ Created vs. Resolved cho thấy chất lượng sản phẩm đã rất ổn định. Cụ thể:

- Tốc độ phát sinh lỗi mới (đường màu xanh) đã giảm mạnh và đi ngang vào tuần cuối (từ 13/06 - 18/06).
- Đội ngũ đã xử lý hiệu quả, đưa số lượng lỗi được khắc phục (đường màu đỏ) bắt kịp và bằng với số lỗi được tạo ra vào cuối giai đoạn

![Ảnh minh họa đã được lược bỏ khi template hóa]([IMAGE_PLACEHOLDER])

## **3.3 Đối chiếu với điều kiện kết thúc**

|  |  |  |
| --- | --- | --- |
| **Tiêu chí** | **Kế hoạch đề ra** | **Kết quả thực tế** |
| 1 | Hoàn thành 100% các kịch bản kiểm thử | **ĐẠT**, 100% Testcase function đã chạy hết và PASS, link chi tiết xem [Tại đây](https://[JIRA_OR_CONFLUENCE_DOMAIN]/plugins/servlet/ac/com.infostretch.QmetryTestManager/qtm4j-test-management?project.key=[ORG_NAME]&project.id=[QMETRY_PROJECT_ID]#!/Manage/TestCycle)  [Link lưu trữ các kịch bản đã thực hiện và dẫn chứng]([GOOGLE_DRIVE_LINK]) |
| 2 | Hoàn thành 100% luồng SIT đối chiếu dữ liệu, ngưỡng nghiệp vụ (100% PASS), truy vấn & regression lại hệ thống | **ĐẠT**, 100% hoàn thành 100% testcase SIT và PASS 100%  [Link kịch bản và kết quả test SIT]([GOOGLE_DOC_LINK]) |
| 3 | Không còn tồn đọng bug block, critical | **ĐẠT**, Không còn tồn đọng bug block, critical trước Golive |
| 4 | Bug medium tồn đọng không vượt quá 5% | **ĐẠT**, Không còn tồn đọng |
| **KẾT LUẬN** | **KẾT LUẬN** | **ĐẠT 100% so với các điều kiện đã đề ra** |

# **4. Tổng kết và phân tích**

## **4.1 Phân tích & nhận định về chất lượng**

- Các luồng nghiệp vụ chính đã hoạt động ổn định, đáp ứng đúng các yêu cầu của nghiệp vụ
- Các lỗi đã được đóng hết trên bản build hiện tại ở UAT
- Một số yêu cầu phát sinh trong giai đoạn UAT có độ ưu tiên cao đã được fix luôn trong giai đoạn UAT theo thống nhất giữa đội phát triển và đội [PARTNER_A], các yêu cầu và enhancement còn lại đã đưa vào kết hoạch thực hiện trong các giai đoạn tiếp theo. [Chi tiết xem thêm Tại đây]([GOOGLE_DOC_LINK])

**=> BẢN BUILD TRÊN UAT ĐÁP ỨNG YÊU CẦU VỀ CHẤT LƯỢNG (FUNCTIONAL REQUIREMENT)**

## 4.2 Rủi ro còn tồn đọng và kế hoạch giảm thiểu

Toàn bộ các lỗi phát sinh trong giai đoạn kiểm thử đã được khắc phục. Rủi ro chính còn lại là các rủi ro đã được thống nhất chấp nhận trong giai đoạn này, với kế hoạch xử lý rõ ràng.

**Rủi ro được chấp nhận (Accepted Risk):**

Các rủi ro tiềm ẩn về hiệu năng, bảo mật và vận hành liên tục do việc hoãn các hoạt động kiểm thử phi chức năng sang giai đoạn sau theo đúng lộ trình dự án.

**Tác động tiềm tàng:** Khi có tải thật, hệ thống có thể gặp sự cố hiệu năng; có thể tồn tại lỗ hổng bảo mật; khả năng phục hồi khi có sự cố chưa được kiểm chứng.

**Kế hoạch giảm thiểu:** Xây dựng và phê duyệt **Lộ trình Kiểm thử Phi chức năng** chi tiết để thực thi trước khi hệ thống vận hành chính thức. Thiết lập quy trình giám sát (monitoring) hiệu năng và log hệ thống chặt chẽ ngay sau Go-live kỹ thuật.

## 4.3 Bài học kinh nghiệm

|  |  |  |  |
| --- | --- | --- | --- |
| **STT** | **Nội dung** | **Nguyên nhân** | **Đề xuất** |
| 1 | Vẫn còn tồn đọng nhiều bug priority và severity cao khi bàn giao sang QC (ảnh hưởng tới tiến độ test do các bugs này thường làm block các luồng chính)   - Bug priority cao ở mức độ High, Highest chiếm 68/199 bugs ~ **34%** - Bug có độ nghiêm trong cao (critical, major) chiếm tỷ trọng tương đối lớn 59/199 bugs ~ **30%** | Do đặc thù dự án logic phức tạp, nhiều corner case, khối lượng US lớn, thời gian phát triển gấp, các sprint chạy gối đầu vừa fix bug vừa develop chức năng, nguồn lực dev chưa đc bổ sung đầy đủ | Bổ sung thêm nguồn lực dev (đã thực hiện trong Sprint 5)  DEV cần thực hiện Self test trước các case cơ bản theo testcase của QC để giảm thiểu các bug nghiêm trọng khi bàn giao sang QC  Thực hiện Unit test (PASS) và chạy các case smoke (đã có script Automation) trên môi trường dev pass trước khi đẩy code lên QC |
| 2 | Đã lưu evidence của các kịch bản kiểm thử SIT tuy nhiên chưa đầy đủ (1 số kịch bản còn bị thiếu), cần lưu lại đầy đủ dẫn chứng của các round test và các thông tin trong DB, hệ thống phục vụ cho quá trình audit và check lỗi sau này | Do tiến độ test + khối lượng công việc nhiều phải OT liên tục nên đang ưu tiên phần test hoàn thiện các chức năng sớm và dẫn chứng lưu chưa đầy đủ | Estimate thêm thời gian test để đủ lưu thêm đầy đủ dẫn chứng đầy phục vụ việc hậu kiểm về sau |
| 3 | Giai đoạn UAT phát hiện ra 2 lỗi mức độ [nghiêm trọng Normal]([GOOGLE_DOC_LINK])  do bỏ sót trong quá trình thực hiện SIT | Nghiệp vụ mới, phức tạp nên chưa đánh giá được các conner case phức tạp đặc thù của hệ thống đối tác/tổ chức bên ngoài | Cần review chéo các kịch bản kiểm thử để có nhiều view hơn và phát hiện ra conner case với các tình huống có thể xảy ra thực tế.  Đẩy mạnh Automation để đỡ nguồn lực regression lại hệ thống khi có thay đổi (Hiện tại auto được 25/143 kịch bản SIT) =>QC có thêm giờ gian để test khám phá phát hiện ra các lỗi tiềm ẩn phá |

# **5. Các tài liệu tham chiếu**

|  |  |  |
| --- | --- | --- |
| **STT** | **Tên tài liệu** | **Link lưu trữ** |
| 1 | Kịch bản kiểm thử chức năng | [Tại đây](https://[JIRA_OR_CONFLUENCE_DOMAIN]/plugins/servlet/ac/com.infostretch.QmetryTestManager/qtm4j-test-management?project.key=[ORG_NAME]&project.id=[QMETRY_PROJECT_ID]#!/Manage/TestCycle)  [Link lưu trữ các kịch bản đã thực hiện và dẫn chứng]([GOOGLE_DRIVE_LINK]) |
| 2 | Kịch bản kiểm thử SIT | [Link kịch bản và kết quả test SIT]([GOOGLE_DOC_LINK]) |
| 3 | Kết quả chạy Automation các round | Kết quả chạy tạo nghiệp vụ tự động |
| 4 | Kết quả chạy UAT | <[GOOGLE_DOC_LINK]> |







