# Ảnh tác phẩm từ database vào website

Luồng: `Artworks.ArtworkID` → `ArtworkImages.ArtworkID` → API `imageUrl` → thẻ/chi tiết đúng tác phẩm. Không lấy ảnh theo thứ tự hàng hoặc chỉ số mảng. API chọn ảnh theo `IsPrimary DESC, DisplayOrder ASC, ImageID ASC`.

## Cập nhật database Docker đang có

1. Pull nhánh `develop`, giữ nguyên `.env` và database hiện tại.
2. Mở SQL client đang kết nối SQL Server Docker, chạy **chỉ** `muses-backend/MusesDB/ArtworkImages.sql`. Script xác nhận tên khớp duy nhất trước khi ghi, sửa các URL seed cũ đã biết và thêm ảnh còn thiếu trong transaction. Không xóa database, không thay lựa chọn ảnh chính tùy chỉnh. Có thể chạy lại; cần tài khoản có quyền INSERT/UPDATE (tài khoản ứng dụng chỉ đọc không đủ).
3. **Không chạy lại `MusesMuseumDB.sql`** trên dữ liệu cần giữ: script đó xóa và tạo lại database.
4. Chạy backend, rồi trong terminal khác:

```bash
cd muses-backend
npm run images:check
```

Lệnh kiểm tra gọi API đang chạy, đối chiếu từng tác phẩm và HEAD ảnh, báo ảnh thiếu/404/sai content type. Không sửa DB. Backend dùng cổng khác: `npm run images:check -- http://localhost:3002`.

5. Mở `/explore/collection`, bấm từng tác phẩm để kiểm tra ảnh chi tiết. Trang chủ phần bộ sưu tập dùng cùng `imageUrl`. Nếu vẫn hiện ảnh khác, kiểm tra `IsPrimary` của tác phẩm: script giữ nguyên ảnh chính tùy chỉnh đang có.

DB lưu đường dẫn `/images/tranh/...`, không lưu đường dẫn ổ đĩa `/Users/...` hoặc cổng Vite. Vite proxy `/images` đến backend; production backend phục vụ ảnh cùng website. Ảnh trang chủ Hero, Highlight, News, Welcome, Prepare dùng bảng `SiteImages` như bên dưới. Ảnh trang triển lãm và bản đồ vẫn có cấu hình riêng.

## Ánh xạ đã kiểm tra theo file trong repository

