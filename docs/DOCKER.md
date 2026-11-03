# Chạy Muses bằng Docker — Windows, macOS, Linux

Compose chạy website, Admin và backend; SQL Server dùng DB hiện có hoặc DB chung của nhóm. Đây là môi trường phát triển/demo dùng Vite, chưa phải cấu hình triển khai Internet. Máy chạy ứng dụng chỉ cần Docker, không bắt buộc cài Node/npm.

Docker vẫn dùng `.env`. Cấu hình này không tự tạo DB, chạy migration, chuyển dữ liệu sang máy khác hay xóa DB.

## 1. Chuẩn bị

- Windows: cài Docker Desktop, bật WSL 2, dùng Linux containers.
- macOS: cài Docker Desktop đúng bản Intel hoặc Apple silicon.
- Linux: cài Docker Engine và plugin Docker Compose.

Mở Docker Desktop/khởi động Engine, kiểm tra:

```sh
docker --version
docker compose version
docker info
```

Máy mới lấy code:

```sh
git clone https://github.com/baybbut/CNPM_GROUP6.git
cd CNPM_GROUP6
git switch develop
git pull origin develop
```

Nếu đã có repo, mở terminal tại thư mục `Muses`/`CNPM_GROUP6`, không clone lần nữa. Lưu/commit các thay đổi đang làm trước khi pull.

## 2. Chuẩn bị SQL Server

**SQL Docker trên cùng máy:** chạy container SQL đang chứa `MusesMuseumDB`. Kiểm tra port mapping, ví dụ `1433:1433`. Đặt `DB_SERVER=host.docker.internal` để backend container đi tới cổng SQL trên máy. `localhost` trong container chỉ vào chính container đó.

Compose có ánh xạ `host-gateway` cho Linux; cổng SQL phải được publish trên địa chỉ mà container truy cập được, không chỉ một loopback không đi tới được từ bridge.

**SQL dùng chung:** một máy chủ có DB và migration đầy đủ. Mỗi thành viên đặt `DB_SERVER` bằng IP/hostname thật của máy chủ, đúng cổng, SQL login và mật khẩu. Các máy phải kết nối được qua LAN/VPN/hạ tầng đã cấu hình; máy SQL bật TCP/IP và firewall cho phép máy khách kết nối. Dùng SQL user ứng dụng, không dùng `sa` cho backend thường xuyên. Thay đổi trên DB chung ảnh hưởng cả nhóm.

SQL Server container chính thức yêu cầu x86-64. Trên Mac Apple silicon, chạy giả lập không được bảo đảm; dùng SQL Server trên máy chủ khác nếu gặp lỗi kiến trúc. Ba image Node của ứng dụng hỗ trợ AMD64/ARM64.

Nếu máy SQL mới chưa có DB, khôi phục backup rồi áp dụng migration theo [README](../README.md) và [hướng dẫn setup/backup](prd/RUN.md). Không chạy lại `MusesMuseumDB.sql` lên dữ liệu cần giữ vì script nền có `DROP DATABASE`.

## 3. Điền .env trên mỗi máy

Nếu đã có `muses-backend/.env`, giữ file đó và chỉnh thông tin cần thiết. Nếu chưa có, sao chép `.env.example` thành `.env`:

macOS/Linux:

```sh
cp muses-backend/.env.example muses-backend/.env
```

Windows PowerShell:

```powershell
Copy-Item muses-backend/.env.example muses-backend/.env
```

Mở file và điền thông tin thật. Ví dụ SQL Docker cùng máy:

```dotenv
DB_SERVER=host.docker.internal
DB_PORT=1433
DB_NAME=MusesMuseumDB
DB_USER=muses_app
DB_PASSWORD=DIEN_MAT_KHAU_SQL_CUA_BAN
DB_ENCRYPT=true
DB_TRUST_SERVER_CERTIFICATE=true
PORT=3001
CORS_ORIGINS=http://localhost:5173,http://localhost:5174
TICKET_PAYMENT_MODE=demo
```

Thay mật khẩu mẫu bằng mật khẩu SQL thực tế, không phải mật khẩu đăng nhập web. Với DB chung, thay `DB_SERVER` bằng địa chỉ máy SQL. Nếu mật khẩu có `$` hoặc `#`, đặt giá trị trong dấu nháy đơn trong file dotenv.

`DB_TRUST_SERVER_CERTIFICATE=true` phù hợp DB local dùng certificate tự ký; dùng `false` với DB có certificate hợp lệ. `.gitignore` bỏ qua `.env`, `.dockerignore` ngăn chép vào image; Compose truyền cấu hình lúc chạy. Người quản lý Docker trên máy vẫn có thể xem môi trường container.

Nếu chuyển lại chạy backend bằng npm trực tiếp trên máy, đổi `DB_SERVER` về `localhost` khi SQL ở cùng máy.

## 4. Chạy ứng dụng

