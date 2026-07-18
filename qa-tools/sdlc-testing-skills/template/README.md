# QA Template Library - Source-based

Bộ này được tạo bằng cách copy và sanitize từ bộ mẫu gốc `project/docs/[PROJECT_QA_SPACE]`, sau đó sắp xếp lại theo STLC để publish lên Confluence và tái sử dụng cho dự án khác.

## Quy tắc sử dụng

- Chỉ dùng nội dung có nguồn từ bộ gốc, không tự tạo thêm template nghiệp vụ mới.
- Giữ nguyên format bảng/heading/checklist từ bộ gốc.
- Các con số baseline chính trong Performance Test, OAT và PT report được giữ lại khi không nhạy cảm; các số phân bổ đặc thù theo đối tác/dự án đã được làm mờ hoặc thay bằng số mẫu.
- Các tên dự án/hệ thống/tổ chức/endpoint/IP/email/link nhạy cảm đã được thay bằng placeholder.
- Khi dùng cho dự án mới, thay placeholder như `[PROJECT_CODE]`, `[PROJECT_NAME]`, `[SYSTEM_NAME]`, `[ENV]`, `[OWNER]`, `[LINK]`.
- Các ảnh/screenshot gốc được thay bằng `[IMAGE_PLACEHOLDER]` để tránh lộ dữ liệu dự án.

## STLC folders

1. `01 - Requirement Review`: chưa có tài liệu nguồn tương ứng trong bộ gốc nên để trống.
2. `02 - Test Plan`: copy từ `Test Plan`.
3. `03 - Test Design`: copy từ `High Level Test case` và `Testing Guideline`.
4. `04 - Test Case and Test Data`: copy từ `Test Template`.
5. `05 - Test Execution`: copy từ `Test Information` root.
6. `06 - Test Report`: copy từ `Test Report`.
7. `07 - Defect Management`: chưa có tài liệu nguồn riêng trong bộ gốc nên để trống.
8. `08 - Automation Testing`: copy từ `Automation Test`.
9. `09 - Performance Testing`: copy từ `Performance Test`.
10. `10 - Security Testing`: copy từ `Security Test`.
11. `11 - OAT`: copy từ OAT source folder.
12. `12 - UAT and Release Gate`: copy từ `UAT test` và `DEMO hệ thống`.
13. `13 - QC Knowledge Sharing`: copy từ onboarding, chia sẻ nghiệp vụ và hướng dẫn test information.






