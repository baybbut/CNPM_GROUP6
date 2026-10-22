USE MusesMuseumDB;
GO
SET XACT_ABORT ON;
BEGIN TRANSACTION;
IF OBJECT_ID(N'dbo.SiteImages', N'U') IS NULL
BEGIN
 CREATE TABLE dbo.SiteImages (
  SlotKey VARCHAR(80) NOT NULL PRIMARY KEY,
  ImageURL NVARCHAR(500) NOT NULL,
  ArtworkID INT NULL REFERENCES dbo.Artworks(ArtworkID)
 );
END;
DECLARE @Slots TABLE (SlotKey VARCHAR(80), ImageURL NVARCHAR(500), ArtworkName NVARCHAR(250));
INSERT INTO @Slots VALUES
('home.hero','/images/tranh/HOANHACTRONGGIADINHOHUE.jpg',N'Hòa nhạc trong gia đình ở Huế'),
('home.highlight.h1','/images/tranh/HOAOCHIENSI.jpg',NULL),
('home.highlight.h2','/images/tranh/NHAPHO18.jpg',NULL),
('home.highlight.h3','/images/tranh/tranhsonmai/SONMAI.jpg',NULL),
('home.highlight.h4','/images/tranh/tranhsonmai/GIAOMUA.jpg',N'Giao Mùa'),
('home.news','/images/tranh/tranhsonmai/NHUNGDUATRETRAU.jpg',N'Những đứa trẻ trâu'),
('home.welcome.g1','/images/tranh/XUANVEHOITU.jpg',N'Xuân về hội tụ'),
('home.welcome.g2','/images/tranh/EMTHUY.jpeg',N'Em Thúy'),
('home.welcome.g3','/images/tranh/THIEUNUBENHOAHUE.jpg',N'Thiếu nữ bên hoa huệ'),
('home.welcome.g4','/images/tranh/THIEUNUBENHOASEN.jpg',N'Thiếu nữ bên hoa sen'),
('home.welcome.g5','/images/tranh/tranhsonmai/XUANHOGUOM.jpeg',N'Xuân Hồ Gươm'),
('home.welcome.g6','/images/tranh/tranhsonmai/THIEUNUBENHOAPHUDUNG.jpg',N'Thiếu nữ bên hoa phù dung'),
('home.prepare','/images/tranh/tranhsonmai/TRUONGCAPHO.jpg',N'Trường Ca Phố');
-- Never overwrite existing slot choices when rerunning this seed.
INSERT INTO dbo.SiteImages (SlotKey, ImageURL, ArtworkID)
SELECT s.SlotKey, s.ImageURL,
 (SELECT CASE WHEN COUNT(*) = 1 THEN MAX(ArtworkID) END FROM dbo.Artworks WHERE ArtworkName=s.ArtworkName)
FROM @Slots s WHERE NOT EXISTS (SELECT 1 FROM dbo.SiteImages i WHERE i.SlotKey=s.SlotKey);
COMMIT TRANSACTION;
SELECT * FROM dbo.SiteImages ORDER BY SlotKey;
