# Lộ trình học Software Architecture

Lộ trình này dùng chính dự án `quan_ly_cong_viec` làm phòng lab xuyên suốt. Mục tiêu không phải ghi nhớ thật nhiều pattern, mà hình thành ba năng lực có giá trị lâu dài:

1. **Architecture Decision** — biết chọn giải pháp phù hợp và biết khi nào không nên dùng một giải pháp.
2. **Business Modeling** — nhìn thấy workflow, rule và state transition trước khi nghĩ đến table hoặc framework.
3. **AI Collaboration** — biến yêu cầu thành quy trình có contract, bằng chứng kiểm thử và quality gate.

## Bộ tài liệu

- [Lộ trình 12–18 tháng](./learning-roadmap.md): thứ tự học, mục tiêu, nội dung, bài tập và tiêu chí hoàn thành.
- [Project Lab](./project-lab.md): ánh xạ khái niệm vào code và tài liệu hiện có của dự án.
- [Mẫu thực hành](./practice-templates.md): learning log, concept note, experiment report, ADR và AI review record.

## Nguyên tắc học

- Học từ **vấn đề → lực tác động → quyết định → hệ quả**, không học bằng tên pattern.
- Mỗi khái niệm phải có ba đầu ra: giải thích bằng lời của mình, chỉ ra ví dụ trong dự án, và thực hiện một thí nghiệm nhỏ có kiểm chứng.
- Bắt đầu với modular monolith. Chỉ thử tách service sau khi đo được một ranh giới cần scale, deploy, ownership hoặc reliability độc lập.
- Strategic DDD đi trước Tactical DDD. Bounded Context đi trước Entity/Aggregate/Repository.
- Không thêm Kafka, Redis, CQRS hay Event Sourcing chỉ để “có dùng”. Mỗi công nghệ phải trả lời được vấn đề cụ thể, chi phí và trigger gỡ bỏ/thay đổi.
- Code do AI tạo không phải bằng chứng hoàn thành. Bằng chứng là contract rõ, test phản bác được sai lệch, validation sạch và quyết định được con người duyệt.

## Nhịp học đề xuất

Mức bền vững: **8–10 giờ/tuần**.

| Hoạt động | Thời lượng/tuần | Đầu ra |
|---|---:|---|
| Đọc có mục tiêu | 2 giờ | 1 concept note, tối đa 1 trang |
| Đọc code/architecture hiện tại | 2 giờ | Dependency map hoặc decision map |
| Thực hành có test | 3–4 giờ | Một lát cắt nhỏ, có giả thuyết và bằng chứng |
| Viết và phản biện quyết định | 1 giờ | ADR hoặc trade-off note |
| Tổng kết/teach-back | 1 giờ | Learning log và giải thích 5 phút |

Chu kỳ hai tuần:

1. Tuần A: học khái niệm, tìm ví dụ trong repo, viết giả thuyết.
2. Tuần B: làm thí nghiệm, test, phản biện trade-off và tổng kết.

## Định nghĩa “đã học”

Một chủ đề chỉ được đánh dấu hoàn thành khi có đủ:

- **Explain:** giải thích được bằng ngôn ngữ của mình, không dựa vào định nghĩa thuộc lòng.
- **Recognize:** nhận ra được dấu hiệu nên dùng và dấu hiệu không nên dùng.
- **Apply:** áp dụng vào một tình huống trong dự án mà không phá boundary.
- **Verify:** có test, diagram, measurement hoặc review chứng minh kết quả.
- **Defend:** trình bày được pros, cons, risk, cost, maintenance và team capability.

## Cách dùng với PRISM

`study/` là tài liệu học tập, không phải Product/Design/Architecture/Plan artifact. Khi bài lab yêu cầu đổi source code, schema, dependency hoặc hành vi hệ thống, hãy mở đúng origin/lane PRISM trước; không triển khai trực tiếp từ checklist học tập này.

