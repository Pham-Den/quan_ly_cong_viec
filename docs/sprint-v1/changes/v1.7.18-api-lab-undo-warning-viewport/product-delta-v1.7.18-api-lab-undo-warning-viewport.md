---
status: APPROVED
version: v1
sprint: 1
phase: product
sprint_id: sprint-v1
change_pack: v1.7.18-api-lab-undo-warning-viewport
base_artifact: docs/sprint-v1/product/proposals/prd-v1.md + docs/sprint-v1/product/proposals/epics/EP-001-api-lab-workflow-orchestration-v1.md
applied_to_living: false
created: 2026-07-18
updated: 2026-07-18 13:52
approved_by: khanh-pham
approved_at: 2026-07-18T06:52:37Z
---

# Product Delta — v1.7.18-api-lab-undo-warning-viewport

### 1. Rationale

Đưa ba stakeholder decisions từ Design về Product effective truth: API delete Undo 10 giây, Validation Cảnh báo có xác nhận tiếp tục, và supported desktop screen từ 1280px với zoom 200% dùng compact/horizontal-scroll mode.

### 2. Downstream Impact

- Design DRAFT phải đồng bộ UX-FLOW-03/07/11/13, SCREEN-001/004/006/008, message copy, form/validation contract, responsive behavior và accessibility notes.
- Architecture khi bắt đầu phải thiết kế API restore cùng identity, validation severity payload và supported-screen/zoom behavior.
- Plan/Test/Implement chưa bắt đầu nên đọc effective truth sau khi pack được duyệt.

### 3. Acceptance Notes

- Undo thành công trong 10 giây khôi phục đúng API nhưng không auto-enable Workflow.
- Ba advisory conditions tạo `Cảnh báo`; mọi invalid condition hiện tại vẫn tạo `Lỗi`. Không có Lỗi thì người dùng có thể xác nhận để Run/Enable.
- Desktop screen từ 1280px vẫn chỉnh sửa/chạy được khi zoom 200% bằng compact mode/horizontal scroll; screen dưới 1280px hiển thị notice và không mở editor.

## New

<!-- ID: AC-044 -->
<!-- US: US-001 -->
**AC-044 (Happy Path)** Mở API Lab trên desktop có `screen width >= 1280px` rồi zoom trình duyệt tới 200% → editor chuyển sang compact mode, cho cuộn ngang vùng kỹ thuật khi cần và vẫn cho phép lưu/chạy bằng bàn phím.

<!-- ID: AC-045 -->
<!-- US: US-001 -->
**AC-045 (Edge)** Mở API Lab trên thiết bị có `screen width < 1280px` → editor không mở, trang hiển thị “API Lab Workflow cần màn hình desktop rộng tối thiểu 1280px.” và vẫn cho quay lại Host.

<!-- ID: AC-046 -->
<!-- US: US-009 -->
**AC-046 (Happy Path)** Xác nhận xóa API đang được Workflow sử dụng → API biến mất, Workflow phụ thuộc chuyển `DISABLED`, và toast “Đã xóa API {api_name}. Các workflow phụ thuộc đã bị vô hiệu hóa.” hiển thị nút “Hoàn tác” trong 10 giây.

<!-- ID: AC-047 -->
<!-- US: US-009 -->
**AC-047 (Happy Path)** Chọn “Hoàn tác” trong 10 giây → cùng API được khôi phục với định danh, cấu hình và vị trí cây trước khi xóa; Workflow phụ thuộc vẫn `DISABLED` cho tới khi `Rà soát → Kiểm tra → Bật workflow`.

<!-- ID: AC-048 -->
<!-- US: US-009 -->
**AC-048 (Edge)** Hệ thống nhận một yêu cầu “Hoàn tác” khi cửa sổ 10 giây đã hết → API không được khôi phục và UI hiển thị “Không thể hoàn tác xóa API. API vẫn bị xóa.”

