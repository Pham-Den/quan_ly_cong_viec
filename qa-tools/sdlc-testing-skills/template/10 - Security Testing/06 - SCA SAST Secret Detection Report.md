> **Hướng dẫn sử dụng template:** Nội dung dưới đây được giữ theo format tài liệu mẫu gốc. Khi dùng cho dự án mới, thay các placeholder như `[PROJECT_CODE]`, `[PROJECT_NAME]`, `[SYSTEM_NAME]`, `[ENV]`, `[OWNER]`, `[LINK]`; giữ lại các bảng, tiêu chí, checklist và các con số baseline nếu còn phù hợp. Nguồn gốc đã sanitize: `Security Test\[2026-06-13] Security Report for scan SCA, SAST & Secret Detection phục vụ [SYSTEM_NAME] signoff nghiệm thu.md`.

# SCA SAST Secret Detection Report

> **Mục đích sử dụng:** Dùng cho báo cáo scan thư viện, source code và secret trước signoff/release, giữ bảng finding theo severity và action xử lý.

<https://[CONFLUENCE_DOMAIN]/wiki/pages/[PAGE_ID]>

**Project/Asset Name:** [SYSTEM_NAME]\
**Prepared by:** \
**Date:**

## **1. Executive Summary**

- **Mục tiêu:**

  - Xác định các lỗ hổng trên hệ thống [SYSTEM_NAME] thông qua tool scan SCA, SAST và gitleak
- **Phạm vi:**

  - Tất cả các repo code của hệ thống [SYSTEM_NAME]
- **Kết quả tổng quan:**

  - Tổng số lỗ hổng tìm thấy: 57
  - Số lỗ hổng Critical: 0
  - Số lỗ hổng High: 0
  - Số lỗ hổng Medium: 57
  - Số lỗ hổng Low:
- **Khuyến nghị cấp cao:**

  - [Các khuyến nghị chính ra từ kết quả đánh giá]

## **2. Assessment Methodology**

- **Phương pháp / Quy trình áp dụng:**

  - Secrets Detection
  - SCA
  - SAST
- **Các công cụ sử dụng:**

  - Gitleak
  - Dependecy Check
  - Codeql
- **Nguồn dữ liệu đầu vào:**

  - Repo code trên Gitlab

## **3. Detailed Findings**

| **#** | **Vulnerability Name** | **Số lượng vulerability** | **Severity** | **Description** | **Impact** | **Evidence** | **recommendation** | **Status** | **Note** |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| 1 | Lỗ hồng Critical thông qua scan SCA | 0 | Critical | <[DEFECTDOJO_FILTER_LINK]> |  |  |  |  |  |
| 2 | Lỗ hồng High thông qua scan SCA | 0 | High | <[DEFECTDOJO_FILTER_LINK]> |  |  |  |  |  |
| 3 | Lỗ hồng Medium thông qua scan SCA | 47 | Medium | <[DEFECTDOJO_FILTER_LINK]> |  |  | Update lên phiên bản latest | Open |  |
| 4 | Lỗ hổng thông qua scan Gitleak | 5 | Medium | <[DEFECTDOJO_FILTER_LINK]> |  |  | Remove secret hoặc đưa vào k8s manager hoặc vault | Open | Đã fix 4 bug liên quan application còn 1 bug của SRE |
| 5 | Lỗ hổng thông qua scan SAST | 5 | Medium | <[DEFECTDOJO_FILTER_LINK]> |  |  | <https://[JIRA_OR_CONFLUENCE_DOMAIN]/wiki/spaces/[PROJECT_NAME]/pages/edit-v2/2582151564#Log-Injection> | Open |  |

## **4. recommendations & Remediation Plan**

| Priority | Action Item | Owner | Deadline | Status |
| --- | --- | --- | --- | --- |
| High | Update các lỗ hổng trên | Dev Team | 15/06/2025 | Not Started |
| Medium | Theo dõi trạng thái lỗ hổng trên Vuln Managerment | Security Team | 30/06/2025 | In Progress |

## **5. Conclusion**

- Tóm tắt lại:

  - Tổng quan rủi ro hiện tại
  - Các bước tiếp theo (next steps): ví dụ lên kế hoạch fix, re-test, audit lại,…
  - Đề xuất cải thiện lâu dài: secure SDLC, security training, thêm công cụ CI/CD,…

## **6. Appendix**

- Tài liệu tham khảo
- Các báo cáo công cụ đính kèm (scan result, screenshot, logs,…)
- Các chi tiết kỹ thuật bổ sung nếu cần







