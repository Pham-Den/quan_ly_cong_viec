---
status: DRAFT
version: v1
sprint: 1
phase: product
sprint_id: sprint-v1
created: 2026-07-18
updated: 2026-07-18 11:20
approved_by:
applied_to_living: false
---

# PRD Proposal — Sprint v1

## New

<!-- ID: PRD-OVERVIEW-001 -->
### Product Overview

#### 1. Executive Summary

API Lab Workflow Orchestration mở rộng API Lab theo quan hệ domain bắt buộc `Workspace belongs_to Host`: mỗi API Workspace thuộc đúng một Host trong System Manager, và mỗi Host có một API Workspace. Developer, Integration Engineer và QA có thể tổ chức API theo collection/folder, cấu hình giá trị theo environment, chạy từng API hoặc ghép tối đa 20 API thành workflow tuần tự. Mỗi step có `step_key` kỹ thuật do hệ thống sinh và bất biến; biến dùng namespace rõ nguồn như `${{step_01.data.customer.id}}`, `${{env.tenant_id}}` hoặc `${{workflow.order_id}}`, có thể kéo-thả từ step trước và không overwrite âm thầm. Mỗi execution cố định (pin) workflow version và environment snapshot tại thời điểm bắt đầu; mọi thay đổi sau thời điểm này chỉ áp dụng cho execution mới.

Phase 1 tập trung vào thực thi tuần tự, khả năng quan sát từng bước, timeout/retry có cấu hình, che credential và lịch sử chạy lại trong 30 ngày. Parallel execution và loop được giữ làm scope `[scheduled v2]`; branch, schedule và webhook trigger chưa được cam kết. Kết quả kỳ vọng là tạo và chạy workflow ba API trong không quá 10 phút và giảm ít nhất 80% thao tác copy/paste dữ liệu giữa API.

#### 2. Problem Statement

**Ai gặp vấn đề:** `PERSONA-001` Developer/Integration Engineer là người khai báo và gọi chuỗi API hằng ngày; `PERSONA-002` QA/Tester cần tái chạy chuỗi để kiểm tra dữ liệu; `PERSONA-003` System Administrator quản lý Host, environment và credential.

**Cách xử lý hiện tại:** Người dùng tổ chức API trong API Lab nhưng Host nằm ở System Manager và phải tự truyền dữ liệu giữa các lần gọi. Khi một chuỗi có nhiều API, họ sao chép field từ response trước sang request sau, tự nhớ environment/credential và khó truy vết bước nào thất bại.

**Chi phí không giải quyết:** Chuỗi gọi khó tái lập, phụ thuộc thao tác thủ công, dễ dùng nhầm giá trị giữa environment và tốn thời gian điều tra lỗi. Baseline phút/chuỗi chưa được đo và được quản lý tại Open Risk `RISK-OPEN-001`.

#### 3. Goals & Success Metrics

##### 3.1 Business Goals

| Mục tiêu | KPI | Baseline | Target | Cách đo |
|---|---|---|---|---|
| Rút ngắn thiết lập chuỗi API | Thời gian từ lúc tạo workflow ba API đến lần chạy thành công đầu tiên | Chưa đo — `RISK-OPEN-001` | ≤ 10 phút | Telemetry từ lúc tạo workflow đến execution thành công đầu tiên |
| Giảm thao tác thủ công | Số thao tác copy/paste dữ liệu giữa các API trong một chuỗi ba bước | Chưa đo — `RISK-OPEN-001` | Giảm ≥ 80% | So sánh quan sát AS-IS với execution workflow |

##### 3.2 User Goals

| Mục tiêu | KPI | Baseline | Target | Cách đo |
|---|---|---|---|---|
| Tạo khả năng tái lập | Tỷ lệ execution có đầy đủ trạng thái và kết quả từng bước | Không có workflow history | 100% execution được lưu đủ metadata trong thời hạn retention | Báo cáo execution history |

#### 4. Business & Process Flows

**AS-IS:** Người dùng chọn Host ở System Manager, chuyển sang API Lab, gọi API thứ nhất, tìm field cần dùng, sao chép sang request API thứ hai và lặp lại. Khi lỗi, họ tự đối chiếu nhiều response rời rạc và không có execution record thống nhất.