<!-- ID: AC-049 -->
<!-- US: US-006 -->
**AC-049 (Edge)** Source mapping chưa có response mẫu nhưng workflow không có Lỗi → Validation Report hiển thị một `Cảnh báo` tại đúng source Step/field và Workflow đủ điều kiện `READY`.

<!-- ID: AC-050 -->
<!-- US: US-006 -->
**AC-050 (Error)** Workflow khớp một hàng `Lỗi` trong Validation Severity Decision Table của FR-007 → mỗi finding được gắn đúng Step/field/namespace, Run/Enable giữ disabled và người dùng không thể xác nhận để bỏ qua.

Validation Severity Decision Table:

| Nhóm điều kiện | Severity | Existing evidence |
|---|---|---|
| Dependency/API method không hợp lệ | Lỗi | AC-018, AC-025, AC-036, AC-039 |
| Thiếu biến bắt buộc hoặc trùng biến cùng namespace | Lỗi | AC-017; BR-002, BR-011 |
| Expression thiếu/không resolve namespace; mapping hiện tại/đứng sau/circular/non-JSON | Lỗi | AC-014, AC-015, AC-042; BR-003, BR-011 |
| Trùng `step_key` hoặc vượt 20 Step | Lỗi | AC-033; BR-003, BR-011 |

<!-- ID: AC-051 -->
<!-- US: US-006 -->
**AC-051 (Alt)** Workflow `READY` có 0 Lỗi và ít nhất 1 Cảnh báo rồi người dùng chọn Run → dialog hiển thị “Workflow còn {warnings} cảnh báo. Bạn có muốn tiếp tục?”.

<!-- ID: AC-052 -->
<!-- US: US-009 -->
**AC-052 (Error)** Người dùng chọn “Hoàn tác” trong 10 giây nhưng restore thất bại → API vẫn bị xóa và UI hiển thị “Không thể hoàn tác xóa API. API vẫn bị xóa.”

<!-- ID: AC-053 -->
<!-- US: US-006 -->
**AC-053 (Edge)** API của một Step đang kế thừa Host timeout nhưng workflow không có Lỗi → Validation Report hiển thị một `Cảnh báo` tại đúng API/Step và Workflow đủ điều kiện `READY`.

<!-- ID: AC-054 -->
<!-- US: US-006 -->
**AC-054 (Edge)** API có `sensitive_fields` rỗng nhưng workflow không có Lỗi → Validation Report hiển thị một `Cảnh báo` tại đúng API và Workflow đủ điều kiện `READY`.

<!-- ID: AC-055 -->
<!-- US: US-006 -->
**AC-055 (Happy Path)** Dialog Cảnh báo được mở từ Run rồi người dùng chọn “Tiếp tục” → hệ thống tạo Execution mới bằng saved revision đã validation và Environment hiện hành.

<!-- ID: AC-056 -->
<!-- US: US-006 -->
**AC-056 (Alt)** Dialog Cảnh báo được mở từ Run rồi người dùng chọn “Quay lại báo cáo” → dialog đóng và không tạo Execution.

<!-- ID: AC-057 -->
<!-- US: US-009 -->
**AC-057 (Alt)** Workflow `DISABLED` đã được review, dependency hợp lệ, validation có 0 Lỗi và ít nhất 1 Cảnh báo rồi người dùng chọn “Bật workflow” → dialog hiển thị “Workflow còn {warnings} cảnh báo. Bạn có muốn tiếp tục?”.

<!-- ID: AC-058 -->
<!-- US: US-009 -->
**AC-058 (Happy Path)** Dialog Cảnh báo được mở từ “Bật workflow” rồi người dùng chọn “Tiếp tục” → Workflow chuyển `READY` và nút “Chạy workflow” được bật.

<!-- ID: AC-059 -->
<!-- US: US-009 -->
**AC-059 (Alt)** Dialog Cảnh báo được mở từ “Bật workflow” rồi người dùng chọn “Quay lại báo cáo” → Workflow giữ `DISABLED` và không tạo Execution.

<!-- ID: BR-012 -->
### BR-012: API delete và Undo lifecycle

