---
status: APPROVED
version: v1
sprint: 1
phase: product
sprint_id: sprint-v1
created: 2026-07-18
updated: 2026-07-18 11:33
approved_by: khanh-pham
applied_to_living: false
---

# EP-001 Proposal — Sprint v1

## New

<!-- ID: EP-001 -->
### EP-001: API Lab Workflow Orchestration

#### Epic Overview

| Thuộc tính | Giá trị |
|---|---|
| **Priority** | Must |
| **Affected personas** | PERSONA-001, PERSONA-002, PERSONA-003 |
| **KPI contribution** | Workflow ba API ≤ 10 phút; giảm ≥ 80% copy/paste; 100% execution có step evidence |

#### Bối cảnh

- **Hiện tại:** API Lab và System Manager Host chưa tạo thành một luồng cấu hình/thực thi thống nhất; chuỗi API cần truyền dữ liệu thủ công.
- **Mục tiêu:** Tạo API Workspace bắt buộc `belongs_to` Host và workflow tuần tự có mapping, retry, history và masking.
- **Đối tượng hưởng lợi:** Developer/Integration Engineer, QA/Tester và System Administrator.
- **Tính cấp thiết:** Giảm thao tác lỗi-prone và tạo khả năng tái lập/điều tra chuỗi API.

#### Vấn đề cần giải quyết

Người dùng hiện phải chuyển thủ công dữ liệu giữa các API, tự giữ đúng Host/environment/credential và đối chiếu nhiều response rời rạc khi chuỗi lỗi. API Lab và System Manager chưa có một ownership boundary thống nhất, nên thay đổi Host/API có thể làm hỏng workflow mà người dùng không nhận biết trước.

#### Giá trị mang lại

- Người dùng cấu hình một lần và chạy lại chuỗi API theo environment.
- QA có execution record thống nhất thay cho nhiều response rời rạc.
- Administrator thấy impact trước khi xóa Host/API và giữ secret khỏi log/history.

#### Tiêu chí nghiệm thu cấp Epic

- [ ] 100% Must Have FR map tới ít nhất một Must Have US và có AC quan sát được.
- [ ] Người dùng tạo và chạy thành công workflow ba API trong ≤ 10 phút ở usability acceptance session.
- [ ] Workflow tối đa 20 bước chạy đúng thứ tự; step sau không bắt đầu trước khi step trước thành công.
- [ ] Host credential mặc định và mọi field/path được khai báo trong `sensitive_fields` không xuất hiện raw trong UI, log, history hoặc telemetry; field chưa cấu hình sensitive vẫn hiển thị/lưu nguyên giá trị và được quản lý như rủi ro cấu hình.
- [ ] Xóa dependency hoặc đổi HTTP method API chuyển mọi workflow liên quan sang DISABLED và không làm mất history còn retention.
- [ ] Host được bật lại không tự bật workflow; workflow chỉ READY sau khi user review, validation sạch và enable thủ công.

#### Phụ thuộc & Ghi chú

| Loại | Item | Ghi chú |
|---|---|---|
| Depends-on | System Manager Host | Host/environment/credential hiện hữu hoặc được Architecture ánh xạ |
| Depends-on | API Lab collection/folder | Giữ cách tổ chức hiện tại |
| Respects | BR-001 đến BR-011 | Business rules và lifecycle trong PRD proposal |
| Deferred | Parallel, loop | `[scheduled v2]` |

#### Edge cases & câu hỏi mở

- **Edge cases đã chốt:** Host hoạt động lại không auto-enable workflow; API đổi HTTP method làm workflow liên quan DISABLED; mapping chỉ đi từ step trước sang step sau; rerun dùng latest workflow/environment tại thời điểm rerun.
- **Câu hỏi mở:** Không có câu hỏi nghiệp vụ cản trở epic v1. Baseline KPI và owner/SLA nội bộ tiếp tục được quản lý tại `RISK-OPEN-001` và `RISK-OPEN-002` trong PRD proposal.

#### Product Traceability Map

| Epic | FR | Related US | Priority / Coverage | Notes |
|---|---|---|---|---|
| EP-001 | FR-001 | US-001, US-009 | Must / covered | `Workspace belongs_to Host` và kế thừa Host state |
| EP-001 | FR-002 | US-002 | Must / covered | Environment schema/value/credential |
| EP-001 | FR-003 | US-001 | Must / covered | Collection/folder/API organization |
| EP-001 | FR-004 | US-003 | Must / covered | API request definition |
| EP-001 | FR-005 | US-003 | Must / covered | Standalone execution |
| EP-001 | FR-006 | US-004, US-005 | Must / covered | Sequential workflow và mapping |
| EP-001 | FR-007 | US-006 | Must / covered | Pre-run validation |
| EP-001 | FR-008 | US-007 | Must / covered | Sequential run/step status |
| EP-001 | FR-009 | US-008 | Must / covered | Timeout/retry/failure policy |
| EP-001 | FR-010 | US-007, US-010 | Must / covered | History và rerun |
| EP-001 | FR-011 | US-009 | Must / covered | Dependency invalidation |
| EP-001 | FR-012 | US-003, US-007, US-010 | Must / covered | Sensitive-data masking |

