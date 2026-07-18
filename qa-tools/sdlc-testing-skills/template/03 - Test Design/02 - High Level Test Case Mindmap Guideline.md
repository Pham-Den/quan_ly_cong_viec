> **Hướng dẫn sử dụng template:** Nội dung dưới đây được giữ theo format tài liệu mẫu gốc. Khi dùng cho dự án mới, thay các placeholder như `[PROJECT_CODE]`, `[PROJECT_NAME]`, `[SYSTEM_NAME]`, `[ENV]`, `[OWNER]`, `[LINK]`; giữ lại các bảng, tiêu chí, checklist và các con số baseline nếu còn phù hợp. Nguồn gốc đã sanitize: `Testing Guideline\THIẾT KẾ HIGH-LEVEL TEST CASE DẠNG MINDMAP\THIẾT KẾ HIGH-LEVEL TEST CASE DẠNG MINDMAP.md`.

# High Level Test Case Mindmap Guideline

> **Mục đích sử dụng:** Dùng hướng dẫn thiết kế high-level test case dạng mindmap để review coverage nhanh theo flow/rule/exception.

<https://[CONFLUENCE_DOMAIN]/wiki/pages/[PAGE_ID]>

Mục tiêu: Chuẩn hóa tư duy kiểm thử theo định hướng rủi ro (Risk-based), bao phủ toàn diện từ chức năng, phi chức năng đến tuân thủ bảo mật.

Đối tượng áp dụng: QA/QC, Test Lead, BA, Dev Team.

---

## 1. NGUYÊN TẮC TƯ DUY (CORE MINDSET)

*5 câu hỏi cốt lõi giúp định hình độ sâu của Test Case:*

1. **Thứ tự (Order):** Flow này chạy qua cổng kiểm soát nào trước? (Security -> Syntax -> Business). Cổng trước đóng thì cổng sau không mở.
2. **Điểm gãy (Corner/Edge Cases):** Hệ thống cư xử thế nào tại các điểm cực đoan? (Max limit, Null data, Mạng chập chờn, Race Condition).
3. **Sự phụ thuộc (Dependency):** Logic này có điều kiện tiên quyết không? (TK phải Active mới check Ngưỡng nghiệp vụ).
4. **Hệ quả dây chuyền (Chain Impact):** Sau khi API chạy xong, module nào khác bị thay đổi? (Trừ tiền -> Phí -> Báo cáo).
5. **Rủi ro (Risk):** Sai ở bước này mất tiền thật hay chỉ lỗi hiển thị? (Ưu tiên test kỹ các luồng tài chính).

---

## 2. CẤU TRÚC MINDMAP TIÊU CHUẨN (8 NHÁNH)

Yêu cầu vẽ Mindmap xoay quanh **ROOT NODE [Tên API / Mã bản tin [DOMAIN_STANDARD]]** với 8 nhánh chính sau:

### 🟢 Nhánh 1: Pre-conditions & Data (Đầu vào & Môi trường) => Để tối ưu có thể để dạng node nhìn đỡ rối

- **Environment Setup:**

  - Mock Partners (Giả lập [PARTNER_A]/Core partnering response).
  - Time Travel (Chỉnh giờ server để test cut-off time, ngày nghỉ lễ).
- **Data Setup:**

  - **Account State:** Active, Closed, Blocked, Inactive.
  - **Limit State:** Đủ ngưỡng nghiệp vụ, Vừa khít (Boundary), Đã vượt ngưỡng nghiệp vụ.
- **Input Variations:**

  - Payload: JSON/XML đúng chuẩn và sai chuẩn (Malformed).
  - Fields: Null, Max length, SQL Injection strings.

### 🔴 Nhánh 2: Validation Flow (Logic Tuần Tự - Nested)

*Nguyên tắc: Vẽ dạng lồng ghép (Nested), không liệt kê ngang hàng.*

- **Lớp 1: Security Gate (Cổng bảo vệ)**

  - Token Expired/Invalid, Signature Wrong.
  - ⛔ *Expect: HTTP 401/403. Stop flow.*
- **Lớp 2: Technical/Syntax (Cổng kỹ thuật)**

  - Schema Check (XSD/JSON Schema), Data Type mismatch.
  - ⛔ *Expect: HTTP 400 (*`FORMAT_INVALID`*). Stop flow.*
