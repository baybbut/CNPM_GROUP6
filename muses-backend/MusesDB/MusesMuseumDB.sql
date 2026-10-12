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
('en', N'English');

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