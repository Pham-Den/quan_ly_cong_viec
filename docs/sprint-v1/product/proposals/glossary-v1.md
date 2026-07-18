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

# Glossary Proposal — Sprint v1

## New

<!-- ID: GLOSS-001 -->
### GLOSS-001: Host
- **Definition:** Cấu hình hệ thống đích trong System Manager; là parent mà API Workspace bắt buộc `belongs_to`, đồng thời cung cấp environment, schema biến và credential.
- **Why it matters:** Là boundary cao nhất của API Lab workflow.
- **Source / Related:** PRD `BR-001`, `BR-006`; FR-001.

<!-- ID: GLOSS-002 -->
### GLOSS-002: API Workspace
- **Definition:** Không gian chứa collection, folder, API và workflow; mỗi API Workspace bắt buộc `belongs_to` đúng một Host và không tồn tại độc lập ngoài Host.
- **Why it matters:** Kết nối System Manager với API Lab.
- **Source / Related:** FR-001, FR-003.

<!-- ID: GLOSS-003 -->
### GLOSS-003: Environment
- **Definition:** Ngữ cảnh chạy thuộc một Host, có giá trị biến và credential riêng nhưng dùng chung schema tên biến với các environment khác; được snapshot bất biến khi execution bắt đầu.
- **Why it matters:** Ngăn trộn dữ liệu DEV/UAT/PROD.
- **Source / Related:** `BR-001`, `BR-002`; FR-002.

<!-- ID: GLOSS-004 -->
### GLOSS-004: Environment Variable Schema
- **Definition:** Tập tên biến canonical dùng giống nhau cho mọi environment trong cùng Host.
- **Why it matters:** Workflow không phải thay mapping khi đổi environment.
- **Source / Related:** `BR-002`; FR-002, FR-007.

<!-- ID: GLOSS-005 -->
### GLOSS-005: Credential
- **Definition:** Giá trị xác thực nhạy cảm thuộc Host environment, được API kế thừa và có path trong cấu hình `sensitive_fields`; hệ thống không tự suy đoán field nhạy cảm ngoài cấu hình.
- **Why it matters:** Bảo vệ secret và thống nhất xác thực theo Host.
- **Source / Related:** `BR-001`; FR-012.

<!-- ID: GLOSS-006 -->
### GLOSS-006: API Step
- **Definition:** Một lần gọi API có `step_key` kỹ thuật duy nhất do hệ thống sinh và bất biến, kèm mapping và retry; đổi API/step label không đổi key, timeout thuộc API được gọi.
- **Why it matters:** Là đơn vị quan sát và xử lý lỗi của execution.
- **Source / Related:** `BR-003`, `BR-004`; FR-008, FR-009.

<!-- ID: GLOSS-007 -->
### GLOSS-007: Workflow
- **Definition:** Chuỗi API step có saved versions; v1 thực thi latest saved version tại thời điểm bắt đầu và cố định version đó trong suốt execution.
- **Why it matters:** Loại bỏ copy/paste giữa các lần gọi API.
- **Source / Related:** `BR-003`; FR-006, FR-008.

<!-- ID: GLOSS-008 -->
### GLOSS-008: Mapping
- **Definition:** Quy tắc lấy biến bằng namespace rõ nguồn: step output `${{step_key.variable}}` (ví dụ `${{step_01.data.customer.id}}`), environment `${{env.variable}}`, workflow `${{workflow.variable}}`. Người dùng có thể nhập expression hoặc kéo-thả field JSON từ bất kỳ step đứng trước; không được tham chiếu step hiện tại/đứng sau, tạo circular mapping hoặc overwrite âm thầm.
- **Why it matters:** Tạo data flow giữa các API mà không thao tác thủ công.
- **Source / Related:** FR-006, FR-007.

<!-- ID: GLOSS-009 -->
### GLOSS-009: Execution
- **Definition:** Một lần chạy workflow cụ thể, cố định workflow version và environment snapshot tại lúc bắt đầu, có record/trạng thái riêng với mọi step.
- **Why it matters:** Bảo đảm truy vết và rerun không sửa lịch sử cũ.
- **Source / Related:** `BR-007`; FR-010.

<!-- ID: GLOSS-010 -->
### GLOSS-010: Disabled Workflow
- **Definition:** Workflow không được phép chạy vì người dùng vô hiệu hóa, Host không ACTIVE, API bị xóa hoặc HTTP method của API phụ thuộc đã đổi. Host hoạt động lại không tự bật workflow; user phải review, validate và enable.
- **Why it matters:** Ngăn execution âm thầm dùng dependency đã mất.
- **Source / Related:** `BR-005`, `BR-006`; FR-011.

## Updated

## Removed

### Self-Review Checklist

- [x] Thuật ngữ cốt lõi có định nghĩa duy nhất và trace cụ thể.
- [x] Dùng nhất quán Host, Environment, Workflow, Step, Execution và Mapping.
