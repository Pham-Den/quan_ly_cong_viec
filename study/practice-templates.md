# Mẫu thực hành

Các mẫu này có thể copy vào thư mục học cá nhân bên dưới `study/`. ADR chính thức của sản phẩm vẫn phải theo template và lifecycle PRISM; mẫu ADR ở đây dùng cho luyện tập.

## 1. Weekly Learning Log

```markdown
# Tuần YYYY-Www — Chủ đề

## Mục tiêu
- Sau tuần này tôi phải giải thích/làm được gì?

## Điều đã học
- Khái niệm bằng lời của tôi:
- Vấn đề nó giải quyết:
- Khi nên dùng:
- Khi không nên dùng:

## Liên hệ dự án
- File/diagram/decision đã đọc:
- Điều tôi quan sát được:
- Điều còn là giả thuyết:

## Thực hành và bằng chứng
- Thí nghiệm:
- Expected:
- Actual:
- Test/diagram/measurement:

## Sai lầm hoặc thay đổi nhận thức
- Trước đây tôi nghĩ:
- Bây giờ tôi nghĩ:
- Bằng chứng khiến tôi đổi ý:

## Câu hỏi tuần tới
- ...
```

## 2. Concept Note một trang

```markdown
# [Khái niệm]

## Problem
Khái niệm này ra đời để giải quyết lực/vấn đề nào?

## Mechanism
Nó hoạt động thế nào, không dùng tên framework?

## Trade-offs
- Lợi ích:
- Chi phí:
- Failure modes:

## Decision signals
- Nên cân nhắc khi:
- Không nên dùng khi:

## Project example
- Ví dụ hiện có:
- Ví dụ phản chứng:

## Teach-back
Giải thích trong tối đa 5 câu.
```

## 3. Experiment Report

```markdown
# EXP-NNN — Tên thí nghiệm

## Hypothesis
Nếu ..., thì ..., vì ...

## Scope
- In scope:
- Out of scope:
- Không thay đổi production behavior nếu chưa có PRISM origin/lane.

## Setup
- Baseline:
- Variables:
- Controls:

## Scenarios
| Scenario | Expected | Observed | Evidence |
|---|---|---|---|

## Result
- Hypothesis: supported / rejected / inconclusive
- Điều học được:
- Hạn chế:
- Thí nghiệm tiếp theo:
```

## 4. Learning ADR

```markdown
# LADR-NNN — Quyết định

- Status: Proposed / Accepted / Superseded
- Date:
- Owner:

## Context
- Business/technical problem:
- Constraints:
- Assumptions cần kiểm chứng:
- Quality attributes ưu tiên:

## Options
| Option | Pros | Cons | Risk | Cost | Maintenance | Team capability |
|---|---|---|---|---|---|---|

## Decision
Chọn gì và tại sao trong bối cảnh hiện tại?

## Consequences
- Positive:
- Negative:
- Risk controls:
- Observability/operations:

## Revisit
- Measurable trigger:
- Reversibility cost:
- Rollback/replacement path:

## Evidence
- Source files:
- Tests/measurements:
- Related decisions:
```

## 5. Business Workflow Canvas

```markdown
# Workflow — Tên

## Outcome và actors
- Outcome:
- Primary actor:
- Supporting actors/systems:

## State model
| Current state | Command | Guard | Event | Next state | Failure/Recovery |
|---|---|---|---|---|---|

## Rules và invariants
- INV-01:

## Language
| Term | Meaning in this context | Không có nghĩa là |
|---|---|---|

## Hotspots
- Rule chưa rõ:
- Ownership chưa rõ:
- Exception cần business quyết định:
```

## 6. AI Task Brief

```markdown
# Task outcome
Kết quả quan sát được cần đạt.

## Source of truth
- Requirement/spec/architecture paths:
- Existing public contracts:

## Scope and boundaries
- In scope:
- Out of scope:
- Allowed modules/files:
- Forbidden dependency directions:

## Acceptance criteria
- AC-01:
- AC-02:

## Failure cases
- FC-01:

## Validation
- Tests/commands phải chạy:
- Evidence phải ghi:

## Decision authority
- AI được tự quyết:
- Phải dừng hỏi người:
```

## 7. AI Output Review Record

```markdown
# AI Review — Task/Change

## Traceability
| Requirement/AC | Code surface | Test/evidence | Result |
|---|---|---|---|

## Refutation pass
| Claim của AI | Cách kiểm tra độc lập | Evidence | Kết luận |
|---|---|---|---|

## Review checks
- [ ] Không invent API/library/requirement.
- [ ] Không import internal xuyên module.
- [ ] Transaction và data owner đúng.
- [ ] Failure/rollback/retry/idempotency paths được xét.
- [ ] Test có negative/boundary cases, không chỉ happy path.
- [ ] Không mở rộng scope hoặc thêm abstraction không có driver.
- [ ] Validation command được chạy lại, không tin summary.
- [ ] Remaining risks và assumptions được ghi rõ.

## Decision
- Approve / Request changes / Reject
- Lý do:
- Follow-up:
```

## 8. Quarterly Review

```markdown
# Quarterly Architecture Learning Review — YYYY-QN

## Outcomes
- Năng lực tăng rõ nhất:
- Năng lực chưa tiến bộ:

## Evidence portfolio
| Competency | Artifact | What it proves | Reviewer feedback |
|---|---|---|---|

## Decision quality
- Quyết định tốt nhất và vì sao:
- Quyết định cần làm lại và vì sao:
- Một công nghệ/pattern đã chủ động không dùng:

## AI collaboration
- Lỗi AI lặp lại nhiều nhất:
- Quality gate đã ngăn lỗi nào:
- Prompt/context practice cần đổi:

## Next quarter
- 3 outcomes:
- 1 stretch goal:
- Nội dung chủ động bỏ/hoãn:
```