<!-- ID: FR-001 -->
<!-- EPIC: EP-001 -->
**FR-001 — Workspace belongs_to Host**

- **Mô tả:** Hệ thống phải bảo đảm mỗi API Workspace `belongs_to` đúng một Host trong System Manager; mỗi Host có một API Workspace và execution chỉ được phép khi Host parent ở trạng thái ACTIVE.
- **Phạm vi:** Mở Workspace từ Host; giữ định danh Host parent; phản ánh trạng thái Host; Workspace chứa nhiều collection/API/workflow.
- **Covered by US:** US-001, US-009.
- **Verifies KPI:** Giảm thời gian chuyển/ngữ cảnh giữa System Manager và API Lab.
- **Ghi chú:** Tuân BR-006.

<!-- ID: FR-002 -->
<!-- EPIC: EP-001 -->
**FR-002 — Quản lý environment, biến và credential theo Host**

- **Mô tả:** Hệ thống phải cho Host có nhiều environment dùng chung schema tên biến nhưng giá trị và credential riêng; execution snapshot environment được chọn tại thời điểm bắt đầu.
- **Phạm vi:** DEV/UAT/PROD mặc định; cho phép environment khác; bắt buộc chọn environment; snapshot bất biến trong execution, rerun dùng snapshot mới.
- **Covered by US:** US-002.
- **Verifies KPI:** Giảm thao tác sửa request khi đổi environment.
- **Ghi chú:** Tuân BR-001, BR-002.

<!-- ID: FR-003 -->
<!-- EPIC: EP-001 -->
**FR-003 — Tổ chức collection, folder và API**

- **Mô tả:** Hệ thống phải cho phép tạo, sửa, sao chép, di chuyển và xóa collection/folder/API trong workspace theo mô hình API Lab hiện tại.
- **Phạm vi:** Cây điều hướng thuộc Host; giữ quan hệ collection/folder/API.
- **Covered by US:** US-001.
- **Verifies KPI:** Tái sử dụng mô hình tổ chức quen thuộc.
- **Ghi chú:** Không thêm import/export trong v1.

<!-- ID: FR-004 -->
<!-- EPIC: EP-001 -->
**FR-004 — Khai báo API request**

- **Mô tả:** Hệ thống phải cho phép khai báo request API với path, query, header, body, timeout riêng và `sensitive_fields`, đồng thời kế thừa base Host và credential của environment.
- **Phạm vi:** API HTTP có response JSON cho mapping v1; timeout fallback Host default 30 giây; request/response sensitive paths cấu hình rõ.
- **Covered by US:** US-003.
- **Verifies KPI:** Chuẩn bị API một lần để tái sử dụng.
- **Ghi chú:** Contract kỹ thuật chi tiết thuộc Architecture.

<!-- ID: FR-005 -->
<!-- EPIC: EP-001 -->
**FR-005 — Chạy API độc lập**

- **Mô tả:** Người dùng phải có thể chọn environment, chạy một API và xem trạng thái, thời gian, request/response trong đó chỉ các field/path thuộc `sensitive_fields` được mask.
- **Phạm vi:** Standalone execution ngoài workflow.
- **Covered by US:** US-003.
- **Verifies KPI:** Hỗ trợ kiểm tra API trước khi ghép workflow.
- **Ghi chú:** Tuân BR-001, BR-004.

<!-- ID: FR-006 -->
<!-- EPIC: EP-001 -->
**FR-006 — Tạo workflow tuần tự và mapping output-input**

- **Mô tả:** Hệ thống phải cho phép sắp xếp tối đa 20 API step theo thứ tự. Khi thêm step, hệ thống sinh `step_key` kỹ thuật duy nhất và bất biến. Mapping dùng namespace `${{step_key.variable}}`, `${{env.variable}}` hoặc `${{workflow.variable}}`; một step có thể tham chiếu bất kỳ step_key đứng trước, không chỉ step liền kề.
- **Phạm vi:** Người dùng không thể sửa `step_key`; đổi API/step label không đổi key; nhập expression hoặc kéo-thả field JSON để map vào path, query, header, body; không tham chiếu step hiện tại/đứng sau, không circular mapping, không overwrite; không branch/loop/parallel trong v1.
- **Covered by US:** US-004, US-005.
- **Verifies KPI:** Workflow ba API ≤ 10 phút; giảm ≥ 80% copy/paste.
- **Ghi chú:** Tuân BR-003.

<!-- ID: FR-007 -->
<!-- EPIC: EP-001 -->
**FR-007 — Validate workflow trước execution**

- **Mô tả:** Hệ thống phải chặn execution nếu workflow có dependency mất/đổi HTTP method, biến bắt buộc thiếu, lỗi sinh `step_key`, trùng biến trong cùng namespace, expression thiếu/không resolve namespace, mapping tới step hiện tại/đứng sau, circular mapping hoặc vượt 20 bước.
- **Phạm vi:** Validation tạo danh sách lỗi gắn step/field/namespace cụ thể; không có last-write-wins.
- **Covered by US:** US-006.
- **Verifies KPI:** Giảm execution thất bại do cấu hình.
- **Ghi chú:** Tuân BR-002, BR-003, BR-005.