**TO-BE:** Người dùng mở API workspace từ Host, chọn environment, tổ chức API trong collection/folder, tạo workflow tuần tự, kéo-thả hoặc nhập expression để ánh xạ output của step đứng trước, validate rồi chạy. Hệ thống pin latest saved workflow version và environment snapshot tại lúc bắt đầu, thực thi theo thứ tự, áp timeout/retry policy, mask đúng field cấu hình, lưu kết quả từng bước và cho phép chạy lại từ history bằng latest state tại thời điểm rerun.

#### 5. Product Scope

**In scope:** `EP-001` API Lab Workflow Orchestration; quan hệ `Workspace belongs_to Host`; environment variables; Host credential; collection/folder/API; chạy API độc lập; workflow tuần tự; immutable system-generated `step_key`; source-qualified variable mapping bằng nhập expression hoặc kéo-thả; chặn mapping ngược/circular; collision validation; timeout theo API; retry theo error class; latest workflow resolution; execution-pinned workflow version và environment snapshot; history/rerun; dependency invalidation khi xóa/đổi HTTP method; manual re-enable sau Host recovery; config-driven masking.

**Out of scope:** Parallel execution `[scheduled v2]`; loop `[scheduled v2]`; branch, schedule, webhook trigger `[post-MVP]`; RBAC chi tiết `[post-MVP]`; response format ngoài JSON `[post-MVP]`; tích hợp trực tiếp với n8n/Postman `[rejected for v1]`.

#### 6. Assumptions & Constraints

| Giả định/ràng buộc | Rủi ro nếu sai | Validate / Change trigger |
|---|---|---|
| Mỗi API Workspace `belongs_to` đúng một Host; mỗi Host có một API Workspace | Data ownership, navigation và dependency invalidation phải thiết kế lại nếu quan hệ không phải 1–1 | Stakeholder đã xác nhận; thay đổi qua `feedback product` hoặc `start change:` sau approval |
| `step_key` kỹ thuật do hệ thống sinh khi thêm step, duy nhất trong workflow và bất biến | Nếu key đổi theo label/API name, expression downstream bị hỏng | Người dùng không được sửa key; đổi tên API/step chỉ đổi label hiển thị |
| Mỗi execution pin latest saved workflow version và environment snapshot tại thời điểm bắt đầu | Nếu dùng live state giữa chừng, cùng execution có thể không tái lập | Stakeholder đã xác nhận; Architecture thiết kế immutable runtime snapshot |
| Sản phẩm chạy trên Web desktop và giao diện tiếng Việt | Cần bổ sung responsive/mobile hoặc localization | PO xác nhận trước Design; revisit khi có yêu cầu platform/ngôn ngữ mới |
| Phase 1 chỉ cần workflow tuần tự | Scope/kiến trúc thay đổi nếu parallel hoặc loop vào v1 | Stakeholder đã xác nhận; thay đổi qua `start change:` |
| Mọi người dùng đã đăng nhập có cùng quyền | Rủi ro truy cập vượt nhu cầu khi mở rộng tổ chức | Revisit khi RBAC được đưa vào scope |
| Response dùng cho mapping là JSON | Không thể map response text/XML/binary | Revisit khi xuất hiện API non-JSON |

**Target platform:** Web desktop.  
**Language:** Tiếng Việt.  
**Capacity target:** tối đa 20 bước/workflow và 20 workflow chạy đồng thời.  
**Responsiveness target:** kết quả được render trong ≤ 1 giây sau khi hệ thống nhận xong response từ API bên ngoài.

#### 7. Cross-Epic Dependencies

Chỉ có một epic trong v1; không có phụ thuộc cross-epic. Epic phụ thuộc vào Host hiện hữu của System Manager và khả năng tổ chức collection/folder của API Lab hiện tại.

#### 8. Dependencies & Integrations

| Hệ thống/đội nhóm | Loại | Vai trò | Hướng dữ liệu | Realtime/Batch | Owner/SLA | Trạng thái | Rủi ro nếu thiếu |
|---|---|---|---|---|---|---|---|
| System Manager | Nội bộ | Nguồn Host mà Workspace bắt buộc `belongs_to`, cùng environment, biến và credential | Hai chiều | Realtime | Chưa chốt — `RISK-OPEN-002` | Hiện hữu | Không thể resolve Workspace về Host hoặc chọn environment |
| API Lab | Nội bộ | Collection/folder/API và màn hình thao tác | Hai chiều | Realtime | Chưa chốt — `RISK-OPEN-002` | Hiện hữu | Không có nơi khai báo và chạy API |
| API đích do người dùng khai báo | Bên ngoài phạm vi quản trị | Nhận request và trả response | Hai chiều | Realtime | Theo từng Host/API | Động | Timeout/lỗi ngoài quyền kiểm soát workflow |

