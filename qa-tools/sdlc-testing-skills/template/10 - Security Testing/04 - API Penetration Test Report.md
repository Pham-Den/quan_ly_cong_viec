> **Hướng dẫn sử dụng template:** Nội dung dưới đây được giữ theo format tài liệu mẫu gốc. Khi dùng cho dự án mới, thay các placeholder như `[PROJECT_CODE]`, `[PROJECT_NAME]`, `[SYSTEM_NAME]`, `[ENV]`, `[OWNER]`, `[LINK]`; giữ lại các bảng, tiêu chí, checklist và các con số baseline nếu còn phù hợp. Nguồn gốc đã sanitize: `Security Test\[2025-06-06] Security Report for Pentest API [SYSTEM_NAME]\[2025-06-06] Security Report for Pentest API [SYSTEM_NAME].md`.

# API Penetration Test Report

> **Mục đích sử dụng:** Dùng cho báo cáo pentest API, blackbox/graybox, tập trung endpoint, auth, authorization, injection, data exposure và issue remediation.

<https://[CONFLUENCE_DOMAIN]/wiki/pages/[PAGE_ID]>

**Project/Asset Name:** [SYSTEM_NAME]\
**Prepared by:** \
**Date:**

## **1. Executive Summary**

- **Mục tiêu:**

  - Thực hiện pentest để tìm các lỗ hổng trên hệ thống
- **Phạm vi:**

  - API Tra cứu thông tin người nhận
  - API luồng nghiệp vụ chính [MESSAGE_TYPE_REQUEST]
  - API phản hồi [MESSAGE_TYPE_RESPONSE]
- **Kết quả tổng quan:**

  - Tổng số lỗ hổng tìm thấy: X
  - Số lỗ hổng Critical: X
  - Số lỗ hổng High: X
  - Số lỗ hổng Medium: X
  - Số lỗ hổng Low: X
- **Khuyến nghị cấp cao:**

  - Update các lỗ hổng được repợcrt report

## **2. Assessment Methodology**

- **Phương pháp / Quy trình áp dụng:**

  - OWASP Top 10
- **Các công cụ sử dụng:**

  - Burp Suite, sqlmap
- **Nguồn dữ liệu đầu vào:**

  - API Spec

## **3. Detailed Findings**

