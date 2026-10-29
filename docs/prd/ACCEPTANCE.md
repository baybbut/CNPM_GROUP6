# Đối chiếu PRD và biên bản kiểm thử

Ngày thay đổi: 29/10/2026 (Asia/Ho_Chi_Minh). Nguồn: [PRD người dùng cung cấp](PRD-2026-10-29.txt). Người thực hiện kiểm thử tự động: Codex. Người kiểm tra nghiệm thu trên thiết bị/DB thật: **nhóm cần điền**.

## Phạm vi bằng chứng

- Unit/API: Express thật + adapter SQL kiểm soát, kiểm tra dữ liệu đầu vào, quyền, metadata fallback và câu truy vấn có điều kiện công bố/lịch. Adapter không thay thế SQL Server.
- Browser: Chromium 154.0.8037.57 (Debian/Linux) headless, Node 24.19.0 trong cloud, Vite thật + phản hồi API có kiểm soát; bộ kiểm thử tại `muses-react/tests/browser/prd.mjs`. Không phải xác nhận DB thật.
- Có bài test SQL opt-in `npm run test:sql`, tạo DB dùng một lần, kiểm tra migration hai lần và hai yêu cầu xác nhận lịch đồng thời. Chưa chạy ở cloud vì không có SQL Server.
- Chưa có kết quả thực tế trên Safari, giọng TTS thật của macOS/điện thoại, hiệu năng SQL 1000 tác phẩm, hay phục hồi backup thật. Không đánh dấu các mục này là PASS.

Kiểm tra tự động hiện tại: backend 53 PASS + 1 bài SQL SKIP; web 17 PASS; browser fixture PASS. Hai app build production thành công trước kiểm tra cuối. Các kết quả này không xác nhận database trên máy người dùng.

## Ma trận FR

| FR   | Triển khai                                                                                                                   | Bằng chứng / giới hạn                                                        |
| ---- | ---------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------- |
| FR01 | `/api/catalog/artworks`, lọc tên/tác giả/chất liệu/bảo tàng hiện tại, phân trang 12                                          | API tham số hóa; browser kết hợp bộ lọc/trang. Chờ SQL 1000 bản ghi          |
| FR02 | Chi tiết chỉ công bố; tên dịch, ảnh, tác giả, năm, chất liệu, mô tả, nguồn/nguồn ảnh                                         | API guard; bản nháp trả 404; chờ live SQL                                    |
| FR03 | vi/en/zh/ja/ko; bản dịch công bố hoặc tiếng Việt; requestedLanguage/contentLanguage/isFallback                               | Unit + browser fallback Hàn→Việt; không tự dịch                              |
| FR04 | Web Speech; play/pause/resume/stop, chọn giọng/tốc độ, boundary highlighting                                                 | Test chọn giọng và browser sự kiện TTS giả lập; cần giọng thật trên thiết bị |
| FR05 | Chỉ lịch Confirmed, public museum, [start,end) giờ Việt Nam; không suy từ owner                                              | Boundary unit; live SQL test có owner khác current                           |
| FR06 | `/museums`, tìm tên, chi tiết và sắp xếp gần tôi                                                                             | Khoảng cách tính tại browser; GPS chỉ khi bấm nút                            |
| FR07 | OSM embed ghim theo DB; địa chỉ/liên kết luôn có, retry khi lỗi/timeout                                                      | Browser hướng đích + bố cục; cần kiểm tra provider thật và chặn mạng         |
| FR08 | Google Maps directions, destination=lat,lng của DB; không truyền vị trí khách                                                | Unit URL + browser                                                           |
| FR09 | Global Admin gate; API kiểm tra role bằng phiên cookie HttpOnly                                                              | API 401/403, auth tests; browser login form                                  |
| FR10 | API/GUI tác phẩm thật; Draft/Published/Hidden (xóa mềm); vi/ảnh bắt buộc; nguồn tác phẩm/bản dịch/ảnh tùy chọn trước công bố | API thiếu vi→409; browser lưu lỗi vẫn giữ form                               |
| FR11 | UNIQUE artwork/language; trạng thái bản dịch, nhập/duyệt thủ công, nghe thử                                                  | API/DB constraint; live SQL test duplicate và draft→Published                |
| FR12 | API/GUI bảo tàng thật; tọa độ/địa chỉ/nguồn/xác minh ghim; chặn ẩn khi có lịch                                               | Unit tọa độ + API guard; chờ live SQL                                        |
| FR13 | API/GUI lịch; ngày hợp lệ, nguồn/ngày xác minh/người sửa; SERIALIZABLE + locks                                               | Unit/API adapter; race thật chỉ được nghiệm thu sau `test:sql`               |
| FR14 | Tác giả/chất liệu/thể loại; chặn xóa đang dùng bằng FK                                                                       | Code + bài live SQL có test FK; chờ chạy thật                                |
| FR15 | Logout xóa AuthSessions, cookie cũ không truy cập Admin                                                                      | API auth test; bài live SQL lặp kiểm tra                                     |