#### 9. Metrics & Tracking

| Sự kiện | Trigger | Thuộc tính không nhạy cảm | KPI |
|---|---|---|---|
| workflow_created | Lưu workflow mới | host_id, step_count | Time-to-first-success |
| workflow_execution_started | Người dùng bắt đầu chạy | workflow_id, environment_id, step_count | Execution volume |
| workflow_execution_finished | Workflow kết thúc | status, duration, failed_step, retry_count | Success/observability |
| step_mapping_failed | Không resolve được input | workflow_id, step_index, variable_name đã mask nếu nhạy cảm | Mapping quality |

Dữ liệu tracking không lưu Host credential raw. Execution input/output chỉ mask các field/path thuộc `sensitive_fields` theo `BR-001`; field chưa được cấu hình sensitive vẫn giữ nguyên và là rủi ro cấu hình được theo dõi tại `RISK-003`.

#### 10. Risks & Mitigation

| ID | Rủi ro | Tác động | Mức độ | Biện pháp | Owner | Trạng thái |
|---|---|---|---|---|---|---|
| RISK-001 | Response lớn hoặc API chậm làm execution kéo dài | UI khó quan sát, tăng tài nguyên | Cao | Timeout cấu hình, giới hạn response ở Architecture, per-step status | Tech Lead | Mở |
| RISK-002 | Mapping field hoặc HTTP method thay đổi ở API upstream | Workflow không còn hợp lệ hoặc execution lỗi | Cao | Đổi method tự chuyển workflow liên quan sang DISABLED; review/validate trước enable | Product + Tech Lead | Mở |
| RISK-003 | `sensitive_fields` cấu hình thiếu làm secret xuất hiện trong request/response/log | Rò rỉ dữ liệu vì hệ thống không tự suy đoán field nhạy cảm | Cao | Credential được cấu hình sensitive mặc định; UI preview danh sách path sẽ mask; Security review config | Security reviewer | Mở |
| RISK-004 | Xóa API/Host hoặc đổi trạng thái Host làm workflow tham chiếu hỏng | Workflow sai hoặc không tái lập | Trung bình | Cảnh báo dependency, chuyển DISABLED và không auto-enable khi Host hoạt động lại | Product | Mở |

#### 10b. Open Risks

| ID | Còn thiếu | Tác động downstream | Default tạm dùng | Ai validate | Hạn chót | Trạng thái |
|---|---|---|---|---|---|---|
| RISK-OPEN-001 | Baseline thời gian và số thao tác copy/paste của chuỗi ba API chưa được đo | Test không thể chứng minh mức cải thiện tương đối; Product chưa có baseline KPI | Target ≤ 10 phút và giảm ≥ 80% đã được chấp nhận | PO + nhóm người dùng thử | Trước `approve test` | Mở |
| RISK-OPEN-002 | Deadline, quy mô team và owner/SLA nội bộ chưa chốt | Plan chưa thể lập lịch/capacity và ownership chính xác | Không giả định deadline/team | PO + Delivery Lead | Trước `start plan` | Mở |

#### 11. Open Questions

Không còn câu hỏi cản trở scope Product v1. Chi tiết giới hạn response, lưu trữ payload và chiến lược masking thuộc Architecture nhưng phải tuân `BR-001` và các target đã chốt.

#### 12. Living Truth Cross-Reference

| File đích | Nội dung proposal hiện tại |
|---|---|
| `/docs/product/prd.md` | `PRD-OVERVIEW-001`, `BR-001` đến `BR-011` |
| `/docs/product/personas.md` | `PERSONA-001` đến `PERSONA-003` |
| `/docs/product/glossary.md` | `GLOSS-001` đến `GLOSS-010` |
| `/docs/product/market-research.md` | `MR-001` |
| `/docs/product/epics/EP-001-api-lab-workflow-orchestration.md` | `EP-001`, `FR-001` đến `FR-012`, `US-001` đến `US-010` và AC liên quan |

#### 13. Industry Checklist Decisions

