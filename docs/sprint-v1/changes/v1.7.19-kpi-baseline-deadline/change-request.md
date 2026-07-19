---
status: APPROVED
base_sprint: v1
change_pack: v1.7.19-kpi-baseline-deadline
source_phase: product
impacted_phases: [product, plan, test]
created: 2026-07-19 16:20
updated: 2026-07-19 17:25
approved_by: khanh-pham
approved_at: 2026-07-19T11:00:26Z
---

# Change Request — v1.7.19-kpi-baseline-deadline

## 1. Summary

Chuyển hạn chót xử lý `RISK-OPEN-001` từ trước `approve test` sang trước `approve implement`. Test approval khóa protocol TC-076; Implement phải thu thập evidence thật và chứng minh cả hai KPI trước khi sprint được phép đóng.

## 2. Why This Change Exists

Baseline AS-IS và kết quả Workflow chỉ có thể được đo đáng tin cậy khi runtime cùng test harness đã tồn tại. Yêu cầu evidence trước `approve test` buộc Test tạo dữ liệu trước giai đoạn thực thi hoặc bị chặn bởi một điều kiện không thể hoàn thành. Thay đổi này giữ nguyên KPI và phạm vi chức năng, chỉ đặt evidence gate vào đúng lifecycle stage.

## 3. Earliest Affected Phase

Product — cập nhật deadline, người xác nhận và pass/fail contract của Open Risk `RISK-OPEN-001`.

## 4. Current Downstream Phase

- Product: `APPROVED` — tạo Product delta.
- Design: `APPROVED` — không đổi; không có UX hoặc instrumentation contract mới.
- Architecture: `APPROVED` — không đổi; telemetry events và data flow hiện hữu đủ cho TC-076.
- Plan: `APPROVED` — tạo Plan delta để phân công evidence và hard gate tại TG-30.
- Test: `DRAFT` — hấp thụ trực tiếp deadline/gate vào Test Plan và Test Cases proposal.
- Implement: chưa bắt đầu — khi bắt đầu phải thực thi TC-076 và cung cấp evidence trước `approve implement`.

## 5. Scope Notes

- Pilot cố định là `khanh-pham`.
- Cả hai lượt dùng cùng task `fixed_synthetic_three_api_chain`, cùng browser/device và protocol `tc076-v1` được khóa tại TC-076 Protocol Contract trong `docs/sprint-v1/testing/proposals/test-cases-v1.md`.
- Evidence gồm timestamp bắt đầu/kết thúc, số thao tác copy/paste, Workflow ID, Execution ID và telemetry correlation; mọi payload/credential phải được loại bỏ hoặc che.
- Pass chỉ khi Workflow first success <=10 phút và copy/paste giảm >=80% theo `((baseline-result)/baseline)*100` với baseline >0.
- Thiếu evidence, baseline <=0, lệch pilot/task/protocol hoặc telemetry không khớp tạo `KPI_INCONCLUSIVE` và chặn `approve implement`.
- Mỗi attempt dùng `evidence_set_id=tc076-v1-a{attempt_sequence:04d}` với sequence tăng đơn điệu, không tái sử dụng và không chạy song song. TG-24/TG-27/TG-30 ghi ba artifact versioned trong ownership zone tách biệt; TG-30 atomically cập nhật `docs/evidence/release/TC-076/current.json`.
- Gate chọn sequence lớn nhất của protocol hiện hành qua cả ba evidence roots, không phải “file mới nhất” theo filesystem time. Bản mới hơn luôn supersede bản cũ; selector/hash/orphan sai tạo trạng thái blocking.
- Protocol nằm trong mergeable anchor `TC-076`; digest SHA-256 dùng chính xác raw UTF-8/LF byte slice giữa hai marker BEGIN/END duy nhất, loại marker lines, cấm CR và yêu cầu đúng một terminal LF. TG-24/TG-27/TG-30 phải tái tính độc lập cùng digest.
- Không tạo baseline, result hoặc approval evidence giả; `approve implement` chỉ chấp nhận decision record hợp lệ ở trạng thái `PASSED`.

## 6. Open Questions

Không còn câu hỏi blocker cho change pack. Giá trị baseline/result chỉ được điền trong Implement từ TC-076 evidence thật.

## Self-Review Checklist

- [x] Quality Contract refs satisfied: `DOC-1`, `DOC-2`, `DOC-3`, `LINK-1`, `LINK-2`, `ORB-1`, `ORB-2`
- [x] Earliest affected phase, downstream status and propagation route are explicit
- [x] KPI targets, measurement protocol, evidence boundary and failure behavior are deterministic
- [x] No approval evidence or metric value is fabricated
