# Project Lab — `quan_ly_cong_viec`

## 1. Vì sao dự án này phù hợp

Dự án hiện là TypeScript monorepo gồm Vue frontend, Fastify backend, Prisma/MySQL và test Node/Playwright. Architecture Sprint v1 đã chọn modular monolith với internal ports; TG-01 hiện thực các shared contract đầu tiên. Vì vậy repo có đủ chất liệu để học từ dependency direction đến distributed reliability mà chưa cần đưa microservices vào sớm.

## 2. Bản đồ học từ code hiện có

| Khái niệm | Điểm bắt đầu trong repo | Câu hỏi nghiên cứu |
|---|---|---|
| Public module API | `backend/src/modules/*/index.ts` | Consumer thấy gì; chi tiết nào đang được che? |
| Caller-owned transaction | `backend/src/shared/unit-of-work/unit-of-work.ts` | Vì sao nested transaction bị từ chối; token đi qua module thế nào? |
| Idempotency | `backend/src/modules/execution/application/idempotency/` | Scope, hash, TTL, response replay và atomic rollback là gì? |
| Output port | `ExecutionResponseSchemaReader` | Ai sở hữu interface và adapter nào sẽ implement? |
| Cross-module port | `WorkflowImpactService` | Làm sao phối hợp module mà không import internal? |
| Fail-closed adapter | `ApprovedAddressSetRegistry` | Contract biểu diễn failure thế nào; vì sao không có permissive result? |
| Architecture decision | `docs/sprint-v1/architecture/proposals/adr-v1.md` | Context, alternatives, consequence và revisit trigger có đủ chưa? |
| Data/transaction ownership | `erd-v1.md`, `data-flow-v1.md`, `sequence-v1.md` | Module nào master dữ liệu; mutation nào cần atomic? |
| Delivery planning | `implementation-plan-v1.md` | Boundary, public entrypoint và code ownership được chuyển thành task ra sao? |
| Acceptance evidence | `tg-01-shared-contracts.md` và contract tests | Test có phản bác failure/edge case hay chỉ chạy happy path? |

## 3. Learning backlog theo giai đoạn

Đây là backlog học tập. Mỗi item thay đổi behavior/build chỉ được triển khai sau khi có origin/lane PRISM hợp lệ.

### LAB-01 — Dependency Walk

- Chọn một HTTP request hiện có.
- Vẽ từ frontend call đến Fastify route, business logic, Prisma và response.
- Đánh dấu protocol, policy, orchestration và I/O.
- Ghi ba coupling đang tồn tại và loại coupling tương ứng.

**Evidence:** diagram + một trang nhận xét.

### LAB-02 — TG-01 Contract Anatomy

- Đọc public entrypoints và contract tests của TG-01.
- Với mỗi interface, ghi consumer, provider, owner, input/output, failure và lifetime.
- Chỉ ra interface nào là port thật và interface nào có nguy cơ chỉ thêm indirection.

**Evidence:** contract inventory và teach-back 5 phút.

### LAB-03 — Composition Root

- Thiết kế trên giấy cách wire `UnitOfWorkAdapter`, idempotency repository và các module port.
- So sánh manual factory với DI container.
- Nêu lifecycle của Prisma client, transaction-scoped object và singleton service.

**Evidence:** wiring diagram + trade-off note. Không cần thêm DI framework.

### LAB-04 — Module Boundary Audit

- Lập danh sách module và public `index.ts`.
- Tìm cross-module import và kiểm tra chúng đi qua public entrypoint hay internal path.
- Đề xuất automated rule; nêu false positive và migration path.

**Evidence:** dependency matrix + boundary-test proposal.

### LAB-05 — Business Model Workflow Execution

- Event Storming flow tạo/sửa/validate/enable/run workflow.
- Vẽ state machine có invalid transitions.
- Lập ubiquitous language và unresolved terms.
- Đề xuất bounded context map, sau đó so với module map hiện tại.

**Evidence:** event map, state machine, glossary delta, context map.

### LAB-06 — Aggregate Experiment

- Chọn một invariant như immutable workflow version hoặc execution admission limit.
- Viết ba model thay thế với aggregate boundary khác nhau.
- Đánh giá consistency, contention, repository API và testability.

**Evidence:** decision matrix; không bắt buộc sửa production model.

### LAB-07 — Idempotency Failure Matrix

Bao phủ tối thiểu:

- lần gọi đầu thành công;
- retry cùng key/cùng hash;
- cùng key/khác hash;
- hai request đồng thời;
- handler lỗi trước commit;
- lỗi lưu replay response;
- response vượt giới hạn;
- retry trước và đúng thời điểm TTL;
- process chết trước/sau commit.