<!-- ID: FR-008 -->
<!-- EPIC: EP-001 -->
**FR-008 — Thực thi và quan sát từng step**

- **Mô tả:** Mỗi execution cố định (pin) workflow version và environment snapshot tại thời điểm bắt đầu; mọi thay đổi sau thời điểm này chỉ áp dụng cho execution mới. Hệ thống chạy tuần tự và hiển thị trạng thái, duration, input/output đã mask theo cấu hình của từng step.
- **Phạm vi:** Workflow version và environment snapshot bất biến trong execution; tối đa 20 workflow đồng thời; render kết quả ≤ 1 giây sau khi nhận response.
- **Covered by US:** US-007.
- **Verifies KPI:** 100% execution có step evidence.
- **Ghi chú:** Tuân BR-003, BR-007.

<!-- ID: FR-009 -->
<!-- EPIC: EP-001 -->
**FR-009 — Cấu hình timeout và retry**

- **Mô tả:** Mỗi API có timeout riêng, fallback Host default 30 giây; step không override timeout. Step cấu hình 0–5 retry với delay mặc định 1 giây.
- **Phạm vi:** Retry chỉ API đang lỗi khi timeout/network/connect/reset hoặc HTTP 408/429/5xx; không retry mapping/config và HTTP 4xx khác; hết retry dừng workflow.
- **Covered by US:** US-008.
- **Verifies KPI:** Execution failure rõ ràng và kiểm soát được.
- **Ghi chú:** Tuân BR-004.

<!-- ID: FR-010 -->
<!-- EPIC: EP-001 -->
**FR-010 — Lưu history và chạy lại**

- **Mô tả:** Hệ thống phải lưu execution history 30 ngày và cho phép rerun bằng latest saved workflow version cùng environment snapshot mới sau validation.
- **Phạm vi:** Ghi người chạy, workflow version, environment ID/snapshot timestamp, trạng thái/duration/retry/error từng step; rerun tạo record mới, không dùng snapshot cũ.
- **Covered by US:** US-007, US-010.
- **Verifies KPI:** Khả năng tái lập và truy vết.
- **Ghi chú:** Tuân BR-007.

<!-- ID: FR-011 -->
<!-- EPIC: EP-001 -->
**FR-011 — Cảnh báo và vô hiệu hóa khi dependency thay đổi**

- **Mô tả:** Hệ thống phải hiển thị workflow bị ảnh hưởng trước khi xóa API/Host hoặc đổi HTTP method API và chuyển chúng sang DISABLED sau xác nhận. Host chuyển lại ACTIVE không tự bật workflow.
- **Phạm vi:** Bật lại chỉ sau khi dependency/Host hợp lệ, người dùng review, validation sạch và chủ động enable.
- **Covered by US:** US-009.
- **Verifies KPI:** Không có workflow âm thầm tham chiếu dependency đã mất.
- **Ghi chú:** Tuân BR-005, BR-006.

<!-- ID: FR-012 -->
<!-- EPIC: EP-001 -->
**FR-012 — Mask dữ liệu nhạy cảm**

- **Mô tả:** Hệ thống phải mask đúng credential và request/response field/path nằm trong cấu hình `sensitive_fields` trước khi hiển thị/lưu log/history/telemetry; không tự mask field ngoài cấu hình.
- **Phạm vi:** Standalone API execution và workflow execution; Host credential có sensitive config mặc định.
- **Covered by US:** US-003, US-007, US-010.
- **Verifies KPI:** Host credential và field/path thuộc `sensitive_fields` không lộ raw trong acceptance evidence.
- **Ghi chú:** Tuân BR-001.

<!-- ID: US-001 -->
<!-- EPIC: EP-001 -->
### US-001: Mở và tổ chức API workspace của Host

> Với tư cách là **Developer/Integration Engineer**, tôi muốn mở API Workspace thuộc Host đã chọn và tổ chức collection/folder/API, để mọi API liên quan có đúng một Host parent rõ ràng.

| Thuộc tính | Giá trị |
|---|---|
| **Priority** | Must |
| **Persona** | PERSONA-001 |
| **Covers FR** | FR-001, FR-003 |
| **Respects NFR** | Chưa có Architecture NFR; dùng Product targets trong PRD §6 |
| **Respects BR** | BR-006, BR-008 |
| **Design Reference** | Chưa có design |
| **Scope** | Mở Workspace từ Host; duy trì quan hệ `Workspace belongs_to Host`; CRUD/sao chép/di chuyển collection, folder, API |
| **Out of Scope** | Import/export; RBAC chi tiết |
| **Testability** | Manual UI + integration test; quan sát Host name/state và cây collection/folder/API được lưu |

<!-- ID: AC-001 -->
<!-- US: US-001 -->
**AC-001 (Happy Path)** Host ACTIVE được chọn → trang API Workspace hiển thị đúng tên Host parent, environment selector và cây collection của Workspace `belongs_to` Host đó.

<!-- ID: AC-002 -->
<!-- US: US-001 -->
**AC-002 (Error)** Host INACTIVE được mở → nút “Chạy API” và “Chạy workflow” bị disabled, banner “Host đang không hoạt động. Hãy kích hoạt Host trước khi chạy.” hiển thị.

