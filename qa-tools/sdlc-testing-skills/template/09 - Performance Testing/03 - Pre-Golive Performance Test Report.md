> **Hướng dẫn sử dụng template:** Nội dung dưới đây được giữ theo format tài liệu mẫu gốc. Khi dùng cho dự án mới, thay các placeholder như `[PROJECT_CODE]`, `[PROJECT_NAME]`, `[SYSTEM_NAME]`, `[ENV]`, `[OWNER]`, `[LINK]`; giữ lại các bảng, tiêu chí, checklist và các con số baseline nếu còn phù hợp. Nguồn gốc đã sanitize: `Performance Test\Performance Test Report\[SYSTEM_NAME]][2026-03-08] PT Report - Release 3 March - 2026\[SYSTEM_NAME]][2026-03-08] PT Report - Release 3 March - 2026.md`.

# Pre-Golive Performance Test Report

> **Mục đích sử dụng:** Dùng để kết luận hiệu năng trước golive/technical golive. Giữ testing info, scope, result theo scenario, SLA vs actual, server utilization, conclusion, risk và recommendation.

<https://[CONFLUENCE_DOMAIN]/wiki/pages/[PAGE_ID]>

# REFERENCES

| **No** | **Document** | **Note** |
| --- | --- | --- |
| 1 | PT Master Plan | <https://[JIRA_OR_CONFLUENCE_DOMAIN]/wiki/spaces/[PROJECT_NAME]/pages/[PAGE_ID]> |
| 2 | PT Detail Plan | <https://[JIRA_OR_CONFLUENCE_DOMAIN]/wiki/spaces/[PROJECT_NAME]/pages/[PAGE_ID]> |
| 3 | PT Data Test | <https://[JIRA_OR_CONFLUENCE_DOMAIN]/wiki/spaces/[PROJECT_NAME]/pages/[PAGE_ID]> |

# **I. TESTING INFO**

## **1.1. Test execution time**

|  |  |  |  |
| --- | --- | --- | --- |
| **Type of testing** | **Type of system** | **From date** | **To date** |
| Performance Test (PT) | [SYSTEM_NAME] |  |  |

## **1.2. Team External Partners**

|  |  |  |  |
| --- | --- | --- | --- |
| **No** | **Name** | **Part** | **Role** |
| 1 |  | Solution Architect [PROJECT_TEAM] | - Tham gia xây dựng chiến lược, kế hoạch, mục tiêu Volumn/TPS/SLA - Điều phối team PT của [PROJECT_TEAM] thực hiện kế hoạch PT |
| 2 |  | IT Quality Engineering [PROJECT_TEAM] | - Xây dựng và thực hiện các kịch bản kiểm thử theo kế hoạch PT |
| 3 |  | IT Performance Engineering [PROJECT_TEAM] | - Giám sát và phân tích kết quả các kịch bản kiểm thử theo kế hoạch PT |
| 4 |  | IT Software Engineering [PROJECT_TEAM] | - Hỗ trợ hiệu chỉnh công cụ simulator đáp ứng các tình huống theo yêu cầu của kịch bản PT |

## 1.3. Scope

### 1.3.1. Test environment

- Kiến trúc ứng dụng: <https://[JIRA_OR_CONFLUENCE_DOMAIN]/wiki/spaces/[PROJECT_NAME]/pages/[PAGE_ID]/[ORG_NAME]+[BUSINESS_DOMAIN]+[CORE_MODULE]+System+SAD#3.1.-Diagram-(~C2)>
- Kiến trúc hạ tầng: <https://[JIRA_OR_CONFLUENCE_DOMAIN]/wiki/spaces/[PROJECT_NAME]/pages/[PAGE_ID]/[ORG_NAME]+[BUSINESS_DOMAIN]+[CORE_MODULE]+System+SAD#4.1.-Deployment-diagram>
- Tài nguyên môi trường PT: <https://[JIRA_OR_CONFLUENCE_DOMAIN]/wiki/spaces/[PROJECT_NAME]/pages/[PAGE_ID]/[ORG_NAME]+[BUSINESS_DOMAIN]+[CORE_MODULE]+System+SAD#4.3.-Infrastructure-resources>
- Các thay đổi

  - Code version:

    - [PROJECT_CODE] Release Plan 30.01.2026
    - [PROJECT_CODE] Release Plan 24.02.2026
  - Cassandra: đổi từ 3 host vật lý sang 5 node máy ảo
  - Database Oracle: enable kết nối TLS đáp ứng tuân thủ đề án cấp độ 4
  - Firewall: rà soát chuẩn hóa firewall rule
