> **Hướng dẫn sử dụng template:** Nội dung dưới đây được giữ theo format tài liệu mẫu gốc. Khi dùng cho dự án mới, thay các placeholder như `[PROJECT_CODE]`, `[PROJECT_NAME]`, `[SYSTEM_NAME]`, `[ENV]`, `[OWNER]`, `[LINK]`; giữ lại các bảng, tiêu chí, checklist và các con số baseline nếu còn phù hợp.

# Golive Test Report

> **Mục đích sử dụng:** Dùng cho mốc Golive khi hệ thống cần đánh giá đủ điều kiện vận hành chính thức hoặc vận hành có kiểm soát. Giữ các phần Functional, SIT, UAT, Performance, Security, OAT và rủi ro vận hành nếu có.

<https://[CONFLUENCE_DOMAIN]/wiki/pages/[PAGE_ID]>

# **1. Tổng quan kiểm thử**

## 1.1 Mục tiêu kiểm thử

- Tập trung kiểm thử chức năng hệ thống [BUSINESS_FLOW] bao gồm các luồng truy vấn, luồng nghiệp vụ chính, đối chiếu dữ liệu ngưỡng nghiệp vụ, truy vấn trạng thái nghiệp vụ, copy nghiệp vụ, xử lý yêu cầu nghiệp vụ.
- Các chức năng trên [USER_PORTAL] phục vụ các [PARTNER] và các chức năng trên [OPS_PORTAL] cho đội vận hành
- Đảm bảo hệ thống chạy đúng, ổn định.
- Đảm bảo các chức năng đáp ứng yêu cầu về nghiệp vụ về hệ thống.

## **1.2 Phạm vi kiểm thử**

- Danh sách các tính năng kiểm thử bao gồm list các US bên dưới (232 US)

## **1.3 Các hạng mục kiểm thử theo lộ trình dự án**

Theo chiến lược triển khai theo từng giai đoạn của dự án, các hạng mục kiểm thử dưới đây sẽ được thực hiện bởi các nhóm chuyên trách hoặc trong các giai đoạn tiếp theo, trước khi hệ thống vận hành chính thức với các đối tác.

- Kiểm thử trên các loại trình duyệt đối với Siumlator không ưu tiên thực hiện
- Kiểm thử các phần thiết kế DB so với thực thế (phần này đội DEV đã thực hiện)
- **Kiểm thử Bảo mật (Security Testing):**

  - **Đơn vị thực hiện:** Đội Bảo mật.
- **Kiểm thử OAT trên môi trường PRD (OAT Hardware Testing):**

  - **Đơn vị thực hiện:** Đội Hạ tầng phối hợp với đội PT

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
| 7 | User Accepteance Testing | Kiểm thử chấp nhận người dùng, đảm bảo chức năng thực hiện đúng/ đủ theo yêu cầu |
| 8 | Performance Testing | Kiểm thử hiệu năng hệ thống |
| 9 | Security Testing | Kiểm thử bảo mật hệ thống |
| 10 | OAT Testing | KIểm thử vận hành hệ thống |

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
| [SIMULATOR] | QC/UAT/STAGING | <https://simulator-[SYSTEM_NAME]-qc.ops.[ORG_NAME].mobi/simulator/transfer> |  |
| [WORKFLOW_ENGINE] | QC/UAT/STAGING | <https://[SYSTEM_NAME]-temporal.ops.[ORG_NAME].mobi/namespaces/[SYSTEM_NAME]-qc/workflows> |  |
| API | QC/UAT/STAGING | https://api-[SYSTEM_NAME]-qc.int.[ORG_NAME].mobi/ |  |
|  |  |  |  |

# **3. Kết quả kiểm thử**

## 3.1 Tóm tắt kết quả thực hiện

[Các kịch bản kiểm thử đã thực hiện]([GOOGLE_DOC_LINK])

**Diễn giải:** Con số "100% PASS" thể hiện trạng thái cuối cùng của các kịch bản, sau khi tất cả các lỗi được phát hiện trong quá trình kiểm thử đã được đội ngũ phát triển khắc phục và đội ngũ kiểm thử đã xác nhận lại thành công.

