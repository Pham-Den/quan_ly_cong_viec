---
status: APPROVED
version: v1
sprint: 1
phase: product
sprint_id: sprint-v1
change_pack: v1.7.19-kpi-baseline-deadline
base_artifact: docs/sprint-v1/product/proposals/prd-v1.md
applied_to_living: false
created: 2026-07-19
updated: 2026-07-19 17:25
approved_by: khanh-pham
approved_at: 2026-07-19T11:00:26Z
---

# Product Delta — v1.7.19-kpi-baseline-deadline

### 1. Rationale

`RISK-OPEN-001` requires runtime observation that cannot exist before Test design is approved. This delta keeps both KPI targets unchanged, locks measurement through TC-076 and moves the real-evidence deadline to the final Implement gate.

### 2. Downstream Impact

- Plan assigns Workflow evidence to TG-24, telemetry refutation to TG-27 and final calculation/gating to TG-30.
- Test DRAFT locks the same-pilot/same-task protocol and distinguishes `approve test` protocol readiness from `approve implement` evidence completion.
- Design and Architecture remain unchanged because user behavior, UI surfaces, metric definitions and telemetry contracts do not change.

### 3. Acceptance Notes

Pass only when pilot `khanh-pham` completes the same fixed synthetic three-API task AS-IS and through Workflow, redacted evidence proves elapsed time <=10 minutes and copy/paste reduction >=80%, and missing/zero/mismatched evidence yields `KPI_INCONCLUSIVE` that blocks `approve implement`.

---

## New

## Updated

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
| Rút ngắn thiết lập chuỗi API | Thời gian từ lúc tạo workflow ba API đến lần chạy thành công đầu tiên | Chưa đo — `RISK-OPEN-001` | ≤ 10 phút | TC-076: cùng pilot/task, timestamp quan sát và telemetry từ lúc tạo workflow đến execution thành công đầu tiên |
| Giảm thao tác thủ công | Số thao tác copy/paste dữ liệu giữa các API trong một chuỗi ba bước | Chưa đo — `RISK-OPEN-001` | Giảm ≥ 80% | TC-076: so sánh quan sát AS-IS với Workflow theo `((baseline-result)/baseline)*100`, baseline >0 |

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
| System Manager | Nội bộ | Nguồn Host mà Workspace bắt buộc `belongs_to`, cùng environment, biến và credential | Hai chiều | Realtime | `khanh-pham`; SLA N/A cho local personal scope — `PLAN-DEC-001` | Hiện hữu | Không thể resolve Workspace về Host hoặc chọn environment |
| API Lab | Nội bộ | Collection/folder/API và màn hình thao tác | Hai chiều | Realtime | `khanh-pham`; SLA N/A cho local personal scope — `PLAN-DEC-001` | Hiện hữu | Không có nơi khai báo và chạy API |
| API đích do người dùng khai báo | Bên ngoài phạm vi quản trị | Nhận request và trả response | Hai chiều | Realtime | Theo từng Host/API | Động | Timeout/lỗi ngoài quyền kiểm soát workflow |

#### 9. Metrics & Tracking

| Sự kiện | Trigger | Thuộc tính không nhạy cảm | KPI |
|---|---|---|---|
| workflow_created | Lưu workflow mới | workflow_id, host_id, step_count, created_at | Time-to-first-success |
| workflow_execution_started | Người dùng bắt đầu chạy | workflow_id, execution_id, environment_id, step_count, started_at | Execution volume |
| workflow_execution_finished | Workflow kết thúc | workflow_id, execution_id, status, finished_at, duration, failed_step, retry_count | Success/observability |
| step_mapping_failed | Không resolve được input | workflow_id, step_index, variable_name đã mask nếu nhạy cảm | Mapping quality |

Dữ liệu tracking không lưu Host credential raw. Execution input/output chỉ mask các field/path thuộc `sensitive_fields` theo `BR-001`; field chưa được cấu hình sensitive vẫn giữ nguyên và là rủi ro cấu hình được theo dõi tại `RISK-003`.

Đối với TC-076, nguồn thời gian canonical là database UTC `DATETIME(3)`: `ENT-007 workflows.id/created_at` và `ENT-011 executions.id/workflow_id/execution_type/status/finished_at`. `workflow_created` và `workflow_execution_finished` là telemetry correlation theo NFR-006, không thay thế các field canonical. First success là Execution có cùng `workflow_id`, `execution_type=WORKFLOW`, `status=SUCCEEDED`, `finished_at IS NOT NULL` với tuple `(finished_at, id)` nhỏ nhất; `elapsed_seconds=(finished_at-created_at)/1000` giữ độ chính xác millisecond. ID/status/timestamp telemetry không khớp canonical data tạo `KPI_INCONCLUSIVE`.

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
| RISK-OPEN-001 | Baseline thời gian và số thao tác copy/paste của chuỗi ba API chưa được đo | Không thể kết luận KPI nếu chưa có runtime/evidence thật | TC-076 dùng pilot `khanh-pham`, cùng task `fixed_synthetic_three_api_chain`, cùng browser/device; evidence được redacted; thiếu/zero/mismatch → `KPI_INCONCLUSIVE` | khanh-pham — Product Owner và pilot; TG-30 phát hành quyết định | Trước `approve implement` | `PENDING` — chưa có quyết định TG-30 |
| RISK-OPEN-002 | Đã xử lý cho sprint v1 bằng `PLAN-DEC-001` | Không còn chặn Plan trong local personal scope | Một developer điều phối AI; 6 developer-hours/ngày; mục tiêu tương đối 10 ngày làm việc; owner `khanh-pham`; calendar deadline và internal SLA là N/A | khanh-pham — Product Owner + Delivery Lead | Đã hoàn tất trước `start plan` | Đã xử lý; mở lại nếu có deadline/SLA cố định, thay đổi capacity/team hoặc external/public/commercial scope |