<!-- ID: AC-003 -->
<!-- US: US-001 -->
**AC-003 (Happy Path)** Người dùng tạo collection “Thanh toán”, folder “Đối soát” và API “Lấy giao dịch” → ba node hiển thị đúng cấp trong cây và vẫn còn sau khi tải lại trang.

| Khía cạnh | Nội dung |
|---|---|
| **Assumption** | Mô hình collection/folder hiện tại tiếp tục là canonical |
| **Validate** | Product + Design đối chiếu API Lab hiện tại trước approve design |
| **Change trigger** | Nếu mô hình cây hiện tại không hỗ trợ Host boundary |

<!-- ID: US-002 -->
<!-- EPIC: EP-001 -->
### US-002: Cấu hình environment và biến theo Host

> Với tư cách là **System Administrator**, tôi muốn định nghĩa một schema biến dùng chung và giá trị/credential riêng cho từng environment, để cùng workflow chạy an toàn trên DEV, UAT và PROD.

| Thuộc tính | Giá trị |
|---|---|
| **Priority** | Must |
| **Persona** | PERSONA-003 |
| **Covers FR** | FR-002 |
| **Respects NFR** | Chưa có Architecture NFR; secret handling sẽ được Architecture cụ thể hóa |
| **Respects BR** | BR-001, BR-002, BR-010 |
| **Design Reference** | Chưa có design |
| **Scope** | CRUD environment; schema biến chung; value/credential theo environment; chọn và snapshot environment khi chạy |
| **Out of Scope** | Schema biến khác nhau theo environment; credential riêng API |
| **Testability** | Manual + integration; kiểm tra schema đồng nhất, value thay đổi theo environment và secret bị mask |

<!-- ID: AC-004 -->
<!-- US: US-002 -->
**AC-004 (Happy Path)** Thêm biến `tenant_id` vào Host → DEV, UAT và PROD cùng hiển thị key `tenant_id`, mỗi environment cho nhập giá trị riêng.

<!-- ID: AC-005 -->
<!-- US: US-002 -->
**AC-005 (Error)** Chọn UAT khi biến bắt buộc `tenant_id` chưa có giá trị → execution bị chặn và step liên quan hiển thị “Thiếu giá trị biến tenant_id trong environment UAT.”

<!-- ID: AC-006 -->
<!-- US: US-002 -->
**AC-006 (Happy Path)** Chọn UAT và chạy API “Lấy giao dịch” → execution details hiển thị environment UAT, dùng giá trị UAT của `tenant_id` và hiển thị credential thuộc sensitive config là `••••••••`.

<!-- ID: AC-032 -->
<!-- US: US-002 -->
**AC-032 (Edge)** Execution bắt đầu với `tenant_id=C-001` rồi environment được sửa thành `tenant_id=C-002` trong lúc chạy → mọi step của execution hiện tại tiếp tục dùng snapshot `C-001`; execution mới dùng `C-002`.

| Khía cạnh | Nội dung |
|---|---|
| **Assumption** | DEV/UAT/PROD là environment mặc định nhưng user có thể thêm environment khác |
| **Validate** | Product xác nhận trong Design flow |
| **Change trigger** | Nếu tổ chức yêu cầu immutable environment catalog |

<!-- ID: US-003 -->
<!-- EPIC: EP-001 -->
### US-003: Khai báo và chạy API độc lập

> Với tư cách là **Developer/Integration Engineer**, tôi muốn khai báo và chạy thử một API trong environment đã chọn, để xác nhận request/response trước khi đưa vào workflow.

| Thuộc tính | Giá trị |
|---|---|
| **Priority** | Must |
| **Persona** | PERSONA-001 |
| **Covers FR** | FR-004, FR-005, FR-012 |
| **Respects NFR** | Product target: render ≤ 1 giây sau khi nhận response |
| **Respects BR** | BR-001, BR-004, BR-010 |
| **Design Reference** | Chưa có design |
| **Scope** | Khai báo path/query/header/body/timeout/sensitive_fields; chạy; xem status/duration/request/response |
| **Out of Scope** | Response non-JSON làm nguồn mapping; API-specific credential |
| **Testability** | Integration với stub API; field cấu hình sensitive bị mask, field không cấu hình giữ nguyên, timeout dùng giá trị API |

<!-- ID: AC-007 -->
<!-- US: US-003 -->
**AC-007 (Happy Path)** API “Lấy giao dịch” trả JSON thành công → panel kết quả hiển thị “Thành công”, duration, request resolved và response JSON; các field/path thuộc `sensitive_fields` hiển thị `••••••••`.

<!-- ID: AC-008 -->
<!-- US: US-003 -->
**AC-008 (Error)** API cấu hình timeout 12 giây và API đích không phản hồi → attempt dừng ở 12 giây, panel hiển thị “API hết thời gian chờ sau 12 giây.”; retry áp dụng theo cấu hình API step.

<!-- ID: AC-009 -->
<!-- US: US-003 -->
**AC-009 (Edge)** Response có `token` nằm trong `sensitive_fields` và `customer_name` không nằm trong cấu hình → preview/log/history hiển thị token là `••••••••` nhưng giữ nguyên `customer_name`; hệ thống không tự mask field ngoài cấu hình.

