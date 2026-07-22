# Lộ trình Software Architecture 12–18 tháng

## 1. Đích đến

Sau lộ trình, người học có thể:

- đọc code và giải thích dependency direction, boundary, contract và transaction ownership;
- mô hình hóa một bài toán nghiệp vụ thành workflow, state, rule và bounded context;
- thiết kế modular monolith có public API rõ và không import internal xuyên module;
- phân tích reliability của mutation, retry, idempotency, consistency, cache và messaging;
- viết ADR có bối cảnh, phương án, hệ quả, risk và trigger xem xét lại;
- giao việc cho AI bằng requirement/contract/testable outcome và kiểm soát đầu ra bằng validation.

## 2. Bản đồ thời gian

Thời gian dưới đây giả định 8–10 giờ/tuần. Các giai đoạn tuần tự chiếm khoảng 12 tháng; Business Modeling và AI Collaboration chạy song song. Phần capstone/tách service có thể kéo tổng thời gian lên 15–18 tháng.

| Thời gian | Trọng tâm | Kết quả chính |
|---|---|---|
| Tuần 1 | Baseline | Dependency map và tự đánh giá đầu vào |
| Tháng 1–2 | Clean Architecture, SOLID, Hexagonal, DI | Đọc và bảo vệ được hướng dependency |
| Tháng 3–5 | Modular Monolith | Module map, public API và boundary test |
| Tháng 6–7 | DDD Strategic → Tactical | Context map, ubiquitous language, aggregate experiment |
| Tháng 8–9 | Distributed Systems | Reliability matrix và failure-mode experiments |
| Tháng 10–11 | Event Driven | Decision matrix, event contract và delivery-semantics lab |
| Tháng 12 | Architecture Decision | Portfolio ADR và architecture review |
| Song song | Business Modeling | Workflow/state/event models cho từng feature |
| Song song | AI Collaboration | Traceable AI workflow và quality gates |
| Tháng 13–18, tùy chọn | Capstone | Thử tách một module rồi đánh giá chi phí thực |

## 3. Tuần 1 — Baseline

### Mục tiêu

Biết mình đang đứng ở đâu và có bản đồ tối thiểu của dự án trước khi học pattern.

### Việc làm

- Vẽ dependency map hiện tại: frontend → HTTP routes → module/public contract → persistence/external systems.
- Chọn một request thật và trace từ UI đến database.
- Ghi lại nơi đang có business rule, nơi có orchestration và nơi có I/O.
- Tự trả lời 10 câu hỏi: coupling, cohesion, boundary, contract, invariant, transaction, idempotency, consistency, command và event là gì.

### Đầu ra

- `baseline/dependency-map.md` hoặc một sơ đồ tương đương.
- Một learning log có điểm tự đánh giá 0–3 cho 10 khái niệm.

---

## 4. Giai đoạn 1 — Tư duy kiến trúc (1–2 tháng)

Thứ tự trong giai đoạn: **Clean Architecture → SOLID → Hexagonal Architecture → Dependency Injection**. Không học microservices ở giai đoạn này.

### 4.1 Clean Architecture

Hiểu luồng trách nhiệm:

```text
Controller → Use Case → Domain
                    ↑
             Infrastructure
```

Controller chuyển protocol thành input. Use Case điều phối một mục tiêu nghiệp vụ. Domain giữ rule/invariant. Infrastructure thực hiện I/O và phụ thuộc vào contract phía trong.

Các câu hỏi phải trả lời được:

- Business rule có chạy được khi không có HTTP và database thật không?
- Framework type có rò vào use case/domain không?
- Ai sở hữu transaction và failure semantics?
- Dependency đang hướng vào policy hay hướng ra framework?

### 4.2 SOLID qua lực thiết kế

Không học thuộc năm chữ cái. Tập trung vào:

