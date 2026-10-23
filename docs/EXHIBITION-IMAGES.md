# Ảnh trang Exhibition

Trang có 9 vị trí: banner, upcoming, 3 spotlight, 2 sự kiện, 2 tour.
Ảnh mặc định lấy từ `muses-react/background` và `muses-react/tranh`, hiển thị ngay cả khi chưa cấu hình DB. Ảnh phủ đầy khung theo `object-fit: cover`.

Để quản lý ảnh qua DB, mở kết nối SQL Server hiện có trong công cụ SQL đang dùng và chạy nội dung file `muses-backend/MusesDB/ExhibitionImages.sql` trên database `MusesMuseumDB`. Script chỉ thêm vị trí còn thiếu, không xóa dữ liệu hay thay lựa chọn ảnh đã có. Không chạy lại script tạo/reset toàn bộ database.

Khởi động lại backend sau khi pull code để có API ảnh mới. `GET /api/site-images` trả cả các vị trí `home.*` và `exhibition.*`.

Ví dụ đổi banner bằng SQL:

```sql
UPDATE dbo.SiteImages
SET ImageURL = '/images/background/muses1.jpg'
WHERE SlotKey = 'exhibition.hero';
```

Các đường dẫn `/images/tranh/...` và `/images/background/...` được backend phục vụ từ hai thư mục ảnh tương ứng. Tải lại trang sau khi đổi. Nếu ảnh cấu hình không tải được, web dùng ảnh mặc định.