<!-- ID: AC-041 -->
<!-- US: US-003 -->
**AC-041 (Edge)** API độc lập bắt đầu khi environment có `tenant_id=C-001`, sau đó giá trị được sửa thành `C-002` trước khi API trả kết quả → execution hiện tại vẫn hiển thị request resolved bằng snapshot `C-001`; execution mới dùng `C-002`.

| Khía cạnh | Nội dung |
|---|---|
| **Assumption** | API đích dùng HTTP và response JSON cho các case mapping v1 |
| **Validate** | Architecture xác nhận protocol/size limits trước approve arch |
| **Change trigger** | Khi cần SOAP, streaming, binary hoặc XML mapping |

<!-- ID: US-004 -->
<!-- EPIC: EP-001 -->
### US-004: Tạo workflow tuần tự

> Với tư cách là **Developer/Integration Engineer**, tôi muốn thêm và sắp xếp API step theo thứ tự, để định nghĩa một chuỗi tích hợp có thể tái sử dụng.

| Thuộc tính | Giá trị |
|---|---|
| **Priority** | Must |
| **Persona** | PERSONA-001 |
| **Covers FR** | FR-006 |
| **Respects NFR** | Tối đa 20 step/workflow |
| **Respects BR** | BR-003, BR-008, BR-011 |
| **Design Reference** | Chưa có design |
| **Scope** | Tạo/đổi tên workflow; thêm/xóa/sắp xếp tối đa 20 API step; hệ thống sinh `step_key` duy nhất và bất biến |
| **Out of Scope** | Parallel, loop, branch, schedule, webhook |
| **Testability** | UI + persistence test; quan sát thứ tự step sau reload và giới hạn step |

<!-- ID: AC-010 -->
<!-- US: US-004 -->
**AC-010 (Happy Path)** Thêm API A, B, C và kéo thành thứ tự B → A → C → danh sách step lưu đúng thứ tự B, A, C sau khi tải lại trang.

<!-- ID: AC-011 -->
<!-- US: US-004 -->
**AC-011 (Edge)** Workflow đã có 20 step và người dùng thêm step thứ 21 → thao tác bị từ chối, hiển thị “Workflow chỉ hỗ trợ tối đa 20 bước trong phase 1.”

<!-- ID: AC-012 -->
<!-- US: US-004 -->
**AC-012 (Edge)** Mở workflow editor trong phase 1 → editor không hiển thị tùy chọn parallel/loop và scope note hiển thị “Parallel và loop được lên kế hoạch cho v2.”

<!-- ID: AC-034 -->
<!-- US: US-004 -->
**AC-034 (Happy Path)** Thêm một API vào workflow → hệ thống hiển thị `step_key` kỹ thuật duy nhất trong field chỉ đọc và không cung cấp thao tác sửa key.

<!-- ID: AC-038 -->
<!-- US: US-004 -->
**AC-038 (Edge)** Đổi label của step đã được các step sau tham chiếu → `step_key` và mọi expression đang dùng key đó vẫn giữ nguyên sau khi lưu và tải lại workflow.

| Khía cạnh | Nội dung |
|---|---|
| **Assumption** | 20 step đủ cho MVP |
| **Validate** | Đo usage sau v1; Product review trước v2 |
| **Change trigger** | Có workflow hợp lệ cần hơn 20 step |

<!-- ID: US-005 -->
<!-- EPIC: EP-001 -->
### US-005: Map output bước trước vào input bước sau

> Với tư cách là **Developer/Integration Engineer**, tôi muốn kéo-thả hoặc dùng expression có namespace như `${{step_01.data.customer.id}}` để lấy biến từ bất kỳ API step đứng trước, để loại bỏ copy/paste và tránh overwrite, mơ hồ nguồn hoặc circular mapping.

| Thuộc tính | Giá trị |
|---|---|
| **Priority** | Must |
| **Persona** | PERSONA-001 |
| **Covers FR** | FR-006 |
| **Respects NFR** | Chưa có Architecture NFR |
| **Respects BR** | BR-003, BR-011 |
| **Design Reference** | Chưa có design |
| **Scope** | `${{step_key.variable}}`, `${{env.variable}}`, `${{workflow.variable}}`; nhập expression hoặc kéo-thả field JSON; map vào path, query, header, body |
| **Out of Scope** | Expression không namespace; overwrite; tham chiếu step hiện tại/đứng sau; transform code; response non-JSON |
| **Testability** | Integration với response fixture; quan sát resolved request của step sau |

<!-- ID: AC-013 -->
<!-- US: US-005 -->
**AC-013 (Happy Path)** Kéo biến Customer ID có giá trị `C-001` từ step nguồn `step_01` vào path của Step 3 → editor hiển thị expression `${{step_01.data.customer.id}}` và resolved request của Step 3 hiển thị `C-001` dù Step 2 nằm giữa.

<!-- ID: AC-014 -->
<!-- US: US-005 -->
**AC-014 (Error)** Step 3 tham chiếu `${{step_01.data.customer.id}}` nhưng `step_01` không trả field đó → Step 3 không được gọi và hiển thị “Không tìm thấy ${{step_01.data.customer.id}}.”