## TC01–TC23 để nhóm nghiệm thu

Mỗi hàng cần ghi thêm **kết quả thực tế, tên người kiểm tra, phiên bản trình duyệt/OS, thời điểm** sau khi chạy local. Trạng thái chung: tự động như mô tả ở cột cuối; **chưa nghiệm thu local SQL/Safari**.

| TC  | Dữ liệu đầu vào / bước thực hiện                                                        | Kết quả mong đợi                                                         | Tự động hiện có                                              |
| --- | --------------------------------------------------------------------------------------- | ------------------------------------------------------------------------ | ------------------------------------------------------------ |
| 01  | Hiện vật Published “Nghiên cứu màu 01”; tìm chữ hoa/thường + tác giả/chất liệu/bảo tàng | Chỉ kết quả giao các điều kiện; phân trang đúng                          | API bind + browser; live SQL chờ                             |
| 02  | Từ khóa không tồn tại                                                                   | Danh sách rỗng, thông báo, không hiện dữ liệu giả                        | UI có empty state; cần local                                 |
| 03  | Draft ID; gọi trực tiếp API và URL detail                                               | API 404, không lộ mô tả                                                  | API + live SQL opt-in                                        |
| 04  | 5 mẫu có đủ vi/en/zh/ja/ko Published                                                    | Đúng tên/mô tả và nhãn UI, metadata không fallback                       | Data seed + UI dictionary test; nhóm duyệt câu dịch          |
| 05  | Yêu cầu ko khi chỉ vi Published hoặc ko còn Draft                                       | contentLanguage=vi, isFallback=true, thông báo Việt                      | API + browser + live SQL opt-in                              |
| 06  | Thiết bị không có voice tương ứng                                                       | Không dùng giọng khác; hiện chưa hỗ trợ                                  | Voice selection unit; cần thiết bị thật                      |
| 07  | Ngắt mạng API/TTS                                                                       | Lỗi + retry, nội dung đang có vẫn đọc được khi lỗi TTS                   | API failure + browser controlled failure; cần ngắt mạng thật |
| 08  | Bắt đầu đọc rồi đổi lang/artwork                                                        | Bản cũ dừng, không tự phát bản mới                                       | Lifecycle + browser cancellation giả lập                     |
| 09  | Confirmed start=today; end=null; museum public                                          | Hiện museum đúng, từ ngày hôm nay                                        | Boundary + live SQL opt-in                                   |
| 10  | end=today hoặc start=tomorrow                                                           | Không gắn nhãn hiện tại; không dùng lịch gần nhất                        | Boundary + live SQL opt-in                                   |
| 11  | Không có lịch hoặc chỉ Draft/Cancelled                                                  | Thông báo chưa có nơi hiện tại; owner không thay thế                     | Boundary + API + live SQL opt-in                             |
| 12  | Hai Confirmed chồng nhau cùng artwork, kể cả cùng museum; gửi đồng thời                 | Chỉ một yêu cầu thành công, yêu cầu còn lại 409; không có hai lịch trùng | Rule/API adapter; race SQL thật chờ                          |
| 13  | Museum A sở hữu; lịch hiện tại ở B; mở map và directions                                | Ghim và destination ở B                                                  | URL unit/browser; live SQL opt-in                            |
| 14  | Từ chối GPS trên /museums                                                               | Vẫn xem địa chỉ/ghim, tìm theo tên                                       | UI fallback triển khai; nhóm kiểm tra quyền trên máy         |
| 15  | Chặn OSM hoặc timeout                                                                   | Báo thử lại, địa chỉ và directions vẫn dùng được                         | Timer/error handler; nhóm kiểm tra provider thật             |
| 16  | Bấm directions ở museum có tọa độ cụ thể                                                | Google Maps nhận đúng lat,lng lưu                                        | Unit + browser                                               |
| 17  | Email/mật khẩu sai                                                                      | Lỗi chung; không lộ tài khoản tồn tại                                    | Auth API                                                     |
| 18  | Không cookie / cookie Visitor gọi GET/POST/PUT/DELETE Admin                             | 401/403; không lưu dữ liệu                                               | API tất cả verb                                              |
| 19  | Đăng xuất rồi dùng lại cookie cũ                                                        | Admin API 401                                                            | Auth API + live SQL opt-in                                   |
| 20  | Publish thiếu bản vi đã duyệt                                                           | 409, form giữ dữ liệu                                                    | API + browser lỗi lưu                                        |
| 21  | Tạo trùng artwork/lang                                                                  | 409, DB UNIQUE giữ 1 bản                                                 | API error mapping; live SQL opt-in                           |
| 22  | lat=91/lng=-181/địa chỉ rỗng/chưa xác minh ghim                                         | 400, không công khai                                                     | Unit + API validation                                        |
| 23  | Ẩn museum còn Confirmed end>today hoặc tương lai                                        | 409; giữ museum công khai                                                | API + live SQL opt-in                                        |

