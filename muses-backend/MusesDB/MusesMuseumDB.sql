-- 0. Kiểm tra và xóa database cũ nếu đã tồn tại để tránh xung đột
USE master;
GO

IF EXISTS (SELECT * FROM sys.databases WHERE name = 'MusesMuseumDB')
BEGIN
    ALTER DATABASE MusesMuseumDB SET SINGLE_USER WITH ROLLBACK IMMEDIATE;
    DROP DATABASE MusesMuseumDB;
END
GO

-- 1. Tạo cơ sở dữ liệu mới
CREATE DATABASE MusesMuseumDB;
GO

USE MusesMuseumDB;
GO

-- I. TẠO CÁC BẢNG ĐỘC LẬP (KHÔNG CÓ KHÓA NGOẠI)

-- 1. Bảng Ngôn ngữ (Phục vụ thuyết minh đa ngôn ngữ cho Web & Mobile)
CREATE TABLE Languages (
    LanguageID INT IDENTITY(1,1) PRIMARY KEY,
    LanguageCode VARCHAR(10) UNIQUE NOT NULL, -- 'vi', 'en',...
    LanguageName NVARCHAR(100) NOT NULL       -- 'Tiếng Việt', 'English'
);
GO

-- 2. Bảng Danh mục / Loại tác phẩm
CREATE TABLE Categories (
    CategoryID INT IDENTITY(1,1) PRIMARY KEY,
    CategoryName NVARCHAR(100) UNIQUE NOT NULL, 
    Description NVARCHAR(500) NULL
);
GO

-- 3. Bảng Họa sĩ / Tác giả
CREATE TABLE Artists (
    ArtistID INT IDENTITY(1,1) PRIMARY KEY,
    ArtistName NVARCHAR(200) NOT NULL,
    Biography NVARCHAR(MAX) NULL
);
GO

-- 4. Bảng Quản trị viên hệ thống (Users)
CREATE TABLE Users (
    UserID INT IDENTITY(1,1) PRIMARY KEY,
    FullName NVARCHAR(150) NOT NULL,
    Email VARCHAR(255) UNIQUE NOT NULL,
    PasswordHash NVARCHAR(500) NOT NULL,
    Role VARCHAR(30) DEFAULT 'Editor',        
    IsActive BIT DEFAULT 1,
    CreatedAt DATETIME2 DEFAULT SYSDATETIME()
);
GO

-- II. TẠO CÁC BẢNG CÓ KHÓA NGOẠI

-- 5. Bảng Tác phẩm chính (Artworks)
CREATE TABLE Artworks (
    ArtworkID INT IDENTITY(1,1) PRIMARY KEY,
    ArtworkName NVARCHAR(250) NOT NULL,
    CategoryID INT NOT NULL,
    ArtistID INT NOT NULL,
    Material NVARCHAR(200) NULL,             -- Chất liệu
    CreationPeriod NVARCHAR(150) NULL,       -- Năm / Giai đoạn sáng tác
    Dimensions NVARCHAR(100) NULL,           -- Kích thước
    IsNationalTreasure BIT DEFAULT 0,        -- 0: Thường, 1: Bảo vật quốc gia
    TreasureYear INT NULL,                   -- Năm công nhận bảo vật
    Notes NVARCHAR(MAX) NULL,                -- Ghi chú thêm
    CONSTRAINT FK_Artworks_Categories FOREIGN KEY (CategoryID) REFERENCES Categories(CategoryID),
    CONSTRAINT FK_Artworks_Artists FOREIGN KEY (ArtistID) REFERENCES Artists(ArtistID)
);
GO

-- 6. Bảng Hình ảnh tác phẩm (Hỗ trợ nhiều góc chụp/ảnh cho 1 tác phẩm)
CREATE TABLE ArtworkImages (
    ImageID INT IDENTITY(1,1) PRIMARY KEY,
    ArtworkID INT NOT NULL,
    ImageURL NVARCHAR(500) NOT NULL,
    IsPrimary BIT DEFAULT 0,                 -- 1: Ảnh đại diện chính
    DisplayOrder INT DEFAULT 1,
    CONSTRAINT FK_ArtworkImages_Artworks FOREIGN KEY (ArtworkID) REFERENCES Artworks(ArtworkID) ON DELETE CASCADE
);
GO

-- 7. Bảng Thuyết minh đa ngôn ngữ (ArtworkDescriptions)
CREATE TABLE ArtworkDescriptions (
    DescriptionID INT IDENTITY(1,1) PRIMARY KEY,
    ArtworkID INT NOT NULL,
    LanguageID INT NOT NULL,
    ShortDescription NVARCHAR(1000) NULL,
    FullDescription NVARCHAR(MAX) NULL,
    AudioURL NVARCHAR(500) NULL,             -- Link file âm thanh thuyết minh tự động[cite: 28]
    CONSTRAINT FK_ArtworkDescriptions_Artworks FOREIGN KEY (ArtworkID) REFERENCES Artworks(ArtworkID) ON DELETE CASCADE,
    CONSTRAINT FK_ArtworkDescriptions_Languages FOREIGN KEY (LanguageID) REFERENCES Languages(LanguageID),
    CONSTRAINT UQ_Artwork_Language UNIQUE (ArtworkID, LanguageID) 
);
GO


-- III. CHÈN TOÀN BỘ DỮ LIỆU MẪU TỪ TÀI LIỆU