- `[industry-standard]` Giữ collection/folder/API làm mô hình tổ chức canonical.
- `[industry-standard]` Mọi execution lưu trạng thái, thời gian và kết quả từng bước.
- `[industry-standard]` Credential/secret được mask khỏi UI, log, history và telemetry khi field/path nằm trong `sensitive_fields`; không mask heuristic ngoài cấu hình.
- `[common]` Workflow chặn tham chiếu tới bước không tồn tại, chính step hiện tại hoặc bước đứng sau; mapping ngược/circular không thể lưu.
- `[common]` Timeout/retry có cấu hình và failure policy rõ ràng.
- `[common]` Xóa API/Host hoặc đổi HTTP method API cảnh báo dependency và vô hiệu hóa workflow; Host hoạt động lại không tự bật workflow.
- `[common]` Quyền xem/sửa/chạy phải được tuyên bố; v1 chọn quyền đồng nhất cho user đã đăng nhập.
- `[niche]` Parallel/loop là hướng mở rộng v2, không được ngầm đưa vào v1.

#### Appendix

N/A — Product v1 chưa có asset hoặc nghiên cứu bổ sung ngoài các proposal và nguồn stakeholder đã được liên kết ở trên.

<!-- ID: BR-001 -->
### BR-001: Credential và dữ liệu nhạy cảm theo Host environment

- **Statement:** Mỗi environment của một Host có bộ credential riêng. Mọi API thuộc Host kế thừa credential của environment được chọn; API không được override credential. Hệ thống chỉ mask các request/response field hoặc JSON path có trong cấu hình `sensitive_fields`; không tự suy đoán theo tên. Host credential được đưa vào cấu hình sensitive mặc định. Field không cấu hình được hiển thị/lưu nguyên giá trị.
- **Entities liên quan:** Host, Environment, API, Execution.
- **Nguồn gốc:** Quyết định stakeholder cho task `API_Lab_workflow_orchestration`.
- **Ngoại lệ/Change trigger:** Revisit nếu có nhu cầu credential riêng từng API.
- **Trace:** FR-002, FR-004, FR-012, US-002, US-003, US-010.

<!-- ID: BR-002 -->
### BR-002: Schema biến nhất quán giữa environment

- **Statement:** Tất cả environment trong cùng Host phải có cùng tập tên biến. Mỗi environment có giá trị riêng; thiếu giá trị bắt buộc làm validation thất bại và chặn execution.
- **Entities liên quan:** Host, Environment, Variable.
- **Nguồn gốc:** Quyết định stakeholder.
- **Ngoại lệ/Change trigger:** Revisit nếu cho phép schema biến phân nhánh theo environment.
- **Trace:** FR-002, FR-007, US-002, US-006.

<!-- ID: BR-003 -->
### BR-003: Thực thi tuần tự trong phase 1

- **Statement:** Workflow v1 thực thi step theo thứ tự tăng dần; step tiếp theo chỉ bắt đầu khi step hiện tại thành công. Mỗi step có `step_key` kỹ thuật duy nhất do hệ thống sinh khi thêm step và bất biến trong mọi saved version; đổi API/step label không đổi key. Output step dùng namespace `${{step_key.variable}}`, ví dụ `${{step_01.data.customer.id}}`; environment dùng `${{env.variable}}`; workflow dùng `${{workflow.variable}}`. Một step có thể tham chiếu bất kỳ step_key đứng trước, không chỉ step liền kề. Người dùng có thể kéo-thả một field JSON của step đứng trước vào input step sau để hệ thống tạo expression tương ứng. Tham chiếu step hiện tại/đứng sau, mapping ngược tạo circular dependency hoặc expression không chỉ rõ namespace không hợp lệ. Parallel và loop không hợp lệ trong v1.
- **Entities liên quan:** Workflow, Workflow Step, Execution.
- **Nguồn gốc:** Scope v1 được stakeholder chấp nhận.
- **Ngoại lệ/Change trigger:** Parallel và loop `[scheduled v2]` phải đi qua sprint Product mới.
- **Trace:** FR-006, FR-008, US-004, US-005, US-007.

<!-- ID: BR-004 -->
### BR-004: Timeout và retry có giới hạn

- **Statement:** Timeout được cấu hình theo từng API; API chưa có giá trị kế thừa Host default 30 giây, và workflow step không override timeout. API đang lỗi được retry 0–5 lần với delay mặc định 1 giây chỉ khi timeout, DNS/network/connect error, connection reset, HTTP 408, 429 hoặc 5xx. Mapping/config error và HTTP 4xx khác không retry. Retry chỉ gọi lại API step đang lỗi, không chạy lại step trước. Hết retry làm Execution dừng và chuyển FAILED; Workflow definition giữ nguyên READY nếu dependency/config vẫn hợp lệ.
- **Entities liên quan:** Host, API, Workflow Step, Execution.
- **Nguồn gốc:** Quyết định stakeholder.
- **Ngoại lệ/Change trigger:** Mọi thay đổi giới hạn phải được đánh giá lại ở Architecture/NFR.
- **Trace:** FR-009, US-008.

