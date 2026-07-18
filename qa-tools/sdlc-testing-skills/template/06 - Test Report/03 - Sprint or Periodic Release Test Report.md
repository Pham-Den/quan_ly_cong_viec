> **Hướng dẫn sử dụng template:** Dùng cho báo cáo kiểm thử sprint hoặc các đợt đẩy định kỳ. Mẫu này tập trung vào Functional, SIT, Regression, Smoke/Sanity, UAT nếu có; Security/Performance/OAT chỉ ghi nhận khi thật sự nằm trong phạm vi sprint hoặc có báo cáo riêng từ đội chuyên trách.

# Sprint or Periodic Release Test Report

> **Mục đích sử dụng:** Dùng cho các đợt release định kỳ, hotfix, sprint release hoặc deployment nhỏ chưa phải mốc pilot/golive chính thức.

# **1. Tổng quan kiểm thử**

## 1.1 Mục tiêu kiểm thử

- Kiểm thử các tính năng/task thuộc phạm vi `[SPRINT_OR_RELEASE_NAME]`.
- Đảm bảo các thay đổi mới hoạt động đúng theo User Story/PRD.
- Đảm bảo các chức năng cũ bị ảnh hưởng vẫn hoạt động ổn định sau thay đổi.
- Xác nhận bản build đủ điều kiện để deploy/chuyển giai đoạn theo phạm vi đã thống nhất.

## **1.2 Phạm vi kiểm thử**

- Danh sách tính năng/task kiểm thử: `[LIST_FEATURE_OR_TICKET_SCOPE]`.
- Các module/API/giao diện có thay đổi: `[MODULE_OR_API_SCOPE]`.
- Các luồng cần regression/smoke: `[REGRESSION_OR_SMOKE_SCOPE]`.
- Môi trường thực hiện: `[ENV]`.

## **1.3 Các hạng mục ngoài phạm vi hoặc thực hiện riêng**

| **Hạng mục** | **Trạng thái** | **Ghi chú** |
| --- | --- | --- |
| Security Testing | [OUT_OF_SCOPE/REPORT_SEPARATELY/IN_SCOPE] | Chỉ cập nhật khi sprint có scope security hoặc có report riêng |
| Performance Testing | [OUT_OF_SCOPE/REPORT_SEPARATELY/IN_SCOPE] | Chỉ cập nhật khi có thay đổi ảnh hưởng hiệu năng hoặc có test riêng |
| OAT Testing | [OUT_OF_SCOPE/REPORT_SEPARATELY/IN_SCOPE] | Chỉ áp dụng cho thay đổi liên quan vận hành/hạ tầng |
| Compatibility Testing | [OUT_OF_SCOPE/IN_SCOPE] | Ghi rõ browser/device nếu có |

## 1.4 Các loại kiểm thử thực hiện

| **STT** | **Loại kiểm thử** | **Mục đích** | **Kết quả/Tình trạng** |
| --- | --- | --- | --- |
| 1 | Functional Testing | Kiểm tra tính năng có đáp ứng đúng User Story/PRD | [DONE/NOT_DONE] |
| 2 | Integration Testing | Kiểm tra tích hợp giữa module/API/service liên quan | [DONE/NOT_DONE] |
| 3 | SIT | Kiểm tra luồng end-to-end trong phạm vi thay đổi | [DONE/NOT_DONE] |
| 4 | Smoke Testing | Kiểm tra nhanh chức năng cốt lõi sau deploy | [DONE/NOT_DONE] |
| 5 | Sanity Testing | Kiểm tra bản fix/thay đổi nhỏ có hoạt động đúng | [DONE/NOT_DONE] |
| 6 | Regression Testing | Kiểm tra chức năng cũ bị ảnh hưởng bởi thay đổi | [DONE/NOT_DONE] |
| 7 | UAT | Kiểm thử chấp nhận người dùng nếu sprint có UAT | [DONE/NOT_DONE] |

# **2. Công cụ, môi trường kiểm thử**

## 2.1 Công cụ kiểm thử

