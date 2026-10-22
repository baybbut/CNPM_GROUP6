# Quét QR và dịch tự động local

Nhánh `muses/admin`. Website khách: `muses-react`; backend: `muses-backend`.

## Chạy LibreTranslate

Mở Docker Desktop. Từ thư mục gốc repo (cùng cấp với `muses-react`):

```sh
docker compose -f compose.translation.yml up -d
docker compose -f compose.translation.yml logs -f --tail=30
```

Lần đầu phải tải image và mô hình, có thể mất nhiều phút. Dịch mô tả dài trên CPU có thể mất gần một phút; web chờ tối đa 75 giây cho trang chi tiết. Container không thay đổi SQL Server hiện có. Mô hình được giữ trong Docker volume. Nếu Mac Apple Silicon báo thiếu image tương thích, dùng `DOCKER_DEFAULT_PLATFORM=linux/amd64 docker compose -f compose.translation.yml up -d` (chạy giả lập có thể chậm).

Thêm/sửa trong `muses-backend/.env` (giữ nguyên cấu hình DB):

```dotenv
TRANSLATE_ENABLED=true
TRANSLATE_URL=http://127.0.0.1:5000
```

Khởi động lại backend:

```sh
cd muses-backend
npm ci
npm start
```

Mở terminal khác, từ thư mục gốc:

```sh
cd muses-react
npm ci
npm run dev -- --port 5173
```

Kiểm tra `http://localhost:3001/api/translation/health`: `ready: true` và đủ `vi,en,fr,ja,zh`. Nếu false, xem log Docker và chờ mô hình tải xong. Nếu backend cũng chạy trong container, địa chỉ `127.0.0.1` phải đổi thành tên service cùng Docker network.

## Kiểm thử trên web

1. Mở tác phẩm có mô tả trong Bộ sưu tập. Chọn ngôn ngữ nội dung Việt / Anh / Pháp / Nhật / Trung.
2. Bản dịch DB được ưu tiên. Thiếu bản dịch thì backend dịch mô tả dài và ngắn qua Docker; bản dịch tự động được ghi nhãn, cache tạm 1 giờ, không ghi đè DB. Tên tác phẩm và thông tin danh mục giữ nguyên dữ liệu DB. Danh sách bộ sưu tập không dịch hàng loạt.
3. Bấm đọc văn bản: giọng đọc dùng đúng ngôn ngữ mô tả. Máy cần cài giọng tương ứng. Việc tô sáng từ phụ thuộc sự kiện mà giọng đọc trình duyệt cung cấp.
4. Bấm **Mã QR tác phẩm**, tải ảnh. Mở **Quét QR** (`/scan`), chọn ngôn ngữ và tải ảnh QR hoặc bật camera. QR sẽ mở đúng tác phẩm cùng ngôn ngữ đã chọn. Có thể thử dán `muses:artwork:1` nếu tác phẩm 1 tồn tại.
5. Tắt dịch vụ rồi đổi sang ngôn ngữ chưa cache: web phải báo chưa dịch được và giữ nguyên ngôn ngữ bản gốc. Bấm thử lại khi Docker sẵn sàng.

Camera cần HTTPS hoặc localhost và quyền camera. QR chứa localhost chỉ mở được trên máy đó. Muốn điện thoại truy cập, chạy web với `--host 0.0.0.0` và dùng địa chỉ LAN của máy tính; camera trên HTTP LAN thường không được trình duyệt cho phép, hãy tải ảnh QR hoặc dùng HTTPS. Scanner chỉ điều hướng tới trang tác phẩm trong website này, không mở tên miền tùy ý từ QR. Không gửi ảnh camera lên backend.

Không cần chạy lại script reset DB. Bản dịch tự động không yêu cầu thêm bảng SQL.
