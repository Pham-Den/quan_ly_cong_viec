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

# Market Research Proposal — Sprint v1

## New

<!-- ID: MR-001 -->
### MR-001: Stakeholder evidence for chained API execution

- **Type:** Problem Evidence.
- **Signal / Evidence:** Stakeholder xác nhận `Workspace belongs_to Host`; `step_key` do hệ thống sinh và bất biến; source-qualified mapping từ bất kỳ step đứng trước bằng nhập expression hoặc kéo-thả; chặn circular mapping; retry theo error class; timeout theo API; config-driven masking; pin workflow/environment snapshot; đổi HTTP method làm workflow DISABLED; Host hoạt động lại không auto-enable workflow.
- **Implication for product:** Các contract execution consistency, immutable step namespace, acyclic mapping, dependency invalidation, manual recovery, retry và masking là Must Have; parallel và loop vẫn tách sang v2.
- **Confidence:** Medium — bằng chứng trực tiếp từ stakeholder nhưng chưa có observation study hoặc baseline định lượng.
- **Source / Asset:** Cuộc trao đổi Product ngày 2026-07-18; KPI gap được theo dõi ở `RISK-OPEN-001` trong PRD proposal.

## Updated

## Removed

### Self-Review Checklist

- [x] Claim dựa trên nguồn stakeholder và không giả lập benchmark thị trường.
- [x] Khoảng trống baseline được ghi thành open risk có owner/deadline.
