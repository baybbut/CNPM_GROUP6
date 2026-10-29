-- Additive QR controls. Existing artwork/translation/analytics records are retained.
SET XACT_ABORT ON;
IF COL_LENGTH('dbo.Artworks','QRIsEnabled') IS NULL
 ALTER TABLE dbo.Artworks ADD QRIsEnabled BIT NOT NULL CONSTRAINT DF_Artworks_QRIsEnabled DEFAULT 1 WITH VALUES;
IF COL_LENGTH('dbo.Artworks','QRLabel') IS NULL
 ALTER TABLE dbo.Artworks ADD QRLabel NVARCHAR(150) NULL;
IF COL_LENGTH('dbo.Artworks','QRUpdatedAt') IS NULL
 ALTER TABLE dbo.Artworks ADD QRUpdatedAt DATETIME2 NULL;
IF COL_LENGTH('dbo.Artworks','QRUpdatedBy') IS NULL
 ALTER TABLE dbo.Artworks ADD QRUpdatedBy INT NULL;
