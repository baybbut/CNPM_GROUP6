# QR thuyết minh đa ngôn ngữ

Trong popup **Mã QR tác phẩm**, chọn **Thuyết minh đa ngôn ngữ**, rồi chọn **Ngôn ngữ muốn nghe**. Có thể mở thử hoặc tải ảnh QR để in. Camera điện thoại và trình quét của Muses đều mở trang nghe theo ngôn ngữ ghi trong mã. Khách bấm phát để nghe bản ghi âm hoặc bấm đọc để dùng giọng của thiết bị.

QR thuyết minh ưu tiên mô tả đã công bố cho ngôn ngữ đã chọn. Khi thiếu bản dịch, backend gửi mô tả gốc đến LibreTranslate theo yêu cầu của lượt mở QR. Trang nghe ghi nhãn bản dịch tự động. Nếu dịch vụ chưa sẵn sàng, khách có thể thử lại. Cả hai loại QR đều dùng trạng thái kích hoạt của tác phẩm trong Admin.

## Chạy dịch vụ dịch máy

Trong thư mục gốc của repo, chạy:

```sh
docker compose -f compose.translation.yml up -d
```

Lần đầu LibreTranslate cần tải các mô hình. Backend mặc định dùng `http://127.0.0.1:5000`. Nếu chạy dịch vụ ở địa chỉ khác, đặt `TRANSLATE_URL` trong `muses-backend/.env` và khởi động lại backend. Dùng `TRANSLATE_ENABLED=false` để chỉ dùng mô tả đã dịch sẵn.

Kiểm tra mô hình ngôn ngữ qua `/api/translation/health?mode=listen`. Để quét từ điện thoại, tạo QR từ địa chỉ web mà điện thoại truy cập được, chẳng hạn đường dẫn HTTPS của bản demo.
