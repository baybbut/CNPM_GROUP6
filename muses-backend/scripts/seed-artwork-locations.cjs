const sql = require("mssql");
const places = require("../../muses-react/src/data/hcmPlaces.json");
const { DEMO_LOCATION_SOURCE } = require("../catalog-rules.cjs");

// Use the same museum names, addresses and reference pins as the visitor map.
async function seedArtworkLocations(pool) {
  const tx = pool.transaction();
  await tx.begin(sql.ISOLATION_LEVEL.SERIALIZABLE);
  try {
    const result = await tx.request()
      .input("places", sql.NVarChar(sql.MAX), JSON.stringify(places.filter(p => p.kind === "museum")))
      .input("source", sql.NVarChar(1000), DEMO_LOCATION_SOURCE)
      .query(`
        DECLARE @today date = CONVERT(date, DATEADD(minute,420,SYSUTCDATETIME()));
        DECLARE @admin int = (SELECT TOP (1) UserID FROM dbo.Users WHERE Role IN ('Admin','Administrator') AND IsActive=1 ORDER BY UserID);
        IF @admin IS NULL THROW 51000,N'Cần một tài khoản quản trị Muses đang hoạt động.',1;
        DECLARE @venues TABLE (
          name nvarchar(250) PRIMARY KEY, address nvarchar(500), latitude decimal(10,7),
          longitude decimal(10,7), sourceUrl nvarchar(1000), museumId int,
          publishedCount int DEFAULT 0, totalCount int DEFAULT 0
        );
        INSERT @venues(name,address,latitude,longitude,sourceUrl)
          SELECT name,address,latitude,longitude,sourceUrl FROM OPENJSON(@places)
          WITH (name nvarchar(250), address nvarchar(500), latitude decimal(10,7), longitude decimal(10,7), sourceUrl nvarchar(1000));
        IF NOT EXISTS (SELECT 1 FROM @venues) THROW 51000,N'Danh sách bảo tàng TP.HCM trống.',1;
        INSERT dbo.Museums(Name,Address,Latitude,Longitude,Source,PinVerified,IsPublic)
          SELECT v.name,v.address,v.latitude,v.longitude,v.sourceUrl,1,1 FROM @venues v
          WHERE NOT EXISTS (SELECT 1 FROM dbo.Museums WITH (UPDLOCK,HOLDLOCK) WHERE Name=v.name);
        UPDATE v SET museumId=(SELECT MIN(MuseumID) FROM dbo.Museums WHERE Name=v.name AND IsPublic=1)
          FROM @venues v;
        IF EXISTS (SELECT 1 FROM @venues WHERE museumId IS NULL)
          THROW 51000,N'Có bảo tàng mẫu đang ẩn. Kiểm tra trạng thái bảo tàng trong Admin.',1;

        DECLARE @works TABLE (id int PRIMARY KEY, published int, currentMuseum int, nextStart date);
        INSERT @works
          SELECT a.ArtworkID, CASE WHEN a.PublicationStatus='Published' THEN 1 ELSE 0 END,
            MAX(CASE WHEN s.StartDate<=@today THEN s.MuseumID END),
            MIN(CASE WHEN s.StartDate>@today THEN s.StartDate END)
          FROM dbo.Artworks a LEFT JOIN dbo.DisplaySchedules s WITH (UPDLOCK,HOLDLOCK)
            ON s.ArtworkID=a.ArtworkID AND s.Status='Confirmed' AND (s.EndDate IS NULL OR s.EndDate>@today)
          GROUP BY a.ArtworkID,a.PublicationStatus;
        UPDATE v SET publishedCount=c.published, totalCount=c.total
          FROM @venues v CROSS APPLY (SELECT COALESCE(SUM(w.published),0) published, COUNT(*) total
                                      FROM @works w WHERE w.currentMuseum=v.museumId) c;
        DECLARE @id int, @published int, @endDate date, @museum int;
        WHILE EXISTS (SELECT 1 FROM @works WHERE currentMuseum IS NULL)
        BEGIN
          SELECT TOP (1) @id=id,@published=published,@endDate=nextStart FROM @works
            WHERE currentMuseum IS NULL ORDER BY published DESC,id;
          SELECT TOP (1) @museum=museumId FROM @venues
            ORDER BY CASE WHEN @published=1 THEN publishedCount ELSE totalCount END,totalCount,name;
          INSERT dbo.DisplaySchedules(ArtworkID,MuseumID,StartDate,EndDate,Status,Source,VerifiedOn,UpdatedBy)
            VALUES(@id,@museum,@today,@endDate,'Confirmed',@source,@today,@admin);
          UPDATE @venues SET publishedCount=publishedCount+@published,totalCount=totalCount+1 WHERE museumId=@museum;
          UPDATE @works SET currentMuseum=@museum WHERE id=@id;
        END;
        SELECT name AS museum,publishedCount AS published,totalCount AS total FROM @venues ORDER BY name;
      `);
    await tx.commit();
    return result.recordset;
  } catch (error) {
    await tx.rollback();
    throw error;
  }
}

if (require.main === module) {
  const { dbConfig } = require("../server.cjs");
  const pool = new sql.ConnectionPool(dbConfig);
  (async () => {
    try {
      await pool.connect();
      console.table(await seedArtworkLocations(pool));
    } catch (error) {
      console.error(error.message);
      process.exitCode = 1;
    } finally {
      await pool.close();
    }
  })();
}
module.exports = { seedArtworkLocations };