<!-- ID: AC-015 -->
<!-- US: US-005 -->
**AC-015 (Error)** Người dùng chọn response text/XML làm nguồn mapping → mapping không được lưu và hiển thị “Phase 1 chỉ hỗ trợ mapping từ response JSON.”

<!-- ID: AC-035 -->
<!-- US: US-005 -->
**AC-035 (Error)** Kéo biến của Step 3 vào input Step 2 → editor từ chối lưu mapping và hiển thị “Chỉ được ánh xạ dữ liệu từ bước đứng trước; mapping ngược có thể tạo vòng lặp.”

| Khía cạnh | Nội dung |
|---|---|
| **Assumption** | `step_key` là khóa kỹ thuật do hệ thống sinh, bất biến và được hiển thị trong expression; API/step label là dữ liệu hiển thị độc lập |
| **Validate** | Design usability test với Developer/QA |
| **Change trigger** | Cần transform/condition phức tạp hoặc non-JSON |

<!-- ID: US-006 -->
<!-- EPIC: EP-001 -->
### US-006: Validate workflow trước khi chạy

> Với tư cách là **QA/Tester**, tôi muốn thấy toàn bộ lỗi cấu hình trước execution, để không mất thời gian chạy một workflow chắc chắn thất bại.

| Thuộc tính | Giá trị |
|---|---|
| **Priority** | Must |
| **Persona** | PERSONA-002 |
| **Covers FR** | FR-007 |
| **Respects NFR** | Chưa có Architecture NFR |
| **Respects BR** | BR-002, BR-003, BR-005, BR-011 |
| **Design Reference** | Chưa có design |
| **Scope** | Validate dependency/API method, variable, mapping acyclic, order và step limit; chuyển DRAFT/DISABLED sang READY sau review/enable hợp lệ |
| **Out of Scope** | Gọi thật API đích trong validation |
| **Testability** | Unit/integration với cấu hình hợp lệ/lỗi; quan sát danh sách lỗi theo step/field |

<!-- ID: AC-016 -->
<!-- US: US-006 -->
**AC-016 (Happy Path)** Workflow có dependency, variable và mapping hợp lệ → validation hiển thị “Workflow hợp lệ và sẵn sàng chạy.” và trạng thái chuyển READY.

<!-- ID: AC-017 -->
<!-- US: US-006 -->
**AC-017 (Error)** Environment PROD thiếu hai biến bắt buộc → validation hiển thị hai dòng lỗi riêng, mỗi dòng nêu đúng tên biến và environment; nút “Chạy workflow” bị disabled.

<!-- ID: AC-018 -->
<!-- US: US-006 -->
**AC-018 (Error)** Workflow tham chiếu API đã xóa → validation hiển thị đúng step “API không còn tồn tại. Hãy chọn API thay thế hoặc xóa bước này.” và giữ trạng thái DISABLED.

<!-- ID: AC-033 -->
<!-- US: US-006 -->
**AC-033 (Error)** Persistence/import phát hiện hai step có cùng `step_key` kỹ thuật dù key không thể sửa từ UI → validation hiển thị hai vị trí xung đột với thông báo “Khóa bước bị trùng. Hãy lưu lại hoặc liên hệ quản trị viên.”, chặn execution và không overwrite biến; hệ thống không tự đổi key vì key là bất biến.

<!-- ID: AC-042 -->
<!-- US: US-006 -->
**AC-042 (Error)** Chạy validation khi Step 2 đang tham chiếu biến của Step 3 → validation gắn lỗi vào Step 2, hiển thị “Chỉ được tham chiếu bước đứng trước.” và giữ nút “Chạy workflow” ở trạng thái disabled.

| Khía cạnh | Nội dung |
|---|---|
| **Assumption** | Validation cấu hình không cần gọi API đích |
| **Validate** | Architecture/Test xác nhận danh mục deterministic checks |
| **Change trigger** | Nếu cần preflight network/schema call |

<!-- ID: US-007 -->
<!-- EPIC: EP-001 -->
### US-007: Chạy và theo dõi workflow tuần tự

> Với tư cách là **QA/Tester**, tôi muốn quan sát trạng thái và kết quả từng step trong lúc chạy, để biết chính xác chuỗi thành công hoặc thất bại ở đâu.

| Thuộc tính | Giá trị |
|---|---|
| **Priority** | Must |
| **Persona** | PERSONA-002 |
| **Covers FR** | FR-008, FR-010, FR-012 |
| **Respects NFR** | 20 concurrent workflows; render ≤ 1 giây sau response |
| **Respects BR** | BR-001, BR-003, BR-007, BR-009, BR-010 |
| **Design Reference** | Chưa có design |
| **Scope** | Resolve/freeze latest workflow; snapshot environment; sequential status; step duration/input/output/error; tạo history |
| **Out of Scope** | Parallel/loop/scheduled run |
| **Testability** | Integration với stub APIs và controlled config changes; kiểm tra order, frozen version/snapshot, masking theo config và render timing |

<!-- ID: AC-019 -->
<!-- US: US-007 -->
**AC-019 (Happy Path)** Execution ba step đều thành công → step 2 bắt đầu sau step 1 SUCCEEDED, step 3 bắt đầu sau step 2 SUCCEEDED, execution hiển thị SUCCEEDED và mỗi step có duration/input/output mask đúng `sensitive_fields`.

