> **Hướng dẫn sử dụng template:** Nội dung dưới đây được giữ theo format tài liệu mẫu gốc. Khi dùng cho dự án mới, thay các placeholder như `[PROJECT_CODE]`, `[PROJECT_NAME]`, `[SYSTEM_NAME]`, `[ENV]`, `[OWNER]`, `[LINK]`; giữ lại các bảng, tiêu chí, checklist và các con số baseline nếu còn phù hợp. Nguồn gốc đã sanitize: `UAT test\UAT test.md`.

# UAT Test Plan

> **Mục đích sử dụng:** Dùng lập kế hoạch UAT theo round/sprint/release: scope, participant, environment, data, schedule, entry/exit criteria và signoff.

<https://[CONFLUENCE_DOMAIN]/wiki/pages/[PAGE_ID]>

|  | **Round** | **Attached file** | **Thời gian** | **Phạm vi** | **Môi trường** | **Bộ phận nghiệm thu** | **Trạng thái** |
| --- | --- | --- | --- | --- | --- | --- | --- |
| 1 | Nghiệm thu nội bộ | Nghiệm thu nội bộ | Nghiệm thu nội bộ | Nghiệm thu nội bộ | Nghiệm thu nội bộ | Nghiệm thu nội bộ | Nghiệm thu nội bộ |
| 2 | UAT Round 1 | <[GOOGLE_DOC_LINK]>  <[GOOGLE_DOC_LINK]> | 09/06-2025 - 14/06/2025 | 1. Luồng truy vấn thông tin thông tin đối tượng nhận 2. Luồng xử lý nghiệp vụ luồng nghiệp vụ chính tới mã định danh đối tượng nhận 3. Cập nhật ngưỡng nghiệp vụ của Tổ chức/đối tác 4. Tổng hợp dữ liệu xử lý cuối kỳ nghiệp vụ [BUSINESS_FLOW] 5. Trao đổi báo cáo đối chiếu dữ liệu và báo cáo xử lý cuối kỳ giữa [SYSTEM_NAME] và [PARTNER] | UAT | Đội dự án [PROJECT_NAME]   - [BUSINESS_USER_1] - [BUSINESS_USER_2] - [BUSINESS_USER_3] - [BUSINESS_USER_4] - [BUSINESS_USER_5] |  |
| 3 | UAT Round 2 | <[GOOGLE_DOC_LINK]>    <[GOOGLE_DOC_LINK]> | 29/07/2025 - 04/08/2025 | 1. Luồng nghiệp vụ hoàn trả 2. Luồng truy vấn trạng thái nghiệp vụ 3. Luồng copy nghiệp vụ gốc 4. [OPS_PORTAL]: Hỗ trợ vận hành nội bộ [ORG_NAME]     1. Đăng nhập bằng SSO    2. Nghiệp vụ (Danh sách, chi tiết, lịch sử trạng thái, lịch sử tích hợp) 5. [USER_PORTAL]: Hỗ trợ vận hành của [PARTNER]     1. Đăng nhập bằng tên tài khoản và mật khẩu (đăng nhập, quên mật khẩu, đổi mật khẩu, phiên đăng nhập, xác thực OTP)    2. Nghiệp vụ (Danh sách, chi tiết) | UAT | Đội dự án [PROJECT_NAME]   - [BUSINESS_USER_1] - [BUSINESS_USER_2] - [BUSINESS_USER_3] - [BUSINESS_USER_4] - [BUSINESS_USER_5] |  |
| 4 | UAT Round 3 | <[GOOGLE_DOC_LINK]>  <[GOOGLE_DOC_LINK]>  [UAT] Tổng hợp phản hồi Round 3: 04 - 10/09/2025 |  |  | UAT | Vận hành nghiệp vụ [SYSTEM_NAME]   - [BUSINESS_USER_1] - [BUSINESS_USER_2] |  |
| 5 | UAT Round 4 | [UAT][2025-10-15] Nghiệm thu [SYSTEM_NAME] round 4 - Code sprint 12 |  |  | UAT | Vận hành nghiệp vụ [SYSTEM_NAME]   - [BUSINESS_USER_1] - [BUSINESS_USER_2] |  |
| 6 | UAT Round 5 | [UAT][2025-11-17] Nghiệm thu [SYSTEM_NAME] round 5 - Code sprint 13, 14, 15 |  |  | UAT | Vận hành nghiệp vụ [SYSTEM_NAME]   - [BUSINESS_USER_1] - [BUSINESS_USER_2] - [BUSINESS_USER_3] |  |
| 7 | Nghiệm thu [REGULATORY_OR_PARTNER_SCOPE] | <[GOOGLE_DOC_LINK]>  <[GOOGLE_DOC_LINK]>  [UAT][2026-01-19] [REGULATORY_OR_PARTNER_SCOPE] luồng xử lý cuối kỳ lô ([REGULATORY_OR_PARTNER_SCOPE], [PARTNER_A], [PARTNER_C]) | - | 1. Truy vấn tài khoản 2. Xử lý nghiệp vụ ghi có [BUSINESS_FLOW] 3. Đối chiếu dữ liệu, xử lý cuối kỳ     1. Trao đổi báo cáo [PARTNER]    2. Xử lý cuối kỳ lô [REGULATORY_OR_PARTNER_SCOPE] | UAT | Vận hành nghiệp vụ [SYSTEM_NAME]   - [BUSINESS_USER_1] - [BUSINESS_USER_2] - [BUSINESS_USER_3]   Vận hành [PARTNER]   - [partner_NAME] - [PARTNER_C] |  |
| 8 | UAT Round 6 | [UAT][2026-01-12] Nghiệm thu [SYSTEM_NAME] round 6 - Code sprint 16, 17, 18 | - | - MVP0    - Bổ sung đăng nhập bằng tài khoản Microsoft trên [OPS_PORTAL]   - Enhance after UAT round 5 -Tối ưu hiển thị thông tin trên Portal   - Enhancement thanh menu trên [OPS_PORTAL] & [USER_PORTAL]   - Thêm tab hoàn trả ở chi tiết nghiệp vụ ([USER_OR_PARTNER] và [OPS_PORTAL]) | UAT | Vận hành nghiệp vụ [SYSTEM_NAME]   - [BUSINESS_USER_1] - [BUSINESS_USER_2] - [BUSINESS_USER_3] |  |
| 9 | UAT Round 7 | [UAT][2026-01-28] Nghiệm thu Round 7 - Lấp GAP [REGULATORY_OR_PARTNER_SCOPE] audit | - | - Phạm vi: MVP0    - Lấp GAP đề án      - Onboard [PARTNER]     - Ngưỡng nghiệp vụ V1.2     - Xem điều kiện, điều khoản | UAT | Vận hành nghiệp vụ [SYSTEM_NAME]   - [BUSINESS_USER_1] - [BUSINESS_USER_2] - [BUSINESS_USER_3] |  |
| 10 | UAT Round 8 | [UAT][2026-02-24] Nghiệm thu Round 8 - Phí [BUSINESS_FLOW] | - | - Phạm vi: MVP0    - Phí [BUSINESS_FLOW]   - Xử lý cuối kỳ phí [BUSINESS_FLOW] | UAT | Vận hành nghiệp vụ [SYSTEM_NAME]   - [BUSINESS_USER_1] - [BUSINESS_USER_2] - [BUSINESS_USER_3] |  |
| 11 | UAT Round 9 | [UAT][2026-03-02] Nghiệm thu [SYSTEM_NAME] round 9 - Cụm GTM 1.0 | - | - Phạm vi: MVP1    - Truy vấn trang thái nghiệp vụ realtime E2E   - Hiệu chỉnh luồng truy vấn - Bổ sung kết quả rà quét AML/Fraud   - Luồng nghiệp vụ - Bổ sung kết quả AML   - Enhancement: Xử lý yêu cầu nghiệp vụ   - Luồng xử lý nghiệp vụ Expired/Timeout   - Xử lý cuối kỳ theo batch định kỳ (tăng tần suất xử lý cuối kỳ)   - Chia zone xử lý nghiệp vụ | Sandbox | QLSP [SYSTEM_NAME]   - [BUSINESS_USER_1] |  |
| 12 | Nghiệm thu [PARTNER] | Nghiệm thu [PARTNER] | Nghiệm thu [PARTNER] | Nghiệm thu [PARTNER] | Nghiệm thu [PARTNER] | Nghiệm thu [PARTNER] | Nghiệm thu [PARTNER] |
| 13 | UAT [PARTNER] [PARTNER_A] | <[GOOGLE_DRIVE_LINK]> | 01/10/2025 - 10/10/2025 | - Luồng truy vấn thông tin thông tin đối tượng nhận - Luồng xử lý nghiệp vụ luồng nghiệp vụ chính tới mã định danh đối tượng nhận | UAT |  |  |
| 14 | UAT [PARTNER] [PARTNER_B] | <[GOOGLE_DRIVE_LINK]> | 01/10/2025 - 10/10/2025 | - Luồng truy vấn thông tin thông tin đối tượng nhận - Luồng xử lý nghiệp vụ luồng nghiệp vụ chính tới mã định danh đối tượng nhận | UAT |  |  |
| 15 | UAT [PARTNER] [PARTNER_C] | <[GOOGLE_DRIVE_LINK]> | 01/10/2025 - 10/10/2025 | - Luồng truy vấn thông tin thông tin đối tượng nhận - Luồng xử lý nghiệp vụ luồng nghiệp vụ chính tới mã định danh đối tượng nhận | UAT |  |  |
| 16 | UAT [PARTNER] Pilot | [UAT][2026-01-19] Nghiệm thu [PARTNER] Pilot ([PARTNER_A], [PARTNER_B])  UAT - Inquiry, [BUSINESS_DOMAIN], Refund, Đối chiếu dữ liệu, Copy nghiệp vụ (19012025-13022026) | - | - MVP0, Nghiệm thu tích hợp [PARTNER] pilot ([PARTNER_A], [PARTNER_B])    - Kịch bản nghiệp vụ      - Truy vấn tài khoản     - Nghiệp vụ ghi có     - Nghiệp vụ hoàn trả     - Copy nghiệp vụ     - [BATCH_PROCESSING_MODULE] ([REGULATORY_OR_PARTNER_SCOPE] lồng ghép)     - Trao đổi báo cáo | UAT | Vận hành nghiệp vụ [SYSTEM_NAME]   - [BUSINESS_USER_1] - [BUSINESS_USER_2] - [BUSINESS_USER_3]   Vận hành [PARTNER]   - [partner_NAME] - [PARTNER_B] |  |
| 17 |  |  |  |  |  |  |  |