- **Statement:** API có lifecycle `ACTIVE -> DELETED_UNDOABLE -> DELETED`. Xác nhận xóa chuyển API từ `ACTIVE` sang `DELETED_UNDOABLE`, ẩn API khỏi Resource Tree và chuyển Workflow phụ thuộc sang `DISABLED`. Chọn Undo trong 10 giây chuyển `DELETED_UNDOABLE -> ACTIVE` với cùng identity, request configuration và tree location; Workflow vẫn `DISABLED`. Hết 10 giây hoặc restore thất bại chuyển `DELETED_UNDOABLE -> DELETED`. `DELETED -> ACTIVE` và Undo lần hai là invalid trong v1.
- **Entities liên quan:** API, Workflow.
- **Nguồn gốc:** Stakeholder decision; change pack `v1.7.18-api-lab-undo-warning-viewport`.
- **Timeout/expiry:** Undo window tự hết sau 10 giây tính từ xác nhận xóa; không có restore UI ngoài cửa sổ này.
- **Trace:** FR-003, FR-011, US-009; AC-046, AC-047, AC-048, AC-052.

## Updated

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
- [ ] Host được bật lại không tự bật workflow; Workflow chỉ READY sau khi user review, validation có 0 Lỗi, xác nhận Cảnh báo khi Bật workflow và enable thủ công.
- [ ] Undo xóa API trong 10 giây khôi phục cùng API nhưng không tự bật lại Workflow phụ thuộc.

#### Phụ thuộc & Ghi chú

| Loại | Item | Ghi chú |
|---|---|---|
| Depends-on | System Manager Host | Host/environment/credential hiện hữu hoặc được Architecture ánh xạ |
| Depends-on | API Lab collection/folder | Giữ cách tổ chức hiện tại |
| Respects | BR-001 đến BR-012 | Business rules và lifecycle trong PRD proposal/Product delta |
| Deferred | Parallel, loop | `[scheduled v2]` |

#### Edge cases & câu hỏi mở

- **Edge cases đã chốt:** Host hoạt động lại không auto-enable workflow; API đổi HTTP method làm workflow liên quan DISABLED; Undo API hết hạn sau 10 giây và không auto-enable Workflow; mapping chỉ đi từ step trước sang step sau; rerun dùng latest workflow/environment tại thời điểm rerun.
- **Câu hỏi mở:** Không có câu hỏi nghiệp vụ cản trở epic v1. Baseline KPI và owner/SLA nội bộ tiếp tục được quản lý tại `RISK-OPEN-001` và `RISK-OPEN-002` trong PRD proposal.

#### Product Traceability Map

| Epic | FR | Related US | Priority / Coverage | Notes |
|---|---|---|---|---|
| EP-001 | FR-001 | US-001, US-009 | Must / covered | `Workspace belongs_to Host`, Host state và desktop support |
| EP-001 | FR-002 | US-002 | Must / covered | Environment schema/value/credential |
| EP-001 | FR-003 | US-001, US-009 | Must / covered | Collection/folder/API organization và API delete Undo |
| EP-001 | FR-004 | US-003 | Must / covered | API request definition |
| EP-001 | FR-005 | US-003 | Must / covered | Standalone execution |
| EP-001 | FR-006 | US-004, US-005 | Must / covered | Sequential workflow và mapping |
| EP-001 | FR-007 | US-006 | Must / covered | Validation Đạt/Cảnh báo/Lỗi |
| EP-001 | FR-008 | US-007 | Must / covered | Sequential run/step status |
| EP-001 | FR-009 | US-008 | Must / covered | Timeout/retry/failure policy |
| EP-001 | FR-010 | US-007, US-010 | Must / covered | History và rerun |
| EP-001 | FR-011 | US-009 | Must / covered | Dependency invalidation, warning acknowledgement và Undo recovery |
| EP-001 | FR-012 | US-003, US-007, US-010 | Must / covered | Sensitive-data masking |

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
| **Respects BR** | BR-006, BR-008, BR-012 |
| **Design Reference** | SCREEN-001, SCREEN-006 |
| **Scope** | Mở Workspace từ Host; duy trì `Workspace belongs_to Host`; CRUD/sao chép/di chuyển collection, folder, API; desktop screen ≥1280px; compact editing tới zoom 200% |
| **Out of Scope** | Import/export; RBAC chi tiết; mobile/tablet editor; screen vật lý <1280px |
| **Testability** | Manual UI + integration; quan sát Host/tree persistence, unsupported-device notice và keyboard Save/Run tại zoom 200% |

