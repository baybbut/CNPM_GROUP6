> Cập nhật PRD 29/10/2026: dùng [hướng dẫn mới](prd/RUN.md). Migration chính là `db:catalog`; bản dịch MVP nhập/duyệt thủ công, 5 ngôn ngữ vi/en/zh/ja/ko. Các phần LibreTranslate và workspace cũ dưới đây là tài liệu lịch sử.

# Thống kê Admin

Các mục Overview, Visitors, Reports và QR Check-in lấy dữ liệu từ backend, không dùng số mẫu. Các khu vực quản lý nội dung khác vẫn giữ nguyên trạng thái trước đây.

## Cập nhật một lần trên máy đang chạy SQL Server

1. Mở Docker Desktop và giữ container SQL Server đang chạy. Dừng backend cũ bằng Ctrl+C.
2. Tại thư mục repo, pull nhánh develop. Giữ cấu hình DB hiện có trong `muses-backend/.env`.
3. Trong thư mục `muses-backend`, chạy:

```sh
npm ci
npm run db:setup
npm run admin:create
npm start
```

`db:setup` hỏi tài khoản SQL quản trị (thường là `sa`) và mật khẩu SQL đó; mật khẩu không hiển thị, không được lưu vào file. Script dùng kết nối quản trị riêng để tạo các bảng AuthSessions, AuthLoginEvents, AnalyticsSessions, AnalyticsEvents nếu chưa có. Script không xóa dữ liệu cũ và không reset DB. Sau đó script cấp đúng quyền đọc/ghi cần thiết cho tài khoản `DB_USER` hiện tại, không cấp `db_owner` hay quyền tạo bảng cho tài khoản ứng dụng. Giữ nguyên `.env`.

Nếu tài khoản ứng dụng đã có đủ quyền tạo bảng và đọc/ghi các bảng thống kê, vẫn có thể dùng `npm run db:migrate`. Lỗi `CREATE TABLE permission denied` được xử lý bằng `npm run db:setup`; không đổi tài khoản ứng dụng thành `sa` chỉ để chạy web.

`admin:create` hỏi tên, email và mật khẩu riêng của bạn. Mật khẩu được băm bằng scrypt; script không ghi đè tài khoản có email đã tồn tại. Dùng tài khoản mới này đăng nhập tại Overview/Reports. Các tài khoản mẫu có PasswordHash giữ chỗ trong script SQL cũ không phải tài khoản đăng nhập thật.

4. Mở terminal khác, vào `muses-react`, chạy `npm ci` và `npm run dev -- --host 0.0.0.0 --port 5173`.
5. Mở terminal khác, vào `muses-admin`, chạy `npm ci` và `npm run dev -- --host 0.0.0.0 --port 5174`.

Nếu backend khác cổng 3001, cấu hình `API_PROXY_TARGET` trong file `.env.local` của từng frontend rồi khởi động lại Vite. Nếu website khách khác cổng 5173, có thể đặt `VITE_VISITOR_BASE_URL` trong `.env.local` của Admin hoặc sửa trực tiếp địa chỉ website khi tạo QR.

## Kiểm thử

- Mở Overview tại Admin và đăng nhập bằng tài khoản quản trị vừa tạo. Khi chưa có khách, số liệu là 0, không có giờ cao điểm giả.
- Dùng trình duyệt/thiết bị khác mở web khách. Tại Tài khoản (`/account`), đăng ký rồi đăng nhập để có thống kê tài khoản khách. Truy cập không đăng nhập vẫn được ghi nhận.
- Ở Admin, bấm Tạo QR điểm đọc, chọn tác phẩm từ DB, nhập mã điểm (ví dụ `san-vuon-01`) và địa chỉ website mà điện thoại truy cập được. Tải QR rồi quét trên điện thoại cùng Wi-Fi.
- URL điểm đọc có dạng `/explore/artworks/17?lang=vi&source=qr&point=san-vuon-01`. Mỗi điểm dùng một mã ổn định; hai điểm có thể trỏ đến cùng tác phẩm.
- Bấm Đọc văn bản để nghe. Chỉ sự kiện bắt đầu phát mới tăng lượt nghe; tạm dừng/tiếp tục không tạo lượt mới.
- Quay lại Admin, bấm Làm mới hoặc chờ tối đa 5 giây khi trang đang hiển thị. Kiểm tra thống kê từng điểm, giờ cao điểm, bộ lọc ngày, phiên mới nhất và bộ lọc giờ.
- Thử đăng xuất và mở API `/api/admin/analytics`: phải bị từ chối. Tài khoản khách không có quyền đọc báo cáo Admin.

## Ý nghĩa chỉ số

- Khách đang hoạt động: số thiết bị có hoạt động trong 5 phút gần nhất; không phụ thuộc khoảng ngày báo cáo. Tab đang ẩn không gửi heartbeat. Mở nhiều tab vẫn có thể tạo nhiều phiên nhưng thiết bị chỉ được tính một lần.
- Tài khoản đang hoạt động: tài khoản khách đăng nhập còn hoạt động trong 5 phút gần nhất.
- Tài khoản đã đăng nhập: số tài khoản khách khác nhau đăng nhập thành công trong kỳ. Tổng lượt đăng nhập đếm số lần thành công; lịch sử không mất khi đăng xuất.
- Thiết bị: mã ẩn danh lưu trong trình duyệt. Không dùng IP hay fingerprint. Đổi trình duyệt hoặc xóa dữ liệu có thể được tính thành thiết bị khác; nhiều người chung máy chỉ là một thiết bị.
- Phiên: tạo mới sau 30 phút không có hoạt động; không đồng nghĩa tài khoản đăng nhập.
- Mở QR: mở trang tác phẩm từ liên kết QR. Mã QR cũ không có `source=qr` không thể phân biệt với truy cập thông thường; cần tạo lại để đếm lượt QR.
- Tham gia tại điểm: thiết bị khác nhau đã mở QR hoặc bắt đầu nghe tại điểm đó. Xem tác phẩm được đếm riêng. Tài khoản tham gia đếm tài khoản riêng biệt tại điểm; lịch sử này không mất khi đăng xuất. Không xác nhận vị trí GPS hay số người có mặt thực tế.
- Giờ cao điểm: khung giờ có nhiều thiết bị khác nhau tương tác nhất, gộp các ngày trong kỳ; nếu bằng nhau hiển thị tất cả. Ngày/giờ báo cáo dùng múi giờ Việt Nam (UTC+7), dữ liệu lưu UTC.
- Hoạt động được ghi nhận từ thời điểm cài đặt, không thể khôi phục số liệu trước đó. Thống kê phụ thuộc việc thiết bị gửi được sự kiện tới máy chủ.

