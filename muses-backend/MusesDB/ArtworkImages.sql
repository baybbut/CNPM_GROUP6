USE MusesMuseumDB;
GO

-- Danh sách ghép tên tác phẩm với đường dẫn ảnh.
DECLARE @ImageMap TABLE (
    ArtworkName NVARCHAR(250) PRIMARY KEY,
    ImageURL NVARCHAR(500) NOT NULL
);

INSERT INTO @ImageMap (ArtworkName, ImageURL)
VALUES
    (
        N'Em Thúy',
        N'/images/tranh/EMTHUY.jpeg'
    ),
    (
        N'Giao Mùa',
        N'/images/tranh/tranhsonmai/GIAOMUA.jpg'
    ),
    (
        N'Mùa hè',
        N'/images/tranh/tranhsonmai/MUAHE.jpg'
    ),
    (
        N'Thiếu nữ bên ao sen',
        N'/images/tranh/tranhsonmai/THIEUNUBENAOSEN.jpg'
    ),
    (
        N'Công chúa Mai An Tiêm',
        N'/images/tranh/tranhsonmai/CONGCHUAMAIATIEM.jpg'
    ),
    (
        N'Những đứa trẻ trâu',
        N'/images/tranh/tranhsonmai/NHUNGDUATRETRAU.jpg'
    ),
    (
        N'Múa Vui',
        N'/images/tranh/tranhsonmai/MUAVUI.jpg'
    ),
    (
        N'Vinh Quy Bái Tổ',
        N'/images/tranh/tranhsonmai/VINHQUYBAITO.jpg'
    ),
    (
        N'Vườn Xuân Trung Nam Bắc',
        N'/images/tranh/tranhsonmai/VUONXUANTRUNGNAMBAC.png'
    ),
    (
        N'Thiếu nữ bên hoa phù dung',
        N'/images/tranh/tranhsonmai/THIEUNUBENHOAPHUDUNG.jpg'
    ),
    (
        N'Kết nạp đảng ở Điện Biên Phủ',
        N'/images/tranh/tranhsonmai/KETNAPDANGODIENBIENPHU.jpeg'
    ),
    (
        N'Xuân Hồ Gươm',
        N'/images/tranh/tranhsonmai/XUANHOGUOM.jpeg'
    ),
    (
        N'Điệu múa cổ',
        N'/images/tranh/tranhsonmai/DIEUMUACO.jpg'
    ),
    (
        N'Thiếu nữ bên hoa huệ',
        N'/images/tranh/THIEUNUBENHOAHUE.jpg'
    ),
    (
        N'Hai thiếu nữ và em bé',
        N'/images/tranh/HAITHIEUNUVAEMBE.jpeg'
    ),
    (
        N'Thiếu nữ bên hoa sen',
        N'/images/tranh/THIEUNUBENHOASEN.jpg'
    ),
    (
        N'Hòa nhạc trong gia đình ở Huế',
        N'/images/tranh/HOANHACTRONGGIADINHOHUE.jpg'
    ),
    (
        N'Hà Nội vào thu',
        N'/images/tranh/HANOIVAOTHU.jpg'
    ),
    (
        N'Xuân về hội tụ',
        N'/images/tranh/XUANVEHOITU.jpg'
    ),
    (N'Thiếu nữ bên đầm sen', N'/images/tranh/tranhsonmai/THIEUNUBENDAMSEN.jpg'),
    (N'Thành đồng tổ quốc', N'/images/tranh/tranhsonmai/THANHDONGTOQUOC.png'),
    (N'Trường Ca Phố', N'/images/tranh/tranhsonmai/TRUONGCAPHO.jpg'),
    (N'Văn Xương Đạo Lộ', N'/images/tranh/tranhsonmai/VANXUONGDAOLO.jpg'),
    (N'Trên cánh đồng', N'/images/tranh/TRENCANHDONG.jpg'),
    (N'Phong cảnh mùa đông', N'/images/tranh/PHONGCANHMUADONG.jpg'),
    (N'Cánh cửa chạm rồng', N'/images/tranh/Dieukhac/CANHCUACHAMRONG.png'),
    (N'Đợi anh về', N'/images/tranh/Dieukhac/DOIANHVE.png'),
    (N'Cuộc sống và tình yêu', N'/images/tranh/Dieukhac/CUOCSONGVATINHYEU.png'),
    (N'Không gian số 4', N'/images/tranh/Dieukhac/KHONGGIANSO4.png'),
    (N'Hưng Đạo Vương khán bình thư', N'/images/tranh/Dieukhac/HUNGDAO.png'),
    (N'Tiên tắm đầm sen', N'/images/tranh/Dieukhac/TIENTAMDAMSEN.png'),
    (N'Tượng Quan Âm nghìn mắt nghìn tay', N'/images/tranh/Dieukhac/TUONGQUANAMNGHINMATNGHINTAY.jpg');