| **#** | **Vulnerability Name** | **Severity** | **Description** | **Impact** | **Evidence (PoC)** | **recommendation** | **Status** | **Note** |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| 1 | Bruteforce basic authen | Medium | Không có reatelimit nếu như truyền sai thông tin basic authen | Dò quét thông tin basic authen | <https://[JIRA_OR_CONFLUENCE_DOMAIN]/wiki/spaces/[PROJECT_NAME]/pages/[PAGE_ID]/2025-06-06+Security+Report+for+Pentest+API+[SYSTEM_NAME]#[SYSTEM_NAME]-SEC-01> | Sử dụng ratelimit khi sai thông tin basic authen nhiều lần | Close | - [DEV_OWNER]: Đầu Kong/Keycloak đang chưa xử lý phần này. Sẽ tạo ticket improve. cc a a - :    - Keycloak có cơ chế enable Brute force detection <https://www.keycloak.org/docs/latest/server_admin/index.html#password-guess-brute-force-attacks>   - Document đã cập nhật mô tả khi triển khai cần bật cấu hình Brute Force detection với các thông tin tham khảo Quy trình vận hành Keycloak Production   - thử lại nhé |
| 2 | Case-insensitive Authentication | Low | Thông tin xác thực không phân biệt chữ hoa chữ thường | Dễ dàng dò quét thông tin xác thực | <https://[JIRA_OR_CONFLUENCE_DOMAIN]/wiki/spaces/[PROJECT_NAME]/pages/[PAGE_ID]/2025-06-06+Security+Report+for+Pentest+API+[SYSTEM_NAME]#[SYSTEM_NAME]-SEC-02> | Chỉ sử dụng lowercase | Not Fix  Close | - [DEV_OWNER]: Đầu Keycloak đang chưa xử lý phần này. Sẽ tạo ticket improve. cc a a - :    - username: hiện tại keycloak đang support là case insensitive → không phân biệt hoa thường, và cũng là common case đối với các hệ thống, ví dụ google, ms …   - password: check lại nhé, a thấy đang phân biệt hoa thường đó |
| 3 | Call request với signature bằng null | Critical | Thực hiện request `inquiry` mà không có trường signature | Dễ dàng tra cứu thông tin tài khoản |  | Bổ sung function verify signature | Fixed  Close |  |
| 4 | Crawl thông tin sender\_id | Info | Thực hiện request với trường các trường MmbId, Issr điền trùng thông tin sender\_id | Leak danh sách sender\_id thuộc [SYSTEM_NAME] [USER_OR_PARTNER] |  | Rate limit hoặc tiến hành block nếu thông tin sender\_id sai | Fixed  Close | [DEV_OWNER]: Hiện tại sender\_id chính là mã identifier do cơ quan quản lý đã public nên việc leak danh sách sender\_id không ảnh hưởng gì |
| 5 | Idor thông tin tổ chức phát lệnh | High | Thực hiện request với field Payload.AppHdr.Fr.FIId.FinInstnId.ClrSysMmbId.MmbId khác sender\_id | Sai lệch thông tin trên hệ thống [SYSTEM_NAME] |  | Kiểm tra thông tin field Payload.AppHdr.Fr.FIId.FinInstnId.ClrSysMmbId.MmbId phải trùng với sender\_id | Fixed  Close |  |
| 6 | Crawl thông tin thông tin đối tượng nhận của đối tượng nhận | High | Thực hiện request brute force thông tin Document.GetAcct.AcctQryDef.AcctCrit.NewCrit.SchCrit.AcctId.EQ.Othr.Id | Crawl toàn bộ thông tin tài khoản:   - mã định danh đối tượng nhận - tên tài khoản |  | Thực hiện block nếu sai bao nhiêu lần hoặc rate limit | Not Fix  Close | Hiện tại switching đang không lưu thông tin tài khoản mà cần gọi sang [PARTNER_A] nên chưa thực hiện validate này. Phần này [PARTNER] sẽ control việc crawling từ 1 tài khoản người dùng |
| 7 | Amount invalid | Medium | Thực hiện request luồng nghiệp vụ chính với số tiền <0, =0, số thập phân | Sai lệch thông tin trên hệ thống [SYSTEM_NAME] |  | Validate thông tin [AMOUNT_FIELD] đảm bảo là số nuyên dương | Close | [DEV_OWNER]: Hiện tại đang validate theo min, max trong transaction\_type trong workflow. Cần phải validate thêm đầu incoming connector API. |
| 8 | Call request transfer với signature sai hoặc bằng null | Info | Thực hiện request `transfer` mà không có trường signature hoặc sig sai | Có thể gửi dữ liệu không hợp lệ tới hệ thống [SYSTEM_NAME] | <https://[JIRA_OR_CONFLUENCE_DOMAIN]/wiki/spaces/[PROJECT_NAME]/pages/[PAGE_ID]/2025-06-06+Security+Report+for+Pentest+API+[SYSTEM_NAME]#[SYSTEM_NAME]-SEC-03> | Bổ sung function verify signature | NOT FIX  Close | [DEV_OWNER]: Hiện tại đã verify chữ kỹ nhưng nằm trong workflow và sẽ trả về response lỗi bằng [MESSAGE_TYPE_RESPONSE] Refer source code: <https://gitlab.[ORG_NAME].com.vn/[ORG_NAME]/developer/[BACKEND_REPO_GROUP]/[BACKEND_REPO]/[SYSTEM_NAME]-core/[USER_OR_PARTNER]/-/blob/development/src/main/java/com/[ORG_NAME]/[USER_OR_PARTNER]/activity/[USER_OR_PARTNER]ValidatorActivityImpl.java?ref_type=heads> |
| 9 | Idor Thông tin đối tượng gửi | Info | Thực hiện request với [SENDER_ORG_ID_FIELD] khác sender\_id | Sai lệch thông tin trên hệ thống [SYSTEM_NAME] | <https://[JIRA_OR_CONFLUENCE_DOMAIN]/wiki/spaces/[PROJECT_NAME]/pages/[PAGE_ID]/2025-06-06+Security+Report+for+Pentest+API+[SYSTEM_NAME]#[SYSTEM_NAME]-SEC-04> | Validate thông tin [SENDER_ORG_ID_FIELD] trùng sender\_id | Re-Check Close | [DEV_OWNER]: Có bổ sung validate từ ngày 05/06 Refer source code: <https://gitlab.[ORG_NAME].com.vn/[ORG_NAME]/developer/[BACKEND_REPO_GROUP]/[BACKEND_REPO]/incoming-connector/-/blob/development/src/main/java/com/[ORG_NAME]/integration/incomingconnector/service/messagehandler/[MESSAGE_HANDLER].java?ref_type=heads> |
| 10 | Thông tin đối tượng gửi invalid | Info | Thực hiện request với [SENDER_ORG_ID_FIELD] trùng sender\_id nhưng không có trên hệ thống [SYSTEM_NAME] | Sai lệch thông tin trên hệ thống [SYSTEM_NAME] | <https://[JIRA_OR_CONFLUENCE_DOMAIN]/wiki/spaces/[PROJECT_NAME]/pages/[PAGE_ID]/2025-06-06+Security+Report+for+Pentest+API+[SYSTEM_NAME]#[SYSTEM_NAME]-SEC-05> | Kiểm tra thông tin sender\_id đảm bảo thuộc [SYSTEM_NAME] [USER_OR_PARTNER] | NOT FIX Close | [DEV_OWNER]: Hiện tại đã check thông tin [USER_OR_PARTNER] nhưng nằm trong workflow và sẽ trả về response lỗi bằng [MESSAGE_TYPE_RESPONSE]  Refer source code: <https://gitlab.[ORG_NAME].com.vn/[ORG_NAME]/developer/[BACKEND_REPO_GROUP]/[BACKEND_REPO]/[SYSTEM_NAME]-core/[USER_OR_PARTNER]/-/blob/development/src/main/java/com/[ORG_NAME]/[USER_OR_PARTNER]/activity/[USER_OR_PARTNER]ValidatorActivityImpl.java?ref_type=heads> |
| 11 | Thông tin đối tượng nhận invalid | Info | Thực hiện request với [RECEIVER_ORG_ID_FIELD] không thuộc [USER_OR_PARTNER] [SYSTEM_NAME] | Sai lệch thông tin trên hệ thống [SYSTEM_NAME] | <https://[JIRA_OR_CONFLUENCE_DOMAIN]/wiki/spaces/[PROJECT_NAME]/pages/[PAGE_ID]/2025-06-06+Security+Report+for+Pentest+API+[SYSTEM_NAME]#[SYSTEM_NAME]-SEC-06> | Đảm bảo thông tin [RECEIVER_ORG_ID_FIELD] thuộc [SYSTEM_NAME] [USER_OR_PARTNER] | NOT FIX Close | [DEV_OWNER]: Hiện tại đã check thông tin [USER_OR_PARTNER] nhưng nằm trong workflow và sẽ trả về response lỗi bằng [MESSAGE_TYPE_RESPONSE]  Refer source code: <https://gitlab.[ORG_NAME].com.vn/[ORG_NAME]/developer/[BACKEND_REPO_GROUP]/[BACKEND_REPO]/[SYSTEM_NAME]-core/[USER_OR_PARTNER]/-/blob/development/src/main/java/com/[ORG_NAME]/[USER_OR_PARTNER]/activity/[USER_OR_PARTNER]ValidatorActivityImpl.java?ref_type=heads> |
| 12 | Idor request transfer |  | - partner A gọi request transfer tới enpoint sender\_id = partner A với body A và được sign bởi private key partner A thành công. - partner B gọi request transfer tới enpoint sender\_id = partner A với body A và được sign bởi private key partner B. | partner B có thể thực hiện request transfer của partner A |  | Đảm bảo chỉ partner A mới có thể call tới enpoint sender\_id = partner A  Kiểm tra thông tin tại token mà keycloak trả cho Kong |  | Môi trường QC chưa có đủ thông tin 2 cặp client\_id và client\_secret nên em chưa test được, cc anh , anh |
| 13 | Idor request transfer with private key |  | - partner A gọi request transfer tới enpoint sender\_id = partner A với body A và được sign bởi private key partner A thành công. - partner B gọi request transfer tới enpoint sender\_id = partner A với body A và được sign bởi private key partner A. | partner B có thể thực hiện request transfer của partner A |  | Kiểm tra thông tin tại token mà keycloak trả cho Kong |  | Môi trường QC chưa có đủ thông tin 2 cặp client\_id và client\_secret nên em chưa test được, cc anh , anh |
| 14 | không Validate [PARTNER] trong request |  | - Đối tác/tổ chức bên ngoài A có 1 transaction gửi tới B, sau đó B thực hiện copy transaction với [PARTNER] là C | Gây sai sót số liệu |  | Kiểm tra thông tin [PARTNER] trong request copy transaction |  |  |
| 15 | Không Validate [PARTNER_A] trong request |  | - [PARTNER_A] truy vấn nghiệp vụ từ A->B([PARTNER_A]) | Gây sai sót só liệu |  | Kiểm tra có đúng [PARTNER] đang request hay không |  |  |