- **SRP:** một module thay đổi vì những nhóm nguyên nhân nào; các nguyên nhân đó có thuộc cùng actor/business capability không?
- **Coupling:** thay đổi A buộc B thay đổi ở mức source, runtime, data hay deployment nào?
- **Cohesion:** các hành vi và dữ liệu trong một module có cùng phục vụ một mục tiêu không?
- **OCP/LSP/ISP/DIP:** học thông qua thay adapter, thu nhỏ interface, test substitutability và đảo chiều dependency.

Bài tập: chọn một route nhiều trách nhiệm, phân loại phần protocol, orchestration, rule và I/O. Chỉ lập đề xuất tách; nếu triển khai phải qua lane PRISM.

### 4.3 Hexagonal Architecture

Mental model:

```text
Driving Adapter → Input Port → Application
Application → Output Port → Driven Adapter
```

Port là contract do phía cần khả năng sở hữu. Adapter chuyển contract sang công nghệ cụ thể. So sánh ít nhất hai adapter cho cùng một port: fake/in-memory trong test và Prisma/MySQL trong runtime.

### 4.4 Dependency Injection

Hiểu chuỗi:

```text
Interface/Port → Implementation/Adapter → Composition Root/Container
```

Không đồng nhất DI với framework container. Constructor injection hoặc factory cũng là DI. Trả lời được:

- Vì sao use case không tự `new PrismaClient()`?
- Ai quyết định dùng adapter nào?
- Lifetime của connection/client thuộc đâu?
- Fake có thực sự tuân contract hay chỉ làm test xanh?

### Bài lab giai đoạn

- Trace `CallerOwnedUnitOfWork` từ contract đến adapter giả và contract test.
- Trace `WorkflowImpactService`, `ExecutionResponseSchemaReader`, `ApprovedAddressSetRegistry` qua public `index.ts`.
- Vẽ một component diagram cho một mutation keyed-idempotency.
- Viết một phản biện ngắn: “interface nào tạo boundary thật, interface nào chỉ là abstraction thừa?”.

### Tiêu chí hoàn thành

- Nhìn một interface và giải thích được consumer, owner, implementation, failure contract và lý do tồn tại.
- Phát hiện được infrastructure leak và nested transaction risk.
- Viết được use case test không cần server hoặc database thật.
- Giải thích được khi nào concrete class đơn giản hơn interface.

---

## 5. Giai đoạn 2 — Modular Monolith (2–3 tháng)

Đây là năng lực cần đào sâu nhất trước microservices.

### Nội dung

- Module theo business capability, không chỉ theo technical layer.
- Public API qua `index.ts`; internal implementation không được import xuyên boundary.
- Contract ownership: consumer-owned port, provider implementation.
- Dependency rule và dependency graph không vòng.
- Internal command, query và event; phân biệt mục đích của từng loại.
- Transaction boundary và data ownership.
- Composition root; API process và worker process có thể compose khác nhau.
- Boundary enforcement bằng lint/architecture test, không dựa vào “nhớ đừng import”.

### Bài lab

1. Lập module catalog cho các capability hiện tại như System Catalog, Workflow Definition và Execution.
2. Với mỗi module, ghi owner, public entrypoint, tables owned, commands, queries, events và dependencies.
3. Tìm mọi cross-module import; phân loại public/internal/không rõ.
4. Viết dependency rules kỳ vọng và một boundary-test proposal.
5. Mô hình hóa một workflow mutation cần thay đổi nhiều module nhưng chỉ có một caller-owned transaction.
6. Chọn một dependency vòng giả định và giải bằng: đổi ownership, event, orchestration module hoặc contract extraction.

### Câu hỏi phản biện

- Một database chung có làm mất bounded context không?
- Dùng event nội bộ có thật sự giảm coupling hay chỉ che coupling?
- Khi nào một shared module trở thành “bãi rác dùng chung”?
- Nếu tách module thành service ngày mai, contract/data/transaction nào sẽ vỡ trước?

### Tiêu chí hoàn thành

- Không cần mở file internal vẫn biết cách gọi một module.
- Mỗi table và transaction có owner rõ.
- Có rule tự động phát hiện import sai boundary.
- Giải thích được vì sao modular monolith hiện tại phù hợp hơn microservices bằng dữ kiện dự án.

---

