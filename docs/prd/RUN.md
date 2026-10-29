# Chạy Muses theo PRD

Phạm vi mới: web tra cứu không cần tài khoản; Admin duyệt thủ công tác phẩm, bản dịch và lịch ở nhiều bảo tàng. Các ngôn ngữ: Việt, Anh, Trung, Nhật, Hàn. Không cần LibreTranslate cho MVP. Mobile Expo giữ nguyên, ngoài phạm vi website/Admin của PRD này.

## Lấy code và cài dependencies

Đứng tại thư mục gốc `Muses`. Nếu đang rebase hoặc có thay đổi cá nhân, hoàn tất/giữ lại chúng trước khi pull. Không dùng reset hoặc force push để bỏ qua xung đột.

```sh
git switch develop
git pull --ff-only origin develop
npm --prefix muses-backend ci
npm --prefix muses-react ci
npm --prefix muses-admin ci
```

Giữ `.env` hiện tại. User ứng dụng không cần là `sa`. SQL Server Docker phải đang chạy, publish 1433. `.env` dùng SQL authentication: DB_SERVER, DB_PORT, DB_NAME, DB_USER, DB_PASSWORD, DB_ENCRYPT và DB_TRUST_SERVER_CERTIFICATE. Chỉ đặt trust certificate=true cho Docker local tự ký. Không gửi/commit mật khẩu.

## Sao lưu, cập nhật DB, tạo Admin

```sh
npm --prefix muses-backend run db:catalog
```

Lệnh hỏi tài khoản SQL quản trị, mật khẩu ẩn và đường dẫn backup **bên trong máy/container SQL Server**, mặc định `/var/opt/mssql/data/muses-before-prd-....bak`. Cần quyền BACKUP DATABASE, DDL và GRANT. Lệnh sao lưu COPY_ONLY + CHECKSUM, chạy VERIFYONLY rồi mới cập nhật schema. Nếu backup lỗi thì dừng; không xóa/tạo lại DB. Script cấp quyền trên các bảng cần thiết và kiểm tra lại bằng chính user ứng dụng. `.env` không bị thay đổi và mật khẩu SQL quản trị không được lưu.

`Login failed for user 'sa'`: kiểm tra mật khẩu SQL, không dùng mật khẩu web Admin. Trong Docker Desktop → container SQL → Inspect → Config.Env có thể có MSSQL_SA_PASSWORD; đây là giá trị ban đầu, không chắc còn đúng nếu đã đổi mật khẩu. `DENY`: quản trị SQL cần kiểm tra quyền DENY/role db_denydatawriter của đúng database principal; GRANT không ghi đè DENY. Không đổi backend sang sa để né phân quyền.

**Không chạy `MusesDB/MusesMuseumDB.sql` để nâng cấp:** script cũ có DROP DATABASE. `db:catalog` chỉ bổ sung bảng/cột/chỉ mục, giữ hiện vật và các bản dịch cũ ở trạng thái Draft để duyệt. Không tự xác nhận nơi trưng bày từ Notes hoặc tên bảo tàng sở hữu.

Tạo tài khoản web nếu chưa có:

```sh
npm --prefix muses-backend run admin:create
```

Nhập **tên, email và mật khẩu mới cho web Admin**, không nhập lệnh npm ở các câu hỏi. Chờ dòng `Đã tạo tài khoản Admin`. Nếu lỗi INSERT permission denied, bước cấp quyền chưa xong. Nếu email đã tồn tại, script không thay mật khẩu tài khoản cũ.

Sao chép backup ra ngoài container để không mất cùng container/volume, ví dụ thay đường dẫn đúng do script in ra:

```sh
docker cp sqlserver:/var/opt/mssql/data/muses-before-prd-TIMESTAMP.bak ./muses-before-prd.bak
```

## Bộ minh họa tùy chọn

Sau khi có Admin:

```sh
npm --prefix muses-backend run db:demo
```