## NFR và công việc nghiệm thu còn lại

- NFR01: script `test:load`, 20 worker/200 requests, chỉ nhận kết quả khi có ≥1000 tác phẩm Published; p95≤2000ms. **Chưa đo SQL thật.**
- NFR02: browser fixture kiểm tra không cuộn ngang trên collection/detail/Admin ở 375/768/1440. Nhóm kiểm tra trang dữ liệu dài và Safari thực tế.
- NFR03: form có label, alt ảnh, trạng thái loading/error, focus trap modal/keyboard. Kiểm tra thủ công toàn bộ luồng bàn phím trước nghiệm thu.
- NFR04: scrypt; cookie HttpOnly; giới hạn login; backend role guard; query tham số; SQL admin tạm thời chỉ cho CLI; không lưu vị trí khách.
- NFR05: lỗi JSON code/message; không trả stack; TTS/map lỗi không xóa mô tả/địa chỉ.
- NFR06: `db:catalog` backup COPY_ONLY + checksum + VERIFYONLY trước schema; `db:restore-check` phục hồi thử riêng. **Cần chạy và lưu kết quả thực tế.**
- NFR07: nhóm điền Chrome/Safari phiên bản và thiết bị thực tế. Cloud chỉ chạy Chromium headless, không phải Safari.
- NFR08: ảnh SVG/bản dịch demo tự tạo có nhãn. Ảnh/ngữ liệu cũ giữ nguyên để nhóm kiểm tra nguồn/quyền; không coi tự động là đã cấp phép.

## Nhật ký thay đổi yêu cầu

| Ngày       | Thay đổi                                                                   | Lý do / tác động                                                                                        |
| ---------- | -------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------- |
| 29/10/2026 | Chuyển bộ mục tiêu fr→ko; giữ dữ liệu fr cũ trong DB, không dùng công khai | Theo PRD; API/UI/voice/seed/tests                                                                       |
| 29/10/2026 | Bỏ dịch tự động khỏi luồng MVP, không gọi LibreTranslate từ API công khai  | PRD yêu cầu bản dịch nhập và duyệt thủ công; compose/provider cũ giữ làm tham khảo, không bắt buộc chạy |
| 29/10/2026 | Thêm publication, museums, owner riêng, display schedules, nguồn và audit  | BR01–BR13; schema additive, API, Admin, web, tests                                                      |
| 29/10/2026 | Thay workspace nội dung localStorage bằng API và role guard                | FR09–FR15; giữ màu sắc/layout dashboard; bỏ menu demo ngoài scope khỏi điều hướng chính                 |
| 29/10/2026 | Bộ minh họa 20 tác phẩm/3 bảo tàng/5 nội dung ×5 ngôn ngữ                  | Demo có nhãn, không tự nhận là thông tin trưng bày thật                                                 |

Không tuyên bố hoàn thành nghiệm thu P0/NFR khi các kiểm tra SQL thật, thiết bị và dữ liệu thực chưa được nhóm ghi nhận.

Thay đổi theo yêu cầu người dùng 29/10/2026: bỏ điều kiện bắt buộc nguồn thông tin tác phẩm, nguồn bản dịch và nguồn/quyền ảnh khi công bố. Giữ các trường để nhập bổ sung; không thay đổi nguồn xác nhận lịch trưng bày hoặc điều kiện công khai bảo tàng.

Cập nhật UX 29/10/2026: Artworks nhập tên/mô tả tiếng Việt tại chỗ, tự điền bản cũ và lưu/công bố một lần. Điều kiện nội dung tiếng Việt vẫn được kiểm tra; API lưu tác phẩm/ảnh/bản tiếng Việt trong cùng transaction, giữ bản dịch khác và metadata audio/nguồn của bản Việt. Test API kiểm tra tạo/sửa/công bố, nháp chưa đủ nội dung và rollback; test browser kiểm tra không cần chuyển trang. Kiểm thử SQL opt-in bổ sung trigger gây lỗi để xác nhận rollback trên DB dùng một lần; vẫn cần chạy local SQL.