-- 1. Thêm Ngôn ngữ
INSERT INTO Languages (LanguageCode, LanguageName) VALUES 
('vi', N'Tiếng Việt'),
('en', N'English'),
('fr', N'Tiếng Pháp'),
('ja', N'Tiếng Nhật'),
('zh', N'Tiếng Trung');

-- 2. Thêm Danh mục loại tác phẩm
INSERT INTO Categories (CategoryName, Description) VALUES 
(N'Tranh sơn mài', N'Các tác phẩm nghệ thuật làm từ chất liệu sơn mài truyền thống Việt Nam.'),
(N'Tranh sơn dầu', N'Các tác phẩm tranh vẽ bằng chất liệu sơn dầu.'),
(N'Tác phẩm điêu khắc', N'Các tác phẩm điêu khắc trên gỗ, đồng, gốm.');

-- 3. Thêm Họa sĩ / Tác giả
INSERT INTO Artists (ArtistName, Biography) VALUES 
(N'Bùi Trọng Dư', N'Họa sĩ nổi tiếng với các tác phẩm sơn mài về đề tài thiên nhiên và thiếu nữ.'),
(N'Ngô Bá Công', N'Họa sĩ sơn mài với nhiều tác phẩm độc đáo về đề tài lịch sử và dân gian.'),
(N'Nguyễn Gia Trí', N'Đại sư của nghệ thuật sơn mài Việt Nam, tác giả của bảo vật quốc gia.'),
(N'Nguyễn Sáng', N'Họa sĩ gạo cội của nền mỹ thuật hiện đại Việt Nam, nổi tiếng với các tác phẩm kháng chiến và bảo vật quốc gia.'),
(N'Nguyễn Tư Nghiêm', N'Một trong tứ trụ của mỹ thuật hiện đại Việt Nam (Nghiêm - Liên - Sáng - Phái).'),
(N'Giáp Văn Tuấn', N'Họa sĩ đương đại với các tác phẩm về phố phường và không gian văn hóa.'),
(N'Tô Ngọc Vân', N'Danh họa lớn của mỹ thuật Đông Dương, tác giả bức Thiếu nữ bên hoa huệ.'),
(N'Trần Văn Cần', N'Danh họa nổi tiếng, nguyên Tổng thư ký Hội Mỹ thuật Việt Nam, tác giả bức Em Thúy.'),
(N'Alexander Yakovlev', N'Họa sĩ người Nga sáng tác nhiều tác phẩm giá trị về văn hóa và con người Việt Nam đầu thế kỷ 20.'),
(N'Phạm Hoàng Minh', N'Họa sĩ chuyên về phong cảnh mùa và không gian phố thị.'),
(N'Ngụy Đình Hà', N'Họa sĩ chuyên khai thác mảng đề tài mùa xuân và hội tụ văn hóa.'),
(N'Các nghệ nhân điêu khắc dân gian', N'Các nghệ nhân vô danh thời phong kiến tạo nên những kiệt tác kiến trúc, điêu khắc đình chùa.'),
(N'Mai Thu Vân', N'Nhà điêu khắc nổi tiếng với các tác phẩm tượng đồng mang cảm xúc sâu lắng.'),
(N'Phan Gia Hương', N'Nhà điêu khắc với các tác phẩm chất liệu gỗ mang đậm tính triết lý nhân sinh.'),
(N'Nguyễn Bảo Toàn', N'Nghệ sĩ điêu khắc và gốm sứ đương đại tên tuổi.'),
(N'Nghệ nhân gốm dân gian', N'Các nghệ nhân chế tác gốm cổ truyền thống.'),
(N'Nghệ nhân dân gian', N'Các nghệ nhân điêu khắc truyền thống dân gian Việt Nam.'),
(N'Trương tiên sinh', N'Nghệ nhân thế kỷ 17, tác giả kiệt tác Tượng Quan Âm nghìn mắt nghìn tay.');

