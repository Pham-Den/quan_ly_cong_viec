> **Hướng dẫn sử dụng template:** Nội dung dưới đây được giữ theo format tài liệu mẫu gốc. Khi dùng cho dự án mới, thay các placeholder như `[PROJECT_CODE]`, `[PROJECT_NAME]`, `[SYSTEM_NAME]`, `[ENV]`, `[OWNER]`, `[LINK]`; giữ lại các bảng, tiêu chí, checklist và các con số baseline nếu còn phù hợp. Nguồn gốc đã sanitize: `Automation Test\(---) Hướng dẫn cho người mới từ A--Z- Cài đặt phần mềm, lấy code dự án để chạy\Run Tests Using Visual Studio Code\Run Tests Using Visual Studio Code.md`.

# Automation Run Guide

> **Mục đích sử dụng:** Dùng hướng dẫn chạy Automation test local/IDE/CI, cấu hình môi trường và đọc kết quả.

<https://[CONFLUENCE_DOMAIN]/wiki/pages/[PAGE_ID]>

## Chạy test và debug sử dụng VSCode

Thông tin cài đặt và những tính năng đã và đang được phát triển tại link bên dưới

## Giới thiệu qua về các thành phần chính của extention

1. Cấu hình môi trường hoặc các arg liên đang sử dụng trên dự project hiện tại

Đổi args `"args": ["-vENV:uat","-dReport/"]` `-vENV:qc hoăc -vENV:qc` để chạy các môi trường tương ứng qc hay uat

\*\*\* Xem thêm các ví dụ cấu hình

Cấu hình file sẽ được lưu trong file `.vscode\launch.json` ==> cái này đã lưu mặc định trong thư mục khi lấy code về rồi, chỉ cần import project là có thể chạy được.

ex

Tham khảo thêm cấu hình link <https://github.com/robocorp/robotframework-lsp/blob/master/robotframework-ls/docs/config.md#vscode-example-configs>

#### 2. Viết script

Về bản chất RIDE hay VSCode thì là IDE, nên cách viết code trên VSCode sẽ hơi khác, chỉ cần bạn nhớ cấu trúc 1 file .resource hoặc .robot là viết được. Extention hỗ trợ gợi ý từ khóa cũng như import các resource và thư viện.

#### 3 . Run test và debug

Run test trên Explorer => Truy cập vào testcase cần thực hiện test sẽ hiển thị thông tin như hình

Mỗi testcase sẽ hiển thị label `RUn` | `Debug` | `INTERACTIVE CONSOLE` Sẽ tương ứng với với testcase đó sẽ thực run test hay debug

(1) Màn hình view explorer - Xem sửa chạy testcase - keyword

(2) THông tin testcase - variable, testcases, keywords

(3) Run hoặc debug test theo từng testcase

(4) (5) Hiển thị thông báo lỗi gì và ở đâu

(6)(7) THông tin log trong terminal

\*\* có thể click link log.html trong cửa sổ này và mở ra trình duyệt

![Ảnh minh họa đã được lược bỏ khi template hóa]([IMAGE_PLACEHOLDER])

**Debug :**

Click `debug` trên testcase mong muốn

(1) Các biến sẽ được hiển thị ra khi debug

(2) Các action debug như continue (F5), Step over (F10), next step (F11) ….

(3) Các check point - khi chạy đến đoạn đó sẽ dừng lại sử dụng các (2) để debug - debug sẽ chạy vào trong cùng của keyword được gọi

(4) Màn hình console sẽ hiển thi chi tiết xem đang tương tác đến bước nào

![Ảnh minh họa đã được lược bỏ khi template hóa]([IMAGE_PLACEHOLDER])

#### Trường hợp fail sẽ hiển thị thông báo fail ở keyword nào lý do là gì.

![Ảnh minh họa đã được lược bỏ khi template hóa]([IMAGE_PLACEHOLDER])

Thông báo lỗi nếu debug ở tab Testing trong VSCode

![Ảnh minh họa đã được lược bỏ khi template hóa]([IMAGE_PLACEHOLDER])

## Tab Testing trong VScode : Tương tư như trên nhưng sẽ list toàn bộ testcase ra

![Ảnh minh họa đã được lược bỏ khi template hóa]([IMAGE_PLACEHOLDER])

END







