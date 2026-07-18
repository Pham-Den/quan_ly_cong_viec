> **Hướng dẫn sử dụng template:** Nội dung dưới đây được giữ theo format tài liệu mẫu gốc. Khi dùng cho dự án mới, thay các placeholder như `[PROJECT_CODE]`, `[PROJECT_NAME]`, `[SYSTEM_NAME]`, `[ENV]`, `[OWNER]`, `[LINK]`; giữ lại các bảng, tiêu chí, checklist và các con số baseline nếu còn phù hợp. Nguồn gốc đã sanitize: `UAT test\[UAT][2026-04-15] Nghiệm thu [SYSTEM_NAME] round 11 - GTM1.md`.

# UAT Acceptance Report

> **Mục đích sử dụng:** Dùng làm báo cáo nghiệm thu UAT/signoff, đối chiếu scope, result, defect, risk và điều kiện release gate.

<https://[CONFLUENCE_DOMAIN]/wiki/pages/[PAGE_ID]>

|  |  |  |
| --- | --- | --- |
| **Dự án** | [SYSTEM_NAME] |  |
| **Phiên bản nghiệm thu** |  |  |
| **Sprint release** | Sprint 21 |  |
| **Ngày bắt đầu nghiệm thu** | Kế hoạch: | Thực tế: |
| **Ngày kết thúc nghiệm thu** | Kế hoạch: | Thực tế: |

# 1. Phạm vi nghiệm thu

|  | **Chức năng** | **BRD** | **PRD/Ticket liên quan** | **Kết quả test** | **Business Owner** |
| --- | --- | --- | --- | --- | --- |
| 1 | Cổng xử lý yêu cầu nghiệp vụ [USER_PORTAL] | Quản lý xử lý yêu cầu nghiệp vụ | [PRD][Mem] Xử lý yêu cầu nghiệp vụ - Khởi tạo, làm rõ, và phản hồi kết quả xử lý yêu cầu nghiệp vụ  [PRD][Mem] Xử lý yêu cầu nghiệp vụ - Danh sách & chi tiết yêu cầu (request) của xử lý yêu cầu nghiệp vụ  [MVP1][PRD][Mem] Dispute - Danh sách và Chi tiết xử lý yêu cầu nghiệp vụ | <[GOOGLE_DOC_LINK]> |  |
| 2 | Phí chiết khấu & VAT trong báo cáo phí gửi qua email | BRD vận hành phí | <https://[JIRA_OR_CONFLUENCE_DOMAIN]/browse/[JIRA_ISSUE_KEY]> | <https://[CONFLUENCE_DOMAIN]/plugins/servlet/ac/com.infostretch.QmetryTestManager/qtm4j-test-management?project.key=[ORG_NAME]&project.id=[QMETRY_PROJECT_ID]#!/executionPage/[QMETRY_EXECUTION_ID]>    <https://[CONFLUENCE_DOMAIN]/plugins/servlet/ac/com.infostretch.QmetryTestManager/qtm4j-test-management?project.key=[ORG_NAME]&project.id=[QMETRY_PROJECT_ID]#!/executionPage/[QMETRY_EXECUTION_ID]> |  |
| 3 | Không xử lý giá trị hoàn trả theo kỳ vọng |  |  | <https://[CONFLUENCE_DOMAIN]/plugins/servlet/ac/com.infostretch.QmetryTestManager/qtm4j-test-management?project.key=[ORG_NAME]&project.id=[QMETRY_PROJECT_ID]#!/executionPage/[QMETRY_EXECUTION_ID]> |  |
| 4 | Thay đổi thời gian phiên nghiệp vụ |  |  | <https://[CONFLUENCE_DOMAIN]/plugins/servlet/ac/com.infostretch.QmetryTestManager/qtm4j-test-management?project.key=[ORG_NAME]&project.id=[QMETRY_PROJECT_ID]#!/executionPage/[QMETRY_EXECUTION_ID]> |  |
| 5 | Thay đổi thời gian xử lý cuối kỳ |  |  | Không sửa code, chỉ gen lại phiên, Vận hành check lại file là được |  |

# 2. Đối tượng tham gia nghiệm thu

|  | **Họ tên** | **Bộ phận** | **Vai trò** | **Ghi chú** |
| --- | --- | --- | --- | --- |
| 1 |  | Vận hành nghiệp vụ [SYSTEM_NAME] | UAT Tester | Trực tiếp thực hiện kiểm thử và phản hồi kết quả tổng thể + Signoff |
| 2 |  | [PROJECT_TEAM] | Product Owner Lead | Xác định phạm vi UAT |
| 3 |  | [PROJECT_TEAM] | Product Owner | Giải thích yêu cầu nghiệp vụ, xác nhận các tiêu chí nghiệm thu |
| 4 |  | [PROJECT_TEAM] | QC Lead | Hỗ trợ kỹ thuật, xử lý lỗi phát sinh (nếu có) |
| 5 |  | [PROJECT_TEAM] | TO | Hỗ trợ kỹ thuật, xử lý lỗi phát sinh (nếu có) |
| 6 |  | [PROJECT_TEAM] | PMO | Quản lý tổng thể tiến độ |