-- 4. Thêm Tác phẩm 
-- 4.1. Tranh sơn mài
INSERT INTO Artworks (ArtworkName, CategoryID, ArtistID, Material, CreationPeriod, Dimensions, IsNationalTreasure, TreasureYear, Notes) VALUES 
(N'Giao Mùa', 1, (SELECT ArtistID FROM Artists WHERE ArtistName = N'Bùi Trọng Dư'), N'Sơn Mài', N'2018', N'50x50 (cm)', 0, NULL, N''),
(N'Mùa hè', 1, (SELECT ArtistID FROM Artists WHERE ArtistName = N'Bùi Trọng Dư'), N'Sơn Mài', N'2018', N'40x60 (cm)', 0, NULL, N''),
(N'Thiếu nữ bên ao sen', 1, (SELECT ArtistID FROM Artists WHERE ArtistName = N'Bùi Trọng Dư'), N'Sơn mài', N'2019', N'100x120 (cm)', 0, NULL, N''),
(N'Công chúa Mai An Tiêm', 1, (SELECT ArtistID FROM Artists WHERE ArtistName = N'Ngô Bá Công'), N'Sơn mài trên gỗ', N'Không rõ', N'100x100 (cm)', 0, NULL, N''),
(N'Những đứa trẻ trâu', 1, (SELECT ArtistID FROM Artists WHERE ArtistName = N'Ngô Bá Công'), N'Sơn mài trên gỗ', N'Không rõ', N'120x270 (3 tấm)', 0, NULL, N''),
(N'Múa Vui', 1, (SELECT ArtistID FROM Artists WHERE ArtistName = N'Ngô Bá Công'), N'Sơn mài trên gỗ', N'Không rõ', N'100x100 (cm)', 0, NULL, N''),
(N'Vinh Quy Bái Tổ', 1, (SELECT ArtistID FROM Artists WHERE ArtistName = N'Ngô Bá Công'), N'Sơn mài trên gỗ', N'Không rõ', N'90x120 (cm)', 0, NULL, N''),
(N'Thiếu nữ bên đầm sen', 1, (SELECT ArtistID FROM Artists WHERE ArtistName = N'Nguyễn Gia Trí'), N'Sơn mài truyền thống', N'Cuối thập niên 1930 - đầu 1940', N'120x210 (cm)', 0, NULL, N''),
(N'Vườn Xuân Trung Nam Bắc', 1, (SELECT ArtistID FROM Artists WHERE ArtistName = N'Nguyễn Gia Trí'), N'Sơn mài truyền thống', N'1969-1989', N'540x200 (cm)', 1, 2013, N'Ghép lại từ 9 tấm vóc.'),
(N'Thiếu nữ bên hoa phù dung', 1, (SELECT ArtistID FROM Artists WHERE ArtistName = N'Nguyễn Gia Trí'), N'Sơn mài truyền thống', N'1944', N'71x102 (cm)', 0, NULL, N''),
(N'Kết nạp đảng ở Điện Biên Phủ', 1, (SELECT ArtistID FROM Artists WHERE ArtistName = N'Nguyễn Sáng'), N'Sơn mài', N'1963', N'112,3x180 (cm)', 1, 2013, N''),
(N'Thành đồng tổ quốc', 1, (SELECT ArtistID FROM Artists WHERE ArtistName = N'Nguyễn Sáng'), N'Sơn mài', N'1967-1978', N'145x245 (cm)', 1, 2017, N''),
(N'Xuân Hồ Gươm', 1, (SELECT ArtistID FROM Artists WHERE ArtistName = N'Nguyễn Tư Nghiêm'), N'Sơn mài', N'1957', N'70,4x150,7 (cm)', 0, NULL, N''),
(N'Điệu múa cổ', 1, (SELECT ArtistID FROM Artists WHERE ArtistName = N'Nguyễn Tư Nghiêm'), N'Sơn mài', N'1970', N'49x74 (cm)', 0, NULL, N''),
(N'Trường Ca Phố', 1, (SELECT ArtistID FROM Artists WHERE ArtistName = N'Giáp Văn Tuấn'), N'Sơn mài', N'2025', N'244x122 (cm)', 0, NULL, N''),
(N'Văn Xương Đạo Lộ', 1, (SELECT ArtistID FROM Artists WHERE ArtistName = N'Giáp Văn Tuấn'), N'Sơn mài', N'2025', N'100x150 (cm)', 0, NULL, N'');

-- 4.2. Tranh sơn dầu
INSERT INTO Artworks (ArtworkName, CategoryID, ArtistID, Material, CreationPeriod, Dimensions, IsNationalTreasure, TreasureYear, Notes) VALUES 
(N'Thiếu nữ bên hoa huệ', 2, (SELECT ArtistID FROM Artists WHERE ArtistName = N'Tô Ngọc Vân'), N'Sơn dầu', N'1943', N'60x45 (cm)', 0, NULL, N''),
(N'Hai thiếu nữ và em bé', 2, (SELECT ArtistID FROM Artists WHERE ArtistName = N'Tô Ngọc Vân'), N'Sơn dầu', N'1944', N'102x71,8 (cm)', 0, NULL, N''),
(N'Thiếu nữ bên hoa sen', 2, (SELECT ArtistID FROM Artists WHERE ArtistName = N'Tô Ngọc Vân'), N'Sơn dầu', N'1944', N'Đang cập nhật', 0, NULL, N''),
(N'Em Thúy', 2, (SELECT ArtistID FROM Artists WHERE ArtistName = N'Trần Văn Cần'), N'Sơn dầu', N'1943', N'60x45 (cm)', 1, 2013, N''),
(N'Hòa nhạc trong gia đình ở Huế', 2, (SELECT ArtistID FROM Artists WHERE ArtistName = N'Alexander Yakovlev'), N'Sơn dầu', N'1917-1918', N'90x147 (cm)', 0, NULL, N''),
(N'Trên cánh đồng', 2, (SELECT ArtistID FROM Artists WHERE ArtistName = N'Alexander Yakovlev'), N'Sơn dầu trên vải toan', N'1931-1932', N'50x60 (cm)', 0, NULL, N''),
(N'Hà Nội vào thu', 2, (SELECT ArtistID FROM Artists WHERE ArtistName = N'Phạm Hoàng Minh'), N'Sơn dầu', N'Không rõ', N'110x100 (cm)', 0, NULL, N''),
(N'Phong cảnh mùa đông', 2, (SELECT ArtistID FROM Artists WHERE ArtistName = N'Phạm Hoàng Minh'), N'Sơn dầu', N'Không rõ', N'100x110 (cm)', 0, NULL, N''),
(N'Xuân về hội tụ', 2, (SELECT ArtistID FROM Artists WHERE ArtistName = N'Ngụy Đình Hà'), N'Sơn dầu', N'2006', N'100x100 (cm)', 0, NULL, N'');