-- Mỗi tên trong danh sách phải khớp đúng một tác phẩm.
IF EXISTS (
    SELECT m.ArtworkName
    FROM @ImageMap AS m
    LEFT JOIN dbo.Artworks AS a
        ON a.ArtworkName = m.ArtworkName
    GROUP BY m.ArtworkName
    HAVING COUNT(a.ArtworkID) <> 1
)
BEGIN
    SELECT
        m.ArtworkName,
        COUNT(a.ArtworkID) AS MatchCount
    FROM @ImageMap AS m
    LEFT JOIN dbo.Artworks AS a
        ON a.ArtworkName = m.ArtworkName
    GROUP BY m.ArtworkName
    HAVING COUNT(a.ArtworkID) <> 1;

    THROW 50001,
        N'Có tên tác phẩm không khớp hoặc bị trùng. Chưa thêm ảnh.',
        1;
END;

SET XACT_ABORT ON;
BEGIN TRANSACTION;

-- Repair only the known legacy seed paths. Preserve custom images and primary choices.
UPDATE i
SET ImageURL = m.ImageURL
FROM dbo.ArtworkImages AS i
JOIN dbo.Artworks AS a ON a.ArtworkID = i.ArtworkID
JOIN @ImageMap AS m ON m.ArtworkName = a.ArtworkName
WHERE
    (m.ArtworkName = N'Kết nạp đảng ở Điện Biên Phủ' AND i.ImageURL = N'/images/tranh/KETNAPDANGODIENBIENPHU.jpeg') OR
    (m.ArtworkName = N'Xuân Hồ Gươm' AND i.ImageURL = N'/images/tranh/XUANHOGUOM.jpeg') OR
    (m.ArtworkName = N'Điệu múa cổ' AND i.ImageURL = N'/images/tranh/DIEUMUACO.jpg') OR
    (m.ArtworkName = N'Hòa nhạc trong gia đình ở Huế' AND i.ImageURL = N'/images/tranh/HOANH ACTRONGGIADINHOHUE.jpg');

-- Thêm ảnh chưa có.
-- Nếu tác phẩm đã có ảnh chính, ảnh mới được thêm là ảnh phụ.
INSERT INTO dbo.ArtworkImages (
    ArtworkID,
    ImageURL,
    IsPrimary,
    DisplayOrder
)
SELECT
    a.ArtworkID,
    m.ImageURL,

    CASE
        WHEN EXISTS (
            SELECT 1
            FROM dbo.ArtworkImages AS existing
            WHERE existing.ArtworkID = a.ArtworkID
              AND existing.IsPrimary = 1
        )
        THEN 0
        ELSE 1
    END,

    1
FROM @ImageMap AS m
JOIN dbo.Artworks AS a
    ON a.ArtworkName = m.ArtworkName
WHERE NOT EXISTS (
    SELECT 1
    FROM dbo.ArtworkImages AS i
    WHERE i.ArtworkID = a.ArtworkID
      AND i.ImageURL = m.ImageURL
);

COMMIT TRANSACTION;

-- Kiểm tra những ảnh trong danh sách đã được gắn.
SELECT
    a.ArtworkID,
    a.ArtworkName,
    i.ImageURL,
    i.IsPrimary
FROM @ImageMap AS m
JOIN dbo.Artworks AS a
    ON a.ArtworkName = m.ArtworkName
JOIN dbo.ArtworkImages AS i
    ON i.ArtworkID = a.ArtworkID
    AND i.ImageURL = m.ImageURL
ORDER BY a.ArtworkID;