# 3. Cách thức thực hiện

|  |  |  |
| --- | --- | --- |
| 1 | **Địa điểm** | UAT được thực hiện tại công ty [SYSTEM_NAME] (Tầng 30, Văn phòng [SYSTEM_NAME], Tòa [partner_NAME], 119 Trần Duy Hưng) |
| 2 | **Thời gian** | - |
| 3 | **Môi trường** | Sandbox |
| 4 | **MVP** | MVP1 |
| 5 | **Thiết bị** | Máy tính, trình duyệt, và phần mềm cần thiết được [PROJECT_TEAM] chuẩn bị sẵn đảm bảo thực hiện được các hoạt động kiểm thử |
| 6 | **Tài khoản truy cập** | Do [PROJECT_TEAM] cung cấp cho từng UAT tester đã được chỉ định. |
| 7 | **Hỗ trợ** | QC và đại diện kỹ thuật của [PROJECT_TEAM] sẽ trực hỗ trợ khi cần trong quá trình UAT. |
| 8 | **Ghi nhận kết quả** | Trên các công cụ làm việc của dự án (Jira, Confluence, google sheet, Qmetry ...) |
| 9 | **Báo cáo** | Xây dựng báo cáo trên các công cụ làm việc của dụ án (Jira, Confluence, Qmetry ...) |

# 4. Checklist chuẩn bị và phối hợp

