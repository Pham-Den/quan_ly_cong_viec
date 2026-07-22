<!-- PRISM-PREVIEW: includes DRAFT (unapproved) sources; generated, not sealed; not the source of truth -->
> ⚠ **PRISM preview — includes DRAFT (unapproved) changes.** Computed on demand, never written to disk, never the source of truth. For the approved-only view, drop `--with-drafts`.

---
status: DRAFT
approved_by:
---

# Test Cases — 

<!-- This file is the Living Truth root for the Test phase. It accumulates test cases
     across sprints. AI never writes this file directly — `apply_proposal.py` merges
     anchored TC items from each sprint's `testing/proposals/test-cases-v{X}.md` at sprint seal.

     Phase 9 changes vs 1.x:
     - ID format `TC-{AREA}-{NNN}` → flat `TC-{NNN}`. Feature area moves to `**Area**:` body field.
     - Stable ID anchor convention: every test case is preceded by `&lt;!-- ID: TC-NNN --&gt;` + optional `&lt;!-- VERIFIES: ID-NNN --&gt;` trace tag. -->

<!-- ## Stable ID Anchor Convention (Phase 9+)
     Each TC block MUST start with:
         &lt;!-- ID: TC-NNN --&gt;
         &lt;!-- VERIFIES: ID-NNN --&gt;   (optional trace tag — preserves but does not route)
         ### TC-NNN: {Title} [planned-automated|planned-manual] P0|P1|P2
     Atomic ID (all modes — Guided AND Freedom): `python .prism/core/tools/get_next_id.py --type TC`
     Strict format: `TC-\d{3,}` (zero-padded ≥3 digits).
     (Guided seal only) The anchor also lets `apply_proposal.py` merge this block at sprint seal — Freedom has no seal but still issues the ID above and keeps the anchor. -->

## 1. Conventions

- **ID format**: `TC-NNN` flat (vd `TC-001`, `TC-042`). Feature area NOT in ID.
- **Title convention**: TC heading uses a trace prefix + technique prefix before the descriptive title.
  - Functional TCs: `[US-NNN][AC-NNN][Technique]` — example `### TC-007: [US-010][AC-001][BVA] Cache TTL 299s still serves (cacheHit=true) \`[planned-automated]\` \`P0\``.
  - Imported project/story aliases are accepted during normalization when the upstream product source owns that label, e.g. `[US-10.1][AC1][BVA]`; prefer canonical PRISM stable IDs for newly authored PRISM artifacts.
  - Non-functional TCs (Performance / Security / A11Y) without a single AC anchor: `[NFR-NNN][Technique]` — example `### TC-042: [NFR-V3-02][Security] SQL Injection prevention on /search`.
  - SIT TCs: `[US-NNN][AC-NNN][SIT]` (technique = SIT) when traceable to a US/AC; otherwise `[FLOW-NNN][SIT]`.
  - `Technique` ∈ `{Positive, Negative, BVA, EP, DT, ST, DD, Security, Regression, Impact, BasicFlow, CornerCase, Exploratory, SIT, Performance, Accessibility}`.
  - Multi-technique TCs combine with `+`, e.g. `[BVA+Negative]` or `[ST+Security]`.
  - Functional trace + Technique title prefixes must match Y cells in §3.5 Per-AC Technique Decision Matrix.
  - The exporter preserves the entire prefix in the `Summary` TSV column.
- **Feature area** *(field in body, not ID)*: write `**Area**: AUTH | ORDER | PAYMENT | PROFILE | CART | CHECKOUT | ADMIN | PERF | SEC | A11Y | ...` per test case. Use feature-based names that map to business risk; avoid component-based labels (API/UI).
- **Traceability**: every TC has `**Traceability**: US-NNN, FR-NNN, NFR-NNN` — no trace = no traceability. The optional `&lt;!-- VERIFIES: ID-NNN --&gt;` anchor tag carries the primary verified item for cross-doc tooling.
- **Coverage Traceability Index alignment**: TC IDs and FR/NFR refs here must match `test-plan-v{X}.md §2b Coverage Traceability Index`.
- **Format**: Given / When / Then (BDD-style).
- **Type tags** *(in heading)*: `[planned-automated]` = automation candidate; `[planned-manual]` = QA manual.
- **Test Level**: `component` | `integration` | `e2e`. Do NOT use `unit` (those are repo test delta owned by Implement).
- **Test Type**: `Functional` | `Regression` | `Non-Functional` | `Exploratory` | `Security` | `Performance` | `Accessibility` | or project-specific.
- **Export target**: `functional` | `sit` | `none`. Generated TSV companions derive from this field + section context.
- **Smoke**: `Y` only for independent, short, release-critical cases.
- **Automation intent**: `Auto=Y` = candidate for future repo test or external QC automation; does NOT generate runnable automation in Phase Test.
- **Generated TSV rule**: `generated/test-cases-functional-v{X}.tsv`, `generated/test-cases-sit-v{X}.tsv`, `generated/test-cases-export-manifest-v{X}.json` are generated from this Markdown. Do not edit generated TSV by hand.
- **Mandatory metadata for every TC**: Area, Traceability, Manual/Auto boundary, Test Level, Test Type, Export target, Smoke, Environment, Data needs, Teardown/reset (when state-changing), Depends on, Automation intent, Owner of execution context. Add Design states, API/NFR refs, System A/B expected, Screen under test, External QA handoff needs when applicable.
- **Metadata format**: keep metadata as `**Field**: value`. The TSV exporter reads that exact shape; grouping labels below are only for readability.
- **Pre-conditions phải cụ thể**: KHÔNG viết "User exists" — ghi user ID, role, status, và cách lấy auth token nếu cần test authenticated endpoint.

## 2. Priority Levels

| Priority | Meaning | Execution |
|----------|---------|-----------|
| P0 | Critical path — must be implemented and validated before release | Highest priority in planning |
| P1 | Important — should be implemented in the planned delivery window | Planned during implementation |
| P2 | Nice to have — can defer if time-constrained | Backlog / later cycle |

<!-- PRISM:INDEX:START (auto-generated by seal_sprint.py — do not edit by hand) -->

## Index

| ID | Title |
|---|---|
| TC-001 | [US-001][AC-001][Positive] trang API Workspace hiển thị đúng tên Host parent, environment selector và cây collection của Workspace belongs_to Host đó. `[planned-automated]` `P0` |
| TC-002 | [US-001][AC-002][Negative] nút "Chạy API" và "Chạy workflow" bị disabled, banner "Host đang không hoạt động. Hãy kích hoạt Host trước khi chạy." hiển thị. `[planned-automated]` `P0` |
| TC-003 | [US-001][AC-003][Positive] ba node hiển thị đúng cấp trong cây và vẫn còn sau khi tải lại trang. `[planned-automated]` `P0` |
| TC-004 | [US-002][AC-004][EP+DD] DEV, UAT và PROD cùng hiển thị key tenant_id, mỗi environment cho nhập giá trị riêng. `[planned-automated]` `P0` |
| TC-005 | [US-002][AC-005][DT] execution bị chặn và step liên quan hiển thị "Thiếu giá trị biến tenant_id trong environment UAT." `[planned-automated]` `P0` |
| TC-006 | [US-002][AC-006][Positive] execution details hiển thị environment UAT, dùng giá trị UAT của tenant_id và hiển thị credential thuộc sensitive config là ••••••••. `[planned-automated]` `P0` |
| TC-007 | [US-003][AC-007][Positive] panel kết quả hiển thị "Thành công", duration, request resolved và response JSON; các field/path thuộc sensitive_fields hiển thị ••••••••. `[planned-automated]` `P0` |
| TC-008 | [US-003][AC-008][BVA] attempt dừng ở 12 giây, panel hiển thị "API hết thời gian chờ sau 12 giây."; retry áp dụng theo cấu hình API step. `[planned-automated]` `P0` |
| TC-009 | [US-003][AC-009][EP+DD] preview/log/history hiển thị token là •••••••• nhưng giữ nguyên customer_name; hệ thống không tự mask field ngoài cấu hình. `[planned-automated]` `P0` |
| TC-010 | [US-004][AC-010][Positive] Thêm API A, B, C và kéo thành thứ tự B → A → C → danh sách step lưu đúng thứ tự B, A, C sau khi tải lại trang. `[planned-automated]` `P0` |
| TC-011 | [US-004][AC-011][BVA] thao tác bị từ chối, hiển thị "Workflow chỉ hỗ trợ tối đa 20 bước trong phase 1." `[planned-automated]` `P0` |
| TC-012 | [US-004][AC-012][Positive] editor không hiển thị tùy chọn parallel/loop và scope note hiển thị "Parallel và loop được lên kế hoạch cho v2." `[planned-automated]` `P0` |
| TC-013 | [US-005][AC-013][Positive] editor hiển thị expression ${{step_01.data.customer.id}} và resolved request của Step 3 hiển thị C-001 dù Step 2 nằm giữa. `[planned-automated]` `P0` |
| TC-014 | [US-005][AC-014][Negative] Step 3 không được gọi và hiển thị "Không tìm thấy ${{step_01.data.customer.id}}." `[planned-automated]` `P0` |
| TC-015 | [US-005][AC-015][EP] mapping không được lưu và hiển thị "Phase 1 chỉ hỗ trợ mapping từ response JSON." `[planned-automated]` `P0` |
| TC-016 | [US-006][AC-016][ST] validation hiển thị "Workflow hợp lệ và sẵn sàng chạy." và trạng thái chuyển READY. `[planned-automated]` `P0` |
| TC-017 | [US-006][AC-017][DT+DD] validation hiển thị hai dòng lỗi riêng, mỗi dòng nêu đúng tên biến và environment; nút "Chạy workflow" bị disabled. `[planned-automated]` `P0` |
| TC-018 | [US-006][AC-018][ST] validation hiển thị đúng step "API không còn tồn tại. Hãy chọn API thay thế hoặc xóa bước này." và giữ trạng thái DISABLED. `[planned-automated]` `P0` |
| TC-019 | [US-007][AC-019][ST] step 2 bắt đầu sau step 1 SUCCEEDED, step 3 bắt đầu sau step 2 SUCCEEDED, execution hiển thị SUCCEEDED và mỗi step có duration/input/output mask đúng sensitive_fields. `[planned-automated]` `P0` |
| TC-020 | [US-007][AC-020][ST] Step 3 giữ trạng thái "Chưa chạy", execution hiển thị "Thất bại tại bước 2." và không gửi request Step 3. `[planned-automated]` `P0` |
| TC-021 | [US-007][AC-021][BVA] trạng thái và response đã mask của step xuất hiện trên UI trong ≤ 1 giây. `[planned-automated]` `P0` |
| TC-022 | [US-008][AC-022][BVA] chỉ step đó được gọi lại, execution detail hiển thị step SUCCEEDED với "Số lần gọi: 2", các step trước không chạy lại. `[planned-automated]` `P0` |
| TC-023 | [US-008][AC-023][BVA] step FAILED sau attempt thứ ba, history ghi retry_count: 2, execution dừng và không chạy lại step trước. `[planned-automated]` `P0` |
| TC-024 | [US-008][AC-024][Negative] không có lần gọi thứ hai, step hiển thị FAILED với lý do "Lỗi không thuộc nhóm được retry." và execution dừng. `[planned-automated]` `P0` |
| TC-025 | [US-009][AC-025][DT+DD] dialog liệt kê đúng ba workflow và hiển thị "Các workflow này sẽ bị vô hiệu hóa sau khi xóa API." trước nút xác nhận. `[planned-automated]` `P0` |
| TC-026 | [US-009][AC-026][ST] API biến mất khỏi collection, ba Workflow chuyển DISABLED và nút "Chạy workflow" bị disabled cho đến khi dependency hợp lệ, validation có 0 Lỗi và người dùng chủ động Bật workflow. `[planned-automated]` `P0` |
| TC-027 | [US-009][AC-027][ST] mọi API/workflow của Host bị chặn chạy với thông báo "Host đang không hoạt động. Hãy kích hoạt Host trước khi chạy.", execution history cũ vẫn xem được. `[planned-automated]` `P0` |
| TC-028 | [US-010][AC-028][Positive] mỗi record hiển thị người chạy, resolved workflow version, environment ID, snapshot timestamp, trạng thái và duration; detail hiển thị attempts/lỗi/input/output mask đúng cấu hình, không chứa raw credential. `[planned-automated]` `P0` |
| TC-029 | [US-010][AC-029][Positive] hệ thống validate latest saved workflow version, snapshot environment hiện hành, tạo execution ID mới, liên kết "Chạy lại từ [execution ID nguồn]" và không dùng version/snapshot cũ. `[planned-automated]` `P0` |
| TC-030 | [US-010][AC-030][BVA] record không còn xuất hiện trong history sau tác vụ retention, trong khi execution đúng 30 ngày hoặc mới hơn vẫn hiển thị. `[planned-automated]` `P0` |
| TC-031 | [US-007][AC-031][ST] execution hiện tại hoàn tất toàn bộ step theo v5; execution mới sau đó resolve v6. `[planned-automated]` `P0` |
| TC-032 | [US-002][AC-032][ST] mọi step của execution hiện tại tiếp tục dùng snapshot C-001; execution mới dùng C-002. `[planned-automated]` `P0` |
| TC-033 | [US-006][AC-033][Negative] validation hiển thị hai vị trí xung đột với thông báo "Khóa bước bị trùng. Hãy lưu lại hoặc liên hệ quản trị viên.", chặn execution và không overwrite biến; hệ thống không tự đổi key vì key là bất biến. `[planned-automated]` `P0` |
| TC-034 | [US-004][AC-034][Positive] hệ thống hiển thị step_key kỹ thuật duy nhất trong field chỉ đọc và không cung cấp thao tác sửa key. `[planned-automated]` `P0` |
| TC-035 | [US-005][AC-035][Negative] editor từ chối lưu mapping và hiển thị "Chỉ được ánh xạ dữ liệu từ bước đứng trước; mapping ngược có thể tạo vòng lặp." `[planned-automated]` `P0` |
| TC-036 | [US-009][AC-036][DT+DD] dialog liệt kê đúng hai workflow và hiển thị "Các workflow này sẽ bị vô hiệu hóa nếu bạn xác nhận thay đổi method." `[planned-automated]` `P0` |
| TC-037 | [US-009][AC-037][ST] workflow vẫn DISABLED, nút "Chạy workflow" vẫn disabled và UI hiển thị yêu cầu review/validate trước khi bật lại. `[planned-automated]` `P0` |
| TC-038 | [US-004][AC-038][ST] step_key và mọi expression đang dùng key đó vẫn giữ nguyên sau khi lưu và tải lại workflow. `[planned-automated]` `P0` |
| TC-039 | [US-009][AC-039][ST] hai Workflow được liệt kê chuyển DISABLED và nút "Chạy workflow" của chúng bị disabled cho đến khi review, validation có 0 Lỗi, xác nhận Cảnh báo nếu có và enable lại. `[planned-automated]` `P0` |
| TC-040 | [US-009][AC-040][DT+ST] Workflow chuyển READY và nút "Chạy workflow" được bật. `[planned-automated]` `P0` |
| TC-041 | [US-003][AC-041][ST] execution hiện tại vẫn hiển thị request resolved bằng snapshot C-001; execution mới dùng C-002. `[planned-automated]` `P0` |
| TC-042 | [US-006][AC-042][Negative] validation gắn lỗi vào Step 2, hiển thị "Chỉ được tham chiếu bước đứng trước." và giữ nút "Chạy workflow" ở trạng thái disabled. `[planned-automated]` `P0` |
| TC-043 | [US-007][AC-043][ST] mọi step còn lại của execution hiện tại tiếp tục hiển thị resolved input từ snapshot C-001; execution mới dùng C-002. `[planned-automated]` `P0` |
| TC-044 | [US-001][AC-044][BVA] editor chuyển sang compact mode, cho cuộn ngang vùng kỹ thuật khi cần và vẫn cho phép lưu/chạy bằng bàn phím. `[planned-automated]` `P0` |
| TC-045 | [US-001][AC-045][BVA] editor không mở, trang hiển thị "API Lab Workflow cần màn hình desktop rộng tối thiểu 1280px." và vẫn cho quay lại Host. `[planned-automated]` `P0` |
| TC-046 | [US-009][AC-046][BVA+ST] API biến mất, Workflow phụ thuộc chuyển DISABLED, và toast "Đã xóa API {api_name}. Các workflow phụ thuộc đã bị vô hiệu hóa." hiển thị nút "Hoàn tác" trong 10 giây. `[planned-automated]` `P0` |
| TC-047 | [US-009][AC-047][BVA+ST] cùng API được khôi phục với định danh, cấu hình và vị trí cây trước khi xóa; Workflow phụ thuộc vẫn DISABLED cho tới khi Rà soát → Kiểm tra → Bật workflow. `[planned-automated]` `P0` |
| TC-048 | [US-009][AC-048][BVA+ST] API không được khôi phục và UI hiển thị "Không thể hoàn tác xóa API. API vẫn bị xóa." `[planned-automated]` `P0` |
| TC-049 | [US-006][AC-049][DT] Validation Report hiển thị một Cảnh báo tại đúng source Step/field và Workflow đủ điều kiện READY. `[planned-automated]` `P0` |
| TC-050 | [US-006][AC-050][EP+DT+DD] mỗi finding được gắn đúng Step/field/namespace, Run/Enable giữ disabled và người dùng không thể xác nhận để bỏ qua. `[planned-automated]` `P0` |
| TC-051 | [US-006][AC-051][DT] dialog hiển thị "Workflow còn {warnings} cảnh báo. Bạn có muốn tiếp tục?". `[planned-automated]` `P0` |
| TC-052 | [US-009][AC-052][ST] API vẫn bị xóa và UI hiển thị "Không thể hoàn tác xóa API. API vẫn bị xóa." `[planned-automated]` `P0` |
| TC-053 | [US-006][AC-053][DT] Validation Report hiển thị một Cảnh báo tại đúng API/Step và Workflow đủ điều kiện READY. `[planned-automated]` `P0` |
| TC-054 | [US-006][AC-054][DT] Validation Report hiển thị một Cảnh báo tại đúng API và Workflow đủ điều kiện READY. `[planned-automated]` `P0` |
| TC-055 | [US-006][AC-055][DT] hệ thống tạo Execution mới bằng saved revision đã validation và Environment hiện hành. `[planned-automated]` `P0` |
| TC-056 | [US-006][AC-056][DT] dialog đóng và không tạo Execution. `[planned-automated]` `P0` |
| TC-057 | [US-009][AC-057][DT] dialog hiển thị "Workflow còn {warnings} cảnh báo. Bạn có muốn tiếp tục?". `[planned-automated]` `P0` |
| TC-058 | [US-009][AC-058][DT+ST] Workflow chuyển READY và nút "Chạy workflow" được bật. `[planned-automated]` `P0` |
| TC-059 | [US-009][AC-059][DT+ST] Workflow giữ DISABLED và không tạo Execution. `[planned-automated]` `P0` |
| TC-060 | [FLOW-001][SIT] Atomic admission rejects races above 20 active workflows `[planned-automated]` `P0` |
| TC-061 | [FLOW-002][SIT] [EXC-STACK-001] OpenAPI, dependency-boundary and supported-version gates refute brownfield stack drift `[planned-automated]` `P0` |
| TC-062 | [FLOW-003][SIT] Dependency timeouts, circuit breakers and bulkheads fail closed at exact thresholds `[planned-automated]` `P0` |
| TC-063 | [FLOW-002][SIT] Durable job, lease heartbeat and recovery remain non-blocking and exactly-once `[planned-automated]` `P0` |
| TC-064 | [NFR-006][SIT] State changes emit correlated append-only audit without sensitive data `[planned-automated]` `P0` |
| TC-065 | [NFR-004][BVA+ST+Security+SIT] [EXC-AUTH-001] Durable OIDC state, session lifecycle and protected paths enforce one fail-closed browser boundary `[planned-automated]` `P0` |
| TC-066 | [NFR-001][Performance] Interactive CRUD, history and execution observation meet latency targets `[planned-automated]` `P0` |
| TC-067 | [NFR-003][Performance] Availability, capacity, lease recovery and autoscaling policy schema meet exact local bounds `[planned-automated]` `P0` |
| TC-068 | [NFR-004][Security] TLS, IAM lifecycle, encryption, SSRF, throttling, secret and promotion gates meet exact policy `[planned-automated]` `P0` |
| TC-069 | [NFR-005][SIT] Backup, PITR and restore satisfy RPO/RTO and atomic durability `[planned-automated]` `P0` |
| TC-070 | [NFR-006][BVA+DT+SIT] Generated errors, correlation, audit, alerts and exporter degradation meet exact bounds `[planned-automated]` `P0` |
| TC-071 | [NFR-007][BVA+ST] Retention, 200 KiB payload and exact 10-second Undo boundaries `[planned-automated]` `P0` |
| TC-072 | [NFR-008][Accessibility+Regression] Nine screens expose every approved state, copy, CTA, exit and viewport behavior `[planned-automated]` `P0` |
| TC-073 | [NFR-008][Performance+Regression] Coverage, production bundle, web vitals, cache and localization gates `[planned-automated]` `P0` |
| TC-074 | [NFR-009][Regression] Cost tags, idle TTL, showback and right-sizing evidence are complete `[planned-automated]` `P0` |
| TC-075 | [FLOW-002][SIT] Workspace-to-history three-step workflow completes, recovers and reruns `[planned-automated]` `P0` |
| TC-076 | [FLOW-002][SIT] [RISK-OPEN-001][Performance] Same-task AS-IS baseline and Workflow evidence prove the Product time and copy/paste KPIs `[planned-manual]` `P0` |

<!-- PRISM:INDEX:END -->

<!-- ID: TEST-COVERAGE-001 -->
### Rule / Branch Inventory

| Rule / AC / BR / Branch ID | Source Ref | Description | Covered TC IDs | Status | Gap / N/A Reason |
|---|---|---|---|---|---|
| AC-001 | EP-001 base proposal anchor AC-001 / US-001 | Host ACTIVE được chọn → trang API Workspace hiển thị đúng tên Host parent, environment selector và cây collection của Workspace belongs_to Host đó. | TC-001 | covered | — |
| AC-002 | EP-001 base proposal anchor AC-002 / US-001 | Host INACTIVE được mở → nút "Chạy API" và "Chạy workflow" bị disabled, banner "Host đang không hoạt động. Hãy kích hoạt Host trước khi chạy." hiển thị. | TC-002 | covered | — |
| AC-003 | EP-001 base proposal anchor AC-003 / US-001 | Người dùng tạo collection "Thanh toán", folder "Đối soát" và API "Lấy giao dịch" → ba node hiển thị đúng cấp trong cây và vẫn còn sau khi tải lại trang. | TC-003 | covered | — |
| AC-004 | EP-001 base proposal anchor AC-004 / US-002 | Thêm biến tenant_id vào Host → DEV, UAT và PROD cùng hiển thị key tenant_id, mỗi environment cho nhập giá trị riêng. | TC-004 | covered | — |
| AC-005 | EP-001 base proposal anchor AC-005 / US-002 | Chọn UAT khi biến bắt buộc tenant_id chưa có giá trị → execution bị chặn và step liên quan hiển thị "Thiếu giá trị biến tenant_id trong environment UAT." | TC-005 | covered | — |
| AC-006 | EP-001 base proposal anchor AC-006 / US-002 | Chọn UAT và chạy API "Lấy giao dịch" → execution details hiển thị environment UAT, dùng giá trị UAT của tenant_id và hiển thị credential thuộc sensitive config là ••••••••. | TC-006 | covered | — |
| AC-007 | EP-001 base proposal anchor AC-007 / US-003 | API "Lấy giao dịch" trả JSON thành công → panel kết quả hiển thị "Thành công", duration, request resolved và response JSON; các field/path thuộc sensitive_fields hiển thị ••••••••. | TC-007 | covered | — |
| AC-008 | EP-001 base proposal anchor AC-008 / US-003 | API cấu hình timeout 12 giây và API đích không phản hồi → attempt dừng ở 12 giây, panel hiển thị "API hết thời gian chờ sau 12 giây."; retry áp dụng theo cấu hình API step. | TC-008 | covered | — |
| AC-009 | EP-001 base proposal anchor AC-009 / US-003 | Response có token nằm trong sensitive_fields và customer_name không nằm trong cấu hình → preview/log/history hiển thị token là •••••••• nhưng giữ nguyên customer_name; hệ thống không tự mask field ngoài cấu hình. | TC-009 | covered | — |
| AC-010 | EP-001 base proposal anchor AC-010 / US-004 | Thêm API A, B, C và kéo thành thứ tự B → A → C → danh sách step lưu đúng thứ tự B, A, C sau khi tải lại trang. | TC-010 | covered | — |
| AC-011 | EP-001 base proposal anchor AC-011 / US-004 | Workflow đã có 20 step và người dùng thêm step thứ 21 → thao tác bị từ chối, hiển thị "Workflow chỉ hỗ trợ tối đa 20 bước trong phase 1." | TC-011 | covered | — |
| AC-012 | EP-001 base proposal anchor AC-012 / US-004 | Mở workflow editor trong phase 1 → editor không hiển thị tùy chọn parallel/loop và scope note hiển thị "Parallel và loop được lên kế hoạch cho v2." | TC-012 | covered | — |
| AC-013 | EP-001 base proposal anchor AC-013 / US-005 | Kéo biến Customer ID có giá trị C-001 từ step nguồn step_01 vào path của Step 3 → editor hiển thị expression ${{step_01.data.customer.id}} và resolved request của Step 3 hiển thị C-001 dù Step 2 nằm giữa. | TC-013 | covered | — |
| AC-014 | EP-001 base proposal anchor AC-014 / US-005 | Step 3 tham chiếu ${{step_01.data.customer.id}} nhưng step_01 không trả field đó → Step 3 không được gọi và hiển thị "Không tìm thấy ${{step_01.data.customer.id}}." | TC-014 | covered | — |
| AC-015 | EP-001 base proposal anchor AC-015 / US-005 | Người dùng chọn response text/XML làm nguồn mapping → mapping không được lưu và hiển thị "Phase 1 chỉ hỗ trợ mapping từ response JSON." | TC-015 | covered | — |
| AC-016 | EP-001 base proposal anchor AC-016 / US-006 | Workflow có dependency, variable và mapping hợp lệ → validation hiển thị "Workflow hợp lệ và sẵn sàng chạy." và trạng thái chuyển READY. | TC-016 | covered | — |
| AC-017 | EP-001 base proposal anchor AC-017 / US-006 | Environment PROD thiếu hai biến bắt buộc → validation hiển thị hai dòng lỗi riêng, mỗi dòng nêu đúng tên biến và environment; nút "Chạy workflow" bị disabled. | TC-017 | covered | — |
| AC-018 | EP-001 base proposal anchor AC-018 / US-006 | Workflow tham chiếu API đã xóa → validation hiển thị đúng step "API không còn tồn tại. Hãy chọn API thay thế hoặc xóa bước này." và giữ trạng thái DISABLED. | TC-018 | covered | — |
| AC-019 | EP-001 base proposal anchor AC-019 / US-007 | Execution ba step đều thành công → step 2 bắt đầu sau step 1 SUCCEEDED, step 3 bắt đầu sau step 2 SUCCEEDED, execution hiển thị SUCCEEDED và mỗi step có duration/input/output mask đúng sensitive_fields. | TC-019 | covered | — |
| AC-020 | EP-001 base proposal anchor AC-020 / US-007 | Step 2 chuyển FAILED sau khi hết retry → Step 3 giữ trạng thái "Chưa chạy", execution hiển thị "Thất bại tại bước 2." và không gửi request Step 3. | TC-020 | covered | — |
| AC-021 | EP-001 base proposal anchor AC-021 / US-007 | Hệ thống nhận xong response một step → trạng thái và response đã mask của step xuất hiện trên UI trong ≤ 1 giây. | TC-021 | covered | — |
| AC-022 | EP-001 base proposal anchor AC-022 / US-008 | Step cấu hình retry 2 lần và gặp một lỗi tạm thời thuộc nhóm được retry trước khi thành công → chỉ step đó được gọi lại, execution detail hiển thị step SUCCEEDED với "Số lần gọi: 2", các step trước không chạy lại. | TC-022 | covered | — |
| AC-023 | EP-001 base proposal anchor AC-023 / US-008 | Step cấu hình retry 2 lần và cả ba attempt đều timeout → step FAILED sau attempt thứ ba, history ghi retry_count: 2, execution dừng và không chạy lại step trước. | TC-023 | covered | — |
| AC-024 | EP-001 base proposal anchor AC-024 / US-008 | API gặp lỗi validation không thuộc nhóm được retry dù step cấu hình retry 5 lần → không có lần gọi thứ hai, step hiển thị FAILED với lý do "Lỗi không thuộc nhóm được retry." và execution dừng. | TC-024 | covered | — |
| AC-025 | EP-001 base proposal anchor AC-025 / US-009 | Xóa API đang được ba workflow dùng → dialog liệt kê đúng ba workflow và hiển thị "Các workflow này sẽ bị vô hiệu hóa sau khi xóa API." trước nút xác nhận. | TC-025 | covered | — |
| AC-026 | EP-001 base proposal anchor AC-026 / US-009 | Người dùng xác nhận xóa API → API biến mất khỏi collection, ba Workflow chuyển DISABLED và nút "Chạy workflow" bị disabled cho đến khi dependency hợp lệ, validation có 0 Lỗi và người dùng chủ động Bật workflow. | TC-026 | covered | — |
| AC-027 | EP-001 base proposal anchor AC-027 / US-009 | Host chuyển INACTIVE → mọi API/workflow của Host bị chặn chạy với thông báo "Host đang không hoạt động. Hãy kích hoạt Host trước khi chạy.", execution history cũ vẫn xem được. | TC-027 | covered | — |
| AC-028 | EP-001 base proposal anchor AC-028 / US-010 | Mở execution history → mỗi record hiển thị người chạy, resolved workflow version, environment ID, snapshot timestamp, trạng thái và duration; detail hiển thị attempts/lỗi/input/output mask đúng cấu hình, không chứa raw credential. | TC-028 | covered | — |
| AC-029 | EP-001 base proposal anchor AC-029 / US-010 | Chọn "Chạy lại" trên workflow READY → hệ thống validate latest saved workflow version, snapshot environment hiện hành, tạo execution ID mới, liên kết "Chạy lại từ [execution ID nguồn]" và không dùng version/snapshot cũ. | TC-029 | covered | — |
| AC-030 | EP-001 base proposal anchor AC-030 / US-010 | Execution vượt quá 30 ngày retention → record không còn xuất hiện trong history sau tác vụ retention, trong khi execution đúng 30 ngày hoặc mới hơn vẫn hiển thị. | TC-030 | covered | — |
| AC-031 | EP-001 base proposal anchor AC-031 / US-007 | Execution bắt đầu bằng latest workflow version v5 rồi workflow được lưu thành v6 trong lúc chạy → execution hiện tại hoàn tất toàn bộ step theo v5; execution mới sau đó resolve v6. | TC-031 | covered | — |
| AC-032 | EP-001 base proposal anchor AC-032 / US-002 | Execution bắt đầu với tenant_id=C-001 rồi environment được sửa thành tenant_id=C-002 trong lúc chạy → mọi step của execution hiện tại tiếp tục dùng snapshot C-001; execution mới dùng C-002. | TC-032 | covered | — |
| AC-033 | EP-001 base proposal anchor AC-033 / US-006 | Persistence/import phát hiện hai step có cùng step_key kỹ thuật dù key không thể sửa từ UI → validation hiển thị hai vị trí xung đột với thông báo "Khóa bước bị trùng. Hãy lưu lại hoặc liên hệ quản trị viên.", chặn execution và không overwrite biến; hệ thống không tự đổi key vì key là bất biến. | TC-033 | covered | — |
| AC-034 | EP-001 base proposal anchor AC-034 / US-004 | Thêm một API vào workflow → hệ thống hiển thị step_key kỹ thuật duy nhất trong field chỉ đọc và không cung cấp thao tác sửa key. | TC-034 | covered | — |
| AC-035 | EP-001 base proposal anchor AC-035 / US-005 | Kéo biến của Step 3 vào input Step 2 → editor từ chối lưu mapping và hiển thị "Chỉ được ánh xạ dữ liệu từ bước đứng trước; mapping ngược có thể tạo vòng lặp." | TC-035 | covered | — |
| AC-036 | EP-001 base proposal anchor AC-036 / US-009 | Chọn đổi HTTP method của API đang được hai workflow dùng → dialog liệt kê đúng hai workflow và hiển thị "Các workflow này sẽ bị vô hiệu hóa nếu bạn xác nhận thay đổi method." | TC-036 | covered | — |
| AC-037 | EP-001 base proposal anchor AC-037 / US-009 | Kích hoạt lại Host ACTIVE sau khi Host từng làm workflow chuyển DISABLED → workflow vẫn DISABLED, nút "Chạy workflow" vẫn disabled và UI hiển thị yêu cầu review/validate trước khi bật lại. | TC-037 | covered | — |
| AC-038 | EP-001 base proposal anchor AC-038 / US-004 | Đổi label của step đã được các step sau tham chiếu → step_key và mọi expression đang dùng key đó vẫn giữ nguyên sau khi lưu và tải lại workflow. | TC-038 | covered | — |
| AC-039 | EP-001 base proposal anchor AC-039 / US-009 | Xác nhận đổi HTTP method trong impact dialog → hai Workflow được liệt kê chuyển DISABLED và nút "Chạy workflow" của chúng bị disabled cho đến khi review, validation có 0 Lỗi, xác nhận Cảnh báo nếu có và enable lại. | TC-039 | covered | — |
| AC-040 | EP-001 base proposal anchor AC-040 / US-009 | Chọn "Bật workflow" sau khi Host đã ACTIVE, người dùng đã review, validation có 0 Lỗi và không còn Cảnh báo → Workflow chuyển READY và nút "Chạy workflow" được bật. | TC-040 | covered | — |
| AC-041 | EP-001 base proposal anchor AC-041 / US-003 | API độc lập bắt đầu khi environment có tenant_id=C-001, sau đó giá trị được sửa thành C-002 trước khi API trả kết quả → execution hiện tại vẫn hiển thị request resolved bằng snapshot C-001; execution mới dùng C-002. | TC-041 | covered | — |
| AC-042 | EP-001 base proposal anchor AC-042 / US-006 | Chạy validation khi Step 2 đang tham chiếu biến của Step 3 → validation gắn lỗi vào Step 2, hiển thị "Chỉ được tham chiếu bước đứng trước." và giữ nút "Chạy workflow" ở trạng thái disabled. | TC-042 | covered | — |
| AC-043 | EP-001 base proposal anchor AC-043 / US-007 | Workflow execution bắt đầu với tenant_id=C-001, sau đó environment được sửa thành C-002 trong lúc chạy → mọi step còn lại của execution hiện tại tiếp tục hiển thị resolved input từ snapshot C-001; execution mới dùng C-002. | TC-043 | covered | — |
| AC-044 | Approved delta v1.7.18-api-lab-undo-warning-viewport anchor AC-044 / US-001 | Mở API Lab trên desktop có screen width >= 1280px rồi zoom trình duyệt tới 200% → editor chuyển sang compact mode, cho cuộn ngang vùng kỹ thuật khi cần và vẫn cho phép lưu/chạy bằng bàn phím. | TC-044 | covered | — |
| AC-045 | Approved delta v1.7.18-api-lab-undo-warning-viewport anchor AC-045 / US-001 | Mở API Lab trên thiết bị có screen width < 1280px → editor không mở, trang hiển thị "API Lab Workflow cần màn hình desktop rộng tối thiểu 1280px." và vẫn cho quay lại Host. | TC-045 | covered | — |
| AC-046 | Approved delta v1.7.18-api-lab-undo-warning-viewport anchor AC-046 / US-009 | Xác nhận xóa API đang được Workflow sử dụng → API biến mất, Workflow phụ thuộc chuyển DISABLED, và toast "Đã xóa API {api_name}. Các workflow phụ thuộc đã bị vô hiệu hóa." hiển thị nút "Hoàn tác" trong 10 giây. | TC-046 | covered | — |
| AC-047 | Approved delta v1.7.18-api-lab-undo-warning-viewport anchor AC-047 / US-009 | Chọn "Hoàn tác" trong 10 giây → cùng API được khôi phục với định danh, cấu hình và vị trí cây trước khi xóa; Workflow phụ thuộc vẫn DISABLED cho tới khi Rà soát → Kiểm tra → Bật workflow. | TC-047 | covered | — |
| AC-048 | Approved delta v1.7.18-api-lab-undo-warning-viewport anchor AC-048 / US-009 | Hệ thống nhận một yêu cầu "Hoàn tác" khi cửa sổ 10 giây đã hết → API không được khôi phục và UI hiển thị "Không thể hoàn tác xóa API. API vẫn bị xóa." | TC-048 | covered | — |
| AC-049 | Approved delta v1.7.18-api-lab-undo-warning-viewport anchor AC-049 / US-006 | Source mapping chưa có response mẫu nhưng workflow không có Lỗi → Validation Report hiển thị một Cảnh báo tại đúng source Step/field và Workflow đủ điều kiện READY. | TC-049 | covered | — |
| AC-050 | Approved delta v1.7.18-api-lab-undo-warning-viewport anchor AC-050 / US-006 | Workflow khớp một hàng Lỗi trong Validation Severity Decision Table của FR-007 → mỗi finding được gắn đúng Step/field/namespace, Run/Enable giữ disabled và người dùng không thể xác nhận để bỏ qua. | TC-050 | covered | — |
| AC-051 | Approved delta v1.7.18-api-lab-undo-warning-viewport anchor AC-051 / US-006 | Workflow READY có 0 Lỗi và ít nhất 1 Cảnh báo rồi người dùng chọn Run → dialog hiển thị "Workflow còn {warnings} cảnh báo. Bạn có muốn tiếp tục?". | TC-051 | covered | — |
| AC-052 | Approved delta v1.7.18-api-lab-undo-warning-viewport anchor AC-052 / US-009 | Người dùng chọn "Hoàn tác" trong 10 giây nhưng restore thất bại → API vẫn bị xóa và UI hiển thị "Không thể hoàn tác xóa API. API vẫn bị xóa." | TC-052 | covered | — |
| AC-053 | Approved delta v1.7.18-api-lab-undo-warning-viewport anchor AC-053 / US-006 | API của một Step đang kế thừa Host timeout nhưng workflow không có Lỗi → Validation Report hiển thị một Cảnh báo tại đúng API/Step và Workflow đủ điều kiện READY. | TC-053 | covered | — |
| AC-054 | Approved delta v1.7.18-api-lab-undo-warning-viewport anchor AC-054 / US-006 | API có sensitive_fields rỗng nhưng workflow không có Lỗi → Validation Report hiển thị một Cảnh báo tại đúng API và Workflow đủ điều kiện READY. | TC-054 | covered | — |
| AC-055 | Approved delta v1.7.18-api-lab-undo-warning-viewport anchor AC-055 / US-006 | Dialog Cảnh báo được mở từ Run rồi người dùng chọn "Tiếp tục" → hệ thống tạo Execution mới bằng saved revision đã validation và Environment hiện hành. | TC-055 | covered | — |
| AC-056 | Approved delta v1.7.18-api-lab-undo-warning-viewport anchor AC-056 / US-006 | Dialog Cảnh báo được mở từ Run rồi người dùng chọn "Quay lại báo cáo" → dialog đóng và không tạo Execution. | TC-056 | covered | — |
| AC-057 | Approved delta v1.7.18-api-lab-undo-warning-viewport anchor AC-057 / US-009 | Workflow DISABLED đã được review, dependency hợp lệ, validation có 0 Lỗi và ít nhất 1 Cảnh báo rồi người dùng chọn "Bật workflow" → dialog hiển thị "Workflow còn {warnings} cảnh báo. Bạn có muốn tiếp tục?". | TC-057 | covered | — |
| AC-058 | Approved delta v1.7.18-api-lab-undo-warning-viewport anchor AC-058 / US-009 | Dialog Cảnh báo được mở từ "Bật workflow" rồi người dùng chọn "Tiếp tục" → Workflow chuyển READY và nút "Chạy workflow" được bật. | TC-058 | covered | — |
| AC-059 | Approved delta v1.7.18-api-lab-undo-warning-viewport anchor AC-059 / US-009 | Dialog Cảnh báo được mở từ "Bật workflow" rồi người dùng chọn "Quay lại báo cáo" → Workflow giữ DISABLED và không tạo Execution. | TC-059 | covered | — |
| BR-001 | EP-001 base + approved delta effective anchor BR-001 | Credential và dữ liệu nhạy cảm theo Host environment | TC-006, TC-009, TC-028, TC-064, TC-068 | covered | — |
| BR-002 | EP-001 base + approved delta effective anchor BR-002 | Schema biến nhất quán giữa environment | TC-004, TC-005, TC-017 | covered | — |
| BR-003 | EP-001 base + approved delta effective anchor BR-003 | Thực thi tuần tự trong phase 1 | TC-010–020, TC-033, TC-035, TC-042 | covered | — |
| BR-004 | EP-001 base + approved delta effective anchor BR-004 | Timeout và retry có giới hạn | TC-008, TC-022–024, TC-067 | covered | — |
| BR-005 | EP-001 base + approved delta effective anchor BR-005 | Dependency bị xóa hoặc đổi contract làm workflow vô hiệu | TC-018, TC-025–026, TC-036–040, TC-046–059 | covered | — |
| BR-006 | EP-001 base + approved delta effective anchor BR-006 | Host không hoạt động chặn execution | TC-002, TC-027, TC-037 | covered | — |
| BR-007 | EP-001 base + approved delta effective anchor BR-007 | Execution history giữ 30 ngày | TC-028–030, TC-071 | covered | — |
| BR-008 | EP-001 base + approved delta effective anchor BR-008 | Quyền đồng nhất cho người dùng đã đăng nhập | TC-001–003, TC-065 | covered | — |
| BR-009 | EP-001 base + approved delta effective anchor BR-009 | Latest workflow được cố định cho mỗi execution | TC-031, TC-075 | covered | — |
| BR-010 | EP-001 base + approved delta effective anchor BR-010 | Snapshot environment tại execution start | TC-032, TC-041, TC-043 | covered | — |
| BR-011 | EP-001 base + approved delta effective anchor BR-011 | Variable namespace không overwrite và validation severity | TC-013–018, TC-033, TC-035, TC-038, TC-042, TC-049–059 | covered | — |
| BR-012 | EP-001 base + approved delta effective anchor BR-012 | API delete và Undo lifecycle | TC-046–048, TC-052, TC-071 | covered | — |
| RISK-OPEN-001 | PRD §3.1/§10b; pack `v1.7.19-kpi-baseline-deadline` | Baseline và kết quả KPI cho cùng pilot/tác vụ chuỗi ba API: thời gian đến first success ≤10 phút; copy/paste giảm ≥80% | TC-076 | protocol covered for Test approval; execution evidence due before `approve implement` | Missing/zero/mismatched real evidence yields `KPI_INCONCLUSIVE` and blocks `approve implement`; no synthetic closure |
| NFR-010 | Architecture candidate NFR-010 | Exact OIDC state/session TTL, idle/activity intervals, login/status budgets, zero protected-status cache/retry and distinct key references | TC-065, TC-070 | covered | — |
| API-024 endpoint decision matrix | Architecture candidate API-024 | API-017–020 and inherited protected endpoints distinguish IAM/key/store 503 inheritance; 429/503 require integer 1..86400 body/header equality; other statuses omit retry metadata | TC-070 | covered | — |
| API-018 recovery branches | Architecture API-018/SEQ-001 + Design DS-COMP-012 | Pre-claim Waiting/Ready/Exhausted; one same-callback retry; exhausted clear-to-login with zero network request; post-claim fresh API-017; malformed fail-closed recovery | TC-065, TC-072 | covered | — |
| [Derived] AuthZ boundary | Architecture candidate truth §API-001–024 + ADR-006 + ARCH-COMP-001 + EXC-AUTH-001 | Callback state/PKCE/MFA; protected UI/direct API; CSRF/revocation/idle; unknown session and inactive authority are 401, uncertainty is 503; API-019/020 never use session 404; no browser token storage | TC-065, TC-068 | covered | — |
| [Derived] Dependency failure | Architecture candidate truth §SEQ-001–006 + FLOW-001/002/004 + API-024 | IAM/key/DB/provider timeout, exact typed error and no-payload behavior; ENT-022 store failure before claim rolls back, while post-claim failure requires fresh API-017 | TC-062, TC-065, TC-070 | covered | — |
| [Derived] Idempotency / data integrity | Architecture candidate truth §API writes + ADR-004 + ENT-022/023 | No duplicate side effect; one claim winner; pre-claim rollback remains unconsumed; post-claim failure creates no session; invalidation/activity commit atomically | TC-060, TC-063, TC-065, TC-075 | covered | — |
| [Derived] Event / audit emission | Architecture effective truth §FLOW-001/002 + NFR-006 | Append-only audit after state changes; EVT-001 defines no broker event | TC-064, TC-070 | covered | — |
| [Derived] Async / non-blocking | Architecture effective truth §SEQ-004/006 lease queue + EXC-QUEUE-001 | Durable job, lease, DEAD exhaustion, terminal state, slot release, inspect and authorized recovery | TC-063 | covered | — |
| [Derived] Contract compatibility | Architecture candidate truth §Versioned API-001–024 consumers + PR-008 + EXC-STACK-001 | OpenAPI/error compatibility; 503 integer 1..86400 body/header equality and endpoint inheritance; pre-release aliases rejected; import boundaries, supported-version/EOL and no production source map | TC-061, TC-070, TC-073 | covered | — |
| [Derived] Pre-condition violation | Architecture effective truth §Host/workflow/environment readiness contracts | Reject inactive/missing/stale/invalid prerequisites | TC-002, TC-005, TC-018, TC-050, TC-062 | covered | — |
| [Derived] Configured-parameter enforcement | Architecture candidate truth §NFR-010 plus timeout/retry/capacity/retention config + EXC-RETRY-001 | Identity state/idle/activity values; 5000ms login budget with safe-GET-only retry; token retry 0; one 2000ms status call, cache/retry 0 and reference-only keys; provider 0–5 fixed-delay rules remain intact | TC-008, TC-011, TC-022–024, TC-060, TC-062, TC-065, TC-067, TC-071 | covered | — |
| [Derived] Integration routing | Architecture candidate truth §FLOW-004/API-017–024 and Gateway/IAM/key/audit mandatory ports | Browser authorize/callback routes via IAM; generated identity errors traverse real middleware; post-claim recovery invokes API-017; no bypass around Identity/Gateway/Audit | TC-062, TC-065, TC-068, TC-070, TC-072 | covered | — |
| [Derived] Derived-state / computed-view | Architecture effective truth §Workflow/execution/history statuses | Lifecycle appearance, update and disappearance | TC-016, TC-019–020, TC-026–030, TC-071 | covered | — |

### Per-AC Technique Decision Matrix

| AC ID | BVA Y/N + reason | EP Y/N + reason | DT Y/N + reason | ST Y/N + reason | DD Y/N + reason | TC IDs generated |
|---|---|---|---|---|---|---|
| US-001 AC-001 | N — AC không định nghĩa cạnh số/lượng/thời gian cần probe. | N — AC không chia đầu vào thành nhiều lớp hành vi tương đương. | N — AC không có tổ hợp từ hai điều kiện độc lập trở lên. | N — AC không định nghĩa chuyển trạng thái cần kiểm tra. | N — AC không có từ ba biến thể cùng hình dạng kết quả. | TC-001 (Positive) |
| US-001 AC-002 | N — AC không định nghĩa cạnh số/lượng/thời gian cần probe. | N — AC không chia đầu vào thành nhiều lớp hành vi tương đương. | N — AC không có tổ hợp từ hai điều kiện độc lập trở lên. | N — AC không định nghĩa chuyển trạng thái cần kiểm tra. | N — AC không có từ ba biến thể cùng hình dạng kết quả. | TC-002 (Negative) |
| US-001 AC-003 | N — AC không định nghĩa cạnh số/lượng/thời gian cần probe. | N — AC không chia đầu vào thành nhiều lớp hành vi tương đương. | N — AC không có tổ hợp từ hai điều kiện độc lập trở lên. | N — AC không định nghĩa chuyển trạng thái cần kiểm tra. | N — AC không có từ ba biến thể cùng hình dạng kết quả. | TC-003 (Positive) |
| US-002 AC-004 | N — AC không định nghĩa cạnh số/lượng/thời gian cần probe. | Y — full AC-004 clause: “Thêm biến tenant_id vào Host → DEV, UAT và PROD cùng hiển thị key tenant_id, mỗi environment cho nhập giá trị riêng.” | N — AC không có tổ hợp từ hai điều kiện độc lập trở lên. | N — AC không định nghĩa chuyển trạng thái cần kiểm tra. | Y — full AC-004 clause: “Thêm biến tenant_id vào Host → DEV, UAT và PROD cùng hiển thị key tenant_id, mỗi environment cho nhập giá trị riêng.” | TC-004 (EP+DD) |
| US-002 AC-005 | N — AC không định nghĩa cạnh số/lượng/thời gian cần probe. | N — AC không chia đầu vào thành nhiều lớp hành vi tương đương. | Y — full AC-005 clause: “Chọn UAT khi biến bắt buộc tenant_id chưa có giá trị → execution bị chặn và step liên quan hiển thị "Thiếu giá trị biến tenant_id trong environment UAT."” | N — AC không định nghĩa chuyển trạng thái cần kiểm tra. | N — AC không có từ ba biến thể cùng hình dạng kết quả. | TC-005 (DT) |
| US-002 AC-006 | N — AC không định nghĩa cạnh số/lượng/thời gian cần probe. | N — AC không chia đầu vào thành nhiều lớp hành vi tương đương. | N — AC không có tổ hợp từ hai điều kiện độc lập trở lên. | N — AC không định nghĩa chuyển trạng thái cần kiểm tra. | N — AC không có từ ba biến thể cùng hình dạng kết quả. | TC-006 (Positive) |
| US-003 AC-007 | N — AC không định nghĩa cạnh số/lượng/thời gian cần probe. | N — AC không chia đầu vào thành nhiều lớp hành vi tương đương. | N — AC không có tổ hợp từ hai điều kiện độc lập trở lên. | N — AC không định nghĩa chuyển trạng thái cần kiểm tra. | N — AC không có từ ba biến thể cùng hình dạng kết quả. | TC-007 (Positive) |
| US-003 AC-008 | Y — full AC-008 clause: “API cấu hình timeout 12 giây và API đích không phản hồi → attempt dừng ở 12 giây, panel hiển thị "API hết thời gian chờ sau 12 giây."; retry áp dụng theo cấu hình API step.” | N — AC không chia đầu vào thành nhiều lớp hành vi tương đương. | N — AC không có tổ hợp từ hai điều kiện độc lập trở lên. | N — AC không định nghĩa chuyển trạng thái cần kiểm tra. | N — AC không có từ ba biến thể cùng hình dạng kết quả. | TC-008 (BVA) |
| US-003 AC-009 | N — AC không định nghĩa cạnh số/lượng/thời gian cần probe. | Y — full AC-009 clause: “Response có token nằm trong sensitive_fields và customer_name không nằm trong cấu hình → preview/log/history hiển thị token là •••••••• nhưng giữ nguyên customer_name; hệ thống không tự mask field ngoài cấu hình.” | N — AC không có tổ hợp từ hai điều kiện độc lập trở lên. | N — AC không định nghĩa chuyển trạng thái cần kiểm tra. | Y — full AC-009 clause: “Response có token nằm trong sensitive_fields và customer_name không nằm trong cấu hình → preview/log/history hiển thị token là •••••••• nhưng giữ nguyên customer_name; hệ thống không tự mask field ngoài cấu hình.” | TC-009 (EP+DD) |
| US-004 AC-010 | N — AC không định nghĩa cạnh số/lượng/thời gian cần probe. | N — AC không chia đầu vào thành nhiều lớp hành vi tương đương. | N — AC không có tổ hợp từ hai điều kiện độc lập trở lên. | N — AC không định nghĩa chuyển trạng thái cần kiểm tra. | N — AC không có từ ba biến thể cùng hình dạng kết quả. | TC-010 (Positive) |
| US-004 AC-011 | Y — full AC-011 clause: “Workflow đã có 20 step và người dùng thêm step thứ 21 → thao tác bị từ chối, hiển thị "Workflow chỉ hỗ trợ tối đa 20 bước trong phase 1."” | N — AC không chia đầu vào thành nhiều lớp hành vi tương đương. | N — AC không có tổ hợp từ hai điều kiện độc lập trở lên. | N — AC không định nghĩa chuyển trạng thái cần kiểm tra. | N — AC không có từ ba biến thể cùng hình dạng kết quả. | TC-011 (BVA) |
| US-004 AC-012 | N — AC không định nghĩa cạnh số/lượng/thời gian cần probe. | N — AC không chia đầu vào thành nhiều lớp hành vi tương đương. | N — AC không có tổ hợp từ hai điều kiện độc lập trở lên. | N — AC không định nghĩa chuyển trạng thái cần kiểm tra. | N — AC không có từ ba biến thể cùng hình dạng kết quả. | TC-012 (Positive) |
| US-005 AC-013 | N — AC không định nghĩa cạnh số/lượng/thời gian cần probe. | N — AC không chia đầu vào thành nhiều lớp hành vi tương đương. | N — AC không có tổ hợp từ hai điều kiện độc lập trở lên. | N — AC không định nghĩa chuyển trạng thái cần kiểm tra. | N — AC không có từ ba biến thể cùng hình dạng kết quả. | TC-013 (Positive) |
| US-005 AC-014 | N — AC không định nghĩa cạnh số/lượng/thời gian cần probe. | N — AC không chia đầu vào thành nhiều lớp hành vi tương đương. | N — AC không có tổ hợp từ hai điều kiện độc lập trở lên. | N — AC không định nghĩa chuyển trạng thái cần kiểm tra. | N — AC không có từ ba biến thể cùng hình dạng kết quả. | TC-014 (Negative) |
| US-005 AC-015 | N — AC không định nghĩa cạnh số/lượng/thời gian cần probe. | Y — full AC-015 clause: “Người dùng chọn response text/XML làm nguồn mapping → mapping không được lưu và hiển thị "Phase 1 chỉ hỗ trợ mapping từ response JSON."” | N — AC không có tổ hợp từ hai điều kiện độc lập trở lên. | N — AC không định nghĩa chuyển trạng thái cần kiểm tra. | N — AC không có từ ba biến thể cùng hình dạng kết quả. | TC-015 (EP) |
| US-006 AC-016 | N — AC không định nghĩa cạnh số/lượng/thời gian cần probe. | N — AC không chia đầu vào thành nhiều lớp hành vi tương đương. | N — AC không có tổ hợp từ hai điều kiện độc lập trở lên. | Y — full AC-016 clause: “Workflow có dependency, variable và mapping hợp lệ → validation hiển thị "Workflow hợp lệ và sẵn sàng chạy." và trạng thái chuyển READY.” | N — AC không có từ ba biến thể cùng hình dạng kết quả. | TC-016 (ST) |
| US-006 AC-017 | N — AC không định nghĩa cạnh số/lượng/thời gian cần probe. | N — AC không chia đầu vào thành nhiều lớp hành vi tương đương. | Y — full AC-017 clause: “Environment PROD thiếu hai biến bắt buộc → validation hiển thị hai dòng lỗi riêng, mỗi dòng nêu đúng tên biến và environment; nút "Chạy workflow" bị disabled.” | N — AC không định nghĩa chuyển trạng thái cần kiểm tra. | Y — full AC-017 clause: “Environment PROD thiếu hai biến bắt buộc → validation hiển thị hai dòng lỗi riêng, mỗi dòng nêu đúng tên biến và environment; nút "Chạy workflow" bị disabled.” | TC-017 (DT+DD) |
| US-006 AC-018 | N — AC không định nghĩa cạnh số/lượng/thời gian cần probe. | N — AC không chia đầu vào thành nhiều lớp hành vi tương đương. | N — AC không có tổ hợp từ hai điều kiện độc lập trở lên. | Y — full AC-018 clause: “Workflow tham chiếu API đã xóa → validation hiển thị đúng step "API không còn tồn tại. Hãy chọn API thay thế hoặc xóa bước này." và giữ trạng thái DISABLED.” | N — AC không có từ ba biến thể cùng hình dạng kết quả. | TC-018 (ST) |
| US-007 AC-019 | N — AC không định nghĩa cạnh số/lượng/thời gian cần probe. | N — AC không chia đầu vào thành nhiều lớp hành vi tương đương. | N — AC không có tổ hợp từ hai điều kiện độc lập trở lên. | Y — full AC-019 clause: “Execution ba step đều thành công → step 2 bắt đầu sau step 1 SUCCEEDED, step 3 bắt đầu sau step 2 SUCCEEDED, execution hiển thị SUCCEEDED và mỗi step có duration/input/output mask đúng sensitive_fields.” | N — AC không có từ ba biến thể cùng hình dạng kết quả. | TC-019 (ST) |
| US-007 AC-020 | N — AC không định nghĩa cạnh số/lượng/thời gian cần probe. | N — AC không chia đầu vào thành nhiều lớp hành vi tương đương. | N — AC không có tổ hợp từ hai điều kiện độc lập trở lên. | Y — full AC-020 clause: “Step 2 chuyển FAILED sau khi hết retry → Step 3 giữ trạng thái "Chưa chạy", execution hiển thị "Thất bại tại bước 2." và không gửi request Step 3.” | N — AC không có từ ba biến thể cùng hình dạng kết quả. | TC-020 (ST) |
| US-007 AC-021 | Y — full AC-021 clause: “Hệ thống nhận xong response một step → trạng thái và response đã mask của step xuất hiện trên UI trong ≤ 1 giây.” | N — AC không chia đầu vào thành nhiều lớp hành vi tương đương. | N — AC không có tổ hợp từ hai điều kiện độc lập trở lên. | N — AC không định nghĩa chuyển trạng thái cần kiểm tra. | N — AC không có từ ba biến thể cùng hình dạng kết quả. | TC-021 (BVA) |
| US-008 AC-022 | Y — full AC-022 clause: “Step cấu hình retry 2 lần và gặp một lỗi tạm thời thuộc nhóm được retry trước khi thành công → chỉ step đó được gọi lại, execution detail hiển thị step SUCCEEDED với "Số lần gọi: 2", các step trước không chạy lại.” | N — AC không chia đầu vào thành nhiều lớp hành vi tương đương. | N — AC không có tổ hợp từ hai điều kiện độc lập trở lên. | N — AC không định nghĩa chuyển trạng thái cần kiểm tra. | N — AC không có từ ba biến thể cùng hình dạng kết quả. | TC-022 (BVA) |
| US-008 AC-023 | Y — full AC-023 clause: “Step cấu hình retry 2 lần và cả ba attempt đều timeout → step FAILED sau attempt thứ ba, history ghi retry_count: 2, execution dừng và không chạy lại step trước.” | N — AC không chia đầu vào thành nhiều lớp hành vi tương đương. | N — AC không có tổ hợp từ hai điều kiện độc lập trở lên. | N — AC không định nghĩa chuyển trạng thái cần kiểm tra. | N — AC không có từ ba biến thể cùng hình dạng kết quả. | TC-023 (BVA) |
| US-008 AC-024 | N — `retry 5 lần` là cấu hình tiền điều kiện; outcome không đổi theo cạnh số vì lỗi validation thuộc lớp không retry. | N — AC chỉ định một lớp lỗi validation không retry; phân lớp retryable/non-retryable đã được tách ở AC-022/023/024 thay vì lặp trong case này. | N — AC không có tổ hợp từ hai điều kiện độc lập trở lên. | N — AC không định nghĩa chuyển trạng thái cần kiểm tra. | N — AC không có từ ba biến thể cùng hình dạng kết quả. | TC-024 (Negative) |
| US-009 AC-025 | N — AC không định nghĩa cạnh số/lượng/thời gian cần probe. | N — AC không chia đầu vào thành nhiều lớp hành vi tương đương. | Y — full AC-025 clause: “Xóa API đang được ba workflow dùng → dialog liệt kê đúng ba workflow và hiển thị "Các workflow này sẽ bị vô hiệu hóa sau khi xóa API." trước nút xác nhận.” | N — AC không định nghĩa chuyển trạng thái cần kiểm tra. | Y — full AC-025 clause: “Xóa API đang được ba workflow dùng → dialog liệt kê đúng ba workflow và hiển thị "Các workflow này sẽ bị vô hiệu hóa sau khi xóa API." trước nút xác nhận.” | TC-025 (DT+DD) |
| US-009 AC-026 | N — AC không định nghĩa cạnh số/lượng/thời gian cần probe. | N — AC không chia đầu vào thành nhiều lớp hành vi tương đương. | N — AC không có tổ hợp từ hai điều kiện độc lập trở lên. | Y — full AC-026 clause: “Người dùng xác nhận xóa API → API biến mất khỏi collection, ba Workflow chuyển DISABLED và nút "Chạy workflow" bị disabled cho đến khi dependency hợp lệ, validation có 0 Lỗi và người dùng chủ động Bật workflow.” | N — AC không có từ ba biến thể cùng hình dạng kết quả. | TC-026 (ST) |
| US-009 AC-027 | N — AC không định nghĩa cạnh số/lượng/thời gian cần probe. | N — AC không chia đầu vào thành nhiều lớp hành vi tương đương. | N — AC không có tổ hợp từ hai điều kiện độc lập trở lên. | Y — full AC-027 clause: “Host chuyển INACTIVE → mọi API/workflow của Host bị chặn chạy với thông báo "Host đang không hoạt động. Hãy kích hoạt Host trước khi chạy.", execution history cũ vẫn xem được.” | N — AC không có từ ba biến thể cùng hình dạng kết quả. | TC-027 (ST) |
| US-010 AC-028 | N — AC không định nghĩa cạnh số/lượng/thời gian cần probe. | N — AC không chia đầu vào thành nhiều lớp hành vi tương đương. | N — AC không có tổ hợp từ hai điều kiện độc lập trở lên. | N — AC không định nghĩa chuyển trạng thái cần kiểm tra. | N — AC không có từ ba biến thể cùng hình dạng kết quả. | TC-028 (Positive) |
| US-010 AC-029 | N — AC không định nghĩa cạnh số/lượng/thời gian cần probe. | N — AC không chia đầu vào thành nhiều lớp hành vi tương đương. | N — AC không có tổ hợp từ hai điều kiện độc lập trở lên. | N — AC không định nghĩa chuyển trạng thái cần kiểm tra. | N — AC không có từ ba biến thể cùng hình dạng kết quả. | TC-029 (Positive) |
| US-010 AC-030 | Y — full AC-030 clause: “Execution vượt quá 30 ngày retention → record không còn xuất hiện trong history sau tác vụ retention, trong khi execution đúng 30 ngày hoặc mới hơn vẫn hiển thị.” | N — AC không chia đầu vào thành nhiều lớp hành vi tương đương. | N — AC không có tổ hợp từ hai điều kiện độc lập trở lên. | N — AC không định nghĩa chuyển trạng thái cần kiểm tra. | N — AC không có từ ba biến thể cùng hình dạng kết quả. | TC-030 (BVA) |
| US-007 AC-031 | N — AC không định nghĩa cạnh số/lượng/thời gian cần probe. | N — AC không chia đầu vào thành nhiều lớp hành vi tương đương. | N — AC không có tổ hợp từ hai điều kiện độc lập trở lên. | Y — full AC-031 clause: “Execution bắt đầu bằng latest workflow version v5 rồi workflow được lưu thành v6 trong lúc chạy → execution hiện tại hoàn tất toàn bộ step theo v5; execution mới sau đó resolve v6.” | N — AC không có từ ba biến thể cùng hình dạng kết quả. | TC-031 (ST) |
| US-002 AC-032 | N — AC không định nghĩa cạnh số/lượng/thời gian cần probe. | N — AC không chia đầu vào thành nhiều lớp hành vi tương đương. | N — AC không có tổ hợp từ hai điều kiện độc lập trở lên. | Y — full AC-032 clause: “Execution bắt đầu với tenant_id=C-001 rồi environment được sửa thành tenant_id=C-002 trong lúc chạy → mọi step của execution hiện tại tiếp tục dùng snapshot C-001; execution mới dùng C-002.” | N — AC không có từ ba biến thể cùng hình dạng kết quả. | TC-032 (ST) |
| US-006 AC-033 | N — AC không định nghĩa cạnh số/lượng/thời gian cần probe. | N — AC không chia đầu vào thành nhiều lớp hành vi tương đương. | N — AC không có tổ hợp từ hai điều kiện độc lập trở lên. | N — AC không định nghĩa chuyển trạng thái cần kiểm tra. | N — AC không có từ ba biến thể cùng hình dạng kết quả. | TC-033 (Negative) |
| US-004 AC-034 | N — AC không định nghĩa cạnh số/lượng/thời gian cần probe. | N — AC không chia đầu vào thành nhiều lớp hành vi tương đương. | N — AC không có tổ hợp từ hai điều kiện độc lập trở lên. | N — AC không định nghĩa chuyển trạng thái cần kiểm tra. | N — AC không có từ ba biến thể cùng hình dạng kết quả. | TC-034 (Positive) |
| US-005 AC-035 | N — AC không định nghĩa cạnh số/lượng/thời gian cần probe. | N — AC không chia đầu vào thành nhiều lớp hành vi tương đương. | N — AC không có tổ hợp từ hai điều kiện độc lập trở lên. | N — AC không định nghĩa chuyển trạng thái cần kiểm tra. | N — AC không có từ ba biến thể cùng hình dạng kết quả. | TC-035 (Negative) |
| US-009 AC-036 | N — AC không định nghĩa cạnh số/lượng/thời gian cần probe. | N — AC không chia đầu vào thành nhiều lớp hành vi tương đương. | Y — full AC-036 clause: “Chọn đổi HTTP method của API đang được hai workflow dùng → dialog liệt kê đúng hai workflow và hiển thị "Các workflow này sẽ bị vô hiệu hóa nếu bạn xác nhận thay đổi method."” | N — AC không định nghĩa chuyển trạng thái cần kiểm tra. | Y — full AC-036 clause: “Chọn đổi HTTP method của API đang được hai workflow dùng → dialog liệt kê đúng hai workflow và hiển thị "Các workflow này sẽ bị vô hiệu hóa nếu bạn xác nhận thay đổi method."” | TC-036 (DT+DD) |
| US-009 AC-037 | N — AC không định nghĩa cạnh số/lượng/thời gian cần probe. | N — AC không chia đầu vào thành nhiều lớp hành vi tương đương. | N — AC không có tổ hợp từ hai điều kiện độc lập trở lên. | Y — full AC-037 clause: “Kích hoạt lại Host ACTIVE sau khi Host từng làm workflow chuyển DISABLED → workflow vẫn DISABLED, nút "Chạy workflow" vẫn disabled và UI hiển thị yêu cầu review/validate trước khi bật lại.” | N — AC không có từ ba biến thể cùng hình dạng kết quả. | TC-037 (ST) |
| US-004 AC-038 | N — AC không định nghĩa cạnh số/lượng/thời gian cần probe. | N — AC không chia đầu vào thành nhiều lớp hành vi tương đương. | N — AC không có tổ hợp từ hai điều kiện độc lập trở lên. | Y — full AC-038 clause: “Đổi label của step đã được các step sau tham chiếu → step_key và mọi expression đang dùng key đó vẫn giữ nguyên sau khi lưu và tải lại workflow.” | N — AC không có từ ba biến thể cùng hình dạng kết quả. | TC-038 (ST) |
| US-009 AC-039 | N — AC không định nghĩa cạnh số/lượng/thời gian cần probe. | N — AC không chia đầu vào thành nhiều lớp hành vi tương đương. | N — AC không có tổ hợp từ hai điều kiện độc lập trở lên. | Y — full AC-039 clause: “Xác nhận đổi HTTP method trong impact dialog → hai Workflow được liệt kê chuyển DISABLED và nút "Chạy workflow" của chúng bị disabled cho đến khi review, validation có 0 Lỗi, xác nhận Cảnh báo nếu có và enable lại.” | N — AC không có từ ba biến thể cùng hình dạng kết quả. | TC-039 (ST) |
| US-009 AC-040 | N — AC không định nghĩa cạnh số/lượng/thời gian cần probe. | N — AC không chia đầu vào thành nhiều lớp hành vi tương đương. | Y — full AC-040 clause: “Chọn "Bật workflow" sau khi Host đã ACTIVE, người dùng đã review, validation có 0 Lỗi và không còn Cảnh báo → Workflow chuyển READY và nút "Chạy workflow" được bật.” | Y — full AC-040 clause: “Chọn "Bật workflow" sau khi Host đã ACTIVE, người dùng đã review, validation có 0 Lỗi và không còn Cảnh báo → Workflow chuyển READY và nút "Chạy workflow" được bật.” | N — AC không có từ ba biến thể cùng hình dạng kết quả. | TC-040 (DT+ST) |
| US-003 AC-041 | N — AC không định nghĩa cạnh số/lượng/thời gian cần probe. | N — AC không chia đầu vào thành nhiều lớp hành vi tương đương. | N — AC không có tổ hợp từ hai điều kiện độc lập trở lên. | Y — full AC-041 clause: “API độc lập bắt đầu khi environment có tenant_id=C-001, sau đó giá trị được sửa thành C-002 trước khi API trả kết quả → execution hiện tại vẫn hiển thị request resolved bằng snapshot C-001; execution mới dùng C-002.” | N — AC không có từ ba biến thể cùng hình dạng kết quả. | TC-041 (ST) |
| US-006 AC-042 | N — AC không định nghĩa cạnh số/lượng/thời gian cần probe. | N — AC không chia đầu vào thành nhiều lớp hành vi tương đương. | N — AC không có tổ hợp từ hai điều kiện độc lập trở lên. | N — AC không định nghĩa chuyển trạng thái cần kiểm tra. | N — AC không có từ ba biến thể cùng hình dạng kết quả. | TC-042 (Negative) |
| US-007 AC-043 | N — AC không định nghĩa cạnh số/lượng/thời gian cần probe. | N — AC không chia đầu vào thành nhiều lớp hành vi tương đương. | N — AC không có tổ hợp từ hai điều kiện độc lập trở lên. | Y — full AC-043 clause: “Workflow execution bắt đầu với tenant_id=C-001, sau đó environment được sửa thành C-002 trong lúc chạy → mọi step còn lại của execution hiện tại tiếp tục hiển thị resolved input từ snapshot C-001; execution mới dùng C-002.” | N — AC không có từ ba biến thể cùng hình dạng kết quả. | TC-043 (ST) |
| US-001 AC-044 | Y — full AC-044 clause: “Mở API Lab trên desktop có screen width >= 1280px rồi zoom trình duyệt tới 200% → editor chuyển sang compact mode, cho cuộn ngang vùng kỹ thuật khi cần và vẫn cho phép lưu/chạy bằng bàn phím.” | N — AC không chia đầu vào thành nhiều lớp hành vi tương đương. | N — AC không có tổ hợp từ hai điều kiện độc lập trở lên. | N — AC không định nghĩa chuyển trạng thái cần kiểm tra. | N — AC không có từ ba biến thể cùng hình dạng kết quả. | TC-044 (BVA) |
| US-001 AC-045 | Y — full AC-045 clause: “Mở API Lab trên thiết bị có screen width < 1280px → editor không mở, trang hiển thị "API Lab Workflow cần màn hình desktop rộng tối thiểu 1280px." và vẫn cho quay lại Host.” | N — AC không chia đầu vào thành nhiều lớp hành vi tương đương. | N — AC không có tổ hợp từ hai điều kiện độc lập trở lên. | N — AC không định nghĩa chuyển trạng thái cần kiểm tra. | N — AC không có từ ba biến thể cùng hình dạng kết quả. | TC-045 (BVA) |
| US-009 AC-046 | Y — full AC-046 clause: “Xác nhận xóa API đang được Workflow sử dụng → API biến mất, Workflow phụ thuộc chuyển DISABLED, và toast "Đã xóa API {api_name}. Các workflow phụ thuộc đã bị vô hiệu hóa." hiển thị nút "Hoàn tác" trong 10 giây.” | N — AC không chia đầu vào thành nhiều lớp hành vi tương đương. | N — AC không có tổ hợp từ hai điều kiện độc lập trở lên. | Y — full AC-046 clause: “Xác nhận xóa API đang được Workflow sử dụng → API biến mất, Workflow phụ thuộc chuyển DISABLED, và toast "Đã xóa API {api_name}. Các workflow phụ thuộc đã bị vô hiệu hóa." hiển thị nút "Hoàn tác" trong 10 giây.” | N — AC không có từ ba biến thể cùng hình dạng kết quả. | TC-046 (BVA+ST) |
| US-009 AC-047 | Y — full AC-047 clause: “Chọn "Hoàn tác" trong 10 giây → cùng API được khôi phục với định danh, cấu hình và vị trí cây trước khi xóa; Workflow phụ thuộc vẫn DISABLED cho tới khi Rà soát → Kiểm tra → Bật workflow.” | N — AC không chia đầu vào thành nhiều lớp hành vi tương đương. | N — AC không có tổ hợp từ hai điều kiện độc lập trở lên. | Y — full AC-047 clause: “Chọn "Hoàn tác" trong 10 giây → cùng API được khôi phục với định danh, cấu hình và vị trí cây trước khi xóa; Workflow phụ thuộc vẫn DISABLED cho tới khi Rà soát → Kiểm tra → Bật workflow.” | N — AC không có từ ba biến thể cùng hình dạng kết quả. | TC-047 (BVA+ST) |
| US-009 AC-048 | Y — full AC-048 clause: “Hệ thống nhận một yêu cầu "Hoàn tác" khi cửa sổ 10 giây đã hết → API không được khôi phục và UI hiển thị "Không thể hoàn tác xóa API. API vẫn bị xóa."” | N — AC không chia đầu vào thành nhiều lớp hành vi tương đương. | N — AC không có tổ hợp từ hai điều kiện độc lập trở lên. | Y — full AC-048 clause: “Hệ thống nhận một yêu cầu "Hoàn tác" khi cửa sổ 10 giây đã hết → API không được khôi phục và UI hiển thị "Không thể hoàn tác xóa API. API vẫn bị xóa."” | N — AC không có từ ba biến thể cùng hình dạng kết quả. | TC-048 (BVA+ST) |
| US-006 AC-049 | N — AC không định nghĩa cạnh số/lượng/thời gian cần probe. | N — AC không chia đầu vào thành nhiều lớp hành vi tương đương. | Y — full AC-049 clause: “Source mapping chưa có response mẫu nhưng workflow không có Lỗi → Validation Report hiển thị một Cảnh báo tại đúng source Step/field và Workflow đủ điều kiện READY.” | N — AC không định nghĩa chuyển trạng thái cần kiểm tra. | N — AC không có từ ba biến thể cùng hình dạng kết quả. | TC-049 (DT) |
| US-006 AC-050 | N — AC không định nghĩa cạnh số/lượng/thời gian cần probe. | Y — full AC-050 clause: “Workflow khớp một hàng Lỗi trong Validation Severity Decision Table của FR-007 → mỗi finding được gắn đúng Step/field/namespace, Run/Enable giữ disabled và người dùng không thể xác nhận để bỏ qua.” | Y — full AC-050 clause: “Workflow khớp một hàng Lỗi trong Validation Severity Decision Table của FR-007 → mỗi finding được gắn đúng Step/field/namespace, Run/Enable giữ disabled và người dùng không thể xác nhận để bỏ qua.” | N — AC không định nghĩa chuyển trạng thái cần kiểm tra. | Y — full AC-050 clause: “Workflow khớp một hàng Lỗi trong Validation Severity Decision Table của FR-007 → mỗi finding được gắn đúng Step/field/namespace, Run/Enable giữ disabled và người dùng không thể xác nhận để bỏ qua.” | TC-050 (EP+DT+DD) |
| US-006 AC-051 | N — AC không định nghĩa cạnh số/lượng/thời gian cần probe. | N — AC không chia đầu vào thành nhiều lớp hành vi tương đương. | Y — full AC-051 clause: “Workflow READY có 0 Lỗi và ít nhất 1 Cảnh báo rồi người dùng chọn Run → dialog hiển thị "Workflow còn {warnings} cảnh báo. Bạn có muốn tiếp tục?".” | N — AC không định nghĩa chuyển trạng thái cần kiểm tra. | N — AC không có từ ba biến thể cùng hình dạng kết quả. | TC-051 (DT) |
| US-009 AC-052 | N — AC không định nghĩa cạnh số/lượng/thời gian cần probe. | N — AC không chia đầu vào thành nhiều lớp hành vi tương đương. | N — AC không có tổ hợp từ hai điều kiện độc lập trở lên. | Y — full AC-052 clause: “Người dùng chọn "Hoàn tác" trong 10 giây nhưng restore thất bại → API vẫn bị xóa và UI hiển thị "Không thể hoàn tác xóa API. API vẫn bị xóa."” | N — AC không có từ ba biến thể cùng hình dạng kết quả. | TC-052 (ST) |
| US-006 AC-053 | N — AC không định nghĩa cạnh số/lượng/thời gian cần probe. | N — AC không chia đầu vào thành nhiều lớp hành vi tương đương. | Y — full AC-053 clause: “API của một Step đang kế thừa Host timeout nhưng workflow không có Lỗi → Validation Report hiển thị một Cảnh báo tại đúng API/Step và Workflow đủ điều kiện READY.” | N — AC không định nghĩa chuyển trạng thái cần kiểm tra. | N — AC không có từ ba biến thể cùng hình dạng kết quả. | TC-053 (DT) |
| US-006 AC-054 | N — AC không định nghĩa cạnh số/lượng/thời gian cần probe. | N — AC không chia đầu vào thành nhiều lớp hành vi tương đương. | Y — full AC-054 clause: “API có sensitive_fields rỗng nhưng workflow không có Lỗi → Validation Report hiển thị một Cảnh báo tại đúng API và Workflow đủ điều kiện READY.” | N — AC không định nghĩa chuyển trạng thái cần kiểm tra. | N — AC không có từ ba biến thể cùng hình dạng kết quả. | TC-054 (DT) |
| US-006 AC-055 | N — AC không định nghĩa cạnh số/lượng/thời gian cần probe. | N — AC không chia đầu vào thành nhiều lớp hành vi tương đương. | Y — full AC-055 clause: “Dialog Cảnh báo được mở từ Run rồi người dùng chọn "Tiếp tục" → hệ thống tạo Execution mới bằng saved revision đã validation và Environment hiện hành.” | N — AC không định nghĩa chuyển trạng thái cần kiểm tra. | N — AC không có từ ba biến thể cùng hình dạng kết quả. | TC-055 (DT) |
| US-006 AC-056 | N — AC không định nghĩa cạnh số/lượng/thời gian cần probe. | N — AC không chia đầu vào thành nhiều lớp hành vi tương đương. | Y — full AC-056 clause: “Dialog Cảnh báo được mở từ Run rồi người dùng chọn "Quay lại báo cáo" → dialog đóng và không tạo Execution.” | N — AC không định nghĩa chuyển trạng thái cần kiểm tra. | N — AC không có từ ba biến thể cùng hình dạng kết quả. | TC-056 (DT) |
| US-009 AC-057 | N — AC không định nghĩa cạnh số/lượng/thời gian cần probe. | N — AC không chia đầu vào thành nhiều lớp hành vi tương đương. | Y — full AC-057 clause: “Workflow DISABLED đã được review, dependency hợp lệ, validation có 0 Lỗi và ít nhất 1 Cảnh báo rồi người dùng chọn "Bật workflow" → dialog hiển thị "Workflow còn {warnings} cảnh báo. Bạn có muốn tiếp tục?".” | N — AC không định nghĩa chuyển trạng thái cần kiểm tra. | N — AC không có từ ba biến thể cùng hình dạng kết quả. | TC-057 (DT) |
| US-009 AC-058 | N — AC không định nghĩa cạnh số/lượng/thời gian cần probe. | N — AC không chia đầu vào thành nhiều lớp hành vi tương đương. | Y — full AC-058 clause: “Dialog Cảnh báo được mở từ "Bật workflow" rồi người dùng chọn "Tiếp tục" → Workflow chuyển READY và nút "Chạy workflow" được bật.” | Y — full AC-058 clause: “Dialog Cảnh báo được mở từ "Bật workflow" rồi người dùng chọn "Tiếp tục" → Workflow chuyển READY và nút "Chạy workflow" được bật.” | N — AC không có từ ba biến thể cùng hình dạng kết quả. | TC-058 (DT+ST) |
| US-009 AC-059 | N — AC không định nghĩa cạnh số/lượng/thời gian cần probe. | N — AC không chia đầu vào thành nhiều lớp hành vi tương đương. | Y — full AC-059 clause: “Dialog Cảnh báo được mở từ "Bật workflow" rồi người dùng chọn "Quay lại báo cáo" → Workflow giữ DISABLED và không tạo Execution.” | Y — full AC-059 clause: “Dialog Cảnh báo được mở từ "Bật workflow" rồi người dùng chọn "Quay lại báo cáo" → Workflow giữ DISABLED và không tạo Execution.” | N — AC không có từ ba biến thể cùng hình dạng kết quả. | TC-059 (DT+ST) |

### Coverage Category Checklist

| Feature / Flow | AC +/- | BR / Rule | Basic Flow | EP/BVA | Decision / Data-Driven | State Transition | Corner / Error Guessing | Impact / Regression | NFR | SIT | Notes |
|---|---|---|---|---|---|---|---|---|---|---|---|
| Workspace/Resource Tree | TC-001–003, TC-044–045 | BR-006/008 | covered | TC-044/045 | N/A — no multi-condition rule | TC-002 | TC-062 | TC-061/075 | TC-072/073 | TC-075 | desktop-only contract |
| Environment/Credential | TC-004–006, TC-032 | BR-001/002/010 | covered | TC-004 | TC-005 | TC-032 | TC-062/068 | TC-061 | TC-068 | TC-062/075 | snapshot and secret risk |
| Standalone API | TC-007–009, TC-041 | BR-001/004/010 | covered | TC-008/009 | N/A — one run branch per case | TC-041 | TC-062 | TC-061 | TC-066/068 | TC-075 | retry=0 architecture decision |
| Workflow authoring/mapping | TC-010–015, TC-034/035/038 | BR-003/011 | covered | TC-011 | TC-013–015 | TC-038 | TC-060 | TC-061 | TC-073 | TC-075 | no branch/loop v1 |
| Validation/Warning | TC-016–018, TC-033/042, TC-049–056 | BR-002/003/005/011 | covered | N/A — counts verified by explicit cases | TC-049–056 | TC-016/018 | TC-062 | TC-061 | TC-072 | TC-075 | severity decision table covered |
| Execution/Retry | TC-019–024, TC-031/043 | BR-003/004/009/010; EXC-RETRY-001 | covered | TC-021–024 | TC-022–024 | TC-019/020/031/043 | TC-060/062/063 | TC-061 | TC-062/066/067 | TC-022–024/062/063/075 | provider fixed-delay 0–5; non-provider max-three full jitter |
| Dependency/Undo/Recovery | TC-025–027, TC-036/037/039/040, TC-046–059 | BR-005/006/012 | covered | TC-046–048 | TC-049–059 | TC-026/037/047/058/059 | TC-052/060 | TC-061 | TC-071 | TC-075 | same identity, no auto-enable |
| History/Rerun/Retention | TC-028–030 | BR-007/009/010 | covered | TC-030 | N/A — separate latest/snapshot cases | TC-030 | TC-063 | TC-061 | TC-066/071 | TC-075 | 30-day boundary |
| Security/Observability | TC-062/064/065/068/070 | BR-001/008; EXC-AUTH-001; NFR-010 | covered | TC-065/068 | TC-065/068/070 | TC-065/068 | TC-062/065/070 | TC-061/070 | TC-065/068/070 | TC-062/065/070 | claim race/rollback, callback restart-login, exact config, API-024 generation/routing and lifecycle; authorized non-production only |
| Accessibility/Quality/FinOps | TC-072–074 | NFR-008/009 | covered | TC-072/074 | N/A — policy cases explicit | TC-072 | TC-072 | TC-073 | covered | N/A — CI policy surfaces | external QA N/A |
| Product KPI study | TC-076 | RISK-OPEN-001 | same-task AS-IS→Workflow | time ≤600s; copy/paste denominator >0 and reduction ≥80% | N/A — one locked comparison formula | N/A — observation protocol, not lifecycle | missing/zero/mismatched evidence → KPI_INCONCLUSIVE | TC-076 protocol/evidence regression | elapsed and interaction KPI | TC-076 | no fabricated baseline/result |

### Functional Test Cases

<!-- ID: TC-001 -->
<!-- VERIFIES: AC-001 -->
### TC-001: [US-001][AC-001][Positive] trang API Workspace hiển thị đúng tên Host parent, environment selector và cây collection của Workspace belongs_to Host đó. `[planned-automated]` `P0`

**Area**: API_LAB
**Traceability**: FR-001, FR-003, US-001, AC-001
**Design states referenced**: SCREEN-001, SCREEN-006
**API / NFR refs**: API-001 GET /api/v1/hosts/{hostId}/api-lab; API-003 GET /api/v1/hosts/{hostId}/api-lab/resources; API-004 POST /api/v1/hosts/{hostId}/api-lab/resource-commands; API-005 DELETE /api/v1/hosts/{hostId}/api-lab/apis/{apiId}; API-006 POST /api/v1/hosts/{hostId}/api-lab/apis/{apiId}/undo-deletion
**Manual / Auto boundary**: automated contract/component/E2E assertion; visual wording/focus is also sampled manually by TC-072
**Test Level**: e2e
**Test Type**: Functional
**Export target**: functional
**Smoke**: Y
**Environment**: Local Docker Compose and CI with deterministic clock/provider/IAM fakes
**Data needs**: Synthetic Host `host-active-01`, isolated MySQL schema, US-001 fixture; no production PII; mutations are scoped to this case.
**Teardown / reset**: N/A — case chỉ đọc hoặc validation không commit.
**Depends on**: —
**Automation intent**: Auto=Y; implement in the Plan-owned repo delta using Fastify inject/Prisma integration, Vitest + Vue Test Utils, or Playwright according to Test Level; preserve stable Design hooks and API error contracts.
**External QA handoff needs**: N/A — no external QA in sprint v1.
**Owner of execution context**: khanh-pham runs locally and CI stores machine-readable evidence.

**Given**:
- Actor `usr_tc_001` đã đăng nhập; Host `host_tc_001`, Environment `env_tc_001` và dữ liệu phụ thuộc được seed riêng cho case.
- Tiền điều kiện AC-001: Host ACTIVE được chọn.

**When**:
- GET API-001 /api/v1/hosts/{hostId}/api-lab.

**Then**:
- [ ] API-001 returns 200 with hostId=host_tc_001 and the matching Environment/resource projection; DB, provider and audit mutation counts remain 0.
- [ ] Exact Product outcome: trang API Workspace hiển thị đúng tên Host parent, environment selector và cây collection của Workspace belongs_to Host đó.

**Test Data**:
- `fixture_id=tc_001; actor=usr_tc_001; host=host_tc_001; environment=env_tc_001; synthetic=true; isolation=ephemeral; reset=required`
- Positive: Host={ACTIVE,INACTIVE}, requested_host_id={own,other}; only ACTIVE+own returns the matching breadcrumb/environment/tree projection.

<!-- ID: TC-002 -->
<!-- VERIFIES: AC-002 -->
### TC-002: [US-001][AC-002][Negative] nút "Chạy API" và "Chạy workflow" bị disabled, banner "Host đang không hoạt động. Hãy kích hoạt Host trước khi chạy." hiển thị. `[planned-automated]` `P0`

**Area**: API_LAB
**Traceability**: FR-001, FR-003, US-001, AC-002
**Design states referenced**: SCREEN-001, SCREEN-006
**API / NFR refs**: API-001 GET /api/v1/hosts/{hostId}/api-lab; API-003 GET /api/v1/hosts/{hostId}/api-lab/resources; API-004 POST /api/v1/hosts/{hostId}/api-lab/resource-commands; API-005 DELETE /api/v1/hosts/{hostId}/api-lab/apis/{apiId}; API-006 POST /api/v1/hosts/{hostId}/api-lab/apis/{apiId}/undo-deletion
**Manual / Auto boundary**: automated contract/component/E2E assertion; visual wording/focus is also sampled manually by TC-072
**Test Level**: e2e
**Test Type**: Functional
**Export target**: functional
**Smoke**: Y
**Environment**: Local Docker Compose and CI with deterministic clock/provider/IAM fakes
**Data needs**: Synthetic Host `host-active-01`, isolated MySQL schema, US-001 fixture; no production PII; mutations are scoped to this case.
**Teardown / reset**: Gọi seed/reset hook theo Host fixture sau case; xác nhận không còn execution/job/tombstone phát sinh.
**Depends on**: —
**Automation intent**: Auto=Y; implement in the Plan-owned repo delta using Fastify inject/Prisma integration, Vitest + Vue Test Utils, or Playwright according to Test Level; preserve stable Design hooks and API error contracts.
**External QA handoff needs**: N/A — no external QA in sprint v1.
**Owner of execution context**: khanh-pham runs locally and CI stores machine-readable evidence.

**Given**:
- Actor `usr_tc_002` đã đăng nhập; Host `host_tc_002`, Environment `env_tc_002` và dữ liệu phụ thuộc được seed riêng cho case.
- Tiền điều kiện AC-002: Host INACTIVE được mở.

**When**:
- GET API-001 /api/v1/hosts/{hostId}/api-lab.

**Then**:
- [ ] API-001 returns 200 for the INACTIVE projection; clicking either disabled Run control produces no API-012/API-013 request and no Execution row.
- [ ] Exact Product outcome: nút "Chạy API" và "Chạy workflow" bị disabled, banner "Host đang không hoạt động. Hãy kích hoạt Host trước khi chạy." hiển thị.

**Test Data**:
- `fixture_id=tc_002; actor=usr_tc_002; host=host_tc_002; environment=env_tc_002; synthetic=true; isolation=ephemeral; reset=required`
- Negative: Host={INACTIVE,ACTIVE}; INACTIVE disables both Run controls and shows MSG-001, while ACTIVE is the control class.

<!-- ID: TC-003 -->
<!-- VERIFIES: AC-003 -->
### TC-003: [US-001][AC-003][Positive] ba node hiển thị đúng cấp trong cây và vẫn còn sau khi tải lại trang. `[planned-automated]` `P0`

**Area**: API_LAB
**Traceability**: FR-001, FR-003, US-001, AC-003
**Design states referenced**: SCREEN-001, SCREEN-006
**API / NFR refs**: API-001 GET /api/v1/hosts/{hostId}/api-lab; API-003 GET /api/v1/hosts/{hostId}/api-lab/resources; API-004 POST /api/v1/hosts/{hostId}/api-lab/resource-commands; API-005 DELETE /api/v1/hosts/{hostId}/api-lab/apis/{apiId}; API-006 POST /api/v1/hosts/{hostId}/api-lab/apis/{apiId}/undo-deletion
**Manual / Auto boundary**: automated contract/component/E2E assertion; visual wording/focus is also sampled manually by TC-072
**Test Level**: e2e
**Test Type**: Functional
**Export target**: functional
**Smoke**: Y
**Environment**: Local Docker Compose and CI with deterministic clock/provider/IAM fakes
**Data needs**: Synthetic Host `host-active-01`, isolated MySQL schema, US-001 fixture; no production PII; mutations are scoped to this case.
**Teardown / reset**: Gọi seed/reset hook theo Host fixture sau case; xác nhận không còn execution/job/tombstone phát sinh.
**Depends on**: —
**Automation intent**: Auto=Y; implement in the Plan-owned repo delta using Fastify inject/Prisma integration, Vitest + Vue Test Utils, or Playwright according to Test Level; preserve stable Design hooks and API error contracts.
**External QA handoff needs**: N/A — no external QA in sprint v1.
**Owner of execution context**: khanh-pham runs locally and CI stores machine-readable evidence.

**Given**:
- Actor `usr_tc_003` đã đăng nhập; Host `host_tc_003`, Environment `env_tc_003` và dữ liệu phụ thuộc được seed riêng cho case.
- Tiền điều kiện AC-003: Người dùng tạo collection "Thanh toán", folder "Đối soát" và API "Lấy giao dịch".

**When**:
- POST API-004 /api/v1/hosts/{hostId}/api-lab/resource-commands for CREATE collection/folder/API, then GET API-003 /resources.

**Then**:
- [ ] Each API-004 CREATE returns 200; API-003 returns exactly Collection→Folder→API parent IDs after reload; three audit facts exist and no duplicate sibling is created.
- [ ] Exact Product outcome: ba node hiển thị đúng cấp trong cây và vẫn còn sau khi tải lại trang.

**Test Data**:
- `fixture_id=tc_003; actor=usr_tc_003; host=host_tc_003; environment=env_tc_003; synthetic=true; isolation=ephemeral; reset=required`
- ST: empty tree → create Collection `Thanh toán` → Folder `Đối soát` → API `Lấy giao dịch` → reload; parent IDs and sibling order remain unchanged.

<!-- ID: TC-004 -->
<!-- VERIFIES: AC-004 -->
### TC-004: [US-002][AC-004][EP+DD] DEV, UAT và PROD cùng hiển thị key tenant_id, mỗi environment cho nhập giá trị riêng. `[planned-automated]` `P0`

**Area**: API_LAB
**Traceability**: FR-002, US-002, AC-004
**Design states referenced**: SCREEN-002
**API / NFR refs**: API-001 GET /api/v1/hosts/{hostId}/api-lab; API-002 PUT /api/v1/hosts/{hostId}/api-lab/environments/{environmentKey}; API-023 DELETE /api/v1/hosts/{hostId}/api-lab/environments/{environmentKey}
**Manual / Auto boundary**: automated contract/component/E2E assertion; visual wording/focus is also sampled manually by TC-072
**Test Level**: e2e
**Test Type**: Functional
**Export target**: functional
**Smoke**: N
**Environment**: Local Docker Compose and CI with deterministic clock/provider/IAM fakes
**Data needs**: Synthetic Host `host-active-01`, isolated MySQL schema, US-002 fixture; no production PII; mutations are scoped to this case.
**Teardown / reset**: Gọi seed/reset hook theo Host fixture sau case; xác nhận không còn execution/job/tombstone phát sinh.
**Depends on**: —
**Automation intent**: Auto=Y; implement in the Plan-owned repo delta using Fastify inject/Prisma integration, Vitest + Vue Test Utils, or Playwright according to Test Level; preserve stable Design hooks and API error contracts.
**External QA handoff needs**: N/A — no external QA in sprint v1.
**Owner of execution context**: khanh-pham runs locally and CI stores machine-readable evidence.

**Given**:
- Actor `usr_tc_004` đã đăng nhập; Host `host_tc_004`, Environment `env_tc_004` và dữ liệu phụ thuộc được seed riêng cho case.
- Tiền điều kiện AC-004: Thêm biến tenant_id vào Host.

**When**:
- PUT API-002 /api/v1/hosts/{hostId}/api-lab/environments/{environmentKey}.

**Then**:
- [ ] API-002 returns 201 for first binding or 200 for replacement; DEV/UAT/PROD readback shares key tenant_id while each value/revision remains distinct.
- [ ] Exact Product outcome: DEV, UAT và PROD cùng hiển thị key tenant_id, mỗi environment cho nhập giá trị riêng.

**Test Data**:
- `fixture_id=tc_004; actor=usr_tc_004; host=host_tc_004; environment=env_tc_004; synthetic=true; isolation=ephemeral; reset=required`
- EP: environment=DEV, UAT, PROD; mỗi lớp dùng giá trị tenant_id riêng và cùng schema key.

<!-- ID: TC-005 -->
<!-- VERIFIES: AC-005 -->
### TC-005: [US-002][AC-005][DT] execution bị chặn và step liên quan hiển thị "Thiếu giá trị biến tenant_id trong environment UAT." `[planned-automated]` `P0`

**Area**: API_LAB
**Traceability**: FR-002, US-002, AC-005
**Design states referenced**: SCREEN-002
**API / NFR refs**: API-001 GET /api/v1/hosts/{hostId}/api-lab; API-002 PUT /api/v1/hosts/{hostId}/api-lab/environments/{environmentKey}; API-023 DELETE /api/v1/hosts/{hostId}/api-lab/environments/{environmentKey}
**Manual / Auto boundary**: automated contract/component/E2E assertion; visual wording/focus is also sampled manually by TC-072
**Test Level**: e2e
**Test Type**: Functional
**Export target**: functional
**Smoke**: N
**Environment**: Local Docker Compose and CI with deterministic clock/provider/IAM fakes
**Data needs**: Synthetic Host `host-active-01`, isolated MySQL schema, US-002 fixture; no production PII; mutations are scoped to this case.
**Teardown / reset**: Gọi seed/reset hook theo Host fixture sau case; xác nhận không còn execution/job/tombstone phát sinh.
**Depends on**: —
**Automation intent**: Auto=Y; implement in the Plan-owned repo delta using Fastify inject/Prisma integration, Vitest + Vue Test Utils, or Playwright according to Test Level; preserve stable Design hooks and API error contracts.
**External QA handoff needs**: N/A — no external QA in sprint v1.
**Owner of execution context**: khanh-pham runs locally and CI stores machine-readable evidence.

**Given**:
- Actor `usr_tc_005` đã đăng nhập; Host `host_tc_005`, Environment `env_tc_005` và dữ liệu phụ thuộc được seed riêng cho case.
- Tiền điều kiện AC-005: Chọn UAT khi biến bắt buộc tenant_id chưa có giá trị.

**When**:
- POST API-013 /api/v1/hosts/{hostId}/api-lab/workflow-runs with UAT binding missing tenant_id.

**Then**:
- [ ] Client validation sends no API-013 admission request; Execution/job row counts remain 0 and MSG-004 names tenant_id and UAT.
- [ ] Exact Product outcome: execution bị chặn và step liên quan hiển thị "Thiếu giá trị biến tenant_id trong environment UAT."

**Test Data**:
- `fixture_id=tc_005; actor=usr_tc_005; host=host_tc_005; environment=env_tc_005; synthetic=true; isolation=ephemeral; reset=required`
- DT: required=true × value={present, missing}; environment={DEV, UAT, PROD}; chỉ ô missing bị chặn.

<!-- ID: TC-006 -->
<!-- VERIFIES: AC-006 -->
### TC-006: [US-002][AC-006][Positive] execution details hiển thị environment UAT, dùng giá trị UAT của tenant_id và hiển thị credential thuộc sensitive config là ••••••••. `[planned-automated]` `P0`

**Area**: API_LAB
**Traceability**: FR-002, US-002, AC-006
**Design states referenced**: SCREEN-002
**API / NFR refs**: API-001 GET /api/v1/hosts/{hostId}/api-lab; API-002 PUT /api/v1/hosts/{hostId}/api-lab/environments/{environmentKey}; API-023 DELETE /api/v1/hosts/{hostId}/api-lab/environments/{environmentKey}
**Manual / Auto boundary**: automated contract/component/E2E assertion; visual wording/focus is also sampled manually by TC-072
**Test Level**: e2e
**Test Type**: Functional
**Export target**: functional
**Smoke**: N
**Environment**: Local Docker Compose and CI with deterministic clock/provider/IAM fakes
**Data needs**: Synthetic Host `host-active-01`, isolated MySQL schema, US-002 fixture; no production PII; mutations are scoped to this case.
**Teardown / reset**: Gọi seed/reset hook theo Host fixture sau case; xác nhận không còn execution/job/tombstone phát sinh.
**Depends on**: —
**Automation intent**: Auto=Y; implement in the Plan-owned repo delta using Fastify inject/Prisma integration, Vitest + Vue Test Utils, or Playwright according to Test Level; preserve stable Design hooks and API error contracts.
**External QA handoff needs**: N/A — no external QA in sprint v1.
**Owner of execution context**: khanh-pham runs locally and CI stores machine-readable evidence.

**Given**:
- Actor `usr_tc_006` đã đăng nhập; Host `host_tc_006`, Environment `env_tc_006` và dữ liệu phụ thuộc được seed riêng cho case.
- Tiền điều kiện AC-006: Chọn UAT và chạy API "Lấy giao dịch".

**When**:
- POST API-012 /api/v1/hosts/{hostId}/api-lab/api-runs, then GET API-014 /executions/{executionId}.

**Then**:
- [ ] API-012 returns 202 and API-014 returns 200; snapshot environmentKey=UAT, tenant_id=tenant-uat and credential output is masked with zero plaintext marker.
- [ ] Exact Product outcome: execution details hiển thị environment UAT, dùng giá trị UAT của tenant_id và hiển thị credential thuộc sensitive config là ••••••••.

**Test Data**:
- `fixture_id=tc_006; actor=usr_tc_006; host=host_tc_006; environment=env_tc_006; synthetic=true; isolation=ephemeral; reset=required`
- EP: environment={DEV,UAT,PROD}; select UAT and assert tenant_id=`tenant-uat` plus credential mask `••••••••`, never plaintext marker `cred-uat-secret`.

<!-- ID: TC-007 -->
<!-- VERIFIES: AC-007 -->
### TC-007: [US-003][AC-007][Positive] panel kết quả hiển thị "Thành công", duration, request resolved và response JSON; các field/path thuộc sensitive_fields hiển thị ••••••••. `[planned-automated]` `P0`

**Area**: API_LAB
**Traceability**: FR-004, FR-005, FR-012, US-003, AC-007
**Design states referenced**: SCREEN-003, SCREEN-005
**API / NFR refs**: API-007 PUT /api/v1/hosts/{hostId}/api-lab/apis/{apiId}; API-012 POST /api/v1/hosts/{hostId}/api-lab/api-runs; API-014 GET /api/v1/hosts/{hostId}/api-lab/executions/{executionId}
**Manual / Auto boundary**: automated contract/component/E2E assertion; visual wording/focus is also sampled manually by TC-072
**Test Level**: e2e
**Test Type**: Functional
**Export target**: functional
**Smoke**: Y
**Environment**: Local Docker Compose and CI with deterministic clock/provider/IAM fakes
**Data needs**: Synthetic Host `host-active-01`, isolated MySQL schema, US-003 fixture; no production PII; mutations are scoped to this case.
**Teardown / reset**: N/A — case chỉ đọc hoặc validation không commit.
**Depends on**: —
**Automation intent**: Auto=Y; implement in the Plan-owned repo delta using Fastify inject/Prisma integration, Vitest + Vue Test Utils, or Playwright according to Test Level; preserve stable Design hooks and API error contracts.
**External QA handoff needs**: N/A — no external QA in sprint v1.
**Owner of execution context**: khanh-pham runs locally and CI stores machine-readable evidence.

**Given**:
- Actor `usr_tc_007` đã đăng nhập; Host `host_tc_007`, Environment `env_tc_007` và dữ liệu phụ thuộc được seed riêng cho case.
- Tiền điều kiện AC-007: API "Lấy giao dịch" trả JSON thành công.

**When**:
- PUT API-007 /apis/{apiId}, POST API-012 /api-runs, then GET API-014 /executions/{executionId}.

**Then**:
- [ ] API-007 returns 200, API-012 returns 202 and terminal API-014 returns 200; status, duration, resolved request and JSON response match the fixture and configured secret path is masked.
- [ ] Exact Product outcome: panel kết quả hiển thị "Thành công", duration, request resolved và response JSON; các field/path thuộc sensitive_fields hiển thị ••••••••.

**Test Data**:
- `fixture_id=tc_007; actor=usr_tc_007; host=host_tc_007; environment=env_tc_007; synthetic=true; isolation=ephemeral; reset=required`
- Positive: provider returns HTTP 200 JSON `{data:{id:"txn-001"},token:"secret-marker"}`; inspector must show success/duration/resolved request and mask configured token.

<!-- ID: TC-008 -->
<!-- VERIFIES: AC-008 -->
### TC-008: [US-003][AC-008][BVA] attempt dừng ở 12 giây, panel hiển thị "API hết thời gian chờ sau 12 giây."; retry áp dụng theo cấu hình API step. `[planned-automated]` `P0`

**Area**: API_LAB
**Traceability**: FR-004, FR-005, FR-012, US-003, AC-008
**Design states referenced**: SCREEN-003, SCREEN-005
**API / NFR refs**: API-007 PUT /api/v1/hosts/{hostId}/api-lab/apis/{apiId}; API-012 POST /api/v1/hosts/{hostId}/api-lab/api-runs; API-014 GET /api/v1/hosts/{hostId}/api-lab/executions/{executionId}
**Manual / Auto boundary**: automated contract/component/E2E assertion; visual wording/focus is also sampled manually by TC-072
**Test Level**: e2e
**Test Type**: Functional
**Export target**: functional
**Smoke**: N
**Environment**: Local Docker Compose and CI with deterministic clock/provider/IAM fakes
**Data needs**: Synthetic Host `host-active-01`, isolated MySQL schema, US-003 fixture; no production PII; mutations are scoped to this case.
**Teardown / reset**: Gọi seed/reset hook theo Host fixture sau case; xác nhận không còn execution/job/tombstone phát sinh.
**Depends on**: —
**Automation intent**: Auto=Y; implement in the Plan-owned repo delta using Fastify inject/Prisma integration, Vitest + Vue Test Utils, or Playwright according to Test Level; preserve stable Design hooks and API error contracts.
**External QA handoff needs**: N/A — no external QA in sprint v1.
**Owner of execution context**: khanh-pham runs locally and CI stores machine-readable evidence.

**Given**:
- Actor `usr_tc_008` đã đăng nhập; Host `host_tc_008`, Environment `env_tc_008` và dữ liệu phụ thuộc được seed riêng cho case.
- Tiền điều kiện AC-008: API cấu hình timeout 12 giây và API đích không phản hồi.

**When**:
- PUT API-007 /apis/{apiId} with timeout=12, POST API-012 /api-runs, then poll API-014.

**Then**:
- [ ] API-012 returns 202; terminal API-014 returns 200 with FAILED timeout evidence at 12.000s, MSG-005 and the configured retry attempt count.
- [ ] Exact Product outcome: attempt dừng ở 12 giây, panel hiển thị "API hết thời gian chờ sau 12 giây."; retry áp dụng theo cấu hình API step.

**Test Data**:
- `fixture_id=tc_008; actor=usr_tc_008; host=host_tc_008; environment=env_tc_008; synthetic=true; isolation=ephemeral; reset=required`
- BVA: timeout elapsed=11.999s, 12.000s, 12.001s; target={responds before boundary, never responds}.

<!-- ID: TC-009 -->
<!-- VERIFIES: AC-009 -->
### TC-009: [US-003][AC-009][EP+DD] preview/log/history hiển thị token là •••••••• nhưng giữ nguyên customer_name; hệ thống không tự mask field ngoài cấu hình. `[planned-automated]` `P0`

**Area**: API_LAB
**Traceability**: FR-004, FR-005, FR-012, US-003, AC-009
**Design states referenced**: SCREEN-003, SCREEN-005
**API / NFR refs**: API-007 PUT /api/v1/hosts/{hostId}/api-lab/apis/{apiId}; API-012 POST /api/v1/hosts/{hostId}/api-lab/api-runs; API-014 GET /api/v1/hosts/{hostId}/api-lab/executions/{executionId}
**Manual / Auto boundary**: automated contract/component/E2E assertion; visual wording/focus is also sampled manually by TC-072
**Test Level**: e2e
**Test Type**: Functional
**Export target**: functional
**Smoke**: N
**Environment**: Local Docker Compose and CI with deterministic clock/provider/IAM fakes
**Data needs**: Synthetic Host `host-active-01`, isolated MySQL schema, US-003 fixture; no production PII; mutations are scoped to this case.
**Teardown / reset**: N/A — case chỉ đọc hoặc validation không commit.
**Depends on**: —
**Automation intent**: Auto=Y; implement in the Plan-owned repo delta using Fastify inject/Prisma integration, Vitest + Vue Test Utils, or Playwright according to Test Level; preserve stable Design hooks and API error contracts.
**External QA handoff needs**: N/A — no external QA in sprint v1.
**Owner of execution context**: khanh-pham runs locally and CI stores machine-readable evidence.

**Given**:
- Actor `usr_tc_009` đã đăng nhập; Host `host_tc_009`, Environment `env_tc_009` và dữ liệu phụ thuộc được seed riêng cho case.
- Tiền điều kiện AC-009: Response có token nằm trong sensitive_fields và customer_name không nằm trong cấu hình.

**When**:
- PUT API-007 /apis/{apiId} with sensitive_fields, run API-012, inspect API-014 and API-015.

**Then**:
- [ ] API-014/API-015 return 200; token is masked on preview/log/history, customer_name remains visible, and plaintext token marker count is 0.
- [ ] Exact Product outcome: preview/log/history hiển thị token là •••••••• nhưng giữ nguyên customer_name; hệ thống không tự mask field ngoài cấu hình.

**Test Data**:
- `fixture_id=tc_009; actor=usr_tc_009; host=host_tc_009; environment=env_tc_009; synthetic=true; isolation=ephemeral; reset=required`
- EP+DD: field={configured-sensitive token, unconfigured customer_name}; surface={preview, log, history}.

<!-- ID: TC-010 -->
<!-- VERIFIES: AC-010 -->
### TC-010: [US-004][AC-010][Positive] Thêm API A, B, C và kéo thành thứ tự B → A → C → danh sách step lưu đúng thứ tự B, A, C sau khi tải lại trang. `[planned-automated]` `P0`

**Area**: API_LAB
**Traceability**: FR-006, US-004, AC-010
**Design states referenced**: SCREEN-004
**API / NFR refs**: API-008 GET /api/v1/hosts/{hostId}/api-lab/workflows/{workflowId}; API-009 PUT /api/v1/hosts/{hostId}/api-lab/workflows/{workflowId}
**Manual / Auto boundary**: automated contract/component/E2E assertion; visual wording/focus is also sampled manually by TC-072
**Test Level**: e2e
**Test Type**: Functional
**Export target**: functional
**Smoke**: N
**Environment**: Local Docker Compose and CI with deterministic clock/provider/IAM fakes
**Data needs**: Synthetic Host `host-active-01`, isolated MySQL schema, US-004 fixture; no production PII; mutations are scoped to this case.
**Teardown / reset**: Gọi seed/reset hook theo Host fixture sau case; xác nhận không còn execution/job/tombstone phát sinh.
**Depends on**: —
**Automation intent**: Auto=Y; implement in the Plan-owned repo delta using Fastify inject/Prisma integration, Vitest + Vue Test Utils, or Playwright according to Test Level; preserve stable Design hooks and API error contracts.
**External QA handoff needs**: N/A — no external QA in sprint v1.
**Owner of execution context**: khanh-pham runs locally and CI stores machine-readable evidence.

**Given**:
- Actor `usr_tc_010` đã đăng nhập; Host `host_tc_010`, Environment `env_tc_010` và dữ liệu phụ thuộc được seed riêng cho case.
- Tiền điều kiện AC-010: Thêm API A, B, C và kéo thành thứ tự B → A → C.

**When**:
- PUT API-009 /workflows/{workflowId} with ordered step_keys B,A,C, then GET API-008.

**Then**:
- [ ] API-009 returns 200 and API-008 returns 200 with persisted ordered step_keys B,A,C after reload.
- [ ] Exact Product outcome: Thêm API A, B, C và kéo thành thứ tự B → A → C → danh sách step lưu đúng thứ tự B, A, C sau khi tải lại trang.

**Test Data**:
- `fixture_id=tc_010; actor=usr_tc_010; host=host_tc_010; environment=env_tc_010; synthetic=true; isolation=ephemeral; reset=required`
- ST: draft order A,B,C → reorder B,A,C → save → reload; compare persisted step_key order.

<!-- ID: TC-011 -->
<!-- VERIFIES: AC-011 -->
### TC-011: [US-004][AC-011][BVA] thao tác bị từ chối, hiển thị "Workflow chỉ hỗ trợ tối đa 20 bước trong phase 1." `[planned-automated]` `P0`

**Area**: API_LAB
**Traceability**: FR-006, US-004, AC-011
**Design states referenced**: SCREEN-004
**API / NFR refs**: API-008 GET /api/v1/hosts/{hostId}/api-lab/workflows/{workflowId}; API-009 PUT /api/v1/hosts/{hostId}/api-lab/workflows/{workflowId}
**Manual / Auto boundary**: automated contract/component/E2E assertion; visual wording/focus is also sampled manually by TC-072
**Test Level**: e2e
**Test Type**: Functional
**Export target**: functional
**Smoke**: N
**Environment**: Local Docker Compose and CI with deterministic clock/provider/IAM fakes
**Data needs**: Synthetic Host `host-active-01`, isolated MySQL schema, US-004 fixture; no production PII; mutations are scoped to this case.
**Teardown / reset**: Gọi seed/reset hook theo Host fixture sau case; xác nhận không còn execution/job/tombstone phát sinh.
**Depends on**: —
**Automation intent**: Auto=Y; implement in the Plan-owned repo delta using Fastify inject/Prisma integration, Vitest + Vue Test Utils, or Playwright according to Test Level; preserve stable Design hooks and API error contracts.
**External QA handoff needs**: N/A — no external QA in sprint v1.
**Owner of execution context**: khanh-pham runs locally and CI stores machine-readable evidence.

**Given**:
- Actor `usr_tc_011` đã đăng nhập; Host `host_tc_011`, Environment `env_tc_011` và dữ liệu phụ thuộc được seed riêng cho case.
- Tiền điều kiện AC-011: Workflow đã có 20 step và người dùng thêm step thứ 21.

**When**:
- PUT API-009 /workflows/{workflowId} with 21 steps.

**Then**:
- [ ] API-009 returns 422 STEP_LIMIT_EXCEEDED; persisted step count stays 20 and MSG-009 is shown.
- [ ] Exact Product outcome: thao tác bị từ chối, hiển thị "Workflow chỉ hỗ trợ tối đa 20 bước trong phase 1."

**Test Data**:
- `fixture_id=tc_011; actor=usr_tc_011; host=host_tc_011; environment=env_tc_011; synthetic=true; isolation=ephemeral; reset=required`
- BVA: existing_step_count=19,20,21; add one step; accepted total must never exceed 20.

<!-- ID: TC-012 -->
<!-- VERIFIES: AC-012 -->
### TC-012: [US-004][AC-012][Positive] editor không hiển thị tùy chọn parallel/loop và scope note hiển thị "Parallel và loop được lên kế hoạch cho v2." `[planned-automated]` `P0`

**Area**: API_LAB
**Traceability**: FR-006, US-004, AC-012
**Design states referenced**: SCREEN-004
**API / NFR refs**: API-008 GET /api/v1/hosts/{hostId}/api-lab/workflows/{workflowId}; API-009 PUT /api/v1/hosts/{hostId}/api-lab/workflows/{workflowId}
**Manual / Auto boundary**: automated contract/component/E2E assertion; visual wording/focus is also sampled manually by TC-072
**Test Level**: e2e
**Test Type**: Functional
**Export target**: functional
**Smoke**: N
**Environment**: Local Docker Compose and CI with deterministic clock/provider/IAM fakes
**Data needs**: Synthetic Host `host-active-01`, isolated MySQL schema, US-004 fixture; no production PII; mutations are scoped to this case.
**Teardown / reset**: N/A — case chỉ đọc hoặc validation không commit.
**Depends on**: —
**Automation intent**: Auto=Y; implement in the Plan-owned repo delta using Fastify inject/Prisma integration, Vitest + Vue Test Utils, or Playwright according to Test Level; preserve stable Design hooks and API error contracts.
**External QA handoff needs**: N/A — no external QA in sprint v1.
**Owner of execution context**: khanh-pham runs locally and CI stores machine-readable evidence.

**Given**:
- Actor `usr_tc_012` đã đăng nhập; Host `host_tc_012`, Environment `env_tc_012` và dữ liệu phụ thuộc được seed riêng cho case.
- Tiền điều kiện AC-012: Mở workflow editor trong phase 1.

**When**:
- GET API-008 /workflows/{workflowId} and inspect SCREEN-004 controls.

**Then**:
- [ ] API-008 returns 200; SCREEN-004 exposes zero parallel/loop controls and exactly one v2 scope note.
- [ ] Exact Product outcome: editor không hiển thị tùy chọn parallel/loop và scope note hiển thị "Parallel và loop được lên kế hoạch cho v2."

**Test Data**:
- `fixture_id=tc_012; actor=usr_tc_012; host=host_tc_012; environment=env_tc_012; synthetic=true; isolation=ephemeral; reset=required`
- Negative UI inventory: inspect action set={add step,reorder,mapping,parallel,loop}; parallel/loop count=0 and exact v2 scope note count=1.

<!-- ID: TC-013 -->
<!-- VERIFIES: AC-013 -->
### TC-013: [US-005][AC-013][Positive] editor hiển thị expression ${{step_01.data.customer.id}} và resolved request của Step 3 hiển thị C-001 dù Step 2 nằm giữa. `[planned-automated]` `P0`

**Area**: API_LAB
**Traceability**: FR-006, US-005, AC-013
**Design states referenced**: SCREEN-004
**API / NFR refs**: API-008 GET /api/v1/hosts/{hostId}/api-lab/workflows/{workflowId}; API-009 PUT /api/v1/hosts/{hostId}/api-lab/workflows/{workflowId}
**Manual / Auto boundary**: automated contract/component/E2E assertion; visual wording/focus is also sampled manually by TC-072
**Test Level**: e2e
**Test Type**: Functional
**Export target**: functional
**Smoke**: N
**Environment**: Local Docker Compose and CI with deterministic clock/provider/IAM fakes
**Data needs**: Synthetic Host `host-active-01`, isolated MySQL schema, US-005 fixture; no production PII; mutations are scoped to this case.
**Teardown / reset**: N/A — case chỉ đọc hoặc validation không commit.
**Depends on**: —
**Automation intent**: Auto=Y; implement in the Plan-owned repo delta using Fastify inject/Prisma integration, Vitest + Vue Test Utils, or Playwright according to Test Level; preserve stable Design hooks and API error contracts.
**External QA handoff needs**: N/A — no external QA in sprint v1.
**Owner of execution context**: khanh-pham runs locally and CI stores machine-readable evidence.

**Given**:
- Actor `usr_tc_013` đã đăng nhập; Host `host_tc_013`, Environment `env_tc_013` và dữ liệu phụ thuộc được seed riêng cho case.
- Tiền điều kiện AC-013: Kéo biến Customer ID có giá trị C-001 từ step nguồn step_01 vào path của Step 3.

**When**:
- PUT API-009 /workflows/{workflowId} with Step 3 mapping, validate API-010, then run API-013.

**Then**:
- [ ] API-009 returns 200, API-010 returns 201 and API-013 returns 202; Step 3 resolved request contains C-001 from step_01 while Step 2 does not alter the mapping.
- [ ] Exact Product outcome: editor hiển thị expression ${{step_01.data.customer.id}} và resolved request của Step 3 hiển thị C-001 dù Step 2 nằm giữa.

**Test Data**:
- `fixture_id=tc_013; actor=usr_tc_013; host=host_tc_013; environment=env_tc_013; synthetic=true; isolation=ephemeral; reset=required`
- ST: source step_01 success → Step 2 success → Step 3 resolution; value C-001 must cross only the declared source path.

<!-- ID: TC-014 -->
<!-- VERIFIES: AC-014 -->
### TC-014: [US-005][AC-014][Negative] Step 3 không được gọi và hiển thị "Không tìm thấy ${{step_01.data.customer.id}}." `[planned-automated]` `P0`

**Area**: API_LAB
**Traceability**: FR-006, US-005, AC-014
**Design states referenced**: SCREEN-004
**API / NFR refs**: API-008 GET /api/v1/hosts/{hostId}/api-lab/workflows/{workflowId}; API-009 PUT /api/v1/hosts/{hostId}/api-lab/workflows/{workflowId}
**Manual / Auto boundary**: automated contract/component/E2E assertion; visual wording/focus is also sampled manually by TC-072
**Test Level**: e2e
**Test Type**: Functional
**Export target**: functional
**Smoke**: N
**Environment**: Local Docker Compose and CI with deterministic clock/provider/IAM fakes
**Data needs**: Synthetic Host `host-active-01`, isolated MySQL schema, US-005 fixture; no production PII; mutations are scoped to this case.
**Teardown / reset**: N/A — case chỉ đọc hoặc validation không commit.
**Depends on**: —
**Automation intent**: Auto=Y; implement in the Plan-owned repo delta using Fastify inject/Prisma integration, Vitest + Vue Test Utils, or Playwright according to Test Level; preserve stable Design hooks and API error contracts.
**External QA handoff needs**: N/A — no external QA in sprint v1.
**Owner of execution context**: khanh-pham runs locally and CI stores machine-readable evidence.

**Given**:
- Actor `usr_tc_014` đã đăng nhập; Host `host_tc_014`, Environment `env_tc_014` và dữ liệu phụ thuộc được seed riêng cho case.
- Tiền điều kiện AC-014: Step 3 tham chiếu ${{step_01.data.customer.id}} nhưng step_01 không trả field đó.

**When**:
- PUT API-009 with missing source path, validate API-010, then attempt run API-013.

**Then**:
- [ ] API-013 returns 202, then API-014 returns 200 with the mapped Step FAILED and MSG-006; Step 3 provider call count is 0.
- [ ] Exact Product outcome: Step 3 không được gọi và hiển thị "Không tìm thấy ${{step_01.data.customer.id}}."

**Test Data**:
- `fixture_id=tc_014; actor=usr_tc_014; host=host_tc_014; environment=env_tc_014; synthetic=true; isolation=ephemeral; reset=required`
- Negative: source path absent; verify Step 3 provider call count=0 and MSG-006 names the exact expression.

<!-- ID: TC-015 -->
<!-- VERIFIES: AC-015 -->
### TC-015: [US-005][AC-015][EP] mapping không được lưu và hiển thị "Phase 1 chỉ hỗ trợ mapping từ response JSON." `[planned-automated]` `P0`

**Area**: API_LAB
**Traceability**: FR-006, US-005, AC-015
**Design states referenced**: SCREEN-004
**API / NFR refs**: API-008 GET /api/v1/hosts/{hostId}/api-lab/workflows/{workflowId}; API-009 PUT /api/v1/hosts/{hostId}/api-lab/workflows/{workflowId}
**Manual / Auto boundary**: automated contract/component/E2E assertion; visual wording/focus is also sampled manually by TC-072
**Test Level**: e2e
**Test Type**: Functional
**Export target**: functional
**Smoke**: N
**Environment**: Local Docker Compose and CI with deterministic clock/provider/IAM fakes
**Data needs**: Synthetic Host `host-active-01`, isolated MySQL schema, US-005 fixture; no production PII; mutations are scoped to this case.
**Teardown / reset**: Gọi seed/reset hook theo Host fixture sau case; xác nhận không còn execution/job/tombstone phát sinh.
**Depends on**: —
**Automation intent**: Auto=Y; implement in the Plan-owned repo delta using Fastify inject/Prisma integration, Vitest + Vue Test Utils, or Playwright according to Test Level; preserve stable Design hooks and API error contracts.
**External QA handoff needs**: N/A — no external QA in sprint v1.
**Owner of execution context**: khanh-pham runs locally and CI stores machine-readable evidence.

**Given**:
- Actor `usr_tc_015` đã đăng nhập; Host `host_tc_015`, Environment `env_tc_015` và dữ liệu phụ thuộc được seed riêng cho case.
- Tiền điều kiện AC-015: Người dùng chọn response text/XML làm nguồn mapping.

**When**:
- PUT API-009 with text/XML mapping source and validate API-010.

**Then**:
- [ ] The editor sends no API-009 save for text/XML source; persisted version/revision is unchanged and MSG-007 is shown.
- [ ] Exact Product outcome: mapping không được lưu và hiển thị "Phase 1 chỉ hỗ trợ mapping từ response JSON."

**Test Data**:
- `fixture_id=tc_015; actor=usr_tc_015; host=host_tc_015; environment=env_tc_015; synthetic=true; isolation=ephemeral; reset=required`
- EP: source media type={application/json, text/plain, application/xml}; only JSON is accepted.

<!-- ID: TC-016 -->
<!-- VERIFIES: AC-016 -->
### TC-016: [US-006][AC-016][ST] validation hiển thị "Workflow hợp lệ và sẵn sàng chạy." và trạng thái chuyển READY. `[planned-automated]` `P0`

**Area**: API_LAB
**Traceability**: FR-007, US-006, AC-016
**Design states referenced**: SCREEN-004, SCREEN-008
**API / NFR refs**: API-010 POST /api/v1/hosts/{hostId}/api-lab/workflows/{workflowId}/versions/{versionId}/validations; API-011 POST /api/v1/hosts/{hostId}/api-lab/workflows/{workflowId}/enable; API-013 POST /api/v1/hosts/{hostId}/api-lab/workflow-runs
**Manual / Auto boundary**: automated contract/component/E2E assertion; visual wording/focus is also sampled manually by TC-072
**Test Level**: e2e
**Test Type**: Functional
**Export target**: functional
**Smoke**: Y
**Environment**: Local Docker Compose and CI with deterministic clock/provider/IAM fakes
**Data needs**: Synthetic Host `host-active-01`, isolated MySQL schema, US-006 fixture; no production PII; mutations are scoped to this case.
**Teardown / reset**: Gọi seed/reset hook theo Host fixture sau case; xác nhận không còn execution/job/tombstone phát sinh.
**Depends on**: —
**Automation intent**: Auto=Y; implement in the Plan-owned repo delta using Fastify inject/Prisma integration, Vitest + Vue Test Utils, or Playwright according to Test Level; preserve stable Design hooks and API error contracts.
**External QA handoff needs**: N/A — no external QA in sprint v1.
**Owner of execution context**: khanh-pham runs locally and CI stores machine-readable evidence.

**Given**:
- Actor `usr_tc_016` đã đăng nhập; Host `host_tc_016`, Environment `env_tc_016` và dữ liệu phụ thuộc được seed riêng cho case.
- Tiền điều kiện AC-016: Workflow có dependency, variable và mapping hợp lệ.

**When**:
- POST API-010 /validations for current saved version.

**Then**:
- [ ] API-010 returns 201 with errors=0 and warnings=0; current Workflow projection becomes READY and shows MSG-010.
- [ ] Exact Product outcome: validation hiển thị "Workflow hợp lệ và sẵn sàng chạy." và trạng thái chuyển READY.

**Test Data**:
- `fixture_id=tc_016; actor=usr_tc_016; host=host_tc_016; environment=env_tc_016; synthetic=true; isolation=ephemeral; reset=required`
- ST: DRAFT with valid dependency/variables/mapping → API-010 report with 0 Error/0 Warning → READY; any subsequent definition edit makes the report stale.

<!-- ID: TC-017 -->
<!-- VERIFIES: AC-017 -->
### TC-017: [US-006][AC-017][DT+DD] validation hiển thị hai dòng lỗi riêng, mỗi dòng nêu đúng tên biến và environment; nút "Chạy workflow" bị disabled. `[planned-automated]` `P0`

**Area**: API_LAB
**Traceability**: FR-007, US-006, AC-017
**Design states referenced**: SCREEN-004, SCREEN-008
**API / NFR refs**: API-010 POST /api/v1/hosts/{hostId}/api-lab/workflows/{workflowId}/versions/{versionId}/validations; API-011 POST /api/v1/hosts/{hostId}/api-lab/workflows/{workflowId}/enable; API-013 POST /api/v1/hosts/{hostId}/api-lab/workflow-runs
**Manual / Auto boundary**: automated contract/component/E2E assertion; visual wording/focus is also sampled manually by TC-072
**Test Level**: e2e
**Test Type**: Functional
**Export target**: functional
**Smoke**: N
**Environment**: Local Docker Compose and CI with deterministic clock/provider/IAM fakes
**Data needs**: Synthetic Host `host-active-01`, isolated MySQL schema, US-006 fixture; no production PII; mutations are scoped to this case.
**Teardown / reset**: Gọi seed/reset hook theo Host fixture sau case; xác nhận không còn execution/job/tombstone phát sinh.
**Depends on**: —
**Automation intent**: Auto=Y; implement in the Plan-owned repo delta using Fastify inject/Prisma integration, Vitest + Vue Test Utils, or Playwright according to Test Level; preserve stable Design hooks and API error contracts.
**External QA handoff needs**: N/A — no external QA in sprint v1.
**Owner of execution context**: khanh-pham runs locally and CI stores machine-readable evidence.

**Given**:
- Actor `usr_tc_017` đã đăng nhập; Host `host_tc_017`, Environment `env_tc_017` và dữ liệu phụ thuộc được seed riêng cho case.
- Tiền điều kiện AC-017: Environment PROD thiếu hai biến bắt buộc.

**When**:
- POST API-010 /validations for PROD binding missing two required variables.

**Then**:
- [ ] API-010 returns 201 with exactly two Error findings naming both variables and PROD; API-013 request count and Execution count remain 0.
- [ ] Exact Product outcome: validation hiển thị hai dòng lỗi riêng, mỗi dòng nêu đúng tên biến và environment; nút "Chạy workflow" bị disabled.

**Test Data**:
- `fixture_id=tc_017; actor=usr_tc_017; host=host_tc_017; environment=env_tc_017; synthetic=true; isolation=ephemeral; reset=required`
- DT+DD: missing_required_count={0,1,2}; each missing key emits one finding and any Error disables Run.

<!-- ID: TC-018 -->
<!-- VERIFIES: AC-018 -->
### TC-018: [US-006][AC-018][ST] validation hiển thị đúng step "API không còn tồn tại. Hãy chọn API thay thế hoặc xóa bước này." và giữ trạng thái DISABLED. `[planned-automated]` `P0`

**Area**: API_LAB
**Traceability**: FR-007, US-006, AC-018
**Design states referenced**: SCREEN-004, SCREEN-008
**API / NFR refs**: API-010 POST /api/v1/hosts/{hostId}/api-lab/workflows/{workflowId}/versions/{versionId}/validations; API-011 POST /api/v1/hosts/{hostId}/api-lab/workflows/{workflowId}/enable; API-013 POST /api/v1/hosts/{hostId}/api-lab/workflow-runs
**Manual / Auto boundary**: automated contract/component/E2E assertion; visual wording/focus is also sampled manually by TC-072
**Test Level**: e2e
**Test Type**: Functional
**Export target**: functional
**Smoke**: N
**Environment**: Local Docker Compose and CI with deterministic clock/provider/IAM fakes
**Data needs**: Synthetic Host `host-active-01`, isolated MySQL schema, US-006 fixture; no production PII; mutations are scoped to this case.
**Teardown / reset**: Gọi seed/reset hook theo Host fixture sau case; xác nhận không còn execution/job/tombstone phát sinh.
**Depends on**: —
**Automation intent**: Auto=Y; implement in the Plan-owned repo delta using Fastify inject/Prisma integration, Vitest + Vue Test Utils, or Playwright according to Test Level; preserve stable Design hooks and API error contracts.
**External QA handoff needs**: N/A — no external QA in sprint v1.
**Owner of execution context**: khanh-pham runs locally and CI stores machine-readable evidence.

**Given**:
- Actor `usr_tc_018` đã đăng nhập; Host `host_tc_018`, Environment `env_tc_018` và dữ liệu phụ thuộc được seed riêng cho case.
- Tiền điều kiện AC-018: Workflow tham chiếu API đã xóa.

**When**:
- DELETE API-005 dependent API or PUT API-007 method change, then POST API-010 validation.

**Then**:
- [ ] Dependency mutation commits, API-010 returns 201 with Error findings and API-008 returns Workflow DISABLED; API-013 is rejected/not offered until recovery.
- [ ] Exact Product outcome: validation hiển thị đúng step "API không còn tồn tại. Hãy chọn API thay thế hoặc xóa bước này." và giữ trạng thái DISABLED.

**Test Data**:
- `fixture_id=tc_018; actor=usr_tc_018; host=host_tc_018; environment=env_tc_018; synthetic=true; isolation=ephemeral; reset=required`
- ST: READY/current report → dependency deleted or method changed → DISABLED/stale; no direct Run transition.

<!-- ID: TC-019 -->
<!-- VERIFIES: AC-019 -->
### TC-019: [US-007][AC-019][ST] step 2 bắt đầu sau step 1 SUCCEEDED, step 3 bắt đầu sau step 2 SUCCEEDED, execution hiển thị SUCCEEDED và mỗi step có duration/input/output mask đúng sensitive_fields. `[planned-automated]` `P0`

**Area**: API_LAB
**Traceability**: FR-008, FR-010, FR-012, US-007, AC-019
**Design states referenced**: SCREEN-005, SCREEN-007
**API / NFR refs**: API-013 POST /api/v1/hosts/{hostId}/api-lab/workflow-runs; API-014 GET /api/v1/hosts/{hostId}/api-lab/executions/{executionId}; API-015 GET /api/v1/hosts/{hostId}/api-lab/executions
**Manual / Auto boundary**: automated contract/component/E2E assertion; visual wording/focus is also sampled manually by TC-072
**Test Level**: e2e
**Test Type**: Functional
**Export target**: functional
**Smoke**: Y
**Environment**: Local Docker Compose and CI with deterministic clock/provider/IAM fakes
**Data needs**: Synthetic Host `host-active-01`, isolated MySQL schema, US-007 fixture; no production PII; mutations are scoped to this case.
**Teardown / reset**: Gọi seed/reset hook theo Host fixture sau case; xác nhận không còn execution/job/tombstone phát sinh.
**Depends on**: —
**Automation intent**: Auto=Y; implement in the Plan-owned repo delta using Fastify inject/Prisma integration, Vitest + Vue Test Utils, or Playwright according to Test Level; preserve stable Design hooks and API error contracts.
**External QA handoff needs**: N/A — no external QA in sprint v1.
**Owner of execution context**: khanh-pham runs locally and CI stores machine-readable evidence.

**Given**:
- Actor `usr_tc_019` đã đăng nhập; Host `host_tc_019`, Environment `env_tc_019` và dữ liệu phụ thuộc được seed riêng cho case.
- Tiền điều kiện AC-019: Execution ba step đều thành công.

**When**:
- POST API-013 /workflow-runs, then poll API-014 until terminal.

**Then**:
- [ ] API-013 returns 202; successive API-014 200 projections show strictly ordered Step 1→2→3 and one SUCCEEDED terminal outcome.
- [ ] Exact Product outcome: step 2 bắt đầu sau step 1 SUCCEEDED, step 3 bắt đầu sau step 2 SUCCEEDED, execution hiển thị SUCCEEDED và mỗi step có duration/input/output mask đúng sensitive_fields.

**Test Data**:
- `fixture_id=tc_019; actor=usr_tc_019; host=host_tc_019; environment=env_tc_019; synthetic=true; isolation=ephemeral; reset=required`
- ST: PENDING → RUNNING step1→step2→step3 → SUCCEEDED; timestamps and attempt order strictly increase.

<!-- ID: TC-020 -->
<!-- VERIFIES: AC-020 -->
### TC-020: [US-007][AC-020][ST] Step 3 giữ trạng thái "Chưa chạy", execution hiển thị "Thất bại tại bước 2." và không gửi request Step 3. `[planned-automated]` `P0`

**Area**: API_LAB
**Traceability**: FR-008, FR-010, FR-012, US-007, AC-020
**Design states referenced**: SCREEN-005, SCREEN-007
**API / NFR refs**: API-013 POST /api/v1/hosts/{hostId}/api-lab/workflow-runs; API-014 GET /api/v1/hosts/{hostId}/api-lab/executions/{executionId}; API-015 GET /api/v1/hosts/{hostId}/api-lab/executions
**Manual / Auto boundary**: automated contract/component/E2E assertion; visual wording/focus is also sampled manually by TC-072
**Test Level**: e2e
**Test Type**: Functional
**Export target**: functional
**Smoke**: N
**Environment**: Local Docker Compose and CI with deterministic clock/provider/IAM fakes
**Data needs**: Synthetic Host `host-active-01`, isolated MySQL schema, US-007 fixture; no production PII; mutations are scoped to this case.
**Teardown / reset**: Gọi seed/reset hook theo Host fixture sau case; xác nhận không còn execution/job/tombstone phát sinh.
**Depends on**: —
**Automation intent**: Auto=Y; implement in the Plan-owned repo delta using Fastify inject/Prisma integration, Vitest + Vue Test Utils, or Playwright according to Test Level; preserve stable Design hooks and API error contracts.
**External QA handoff needs**: N/A — no external QA in sprint v1.
**Owner of execution context**: khanh-pham runs locally and CI stores machine-readable evidence.

**Given**:
- Actor `usr_tc_020` đã đăng nhập; Host `host_tc_020`, Environment `env_tc_020` và dữ liệu phụ thuộc được seed riêng cho case.
- Tiền điều kiện AC-020: Step 2 chuyển FAILED sau khi hết retry.

**When**:
- POST API-013 /workflow-runs with Step 2 failure, then poll API-014.

**Then**:
- [ ] API-013 returns 202; API-014 returns FAILED at Step 2 with later steps NOT_RUN and later-step provider call count 0.
- [ ] Exact Product outcome: Step 3 giữ trạng thái "Chưa chạy", execution hiển thị "Thất bại tại bước 2." và không gửi request Step 3.

**Test Data**:
- `fixture_id=tc_020; actor=usr_tc_020; host=host_tc_020; environment=env_tc_020; synthetic=true; isolation=ephemeral; reset=required`
- ST: RUNNING step2 → FAILED; later steps remain NOT_RUN with provider call count=0.

<!-- ID: TC-021 -->
<!-- VERIFIES: AC-021 -->
### TC-021: [US-007][AC-021][BVA] trạng thái và response đã mask của step xuất hiện trên UI trong ≤ 1 giây. `[planned-automated]` `P0`

**Area**: API_LAB
**Traceability**: FR-008, FR-010, FR-012, US-007, AC-021
**Design states referenced**: SCREEN-005, SCREEN-007
**API / NFR refs**: API-013 POST /api/v1/hosts/{hostId}/api-lab/workflow-runs; API-014 GET /api/v1/hosts/{hostId}/api-lab/executions/{executionId}; API-015 GET /api/v1/hosts/{hostId}/api-lab/executions
**Manual / Auto boundary**: automated contract/component/E2E assertion; visual wording/focus is also sampled manually by TC-072
**Test Level**: e2e
**Test Type**: Functional
**Export target**: functional
**Smoke**: N
**Environment**: Local Docker Compose and CI with deterministic clock/provider/IAM fakes
**Data needs**: Synthetic Host `host-active-01`, isolated MySQL schema, US-007 fixture; no production PII; mutations are scoped to this case.
**Teardown / reset**: N/A — case chỉ đọc hoặc validation không commit.
**Depends on**: —
**Automation intent**: Auto=Y; implement in the Plan-owned repo delta using Fastify inject/Prisma integration, Vitest + Vue Test Utils, or Playwright according to Test Level; preserve stable Design hooks and API error contracts.
**External QA handoff needs**: N/A — no external QA in sprint v1.
**Owner of execution context**: khanh-pham runs locally and CI stores machine-readable evidence.

**Given**:
- Actor `usr_tc_021` đã đăng nhập; Host `host_tc_021`, Environment `env_tc_021` và dữ liệu phụ thuộc được seed riêng cho case.
- Tiền điều kiện AC-021: Hệ thống nhận xong response một step.

**When**:
- Complete provider response and poll API-014 at 999/1000/1001ms.

**Then**:
- [ ] For 999ms and 1000ms the terminal UI projection appears within target; 1001ms fails the performance assertion while API-014 remains contract-valid 200.
- [ ] Exact Product outcome: trạng thái và response đã mask của step xuất hiện trên UI trong ≤ 1 giây.

**Test Data**:
- `fixture_id=tc_021; actor=usr_tc_021; host=host_tc_021; environment=env_tc_021; synthetic=true; isolation=ephemeral; reset=required`
- BVA: terminal projection delay=999ms,1000ms,1001ms after provider response; UI target is ≤1000ms.

<!-- ID: TC-022 -->
<!-- VERIFIES: AC-022 -->
### TC-022: [US-008][AC-022][BVA] chỉ step đó được gọi lại, execution detail hiển thị step SUCCEEDED với "Số lần gọi: 2", các step trước không chạy lại. `[planned-automated]` `P0`

**Area**: API_LAB
**Traceability**: FR-009, US-008, AC-022
**Design states referenced**: SCREEN-004, SCREEN-005
**API / NFR refs**: API-013 POST /api/v1/hosts/{hostId}/api-lab/workflow-runs; API-014 GET /api/v1/hosts/{hostId}/api-lab/executions/{executionId}
**Manual / Auto boundary**: automated contract/component/E2E assertion; visual wording/focus is also sampled manually by TC-072
**Test Level**: e2e
**Test Type**: Functional
**Export target**: functional
**Smoke**: Y
**Environment**: Local Docker Compose and CI with deterministic clock/provider/IAM fakes
**Data needs**: Synthetic Host `host-active-01`, isolated MySQL schema, US-008 fixture; no production PII; mutations are scoped to this case.
**Teardown / reset**: Gọi seed/reset hook theo Host fixture sau case; xác nhận không còn execution/job/tombstone phát sinh.
**Depends on**: —
**Automation intent**: Auto=Y; implement in the Plan-owned repo delta using Fastify inject/Prisma integration, Vitest + Vue Test Utils, or Playwright according to Test Level; preserve stable Design hooks and API error contracts.
**External QA handoff needs**: N/A — no external QA in sprint v1.
**Owner of execution context**: khanh-pham runs locally and CI stores machine-readable evidence.

**Given**:
- Actor `usr_tc_022` đã đăng nhập; Host `host_tc_022`, Environment `env_tc_022` và dữ liệu phụ thuộc được seed riêng cho case.
- Tiền điều kiện AC-022: Step cấu hình retry 2 lần và gặp một lỗi tạm thời thuộc nhóm được retry trước khi thành công.
- A previous Step has already SUCCEEDED; the target Step saves `retryDelaySeconds` rows 0, 1 and 2; the provider fake can emit exactly one retryable outcome then success for each class: timeout, DNS resolution, network, connect, connection reset, HTTP 408, HTTP 429 and representative HTTP 500/502/503.

**When**:
- For every retryable class and saved delay row, PUT API-009 with retry_count=2, POST API-013, advance the deterministic clock by exactly the saved delay, then inspect attempts via API-014.

**Then**:
- [ ] Every allowlisted class is classified retryable, succeeds after exactly two attempts and persists both attempt records; no unlisted class enters this branch.
- [ ] The second attempt starts only after exactly `retryDelaySeconds` (0/1/2 seconds under the controllable clock), with no exponential backoff for target-provider Step retries.
- [ ] Exact Product outcome: chỉ step đó được gọi lại, execution detail hiển thị step SUCCEEDED với "Số lần gọi: 2", các step trước không chạy lại.

**Test Data**:
- `fixture_id=tc_022; actor=usr_tc_022; host=host_tc_022; environment=env_tc_022; synthetic=true; isolation=ephemeral; reset=required`
- `retry_count=2; retry_delay_seconds=0,1,2; retryable_classes=timeout,DNS,network,connect,connection_reset,HTTP_408,HTTP_429,HTTP_500,HTTP_502,HTTP_503; provider_outcomes=retryable_once,success; expected_attempts=2; previous_step_calls=1`.

<!-- ID: TC-023 -->
<!-- VERIFIES: AC-023 -->
### TC-023: [US-008][AC-023][BVA] step FAILED sau attempt thứ ba, history ghi retry_count: 2, execution dừng và không chạy lại step trước. `[planned-automated]` `P0`

**Area**: API_LAB
**Traceability**: FR-009, US-008, AC-023
**Design states referenced**: SCREEN-004, SCREEN-005
**API / NFR refs**: API-013 POST /api/v1/hosts/{hostId}/api-lab/workflow-runs; API-014 GET /api/v1/hosts/{hostId}/api-lab/executions/{executionId}
**Manual / Auto boundary**: automated contract/component/E2E assertion; visual wording/focus is also sampled manually by TC-072
**Test Level**: integration
**Test Type**: Functional
**Export target**: functional
**Smoke**: N
**Environment**: Local Docker Compose and CI with deterministic clock/provider/IAM fakes
**Data needs**: Synthetic Host `host-active-01`, isolated MySQL schema, US-008 fixture; no production PII; mutations are scoped to this case.
**Teardown / reset**: Gọi seed/reset hook theo Host fixture sau case; xác nhận không còn execution/job/tombstone phát sinh.
**Depends on**: —
**Automation intent**: Auto=Y; implement in the Plan-owned repo delta using Fastify inject/Prisma integration, Vitest + Vue Test Utils, or Playwright according to Test Level; preserve stable Design hooks and API error contracts.
**External QA handoff needs**: N/A — no external QA in sprint v1.
**Owner of execution context**: khanh-pham runs locally and CI stores machine-readable evidence.

**Given**:
- Actor `usr_tc_023` đã đăng nhập; Host `host_tc_023`, Environment `env_tc_023` và dữ liệu phụ thuộc được seed riêng cho case.
- Tiền điều kiện AC-023: Step cấu hình retry 2 lần và cả ba attempt đều timeout.
- A previous Step is already SUCCEEDED; the target Step stores `retryDelaySeconds=1`; the deterministic provider times out for every target attempt.

**When**:
- For each persisted retry_count row 0, 1, 2, 3, 4 and 5, POST API-013, advance the controllable clock in exact one-second increments between attempts, and poll API-014 to terminal.

**Then**:
- [ ] Every row persists exactly `1+retryCount` attempts: 1/2/3/4/5/6 for retry_count 0/1/2/3/4/5; each execution ends FAILED and records the selected retry_count.
- [ ] Every retry begins exactly one second after the preceding terminal attempt; no retry is scheduled after the final allowed attempt.
- [ ] Row AC-023 retry_count=2 kết thúc sau đúng attempt thứ ba; execution dừng tại step đích, không gọi step sau và không chạy lại step đã SUCCEEDED trước đó.
- [ ] Inspector của mỗi row hiển thị timeout cuối cùng và attempt count=retry_count+1.

**Test Data**:
- `fixture_id=tc_023; retry_count=0,1,2,3,4,5; expected_attempts=1,2,3,4,5,6; retry_delay_seconds=1; attempt_outcome=timeout_for_all_attempts; exact_ac_row=retry_count:2,expected_attempts:3; previous_step_calls=1; synthetic=true; isolation=ephemeral; reset=required`

<!-- ID: TC-024 -->
<!-- VERIFIES: AC-024 -->
### TC-024: [US-008][AC-024][Negative] không có lần gọi thứ hai, step hiển thị FAILED với lý do "Lỗi không thuộc nhóm được retry." và execution dừng. `[planned-automated]` `P0`

**Area**: API_LAB
**Traceability**: FR-009, US-008, AC-024
**Design states referenced**: SCREEN-004, SCREEN-005
**API / NFR refs**: API-013 POST /api/v1/hosts/{hostId}/api-lab/workflow-runs; API-014 GET /api/v1/hosts/{hostId}/api-lab/executions/{executionId}
**Manual / Auto boundary**: automated contract/component/E2E assertion; visual wording/focus is also sampled manually by TC-072
**Test Level**: e2e
**Test Type**: Functional
**Export target**: functional
**Smoke**: N
**Environment**: Local Docker Compose and CI with deterministic clock/provider/IAM fakes
**Data needs**: Synthetic Host `host-active-01`, isolated MySQL schema, US-008 fixture; no production PII; mutations are scoped to this case.
**Teardown / reset**: Gọi seed/reset hook theo Host fixture sau case; xác nhận không còn execution/job/tombstone phát sinh.
**Depends on**: —
**Automation intent**: Auto=Y; implement in the Plan-owned repo delta using Fastify inject/Prisma integration, Vitest + Vue Test Utils, or Playwright according to Test Level; preserve stable Design hooks and API error contracts.
**External QA handoff needs**: N/A — no external QA in sprint v1.
**Owner of execution context**: khanh-pham runs locally and CI stores machine-readable evidence.

**Given**:
- Actor `usr_tc_024` đã đăng nhập; Host `host_tc_024`, Environment `env_tc_024` và dữ liệu phụ thuộc được seed riêng cho case.
- Tiền điều kiện AC-024: API gặp lỗi validation không thuộc nhóm được retry dù step cấu hình retry 5 lần.
- Non-retryable provider rows cover mapping/config errors and HTTP 400/401/403/404/409/422; a previous Step is already SUCCEEDED.

**When**:
- For every non-retryable row, POST API-013 with retry_count=5, then poll API-014.

**Then**:
- [ ] API-013 returns 202; every mapping/config or non-408/429 HTTP 4xx row stops after exactly one attempt despite retry_count=5, persists `retryable=false`, and shows MSG-014.
- [ ] Exact Product outcome: không có lần gọi thứ hai, step hiển thị FAILED với lý do "Lỗi không thuộc nhóm được retry." và execution dừng.
- [ ] The previous successful Step remains called exactly once and the later Step stays NOT_RUN.

**Test Data**:
- `fixture_id=tc_024; actor=usr_tc_024; host=host_tc_024; environment=env_tc_024; synthetic=true; isolation=ephemeral; reset=required`
- Negative: `retry_count=5; provider_result=mapping_error,config_error,HTTP_400,HTTP_401,HTTP_403,HTTP_404,HTTP_409,HTTP_422; expected_attempts=1; retryable=false; previous_step_calls=1; expected_message=MSG-014`.

<!-- ID: TC-025 -->
<!-- VERIFIES: AC-025 -->
### TC-025: [US-009][AC-025][DT+DD] dialog liệt kê đúng ba workflow và hiển thị "Các workflow này sẽ bị vô hiệu hóa sau khi xóa API." trước nút xác nhận. `[planned-automated]` `P0`

**Area**: API_LAB
**Traceability**: FR-001, FR-003, FR-011, US-009, AC-025
**Design states referenced**: SCREEN-001, SCREEN-006, SCREEN-008
**API / NFR refs**: API-004 POST /api/v1/hosts/{hostId}/api-lab/resource-commands; API-005 DELETE /api/v1/hosts/{hostId}/api-lab/apis/{apiId}; API-006 POST /api/v1/hosts/{hostId}/api-lab/apis/{apiId}/undo-deletion; API-007 PUT /api/v1/hosts/{hostId}/api-lab/apis/{apiId}; API-011 POST /api/v1/hosts/{hostId}/api-lab/workflows/{workflowId}/enable; API-021 POST /api/v1/hosts/{hostId}/lifecycle-impact; API-022 PATCH /api/v1/hosts/{hostId}
**Manual / Auto boundary**: automated contract/component/E2E assertion; visual wording/focus is also sampled manually by TC-072
**Test Level**: e2e
**Test Type**: Functional
**Export target**: functional
**Smoke**: Y
**Environment**: Local Docker Compose and CI with deterministic clock/provider/IAM fakes
**Data needs**: Synthetic Host `host-active-01`, isolated MySQL schema, US-009 fixture; no production PII; mutations are scoped to this case.
**Teardown / reset**: Gọi seed/reset hook theo Host fixture sau case; xác nhận không còn execution/job/tombstone phát sinh.
**Depends on**: —
**Automation intent**: Auto=Y; implement in the Plan-owned repo delta using Fastify inject/Prisma integration, Vitest + Vue Test Utils, or Playwright according to Test Level; preserve stable Design hooks and API error contracts.
**External QA handoff needs**: N/A — no external QA in sprint v1.
**Owner of execution context**: khanh-pham runs locally and CI stores machine-readable evidence.

**Given**:
- Actor `usr_tc_025` đã đăng nhập; Host `host_tc_025`, Environment `env_tc_025` và dữ liệu phụ thuộc được seed riêng cho case.
- Tiền điều kiện AC-025: Xóa API đang được ba workflow dùng.

**When**:
- DELETE API-005 with impactToken under cancel/confirm variants.

**Then**:
- [ ] Cancel sends no API-005 and changes no state; Confirm sends API-005 which returns 200 with the exact disabledWorkflowIds and undoDeadline.
- [ ] Exact Product outcome: dialog liệt kê đúng ba workflow và hiển thị "Các workflow này sẽ bị vô hiệu hóa sau khi xóa API." trước nút xác nhận.

**Test Data**:
- `fixture_id=tc_025; actor=usr_tc_025; host=host_tc_025; environment=env_tc_025; synthetic=true; isolation=ephemeral; reset=required`
- DT+DD: affected_count={0,1,many} × confirm={cancel,confirm}; mutation occurs only on confirm.

<!-- ID: TC-026 -->
<!-- VERIFIES: AC-026 -->
### TC-026: [US-009][AC-026][ST] API biến mất khỏi collection, ba Workflow chuyển DISABLED và nút "Chạy workflow" bị disabled cho đến khi dependency hợp lệ, validation có 0 Lỗi và người dùng chủ động Bật workflow. `[planned-automated]` `P0`

**Area**: API_LAB
**Traceability**: FR-001, FR-003, FR-011, US-009, AC-026
**Design states referenced**: SCREEN-001, SCREEN-006, SCREEN-008
**API / NFR refs**: API-004 POST /api/v1/hosts/{hostId}/api-lab/resource-commands; API-005 DELETE /api/v1/hosts/{hostId}/api-lab/apis/{apiId}; API-006 POST /api/v1/hosts/{hostId}/api-lab/apis/{apiId}/undo-deletion; API-007 PUT /api/v1/hosts/{hostId}/api-lab/apis/{apiId}; API-011 POST /api/v1/hosts/{hostId}/api-lab/workflows/{workflowId}/enable; API-021 POST /api/v1/hosts/{hostId}/lifecycle-impact; API-022 PATCH /api/v1/hosts/{hostId}
**Manual / Auto boundary**: automated contract/component/E2E assertion; visual wording/focus is also sampled manually by TC-072
**Test Level**: e2e
**Test Type**: Functional
**Export target**: functional
**Smoke**: N
**Environment**: Local Docker Compose and CI with deterministic clock/provider/IAM fakes
**Data needs**: Synthetic Host `host-active-01`, isolated MySQL schema, US-009 fixture; no production PII; mutations are scoped to this case.
**Teardown / reset**: Gọi seed/reset hook theo Host fixture sau case; xác nhận không còn execution/job/tombstone phát sinh.
**Depends on**: —
**Automation intent**: Auto=Y; implement in the Plan-owned repo delta using Fastify inject/Prisma integration, Vitest + Vue Test Utils, or Playwright according to Test Level; preserve stable Design hooks and API error contracts.
**External QA handoff needs**: N/A — no external QA in sprint v1.
**Owner of execution context**: khanh-pham runs locally and CI stores machine-readable evidence.

**Given**:
- Actor `usr_tc_026` đã đăng nhập; Host `host_tc_026`, Environment `env_tc_026` và dữ liệu phụ thuộc được seed riêng cho case.
- Tiền điều kiện AC-026: Người dùng xác nhận xóa API.

**When**:
- DELETE API-005 for an API referenced by READY workflows, then GET API-008.

**Then**:
- [ ] API-005 returns 200 and API-008 returns 200 with every affected Workflow DISABLED; no Workflow is auto-enabled.
- [ ] Exact Product outcome: API biến mất khỏi collection, ba Workflow chuyển DISABLED và nút "Chạy workflow" bị disabled cho đến khi dependency hợp lệ, validation có 0 Lỗi và người dùng chủ động Bật workflow.

**Test Data**:
- `fixture_id=tc_026; actor=usr_tc_026; host=host_tc_026; environment=env_tc_026; synthetic=true; isolation=ephemeral; reset=required`
- ST: dependent workflow READY → API delete commit → DISABLED; Review/Validate/Enable remains required.

<!-- ID: TC-027 -->
<!-- VERIFIES: AC-027 -->
### TC-027: [US-009][AC-027][ST] mọi API/workflow của Host bị chặn chạy với thông báo "Host đang không hoạt động. Hãy kích hoạt Host trước khi chạy.", execution history cũ vẫn xem được. `[planned-automated]` `P0`

**Area**: API_LAB
**Traceability**: FR-001, FR-003, FR-011, US-009, AC-027
**Design states referenced**: SCREEN-001, SCREEN-006, SCREEN-008
**API / NFR refs**: API-004 POST /api/v1/hosts/{hostId}/api-lab/resource-commands; API-005 DELETE /api/v1/hosts/{hostId}/api-lab/apis/{apiId}; API-006 POST /api/v1/hosts/{hostId}/api-lab/apis/{apiId}/undo-deletion; API-007 PUT /api/v1/hosts/{hostId}/api-lab/apis/{apiId}; API-011 POST /api/v1/hosts/{hostId}/api-lab/workflows/{workflowId}/enable; API-021 POST /api/v1/hosts/{hostId}/lifecycle-impact; API-022 PATCH /api/v1/hosts/{hostId}
**Manual / Auto boundary**: automated contract/component/E2E assertion; visual wording/focus is also sampled manually by TC-072
**Test Level**: integration
**Test Type**: Functional
**Export target**: functional
**Smoke**: N
**Environment**: Local Docker Compose and CI with deterministic clock/provider/IAM fakes
**Data needs**: Synthetic Host `host-active-01`, isolated MySQL schema, US-009 fixture; no production PII; mutations are scoped to this case.
**Teardown / reset**: Gọi seed/reset hook theo Host fixture sau case; xác nhận không còn execution/job/tombstone phát sinh.
**Depends on**: —
**Automation intent**: Auto=Y; implement in the Plan-owned repo delta using Fastify inject/Prisma integration, Vitest + Vue Test Utils, or Playwright according to Test Level; preserve stable Design hooks and API error contracts.
**External QA handoff needs**: N/A — no external QA in sprint v1.
**Owner of execution context**: khanh-pham runs locally and CI stores machine-readable evidence.

**Given**:
- Actor `usr_tc_027` đã đăng nhập; Host `host_tc_027`, Environment `env_tc_027` và dữ liệu phụ thuộc được seed riêng cho case.
- Tiền điều kiện AC-027: Host chuyển INACTIVE.

**When**:
- POST API-021 lấy impact; PATCH API-022 chuyển Host ACTIVE→INACTIVE; thử API-012/API-013; GET API-015 cho execution terminal cũ.

**Then**:
- [ ] Mọi run mới trả 409 HOST_INACTIVE; không tạo execution/job/provider call.
- [ ] UI disable Chạy API/Chạy workflow và hiển thị đúng MSG-001.
- [ ] API-015 vẫn trả 200; History cũ xem được và không bị sửa.

**Test Data**:
- `fixture_id=tc_027; transition=ACTIVE->INACTIVE; old_execution=exec_tc_027_old; attempted_runs=standalone,workflow; synthetic=true; isolation=ephemeral; reset=required`

<!-- ID: TC-028 -->
<!-- VERIFIES: AC-028 -->
### TC-028: [US-010][AC-028][Positive] mỗi record hiển thị người chạy, resolved workflow version, environment ID, snapshot timestamp, trạng thái và duration; detail hiển thị attempts/lỗi/input/output mask đúng cấu hình, không chứa raw credential. `[planned-automated]` `P0`

**Area**: API_LAB
**Traceability**: FR-010, FR-012, US-010, AC-028
**Design states referenced**: SCREEN-005, SCREEN-007
**API / NFR refs**: API-014 GET /api/v1/hosts/{hostId}/api-lab/executions/{executionId}; API-015 GET /api/v1/hosts/{hostId}/api-lab/executions; API-016 POST /api/v1/hosts/{hostId}/api-lab/executions/{executionId}/reruns
**Manual / Auto boundary**: automated contract/component/E2E assertion; visual wording/focus is also sampled manually by TC-072
**Test Level**: e2e
**Test Type**: Functional
**Export target**: functional
**Smoke**: N
**Environment**: Local Docker Compose and CI with deterministic clock/provider/IAM fakes
**Data needs**: Synthetic Host `host-active-01`, isolated MySQL schema, US-010 fixture; no production PII; mutations are scoped to this case.
**Teardown / reset**: Gọi seed/reset hook theo Host fixture sau case; xác nhận không còn execution/job/tombstone phát sinh.
**Depends on**: —
**Automation intent**: Auto=Y; implement in the Plan-owned repo delta using Fastify inject/Prisma integration, Vitest + Vue Test Utils, or Playwright according to Test Level; preserve stable Design hooks and API error contracts.
**External QA handoff needs**: N/A — no external QA in sprint v1.
**Owner of execution context**: khanh-pham runs locally and CI stores machine-readable evidence.

**Given**:
- Actor `usr_tc_028` đã đăng nhập; Host `host_tc_028`, Environment `env_tc_028` và dữ liệu phụ thuộc được seed riêng cho case.
- Tiền điều kiện AC-028: Mở execution history.

**When**:
- GET API-015 /executions with status/environment filters, then GET API-014 selected record.

**Then**:
- [ ] API-015 and selected API-014 return 200; status/environment filters return only matching immutable rows and masked detail.
- [ ] Exact Product outcome: mỗi record hiển thị người chạy, resolved workflow version, environment ID, snapshot timestamp, trạng thái và duration; detail hiển thị attempts/lỗi/input/output mask đúng cấu hình, không chứa raw credential.

**Test Data**:
- `fixture_id=tc_028; actor=usr_tc_028; host=host_tc_028; environment=env_tc_028; synthetic=true; isolation=ephemeral; reset=required`
- EP: status={SUCCEEDED,FAILED} × environment={DEV,UAT,PROD}; each row opens immutable detail.

<!-- ID: TC-029 -->
<!-- VERIFIES: AC-029 -->
### TC-029: [US-010][AC-029][Positive] hệ thống validate latest saved workflow version, snapshot environment hiện hành, tạo execution ID mới, liên kết "Chạy lại từ [execution ID nguồn]" và không dùng version/snapshot cũ. `[planned-automated]` `P0`

**Area**: API_LAB
**Traceability**: FR-010, FR-012, US-010, AC-029
**Design states referenced**: SCREEN-005, SCREEN-007
**API / NFR refs**: API-014 GET /api/v1/hosts/{hostId}/api-lab/executions/{executionId}; API-015 GET /api/v1/hosts/{hostId}/api-lab/executions; API-016 POST /api/v1/hosts/{hostId}/api-lab/executions/{executionId}/reruns
**Manual / Auto boundary**: automated contract/component/E2E assertion; visual wording/focus is also sampled manually by TC-072
**Test Level**: integration
**Test Type**: Functional
**Export target**: functional
**Smoke**: Y
**Environment**: Local Docker Compose and CI with deterministic clock/provider/IAM fakes
**Data needs**: Synthetic Host `host-active-01`, isolated MySQL schema, US-010 fixture; no production PII; mutations are scoped to this case.
**Teardown / reset**: Gọi seed/reset hook theo Host fixture sau case; xác nhận không còn execution/job/tombstone phát sinh.
**Depends on**: —
**Automation intent**: Auto=Y; implement in the Plan-owned repo delta using Fastify inject/Prisma integration, Vitest + Vue Test Utils, or Playwright according to Test Level; preserve stable Design hooks and API error contracts.
**External QA handoff needs**: N/A — no external QA in sprint v1.
**Owner of execution context**: khanh-pham runs locally and CI stores machine-readable evidence.

**Given**:
- Actor `usr_tc_029` đã đăng nhập; Host `host_tc_029`, Environment `env_tc_029` và dữ liệu phụ thuộc được seed riêng cho case.
- Tiền điều kiện AC-029: Chọn "Chạy lại" trên workflow READY.

**When**:
- POST API-016 /executions/{executionId}/reruns, then GET API-014 source and new IDs.

**Then**:
- [ ] API-016 returns 202 with a new executionId/sourceExecutionId; API-014 shows source unchanged and new run pinned to latest valid definition/environment.
- [ ] Exact Product outcome: hệ thống validate latest saved workflow version, snapshot environment hiện hành, tạo execution ID mới, liên kết "Chạy lại từ [execution ID nguồn]" và không dùng version/snapshot cũ.

**Test Data**:
- `fixture_id=tc_029; actor=usr_tc_029; host=host_tc_029; environment=env_tc_029; synthetic=true; isolation=ephemeral; reset=required`
- ST: source execution terminal → rerun confirmation → new execution ID; source record remains unchanged.

<!-- ID: TC-030 -->
<!-- VERIFIES: AC-030 -->
### TC-030: [US-010][AC-030][BVA] record không còn xuất hiện trong history sau tác vụ retention, trong khi execution đúng 30 ngày hoặc mới hơn vẫn hiển thị. `[planned-automated]` `P0`

**Area**: API_LAB
**Traceability**: FR-010, FR-012, US-010, AC-030
**Design states referenced**: SCREEN-005, SCREEN-007
**API / NFR refs**: API-014 GET /api/v1/hosts/{hostId}/api-lab/executions/{executionId}; API-015 GET /api/v1/hosts/{hostId}/api-lab/executions; API-016 POST /api/v1/hosts/{hostId}/api-lab/executions/{executionId}/reruns
**Manual / Auto boundary**: automated contract/component/E2E assertion; visual wording/focus is also sampled manually by TC-072
**Test Level**: e2e
**Test Type**: Functional
**Export target**: functional
**Smoke**: N
**Environment**: Local Docker Compose and CI with deterministic clock/provider/IAM fakes
**Data needs**: Synthetic Host `host-active-01`, isolated MySQL schema, US-010 fixture; no production PII; mutations are scoped to this case.
**Teardown / reset**: Gọi seed/reset hook theo Host fixture sau case; xác nhận không còn execution/job/tombstone phát sinh.
**Depends on**: —
**Automation intent**: Auto=Y; implement in the Plan-owned repo delta using Fastify inject/Prisma integration, Vitest + Vue Test Utils, or Playwright according to Test Level; preserve stable Design hooks and API error contracts.
**External QA handoff needs**: N/A — no external QA in sprint v1.
**Owner of execution context**: khanh-pham runs locally and CI stores machine-readable evidence.

**Given**:
- Actor `usr_tc_030` đã đăng nhập; Host `host_tc_030`, Environment `env_tc_030` và dữ liệu phụ thuộc được seed riêng cho case.
- Tiền điều kiện AC-030: Execution vượt quá 30 ngày retention.

**When**:
- GET API-015 /executions at retention boundary.

**Then**:
- [ ] API-015 returns 200; records at ≤30 days are present, records >30 days are absent, and an expired direct lookup follows API-014 expired/not-found contract.
- [ ] Exact Product outcome: record không còn xuất hiện trong history sau tác vụ retention, trong khi execution đúng 30 ngày hoặc mới hơn vẫn hiển thị.

**Test Data**:
- `fixture_id=tc_030; actor=usr_tc_030; host=host_tc_030; environment=env_tc_030; synthetic=true; isolation=ephemeral; reset=required`
- BVA: record age=29d23:59:59,30d00:00:00,30d00:00:01; only >30d is expired.

<!-- ID: TC-031 -->
<!-- VERIFIES: AC-031 -->
### TC-031: [US-007][AC-031][ST] execution hiện tại hoàn tất toàn bộ step theo v5; execution mới sau đó resolve v6. `[planned-automated]` `P0`

**Area**: API_LAB
**Traceability**: FR-008, FR-010, FR-012, US-007, AC-031
**Design states referenced**: SCREEN-005, SCREEN-007
**API / NFR refs**: API-013 POST /api/v1/hosts/{hostId}/api-lab/workflow-runs; API-014 GET /api/v1/hosts/{hostId}/api-lab/executions/{executionId}; API-015 GET /api/v1/hosts/{hostId}/api-lab/executions
**Manual / Auto boundary**: automated contract/component/E2E assertion; visual wording/focus is also sampled manually by TC-072
**Test Level**: integration
**Test Type**: Functional
**Export target**: functional
**Smoke**: N
**Environment**: Local Docker Compose and CI with deterministic clock/provider/IAM fakes
**Data needs**: Synthetic Host `host-active-01`, isolated MySQL schema, US-007 fixture; no production PII; mutations are scoped to this case.
**Teardown / reset**: Gọi seed/reset hook theo Host fixture sau case; xác nhận không còn execution/job/tombstone phát sinh.
**Depends on**: —
**Automation intent**: Auto=Y; implement in the Plan-owned repo delta using Fastify inject/Prisma integration, Vitest + Vue Test Utils, or Playwright according to Test Level; preserve stable Design hooks and API error contracts.
**External QA handoff needs**: N/A — no external QA in sprint v1.
**Owner of execution context**: khanh-pham runs locally and CI stores machine-readable evidence.

**Given**:
- Actor `usr_tc_031` đã đăng nhập; Host `host_tc_031`, Environment `env_tc_031` và dữ liệu phụ thuộc được seed riêng cho case.
- Tiền điều kiện AC-031: Execution bắt đầu bằng latest workflow version v5 rồi workflow được lưu thành v6 trong lúc chạy.

**When**:
- POST API-013 tạo execution v5; khi RUNNING, PUT API-009 lưu v6; hoàn tất run hiện tại rồi tạo run mới.

**Then**:
- [ ] Run đầu dùng v5 cho toàn bộ step; run sau có ID mới và chỉ dùng v6.
- [ ] Provider markers chứng minh không execution nào trộn hai revision.

**Test Data**:
- `fixture_id=tc_031; revisions=v5,v6; markers=v5_marker,v6_marker; executions=2; synthetic=true; isolation=ephemeral; reset=required`

<!-- ID: TC-032 -->
<!-- VERIFIES: AC-032 -->
### TC-032: [US-002][AC-032][ST] mọi step của execution hiện tại tiếp tục dùng snapshot C-001; execution mới dùng C-002. `[planned-automated]` `P0`

**Area**: API_LAB
**Traceability**: FR-002, US-002, AC-032
**Design states referenced**: SCREEN-002
**API / NFR refs**: API-001 GET /api/v1/hosts/{hostId}/api-lab; API-002 PUT /api/v1/hosts/{hostId}/api-lab/environments/{environmentKey}; API-023 DELETE /api/v1/hosts/{hostId}/api-lab/environments/{environmentKey}
**Manual / Auto boundary**: automated contract/component/E2E assertion; visual wording/focus is also sampled manually by TC-072
**Test Level**: integration
**Test Type**: Functional
**Export target**: functional
**Smoke**: N
**Environment**: Local Docker Compose and CI with deterministic clock/provider/IAM fakes
**Data needs**: Synthetic Host `host-active-01`, isolated MySQL schema, US-002 fixture; no production PII; mutations are scoped to this case.
**Teardown / reset**: Gọi seed/reset hook theo Host fixture sau case; xác nhận không còn execution/job/tombstone phát sinh.
**Depends on**: —
**Automation intent**: Auto=Y; implement in the Plan-owned repo delta using Fastify inject/Prisma integration, Vitest + Vue Test Utils, or Playwright according to Test Level; preserve stable Design hooks and API error contracts.
**External QA handoff needs**: N/A — no external QA in sprint v1.
**Owner of execution context**: khanh-pham runs locally and CI stores machine-readable evidence.

**Given**:
- Actor `usr_tc_032` đã đăng nhập; Host `host_tc_032`, Environment `env_tc_032` và dữ liệu phụ thuộc được seed riêng cho case.
- Tiền điều kiện AC-032: Execution bắt đầu với tenant_id=C-001 rồi environment được sửa thành tenant_id=C-002 trong lúc chạy.

**When**:
- POST API-013 khi Environment E1 có tenant_id=C-001; lúc RUNNING PUT API-002 lưu E2=C-002; hoàn tất rồi tạo run mới.

**Then**:
- [ ] Mọi step run đầu resolve C-001; run sau có ID mới và resolve C-002.
- [ ] Không step đang chạy đọc lại Environment mới; snapshot không lộ credential.

**Test Data**:
- `fixture_id=tc_032; environment_revisions=E1:C-001,E2:C-002; executions=2; synthetic=true; isolation=ephemeral; reset=required`

<!-- ID: TC-033 -->
<!-- VERIFIES: AC-033 -->
### TC-033: [US-006][AC-033][Negative] validation hiển thị hai vị trí xung đột với thông báo "Khóa bước bị trùng. Hãy lưu lại hoặc liên hệ quản trị viên.", chặn execution và không overwrite biến; hệ thống không tự đổi key vì key là bất biến. `[planned-automated]` `P0`

**Area**: API_LAB
**Traceability**: FR-007, US-006, AC-033
**Design states referenced**: SCREEN-004, SCREEN-008
**API / NFR refs**: API-010 POST /api/v1/hosts/{hostId}/api-lab/workflows/{workflowId}/versions/{versionId}/validations; API-011 POST /api/v1/hosts/{hostId}/api-lab/workflows/{workflowId}/enable; API-013 POST /api/v1/hosts/{hostId}/api-lab/workflow-runs
**Manual / Auto boundary**: automated contract/component/E2E assertion; visual wording/focus is also sampled manually by TC-072
**Test Level**: e2e
**Test Type**: Functional
**Export target**: functional
**Smoke**: N
**Environment**: Local Docker Compose and CI with deterministic clock/provider/IAM fakes
**Data needs**: Synthetic Host `host-active-01`, isolated MySQL schema, US-006 fixture; no production PII; mutations are scoped to this case.
**Teardown / reset**: Gọi seed/reset hook theo Host fixture sau case; xác nhận không còn execution/job/tombstone phát sinh.
**Depends on**: —
**Automation intent**: Auto=Y; implement in the Plan-owned repo delta using Fastify inject/Prisma integration, Vitest + Vue Test Utils, or Playwright according to Test Level; preserve stable Design hooks and API error contracts.
**External QA handoff needs**: N/A — no external QA in sprint v1.
**Owner of execution context**: khanh-pham runs locally and CI stores machine-readable evidence.

**Given**:
- Actor `usr_tc_033` đã đăng nhập; Host `host_tc_033`, Environment `env_tc_033` và dữ liệu phụ thuộc được seed riêng cho case.
- Tiền điều kiện AC-033: Persistence/import phát hiện hai step có cùng step_key kỹ thuật dù key không thể sửa từ UI.

**When**:
- Submit candidate persistence/import có step_key=step_02 tại Step 2 và Step 4 qua API-009/shared validation contract.

**Then**:
- [ ] Trả 422 DUPLICATE_STEP_KEY, đúng hai vị trí và exact Product message.
- [ ] Saved revision không đổi; không tự sửa key, overwrite mapping hay tạo execution/job.
- [ ] UI links/focus đúng cả hai Step xung đột.

**Test Data**:
- `fixture_id=tc_033; duplicate_key=step_02; conflict_positions=2,4; baseline_revision=valid; synthetic=true; isolation=ephemeral; reset=required`

<!-- ID: TC-034 -->
<!-- VERIFIES: AC-034 -->
### TC-034: [US-004][AC-034][Positive] hệ thống hiển thị step_key kỹ thuật duy nhất trong field chỉ đọc và không cung cấp thao tác sửa key. `[planned-automated]` `P0`

**Area**: API_LAB
**Traceability**: FR-006, US-004, AC-034
**Design states referenced**: SCREEN-004
**API / NFR refs**: API-008 GET /api/v1/hosts/{hostId}/api-lab/workflows/{workflowId}; API-009 PUT /api/v1/hosts/{hostId}/api-lab/workflows/{workflowId}
**Manual / Auto boundary**: automated contract/component/E2E assertion; visual wording/focus is also sampled manually by TC-072
**Test Level**: e2e
**Test Type**: Functional
**Export target**: functional
**Smoke**: N
**Environment**: Local Docker Compose and CI with deterministic clock/provider/IAM fakes
**Data needs**: Synthetic Host `host-active-01`, isolated MySQL schema, US-004 fixture; no production PII; mutations are scoped to this case.
**Teardown / reset**: Gọi seed/reset hook theo Host fixture sau case; xác nhận không còn execution/job/tombstone phát sinh.
**Depends on**: —
**Automation intent**: Auto=Y; implement in the Plan-owned repo delta using Fastify inject/Prisma integration, Vitest + Vue Test Utils, or Playwright according to Test Level; preserve stable Design hooks and API error contracts.
**External QA handoff needs**: N/A — no external QA in sprint v1.
**Owner of execution context**: khanh-pham runs locally and CI stores machine-readable evidence.

**Given**:
- Actor `usr_tc_034` đã đăng nhập; Host `host_tc_034`, Environment `env_tc_034` và dữ liệu phụ thuộc được seed riêng cho case.
- Tiền điều kiện AC-034: Thêm một API vào workflow.

**When**:
- Thêm API vào Workflow, lưu API-009, reload API-008 và inspect field/actions Step mới.

**Then**:
- [ ] Đúng một unique step_key được lưu và giữ nguyên sau reload.
- [ ] Field key read-only, không có edit action; label độc lập.
- [ ] Không Step/mapping cũ bị đổi.

**Test Data**:
- `fixture_id=tc_034; existing_keys=step_01,step_02; added_api=api_tc_034; expected_new_unique_key=true; synthetic=true; isolation=ephemeral; reset=required`

<!-- ID: TC-035 -->
<!-- VERIFIES: AC-035 -->
### TC-035: [US-005][AC-035][Negative] editor từ chối lưu mapping và hiển thị "Chỉ được ánh xạ dữ liệu từ bước đứng trước; mapping ngược có thể tạo vòng lặp." `[planned-automated]` `P0`

**Area**: API_LAB
**Traceability**: FR-006, US-005, AC-035
**Design states referenced**: SCREEN-004
**API / NFR refs**: API-008 GET /api/v1/hosts/{hostId}/api-lab/workflows/{workflowId}; API-009 PUT /api/v1/hosts/{hostId}/api-lab/workflows/{workflowId}
**Manual / Auto boundary**: automated contract/component/E2E assertion; visual wording/focus is also sampled manually by TC-072
**Test Level**: e2e
**Test Type**: Functional
**Export target**: functional
**Smoke**: N
**Environment**: Local Docker Compose and CI with deterministic clock/provider/IAM fakes
**Data needs**: Synthetic Host `host-active-01`, isolated MySQL schema, US-005 fixture; no production PII; mutations are scoped to this case.
**Teardown / reset**: Gọi seed/reset hook theo Host fixture sau case; xác nhận không còn execution/job/tombstone phát sinh.
**Depends on**: —
**Automation intent**: Auto=Y; implement in the Plan-owned repo delta using Fastify inject/Prisma integration, Vitest + Vue Test Utils, or Playwright according to Test Level; preserve stable Design hooks and API error contracts.
**External QA handoff needs**: N/A — no external QA in sprint v1.
**Owner of execution context**: khanh-pham runs locally and CI stores machine-readable evidence.

**Given**:
- Actor `usr_tc_035` đã đăng nhập; Host `host_tc_035`, Environment `env_tc_035` và dữ liệu phụ thuộc được seed riêng cho case.
- Tiền điều kiện AC-035: Kéo biến của Step 3 vào input Step 2.

**When**:
- Kéo biến Step 3 vào input Step 2.

**Then**:
- [ ] Editor reject trước mutation; field giữ nguyên và API-009 call count=0.
- [ ] Hiển thị đúng MSG-008 và focus trở lại source picker/target hợp lệ.

**Test Data**:
- `fixture_id=tc_035; target_step=2; source_step=3; original_input=unchanged; expected_save_calls=0; synthetic=true; isolation=ephemeral; reset=required`

<!-- ID: TC-036 -->
<!-- VERIFIES: AC-036 -->
### TC-036: [US-009][AC-036][DT+DD] dialog liệt kê đúng hai workflow và hiển thị "Các workflow này sẽ bị vô hiệu hóa nếu bạn xác nhận thay đổi method." `[planned-automated]` `P0`

**Area**: API_LAB
**Traceability**: FR-001, FR-003, FR-011, US-009, AC-036
**Design states referenced**: SCREEN-001, SCREEN-006, SCREEN-008
**API / NFR refs**: API-004 POST /api/v1/hosts/{hostId}/api-lab/resource-commands; API-005 DELETE /api/v1/hosts/{hostId}/api-lab/apis/{apiId}; API-006 POST /api/v1/hosts/{hostId}/api-lab/apis/{apiId}/undo-deletion; API-007 PUT /api/v1/hosts/{hostId}/api-lab/apis/{apiId}; API-011 POST /api/v1/hosts/{hostId}/api-lab/workflows/{workflowId}/enable; API-021 POST /api/v1/hosts/{hostId}/lifecycle-impact; API-022 PATCH /api/v1/hosts/{hostId}
**Manual / Auto boundary**: automated contract/component/E2E assertion; visual wording/focus is also sampled manually by TC-072
**Test Level**: e2e
**Test Type**: Functional
**Export target**: functional
**Smoke**: N
**Environment**: Local Docker Compose and CI with deterministic clock/provider/IAM fakes
**Data needs**: Synthetic Host `host-active-01`, isolated MySQL schema, US-009 fixture; no production PII; mutations are scoped to this case.
**Teardown / reset**: Gọi seed/reset hook theo Host fixture sau case; xác nhận không còn execution/job/tombstone phát sinh.
**Depends on**: —
**Automation intent**: Auto=Y; implement in the Plan-owned repo delta using Fastify inject/Prisma integration, Vitest + Vue Test Utils, or Playwright according to Test Level; preserve stable Design hooks and API error contracts.
**External QA handoff needs**: N/A — no external QA in sprint v1.
**Owner of execution context**: khanh-pham runs locally and CI stores machine-readable evidence.

**Given**:
- Actor `usr_tc_036` đã đăng nhập; Host `host_tc_036`, Environment `env_tc_036` và dữ liệu phụ thuộc được seed riêng cho case.
- Tiền điều kiện AC-036: Chọn đổi HTTP method của API đang được hai workflow dùng.

**When**:
- POST API-021 impact scan, then exercise DELETE API-005 or PUT API-007 under cancel/confirm variants.

**Then**:
- [ ] Cancel sends neither API-005 nor API-007; Confirm returns 200 from the chosen mutation and affects exactly the impact-token workflow set.
- [ ] Exact Product outcome: dialog liệt kê đúng hai workflow và hiển thị "Các workflow này sẽ bị vô hiệu hóa nếu bạn xác nhận thay đổi method."

**Test Data**:
- `fixture_id=tc_036; actor=usr_tc_036; host=host_tc_036; environment=env_tc_036; synthetic=true; isolation=ephemeral; reset=required`
- DT+DD: action={delete,method-change} × dependency={none,present} × confirm={cancel,confirm}.

<!-- ID: TC-037 -->
<!-- VERIFIES: AC-037 -->
### TC-037: [US-009][AC-037][ST] workflow vẫn DISABLED, nút "Chạy workflow" vẫn disabled và UI hiển thị yêu cầu review/validate trước khi bật lại. `[planned-automated]` `P0`

**Area**: API_LAB
**Traceability**: FR-001, FR-003, FR-011, US-009, AC-037
**Design states referenced**: SCREEN-001, SCREEN-006, SCREEN-008
**API / NFR refs**: API-004 POST /api/v1/hosts/{hostId}/api-lab/resource-commands; API-005 DELETE /api/v1/hosts/{hostId}/api-lab/apis/{apiId}; API-006 POST /api/v1/hosts/{hostId}/api-lab/apis/{apiId}/undo-deletion; API-007 PUT /api/v1/hosts/{hostId}/api-lab/apis/{apiId}; API-011 POST /api/v1/hosts/{hostId}/api-lab/workflows/{workflowId}/enable; API-021 POST /api/v1/hosts/{hostId}/lifecycle-impact; API-022 PATCH /api/v1/hosts/{hostId}
**Manual / Auto boundary**: automated contract/component/E2E assertion; visual wording/focus is also sampled manually by TC-072
**Test Level**: e2e
**Test Type**: Functional
**Export target**: functional
**Smoke**: N
**Environment**: Local Docker Compose and CI with deterministic clock/provider/IAM fakes
**Data needs**: Synthetic Host `host-active-01`, isolated MySQL schema, US-009 fixture; no production PII; mutations are scoped to this case.
**Teardown / reset**: Gọi seed/reset hook theo Host fixture sau case; xác nhận không còn execution/job/tombstone phát sinh.
**Depends on**: —
**Automation intent**: Auto=Y; implement in the Plan-owned repo delta using Fastify inject/Prisma integration, Vitest + Vue Test Utils, or Playwright according to Test Level; preserve stable Design hooks and API error contracts.
**External QA handoff needs**: N/A — no external QA in sprint v1.
**Owner of execution context**: khanh-pham runs locally and CI stores machine-readable evidence.

**Given**:
- Actor `usr_tc_037` đã đăng nhập; Host `host_tc_037`, Environment `env_tc_037` và dữ liệu phụ thuộc được seed riêng cho case.
- Tiền điều kiện AC-037: Kích hoạt lại Host ACTIVE sau khi Host từng làm workflow chuyển DISABLED.

**When**:
- PATCH API-022 Host ACTIVE, then GET API-008 and attempt API-013 before recovery.

**Then**:
- [ ] API-022 returns 200; API-013 returns 409 WORKFLOW_NOT_READY until the recovery checklist completes.
- [ ] Exact Product outcome: workflow vẫn DISABLED, nút "Chạy workflow" vẫn disabled và UI hiển thị yêu cầu review/validate trước khi bật lại.

**Test Data**:
- `fixture_id=tc_037; actor=usr_tc_037; host=host_tc_037; environment=env_tc_037; synthetic=true; isolation=ephemeral; reset=required`
- ST: Host INACTIVE→ACTIVE; Run stays blocked until Review→Validate→Enable completes.

<!-- ID: TC-038 -->
<!-- VERIFIES: AC-038 -->
### TC-038: [US-004][AC-038][ST] step_key và mọi expression đang dùng key đó vẫn giữ nguyên sau khi lưu và tải lại workflow. `[planned-automated]` `P0`

**Area**: API_LAB
**Traceability**: FR-006, US-004, AC-038
**Design states referenced**: SCREEN-004
**API / NFR refs**: API-008 GET /api/v1/hosts/{hostId}/api-lab/workflows/{workflowId}; API-009 PUT /api/v1/hosts/{hostId}/api-lab/workflows/{workflowId}
**Manual / Auto boundary**: automated contract/component/E2E assertion; visual wording/focus is also sampled manually by TC-072
**Test Level**: integration
**Test Type**: Functional
**Export target**: functional
**Smoke**: N
**Environment**: Local Docker Compose and CI with deterministic clock/provider/IAM fakes
**Data needs**: Synthetic Host `host-active-01`, isolated MySQL schema, US-004 fixture; no production PII; mutations are scoped to this case.
**Teardown / reset**: Gọi seed/reset hook theo Host fixture sau case; xác nhận không còn execution/job/tombstone phát sinh.
**Depends on**: —
**Automation intent**: Auto=Y; implement in the Plan-owned repo delta using Fastify inject/Prisma integration, Vitest + Vue Test Utils, or Playwright according to Test Level; preserve stable Design hooks and API error contracts.
**External QA handoff needs**: N/A — no external QA in sprint v1.
**Owner of execution context**: khanh-pham runs locally and CI stores machine-readable evidence.

**Given**:
- Actor `usr_tc_038` đã đăng nhập; Host `host_tc_038`, Environment `env_tc_038` và dữ liệu phụ thuộc được seed riêng cho case.
- Tiền điều kiện AC-038: Đổi label của step đã được các step sau tham chiếu.

**When**:
- PUT API-009 with changed label and unchanged step_key, then GET API-008.

**Then**:
- [ ] API-009 returns 200; API-008 readback shows the new label and byte-identical step_key/mapping expressions.
- [ ] Exact Product outcome: step_key và mọi expression đang dùng key đó vẫn giữ nguyên sau khi lưu và tải lại workflow.

**Test Data**:
- `fixture_id=tc_038; actor=usr_tc_038; host=host_tc_038; environment=env_tc_038; synthetic=true; isolation=ephemeral; reset=required`
- ST: step label renamed; immutable step_key and all expressions remain byte-identical.

<!-- ID: TC-039 -->
<!-- VERIFIES: AC-039 -->
### TC-039: [US-009][AC-039][ST] hai Workflow được liệt kê chuyển DISABLED và nút "Chạy workflow" của chúng bị disabled cho đến khi review, validation có 0 Lỗi, xác nhận Cảnh báo nếu có và enable lại. `[planned-automated]` `P0`

**Area**: API_LAB
**Traceability**: FR-001, FR-003, FR-011, US-009, AC-039
**Design states referenced**: SCREEN-001, SCREEN-006, SCREEN-008
**API / NFR refs**: API-004 POST /api/v1/hosts/{hostId}/api-lab/resource-commands; API-005 DELETE /api/v1/hosts/{hostId}/api-lab/apis/{apiId}; API-006 POST /api/v1/hosts/{hostId}/api-lab/apis/{apiId}/undo-deletion; API-007 PUT /api/v1/hosts/{hostId}/api-lab/apis/{apiId}; API-011 POST /api/v1/hosts/{hostId}/api-lab/workflows/{workflowId}/enable; API-021 POST /api/v1/hosts/{hostId}/lifecycle-impact; API-022 PATCH /api/v1/hosts/{hostId}
**Manual / Auto boundary**: automated contract/component/E2E assertion; visual wording/focus is also sampled manually by TC-072
**Test Level**: e2e
**Test Type**: Functional
**Export target**: functional
**Smoke**: N
**Environment**: Local Docker Compose and CI with deterministic clock/provider/IAM fakes
**Data needs**: Synthetic Host `host-active-01`, isolated MySQL schema, US-009 fixture; no production PII; mutations are scoped to this case.
**Teardown / reset**: Gọi seed/reset hook theo Host fixture sau case; xác nhận không còn execution/job/tombstone phát sinh.
**Depends on**: —
**Automation intent**: Auto=Y; implement in the Plan-owned repo delta using Fastify inject/Prisma integration, Vitest + Vue Test Utils, or Playwright according to Test Level; preserve stable Design hooks and API error contracts.
**External QA handoff needs**: N/A — no external QA in sprint v1.
**Owner of execution context**: khanh-pham runs locally and CI stores machine-readable evidence.

**Given**:
- Actor `usr_tc_039` đã đăng nhập; Host `host_tc_039`, Environment `env_tc_039` và dữ liệu phụ thuộc được seed riêng cho case.
- Tiền điều kiện AC-039: Xác nhận đổi HTTP method trong impact dialog.

**When**:
- Xác nhận đổi method qua API-007 với impact token hiện hành liệt kê đúng hai Workflow.

**Then**:
- [ ] API-007 trả 200; đúng hai Workflow phụ thuộc chuyển DISABLED; Workflow khác không đổi.
- [ ] Run bị disabled ngay, không execution mới; recovery bắt buộc Review→Validate→ack Warning nếu có→Enable.

**Test Data**:
- `fixture_id=tc_039; affected=wf_tc_039_a,wf_tc_039_b; unaffected=wf_tc_039_c; method=GET->POST; synthetic=true; isolation=ephemeral; reset=required`

<!-- ID: TC-040 -->
<!-- VERIFIES: AC-040 -->
### TC-040: [US-009][AC-040][DT+ST] Workflow chuyển READY và nút "Chạy workflow" được bật. `[planned-automated]` `P0`

**Area**: API_LAB
**Traceability**: FR-001, FR-003, FR-011, US-009, AC-040
**Design states referenced**: SCREEN-001, SCREEN-006, SCREEN-008
**API / NFR refs**: API-004 POST /api/v1/hosts/{hostId}/api-lab/resource-commands; API-005 DELETE /api/v1/hosts/{hostId}/api-lab/apis/{apiId}; API-006 POST /api/v1/hosts/{hostId}/api-lab/apis/{apiId}/undo-deletion; API-007 PUT /api/v1/hosts/{hostId}/api-lab/apis/{apiId}; API-011 POST /api/v1/hosts/{hostId}/api-lab/workflows/{workflowId}/enable; API-021 POST /api/v1/hosts/{hostId}/lifecycle-impact; API-022 PATCH /api/v1/hosts/{hostId}
**Manual / Auto boundary**: automated contract/component/E2E assertion; visual wording/focus is also sampled manually by TC-072
**Test Level**: e2e
**Test Type**: Functional
**Export target**: functional
**Smoke**: Y
**Environment**: Local Docker Compose and CI with deterministic clock/provider/IAM fakes
**Data needs**: Synthetic Host `host-active-01`, isolated MySQL schema, US-009 fixture; no production PII; mutations are scoped to this case.
**Teardown / reset**: Gọi seed/reset hook theo Host fixture sau case; xác nhận không còn execution/job/tombstone phát sinh.
**Depends on**: —
**Automation intent**: Auto=Y; implement in the Plan-owned repo delta using Fastify inject/Prisma integration, Vitest + Vue Test Utils, or Playwright according to Test Level; preserve stable Design hooks and API error contracts.
**External QA handoff needs**: N/A — no external QA in sprint v1.
**Owner of execution context**: khanh-pham runs locally and CI stores machine-readable evidence.

**Given**:
- Actor `usr_tc_040` đã đăng nhập; Host `host_tc_040`, Environment `env_tc_040` và dữ liệu phụ thuộc được seed riêng cho case.
- Tiền điều kiện AC-040: Chọn "Bật workflow" sau khi Host đã ACTIVE, người dùng đã review, validation có 0 Lỗi và không còn Cảnh báo.

**When**:
- POST API-011 khi Host ACTIVE, Review complete, current report errors=0 và warnings=0.

**Then**:
- [ ] API-011 trả 200; Workflow DISABLED→READY và Run enabled.
- [ ] Không warning dialog/Execution; đúng một transition/audit; stale binding không được chấp nhận.

**Test Data**:
- `fixture_id=tc_040; host=ACTIVE; before=DISABLED; review=complete; errors=0; warnings=0; after=READY; synthetic=true; isolation=ephemeral; reset=required`

<!-- ID: TC-041 -->
<!-- VERIFIES: AC-041 -->
### TC-041: [US-003][AC-041][ST] execution hiện tại vẫn hiển thị request resolved bằng snapshot C-001; execution mới dùng C-002. `[planned-automated]` `P0`

**Area**: API_LAB
**Traceability**: FR-004, FR-005, FR-012, US-003, AC-041
**Design states referenced**: SCREEN-003, SCREEN-005
**API / NFR refs**: API-007 PUT /api/v1/hosts/{hostId}/api-lab/apis/{apiId}; API-012 POST /api/v1/hosts/{hostId}/api-lab/api-runs; API-014 GET /api/v1/hosts/{hostId}/api-lab/executions/{executionId}
**Manual / Auto boundary**: automated contract/component/E2E assertion; visual wording/focus is also sampled manually by TC-072
**Test Level**: e2e
**Test Type**: Functional
**Export target**: functional
**Smoke**: N
**Environment**: Local Docker Compose and CI with deterministic clock/provider/IAM fakes
**Data needs**: Synthetic Host `host-active-01`, isolated MySQL schema, US-003 fixture; no production PII; mutations are scoped to this case.
**Teardown / reset**: Gọi seed/reset hook theo Host fixture sau case; xác nhận không còn execution/job/tombstone phát sinh.
**Depends on**: —
**Automation intent**: Auto=Y; implement in the Plan-owned repo delta using Fastify inject/Prisma integration, Vitest + Vue Test Utils, or Playwright according to Test Level; preserve stable Design hooks and API error contracts.
**External QA handoff needs**: N/A — no external QA in sprint v1.
**Owner of execution context**: khanh-pham runs locally and CI stores machine-readable evidence.

**Given**:
- Actor `usr_tc_041` đã đăng nhập; Host `host_tc_041`, Environment `env_tc_041` và dữ liệu phụ thuộc được seed riêng cho case.
- Tiền điều kiện AC-041: API độc lập bắt đầu khi environment có tenant_id=C-001, sau đó giá trị được sửa thành C-002 trước khi API trả kết quả.

**When**:
- POST API-012 with current environment revision, change selector during run, then GET API-014.

**Then**:
- [ ] API-012 returns 202 with pinned UAT revision; API-014 remains pinned after selector changes and only a later run uses the new Environment.
- [ ] Exact Product outcome: execution hiện tại vẫn hiển thị request resolved bằng snapshot C-001; execution mới dùng C-002.

**Test Data**:
- `fixture_id=tc_041; actor=usr_tc_041; host=host_tc_041; environment=env_tc_041; synthetic=true; isolation=ephemeral; reset=required`
- ST: run pins environment revision; selector changes during RUNNING affect only the next execution.

<!-- ID: TC-042 -->
<!-- VERIFIES: AC-042 -->
### TC-042: [US-006][AC-042][Negative] validation gắn lỗi vào Step 2, hiển thị "Chỉ được tham chiếu bước đứng trước." và giữ nút "Chạy workflow" ở trạng thái disabled. `[planned-automated]` `P0`

**Area**: API_LAB
**Traceability**: FR-007, US-006, AC-042
**Design states referenced**: SCREEN-004, SCREEN-008
**API / NFR refs**: API-010 POST /api/v1/hosts/{hostId}/api-lab/workflows/{workflowId}/versions/{versionId}/validations; API-011 POST /api/v1/hosts/{hostId}/api-lab/workflows/{workflowId}/enable; API-013 POST /api/v1/hosts/{hostId}/api-lab/workflow-runs
**Manual / Auto boundary**: automated contract/component/E2E assertion; visual wording/focus is also sampled manually by TC-072
**Test Level**: e2e
**Test Type**: Functional
**Export target**: functional
**Smoke**: N
**Environment**: Local Docker Compose and CI with deterministic clock/provider/IAM fakes
**Data needs**: Synthetic Host `host-active-01`, isolated MySQL schema, US-006 fixture; no production PII; mutations are scoped to this case.
**Teardown / reset**: Gọi seed/reset hook theo Host fixture sau case; xác nhận không còn execution/job/tombstone phát sinh.
**Depends on**: —
**Automation intent**: Auto=Y; implement in the Plan-owned repo delta using Fastify inject/Prisma integration, Vitest + Vue Test Utils, or Playwright according to Test Level; preserve stable Design hooks and API error contracts.
**External QA handoff needs**: N/A — no external QA in sprint v1.
**Owner of execution context**: khanh-pham runs locally and CI stores machine-readable evidence.

**Given**:
- Actor `usr_tc_042` đã đăng nhập; Host `host_tc_042`, Environment `env_tc_042` và dữ liệu phụ thuộc được seed riêng cho case.
- Tiền điều kiện AC-042: Chạy validation khi Step 2 đang tham chiếu biến của Step 3.

**When**:
- POST API-010 cho saved fixture Step 2 tham chiếu Step 3.

**Then**:
- [ ] Report có Error tại đúng Step 2/mapping field và exact MSG-012.
- [ ] Run giữ disabled; không bypass, API-013, execution, job hay provider call.

**Test Data**:
- `fixture_id=tc_042; target_step=2; referenced_step=3; expected_errors=1; expected_run_calls=0; synthetic=true; isolation=ephemeral; reset=required`

<!-- ID: TC-043 -->
<!-- VERIFIES: AC-043 -->
### TC-043: [US-007][AC-043][ST] mọi step còn lại của execution hiện tại tiếp tục hiển thị resolved input từ snapshot C-001; execution mới dùng C-002. `[planned-automated]` `P0`

**Area**: API_LAB
**Traceability**: FR-008, FR-010, FR-012, US-007, AC-043
**Design states referenced**: SCREEN-005, SCREEN-007
**API / NFR refs**: API-013 POST /api/v1/hosts/{hostId}/api-lab/workflow-runs; API-014 GET /api/v1/hosts/{hostId}/api-lab/executions/{executionId}; API-015 GET /api/v1/hosts/{hostId}/api-lab/executions
**Manual / Auto boundary**: automated contract/component/E2E assertion; visual wording/focus is also sampled manually by TC-072
**Test Level**: e2e
**Test Type**: Functional
**Export target**: functional
**Smoke**: N
**Environment**: Local Docker Compose and CI with deterministic clock/provider/IAM fakes
**Data needs**: Synthetic Host `host-active-01`, isolated MySQL schema, US-007 fixture; no production PII; mutations are scoped to this case.
**Teardown / reset**: Gọi seed/reset hook theo Host fixture sau case; xác nhận không còn execution/job/tombstone phát sinh.
**Depends on**: —
**Automation intent**: Auto=Y; implement in the Plan-owned repo delta using Fastify inject/Prisma integration, Vitest + Vue Test Utils, or Playwright according to Test Level; preserve stable Design hooks and API error contracts.
**External QA handoff needs**: N/A — no external QA in sprint v1.
**Owner of execution context**: khanh-pham runs locally and CI stores machine-readable evidence.

**Given**:
- Actor `usr_tc_043` đã đăng nhập; Host `host_tc_043`, Environment `env_tc_043` và dữ liệu phụ thuộc được seed riêng cho case.
- Tiền điều kiện AC-043: Workflow execution bắt đầu với tenant_id=C-001, sau đó environment được sửa thành C-002 trong lúc chạy.

**When**:
- POST API-013 on R1/E1, save R2/E2 via API-009/API-002, then GET API-014.

**Then**:
- [ ] API-013 returns 202 pinned to R1/E1; later API-009/API-002 updates do not change API-014 snapshot/version for the active Execution.
- [ ] Exact Product outcome: mọi step còn lại của execution hiện tại tiếp tục hiển thị resolved input từ snapshot C-001; execution mới dùng C-002.

**Test Data**:
- `fixture_id=tc_043; actor=usr_tc_043; host=host_tc_043; environment=env_tc_043; synthetic=true; isolation=ephemeral; reset=required`
- ST: start execution on revision R1 → save R2/environment E2 → active execution stays pinned to R1/E1.

<!-- ID: TC-044 -->
<!-- VERIFIES: AC-044 -->
### TC-044: [US-001][AC-044][BVA] editor chuyển sang compact mode, cho cuộn ngang vùng kỹ thuật khi cần và vẫn cho phép lưu/chạy bằng bàn phím. `[planned-automated]` `P0`

**Area**: API_LAB
**Traceability**: FR-001, FR-003, US-001, AC-044
**Design states referenced**: SCREEN-001, SCREEN-006
**API / NFR refs**: API-001 GET /api/v1/hosts/{hostId}/api-lab; API-003 GET /api/v1/hosts/{hostId}/api-lab/resources; API-004 POST /api/v1/hosts/{hostId}/api-lab/resource-commands; API-005 DELETE /api/v1/hosts/{hostId}/api-lab/apis/{apiId}; API-006 POST /api/v1/hosts/{hostId}/api-lab/apis/{apiId}/undo-deletion
**Manual / Auto boundary**: automated contract/component/E2E assertion; visual wording/focus is also sampled manually by TC-072
**Test Level**: e2e
**Test Type**: Functional
**Export target**: functional
**Smoke**: Y
**Environment**: Local Docker Compose and CI with deterministic clock/provider/IAM fakes
**Data needs**: Synthetic Host `host-active-01`, isolated MySQL schema, US-001 fixture; no production PII; mutations are scoped to this case.
**Teardown / reset**: Gọi seed/reset hook theo Host fixture sau case; xác nhận không còn execution/job/tombstone phát sinh.
**Depends on**: —
**Automation intent**: Auto=Y; implement in the Plan-owned repo delta using Fastify inject/Prisma integration, Vitest + Vue Test Utils, or Playwright according to Test Level; preserve stable Design hooks and API error contracts.
**External QA handoff needs**: N/A — no external QA in sprint v1.
**Owner of execution context**: khanh-pham runs locally and CI stores machine-readable evidence.

**Given**:
- Actor `usr_tc_044` đã đăng nhập; Host `host_tc_044`, Environment `env_tc_044` và dữ liệu phụ thuộc được seed riêng cho case.
- Tiền điều kiện AC-044: Mở API Lab trên desktop có screen width >= 1280px rồi zoom trình duyệt tới 200%.

**When**:
- Open SCREEN-001 at physical widths 1279/1280/1281 and zoom 100/200%.

**Then**:
- [ ] At 1279px the unsupported state exposes no editor/Run action; at 1280/1281 and 100/200% zoom the supported actions remain keyboard reachable; API mutation count is 0.
- [ ] Exact Product outcome: editor chuyển sang compact mode, cho cuộn ngang vùng kỹ thuật khi cần và vẫn cho phép lưu/chạy bằng bàn phím.

**Test Data**:
- `fixture_id=tc_044; actor=usr_tc_044; host=host_tc_044; environment=env_tc_044; synthetic=true; isolation=ephemeral; reset=required`
- BVA: physical width=1279,1280,1281px × zoom=100%,200%; supported states follow viewport contract.

<!-- ID: TC-045 -->
<!-- VERIFIES: AC-045 -->
### TC-045: [US-001][AC-045][BVA] editor không mở, trang hiển thị "API Lab Workflow cần màn hình desktop rộng tối thiểu 1280px." và vẫn cho quay lại Host. `[planned-automated]` `P0`

**Area**: API_LAB
**Traceability**: FR-001, FR-003, US-001, AC-045
**Design states referenced**: SCREEN-001, SCREEN-006
**API / NFR refs**: API-001 GET /api/v1/hosts/{hostId}/api-lab; API-003 GET /api/v1/hosts/{hostId}/api-lab/resources; API-004 POST /api/v1/hosts/{hostId}/api-lab/resource-commands; API-005 DELETE /api/v1/hosts/{hostId}/api-lab/apis/{apiId}; API-006 POST /api/v1/hosts/{hostId}/api-lab/apis/{apiId}/undo-deletion
**Manual / Auto boundary**: automated contract/component/E2E assertion; visual wording/focus is also sampled manually by TC-072
**Test Level**: e2e
**Test Type**: Functional
**Export target**: functional
**Smoke**: Y
**Environment**: Local Docker Compose and CI with deterministic clock/provider/IAM fakes
**Data needs**: Synthetic Host `host-active-01`, isolated MySQL schema, US-001 fixture; no production PII; mutations are scoped to this case.
**Teardown / reset**: N/A — case chỉ đọc hoặc validation không commit.
**Depends on**: —
**Automation intent**: Auto=Y; implement in the Plan-owned repo delta using Fastify inject/Prisma integration, Vitest + Vue Test Utils, or Playwright according to Test Level; preserve stable Design hooks and API error contracts.
**External QA handoff needs**: N/A — no external QA in sprint v1.
**Owner of execution context**: khanh-pham runs locally and CI stores machine-readable evidence.

**Given**:
- Actor `usr_tc_045` đã đăng nhập; Host `host_tc_045`, Environment `env_tc_045` và dữ liệu phụ thuộc được seed riêng cho case.
- Tiền điều kiện AC-045: Mở API Lab trên thiết bị có screen width < 1280px.

**When**:
- Open SCREEN-001 at physical widths 1279/1280/1440 and inspect MSG-022/editor controls.

**Then**:
- [ ] 1279px renders MSG-022 and no edit CTA; 1280/1440 render the editor with no horizontal loss of focused controls; API mutation count is 0.
- [ ] Exact Product outcome: editor không mở, trang hiển thị "API Lab Workflow cần màn hình desktop rộng tối thiểu 1280px." và vẫn cho quay lại Host.

**Test Data**:
- `fixture_id=tc_045; actor=usr_tc_045; host=host_tc_045; environment=env_tc_045; synthetic=true; isolation=ephemeral; reset=required`
- BVA: physical width=1279,1280,1440px; 1279 shows unsupported state, ≥1280 keeps editor controls reachable.

<!-- ID: TC-046 -->
<!-- VERIFIES: AC-046 -->
### TC-046: [US-009][AC-046][BVA+ST] API biến mất, Workflow phụ thuộc chuyển DISABLED, và toast "Đã xóa API {api_name}. Các workflow phụ thuộc đã bị vô hiệu hóa." hiển thị nút "Hoàn tác" trong 10 giây. `[planned-automated]` `P0`

**Area**: API_LAB
**Traceability**: FR-001, FR-003, FR-011, US-009, AC-046
**Design states referenced**: SCREEN-001, SCREEN-006, SCREEN-008
**API / NFR refs**: API-004 POST /api/v1/hosts/{hostId}/api-lab/resource-commands; API-005 DELETE /api/v1/hosts/{hostId}/api-lab/apis/{apiId}; API-006 POST /api/v1/hosts/{hostId}/api-lab/apis/{apiId}/undo-deletion; API-007 PUT /api/v1/hosts/{hostId}/api-lab/apis/{apiId}; API-011 POST /api/v1/hosts/{hostId}/api-lab/workflows/{workflowId}/enable; API-021 POST /api/v1/hosts/{hostId}/lifecycle-impact; API-022 PATCH /api/v1/hosts/{hostId}
**Manual / Auto boundary**: automated contract/component/E2E assertion; visual wording/focus is also sampled manually by TC-072
**Test Level**: e2e
**Test Type**: Functional
**Export target**: functional
**Smoke**: N
**Environment**: Local Docker Compose and CI with deterministic clock/provider/IAM fakes
**Data needs**: Synthetic Host `host-active-01`, isolated MySQL schema, US-009 fixture; no production PII; mutations are scoped to this case.
**Teardown / reset**: Gọi seed/reset hook theo Host fixture sau case; xác nhận không còn execution/job/tombstone phát sinh.
**Depends on**: —
**Automation intent**: Auto=Y; implement in the Plan-owned repo delta using Fastify inject/Prisma integration, Vitest + Vue Test Utils, or Playwright according to Test Level; preserve stable Design hooks and API error contracts.
**External QA handoff needs**: N/A — no external QA in sprint v1.
**Owner of execution context**: khanh-pham runs locally and CI stores machine-readable evidence.

**Given**:
- Actor `usr_tc_046` đã đăng nhập; Host `host_tc_046`, Environment `env_tc_046` và dữ liệu phụ thuộc được seed riêng cho case.
- Tiền điều kiện AC-046: Xác nhận xóa API đang được Workflow sử dụng.

**When**:
- DELETE API-005, render MSG-025, advance server clock through 0/9.999/10.000s.

**Then**:
- [ ] API-005 returns 200 with server undoDeadline; MSG-025 appears immediately, remains actionable at 9.999s and is unavailable when the server deadline is elapsed.
- [ ] Exact Product outcome: API biến mất, Workflow phụ thuộc chuyển DISABLED, và toast "Đã xóa API {api_name}. Các workflow phụ thuộc đã bị vô hiệu hóa." hiển thị nút "Hoàn tác" trong 10 giây.

**Test Data**:
- `fixture_id=tc_046; actor=usr_tc_046; host=host_tc_046; environment=env_tc_046; synthetic=true; isolation=ephemeral; reset=required`
- BVA+ST: after delete elapsed=0s,9.999s,10.000s; toast countdown and action availability follow server deadline.

<!-- ID: TC-047 -->
<!-- VERIFIES: AC-047 -->
### TC-047: [US-009][AC-047][BVA+ST] cùng API được khôi phục với định danh, cấu hình và vị trí cây trước khi xóa; Workflow phụ thuộc vẫn DISABLED cho tới khi Rà soát → Kiểm tra → Bật workflow. `[planned-automated]` `P0`

**Area**: API_LAB
**Traceability**: FR-001, FR-003, FR-011, US-009, AC-047
**Design states referenced**: SCREEN-001, SCREEN-006, SCREEN-008
**API / NFR refs**: API-004 POST /api/v1/hosts/{hostId}/api-lab/resource-commands; API-005 DELETE /api/v1/hosts/{hostId}/api-lab/apis/{apiId}; API-006 POST /api/v1/hosts/{hostId}/api-lab/apis/{apiId}/undo-deletion; API-007 PUT /api/v1/hosts/{hostId}/api-lab/apis/{apiId}; API-011 POST /api/v1/hosts/{hostId}/api-lab/workflows/{workflowId}/enable; API-021 POST /api/v1/hosts/{hostId}/lifecycle-impact; API-022 PATCH /api/v1/hosts/{hostId}
**Manual / Auto boundary**: automated contract/component/E2E assertion; visual wording/focus is also sampled manually by TC-072
**Test Level**: integration
**Test Type**: Functional
**Export target**: functional
**Smoke**: Y
**Environment**: Local Docker Compose and CI with deterministic clock/provider/IAM fakes
**Data needs**: Synthetic Host `host-active-01`, isolated MySQL schema, US-009 fixture; no production PII; mutations are scoped to this case.
**Teardown / reset**: Gọi seed/reset hook theo Host fixture sau case; xác nhận không còn execution/job/tombstone phát sinh.
**Depends on**: —
**Automation intent**: Auto=Y; implement in the Plan-owned repo delta using Fastify inject/Prisma integration, Vitest + Vue Test Utils, or Playwright according to Test Level; preserve stable Design hooks and API error contracts.
**External QA handoff needs**: N/A — no external QA in sprint v1.
**Owner of execution context**: khanh-pham runs locally and CI stores machine-readable evidence.

**Given**:
- Actor `usr_tc_047` đã đăng nhập; Host `host_tc_047`, Environment `env_tc_047` và dữ liệu phụ thuộc được seed riêng cho case.
- Tiền điều kiện AC-047: Chọn "Hoàn tác" trong 10 giây.

**When**:
- DELETE API-005, capture apiId/config/treeLocation/deletionRevision, then POST API-006 /undo-deletion at each boundary.

**Then**:
- [ ] API-005 returns 200; API-006 returns 200 at 9.999s restoring identical apiId/config/version/treeLocation and recoveryRequired=true; at elapsed deadline it returns 409 API_UNDO_WINDOW_EXPIRED.
- [ ] Exact Product outcome: cùng API được khôi phục với định danh, cấu hình và vị trí cây trước khi xóa; Workflow phụ thuộc vẫn DISABLED cho tới khi Rà soát → Kiểm tra → Bật workflow.

**Test Data**:
- `fixture_id=tc_047; actor=usr_tc_047; host=host_tc_047; environment=env_tc_047; synthetic=true; isolation=ephemeral; reset=required`
- BVA+ST: API-006 at elapsed=9.999s succeeds; 10.000s and 10.001s return API_UNDO_WINDOW_EXPIRED.

<!-- ID: TC-048 -->
<!-- VERIFIES: AC-048 -->
### TC-048: [US-009][AC-048][BVA+ST] API không được khôi phục và UI hiển thị "Không thể hoàn tác xóa API. API vẫn bị xóa." `[planned-automated]` `P0`

**Area**: API_LAB
**Traceability**: FR-001, FR-003, FR-011, US-009, AC-048
**Design states referenced**: SCREEN-001, SCREEN-006, SCREEN-008
**API / NFR refs**: API-004 POST /api/v1/hosts/{hostId}/api-lab/resource-commands; API-005 DELETE /api/v1/hosts/{hostId}/api-lab/apis/{apiId}; API-006 POST /api/v1/hosts/{hostId}/api-lab/apis/{apiId}/undo-deletion; API-007 PUT /api/v1/hosts/{hostId}/api-lab/apis/{apiId}; API-011 POST /api/v1/hosts/{hostId}/api-lab/workflows/{workflowId}/enable; API-021 POST /api/v1/hosts/{hostId}/lifecycle-impact; API-022 PATCH /api/v1/hosts/{hostId}
**Manual / Auto boundary**: automated contract/component/E2E assertion; visual wording/focus is also sampled manually by TC-072
**Test Level**: e2e
**Test Type**: Functional
**Export target**: functional
**Smoke**: N
**Environment**: Local Docker Compose and CI with deterministic clock/provider/IAM fakes
**Data needs**: Synthetic Host `host-active-01`, isolated MySQL schema, US-009 fixture; no production PII; mutations are scoped to this case.
**Teardown / reset**: Gọi seed/reset hook theo Host fixture sau case; xác nhận không còn execution/job/tombstone phát sinh.
**Depends on**: —
**Automation intent**: Auto=Y; implement in the Plan-owned repo delta using Fastify inject/Prisma integration, Vitest + Vue Test Utils, or Playwright according to Test Level; preserve stable Design hooks and API error contracts.
**External QA handoff needs**: N/A — no external QA in sprint v1.
**Owner of execution context**: khanh-pham runs locally and CI stores machine-readable evidence.

**Given**:
- Actor `usr_tc_048` đã đăng nhập; Host `host_tc_048`, Environment `env_tc_048` và dữ liệu phụ thuộc được seed riêng cho case.
- Tiền điều kiện AC-048: Hệ thống nhận một yêu cầu "Hoàn tác" khi cửa sổ 10 giây đã hết.

**When**:
- DELETE API-005 để nhận server `undoDeadline=deletedAt+10s`; với tombstone độc lập cho mỗi vector, POST API-006 tại elapsed `9.999s`, `10.000s` và `10.001s` bằng controllable server clock.

**Then**:
- [ ] Tại `9.999s` (`now < undoDeadline`), API-006 trả 200, khôi phục cùng API identity/config/tree location và Workflow vẫn DISABLED.
- [ ] Tại `10.000s` và `10.001s` (`now >= undoDeadline`), API-006 trả `409 API_UNDO_WINDOW_EXPIRED`; API không khôi phục, giữ hidden/deleted và Workflow vẫn DISABLED.
- [ ] Hai expired vectors hiển thị đúng “Không thể hoàn tác xóa API. API vẫn bị xóa.”; không có partial restore/provider call.
- [ ] Collision/transaction failure không thuộc case này và tiếp tục được cover riêng bởi AC-052/TC-052.

**Test Data**:
- `fixture_id=tc_048; undo_deadline=deleted_at+10s; elapsed_vectors=9.999s,10.000s,10.001s; expected=200,409,409; synthetic=true; isolation=one_tombstone_per_vector; reset=required`
- `BVA: below=9.999s; at=10.000s; above=10.001s; ST: DELETED_UNDOABLE->ACTIVE only below deadline, otherwise DELETED_UNDOABLE->DELETED`

<!-- ID: TC-049 -->
<!-- VERIFIES: AC-049 -->
### TC-049: [US-006][AC-049][DT] Validation Report hiển thị một Cảnh báo tại đúng source Step/field và Workflow đủ điều kiện READY. `[planned-automated]` `P0`

**Area**: API_LAB
**Traceability**: FR-007, US-006, AC-049
**Design states referenced**: SCREEN-004, SCREEN-008
**API / NFR refs**: API-010 POST /api/v1/hosts/{hostId}/api-lab/workflows/{workflowId}/versions/{versionId}/validations; API-011 POST /api/v1/hosts/{hostId}/api-lab/workflows/{workflowId}/enable; API-013 POST /api/v1/hosts/{hostId}/api-lab/workflow-runs
**Manual / Auto boundary**: automated contract/component/E2E assertion; visual wording/focus is also sampled manually by TC-072
**Test Level**: e2e
**Test Type**: Functional
**Export target**: functional
**Smoke**: N
**Environment**: Local Docker Compose and CI with deterministic clock/provider/IAM fakes
**Data needs**: Synthetic Host `host-active-01`, isolated MySQL schema, US-006 fixture; no production PII; mutations are scoped to this case.
**Teardown / reset**: N/A — case chỉ đọc hoặc validation không commit.
**Depends on**: —
**Automation intent**: Auto=Y; implement in the Plan-owned repo delta using Fastify inject/Prisma integration, Vitest + Vue Test Utils, or Playwright according to Test Level; preserve stable Design hooks and API error contracts.
**External QA handoff needs**: N/A — no external QA in sprint v1.
**Owner of execution context**: khanh-pham runs locally and CI stores machine-readable evidence.

**Given**:
- Actor `usr_tc_049` đã đăng nhập; Host `host_tc_049`, Environment `env_tc_049` và dữ liệu phụ thuộc được seed riêng cho case.
- Tiền điều kiện AC-049: Source mapping chưa có response mẫu nhưng workflow không có Lỗi.

**When**:
- POST API-010 cho Workflow không Error nhưng mapping source chưa có response sample.

**Then**:
- [ ] Report có đúng một Warning tại source Step/field và errors=0.
- [ ] Workflow vẫn READY-eligible; Run chỉ cần MSG-029 confirmation.
- [ ] Finding link focus đúng source Step/field.

**Test Data**:
- `fixture_id=tc_049; response_sample=absent; source=step_01.data.customer.id; errors=0; warnings=1; synthetic=true; isolation=ephemeral; reset=required`

<!-- ID: TC-050 -->
<!-- VERIFIES: AC-050 -->
### TC-050: [US-006][AC-050][EP+DT+DD] mỗi finding được gắn đúng Step/field/namespace, Run/Enable giữ disabled và người dùng không thể xác nhận để bỏ qua. `[planned-automated]` `P0`

**Area**: API_LAB
**Traceability**: FR-007, US-006, AC-050
**Design states referenced**: SCREEN-004, SCREEN-008
**API / NFR refs**: API-010 POST /api/v1/hosts/{hostId}/api-lab/workflows/{workflowId}/versions/{versionId}/validations; API-011 POST /api/v1/hosts/{hostId}/api-lab/workflows/{workflowId}/enable; API-013 POST /api/v1/hosts/{hostId}/api-lab/workflow-runs
**Manual / Auto boundary**: automated contract/component/E2E assertion; visual wording/focus is also sampled manually by TC-072
**Test Level**: integration
**Test Type**: Functional
**Export target**: functional
**Smoke**: N
**Environment**: Local Docker Compose and CI with deterministic clock/provider/IAM fakes
**Data needs**: Synthetic Host `host-active-01`, isolated MySQL schema, US-006 fixture; no production PII; mutations are scoped to this case.
**Teardown / reset**: Gọi seed/reset hook theo Host fixture sau case; xác nhận không còn execution/job/tombstone phát sinh.
**Depends on**: —
**Automation intent**: Auto=Y; implement in the Plan-owned repo delta using Fastify inject/Prisma integration, Vitest + Vue Test Utils, or Playwright according to Test Level; preserve stable Design hooks and API error contracts.
**External QA handoff needs**: N/A — no external QA in sprint v1.
**Owner of execution context**: khanh-pham runs locally and CI stores machine-readable evidence.

**Given**:
- Actor `usr_tc_050` đã đăng nhập; Host `host_tc_050`, Environment `env_tc_050` và dữ liệu phụ thuộc được seed riêng cho case.
- Tiền điều kiện AC-050: Workflow khớp một hàng Lỗi trong Validation Severity Decision Table của FR-007.

**When**:
- POST API-010 for every Error row, then attempt API-011 and API-013 with/without acknowledgement.

**Then**:
- [ ] API-010 returns 201 with the exact Error finding; API-011/API-013 cannot bypass it and return VALIDATION_ERRORS_EXIST or WORKFLOW_NOT_READY with zero admission/enable mutation.
- [ ] Exact Product outcome: mỗi finding được gắn đúng Step/field/namespace, Run/Enable giữ disabled và người dùng không thể xác nhận để bỏ qua.

**Test Data**:
- `fixture_id=tc_050; actor=usr_tc_050; host=host_tc_050; environment=env_tc_050; synthetic=true; isolation=ephemeral; reset=required`
- EP+DT+DD: every named Error class is exercised once; Run/Enable disabled and bypass acknowledgement rejected.

<!-- ID: TC-051 -->
<!-- VERIFIES: AC-051 -->
### TC-051: [US-006][AC-051][DT] dialog hiển thị "Workflow còn {warnings} cảnh báo. Bạn có muốn tiếp tục?". `[planned-automated]` `P0`

**Area**: API_LAB
**Traceability**: FR-007, US-006, AC-051
**Design states referenced**: SCREEN-004, SCREEN-008
**API / NFR refs**: API-010 POST /api/v1/hosts/{hostId}/api-lab/workflows/{workflowId}/versions/{versionId}/validations; API-011 POST /api/v1/hosts/{hostId}/api-lab/workflows/{workflowId}/enable; API-013 POST /api/v1/hosts/{hostId}/api-lab/workflow-runs
**Manual / Auto boundary**: automated contract/component/E2E assertion; visual wording/focus is also sampled manually by TC-072
**Test Level**: e2e
**Test Type**: Functional
**Export target**: functional
**Smoke**: N
**Environment**: Local Docker Compose and CI with deterministic clock/provider/IAM fakes
**Data needs**: Synthetic Host `host-active-01`, isolated MySQL schema, US-006 fixture; no production PII; mutations are scoped to this case.
**Teardown / reset**: Gọi seed/reset hook theo Host fixture sau case; xác nhận không còn execution/job/tombstone phát sinh.
**Depends on**: —
**Automation intent**: Auto=Y; implement in the Plan-owned repo delta using Fastify inject/Prisma integration, Vitest + Vue Test Utils, or Playwright according to Test Level; preserve stable Design hooks and API error contracts.
**External QA handoff needs**: N/A — no external QA in sprint v1.
**Owner of execution context**: khanh-pham runs locally and CI stores machine-readable evidence.

**Given**:
- Actor `usr_tc_051` đã đăng nhập; Host `host_tc_051`, Environment `env_tc_051` và dữ liệu phụ thuộc được seed riêng cho case.
- Tiền điều kiện AC-051: Workflow READY có 0 Lỗi và ít nhất 1 Cảnh báo rồi người dùng chọn Run.

**When**:
- Người dùng chọn Chạy workflow khi READY report có errors=0 và warnings={1,3}.

**Then**:
- [ ] Mở đúng MSG-029 với warning count thực tế.
- [ ] Chưa gọi API-013 hay tạo Execution/job/provider call trước lựa chọn.
- [ ] Có Tiếp tục và Quay lại báo cáo; dialog giữ current report/revision binding.

**Test Data**:
- `fixture_id=tc_051; warning_counts=1,3; errors=0; workflow=READY; execution_before_choice=0; synthetic=true; isolation=ephemeral; reset=required`

<!-- ID: TC-052 -->
<!-- VERIFIES: AC-052 -->
### TC-052: [US-009][AC-052][ST] API vẫn bị xóa và UI hiển thị "Không thể hoàn tác xóa API. API vẫn bị xóa." `[planned-automated]` `P0`

**Area**: API_LAB
**Traceability**: FR-001, FR-003, FR-011, US-009, AC-052
**Design states referenced**: SCREEN-001, SCREEN-006, SCREEN-008
**API / NFR refs**: API-004 POST /api/v1/hosts/{hostId}/api-lab/resource-commands; API-005 DELETE /api/v1/hosts/{hostId}/api-lab/apis/{apiId}; API-006 POST /api/v1/hosts/{hostId}/api-lab/apis/{apiId}/undo-deletion; API-007 PUT /api/v1/hosts/{hostId}/api-lab/apis/{apiId}; API-011 POST /api/v1/hosts/{hostId}/api-lab/workflows/{workflowId}/enable; API-021 POST /api/v1/hosts/{hostId}/lifecycle-impact; API-022 PATCH /api/v1/hosts/{hostId}
**Manual / Auto boundary**: automated contract/component/E2E assertion; visual wording/focus is also sampled manually by TC-072
**Test Level**: e2e
**Test Type**: Functional
**Export target**: functional
**Smoke**: N
**Environment**: Local Docker Compose and CI with deterministic clock/provider/IAM fakes
**Data needs**: Synthetic Host `host-active-01`, isolated MySQL schema, US-009 fixture; no production PII; mutations are scoped to this case.
**Teardown / reset**: Gọi seed/reset hook theo Host fixture sau case; xác nhận không còn execution/job/tombstone phát sinh.
**Depends on**: —
**Automation intent**: Auto=Y; implement in the Plan-owned repo delta using Fastify inject/Prisma integration, Vitest + Vue Test Utils, or Playwright according to Test Level; preserve stable Design hooks and API error contracts.
**External QA handoff needs**: N/A — no external QA in sprint v1.
**Owner of execution context**: khanh-pham runs locally and CI stores machine-readable evidence.

**Given**:
- Actor `usr_tc_052` đã đăng nhập; Host `host_tc_052`, Environment `env_tc_052` và dữ liệu phụ thuộc được seed riêng cho case.
- Tiền điều kiện AC-052: Người dùng chọn "Hoàn tác" trong 10 giây nhưng restore thất bại.

**When**:
- Chọn Hoàn tác ở giây 9; POST API-006 trong khi restore transaction fake thất bại.

**Then**:
- [ ] API-006 trả API_UNDO_FAILED; API vẫn deleted/hidden và Workflow phụ thuộc vẫn DISABLED.
- [ ] UI hiển thị exact failure copy; không partial restore; audit ghi nguyên nhân.

**Test Data**:
- `fixture_id=tc_052; undo_elapsed=9s; restore=fails; api_state=deleted; workflow_state=DISABLED; synthetic=true; isolation=ephemeral; reset=required`

<!-- ID: TC-053 -->
<!-- VERIFIES: AC-053 -->
### TC-053: [US-006][AC-053][DT] Validation Report hiển thị một Cảnh báo tại đúng API/Step và Workflow đủ điều kiện READY. `[planned-automated]` `P0`

**Area**: API_LAB
**Traceability**: FR-007, US-006, AC-053
**Design states referenced**: SCREEN-004, SCREEN-008
**API / NFR refs**: API-010 POST /api/v1/hosts/{hostId}/api-lab/workflows/{workflowId}/versions/{versionId}/validations; API-011 POST /api/v1/hosts/{hostId}/api-lab/workflows/{workflowId}/enable; API-013 POST /api/v1/hosts/{hostId}/api-lab/workflow-runs
**Manual / Auto boundary**: automated contract/component/E2E assertion; visual wording/focus is also sampled manually by TC-072
**Test Level**: e2e
**Test Type**: Functional
**Export target**: functional
**Smoke**: N
**Environment**: Local Docker Compose and CI with deterministic clock/provider/IAM fakes
**Data needs**: Synthetic Host `host-active-01`, isolated MySQL schema, US-006 fixture; no production PII; mutations are scoped to this case.
**Teardown / reset**: N/A — case chỉ đọc hoặc validation không commit.
**Depends on**: —
**Automation intent**: Auto=Y; implement in the Plan-owned repo delta using Fastify inject/Prisma integration, Vitest + Vue Test Utils, or Playwright according to Test Level; preserve stable Design hooks and API error contracts.
**External QA handoff needs**: N/A — no external QA in sprint v1.
**Owner of execution context**: khanh-pham runs locally and CI stores machine-readable evidence.

**Given**:
- Actor `usr_tc_053` đã đăng nhập; Host `host_tc_053`, Environment `env_tc_053` và dữ liệu phụ thuộc được seed riêng cho case.
- Tiền điều kiện AC-053: API của một Step đang kế thừa Host timeout nhưng workflow không có Lỗi.

**When**:
- POST API-010 khi Step API có api_timeout=null và kế thừa Host timeout 30s; mọi rule khác hợp lệ.

**Then**:
- [ ] Report có Warning đúng API/Step, errors=0.
- [ ] Workflow READY-eligible; Warning không thành Error và finding focus đúng timeout/API reference.

**Test Data**:
- `fixture_id=tc_053; host_timeout=30s; api_timeout=null; errors=0; warnings=1; synthetic=true; isolation=ephemeral; reset=required`

<!-- ID: TC-054 -->
<!-- VERIFIES: AC-054 -->
### TC-054: [US-006][AC-054][DT] Validation Report hiển thị một Cảnh báo tại đúng API và Workflow đủ điều kiện READY. `[planned-automated]` `P0`

**Area**: API_LAB
**Traceability**: FR-007, US-006, AC-054
**Design states referenced**: SCREEN-004, SCREEN-008
**API / NFR refs**: API-010 POST /api/v1/hosts/{hostId}/api-lab/workflows/{workflowId}/versions/{versionId}/validations; API-011 POST /api/v1/hosts/{hostId}/api-lab/workflows/{workflowId}/enable; API-013 POST /api/v1/hosts/{hostId}/api-lab/workflow-runs
**Manual / Auto boundary**: automated contract/component/E2E assertion; visual wording/focus is also sampled manually by TC-072
**Test Level**: e2e
**Test Type**: Functional
**Export target**: functional
**Smoke**: N
**Environment**: Local Docker Compose and CI with deterministic clock/provider/IAM fakes
**Data needs**: Synthetic Host `host-active-01`, isolated MySQL schema, US-006 fixture; no production PII; mutations are scoped to this case.
**Teardown / reset**: N/A — case chỉ đọc hoặc validation không commit.
**Depends on**: —
**Automation intent**: Auto=Y; implement in the Plan-owned repo delta using Fastify inject/Prisma integration, Vitest + Vue Test Utils, or Playwright according to Test Level; preserve stable Design hooks and API error contracts.
**External QA handoff needs**: N/A — no external QA in sprint v1.
**Owner of execution context**: khanh-pham runs locally and CI stores machine-readable evidence.

**Given**:
- Actor `usr_tc_054` đã đăng nhập; Host `host_tc_054`, Environment `env_tc_054` và dữ liệu phụ thuộc được seed riêng cho case.
- Tiền điều kiện AC-054: API có sensitive_fields rỗng nhưng workflow không có Lỗi.

**When**:
- POST API-010 khi API có sensitive_fields=[]; mọi rule khác hợp lệ.

**Then**:
- [ ] Report có Warning đúng API, errors=0.
- [ ] Workflow READY-eligible; finding mở đúng sensitive-fields configuration.

**Test Data**:
- `fixture_id=tc_054; sensitive_fields=[]; errors=0; warnings=1; synthetic=true; isolation=ephemeral; reset=required`

<!-- ID: TC-055 -->
<!-- VERIFIES: AC-055 -->
### TC-055: [US-006][AC-055][DT] hệ thống tạo Execution mới bằng saved revision đã validation và Environment hiện hành. `[planned-automated]` `P0`

**Area**: API_LAB
**Traceability**: FR-007, US-006, AC-055
**Design states referenced**: SCREEN-004, SCREEN-008
**API / NFR refs**: API-010 POST /api/v1/hosts/{hostId}/api-lab/workflows/{workflowId}/versions/{versionId}/validations; API-011 POST /api/v1/hosts/{hostId}/api-lab/workflows/{workflowId}/enable; API-013 POST /api/v1/hosts/{hostId}/api-lab/workflow-runs
**Manual / Auto boundary**: automated contract/component/E2E assertion; visual wording/focus is also sampled manually by TC-072
**Test Level**: e2e
**Test Type**: Functional
**Export target**: functional
**Smoke**: Y
**Environment**: Local Docker Compose and CI with deterministic clock/provider/IAM fakes
**Data needs**: Synthetic Host `host-active-01`, isolated MySQL schema, US-006 fixture; no production PII; mutations are scoped to this case.
**Teardown / reset**: Gọi seed/reset hook theo Host fixture sau case; xác nhận không còn execution/job/tombstone phát sinh.
**Depends on**: —
**Automation intent**: Auto=Y; implement in the Plan-owned repo delta using Fastify inject/Prisma integration, Vitest + Vue Test Utils, or Playwright according to Test Level; preserve stable Design hooks and API error contracts.
**External QA handoff needs**: N/A — no external QA in sprint v1.
**Owner of execution context**: khanh-pham runs locally and CI stores machine-readable evidence.

**Given**:
- Actor `usr_tc_055` đã đăng nhập; Host `host_tc_055`, Environment `env_tc_055` và dữ liệu phụ thuộc được seed riêng cho case.
- Tiền điều kiện AC-055: Dialog Cảnh báo được mở từ Run rồi người dùng chọn "Tiếp tục".

**When**:
- Từ Run warning dialog, chọn Tiếp tục; POST API-013 với acknowledgement gắn current report, saved revision wf_rev_tc_055 và Environment env_rev_tc_055.

**Then**:
- [ ] API-013 trả 202 và tạo đúng một Execution snapshot đúng revision/environment.
- [ ] Dialog đóng; không dùng unsaved/stale context và không duplicate execution.

**Test Data**:
- `fixture_id=tc_055; workflow_revision=wf_rev_tc_055; environment_revision=env_rev_tc_055; errors=0; warnings=1; expected_executions=1; synthetic=true; isolation=ephemeral; reset=required`

<!-- ID: TC-056 -->
<!-- VERIFIES: AC-056 -->
### TC-056: [US-006][AC-056][DT] dialog đóng và không tạo Execution. `[planned-automated]` `P0`

**Area**: API_LAB
**Traceability**: FR-007, US-006, AC-056
**Design states referenced**: SCREEN-004, SCREEN-008
**API / NFR refs**: API-010 POST /api/v1/hosts/{hostId}/api-lab/workflows/{workflowId}/versions/{versionId}/validations; API-011 POST /api/v1/hosts/{hostId}/api-lab/workflows/{workflowId}/enable; API-013 POST /api/v1/hosts/{hostId}/api-lab/workflow-runs
**Manual / Auto boundary**: automated contract/component/E2E assertion; visual wording/focus is also sampled manually by TC-072
**Test Level**: e2e
**Test Type**: Functional
**Export target**: functional
**Smoke**: N
**Environment**: Local Docker Compose and CI with deterministic clock/provider/IAM fakes
**Data needs**: Synthetic Host `host-active-01`, isolated MySQL schema, US-006 fixture; no production PII; mutations are scoped to this case.
**Teardown / reset**: Gọi seed/reset hook theo Host fixture sau case; xác nhận không còn execution/job/tombstone phát sinh.
**Depends on**: —
**Automation intent**: Auto=Y; implement in the Plan-owned repo delta using Fastify inject/Prisma integration, Vitest + Vue Test Utils, or Playwright according to Test Level; preserve stable Design hooks and API error contracts.
**External QA handoff needs**: N/A — no external QA in sprint v1.
**Owner of execution context**: khanh-pham runs locally and CI stores machine-readable evidence.

**Given**:
- Actor `usr_tc_056` đã đăng nhập; Host `host_tc_056`, Environment `env_tc_056` và dữ liệu phụ thuộc được seed riêng cho case.
- Tiền điều kiện AC-056: Dialog Cảnh báo được mở từ Run rồi người dùng chọn "Quay lại báo cáo".

**When**:
- Từ Run warning dialog, chọn Quay lại báo cáo.

**Then**:
- [ ] Dialog đóng, focus về report; không gọi API-013.
- [ ] Execution/job/provider counts không đổi; Workflow giữ READY.

**Test Data**:
- `fixture_id=tc_056; workflow=READY; errors=0; warnings=1; baseline_executions=0; execution_delta=0; synthetic=true; isolation=ephemeral; reset=required`

<!-- ID: TC-057 -->
<!-- VERIFIES: AC-057 -->
### TC-057: [US-009][AC-057][DT] dialog hiển thị "Workflow còn {warnings} cảnh báo. Bạn có muốn tiếp tục?". `[planned-automated]` `P0`

**Area**: API_LAB
**Traceability**: FR-001, FR-003, FR-011, US-009, AC-057
**Design states referenced**: SCREEN-001, SCREEN-006, SCREEN-008
**API / NFR refs**: API-004 POST /api/v1/hosts/{hostId}/api-lab/resource-commands; API-005 DELETE /api/v1/hosts/{hostId}/api-lab/apis/{apiId}; API-006 POST /api/v1/hosts/{hostId}/api-lab/apis/{apiId}/undo-deletion; API-007 PUT /api/v1/hosts/{hostId}/api-lab/apis/{apiId}; API-011 POST /api/v1/hosts/{hostId}/api-lab/workflows/{workflowId}/enable; API-021 POST /api/v1/hosts/{hostId}/lifecycle-impact; API-022 PATCH /api/v1/hosts/{hostId}
**Manual / Auto boundary**: automated contract/component/E2E assertion; visual wording/focus is also sampled manually by TC-072
**Test Level**: e2e
**Test Type**: Functional
**Export target**: functional
**Smoke**: N
**Environment**: Local Docker Compose and CI with deterministic clock/provider/IAM fakes
**Data needs**: Synthetic Host `host-active-01`, isolated MySQL schema, US-009 fixture; no production PII; mutations are scoped to this case.
**Teardown / reset**: Gọi seed/reset hook theo Host fixture sau case; xác nhận không còn execution/job/tombstone phát sinh.
**Depends on**: —
**Automation intent**: Auto=Y; implement in the Plan-owned repo delta using Fastify inject/Prisma integration, Vitest + Vue Test Utils, or Playwright according to Test Level; preserve stable Design hooks and API error contracts.
**External QA handoff needs**: N/A — no external QA in sprint v1.
**Owner of execution context**: khanh-pham runs locally and CI stores machine-readable evidence.

**Given**:
- Actor `usr_tc_057` đã đăng nhập; Host `host_tc_057`, Environment `env_tc_057` và dữ liệu phụ thuộc được seed riêng cho case.
- Tiền điều kiện AC-057: Workflow DISABLED đã được review, dependency hợp lệ, validation có 0 Lỗi và ít nhất 1 Cảnh báo rồi người dùng chọn "Bật workflow".

**When**:
- Chọn Bật workflow khi DISABLED, Review complete, dependencies valid, errors=0 và warnings={1,3}.

**Then**:
- [ ] Mở đúng MSG-029 với count thực tế.
- [ ] Chưa gọi API-011; Workflow vẫn DISABLED và không Execution.
- [ ] Dialog giữ review/report/revision binding và có hai actions.

**Test Data**:
- `fixture_id=tc_057; workflow=DISABLED; review=complete; dependencies=valid; errors=0; warning_counts=1,3; enable_calls_before_choice=0; synthetic=true; isolation=ephemeral; reset=required`

<!-- ID: TC-058 -->
<!-- VERIFIES: AC-058 -->
### TC-058: [US-009][AC-058][DT+ST] Workflow chuyển READY và nút "Chạy workflow" được bật. `[planned-automated]` `P0`

**Area**: API_LAB
**Traceability**: FR-001, FR-003, FR-011, US-009, AC-058
**Design states referenced**: SCREEN-001, SCREEN-006, SCREEN-008
**API / NFR refs**: API-004 POST /api/v1/hosts/{hostId}/api-lab/resource-commands; API-005 DELETE /api/v1/hosts/{hostId}/api-lab/apis/{apiId}; API-006 POST /api/v1/hosts/{hostId}/api-lab/apis/{apiId}/undo-deletion; API-007 PUT /api/v1/hosts/{hostId}/api-lab/apis/{apiId}; API-011 POST /api/v1/hosts/{hostId}/api-lab/workflows/{workflowId}/enable; API-021 POST /api/v1/hosts/{hostId}/lifecycle-impact; API-022 PATCH /api/v1/hosts/{hostId}
**Manual / Auto boundary**: automated contract/component/E2E assertion; visual wording/focus is also sampled manually by TC-072
**Test Level**: e2e
**Test Type**: Functional
**Export target**: functional
**Smoke**: Y
**Environment**: Local Docker Compose and CI with deterministic clock/provider/IAM fakes
**Data needs**: Synthetic Host `host-active-01`, isolated MySQL schema, US-009 fixture; no production PII; mutations are scoped to this case.
**Teardown / reset**: Gọi seed/reset hook theo Host fixture sau case; xác nhận không còn execution/job/tombstone phát sinh.
**Depends on**: —
**Automation intent**: Auto=Y; implement in the Plan-owned repo delta using Fastify inject/Prisma integration, Vitest + Vue Test Utils, or Playwright according to Test Level; preserve stable Design hooks and API error contracts.
**External QA handoff needs**: N/A — no external QA in sprint v1.
**Owner of execution context**: khanh-pham runs locally and CI stores machine-readable evidence.

**Given**:
- Actor `usr_tc_058` đã đăng nhập; Host `host_tc_058`, Environment `env_tc_058` và dữ liệu phụ thuộc được seed riêng cho case.
- Tiền điều kiện AC-058: Dialog Cảnh báo được mở từ "Bật workflow" rồi người dùng chọn "Tiếp tục".

**When**:
- Từ Enable warning dialog, chọn Tiếp tục; POST API-011 với current review/report/revision acknowledgement.

**Then**:
- [ ] API-011 trả 200; Workflow DISABLED→READY và Run enabled.
- [ ] Đúng một transition/audit; không Execution; acknowledgement không dùng lại ở context khác.

**Test Data**:
- `fixture_id=tc_058; before=DISABLED; review=complete; errors=0; warnings=1; after=READY; execution_delta=0; synthetic=true; isolation=ephemeral; reset=required`

<!-- ID: TC-059 -->
<!-- VERIFIES: AC-059 -->
### TC-059: [US-009][AC-059][DT+ST] Workflow giữ DISABLED và không tạo Execution. `[planned-automated]` `P0`

**Area**: API_LAB
**Traceability**: FR-001, FR-003, FR-011, US-009, AC-059
**Design states referenced**: SCREEN-001, SCREEN-006, SCREEN-008
**API / NFR refs**: API-004 POST /api/v1/hosts/{hostId}/api-lab/resource-commands; API-005 DELETE /api/v1/hosts/{hostId}/api-lab/apis/{apiId}; API-006 POST /api/v1/hosts/{hostId}/api-lab/apis/{apiId}/undo-deletion; API-007 PUT /api/v1/hosts/{hostId}/api-lab/apis/{apiId}; API-011 POST /api/v1/hosts/{hostId}/api-lab/workflows/{workflowId}/enable; API-021 POST /api/v1/hosts/{hostId}/lifecycle-impact; API-022 PATCH /api/v1/hosts/{hostId}
**Manual / Auto boundary**: automated contract/component/E2E assertion; visual wording/focus is also sampled manually by TC-072
**Test Level**: e2e
**Test Type**: Functional
**Export target**: functional
**Smoke**: N
**Environment**: Local Docker Compose and CI with deterministic clock/provider/IAM fakes
**Data needs**: Synthetic Host `host-active-01`, isolated MySQL schema, US-009 fixture; no production PII; mutations are scoped to this case.
**Teardown / reset**: Gọi seed/reset hook theo Host fixture sau case; xác nhận không còn execution/job/tombstone phát sinh.
**Depends on**: —
**Automation intent**: Auto=Y; implement in the Plan-owned repo delta using Fastify inject/Prisma integration, Vitest + Vue Test Utils, or Playwright according to Test Level; preserve stable Design hooks and API error contracts.
**External QA handoff needs**: N/A — no external QA in sprint v1.
**Owner of execution context**: khanh-pham runs locally and CI stores machine-readable evidence.

**Given**:
- Actor `usr_tc_059` đã đăng nhập; Host `host_tc_059`, Environment `env_tc_059` và dữ liệu phụ thuộc được seed riêng cho case.
- Tiền điều kiện AC-059: Dialog Cảnh báo được mở từ "Bật workflow" rồi người dùng chọn "Quay lại báo cáo".

**When**:
- Từ Enable warning dialog, chọn Quay lại báo cáo.

**Then**:
- [ ] Dialog đóng; Workflow giữ DISABLED và Run disabled.
- [ ] Không gọi API-011/API-013; execution/job/provider counts không đổi; acknowledgement không consumed.

**Test Data**:
- `fixture_id=tc_059; workflow=DISABLED; errors=0; warnings=1; baseline_executions=0; execution_delta=0; synthetic=true; isolation=ephemeral; reset=required`

---
### SIT / Integration Test Cases

<!-- ID: TC-060 -->
<!-- VERIFIES: NFR-003 -->
### TC-060: [FLOW-001][SIT] Atomic admission rejects races above 20 active workflows `[planned-automated]` `P0`

**Area**: SIT
**Traceability**: FR-008, NFR-003
**Design states referenced**: N/A — non-UI architecture obligation
**API / NFR refs**: API-013; SEQ-004; ADR-004
**Manual / Auto boundary**: automated
**Test Level**: integration
**Test Type**: SIT
**Export target**: sit
**Smoke**: N
**Environment**: Local Docker Compose and CI
**Data needs**: Synthetic deterministic fixtures; isolated ephemeral schema; no production PII.
**Teardown / reset**: Reset fixture schema, fake dependency state and controllable clock after the case.
**Depends on**: —
**Automation intent**: Auto=Y; future repo suite in the Plan-owned test delta using Architecture-approved frameworks and contracts.
**External QA handoff needs**: N/A — no external QA in sprint v1.
**Owner of execution context**: khanh-pham; local execution and CI evidence retained in repository artifacts.
**Systems involved**: API, MySQL admission transaction, execution worker
**System A expected**: Exactly 20 accepted and excess request receives HTTP 429 `WORKFLOW_CAPACITY_REACHED` with `Retry-After`.
**System B expected**: Active counter equals accepted non-terminal executions; no orphan job.
**Screen under test**: N/A — atomic admission is verified at API/MySQL/worker integration boundaries; UI capacity state is covered by TC-060 references in TC-072

**Given**:
- 19 active executions and two simultaneous run requests with distinct idempotency keys.

**When**:
- Release both requests at the same transaction barrier.

**Then**:
- [ ] Exactly one new execution/job commits; the other request is rejected.
- [ ] The rejected API-013 response is HTTP 429 `WORKFLOW_CAPACITY_REACHED`, includes `Retry-After`, and creates no Execution/History row.
- [ ] No duplicate execution, history row or capacity-slot leak exists.
- [ ] After one terminal transition, a retry is accepted.

**Test Data**: `active=19; concurrent_requests=2; expected_accepted=1`

<!-- ID: TC-061 -->
<!-- VERIFIES: API-001 -->
### TC-061: [FLOW-002][SIT] [EXC-STACK-001] OpenAPI, dependency-boundary and supported-version gates refute brownfield stack drift `[planned-automated]` `P0`

**Area**: SIT
**Traceability**: FR-001–012, NFR-008, EXC-STACK-001
**Design states referenced**: N/A — API compatibility and no-event-contract obligation have no interactive surface
**API / NFR refs**: API-001–023; EVT-001; PR-008; ADR-008; EXC-STACK-001
**Manual / Auto boundary**: automated
**Test Level**: integration
**Test Type**: SIT
**Export target**: sit
**Smoke**: N
**Environment**: Local Docker Compose and CI
**Data needs**: Approved OpenAPI/error schemas; additive/breaking mutations; PR-008 allowed and forbidden import fixtures; repository runtime/dependency manifests; TG-27 pinned support/EOL metadata snapshot; no production PII.
**Teardown / reset**: Reset fixture schema, fake dependency state and controllable clock after the case.
**Depends on**: Plan TG-27 boundary/version refutation inputs and pinned support/EOL metadata; TG-29 production source-map gate is cross-checked by TC-073.
**Automation intent**: Auto=Y; future repo suite in the Plan-owned test delta using Architecture-approved frameworks and contracts.
**External QA handoff needs**: N/A — no external QA in sprint v1.
**Owner of execution context**: khanh-pham; local execution and CI evidence retained in repository artifacts.
**Systems involved**: Vue consumer contracts, Fastify OpenAPI provider, domain/application import graph, repository runtime/dependency manifests
**System A expected**: Existing consumer fixtures deserialize optional-field additions.
**System B expected**: Remove/rename/retype and undocumented error codes fail contract validation.
**Screen under test**: N/A — contract mutation is verified at consumer/provider schema boundaries

**Given**:
- Approved API-001–023 schemas and prior consumer fixtures are available.
- PR-008 boundary fixtures include allowed domain/application imports and forbidden Fastify, Prisma, provider HTTP client, Pino, Sentry, Vault SDK and Vue/browser imports from domain/application modules.
- Repository manifests declare Node, Fastify and Vue versions; TG-27 supplies a versioned support/EOL metadata snapshot and the Architecture baseline Node >=20.20, Fastify 5 and Vue 3.

**When**:
- Verify additive optional change and injected remove/rename/retype/error-code mutations.
- Run the dependency-boundary scanner over allowed and one-at-a-time forbidden imports.
- Evaluate current and mutated runtime/framework manifests against the Architecture baseline and pinned support/EOL snapshot.

**Then**:
- [ ] Additive optional fields pass.
- [ ] Each breaking schema/error mutation fails with endpoint/field evidence.
- [ ] Every PR-008 allowed fixture passes; each forbidden import fails with source module, imported package and violated boundary. No exception authorizes a new standalone service/UI.
- [ ] Node <20.20, wrong Fastify/Vue major, missing support metadata, or a runtime/framework marked EOL on the evidence date fails; supported manifests pass and record versions plus metadata revision.
- [ ] EVT-001 remains no-broker; no event contract is fabricated.

**Test Data**: `node_baseline=>=20.20; framework_major=fastify:5,vue:3; boundary=PR-008; support_source=TG-27_pinned_metadata; mutations=remove,rename,retype,error_code,forbidden_import,unsupported_version,EOL; synthetic=true; isolation=ephemeral; reset=required`

<!-- ID: TC-062 -->
<!-- VERIFIES: NFR-002 -->
### TC-062: [FLOW-003][SIT] Dependency timeouts, circuit breakers and bulkheads fail closed at exact thresholds `[planned-automated]` `P0`

**Area**: SIT
**Traceability**: NFR-002, NFR-004, FR-001–012, EXC-RETRY-001
**Design states referenced**: N/A — non-UI architecture obligation
**API / NFR refs**: FLOW-003; API-001–023; NFR-002/004; ADR-005; EXC-RETRY-001
**Manual / Auto boundary**: automated
**Test Level**: integration
**Test Type**: SIT
**Export target**: sit
**Smoke**: N
**Environment**: Local Docker Compose and CI with IAM/key/database/provider failure fakes
**Data needs**: Synthetic identity/secret markers; crashable transaction; two Hosts for isolation.
**Teardown / reset**: Reset fixture schema, fake dependency state and controllable clock after the case.
**Depends on**: —
**Automation intent**: Auto=Y; Implement delivers runnable evidence using approved frameworks/contracts.
**External QA handoff needs**: N/A — no external QA in sprint v1.
**Owner of execution context**: khanh-pham; local execution and CI evidence retained in repository artifacts.

**Given**:
- Each dependency fake can emit 4xx, 5xx, timeout, partition and malformed response without reading real credentials.
- Threshold config is fixed to IAM status 2s, login 5s with max 3 attempts, key provider 2s, provider 30s, circuit 50%/30s/open 60s, provider bulkhead 5 per Host and DB pool 20 per process.
- Non-provider retry fixtures cover Central-IAM login/token exchange, Secret Manager safe key read, MySQL idempotent read/lease claim and Telemetry exporter; each uses an injected deterministic full-jitter source with base=100ms, cap=1000ms and candidate delay rows 0/50/100ms.

**When**:
- Exercise IAM status timeout and login retries; missing/invalid/stale signed manifest; key timeout; database rollback; provider 4xx/5xx/30s timeout/partition.
- Drive exactly 49% then 50% failures in 30s, probe at 59s/60s open duration, saturate 5/6 provider slots for one Host and 20/21 DB connections.
- For each retry-safe non-provider operation, inject transient failures through three total attempts and record scheduled delays; also invoke an unclassified mutation and IAM per-request status check.

**Then**:
- [ ] IAM status timeout returns typed 503 within 2s; login performs at most 3 attempts of 5s; manifest/key uncertainty fails closed before mutation or credential send.
- [ ] Database failure rolls back all rows; provider failures never commit mixed snapshots or plaintext credential material.
- [ ] Circuit remains closed at 49%, opens at 50% for 60s; sixth same-Host provider call and twenty-first DB checkout are rejected/queued without starving the unrelated Host.
- [ ] Every retry-safe non-provider operation performs at most three total attempts; each deterministic delay falls within `0..min(1000ms,100ms*2^(attempt-1))` and matches the injected full-jitter value. The unclassified mutation and IAM per-request status check execute once with no retry.

**Test Data**: `iam_status=2s; login_timeout=5s; non_provider_max_attempts=3; jitter=full;base=100ms;cap=1000ms;deterministic_delays=0,50,100ms; no_retry=iam_per_request_status,unclassified_mutation; key_timeout=2s; provider_timeout=30s; cb_rate=50%; cb_window=30s; cb_open=60s; bulkhead=5; db_pool=20`

<!-- ID: TC-063 -->
<!-- VERIFIES: ADR-004 -->
### TC-063: [FLOW-002][SIT] Durable job, lease heartbeat and recovery remain non-blocking and exactly-once `[planned-automated]` `P0`

**Area**: SIT
**Traceability**: FR-008, FR-009, NFR-003, EXC-QUEUE-001
**Design states referenced**: N/A — non-UI architecture obligation
**API / NFR refs**: SEQ-004/006; ENT-013/021; ADR-004; EXC-QUEUE-001
**Manual / Auto boundary**: automated
**Test Level**: integration
**Test Type**: SIT
**Export target**: sit
**Smoke**: N
**Environment**: Local Docker Compose and CI
**Data needs**: Synthetic deterministic fixtures; isolated ephemeral schema; no production PII.
**Teardown / reset**: Reset fixture schema, fake dependency state and controllable clock after the case.
**Depends on**: Plan TG-13 dead-job inspection/manual-recovery command-or-API and Operations runbook; TG-23/TG-26 recovery harness.
**Automation intent**: Auto=Y; future repo suite in the Plan-owned test delta using Architecture-approved frameworks and contracts.
**External QA handoff needs**: N/A — no external QA in sprint v1.
**Owner of execution context**: khanh-pham; local execution and CI evidence retained in repository artifacts.
**Systems involved**: API admission, MySQL lease queue, worker, recovery scheduler
**System A expected**: Run returns only after execution and job commit, without waiting for provider completion.
**System B expected**: Worker heartbeat/reclaim produces one terminal outcome and releases capacity.
**Screen under test**: N/A — durable queue, lease and recovery behavior has no direct interactive surface

**Given**:
- A committed run job, controllable 60-second lease/15-second heartbeat and crashable worker.
- The execution owns one active-capacity slot; recovery claims are numbered; an authorized operations actor and an unauthorized authenticated actor are available; inspect evidence includes job ID, Execution ID, claim count, lease/heartbeat timestamps and masked terminal error.

**When**:
- Crash the claimant before and after provider evidence persistence, run recovery through the third exhausted claim, query through the exact TG-13 runbook-defined inspection command/API, then invoke its manual-recovery operation first as the unauthorized actor and then as the authorized operations actor.

**Then**:
- [ ] Caller is not blocked by execution completion.
- [ ] No provider attempt or terminal transition is duplicated.
- [ ] Third recovery exhaustion atomically sets the job to DEAD, sets its Execution terminal FAILED with masked evidence, releases exactly one active-capacity slot, and emits one immediate critical alert correlated to job/Execution IDs.
- [ ] Inspection returns claim/lease/heartbeat/terminal evidence without secrets; the unauthorized manual-recovery request is denied before mutation and audited.
- [ ] Authorized manual recovery creates the documented recovery transition/evidence without silently changing DEAD history or auto-replaying a provider attempt; a subsequent admission can consume the released slot.

**Test Data**: `claims=1,2,3; exhausted_claim=3; job_terminal=DEAD; execution_terminal=FAILED; released_slots=1; alert_count=1; actors=ops_authorized,authenticated_unauthorized; inspect_fields=job_id,execution_id,claim_count,lease,heartbeat,masked_error; synthetic=true; isolation=ephemeral; reset=required`

<!-- ID: TC-064 -->
<!-- VERIFIES: NFR-006 -->
### TC-064: [NFR-006][SIT] State changes emit correlated append-only audit without sensitive data `[planned-automated]` `P0`

**Area**: SIT
**Traceability**: FR-003, FR-005, FR-011, NFR-006
**Design states referenced**: N/A — non-UI architecture obligation
**API / NFR refs**: FLOW-001/002/003; API-004–013
**Manual / Auto boundary**: automated
**Test Level**: integration
**Test Type**: SIT
**Export target**: sit
**Smoke**: N
**Environment**: Local Docker Compose and CI
**Data needs**: Synthetic deterministic fixtures; isolated ephemeral schema; no production PII.
**Teardown / reset**: Reset fixture schema, fake dependency state and controllable clock after the case.
**Depends on**: —
**Automation intent**: Auto=Y; future repo suite in the Plan-owned test delta using Architecture-approved frameworks and contracts.
**External QA handoff needs**: N/A — no external QA in sprint v1.
**Owner of execution context**: khanh-pham; local execution and CI evidence retained in repository artifacts.
**Systems involved**: API modules, audit adapter, OTel/Sentry fake
**System A expected**: Caller receives request and trace IDs.
**System B expected**: Audit/log/trace carry required schema and masked actor/target/outcome.
**Screen under test**: N/A — audit/telemetry contracts are verified at API, adapter and exporter boundaries

**Given**:
- Synthetic credential/token markers and known request/trace IDs.

**When**:
- Create, update, delete/undo, validate, enable and run a workflow.

**Then**:
- [ ] Every state change emits exactly one expected audit record after commit.
- [ ] All evidence is searchable by request/trace/execution ID.
- [ ] Secret markers are absent from DB projection, DOM, logs, traces, errors and Sentry.

**Test Data**: `synthetic=true; isolation=ephemeral; reset=required`

<!-- ID: TC-065 -->
<!-- VERIFIES: NFR-004 -->
### TC-065: [NFR-004][BVA+ST+Security+SIT] [EXC-AUTH-001] Durable OIDC state, session lifecycle and protected paths enforce one fail-closed browser boundary `[planned-automated]` `P0`

**Area**: SEC
**Traceability**: FR-001–012, NFR-004, NFR-010, API-024, FLOW-004, EXC-AUTH-001
**Design states referenced**: SCREEN-009 public authentication shell and DS-COMP-012 pre-claim `auth-callback-retry-*`/post-claim `auth-restart-*` states; SCREEN-001–008 begin only after authentication; exact visual states remain covered by TC-072
**API / NFR refs**: API-001–024, especially API-017–020 and API-024 protected-route inheritance; NFR-004/010; FLOW-004; ADR-006; ARCH-COMP-001; ENT-022/023; PR-001; EXC-AUTH-001
**Manual / Auto boundary**: automated
**Test Level**: integration
**Test Type**: SIT
**Export target**: sit
**Smoke**: N
**Environment**: Local Docker Compose and CI with isolated MySQL schema, controllable clock, Central-IAM fake and key-provider fake
**Data needs**: Synthetic active/expired/revoked/uncertain identities; state rows at TTL boundaries; encrypted PKCE fixtures; opaque session/CSRF selectors; MFA-sufficient/insufficient claims; no production PII.
**Teardown / reset**: Reset Identity tables, fake dependency state, keys and controllable clock after the case.
**Depends on**: Plan TG-02 persistence/crypto, TG-02B backend identity, TG-02C browser cutover, TG-03B live composition, TG-03C foundation harness and TG-26 auth security harness with Central-IAM fake.
**Automation intent**: Auto=Y; TG-02 supplies persistence evidence, TG-02B backend contracts, TG-02C browser contracts, TG-03B composition, TG-03C runnable dependency failures and TG-26 broader security refutation.
**External QA handoff needs**: N/A — no external QA in sprint v1.
**Owner of execution context**: khanh-pham; local execution and CI evidence retained in repository artifacts.
**Systems involved**: Browser OIDC initiation/callback, Central-IAM fake, secret-manager fake, ENT-022/023 repositories, Fastify identity hooks, application handlers
**System A expected**: Only an active, unexpired, non-replayed, MFA-sufficient identity creates/resolves a session.
**System B expected**: No protected handler mutates or returns payload when local lifecycle, IAM authority or session storage rejects.
**Screen under test**: SCREEN-009 public callback/login boundary plus authentication gates before SCREEN-001–008; TC-072 owns exact visual observation

**Given**:
- API-017 state ages `9m59s999ms`, `10m`, `10m+1ms`; state is valid/unconsumed, consumed or replayed; PKCE/MFA rows cover valid, missing and mismatched inputs.
- ENT-023 rows cover IAM-derived absolute expiry and idle ages `14m59s999ms`, `15m`, `15m+1ms`; persisted activity ages `59s999ms`, `60s`, `60s+1ms`.
- API-020 rows cover absent, mismatching and matching `If-None-Match`; the matching row has no activity write due and the key-provider fake is configured to fail if CSRF decryption is called.
- Dependency rows cover authoritative inactive identity, IAM timeout/invalid response and MySQL repository outage independently.
- Configuration rows set all canonical NFR-010 values: `OIDC_LOGIN_STATE_TTL_MINUTES=10`, `SESSION_IDLE_TIMEOUT_MINUTES=15`, `SESSION_ACTIVITY_WRITE_MIN_SECONDS=60`, `IAM_LOGIN_TIMEOUT_MS=5000`, `IAM_LOGIN_RETRY_MAX=3`, `IAM_STATUS_TIMEOUT_MS=2000`, `IAM_POSITIVE_STATUS_CACHE_SECONDS=0`, `OIDC_STATE_KEY_ID=secret-ref://oidc-state` and distinct `SESSION_CSRF_KEY_ID=secret-ref://session-csrf`. For each variable, separate rows omit it, provide a non-canonical boundary/value, or reuse the same key reference; the process startup probe runs before any dependency access and secret/key-material scans remain active.
- Claim-transaction rows inject repository failure immediately before conditional claim commit and immediately after claim commit/before token exchange; a separate boundary-race advances the clock from exactly 15m to 15m+1ms while the IAM status call is in flight.
- Synthetic secret markers represent raw state, nonce, PKCE verifier, session selector, CSRF token, IAM access/refresh/ID token and non-allowlisted claims.

**When**:
- Execute API-017 POST body `{returnTo}` → `200 {authorizationUrl}` → explicit Central-IAM navigation → public SPA `/auth/callback` → credentialed Axios API-018 POST body `{code,state}` for every state/PKCE/MFA row; assert API-018 success is `200 {returnTo}` + `Set-Cookie`, neither API request URL contains one-time values, the SPA accepts only a safe same-origin return path, race two callbacks for the same state, retry API-018 once after the injected pre-commit store failure, and invoke `Đăng nhập lại` after each post-claim dependency failure; assert that recovery API-017 uses only `returnTo=/` and the consumed API-018 payload/current callback route are never reused.
- Start the application once per valid, missing and invalid NFR-010 configuration row before connecting to MySQL, IAM or the key provider.
- Invoke API-019/020 and one representative protected business route across every session/identity/dependency row.
- Hold the protected status response until the idle clock crosses from 15m to 15m+1ms; run discovery/JWKS transient failures and token/status call-count probes independently.
- Inspect DB rows, cookie attributes, response/error headers, audit/log/telemetry and browser storage/DOM evidence.

**Then**:
- [ ] API-017 stores only state/nonce digests, encrypted PKCE verifier and safe return URL; expiry is exactly creation +10 minutes.
- [ ] API-017/018 are POST operations whose `returnTo` and `code/state` values are carried only in JSON bodies; success and every error/replay response carry exact `Cache-Control: no-store, private` and `Pragma: no-cache`; no proxy/browser cache stores them. API-017 is issued only by explicit user activation, and API-018 is issued only once after SCREEN-009 validates that both `code` and `state` exist; neither route is prefetched or speculatively invoked.
- [ ] Exactly one callback can consume an unexpired state. At `10m` it is expired; consumed/provider-failed state remains non-reusable until retention removes it after expiry.
- [ ] Failure before the conditional claim commits rolls back and leaves `consumed_at=NULL`, so one delayed callback retry can still win. Any IAM/key/store failure after claim commit keeps the row consumed, creates no session, returns `recovery_action=RESTART_LOGIN`, and recovery starts a fresh API-017 state; callback resubmission is rejected as replay.
- [ ] Only a valid callback creates ENT-023 with session/CSRF digests, encrypted CSRF ciphertext, minimal actor/MFA projection and IAM-derived absolute expiry; no raw token/full claim persists. API-020 can recover the same CSRF value after process restart without plaintext persistence.
- [ ] API-020 returns `200` with actor/CSRF only for a changed revision after all local lifecycle/expiry checks and authoritative-IAM validation succeed. A matching current ETag under those same valid conditions returns `304`, the same ETag and `Cache-Control: private, no-cache`, with an empty body, no actor/session/CSRF fields, no activity write and zero `IdentityKeyPort.decrypt` calls; an expired/invalidated session always returns `401` and never `304`.
- [ ] Idle age exactly `15m` remains valid; `15m+1ms` atomically invalidates with `401 AUTH_REQUIRED` and `details.reason=IDLE_TIMEOUT`. The atomic refresh/access commit rechecks the cutoff after IAM returns, so a request that crosses the boundary cannot revive the session or reach a protected handler. Activity writes do not occur at `59s999ms`, occur at `60s`, and advance revision at most once per window.
- [ ] One 5000ms end-to-end callback deadline starts before discovery; discovery/JWKS may retry only safe GET up to three times within remaining time and the single token POST receives only the remaining deadline. Every protected request, including ACTIVE-session API-019, makes exactly one direct status call bounded at 2000ms, performs zero discovery, request retry and positive-cache reuse; repeated `LOGOUT` tombstones make zero IAM calls.
- [ ] Key configuration contains only the two distinct reference IDs, selects the correct reference for PKCE versus CSRF, and contains no key bytes/material in config, DB, logs or generated evidence.
- [ ] Startup accepts only the complete canonical NFR-010 set. Missing or non-canonical TTL/idle/activity/login-timeout/login-retry/status-timeout/status-cache values, a missing/non-reference key ID, or equal key IDs fail closed before listening or contacting any dependency and expose no key material.
- [ ] Revoked/disabled/blocked/absolute-expired/unknown identity returns `401 AUTH_REQUIRED`; IAM unavailable/uncertain returns `503 SERVICE_UNAVAILABLE`; key-provider outage returns `503 KEY_PROVIDER_UNAVAILABLE`; repository outage returns `503 SESSION_STORE_UNAVAILABLE`. API-019 never exposes key-provider failure; API-020 304 performs zero decrypt. API-019/020 never return `SESSION_NOT_FOUND` 404. All `503` outcomes include exact API-024 metadata and no protected payload.
- [ ] Logout accepts omitted/false `allSessions`, rejects non-boolean with 400 and `true` with `422 GLOBAL_LOGOUT_UNSUPPORTED`; it validates the CSRF digest and monotonically invalidates the local session. Repeated intent with a resolvable `LOGOUT` tombstone returns idempotent 200 without IAM lookup, while an unknown/purged selector returns 401 and can never restore it; API-019 has no 409 branch.
- [ ] Central IAM lands on SCREEN-009 `/auth/callback` inside the public root auth shell; no protected workspace landmark/content mounts before success. API-018 errors traverse the shared Axios interceptor into DS-COMP-012 rather than rendering raw JSON. Successful API-018/session responses set Secure, HttpOnly and the approved SameSite cookie attributes, return/restore only the validated same-origin return URL and never place a bearer token in local/session storage.
- [ ] Exact callback oracle: missing `code` or `state` → `400 OIDC_CALLBACK_INVALID`; unknown/mismatched/expired state → `404 SESSION_STATE_NOT_FOUND`; consumed/replayed state → `409 CALLBACK_REPLAYED`; rejected/invalid token, nonce mismatch, missing/wrong PKCE proof, missing MFA or insufficient MFA → `401 OIDC_TOKEN_REJECTED`; valid token whose allowlisted actor projection cannot be constructed → `422 CLAIM_MAPPING_INVALID`. Every rejected row creates no session/domain mutation.
- [ ] UI navigation, direct protected API calls and method/path-tampering attempts are denied before a domain handler or write executes whenever authentication/CSRF validation fails.
- [ ] Secret-marker scans are zero across persisted plaintext, browser storage, DOM/accessibility tree, URL/history/referrer, logs, traces, errors and Sentry.

**Test Data**: `state_age=9m59s999ms,10m,10m+1ms; state=valid,missing,mismatch,expired,consumed,replayed; claim_failure=pre_commit,post_commit; recovery=same_callback,fresh_api017_fixed_root; pkce=S256_valid,missing,wrong; mfa=required_sufficient,missing_or_insufficient; idle_age=14m59s999ms,15m,15m+1ms,cross_during_iam; activity_age=59s999ms,60s,60s+1ms; state_ttl_minutes=10,missing,noncanonical; idle_timeout_minutes=15,missing,noncanonical; activity_write_seconds=60,missing,noncanonical; login_timeout_ms=5000,missing,noncanonical; login_retry_max=3_safe_get_only,missing,noncanonical; token_post_calls=1; status_timeout_ms=2000,missing,noncanonical; status_calls_per_request=1; positive_cache_seconds=0,missing,noncanonical; key_ref=oidc_state,session_csrf,missing,nonreference,equal; key_material_scan=zero; etag=absent,mismatch,match_no_write_due; decrypt_spy=zero_on_304; dependency=active,inactive,iam_uncertain,key_provider_down,session_store_down; cookie=secure_httponly_samesite; route=ui,direct_api,method_tamper,path_tamper; process_restart=true; synthetic=true; isolation=ephemeral; reset=required`

<!-- ID: TC-075 -->
<!-- VERIFIES: EP-001 -->
### TC-075: [FLOW-002][SIT] Workspace-to-history three-step workflow completes, recovers and reruns `[planned-automated]` `P0`

**Area**: SIT
**Traceability**: FR-001–012, US-001–010, NFR-003, NFR-004, NFR-008
**Design states referenced**: N/A — non-UI architecture obligation
**API / NFR refs**: API-001–023; SEQ-001–006; FLOW-001/002/003
**Manual / Auto boundary**: automated
**Test Level**: integration
**Test Type**: SIT
**Export target**: sit
**Smoke**: Y
**Environment**: Local Docker Compose and CI
**Data needs**: Synthetic deterministic fixtures; isolated ephemeral schema; no production PII.
**Teardown / reset**: Reset fixture schema, fake dependency state and controllable clock after the case.
**Depends on**: —
**Automation intent**: Auto=Y; future repo suite in the Plan-owned test delta using Architecture-approved frameworks and contracts.
**External QA handoff needs**: N/A — no external QA in sprint v1.
**Owner of execution context**: khanh-pham; local execution and CI evidence retained in repository artifacts.
**Systems involved**: Vue SPA, Fastify API, MySQL, worker, target-provider stub
**System A expected**: UI shows exact saved/snapshotted/masked state from workspace through history.
**System B expected**: Domain state, attempts, jobs, audit and rerun lineage match immutable contracts.
**Screen under test**: SCREEN-001–008

**Given**:
- Seeded active Host, DEV/UAT/PROD bindings, three APIs, warning-free and warning-only workflows, provider stub and clean history.

**When**:
- Create resources, save/mapping workflow, validate, run, inspect, delete/undo/recover, open history and rerun latest.

**Then**:
- [ ] All eight screens traverse designed states with exact messages/focus.
- [ ] Sequential order, retries, snapshots, masking, Undo and recovery rules hold.
- [ ] Rerun creates a new ID and lineage using latest valid workflow/environment; old evidence is unchanged.

**Test Data**: `synthetic=true; isolation=ephemeral; reset=required`

---
### Non-Functional Test Cases

<!-- ID: TC-066 -->
<!-- VERIFIES: NFR-001 -->
### TC-066: [NFR-001][Performance] Interactive CRUD, history and execution observation meet latency targets `[planned-automated]` `P0`

**Area**: PERF
**Traceability**: NFR-001, FR-001–010
**Design states referenced**: N/A — non-UI architecture obligation
**API / NFR refs**: API-001–016; NFR-001
**Manual / Auto boundary**: automated
**Test Level**: integration
**Test Type**: Performance
**Export target**: functional
**Smoke**: N
**Environment**: Local Docker Compose and CI
**Data needs**: Synthetic 1M-row history shape only; generator belongs to Implement TG-25; isolated performance schema.
**Teardown / reset**: Reset fixture schema, fake dependency state and controllable clock after the case.
**Depends on**: —
**Automation intent**: Auto=Y; future repo suite in the Plan-owned test delta using Architecture-approved frameworks and contracts.
**External QA handoff needs**: N/A — no external QA in sprint v1.
**Owner of execution context**: khanh-pham; local execution and CI evidence retained in repository artifacts.

**Given**:
- Production-shape local performance profile, 1,000,000 history rows, warm-up 2 minutes and OTel metrics enabled.

**When**:
- Sustain 50 authenticated CRUD sessions for 15 minutes, query 50-row history pages, and poll active executions.

**Then**:
- [ ] Workspace CRUD p95 <=500ms and p99 <=1000ms.
- [ ] History p95 <=750ms at 1,000,000 rows.
- [ ] Execution observation p95 <=1000ms; record p50/p95/p99/error rate/CPU/RSS.

**Test Data**: `sessions=50; duration=15m; history_rows=1000000; page_size=50`

<!-- ID: TC-067 -->
<!-- VERIFIES: NFR-003 -->
### TC-067: [NFR-003][Performance] Availability, capacity, lease recovery and autoscaling policy schema meet exact local bounds `[planned-automated]` `P0`

**Area**: RELIABILITY
**Traceability**: NFR-002, NFR-003, FR-008
**Design states referenced**: N/A — non-UI architecture obligation
**API / NFR refs**: ADR-004; SEQ-004/006; NFR-002/003
**Manual / Auto boundary**: automated
**Test Level**: integration
**Test Type**: Performance
**Export target**: functional
**Smoke**: N
**Environment**: Local Docker Compose and CI with controllable worker clock, metrics and TG-21 non-deployable policy-schema validator; no Kubernetes/HPA runtime exists in v1
**Data needs**: 20 workflows × 20 steps; 30 readers; two API replicas; worker-process candidates; TG-21 HPA reference-policy fixture.
**Teardown / reset**: Reset fixture schema, fake dependency state and controllable clock after the case.
**Depends on**: —
**Automation intent**: Auto=Y; Implement delivers runnable evidence using approved frameworks/contracts.
**External QA handoff needs**: N/A — no external QA in sprint v1.
**Owner of execution context**: khanh-pham; local execution and CI evidence retained in repository artifacts.

**Given**:
- Deterministic UTC monthly-SLI fixture covers 30 days = 43,200 one-minute windows; approved-maintenance audit contains one approved 60-minute interval.
- Availability calculator excludes only minutes overlapping an `APPROVED` maintenance record; unapproved/absent maintenance remains eligible and bad.
- API replicas=2; active Workflow cap=20; lease=60s, heartbeat=15s, max claims=3; idempotency retention=24h/max response=65536 bytes.
- TG-21 non-deployable HPA reference-policy fixture declares min=2, max=4, CPU=70%, oldest-job=30s, scale-up window=5m and scale-down stability=15m; PLAN-DEP-001 explicitly provides no live HPA runtime.

**When**:
- Compute `eligible_minutes=43200-60=43140` and `availability_pct=good_eligible_minutes/eligible_minutes*100` for 42,925 and 42,924 good eligible minutes; repeat with maintenance unapproved.
- Sustain 20×20 workload and 30 History readers; remove one API replica; crash a worker after heartbeat; advance clock through 60s/75s; exhaust three claims.
- Replay idempotency key inside/after 24h and at 65536/65537 bytes; run the local worker-process capacity/resource harness without claiming Kubernetes autoscaling.
- Validate the TG-21 HPA reference-policy schema and deny malformed/missing min/max/CPU/job-age/scale-window/cost-ceiling fields.

**Then**:
- [ ] With approved maintenance, 42,925/43,140 ≈99.501% passes NFR-002 and 42,924/43,140 ≈99.499% fails; unapproved maintenance is not excluded.
- [ ] Availability evidence records observation window, numerator, denominator, excluded approved interval IDs, formula and source artifacts.
- [ ] API routing recovers within 30s without losing accepted execution; heartbeat/reclaim/DEAD behavior meets exact 15s/75s/3-claim bounds with no duplicate provider attempt.
- [ ] Idempotency/retry limits and local worker-process capacity/resource bounds hold; the non-deployable HPA reference schema encodes 2→4 workers, 70% CPU/30s job-age, 5m scale-up, 15m scale-down and ≤2.2× cost, and invalid policy fixtures fail validation.
- [ ] Runtime HPA scaling is explicitly `N/A — accepted PLAN-DEP-001 local-only gap`; no Test evidence claims a live scale event. A deployable platform plus real HPA evidence is mandatory before any non-local/external/commercial promotion.
- [ ] This calculator is deterministic sprint evidence, not fabricated live uptime; a real observation-window report is required before external/commercial deployment.

**Test Data**:
- `fixture_id=tc_067; window=UTC_30d; total_minutes=43200; approved_maintenance_minutes=60; eligible_minutes=43140; pass_good=42925; fail_good=42924; threshold=99.5%; evidence_sources=otel_sli_export,approved_maintenance_audit; evidence_key=TC-067/monthly-sli.json`
- `api_recovery=30s; workflows=20; steps=20; readers=30; lease=60s; heartbeat=15s; reclaim=75s; claims=3; idem=24h/65536B; local_worker_harness=true; synthetic=true; reset=required`
- `hpa_policy_schema=min2,max4,cpu70%,job_age30s,scale_up5m,scale_down15m,cost<=2.2x; runtime_hpa=N/A_PLAN_DEP_001; gap_owner=khanh-pham; close_trigger=non_local_deployment`

<!-- ID: TC-068 -->
<!-- VERIFIES: NFR-004 -->
### TC-068: [NFR-004][Security] TLS, IAM lifecycle, encryption, SSRF, throttling, secret and promotion gates meet exact policy `[planned-automated]` `P0`

**Area**: SEC
**Traceability**: NFR-004, FR-002, FR-005, FR-012
**Design states referenced**: N/A — non-UI architecture obligation
**API / NFR refs**: API-002/012/013/017–020; ADR-005/006; NFR-004
**Manual / Auto boundary**: automated
**Test Level**: integration
**Test Type**: Security
**Export target**: functional
**Smoke**: N
**Environment**: Local Docker Compose and CI with authorized IAM/key/provider fakes
**Data needs**: Safe SQL/XSS/path/SSRF corpus; signed/invalid/stale manifests; synthetic secret markers.
**Teardown / reset**: Reset fixture schema, fake dependency state and controllable clock after the case.
**Depends on**: —
**Automation intent**: Auto=Y; Implement delivers runnable evidence using approved frameworks/contracts.
**External QA handoff needs**: N/A — no external QA in sprint v1.
**Owner of execution context**: khanh-pham; local execution and CI evidence retained in repository artifacts.

**Given**:
- TLS probe supports 1.2 and 1.3; AES fixture records key ID and unique 96-bit nonce.
- Session/IAM clock covers idle 15m±1s, account inactivity at exactly 90d and 90d+1s, and a termination event inserted between two protected requests; the authoritative IAM fake records every status lookup and can time out at 2s.
- Authentication failures cover attempts 1–5, three IAM login retries, and the 15m block; key fixtures cover active-key selection, 30-day snapshot-key retention and emergency-revoked keys.
- Rate fixtures cover general API 120/min burst20, API-014 execution polling 60/min burst5 and API-017–019 authentication routes 30/min burst5; response sizes 204800/204801 bytes.
- Promotion fixtures cross Agent Security admission/runtime evidence present/absent, CVSS 3.1 High/Medium findings with or without owner-remediation-retest disposition, security-test evidence at release−3d/release−2d, and risk-assessment evidence present/missing.
- Browser scans cover localStorage, sessionStorage, IndexedDB, Cache Storage, service-worker messages, DOM/accessibility tree, URL/history/referrer and console/network evidence after successful login, callback rejection, revocation and idle expiry.

**When**:
- Attempt TLS 1.2/1.3, CSRF tampering, idle 15m±1s, five failed logins, DNS rebinding/redirect and stale/invalid manifest.
- Issue protected requests at exactly 90d and 90d+1s of account inactivity; terminate the actor between consecutive requests; repeat successful requests while checking the authoritative IAM lookup counter and force IAM uncertainty.
- Resolve current and retained snapshot key IDs, attempt a revoked key, and evaluate every promotion-fixture combination against the Agent Security, vulnerability-disposition, lead-time and risk-assessment gates.
- Cross exact rate/burst limits and dependency timeouts (IAM 2s/5s, key 2s, provider 30s); scan DB/DOM/log/trace/error/Sentry.
- Revoke the active subject between protected requests, advance inactivity from exactly 15m to >15m, force IAM timeout/breaker-open uncertainty, and run the complete browser-storage/token-surface scan after each branch.

**Then**:
- [ ] TLS 1.2 is rejected and TLS 1.3 certificate verification succeeds; AES-256-GCM uses a unique 96-bit nonce and resolvable key ID.
- [ ] Idle >15m expires; exactly 90d inactive remains eligible but 90d+1s is deactivated; the first protected request after termination is rejected with no successful positive-status cache hit, every protected request performs an authoritative IAM check because `IAM_POSITIVE_STATUS_CACHE_SECONDS=0`, and IAM uncertainty fails closed.
- [ ] Five failures block for 15m, IAM login stops after three failed attempts, and no session is created; CSRF/SSRF/manifest uncertainty fails closed before mutation or credential send.
- [ ] Current and ≤30-day snapshot key IDs resolve without raw key material in configuration; emergency-revoked or older unavailable keys fail closed with explicit evidence.
- [ ] Missing Agent Security evidence blocks promotion; every CVSS 3.1 High-or-higher finding blocks release, while Medium-or-lower proceeds only with named owner, remediation and retest disposition; security-test evidence must exist at least 3 days before release and linked risk-assessment evidence is mandatory.
- [ ] Limits enforce general API 120/min burst20 with RATE_LIMIT_EXCEEDED, API-014 polling 60/min burst5 with POLL_RATE_LIMIT_EXCEEDED, and API-017–019 auth 30/min burst5; every 429 includes Retry-After.
- [ ] 204800-byte response is accepted, 204801 follows bounded contract, and zero synthetic secret marker exists on any scanned surface.
- [ ] Revocation takes effect on the next protected request, idle time exactly 15m remains valid but >15m expires before protected data access, and IAM timeout/breaker-open uncertainty fails closed without payload or mutation.
- [ ] No access/ID/refresh token, authorization code, PKCE verifier or raw secret appears in localStorage, sessionStorage, IndexedDB, Cache Storage, service-worker messages, DOM/accessibility tree, URL/history/referrer, console or persisted network evidence.

**Test Data**:
- `tls=1.3; aes=AES-256-GCM/nonce96; idle=15m±1s; account_inactive=90d,90d+1s; terminated=between_requests; positive_status_cache=0s; iam_status_timeout=2s; iam_login_timeout=5s; iam_login_attempts=3; failures=5; block=15m`
- `key_timeout=2s; provider_timeout=30s; snapshot_key_retention=30d; emergency_revoked=true; rate=api:120/20,poll:60/5,auth:30/5; response=204800B,204801B`
- `agent_security=present,missing; cvss_3_1=High,Medium; disposition=complete,missing; security_test_lead_days=3,2; risk_assessment=present,missing; synthetic=true; reset=required`
- `auth_exception=EXC-AUTH-001; revocation=between_requests; idle=15m,15m+1s; iam_uncertainty=timeout,breaker_open; browser_scan=localStorage,sessionStorage,indexedDB,cacheStorage,serviceWorker,DOM,a11yTree,URL,history,referrer,console,network; forbidden_material=access_token,id_token,refresh_token,authorization_code,pkce_verifier,raw_secret`

<!-- ID: TC-069 -->
<!-- VERIFIES: NFR-005 -->
### TC-069: [NFR-005][SIT] Backup, PITR and restore satisfy RPO/RTO and atomic durability `[planned-automated]` `P0`

**Area**: DR
**Traceability**: NFR-005, FR-002–011
**Design states referenced**: N/A — non-UI architecture obligation
**API / NFR refs**: ENT-001–021; ADR-004
**Manual / Auto boundary**: automated
**Test Level**: integration
**Test Type**: SIT
**Export target**: sit
**Smoke**: N
**Environment**: Local Docker Compose and CI
**Data needs**: Synthetic deterministic fixtures; isolated ephemeral schema; no production PII.
**Teardown / reset**: Reset fixture schema, fake dependency state and controllable clock after the case.
**Depends on**: —
**Automation intent**: Auto=Y; future repo suite in the Plan-owned test delta using Architecture-approved frameworks and contracts.
**External QA handoff needs**: N/A — no external QA in sprint v1.
**Owner of execution context**: khanh-pham; local execution and CI evidence retained in repository artifacts.

**Given**:
- Encrypted backup/binlog chain and synthetic dataset with committed/uncommitted transaction markers.

**When**:
- Restore to a point 15 minutes before simulated loss and run integrity/replay checks.

**Then**:
- [ ] RPO <=15 minutes and RTO <=4 hours are evidenced.
- [ ] Execution/job/snapshot/idempotency rows are all present together or absent together.
- [ ] Restored secrets remain encrypted and referenced keys are resolvable.

**Test Data**: `synthetic=true; isolation=ephemeral; reset=required`

<!-- ID: TC-070 -->
<!-- VERIFIES: NFR-006 -->
### TC-070: [NFR-006][BVA+DT+SIT] Generated errors, correlation, audit, alerts and exporter degradation meet exact bounds `[planned-automated]` `P0`

**Area**: OBS
**Traceability**: NFR-006, NFR-008, FR-005, FR-008
**Design states referenced**: N/A — non-UI architecture obligation
**API / NFR refs**: API-024 plus API-017–020 and protected-route middleware inheritance; FLOW-001/002/004; ARCH-COMP-001/007; NFR-006/010; PR-006/008
**Manual / Auto boundary**: automated
**Test Level**: integration
**Test Type**: SIT
**Export target**: sit
**Smoke**: N
**Environment**: Local Docker Compose and CI with exporter/alert fakes, controllable retention clock and a per-run temporary workspace outside canonical catalog/output paths
**Data needs**: Read-only copy of canonical `backend/errors.yml`; valid/invalid catalog variants materialized under a unique temporary directory; separate temporary TypeScript/OpenAPI output paths; known request/trace/execution IDs and synthetic secret markers.
**Teardown / reset**: Delete the unique temporary directory, reset fixture schema/fake dependency/clock, then assert canonical `backend/errors.yml` and committed generated-output hashes are byte-identical to their pre-test hashes. No test writes canonical paths.
**Depends on**: TG-03 canonical catalog/generator, TG-03B live error/observability composition, TG-03C CODE-10 routing harness and TG-27 later observability refutation.
**Automation intent**: Auto=Y; TG-03 supplies isolated catalog/generator evidence, TG-03B live routing/adapters, TG-03C Compose dependency paths and TG-27 consumes the resulting observability fixtures.
**External QA handoff needs**: N/A — no external QA in sprint v1.
**Owner of execution context**: khanh-pham; local execution and CI evidence retained in repository artifacts.
**Systems involved**: Canonical YAML catalog/generator, generated TypeScript/OpenAPI, Fastify API, worker/job boundary, MySQL audit store, OTel/Sentry/exporter/alert fakes, browser error queue
**System A expected**: Generator and runtime expose one complete error/correlation contract with no stale alias, partial output or secret leakage.
**System B expected**: Audit, alert, queue, TTL, source-map and exporter-degradation state remains durable and bounded without rolling back business work.
**Screen under test**: N/A — non-UI Architecture obligation; SCREEN-001/003 generic retry behavior is observed by TC-065/072

**Given**:
- Catalog variants remove each required metadata field, duplicate a code, change endpoint/status mapping, insert a secret marker, or make generated TypeScript/OpenAPI stale.
- The harness copies the catalog into a unique OS temporary directory and points both generator input and output arguments there; it records hashes of canonical catalog/outputs before mutation.
- Alert fixtures cover exact and above-threshold job age, dead jobs, retention lag, error rate and active-count mismatch; exporter is unavailable.
- Ingress fixtures cover valid/missing/malformed/duplicate/65-character request IDs and trusted/untrusted trace IDs.
- Offline Sentry fixtures cover queue 100/101, ages around 24 hours, required context, redaction and source-map promotion.
- Alert boundaries are oldest job `60s`/`>60s sustained 5m`, dead jobs `0/1`, retention lag `48h`/`>48h`, error rate `5%`/`>5% sustained 5m`, and active-count invariant match/mismatch.
- Offline envelopes cover `23h59m59s`, `24h`, `24h+1s`, required app/build/session/masked-user/device/browser/network context, and 10/11 redacted breadcrumbs. Release fixtures cover verified/missing source-map upload and credential/public-bundle scans.
- API-024 decision rows cover API-017/018/019/020 and one representative inherited protected endpoint; 503 retry values `0,1,86400,86401`, non-integer, missing body/header and unequal body/header pairs; representative 400/401/403/404/409/422/500 responses probe forbidden retry details. Separate 429 rows require positive integer retry metadata and the identical `Retry-After` header. API-019 key-provider output is forbidden; API-020 304 uses no decrypt.

**When**:
- Generate TypeScript/OpenAPI twice from the isolated catalog copy into isolated output paths, run check mode against those paths, then exercise every invalid/stale decision row only inside that temporary workspace.
- Run success/failure flows, disable exporter, cross response/downstream HTTP/job/worker boundaries, drive alert/queue/TTL boundaries and scan all outputs.
- Generate and exercise every API-024 decision row against YAML, TypeScript, OpenAPI and runtime output; compare `error.details.retry_after_seconds` with the decimal HTTP `Retry-After` header exactly.
- Query correlation immediately and after 5 minutes; run source-map promotion and public-bundle scans; advance the audit clock through 6- and 12-month boundaries.

**Then**:
- [ ] Two generations are byte-identical; check mode passes only when generated TypeScript/OpenAPI exactly match canonical YAML.
- [ ] Every mutation and partial-output assertion is confined to the unique temporary workspace; teardown removes it and proves canonical catalog/output hashes never changed, including after generator failure or test interruption cleanup.
- [ ] Missing `message_key`, `retryable`, retry metadata or `category`; duplicate codes; endpoint/status drift; stale output; or secret markers fail generation/check with no partial output committed.
- [ ] Every API-024 429 or 503 accepts only an integer `retry_after_seconds` in `[1,86400]`, emits the identical decimal HTTP `Retry-After`, and fails generation/runtime validation when either value is missing, out of range, non-integer or unequal. Representative non-429/503 responses omit the detail/header.
- [ ] Endpoint inheritance is exact: API-017/018 may emit IAM/key/store 503; API-019 may emit IAM/store but never key 503; API-020 200 may emit IAM/key/store while 304 performs zero decrypt; every other protected API inherits IAM/store and only a decrypting response inherits key failure.
- [ ] API-017–020 generated responses distinguish `503 SERVICE_UNAVAILABLE` for IAM uncertainty, `503 KEY_PROVIDER_UNAVAILABLE` for encryption-key failure and `503 SESSION_STORE_UNAVAILABLE` for repository failure. Pre-release `IAM_UNAVAILABLE` and `IAM_OR_SESSION_STORE_UNAVAILABLE` aliases are rejected from new output and the broad base `SERVICE_UNAVAILABLE` meaning remains intact.
- [ ] Valid request/trace identifiers propagate through response, HTTP, job, worker, provider and structured logs; invalid direct values are replaced and never influence auth/idempotency.
- [ ] Structured logs contain the exact NFR-006 base schema; secret/body scans are zero and evidence is searchable within 5 minutes.
- [ ] Alerts do not fire at exact strict boundaries; they fire for oldest job `>60s` sustained 5m, dead jobs `>0`, retention lag `>48h`, error rate `>5%` sustained 5m and any active-count invariant mismatch.
- [ ] Offline queue size 100 is accepted; the 101st envelope is dropped with overflow metric; an item at `23h59m59s` retries, while items aged `>=24h` expire with drop metric and never roll back business data.
- [ ] Every accepted envelope contains required app/build/session/masked-user/device/OS/browser/viewport/network context and at most the latest 10 redacted breadcrumbs; `sendDefaultPii=false`, secret/body/email/phone scans are zero, and approved error plus LCP/INP/CLS signals emit.
- [ ] Promotion blocks without verified source-map upload; after upload, maps are absent from the public bundle and upload credentials are absent from runtime/browser configuration.
- [ ] Exporter failure uses bounded buffer/drop metrics, raises its alert within 5 minutes and never rolls back business data.
- [ ] Audit remains append-only, online 6 months and retained 12 months.

**Test Data**: `catalog=valid,missing_metadata,duplicate,status_drift,deprecated_alias,secret,stale; api=017,018,019,020,protected_inherited; retry_after=missing,non_integer,0,1,86400,86401,unequal,equal; status_forbidden_retry=400,401,403,404,409,422,500; status_required_retry=429,503; endpoint_rule=api019_no_key,api020_304_no_decrypt; generation=twice,check; isolation=unique_temp_input_and_outputs; canonical_hash=before_equals_after; request_id=missing,valid64,overlength65,malformed,duplicate; trace_id=trusted,untrusted; propagation=response,http,job,worker,provider,log; searchable<=5m; alert=job_age_60,job_age_gt60_5m,dead_0_1,retention_48_gt48,error_5_gt5_5m,active_match_mismatch; queue=100,101; age=23h59m59s,24h,24h+1s; breadcrumbs=10,11; context=complete,missing; source_map=verified,missing; audit=online6m,retained12m; synthetic=true; reset=required`

<!-- ID: TC-071 -->
<!-- VERIFIES: NFR-007 -->
### TC-071: [NFR-007][BVA+ST] Retention, 200 KiB payload and exact 10-second Undo boundaries `[planned-automated]` `P0`

**Area**: RETENTION
**Traceability**: NFR-007, FR-003, FR-010, FR-011
**Design states referenced**: N/A — non-UI architecture obligation
**API / NFR refs**: API-005/006/015; SEQ-005/006
**Manual / Auto boundary**: automated
**Test Level**: integration
**Test Type**: SIT
**Export target**: sit
**Smoke**: N
**Environment**: Local Docker Compose and CI
**Data needs**: Synthetic deterministic fixtures; isolated ephemeral schema; no production PII.
**Teardown / reset**: Reset fixture schema, fake dependency state and controllable clock after the case.
**Depends on**: —
**Automation intent**: Auto=Y; future repo suite in the Plan-owned test delta using Architecture-approved frameworks and contracts.
**External QA handoff needs**: N/A — no external QA in sprint v1.
**Owner of execution context**: khanh-pham; local execution and CI evidence retained in repository artifacts.

**Given**:
- Controllable clock; artifacts at 29d23:59:59, 30d, >30d; masked payloads 204799/204800/204801 bytes; API tombstone.

**When**:
- Run cleanup batches and Undo at 9.999s, 10.000s and 10.001s.

**Then**:
- [ ] Exact 30-day records remain and older records delete in batches <=5,000.
- [ ] Payload <=204800 persists fully; 204801 persists bounded prefix/digest/count with truncated=true.
- [ ] Only server-authorized within-window Undo restores same identity; dependent workflows remain DISABLED.

**Test Data**: `synthetic=true; isolation=ephemeral; reset=required`

<!-- ID: TC-072 -->
<!-- VERIFIES: NFR-008 -->
### TC-072: [NFR-008][Accessibility+Regression] Nine screens expose every approved state, copy, CTA, exit and viewport behavior `[planned-automated]` `P0`

**Area**: A11Y
**Traceability**: NFR-008, FR-001–012
**Design states referenced**: SCREEN-001–009 and DS-COMP-001–012 all state identifiers below, including SCREEN-009/MSG-046/047/048 callback recovery
**API / NFR refs**: SCREEN-001–009; DS-COMP-001–012; API-017/018/024; NFR-008
**Manual / Auto boundary**: automated DS-COMP-012 state/action/screenshots plus manual visual/keyboard/screen-reader judgment; axe/Playwright supplies supporting evidence
**Test Level**: e2e
**Test Type**: Accessibility
**Export target**: functional
**Smoke**: N
**Environment**: Playwright Chromium/Firefox versions resolved from the repository lockfile and immutable CI Playwright image digest owned by TG-24/TG-28; record both browser versions and image digest in the evidence manifest; physical widths 1279/1280/1440 at 100% and 200% zoom
**Data needs**: Plan TG-24 browser fixtures (`tests/e2e/api-lab-workflow/**`, `frontend/tests/integration/**`) supply scenario state; TG-28 harnesses (`tests/accessibility/**`, `tests/e2e/viewport/**`) execute accessibility/viewport observations; TG-22 supplies deterministic `scripts/{seed,reset}.*`; synthetic data only.
**Teardown / reset**: After every scenario, invoke the TG-22 `scripts/reset.*` contract and TG-24/TG-28 browser-harness reset, restore viewport/zoom/focus, then assert no pending mock, execution, tombstone or dirty fixture remains.
**Depends on**: Plan TG-24 browser integration baseline; TG-28 accessibility/viewport harness; TG-22 deterministic seed/reset contract.
**Automation intent**: Auto=Y for DS-COMP-012 state/action/screenshots; remaining cross-component human judgment stays manual. TG-28 links axe, screenshots and focus-event evidence while consuming TG-24/TG-02C browser fixtures and TG-22 reset.
**External QA handoff needs**: N/A — no external QA in sprint v1.
**Owner of execution context**: khanh-pham.

**State matrix**:

| Target | Required exact states / variants | TC mapping and executable observation |
|---|---|---|
| SCREEN-001 | `workspace-empty`, `workspace-loading`, `workspace-ready`, `workspace-error`, Host-blocked, unsupported-width | TC-001–003/044–045/072: exact heading, MSG-001/002/003/022, CTA and exit |
| SCREEN-002 | `environment-empty`, `environment-loading`, `environment-ready`, `environment-error` | TC-004–006/072: create, busy, masked ready, retry/error and exit |
| SCREEN-003 | `api-editor-empty`, `api-editor-loading`, `api-editor-ready`, `api-editor-error` | TC-007–009/072: select/create, busy disabled actions, ready response, retry/run error |
| SCREEN-004 | `workflow-empty`, `workflow-loading`, `workflow-ready-editor`, `workflow-error`, capacity-rejected | TC-010–18/033–43/049–60/072: exact CTA/status/report/recovery |
| SCREEN-005 | `execution-inspector-empty`, `execution-inspector-running`, `execution-inspector-success`, `execution-inspector-failed` | TC-019–24/028–31/072: timeline, attempts, NOT_RUN, failure focus and rerun |
| SCREEN-006 | `impact-empty`, `impact-loading`, `impact-ready`, `impact-error` | TC-025–27/036–40/046–48/052/072: affected count, scan gating, retry/cancel/checklist |
| SCREEN-007 | `history-empty`, `history-loading`, `history-table`, `history-error` | TC-028–31/072: MSG-019/020, filters, pagination, row focus and inspector exit |
| SCREEN-008 | `validation-report-empty`, `validation-report-loading`, `validation-report-ready`, `validation-report-error`, stale | TC-016–18/049–59/072: counts, navigation, severity gates, stale disable and retry |
| SCREEN-009 | `auth-login-entry`, `auth-callback-processing`, `auth-callback-recovery`, `auth-callback-invalid` plus DS-COMP-012 branch hooks | TC-065/072: public auth-shell landmark, no protected content, callback focus/live status, safe action and deterministic exit |
| DS-COMP-001 `api-lab-workspace-shell` | normal/tree-collapsed/zoom-compact/drawer-open/inspector-open/capacity-rejected/unsupported-device; default/loading-context/Host-blocked/zoom-compact/capacity-rejected/unsupported-device | TC-001–003/044–45/060/072: landmark/tab order, panel/viewport and blocked action |
| DS-COMP-002 `resource-tree` | collection/folder/API/workflow/selected/expanded/disabled/search-result; empty/loading-skeleton/populated/load-or-mutation-error | TC-003/025–26/046–48/072: tree role/level/selection, keyboard/context action and full path |
| DS-COMP-003 `request-response-split-pane` | request-only/split/response-empty/response-success/response-error; empty/loading/populated/error | TC-007–009/072: named regions, separator keyboard resize and masked response |
| DS-COMP-004 `environment-selector` | selected/loading/missing-required-value/disabled-by-Host; default/expanded/loading/error/disabled | TC-002/004–006/072: combobox selection/error description and dirty guard |
| DS-COMP-005 `workflow-step-list` | DRAFT/READY/DISABLED; step valid/warning/error/running/success/failed/not-run/edit-conflict; empty/loading/populated/validation-error | TC-010–24/033–43/049–60/072: ordered semantics, reorder announcement and status text |
| DS-COMP-006 `variable-browser` | prior-step/Environment/Workflow/searchable/no-response-data; empty/loading-tree/populated/source-error | TC-013–15/035/072: source filtering, keyboard insert, MSG-017 and error |
| DS-COMP-007 `execution-inspector` | standalone/workflow; PENDING/RUNNING/SUCCEEDED/FAILED; compact/full; empty/running/success/failed | TC-019–24/028–31/072: live status, failed-step focus and evidence tabs |
| DS-COMP-008 `workflow-recovery-panel` | impact-preview/disabled-recovery/Host-recovered/validation-failed/ready-to-enable; empty-impact/loading-scan/populated-checklist/scan-or-validation-error | TC-025–27/036–40/046–59/072: ordered checklist, modal focus and Enable gate |
| DS-COMP-009 `sensitive-value-{path_hash}` | masked/visible-unconfigured/credential-masked/config-warning; loading-placeholder/masked/visible/path-error | TC-006–009/019/028/032/068/072: no reveal/copy/secret DOM and exact warning |
| DS-COMP-010 `workflow-validation-report` | empty/validating/passed-only/warnings/errors/stale/load-error; empty/loading/populated/error/stale-after-edit | TC-016–18/049–59/072: live counts, finding links and Error/Warning gates |
| DS-COMP-011 `workflow-variable-editor` | empty/loading/populated/load-error; row default/focus/invalid/dirty; `workflow-variables-empty`, `workflow-variables-loading`, `workflow-variables-ready`, `workflow-variables-error` | TC-004–006/017/033/051/058/072: MSG-042/043/045, dirty state and focus |

**Plan-owned scenario execution matrix**:

| Target | Scenario keys | Trigger fixture | Required observation | Reset / evidence |
|---|---|---|---|---|
| SCREEN-001 | `screen-001.workspace-empty/loading/ready/error/host-blocked/unsupported-width` | `TG-24 browser fixture + TG-28 harness load(key)`: empty/pending/data/error + Host state + 1279px | hook, MSG-001/002/003/022, CTA, exit | `TG-22 reset + TG-24/TG-28 harness reset`; `TC-072/{key}/{browser}/{width}/{zoom}.{png,axe.json,focus.log}` |
| SCREEN-002 | `screen-002.environment-empty/loading/ready/error` | `TG-24 browser fixture + TG-28 harness load(key)`: empty/pending/data/error | heading, masked credential, CTA, exit | `TG-22 reset + TG-24/TG-28 harness reset`; `TC-072/{key}/{browser}/{width}/{zoom}.{png,axe.json,focus.log}` |
| SCREEN-003 | `screen-003.api-editor-empty/loading/ready/error` | `TG-24 browser fixture + TG-28 harness load(key)`: selection/pending/success/error | Save/Run gate, response/error, exit | `TG-22 reset + TG-24/TG-28 harness reset`; `TC-072/{key}/{browser}/{width}/{zoom}.{png,axe.json,focus.log}` |
| SCREEN-004 | `screen-004.workflow-empty/loading/ready/error/capacity-rejected` | `TG-24 browser fixture + TG-28 harness load(key)`: workflow/state/capacity | status, issue CTA, capacity, exit | `TG-22 reset + TG-24/TG-28 harness reset`; `TC-072/{key}/{browser}/{width}/{zoom}.{png,axe.json,focus.log}` |
| SCREEN-005 | `screen-005.execution-empty/running/success/failed` | `TG-24 browser fixture + TG-28 harness load(key)`: execution timeline | attempts, NOT_RUN, failure focus, rerun | `TG-22 reset + TG-24/TG-28 harness reset`; `TC-072/{key}/{browser}/{width}/{zoom}.{png,axe.json,focus.log}` |
| SCREEN-006 | `screen-006.impact-empty/loading/ready/error` | `TG-24 browser fixture + TG-28 harness load(key)`: dependency scan | affected count, confirm gate, retry/cancel | `TG-22 reset + TG-24/TG-28 harness reset`; `TC-072/{key}/{browser}/{width}/{zoom}.{png,axe.json,focus.log}` |
| SCREEN-007 | `screen-007.history-empty/loading/table/error` | `TG-24 browser fixture + TG-28 harness load(key)`: query + URL state | MSG-019/020, filters/page/focus/exit | `TG-22 reset + TG-24/TG-28 harness reset`; `TC-072/{key}/{browser}/{width}/{zoom}.{png,axe.json,focus.log}` |
| SCREEN-008 | `screen-008.validation-empty/loading/ready/error/stale` | `TG-24 browser fixture + TG-28 harness load(key)`: report + revision | counts, links, gates, retry | `TG-22 reset + TG-24/TG-28 harness reset`; `TC-072/{key}/{browser}/{width}/{zoom}.{png,axe.json,focus.log}` |
| SCREEN-009 | `screen-009.login-entry/callback-processing/recovery/invalid` | `TG-02C callback fixture + Playwright load(key)`: public route with valid/missing callback values and recovery envelopes | one public main/heading; no protected landmark/content; focus/live announcement; safe CTA/exit | reset callback/retry/router state; `TC-072/{key}/{browser}/{width}/{zoom}.{png,axe.json,focus.log}` |
| DS-COMP-001 | `comp-001.normal/tree-collapsed/zoom-compact/drawer-open/inspector-open/capacity-rejected/unsupported-device/loading/host-blocked` | `TG-24 browser fixture + TG-28 harness load(key)`: mount by key | shell hook, landmarks, tab order, blocked action | `TG-22 reset + TG-24/TG-28 harness reset`; `TC-072/{key}/{browser}/{width}/{zoom}.{png,axe.json,focus.log}` |
| DS-COMP-002 | `comp-002.empty/loading/populated/error/selected/expanded/disabled/search-result` | `TG-24 browser fixture + TG-28 harness load(key)`: mount by key | tree roles, selection, keyboard, path | `TG-22 reset + TG-24/TG-28 harness reset`; `TC-072/{key}/{browser}/{width}/{zoom}.{png,axe.json,focus.log}` |
| DS-COMP-003 | `comp-003.request-only/split/response-empty/response-success/response-error/loading` | `TG-24 browser fixture + TG-28 harness load(key)`: mount by key | regions, separator resize, masking | `TG-22 reset + TG-24/TG-28 harness reset`; `TC-072/{key}/{browser}/{width}/{zoom}.{png,axe.json,focus.log}` |
| DS-COMP-004 | `comp-004.default/expanded/loading/error/disabled/missing-required` | `TG-24 browser fixture + TG-28 harness load(key)`: mount by key | combobox, error description, dirty guard | `TG-22 reset + TG-24/TG-28 harness reset`; `TC-072/{key}/{browser}/{width}/{zoom}.{png,axe.json,focus.log}` |
| DS-COMP-005 | `comp-005.draft/ready/disabled/step-valid/step-warning/step-error/step-running/step-success/step-failed/step-not-run/edit-conflict/empty/loading` | `TG-24 browser fixture + TG-28 harness load(key)`: mount by key | ordered semantics, reorder, status | `TG-22 reset + TG-24/TG-28 harness reset`; `TC-072/{key}/{browser}/{width}/{zoom}.{png,axe.json,focus.log}` |
| DS-COMP-006 | `comp-006.prior-step/environment/workflow/search/no-response/empty/loading/error` | `TG-24 browser fixture + TG-28 harness load(key)`: mount by key | source filter, keyboard insert, MSG-017 | `TG-22 reset + TG-24/TG-28 harness reset`; `TC-072/{key}/{browser}/{width}/{zoom}.{png,axe.json,focus.log}` |
| DS-COMP-007 | `comp-007.standalone/workflow/pending/running/succeeded/failed/compact/full/empty` | `TG-24 browser fixture + TG-28 harness load(key)`: mount by key | live status, failure focus, tabs | `TG-22 reset + TG-24/TG-28 harness reset`; `TC-072/{key}/{browser}/{width}/{zoom}.{png,axe.json,focus.log}` |
| DS-COMP-008 | `comp-008.impact-preview/disabled-recovery/host-recovered/validation-failed/ready-to-enable/empty/loading/error` | `TG-24 browser fixture + TG-28 harness load(key)`: mount by key | checklist, modal focus, Enable gate | `TG-22 reset + TG-24/TG-28 harness reset`; `TC-072/{key}/{browser}/{width}/{zoom}.{png,axe.json,focus.log}` |
| DS-COMP-009 | `comp-009.masked/visible-unconfigured/credential-masked/config-warning/loading/path-error` | `TG-24 browser fixture + TG-28 harness load(key)`: mount by key | no reveal/copy/secret DOM, label | `TG-22 reset + TG-24/TG-28 harness reset`; `TC-072/{key}/{browser}/{width}/{zoom}.{png,axe.json,focus.log}` |
| DS-COMP-010 | `comp-010.empty/validating/passed/warnings/errors/stale/load-error` | `TG-24 browser fixture + TG-28 harness load(key)`: mount by key | live counts, finding links, severity gates | `TG-22 reset + TG-24/TG-28 harness reset`; `TC-072/{key}/{browser}/{width}/{zoom}.{png,axe.json,focus.log}` |
| DS-COMP-011 | `comp-011.empty/loading/ready/error/row-default/row-focus/row-invalid/row-dirty` | `TG-24 browser fixture + TG-28 harness load(key)`: mount by key | MSG-042/043/045, dirty/focus/exit | `TG-22 reset + TG-24/TG-28 harness reset`; `TC-072/{key}/{browser}/{width}/{zoom}.{png,axe.json,focus.log}` |
| DS-COMP-012 | `comp-012.pre-wait/pre-ready/pre-exhausted/post-wait/post-ready/navigation-error/invalid-contract` | `TG-02C callback recovery fixture + Playwright load(key)`: inject valid or malformed API-018 envelope/header and controllable countdown | MSG-046/047/048; stable hook; Retry-After-1/0; heading focus/live announcement; exhausted clear-to-login performs zero network request and clears callback/retry/error state; only the safe action | reset retry counter/timer/location after each key; `TC-072/{key}/{browser}/{width}/{zoom}.{png,axe.json,focus.log}` |

**Given**:
- TG-24 browser fixtures and the TG-28 accessibility/viewport harness expose every scenario key below; each key resolves independently and records fixture revision, invoking control and expected focus target.
- Baseline provider/database counters are zero; browsers are Chromium/Firefox at widths 1279/1280/1440 and zoom 100%/200%.
- DS-COMP-012 fixtures expose body/header-matched positive Retry-After values with either no recovery action (pre-claim) or `RESTART_LOGIN` (post-claim), malformed/mismatched metadata, and a forced fresh-navigation failure; callback-attempt and API-017-navigation spies begin at zero.

**When**:
- For each key call `TG-24 browser fixture + TG-28 harness load(key)`, assert its stable hook, exercise CTA/exit, run axe, keyboard-only and screen-reader checks, and capture the prescribed evidence.
- Execute viewport variants; after each scenario call `TG-22 reset + TG-24/TG-28 harness reset` and verify reset invariants before loading the next key.

**Then**:
- [ ] All 21 target rows and every scenario key execute independently; no row relies on prior state.
- [ ] Pre-claim Waiting/Ready show MSG-047 and exact hooks, keep retry disabled through `Retry-After-1`, enable at 0 and permit exactly one same-API-018 attempt; a second failure renders Exhausted with only `Quay lại đăng nhập`. Activating it performs zero API-017/API-018 requests, clears retained callback URL/retry counter/countdown/error, and reveals ordinary `Đăng nhập với Central IAM`; the next explicit normal-login activation calls API-017 with fixed `returnTo=/`, ignores the prior route query and sends no callback code/state.
- [ ] Post-claim Waiting/Ready show MSG-046 and exact hooks, keep fresh login disabled through `Retry-After-1`, enable at 0, start exactly one fresh API-017 with `returnTo=/` and record zero API-018 resubmissions; forced navigation failure renders `auth-restart-error` and retries only API-017 with the same fixed landing path.
- [ ] Missing/non-integer/out-of-range/mismatched retry metadata or unknown `recovery_action` on API-018 renders MSG-048 at `auth-callback-recovery-invalid`, retains no callback URL/countdown, performs zero API-018 retries and starts one fresh API-017 with `returnTo=/` per explicit CTA activation; a failed activation remains `auth-callback-recovery-invalid` and never renders the post-claim-only `auth-restart-error`. A valid-looking `RESTART_LOGIN` on a non-API-018 503 triggers no recovery navigation.
- [ ] Each recovery state focuses/announces its heading and countdown without focus theft; screenshot, axe JSON and focus log exist for all seven `comp-012.*` keys.
- [ ] Every identifier renders exact Design heading/subtext/CTA and only its documented exit.
- [ ] No critical axe violation; WCAG 2.2 AA contrast/semantics/focus, live announcements and focus return pass.
- [ ] At 1279 editor/Run are absent and MSG-022 present; at ≥1280/200% Save/Run/Validate remain keyboard reachable.
- [ ] Each evidence key has screenshot, axe JSON and focus log; ≥5% pixel difference or material shift blocks.
- [ ] Reset clears mocks/mutations/focus/viewport overrides and baseline counters return to zero.

**Test Data**:
- `fixture_source=TG-24 tests/e2e/api-lab-workflow/** + frontend/tests/integration/**; harness=TG-28 tests/accessibility/** + tests/e2e/viewport/**; reset=TG-22 scripts/reset.* + browser-harness reset; screens=9; components=12; target_rows=21; browsers=Chromium,Firefox; widths=1279,1280,1440; zoom=100%,200%; synthetic=true`
- `evidence_owner=TG-28; evidence_root=docs/evidence/accessibility/**; evidence_template=TC-072/{scenario_key}/{browser}/{width}/{zoom}.{png,axe.json,focus.log}; evidence_manifest=TC-072/manifest.json`
- `browser_version_source=repository Playwright lockfile; runtime_source=immutable CI Playwright image digest; manifest_fields=chromium_version,firefox_version,image_digest; update_trigger=lockfile_or_image_digest_change`

<!-- ID: TC-073 -->
<!-- VERIFIES: NFR-008 -->
### TC-073: [NFR-008][Performance+Regression] Coverage, production bundle, web vitals, cache and localization gates `[planned-automated]` `P0`

**Area**: QUALITY
**Traceability**: NFR-008
**Design states referenced**: N/A — non-UI architecture obligation
**API / NFR refs**: PR-007/008; NFR-008
**Manual / Auto boundary**: automated
**Test Level**: integration
**Test Type**: Non-Functional
**Export target**: functional
**Smoke**: N
**Environment**: Local Docker Compose and CI
**Data needs**: Synthetic deterministic fixtures; isolated ephemeral schema; no production PII.
**Teardown / reset**: Reset fixture schema, fake dependency state and controllable clock after the case.
**Depends on**: —
**Automation intent**: Auto=Y; future repo suite in the Plan-owned test delta using Architecture-approved frameworks and contracts.
**External QA handoff needs**: N/A — no external QA in sprint v1.
**Owner of execution context**: khanh-pham; local execution and CI evidence retained in repository artifacts.

**Given**:
- Production build, coverage reports, fixed mobile-4G profile, pseudolocale and RTL configuration.

**When**:
- Run CI quality aggregation and scan final CDN artifacts.

**Then**:
- [ ] New business code line and branch coverage are each >=90%.
- [ ] Initial JS <=200KB gzip, CSS <=50KB gzip, LCP p75 <=2.5s, INP <=200ms, CLS <=0.1, Lighthouse >=90.
- [ ] No public source map; HTML/static cache headers and versioned invalidation match NFR; pseudolocale/RTL have no clipped control or untranslated literal.

**Test Data**: `synthetic=true; isolation=ephemeral; reset=required`

<!-- ID: TC-074 -->
<!-- VERIFIES: NFR-009 -->
### TC-074: [NFR-009][Regression] Cost tags, idle TTL, showback and right-sizing evidence are complete `[planned-automated]` `P0`

**Area**: FINOPS
**Traceability**: NFR-009
**Design states referenced**: N/A — non-UI architecture obligation
**API / NFR refs**: NFR-009; PLAN-DEP-001
**Manual / Auto boundary**: automated
**Test Level**: integration
**Test Type**: Non-Functional
**Export target**: functional
**Smoke**: N
**Environment**: Local Docker Compose and CI
**Data needs**: Synthetic deterministic fixtures; isolated ephemeral schema; no production PII.
**Teardown / reset**: Reset fixture schema, fake dependency state and controllable clock after the case.
**Depends on**: —
**Automation intent**: Auto=Y; future repo suite in the Plan-owned test delta using Architecture-approved frameworks and contracts.
**External QA handoff needs**: N/A — no external QA in sprint v1.
**Owner of execution context**: khanh-pham; local execution and CI evidence retained in repository artifacts.

**Given**:
- Reference IaC plans containing complete and intentionally missing tag sets plus idle resources at 23h59m/24h/24h01m.

**When**:
- Run policy-as-code, daily idle scan and monthly review evidence check.

**Then**:
- [ ] Missing any cost_center/business_unit/product/environment/owner tag blocks plan.
- [ ] Unapproved idle resource older than 24h is reported, safely removed and audited.
- [ ] Monthly decision and shared-service showback evidence exist; v1 chargeback remains explicitly N/A.

**Test Data**: `synthetic=true; isolation=ephemeral; reset=required`

<!-- ID: TC-076 -->
<!-- VERIFIES: RISK-OPEN-001 -->
### TC-076: [FLOW-002][SIT] [RISK-OPEN-001][Performance] Same-task AS-IS baseline and Workflow evidence prove the Product time and copy/paste KPIs `[planned-manual]` `P0`

<!-- TC-076-PROTOCOL-BEGIN tc076-v1 -->
**TC-076 Protocol Contract — revision `tc076-v1`**

**Protocol source:** this marked subsection inside the mergeable `TC-076` anchor. TG-24 records its canonical SHA-256 before the first attempt. Any content change requires a governed Product/Test change and a new protocol revision.

**Canonical protocol digest:** read the repository file as raw bytes; locate the unique ASCII marker lines `<!-- TC-076-PROTOCOL-BEGIN tc076-v1 -->\n` and `<!-- TC-076-PROTOCOL-END tc076-v1 -->\n`; hash with SHA-256 exactly the byte slice after the LF terminating the BEGIN marker through the LF immediately before the END marker, excluding both marker lines. The slice must be valid UTF-8, contain LF (`0x0A`) line endings only, contain no CR (`0x0D`), and end in exactly one LF. TG-24, TG-27 and TG-30 independently apply this algorithm and require identical lowercase 64-character hex digests; marker absence/duplication, invalid encoding/newlines or digest mismatch yields `KPI_INCONCLUSIVE`.

**Deterministic provider-stub fixture:** these are local target-provider endpoints seeded by TG-22, not new product APIs.

| Order | Saved API definition | Exact request | Exact successful response |
|---:|---|---|---|
| 1 | `KPI Customer Lookup` | `GET /kpi-fixtures/customers/CUST-001` | HTTP 200 `{"data":{"customer_id":"CUST-001","segment":"STANDARD"}}` |
| 2 | `KPI Order Create` | `POST /kpi-fixtures/orders` with JSON `{"customer_id":"CUST-001","sku":"SKU-001","quantity":1}` | HTTP 201 `{"data":{"order_id":"ORD-001","customer_id":"CUST-001","status":"CREATED"}}` |
| 3 | `KPI Order Confirm` | `POST /kpi-fixtures/orders/confirm` with JSON `{"order_id":"ORD-001","confirm":true}` | HTTP 200 `{"data":{"order_id":"ORD-001","status":"CONFIRMED"}}` |

**AS-IS allowed actions:** start from the seeded three saved APIs and no Workflow; run API 1, copy/paste `data.customer_id` into API 2 `customer_id`, run API 2, copy/paste `data.order_id` into API 3 `order_id`, then run API 3. Constants may be typed, but dynamic output values must use the observed clipboard transfer; scripts, variables, autocomplete carrying response values, prefilled dynamic values and another person's assistance are prohibited. One paste of a prior API output into a later API input is one copy/paste event; clipboard content is never recorded.

**Workflow allowed actions:** after reset, create a new three-Step Workflow from the same saved APIs; map Step 1 `data.customer_id` to Step 2 `customer_id` and Step 2 `data.order_id` to Step 3 `order_id`; validate and run. Constants may be typed. Pasting any prior response value, using a prebuilt Workflow or modifying provider fixtures is prohibited. The final accepted output is exactly the API 3 response above.

**Environment and device identity:** Local Docker Compose release-candidate digest, TG-22 seed revision, OS name/version, CPU architecture, physical screen width/height, device-pixel ratio, browser name/version, browser-profile revision and timezone `UTC` are captured. AS-IS and Workflow runs must match every field. Provider health warm-up occurs once before measurement without exposing fixture outputs; then TG-22 reset establishes the initial seed.

**Attempt, timing and reset:** attempts are single-threaded. Before AS-IS starts, TG-24 allocates the next non-reusable integer and `evidence_set_id=tc076-v1-a{attempt_sequence:04d}`. AS-IS start is the first click that runs API 1; AS-IS end is receipt of the exact API 3 success. Reset reseeds provider state, removes any Workflow/Execution created by the attempt, clears clipboard/browser state and rechecks seed/device identity. Workflow canonical start is `ENT-007 workflows.created_at` for the new Workflow; canonical end is the smallest `(ENT-011 executions.finished_at, executions.id)` with the same workflow ID, `execution_type=WORKFLOW`, `status=SUCCEEDED` and non-null `finished_at`. Both are UTC `DATETIME(3)`; calculate with millisecond precision.

**Predeclared exclusion and rerun rules:** the observer assigns `attempt_status=VALID|EXCLUDED` and an enum before KPI calculation. `EXCLUDED` requires exactly one of `RUNTIME_OR_PROVIDER_OUTAGE`, `WRONG_SEED_OR_EXPECTED_OUTPUT`, `DEVICE_OR_PROTOCOL_MISMATCH`, `OBSERVER_OR_TIMER_FAILURE`, `UNPLANNED_EXTERNAL_INTERRUPTION`, `DISALLOWED_ASSISTANCE_OR_AUTOMATION`, `SENSITIVE_CAPTURE`, or `RESET_FAILURE`, plus a note. A Product/application failure under the correct healthy fixture is not excludable and remains a valid failed KPI attempt. Excluded/incomplete attempts may rerun with the next sequence. A valid `PASSED` or `FAILED` decision is terminal for `tc076-v1`; any later same-revision attempt is unauthorized and becomes `KPI_INCONCLUSIVE`.

**Evidence selection:** the same evidence-set ID appears under the TG-24, TG-27 and TG-30 owner roots. The gate selects the greatest numeric sequence found across their union, not filesystem modification time. TG-30 atomically publishes `docs/evidence/release/TC-076/current.json`; it must match the independent scan. Duplicate/reused/malformed sequence, unknown protocol, orphan/correlation/hash/selector mismatch is blocking; a newest observation without decision is `PENDING`; older `PASSED` never overrides a newer state.
<!-- TC-076-PROTOCOL-END tc076-v1 -->

---
**Area**: PRODUCT_KPI
**Traceability**: Product §3.1 Goals & Success Metrics; RISK-OPEN-001; FR-004–010; US-003–008
**Design states referenced**: SCREEN-003–005 and SCREEN-007; exact visual-state observation remains owned by TC-072
**API / NFR refs**: API-007–016; FLOW-002; ENT-007 `workflows.id/created_at`; ENT-011 `executions.id/workflow_id/execution_type/status/finished_at`; NFR-006; PR-004/005/007
**Manual / Auto boundary**: manual same-pilot observation/counting under the TC-076 Protocol Contract revision `tc076-v1`; automated canonical-field extraction, correlation, hashing, greatest-sequence selection and formula calculation; the observer may apply only the predeclared exclusion enum before calculation
**Test Level**: e2e
**Test Type**: SIT
**Export target**: sit
**Smoke**: N
**Environment**: Local Docker Compose release candidate and device identity exactly as frozen in the TC-076 Protocol Contract revision `tc076-v1`; same captured identity for both modes
**Data needs**: Exact `CUST-001`/`SKU-001`/`ORD-001` provider fixture, three requests/responses, allowed actions, expected final output and protocol source/hash from the TC-076 Protocol Contract revision `tc076-v1`; pilot `khanh-pham`; no real credential/PII or payload/clipboard content in evidence.
**Teardown / reset**: Execute the protocol reset between modes and after the attempt; retain only redacted metadata/counts/hashes/status/reason artifacts, verify no sensitive value, and never delete orphan evidence used by the gate.
**Depends on**: TG-22 runtime/seed/reset; TG-24 writes `docs/evidence/kpi/TC-076/sets/{evidence_set_id}/observation.json`; TG-27 starts only after TG-23 and TG-24, then writes `docs/evidence/observability/TC-076/sets/{evidence_set_id}/telemetry-correlation.json`; TG-30 writes `docs/evidence/release/TC-076/sets/{evidence_set_id}/decision.json` and atomic `current.json` after all declared prerequisites.
**Automation intent**: Auto=N for human task observation; Implement may automate timestamp/counter extraction and KPI calculation but may not synthesize baseline/result values.
**External QA handoff needs**: N/A — personal-project pilot; independent external study is required if scope later includes external/commercial users.
**Owner of execution context**: khanh-pham as Product Owner and named personal-project pilot; AI may aggregate evidence but cannot attest the observation.

**Given**:
- Protocol `tc076-v1`, its canonical marker-delimited SHA-256, next attempt sequence, pilot/device identity, exact three requests/responses, allowed actions and exclusion enum from the TC-076 Protocol Contract are frozen before either run; TG-24/TG-27/TG-30 independently reproduce the digest with the specified raw-byte algorithm.
- Provider health/warm-up and initial reset pass; AS-IS starts at the first API-1 Run and ends at exact API-3 success. Workflow time uses canonical ENT-007 creation to the first matching ENT-011 success.
- A copy/paste event is one user-initiated transfer of an API output value into a later API input. The baseline count must be an observed integer >0; clipboard content is never recorded.

**When**:
- The same pilot executes the exact AS-IS allowed actions, the protocol reset, then the exact Workflow allowed actions; observer records status/reason before calculation.
- TG-27 correlates the observation with canonical ENT-007/011 fields and NFR-006 telemetry. TG-30 scans the union of evidence roots, verifies `current.json`, and calculates `elapsed_seconds=(finished_at-created_at)/1000` plus `reduction_pct=((baseline_copy_paste-workflow_copy_paste)/baseline_copy_paste)*100`.

**Then**:
- [ ] Observation includes unique sequence/set ID, exact protocol source/hash, fixture/device fields, `VALID|EXCLUDED`, exclusion enum/note, non-null AS-IS timestamps, Workflow/Execution IDs and integer counts without sensitive payload.
- [ ] Correlation selects `ENT-007.created_at` and the smallest matching successful `(ENT-011.finished_at, ENT-011.id)` using UTC millisecond precision; tracking ID/status/timestamp mismatch yields `KPI_INCONCLUSIVE`.
- [ ] Missing evidence, baseline copy/paste <=0, task/cohort/protocol/device mismatch, an `EXCLUDED`/invalid/incomplete attempt or telemetry mismatch yields `KPI_INCONCLUSIVE`; a `VALID` non-excluded attempt with complete matching evidence that misses either KPI yields `FAILED`; only a `VALID` attempt meeting both targets yields `PASSED`.
- [ ] Workflow elapsed time from creation to first successful three-Step Execution is <=10 minutes.
- [ ] Copy/paste reduction is >=80% using the observed AS-IS denominator; the report records baseline count, Workflow count, formula result and linked redacted evidence.
- [ ] TG-30 emits immutable decision plus atomic `current.json`; selector equals the greatest `tc076-v1` sequence across all roots and all paths/hashes/set IDs match. `PASSED` requires every check and target; valid miss is `FAILED`; invalid/incomplete/mismatch is `KPI_INCONCLUSIVE`; newest observation without decision is `PENDING`.

**Test Data**:
- `protocol=tc076-v1#TC-076; protocol_digest=sha256(marker_delimited_utf8_lf_bytes); evidence_set_id=tc076-v1-aNNNN; pilot=khanh-pham; fixture=CUST-001,SKU-001,ORD-001; same_task_device=true; canonical_time=ENT-007.created_at->first_ENT-011.SUCCEEDED.finished_at; baseline_copy_paste=observed_integer_gt_0; workflow_copy_paste=observed_integer_gte_0; time_target_seconds=600.000; reduction_target_percent=80; attempt_status=VALID|EXCLUDED; decision_states=PENDING|PASSED|FAILED|KPI_INCONCLUSIVE; evidence=observation,correlation,decision,current,input_sha256; synthetic=true; reset=required`

---
### SIT Coverage Checklist

| Flow | Happy Path | Contract / Schema | Failure / Timeout | Retry / Idempotency | Rollback / Compensation | Async / Event | Consistency | Compatibility | Notes |
|---|---|---|---|---|---|---|---|---|---|
| Workspace-to-history | TC-075 | TC-061 | TC-062 | TC-060/063 | TC-062/069 | TC-063/064 | TC-060/075 | TC-061 | Full API Lab journey |
| Identity/security routing | TC-065 | TC-061 | TC-062/068 | TC-062/068 | fail-closed/no mutation | audit TC-064 | TC-065 | TC-061 | EXC-AUTH-001 callback/state/PKCE/MFA + lifecycle covered; no external pentest in v1 |
| Retention/recovery | TC-071 | TC-061 | TC-063 | TC-063/071 | TC-063/069 | TC-063 + audit TC-070 | TC-063/069/071 | N/A — internal scheduler | EXC-QUEUE-001 inspect/recovery/slot release; controllable clock |
| Product KPI baseline | TC-076 | TC-076 evidence/decision schemas | `KPI_INCONCLUSIVE` on missing/zero/mismatch | N/A — observation protocol is not retried | N/A — no compensation for an observation | TC-076 telemetry correlation | same pilot/task/browser/device/protocol | N/A — personal-project study | AS-IS → reset → Workflow; TG-30 decides from immutable TG-24/TG-27 inputs |

### Test Case Summary

| Area | Total Cases | Auto Candidates | Manual | Component | Integration | E2E | P0 | P1 | P2 |
|---|---:|---:|---:|---:|---:|---:|---:|---:|---:|
| Functional AC coverage | 59 | 59 | 0 | 0 | 8 | 51 | 59 | 0 | 0 |
| SIT / Architecture obligations + Product KPI | 8 | 7 | 1 | 0 | 7 | 1 | 8 | 0 | 0 |
| NFR / Security / Quality | 9 | 8 | 1 | 0 | 8 | 1 | 9 | 0 | 0 |
| **Total** | **76** | **74** | **2** | **0** | **23** | **53** | **76** | **0** | **0** |