-- 4.3. Tác phẩm điêu khắc
INSERT INTO Artworks (ArtworkName, CategoryID, ArtistID, Material, CreationPeriod, Dimensions, IsNationalTreasure, TreasureYear, Notes) VALUES 
(N'Cánh cửa chạm rồng', 3, (SELECT ArtistID FROM Artists WHERE ArtistName = N'Các nghệ nhân điêu khắc dân gian'), N'Gỗ liêm', N'Thế kỷ 17', N'Chưa công bố', 1, 2017, N''),
(N'Đợi anh về', 3, (SELECT ArtistID FROM Artists WHERE ArtistName = N'Mai Thu Vân'), N'Đồng', N'2000', N'150x220 (cm)', 0, NULL, N'VNFAM'),
(N'Cuộc sống và tình yêu', 3, (SELECT ArtistID FROM Artists WHERE ArtistName = N'Phan Gia Hương'), N'Gỗ', N'1995', N'Chưa công bố', 0, NULL, N''),
(N'Không gian số 4', 3, (SELECT ArtistID FROM Artists WHERE ArtistName = N'Nguyễn Bảo Toàn'), N'Gốm', N'Chưa công bố', N'Chưa công bố', 0, NULL, N''),
(N'Hưng Đạo Vương khán bình thư', 3, (SELECT ArtistID FROM Artists WHERE ArtistName = N'Nghệ nhân gốm dân gian'), N'Gốm', N'Chưa công bố', N'30x15x16 (cm)', 0, NULL, N''),
(N'Tiên tắm đầm sen', 3, (SELECT ArtistID FROM Artists WHERE ArtistName = N'Nghệ nhân dân gian'), N'Gỗ', N'Chưa công bố', N'Chưa công bố', 0, NULL, N'VNFAM'),
(N'Tượng Quan Âm nghìn mắt nghìn tay', 3, (SELECT ArtistID FROM Artists WHERE ArtistName = N'Trương tiên sinh'), N'Gỗ Mít', N'1656', N'365x210 (cm)', 1, 2012, N'Bảo vật quốc gia Việt Nam 2012');

-- 5. Thêm dữ liệu mẫu thuyết minh tự động đa ngôn ngữ
INSERT INTO ArtworkDescriptions (ArtworkID, LanguageID, ShortDescription, FullDescription, AudioURL) VALUES 
((SELECT ArtworkID FROM Artworks WHERE ArtworkName = N'Vườn Xuân Trung Nam Bắc'), 1, N'Bảo vật quốc gia Vườn Xuân Trung Nam Bắc của danh họa Nguyễn Gia Trí.', N'Đây là kiệt tác tổng hòa văn hóa ba miền, được họa sĩ Nguyễn Gia Trí thực hiện kéo dài gần 20 năm từ 1969 đến 1989 trên 9 tấm vóc.', '/audio/vuon_xuan_vi.mp3'),
((SELECT ArtworkID FROM Artworks WHERE ArtworkName = N'Vườn Xuân Trung Nam Bắc'), 2, N'National Treasure: Spring Garden of Central, North and South by Nguyen Gia Tri.', N'A masterpiece representing the culture of three regions, meticulously crafted over nearly 20 years from 1969 to 1989.', '/audio/vuon_xuan_en.mp3'),
((SELECT ArtworkID FROM Artworks WHERE ArtworkName = N'Thiếu nữ bên hoa huệ'), 1, N'Tác phẩm sơn dầu kinh điển Thiếu nữ bên hoa huệ của họa sĩ Tô Ngọc Vân.', N'Bức tranh khắc họa vẻ đẹp thanh tao, dịu dàng của thiếu nữ Hà Thành bên đóa hoa huệ trắng tinh khôi.', '/audio/thieu_nu_hoa_hue_vi.mp3');
GO

-- IV. BO SUNG MO TA VA LICH SU TAC PHAM
-- Phan duoi day chay sau khi da tao bang va nap du lieu co ban.

USE [MusesMuseumDB];
GO

IF OBJECT_ID(N'dbo.Artworks', N'U') IS NULL
    THROW 50001, N'Không tìm thấy dbo.Artworks. Hãy chọn đúng database.', 1;
IF OBJECT_ID(N'dbo.ArtworkDescriptions', N'U') IS NULL
    THROW 50002, N'Không tìm thấy dbo.ArtworkDescriptions. Hãy chọn đúng database.', 1;
IF OBJECT_ID(N'dbo.Languages', N'U') IS NULL
    THROW 50003, N'Không tìm thấy dbo.Languages. Hãy chọn đúng database.', 1;
GO

IF COL_LENGTH('dbo.ArtworkDescriptions', 'HistoryDescription') IS NULL
BEGIN
    ALTER TABLE dbo.ArtworkDescriptions
    ADD HistoryDescription NVARCHAR(MAX) NULL;
END;
GO

SET NOCOUNT ON;

DECLARE @ViLanguageID INT;
SELECT @ViLanguageID = LanguageID
FROM dbo.Languages
WHERE LanguageCode = 'vi';

IF @ViLanguageID IS NULL
    THROW 50004, N'Không tìm thấy LanguageCode = vi trong dbo.Languages.', 1;

DECLARE @Descriptions TABLE
(
    ArtworkName NVARCHAR(250) NOT NULL PRIMARY KEY,
    ShortDescription NVARCHAR(1000) NOT NULL,
    FullDescription NVARCHAR(MAX) NOT NULL,
    HistoryDescription NVARCHAR(MAX) NULL
);

