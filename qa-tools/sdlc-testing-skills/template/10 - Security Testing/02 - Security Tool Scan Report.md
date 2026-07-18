> **Hướng dẫn sử dụng template:** Nội dung dưới đây được giữ theo format tài liệu mẫu gốc. Khi dùng cho dự án mới, thay các placeholder như `[PROJECT_CODE]`, `[PROJECT_NAME]`, `[SYSTEM_NAME]`, `[ENV]`, `[OWNER]`, `[LINK]`; giữ lại các bảng, tiêu chí, checklist và các con số baseline nếu còn phù hợp. Nguồn gốc đã sanitize: `Security Test\[2026-03][Golive] Security Report for Security Tool Scan.md`.

# Security Tool Scan Report

> **Mục đích sử dụng:** Dùng để tổng hợp kết quả scan SCA/SAST/Secret Detection/Container hoặc tool scan định kỳ theo sprint/release.

<https://[CONFLUENCE_DOMAIN]/wiki/pages/[PAGE_ID]>

**Project/Asset Name:** [SYSTEM_NAME] v1 + Fee\
**Prepared by:** \
**Date:**

## **1. Executive Summary**

### **Mục tiêu:**

- Xác định các lỗ hổng thư viện bên thứ 3 trong hệ thống PG thông qua các công cụ scan SCA: Denpendence check, SAST: Codeql, Secret Detection: Gitleaks

### **Phạm vi:**

