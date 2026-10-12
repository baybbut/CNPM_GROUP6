--Dùng MusesDB để lưu dữ liệu
USE MusesDB;
GO

-- 1. Tác giả
CREATE TABLE dbo.Artists (
    ArtistId INT IDENTITY(1,1) PRIMARY KEY,
    FullName NVARCHAR(200) NOT NULL,
    BirthYear INT NULL,
    DeathYear INT NULL
);

-- 2. Tác phẩm
CREATE TABLE dbo.Artworks (
    ArtworkId INT IDENTITY(1,1) PRIMARY KEY,
    ArtistId INT NOT NULL,
    CreationYear INT NULL,
    ImageUrl NVARCHAR(1000) NULL,

    CONSTRAINT FK_Artworks_Artists
        FOREIGN KEY (ArtistId)
        REFERENCES dbo.Artists(ArtistId)
);

-- 3. Ngôn ngữ
CREATE TABLE dbo.Languages (
    LanguageCode VARCHAR(10) PRIMARY KEY,
    LanguageName NVARCHAR(100) NOT NULL
);

-- 4. Nội dung tác phẩm theo ngôn ngữ
CREATE TABLE dbo.ArtworkTranslations (
    ArtworkId INT NOT NULL,
    LanguageCode VARCHAR(10) NOT NULL,
    Title NVARCHAR(300) NOT NULL,
    Description NVARCHAR(MAX) NULL,

    CONSTRAINT PK_ArtworkTranslations
        PRIMARY KEY (ArtworkId, LanguageCode),

    CONSTRAINT FK_ArtworkTranslations_Artworks
        FOREIGN KEY (ArtworkId)
        REFERENCES dbo.Artworks(ArtworkId),

    CONSTRAINT FK_ArtworkTranslations_Languages
        FOREIGN KEY (LanguageCode)
        REFERENCES dbo.Languages(LanguageCode)
);
GO

--insert dữ liệu mẫu-- Thêm ngôn ngữ.
INSERT INTO dbo.Languages (LanguageCode, LanguageName)
VALUES
    ('vi', N'Tiếng Việt'),
    ('en', N'English'),
    ('ja', N'日本語');

-- Thêm tác giả.
INSERT INTO dbo.Artists (FullName, BirthYear, DeathYear)
VALUES (N'Leonardo da Vinci', 1452, 1519);

-- Lấy mã tác giả vừa thêm.
DECLARE @ArtistId INT = CONVERT(INT, SCOPE_IDENTITY());

-- Thêm tác phẩm.
INSERT INTO dbo.Artworks (ArtistId, CreationYear, ImageUrl)
VALUES (@ArtistId, 1503, N'/images/mona-lisa.jpg');

-- Lấy mã tác phẩm vừa thêm.
DECLARE @ArtworkId INT = CONVERT(INT, SCOPE_IDENTITY());

-- Thêm nội dung theo từng ngôn ngữ.
INSERT INTO dbo.ArtworkTranslations (
    ArtworkId,
    LanguageCode,
    Title,
    Description
)
VALUES
    (
        @ArtworkId,
        'vi',
        N'Mona Lisa',
        N'Tác phẩm của Leonardo da Vinci.'
    ),
    (
        @ArtworkId,
        'en',
        N'Mona Lisa',
        N'A painting by Leonardo da Vinci.'
    ),
    (
        @ArtworkId,
        'ja',
        N'モナ・リザ',
        N'レオナルド・ダ・ヴィンチによる絵画。'
    );
GO

--chạy thử dữ liệu mẫu
SELECT * FROM dbo.Artists;
SELECT * FROM dbo.Artworks;
SELECT * FROM dbo.Languages;
SELECT * FROM dbo.ArtworkTranslations;

--thử lấy tác phẩm để trả cho react
SELECT
    a.ArtworkId AS id,
    ar.FullName AS artist,
    t.Title AS title,
    t.Description AS description
FROM dbo.Artworks AS a
JOIN dbo.Artists AS ar
    ON a.ArtistId = ar.ArtistId
JOIN dbo.ArtworkTranslations AS t
    ON a.ArtworkId = t.ArtworkId
WHERE t.LanguageCode = 'vi';

SELECT 1 AS TestConnection;

UPDATE dbo.ArtworkTranslations
SET Description = N'Nội dung này được lấy từ database MusesDB.'
WHERE ArtworkId = 1
  AND LanguageCode = 'vi';