**Evidence:** failure matrix nối từng case với expected durable state và response.

### LAB-08 — Retry Budget

- Liệt kê mọi layer có thể retry: browser, ingress, API, worker, provider adapter.
- Chọn một outbound call và tính worst-case attempts/latency nếu các layer cùng retry.
- Thiết kế một owner duy nhất cho retry policy.

**Evidence:** timeout/retry budget và sequence diagram.

### LAB-09 — Queue Decision

- So sánh MySQL lease queue với RabbitMQ và Kafka cho workload của project.
- Đánh giá atomic admission, ordering, throughput, replay, DLQ/recovery, monitoring, operating cost và team skill.
- Định nghĩa measurable trigger để chuyển khỏi DB queue.

**Evidence:** ADR; kết luận hợp lệ có thể là giữ MySQL queue.

### LAB-10 — Outbox/Inbox Design

- Chọn một integration event giả định.
- Thiết kế outbox write cùng domain transaction.
- Mô tả publisher retry, consumer inbox/dedup, schema evolution và poison message.
- Thử phản bác bằng duplicate, reorder và long outage.

**Evidence:** data model + sequence diagram + failure table.

### LAB-11 — CQRS Challenge

- Chọn một read screen phức tạp.
- Đo/ước lượng nhu cầu đọc, độ trễ chấp nhận và freshness.
- So sánh query trực tiếp, read projection trong cùng DB và CQRS tách model.

**Evidence:** decision note. Mặc định ưu tiên giải pháp đơn giản nhất đáp ứng được.

### LAB-12 — Service Extraction Rehearsal

- Chọn candidate theo driver thật, không theo kích thước folder.
- Liệt kê contract, data, transactions và runtime dependency phải tách.
- Mô phỏng network failure, deployment skew và rollback.
- Ước tính thêm dashboard, alert, runbook và on-call burden.

**Evidence:** extraction readiness report. Chỉ code ở capstone và khi PRISM cho phép.

## 4. Architecture kata hàng tháng

Mỗi tháng chọn một tình huống, giới hạn 60–90 phút:

1. Viết business outcome và constraints.
2. Chọn 2–4 quality attributes quan trọng.
3. Đề xuất ba phương án, trong đó có phương án đơn giản hiện tại.
4. Lập trade-off matrix.
5. Chọn phương án và viết revisit trigger.
6. Nhờ AI phản biện, sau đó tự xác minh từng finding.

Gợi ý kata:

- 10.000 workflow runs/phút nhưng cấu hình chỉ thay đổi vài lần/ngày.
- External provider trả timeout nhưng có thể đã xử lý request.
- Hai team cần release khác nhịp nhưng đang dùng chung bảng.
- Dashboard chấp nhận trễ 30 giây, mutation không chấp nhận mất dữ liệu.
- Một compliance boundary yêu cầu audit retention khác domain data.

## 5. Review rubric cho mọi bài lab

Chấm mỗi mục 0–2; đạt khi tổng ≥12/16 và không mục nào bằng 0.

| Tiêu chí | 0 | 1 | 2 |
|---|---|---|---|
| Problem framing | Mơ hồ | Có vấn đề | Có outcome, actor, constraint |
| Boundary/ownership | Không rõ | Một phần | Owner và public contract rõ |
| Alternatives | Một phương án | Hai phương án | Có phương án đơn giản + trade-off thật |
| Failure reasoning | Chỉ happy path | Có lỗi chung | Có failure point và recovery cụ thể |
| Evidence | Ý kiến | Diagram/test rời rạc | Evidence nối trực tiếp với claim |
| Cost/operations | Bỏ qua | Nhắc chung | Có maintenance, monitoring, team skill |
| Simplicity | Over-engineer | Chấp nhận được | Giải pháp nhỏ nhất đáp ứng driver |
| Communication | Khó kiểm tra | Hiểu được | Ngắn, traceable, quyết định rõ |

## 6. Definition of Done của project học tập

Sau 12 tháng, portfolio tối thiểu gồm:

- 1 dependency map và 1 module/context map;
- 2 state machines và 2 sequence diagrams có failure path;
- 1 ubiquitous-language glossary;
- 3 failure matrices: idempotency, retry, messaging;
- 6 ADR đạt rubric;
- 1 boundary-enforcement proposal hoặc implementation hợp lệ;
- 1 AI review pattern catalog;
- 1 báo cáo quarterly self-assessment có liên kết tới evidence.