|  |  | **repo** | **In Scope?** | **branch** | **status** |
| --- | --- | --- | --- | --- | --- |
| [BACKEND_SCOPE] | [SYSTEM_NAME]-core | <https://gitlab.[ORG_NAME].com.vn/[ORG_NAME]/developer/[BACKEND_REPO_GROUP]/[BACKEND_REPO]/[SYSTEM_NAME]-core/limit-capture> |  | qc |  |
| [BACKEND_SCOPE] | [SYSTEM_NAME]-core | <https://gitlab.[ORG_NAME].com.vn/[ORG_NAME]/developer/[BACKEND_REPO_GROUP]/[BACKEND_REPO]/[SYSTEM_NAME]-core/[USER_OR_PARTNER]> |  | qc |  |
| [BACKEND_SCOPE] | [SYSTEM_NAME]-core | <https://gitlab.[ORG_NAME].com.vn/[ORG_NAME]/developer/[BACKEND_REPO_GROUP]/[BACKEND_REPO]/[SYSTEM_NAME]-core/notification> |  | qc |  |
| [BACKEND_SCOPE] | [SYSTEM_NAME]-core | <https://gitlab.[ORG_NAME].com.vn/[ORG_NAME]/developer/[BACKEND_REPO_GROUP]/[BACKEND_REPO]/[SYSTEM_NAME]-core/[BUSINESS_DOMAIN]-dispatcher> |  | qc |  |
| [BACKEND_SCOPE] | [SYSTEM_NAME]-core | <https://gitlab.[ORG_NAME].com.vn/[ORG_NAME]/developer/[BACKEND_REPO_GROUP]/[BACKEND_REPO]/[SYSTEM_NAME]-core/screening> |  |  |  |
| [BACKEND_SCOPE] | [SYSTEM_NAME]-core | <https://gitlab.[ORG_NAME].com.vn/[ORG_NAME]/developer/[BACKEND_REPO_GROUP]/[BACKEND_REPO]/[SYSTEM_NAME]-core/signature> |  | qc |  |
| [BACKEND_SCOPE] | [SYSTEM_NAME]-core | <https://gitlab.[ORG_NAME].com.vn/[ORG_NAME]/developer/[BACKEND_REPO_GROUP]/[BACKEND_REPO]/[SYSTEM_NAME]-core/[CORE_SERVICE]> |  | qc |  |
| [BACKEND_SCOPE] | [SYSTEM_NAME]-core | <https://gitlab.[ORG_NAME].com.vn/[ORG_NAME]/developer/[BACKEND_REPO_GROUP]/[BACKEND_REPO]/[SYSTEM_NAME]-core/[ROUTING_SERVICE]> |  | qc |  |
| [BACKEND_SCOPE] | [SYSTEM_NAME]-core | <https://gitlab.[ORG_NAME].com.vn/[ORG_NAME]/developer/[BACKEND_REPO_GROUP]/[BACKEND_REPO]/[SYSTEM_NAME]-core/transaction-management> |  | qc |  |
| [BACKEND_SCOPE] | [SYSTEM_NAME]-portal | <https://gitlab.[ORG_NAME].com.vn/[ORG_NAME]/developer/[BACKEND_REPO_GROUP]/[BACKEND_REPO]/[SYSTEM_NAME]-portal/user-partner-bff> |  | qc |  |
| [BACKEND_SCOPE] | [SYSTEM_NAME]-portal | <https://gitlab.[ORG_NAME].com.vn/[ORG_NAME]/developer/[BACKEND_REPO_GROUP]/[BACKEND_REPO]/[SYSTEM_NAME]-portal/ops-bff> |  | qc |  |
| [BACKEND_SCOPE] | [BATCH_PROCESSING_MODULE] | <https://gitlab.[ORG_NAME].com.vn/[ORG_NAME]/developer/[BACKEND_REPO_GROUP]/[BACKEND_REPO]/[BATCH_PROCESSING_MODULE]/[BATCH_PROCESSING_MODULE]-dispatcher> |  | qc |  |
| [BACKEND_SCOPE] | [BATCH_PROCESSING_MODULE] | <https://gitlab.[ORG_NAME].com.vn/[ORG_NAME]/developer/[BACKEND_REPO_GROUP]/[BACKEND_REPO]/[BATCH_PROCESSING_MODULE]/[BATCH_PROCESSING_MODULE]-management> |  | qc |  |
| [BACKEND_SCOPE] |  | <https://gitlab.[ORG_NAME].com.vn/[ORG_NAME]/developer/[BACKEND_REPO_GROUP]/[BACKEND_REPO]/approval> |  | qc |  |
| [BACKEND_SCOPE] |  | <https://gitlab.[ORG_NAME].com.vn/[ORG_NAME]/developer/[BACKEND_REPO_GROUP]/[BACKEND_REPO]/audit-log> |  | qc |  |
| [BACKEND_SCOPE] |  | <https://gitlab.[ORG_NAME].com.vn/[ORG_NAME]/developer/[BACKEND_REPO_GROUP]/[BACKEND_REPO]/data-initializer> |  | qc |  |
| [BACKEND_SCOPE] |  | <https://gitlab.[ORG_NAME].com.vn/[ORG_NAME]/developer/[BACKEND_REPO_GROUP]/[BACKEND_REPO]/hsm-luna> |  |  |  |
| [BACKEND_SCOPE] |  | <https://gitlab.[ORG_NAME].com.vn/[ORG_NAME]/developer/[BACKEND_REPO_GROUP]/[BACKEND_REPO]/incoming-connector> |  | qc |  |
| [BACKEND_SCOPE] |  | <https://gitlab.[ORG_NAME].com.vn/[ORG_NAME]/developer/[BACKEND_REPO_GROUP]/[BACKEND_REPO]/outgoing-connector> |  | qc |  |
| [FRONTEND_SCOPE] |  | <https://gitlab.[ORG_NAME].com.vn/[ORG_NAME]/developer/[FRONTEND_REPO_GROUP]/[FRONTEND_REPO]/portal-[USER_OR_PARTNER]> |  | qc |  |
| [FRONTEND_SCOPE] |  | <https://gitlab.[ORG_NAME].com.vn/[ORG_NAME]/developer/[FRONTEND_REPO_GROUP]/[FRONTEND_REPO]/portal-ops> |  | qc |  |
| Keycloak |  | <https://gitlab.[ORG_NAME].com.vn/[ORG_NAME]/developer/portals/libs/keycloak-themes> |  | qc |  |
| Keycloak |  | <https://gitlab.[ORG_NAME].com.vn/[ORG_NAME]/developer/portals/libs/lib-auth> |  | qc |  |
| Keycloak |  | <https://gitlab.[ORG_NAME].com.vn/[ORG_NAME]/developer/portals/libs/lib-layout> |  | qc |  |
| Fee-management |  | <https://gitlab.[ORG_NAME].com.vn/[ORG_NAME]/developer/fee/fee-backend/data-integrator/fee-ingest-api> |  |  |  |
|  |  | <https://gitlab.[ORG_NAME].com.vn/[ORG_NAME]/developer/fee/fee-backend/data-integrator/ingest-worker> |  | qc |  |
|  |  | <https://gitlab.[ORG_NAME].com.vn/[ORG_NAME]/developer/fee/fee-backend/fee-core/fee-core> |  | qc |  |
|  |  | <https://gitlab.[ORG_NAME].com.vn/[ORG_NAME]/developer/fee/fee-backend/fee-core/data-initializer> |  | qc |  |
|  |  | <https://gitlab.[ORG_NAME].com.vn/[ORG_NAME]/developer/fee/fee-backend/fee-engine/data-processor> |  | qc |  |
|  |  | <https://gitlab.[ORG_NAME].com.vn/[ORG_NAME]/developer/fee/fee-backend/fee-engine/dispatcher> |  | qc |  |
|  |  | <https://gitlab.[ORG_NAME].com.vn/[ORG_NAME]/developer/fee/fee-backend/fee-engine/executor> |  | qc |  |
|  |  | <https://gitlab.[ORG_NAME].com.vn/[ORG_NAME]/developer/fee/fee-backend/fee-engine/exporter> |  | qc |  |
|  |  | <https://gitlab.[ORG_NAME].com.vn/[ORG_NAME]/developer/fee/fee-backend/fee-engine/notification> |  | qc |  |
|  |  | <https://gitlab.[ORG_NAME].com.vn/[ORG_NAME]/developer/fee/fee-backend/fee-management/fee-approval> |  | qc |  |
|  |  | <https://gitlab.[ORG_NAME].com.vn/[ORG_NAME]/developer/fee/fee-backend/fee-management/audit-log> |  | qc |  |
|  |  | <https://gitlab.[ORG_NAME].com.vn/[ORG_NAME]/developer/fee/fee-backend/fee-management/management> |  | qc |  |
|  |  | <https://gitlab.[ORG_NAME].com.vn/[ORG_NAME]/developer/fee/fee-backend/fee-management/master-data> |  | qc |  |
|  |  | <https://gitlab.[ORG_NAME].com.vn/[ORG_NAME]/developer/fee/fee-backend/fee-portal/fee-user-partner-bff> |  | qc |  |
|  |  | <https://gitlab.[ORG_NAME].com.vn/[ORG_NAME]/developer/fee/fee-backend/fee-portal/fee-ops-bff> |  | qc |  |