- Tài liệu Security Policy, Security Rule, tài liệu evidence version code STG & PROD: <[GOOGLE_DOC_LINK]>

### 1.3.2. Test scenario

- Test case: <[GOOGLE_DOC_LINK]>
- Test result detail: [SYSTEM_NAME]][From 2026 -03-07 TO 2026-03-08] [PROD]PT Result

# **II. TESTING RESULT**

|  |  |  |  |  |  |  |  |  |  |  |  |  |  |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| 1 | **Group** | **Scenario** | **Round** | **Time** | **Function** | **SLA** | **SLA** | **SLA** | **Actual** | **Actual** | **Actual** | **Check** | **Result** |
| 2 | **Group** | **Scenario** | **Round** | **Time** | **Function** | **TPS** | **Response time (ms)** | **Error rate (%)** | **TPS** | **Response time (ms)** | **Error rate (%)** | **Check** | **Result** |
| 3 | Luồng nghiệp vụ chính | Testcase 10 - Load mix normal day | 10ph | 07/03/26, 11:20 AM  07/03/26, 11:30 AM | Inquiry [BUSINESS_DOMAIN] | 463  309 | 400  400 | 0.08  0.08 | 472   319 | 199   320 | 0.00   0.00 | **PASS** | Jenkins: <https://[SYSTEM_NAME]-jenkins.ops.[ORG_NAME].mobi/job/PERFORMANCE_TEST/view/Load_mix/job/Performance_Test_Load_Mix_Normal_Day/568/JMeter_20Report/> |
| 4 | Luồng nghiệp vụ chính | Testcase 10 .1- Load mix normal day | 10ph | 07/03/26, 21:24 PM  07/03/26, 21:35 PM | Inquiry [BUSINESS_DOMAIN] | 463  309 | 400  400 | 0.08  0.08 | 472  319 | 302  320 | 0.00  0.00 | **PASS** | Jenkins: Jenkins: <https://[SYSTEM_NAME]-jenkins.ops.[ORG_NAME].mobi/job/PERFORMANCE_TEST/view/Load_mix/job/Performance_Test_Load_Mix_Normal_Day/568/JMeter_20Report/> |
| 5 | Luồng nghiệp vụ chính | Testcase 10 .1- Load mix normal day | 02h | 07/03/26, 18:10 PM  07/03/26, 20:10 PM | Inquiry [BUSINESS_DOMAIN] | 463  309 | 400  400 | 0.08  0.08 | 476  320 | 207  371 | 0.01  0.00 | **PASS** | Jenkins: <https://[SYSTEM_NAME]-jenkins.ops.[ORG_NAME].mobi/job/PERFORMANCE_TEST/view/Load_mix/job/Performance_Test_Load_Mix_Normal_Day/567/JMeter_20Report/> |
| 6 | Luồng nghiệp vụ chính | Testcase 11 - Load mix peak day | 10ph | 07/03/26, 22:12 PM  07/03/26, 22:22 PM | Inquiry [BUSINESS_DOMAIN] | 600  400 | 400  400 | 0.08  0.08 | 619  421 | 202  317 | 0.00  0.00 | **PASS** | Jenkins: <https://[SYSTEM_NAME]-jenkins.ops.[ORG_NAME].mobi/job/PERFORMANCE_TEST/view/Load_mix/job/Performance_Test_Load_Mix_Peak_Day/373/JMeter_5fReport_5fPRODUCTION/> |
| 7 | Luồng nghiệp vụ chính | Testcase 11.1 - Load mix peak day | 01h | 07/03/26, 22:31 PM  07/03/26, 23:31 PM | Inquiry [BUSINESS_DOMAIN] | 600  400 | 400  400 | 0.08  0.08 | 617  418 | 241  423 | 0.02  0.00 | **PASS** | Jenkins:<https://[SYSTEM_NAME]-jenkins.ops.[ORG_NAME].mobi/job/PERFORMANCE_TEST/view/Load_mix/job/Performance_Test_Load_Mix_Peak_Day/374/JMeter_5fReport_5fPRODUCTION/> |
| 8 | Luồng nghiệp vụ chính | Testcase 16 - Soak Test  (Run on staging = 35% Prod) | 08h | 20/03/26, 12:08 AM  20/03/26, 08:22 AM | Inquiry [BUSINESS_DOMAIN] | 140  70 | 400  400 | 0.08  0.08 | 147  76 | 292  278 | 0.00  0.00 | **PASS** | Jenkins:<https://[SYSTEM_NAME]-jenkins.ops.[ORG_NAME].mobi/job/PERFORMANCE_TEST/job/Performance_Test_E2E/350/JMeter_20Report/> |

