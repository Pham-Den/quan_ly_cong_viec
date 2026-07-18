> **Hướng dẫn sử dụng template:** Nội dung dưới đây được giữ theo format tài liệu mẫu gốc. Khi dùng cho dự án mới, thay các placeholder như `[PROJECT_CODE]`, `[PROJECT_NAME]`, `[SYSTEM_NAME]`, `[ENV]`, `[OWNER]`, `[LINK]`; giữ lại các bảng, tiêu chí, checklist và các con số baseline nếu còn phù hợp. Nguồn gốc đã sanitize: `Security Test\Security Test Request\(template) [PROJECT_CODE] Yêu cầu đánh giá ANBM Sprint .md`.

# Security Test Request

> **Mục đích sử dụng:** Dùng để gửi yêu cầu đánh giá an ninh bảo mật cho sprint/release/golive, nêu rõ scope, môi trường, repo/API, loại scan/test cần thực hiện và deadline mong muốn.

<https://[CONFLUENCE_DOMAIN]/wiki/pages/[PAGE_ID]>

# Thông tin chung của hệ thống [SYSTEM_NAME]

| **No** | **Type** | **Detail** |
| --- | --- | --- |
| 1 | - Link PRD | - III - [PROJECT_CODE] Product Requirement |
| 2 | - Link SAD | - SAD: [ORG_NAME] [BUSINESS_DOMAIN] [CORE_MODULE] System SAD - Portal FE: [SYSTEM_NAME]] Frontend Portal System |
| 3 | - Link sequence diagram | - [SYSTEM_NAME]] Sequence Diagram |
| 4 | - Link gitlab | - Code BE:    - <https://gitlab.[ORG_NAME].com.vn/[ORG_NAME]/developer/[BACKEND_REPO_GROUP]/[BACKEND_REPO]> - Code FE:    - <https://gitlab.[ORG_NAME].com.vn/[ORG_NAME]/developer/[FRONTEND_REPO_GROUP]/[FRONTEND_REPO]>   - <https://gitlab.[ORG_NAME].com.vn/[ORG_NAME]/developer/portals/libs>   - <https://gitlab.[ORG_NAME].com.vn/[ORG_NAME]/developer/portals/libs/keycloak-themes> |
| 5 | - Link API Spec | - API Public    - API [CORE_PROCESSING_MODULE]: API [CORE_PROCESSING_MODULE]   - API [OPS_PORTAL]:API [OPS_PORTAL]   - API [USER_PORTAL]: API [USER_PORTAL] - API Internal:    - API Internal |
| 6 | - Link US | - <https://[JIRA_OR_CONFLUENCE_DOMAIN]/jira/software/c/projects/[ORG_NAME]/boards/3030> |
| 7 | - Merge request | - Danh sách merge request từ QC lên UAT theo từng repo    - TBD |

| **Scope** | **Status** | **Detail** |
| --- | --- | --- |
| SAD |  | Thêm …. |
| Sequence |  | Thêm flow … |
| Database |  | Thêm mới field … |
| Bussiness |  | Thêm mới tính năng … |
| Api Spec |  | Api … |

# Thông tin chi tiết các US thuộc scope sprint …

| **No** | **Flow** | **System** | **Type** | **User Story** | **Document** | **Require Security Review?** | **Security Test?** | **Have code change?** | **Status** | **QC test done?** |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| 1 | … | … | … | … |  | Y |  |  |  |  |