| **Activities** | **Tools** | **Version** | **Note** |
| --- | --- | --- | --- |
| Quản lý test case | QMetry/Google Sheet/[TEST_MANAGEMENT_TOOL] | [VERSION] | [NOTE] |
| Kiểm soát lỗi | Jira/[DEFECT_TOOL] | [VERSION] | [BOARD_OR_FILTER] |
| Kiểm thử API | Postman/[API_TEST_TOOL] | [VERSION] | [COLLECTION_OR_ENV] |
| Kiểm thử tự động | Robot Framework/[Automation_TOOL] | [VERSION] | Nếu có Automation |
| Kiểm tra DB/log | SQL client/[LOG_TOOL] | [VERSION] | Nếu cần verify dữ liệu/log |
| Trình duyệt | Chrome/Edge/Firefox | [VERSION] | Nếu có UI testing |

## 2.2 Môi trường kiểm thử

| **Hệ thống** | **Môi trường** | **Link** | **Note** |
| --- | --- | --- | --- |
| [SYSTEM_UNDER_TEST] | [ENV] | [URL] | Môi trường chính |
| [API_GATEWAY_OR_SERVICE] | [ENV] | [URL] | API/service được test |
| [WORKFLOW_OR_JOB_MONITOR] | [ENV] | [URL] | Theo dõi workflow/job nếu có |
| [SIMULATOR_OR_STUB] | [ENV] | [URL] | Giả lập hệ thống/đối tác nếu cần |
| [DATABASE_OR_LOGGING] | [ENV] | [URL_OR_ACCESS] | Kiểm tra dữ liệu/log nếu cần |

# **3. Kết quả kiểm thử**

## 3.1 Tóm tắt kết quả thực hiện

**Diễn giải:** Con số PASS thể hiện trạng thái cuối cùng của testcase sau khi lỗi đã được fix và QC đã retest thành công. Các testcase không thực hiện cần ghi rõ lý do ở cột ghi chú.

| **STT** | **Loại Test case** | **Tổng số testcase** | **Kết quả thực hiện** | **Ghi chú** |
| --- | --- | --- | --- | --- |
| 1 | Test case Function | [TOTAL] | [PASSED]/[TOTAL] ~ [PASS_RATE]% PASS; [FAILED] FAIL; [NA] N/A | [NOTE] |
| 2 | SIT | [TOTAL] | [PASSED]/[TOTAL] ~ [PASS_RATE]% PASS | [NOTE] |
| 3 | Regression | [TOTAL] | [PASSED]/[TOTAL] ~ [PASS_RATE]% PASS | [NOTE] |
| 4 | Smoke/Sanity | [TOTAL] | [PASSED]/[TOTAL] ~ [PASS_RATE]% PASS | [NOTE] |
| 5 | UAT | [TOTAL] | [PASSED]/[TOTAL] ~ [PASS_RATE]% PASS | Nếu có UAT |
|  | **Tổng** | **[TOTAL_TESTCASE]** | **[OVERALL_RESULT]** |  |

## 3.2 Tóm tắt lỗi

| **Severity/Priority** | **Total** | **Open** | **In Progress** | **Resolved/Closed** | **Cancelled/Rejected** | **Ghi chú** |
| --- | --- | --- | --- | --- | --- | --- |
| Blocker/Critical | [N] | [N] | [N] | [N] | [N] | [NOTE] |
| High/Major | [N] | [N] | [N] | [N] | [N] | [NOTE] |
| Medium/Normal | [N] | [N] | [N] | [N] | [N] | [NOTE] |
| Low/Minor | [N] | [N] | [N] | [N] | [N] | [NOTE] |
| **Total** | **[N]** | **[N]** | **[N]** | **[N]** | **[N]** |  |

### **Nhận xét tổng hợp**

- Tỷ lệ lỗi ưu tiên cao: `[HIGH_PRIORITY_BUG_RATE]%`.
- Tỷ lệ lỗi đã đóng: `[CLOSED_BUG_RATE]%`.
- Không còn bug Blocker/Critical/High open trước khi deploy/chuyển giai đoạn: `[YES/NO]`.
- Các bug còn lại đã có phương án xử lý hoặc được thống nhất đưa sang sprint sau: `[YES/NO]`.

