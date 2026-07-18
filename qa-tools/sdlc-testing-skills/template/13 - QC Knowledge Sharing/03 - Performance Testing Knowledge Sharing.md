> **Hướng dẫn sử dụng template:** Nội dung dưới đây được giữ theo format tài liệu mẫu gốc. Khi dùng cho dự án mới, thay các placeholder như `[PROJECT_CODE]`, `[PROJECT_NAME]`, `[SYSTEM_NAME]`, `[ENV]`, `[OWNER]`, `[LINK]`; giữ lại các bảng, tiêu chí, checklist và các con số baseline nếu còn phù hợp. Nguồn gốc đã sanitize: `[QC] Onboarding document\Tài liệu Performance Test.md`.

# Performance Testing Knowledge Sharing

> **Mục đích sử dụng:** Dùng chia sẻ kinh nghiệm performance testing, phân tích bottleneck, baseline, stress/soak/load và monitoring.

<https://[CONFLUENCE_DOMAIN]/wiki/pages/[PAGE_ID]>

## 🛠️ Công Cụ Sử Dụng

Hiện tại, team sẽ dùng **JMeter** để thực hiện test tải cho các hệ thống của dự án.

- **Trang chủ:** <https://jmeter.apache.org/>
- **Link tải:** <https://jmeter.apache.org/download_jmeter.cgi>
- **Yêu cầu:** Cài đặt **JDK Version 17**.

  - *Lưu ý:* Version này có thể khác với các version khác trên hệ thống đẩy tải (bao gồm master - slave).
- **IDE (Trình soạn thảo):** Tùy cá nhân, có thể sử dụng Notepad, VSCode, hoặc IntelliJ…

---

**🔗 Các Phân Hệ Truy Cập**

- **Jenkins (Hệ thống CI nội bộ):**

  - <https://[SYSTEM_NAME]-jenkins.ops.[ORG_NAME].mobi/>
- **GitLab: Repo chứa script JMX (Dự án Core [CORE_MODULE])**

  - Đây là nơi lưu trữ các script `.jmx`. (Nếu là dự án khác, vui lòng tạo repo riêng).
  - <https://gitlab.[ORG_NAME].com.vn/[ORG_NAME]/qc/performance-test/jmeter>
- **GitLab: Repo Pipeline (Dự án Core [CORE_MODULE])**

  - <https://gitlab.[ORG_NAME].com.vn/[ORG_NAME]/qc/performance-test/pipeline>
- **GitLab: Repo Share-library**

  - Nơi chứa các hàm dùng chung trong pipeline.
  - <https://gitlab.[ORG_NAME].com.vn/[ORG_NAME]/qc/performance-test/shared-library>
- Phân quyền : jenkins , gitlab thì tùy repo có thể tra đổi với các thành viên trong team
- Hệ thống đẩy tải :

  - Master - kiếm jenkins CI - windows server 2016 - 32GB ram - **8 vCPU**. - Số lượng 1
  - Slave - Agent jenkins CI - `Ubuntu 22.04.5` 4 vCPU - 16GB ram - Số lượng 5 (3 con đang chờ khi cần sẽ thực hiện upscale )







