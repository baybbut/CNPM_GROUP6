# Muses visitor website

React/Vite. Khách không cần đăng nhập để tìm tác phẩm, chọn ngôn ngữ, nghe nội dung, quét QR, xem bảo tàng và mở chỉ đường.

```sh
npm ci
npm run dev -- --host 0.0.0.0 --port 5173
```

Giữ backend chạy 3001. Vite proxy `/api` và `/images`; đổi backend bằng API_PROXY_TARGET trong `.env.local`, không dùng VITE_* cho mật khẩu.

- `/explore/collection`: tìm và lọc đồng thời tên/tác giả/chất liệu/bảo tàng đang trưng bày; phân trang từ API.
- `/explore/artworks/:id`: chỉ nội dung công bố; tên/mô tả theo vi/en/zh/ja/ko; fallback vi có nhãn; TTS dùng contentLanguage, không tự phát và không chọn giọng khác ngôn ngữ. Có ảnh/nguồn/metadata và bảo tàng từ lịch đã xác nhận.
- `/museums`, `/museums/:id`: tên/địa chỉ/liên hệ/bản đồ; GPS chỉ khi nhấn tìm gần tôi, chỉ tính khoảng cách trên thiết bị. Chỉ đường dùng tọa độ bảo tàng; không lưu/gửi GPS khách.
- `/scan`: camera (cần HTTPS hoặc localhost), ảnh QR, nhập mã; chỉ mở route tác phẩm trong website này. Điện thoại dùng URL Network của máy, không dùng localhost của máy tính.
- Trang chủ giữ bố cục; gallery chỉ lấy tác phẩm công bố. Trang sự kiện cũ được gắn nhãn minh họa; không dùng nó để suy ra nơi trưng bày hiện tại.

Bộ demo có nhãn IsDemo; SVG tự tạo ở `background/catalog-demo`. Nội dung cũ giữ nháp để nhóm duyệt và xác nhận nguồn/quyền ảnh.

```sh
npm test
npm run build
```

[Hướng dẫn PRD/DB](../docs/prd/RUN.md) · [Bằng chứng và checklist nghiệm thu](../docs/prd/ACCEPTANCE.md). Browser fixture nằm ở `tests/browser/prd.mjs`; không thay thế kiểm thử SQL Server và Safari thật.
