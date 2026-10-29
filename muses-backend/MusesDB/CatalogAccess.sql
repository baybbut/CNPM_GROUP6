SELECT CASE WHEN COL_LENGTH('dbo.Artworks','QRIsEnabled') IS NULL OR
 COL_LENGTH('dbo.Artworks','QRLabel') IS NULL OR
 COL_LENGTH('dbo.Artworks','QRUpdatedAt') IS NULL OR
 COL_LENGTH('dbo.Artworks','QRUpdatedBy') IS NULL OR EXISTS (
 SELECT 1 FROM (VALUES
 ('Artworks','SELECT'),('Artworks','INSERT'),('Artworks','UPDATE'),
 ('ArtworkDescriptions','SELECT'),('ArtworkDescriptions','INSERT'),('ArtworkDescriptions','UPDATE'),
 ('ArtworkImages','SELECT'),('ArtworkImages','INSERT'),('ArtworkImages','UPDATE'),
 ('Artists','SELECT'),('Artists','INSERT'),('Artists','UPDATE'),('Artists','DELETE'),
 ('Categories','SELECT'),('Categories','INSERT'),('Categories','UPDATE'),('Categories','DELETE'),
 ('Materials','SELECT'),('Materials','INSERT'),('Materials','UPDATE'),('Materials','DELETE'),
 ('Museums','SELECT'),('Museums','INSERT'),('Museums','UPDATE'),
 ('DisplaySchedules','SELECT'),('DisplaySchedules','INSERT'),('DisplaySchedules','UPDATE'),
 ('TicketOffers','SELECT'),('TicketOffers','INSERT'),('TicketOffers','UPDATE'),
 ('TicketReservations','SELECT'),('TicketReservations','INSERT'),('TicketReservations','UPDATE'),
 ('Languages','SELECT')
 ) permissions(tableName,action)
 WHERE COALESCE(HAS_PERMS_BY_NAME('dbo.'+tableName,'OBJECT',action),0)<>1
) THEN 0 ELSE 1 END AS ready;
