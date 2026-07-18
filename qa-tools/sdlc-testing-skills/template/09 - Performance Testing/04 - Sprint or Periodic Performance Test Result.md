> **Hướng dẫn sử dụng template:** Nội dung dưới đây được giữ theo format tài liệu mẫu gốc. Khi dùng cho dự án mới, thay các placeholder như `[PROJECT_CODE]`, `[PROJECT_NAME]`, `[SYSTEM_NAME]`, `[ENV]`, `[OWNER]`, `[LINK]`; giữ lại các bảng, tiêu chí, checklist và các con số baseline nếu còn phù hợp. Nguồn gốc đã sanitize: `Performance Test\Performance Test Result\[SYSTEM_NAME_VARIANT]][2026-04-13] [STG]PT Result CR 09.04\[SYSTEM_NAME_VARIANT]][2026-04-13] [STG]PT Result CR 09.04.md`.

# Sprint or Periodic Performance Test Result

> **Mục đích sử dụng:** Dùng cho kết quả chạy PT theo sprint, CR, hotfix hoặc đợt release nhỏ. Giữ summary, service impact, environment, scenario detail, SLA vs actual, status/result và link Jenkins/evidence.

<https://[CONFLUENCE_DOMAIN]/wiki/pages/[PAGE_ID]>

I. PERFORMANCE TEST SUMMARY Mục đ&iacute;ch kiểm thử: 

 Thực hiện kiểm thử hiệu năng cho CR 09.04.2026 chi tiết tại link: [SYSTEM_NAME_VARIANT]][2026-04-13] [STG]PT Report_CR 09.04.2026 

 Th&ocirc;ng tin services, version code chi tiết tại: [SRE_TICKET] [DEPLOYMENT_VERSION_OR_COMMIT] System Jira 

 Services impact:

 fraud-aml-core-service

 aml-service

 fraud-aml-history

 fraud-aml-decision-engine

 In-scope: Mask những th&ocirc;ng tin nhạy cảm

 Out-scope: N/A

 M&ocirc;i trường thực hiện : 

 Staging:

 [SYSTEM_NAME_VARIANT] : tỉ lệ bằng 50% m&ocirc;i trường Production 

 [SYSTEM_NAME]: tỉ lệ bằng 35% m&ocirc;i trường Production

 II. PERFORMANCE TEST DETAIL Scenario 

 Round 

 Time 

 From - To 

 Function 

 SLA 

 Actual 

 Status 

 Result 

 TPS 

 Response time 

 ( ms )

 Error rate 

 (%)

 TPS 

 Response time 

 ( ms )

 Error rate 

 Testcase 01.1_Individual Normal Day_[SYSTEM_NAME_VARIANT] 

 01h

 

 From: 11h:19 AM To: 12h:19 PM

 Transaction

 155

 100

 0.05

 155

 28

 0.00

 PASS 

 Jenkins : https://[SYSTEM_NAME]-jenkins.ops.[ORG_NAME].mobi/job/PERFORMANCE_TEST_NEXTID_[SYSTEM_NAME_VARIANT]/job/Performance_Test_[SYSTEM_NAME_VARIANT]_Individual/73/JMeter_20Report/ 

 Evidence

 P95% - Response time - Aml-core-services Testcase 02.1_Individual Peak Day_[SYSTEM_NAME_VARIANT] 

 01h

 

 From: 12h:29 AM To: 13h:29 PM

 Transaction

 260

 100

 0.05

 260

 28

 0.00

 PASS 

 Jenkins : https://[SYSTEM_NAME]-jenkins.ops.[ORG_NAME].mobi/job/PERFORMANCE_TEST_NEXTID_[SYSTEM_NAME_VARIANT]/job/Performance_Test_[SYSTEM_NAME_VARIANT]_Individual/74/JMeter_20Report/ 

 Evidence

 CCPU & Memory Testcase 10.01_Load mix normal day_E2E with [SYSTEM_NAME] 

 01h

 

 From: 16h:28 PM To: 17h:28 PM

 Inquiry

 [BUSINESS_DOMAIN] [BUSINESS_FLOW]

 162

 109

 400

 400

 0.08

 0.08

 182

 127

 266

 310

 0.05

 0.04

 PASS 

 Jenkins : https://[SYSTEM_NAME]-jenkins.ops.[ORG_NAME].mobi/job/PERFORMANCE_TEST/view/Load_mix/job/Performance_Test_Load_Mix_Normal_Day/608/JMeter_20Report/ 

 Transaction

 

 Total 

 Accepted 

 Fail 

 Inquiry

 680,014

 679,674

 340

 Transfer [BUSINESS_FLOW] - E2E

 458,352

 458,161

 191

 Refund

 16,147

 16,136

 5

 

 Evidence









