# Ticket / đặt vé và QR minh họa

Theo yêu cầu hiện tại, dùng **QR mẫu**, không thu tiền, không gắn số tài khoản ngân hàng và không tự xác nhận “đã thanh toán”. QR chứa mã đặt vé + tổng tiền + dòng `MUSES DEMO — NOT A PAYMENT`, không phải payload VietQR/EMV để chuyển khoản. Mã này không có giá trị vào cửa.

## Chạy

Từ thư mục gốc repo, sau khi lấy code mới:

```sh
npm --prefix muses-backend run db:catalog
```

Lệnh sao lưu trước khi thêm bảng `TicketOffers` / `TicketReservations` và cấp quyền. Dùng tài khoản SQL quản trị, không đổi DB_USER ứng dụng. Sau đó restart backend, web và Admin đang chạy.

- Website: `http://localhost:5173/tickets`.
- Nút Ticket ở header, Đặt vé ở trang chủ và trang Visit đều dẫn tới `/tickets`.
- Admin: mục **Tickets**, cấu hình bảng giá từng bảo tàng, điều kiện giảm/miễn phí, ngày trong tuần không nhận đặt vé, bật nhận đặt vé. Bảo tàng cũng cần công khai. Không tự áp một giá cho mọi bảo tàng thật.
- Chưa có bảo tàng/dữ liệu demo: `npm --prefix muses-backend run db:demo` bổ sung bộ minh họa theo PRD và giá vé minh họa chỉ cho các bảo tàng `IsDemo=1`. Giá minh họa: người lớn 40.000, ưu đãi 20.000, trẻ em 0 VND. Nhóm thay bằng điều kiện/giá thật khi có nguồn.

Giữ mặc định `.env`:

```dotenv
TICKET_PAYMENT_MODE=demo
```

Không cần tài khoản merchant hoặc key cho QR mẫu.

## Luồng trang

1. Chọn bảo tàng, ngày (hôm nay đến 90 ngày tới), số lượng từng loại (1–20 khách).
2. Nhập tên và email liên hệ. Không cần đăng nhập; không tuyên bố đã gửi email vì chưa có dịch vụ gửi thư.
3. Kiểm tra lại ngày/số lượng/tổng tiền/điều kiện; tích đồng ý rồi tạo QR mẫu.
4. Server tính lại tiền từ bảng giá, kiểm tra ngày nghỉ và lưu snapshot giá. Không tin tổng tiền client; giá thay đổi yêu cầu xem lại. UUID request giúp retry không tạo đơn trùng.
5. Tải ảnh QR hoặc mở trang thông tin đơn `/tickets/confirmation/:id`. Đơn mẫu luôn chưa thu tiền; không có nút cho khách tự đánh dấu thanh toán.

Trang có 5 ngôn ngữ vi/en/zh/ja/ko, icon từ folder icon, layout responsive cùng màu kem/nâu của website. Không lưu tên/email vào localStorage; chỉ lưu mã đơn gần nhất trong sessionStorage để tìm lại trang kết quả ở cùng tab. Receipt công khai dùng UUID khó đoán, không trả email/tên; API Admin mới được xem dữ liệu khách.

Admin theo dõi tối đa 200 đơn mới nhất, tìm theo mã/khách/ngày. Vé mẫu không có thao tác xác nhận nhận vé. Xác nhận nhận vé thật yêu cầu server kiểm tra đã trả tiền/miễn phí, ngày tham quan hôm nay và chưa xử lý trước đó.

## Thanh toán thật về sau

Có mã adapter VNPAY 2.1 chuẩn bị sẵn nhưng **chưa nghiệm thu với merchant/VNPAY thật**. Tài liệu gateway không truy cập được từ môi trường cloud và không có tài khoản merchant để chạy giao dịch. Không bật chỉ để tạo QR mẫu.

Muốn chuyển sang thật cần merchant, secret cấu hình trên backend, giá/điều kiện đã xác nhận và kiểm thử sandbox end-to-end. Chỉ khi đặt `TICKET_PAYMENT_MODE=vnpay` và đủ `VNPAY_TMN_CODE`, `VNPAY_HASH_SECRET`, `VNPAY_RETURN_URL` mới tạo URL gateway. Không đưa secrets vào VITE\_\* hay gửi lên chat. Bảo tàng minh họa luôn đi luồng demo kể cả có gateway.

Endpoint IPN `/api/tickets/vnpay/ipn` cần URL HTTPS công khai được merchant đăng ký; gateway không gọi được localhost trên máy Mac. API xác minh chữ ký HMAC, mã merchant, mã đơn, số tiền và trạng thái provider; không tin query ở trang return. QR demo bị từ chối ở IPN, kể cả khi có chữ ký hợp lệ. Không có tích hợp hoàn tiền/đổi lịch giao dịch đã thu tiền trong bản này. Cần nghiệm thu các trường hợp pending, fail, callback trùng/trễ, miễn phí và vận hành đối soát trước khi bật bán vé thật.

## Bằng chứng kiểm thử

- Backend unit/API adapter: kiểm tra giá phía server, ngày/số khách/đồng ý điều kiện, idempotency, callback giả, quyền Admin và chữ ký. Không dùng tài khoản hoặc tiền thật.
- Frontend unit: tổng tiền, khoảng ngày Việt Nam/90 ngày/ngày nghỉ, 5 ngôn ngữ, payload QR minh họa.
- Browser script: `node muses-react/tests/browser/tickets.mjs` với Vite 5186 và Chromium CDP 9222. API có kiểm soát, không phải SQL thật. Kiểm tra 375/768/1440, nhập ngày/thông tin, đồng ý điều kiện, tạo/tải QR và receipt chưa thanh toán.
- Schema mới cần chạy/kiểm thử trên SQL Server local của nhóm; cloud chưa có SQL Server. Giữ nguyên chính sách backup trước migration.
