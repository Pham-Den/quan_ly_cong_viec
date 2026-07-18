> **Hướng dẫn sử dụng template:** Nội dung dưới đây được giữ theo format tài liệu mẫu gốc. Khi dùng cho dự án mới, thay các placeholder như `[PROJECT_CODE]`, `[PROJECT_NAME]`, `[SYSTEM_NAME]`, `[ENV]`, `[OWNER]`, `[LINK]`; giữ lại các bảng, tiêu chí, checklist và các con số baseline nếu còn phù hợp. Nguồn gốc đã sanitize: `Test Information\Hướng dẫn cài đặt SFTP\Hướng dẫn cài đặt SFTP.md`.

# SFTP Setup Guide

> **Mục đích sử dụng:** Dùng hướng dẫn setup SFTP phục vụ test tích hợp, batch file hoặc evidence transfer.

<https://[CONFLUENCE_DOMAIN]/wiki/pages/[PAGE_ID]>

Các phần mềm cần tải về

1. FileZilla
2. Gpg4win

## FileZilla

Truy cập đường dẫn sau thực hiện tải và giải nén ra

<https://filezilla-project.org/download.php?show_all=1>

![Ảnh minh họa đã được lược bỏ khi template hóa]([IMAGE_PLACEHOLDER])

Sau khi giải nén

![Ảnh minh họa đã được lược bỏ khi template hóa]([IMAGE_PLACEHOLDER])

Mở file Filezilla.exe

Download file cấu hình sẵn của dự án

Trên cửa sổ chọn File → Import → file sites.xml bên trên đã download về máy

![Ảnh minh họa đã được lược bỏ khi template hóa]([IMAGE_PLACEHOLDER])

Trong cửa sổ thông báo chon **Ok** và hiển thị thông báo **Import successfull**

![Ảnh minh họa đã được lược bỏ khi template hóa]([IMAGE_PLACEHOLDER])

Thực hiện chạy lệnh bastion trước khi kết nối

Tiếp trên cửa sổ Filezilla chọn [ORG_NAME]-sftp như hình và thực hiện kết nối

![Ảnh minh họa đã được lược bỏ khi template hóa]([IMAGE_PLACEHOLDER])

Hiển thị thông báo nhập **Enter master password** - nhập **xxxxx (liên hệ**  **)**→ ấn OK để kết nối

![Ảnh minh họa đã được lược bỏ khi template hóa]([IMAGE_PLACEHOLDER])![Ảnh minh họa đã được lược bỏ khi template hóa]([IMAGE_PLACEHOLDER])

## Gpg4win

Setup

Truy cập vào <https://gpg4win.org/thanks-for-download.html> và thực hiện download

1. Mở file gpg4win-4.4.1.exe → version của thể khác nhau tùy thời điểm người dùng download
2. Chọn button **Next** trên cửa sổ setup

![Ảnh minh họa đã được lược bỏ khi template hóa]([IMAGE_PLACEHOLDER])

3. Ở bước tiếp theo sẽ có thông báo yêu cầu cài quyền admin - > Chọn Yes để bỏ qua mà cài đi theo tài khoản người dùng

![Ảnh minh họa đã được lược bỏ khi template hóa]([IMAGE_PLACEHOLDER])

4. Ở màn hình tiếp chọn mặc đinh và chọn Next sang bước tiếp theo

![Ảnh minh họa đã được lược bỏ khi template hóa]([IMAGE_PLACEHOLDER])

5. Tiếp tục chọn Next và Next → sẽ thông báo cài đặt hoàn thành và chọn Run Kleopatra nếu muốn chạy luôn khi cài đặt kết thúc

![Ảnh minh họa đã được lược bỏ khi template hóa]([IMAGE_PLACEHOLDER])![Ảnh minh họa đã được lược bỏ khi template hóa]([IMAGE_PLACEHOLDER])![Ảnh minh họa đã được lược bỏ khi template hóa]([IMAGE_PLACEHOLDER])

#### **Import Private Key**

Mở **Kleopatra**

1. Mở ứng dụng **Kleopatra**
2. Vào **File > Import**
3. Chọn file `private.key` => file này liên hệ gửi lại

hoặc trên màn hình thực hiện kéo file hoặc chọn file **private.key**

![Ảnh minh họa đã được lược bỏ khi template hóa]([IMAGE_PLACEHOLDER])

KHi import private.key sẽ hiển thị thông báo như hinh và chọn **Yes, It’s Mine**

![Ảnh minh họa đã được lược bỏ khi template hóa]([IMAGE_PLACEHOLDER])

Chọn Ok

![Ảnh minh họa đã được lược bỏ khi template hóa]([IMAGE_PLACEHOLDER])

#### **Giải mã file PGP**

File **PGP** sẽ được lấy từ sftp hướng dẫn phía trên

1. Vào **File >** **Decrypt/Verify**
2. Chọn file pgp bạn muốn giải mã.
3. Nhập **passphrase (***xxxx liên hệ*  hoặc **)** khi được yêu cầu

![Ảnh minh họa đã được lược bỏ khi template hóa]([IMAGE_PLACEHOLDER])

4. Chọn **Save All > Sẽ tạo ra file zip tại thư mục chứa file GPG**

![Ảnh minh họa đã được lược bỏ khi template hóa]([IMAGE_PLACEHOLDER])![Ảnh minh họa đã được lược bỏ khi template hóa]([IMAGE_PLACEHOLDER])

Trong thực mục cùng với file được giải mã sẽ tạo 1 file .zip

\*Có thể mở trực tiếp file để giải mã mà ko cần mở từ cửa sổ của **Kleopatra**\

![Ảnh minh họa đã được lược bỏ khi template hóa]([IMAGE_PLACEHOLDER])

Tham khảo thêm\
Hướng dẫn giải mã tệp GPG