# **III. SERVER ULTILIZATION**

|  | Testcase 10 .1- Load mix normal day (07/03/26, 18:10 PM 20:10 PM) | Testcase 11.1 - Load mix peak day (07/03/26, 22:31 PM 23:31 PM) | Testcase 16 - Soak Test (20/03/26, 00:12 AM - 08:32 AM) |
| --- | --- | --- | --- |
| **F5** |  |  |  |
| **NGFW** |  |  |  |
| **incoming connector** |  |  |  |
| **External Partner** |  |  |  |
| **Outgoing connector** |  |  |  |
| **[WORKFLOW_ENGINE]** |  |  |  |
| **Oracle** |  |  |  |
| **Postgres for KONG** |  |  |  |
| **Postgres for Key cloak** |  |  |  |
| **Cassandra DB** |  |  |  |

# **IV. CONCLUSION**

- **Trong phạm vi quá trình test**

  - Với tài nguyên và cấu hình hiện tại của môi trường PT, hệ thống [SYSTEM_NAME] đạt yêu cầu với các kịch bản PT đề ra, đáp ứng tối thiểu 10 triệu nghiệp vụ/ngày
  - Mức baseline TPS hệ thống có thể xử lý đồng thời và đảm bảo Response time/Error Rate:

    - **Inquiry ~ 600 TPS**
    - **[BUSINESS_FLOW] Transfer ~ 400 TPS**
  - Kết quả các bài Stress test & Scale test trước đó đã được update kết quả theo link: [SYSTEM_NAME]][2025-12-27] PT Report
- **Đánh giá rủi ro:**

  - Quá trình thực hiện PT chưa thực hiện được các bài Stress test, Scale test trong một khoảng thời gian dài, tuy nhiên do hệ thống hiện tại vẫn đáp ứng được ngưỡng kế hoạch kinh doanh cho tới tháng 5 nên có thể đánh giá rủi ro ở mức độ **LOW**. PT team sẽ thực hiện các bài bổ sung sau Pilot để đánh giá mức độ toàn diện nhất.
- **Trong vận hành thực tế**

  - Cần giám sát các chỉ số của hệ thống [SYSTEM_NAME] và [PARTNER], bao gồm cả ứng dụng và hạ tầng, để kịp thời xử lý các tình huống phát sinh ảnh hưởng performance
  - Cần các thông tin dự báo và kế hoạch tăng trưởng của nghiệp vụ, để kịp thời điều chỉnh tài nguyên đáp ứng nhu cầu nghiệp vụ và đảm bảo performance