### **Kết quả tổng quan:**

- Tổng số lỗ hổng tìm thấy: 0
- Số lỗ hổng **Critical**: 0
- Số lỗ hổng **High**: 0
- Số lỗ hổng **Medium**: 37
- Số lỗ hổng **Low**: 18

### **Khuyến nghị cấp cao:**

- Nâng cấp các phiên bản đang dùng đến phiên bản latest

## **2. Assessment Methodology**

- **Phương pháp / Quy trình áp dụng:**

  - Secrets Detection
  - SCA
  - SAST
- **Các công cụ sử dụng:**

  - Gitleak
  - Dependency Check
  - Codeql
- **Nguồn dữ liệu đầu vào:**

  - Repo code trên Gitlab

## **3. Detailed Findings**

| **No.** | **Findings** | **Description** | **Impact** | **Likelihood** | **Risk** | **recommendation** | **Status** |
| --- | --- | --- | --- | --- | --- | --- | --- |
| 1 | Crititcal | <[DEFECTDOJO_FILTER_LINK]> |  |  |  |  | No finding |
| 2 | High | <[DEFECTDOJO_FILTER_LINK]> |  |  |  |  | No finding |
| 3 | Medium | <[DEFECTDOJO_FILTER_LINK]> | Medium | Low | Low | Security sẽ thống kê và đưa ra yêu cầu fix vào sprint tiếp theo |  |
| 4 | Low | <[DEFECTDOJO_FILTER_LINK]> | Low | Low | Low | Security sẽ thống kê và đưa ra yêu cầu fix vào sprint tiếp theo |  |

## **4. recommendations & Remediation Plan**

## **5. Conclusion**

- Tóm tắt lại:

  - Tổng quan rủi ro hiện tại
  - Các bước tiếp theo (next steps): ví dụ lên kế hoạch fix, re-test, audit lại,…
  - Đề xuất cải thiện lâu dài: secure SDLC, security training, thêm công cụ CI/CD,…

## **6. Appendix**

- Tài liệu tham khảo
- Endidence log







