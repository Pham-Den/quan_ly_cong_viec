> **Hướng dẫn sử dụng template:** Nội dung dưới đây được giữ theo format tài liệu mẫu gốc. Khi dùng cho dự án mới, thay các placeholder như `[PROJECT_CODE]`, `[PROJECT_NAME]`, `[SYSTEM_NAME]`, `[ENV]`, `[OWNER]`, `[LINK]`; giữ lại các bảng, tiêu chí, checklist và các con số baseline nếu còn phù hợp. Nguồn gốc đã sanitize: `Performance Test\Performance Test Plan\[PROJECT_CODE]-MVP0\[PROJECT_CODE]-MVP0.md`.

# Performance Test Phase Detail Plan

> **Mục đích sử dụng:** Dùng cho kế hoạch chi tiết theo phase/sprint/release, bám theo Master Plan. Giữ ma trận testcase, target TPS, duration, baseline/actual date, owner, status, issue/action và link Jenkins/report.

<https://[CONFLUENCE_DOMAIN]/wiki/pages/[PAGE_ID]>

# Overview

- PT Master Plan: [PROJECT_CODE]-MVP0.5] PT Master Plan

|  |  |  |  |
| --- | --- | --- | --- |
| **Task** | **Manday** | **Start** | **End** |
| Prepare before performance testing | 31 | 8-Aug | 06-Sep |
| Execute performance testing | 70.75 | 08-Sep | 18-Oct |
| Summary report & sign off | 3 | 20-Oct | 21-Oct |
| Buffer (15%) | 16 | 20-Oct | 25-Oct |
| **Total** | **120** |  |  |

## Detail

- Performance Test Case: <[GOOGLE_DOC_LINK]>