## 6. Giai đoạn 3 — Domain-Driven Design (2 tháng)

### 6.1 Strategic DDD trước

Học theo thứ tự:

1. Domain và business capability.
2. Subdomain: Core, Supporting, Generic.
3. Bounded Context.
4. Ubiquitous Language.
5. Context Mapping: Partnership, Customer/Supplier, Conformist, Anti-Corruption Layer, Open Host Service/Published Language, Separate Ways.

Ví dụ tư duy: từ `Execution` trong workflow runner có thể khác `Execution` trong audit/operations. Cùng một từ không đảm bảo cùng model; khác từ cũng chưa chắc khác concept.

### 6.2 Tactical DDD sau

- Entity: có identity và lifecycle.
- Value Object: định nghĩa bằng giá trị, bất biến nếu có thể.
- Aggregate: consistency boundary nhỏ nhất bảo vệ invariant.
- Repository: collection-like port cho aggregate, không phải wrapper tùy ý quanh mọi query.
- Domain Service: rule nghiệp vụ không tự nhiên thuộc một entity/value object.
- Domain Event: fact nghiệp vụ đã xảy ra, dùng thì quá khứ và bất biến.

### Bài lab

- Event Storming một flow: định nghĩa workflow → validate → enable → execute → retry/fail/complete.
- Tạo glossary cho các từ Host, Environment, API Definition, Workflow, Version, Execution, Attempt và Artifact.
- Vẽ context map và đánh dấu upstream/downstream.
- Chọn một invariant; thử ba cách đặt nó: route, use case, aggregate. So sánh khả năng bảo vệ rule.
- Viết aggregate boundary proposal, sau đó cố phản bác bằng transaction contention và cross-aggregate workflow.

### Tiêu chí hoàn thành

- Phân biệt được subdomain với module/package.
- Bảo vệ được một bounded context bằng ngôn ngữ và model khác biệt, không chỉ bằng folder.
- Aggregate không bị thiết kế theo quan hệ database hoặc “gom mọi thứ liên quan”.
- Nhận ra khi CRUD/anemic model là lựa chọn đủ tốt.

---

## 7. Giai đoạn 4 — Distributed Systems (2 tháng)

### Nội dung cốt lõi

**Idempotency**

- Scope/key/request fingerprint; reservation; concurrent duplicate; replay response; expiry.
- Atomicity giữa domain mutation, audit, job và idempotency record.
- Phân biệt idempotent operation với idempotency-key replay.

**Retry**

- Chỉ retry lỗi transient và operation an toàn/idempotent.
- Retry budget, timeout budget, exponential backoff, jitter và retry storm.
- Phân biệt retry ở client, API, worker và adapter; tránh stacked retries.

**Consistency**

- Strong vs eventual consistency theo invariant và trải nghiệm người dùng.
- Read-your-writes, monotonic reads, stale data và reconciliation.
- Outbox/Inbox, at-least-once delivery và deduplication.

**Cache**

- Cache-aside, write-through, write-behind.
- Key design, TTL, invalidation, stampede và stale fallback.

**Concurrency control**

- Optimistic locking, pessimistic locking, lease và distributed lock.
- Fencing token, lock expiry và process pause; hiểu vì sao “có Redis lock” chưa đủ chứng minh an toàn.

### Bài lab

- Dùng TG-01 làm case study: cùng key/cùng payload, cùng key/khác payload, concurrent request, response quá giới hạn và đúng ranh giới TTL.
- Lập failure matrix cho API process, DB, worker và external provider.
- Thiết kế thí nghiệm crash ở các điểm trước/giữa/sau commit.
- So sánh DB job table hiện tại với external broker bằng latency, operations, consistency, recovery và cost.
- Đề xuất một cache nhưng phải chỉ rõ source of truth, invalidation và failure behavior; được phép kết luận “không dùng cache”.

### Tiêu chí hoàn thành

- Không nói “exactly once” nếu chưa nêu boundary và assumptions.
- Retry policy luôn có lỗi áp dụng, max attempts, delay/jitter, timeout và ownership.
- Mỗi lock có invariant được bảo vệ và failure modes cụ thể.
- Chọn consistency từ business requirement, không từ sở thích công nghệ.

