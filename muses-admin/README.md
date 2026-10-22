# MUSES Admin Dashboard

App React/Vite riêng trên nhánh `muses/admin`.

```bash
cd muses-admin
npm ci --cache /workspace/.cache/npm
npm run dev -- --host 0.0.0.0 --port 5174
```

Production: `npm run build`; preview: `npm run preview -- --port 4174`.

Có tìm kiếm, lịch, đổi khoảng biểu đồ, thêm tác phẩm nháp, thông báo và dialog audio/QR/GPS. Dữ liệu demo trong bộ nhớ phiên, chưa kết nối backend, xác thực hoặc lưu file. Các thao tác save chỉ mô phỏng trong phiên. Ảnh dùng từ `../muses-react/`; giữ hai folder cạnh nhau. Google Fonts tùy chọn, có font dự phòng.
