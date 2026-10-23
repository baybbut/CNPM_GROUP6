SET XACT_ABORT ON;
BEGIN TRANSACTION;
IF OBJECT_ID(N'dbo.AuthSessions', N'U') IS NULL
BEGIN
 CREATE TABLE dbo.AuthSessions (
  TokenHash VARCHAR(64) NOT NULL PRIMARY KEY,
  UserID INT NOT NULL REFERENCES dbo.Users(UserID),
  CreatedAt DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME(),
  ExpiresAt DATETIME2 NOT NULL,
  LastSeenAt DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME()
 );
 CREATE INDEX IX_AuthSessions_Time ON dbo.AuthSessions(CreatedAt) INCLUDE (UserID);
END;
IF OBJECT_ID(N'dbo.AnalyticsSessions', N'U') IS NULL
BEGIN
 CREATE TABLE dbo.AnalyticsSessions (
  SessionID VARCHAR(36) NOT NULL PRIMARY KEY,
  VisitorID VARCHAR(36) NOT NULL,
  UserID INT NULL REFERENCES dbo.Users(UserID),
  StartedAt DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME(),
  LastSeenAt DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME()
 );
 CREATE INDEX IX_AnalyticsSessions_Time ON dbo.AnalyticsSessions(LastSeenAt) INCLUDE(VisitorID,UserID,StartedAt);
END;
IF OBJECT_ID(N'dbo.AnalyticsEvents', N'U') IS NULL
BEGIN
 CREATE TABLE dbo.AnalyticsEvents (
  EventID VARCHAR(36) NOT NULL PRIMARY KEY,
  SessionID VARCHAR(36) NOT NULL REFERENCES dbo.AnalyticsSessions(SessionID),
  UserID INT NULL REFERENCES dbo.Users(UserID),
  Kind VARCHAR(20) NOT NULL CHECK (Kind IN ('page_view','qr_scan','audio_play')),
  ArtworkID INT NULL REFERENCES dbo.Artworks(ArtworkID),
  PointKey VARCHAR(80) NULL,
  LanguageCode VARCHAR(10) NULL,
  OccurredAt DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME()
 );
 CREATE INDEX IX_AnalyticsEvents_Time ON dbo.AnalyticsEvents(OccurredAt) INCLUDE(SessionID,Kind,ArtworkID,PointKey);
END;
IF COL_LENGTH('dbo.AnalyticsEvents', 'UserID') IS NULL
 ALTER TABLE dbo.AnalyticsEvents ADD UserID INT NULL REFERENCES dbo.Users(UserID);
IF OBJECT_ID(N'dbo.AuthLoginEvents', N'U') IS NULL
BEGIN
 CREATE TABLE dbo.AuthLoginEvents (
  LoginID BIGINT IDENTITY PRIMARY KEY,
  UserID INT NOT NULL REFERENCES dbo.Users(UserID),
  LoggedAt DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME()
 );
 CREATE INDEX IX_AuthLoginEvents_Time ON dbo.AuthLoginEvents(LoggedAt) INCLUDE(UserID);
END;
COMMIT TRANSACTION;