**RISK-OPEN-001 resolution contract**

| Contract item | Effective rule |
|---|---|
| Protocol and evidence-set identity | Current protocol is `tc076-v1`, defined inside mergeable anchor `TC-076` in `docs/sprint-v1/testing/proposals/test-cases-v1.md`. Its SHA-256 covers the exact raw UTF-8/LF bytes between the unique BEGIN/END marker lines, excluding those lines, with no CR and exactly one terminal LF; TG-24/TG-27/TG-30 independently reproduce it. TG-24 allocates one non-reusable, zero-padded monotonic `attempt_sequence` at attempt start; no TC-076 attempts may overlap. `evidence_set_id=tc076-v1-a{attempt_sequence:04d}` and the same ID must appear in every artifact. |
| Observation input | TG-24 writes immutable `docs/evidence/kpi/TC-076/sets/{evidence_set_id}/observation.json` from the real same-pilot/same-task AS-IS and Workflow runs, including protocol source/hash, attempt status and exclusion reason. |
| Correlation input | TG-27 writes immutable `docs/evidence/observability/TC-076/sets/{evidence_set_id}/telemetry-correlation.json` that verifies `ENT-007`/`ENT-011` IDs/timestamps/status and observation hash without payload or credential values. |
| Decision and selector | TG-30 writes immutable `docs/evidence/release/TC-076/sets/{evidence_set_id}/decision.json`, then atomically replaces `docs/evidence/release/TC-076/current.json`. The selector records protocol, selected set/sequence, all three paths/hashes, state and evaluated_at. |
| Authoritative ordering | The gate independently scans the union of TC-076 set directories in all three owner roots and selects the greatest numeric `attempt_sequence` for `tc076-v1`; `current.json` must name that set. Duplicate/reused sequence, malformed/unknown protocol, selector mismatch, correlation without observation or hash mismatch yields `KPI_INCONCLUSIVE`. A newest observation without a decision is `PENDING`. |
| State transition and supersession | `PENDING → PASSED` only when protocol/identity/correlation checks pass, `baseline_copy_paste > 0`, Workflow elapsed time is ≤600.000 seconds and reduction is ≥80%. Valid evidence missing a target yields `FAILED`; missing/zero/incomplete/mismatched evidence yields `KPI_INCONCLUSIVE`. A greater sequence supersedes every older result regardless of state, so an older `PASSED` never overrides newer `PENDING`, `FAILED` or `KPI_INCONCLUSIVE`. Prior artifacts remain immutable. |
| Rerun rule | `EXCLUDED`/incomplete attempts may be rerun with the next sequence. A valid `PASSED` or `FAILED` decision is terminal for `tc076-v1`; any later same-revision attempt is unauthorized and yields `KPI_INCONCLUSIVE` unless a governed Product/Test change introduces a new protocol revision. Orphan artifacts remain blocking evidence and are never silently deleted. |
| Gate predicate | `approve test` confirms only that the TC-076 Protocol Contract revision `tc076-v1` and TC-076 are execution-ready. `approve implement` requires selector/scan agreement for the current protocol, complete matching hashes and the selected TG-30 decision state `PASSED`. Every other condition blocks approval. |
| Risk closure | For the sprint gate, `RISK-OPEN-001` is resolved only by a valid `PASSED` decision record. The design-time row remains `PENDING` until Implement produces that runtime evidence; no Product-document edit, synthetic value, inference or self-generated approval evidence can close it. |

#### 11. Open Questions

Không còn câu hỏi cản trở scope Product v1. Chi tiết giới hạn response, lưu trữ payload và chiến lược masking thuộc Architecture nhưng phải tuân `BR-001` và các target đã chốt.

#### 12. Living Truth Cross-Reference

| File đích | Nội dung proposal hiện tại |
|---|---|
| `/docs/product/prd.md` | `PRD-OVERVIEW-001`, `BR-001` đến `BR-012` |
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

## Removed

### Self-Review Checklist

- [x] Quality Contract refs satisfied: `DOC-1`, `DOC-2`, `DOC-3`, `LINK-1`, `LINK-2`, `ORB-1`, `ORB-2`
- [x] Filename/frontmatter follow canonical delta structure
- [x] `PRD-OVERVIEW-001` is a complete replacement state, not a before/after fragment
- [x] KPI targets remain unchanged; only protocol detail and lifecycle deadline change
- [x] No baseline, result or approval evidence is fabricated