|  |  |  |  |  |  |  |  |  |  |  |  |  |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Plan | Plan | Plan | Plan | Plan | Plan | Baseline | Baseline | Actual | Actual | Progress Report | Progress Report | Progress Report |
| No | Action Item | Action Item | Action Item | PIC [PARTNER_OR_BUSINESS_OWNER] | PIC [PROJECT_TEAM] | Start | End | Start | End | Status | Note | Jmeter / Jenkins |
| 1 | Preparation |  |  |  |  |  |  |  |  |  |  |  |
| 1.1 | Research requirement |  |  | [PERF_LEAD] | [TECH_OWNER] | 8-Aug | 16-Aug | 8-Aug | 16-Aug | DONE |  |  |
| 1.2 | Contribuite test strategy |  |  | [PERF_LEAD] | [TECH_OWNER] | 17-Aug | 28-Aug | 17-Aug | 28-Aug | DONE |  |  |
| 1.3 | Create test script |  |  | [PERF_LEAD] | [TECH_OWNER] | 29-Aug | 11-Oct | 29-Aug |  | DONE |  |  |
| a | Individual |  |  |  |  | 29-Aug | 10-Sep | 29-Aug |  | DONE |  |  |
|  | [BUSINESS_DOMAIN] | Financial | Inquiry record |  | [PERF_ENGINEER_1] | 29-Aug | 9-Sep | 29-Aug | 8-Sep | DONE |  |  |
|  |  |  | [BUSINESS_DOMAIN] |  | [PERF_ENGINEER_1] | 29-Aug | 9-Sep | 29-Aug | 8-Sep | DONE |  |  |
|  |  |  | Refund |  | [PERF_ENGINEER_1] | 29-Aug | 9-Sep | 29-Aug | 8-Sep | DONE |  |  |
|  |  | Non-financial | Transaction status inquiry Copy transaction Dispute transaction |  | [PERF_ENGINEER_2] | 3-Sep | 10-Sep | 3-Sep | 10-Sep | DONE |  |  |
|  | [BATCH_PROCESSING_MODULE] | [BATCH_PROCESSING_MODULE] flow with external partners |  |  | [PERF_ENGINEER_2] | 3-Sep | 10-Sep | 3-Sep | 10-Sep | DONE |  |  |
|  |  | [RECONCILIATION_MODULE] flow with [REGULATORY_OR_PARTNER_SCOPE] |  |  | [PERF_ENGINEER_2] | 3-Sep | 10-Sep | 3-Sep | 10-Sep | DONE |  |  |
|  | Management | Operation management |  |  | [PERF_ENGINEER_2] | 3-Sep | 10-Sep | 3-Sep | 10-Sep | DONE |  |  |
|  |  | User/partner management |  |  | [PERF_ENGINEER_2] | 3-Sep | 10-Sep | 3-Sep | 10-Sep | DONE |  |  |
| b | Load mix |  |  |  |  | 11-Sep | 13-Sep | 11-Sep | 15-Sep | DONE |  |  |
|  | Normal day | Working time | [BUSINESS_DOMAIN] financial [BUSINESS_DOMAIN] non-financial |  | [PERF_ENGINEER_1] | 11-Sep | 13-Sep | 11-Sep | 15-Sep | DONE |  |  |
|  |  | Close [BATCH_PROCESSING_MODULE] session | [BUSINESS_DOMAIN] financial [BUSINESS_DOMAIN] non-financial [BATCH_PROCESSING_MODULE] flow with external partners [RECONCILIATION_MODULE] flow with [REGULATORY_OR_PARTNER_SCOPE] |  | [PERF_ENGINEER_2] | 11-Sep | 13-Sep | 11-Sep | 15-Sep | DONE |  |  |
|  | Holiday | Working time | [BUSINESS_DOMAIN] financial [BUSINESS_DOMAIN] non-financial |  | [PERF_ENGINEER_1] | 11-Sep | 13-Sep | 11-Sep |  | DONE |  |  |
|  |  | Close [BATCH_PROCESSING_MODULE] session | [BUSINESS_DOMAIN] financial [BUSINESS_DOMAIN] non-financial [BATCH_PROCESSING_MODULE] flow with external partners [RECONCILIATION_MODULE] flow with [REGULATORY_OR_PARTNER_SCOPE] |  | [PERF_ENGINEER_2] | 11-Sep | 13-Sep | 11-Sep |  | DONE |  |  |
| c | Stress test |  |  |  |  | 11-Sep | 13-Sep | 11-Sep |  | DONE |  |  |
|  | Stress test for [BUSINESS_DOMAIN] | Working time | [BUSINESS_DOMAIN] financial [BUSINESS_DOMAIN] non-financial |  | [PERF_ENGINEER_1] | 11-Sep | 13-Sep | 11-Sep |  | DONE | - tps transfer: 1,029 - tps inquiry: 3,089 - duration: 1 tiếng |  |
|  | Stress test for [BATCH_PROCESSING_MODULE] | Close [BATCH_PROCESSING_MODULE] session | [BUSINESS_DOMAIN] financial [BUSINESS_DOMAIN] non-financial [BATCH_PROCESSING_MODULE] flow with external partners [RECONCILIATION_MODULE] flow with [REGULATORY_OR_PARTNER_SCOPE] |  | [PERF_ENGINEER_2] | 11-Sep | 13-Sep | 11-Sep |  | DONE | - tps transfer: 1,029 - tps inquiry: 3,089 - duration: 1 tiếng |  |
| d | Scalability mix |  |  |  |  | 11-Sep | 13-Sep | 11-Sep |  | DONE |  |  |
|  | Scale up - [BUSINESS_DOMAIN] financial |  |  |  | [PERF_ENGINEER_1] | 11-Sep | 13-Sep | 11-Sep |  | DONE | Dự kiến cần 02 ngày, 25-26/9   - scale tăng dần    - số lượt POD tự auto scale - lost transaction   - 15 phút tăng 1 lần - tăng cho đến số peak   - chạy trong 1h - scale down - giảm dần từ mức holiday -> normal    - chạy nối tiếp kịch bản scale up   - 15 phút giảm 1 lần - tăng cho đến số peak   - chạy trong 1h | - Inquiry transaction - [BUSINESS_DOMAIN] [BUSINESS_FLOW] - Refund   Increase volume From normal to peak (x5 times) |
|  | Scale down - [BUSINESS_DOMAIN] financial |  |  |  | [PERF_ENGINEER_1] | 11-Sep | 13-Sep | 11-Sep |  | DONE | Dự kiến cần 02 ngày, 25-26/9   - scale tăng dần    - số lượt POD tự auto scale - lost transaction   - 15 phút tăng 1 lần - tăng cho đến số peak   - chạy trong 1h - scale down - giảm dần từ mức holiday -> normal    - chạy nối tiếp kịch bản scale up   - 15 phút giảm 1 lần - tăng cho đến số peak   - chạy trong 1h | - Inquiry transaction - [BUSINESS_DOMAIN] [BUSINESS_FLOW] - Refund   (Decrease transaction From peak to normal) |
| e | Soak mix |  |  |  |  | 11-Sep | 13-Sep | 11-Sep | 24-Sep | DONE |  |  |
|  | Normal day | Working time | [BUSINESS_DOMAIN] financial [BUSINESS_DOMAIN] non-financial |  | [PERF_ENGINEER_1] | 11-Sep | 13-Sep | 11-Sep | 24-Sep | DONE | Dự kiến cần 02 ngày, 23-24/9   - normal - peak 4 lần - cần thông tin khoảng thời gian chạy ứng với từng mức tps → hỏi c [PERF_LEAD] |  |
|  |  | Close [BATCH_PROCESSING_MODULE] session | [BUSINESS_DOMAIN] financial [BUSINESS_DOMAIN] non-financial [BATCH_PROCESSING_MODULE] flow with external partners [RECONCILIATION_MODULE] flow with [REGULATORY_OR_PARTNER_SCOPE] |  | [PERF_ENGINEER_2] | 11-Sep | 13-Sep | 11-Sep | 24-Sep | DONE | Dự kiến cần 02 ngày, 23-24/9   - normal - peak 4 lần - cần thông tin khoảng thời gian chạy ứng với từng mức tps → hỏi c [PERF_LEAD] |  |
| f | E2E |  |  |  |  | 15-Sep | 04-Oct | 15-Sep |  | DONE |  |  |
|  | Load test E2E - [BUSINESS_DOMAIN] |  |  |  | [TECH_OWNER] | 15-Sep | 11-Oct | 15-Sep |  | DONE | - Plan & ask [PARTNER_A]/[PARTNER_B] to prepare PT environment |  |
|  | Load test E2E - [BATCH_PROCESSING_MODULE] |  |  |  | [TECH_OWNER] | 15-Sep | 11-Oct | 15-Sep |  | DONE | - Plan & ask [PARTNER_A]/[PARTNER_B] to prepare PT environment - Not yet include integration [REGULATORY_OR_PARTNER_SCOPE] |  |
| 1.4 | Prepare data |  |  | [PERF_LEAD] | [TECH_OWNER] | 29-Aug | 04-Sep | 29-Aug |  | DONE |  |  |
| a | Master data |  |  |  |  | 29-Aug | 30-Aug | 29-Aug | 30-Aug | DONE |  |  |
|  | External partner organizations |  |  |  | [PERF_ENGINEER_2] | 29-Aug | 30-Aug | 29-Aug | 30-Aug | DONE |  |  |
|  | Limit for External partner organizations |  |  |  | [PERF_ENGINEER_2] | 29-Aug | 30-Aug | 29-Aug | 30-Aug | DONE |  |  |
|  | Calendar (working day/holiday) |  |  |  | [PERF_ENGINEER_2] | 29-Aug | 30-Aug | 29-Aug | 30-Aug | DONE |  |  |
| b | Historical data |  |  |  |  | 25-Aug | 18-Oct | 25-Aug |  | DONE |  |  |
|  | Hot layer ([BUSINESS_DOMAIN] transaction) | 2 lastest days | 10M \* 2 days = 20M txn |  | [PERF_ENGINEER_2] | 29-Aug | 30-Aug | 29-Aug | 30-Aug | DONE |  |  |
|  | Warm layer ([BATCH_PROCESSING_MODULE] transaction) | Partition: 1 month | 10M \* 30 days = 300M txn |  | [PERF_ENGINEER_2] | 25-Aug | 18-Oct | 25-Aug |  | DONE | - 8/9 - 70M txn / 300M - 17/9 - 94.5M / 300M - 22/9 - 126M / 300M - 25/9 - 139M / 300M - 27/9 - 150M / 300M - 2/10 - 182 M / 300M - 8/10 - 212 M / 300M |  |
|  | Warm layer ([BATCH_PROCESSING_MODULE] transaction) | 6 month | 10M \* 180 days = 1.8B txn |  | [PERF_ENGINEER_2] |  |  |  |  | CANCELED | - No need prepare data volume of 6 months |  |
| c | Synthetic data |  |  |  |  | 29-Aug | 13-Sep | 29-Aug |  | DONE |  |  |
|  | Inquiry | Ratio by inquiry type | Inquiry by QR |  | [PERF_ENGINEER_2] | 29-Aug | 30-Aug | 29-Aug | 30-Aug | DONE | Business confirm source partner needs to convert required identifier before sending request before send request to [SYSTEM_NAME] |  |
|  |  |  | Inquiry by record |  | [PERF_ENGINEER_2] | 29-Aug | 30-Aug | 29-Aug | 30-Aug | DONE |  |  |
|  |  |  | Inquiry by alias |  | [PERF_ENGINEER_2] | 29-Aug | 30-Aug | 29-Aug | 30-Aug | DONE | Business confirm destination partner needs to lookup configured identifier types |  |
|  |  |  | Inquiry by phone number |  | [PERF_ENGINEER_2] | 29-Aug | 30-Aug | 29-Aug | 30-Aug | DONE | Business confirm destination partner needs to lookup configured identifier types |  |
|  |  | Ratio by partner group | 4 large partners (48.34%) |  | [PERF_ENGINEER_2] | 29-Aug | 30-Aug | 29-Aug | 30-Aug | DONE | 4M record |  |
|  |  |  | 6 medium partners (26.38%) |  | [PERF_ENGINEER_2] | 29-Aug | 30-Aug | 29-Aug | 30-Aug | DONE | 3M record |  |
|  |  |  | 36 small partners (25.28%) |  | [PERF_ENGINEER_2] | 29-Aug | 30-Aug | 29-Aug | 30-Aug | DONE | 3.6M record |  |
|  |  | Ratio by happy/unhappy | Happy case (98%) |  | [PERF_ENGINEER_2] | 29-Aug | 30-Aug | 29-Aug | 30-Aug | DONE | 10.6M record |  |
|  |  |  | Unhappy case due to client (0.76%) |  | [PERF_ENGINEER_2] | 29-Aug | 30-Aug | 29-Aug | 30-Aug | DONE | 32K record |  |
|  |  |  | Unhappy case due to network/server (1.24%) |  | [PERF_ENGINEER_2] | 29-Aug | 30-Aug | 29-Aug | 30-Aug | DONE | 68K record |  |
|  | [BUSINESS_FLOW] | Ratio by partner group | 4 large partners (48.34%) |  | [PERF_ENGINEER_2] | 29-Aug | 30-Aug | 29-Aug | 30-Aug | DONE | 4M record |  |
|  |  |  | 6 medium partners (26.38%) |  | [PERF_ENGINEER_2] | 29-Aug | 30-Aug | 29-Aug | 30-Aug | DONE | 3M record |  |
|  |  |  | 40 small partners (25.28%) |  | [PERF_ENGINEER_2] | 29-Aug | 30-Aug | 29-Aug | 30-Aug | DONE | 3.6M record |  |
|  |  | Ratio by happy/unhappy | Happy case (98%) |  | [PERF_ENGINEER_2] | 29-Aug | 30-Aug | 29-Aug | 30-Aug | DONE | 10.6M record |  |
|  |  |  | Unhappy case due to client (0.76%) |  | [PERF_ENGINEER_2] | 29-Aug | 30-Aug | 29-Aug | 30-Aug | DONE | 32K record |  |
|  |  |  | Unhappy case due to network/server (1.24%) |  | [PERF_ENGINEER_2] | 29-Aug | 30-Aug | 29-Aug | 30-Aug | DONE | 68K record |  |
|  | Refund |  |  |  | [PERF_ENGINEER_2] | 25-Aug | 13-Sep | 25-Aug | 13-Sep | DONE | Base on Historical data - Warm layer |  |
|  | Non financial |  |  |  | [PERF_ENGINEER_2] | 25-Aug | 13-Sep | 25-Aug | 13-Sep | DONE | Base on Historical data - Warm layer |  |
|  | [BATCH_PROCESSING_MODULE] to external partners |  |  |  | [PERF_ENGINEER_2] | 25-Aug | 13-Sep | 25-Aug | 13-Sep | DONE | Base on Historical data - Warm layer |  |
|  | [BATCH_PROCESSING_MODULE] to [REGULATORY_OR_PARTNER_SCOPE] |  |  |  | [PERF_ENGINEER_2] | 25-Aug | 13-Sep | 25-Aug | 13-Sep | DONE | Base on Historical data - Warm layer |  |
|  | Operation management |  |  |  | [PERF_ENGINEER_2] | 25-Aug | 13-Sep | 25-Aug | 13-Sep | DONE | Base on Historical data - Warm layer |  |
|  | User/partner management |  |  |  | [PERF_ENGINEER_2] | 25-Aug | 13-Sep | 25-Aug | 13-Sep | DONE | Base on Historical data - Warm layer |  |
| 1.5 | Create mock server |  |  |  | [TECH_OWNER] | 29-Aug | 30-Aug | 29-Aug | 30-Aug | DONE |  |  |
|  | [SIMULATOR] source partner |  |  |  |  | 29-Aug | 30-Aug | 29-Aug | 30-Aug | DONE |  |  |
|  | Config to go through switch & firewall |  |  |  | [TECH_OWNER] | 29-Aug | 30-Aug | 29-Aug | 30-Aug | DONE |  |  |
|  | [SIMULATOR] destination partner |  |  |  |  | 29-Aug | 30-Aug | 29-Aug | 30-Aug | DONE |  |  |
|  | Mockup response happy msg |  |  |  | Tùng ĐT | 29-Aug | 30-Aug | 29-Aug | 30-Aug | DONE |  |  |
|  | Mockup response unhappy msg From client |  |  |  | Tùng ĐT | 29-Aug | 30-Aug | 29-Aug | 30-Aug | DONE |  |  |
|  | Mockup response unhappy msg From server: error code = ERR-0031 (Internal server error) |  |  |  | Tùng ĐT | 29-Aug | 30-Aug | 29-Aug | 30-Aug | DONE |  |  |
|  | Mockup response unhappy msg From server: delay time 5s + error\_code = ERR-0029 (timeout) |  |  |  | Tùng ĐT | 29-Aug | 30-Aug | 29-Aug | 30-Aug | DONE |  |  |
| 1.6 | Verify environment |  |  |  | [TECH_OWNER] | 30-Aug | 11-Oct | 30-Aug |  | DONE |  |  |
|  | Verify Infrastructure / Security |  |  |  | [TECH_OWNER] | 30-Aug | 13-Sep | 30-Aug | 13-Sep | DONE | 15/9 - Security confirm đã done: [SYSTEM_NAME]] Private Cloud Infra Security Report 14/09/2025 |  |
|  | Verify Functional |  |  |  | [QC_OWNER] | 5-Sep | 10-Sep | 5-Sep | 10-Sep | DONE |  |  |
|  | Prepare connection with [PARTNER_A] |  |  |  | [TECH_OWNER] | 22-Sep | 11-Oct | 17-Sep |  | DONE | - 17/9: Discussing with infra/security [SYSTEM_NAME] to confirm how to open connection - 25/9: [SYSTEM_NAME] finished preparation, waiting [PARTNER_A] open connection - 8/10: [SYSTEM_NAME]/[PARTNER_A] finished open connection |  |
|  | Prepare connection with [PARTNER_B] |  |  |  | [TECH_OWNER] | 22-Sep | 11-Oct | 17-Sep |  | DONE | - 25/9: [SYSTEM_NAME] finished preparation, waiting [PARTNER_B] prepare PT environment and open connection - [PARTNER_B] plan finish open connection by 11/10 |  |
|  | Verify connection with [PARTNER_A] |  |  |  | [TECH_OWNER] | 6-Oct | 11-Oct | 6-Oct |  | DONE |  |  |
|  | Verify connection with [PARTNER_B] |  |  |  | [TECH_OWNER] | 6-Oct | 11-Oct | 6-Oct |  | DONE |  |  |
|  | Verify connection with [REGULATORY_OR_PARTNER_SCOPE] |  |  |  | [TECH_OWNER] | TBD | TBD |  |  | CANCELLED | - No need do performance test with [REGULATORY_OR_PARTNER_SCOPE] |  |
| 1.7 | Prepare load machine |  |  |  | [TECH_OWNER] | 29-Aug | 30-Aug | 29-Aug | 30-Aug | DONE |  |  |
| 2 | Execution |  |  |  |  | 15-Sep | 18-Oct | 15-Sep |  |  |  |  |
|  | Testcase 01 - Individual normal Inquiry record |  |  |  | [PERF_ENGINEER_1]  [PERF_ENGINEER_2] | 15-Sep | 27-Sep | 15-Sep |  | DONE | - Mục tiêu tps 1: 463 - Mục tiêu tps 2: 926.87 | chạy lại điền link jenkins + report |
|  | Testcase 02 - Individual peak Inquiry transaction |  |  |  | [PERF_ENGINEER_1]  [PERF_ENGINEER_2] | 15-Sep | 27-Sep | 22-Sep |  | DONE | - Mục tiêu tps 1: 778 - Mục tiêu tps 2: 1557.3 |  |
|  | Testcase 03 - Individual normal [BUSINESS_DOMAIN] |  |  |  | [PERF_ENGINEER_1]  [PERF_ENGINEER_2] | 15-Sep | 27-Sep | 15-Sep |  | DONE | - Mục tiêu tps: 308.96 | - sửa lại tps refund = 5      - chạy lại điền link jenkins + report |
|  | Testcase 04 - Individual peak [BUSINESS_DOMAIN] |  |  |  | [PERF_ENGINEER_1]  [PERF_ENGINEER_2] | 15-Sep | 27-Sep | 15-Sep |  | DONE | - Mục tiêu tps: 519.1 | - sửa lại tps refund = 10      - chạy lại điền link jenkins + report |
|  | Testcase 05 - Individual non financial |  |  |  | [PERF_ENGINEER_1]  [PERF_ENGINEER_2] | 15-Sep | 27-Sep | 15-Sep | 27-Sep | DONE | - Mục tiêu tps: 10 - 23/9: [SYSTEM_NAME]][2025-09-27] PT Result | - sửa lại tps = 10      - chạy lại điền link jenkins + report |
|  | Testcase 06 - Individual [BATCH_PROCESSING_MODULE] flow with external partners |  |  |  | [PERF_ENGINEER_1]  [PERF_ENGINEER_2] | 15-Sep | 27-Sep | 15-Sep | 27-Sep | DONE | - Mục tiêu chạy với 1 phiên 5tr txn - 20/9: [SYSTEM_NAME]][2025-09-27] PT Result | - Tìm phiên có số lượng txn ~ 5tr txn - Capture thời gian chạy của job [BATCH_PROCESSING_MODULE] |
|  | Testcase 07 - Individual [BATCH_PROCESSING_MODULE] flow with [REGULATORY_OR_PARTNER_SCOPE] |  |  |  | [PERF_ENGINEER_1]  [PERF_ENGINEER_2] | 15-Sep | 27-Sep | 15-Sep | 27-Sep | DONE | - Mục tiêu chạy với 1 phiên 5tr txn - 20/9: [SYSTEM_NAME]][2025-09-27] PT Result | - Tìm phiên có số lượng txn ~ 5tr txn - Capture thời gian chạy của job [BATCH_PROCESSING_MODULE] |
|  | Testcase 08 - Individual Operation management |  |  |  | [PERF_ENGINEER_1]  [PERF_ENGINEER_2] | 15-Sep | 27-Sep | 15-Sep | 27-Sep | DONE | - CCU:5 → tps: 5 - Simulate operation transactions - 23/9: [SYSTEM_NAME]][2025-09-27] PT Result | - sửa lại tps 5      - chạy lại điền link jenkins + report - check lỗi 500 [Jenkins](https://[SYSTEM_NAME]-jenkins.ops.[ORG_NAME].mobi/job/PERFORMANCE_TEST/view/Individual/job/Performance_Test_Idv_Ops_Portal/25/Ant_20Report/) -> package PKG\_GENERIC\_CRUD bị invalid |
|  | Testcase 09 - Individual User/partner management |  |  |  | [PERF_ENGINEER_1]  [PERF_ENGINEER_2] | 15-Sep | 27-Sep | 15-Sep |  | DONE | - CCU: 250 → tps: 250 Simulate transactions From External partner organizations - 24/9: [SYSTEM_NAME]][2025-09-27] PT Result | - sửa lại tps 250      - chạy lại điền link jenkins + report - check lỗi [Jenkins](https://[SYSTEM_NAME]-jenkins.ops.[ORG_NAME].mobi/job/PERFORMANCE_TEST/view/Individual/job/Performance_Test_Idv_[USER_OR_PARTNER]_Portal/8/Ant_20Report/) |
|  | Testcase 10 - Load mix normal day |  |  |  | [PERF_ENGINEER_1]  [PERF_ENGINEER_2] | 22-Sep | 4-Oct | 22-Sep |  | DONE | Mục tiêu 1:   - tps transfer: 150 - tps inquiry: 225   Mục tiêu 2:   - tps transfer: 150 - tps inquiry: 450   Mục tiêu 3:   - tps transfer: 308 - tps inquiry: 450   Mục tiêu 4:   - tps transfer: 308 - tps inquiry: 926 | 22/9: [Jenkins](https://[SYSTEM_NAME]-jenkins.ops.[ORG_NAME].mobi/job/PERFORMANCE_TEST/view/Load%20mix/job/Performance_Test_Load_Mix_Normal_Day/42/)   - tps transfer: 150 - tps inquiry: 450   gen report → done  capture tình trạng app/infra đưa vào report |
|  | Testcase 11 - Load mix holiday day |  |  |  | [PERF_ENGINEER_1]  [PERF_ENGINEER_2] | 29-Sep | 4-Oct | 29-Sep |  | DONE | Mục tiêu 1: Load mix peak day   - tps transfer: 519 - tps inquiry: 778   Mục tiêu 2: Load mix holiday day   - tps transfer: 1029 - tps inquiry: 1544 |  |
|  | Testcase 16 - Soak test |  |  |  | [PERF_ENGINEER_1]  [PERF_ENGINEER_2] | 29-Sep | 4-Oct | 29-Sep |  | DONE |  |  |
|  | Testcase 14 - Scale up |  |  |  | [PERF_ENGINEER_1]  [PERF_ENGINEER_2] | 04-Oct | 11-Oct |  |  | DONE |  |  |
|  | Testcase 15 - Scale down |  |  |  | [PERF_ENGINEER_1]  [PERF_ENGINEER_2] | 04-Oct | 11-Oct |  |  | DONE |  |  |
|  | Testcase 12 - Stress test [BUSINESS_DOMAIN] |  |  |  | [PERF_ENGINEER_1]  [PERF_ENGINEER_2] | 04-Oct | 11-Oct |  |  | DONE |  |  |
|  | Testcase 13 - Stress test batch processing |  |  |  | [PERF_ENGINEER_1]  [PERF_ENGINEER_2] | 04-Oct | 11-Oct |  |  | DONE |  |  |
|  | Testcase 17 - [BUSINESS_DOMAIN] E2E |  |  |  | [PERF_ENGINEER_1]  [PERF_ENGINEER_2] | 13-Oct | 18-Oct |  |  | DONE |  |  |
|  | Testcase 18 - [BATCH_PROCESSING_MODULE] E2E |  |  |  | [PERF_ENGINEER_1]  [PERF_ENGINEER_2] | 13-Oct | 18-Oct |  |  | DONE |  |  |