---

## 8. Giai đoạn 5 — Event-Driven Architecture (2 tháng)

### Nội dung

- **Command:** yêu cầu một owner thực hiện hành động; có thể bị từ chối.
- **Event:** sự thật đã xảy ra; không ra lệnh trá hình.
- **Query:** đọc dữ liệu, không tạo side effect nghiệp vụ.
- Kafka, RabbitMQ và Redis Streams ở mức decision fitness: ordering, routing, replay, retention, consumer model, operations và team skill.
- Saga orchestration vs choreography.
- CQRS: chỉ dùng khi write/read model có nhu cầu khác biệt đủ lớn.
- Event Sourcing: hiểu model và chi phí; không đưa vào project nếu chưa có driver mạnh.
- Schema evolution, compatibility, poison message, DLQ/recovery và observability.

### Bài lab

- Từ một workflow, phân loại message nào là command, event hay query.
- Viết event contract version 1 và giả lập consumer chậm/duplicate/out-of-order.
- Thiết kế Outbox → Publisher → Consumer Inbox trên giấy và xác định transaction boundary.
- So sánh orchestration/choreography cho một flow ba bước có compensation.
- Viết decision note “vì sao hệ thống hiện tại chưa cần Kafka/CQRS/Event Sourcing”.

### Tiêu chí hoàn thành

- Chọn broker dựa trên workload và vận hành, không dựa trên độ phổ biến.
- Event có owner, schema, versioning và delivery semantics rõ.
- Saga có failure/compensation/manual recovery path.
- Có thể bảo vệ quyết định tiếp tục dùng synchronous call hoặc DB queue.

---

## 9. Giai đoạn 6 — Architecture Decision (2 tháng)

### Cách tư duy

Không bắt đầu bằng “làm thế nào?”, mà bằng:

- Vấn đề và lực tác động là gì?
- Điều gì là constraint, điều gì chỉ là assumption?
- Thuộc tính chất lượng nào quan trọng nhất?
- Phương án đơn giản nhất đáp ứng được là gì?
- Ta chấp nhận loại rủi ro nào và đo nó ra sao?

Mỗi quyết định phải đề cập: **Pros, Cons, Risk, Cost, Maintenance, Team Capability**.

### Decision drills

- Modular monolith hay microservices?
- MySQL job table hay RabbitMQ/Kafka?
- Database hay Redis cho một read path cụ thể?
- REST hay gRPC?
- CRUD/anemic model hay rich domain model?
- Transaction đồng bộ hay Saga?
- Shared library hay service-owned duplicated logic?

### Portfolio cuối giai đoạn

Viết ít nhất 6 ADR:

1. Hai quyết định giữ nguyên kiến trúc hiện tại.
2. Hai quyết định thay đổi có trigger đo được.
3. Một quyết định “không dùng” công nghệ đang phổ biến.
4. Một ADR thay thế ADR cũ sau khi xuất hiện bằng chứng mới.

### Tiêu chí hoàn thành

- ADR ngắn nhưng có context, alternatives, decision, consequences, risks và revisit trigger.
- Có thể thay đổi quyết định khi dữ liệu thay đổi mà không coi đó là thất bại.
- Phân biệt reversible và irreversible decision.
- Architecture review tập trung vào risk/fitness, không tranh luận khẩu vị code.

---

## 10. Giai đoạn song song A — Business Modeling

Áp dụng trong toàn bộ lộ trình.

Khi nghe “quản lý hợp đồng”, không bắt đầu từ `Contract` table. Hãy khám phá:

```text
Draft → Review → Approve → Sign → Active → Revise/Terminate → Archive
```

### Công cụ

- Event Storming để khám phá event, command, policy và hotspot.
- Workflow Modeling để thấy actor, hand-off và exception.
- State Machine để làm rõ state, transition, guard và invalid transition.
- Sequence Diagram để thấy ownership, call order và failure path.
- Activity Diagram khi flow nhiều nhánh/role.

