# QR truy cập qua Internet

QR chứa IP như `172.20.10.2` chỉ dùng khi điện thoại truy cập được mạng của máy tính. Để khách dùng Wi-Fi khác hoặc 4G/5G, chạy bản demo qua địa chỉ HTTPS công khai tạm thời.

## Chạy trên máy Mac có database của nhóm

Giữ Docker/SQL Server và kết nối Internet hoạt động. Cài `cloudflared` một lần bằng Homebrew:

```bash
brew install cloudflared
```

Dừng terminal backend cũ bằng Ctrl+C để giải phóng cổng backend. Từ thư mục gốc project chạy:

```bash
npm --prefix muses-backend run share
```

Lệnh kiểm tra cloudflared, build website với API/QR cùng origin, khởi động backend bằng cấu hình DB hiện có và tạo Cloudflare Quick Tunnel. Không cần chạy Vite hoặc đưa SQL Server lên Internet. Lệnh không chạy migration, đổi dữ liệu hay ghi đè `.env`.

Khi terminal in địa chỉ dạng `https://....trycloudflare.com`, chờ tunnel báo kết nối rồi mở link **LẤY QR WEBSITE** (`https://..../scan`) trên Mac. Quét mã **QR truy cập website** trong trang này bằng camera điện thoại. Mã mới trỏ tới trang chủ HTTPS, không dùng lại ảnh QR IP nội bộ đã tải/in trước đó.

Máy Mac, database, terminal share và Internet phải được giữ hoạt động. Ctrl+C đóng backend/tunnel do lệnh này tạo. Link Quick Tunnel có thể đổi sau mỗi lần chạy nên cần lấy lại QR. Khách chỉ cần Internet; không cần cùng Wi-Fi.

Đây là bản demo tạm thời phụ thuộc máy đang chạy và dịch vụ Cloudflare, không phải triển khai 24/7 với tên miền cố định. Nếu muốn in QR sử dụng lâu dài, cần triển khai backend/SQL/website lên hạ tầng online và dùng domain ổn định.

Admin vẫn có thể chạy riêng tại localhost:5174, dùng cùng backend. Khi khách mở link công khai, tín hiệu truy cập được gửi về cùng backend/DB đó. Ở Admin chọn đúng ngày/khung giờ và chờ khoảng 5 giây. Việc mở QR trang chủ tạo phiên/lượt xem, không cộng lượt QR tác phẩm.