|  | **Công việc** | **Mô tả** | **Đơn vị thực hiện** | **PIC** | **Trạng thái** | **Ngày hết hạn** |
| --- | --- | --- | --- | --- | --- | --- |
| 1 | Chuẩn bị |  |  |  |  |  |
| 2 | Gửi plan và kết quả SIT |  | [PROJECT_TEAM] |  |  |  |
| 3 | Gửi danh sách nhân sự tham gia UAT |  | [SYSTEM_NAME] |  |  |  |
| 4 | Chuẩn bị Kịch bản UAT (Test Scenarios) | [https://[SYSTEM_NAME]cvn-my.sharepoint.com/shared?id=%2Fsites%2Forg.bizops%2FShared Documents%2FUAT%2F9. UAT round 11\_GTM 1.0&listurl=https%3A%2F%2F[SYSTEM_NAME]cvn.sharepoint.com%2Fsites%2Forg.bizops%2FShared Documents&viewid=[DEPLOYMENT_VERSION_OR_COMMIT]](https://[SYSTEM_NAME]cvn-my.sharepoint.com/shared?id=%2Fsites%2Forg%2Ebizops%2FShared%20Documents%2FUAT%2F9%2E%20UAT%20round%2011%5FGTM%201%2E0&listurl=https%3A%2F%2F[SYSTEM_NAME]cvn%2Esharepoint%2Ecom%2Fsites%2Forg%2Ebizops%2FShared%20Documents&viewid=2577d2d8%2D6079%2D4b74%2D877b%2D2291ec68e056) | [SYSTEM_NAME] |  |  |  |
| 5 | Hướng dẫn UAT | Hướng dẫn thao tác cơ bản | [PROJECT_TEAM] |  |  |  |
| 6 | Chuẩn bị môi trường | Đảm bảo môi trường sẵn sàng | [PROJECT_TEAM] |  |  |  |
| 7 | Cấp tài khoản UAT | Đảm báo tài khoản UAT sản sàng | [PROJECT_TEAM] |  |  |  |
| 8 | Hỗ trợ tạo dữ liệu UAT | Đảm bảo dữ liệu test sẵn sàng | [PROJECT_TEAM] |  |  |  |
| 9 | Thực hiện UAT |  |  |  |  |  |
| 10 | Thực hiện kiểm thử theo kịch bản UAT | Thực hiện trong khoảng thời gian  - | [SYSTEM_NAME] |  |  |  |
| 11 | Hỗ trợ UAT (chụp evidence, check log,....) | Ghi rõ tên test case & timestamp | [PROJECT_TEAM] |  |  |  |
| 12 | Theo dõi tiến độ, ghi nhận trạng thái test case | Pass / Fail / Not Run | [SYSTEM_NAME] |  |  |  |
| 13 | Báo cáo |  |  |  |  |  |
| 14 | Báo cáo kết quả UAT mỗi ngày (Daily Report) | Mục tiêu: Kiểm soát tiến độ UAT, raise issue trọng yếu cần xử lý trước khi technical golive Phương thức: Cập nhật trong daily hàng ngày | [SYSTEM_NAME] |  |  |  |
| 15 | Tổng hợp báo cáo kết quả UAT final (Summary report) | Mục tiêu: Tổng hợp kết quả UAT để gửi dự án đánh giá Tài liệu: Đính kèm yêu cầu sản phẩm, test case, thống kê case lỗi, evidence case pass Phương thức: Gửi qua email | [SYSTEM_NAME] |  |  |  |
| 16 | Đánh giá kết quả UAT | Xác nhận kết thúc UAT (gửi kèm kết quả chi tiết) | [SYSTEM_NAME] |  |  |  |
| 17 | Phản hồi & xử lý |  |  |  |  |  |
| 18 | Phản hồi kế hoạch xử lý issue | Phản hồi kế hoạch xử lý các issue phát sinh trong quá trình UAT:   - Đối với bug sẽ áp dụng cơ chế phân loại theo quy định hiện tại và thực hiện theo đúng SLA - Phân loại mức độ issue    - Đối với các issue hoặc yêu cầu enhancement --> đưa vào backlog và xử lý theo quy trình | [PROJECT_TEAM] |  |  |  |
| 19 | Đưa các issue vào xử lý theo kế hoạch | Có tài liệu PRD, phương án, kế hoạch xử lý rõ ràng sau UAT | [PROJECT_TEAM] |  |  |  |

# 5. Tài liệu bàn giao

- Bộ kịch bản SIT:
- Demo: Demo Sprint 6\_2026: Xử lý yêu cầu nghiệp vụ trên [USER_PORTAL], điều chỉnh phí
- HDSD:

  - <https://[CONFLUENCE_DOMAIN]/wiki/spaces/[ORG_NAME]/folder/3781099869>

# 6. Môi trường UAT

- Cài đặt WARP cho Windows: Cài đặt WARP cho Windows
- Truy nhập simulator môi trường UAT: ht[tps://simulator-[SYSTEM_NAME]-uat.ops.[ORG_NAME].mobi/](https://simulator-[SYSTEM_NAME]-uat.ops.[ORG_NAME].mobi/)
- [OPS_PORTAL]: [https://ops-[SYSTEM_NAME]-uat.ops.[ORG_NAME].mobi/layout/home](https://ops-[SYSTEM_NAME]-qc.ops.[ORG_NAME].mobi/layout/home)
- [USER_PORTAL]: [https://user-partner-[SYSTEM_NAME]-uat.ops.[ORG_NAME].mobi/layout/home](https://user-partner-[SYSTEM_NAME]-qc.ops.[ORG_NAME].mobi/layout/home)

# 7. Kịch bản nghiệm thu

# 8. Kết quả nghiệm thu

# 9. Issue or Defects

- **Số lượng vấn đề/phản hồi:** [Số lỗi phát hiện]
- **Danh sách vấn đề:** [Liệt kê chi tiết các vấn đề, mức độ nghiêm trọng, giải pháp hoặc thời gian khắc phục]

|  | **Vấn đề** | **Mô tả vấn đề** | **Mức độ** | **Xử lý** | **Trạng thái** |
| --- | --- | --- | --- | --- | --- |
| 1 |  |  |  |  |  |
| 2 |  |  |  |  |  |
| 3 |  |  |  |  |  |

# 10. Xác nhận nghiệm thu tính năng sản phẩm

|  | **Đại diện nghiệm thu** | **Chức danh** | **Kết quả đạt được/Vấn đề được giải quyết** | **Kết quả nghiệm thu**  (Xác nhận đã nghiệm thu sản phẩm theo đúng yêu cầu đã thống nhất và thời gian cam kết) | **Thời gian phê duyệt** |
| --- | --- | --- | --- | --- | --- |
| 1 |  | Nghiệm thu GTM1.0 | - Điều chỉnh cách tính HMCS - Quy định thời gian thiết lập đầu kỳ - Ngưỡng nghiệp vụ đầu kỳ mới nếu [PARTNER] không thực hiện thiết lập - Cho phép điều chỉnh ngưỡng nghiệp vụ trong ngày - Luôn đảm bảo đủ quỹ khi thiết lập/điều chỉnh ngưỡng nghiệp vụ - Quản lý ngưỡng giám sát ngưỡng nghiệp vụ của [PARTNER] - Quản lý tỷ lệ ký quỹ tối thiểu của [PARTNER] |  |  |

# 11. Tài liệu đính kèm

Danh sách những tài liệu, ticket hay link đính kèm liên quan đến yêu cầu

|  | **Tài liệu** | **Link Tài liệu/Đính kèm** |
| --- | --- | --- |
| 1 |  |  |
| 2 |  |  |
| 3 |  |  |
| 4 |  |  |