### Routine cho mỗi feature

1. Viết outcome và actor.
2. Liệt kê happy path, exception và manual recovery.
3. Vẽ state machine.
4. Định nghĩa invariant và authorization rule.
5. Sau đó mới thiết kế API/data/module.

### Bằng chứng tiến bộ

- Business stakeholder hiểu và sửa được diagram.
- Tên trong requirement, code, API và test nhất quán.
- Test case bao phủ invalid transition, không chỉ happy path.

---

## 11. Giai đoạn song song B — AI Collaboration

Pipeline mục tiêu:

```text
Requirement → Design → Architecture → Plan → Prompt/Implement
           → Validate → Human Review → Approve
```

### Năng lực cần luyện

- Chia task theo contract, dependency và ownership; tránh task chỉ mô tả file cần sửa.
- Cung cấp cho AI đủ context nhưng không đổ toàn repo vào prompt.
- Viết acceptance criteria quan sát được và failure cases.
- Bắt AI nêu assumptions, alternatives và evidence.
- Review semantic correctness, không chỉ typecheck/test xanh.
- Tách người tạo và người validate khi rủi ro cao.
- Giữ traceability Requirement → Architecture → Task → Test → Evidence.

### Bài lab hàng tháng

- Chọn một yêu cầu; tự viết expected contract trước khi hỏi AI.
- Cho AI đề xuất, sau đó lập bảng: đúng, thiếu, thừa, assumption, risk.
- Yêu cầu một reviewer độc lập cố phản bác từng acceptance criterion.
- Ghi lỗi AI vào pattern catalog: boundary leak, invented contract, missing failure path, stale assumption, over-engineering.

### Tiêu chí hoàn thành

- Prompt mô tả outcome, constraints, source of truth và validation; không chỉ “hãy code X”.
- Không approve dựa trên lời tóm tắt của AI.
- Có evidence từ file, test và command thực chạy.
- Biết dừng AI khi origin, requirement hoặc decision authority chưa rõ.

---

## 12. Capstone tháng 13–18 — Thử tách một service

Chỉ thực hiện sau khi modular monolith đủ rõ. Đây là thí nghiệm học tập, không phải mục tiêu mặc định của production architecture.

### Điều kiện chọn module

Phải có ít nhất một driver đo được: scale độc lập, deploy cadence khác, team ownership độc lập, security/compliance boundary hoặc failure isolation.

### Trình tự

1. Baseline latency, throughput, failure rate, deployment và operational cost.
2. Freeze public contract và data ownership.
3. Loại bỏ cross-module internal import.
4. Chuyển in-process call thành network/message contract.
5. Xử lý data migration, consistency, idempotency, observability và rollback.
6. Chạy failure/chaos scenarios.
7. So sánh trước/sau và quyết định giữ, hoàn tác hoặc điều chỉnh.

### Kết quả quan trọng nhất

Không phải “đã có microservice”, mà là một báo cáo chứng minh chi phí và lợi ích trong bối cảnh cụ thể. Hoàn tác về modular monolith vẫn là kết quả học tập thành công nếu bằng chứng cho thấy việc tách không đáng giá.

## 13. Bảng tự đánh giá hàng quý

Chấm 0–3: 0 chưa biết; 1 giải thích được; 2 áp dụng có hướng dẫn; 3 áp dụng và phản biện độc lập.

| Năng lực | Q1 | Q2 | Q3 | Q4 | Bằng chứng gần nhất |
|---|---:|---:|---:|---:|---|
| Dependency direction |  |  |  |  |  |
| Module boundary |  |  |  |  |  |
| Business modeling |  |  |  |  |  |
| DDD strategic |  |  |  |  |  |
| Transaction/idempotency |  |  |  |  |  |
| Distributed failure reasoning |  |  |  |  |  |
| Event-driven decision |  |  |  |  |  |
| ADR/trade-off analysis |  |  |  |  |  |
| AI task decomposition |  |  |  |  |  |
| AI output validation |  |  |  |  |  |