- **Lớp 3: Business Logic (Cổng nghiệp vụ)**

  - Check trạng thái [USER_OR_PARTNER]/Service -> Check Số dư/Ngưỡng nghiệp vụ.
  - ⛔ *Expect: HTTP 200 + Business Error Code (VD:* `RJCT`*,* `LIMIT_EXCEEDED`*).*

### 🟠 Nhánh 3: Process & Abnormal (Xử lý & Bất thường)

*Trọng tâm của hệ thống Switch.*

- **Happy Path:** Luồng đi thẳng thành công.
- **Resilience (Khả năng chịu lỗi):**

  - **Timeout Handling:** [PARTNER_A] không phản hồi -> Switch tự tạo `[MESSAGE_TYPE_RESPONSE]` (Reject) hay Pending?
  - **Reversal (Luồng xử lý bổ sung):** Nghiệp vụ timeout nhưng tiền đã trừ -> Kích hoạt auto-reversal.
  - **System Corner Cases:**

    - **Idempotency:** Gửi lại request cũ (trùng MsgId) -> Không trừ tiền lần 2.
    - **Race Condition:** 2 request trừ tiền cùng lúc -> Chỉ 1 thành công.

### 🔵 Nhánh 4: Output & Verification (Kiểm tra Tại Chỗ)

- **API Response:** HTTP Code, Body Error Code, Message Description.
- **Logging & Tracing:**

  - **Txn\_Log:** Trạng thái cuối cùng (`ACCEPTED`, `RCV_TIMEOUT`).
  - **Integration\_Log:** Ghi nhận đủ request type (`A2A_INQUIRY...`).
- **(MỚI) Observability:**

  - Check Metrics trên Prometheus/Grafana (Error rate không tăng đột biến).
  - Check Alert trên ELK/Kibana.

### ⚡ Nhánh 5: Cross-Module Impacts (Ảnh hưởng Lan Truyền)

- **[ACCOUNTING_MODULE]:** Tài khoản bị trừ tiền (Hold/Deduct), Ngưỡng nghiệp vụ ngày bị trừ.
- **Fee Module:** Phí nghiệp vụ được tính đúng.
- **Notification:** SMS/Email gửi đi đúng nội dung/template.
- **Reporting:** Nghiệp vụ lên báo cáo đối chiếu dữ liệu/xử lý yêu cầu nghiệp vụ.

### 🟣 Nhánh 6: Non-Functional Requirements (NFR - Mở Rộng)

- **Performance:** Latency < 300ms (P95), Throughput ≥ 2000 TPS.
- **Load/Stress:** Chịu tải Peak 10.000 TPS trong X phút.
- **Reliability:** Chaos Monkey Test (Kill DB, Kill Partner Node -> Hệ thống không mất transaction).
- **Scalability:** Thêm node mới -> TPS tăng tuyến tính, không drop request.
- **Security Pen-test:** OWASP API Top 10, Mass Assignment, IDOR.

### 🟡 Nhánh 7: Compliance & Regulatory (Tuân thủ - MỚI)

- **PCI DSS:** Dữ liệu thẻ/PAN không được lưu plain-text (Masking).
- **[REGULATORY_OR_PARTNER_SCOPE] Regulations:** Lưu log tối thiểu 5 năm (Thông tư 39), Báo cáo nghiệp vụ giá trị lớn (>500tr).
- **AML/CFT:** Nghiệp vụ nghi ngờ/Blacklist -> Cảnh báo hoặc Block.
- **Data Privacy:** Quyền được quên (Right to be forgotten), Data Retention Policy.

### ⚪ Nhánh 8: Maintenance & Evolution (Bảo trì - MỚI)

- **Contract Testing:** Đảm bảo Schema tuân thủ OpenAPI/[DOMAIN_STANDARD] (Không breaking change).
- **Backward Compatibility:** Client phiên bản cũ vẫn gọi được API này.
- **Regression Scope:** Danh sách các API/Flow khác bị ảnh hưởng khi sửa API này.
- **Automation Strategy:**

  - 🤖⭐ **P0 (Critical):** Idempotency, Timeout Reversal (Bắt buộc Automate).
  - 🤖 **P1 (High):** Happy Path, Validation cơ bản.
  - **P2 (Medium):** Edge cases khó tái lập.
- **Data Cleanup:** Script reset ngưỡng nghiệp vụ, xóa txn rác, luồng xử lý bổ sung sau khi test xong.

---

## 3. QUY ƯỚC TRÌNH BÀY (VISUAL STANDARD)

