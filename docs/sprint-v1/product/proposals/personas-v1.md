---
status: DRAFT
version: v1
sprint: 1
phase: product
sprint_id: sprint-v1
created: 2026-07-18
updated: 2026-07-18 10:29
approved_by:
applied_to_living: false
---

# Personas Proposal — Sprint v1

## New

<!-- ID: PERSONA-001 -->
### PERSONA-001: Developer / Integration Engineer

- **Role:** Người trực tiếp khai báo Host API workspace, định nghĩa API, mapping và workflow tích hợp.
- **Segment size:** Chưa có số — không ảnh hưởng scope chức năng; cần đo trước Plan nếu dùng để tính capacity hỗ trợ.
- **Priority:** Primary.
- **Tech Level:** High — thành thạo HTTP API, request/response, environment và công cụ developer; có thể tự khám phá tính năng nhưng cần lỗi/mapping rõ ràng.
- **Mindset / Quote:** “Tôi muốn cấu hình chuỗi một lần, chạy lại được và biết chính xác bước nào hỏng.”
- **Goals:** (1) tạo chuỗi API không cần copy/paste; (2) chuyển environment an toàn; (3) điều tra lỗi từ một execution record; (4) tái sử dụng collection/API hiện có.
- **Pain Points:** (1) sao chép response sang request thủ công; (2) dễ dùng nhầm giá trị/credential giữa environment; (3) kết quả nhiều lần gọi rời rạc; (4) khó biết workflow nào bị ảnh hưởng khi API đổi/xóa.
- **Usage Context:** Hàng ngày trên Web desktop, kết nối mạng ổn định; thường thao tác khi phát triển hoặc kiểm tra tích hợp.
- **Decision-Making Pattern:** Thử trực tiếp với API thật; chỉ tin workflow khi validation và execution log chỉ rõ mapping, retry và lỗi.
- **Frustration Threshold:** Dừng sử dụng nếu lỗi chỉ báo chung chung hoặc phải mở nhiều màn hình để truy nguyên step thất bại.
- **Success Signals:** Tạo và chạy chuỗi ba API trong ≤ 10 phút, không copy/paste dữ liệu giữa các bước.
- **Accessibility / Device Notes:** Desktop-first; trạng thái không được truyền đạt chỉ bằng màu sắc.
- **Related:** EP-001; US-001 đến US-010.

<!-- ID: PERSONA-002 -->
### PERSONA-002: QA / Tester

- **Role:** Người chạy API/workflow để xác minh luồng tích hợp và dữ liệu qua nhiều bước.
- **Segment size:** Chưa có số.
- **Priority:** Secondary.
- **Tech Level:** Medium–High — hiểu API và dữ liệu JSON, cần history và lỗi có ngữ cảnh để tái hiện kết quả.
- **Mindset / Quote:** “Một lần chạy phải đủ bằng chứng để tôi biết step nào nhận gì và trả gì.”
- **Goals:** (1) chạy lại kịch bản nhất quán; (2) xem trạng thái từng step; (3) đổi environment mà không đổi schema biến; (4) dùng history làm bằng chứng kiểm thử.
- **Pain Points:** (1) phải chuẩn bị request từng bước; (2) khó tái hiện chuỗi sau khi API thay đổi; (3) secret có thể lộ khi chia sẻ log; (4) thiếu liên kết giữa các lần gọi.
- **Usage Context:** Hàng ngày hoặc theo đợt release trên Web desktop; cần chạy DEV/UAT/PROD theo quyền truy cập hiện hành.
- **Decision-Making Pattern:** Chạy validation trước, sau đó đối chiếu execution history và response đã mask.
- **Frustration Threshold:** Không thể tiếp tục nếu history thiếu step/input/output hoặc rerun không nói rõ environment.
- **Success Signals:** Có thể chạy lại workflow từ history và nhận execution mới có đầy đủ step evidence.
- **Accessibility / Device Notes:** Cần trạng thái, text lỗi và step index rõ ràng.
- **Related:** EP-001; US-003, US-006, US-007, US-008, US-010.

<!-- ID: PERSONA-003 -->
### PERSONA-003: System Administrator

- **Role:** Người quản lý Host, environment, schema biến và credential dùng chung cho API workspace.
- **Segment size:** Chưa có số.
- **Priority:** Secondary.
- **Tech Level:** High — hiểu môi trường hệ thống và secret management; cần kiểm soát tác động khi vô hiệu hóa/xóa Host.
- **Mindset / Quote:** “Thay đổi Host phải cho tôi thấy workflow nào bị ảnh hưởng trước khi xác nhận.”
- **Goals:** (1) quản lý cấu hình theo environment; (2) giữ schema biến nhất quán; (3) tránh lộ credential; (4) kiểm soát dependency khi Host/API thay đổi.
- **Pain Points:** (1) cấu hình rời giữa System Manager và API Lab; (2) khó nhận biết consumer của Host/API; (3) nguy cơ secret đi vào log; (4) xóa dependency gây lỗi âm thầm.
- **Usage Context:** Không thường xuyên, trên Web desktop; thao tác khi onboarding/chỉnh environment hoặc xử lý sự cố.
- **Decision-Making Pattern:** Kiểm tra dependency và cảnh báo trước khi thay đổi/xóa.
- **Frustration Threshold:** Không chấp nhận hành động phá workflow mà không có impact preview.
- **Success Signals:** Cấu hình một schema biến dùng nhất quán cho DEV/UAT/PROD và thấy đầy đủ workflow bị ảnh hưởng trước thao tác phá vỡ.
- **Accessibility / Device Notes:** Cảnh báo phải có text và danh sách dependency, không chỉ biểu tượng/màu.
- **Related:** EP-001; US-001, US-002, US-009.

## Updated

## Removed

### Self-Review Checklist

- [x] Có một Primary persona và hai Secondary persona.
- [x] Goals, pain points, usage context và success signals cụ thể.
- [x] Persona trace tới epic/story; segment size chưa đo được ghi rõ thay vì bịa.