<!-- ID: AC-020 -->
<!-- US: US-007 -->
**AC-020 (Error)** Step 2 chuyển FAILED sau khi hết retry → Step 3 giữ trạng thái “Chưa chạy”, execution hiển thị “Thất bại tại bước 2.” và không gửi request Step 3.

<!-- ID: AC-021 -->
<!-- US: US-007 -->
**AC-021 (Edge)** Hệ thống nhận xong response một step → trạng thái và response đã mask của step xuất hiện trên UI trong ≤ 1 giây.

<!-- ID: AC-031 -->
<!-- US: US-007 -->
**AC-031 (Edge)** Execution bắt đầu bằng latest workflow version v5 rồi workflow được lưu thành v6 trong lúc chạy → execution hiện tại hoàn tất toàn bộ step theo v5; execution mới sau đó resolve v6.

<!-- ID: AC-043 -->
<!-- US: US-007 -->
**AC-043 (Edge)** Workflow execution bắt đầu với `tenant_id=C-001`, sau đó environment được sửa thành `C-002` trong lúc chạy → mọi step còn lại của execution hiện tại tiếp tục hiển thị resolved input từ snapshot `C-001`; execution mới dùng `C-002`.

| Khía cạnh | Nội dung |
|---|---|
| **Assumption** | 20 concurrent workflows là capacity MVP được chấp nhận |
| **Validate** | Architecture đưa vào NFR; Test đo trong target environment |
| **Change trigger** | Peak usage vượt capacity hoặc response streaming |

<!-- ID: US-008 -->
<!-- EPIC: EP-001 -->
### US-008: Cấu hình timeout theo API và retry theo step

> Với tư cách là **Developer/Integration Engineer**, tôi muốn cấu hình timeout theo API và retry theo step cho đúng nhóm lỗi, để xử lý lỗi tạm thời có kiểm soát mà không lặp lại công việc đã thành công.

| Thuộc tính | Giá trị |
|---|---|
| **Priority** | Must |
| **Persona** | PERSONA-001 |
| **Covers FR** | FR-009 |
| **Respects NFR** | Timeout mặc định 30 giây; retry 0–5; delay mặc định 1 giây |
| **Respects BR** | BR-004 |
| **Design Reference** | Chưa có design |
| **Scope** | Timeout theo API với Host fallback; retry count/delay; retryable error classes; chỉ retry API đang lỗi |
| **Out of Scope** | Step override timeout; retry mapping/config; chạy lại step trước; backoff strategy nâng cao |
| **Testability** | Integration với stub fail-N-times/timeout; đếm attempts, delay và final state |

<!-- ID: AC-022 -->
<!-- US: US-008 -->
**AC-022 (Happy Path)** Step cấu hình retry 2 lần và gặp một lỗi tạm thời thuộc nhóm được retry trước khi thành công → chỉ step đó được gọi lại, execution detail hiển thị step SUCCEEDED với “Số lần gọi: 2”, các step trước không chạy lại.

<!-- ID: AC-023 -->
<!-- US: US-008 -->
**AC-023 (Error)** Step cấu hình retry 2 lần và cả ba attempt đều timeout → step FAILED sau attempt thứ ba, history ghi `retry_count: 2`, execution dừng và không chạy lại step trước.

<!-- ID: AC-024 -->
<!-- US: US-008 -->
**AC-024 (Error)** API gặp lỗi validation không thuộc nhóm được retry dù step cấu hình retry 5 lần → không có lần gọi thứ hai, step hiển thị FAILED với lý do “Lỗi không thuộc nhóm được retry.” và execution dừng.

| Khía cạnh | Nội dung |
|---|---|
| **Assumption** | “Retry 2 lần” nghĩa là tối đa ba attempts gồm lần đầu; retryable gồm timeout, DNS/network/connect/reset, HTTP 408/429/5xx |
| **Validate** | Design dùng wording rõ; Test xác nhận attempt count |
| **Change trigger** | Nếu Product yêu cầu retry theo error class/backoff |

<!-- ID: US-009 -->
<!-- EPIC: EP-001 -->
### US-009: Xử lý workflow khi Host/API thay đổi tính hợp lệ

> Với tư cách là **System Administrator**, tôi muốn thấy impact và vô hiệu hóa workflow phụ thuộc, để thay đổi System Manager không tạo execution sai âm thầm.

| Thuộc tính | Giá trị |
|---|---|
| **Priority** | Must |
| **Persona** | PERSONA-003 |
| **Covers FR** | FR-001, FR-011 |
| **Respects NFR** | Chưa có Architecture NFR |
| **Respects BR** | BR-005, BR-006 |
| **Design Reference** | Chưa có design |
| **Scope** | Impact preview; confirm delete/method change; DISABLED; Host recovery không auto-enable; review + repair + validate + manual enable; preserve history |
| **Out of Scope** | Tự động chọn API thay thế; khôi phục Host đã DELETED |
| **Testability** | Integration với dependency graph; kiểm tra warning list, state transition và history retention |

