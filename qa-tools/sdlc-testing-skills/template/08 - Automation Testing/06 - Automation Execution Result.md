> **Hướng dẫn sử dụng template:** Nội dung dưới đây được giữ theo format tài liệu mẫu gốc. Khi dùng cho dự án mới, thay các placeholder như `[PROJECT_CODE]`, `[PROJECT_NAME]`, `[SYSTEM_NAME]`, `[ENV]`, `[OWNER]`, `[LINK]`; giữ lại các bảng, tiêu chí, checklist và các con số baseline nếu còn phù hợp. Nguồn gốc đã sanitize: `Automation Test\Kết quả chạy tạo nghiệp vụ tự động\Kết quả chạy tạo nghiệp vụ tự động.md`.

# Automation Execution Result

> **Mục đích sử dụng:** Dùng báo cáo kết quả chạy Automation theo round/sprint/release, gồm pass/fail, issue, evidence và action.

<https://[CONFLUENCE_DOMAIN]/wiki/pages/[PAGE_ID]>

| **STT** | **Ngày giờ thực hiện** | **Kết quả thực hiện** | **Tỷ lệ Pass/Fail** | **Nguyên nhân** | **Ghi chú khác** |
| --- | --- | --- | --- | --- | --- |
| 1 | 22h15 -3/6/2025 - 8h50- 4/6/2025 | 6624 nghiệp vụ  đến được trạng thái cuối (ACCEPTED, DENIED, TIMEOUT, EXPIRED, REJETED )  258 nghiệp vụ (INIT, PROCESS) | PASS: ~ 96%  FAIL: ~ 4% | - đêm qua từ tầm 22h 1 số infra service bị restart, dẫn đến tỉ lệ not final cao - đêm nay 4/6, 23h team infra sẽ nâng cấp để sửa dứt điểm việc restart | 12 nghiệp vụ/1 phút |
| 2 | 22h15 -4/6/2025 - 8h50- 5/6/2025 | số liệu chạy hôm qua đây Hiệp nhé, tổng 7079 nghiệp vụ:   - 6793 ~ **95%** đến được trạng thái cuối (EXPRIED, DENIED, TIMEOUT, ACCEPTED, REJECTED) - 286 **~5%** ở trạng thái INIT hiện ko còn trạng thái PROCESSED | PASS: 96%  FAIL: 4% | lỗi này do data của bảng [USER_OR_PARTNER]\_limit\_by\_session bị duplicate. Bọn em sẽ thêm UK và rà lại logic gen |  |
| 3 | 21h00 -5/6/2025 - 8h50- 6/6/2025 | 6892 nghiệp vụ, 100% đã về trạng thái cuối (EXPRIED, DENIED, TIMEOUT, ACCEPTED, REJECTED) nhé @Nguyễn Văn Hiệp @Lê Quang Thiệu | PASS: 100% |  |  |
| 4 | 21h00 -6/6/2025 - 8h50- 7/6/2025 | **58216** nghiệp vụtương đương ~ **41** nghiệp vụ/1 phút trong đó: 19 nghiệp vụ ở trạng thái PROCESS không đến được trạng thái cuối, tỉ lệ fail 0.03% | PASS: 99,007% |  |  |
| 5 | 21h05 - 07/06/2025 08h36- 09/06/2025 | Ghi nhận trong transaction log  **194.219** trong đó có 3 nghiệp vụ chưa đến trạng thái cuối ( đang ở INIT và PROCESS)  Jmeter : Tổng 177.973 (Lỗi 6680 ~3.75%) nghiệp vụ | PASS: **99,99%** | TRANSACTION\_CODE VNTTVNVXA2ATXN-20250607220844273198 BFTVVNVXA2ATXN-20250607220922416109 SBITVNVXA2ATXN-20250608140526886839  SENDER\_TRANS\_CODE TXN-20250607220844273198 TXN-20250607220922416109 TXN-20250608140526886839 | image-20250610-040654.png |
| 6 | 20h00 -6/9/2025 - 8h50- 6/10/2025 | 15497 nghiệp vụ đều đến trạng thái cuối  Tuy nhiên thống kê ở [SIMULATOR] là 61890 nghiệp vụ | Tỉ lệ Pass nghiệp vụ: 100%  Tỉ lệ lỗi khi chạy Error rate 1,01% (Jmeter) | Lỗi Oracle DB bị tràn bộ nhớ nên không ghi nhận đầy đủ nghiệp vụ, [thread trao đổi]([GOOGLE_CHAT_LINK])  Error rate 1,01% (Jmeter) image-20250610-035206.png |  |
| 7 | 2025-06-10 19:32:00  2025-06-11 08:46:00 | - Tổng số nghiệp vụ ghi nhận ở [SYSTEM_NAME]\_TRANS\_QC.TRANSACTION là **111083** (100% đến trạng thái cuối) - Tổng số nghiệp vụ ghi nhận ở Jmeter là **120718** nhiều hơn ở DB là **9.635** nghiệp vụ - Tổng số ghi nhận ở simulator **107894** | PASS ở bảng transaction: 100%  Error Rate (Jmeter): 2,1% | Screenshot 2025-06-11 at 09-10-01 Apache JMeter Dashboard.png |  |
| 8 | `2025-06-12 21:13:00`  `2025-06-13 09:00:00` | - Có 36/60191 ~ **0.059%** nghiệp vụ lỗi chưa đến trạng thái cuối - Số liệu trên Jmeter: 79281 nghiệp vụ, 79288 inquiry, **Error rate: 0.04%** - Số liệu trên [SIMULATOR] total 91020 (cả transaction và inquiry) |  | Screenshot 2025-06-13 at 12-10-36 Apache JMeter Dashboard.png |  |
| 9 | `2025-06-14 14:50:00`  `2025-06-16 10:33:00` | Trên DB transaction ghi nhận **19/280811 ~ 0.006%** lỗi nghiệp vụ ko đến trạng thái cuối (đang ở trạng thái INITIATED)  Số nghiệp vụ 357888 (fail 13810) ~ 3.86% |  | Screenshot 2025-06-16 at 10-40-23 Apache JMeter Dashboard.png | <[GOOGLE_DRIVE_LINK]>  đầu incoming có đổi phần commit dữ liệu vào database từ hôm 11/06 nên khả năng bị ảnh hưởng. Trước đó đang đặt transactional ở bước lưu database thôi, mới đổi lại đặt transactional ở toàn bộ hàm xử lý |