INSERT INTO @Descriptions (ArtworkName, ShortDescription, FullDescription, HistoryDescription)
VALUES
(N'Giao Mùa',
 N'Tác phẩm sơn mài Giao Mùa của họa sĩ Bùi Trọng Dư, được ghi nhận sáng tác năm 2018.',
 N'Giao Mùa là tác phẩm sơn mài của họa sĩ Bùi Trọng Dư, được ghi nhận sáng tác năm 2018, kích thước 50 x 50 cm. Tên tác phẩm gợi nhắc thời khắc chuyển tiếp giữa các mùa. Phân tích cụ thể về bố cục, màu sắc và hình tượng cần được đối chiếu với ảnh tác phẩm gốc.',
 NULL),
(N'Mùa hè',
 N'Tác phẩm sơn mài Mùa hè của họa sĩ Bùi Trọng Dư, sáng tác năm 2018.',
 N'Mùa hè là tác phẩm sơn mài của họa sĩ Bùi Trọng Dư, được ghi nhận sáng tác năm 2018, kích thước 40 x 60 cm. Diễn giải chi tiết về hình tượng và màu sắc cần được hoàn thiện dựa trên ảnh tác phẩm và tư liệu của đơn vị lưu giữ.',
 NULL),
(N'Thiếu nữ bên ao sen',
 N'Tác phẩm sơn mài Thiếu nữ bên ao sen của họa sĩ Bùi Trọng Dư, sáng tác năm 2019.',
 N'Thiếu nữ bên ao sen là tác phẩm sơn mài của họa sĩ Bùi Trọng Dư, được ghi nhận sáng tác năm 2019, kích thước 100 x 120 cm. Tên tác phẩm cho biết hình tượng thiếu nữ gắn với không gian ao sen; các chi tiết về bố cục và ý nghĩa cần được xác nhận qua ảnh và tư liệu chuyên môn.',
 NULL),
(N'Công chúa Mai An Tiêm',
 N'Tác phẩm sơn mài trên gỗ của họa sĩ Ngô Bá Công.',
 N'Công chúa Mai An Tiêm là tác phẩm sơn mài trên gỗ của họa sĩ Ngô Bá Công, kích thước được ghi nhận là 100 x 100 cm. Tên tác phẩm gợi liên hệ với nhân vật Mai An Tiêm trong truyện kể dân gian Việt Nam. Năm sáng tác chưa được xác định trong dữ liệu.',
 NULL),
(N'Những đứa trẻ trâu',
 N'Tác phẩm sơn mài trên gỗ của họa sĩ Ngô Bá Công, kích thước 120 x 270 cm.',
 N'Những đứa trẻ trâu là tác phẩm sơn mài trên gỗ của họa sĩ Ngô Bá Công. Dữ liệu ghi kích thước 120 x 270 cm gồm ba tấm. Năm sáng tác và tư liệu chi tiết về quá trình hình thành chưa được cung cấp.',
 NULL),
(N'Múa Vui',
 N'Tác phẩm sơn mài trên gỗ của họa sĩ Ngô Bá Công, kích thước 100 x 100 cm.',
 N'Múa Vui là tác phẩm sơn mài trên gỗ của họa sĩ Ngô Bá Công, kích thước 100 x 100 cm. Năm sáng tác và lịch sử trưng bày chưa có trong dữ liệu. Phần diễn giải hình tượng cần được bổ sung sau khi đối chiếu hình ảnh gốc.',
 NULL),
(N'Vinh Quy Bái Tổ',
 N'Tác phẩm sơn mài trên gỗ của họa sĩ Ngô Bá Công, kích thước 90 x 120 cm.',
 N'Vinh Quy Bái Tổ là tác phẩm sơn mài trên gỗ của họa sĩ Ngô Bá Công, kích thước 90 x 120 cm. Tên tác phẩm gắn với thành ngữ chỉ việc người đỗ đạt trở về quê nhà vinh quy. Năm sáng tác và lịch sử cụ thể của tác phẩm chưa có trong dữ liệu.',
 NULL),
(N'Thiếu nữ bên đầm sen',
 N'Tác phẩm sơn mài truyền thống của họa sĩ Nguyễn Gia Trí.',
 N'Thiếu nữ bên đầm sen là tác phẩm sơn mài truyền thống của họa sĩ Nguyễn Gia Trí. Dữ liệu hiện có ghi giai đoạn cuối thập niên 1930 đến đầu thập niên 1940 và kích thước 120 x 210 cm. Nguồn gốc và lịch sử sưu tập cần được xác minh từ hồ sơ tác phẩm.',
 NULL),
(N'Vườn Xuân Trung Nam Bắc',
 N'Tác phẩm sơn mài của Nguyễn Gia Trí, được ghi nhận thực hiện trong giai đoạn 1969–1989.',
 N'Vườn Xuân Trung Nam Bắc là tác phẩm sơn mài của Nguyễn Gia Trí, được ghi nhận thực hiện trong giai đoạn 1969–1989. Dữ liệu hiện có ghi tác phẩm được ghép từ chín tấm vóc và đánh dấu là bảo vật quốc gia năm 2013. Nên đối chiếu thông tin công nhận với hồ sơ di sản chính thức.',
 N'Dữ liệu nguồn ghi tác phẩm được thực hiện trong giai đoạn 1969–1989, ghép từ chín tấm vóc và được công nhận là bảo vật quốc gia năm 2013. Các chi tiết về quá trình bảo quản, sở hữu và trưng bày cần được xác minh từ hồ sơ chính thức.'),
