> **Hướng dẫn sử dụng template:** Nội dung dưới đây được giữ theo format tài liệu mẫu gốc. Khi dùng cho dự án mới, thay các placeholder như `[PROJECT_CODE]`, `[PROJECT_NAME]`, `[SYSTEM_NAME]`, `[ENV]`, `[OWNER]`, `[LINK]`; giữ lại các bảng, tiêu chí, checklist và các con số baseline nếu còn phù hợp. Nguồn gốc đã sanitize: `Test Information.md`.

# Test Information

<https://[CONFLUENCE_DOMAIN]/wiki/pages/[PAGE_ID]>

| **STT** | **Nội dung** | **Link/Thông tin** | **Lưu ý** |
| --- | --- | --- | --- |
| 1 | **Swagger - thông tin về các API của [SIMULATOR]** | <https://api-[SYSTEM_NAME]-dev.int.[ORG_NAME].mobi/simulator/swagger-ui/index.html> | Staging <[GOOGLE_CHAT_LINK]> |
|  |  | <https://simulator-[SYSTEM_NAME]-dev.ops.[ORG_NAME].mobi/simulator/transfe> |  |
| 2 | **Giả lập hệ thống tích hợp nghiệp vụ** | **DEV** <https://simulator-[SYSTEM_NAME]-dev.ops.[ORG_NAME].mobi/layout/home>  **QC**  <https://simulator-[SYSTEM_NAME]-qc.ops.[ORG_NAME].mobi/layout/home>  **UAT** <https://simulator-[SYSTEM_NAME]-uat.ops.[ORG_NAME].mobi/simulator/transfer>  **SANDBOX**: <https://simulator-[SYSTEM_NAME]-sandbox.ops.[ORG_NAME].mobi/simulator/transaction>  **STAGING** <https://simulator-[SYSTEM_NAME]-stg.ops.[ORG_NAME].mobi/>  **PRD**: <https://simulator-[SYSTEM_NAME]-pt.ops.[ORG_NAME].mobi/> | Hướng dẫn sử dụng truy vấn, luồng nghiệp vụ chính  <https://[JIRA_OR_CONFLUENCE_DOMAIN]/wiki/spaces/[PROJECT_NAME]/pages/[PAGE_ID]> |
|  | **[USER_PORTAL]** | **QC** <https://user-partner-[SYSTEM_NAME]-qc.[ORG_NAME].mobi/layout/home>  **PRD** <https://[USER_OR_PARTNER].[SYSTEM_NAME].[ORG_NAME].com.vn/>  **SANDBOX** <https://[SYSTEM_NAME]-keycloak-admin.ops.[ORG_NAME].mobi/admin/[SYSTEM_NAME]-user-partner-portal-sandbox/console> **STAGING** <https://user-partner-[SYSTEM_NAME]-stg.[ORG_NAME].mobi/> | Hướng dẫn sử dụng [USER_PORTAL] <https://[JIRA_OR_CONFLUENCE_DOMAIN]/wiki/spaces/[PROJECT_NAME]/pages/[PAGE_ID]> |
|  | **[OPS_PORTAL]** | **QC** <https://ops-[SYSTEM_NAME]-qc.ops.[ORG_NAME].mobi/layout/home>  **PRD** [https://operation-ops.[SYSTEM_NAME].[ORG_NAME].com.vn](https://operation-ops.[SYSTEM_NAME].[ORG_NAME].com.vn/)  **SANDBOX** <https://[SYSTEM_NAME]-keycloak-admin.ops.[ORG_NAME].mobi/admin/[SYSTEM_NAME]-ops-portal-sandbox/console>  **STAGING** <https://ops-[SYSTEM_NAME]-stg.ops.[ORG_NAME].mobi/>  Keyclock staging admin <https://[SYSTEM_NAME]-keycloak-admin-stg.ops.[ORG_NAME].mobi/> | Hướng dẫn sử dụng [OPS_PORTAL]  <https://[JIRA_OR_CONFLUENCE_DOMAIN]/wiki/spaces/[PROJECT_NAME]/pages/[PAGE_ID]> |
| 3 | **Data test chung** | <[GOOGLE_DOC_LINK]>  <[GOOGLE_DOC_LINK]> (Các môi trường)  [PARTNER_A]: 19036789012345 [PARTNER_B]: 1000456789  UAT data đối tác <[GOOGLE_DOC_LINK]>  UAT data tổng hợp <[GOOGLE_DOC_LINK]> |  |
| 4 | **SQL Query DB** | <[GOOGLE_DOC_LINK]>  DB Staging: DB: [[IP_OR_HOST]](http://[IP_OR_HOST]), service name: STG, account gửi riêng |  |
| 5 | **Workflow** | <https://[SYSTEM_NAME]-temporal-02.ops.[ORG_NAME].mobi/> |  |
| 6 | **Thông tin SSH gcloud để truy cập vào các Database** | 9. Bastion vào oracle   Bastion vào mysql  Copy lưu ra file .bat mỗi lần truy cập bật lên cho nhanh  <https://[JIRA_OR_CONFLUENCE_DOMAIN]/wiki/spaces/[PROJECT_NAME]/pages/[PAGE_ID]> | Tạm thời không dùng nữa |
| 7 | **Hướng dẫn cấu hình test [SIMULATOR]** | <https://[JIRA_OR_CONFLUENCE_DOMAIN]/wiki/spaces/[PROJECT_NAME]/pages/[PAGE_ID]> |  |
| 8 | **Câu hỏi về hướng dẫn cách test** | <[GOOGLE_DOC_LINK]> |  |
| 9 | **Hướng dẫn test luồng ký số** | <https://[JIRA_OR_CONFLUENCE_DOMAIN]/wiki/spaces/[PROJECT_NAME]/pages/[PAGE_ID]> |  |
| 10 | **Error Code Mapping** | <[GOOGLE_DOC_LINK]> |  |
| 11 | **Hướng dẫn cài đặt Job** | <[GOOGLE_DOC_LINK]> |  |
| 12 | **API cập nhật trạng thái, tên tài khoản ở [SIMULATOR]** |  |  |
| 11 | [**Truy cập SFTP**]([GOOGLE_CONSOLE_LINK]) | <https://[JIRA_OR_CONFLUENCE_DOMAIN]/wiki/spaces/[PROJECT_NAME]/pages/[PAGE_ID]>  STAGING SFTP: [[IP_OR_HOST]](http://[IP_OR_HOST]), account gửi riêng |  |
| 12 | **Cấu hình xử lý yêu cầu nghiệp vụ** | EDIT → `a2a.max.dispute_edit.transaction.period` REFUND → `a2a.max.dispute_refund.transaction.period` INFO → `a2a.max.dispute_info.transaction.period` GOODFAITH → `a2a.max.dispute_goodfaith.transaction.period` | File request mẫu của xử lý yêu cầu nghiệp vụ  <[GOOGLE_DOC_LINK]> |
| 13 | [EXTERNAL_TOOL] | <https://tadbp.ops.[ORG_NAME].mobi/TADBP/Batch[BUSINESS_LEDGER]/TheoDoiGW/frmListNet_GW.aspx>  Hướng dẫn cài: <https://[JIRA_OR_CONFLUENCE_DOMAIN]/wiki/spaces/[PROJECT_NAME]/pages/[PAGE_ID]> | <https://[JIRA_OR_CONFLUENCE_DOMAIN]/wiki/spaces/[PROJECT_NAME]/pages/[PAGE_ID]> Hưỡng dẫn sử dụng [EXTERNAL_TOOL] |
|  | [WORKFLOW_ENGINE] | Staging: <https://[SYSTEM_NAME]-temporal-stg.ops.[ORG_NAME].mobi/> |  |







