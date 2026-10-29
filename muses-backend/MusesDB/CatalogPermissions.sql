DECLARE @principal SYSNAME;
IF IS_SRVROLEMEMBER('sysadmin',@runtimeLogin)=1 RETURN;
SELECT TOP(1) @principal=name FROM sys.database_principals
WHERE sid=SUSER_SID(@runtimeLogin) OR (name=@runtimeLogin AND authentication_type=2)
ORDER BY CASE WHEN sid=SUSER_SID(@runtimeLogin) THEN 0 ELSE 1 END;
IF @principal IS NULL THROW 51000,N'Application database user is not mapped. Run db:setup first.',1;
IF @principal='dbo' RETURN;
DECLARE @grants NVARCHAR(MAX)=N'';
SELECT @grants=@grants+N'GRANT SELECT,INSERT,UPDATE,DELETE ON OBJECT::dbo.'+QUOTENAME(name)+N' TO '+QUOTENAME(@principal)+N';'
FROM sys.tables WHERE schema_id=SCHEMA_ID('dbo') AND name IN
('Artworks','ArtworkDescriptions','ArtworkImages','Artists','Categories','Materials','Museums','DisplaySchedules');
SET @grants=@grants+N'GRANT SELECT ON OBJECT::dbo.Languages TO '+QUOTENAME(@principal)+N';';
EXEC sys.sp_executesql @grants;