<!-- ID: US-006 -->
<!-- EPIC: EP-001 -->
### US-006: Validate workflow trước khi chạy

> Với tư cách là **QA/Tester**, tôi muốn thấy toàn bộ kết quả validation trước execution, để sửa Lỗi và chủ động quyết định với Cảnh báo.

| Thuộc tính | Giá trị |
|---|---|
| **Priority** | Must |
| **Persona** | PERSONA-002 |
| **Covers FR** | FR-007 |
| **Respects NFR** | Chưa có Architecture NFR |
| **Respects BR** | BR-002, BR-003, BR-005, BR-011 |
| **Design Reference** | SCREEN-004, SCREEN-008 |
| **Scope** | Validate dependency/API method, variable, mapping, order, step limit; report Đạt/Cảnh báo/Lỗi; Cảnh báo chỉ cho ba advisory conditions; xác nhận trước Run khi còn Cảnh báo |
| **Out of Scope** | Gọi thật API đích trong validation; user tự cấu hình severity |
| **Testability** | Decision-table/unit/integration cho từng severity partition; kiểm tra finding gắn đúng Step/API/field, Lỗi chặn Run và từng nhánh Tiếp tục/Quay lại báo cáo |

<!-- ID: US-009 -->
<!-- EPIC: EP-001 -->
### US-009: Xử lý workflow khi Host/API thay đổi tính hợp lệ

> Với tư cách là **System Administrator**, tôi muốn thấy impact, Undo xóa nhầm API và kiểm soát việc bật lại Workflow phụ thuộc, để thay đổi System Manager không tạo execution sai âm thầm.

| Thuộc tính | Giá trị |
|---|---|
| **Priority** | Must |
| **Persona** | PERSONA-003 |
| **Covers FR** | FR-001, FR-003, FR-011 |
| **Respects NFR** | Chưa có Architecture NFR |
| **Respects BR** | BR-005, BR-006, BR-011, BR-012 |
| **Design Reference** | SCREEN-001, SCREEN-006, SCREEN-008 |
| **Scope** | Impact preview; confirm delete/method change; DISABLED; API Undo trong 10 giây; same-identity restore; Host recovery không auto-enable; review + repair + validation 0 Lỗi + warning acknowledgement + manual enable; preserve history |
| **Out of Scope** | Tự động chọn API thay thế; khôi phục Host đã DELETED; API restore ngoài 10 giây; auto-enable Workflow |
| **Testability** | Integration với dependency graph và controllable clock/restore failure; kiểm tra API lifecycle, exact warning/Undo copy, same identity/config/tree location, Workflow state và history retention |

<!-- ID: AC-026 -->
<!-- US: US-009 -->
**AC-026 (Happy Path)** Người dùng xác nhận xóa API → API biến mất khỏi collection, ba Workflow chuyển `DISABLED` và nút “Chạy workflow” bị disabled cho đến khi dependency hợp lệ, validation có 0 Lỗi và người dùng chủ động Bật workflow.

<!-- ID: AC-039 -->
<!-- US: US-009 -->
**AC-039 (Happy Path)** Xác nhận đổi HTTP method trong impact dialog → hai Workflow được liệt kê chuyển `DISABLED` và nút “Chạy workflow” của chúng bị disabled cho đến khi review, validation có 0 Lỗi, xác nhận Cảnh báo nếu có và enable lại.