<!-- ID: BR-005 -->
### BR-005: Dependency bị xóa hoặc đổi contract làm workflow vô hiệu

- **Statement:** Trước khi xóa API/Host hoặc đổi HTTP method của API, hệ thống phải hiển thị danh sách workflow bị ảnh hưởng và yêu cầu xác nhận. Sau khi xác nhận, mọi workflow tham chiếu dependency đó chuyển sang DISABLED. Workflow chỉ được bật lại thủ công sau khi người dùng review mapping/request contract, sửa dependency nếu cần và validation sạch.
- **Entities liên quan:** Host, API, Workflow.
- **Nguồn gốc:** Quyết định stakeholder.
- **Ngoại lệ/Change trigger:** Không có trong v1.
- **Trace:** FR-007, FR-011, US-006, US-009.

<!-- ID: BR-006 -->
### BR-006: Host không hoạt động chặn execution

- **Statement:** Mỗi Workspace `belongs_to` đúng một Host và kế thừa trạng thái khả dụng của Host đó. Host ở trạng thái INACTIVE hoặc DELETED không cho phép chạy API/workflow và chuyển workflow liên quan sang DISABLED. Khi Host chuyển lại ACTIVE, workflow vẫn DISABLED; người dùng phải review, chạy validation và chủ động enable. Xóa Host vô hiệu hóa Workspace/workflow nhưng execution history vẫn được giữ đến hết retention.
- **Entities liên quan:** Host, API Workspace, Workflow, Execution.
- **Nguồn gốc:** Quyết định stakeholder.
- **Ngoại lệ/Change trigger:** Revisit nếu System Manager bổ sung trạng thái Host mới.
- **Trace:** FR-001, FR-011, US-001, US-009.

<!-- ID: BR-007 -->
### BR-007: Execution history giữ 30 ngày

- **Statement:** Mỗi execution lưu người chạy, environment, workflow version resolved, snapshot timestamp, trạng thái, duration, input/output đã mask theo cấu hình, retry và lỗi cuối của từng step trong 30 ngày. Rerun luôn resolve latest saved workflow version và snapshot environment hiện hành sau validation; không chạy lại bằng version/snapshot cũ.
- **Entities liên quan:** Workflow, Execution, Step Execution.
- **Nguồn gốc:** Quyết định stakeholder.
- **Ngoại lệ/Change trigger:** Revisit khi có retention policy cấp tổ chức.
- **Trace:** FR-010, FR-012, US-007, US-010.

<!-- ID: BR-008 -->
### BR-008: Quyền đồng nhất cho người dùng đã đăng nhập

- **Statement:** Trong v1, mọi người dùng đã đăng nhập có thể xem, tạo, sửa, xóa và chạy Host API workspace/workflow. Hệ thống không cung cấp RBAC chi tiết nhưng execution vẫn ghi nhận người khởi chạy.
- **Entities liên quan:** User, Host, API, Workflow, Execution.
- **Nguồn gốc:** Scope stakeholder.
- **Ngoại lệ/Change trigger:** Revisit trước khi mở cho nhóm có yêu cầu phân quyền khác nhau.
- **Trace:** FR-001, FR-003, FR-008, FR-010; US-001, US-004, US-010.

<!-- ID: BR-009 -->
### BR-009: Latest workflow được cố định cho mỗi execution

- **Statement:** Mỗi execution cố định (pin) workflow version và environment snapshot tại thời điểm bắt đầu; mọi thay đổi sau thời điểm này chỉ áp dụng cho execution mới. Hệ thống resolve latest saved workflow version khi bắt đầu; phase 1 không cho chọn hoặc rollback version cũ, và rerun dùng latest version tại thời điểm rerun.
- **Entities liên quan:** Workflow, Workflow Version, Execution.
- **Nguồn gốc:** Feedback stakeholder.
- **Ngoại lệ/Change trigger:** Revisit nếu cần chạy/rollback version lịch sử.
- **Trace:** FR-008, FR-010; US-007, US-010.

<!-- ID: BR-010 -->
### BR-010: Snapshot environment tại execution start