<!-- ID: AC-025 -->
<!-- US: US-009 -->
**AC-025 (Happy Path)** Xóa API đang được ba workflow dùng → dialog liệt kê đúng ba workflow và hiển thị “Các workflow này sẽ bị vô hiệu hóa sau khi xóa API.” trước nút xác nhận.

<!-- ID: AC-026 -->
<!-- US: US-009 -->
**AC-026 (Happy Path)** Người dùng xác nhận xóa API → API biến mất khỏi collection, ba workflow chuyển DISABLED và nút “Chạy workflow” bị disabled cho đến khi sửa dependency và validation sạch.

<!-- ID: AC-027 -->
<!-- US: US-009 -->
**AC-027 (Edge)** Host chuyển INACTIVE → mọi API/workflow của Host bị chặn chạy với thông báo “Host đang không hoạt động. Hãy kích hoạt Host trước khi chạy.”, execution history cũ vẫn xem được.

<!-- ID: AC-036 -->
<!-- US: US-009 -->
**AC-036 (Happy Path)** Chọn đổi HTTP method của API đang được hai workflow dùng → dialog liệt kê đúng hai workflow và hiển thị “Các workflow này sẽ bị vô hiệu hóa nếu bạn xác nhận thay đổi method.”

<!-- ID: AC-039 -->
<!-- US: US-009 -->
**AC-039 (Happy Path)** Xác nhận đổi HTTP method trong impact dialog → hai workflow được liệt kê chuyển DISABLED và nút “Chạy workflow” của chúng bị disabled cho đến khi review, validation sạch và enable lại.

<!-- ID: AC-037 -->
<!-- US: US-009 -->
**AC-037 (Edge)** Kích hoạt lại Host ACTIVE sau khi Host từng làm workflow chuyển DISABLED → workflow vẫn DISABLED, nút “Chạy workflow” vẫn disabled và UI hiển thị yêu cầu review/validate trước khi bật lại.

<!-- ID: AC-040 -->
<!-- US: US-009 -->
**AC-040 (Happy Path)** Chọn “Bật workflow” sau khi Host đã ACTIVE, người dùng đã review và validation sạch → workflow chuyển READY và nút “Chạy workflow” được bật.

| Khía cạnh | Nội dung |
|---|---|
| **Assumption** | System Manager cung cấp event/state đủ để API Lab phản ánh ngay dependency change |
| **Validate** | Architecture xác nhận integration contract |
| **Change trigger** | Nếu Host hard-delete không có event hoặc cần restore |

<!-- ID: US-010 -->
<!-- EPIC: EP-001 -->
### US-010: Xem và chạy lại execution history

> Với tư cách là **QA/Tester**, tôi muốn xem lịch sử từng step và chạy lại workflow, để tái hiện kịch bản mà không sửa record cũ.

| Thuộc tính | Giá trị |
|---|---|
| **Priority** | Must |
| **Persona** | PERSONA-002 |
| **Covers FR** | FR-010, FR-012 |
| **Respects NFR** | Retention 30 ngày |
| **Respects BR** | BR-001, BR-007, BR-008, BR-009, BR-010 |
| **Design Reference** | Chưa có design |
| **Scope** | History có workflow version/environment snapshot metadata; rerun latest workflow + environment hiện hành |
| **Out of Scope** | Rerun với snapshot credential/value cũ; retention tùy role |
| **Testability** | Integration với controlled clock; kiểm tra masked detail, linkage rerun và purge sau retention |

<!-- ID: AC-028 -->
<!-- US: US-010 -->
**AC-028 (Happy Path)** Mở execution history → mỗi record hiển thị người chạy, resolved workflow version, environment ID, snapshot timestamp, trạng thái và duration; detail hiển thị attempts/lỗi/input/output mask đúng cấu hình, không chứa raw credential.

<!-- ID: AC-029 -->
<!-- US: US-010 -->
**AC-029 (Happy Path)** Chọn “Chạy lại” trên workflow READY → hệ thống validate latest saved workflow version, snapshot environment hiện hành, tạo execution ID mới, liên kết “Chạy lại từ [execution ID nguồn]” và không dùng version/snapshot cũ.

<!-- ID: AC-030 -->
<!-- US: US-010 -->
**AC-030 (Edge)** Execution vượt quá 30 ngày retention → record không còn xuất hiện trong history sau tác vụ retention, trong khi execution đúng 30 ngày hoặc mới hơn vẫn hiển thị.

| Khía cạnh | Nội dung |
|---|---|
| **Assumption** | Rerun luôn dùng latest workflow/environment; history chỉ lưu masked snapshot metadata, không raw secret |
| **Validate** | Product + Security review trước approve arch |
| **Change trigger** | Nếu audit yêu cầu immutable config snapshot hoặc retention khác |

## Updated

## Removed

### Self-Review Checklist

- [x] `PROD-1`: 10/10 Must US có persona, AC, scope, out-of-scope, testability và FR trace.
- [x] `PROD-4`: 12/12 Must FR map tới ít nhất một Must US.
- [x] 43 AC có observable signal/exact copy, một trigger và không chứa protocol contract.
- [x] Business rule/lifecycle references khớp PRD proposal.
- [x] Deferred parallel/loop không bị trộn vào hành vi v1.