<!-- ID: AC-040 -->
<!-- US: US-009 -->
**AC-040 (Happy Path)** Chọn “Bật workflow” sau khi Host đã ACTIVE, người dùng đã review, validation có 0 Lỗi và không còn Cảnh báo → Workflow chuyển `READY` và nút “Chạy workflow” được bật.

<!-- ID: BR-005 -->
### BR-005: Dependency bị xóa hoặc đổi contract làm workflow vô hiệu

- **Statement:** Trước khi xóa API/Host hoặc đổi HTTP method của API, hệ thống phải hiển thị danh sách workflow bị ảnh hưởng và yêu cầu xác nhận. Sau khi xác nhận, mọi workflow tham chiếu dependency đó chuyển sang DISABLED. Khi xóa API, người thực hiện có thể Undo trong 10 giây; Undo thành công khôi phục cùng API với định danh, cấu hình và vị trí cây trước khi xóa nhưng không tự bật lại Workflow. Workflow chỉ được bật lại thủ công sau khi người dùng review mapping/request contract, sửa dependency nếu cần, validation không có Lỗi và xác nhận mọi Cảnh báo.
- **Entities liên quan:** Host, API, Workflow.
- **Nguồn gốc:** Quyết định stakeholder; change pack `v1.7.18-api-lab-undo-warning-viewport`.
- **Ngoại lệ/Change trigger:** Undo hết hiệu lực sau 10 giây; không hỗ trợ restore Host đã DELETED trong v1.
- **Trace:** FR-003, FR-007, FR-011, US-001, US-006, US-009; AC-046 đến AC-059.

<!-- ID: BR-011 -->
### BR-011: Variable namespace không overwrite và validation severity

- **Statement:** Mỗi workflow step có `step_key` kỹ thuật duy nhất do hệ thống sinh khi thêm step và bất biến; người dùng không thể nhập/sửa key, và đổi API/step label không đổi key. Step output, environment và workflow variables dùng namespace riêng; trùng biến trong cùng namespace, expression thiếu/không resolve namespace, tham chiếu step hiện tại/đứng sau, dependency/API method không hợp lệ, thiếu biến bắt buộc, trùng `step_key` hoặc vượt 20 step là `Lỗi` và chặn Run/Enable. `Cảnh báo` chỉ áp dụng khi source mapping chưa có response mẫu, API kế thừa Host timeout hoặc `sensitive_fields` rỗng. `Validation sạch` được định nghĩa là validation có 0 Lỗi; Cảnh báo không chặn READY nhưng bắt buộc xác nhận tại Run/Enable. Không có last-write-wins hoặc overwrite âm thầm.
- **Entities liên quan:** Workflow, Workflow Step, Variable, Mapping, API.
- **Nguồn gốc:** Feedback stakeholder; change pack `v1.7.18-api-lab-undo-warning-viewport`.
- **Ngoại lệ/Change trigger:** Thêm hoặc đổi severity rule phải qua Product change; phase 1 không cho user tự cấu hình severity.
- **Trace:** FR-006, FR-007, FR-011; US-005, US-006, US-009; AC-049 đến AC-059.

<!-- ID: FR-001 -->
<!-- EPIC: EP-001 -->
**FR-001 — Workspace belongs_to Host**

- **Mô tả:** Hệ thống phải bảo đảm mỗi API Workspace `belongs_to` đúng một Host trong System Manager; mỗi Host có một API Workspace và execution chỉ được phép khi Host parent ở trạng thái ACTIVE. API Lab editor v1 hỗ trợ desktop có `screen width >= 1280px`; trên screen đủ chuẩn, zoom tới 200% vẫn giữ editor khả dụng bằng compact mode/horizontal scroll.
- **Phạm vi:** Mở Workspace từ Host; giữ định danh Host parent; phản ánh trạng thái Host; Workspace chứa nhiều collection/API/workflow; screen dưới 1280px hiển thị unsupported notice và cho quay lại Host; không hỗ trợ mobile/tablet editor.
- **Covered by US:** US-001, US-009.
- **Verifies KPI:** Giảm thời gian chuyển/ngữ cảnh giữa System Manager và API Lab.
- **Ghi chú:** Tuân BR-006; platform behavior theo AC-044/045.