- **Statement:** Execution snapshot toàn bộ environment values và credential tại thời điểm bắt đầu; snapshot bất biến trong lần chạy. History chỉ lưu environment ID, snapshot timestamp và giá trị đã mask, không lưu raw credential. Rerun tạo snapshot mới từ environment hiện hành.
- **Entities liên quan:** Environment, Credential, Execution.
- **Nguồn gốc:** Feedback stakeholder.
- **Ngoại lệ/Change trigger:** Revisit nếu audit yêu cầu encrypted immutable secret snapshot.
- **Trace:** FR-002, FR-008, FR-010, FR-012; US-002, US-007, US-010.

<!-- ID: BR-011 -->
### BR-011: Variable namespace không overwrite

- **Statement:** Mỗi workflow step có `step_key` kỹ thuật duy nhất do hệ thống sinh khi thêm step và bất biến; người dùng không thể nhập/sửa key, và đổi API/step label không đổi key. Step output, environment và workflow variables dùng namespace riêng; trùng biến trong cùng namespace, expression thiếu/không resolve namespace, hoặc tham chiếu step hiện tại/đứng sau là validation error và chặn execution. Không có last-write-wins, overwrite âm thầm hoặc circular mapping.
- **Entities liên quan:** Workflow Step, Variable, Mapping.
- **Nguồn gốc:** Feedback stakeholder.
- **Ngoại lệ/Change trigger:** Revisit nếu bổ sung scope/alias variable.
- **Trace:** FR-006, FR-007; US-005, US-006.

#### Entity Lifecycle State Machines

**Host:** `ACTIVE -> INACTIVE` khi System Administrator vô hiệu hóa; transition này chuyển workflow liên quan sang DISABLED. `INACTIVE -> ACTIVE` khi Administrator kích hoạt lại, nhưng workflow vẫn DISABLED theo luồng `Host ACTIVE -> user review -> validation sạch -> user enable -> READY`. `ACTIVE|INACTIVE -> DELETED` chỉ sau impact preview và xác nhận; `DELETED -> ACTIVE` không hợp lệ trong v1. Không có timeout/expiry tự động cho Host. Trace: `BR-005`, `BR-006`; `FR-001`, `FR-011`; `US-001`, `US-009`.

**Workflow definition:** Chỉ sở hữu trạng thái cấu hình `DRAFT`, `READY`, `DISABLED`; trạng thái của một lần chạy thuộc Execution. `DRAFT -> READY` khi người dùng chạy validation sạch. `DRAFT|READY -> DISABLED` khi dependency mất, API đổi HTTP method, Host chuyển INACTIVE/DELETED hoặc người dùng vô hiệu hóa. `DISABLED -> READY` chỉ khi dependency/Host hợp lệ, người dùng review, validation sạch và chủ động enable; Host ACTIVE không tự gây transition. `DISABLED -> RUNNING` không hợp lệ vì Workflow definition không có trạng thái RUNNING. Không có timeout/expiry cho definition; retry chỉ áp dụng cho step trong Execution. Trace: `BR-003`, `BR-005`, `BR-006`, `BR-009`; `FR-006` đến `FR-011`; `US-004` đến `US-010`.

**Execution:** `PENDING -> RUNNING` khi người dùng chạy một Workflow READY; tại transition này hệ thống pin latest workflow version và environment snapshot. `RUNNING -> SUCCEEDED` khi tất cả step thành công; `RUNNING -> FAILED` khi step hiện tại hết retry hoặc gặp lỗi không retryable. `SUCCEEDED|FAILED -> RUNNING` không hợp lệ; rerun tạo Execution PENDING mới và giữ liên kết với Execution nguồn. V1 không hỗ trợ cancel execution; execution không tự expiry, còn retry/timeout tuân `BR-004` và history retention tuân `BR-007`. Trace: `BR-004`, `BR-007`, `BR-009`, `BR-010`; `FR-008` đến `FR-010`; `US-007`, `US-008`, `US-010`.

## Updated

## Removed

### Self-Review Checklist

- [x] `PRD-OVERVIEW-001` bao phủ problem, KPI, scope, flow, assumptions, dependencies, risks và open questions.
- [x] Business rules có ID ổn định và trace tới FR/US.
- [x] Lifecycle Host/Workflow/Execution có state, transition, invalid transition và retry/retention.
- [x] `PROD-2`, `PROD-3`, `PROD-5` được thể hiện rõ.