Sử dụng màu sắc và icon để Mindmap trở thành ngôn ngữ chung dễ hiểu:

|  |  |  |  |
| --- | --- | --- | --- |
| **Đối tượng** | **Màu sắc** | **Icon Minh họa** | **Ý nghĩa** |
| **Happy Case** | 🟢 Xanh lá | ✅ | Luồng chạy đúng, kết quả thành công. |
| **Validation/Error** | 🔴 Đỏ | ⛔ | Các case kiểm thử lỗi (Negative test). |
| **Abnormal/Risk** | 🟠 Cam | ⚠️ | Timeout, Mất mạng, Case biên (Race condition). |
| **Verification** | 🔵 Xanh dương | 👁️ | Check Log, DB, Metrics. |
| **Impact** | ⚡ Sấm sét | 🔗 | Ảnh hưởng sang module khác (Ngưỡng nghiệp vụ, Phí). |
| **NFR** | 🟣 Tím | 🚀 | Hiệu năng, Tải, Bảo mật. |
| **Compliance** | 🟡 Vàng | 🛡️ | Tuân thủ luật (PCI DSS, [REGULATORY_OR_PARTNER_SCOPE], AML). |
| **Automation** | 🤖 | 🤖⭐ | Case đã được Automation |

---

## 4. CHECKLIST: DEFINITION OF DONE (DoD - 12 Points)

*Test Lead/Reviewer sử dụng checklist này để duyệt Mindmap:*

1. [ ] **Logic Layering:** Đã vẽ validation theo dạng lồng ghép (Security -> Tech -> Biz) chưa?
2. [ ] **Impact Separation:** Đã tách riêng Verification (Tại chỗ) và Impact (Lan truyền) chưa?
3. [ ] **[CORE_MODULE] Behavior:** Đã có nhánh Timeout, Reversal và Idempotency chưa?
4. [ ] **Data Coverage:** Đã có các case biên (Max, Min, Null) chưa?
5. [ ] **Logging:** Đã ghi rõ tên bảng log và trạng thái cần verify chưa?
6. [ ] **Observability:** Đã có bước check Monitoring/Alert chưa?
7. [ ] **NFR Metrics:** Đã có con số cụ thể cho Latency/Throughput chưa?
8. [ ] **Compliance:** Đã bao gồm check PCI DSS, AML, [REGULATORY_OR_PARTNER_SCOPE] chưa?
9. [ ] **Contract Testing:** Đã kiểm tra Backward Compatibility chưa?
10. [ ] **Regression Scope:** Đã liệt kê các API bị ảnh hưởng chưa?
11. [ ] **Automation:** Đã đánh dấu priority (P0/P1) cho các case cần automate chưa?
12. [ ] **Data Cleanup:** Đã có phương án dọn dẹp dữ liệu sau test chưa?

![Ảnh minh họa đã được lược bỏ khi template hóa]([IMAGE_PLACEHOLDER])