| **STT** | **Loại Test case** | **Tổng số testcase** | **Kết quả thực hiện** | **Ghi chú** |
| --- | --- | --- | --- | --- |
| 1 | Test case Function | **9746** | **9644/9746~ 99.1% PASS**  **~ 0% FAIL**  88 ~ 1.07% N/A là những case không thực hiện do khó giả lập  [Link kết quả test function](https://[CONFLUENCE_DOMAIN]/plugins/servlet/ac/com.infostretch.QmetryTestManager/qtm4j-test-management?project.key=[ORG_NAME]&project.id=[QMETRY_PROJECT_ID]#!/Manage/TestReport) |  |
| 2 | SIT (System Integration Testing) | **2497** | 100% PASS**ED** | Chạy nhiều round test nội bộ và với các [PARTNER] |
| 3 | UAT (User Acceptance Testing) | **925** | 100% PASS**ED** | Chạy nhiều round test nội bộ và với các [PARTNER] |
| 5 | Kết quả test Performance |  | PASSED | **Link chi tiết:** [SYSTEM_NAME]][From 2026 -03-07 TO 2026-03-08] [PROD]PT Result  (Các bài Stress Test và Scale Test chưa thực hiện trong giai đoạn này sẽ bổ sung sau) |
| 6 | Kết quả test OAT | **56**  **145** | 96.4% PASSED  (54/56)  100% PASSED | <[GOOGLE_DOC_LINK]>  <[GOOGLE_DOC_LINK]>  Các case hạ tầng hệ thống |

## 3.2 Tóm tắt lỗi

