---
status: APPROVED
base_sprint: v1
change_pack: v1.7.18-api-lab-undo-warning-viewport
source_phase: product
impacted_phases: [product, design]
created: 2026-07-18 13:20
updated: 2026-07-18 13:52
approved_by: khanh-pham
approved_at: 2026-07-18T06:52:37Z
---

# Change Request — v1.7.18-api-lab-undo-warning-viewport

## 1. Summary

Bổ sung ba Product contract cho API Lab Workflow: hoàn tác xóa API trong 10 giây mà không tự bật lại Workflow; Validation Report phân biệt Cảnh báo/Lỗi và cho xác nhận tiếp tục khi chỉ có Cảnh báo; editor hỗ trợ desktop có màn hình từ 1280px, kể cả compact mode/horizontal scroll khi zoom 200%.

## 2. Why This Change Exists

Design validation phát hiện ba hành vi đã được stakeholder chọn nhưng chưa có trong Product APPROVED. Change pack đưa chúng về đúng phase sở hữu trước khi Design được duyệt, tránh để Design tự tạo domain behavior hoặc platform constraint không truy vết.

## 3. Earliest Affected Phase

Product — cập nhật FR/BR/AC về API delete recovery, validation severity và supported desktop viewport.

## 4. Current Downstream Phase

- Product: `APPROVED` — tạo Product delta.
- Design: `DRAFT` — hấp thụ trực tiếp bằng `feedback design` vào proposal hiện tại.
- Architecture: chưa bắt đầu — dừng nhánh tại đây; khi bắt đầu phải đọc effective truth gồm change pack sau khi được duyệt.
- Plan/Test/Implement: chưa bắt đầu.

## 5. Scope Notes

- Undo chỉ có hiệu lực trong state API `DELETED_UNDOABLE` kéo dài 10 giây sau xác nhận xóa, khôi phục cùng API về vị trí cũ; Workflow phụ thuộc vẫn `DISABLED` và bắt buộc `Rà soát → Kiểm tra → Bật workflow`.
- Tất cả điều kiện validation đang là lỗi trong Product tiếp tục là `Lỗi` và chặn Run/Enable theo Validation Severity Decision Table. `Cảnh báo` chỉ áp dụng cho: chưa có response mẫu của source mapping, API đang kế thừa Host timeout, hoặc `sensitive_fields` rỗng. Khi không có Lỗi, người dùng có thể xác nhận để Run/Enable.
- Màn hình desktop có `screen width >= 1280px` được hỗ trợ. Khi zoom 200% hoặc viewport hẹp hơn trên màn hình đủ chuẩn, editor dùng compact mode/horizontal scroll và vẫn chỉnh sửa/chạy được. Màn hình vật lý dưới 1280px không thuộc phạm vi editor v1.
- Không bổ sung mobile/tablet editing, RBAC, Workflow copy hay API restore ngoài cửa sổ Undo.

## 6. Open Questions

Không còn câu hỏi blocker. Architecture phải cụ thể hóa transactional restore/same-ID behavior, validation severity contract và cách xác định supported desktop screen mà không làm mất zoom accessibility.

## Self-Review Checklist

- [x] Quality Contract refs satisfied: `DOC-1`, `DOC-2`, `DOC-3`, `LINK-1`, `LINK-2`, `ORB-1`, `ORB-2`
- [x] Change request identifies base sprint, change pack, source phase, impacted phases, and earliest affected phase
- [x] Dependencies explain what changed, why it matters, downstream impact, and how each impacted phase should validate
- [x] Open questions have owner / next action, or are explicitly accepted as blocker
