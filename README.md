# MUSES · CNPM_GROUP6

Nhánh `develop` gộp các nhánh `muses/home`, `muses/admin`, `muses/backend` và `muses/mobile` để kiểm thử chung. Website và Admin chạy riêng, cùng dùng backend SQL Server; mobile giữ nguyên.

**Bản theo PRD:** xem [hướng dẫn chạy/cập nhật DB](docs/prd/RUN.md), [đối chiếu và checklist nghiệm thu](docs/prd/ACCEPTANCE.md). Cần chạy `db:catalog` trước khi dùng API mới.

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

Các trang: `/`, `/visit`, `/exhibition`, `/explore`, `/explore/collection`, `/museums`, `/museums/:id`. Build: `npm run build`.

## Admin — terminal 2

```bash
cd muses-admin
npm ci
npm run dev -- --port 5174
```

Build: `npm run build`. Overview, Visitors, Reports và QR Check-in dùng API thống kê SQL Server; xem `docs/ADMIN-ANALYTICS.md` để cập nhật DB và tạo tài khoản Admin. Các workspace nội dung chính đã nối API: tác phẩm, tác giả/chất liệu, bản dịch, bảo tàng và lịch trưng bày. Xem thêm `muses-admin/README.md`.

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

Mở `http://localhost:3001/api/health` để xác nhận database. Vite cổng 5173 chuyển tiếp `/api` và `/images` đến backend cổng 3001. Web hiển thị tác phẩm API trên trang chủ và `/explore/collection`; bấm thẻ mở `/explore/artworks/:id`. Tìm kiếm/lọc theo dữ liệu API; mô tả và audio xuất hiện khi database cung cấp. API hỗ trợ `vi`/`en`/`zh`/`ja`/`ko`; chỉ dùng bản dịch Published, thiếu thì trả tiếng Việt và metadata fallback. Không gọi dịch tự động trong MVP.

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

Test API sử dụng database adapter giả để kiểm tra contract, validation, lỗi DB, CORS và phục vụ ảnh; không thay thế kiểm thử SQL Server thật. Build web/admin: `npm run build` trong folder tương ứng. Mobile bundle Android đã export được trên bản gộp; chưa kiểm thử thiết bị. Admin đã nối API đăng nhập và thống kê ở Overview, Visitors, Reports, QR Check-in; các workspace nội dung khác vẫn dùng dữ liệu cục bộ.

## Đối chiếu ảnh database

Xem [hướng dẫn và bảng ánh xạ 32 ảnh](muses-backend/MusesDB/README.md). Với database hiện có, chạy lần lượt `ArtworkImages.sql` và `HomeImages.sql`, không chạy lại script tạo/xóa database. Sau khi backend chạy, dùng `npm run images:check` trong `muses-backend` để kiểm tra từng ảnh trả về từ API.

## Trang chi tiết tác phẩm

Từ `/explore/collection`, bấm một tác phẩm để mở `/explore/artworks/:id`. Trang chi tiết dùng ảnh, tiêu đề, mô tả ngắn/đầy đủ, chất liệu, năm, kích thước và audio từ API; tác phẩm cùng nghệ sĩ được đối chiếu bằng `artistId` (fallback tên với API cũ), không bao gồm tác phẩm đang xem. Nút bản đồ dẫn tới `/visit#directions`. DB hiện chưa có trường lịch sử riêng, phần Lịch sử hiển thị trạng thái đang cập nhật thay vì suy diễn nội dung. Không cần chạy migration cho thay đổi giao diện này.

## Highlight trên Home

Dải 5 ảnh cuộn ngang; ảnh gần tâm khung nhất được nâng lên, ảnh rời tâm trở về vị trí cũ. Dùng mũi tên, bấm ảnh, phím trái/phải/Home/End hoặc vuốt trên điện thoại. Hiệu ứng tôn trọng thiết lập giảm chuyển động. Chạy lại `HomeImages.sql` để bổ sung slot DB `home.highlight.h5`, không cần tạo lại database.