(N'Thiếu nữ bên hoa phù dung',
 N'Tác phẩm sơn mài truyền thống của họa sĩ Nguyễn Gia Trí, ghi nhận năm sáng tác 1944.',
 N'Thiếu nữ bên hoa phù dung là tác phẩm sơn mài truyền thống của Nguyễn Gia Trí, được ghi nhận sáng tác năm 1944, kích thước 71 x 102 cm. Phân tích hình tượng và lịch sử sở hữu cần được đối chiếu với hồ sơ hoặc tư liệu của đơn vị lưu giữ.',
 NULL),
 (N'Kết nạp đảng ở Điện Biên Phủ',
 N'Tác phẩm sơn mài của Nguyễn Sáng, được ghi nhận sáng tác năm 1963.',
 N'Kết nạp đảng ở Điện Biên Phủ là tác phẩm sơn mài của Nguyễn Sáng, được ghi nhận sáng tác năm 1963, kích thước 112,3 x 180 cm. Dữ liệu hiện có đánh dấu tác phẩm là bảo vật quốc gia và ghi năm 2013. Nội dung lịch sử và hồ sơ công nhận cần được đối chiếu với nguồn chính thức.',
 NULL),
(N'Thành đồng tổ quốc',
 N'Tác phẩm sơn mài của Nguyễn Sáng, ghi nhận giai đoạn sáng tác 1967–1978.',
 N'Thành đồng tổ quốc là tác phẩm sơn mài của Nguyễn Sáng, được ghi nhận trong giai đoạn 1967–1978, kích thước 145 x 245 cm. Dữ liệu hiện có đánh dấu tác phẩm là bảo vật quốc gia và ghi năm 2017. Cần đối chiếu hồ sơ chính thức để hoàn thiện lịch sử công nhận và trưng bày.',
 NULL),
(N'Xuân Hồ Gươm',
 N'Tác phẩm sơn mài của Nguyễn Tư Nghiêm, ghi nhận năm sáng tác 1957.',
 N'Xuân Hồ Gươm là tác phẩm sơn mài của Nguyễn Tư Nghiêm, được ghi nhận sáng tác năm 1957, kích thước 70,4 x 150,7 cm. Thông tin về lịch sử sở hữu và trưng bày cần được xác nhận bằng tư liệu chuyên môn.',
 NULL),
(N'Điệu múa cổ',
 N'Tác phẩm sơn mài của Nguyễn Tư Nghiêm, ghi nhận năm sáng tác 1970.',
 N'Điệu múa cổ là tác phẩm sơn mài của Nguyễn Tư Nghiêm, được ghi nhận sáng tác năm 1970, kích thước 49 x 74 cm. Tên tác phẩm gợi đến đề tài múa cổ truyền; phần phân tích tạo hình và lịch sử tác phẩm cần được bổ sung từ nguồn tư liệu xác thực.',
 NULL),
(N'Trường Ca Phố',
 N'Tác phẩm sơn mài của Giáp Văn Tuấn, ghi nhận năm sáng tác 2025.',
 N'Trường Ca Phố là tác phẩm sơn mài của Giáp Văn Tuấn, được ghi nhận sáng tác năm 2025, kích thước 244 x 122 cm. Thông tin về quá trình sáng tác, triển lãm và lịch sử sở hữu chưa có trong dữ liệu hiện tại.',
 NULL),
(N'Văn Xương Đạo Lộ',
 N'Tác phẩm sơn mài của Giáp Văn Tuấn, ghi nhận năm sáng tác 2025.',
 N'Văn Xương Đạo Lộ là tác phẩm sơn mài của Giáp Văn Tuấn, được ghi nhận sáng tác năm 2025, kích thước 100 x 150 cm. Phần diễn giải chủ đề, quá trình sáng tác và lịch sử trưng bày cần được bổ sung dựa trên thông tin từ nghệ sĩ hoặc đơn vị lưu giữ.',
 NULL),
(N'Thiếu nữ bên hoa huệ',
 N'Tác phẩm sơn dầu nổi tiếng của họa sĩ Tô Ngọc Vân, sáng tác năm 1943.',
 N'Thiếu nữ bên hoa huệ là tranh sơn dầu của Tô Ngọc Vân, được ghi nhận sáng tác năm 1943, kích thước 60 x 45 cm. Bức tranh khắc họa một thiếu nữ bên hoa huệ trắng và thường được nhắc đến khi giới thiệu mỹ thuật Việt Nam thời kỳ mỹ thuật Đông Dương.',
 N'Tô Ngọc Vân sáng tác Thiếu nữ bên hoa huệ năm 1943. Thông tin về chủ sở hữu, quá trình chuyển nhượng và nơi lưu giữ qua từng thời kỳ cần được xác minh bằng hồ sơ đáng tin cậy trước khi công bố.'),
(N'Hai thiếu nữ và em bé',
 N'Tác phẩm sơn dầu của Tô Ngọc Vân, ghi nhận năm sáng tác 1944.',
 N'Hai thiếu nữ và em bé là tranh sơn dầu của Tô Ngọc Vân, được ghi nhận sáng tác năm 1944, kích thước 102 x 71,8 cm. Tác phẩm có chủ đề về hai thiếu nữ và một em bé. Phân tích chi tiết bố cục và lịch sử sở hữu cần được đối chiếu với tư liệu nghệ thuật.',
 NULL),