Lệnh cũng hỏi SQL quản trị và sao lưu trước khi ghi. Thêm 20 hiện vật giả lập riêng biệt, 3 bảo tàng minh họa, 5 hiện vật có nội dung đầy đủ 5 ngôn ngữ; có lịch hiện tại và ảnh SVG tự tạo. Không xóa hoặc sửa bản ghi thật. Mọi tác phẩm/bảo tàng đều có `IsDemo=1` và web gắn nhãn minh họa. Tọa độ chỉ phục vụ kiểm thử, không khẳng định địa điểm trưng bày thật. Nhóm cần duyệt ngôn ngữ và thay bằng dữ liệu có nguồn trước nghiệm thu thực tế.

## Chạy ba terminal

Từ thư mục gốc, mỗi lệnh ở một terminal:

```sh
npm --prefix muses-backend start
npm --prefix muses-react run dev -- --host 0.0.0.0 --port 5173
npm --prefix muses-admin run dev -- --port 5174
```

Backend: `http://localhost:3001/api/health`. Khách: `http://localhost:5173`. Admin: `http://localhost:5174` — email/mật khẩu của admin:create. Không dùng `--prefix muses-react` nếu đã cd vào chính muses-react. Port bận: dùng terminal đang chạy hoặc dừng nó bằng Ctrl+C, không mở trùng thêm một dev server.

Vite proxy `/api`, `/images` đến 3001, vì vậy cổng Vite khác vẫn dùng được. Nếu đổi port backend, đặt `API_PROXY_TARGET` trong `.env.local` của cả hai app rồi restart Vite. Không đưa mật khẩu SQL vào biến `VITE_*`.

## Luồng nghiệm thu

1. Admin → Artists & Categories: tạo tác giả, chất liệu, thể loại.
2. Museum Info & Maps: nhập tên/địa chỉ/tọa độ/nguồn, mở kiểm tra ghim, tích đã xác minh rồi công khai.
3. Artworks: thêm hoặc sửa hiện vật ngay trong một form. Phần **Nội dung tiếng Việt** có tên, mô tả đầy đủ và mô tả ngắn; nội dung tiếng Việt đã có trong DB được điền sẵn, kể cả dữ liệu cũ chỉ có mô tả ngắn. Điền ảnh, tác giả/chất liệu/thể loại và metadata. Mỗi bản sao là một bản ghi riêng.
4. Bấm **Lưu nháp** để hoàn thiện sau hoặc **Lưu và công bố** để lưu cả hiện vật và nội dung tiếng Việt trong cùng giao dịch. Không cần chuyển sang Languages & Audio trước. Tác phẩm đang công bố có nút **Lưu thay đổi** và **Chuyển về nháp**.
5. Languages & Audio dùng quản lý các bản dịch/nghe thử theo từng ngôn ngữ. Backend vẫn cần ảnh và mô tả tiếng Việt khi công bố; nguồn thông tin/bản dịch/quyền ảnh không bắt buộc. Nếu lưu bất kỳ phần nào lỗi thì rollback, form giữ dữ liệu để sửa và thử lại; các bản dịch khác và audio/nguồn tiếng Việt sẵn có không bị ghi đè bởi form Artworks.
6. Exhibitions & Events: tạo lịch, nguồn, ngày kiểm chứng; chọn Confirmed. Khoảng ngày `[startDate,endDate)` theo Việt Nam; bỏ endDate nghĩa là vô hạn. Hệ thống từ chối lịch chồng nhau và không cho ẩn bảo tàng còn lịch hiện tại/tương lai đã xác nhận.
7. Khách → Explore/Collection: tìm tên không phân biệt hoa thường, lọc đồng thời tác giả/chất liệu/bảo tàng hiện tại, chuyển trang; chọn hiện vật và đổi ngôn ngữ. Chỉ nội dung đã công bố được trả từ API. Thiếu bản dịch thì thông báo tiếng Việt và TTS đọc tiếng Việt, không đọc văn bản Việt bằng giọng khác.
8. Chi tiết hiển thị đúng bảo tàng hiện tại, địa chỉ, nguồn và ngày kiểm chứng. Không có lịch hợp lệ thì báo chưa có; không suy diễn từ bảo tàng sở hữu/lịch cũ. Bản đồ dùng tọa độ lưu sẵn; mở chỉ đường tới đúng tọa độ. Khách không cần cho phép GPS để xem ghim.
9. `/museums`: tìm tên; nút tìm gần tôi mới xin GPS. Vị trí chỉ ở RAM trình duyệt để tính khoảng cách, không gửi API hoặc lưu trong DB/localStorage. Có thể từ chối và tiếp tục tra cứu theo tên. Lộ trình trong một bảo tàng là thứ tự gợi ý từ danh sách hiện vật hiện tại, không phải định tuyến trong nhà/GPS.
10. Visitors/Reports/QR Check-in: thống kê thiết bị, phiên, tài khoản tùy chọn và điểm đọc; không khẳng định số người có mặt vật lý. Chọn ngày và xuất báo cáo. Khách không cần đăng nhập để tra cứu/nghe/QR.

