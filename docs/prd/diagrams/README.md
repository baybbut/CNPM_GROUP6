# Sơ đồ phân tích MUSES

Bộ sơ đồ được vẽ lại theo [PRD hiện hành](../PRD.md) và mã nguồn chức năng `978b0e0`, ngày **30/10/2026**. Có **25 hình**: 1 Use Case tổng quát, 21 Use Case chi tiết và 3 ERD theo nhóm dữ liệu. Ảnh PNG đã được chèn trực tiếp trong PRD; SVG dùng để phóng to hoặc đưa vào báo cáo mà không vỡ hình.

## 1. File chỉnh sửa và nguồn đối chiếu

| Bộ sơ đồ mới | Số trang draw.io | File chỉnh sửa |
| --- | ---: | --- |
| Use Case tổng quát | 1 | [Muses_UseCase_TongQuat.drawio](source/Muses_UseCase_TongQuat.drawio) |
| Use Case chi tiết | 21 | [Muses_UseCase_ChiTiet.drawio](source/Muses_UseCase_ChiTiet.drawio) |
| ERD | 3 | [Muses_ERD.drawio](source/Muses_ERD.drawio) |

Mở file bằng ứng dụng draw.io/diagrams.net, chọn **File → Open From → Device** rồi chọn trang ở thanh tab phía dưới. Từng thực thể, Use Case, đường nối và nhãn đều chỉnh sửa được; file không chỉ chứa một ảnh nền. Khi sửa nội dung, cần xuất lại cả PNG/SVG tương ứng và thay ảnh trong `images/`.

Ba file nhận ban đầu được giữ nguyên trong `originals/` để đối chiếu:

- [Use Case tổng quát ban đầu](originals/Muses_UseCase_TongQuat.drawio).
- [ERD ban đầu](originals/Muses_ERD.drawio).
- [15 Use Case chi tiết ban đầu](originals/Muses_15_UseCase_ChiTiet.drawio).

Bản trong `source/` là bản vẽ lại để sử dụng cùng PRD. Mã UC01–UC15 tiếp tục tương ứng các chủ đề cũ; UC16–UC21 bổ sung phạm vi đã thay đổi. Sáu hành trình ở mục 5 của PRD được đặt tên **Luồng 01–06** để tránh nhầm với bộ mã sơ đồ.

## 2. Use Case tổng quát

![Use Case tổng quát MUSES](images/usecase-tong-quat.png)

[PNG](images/usecase-tong-quat.png) · [SVG](images/usecase-tong-quat.svg) · [draw.io](source/Muses_UseCase_TongQuat.drawio).

Hai tác nhân chính là **Khách truy cập** và **Quản trị viên**. Tài khoản khách tùy chọn; quản trị yêu cầu đăng nhập và phân quyền phía server. Nhóm có nhiều mã UC trong hình tổng quát được tách thành các sơ đồ chi tiết bên dưới.

## 3. ERD theo nhóm dữ liệu

| Hình | Nội dung | Tải hình |
| --- | --- | --- |
| ERD 1/3 | Artworks, Artists, Categories, Materials, ArtworkDescriptions, Languages, ArtworkImages, SiteImages; tham chiếu Museums | [PNG](images/erd-catalogue.png) · [SVG](images/erd-catalogue.svg) |
| ERD 2/3 | Museums, DisplaySchedules, TicketOffers; tham chiếu Artworks/Users | [PNG](images/erd-museums.png) · [SVG](images/erd-museums.svg) |
| ERD 3/3 | Users, AuthSessions, AuthLoginEvents, AnalyticsSessions, AnalyticsEvents; tham chiếu Artworks | [PNG](images/erd-activity.png) · [SVG](images/erd-activity.svg) |

