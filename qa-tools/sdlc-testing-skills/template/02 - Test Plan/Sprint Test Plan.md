> **Hướng dẫn sử dụng template:** Template này được chuẩn hóa từ format Sprint Test Plan trong bộ mẫu gốc. Khi dùng cho dự án mới, thay các placeholder như `[PROJECT_CODE]`, `[SPRINT_NAME]`, `[SYSTEM_NAME]`, `[ENV]`, `[OWNER]`, `[LINK]`; giữ lại cấu trúc bảng, tiêu chí kết thúc và các con số estimate nếu còn phù hợp với sprint.

# Sprint Test Plan

|  |  |
| --- | --- |
| **Project Name** | **[PROJECT_CODE] - [SYSTEM_NAME]** |
| **Sprint/Release** | [SPRINT_NAME] |
| **Date** | From [START_DATE] to [END_DATE] |
| **Version** | [VERSION] |
| **Prepared by** | [QC_LEAD] |

## **1. Tổng quan Sprint**

### 1.1 Mục tiêu kiểm thử

1. Hoàn thành kiểm thử các tính năng/task trong phạm vi sprint.
2. Đảm bảo các chức năng mới đáp ứng đúng yêu cầu trong User Story/PRD.
3. Đảm bảo các luồng tích hợp liên quan hoạt động ổn định trên môi trường kiểm thử.

### 1.2 Phạm vi kiểm thử

- Test các tính năng/task thực hiện trong sprint: `[LIST_FEATURE_OR_TICKET_SCOPE]`.
- Kiểm thử các module/API/giao diện có thay đổi trong sprint.
- Kiểm thử hồi quy các luồng bị ảnh hưởng bởi thay đổi.
- Kiểm thử tích hợp nội bộ hoặc với hệ thống liên quan nếu có thay đổi về contract/data flow.

### 1.3 Ngoài phạm vi kiểm thử

- Các tính năng chưa bàn giao hoặc chưa sẵn sàng môi trường.
- Các hạng mục phi chức năng không nằm trong phạm vi sprint này: `[OUT_OF_SCOPE_NFR]`.
- Các hệ thống bên thứ ba không có môi trường/tài khoản/dữ liệu kiểm thử phù hợp.

### 1.4 Lịch trình kiểm thử

| **Thời gian** | **Các công việc cần làm** | **Ghi chú** |
| --- | --- | --- |
| [DATE_RANGE_1] | Review requirement, làm rõ scope, estimate effort | Ghi rõ link requirement hoặc ticket liên quan |
| [DATE_RANGE_2] | Viết/review test case function, SIT, regression | Ghi rõ nơi lưu test case |
| [DATE_RANGE_3] | Thực hiện test function các ticket | Môi trường `[ENV]` |
| [DATE_RANGE_4] | Thực hiện test tích hợp/SIT | Ghi rõ hệ thống/module tích hợp |
| [DATE_RANGE_5] | Thực hiện regression/smoke/sanity | Áp dụng cho build chuẩn bị release |
| [DATE_RANGE_6] | Tổng hợp kết quả, đối chiếu exit criteria, gửi report | Ghi rõ người nhận/phê duyệt |

### **1.5 Các loại kiểm thử thực hiện**

| **STT** | **Loại kiểm thử** | **Mục đích** | **Ghi chú** |
| --- | --- | --- | --- |
| 1 | Functional Testing | Kiểm tra tính năng mới có đáp ứng đúng yêu cầu trong User Story/PRD không | Bắt buộc với ticket trong sprint |
| 2 | Integration Testing | Kiểm tra tích hợp giữa các module/API/service liên quan | Áp dụng khi có thay đổi contract/data |
| 3 | System Integration Testing (SIT) | Kiểm tra luồng end-to-end qua nhiều thành phần hệ thống | Áp dụng cho luồng nghiệp vụ chính |
| 4 | Smoke Testing | Kiểm tra nhanh các chức năng cốt lõi sau deploy | Thực hiện sau mỗi build/deploy quan trọng |
| 5 | Sanity Testing | Kiểm tra fix bug hoặc thay đổi nhỏ có hoạt động đúng không | Áp dụng sau khi nhận bản fix |
| 6 | Regression Testing | Kiểm tra thay đổi mới có làm ảnh hưởng chức năng đang ổn định không | Ưu tiên luồng bị impact |
| 7 | User Acceptance Testing (UAT) | Kiểm thử chấp nhận người dùng | Nếu sprint có hạng mục UAT |

## **2. Công cụ và môi trường kiểm thử**

### 2.1 Công cụ kiểm thử

| **Activities** | **Tools** | **Version** | **Note** |
| --- | --- | --- | --- |
| Quản lý test case | QMetry/Google Sheet/[TEST_MANAGEMENT_TOOL] | [VERSION] | Ghi rõ project/cycle |
| Kiểm soát lỗi | Jira/[DEFECT_TOOL] | [VERSION] | Ghi rõ board/filter |
| Kiểm thử API | Postman/[API_TEST_TOOL] | [VERSION] | Ghi rõ collection/environment |
| Kiểm thử tự động | Robot Framework/[Automation_TOOL] | [VERSION] | Nếu có Automation trong sprint |
| Kiểm tra DB | SQL client/[DB_TOOL] | [VERSION] | Nếu cần verify dữ liệu |
| Trình duyệt | Chrome/Edge/Firefox | [VERSION] | Nếu có UI testing |