ROOT: [API] PACS.008 - Luồng nghiệp vụ chính (Credit Transfer)\
│\
├── 🟢 1. Pre-conditions & Data (Đầu vào)\
│ ├── Environment\
│ │ ├── Mock Partner (Giả lập [PARTNER_A]/Core Response)\
│ │ └── Time Travel (Test nghiệp vụ ngoài giờ/Cut-off time)\
│ ├── Data Setup\
│ │ ├── Sender Account: Active, Đủ số dư\
│ │ ├── Receiver Account: Valid, In-blacklist (để test AML)\
│ │ └── Ngưỡng nghiệp vụ (Limit):\
│ │ ├── Case: Còn đủ ngưỡng nghiệp vụ ngày\
│ │ └── Case: Vừa khít ngưỡng nghiệp vụ (Boundary)\
│ └── Input Payload ([DOMAIN_STANDARD])\
│ ├── Valid XML (Happy Case)\
│ └── Malformed XML (Thiếu thẻ Mandatory <InstdAmt>) [cite: 1]\
│\
├── 🔴 2. Validation Flow (Logic Tuần Tự - Nested)\
│ ├── 🔒 Lớp 1: Security Gate\
│ │ ├── ❌ Token Expired / Invalid Signature -> Expect: 401\
│ │ └── ✅ PASS -> Đi tiếp Lớp 2\
│ │ ├── ⚙️ Lớp 2: Technical/Syntax Check [cite: 1]\
│ │ │ ├── ❌ Schema Invalid (Sai XSD) -> Expect: 400 (FORMAT\_INVALID)\
│ │ │ └── ✅ PASS -> Đi tiếp Lớp 3\
│ │ └── 💼 Lớp 3: Business Logic\
│ │ ├── ❌ [USER_OR_PARTNER]/Service Inactive -> Expect: Biz Error (RJCT)\
│ │ ├── ❌ Số dư không đủ (Insufficient Fund) -> Expect: Biz Error\
│ │ ├── ❌ Vượt ngưỡng nghiệp vụ ngày -> Expect: Biz Error (LIMIT\_EXCEEDED)\
│ │ └── ✅ PASS -> Cho phép xử lý (Accepted)\
│\
├── 🟠 3. Process & Abnormal (Xử lý & Bất thường)\
│ ├── ✅ Happy Path: Switch -> [PARTNER_A] (Success) -> Switch (Success)\
│ ├── ⚠️ Resilience & Corner Cases\
│ │ ├── Timeout: [PARTNER_A] không phản hồi > 30s -> Update RCV\_TIMEOUT\
│ │ ├── Idempotency: Gửi lại MsgId cũ -> Trả kết quả cũ, KHÔNG trừ tiền lần 2\
│ │ └── Race Condition: 2 request trừ tiền cùng lúc -> Chỉ 1 request thành công\
│ └── ↩️ Auto-Reversal: Timeout nhưng Core đã trừ tiền -> Kích hoạt luồng xử lý bổ sung\
│\
├── 🔵 4. Output & Verification (Kiểm tra Tại Chỗ)\
│ ├── 📤 API Response\
│ │ ├── HTTP 200 OK\
│ │ └── Body: [DOMAIN_STANDARD] Status `ACPT` (Accepted) hoặc `RJCT` (Rejected)\
│ ├── 📝 Logging\
│ │ ├── Integration\_Log: Type `PACS.008_REQ`, `PACS.008_RES`\
│ │ └── Txn\_Log: Status cuối cùng (`ACCEPTED`, `VALIDATION_FAILED`, `RCV_TIMEOUT`)\
│ └── 👁️ Observability\
│ └── Alert: Không có alert "High Error Rate" trên Grafana\
│\
├── ⚡ 5. Cross-Module Impacts (Ảnh hưởng Lan Truyền)\
│ ├── 💰 [ACCOUNTING_MODULE] (Core): Tài khoản nguồn bị trừ (Debit)\
│ ├── 📉 Limit Management: Ngưỡng nghiệp vụ ngày bị trừ đúng số tiền\
│ ├── 💸 Fee Engine: Phí nghiệp vụ được tính (nếu có)\
│ ├── 📩 Notification: SMS/Push Noti gửi tới Sender\
│ └── 📊 Reporting: Nghiệp vụ xuất hiện trong báo cáo đối chiếu dữ liệu ngày T\
│\
├── 🟣 6. Non-Functional Requirements (NFR)\
│ ├── 🚀 Performance: Latency < 500ms\
│ ├── 🏋️ Load Test: Chịu tải 2000 TPS trong 1 giờ\
│ └── 🛡️ Security: Masking thẻ (Field PAN), SQL Injection test\
│\
├── 🟡 7. Compliance (Tuân thủ)\
│ ├── 🛡️ AML Check: Số tiền > 500tr -> Trigger báo cáo nghiệp vụ đáng ngờ\
│ └── 🔒 Data Privacy: Log không được hiện rõ số dư khách hàng\
│\
└── ⚪ 8. Maintenance & Evolution\
 ├── 🤖 Automation Priority\
 │ ├── ⭐ P0: Happy Path, Timeout Reversal (Bắt buộc)\
 │ └── ⭐ P1: Validation Limits\
 └── 🔄 Contract: Đảm bảo tương thích ngược với Client v1.0

