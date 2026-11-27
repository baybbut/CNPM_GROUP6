# CONTROL.md · Vấn đáp và demo mã nguồn MUSES

**Đề tài:** Tra cứu tác phẩm, nghe thuyết minh đa ngôn ngữ và lập hành trình tham quan bảo tàng TP.HCM. **Phiên bản đối chiếu:** nhánh `develop`, commit `7a2d6a6`.

Khi bảo vệ, hãy bắt đầu từ thao tác của khách, chỉ ra hàm nhận dữ liệu, rồi mở kết quả trên giao diện hoặc trong thẻ **Network** của trình duyệt. Các liên kết mã nguồn dưới đây mở đúng dòng trên GitHub tại phiên bản đã đối chiếu.

[1. Tra mã nguồn](#tra-ma) · [2. Luồng xử lý](#luong) · [3. Quyết định thiết kế](#thiet-ke) · [4. Câu hỏi vấn đáp](#van-dap) · [5. Lệnh và kịch bản demo](#demo)

<a id="tra-ma"></a>

## 1. Tính năng này nằm ở đâu?

| Thầy cô chỉ vào… | Điểm mở trong mã nguồn | Điều cần chỉ ra |
|---|---|---|
| Menu Khám phá, trang tác phẩm, quét QR, bảo tàng | [App.jsx](`App.jsx Line75`) | `/explore` mở bộ sưu tập. Trang chi tiết và QR dùng chung đường dẫn tác phẩm. |
| Ô tìm kiếm và bộ lọc bảo tàng | [ArtworkCollection](`Artworks.jsx Line108`) | Từ khóa, tác giả, chất liệu, bảo tàng và trang hiện tại đi vào truy vấn danh mục. |
| Nơi đang trưng bày | [CURRENT](`catalog.cjs L4`) · [CurrentExhibition](`Museums.jsx L71`) | SQL chọn lịch còn hiệu lực. React hiện địa chỉ, nguồn và nút lập lộ trình khi có tọa độ. |
| Phân bổ tác phẩm mẫu ở TP.HCM | [seedArtworkLocations](`seed-artwork-locations.cjs L6`) | Dùng danh sách bảo tàng tham khảo và số tác phẩm đã phân bổ cho mỗi nơi. |
| Nút dùng vị trí của tôi | [MuseumLocationProvider.locate](`MuseumLocation.jsx L56`) | Kiểm tra ngữ cảnh an toàn, xin tọa độ, thử lại và cập nhật trạng thái dùng chung. |
| Lọc địa điểm theo tên và loại | [searchPlaces](`placeModel.mjs L38`) · [createPlaceService](`places.cjs L94`) | Lọc trên dữ liệu hiện có ở trình duyệt. Dịch vụ địa điểm chịu trách nhiệm tải Overpass và dự phòng. |
| Khoảng cách, vòng bán kính, ghim gần nhất | [distanceKm](`catalog.mjs L14`) · [closestMuseumInRange](`placeModel.mjs L7`) · [PlacesMap](`PlacesMap.jsx L127`) | Hàm đầu trả km. Hàm thứ hai chọn bảo tàng. Leaflet nhận bán kính theo mét. |
| Nút đọc thông báo gần bảo tàng | [NearbyMuseumNotice.speak](`NearbyMuseumNotice.jsx L36`) | `onClick` tạo phát ngôn từ thông báo và ngôn ngữ đang hiển thị. |
| Chọn ghim hoặc bấm chỉ đường | [selectPlace](`Museums.jsx L149`) · [useDirections](`Directions.jsx L8`) · [readRoute](`routeModel.mjs L14`) | Theo từ ID được chọn đến OSRM, rồi mở lớp đường vẽ trong `PlacesMap`. |
| Điểm đầu, thứ tự và thời gian tham quan | [Itinerary](`Itinerary.jsx L69`) · [nearestOrder / visitTimeline](`itineraryModel.mjs L41`) | `fromMuseum` quyết định điểm đầu. Thứ tự các điểm và giờ tham quan là hai phép tính riêng. |
| Tuyến nhiều chặng | [useItineraryRoute](`Itinerary.jsx L26`) · [readItineraryRoute](`routeModel.mjs L49`) | Mỗi cặp điểm liên tiếp tương ứng một chặng trong phản hồi. |
| Popup tạo QR, camera và ảnh QR đã lưu | [ArtworkQR](`ArtworkQR.jsx L9`) · [CameraScanner.open](`CameraScanner.jsx L46`) · [parseArtworkQR](`parseArtworkQR.mjs L9`) | Chọn loại mã và ngôn ngữ, tạo PNG, giải mã rồi điều hướng về tác phẩm trong MUSES. |
| QR còn hiệu lực và quyền bật mã | [attachArtworkQRRoutes](`artwork-qr.cjs L3`) · [QRCodes](`QRCodes.jsx L24`) | Trang quản trị đổi trạng thái. API công khai kiểm tra lại khi khách mở mã. |
| Dịch nội dung, chọn giọng và đọc từng câu | [QRAudioGuide](`QRArtworkPage.jsx L16`) · [createTranslator](`translation.cjs L2`) · [chooseVoice](`speechLanguage.mjs L48`) · [Narration.read](`Narration.jsx L85`) | Theo riêng văn bản được trả về, mã ngôn ngữ và giọng có trên thiết bị. |
| Sửa danh mục, xác nhận lịch trưng bày | [Catalog.jsx](`Catalog.jsx L140`) · [schedule](`catalog-rules.cjs L108`) · [Kiểm tra lịch khi lưu](`catalog.cjs L362`) | Kiểm tra đầu vào, quyền quản trị, điều kiện công bố và lịch chồng nhau. |
| Đăng nhập và đổi ngôn ngữ Admin | [AdminGate](`AdminAuth.jsx L38`) · [identity](`activity.cjs L133`) · [AdminLanguageProvider](`AdminLanguage.jsx L21`) | Cookie nhận diện phiên. Ngôn ngữ giao diện được lưu bằng khóa `muses-admin-language`. |
| Lượt xem, quét, nghe và báo cáo | [ActivityTracker](`ActivityTracker.jsx L4`) · [trackQRLanding](`activity.mjs L92`) · [useReport](`Analytics.jsx L42`) · [API báo cáo](`activity.cjs L297`) | Phân biệt một khách mở mã, bấm nghe và tiếp tục ở lại trang. |

<a id="luong"></a>

## 2. Từ thao tác đến kết quả

### 2.1. Tra một tác phẩm và tìm đúng nơi đang trưng bày

1. Mở **Khám phá**, nhập tên tác phẩm hoặc chọn bảo tàng. `ArtworkCollection` đưa trang về 1 khi đổi bộ lọc, đợi 250 ms rồi gọi `GET /api/catalog/artworks` và `GET /api/catalog/filters`. Khi người dùng gõ tiếp, yêu cầu cũ bị hủy.
2. Backend chỉ đưa ra danh mục công khai các tác phẩm đã công bố có tiêu đề và mô tả dài tiếng Việt đã công bố. Bộ lọc bảo tàng dùng lịch trưng bày hiện hành. SQL tính ngày hôm nay theo UTC+7.
3. Mở tác phẩm. API chi tiết trả `currentExhibition` nếu lịch có trạng thái `Confirmed`, bảo tàng công khai và ngày hôm nay nằm trong khoảng từ ngày bắt đầu đến trước ngày kết thúc. Ngày kết thúc trống nghĩa là lịch còn mở.
4. `CurrentExhibition` hiện tên, địa chỉ và khoảng thời gian, hoặc thông báo chưa có lịch được xác nhận. Khi có ID và tọa độ hợp lệ, khách có thể bắt đầu lộ trình từ bảo tàng này.

**Ví dụ để trả lời:** Lịch từ 01/12 đến 05/12 còn hiệu lực ngày 04/12. Ngày 05/12 có thể là ngày bắt đầu của lịch kế tiếp. Trường sở hữu `OwnerMuseumID` và lịch trưng bày `DisplaySchedules` trả lời hai câu hỏi nghiệp vụ riêng.

### 2.2. Xin vị trí, tìm bảo tàng gần nhất và đọc thông báo

1. Bấm **Dùng vị trí của tôi**. `locate()` gọi `getCurrentPosition` với thời gian chờ 10 giây và cho phép dùng vị trí đã lưu tối đa 60 giây. Nếu chưa lấy được vị trí hoặc hết giờ, hàm thử thêm một lần với độ chính xác cao, yêu cầu tọa độ mới và chờ tối đa 20 giây. Khi quyền bị từ chối, giao diện báo lỗi để người dùng tự cấp lại.
2. Sau lần lấy vị trí thành công, hai trang `/museums` và `/museums/itinerary` có thể theo dõi thay đổi bằng `watchPosition`. Khi rời trang đang theo dõi, effect gọi `clearWatch`. Số thứ tự yêu cầu giúp bỏ qua kết quả cũ sau khi người dùng đặt lại vị trí.
3. `distanceKm` dùng công thức Haversine với bán kính Trái Đất 6.371 km. `closestMuseumInRange` xét các điểm loại bảo tàng có tọa độ hợp lệ trong tập đang hiển thị. Nếu hai điểm bằng khoảng cách, hàm so ID để chọn ổn định.
4. `PlacesMap` vẽ vòng tìm kiếm quanh vị trí người dùng và đánh dấu bảo tàng gần nhất đủ điều kiện. Thông báo đổi theo ngôn ngữ của trang. Khi có bảo tàng phù hợp và trình duyệt hỗ trợ đọc, chỉ thao tác bấm **Đọc thông báo** mới gọi `speak()`.

| Khoảng cách đến bảo tàng gần nhất trong tập đang xét | Người dùng thấy gì? |
|---|---|
| 1,8 km, hoặc đúng 2 km | Vòng tìm kiếm 2 km, ghim gần nhất được nhấn mạnh, thông báo nêu tên và khoảng cách. |
| 2,1 km | Vòng mở rộng thành 10 km. Thông báo cho biết bảo tàng ở ngay ngoài ranh 2 km. Biên “đang đến gần” kéo đến 2,2 km. |
| 6,5 km | Thông báo cho biết đã mở rộng tìm kiếm và nêu bảo tàng gần nhất trong 10 km. |
| Trên 10 km hoặc tập lọc không có bảo tàng | Sau khi có vị trí, giao diện báo không có bảo tàng phù hợp trong phạm vi mở rộng. Nút đọc thông báo gần nhất chỉ hiện khi có kết quả. |

### 2.3. Chọn một bảo tàng để xem đường theo phố

Khi khách chọn ghim hoặc **Xem trên bản đồ**, `selectPlace(id)` tìm đúng địa điểm và gọi `directions.start(place)`. Khi có vị trí, `useDirections` gửi tọa độ xuất phát và đích đến cho OSRM với cấu hình `driving`. OSRM trả hình học của tuyến, chiều dài theo mét và thời gian ước tính theo giây. `readRoute` kiểm tra phản hồi rồi đảo thứ tự tọa độ GeoJSON từ kinh độ–vĩ độ sang vĩ độ–kinh độ cho Leaflet. `PlacesMap` vẽ tuyến và chỉnh khung nhìn. Bảng chỉ đường định dạng lại quãng đường và thời gian theo ngôn ngữ.

**Cách minh họa:** Chọn một bảo tàng bên kia sông, so số km ở thẻ danh sách với số km ở bảng chỉ đường, rồi chỉ vị trí cây cầu trên tuyến. Nếu dịch vụ đường đi lỗi, bảng đưa ra nút thử lại và liên kết mở Google Maps.

### 2.4. Dựng hành trình từ bảo tàng của tác phẩm

1. Trên trang tác phẩm, bấm **Lập lộ trình từ bảo tàng này**. Liên kết có dạng `/museums/itinerary?fromMuseum=<id>`. Trang đích đọc ID, gọi `/api/museums` và tìm đúng bảo tàng công khai có tọa độ.
2. Nếu điểm này đã có trong danh sách, ứng dụng ghép lại với dữ liệu danh mục. Nếu thiếu, ứng dụng thêm điểm xuất phát. `ItineraryEditor` đặt nó ở vị trí số 1 và dùng chính bảo tàng làm đầu tuyến, kể cả khi khách đã cấp GPS. Nếu ID không dùng được, trang báo tình trạng và cho mở trình lập lịch chung.
3. Khách chọn các điểm còn lại, đổi thứ tự hoặc dùng **Điểm gần nhất trước**. `nearestOrder` lần lượt chọn điểm chưa đi gần điểm trước đó nhất. `visitTimeline` cộng số phút tham quan của từng điểm từ giờ xuất phát.
4. Khi có ít nhất hai tọa độ, `useItineraryRoute` gửi dãy điểm theo thứ tự đến OSRM. Kết quả phải có đúng số chặng bằng số điểm trừ một. Bản đồ vẽ toàn tuyến và có thể làm nổi bật chặng đang xem. Trên trang lập lịch chung, tọa độ khách có thể được thêm làm điểm đầu khi đã cấp quyền.

### 2.5. Quét QR, chọn ngôn ngữ và nghe tác phẩm

1. Trong popup QR, chọn chế độ nghe và một trong năm ngôn ngữ Việt, Anh, Hàn, Nhật, Trung. Ví dụ đường dẫn của mã nghe là `/explore/artworks/1?lang=ja&source=qr&mode=listen`. ID 1 chỉ dùng để minh họa. Ảnh mã chứa địa chỉ truy cập, nên khách có thể tải PNG rồi quét lại.
2. Camera điện thoại có thể mở thẳng URL. Bên trong MUSES, trang quét nhận camera hoặc ảnh đã lưu. `parseArtworkQR` lấy ID và các tham số hợp lệ, rồi ứng dụng dựng đường dẫn nội bộ. Với QR nghe có ngôn ngữ hợp lệ, trình quét giữ ngôn ngữ của mã.
3. `QRArtworkPage` kiểm tra `GET /api/qr/artworks/:id`. Nếu mã hợp lệ, trang ghi nhận lượt mở QR. Ở chế độ nghe, `QRAudioGuide` gọi thêm `GET /api/artworks/:id?lang=ja&mode=listen`.
4. Nếu đã có mô tả công bố đúng ngôn ngữ, API dùng bản đó. Nếu mô tả hiện có thuộc ngôn ngữ khác, backend có thể gọi LibreTranslate. Bản dịch máy mang nhãn riêng. Nếu chưa lấy được mô tả đúng tiếng yêu cầu, màn hình nghe báo chưa khả dụng và có nút thử lại.
5. Người dùng bấm **Đọc** để `Narration.read()` chọn giọng, chia văn bản thành câu và phát qua Web Speech. Nếu tác phẩm có bản thu đúng ngôn ngữ, trang còn có trình phát bản thu riêng. Nút đọc, tạm dừng và tiếp tục điều khiển phiên đọc hiện tại.

**Điểm có thể demo:** Tạo QR tiếng Nhật khi web đang dùng tiếng Việt. Mở ảnh QR qua màn hình quét, đối chiếu `lang=ja`, nhãn nguồn dịch và thời điểm phát tiếng. Nếu thiết bị thiếu giọng Nhật, phần đọc báo thiếu giọng dù văn bản đã dịch thành công.

### 2.6. Đăng nhập Admin, công bố nội dung và xem báo cáo

- **Vào dashboard.** `POST /api/auth/login` kiểm tra mật khẩu qua `scrypt` và so sánh kết quả bằng `timingSafeEqual`. Backend sinh token ngẫu nhiên, lưu bản băm SHA-256 trong `AuthSessions` và đặt cookie `muses_session` có `HttpOnly`, thời hạn 12 giờ. Lần gọi sau, `identity` kiểm tra phiên còn hạn và tài khoản đang hoạt động. Đăng xuất xóa phiên.
- **Công bố.** API danh mục kiểm tra quyền ở server. Khi xác nhận lịch, backend dùng giao dịch mức `SERIALIZABLE` và kiểm tra các lịch đã xác nhận giao nhau của cùng tác phẩm trước khi lưu. Có thể mở đoạn chứa `UPDLOCK,HOLDLOCK` để giải thích điều xảy ra nếu hai quản trị viên thao tác cùng lúc.
- **Đọc số liệu.** Web gửi sự kiện lên `POST /api/activity`. `page_view` là mở trang, `qr_scan` là mở QR đã xác nhận, `audio_play` là bắt đầu phát, còn `heartbeat` cập nhật hoạt động. Trang đang hiển thị gửi nhịp định kỳ 60 giây. Admin gọi `GET /api/admin/analytics` và làm mới mỗi 5 giây khi đang xem. Hai chu kỳ phục vụ hai công việc khác nhau.

<a id="thiet-ke"></a>

## 3. Vì sao thiết kế như vậy?

| Câu hỏi | Câu trả lời ngắn khi bảo vệ |
|---|---|
| Vì sao cần cả Haversine và OSRM? | Haversine dùng hai tọa độ để xếp gần–xa và kiểm tra bán kính ngay trong trình duyệt. OSRM cần mạng lưới đường để dựng tuyến ô tô qua các giao lộ. Một bảo tàng bên kia sông có thể gần theo bán kính nhưng đường qua cầu dài hơn. |
| Vì sao vòng 2 km thay đổi kích thước khi zoom? | `L.circle` nhận bán kính bằng mét. Leaflet đổi mét thành kích thước trên màn hình theo mức zoom. Chấm vị trí dùng `L.circleMarker` với bán kính tính theo pixel để luôn dễ nhìn. |
| Vì sao lưu nơi trưng bày bằng lịch có ngày? | Một tác phẩm có thể luân chuyển. Lịch có trạng thái, thời hạn và nguồn cho phép danh sách, bộ lọc và trang chi tiết cùng xác định nơi đang trưng bày vào một ngày cụ thể. |
| Vì sao QR lưu ID và tùy chọn nghe? | Tên, văn bản và trạng thái công bố có thể đổi. Với cùng địa chỉ website và ID, một mã đã in có thể mở nội dung mới nhất. Server cũng có thể thu hồi mã khi cần. |
| Vì sao phải kiểm tra ngôn ngữ trước khi đọc? | Việc dịch văn bản và việc chọn giọng là hai bước độc lập. Dùng giọng Nhật để đọc nguyên đoạn tiếng Việt sẽ sai ngay cả khi thiết bị có giọng Nhật tốt. Trang nghe kiểm tra `descriptionLanguage` trước, rồi bộ đọc mới tìm giọng trên máy. |
| Vì sao tra cứu bảo tàng vẫn có kết quả lúc nguồn bản đồ lỗi? | Backend thử hai máy chủ Overpass, sau đó dùng kết quả cache cũ nếu có, cuối cùng dùng danh sách tham khảo. Frontend cũng khởi tạo bằng danh sách tham khảo. Nền bản đồ và tuyến OSRM phụ thuộc các dịch vụ riêng. |

<a id="van-dap"></a>

## 4. Các câu dễ nhầm khi vấn đáp

**“Có bốn địa điểm trong danh sách. Vì sao giao diện vẫn báo không có bảo tàng gần?”**  
Số địa điểm là số kết quả khớp bộ lọc. Thông báo còn xét loại bảo tàng và khoảng cách đến người dùng. Có thể thấy bốn địa điểm nhưng tất cả đều ngoài 10 km.

**“Tôi mở trên máy tính được, tại sao dùng IP Wi-Fi trên điện thoại lại không định vị được?”**  
GPS của trình duyệt cần ngữ cảnh an toàn và quyền của người dùng. Trên chính máy chạy web có thể demo bằng `localhost`. Trên điện thoại, `localhost` trỏ về điện thoại, còn URL LAN qua HTTP thường bị chặn định vị. Dùng địa chỉ HTTPS mà điện thoại truy cập được và kiểm tra quyền vị trí của trình duyệt.

**“Có lưu hành trình GPS của khách vào bảng thống kê không?”**  
Lược đồ sự kiện nhận loại hoạt động, thông tin phiên và ngữ cảnh như tác phẩm hoặc ngôn ngữ. Khi xin tuyến, trình duyệt gửi tọa độ các điểm cho dịch vụ OSRM. Vì vậy phải phân biệt dữ liệu thống kê nội bộ với dữ liệu cần cho dịch vụ chỉ đường.

**“Điểm gần nhất trước có đảm bảo hành trình nhanh nhất thành phố không?”**  
Đây là cách sắp xếp tham lam theo khoảng cách địa lý từ điểm trước. OSRM tính đường lái xe cho thứ tự đã chọn. Giờ bắt đầu–kết thúc từng lượt tham quan do `visitTimeline` tính từ thời lượng tại điểm. Thời gian di chuyển, nghỉ và chờ cần được tính riêng khi lập kế hoạch thực tế.

**“Quét QR rồi thoát luôn có bị tính là đã nghe không?”**  
Mở thành công trang đích QR được ghi là `qr_scan`. Khi bản đọc hoặc bản thu bắt đầu phát mới ghi `audio_play`. Có thể mở cùng lúc thẻ Network và lọc `/api/activity` để chỉ ra hai sự kiện.

**“QR in sẵn còn dùng được nếu đổi tên tác phẩm, tắt QR hoặc đổi link cloud không?”**  
Đổi tên vẫn dùng cùng ID. Tắt QR của tác phẩm còn công khai khiến API trả 410. Khi tác phẩm không còn đủ điều kiện công khai, API có thể trả 404. Nếu tên miền tunnel tạm đã đổi, URL in trên mã cũ vẫn trỏ tới tên miền cũ.

**“Năm ngôn ngữ có đồng nghĩa năm thiết bị phát ra giọng giống hệt nhau không?”**  
Danh sách ngôn ngữ được cố định. Danh sách giọng lại do trình duyệt và hệ điều hành cung cấp. `chooseVoice` lọc đúng tiếng, ưu tiên locale và chất lượng, rồi xét các giọng ưu tiên như Hoài My, Jenny, SunHi, Nanami hoặc Xiaoxiao khi có sẵn.

**“Thông tin nơi trưng bày trong demo lấy ở đâu?”**  
Script mẫu ưu tiên tác phẩm đã công bố và phân tác phẩm còn thiếu lịch vào bảo tàng có ít tác phẩm thích hợp hơn. Script giữ lịch hiện hành, dùng ngày bắt đầu của lịch tương lai làm giới hạn nếu cần và ghi nguồn mẫu. Khi trình bày, chỉ vào trường **Nguồn thông tin** để giải thích xuất xứ.

**“Ẩn nút quản trị có đủ để bảo vệ dữ liệu không?”**  
Quyền quyết định ở API. Chẳng hạn `/api/admin/analytics` trả 401 khi chưa có phiên hợp lệ và 403 nếu đã đăng nhập nhưng thiếu vai trò quản trị. Khi thử đăng nhập, bộ đếm của backend giới hạn 10 yêu cầu mỗi phút theo IP cho thao tác login.

<a id="demo"></a>

## 5. Lệnh terminal và kịch bản bảo vệ

### Chạy trên máy nhóm

Các lệnh dưới đây chạy từ **thư mục gốc của repo**, nơi nhìn thấy cả `muses-react`, `muses-admin` và `muses-backend`. Nếu đang đứng trong `muses-admin`, có thể chạy trực tiếp `npm run dev -- --port 5174 --strictPort`. Dùng `--prefix muses-admin` ngay trong thư mục con sẽ khiến npm tìm sai đường dẫn.

Cần Node.js và npm, dependencies của ba module và SQL Server đã khởi tạo dữ liệu. Cấu hình kết nối backend theo tệp mẫu của dự án. Trên máy mới, cài dependencies bằng ba lệnh dưới đây. [Hướng dẫn thiết lập](https://github.com/baybbut/CNPM_GROUP6/blob/7a2d6a6cc7965a3cd31f7280fb6bdf8217d05beb/docs/SETUP.md) · [Các biến môi trường backend](https://github.com/baybbut/CNPM_GROUP6/blob/7a2d6a6cc7965a3cd31f7280fb6bdf8217d05beb/muses-backend/.env.example)

```bash
npm --prefix muses-backend ci
npm --prefix muses-react ci
npm --prefix muses-admin ci
```

Mở ba terminal ở thư mục gốc. Giữ tiến trình chạy trong lúc demo.

| Terminal | Lệnh | Địa chỉ mặc định khi dùng các lệnh này |
|---|---|---|
| 1 · API | `npm --prefix muses-backend run dev` | `http://localhost:3001/api/health` |
| 2 · Website khách | `npm --prefix muses-react run dev` | `http://localhost:5173` |
| 3 · Dashboard | `npm --prefix muses-admin run dev -- --port 5174 --strictPort` | `http://localhost:5174` |

Khi demo **dịch máy** và backend đang cấu hình dịch vụ dịch mặc định, chạy từ gốc repo với Docker Compose. Lần đầu cần đợi tải mô hình. Kiểm tra `ready` và danh sách ngôn ngữ trước khi chọn tác phẩm thiếu bản dịch.

```bash
docker compose -f compose.translation.yml up -d
curl 'http://localhost:3001/api/translation/health?mode=listen'
```

### Kiểm thử và build

```bash
npm --prefix muses-react test
npm --prefix muses-backend test
npm --prefix muses-react run build
npm --prefix muses-admin run build
```

Kết quả chạy lại hai lệnh test ở commit này là **52/52 ca frontend đạt** và **65/66 ca backend đạt, 1 ca SQL Server được bỏ qua**. Ca SQL là kiểm thử tích hợp trên database tạm riêng, chỉ được bật khi đã cấu hình tài khoản SQL thử. Có thể xem điều kiện chạy và các trường hợp mà bài này kiểm tra trong mã. [Bài tích hợp SQL](https://github.com/baybbut/CNPM_GROUP6/blob/7a2d6a6cc7965a3cd31f7280fb6bdf8217d05beb/muses-backend/test/catalog-sql.test.cjs)

Muốn mở ngay bài test liên quan lúc vấn đáp, từ gốc repo chạy:

```bash
node --test muses-react/tests/places.test.mjs muses-react/tests/routes.test.mjs muses-react/tests/itinerary.test.mjs
node --test muses-react/tests/qr.test.mjs muses-react/tests/speechLanguage.test.mjs
node --test muses-backend/test/artwork-qr.test.cjs muses-backend/test/translation.test.cjs
```

Vite dev cập nhật khi lưu mã. Nếu tunnel đang trỏ vào backend phục vụ website từ `muses-react/dist`, hãy build lại **website khách trên máy đang chạy backend** và tải lại trang. Dòng `built in …` xác nhận Vite đã tạo file. Cảnh báo kích thước chunk màu vàng vẫn có thể xuất hiện sau khi build thành công. [Đoạn Express phục vụ bản build](https://github.com/baybbut/CNPM_GROUP6/blob/7a2d6a6cc7965a3cd31f7280fb6bdf8217d05beb/muses-backend/server.cjs)

### Demo trong 5 phút

| Thời gian | Thao tác | Điều cho giảng viên xem |
|---|---|---|
| Phút 1 | Vào Khám phá, lọc bảo tàng, mở một tác phẩm có lịch. | Chỉ tên bảo tàng, thời hạn và nguồn. Đối chiếu với `currentExhibition` trong phản hồi chi tiết. |
| Phút 2 | Bấm lập lộ trình từ tác phẩm. Giữ điểm đầu, đổi hai điểm sau. | URL có `fromMuseum`. Ghim số 1 là bảo tàng của tác phẩm, thứ tự chặng và tuyến cập nhật theo lựa chọn. |
| Phút 3 | Mở Bảo tàng, cấp vị trí rồi chọn một ghim. | Chỉ vòng theo mét, khoảng cách đường thẳng và đường lái xe. Bấm **Đọc thông báo** để minh họa người dùng chủ động nghe. Nếu vị trí thật ngoài 10 km, có thể dùng Chrome DevTools → Sensors để đặt vị trí thử gần bảo tàng và nói rõ đây là mô phỏng. |
| Phút 4 | Tạo QR nghe ở ngôn ngữ thứ hai, tải PNG, dùng trang quét để mở ảnh. | Kiểm tra đúng tác phẩm và ngôn ngữ, sau đó bấm **Đọc**. Dùng tác phẩm có mô tả đã công bố để demo cả khi dịch vụ dịch máy chưa sẵn sàng. |
