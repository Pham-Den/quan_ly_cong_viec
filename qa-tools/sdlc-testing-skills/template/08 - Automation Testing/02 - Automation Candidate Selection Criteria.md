> **Hướng dẫn sử dụng template:** Nội dung dưới đây được giữ theo format tài liệu mẫu gốc. Khi dùng cho dự án mới, thay các placeholder như `[PROJECT_CODE]`, `[PROJECT_NAME]`, `[SYSTEM_NAME]`, `[ENV]`, `[OWNER]`, `[LINK]`; giữ lại các bảng, tiêu chí, checklist và các con số baseline nếu còn phù hợp. Nguồn gốc đã sanitize: `Automation Test\Tiêu chí chọn Tính năng-US-Ticket để thực hiện Auto trong Sprint.md`.

# Automation Candidate Selection Criteria

> **Mục đích sử dụng:** Dùng chọn US/ticket/testcase phù hợp để Automation trong sprint/release dựa trên độ ổn định, tần suất regression và giá trị tái sử dụng.

<https://[CONFLUENCE_DOMAIN]/wiki/pages/[PAGE_ID]>

Việc chọn các User Story (US) phù hợp để thực hiện Automation testing là yếu tố quan trọng để tối ưu hóa chất lượng kiểm thử và tiết kiệm thời gian. Dưới đây là bộ tiêu chí để team áp dụng khi quyết định US nào sẽ được Automation trong mỗi sprint:

## 1. Liên quan đến các luồng quan trọng (Critical Business Flows)

- **Mô tả**: Ưu tiên các US thuộc các luồng cốt lõi của hệ thống [DOMAIN], ví dụ: truy vấn tài khoản, xử lý nghiệp vụ, luồng nghiệp vụ chính,, hoặc báo cáo nghiệp vụ….
- **Lý do**: Lỗi trong các luồng này có tác động lớn đến người dùng và doanh nghiệp, nên cần được kiểm tra kỹ lưỡng và thường xuyên thông qua Automation.
- **Ví dụ**: US về xử lý nghiệp vụ liên đối tác/tổ chức bên ngoài.

## 2. Có tài liệu rõ ràng

- **Mô tả**: Chọn các US có yêu cầu (requirements) và tài liệu kỹ thuật (API specs, UI mockups) được mô tả đầy đủ, rõ ràng, và ít thay đổi trong các sprint sau.
- **Lý do**: Tài liệu rõ ràng giúp giảm thời gian phân tích và đảm bảo test case chính xác. US ổn định giảm chi phí bảo trì script Automation.
- **Ví dụ**: US liên quan đến API với Swagger/OpenAPI documentation hoàn chỉnh.

## 3. Tính tái sử dụng cao

- **Mô tả**: Ưu tiên các US mà bộ test case hoặc script Automation có thể được tái sử dụng cho các sprint sau hoặc các US tương tự, **đặc biệt là các US liên quan đến kiểm tra dữ liệu lớn hoặc nhiều trường hợp (data-driven testing).**
- **Lý do**: Tăng giá trị dài hạn của Automation, đặc biệt trong regression testing.
- **Ví dụ**: US kiểm tra dữ liệu nghiệp vụ với các trạng thái khác nhau (thành công, thất bại, timeout).

## 4. Manual testing tốn thời gian hoặc dễ sai sót

- **Mô tả**: Chọn các US mà nếu kiểm tra thủ công (manual testing) sẽ mất nhiều thời gian hoặc dễ xảy ra lỗi do con người, ví dụ: kiểm tra nhiều trường dữ liệu, luồng phức tạp, hoặc lặp lại nhiều lần.
- **Lý do**: Automation giúp tiết kiệm thời gian và tăng độ chính xác so với manual testing.
- **Ví dụ**: US yêu cầu kiểm tra báo cáo tài chính với hàng trăm dòng dữ liệu.

## 5. Khả thi trong khung thời gian của sprint

- **Mô tả**: Đảm bảo thời gian ước lượng để phát triển Automation script (bao gồm code, debug, và tích hợp) phù hợp với độ dài của sprint (thường 2-3 tuần).
- **Lý do**: Tránh ảnh hưởng đến tiến độ kiểm thử chung của sprint, đặc biệt khi workload cao.
- **Ví dụ**: US đơn giản như kiểm tra API đăng nhập có thể hoàn thành Automation trong 1-2 ngày.

## 6. Tác động lớn nếu có lỗi

- **Mô tả**: Ưu tiên các US mà nếu xảy ra lỗi sẽ gây ảnh hưởng nghiêm trọng đến trải nghiệm người dùng, uy tín doanh nghiệp, tài chính.
- **Lý do**: Automation giúp kiểm tra thường xuyên và giảm rủi ro ở các khu vực nhạy cảm.
- **Ví dụ**: US liên quan đến tính toán phí nghiệp vụ hoặc xác minh danh tính người dùng.

## Hướng dẫn áp dụng

1. **Trong Sprint Planning**:

   - Phân tích danh sách US cùng PO và DEV để xác định các US phù hợp với tiêu chí trên.
   - Đánh giá độ ưu tiên dựa trên giá trị kinh doanh, độ phức tạp, và thời gian thực hiện.
2. **Ưu tiên theo mức độ quan trọng**:

   - Sắp xếp US theo thứ tự ưu tiên: **critical flows > tái sử dụng cao > tiết kiệm thời gian > khả thi trong sprint.**
3. **Thực hiện và đánh giá**:

   - Phát triển Automation script cho 1-2 US mỗi sprint (tùy workload).
   - Tích hợp vào CI/CD và báo cáo kết quả (pass/fail) trong Sprint Review.
4. **Duy trì và cải thiện**:

   - Theo dõi chi phí bảo trì script và tối ưu hóa framework Automation để tăng hiệu quả.

## Công cụ đề xuất

- **API Testing**: Postman, Robot Framework
- **CI/CD Integration**: Jenkins, GitLab CI, GitHub Actions.
- **Reporting**: Báo cáo tự xây