### 2.2 Môi trường và thiết bị kiểm thử

| **Hệ thống** | **Môi trường** | **Link** | **Note** |
| --- | --- | --- | --- |
| [SYSTEM_UNDER_TEST] | [ENV] | [URL] | Môi trường chính để test |
| [API_GATEWAY_OR_SERVICE] | [ENV] | [URL] | API/service cần kiểm thử |
| [WORKFLOW_OR_JOB_MONITOR] | [ENV] | [URL] | Theo dõi workflow/job nếu có |
| [SIMULATOR_OR_STUB] | [ENV] | [URL] | Giả lập hệ thống/đối tác nếu cần |
| [DATABASE_OR_LOGGING] | [ENV] | [URL_OR_ACCESS] | Kiểm tra dữ liệu/log nếu cần |

### 2.3 Điều kiện bắt đầu kiểm thử

- Requirement/User Story đã được review và làm rõ acceptance criteria.
- Build đã deploy thành công lên môi trường kiểm thử.
- Test data, account, quyền truy cập, API collection và tài liệu liên quan đã sẵn sàng.
- Các dependency chính với BA/DEV/Infra/đối tác đã được xác nhận.

## **3. Nguồn lực kiểm thử**

| **STT** | **Name** | **Role** | **Ngày** | **Effort (h)** | **Note** |
| --- | --- | --- | --- | --- | --- |
| 1 | [QC_LEAD] | QC Lead | [N] | [H] | Plan, review, report |
| 2 | [QC_USER_1] | QC | [N] | [H] | Test case, execution |
| 3 | [QC_USER_2] | QC | [N] | [H] | Test case, execution |
| 4 | [Automation_QC] | Automation QC | [N] | [H] | Automation nếu có |
| **Total** |  |  | **[TOTAL_DAYS]** | **[TOTAL_HOURS]** |  |

*Lưu ý: Tính `[WORKING_HOURS_PER_DAY]` giờ làm việc/ngày, trừ thời gian planning, daily, refinement, support release nếu có.*

| **Nhóm công việc** | **Effort dự kiến** | **Ghi chú** |
| --- | --- | --- |
| Review requirement/làm rõ scope | [H] | Ghi rõ đầu mối confirm |
| Viết và review test case function | [H] | Bao gồm update theo review |
| Viết và review test case SIT/regression | [H] | Nếu sprint có SIT/regression |
| Thực hiện test function | [H] | Theo danh sách ticket |
| Thực hiện SIT/regression/smoke | [H] | Theo phạm vi impact |
| Log bug, retest, report | [H] | Bao gồm tổng hợp kết quả |
| **Tổng thời gian thực hiện** | **[TOTAL_EXECUTION_HOURS]** | So sánh với nguồn lực hiện có |

## **4. Điều kiện kết thúc kiểm thử**

- Hoàn thành 100% testcase thuộc phạm vi sprint hoặc có lý do rõ ràng với các testcase không thực hiện được.
- Tỷ lệ pass đạt tối thiểu `[PASS_RATE_TARGET]%` theo kế hoạch.
- Không còn bug Blocker/Critical/High đang open trước khi release hoặc chuyển giai đoạn.
- Các bug còn lại không vượt quá `[MEDIUM_LOW_BUG_THRESHOLD]%` và đã được thống nhất phương án xử lý.
- Kết quả smoke/regression cho build release đạt yêu cầu.
- Test evidence, defect list và test summary report đã được cập nhật đầy đủ.

## **5. Rủi ro và biện pháp giảm thiểu**

| **Rủi ro** | **Mức độ** | **Tác động** | **Biện pháp giảm thiểu** | **Owner** |
| --- | --- | --- | --- | --- |
| Requirement thay đổi trong sprint | [High/Medium/Low] | Ảnh hưởng test case và effort | Chốt scope theo ngày, ghi rõ change log | [OWNER] |
| Môi trường chưa ổn định | [High/Medium/Low] | Block test execution | Smoke môi trường sau deploy, có đầu mối support | [OWNER] |
| Thiếu test data/account/quyền | [High/Medium/Low] | Không chạy được testcase | Chuẩn bị dữ liệu trước execution, tracking dependency | [OWNER] |
| Lỗi phát triển trả fix muộn | [High/Medium/Low] | Không đủ thời gian retest/regression | Ưu tiên bug theo severity/priority, cập nhật daily | [OWNER] |

## **6. Các tài liệu tham khảo**

| **Reference** | **Link** | **Ghi chú** |
| --- | --- | --- |
| Requirement/PRD/User Story | [LINK] | Scope chính của sprint |
| Jira Board/Filter | [LINK] | Danh sách ticket/bug |
| Test Case/Test Cycle | [LINK] | Nơi lưu testcase và kết quả chạy |
| API Collection/Test Data | [LINK] | Nếu có kiểm thử API |
| Release Note/Deployment Note | [LINK] | Nếu sprint có release |