## Backup và phục hồi thử

`VERIFYONLY` không thay thế việc phục hồi thực tế. Chạy trên SQL Server có đủ dung lượng:

```sh
npm --prefix muses-backend run db:restore-check
```

Nhập tài khoản SQL quản trị và đường dẫn backup trong SQL Server. Script RESTORE vào tên ngẫu nhiên `MusesRestoreCheck_*`, chạy CHECKDB, đếm tác phẩm rồi dọn đúng DB thử vừa tạo. Không ghi đè DB gốc. Script dành cho SQL Server Linux/Docker với thư mục `/var/opt/mssql/data` và backup data/log thông thường. Nhóm lưu biên bản thành công trước nghiệm thu; chưa có kết quả SQL thật trong môi trường Codex.

Phục hồi DB thật sau sự cố là thao tác DBA riêng: giữ backup ngoài container, ngừng ứng dụng, xác minh đúng tên DB/đích file và backup cần dùng trước khi RESTORE. Không chạy `WITH REPLACE` trên DB thật chỉ để kiểm thử.

## Kiểm thử

```sh
npm --prefix muses-backend test
npm --prefix muses-react test
npm --prefix muses-react run build
npm --prefix muses-admin run build
```

API tests thường dùng adapter SQL có kiểm soát, không chứng minh cú pháp/giao dịch thật. Bài test SQL riêng cần tài khoản quản trị **cho môi trường kiểm thử**, đặt trong `muses-backend/.env.test.local` (đã được gitignore): TEST_SQL_SERVER, TEST_SQL_PORT, TEST_SQL_USER, TEST_SQL_PASSWORD, TEST_SQL_TRUST_CERTIFICATE=true cho local. Không dùng biến VITE hoặc đưa file vào Git.

```sh
npm --prefix muses-backend run test:sql
```

Test tạo database riêng `MusesPrdTest_*`, chạy migration hai lần, đăng nhập thật, kiểm tra publication/bản dịch/lịch/race condition/đăng xuất rồi xóa đúng DB thử. Không có cấu hình sẽ SKIP và không được coi là đã nghiệm thu SQL.

NFR01: trên DB kiểm thử riêng có ≥1000 tác phẩm đã công bố, chạy `TEST_API_ORIGIN=http://localhost:3001 npm --prefix muses-backend run test:load`. Script chạy 20 worker ×10 yêu cầu và báo lỗi nếu dữ liệu chưa đủ hoặc p95>2000ms. Chưa đo với SQL thật ở môi trường này.

Browser fixture: chạy web ở 5186, Admin 5187 và Chromium với CDP 9222, rồi `node muses-react/tests/browser/prd.mjs`. Kiểm tra giao diện thật với phản hồi API giả lập có kiểm soát. Không thay thế bài test SQL/Safari trên thiết bị nhóm. Xem [biên bản và checklist](ACCEPTANCE.md).