ROOT: [API] PACS.008 ([PARTNER] -> [PARTNER_A] Flow)\
│\
├── 🟢 1. Pre-conditions (Đầu vào)\
│ ├── Environment: Kết nối tới [SIMULATOR] [PARTNER_A] (Ready)\
│ └── Data Setup: Tài khoản [PARTNER] Active, Đủ ngưỡng nghiệp vụ gửi đi.\
│\
├── 🔴 2. Validation Flow (Tại [SYSTEM_NAME])\
│ ├── 🔒 Security Gate (Token/Signature từ [PARTNER])\
│ │ └── ❌ Fail -> Trả lỗi ngay cho [PARTNER] (HTTP 401), KHÔNG gửi sang [PARTNER_A].\
│ ├── ⚙️ Technical Check (Schema [MESSAGE_TYPE_REQUEST])\
│ │ └── ❌ Fail -> Trả lỗi ngay cho [PARTNER] (HTTP 400), KHÔNG gửi sang [PARTNER_A].\
│ └── 💼 Business Check (Ngưỡng nghiệp vụ [PARTNER], Blacklist)\
[cite\_start]│ ├── ❌ Fail -> Tạo [MESSAGE_TYPE_RESPONSE] (RJCT) trả ngay [PARTNER], log trạng thái VALIDATION\_FAILED[cite: 10].\
│ └── ✅ PASS -> Chuyển sang Nhánh 3 (Process)\
│\
├── 🟠 3. Process Logic (Luồng xử lý chính)\
│ ├── ✅ Happy Path (Nghiệp vụ thành công)\
│ │ ├── Bước 1: [SYSTEM_NAME] forward [MESSAGE_TYPE_REQUEST] sang [PARTNER_A]\
│ │ ├── Bước 2: [PARTNER_A] phản hồi [MESSAGE_TYPE_RESPONSE] (Status: ACTC/ACPT)\
│ │ └── Bước 3: [SYSTEM_NAME] forward [MESSAGE_TYPE_RESPONSE] (ACPT) về cho [PARTNER]\
│ │ └── ⚠️ Lưu ý: Map đúng Reason Code từ [PARTNER_A] sang code của [PARTNER] (nếu có mapping).\
│ │\
│ ├── ⚠️ Abnormal / Exception Cases (Đặc thù Switch)\
│ │ ├── Case: [PARTNER_A] trả về [MESSAGE_TYPE_RESPONSE] (RJCT - Từ chối)\
│ │ │ └── [SYSTEM_NAME] update trạng thái REJECTED -> Forward [MESSAGE_TYPE_RESPONSE] (RJCT) về [PARTNER].\
│ │ ├── Case: [PARTNER_A] không phản hồi (Timeout)\
[cite\_start]│ │ │ └── [SYSTEM_NAME] update trạng thái RCV\_TIMEOUT [cite: 13] -> Tự tạo [MESSAGE_TYPE_RESPONSE] (RJCT) gửi về [PARTNER].\
│ │ └── Case: [PARTNER_A] phản hồi HTTP 500 (Lỗi hệ thống [PARTNER_A])\
│ │ └── [SYSTEM_NAME] thực hiện Retry (nếu có config) hoặc trả lỗi ngay.\
│ │\
│ └── ↩️ Auto-Reversal (Nếu cần)\
│ └── Nếu [PARTNER_A] Timeout nhưng [SYSTEM_NAME] đã trừ ngưỡng nghiệp vụ -> Kích hoạt hoàn ngưỡng nghiệp vụ.\
│\
├── 🔵 4. Output & Verification (Kiểm tra)\
│ ├── 📝 Log Verification (Quan trọng)\
│ │ ├── Step 1 (Receive): Log `integration_log` type `PACS.008_REQ_From_[PARTNER]`\
│ │ ├── Step 2 (Forward): Log `integration_log` type `PACS.008_REQ_TO_TCNL`\
│ │ ├── Step 3 (Response): Log `integration_log` type `PACS.002_RES_From_TCNL`\
│ │ └── Final Status: `txn_log` = `ACCEPTED` (nếu [PARTNER_A] OK) hoặc `REJECTED` (nếu [PARTNER_A] từ chối).\
│ └── 📤 API Verification\
│ └── Check nội dung file `[MESSAGE_TYPE_RESPONSE]` gửi về [PARTNER]:\
│ ├── `OrgnlMsgId`: Phải khớp với MsgId của `[MESSAGE_TYPE_REQUEST]` gốc.\
│ ├── `TxSts`: Trạng thái nghiệp vụ (`ACPT`, `RJCT`, `PDNG`).\
│ └── `StsRsnInf`: Mã lỗi chi tiết (nếu có).\
│\
├── ⚡ 5. Cross-Module Impacts\
│ ├── Ngưỡng nghiệp vụ [PARTNER] bị trừ (Debit).\
│ └── Phí nghiệp vụ được tính (nếu có).\
│\
└── (Các nhánh NFR, Compliance, Maintenance... giữ nguyên theo Guideline)







