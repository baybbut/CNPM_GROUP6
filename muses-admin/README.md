# MUSES Admin Workspace

Ứng dụng React/Vite riêng trong `muses-admin/`, đã tích hợp trên nhánh **`develop`**. Giữ nền kem, sidebar đen và bảng màu pastel của dashboard ban đầu.

```bash
cd muses-admin
npm ci
npm run dev -- --port 5174 --strictPort
```

Build: `npm run build`. Preview bản build: `npm run preview -- --port 4174`.

## Các trang

- **Overview**: lượng truy cập, tài khoản đăng nhập, giờ cao điểm và tham gia tại từng điểm đọc từ API thật.
- **Visitors**: thiết bị, phiên truy cập gần đây và tài khoản khách; lọc theo khoảng ngày.
- **Reports**: biểu đồ giờ cao điểm, hoạt động theo ngày và xuất CSV từ số liệu DB.
- **Artworks**: lưới/danh sách, tìm kiếm, lọc trạng thái, thêm/sửa/xóa và chọn ảnh cục bộ.
- **Artists & Categories**: thêm/sửa nghệ sĩ và thể loại; đổi tên cập nhật các tác phẩm liên quan trong workspace.
- **Languages & Audio**: mô tả Việt/Anh, trạng thái duyệt, chọn audio cục bộ và nghe thử.
- **Exhibitions & Events**: tạo/sửa triển lãm, workshop, tour; lọc loại và kiểm tra ngày kết thúc.
- **Outdoor Points · GPS**: cấu hình tên, tọa độ, bán kính và trạng thái các điểm. Marker trên bản đồ là vị trí minh họa, không phải phép chiếu GPS thật.
- **QR Check-in**: thống kê điểm đọc, chọn tác phẩm thật và tạo QR có mã điểm để ghi nhận hoạt động.
- **Museum Info & Maps**: thông tin liên hệ, giờ hoạt động, xem/tải bản đồ từng tầng.
- **Staff & Permissions**: quản lý hồ sơ/role demo và xem mô hình quyền. Không tạo tài khoản thật, không gửi email, không thực thi phân quyền.
- **Settings**: lưu tên hiển thị, email, tùy chọn thông báo. Tên hiển thị cập nhật sidebar/dashboard; ngôn ngữ là preference, UI hiện vẫn bằng tiếng Anh.

Điều hướng dùng hash, ví dụ `/#Artworks`, `/#Visitors`, `/#QR%20Check-in`; refresh và nút Back/Forward hoạt động. Không cần cấu hình rewrite route trên static hosting.

## Dữ liệu và giới hạn

**Overview, Visitors, Reports, QR Check-in** kết nối SQL Server qua backend; API báo cáo yêu cầu tài khoản Admin. Khách có thể đăng ký/đăng nhập tại `/account` trên website khách. Xem [hướng dẫn cập nhật database và kiểm thử](../docs/ADMIN-ANALYTICS.md).

Các trang quản lý nội dung còn lại vẫn là workspace localStorage với prefix `muses-admin-`, chưa xuất bản thay đổi sang DB. Staff & Permissions vẫn là danh sách demo; tài khoản quản trị thật được tạo bằng `npm run admin:create` trong backend.

Ảnh upload tối đa 600 KB và audio tối đa 700 KB để phù hợp giới hạn browser storage ở workspace nội dung. Chưa có upload media lên server.

Ảnh/bản đồ dùng chung từ `../muses-react/`; giữ hai folder cạnh nhau. Cài dependencies sau khi pull vì app bổ sung thư viện `qrcode`.

## Cấu trúc và kiểm tra

- `src/main.jsx`: shell, sidebar, overview, hash navigation và dữ liệu artwork dùng chung.
- `src/pages/`: component riêng cho từng trang và các thành phần giao diện chung.
- `src/AdminPages.jsx`: ánh xạ menu sang trang.
- `src/pages.css`: responsive và style các workspace mới.
- `src/Icons.jsx`, `src/assets.js`: icon và ảnh dùng chung.

Đã kiểm tra build production; mở đủ 11 trang mới trên desktop và mobile 390px; tạo artwork và giữ qua refresh; tìm kiếm; check-in/check-out; đổi khoảng báo cáo và tải CSV; thêm nghệ sĩ; lưu bản dịch; validation ngày sự kiện; lưu điểm GPS; tạo/tải QR PNG; thêm staff demo; đổi tên profile cập nhật sidebar. Bản thống kê mới đã được kiểm tra API và luồng trình duyệt bằng adapter dữ liệu thử nghiệm; cần chạy migration và kiểm thử với SQL Server trên máy triển khai.

### Nghe thử văn bản

Trong Languages & Audio, lưu mô tả ở tiếng Việt/Anh rồi chọn **Read aloud** để đọc và tô sáng chữ theo lời đọc. Có tạm dừng/tiếp tục, dừng, tốc độ và chọn giọng trên thiết bị. Không cần upload audio hoặc API key; giọng đọc dùng Web Speech API. Theo từ nếu giọng hỗ trợ boundary, nếu không sẽ tô sáng câu/đoạn đang đọc. Đóng modal sẽ dừng phát. Component dùng chung với website nên cần giữ `muses-react/src/components/Narration/` trong repo.