Có thể đặt `COOKIE_SECURE=true` trong backend khi triển khai HTTPS. Cookie đăng nhập có HttpOnly, SameSite=Lax và hạn 12 giờ. API báo cáo kiểm tra quyền quản trị; cookie/mật khẩu không được lưu trong localStorage.

## Overview và quản lý QR

Visitors đã gộp vào Overview: 5 số liệu tổng quan, biểu đồ giờ cao điểm và danh sách phiên có tìm kiếm/lọc trạng thái. `#Visitors` cũ mở Overview. Menu QR Check-in đổi thành Quản lý QR, quản lý mã tác phẩm thực sự dùng trên web (tên, bật/tắt, xem/tải, lượt mở), theo [hướng dẫn QR](QR-MANAGEMENT.md). Thống kê chi tiết theo giờ/ngày/điểm đọc vẫn ở Reports. Phần cấu hình QR cần chạy lại `db:catalog` để thêm các cột trạng thái; việc gộp trang không thay đổi cách đếm khách. Các hướng dẫn tạo QR điểm đọc và menu cũ phía trên là mô tả phiên bản trước.

## Chọn khung giờ báo cáo

Đã bỏ nút Báo cáo theo ngày trên thanh trên và các nút Xuất CSV. Hôm nay/7 ngày hiển thị đen khi được chọn; Làm mới có trạng thái nhấn/tải. Bộ chọn Từ giờ/Đến giờ (giờ Việt Nam, nguyên giờ) lọc dữ liệu lịch sử trong từng ngày của khoảng ngày đang chọn. Mặc định Cả ngày là [00:00,24:00); không hỗ trợ một khoảng đảo qua nửa đêm. Biểu đồ chỉ hiện các cột trong khoảng đã chọn, thay cho chuỗi liệt kê giờ cao điểm dài. Tổng phiên/thiết bị, lượt QR/nghe, bảng ngày/điểm đọc và danh sách phiên đều lấy cùng bộ lọc từ API. Phiên trong khoảng giờ là phiên có sự kiện trong khoảng đó; thời gian hoạt động cuối vẫn là giá trị mới nhất đã ghi nhận. Chỉ số Khách đang hoạt động giữ ý nghĩa thời gian thực trong 5 phút gần nhất.

API nhận thêm fromHour (0–23), toHour (1–24, lớn hơn fromHour). Tham số được kiểm tra và truyền SQL có kiểu, lọc theo UTC+7 với đầu khoảng bao gồm/cuối khoảng loại trừ. Không có thay đổi schema hay migration cho lần chỉnh này. Các kiểm thử API và trình duyệt dùng DB adapter/dữ liệu giả, không thay thế việc kiểm tra trên SQL Server thật.

## Truy cập điện thoại và phục hồi thống kê

Website Vite mặc định nghe trên mạng ở cổng 5173, báo lỗi nếu cổng bận thay vì đổi cổng làm QR cũ mất hiệu lực. Khi đổi Wi-Fi/hotspot, mở Network URL mới trên máy tính và tạo lại QR. Điện thoại cần có đường kết nối đến máy tính; QR IP nội bộ không phải đường dẫn Internet công khai.

Nếu frontend cấu hình API là localhost nhưng được mở từ điện thoại qua IP mạng, phần gửi thống kê dùng proxy `/api` cùng origin. Các lượt chưa gửi được do mạng lỗi/HTTP 429/5xx được thử lại với cùng EventID, từ 1 giây đến tối đa 30 giây; yêu cầu chờ quá 10 giây được hủy để thử lại. Khôi phục kết nối hoặc mở lại tab cũng kích hoạt gửi tiếp. Mã khách/phiên cũ sai định dạng được tạo lại trước khi gửi.

Admin lấy dữ liệu mỗi 5 giây khi hiển thị và cập nhật khi quay lại cửa sổ. API báo cáo trả `summary.trackingReady`; nếu SQL user thiếu quyền SELECT/INSERT/UPDATE cần thiết cho các bảng thống kê, Admin hiển thị thông báo. Đây là kiểm tra quyền, không phải bảo đảm toàn bộ lượt điện thoại đã tới DB. Mã lỗi `ACTIVITY_SETUP_REQUIRED` và `ACTIVITY_PERMISSION_DENIED` phân biệt schema thiếu và quyền SQL bị từ chối. Bản sửa không tự chạy migration hay đổi quyền DB.

Quét QR trang chủ tạo lượt xem/phiên truy cập, không cộng `qr_scan` tác phẩm. Mở lại trên cùng trình duyệt trong 30 phút hoạt động vẫn có thể là cùng một phiên. Chọn Hôm nay và Cả ngày để đối chiếu; chỉ số đang hoạt động luôn tính 5 phút gần nhất.
