> **Hướng dẫn sử dụng template:** Nội dung dưới đây được giữ theo format tài liệu mẫu gốc. Khi dùng cho dự án mới, thay các placeholder như `[PROJECT_CODE]`, `[PROJECT_NAME]`, `[SYSTEM_NAME]`, `[ENV]`, `[OWNER]`, `[LINK]`; giữ lại các bảng, tiêu chí, checklist và các con số baseline nếu còn phù hợp. Nguồn gốc đã sanitize: `Test Plan\[REGULATORY_OR_PARTNER_SCOPE] - Test Plan.md`.

# [REGULATORY_OR_PARTNER_SCOPE] - Test Plan

<https://[CONFLUENCE_DOMAIN]/wiki/pages/[PAGE_ID]>

|  |  |
| --- | --- |
| **Project Name** | **[PROJECT_CODE] - [SYSTEM_NAME]** |
| **Date** | From 29/12/2025  to 26/01/2025 |
| **Version** | 1.0 |

## **1.Tổng quan Sprint**

### 1.1 Mục tiêu kiểm thử

1. Hoàn thành kiểm thử các tính năng trong Sprint

### 1.2 Phạm vi kiểm thử

Test các tính năng/task thực hiện kiểm thử trong Sprint

### 1.3 Lịch trình kiểm thử

|  |  |  |
| --- | --- | --- |
| **Thời gian** | **Các công việc cần làm** | **Ghi chú** |
| 24/12-27/12 | Viết TC function, viết testcase SIT |  |
| 28/12-03/01 | Thực hiện test function các ticket |  |
| 05/01 - 19/01 | Thực hiện test tích hợp SIT | Môi trường QC, giả lập nghiệp vụ của hệ thống/đối tác |
| 20/01 - 26/01 | Thực hiện test nghiệm thu người dùng UAT | Môi trường UAT |

### **1.4 Các loại kiểm thử thực hiện**

|  |  |  |  |
| --- | --- | --- | --- |
| **STT** | **Loại kiểm thử** | **Mục đích** | **Ghi chú** |
| 1 | Functional Testing | Tính năng mới có đáp ứng đúng yêu cầu trong User Story không? |  |
| 2 | System Integration Testing (SIT) | Kiểm tra tích hợp toàn bộ hệ thống End-to End (nội bộ và đối tác) |  |
| 6 | User Accepteance Testing | Kiểm thử chấp nhận người dùng, đảm bảo chức năng thực hiện đúng theo yêu cầu |  |

## **2. Công cụ và môi trường kiểm thử**

### 2.1 Công cụ kiểm thử

|  |  |  |  |
| --- | --- | --- | --- |
| **Activities** | **Tools** | **Version** | **Note** |
| *Quản lý test case* | QMetry/Google Sheet |  |  |
| *Kiểm soát lỗi* | Jira |  |  |
| *Kiểm thử API* | Postman |  |  |

### 2.2 Môi trường và thiết bị kiểm thử

Backend: API

[FE: Chrome, Firefox]([GOOGLE_DOC_LINK])

|  |  |  |  |
| --- | --- | --- | --- |
| **Hệ thống** | **Môi trường** | **Link** | **Note** |
| [SIMULATOR] | QC | <https://simulator-[SYSTEM_NAME]-qc.ops.[ORG_NAME].mobi/simulator/transfer> | Giả lập nghiệp vụ của hệ thống/đối tác |
| [WORKFLOW_ENGINE] | QC | <https://[SYSTEM_NAME]-temporal.ops.[ORG_NAME].mobi/namespaces/[SYSTEM_NAME]-qc/workflows> |  |
| API | QC |  |  |

## **3. Nguồn lực kiểm thử**

| **STT** | **Name** | **Role** | **Ngày** | **Note** |
| --- | --- | --- | --- | --- |
| 1 | [QC_LEAD] | QC Lead | 5 |  |
| 2 | [QC_USER_1] | QC | 6 |  |
| 3 | [QC_USER_2] | QC | 6 |  |
| 4 | [QC_USER_3] | QC | 10 |  |
| 5 | [QC_USER_4] | QC | 10 |  |
| 6 | [QC_USER_5] | QC | 10 |  |
| **Total** |  |  | **41** | **287 (h)** |

*Lưu ý: Tính 7h giờ làm việc trong ngày do trong sprint có 1 buổi refinment, 1 buổi planning + daily (~ 10 h)*\
Tổng nguồn lực hiện có : **287 (h)**

Tổng nguồn lực cần thực hiện test các ticket [REGULATORY_OR_PARTNER_SCOPE]:  **(Thời gian viết testcase, thời gian test và các đầu việc liên quan đến kiểm thử).** [**Chi tiết Estimate xem Tại đây**]([GOOGLE_DOC_LINK])

Thời gian viết testcase và test function: **149**

Thời gian viết testcase SIT và thực hiện SIT: **120h**

==> Tổng thời gian thực hiện: **169h (đủ so với nguồn lực hiện có)**

**4. Điều kiện kết thúc kiểm thử**

- Hoàn thành 100% testcase của các ticket cần hoàn thành trong Sprint 19:

  - [REGULATORY_OR_PARTNER_SCOPE] Integration - xử lý cuối kỳ
- Không tồn đọng bug priotiry từ High trở lên
- Các bugs còn lại tồn đọng <=5% với priority từ Medium trở xuống và được sự thống nhất nhất của team

## **5. Các tài liệu tham khảo**

| **Reference** | **Link** |
| --- | --- |
| Requirement | [PROJECT_CODE][2025-12-26] Sprint 19 Grooming |
| Jira Board | <https://[JIRA_OR_CONFLUENCE_DOMAIN]/jira/dashboards/14174/edit> |
| Link TC | <[GOOGLE_DOC_LINK]> |
|  |  |







