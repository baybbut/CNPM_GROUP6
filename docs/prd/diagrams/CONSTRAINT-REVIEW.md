# Rà soát ràng buộc sơ đồ MUSES — 30/10/2026

Đối chiếu schema và backend tại `31e2715`. Đây là kiểm tra mã nguồn, không phải xác nhận các migration đã được áp dụng vào database trên máy người dùng. Bản sửa chỉ cập nhật tài liệu/hình, không thay đổi DB hay chức năng.

## Kết quả

ERD trước đợt rà soát đã có 19 quan hệ FK cho 16 bảng thuộc phạm vi chức năng, cùng khóa chính và các khóa duy nhất quan trọng. Tuy nhiên hình chưa đủ để trình bày đầy đủ schema: thiếu bảng tương thích `TicketReservations`, chưa ghi rõ CHECK/default, thiếu nhãn CASCADE, và gộp `IsDemo` với `IsNationalTreasure` dù hai cột có nullability khác nhau.

Bản hiện tại có **17 bảng, 20 quan hệ FK, 6 ràng buộc UNIQUE và 15 biểu thức CHECK**, chia thành 4 trang ERD. Các bảng tham chiếu lặp ở nhiều trang vẫn là cùng một bảng. Mỗi FK đều có cardinality tương ứng với cột cho/không cho NULL; không ép có ít nhất một bản ghi con khi SQL không có ràng buộc đó.

- Giữ bố cục và phần tiêu đề người dùng đã chỉnh trong các file draw.io hiện hành.
- Tách riêng IsDemo/IsNationalTreasure, Latitude/Longitude, IsPublic/PinVerified; ghi IDENTITY cho PK tự tăng.
- Thêm các khung màu xanh cho ràng buộc SQL và khung vàng cho quy tắc API/giới hạn hiện tại.
- Ghi ON DELETE CASCADE cho ảnh và mô tả tác phẩm. Những FK còn lại dùng NO ACTION mặc định.
- Bổ sung ERD 4/4 cho TicketReservations nhưng vẫn ghi rõ đây là tính năng tương thích cũ, không phải luồng mua vé hiện hành.
- Sửa UC09: đăng ký là ca sử dụng độc lập có liên kết với tác nhân; không còn vẽ là `extend` của đăng nhập.
- Bổ sung UC22 cho QR trang chủ; cập nhật hình tổng quát và truy vết WEB-17. Hướng include/extend của các hình còn lại được kiểm tra: include từ ca chính tới ca được bao gồm; extend từ phần mở rộng về ca chính.

## Danh mục FK và hành vi xóa

`NULL` biểu thị mỗi bản ghi con được tham chiếu 0..1 bản ghi cha; `NOT NULL` yêu cầu đúng 1 bản ghi cha. Mỗi bản ghi cha có 0..n bản ghi con, trừ Museums → TicketOffers có 0..1 vì MuseumID đồng thời là PK.

| Bảng con.cột FK | Bảng cha.khóa | Nullable | Khi xóa bản ghi cha |
| --- | --- | --- | --- |
| Artworks.ArtistID | Artists.ArtistID | Không | NO ACTION |
| Artworks.CategoryID | Categories.CategoryID | Không | NO ACTION |
| Artworks.MaterialID | Materials.MaterialID | Có | NO ACTION |
| Artworks.OwnerMuseumID | Museums.MuseumID | Có | NO ACTION |
| ArtworkImages.ArtworkID | Artworks.ArtworkID | Không | CASCADE |
| ArtworkDescriptions.ArtworkID | Artworks.ArtworkID | Không | CASCADE |
| ArtworkDescriptions.LanguageID | Languages.LanguageID | Không | NO ACTION |
| SiteImages.ArtworkID | Artworks.ArtworkID | Có | NO ACTION |
| DisplaySchedules.ArtworkID | Artworks.ArtworkID | Không | NO ACTION |
| DisplaySchedules.MuseumID | Museums.MuseumID | Không | NO ACTION |
| DisplaySchedules.UpdatedBy | Users.UserID | Không | NO ACTION |
| AuthSessions.UserID | Users.UserID | Không | NO ACTION |
| AnalyticsSessions.UserID | Users.UserID | Có | NO ACTION |
| AnalyticsEvents.SessionID | AnalyticsSessions.SessionID | Không | NO ACTION |
| AnalyticsEvents.UserID | Users.UserID | Có | NO ACTION |
| AnalyticsEvents.ArtworkID | Artworks.ArtworkID | Có | NO ACTION |
| AuthLoginEvents.UserID | Users.UserID | Không | NO ACTION |
| TicketOffers.MuseumID | Museums.MuseumID | Không | NO ACTION |
| TicketOffers.UpdatedBy | Users.UserID | Không | NO ACTION |
| TicketReservations.MuseumID | Museums.MuseumID | Không | NO ACTION |

NO ACTION chặn xóa cha khi vẫn còn con tham chiếu; CASCADE cho phép xóa con theo cha. API hiện chuyển tác phẩm sang Hidden, không thực hiện DELETE Artworks. Không suy từ CASCADE rằng giao diện đang xóa cứng tác phẩm.

## UNIQUE

| Bảng | Khóa duy nhất |
| --- | --- |
| Languages | LanguageCode |
| Categories | CategoryName |
| Materials | Name |
| Users | Email |
| ArtworkDescriptions | (ArtworkID, LanguageID) |
| TicketReservations | BookingCode |

Artworks.ArtworkName và Artists.ArtistName chưa có UNIQUE trong SQL. Không vẽ chúng thành khóa duy nhất.

## CHECK và DEFAULT

