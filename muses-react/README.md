# MUSES — Website khách

Website React/Vite cho tra cứu tác phẩm, nội dung 5 ngôn ngữ, đọc văn bản thành tiếng, QR tác phẩm, bảo tàng/bản đồ, lộ trình tham quan và tra cứu giá vé.

- [README hệ thống](../README.md): chuẩn bị SQL Server, backend, Admin và chạy local.
- [PRD hiện hành](../docs/prd/PRD.md): yêu cầu chức năng, phạm vi và nghiệm thu.

## Chạy trong thư mục muses-react

```bash
npm ci
npm run dev -- --host 0.0.0.0 --port 5173
```

Backend cần chạy riêng ở cổng 3001; Vite proxy `/api` và `/images` tới backend. Nếu đang đứng ở gốc repo, dùng `npm --prefix muses-react ...` thay vì các lệnh npm tại thư mục này.

```bash
npm test
npm run build
```

Bản build nằm ở `dist`. Đọc hướng dẫn ở README hệ thống trước khi thử QR trên điện thoại: mã localhost không truy cập được từ thiết bị khác, camera/GPS trong browser cần HTTPS hoặc localhost. Dữ liệu công khai phụ thuộc trạng thái Published và bản tiếng Việt hợp lệ; không tự dịch hoặc tạo dữ liệu tác phẩm giả khi API lỗi.
