# MUSES Admin

Dashboard React/Vite riêng, giữ sidebar đen, nền kem và thẻ pastel. Tất cả workspace nội dung chính hiện dùng API/SQL Server: tác phẩm, tác giả/chất liệu/thể loại, bản dịch thủ công, bảo tàng và lịch trưng bày. Overview/Visitors/Reports/QR Check-in dùng thống kê SQL đã có. Không dùng localStorage để công bố dữ liệu bảo tàng.

```sh
npm ci
npm run dev -- --port 5174
```

Backend chạy 3001; Vite proxy `/api`. Đổi backend bằng API*PROXY_TARGET trong `.env.local` rồi restart. Không đưa SQL secrets vào VITE*\*.

Cập nhật DB bằng `npm --prefix muses-backend run db:catalog` từ gốc repo; sau đó `admin:create` nếu chưa có tài khoản. Email/password Admin khác SQL login. Tất cả trang chính yêu cầu Admin; API cũng xác thực role, không chỉ ẩn UI.

- Artworks: lưu nháp trước, nhập nguồn/ảnh/nguồn ảnh; cần bản Việt công bố trước Published; Hidden giữ lịch sử.
- Languages & Audio: vi/en/zh/ja/ko, nhập tên/mô tả/nguồn thủ công, Draft/Published, URL audio tùy chọn và nghe thử đúng ngôn ngữ.
- Museum Info & Maps: địa chỉ/tọa độ/nguồn, xác minh ghim; chặn ẩn bảo tàng còn lịch xác nhận hiện tại/tương lai.
- Exhibitions & Events: lịch hiện vật tại bảo tàng, `[bắt đầu,kết thúc)`, nguồn/ngày kiểm chứng/người cập nhật; chống chồng lịch trong SQL transaction.
- Artists & Categories: tác giả, chất liệu, thể loại; FK chặn xóa mục đang được dùng.
- Visitors/Reports/QR Check-in: dữ liệu phiên/thiết bị, tài khoản tùy chọn, giờ cao điểm/điểm đọc; không phải đếm số người có mặt qua GPS.

Các component local demo cũ được giữ trong nguồn để tham khảo nhưng không còn là menu quản lý nội dung chính. Media dùng URL hợp lệ; chưa có dịch vụ upload file lên server.

[Hướng dẫn chạy, backup, restore và kiểm thử](../docs/prd/RUN.md) · [Đối chiếu PRD](../docs/prd/ACCEPTANCE.md)