(N'Thiếu nữ bên hoa sen',
 N'Tác phẩm sơn dầu của Tô Ngọc Vân, ghi nhận năm sáng tác 1944 trong dữ liệu hiện có.',
 N'Thiếu nữ bên hoa sen được ghi nhận là tác phẩm sơn dầu của Tô Ngọc Vân, năm sáng tác 1944. Kích thước đang được cập nhật trong dữ liệu nguồn. Cần xác minh hồ sơ để hoàn thiện thông tin về kích thước, nguồn gốc và lịch sử trưng bày.',
 NULL),
(N'Em Thúy',
 N'Tranh chân dung sơn dầu của Trần Văn Cẩn, sáng tác năm 1943.',
 N'Em Thúy là tranh chân dung sơn dầu của Trần Văn Cẩn, được ghi nhận sáng tác năm 1943, kích thước 60 x 45 cm. Dữ liệu hiện có đánh dấu tác phẩm là bảo vật quốc gia và ghi năm 2013. Thông tin công nhận và lịch sử bảo quản cần được đối chiếu với hồ sơ di sản.',
 NULL),
(N'Hòa nhạc trong gia đình ở Huế',
 N'Tác phẩm sơn dầu của Alexander Yakovlev, ghi nhận giai đoạn 1917–1918.',
 N'Hòa nhạc trong gia đình ở Huế là tác phẩm sơn dầu của Alexander Yakovlev, được ghi nhận trong giai đoạn 1917–1918, kích thước 90 x 147 cm. Tác phẩm gắn với đề tài sinh hoạt âm nhạc trong gia đình ở Huế. Hành trình tác phẩm và lịch sử trưng bày cần được xác minh thêm.',
 NULL),
(N'Trên cánh đồng',
 N'Tác phẩm sơn dầu trên vải toan của Alexander Yakovlev, ghi nhận giai đoạn 1931–1932.',
 N'Trên cánh đồng là tác phẩm sơn dầu trên vải toan của Alexander Yakovlev, được ghi nhận sáng tác trong giai đoạn 1931–1932, kích thước 50 x 60 cm. Mô tả chi tiết hình tượng và lịch sử sưu tập cần được bổ sung dựa trên ảnh và hồ sơ tác phẩm.',
 NULL),
(N'Hà Nội vào thu',
 N'Tác phẩm sơn dầu của Phạm Hoàng Minh về chủ đề phong cảnh Hà Nội.',
 N'Hà Nội vào thu là tác phẩm sơn dầu của Phạm Hoàng Minh, kích thước 110 x 100 cm. Năm sáng tác hiện chưa rõ trong dữ liệu. Nội dung mô tả cảnh vật và lịch sử trưng bày cần được xác minh qua hình ảnh hoặc thông tin của nghệ sĩ.',
 NULL),
(N'Phong cảnh mùa đông',
 N'Tác phẩm sơn dầu của Phạm Hoàng Minh, kích thước 100 x 110 cm.',
 N'Phong cảnh mùa đông là tác phẩm sơn dầu của Phạm Hoàng Minh, kích thước 100 x 110 cm. Năm sáng tác hiện chưa rõ trong dữ liệu. Phần mô tả chi tiết về không gian, màu sắc và lịch sử tác phẩm cần được bổ sung từ nguồn tư liệu xác thực.',
 NULL),
(N'Xuân về hội tụ',
 N'Tác phẩm sơn dầu của Ngụy Đình Hà, ghi nhận năm sáng tác 2006.',
 N'Xuân về hội tụ là tác phẩm sơn dầu của Ngụy Đình Hà, được ghi nhận sáng tác năm 2006, kích thước 100 x 100 cm. Tên tác phẩm gợi đến chủ đề mùa xuân và sự hội tụ. Phân tích hình ảnh và lịch sử cụ thể cần được bổ sung dựa trên tư liệu xác thực.',
 NULL),
(N'Cánh cửa chạm rồng',
 N'Tác phẩm điêu khắc trên gỗ liêm, được ghi nhận có niên đại thế kỷ XVII.',
 N'Cánh cửa chạm rồng là tác phẩm điêu khắc trên gỗ liêm, được ghi nhận có niên đại thế kỷ XVII. Dữ liệu hiện có đánh dấu tác phẩm là bảo vật quốc gia và ghi năm 2017. Thông tin về di tích gốc, quá trình bảo quản và lịch sử công nhận cần được xác minh từ hồ sơ di sản.',
 NULL),
(N'Đợi anh về',
 N'Tác phẩm điêu khắc bằng đồng của Mai Thu Vân, kích thước 150 x 220 cm.',
 N'Đợi anh về là tác phẩm điêu khắc bằng đồng của Mai Thu Vân, kích thước 150 x 220 cm. Dữ liệu nguồn có ghi chú VNFAM. Năm sáng tác và lịch sử trưng bày chưa được cung cấp.',
 NULL),
(N'Cuộc sống và tình yêu',
 N'Tác phẩm điêu khắc bằng gỗ của Phan Gia Hương, ghi nhận năm sáng tác 1995.',
 N'Cuộc sống và tình yêu là tác phẩm điêu khắc bằng gỗ của Phan Gia Hương, được ghi nhận sáng tác năm 1995. Kích thước và lịch sử sở hữu chưa có trong dữ liệu hiện tại.',
 NULL),
