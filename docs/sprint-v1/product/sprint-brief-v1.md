---
status: APPROVED
version: v1
sprint: 1
phase: product
task: API_Lab_workflow_orchestration
created: 2026-07-18
updated: 2026-07-18 11:33
approved_by: khanh-pham
---

# Sprint Brief v1 — API Lab Workflow Orchestration

## 1. Product Rationale

API Lab hiện hỗ trợ tổ chức API theo collection và folder, trong khi System Manager quản lý Host. Sprint này kết nối hai vùng chức năng với quan hệ domain bắt buộc `Workspace belongs_to Host`: mỗi API Workspace thuộc đúng một Host, và mỗi Host có một API Workspace. Các environment dùng chung schema biến nhưng có giá trị riêng, và người dùng có thể ghép API thành workflow tuần tự. Mục tiêu là loại bỏ phần lớn thao tác sao chép response của API trước sang request của API sau và tạo một đường kiểm thử tích hợp có thể quan sát, chạy lại và truy vết.

## 2. Scope Summary

- Thiết lập quan hệ bắt buộc `Workspace belongs_to Host`; mỗi Workspace thuộc đúng một Host trong System Manager.
- Quản lý collection, folder và API trong workspace của Host.
- Quản lý nhiều environment với cùng schema biến, giá trị và credential riêng.
- Chạy API độc lập hoặc trong workflow tuần tự tối đa 20 bước.
- Mỗi API step có `step_key` kỹ thuật duy nhất do hệ thống sinh và bất biến; đổi tên API/step không làm đổi key.
- Ánh xạ output JSON của bất kỳ API step đứng trước — không chỉ step liền kề — vào path, query, header hoặc body bằng namespace `${{step_key.variable}}`; hỗ trợ kéo-thả biến để tạo expression, chặn mapping ngược/circular và không overwrite biến âm thầm.
- Cấu hình timeout theo từng API; retry API đang lỗi theo nhóm lỗi được phép và dừng workflow khi hết retry.
- Mask đúng các field/path được khai báo trong cấu hình `sensitive_fields`, không tự suy đoán theo tên.
- Mỗi execution cố định (pin) workflow version và environment snapshot tại thời điểm bắt đầu; mọi thay đổi sau thời điểm này chỉ áp dụng cho execution mới.
- Lưu execution history 30 ngày và hỗ trợ chạy lại bằng latest workflow/environment tại thời điểm rerun.
- Vô hiệu hóa workflow khi API phụ thuộc bị xóa/đổi HTTP method hoặc Host bị xóa/vô hiệu hóa; bật lại Host không tự bật workflow, người dùng phải review, validate rồi enable thủ công.

## 3. Explicit Deferrals

- Parallel execution: `[scheduled v2]`.
- Loop: `[scheduled v2]`.
- Branch, schedule và webhook trigger: post-MVP, chưa lên lịch.
- RBAC chi tiết: ngoài phạm vi v1; mọi người dùng đã đăng nhập có cùng quyền thao tác.

## 4. Reviewer Notes

- KPI target đã được stakeholder chấp nhận nhưng baseline thời gian thao tác hiện tại chưa được đo; xem Open Risk trong PRD proposal.
- Deadline và quy mô team chưa được chốt; xem Open Risk trong PRD proposal.
- Timeout thuộc cấu hình API; API chưa cấu hình kế thừa Host default 30 giây. Retry chỉ áp dụng cho timeout/network/connect, HTTP 408/429/5xx; mapping/config và HTTP 4xx khác không retry.
- `step_key` do hệ thống sinh khi thêm step, duy nhất trong workflow và bất biến; label hiển thị có thể đổi mà expression không đổi.
- Host được bật lại chỉ khôi phục khả năng review; workflow vẫn DISABLED cho tới khi người dùng review, validation sạch và chủ động enable.

## Industry Lens Applied (PROD-5)

- Detected vertical: developer tooling / API management and workflow orchestration
- Detection confidence: high
- Items surfaced: 3 [industry-standard] / 4 [common] / 1 [niche]
- Region-specific items global-only: 0 — none
- Cross-domain tension: no

## 5. Phase Gate

- Product package giữ trạng thái `DRAFT` cho tới khi `validate user story` trả về 0 blocker.
- Approval owner: Product Owner / stakeholder của API Lab và System Manager.