## Quy tắc hiển thị ảnh và icon

Ảnh trong Highlight, Welcome, Explore, bộ sưu tập, chi tiết và banner dùng cover: phủ kín khung, giữ tỉ lệ và cắt phần dư ở giữa ảnh. Icon dùng contain để không bị cắt. Component `Icons.jsx` dùng file trong `muses-react/icon` cho các biểu tượng tương ứng (vé, tìm kiếm, lịch, tiện ích, mạng xã hội, breadcrumb, dropdown). Mũi tên điều hướng giữ vector vì thư mục icon không có asset mũi tên tương ứng. Icon có kích thước cố định và object-fit contain. Không đổi dữ liệu hay đường dẫn ảnh trong DB.

## Đọc văn bản và chạy chữ theo giọng đọc

Trên trang chi tiết tác phẩm, mục Mô tả có nút **Đọc văn bản**, **Tạm dừng / Tiếp tục**, **Dừng**, chọn giọng và tốc độ. Văn bản đang đọc được tô sáng và tự cuộn trong khung; có thể tắt tự cuộn. Ngôn ngữ giọng đọc dựa trên ngôn ngữ mô tả thực tế (`descriptionLanguage`), kể cả khi API fallback tiếng Việt.

Tính năng dùng Web Speech API của trình duyệt, không cần API key, migration hoặc dịch vụ TTS backend. Giọng Việt/Anh phụ thuộc trình duyệt và giọng đã cài trên thiết bị. Trình duyệt không hỗ trợ hoặc phát thất bại sẽ hiện thông báo, vẫn giữ văn bản để đọc. Theo câu/đoạn dựa trên sự kiện bắt đầu và kết thúc giọng đọc; theo từ dựa trên `boundary` khi giọng có hỗ trợ, không dùng bộ đếm thời gian ước lượng.

Điều hướng sang tác phẩm khác hoặc đóng cửa sổ nghe thử sẽ dừng giọng đọc. Phát audio có sẵn sẽ dừng TTS để tránh chồng tiếng. Audio thu sẵn chưa có timestamp/transcript alignment, nên tính năng tô sáng chỉ áp dụng cho giọng TTS từ văn bản. Không tạo hay lưu file MP3.

Trong admin **Languages & Audio**, lưu mô tả rồi bấm **Read aloud** ở cột Translation để nghe thử cùng kiểu chạy chữ. Bản dịch admin hiện vẫn chỉ lưu localStorage, chưa cập nhật database.

Kiểm tra thuật toán tách câu và vị trí từ: `npm --prefix muses-react test`. Cloud đã kiểm tra sự kiện điều khiển và highlight bằng speech engine mô phỏng; cloud không có giọng cài sẵn nên chưa xác nhận âm thanh phát qua loa trên thiết bị thật.

## Ticket

Trang `/tickets` là chức năng tra cứu giá vé theo bảo tàng, tìm theo tên/địa chỉ và so sánh giá theo đối tượng. Mục Giá vé trong Admin đã được bỏ theo yêu cầu; web tiếp tục tra cứu dữ liệu giá đã lưu. Không có luồng đặt vé/thanh toán trên trang này; giá thiếu được ghi rõ chưa cập nhật. Xem [hướng dẫn Ticket](docs/TICKETS.md).

Bản đồ tương tác TP.HCM, định vị khách và vị trí trưng bày tác phẩm: [hướng dẫn Maps](docs/MAPS.md).

Scan QR hiển thị danh sách tác phẩm; chọn tác phẩm để hiện popup QR, quét mở trang chi tiết: [hướng dẫn QR tác phẩm và thử trên điện thoại](docs/ARTWORK-QR.md).

Trang Visit hoàn thiện và luồng chọn điểm đến/ngày sang Ticket: [hướng dẫn Visit](docs/VISIT.md).

Overview đã gộp danh sách khách truy cập. Admin → Quản lý QR quản lý mã QR tác phẩm trên web: [cập nhật DB và sử dụng](docs/QR-MANAGEMENT.md).