<!-- ID: FR-003 -->
<!-- EPIC: EP-001 -->
**FR-003 — Tổ chức collection, folder và API**

- **Mô tả:** Hệ thống phải cho phép tạo, sửa, sao chép, di chuyển và xóa collection/folder/API trong workspace theo mô hình API Lab hiện tại; xóa API có Undo trong 10 giây.
- **Phạm vi:** Cây điều hướng thuộc Host; giữ quan hệ collection/folder/API; Undo thành công khôi phục cùng API với định danh, cấu hình và vị trí cũ nhưng không auto-enable Workflow phụ thuộc.
- **Covered by US:** US-001, US-009.
- **Verifies KPI:** Tái sử dụng mô hình tổ chức quen thuộc và giảm rủi ro thao tác xóa nhầm.
- **Ghi chú:** Không thêm import/export hoặc restore ngoài cửa sổ Undo trong v1.

<!-- ID: FR-007 -->
<!-- EPIC: EP-001 -->
**FR-007 — Validate workflow trước execution**

- **Mô tả:** Hệ thống phải phân loại Validation Report thành Đạt/Cảnh báo/Lỗi. Mọi dependency mất/đổi HTTP method, biến bắt buộc thiếu, lỗi sinh/trùng `step_key`, trùng biến trong cùng namespace, expression thiếu/không resolve namespace, mapping tới step hiện tại/đứng sau, circular mapping hoặc vượt 20 bước là `Lỗi` và chặn execution. Source mapping chưa có response mẫu, API kế thừa Host timeout hoặc `sensitive_fields` rỗng là `Cảnh báo`.
- **Phạm vi:** Validation tạo danh sách finding gắn Step/field/namespace cụ thể. Có 0 Lỗi thì Workflow đủ điều kiện READY; Run/Enable khi còn Cảnh báo phải xác nhận. Không có last-write-wins và user không tự cấu hình severity trong v1.
- **Covered by US:** US-006.
- **Verifies KPI:** Giảm execution thất bại do cấu hình mà vẫn cho phép chấp nhận advisory có chủ đích.
- **Ghi chú:** Tuân BR-002, BR-003, BR-005, BR-011.

<!-- ID: FR-011 -->
<!-- EPIC: EP-001 -->
**FR-011 — Cảnh báo và vô hiệu hóa khi dependency thay đổi**

- **Mô tả:** Hệ thống phải hiển thị workflow bị ảnh hưởng trước khi xóa API/Host hoặc đổi HTTP method API và chuyển chúng sang DISABLED sau xác nhận. Host chuyển lại ACTIVE không tự bật workflow. Xóa API cho Undo trong 10 giây; Undo khôi phục API nhưng không tự bật lại Workflow.
- **Phạm vi:** Bật lại chỉ sau khi dependency/Host hợp lệ, người dùng review, validation có 0 Lỗi, xác nhận mọi Cảnh báo và chủ động enable. Undo thất bại/hết hạn giữ API ở trạng thái bị xóa.
- **Covered by US:** US-009.
- **Verifies KPI:** Không có workflow âm thầm tham chiếu dependency đã mất và giảm rủi ro xóa nhầm API.
- **Ghi chú:** Tuân BR-005, BR-006, BR-011.

## Removed

### Self-Review Checklist

- [x] Quality Contract refs satisfied: `DOC-1`, `DOC-2`, `DOC-3`, `LINK-1`, `LINK-2`, `ORB-1`, `ORB-2`
- [x] Filename matches `{phase}-delta-v{X}.{Y}.{Z}-{slug}.md`
- [x] Required frontmatter keys are present and status is DRAFT
- [x] Every delta item uses a stable anchor with required routing tags
- [x] No Before/After narrative is used inside Updated items
- [x] Rationale, downstream impact and acceptance notes are complete
