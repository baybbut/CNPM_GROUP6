-- Additive PRD migration. Never run the legacy database reset script for upgrades.
SET XACT_ABORT ON;
IF OBJECT_ID('dbo.Museums','U') IS NULL
CREATE TABLE dbo.Museums (
 MuseumID INT IDENTITY PRIMARY KEY, Name NVARCHAR(250) NOT NULL,
 Address NVARCHAR(500) NOT NULL, Description NVARCHAR(4000) NULL,
 Contact NVARCHAR(500) NULL, Latitude DECIMAL(10,7) NOT NULL,
 Longitude DECIMAL(10,7) NOT NULL, IsPublic BIT NOT NULL DEFAULT 0,
 PinVerified BIT NOT NULL DEFAULT 0, Source NVARCHAR(1000) NULL,
 IsDemo BIT NOT NULL DEFAULT 0,
 CONSTRAINT CK_Museum_Coordinates CHECK(Latitude BETWEEN -90 AND 90 AND Longitude BETWEEN -180 AND 180),
 CONSTRAINT CK_Museum_Pin CHECK(IsPublic=0 OR PinVerified=1)
);
IF OBJECT_ID('dbo.Materials','U') IS NULL
CREATE TABLE dbo.Materials (MaterialID INT IDENTITY PRIMARY KEY, Name NVARCHAR(200) NOT NULL UNIQUE);
IF COL_LENGTH('dbo.Artworks','PublicationStatus') IS NULL
 ALTER TABLE dbo.Artworks ADD PublicationStatus VARCHAR(12) NOT NULL CONSTRAINT DF_Artwork_Publication DEFAULT 'Draft';
IF COL_LENGTH('dbo.Artworks','InformationSource') IS NULL
 ALTER TABLE dbo.Artworks ADD InformationSource NVARCHAR(1000) NULL;
IF COL_LENGTH('dbo.Artworks','OwnerMuseumID') IS NULL
 ALTER TABLE dbo.Artworks ADD OwnerMuseumID INT NULL REFERENCES dbo.Museums(MuseumID);
IF COL_LENGTH('dbo.Artworks','MaterialID') IS NULL
 ALTER TABLE dbo.Artworks ADD MaterialID INT NULL REFERENCES dbo.Materials(MaterialID);
IF COL_LENGTH('dbo.Artworks','ImageSource') IS NULL
 ALTER TABLE dbo.Artworks ADD ImageSource NVARCHAR(1000) NULL;
IF COL_LENGTH('dbo.Artworks','IsDemo') IS NULL
 ALTER TABLE dbo.Artworks ADD IsDemo BIT NOT NULL CONSTRAINT DF_Artwork_Demo DEFAULT 0;
IF COL_LENGTH('dbo.ArtworkDescriptions','Title') IS NULL
 ALTER TABLE dbo.ArtworkDescriptions ADD Title NVARCHAR(250) NULL;
IF COL_LENGTH('dbo.ArtworkDescriptions','PublicationStatus') IS NULL
 ALTER TABLE dbo.ArtworkDescriptions ADD PublicationStatus VARCHAR(12) NOT NULL CONSTRAINT DF_Description_Publication DEFAULT 'Draft';
IF COL_LENGTH('dbo.ArtworkDescriptions','InformationSource') IS NULL
 ALTER TABLE dbo.ArtworkDescriptions ADD InformationSource NVARCHAR(1000) NULL;
GO
-- Existing content stays in Draft until an administrator reviews it.
UPDATE d SET Title=a.ArtworkName FROM dbo.ArtworkDescriptions d
 JOIN dbo.Artworks a ON a.ArtworkID=d.ArtworkID
 JOIN dbo.Languages l ON l.LanguageID=d.LanguageID
 WHERE l.LanguageCode='vi' AND d.Title IS NULL;
INSERT INTO dbo.Materials(Name)
 SELECT DISTINCT LTRIM(RTRIM(Material)) FROM dbo.Artworks a
 WHERE NULLIF(LTRIM(RTRIM(Material)),'') IS NOT NULL
 AND NOT EXISTS(SELECT 1 FROM dbo.Materials m WHERE m.Name=LTRIM(RTRIM(a.Material)));
UPDATE a SET MaterialID=m.MaterialID FROM dbo.Artworks a JOIN dbo.Materials m ON m.Name=LTRIM(RTRIM(a.Material)) WHERE a.MaterialID IS NULL;
INSERT INTO dbo.Languages(LanguageCode,LanguageName)
 SELECT code,name FROM (VALUES ('vi',N'Tiếng Việt'),('en',N'English'),('zh',N'中文'),('ja',N'日本語'),('ko',N'한국어')) v(code,name)
 WHERE NOT EXISTS(SELECT 1 FROM dbo.Languages l WHERE l.LanguageCode=v.code);
IF OBJECT_ID('dbo.DisplaySchedules','U') IS NULL
BEGIN
 CREATE TABLE dbo.DisplaySchedules (
 ScheduleID INT IDENTITY PRIMARY KEY,
 ArtworkID INT NOT NULL REFERENCES dbo.Artworks(ArtworkID),
 MuseumID INT NOT NULL REFERENCES dbo.Museums(MuseumID),
 StartDate DATE NOT NULL, EndDate DATE NULL,
 Status VARCHAR(12) NOT NULL DEFAULT 'Draft',
 Source NVARCHAR(1000) NOT NULL, VerifiedOn DATE NOT NULL,
 UpdatedBy INT NOT NULL REFERENCES dbo.Users(UserID),
 UpdatedAt DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME(),
 CONSTRAINT CK_Display_Dates CHECK(EndDate IS NULL OR StartDate<EndDate),
 CONSTRAINT CK_Display_Status CHECK(Status IN ('Draft','Confirmed','Cancelled'))
 );
 CREATE INDEX IX_Display_Artwork_Date ON dbo.DisplaySchedules(ArtworkID,Status,StartDate,EndDate) INCLUDE(MuseumID);
 CREATE INDEX IX_Display_Museum ON dbo.DisplaySchedules(MuseumID,Status,StartDate,EndDate);
END;
IF NOT EXISTS(SELECT 1 FROM sys.indexes WHERE object_id=OBJECT_ID('dbo.Artworks') AND name='IX_Artwork_Publication')
 CREATE INDEX IX_Artwork_Publication ON dbo.Artworks(PublicationStatus,ArtistID,MaterialID,ArtworkID);
GO
IF NOT EXISTS(SELECT 1 FROM sys.check_constraints WHERE name='CK_Artwork_Publication')
 ALTER TABLE dbo.Artworks ADD CONSTRAINT CK_Artwork_Publication CHECK(PublicationStatus IN ('Draft','Published','Hidden'));
IF NOT EXISTS(SELECT 1 FROM sys.check_constraints WHERE name='CK_Description_Publication')
 ALTER TABLE dbo.ArtworkDescriptions ADD CONSTRAINT CK_Description_Publication CHECK(PublicationStatus IN ('Draft','Published'));
