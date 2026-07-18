> **Hướng dẫn sử dụng template:** Nội dung dưới đây được giữ theo format tài liệu mẫu gốc. Khi dùng cho dự án mới, thay các placeholder như `[PROJECT_CODE]`, `[PROJECT_NAME]`, `[SYSTEM_NAME]`, `[ENV]`, `[OWNER]`, `[LINK]`; giữ lại các bảng, tiêu chí, checklist và các con số baseline nếu còn phù hợp. Nguồn gốc đã sanitize: `UAT test\[UAT] Test Information.md`.

# UAT Test Information

> **Mục đích sử dụng:** Dùng tổng hợp thông tin môi trường, tài khoản, test data, link hệ thống và đầu mối support cho UAT.

<https://[CONFLUENCE_DOMAIN]/wiki/pages/[PAGE_ID]>

| **STT** | **Nội dung** | **Link/Thông tin** | **Lưu ý** |
| --- | --- | --- | --- |
| 1 | **Giả lập hệ thống tích hợp nghiệp vụ** | **UAT** <https://simulator-[SYSTEM_NAME]-uat.ops.[ORG_NAME].mobi/simulator/transfer> | Hướng dẫn sử dụng truy vấn, luồng nghiệp vụ chính  <https://[JIRA_OR_CONFLUENCE_DOMAIN]/wiki/spaces/[PROJECT_NAME]/pages/[PAGE_ID]> |
| 2 | **[USER_PORTAL]** | **UAT** <https://user-partner-[SYSTEM_NAME]-uat.[ORG_NAME].mobi/layout/home> | Hướng dẫn sử dụng [USER_PORTAL] <https://[JIRA_OR_CONFLUENCE_DOMAIN]/wiki/spaces/[PROJECT_NAME]/pages/[PAGE_ID]> |
| 3 | **[OPS_PORTAL]** | **UAT** <https://ops-[SYSTEM_NAME]-uat.ops.[ORG_NAME].mobi/layout/home> | Hướng dẫn sử dụng [OPS_PORTAL]  <https://[JIRA_OR_CONFLUENCE_DOMAIN]/wiki/spaces/[PROJECT_NAME]/pages/[PAGE_ID]> |
| 9 | **Tabweb** | <https://[EXTERNAL_TOOL_URL]>  Hướng dẫn cài: <https://[JIRA_OR_CONFLUENCE_DOMAIN]/wiki/spaces/[PROJECT_NAME]/pages/[PAGE_ID]> | <https://[JIRA_OR_CONFLUENCE_DOMAIN]/wiki/spaces/[PROJECT_NAME]/pages/[PAGE_ID]> Hưỡng dẫn sử dụng [EXTERNAL_TOOL] |
| 4 | **Data test chung** | UAT data nội bộ <[GOOGLE_DOC_LINK]>  UAT data đối tác <[GOOGLE_DOC_LINK]>  UAT data tổng hợp <[GOOGLE_DOC_LINK]> |  |
| 5 | **Error Code Mapping** | <[GOOGLE_DOC_LINK]> |  |
| 6 | **Hướng dẫn cài đặt Job** | <[GOOGLE_DOC_LINK]> | bỏ |
| 7 | [**Truy cập SFTP**]([GOOGLE_CONSOLE_LINK]) | <https://[JIRA_OR_CONFLUENCE_DOMAIN]/wiki/spaces/[PROJECT_NAME]/pages/[PAGE_ID]> | <https://[JIRA_OR_CONFLUENCE_DOMAIN]/wiki/spaces/[PROJECT_NAME]/pages/[PAGE_ID]> |
| 8 | **Cấu hình xử lý yêu cầu nghiệp vụ** | EDIT → `a2a.max.dispute_edit.transaction.period` REFUND → `a2a.max.dispute_refund.transaction.period` INFO → `a2a.max.dispute_info.transaction.period` GOODFAITH → `a2a.max.dispute_goodfaith.transaction.period` | File request mẫu của xử lý yêu cầu nghiệp vụ  <[GOOGLE_DOC_LINK]> đưa vào simulator |