## **3.3 Đối chiếu với điều kiện kết thúc**

| **Tiêu chí** | **Kế hoạch đề ra** | **Kết quả thực tế** | **Đánh giá** |
| --- | --- | --- | --- |
| Hoàn thành testcase trong scope | [TARGET]% testcase được thực hiện hoặc có lý do N/A rõ ràng | [ACTUAL] | [ĐẠT/KHÔNG ĐẠT] |
| Pass rate | Tối thiểu [PASS_RATE_TARGET]% PASS | [ACTUAL_PASS_RATE]% | [ĐẠT/KHÔNG ĐẠT] |
| Bug Blocker/Critical/High | Không còn tồn đọng trước deploy/chuyển giai đoạn | [ACTUAL] | [ĐẠT/KHÔNG ĐẠT] |
| Bug Medium/Low tồn đọng | Không vượt quá [THRESHOLD]% và có thống nhất xử lý | [ACTUAL] | [ĐẠT/KHÔNG ĐẠT] |
| Smoke/Regression | Kết quả đạt yêu cầu cho build cuối | [ACTUAL] | [ĐẠT/KHÔNG ĐẠT] |
| Evidence/Traceability | Test evidence, defect, test cycle cập nhật đầy đủ | [ACTUAL] | [ĐẠT/KHÔNG ĐẠT] |
| **KẾT LUẬN** | **[EXPECTED_RELEASE_OR_SPRINT_GATE]** | **[SUMMARY]** | **[ĐẠT/KHÔNG ĐẠT]** |

# **4. Tổng kết và phân tích**

## **4.1 Phân tích & nhận định về chất lượng**

- Các chức năng trong phạm vi `[SPRINT_OR_RELEASE_NAME]` đã `[ĐẠT/CHƯA ĐẠT]` yêu cầu.
- Các lỗi hợp lệ đã được xử lý ở mức `[BUG_RESOLUTION_STATUS]`.
- Kết quả smoke/regression cho thấy build `[STABLE/NOT_STABLE]` để `[DEPLOY_OR_NEXT_PHASE_DECISION]`.
- Các testcase N/A hoặc chưa thực hiện: `[NA_TESTCASE_SUMMARY]`.

**=> KẾT LUẬN CHẤT LƯỢNG:** `[BUILD_OR_SPRINT_QUALITY_CONCLUSION]`

## 4.2 Rủi ro còn tồn đọng và kế hoạch giảm thiểu

| **Rủi ro** | **Tác động tiềm tàng** | **Kế hoạch giảm thiểu** | **Owner** | **Due date** |
| --- | --- | --- | --- | --- |
| [RISK_1] | [IMPACT] | [MITIGATION] | [OWNER] | [DATE] |
| [RISK_2] | [IMPACT] | [MITIGATION] | [OWNER] | [DATE] |
| [RISK_3] | [IMPACT] | [MITIGATION] | [OWNER] | [DATE] |

## 4.3 Bài học kinh nghiệm

| **STT** | **Nội dung** | **Nguyên nhân** | **Đề xuất** |
| --- | --- | --- | --- |
| 1 | [LESSON_LEARNED_1] | [ROOT_CAUSE] | [ACTION] |
| 2 | [LESSON_LEARNED_2] | [ROOT_CAUSE] | [ACTION] |
| 3 | [LESSON_LEARNED_3] | [ROOT_CAUSE] | [ACTION] |

# **5. Các tài liệu tham chiếu**

| **STT** | **Tên tài liệu** | **Link lưu trữ** | **Ghi chú** |
| --- | --- | --- | --- |
| 1 | Requirement/PRD/User Story | [LINK] | Scope đã test |
| 2 | Test case/Test cycle | [LINK] | Kết quả execution |
| 3 | Defect list/Jira filter | [LINK] | Danh sách lỗi |
| 4 | Regression/Smoke evidence | [LINK] | Evidence chạy test |
| 5 | Release note/Deployment note | [LINK] | Nếu report phục vụ deploy |




