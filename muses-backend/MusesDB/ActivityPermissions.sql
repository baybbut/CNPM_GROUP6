-- Run using the database administrator connection. @runtimeLogin is parameterized.
-- Resolve the application's actual database user, which may differ from its login name.
DECLARE @principal SYSNAME;
IF IS_SRVROLEMEMBER('sysadmin', @runtimeLogin) = 1
BEGIN
 SELECT N'dbo' AS runtimeUser;
 RETURN;
END;
SELECT TOP(1) @principal = name
FROM sys.database_principals
WHERE sid = SUSER_SID(@runtimeLogin)
   OR (name = @runtimeLogin AND authentication_type = 2)
ORDER BY CASE WHEN sid = SUSER_SID(@runtimeLogin) THEN 0 ELSE 1 END;
IF @principal = N'dbo'
BEGIN
 SELECT @principal AS runtimeUser;
 RETURN;
END;
SET XACT_ABORT ON;
BEGIN TRANSACTION;
IF @principal IS NULL
BEGIN
 DECLARE @createUser NVARCHAR(MAX) = N'CREATE USER ' + QUOTENAME(@runtimeLogin) + N' FOR LOGIN ' + QUOTENAME(@runtimeLogin) + N';';
 EXEC sys.sp_executesql @createUser;
 SET @principal = @runtimeLogin;
END;
DECLARE @quoted NVARCHAR(258) = QUOTENAME(@principal);
DECLARE @grants NVARCHAR(MAX) =
 N'GRANT SELECT, INSERT ON OBJECT::dbo.Users TO ' + @quoted + N';' +
 N'GRANT SELECT, INSERT, DELETE ON OBJECT::dbo.AuthSessions TO ' + @quoted + N';' +
 N'GRANT SELECT, INSERT ON OBJECT::dbo.AuthLoginEvents TO ' + @quoted + N';' +
 N'GRANT SELECT, INSERT, UPDATE ON OBJECT::dbo.AnalyticsSessions TO ' + @quoted + N';' +
 N'GRANT SELECT, INSERT ON OBJECT::dbo.AnalyticsEvents TO ' + @quoted + N';';
EXEC sys.sp_executesql @grants;
COMMIT TRANSACTION;
SELECT @principal AS runtimeUser;