| Tác phẩm trong DB | ImageURL |
|---|---|
| Em Thúy | `/images/tranh/EMTHUY.jpeg` |
| Giao Mùa | `/images/tranh/tranhsonmai/GIAOMUA.jpg` |
| Mùa hè | `/images/tranh/tranhsonmai/MUAHE.jpg` |
| Thiếu nữ bên ao sen | `/images/tranh/tranhsonmai/THIEUNUBENAOSEN.jpg` |
| Công chúa Mai An Tiêm | `/images/tranh/tranhsonmai/CONGCHUAMAIATIEM.jpg` |
| Những đứa trẻ trâu | `/images/tranh/tranhsonmai/NHUNGDUATRETRAU.jpg` |
| Múa Vui | `/images/tranh/tranhsonmai/MUAVUI.jpg` |
| Vinh Quy Bái Tổ | `/images/tranh/tranhsonmai/VINHQUYBAITO.jpg` |
| Vườn Xuân Trung Nam Bắc | `/images/tranh/tranhsonmai/VUONXUANTRUNGNAMBAC.png` |
| Thiếu nữ bên hoa phù dung | `/images/tranh/tranhsonmai/THIEUNUBENHOAPHUDUNG.jpg` |
| Kết nạp đảng ở Điện Biên Phủ | `/images/tranh/tranhsonmai/KETNAPDANGODIENBIENPHU.jpeg` |
| Xuân Hồ Gươm | `/images/tranh/tranhsonmai/XUANHOGUOM.jpeg` |
| Điệu múa cổ | `/images/tranh/tranhsonmai/DIEUMUACO.jpg` |
| Thiếu nữ bên hoa huệ | `/images/tranh/THIEUNUBENHOAHUE.jpg` |
| Hai thiếu nữ và em bé | `/images/tranh/HAITHIEUNUVAEMBE.jpeg` |
| Thiếu nữ bên hoa sen | `/images/tranh/THIEUNUBENHOASEN.jpg` |
| Hòa nhạc trong gia đình ở Huế | `/images/tranh/HOANHACTRONGGIADINHOHUE.jpg` |
| Hà Nội vào thu | `/images/tranh/HANOIVAOTHU.jpg` |
| Xuân về hội tụ | `/images/tranh/XUANVEHOITU.jpg` |
| Thiếu nữ bên đầm sen | `/images/tranh/tranhsonmai/THIEUNUBENDAMSEN.jpg` |
| Thành đồng tổ quốc | `/images/tranh/tranhsonmai/THANHDONGTOQUOC.png` |
| Trường Ca Phố | `/images/tranh/tranhsonmai/TRUONGCAPHO.jpg` |
| Văn Xương Đạo Lộ | `/images/tranh/tranhsonmai/VANXUONGDAOLO.jpg` |
| Trên cánh đồng | `/images/tranh/TRENCANHDONG.jpg` |
| Phong cảnh mùa đông | `/images/tranh/PHONGCANHMUADONG.jpg` |
| Cánh cửa chạm rồng | `/images/tranh/Dieukhac/CANHCUACHAMRONG.png` |
| Đợi anh về | `/images/tranh/Dieukhac/DOIANHVE.png` |
| Cuộc sống và tình yêu | `/images/tranh/Dieukhac/CUOCSONGVATINHYEU.png` |
| Không gian số 4 | `/images/tranh/Dieukhac/KHONGGIANSO4.png` |
| Hưng Đạo Vương khán bình thư | `/images/tranh/Dieukhac/HUNGDAO.png` |
| Tiên tắm đầm sen | `/images/tranh/Dieukhac/TIENTAMDAMSEN.png` |
| Tượng Quan Âm nghìn mắt nghìn tay | `/images/tranh/Dieukhac/TUONGQUANAMNGHINMATNGHINTAY.jpg` |

Các đường dẫn có phân biệt chữ hoa/thường trên Linux. Kiểm tra 32 file bằng `npm test` trong `muses-backend`. Database trên máy người dùng cần tự chạy script; chưa được thay đổi từ cloud.

## Giữ đúng 13 vị trí ảnh trang chủ

Sau `ArtworkImages.sql`, chạy thêm `HomeImages.sql` trong SQL client. Script tạo bảng `SiteImages` nếu chưa có và chỉ thêm slot còn thiếu, không ghi đè lựa chọn ảnh đã sửa. Không chạy lại script tạo database.

`GET /api/site-images` trả các khóa ổn định; web gắn ảnh theo khóa, không theo thứ tự kết quả:

- `home.hero`: banner đầu trang.
- `home.highlight.h1` đến `h4`: đúng 4 ô Highlight cũ.
- `home.news`: ảnh News.
- `home.welcome.g1` đến `g6`: đúng 6 ô Welcome cũ.
- `home.prepare`: nền Prepare.

`ImageURL` của slot là ảnh website sử dụng; `ArtworkID` là liên kết tham khảo (có thể NULL với poster chưa có tác phẩm tương ứng). Đổi ảnh của một tác phẩm trong `ArtworkImages` chỉ đổi ảnh bộ sưu tập/chi tiết; muốn đổi ảnh ở trang chủ, đổi rõ `SiteImages.ImageURL` của slot đó. Không tự đồng bộ primary image vì ảnh cắt cho banner có thể khác ảnh tác phẩm.

Ví dụ đổi **chỉ** ô thứ 4 của Highlight:

```sql
UPDATE dbo.SiteImages
SET ImageURL = N'/images/tranh/tranhsonmai/GIAOMUA.jpg'
WHERE SlotKey = 'home.highlight.h4';
```

Refresh trang chủ sau khi đổi DB. Web kiểm tra ảnh tải được trước khi thay vào vị trí; DB/API lỗi, thiếu slot hoặc ảnh 404 thì giữ ảnh gốc để bố cục không hỏng. Chạy `npm run images:check` để phát hiện lỗi dù web đã dùng ảnh dự phòng. Ba poster Highlight đầu chưa có tác phẩm tương ứng trong seed nên giữ `ArtworkID=NULL`, vẫn lấy đúng URL ảnh từ DB, không tạo tác phẩm giả.