Dừng npm cũ chiếm cổng 3001/5173/5174 bằng Ctrl+C; giữ SQL Server chạy. Tại thư mục gốc repo:

```sh
docker compose --env-file muses-backend/.env up -d --build
```

Lần đầu cần Internet để tải Node image và dependencies. Compose đợi backend kết nối SQL và `/api/health` thành công trước khi chạy website/Admin.

Kiểm tra:

```sh
docker compose --env-file muses-backend/.env ps
docker compose --env-file muses-backend/.env logs --tail=100 backend
```

| Trang | Địa chỉ trên máy tính |
| --- | --- |
| Website | http://localhost:5173 |
| Admin | http://localhost:5174 |
| API qua website | http://localhost:5173/api/health |

Backend kết nối DB thành công chưa khẳng định đủ bảng/quyền cho mọi chức năng. Nếu báo thiếu bảng hoặc permission denied, hoàn tất migration/cấp quyền theo hướng dẫn setup.

## 5. Tài khoản Admin

Dùng Admin đã có trong DB. Nếu cần tạo mới:

```sh
docker compose --env-file muses-backend/.env exec backend npm run admin:create
```

Nhập tên, email và mật khẩu web theo câu hỏi. SQL user phải có quyền mà script yêu cầu. Mật khẩu Admin web khác mật khẩu SQL.

## 6. Điện thoại và QR

Điện thoại và máy tính cần cùng mạng có thể kết nối nhau; cho phép firewall nhận cổng 5173. Tìm IP LAN của máy bằng `ipconfig` trên Windows hoặc macOS Wi-Fi → Details → TCP/IP.

Mở `http://IP_MAY_TINH:5173/scan` trên máy tính rồi tạo QR. Ví dụ nếu IP thật là `192.168.1.27`, dùng `http://192.168.1.27:5173/scan`. Không tạo QR từ localhost cho điện thoại. Khi IP đổi, tạo lại QR.

Website proxy API tới `backend:3001`; điện thoại không cần mở trực tiếp cổng backend. Cổng Admin/backend chỉ bind vào 127.0.0.1 của máy chủ. Docker không tự làm IP LAN truy cập được từ mạng khác.

Định vị/camera trong website qua IP HTTP vẫn có thể bị trình duyệt chặn vì cần HTTPS. Quét QR bằng camera điện thoại để mở URL là thao tác khác với camera trong website. Dùng qua Internet/HTTPS cần triển khai riêng.

## 7. Cập nhật và dừng

Sau khi pull code hoặc sửa `.env`, chạy lại lệnh `up -d --build` ở bước 4. Code được chép lúc build; sửa file trên máy không tự đồng bộ vào container.

Xem log trực tiếp (Ctrl+C chỉ thoát xem log):

```sh
docker compose --env-file muses-backend/.env logs -f backend website admin
```

Dừng ba ứng dụng:

```sh
docker compose --env-file muses-backend/.env down
```

Lệnh này không xóa DB SQL bên ngoài Compose. Không cần xóa volume SQL để sửa lỗi ứng dụng.

| Lỗi | Cách kiểm tra |
| --- | --- |
| Cannot connect to Docker daemon | Mở Docker Desktop/Engine |
| Port is already allocated | Dừng npm/container cũ đang chiếm cổng |
| Backend unhealthy, website chưa chạy | Xem log backend; kiểm tra SQL chạy và địa chỉ/cổng DB |
| Login failed for user | Kiểm tra SQL login/mật khẩu, không dùng tài khoản web |
| ECONNREFUSED localhost SQL | Dùng host.docker.internal hoặc IP máy SQL từ container |
| DB không tồn tại/thiếu bảng | Khôi phục DB, áp dụng migration trên đúng máy SQL |
| INSERT/SELECT permission denied | Cấp quyền SQL user ứng dụng theo script setup |
| SELF_SIGNED_CERT_IN_CHAIN khi tải npm | Mạng/proxy dùng CA riêng; cấu hình CA tin cậy cho bước build, không tắt kiểm tra SSL |
| Máy tính mở được, điện thoại không mở được | IP, cùng mạng, firewall, cổng 5173; thử /api/health trên điện thoại |

## Kiểm chứng

`docker compose config --quiet` chỉ xác thực cấu hình. Cần build image, kết nối SQL Server thật và kiểm thử website/Admin/điện thoại để xác nhận toàn bộ chức năng.

Kiểm tra ngày 03/11/2026: cấu hình Compose hợp lệ; ba image build được; website/Admin chạy Vite và build frontend thành công; Admin tải được component dùng chung; backend khởi nạp được route, ảnh và dữ liệu địa điểm, không chứa `.env`. Môi trường kiểm tra cần truyền CA proxy qua BuildKit secret tạm để tải npm; CA không được đưa vào repo/image. Chưa kiểm thử kết nối SQL Server của nhóm hoặc điện thoại thật trong đợt này.