#### [SYSTEM_NAME]-SEC-01

![Ảnh minh họa đã được lược bỏ khi template hóa]([IMAGE_PLACEHOLDER])

#### [SYSTEM_NAME]-SEC-02

[SYSTEM_NAME]\_incoming\_coNNector\_qc\_1:[SECRET_PLACEHOLDER]

[SYSTEM_NAME]\_incoming\_connector\_qc\_1:[SECRET_PLACEHOLDER]

[SYSTEM_NAME]\_incoming\_connector\_qc\_1:[SECRET_PLACEHOLDER]

…

#### [SYSTEM_NAME]-SEC-03

Fail Signature:

![Ảnh minh họa đã được lược bỏ khi template hóa]([IMAGE_PLACEHOLDER])

Null Signature:

![Ảnh minh họa đã được lược bỏ khi template hóa]([IMAGE_PLACEHOLDER])

#### [SYSTEM_NAME]-SEC-04

![Ảnh minh họa đã được lược bỏ khi template hóa]([IMAGE_PLACEHOLDER])

#### [SYSTEM_NAME]-SEC-05

![Ảnh minh họa đã được lược bỏ khi template hóa]([IMAGE_PLACEHOLDER])

#### [SYSTEM_NAME]-SEC-06

![Ảnh minh họa đã được lược bỏ khi template hóa]([IMAGE_PLACEHOLDER])

## **4. recommendations & Remediation Plan**

| Priority | Action Item | Owner | Deadline | Status |
| --- | --- | --- | --- | --- |
| High | Update các thư viện lên phiên bản mới nhất | Dev Team | 09/06/2025 | Not Started |
| Medium | Theo dõi trạng thái lỗ hổng trên t | Security Team | 10/06/2025 | In Progress |

## **5. Conclusion**

- Tóm tắt lại:

  - Dự án fix và update trạng thái các lỗ hổng được report
  - Security sẽ keep-track trạng thái lỗ hổng

## **6. Appendix**

<[GOOGLE_DOC_LINK]>







