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
DECLARE @Slots TABLE (SlotKey VARCHAR(80), ImageURL NVARCHAR(500));
INSERT INTO @Slots VALUES
('exhibition.hero','/images/background/muses4.jpg'),
('exhibition.upcoming','/images/tranh/HOANHACTRONGGIADINHOHUE.jpg'),
('exhibition.spotlight.1','/images/tranh/THIEUNUBENHOAHUE.jpg'),
('exhibition.spotlight.2','/images/tranh/tranhsonmai/LEHOIDAUNAM.webp'),
('exhibition.spotlight.3','/images/tranh/tranhsonmai/THANHDONGTOQUOC.png'),
('exhibition.event.1','/images/background/muses9.jpg'),
('exhibition.event.2','/images/background/muses8.jpg'),
('exhibition.tour.1','/images/background/muses10.jpg'),
('exhibition.tour.2','/images/background/muses2.jpg');
-- Add missing placements only; preserve any images already selected by the user.
INSERT INTO dbo.SiteImages (SlotKey, ImageURL)
SELECT s.SlotKey, s.ImageURL FROM @Slots s
WHERE NOT EXISTS (SELECT 1 FROM dbo.SiteImages i WHERE i.SlotKey=s.SlotKey);
COMMIT TRANSACTION;
SELECT SlotKey, ImageURL FROM dbo.SiteImages WHERE SlotKey LIKE 'exhibition.%' ORDER BY SlotKey;
