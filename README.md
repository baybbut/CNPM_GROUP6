# MUSES · CNPM_GROUP6

Nhánh `develop` gộp các nhánh `muses/home`, `muses/admin`, `muses/backend` và `muses/mobile` để kiểm thử chung. Các ứng dụng vẫn chạy riêng; việc merge chưa kết nối dashboard admin/mobile với API.

## Lấy bản gộp

Commit hoặc stash thay đổi cá nhân trước khi chuyển nhánh:

```bash
git fetch origin
git switch develop
git pull --ff-only origin develop
```

## Web — terminal 1

```bash
cd muses-react
npm ci
npm run dev -- --port 5173
```

Các trang: `/`, `/visit`, `/exhibition`, `/explore`, `/explore/collection`. Build: `npm run build`.

## Admin — terminal 2

```bash
cd muses-admin
npm ci
npm run dev -- --port 5174
```

Build: `npm run build`. Dashboard dùng dữ liệu demo trong phiên, chưa lưu backend. Xem thêm `muses-admin/README.md`.

## Backend — terminal 3

Backend dùng SQL authentication qua driver JavaScript mặc định của `mssql`, không cần ODBC/msnodesqlv8 trên Mac. SQL Server Docker phải đang chạy và publish cổng 1433.

```bash
cd muses-backend
npm ci
```

Tạo `.env` theo `.env.example` nếu chưa có (không ghi đè file đang dùng). Điền `DB_SERVER`, `DB_PORT`, `DB_NAME`, `DB_USER`, `DB_PASSWORD` bằng cấu hình SQL Server của bạn. `DB_USER` là SQL login, không phải tài khoản máy Mac. Không commit hoặc gửi mật khẩu lên chat. Với Docker local dùng certificate tự ký, đặt `DB_TRUST_SERVER_CERTIFICATE=true`; production dùng certificate hợp lệ và đặt `false`.

```bash
npm start
```

Mở `http://localhost:3001/api/health` để xác nhận database. Vite cổng 5173 chuyển tiếp `/api` và `/images` đến backend cổng 3001. Web hiển thị tác phẩm API trên trang chủ và `/explore/collection`; bấm thẻ mở `/explore/artworks/:id`. Tìm kiếm/lọc theo dữ liệu API; mô tả và audio xuất hiện khi database cung cấp. API hỗ trợ `vi`/`en`; các ngôn ngữ khác dùng nội dung tác phẩm tiếng Anh (mô tả thiếu bản dịch có thể fallback tiếng Việt).

API: `/api/artworks?lang=vi`, `/api/artworks?lang=en`, `/api/artworks/1?lang=vi`. Đảm bảo đã có dữ liệu `ArtworkImages` cho ảnh; đường dẫn tương đối `/images/tranh/...` được backend phục vụ từ `muses-react/tranh`. Không cần sửa database chỉ để đổi địa chỉ host.

SQL nằm trong `muses-backend/MusesDB/`. **`MusesMuseumDB.sql` xóa database `MusesMuseumDB` đang tồn tại trước khi tạo lại.** Chỉ dùng với database kiểm thử có thể xóa, đã sao lưu dữ liệu cần giữ; sau đó chạy `ArtworkImages.sql` nếu cần dữ liệu ảnh. Không chạy script khởi tạo trên database thật.

## Mobile — terminal riêng

```bash
cd muses-mobile/muses-app
npm ci
npx expo start
```

App dùng Expo SDK 51: cần Expo Go tương thích SDK này hoặc development build/emulator tương thích. Ảnh hiện trong `src/assets/` là placeholder 8×8, cần thay bằng ảnh thiết kế khi hoàn thiện UI. Không tự nâng SDK hoặc chạy `expo install --fix` chỉ để merge.

## Chạy bản production và đưa lên website

Sau khi cài dependencies cho cả web và backend:

```bash
cd muses-react
npm run build
cd ../muses-backend
npm start
```

Mở `http://localhost:3001`: backend phục vụ cả build website, API và ảnh. Refresh trực tiếp trang chi tiết cũng hoạt động. Không dùng `npm run preview` thay cho backend khi kiểm thử full stack.

Để public website, deploy `muses-backend` và `muses-react/dist` cùng cấu trúc thư mục, cấu hình biến môi trường DB trên server, cho backend truy cập SQL Server, rồi đặt reverse proxy/domain HTTPS tới cổng `PORT` của backend. `localhost` trên hosting là máy hosting, không phải Docker trên Mac của bạn. SQL Server local không tự truy cập được từ Internet; cần database mà server truy cập được. Không public cổng SQL Server của máy bạn chỉ để thử website.

Nếu tách frontend/backend sang hai host: đặt `VITE_API_BASE_URL=https://api.example.com` trong môi trường build frontend, build lại, và đặt `CORS_ORIGINS=https://www.example.com` ở backend. Giá trị Vite là public; tuyệt đối không đặt DB password vào biến `VITE_*`. Static host cần rewrite route SPA về `index.html`. Không thể xác nhận deployment công khai khi chưa có hosting/domain và kết nối DB trên server.

## Kiểm thử

```bash
cd muses-backend
npm test
```

Test API sử dụng database adapter giả để kiểm tra contract, validation, lỗi DB, CORS và phục vụ ảnh; không thay thế kiểm thử SQL Server thật. Build web/admin: `npm run build` trong folder tương ứng. Mobile bundle Android đã export được trên bản gộp; chưa kiểm thử thiết bị. Admin vẫn dùng dữ liệu demo và chưa nối API quản trị.