[Danh sách các lỗi tìm được theo độ nghiêm trọng và độ ưu tiên](https://[CONFLUENCE_DOMAIN]/issues/?filter=49048)

![Ảnh minh họa đã được lược bỏ khi template hóa]([IMAGE_PLACEHOLDER])

✅ Normal — 1,010 bugs (75.5%): Phần lớn lỗi không ảnh hưởng nghiêm trọng đến nghiệp vụ. Hệ thống vận hành ổn định ở mức tổng thể.

- Bug **Major chiếm 14.1%** (~189 bugs) — con số đáng chú ý, cần ưu tiên xử lý để tránh ảnh hưởng nghiệp vụ.
- **Critical có 40 bugs (3%)** — chiếm tỉ lệ nhỏ nhưng ảnh hưởng nhiều đến hệ thống, rủi ro tiềm tàng phát sinh đến các vấn để impact sau khi xử lý
- Bug **None (55)** cần được rà soát lại để gán đúng severity, tránh bỏ sót rủi ro.

![Ảnh minh họa đã được lược bỏ khi template hóa]([IMAGE_PLACEHOLDER])

**Nhận định:**

- **Medium chiếm 73.8%** — phù hợp với phân bố thông thường, tuy nhiên cần kiểm tra lại xem có bug bị đánh priority thấp hơn thực tế không.
- **High + Highest + Critical = 324 bugs (24.2%)** — chiếm gần 1/4 tổng số bug, đây là nhóm cần ưu tiên xử lý trong các sprint và hạn chế ở phase phát triển vì các bug này thường ảnh hưởng nhiều đến luồng xử lý
- **Critical chỉ 13 bugs** — ít hơn so với con số Critical ở severity (40), cho thấy có sự không đồng nhất giữa severity và priority trong quá trình log bug → cần chuẩn hóa lại quy trình định nghĩa mức độ.

**Trạng thái các lỗi**

![Ảnh minh họa đã được lược bỏ khi template hóa]([IMAGE_PLACEHOLDER])

- **Tỷ lệ Closed đạt 88.3%** — đây là tín hiệu tích cực, cho thấy team đã xử lý được phần lớn bug tìm được trong MVP0.
- **156 bug Cancelled (11.7%)** — cần rà soát lý do: là bug duplicate, không tái hiện được, hay bị cancel do thay đổi yêu cầu? Nếu không có lý do rõ ràng, có thể ẩn chứa rủi ro bị bỏ sót.
- ⚠️ **Không có bug nào đang ở trạng thái Open/In Progress** → Toàn bộ 1,337 bug đã được đóng hoặc huỷ, phù hợp với giai đoạn **kết thúc MVP0**.

**Lỗi tìm được trên các môi trường**

![Ảnh minh họa đã được lược bỏ khi template hóa]([IMAGE_PLACEHOLDER])![Ảnh minh họa đã được lược bỏ khi template hóa]([IMAGE_PLACEHOLDER])

**Nhận xét**

- **88.3% bug được phát hiện tại môi trường QC** → phần lớn các bug đã tìm thấy ở môi trường kiểm thử điều này cho thấy quy trình kiểm thử đang bắt lỗi đúng tầng, hạn chế tối đa lỗi lọt lên môi trường cao hơn UAT/Pilot
- **Chỉ 11 bug (0.8%) phát hiện ở UAT** → Rủi ro lỗi nghiệp vụ tại production được kiểm soát tốt.
- 60 bug chưa được gán môi trường với tỷ lệ Cancelled cao nhất (15%). Cần update đầy đủ thông tin để đảm bảo traceability cho hồ sơ dự án và audit sau này.

## **3.3 Đối chiếu với điều kiện kết thúc**

|  |  |  |
| --- | --- | --- |
| **Tiêu chí** | **Kế hoạch đề ra** | **Kết quả thực tế** |
| 1 | Hoàn thành 98% các kịch bản kiểm thử (98% PASS) | **ĐẠT**, 99.1% Testcase function đã được thực hiện trong đó:  100% PASSED, 0% FAILED  0.9% (88 test case) không thực hiện do liên quan đến các case giả lập không thể thao tác trên hệ thống  , link chi tiết xem [Tại đây](https://[JIRA_OR_CONFLUENCE_DOMAIN]/plugins/servlet/ac/com.infostretch.QmetryTestManager/qtm4j-test-management?project.key=[ORG_NAME]&project.id=[QMETRY_PROJECT_ID]#!/Manage/TestCycle)  [Link lưu trữ các kịch bản đã thực hiện và dẫn chứng]([GOOGLE_DRIVE_LINK]) |
| 2 | Hoàn thành 100% luồng SIT | **ĐẠT**, 100% hoàn thành 100% testcase SIT và PASS 100%  Link kịch bản và kết quả test SIT  <[GOOGLE_DRIVE_LINK]>  <[GOOGLE_DRIVE_LINK]> |
| 3 | Hoàn thành 100% luồng UAT | **ĐẠT**, 100% hoàn thành 100% testcase UAT và PASS 100%  Link kịch bản và kết quả test UAT |
| 4 | Không còn tồn đọng bug block, critical | **ĐẠT**, Không còn tồn đọng bug block, critical trước Golive |
| 5 | Bug medium tồn đọng không vượt quá 5% | **ĐẠT**, Không còn tồn đọng |
| 6 | Kết quả Unit Test | **ĐẠT**, UT coverage đạt **77%**  Kết quả chi tiết sheet **Sprint 1(2026) - Release Note** link <[GOOGLE_DOC_LINK]> |
| **KẾT LUẬN** | **KẾT LUẬN** | **ĐẠT 100% so với các điều kiện đã đề ra** |

# **4. Tổng kết và phân tích**

## **4.1 Phân tích & nhận định về chất lượng**

### **4.1.1 Về Functional**

- Các luồng nghiệp vụ đã hoạt động đúng, ổn định, đáp ứng đẩy đủ các yêu cầu của nghiệp vụ
- Các lỗi đã được đóng hết trên bản build trước khi triển khai trên Production
- Không còn tồn đọng các bug chưa được fix
- Với tỷ lệ testcase thực hiện **99.01%**, pass rate **98.95%**, toàn bộ bug đã được Closed và không còn tồn đọng Open bug

**=>  HỆ THỐNG MVP0 ĐÁP ỨNG YÊU CẦU VỀ CHẤT LƯỢNG (FUNCTIONAL REQUIREMENT)**

**Rủi ro còn tồn đọng và kế hoạch giảm thiểu**

Toàn bộ các lỗi phát sinh trong giai đoạn kiểm thử đã được khắc phục.\
Rủi ro còn lại chủ yếu nằm ở 96 test case chưa thể giả lập thực hiện trong môi trường kiểm thử, do đó vẫn có khả năng phát sinh lỗi tiềm ẩn tại các kịch bản này khi vận hành thực tế.

Để giảm thiểu rủi ro, cần xây dựng runbook vận hành nhằm hướng dẫn xử lý các tình huống tương ứng nếu phát sinh trong quá trình vận hành.

### **4.1.2 Về Performance Test**

- **Trong phạm vi quá trình test**

  - Với tài nguyên và cấu hình hiện tại của môi trường PT, hệ thống [SYSTEM_NAME] đạt yêu cầu với các kịch bản PT đề ra, đáp ứng tối thiểu 10 triệu nghiệp vụ/ngày
  - Mức baseline TPS hệ thống có thể xử lý đồng thời và đảm bảo Response time/Error Rate:

    - **Account Inquiry ~ 600 TPS**
    - **[BUSINESS_FLOW] Transfer ~ 400 TPS**
  - Kết quả các bài Stress test & Scale test trước đó đã được update kết quả theo link: [SYSTEM_NAME]][2025-12-27] PT Report
- **Đánh giá rủi ro:**

  - Quá trình thực hiện PT chưa thực hiện được các bài Stress test, Scale test trong một khoảng thời gian dài, tuy nhiên do hệ thống hiện tại vẫn đáp ứng được ngưỡng kế hoạch kinh doanh cho tới tháng 5 nên có thể đánh giá rủi ro ở mức độ **LOW**. PT team sẽ thực hiện các bài bổ sung sau Pilot để đánh giá mức độ toàn diện nhất.
- **Trong vận hành thực tế**

  - Cần giám sát các chỉ số của hệ thống [SYSTEM_NAME] và [PARTNER], bao gồm cả ứng dụng và hạ tầng, để kịp thời xử lý các tình huống phát sinh ảnh hưởng performance
  - Cần các thông tin dự báo và kế hoạch tăng trưởng của nghiệp vụ, để kịp thời điều chỉnh tài nguyên đáp ứng nhu cầu nghiệp vụ và đảm bảo performance

### **4.1.3 Về Security Test**

**4.1.3.a. Infra Security audit (Share Services audit)**

Hệ thống Shared Services đã hoàn tất đánh giá an ninh bảo mật trên 10 dịch vụ trọng yếu với tổng cộng 188 tiêu chí kiểm tra. Kết quả ghi nhận hệ thống có độ tuân thủ cao, đáp ứng các tiêu chuẩn bảo mật cơ bản trước khi vận hành chính thức.

- **Tỷ lệ đạt (Pass Rate):** 94.7% (178/188 tiêu chí).
- **Trạng thái dịch vụ:** 5/10 dịch vụ vượt qua 100% bài kiểm tra; 5 dịch vụ còn lại tồn tại lỗi đơn lẻ (tối đa 1 lỗi/dịch vụ).
- **Mức độ rủi ro:** Không phát hiện lỗ hổng nghiêm trọng (Critical). Các lỗi tồn đọng nằm ở mức High (2 lỗi) và Medium (3 lỗi).

**=> HỆ THỐNG ĐÁP ỨNG YÊU CẦU VỀ AN NINH BẢO MẬT (SECURITY REQUIREMENT).**

**Rủi ro còn tồn đọng**

- **Rủi ro hiện tại:** Tồn đọng 05 lỗi (Fail). Đáng chú ý nhất là **02 lỗi mức High** tiềm ẩn rủi ro lộ lọt dữ liệu và truy cập trái phép:

  - **Keycloak:** Chưa mã hóa cơ sở dữ liệu lúc lưu trữ và truyền tải.
  - **CMC-Cloud:** Chưa thiết lập Whitelist IP (chỉ cho phép IP nội bộ) truy cập Console Portal (Hiện chưa có biện pháp giới hạn).

**Đánh giá rủi ro:**

Mức độ rủi ro tổng thể của hệ thống được đánh giá ở mức **LOW**. Hệ thống đủ điều kiện an toàn cơ bản để triển khai nhờ tỷ lệ Pass cao và không có lỗi Critical. Tuy nhiên, rủi ro cục bộ vẫn hiện hữu do thiếu cấu hình bảo vệ lớp mạng/dữ liệu tại 2 dịch vụ (Keycloak, CMC-Cloud), có thể dẫn đến rò rỉ dữ liệu hoặc truy cập trái phép nếu attacker vượt qua được các lớp phòng thủ vòng ngoài.

**4.1.3.b. Application Security Testing**

[GOLIVE_DATE][GOLIVE_SCOPE] Security Report for Security Tool Scan

[GOLIVE_DATE][GOLIVE_SCOPE] Security Report for Manual Testing NonProd

Hiện vẫn còn một số lỗ hổng CVE mức độ Medium và Low tồn tại trong các thư viện hệ thống đang sử dụng. Bộ phận Security sẽ tiến hành đánh giá và tạo yêu cầu cập nhật trong sprint tiếp theo.

### **4.1.4 Về OAT**

Tổng số test cases do team đề xuất là 226. Tuy nhiên, do thời gian gấp rút nên team xác định không thể hoàn thành tất cả test cases này trước thời điểm golive, nên đã rút số lượng xuống còn 56 test cases có mức độ ưu tiên cao (các cases còn lại sẽ được thực hiện sau 21/03).

Team đã thực hiện 56/56 test cases có mức độ ưu tiên cao, trong đó có 54 cases PASSED và 2 cases FAILED. Cụ thể 2 cases FAILED như sau:

- **Không thể chặn nghiệp vụ một chiều đối với đối tượng nhận:** Hiện tại hệ thống chỉ support chặn chiều phát lệnh hoặc cả hai chiều, chưa có giải pháp kỹ thuật cho việc chặn chiều nhận. Điều này dẫn đến rủi ro [SYSTEM_NAME] sẽ không đáp ứng được yêu cầu khi có sự cố xảy ra (chỉ ảnh hưởng đến việc nhận lệnh của [PARTNER]), hoặc khi có yêu cầu từ [PARTNER] về việc chặn chiều nhận. Biện pháp ngắn hạn là chặn cả hai chiều. Trong dài hạn, dự án cần bổ sung tính năng đầy đủ cho việc chặn chiều nhận.
- Switch SAN controller gây lỗi corrupt data: Hiện tại SAN dùng cho database Oracle đang có 2 controller ở chế độ active - standby. Khi switch chủ động từ active sang standby thì có hiện tượng bị hỏng một số block chứa data. Về vấn đề này, đối tác CMC đã làm việc với hãng HPE để tìm nguyên nhân lỗi. Sau khi rà soát log, HPE và CMC vẫn chưa tìm ra nguyên nhân cụ thể và yêu cầu thực hiện lại test case, tuy nhiên do đã sát ngày golive nên team không thể thực hiện được. Team ghi đã nhận rủi ro cho vấn đề này.

Ngoài ra, trong quá trình thực hiện OAT, team cũng phát hiện vấn đề liên quan đến tốc độ cảnh báo của công cụ New Relic. Với cùng một case, team tiến hành cấu hình cảnh bảo đồng thời trên New Relic và bộ công cụ của Grafana, kết quả cho thấy New Relic cảnh báo chậm hơn khá nhiều. Team đề xuất chuyển một phần các cấu hình cảnh báo từ New Relic sang Grafana để giảm tải cho New Relic và tăng tốc độ nhận cảnh báo.

Về runbook vận hành cho các cases OAT, team sẽ thực hiện sau ngày golive 21/03.

##

# **5. Các tài liệu tham chiếu**

|  |  |  |
| --- | --- | --- |
| **STT** | **Tên tài liệu** | **Link lưu trữ** |
| 1 | Kịch bản kiểm thử chức năng | [Tại đây](https://[CONFLUENCE_DOMAIN]/plugins/servlet/ac/com.infostretch.QmetryTestManager/qtm4j-test-management?project.key=[ORG_NAME]&project.id=[QMETRY_PROJECT_ID]#!/Manage/TestCycle)  [Link lưu trữ các kịch bản đã thực hiện và dẫn chứng]([GOOGLE_DRIVE_LINK]) |
| 2 | Kịch bản kiểm thử SIT | [Link kịch bản và kết quả test SIT]([GOOGLE_DOC_LINK]) |
| 3 | Kết quả chạy UAT | UAT test |