| Bảng | CHECK đã có |
| --- | --- |
| Museums | Latitude trong [-90,90] và Longitude trong [-180,180]; IsPublic=0 hoặc PinVerified=1 |
| Artworks | PublicationStatus thuộc Draft/Published/Hidden |
| ArtworkDescriptions | PublicationStatus thuộc Draft/Published |
| DisplaySchedules | EndDate NULL hoặc StartDate < EndDate; Status thuộc Draft/Confirmed/Cancelled |
| AnalyticsEvents | Kind thuộc page_view/qr_scan/audio_play |
| TicketOffers | 3 CHECK riêng cho AdultPrice/ConcessionPrice/ChildPrice từ 0 đến 10.000.000 |
| TicketReservations | TotalAmount >= 0; miền PaymentState; miền Status; ràng buộc trạng thái demo; số lượng vé không âm và tổng từ 1 đến 20 |

DEFAULT và nullability được ghi trong từng trang hình. Cần phân biệt: DEFAULT chỉ cung cấp giá trị khi không truyền cột, không tự biến cột thành NOT NULL. Ví dụ Users.Role có DEFAULT Editor nhưng SQL vẫn cho NULL; IsNationalTreasure có DEFAULT 0 nhưng vẫn cho NULL.

## Quy tắc nằm ở API, không phải constraint SQL

| Quy tắc | Nguồn triển khai |
| --- | --- |
| Tên/mô tả không được chỉ gồm khoảng trắng; giới hạn độ dài, ID nguyên dương, URL hợp lệ | [catalog-rules.cjs](../../../muses-backend/catalog-rules.cjs), hàm text/id/url |
| Công bố cần ảnh và nội dung tiếng Việt; API yêu cầu chất liệu dù MaterialID cho NULL trong SQL | catalog-rules.cjs: artwork; [catalog.cjs](../../../muses-backend/catalog.cjs): save/inlineVi |
| Chỉ nhận 5 ngôn ngữ trong luồng catalogue | catalog-rules.cjs: language; Languages.LanguageCode chỉ có UNIQUE, không có CHECK 5 giá trị |
| Không cho hai lịch Confirmed chồng nhau; không ẩn bảo tàng còn lịch hiện tại/tương lai | catalog.cjs: transaction SERIALIZABLE, kiểm tra schedules/museums |
| Nguồn bắt buộc khi công khai bảo tàng; ngày xác minh không ở tương lai | catalog-rules.cjs: museum/schedule |
| QR tác phẩm chỉ hoạt động khi bật và nội dung đủ điều kiện | [artwork-qr.cjs](../../../muses-backend/artwork-qr.cjs) |
| UUID v4; phiên phải thuộc đúng VisitorID; heartbeat không thêm AnalyticsEvents | [activity.cjs](../../../muses-backend/activity.cjs): validateActivity, POST /api/activity |
| Thời hạn phiên, định nghĩa khách hoạt động, lọc giờ Việt Nam | activity.cjs và [activity.mjs](../../../muses-react/src/api/activity.mjs) |

Chạy SQL trực tiếp không thực thi những kiểm tra API này. Việc ngày kết thúc không tính vào nơi trưng bày hiện tại cũng là quy tắc truy vấn, không phải điều kiện FK.

## Những giới hạn không được mô tả thành ràng buộc đã tồn tại

- `Artworks.QRUpdatedBy` chưa có FK tới Users. Hình ghi tham chiếu logic, không vẽ thành FK thật.
- Chưa có UNIQUE/filtered index bảo đảm mỗi tác phẩm chỉ có một `ArtworkImages.IsPrimary=1`; chưa có CHECK DisplayOrder dương. API chọn ảnh theo thứ tự ưu tiên.
- Chưa có trigger/constraint SQL chống chồng lịch hoặc buộc tác phẩm Published phải có bản tiếng Việt. Chưa có CHECK bắt Role chỉ nhận Admin/Administrator/Visitor, hay UUID v4 trong các cột varchar.
- TicketReservations chưa có CHECK tính lại tổng tiền từ số vé × đơn giá hoặc bảo đảm PaidAt/PaymentTransaction phù hợp trạng thái. Không mở rộng tính năng cũ chỉ bằng cách thêm nó vào ERD.
- VisitorID, PointKey và AnalyticsEvents.LanguageCode không có bảng cha/FK riêng; QR trang chủ không có bảng lưu riêng; GPS khách không được lưu vào các bảng này.

## Ràng buộc dữ liệu và quyền xóa là hai phần khác nhau

ERD mô tả liên kết/miền giá trị; không chứng minh hệ thống yêu cầu mật khẩu cho mỗi lần xóa. API kiểm tra phiên và role quản trị, form có hộp xác nhận; chưa có bước nhập lại mật khẩu/OTP hoặc nhật ký xóa riêng.

[CatalogPermissions.sql](../../../muses-backend/MusesDB/CatalogPermissions.sql) hiện cấp DELETE khá rộng cho runtime SQL user. Một người có quyền SQL tương ứng có thể thao tác trực tiếp, chịu các constraint của DB nhưng không qua phân quyền/hộp xác nhận web. Đây là giới hạn triển khai được ghi nhận, không sửa quyền DB trong đợt rà soát hình này.

Nguồn schema: [MusesMuseumDB.sql](../../../muses-backend/MusesDB/MusesMuseumDB.sql), [Catalog.sql](../../../muses-backend/MusesDB/Catalog.sql), [ArtworkQR.sql](../../../muses-backend/MusesDB/ArtworkQR.sql), [ActivityAnalytics.sql](../../../muses-backend/MusesDB/ActivityAnalytics.sql), [HomeImages.sql](../../../muses-backend/MusesDB/HomeImages.sql), [Tickets.sql](../../../muses-backend/MusesDB/Tickets.sql).