Xem ba hình trực tiếp tại [mục 8 của PRD](../PRD.md#8-dữ-liệu-và-tích-hợp). Bảng mang nhãn **tham chiếu** là cùng thực thể xuất hiện trên nhiều trang; không tạo thêm bảng trong DB.

Những điểm đã chỉnh so với ERD gửi ban đầu:

- `AdminUsers` được thay bằng bảng thực tế `Users`, có `Email`, `Role`, mật khẩu băm và quan hệ phiên đăng nhập.
- `ArtworkTranslations` được thay bằng `ArtworkDescriptions`; khóa ngôn ngữ là `Languages.LanguageID`, còn `LanguageCode` là duy nhất. Mỗi cặp tác phẩm/ngôn ngữ có tối đa một bản mô tả.
- `ArtworkDisplays` được thay bằng `DisplaySchedules`; bảo tàng sở hữu (`OwnerMuseumID`) được tách khỏi bảo tàng đang trưng bày theo lịch.
- Ảnh tác phẩm nằm ở `ArtworkImages`, ảnh theo vị trí giao diện ở `SiteImages`. Không thêm `MuseumTranslations` vào sơ đồ vì schema hiện hành chưa có bảng này.
- QR dùng các cột trong `Artworks`. `QRUpdatedBy` hiện là tham chiếu logic do code ghi, chưa có FK trong migration; không vẽ như một ràng buộc SQL đã tồn tại.
- Bổ sung phiên/sự kiện truy cập và bảng giá tra cứu. `TicketReservations` cũ nằm ngoài luồng chức năng hiện hành; không mô tả mua vé/thanh toán như tính năng đã có. GPS khách không lưu trong DB này.

ERD dùng ký pháp chân quạ: `1`, `0..1`, `0..n`; `PK`/`FK`/`UQ` lần lượt là khóa chính/khóa ngoại/duy nhất. Kiểu dữ liệu được đối chiếu từ SQL, một số dòng gộp các cột cùng kiểu để hình gọn; không phải bản sao đầy đủ mọi CHECK/default/index. Đối chiếu với các migration, không dùng hình này để tự thay thế/reset database.

Nguồn đối chiếu schema:

- [Dữ liệu nền và HistoryDescription](../../../muses-backend/MusesDB/MusesMuseumDB.sql).
- [Catalog.sql](../../../muses-backend/MusesDB/Catalog.sql), [ArtworkQR.sql](../../../muses-backend/MusesDB/ArtworkQR.sql).
- [ActivityAnalytics.sql](../../../muses-backend/MusesDB/ActivityAnalytics.sql).
- [Tickets.sql](../../../muses-backend/MusesDB/Tickets.sql), [HomeImages.sql](../../../muses-backend/MusesDB/HomeImages.sql).

## 4. Use Case chi tiết và truy vết yêu cầu

Mở liên kết ở cột **Use Case** để xem hình ngay trong PRD. Có thể tải riêng PNG hoặc SVG theo từng dòng.

| Mã | Use Case | Tác nhân | Yêu cầu PRD | File hình |
| --- | --- | --- | --- | --- |
| UC01 | [Tra cứu tác phẩm](../PRD.md#uc01) | Khách truy cập | `WEB-02` | [PNG](images/uc01.png) · [SVG](images/uc01.svg) |
| UC02 | [Xem chi tiết tác phẩm](../PRD.md#uc02) | Khách truy cập | `WEB-03 / WEB-04 / WEB-09` | [PNG](images/uc02.png) · [SVG](images/uc02.svg) |
| UC03 | [Chuyển ngôn ngữ nội dung](../PRD.md#uc03) | Khách truy cập | `WEB-04` | [PNG](images/uc03.png) · [SVG](images/uc03.svg) |
| UC04 | [Nghe thuyết minh](../PRD.md#uc04) | Khách truy cập | `WEB-05 / WEB-06` | [PNG](images/uc04.png) · [SVG](images/uc04.svg) |
| UC05 | [Xem nơi trưng bày tác phẩm](../PRD.md#uc05) | Khách truy cập | `WEB-09 / BR-03` | [PNG](images/uc05.png) · [SVG](images/uc05.svg) |
| UC06 | [Tra cứu bảo tàng tại TP.HCM](../PRD.md#uc06) | Khách truy cập | `WEB-10` | [PNG](images/uc06.png) · [SVG](images/uc06.svg) |
| UC07 | [Xem bản đồ bảo tàng](../PRD.md#uc07) | Khách truy cập | `WEB-10 / WEB-11` | [PNG](images/uc07.png) · [SVG](images/uc07.svg) |
| UC08 | [Chỉ đường trên bản đồ Muses](../PRD.md#uc08) | Khách truy cập | `WEB-11 / BR-04` | [PNG](images/uc08.png) · [SVG](images/uc08.svg) |
| UC09 | [Đăng nhập tài khoản web](../PRD.md#uc09) | Khách / Admin | `WEB-16 / ADM-01` | [PNG](images/uc09.png) · [SVG](images/uc09.svg) |
| UC10 | [Quản lý và công bố tác phẩm](../PRD.md#uc10) | Quản trị viên | `ADM-02 / BR-01` | [PNG](images/uc10.png) · [SVG](images/uc10.svg) |
| UC11 | [Quản lý bản dịch và URL audio](../PRD.md#uc11) | Quản trị viên | `ADM-03 / BR-02` | [PNG](images/uc11.png) · [SVG](images/uc11.svg) |
| UC12 | [Quản lý thông tin bảo tàng](../PRD.md#uc12) | Quản trị viên | `ADM-05` | [PNG](images/uc12.png) · [SVG](images/uc12.svg) |
| UC13 | [Quản lý lịch trưng bày hiện vật](../PRD.md#uc13) | Quản trị viên | `ADM-06 / BR-03` | [PNG](images/uc13.png) · [SVG](images/uc13.svg) |
| UC14 | [Quản lý tác giả, chất liệu, thể loại](../PRD.md#uc14) | Quản trị viên | `ADM-04` | [PNG](images/uc14.png) · [SVG](images/uc14.svg) |
| UC15 | [Đăng xuất](../PRD.md#uc15) | Khách / Admin | `WEB-16 / ADM-01` | [PNG](images/uc15.png) · [SVG](images/uc15.svg) |
| UC16 | [Xem và quét QR tác phẩm](../PRD.md#uc16) | Khách truy cập | `WEB-07 / WEB-08 / BR-05` | [PNG](images/uc16.png) · [SVG](images/uc16.svg) |
| UC17 | [Quản lý QR đang hoạt động](../PRD.md#uc17) | Quản trị viên | `ADM-07 / BR-05` | [PNG](images/uc17.png) · [SVG](images/uc17.svg) |
| UC18 | [Xây dựng lộ trình tham quan](../PRD.md#uc18) | Khách truy cập | `WEB-12 / BR-04` | [PNG](images/uc18.png) · [SVG](images/uc18.svg) |
| UC19 | [Tra cứu giá vé bảo tàng](../PRD.md#uc19) | Khách truy cập | `WEB-15 / BR-08` | [PNG](images/uc19.png) · [SVG](images/uc19.svg) |
| UC20 | [Xem Overview và Reports](../PRD.md#uc20) | Quản trị viên | `ADM-08 / ADM-09 / BR-06 / BR-07` | [PNG](images/uc20.png) · [SVG](images/uc20.svg) |
| UC21 | [Xem thông tin tham quan](../PRD.md#uc21) | Khách truy cập | `WEB-01 / WEB-13 / WEB-14` | [PNG](images/uc21.png) · [SVG](images/uc21.svg) |

Các Use Case quản trị có tiền điều kiện phiên Admin hợp lệ, thay vì vẽ `include Đăng nhập` vào mọi thao tác. Đăng nhập là một Use Case độc lập; người đã có phiên không cần nhập lại tài khoản mỗi lần lưu.

Các giới hạn vẫn được thể hiện trong hình: chỉ đường cần lấy vị trí thành công, planner chưa có mặt bằng thật, QR tắt không làm ẩn tác phẩm, số liệu phiên không phải số người có mặt, giá vé chỉ tra cứu và chưa có CMS tin tức đầy đủ.