(N'Không gian số 4',
 N'Tác phẩm điêu khắc bằng gốm của Nguyễn Bảo Toàn.',
 N'Không gian số 4 là tác phẩm gốm của Nguyễn Bảo Toàn. Năm sáng tác và kích thước chưa được cung cấp trong dữ liệu. Phần mô tả kỹ thuật và lịch sử trưng bày cần được bổ sung khi có hồ sơ tác phẩm.',
 NULL),
(N'Hưng Đạo Vương khán bình thư',
 N'Tác phẩm gốm dân gian, kích thước được ghi nhận 30 x 15 x 16 cm.',
 N'Hưng Đạo Vương khán bình thư là tác phẩm gốm được ghi nhận trong bộ sưu tập với kích thước 30 x 15 x 16 cm. Dữ liệu hiện tại chưa xác định rõ năm chế tác và lịch sử sở hữu; các thông tin này cần được xác minh từ đơn vị lưu giữ.',
 NULL),
(N'Tiên tắm đầm sen',
 N'Tác phẩm điêu khắc bằng gỗ, có ghi chú VNFAM trong dữ liệu hiện có.',
 N'Tiên tắm đầm sen là tác phẩm điêu khắc bằng gỗ. Dữ liệu hiện tại chưa cung cấp năm sáng tác hoặc kích thước. Nội dung diễn giải hình tượng và lịch sử tác phẩm cần được xác minh từ hồ sơ của đơn vị lưu giữ.',
 NULL),
(N'Tượng Quan Âm nghìn mắt nghìn tay',
 N'Tác phẩm điêu khắc bằng gỗ mít, được ghi nhận niên đại năm 1656.',
 N'Tượng Quan Âm nghìn mắt nghìn tay là tác phẩm điêu khắc bằng gỗ mít, được ghi nhận năm 1656, kích thước 365 x 210 cm. Dữ liệu hiện có đánh dấu tác phẩm là bảo vật quốc gia và ghi năm 2012. Thông tin về địa điểm lưu giữ, nghệ nhân, lịch sử tu bổ và quyết định công nhận cần được đối chiếu với hồ sơ di sản chính thức.',
 N'Dữ liệu nguồn ghi tác phẩm có niên đại năm 1656 và được công nhận là bảo vật quốc gia năm 2012. Để trình bày lịch sử đầy đủ, cần bổ sung nguồn tư liệu về nơi thờ tự ban đầu, quá trình bảo quản, tu bổ và hồ sơ công nhận chính thức.');

 BEGIN TRY
    BEGIN TRANSACTION;

    -- Thêm mô tả tiếng Việt nếu chưa có bản ghi cho tác phẩm.
    INSERT INTO dbo.ArtworkDescriptions
        (ArtworkID, LanguageID, ShortDescription, FullDescription, HistoryDescription)
    SELECT
        a.ArtworkID,
        @ViLanguageID,
        d.ShortDescription,
        d.FullDescription,
        d.HistoryDescription
    FROM @Descriptions AS d
    INNER JOIN dbo.Artworks AS a
        ON a.ArtworkName = d.ArtworkName
    WHERE NOT EXISTS
    (
        SELECT 1
        FROM dbo.ArtworkDescriptions AS existing
        WHERE existing.ArtworkID = a.ArtworkID
          AND existing.LanguageID = @ViLanguageID
    );

    -- Chỉ điền các trường còn trống, không ghi đè mô tả đã có.
    UPDATE existing
    SET
        ShortDescription = COALESCE(NULLIF(existing.ShortDescription, N''), d.ShortDescription),
        FullDescription = COALESCE(NULLIF(existing.FullDescription, N''), d.FullDescription),
        HistoryDescription = COALESCE(NULLIF(existing.HistoryDescription, N''), d.HistoryDescription)
    FROM dbo.ArtworkDescriptions AS existing
    INNER JOIN dbo.Artworks AS a
        ON a.ArtworkID = existing.ArtworkID
    INNER JOIN @Descriptions AS d
        ON d.ArtworkName = a.ArtworkName
    WHERE existing.LanguageID = @ViLanguageID;

    COMMIT TRANSACTION;
END TRY
BEGIN CATCH
    IF @@TRANCOUNT > 0 ROLLBACK TRANSACTION;
    THROW;
END CATCH;

-- Hiện các tác phẩm chưa có mô tả/lịch sử để tiện rà soát.
SELECT
    a.ArtworkID,
    a.ArtworkName,
    l.LanguageCode,
    CASE WHEN NULLIF(ad.ShortDescription, N'') IS NULL THEN 0 ELSE 1 END AS HasShortDescription,
    CASE WHEN NULLIF(ad.FullDescription, N'') IS NULL THEN 0 ELSE 1 END AS HasFullDescription,
    CASE WHEN NULLIF(ad.HistoryDescription, N'') IS NULL THEN 0 ELSE 1 END AS HasHistory,
    ad.AudioURL
FROM dbo.Artworks AS a
LEFT JOIN dbo.ArtworkDescriptions AS ad
    ON ad.ArtworkID = a.ArtworkID
LEFT JOIN dbo.Languages AS l
    ON l.LanguageID = ad.LanguageID
ORDER BY a.ArtworkID, l.LanguageCode;
GO