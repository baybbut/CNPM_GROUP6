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

Backend hiện dùng SQL Server, `msnodesqlv8`, ODBC Driver 18 và integrated/trusted authentication. Cần cấu hình SQL Server và quyền truy cập của tài khoản chạy ứng dụng; đây không phải backend chạy độc lập chỉ bằng npm.

```bash
cd muses-backend
npm ci
```

Tạo `.env` từ `.env.example`, điền `DB_SERVER` và `DB_NAME` phù hợp máy bạn, rồi chạy:

```bash
node server.cjs
```

API: `http://localhost:3001/api/health`, `/api/artworks?lang=vi`, `/api/artworks?lang=en`, `/api/artworks/1?lang=vi`.

SQL nằm trong `muses-backend/MusesDB/`. **`MusesMuseumDB.sql` xóa database `MusesMuseumDB` đang tồn tại trước khi tạo lại.** Chỉ dùng với database kiểm thử có thể xóa, đã sao lưu dữ liệu cần giữ; sau đó chạy `ArtworkImages.sql` nếu cần dữ liệu ảnh. Không chạy script khởi tạo trên database thật.

## Mobile — terminal riêng

```bash
cd muses-mobile/muses-app
npm ci
npx expo start
```

App dùng Expo SDK 51: cần Expo Go tương thích SDK này hoặc development build/emulator tương thích. Ảnh hiện trong `src/assets/` là placeholder 8×8, cần thay bằng ảnh thiết kế khi hoàn thiện UI. Không tự nâng SDK hoặc chạy `expo install --fix` chỉ để merge.

## Đã kiểm tra trên bản gộp

- Cài dependency từ lockfile cho cả 4 ứng dụng.
- Build production web và admin thành công.
- 5 route web render không có lỗi JavaScript runtime hoặc ảnh `<img>` hỏng trong smoke test.
- Export JavaScript/Hermes bundle Android của mobile thành công (`npx expo export --platform android`); chưa kiểm thử trên thiết bị/emulator.
- Backend qua kiểm tra cú pháp và cài dependency, nhưng chưa kiểm thử API/DB: cloud thiếu ODBC Driver 18, `DB_SERVER` và `DB_NAME`.
- Đã sửa đường dẫn ticket, ảnh nền Prepare và bản đồ admin sau khi các nhánh đổi tên/di chuyển asset. Icon lịch của home được giữ ở `date-calendar.png`; phiên bản từ mobile được giữ ở `date-calendar-mobile.png`.
