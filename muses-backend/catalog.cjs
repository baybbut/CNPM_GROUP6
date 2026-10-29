const R = require("./catalog-rules.cjs");
const TODAY = "CONVERT(date,DATEADD(minute,420,SYSUTCDATETIME()))";
const CURRENT = `s.Status='Confirmed' AND m.IsPublic=1 AND s.StartDate<=${TODAY} AND (s.EndDate IS NULL OR ${TODAY}<s.EndDate)`;
const selections = {
  artworks: `SELECT a.ArtworkID AS id,a.ArtworkName AS title,a.ArtistID AS artistId,ar.ArtistName AS artist,a.CategoryID AS categoryId,a.MaterialID AS materialId,a.Material AS material,a.CreationPeriod AS creationPeriod,a.Dimensions AS dimensions,a.InformationSource AS source,a.ImageSource AS imageSource,(SELECT TOP(1) ImageURL FROM dbo.ArtworkImages i WHERE i.ArtworkID=a.ArtworkID ORDER BY i.IsPrimary DESC,i.DisplayOrder,i.ImageID) AS imageUrl,a.OwnerMuseumID AS ownerMuseumId,a.PublicationStatus AS status,a.IsDemo AS isDemo FROM dbo.Artworks a JOIN dbo.Artists ar ON ar.ArtistID=a.ArtistID`,
  museums: `SELECT MuseumID AS id,Name AS name,Address AS address,Description AS description,Contact AS contact,Latitude AS latitude,Longitude AS longitude,IsPublic AS isPublic,PinVerified AS pinVerified,Source AS source,IsDemo AS isDemo FROM dbo.Museums`,
  translations: `SELECT d.DescriptionID AS id,d.ArtworkID AS artworkId,a.ArtworkName AS artwork,l.LanguageCode AS language,d.Title AS title,d.FullDescription AS description,d.ShortDescription AS shortDescription,d.AudioURL AS audioUrl,d.InformationSource AS source,d.PublicationStatus AS status FROM dbo.ArtworkDescriptions d JOIN dbo.Artworks a ON a.ArtworkID=d.ArtworkID JOIN dbo.Languages l ON l.LanguageID=d.LanguageID WHERE l.LanguageCode IN ('vi','en','zh','ja','ko')`,
  schedules: `SELECT s.ScheduleID AS id,s.ArtworkID AS artworkId,a.ArtworkName AS artwork,s.MuseumID AS museumId,m.Name AS museum,CONVERT(varchar(10),s.StartDate,23) AS startDate,CONVERT(varchar(10),s.EndDate,23) AS endDate,s.Status AS status,s.Source AS source,CONVERT(varchar(10),s.VerifiedOn,23) AS verifiedOn,s.UpdatedBy AS updatedBy,s.UpdatedAt AS updatedAt FROM dbo.DisplaySchedules s JOIN dbo.Artworks a ON a.ArtworkID=s.ArtworkID JOIN dbo.Museums m ON m.MuseumID=s.MuseumID`,
  artists: `SELECT ArtistID AS id,ArtistName AS name,Biography AS description FROM dbo.Artists`,
  materials: `SELECT MaterialID AS id,Name AS name FROM dbo.Materials`,
  categories: `SELECT CategoryID AS id,CategoryName AS name,Description AS description FROM dbo.Categories`,
};
const entities = {
  artworks: ["Artworks", "ArtworkID"],
  translations: ["ArtworkDescriptions", "DescriptionID"],
  museums: ["Museums", "MuseumID"],
  schedules: ["DisplaySchedules", "ScheduleID"],
  artists: ["Artists", "ArtistID"],
  materials: ["Materials", "MaterialID"],
  categories: ["Categories", "CategoryID"],
};
function attachCatalogRoutes(app, sql) {
  function query(connection, statement, values = {}) {
    const q = connection.request();
    for (const [key, value] of Object.entries(values))
      q.input(
        key,
        typeof value === "boolean"
          ? sql.Bit
          : typeof value === "number"
            ? Number.isInteger(value)
              ? sql.Int
              : sql.Float
            : sql.NVarChar(sql.MAX),
        value ?? null,
      );
    return q.query(statement);
  }
  const wrap = (fn) => async (req, res) => {
    try {
      await fn(req, res);
    } catch (e) {
      if (e instanceof R.CatalogError)
        return res.status(e.status).json({ code: e.code, message: e.message });
      if ([2601, 2627].includes(e.number))
        return res.status(409).json({
          code: "DUPLICATE",
          message:
            "Bản ghi đã tồn tại. Mỗi tác phẩm chỉ có một bản dịch cho mỗi ngôn ngữ.",
        });
      if (e.number === 547)
        return res.status(409).json({
          code: "REFERENCED",
          message:
            "Dữ liệu đang được tham chiếu hoặc mã liên quan không còn hợp lệ.",
        });
      console.error("Catalog API:", e.code || e.message);
      res.status(503).json({
        code: "CATALOG_UNAVAILABLE",
        message: "Chưa tải được dữ liệu. Vui lòng thử lại.",
      });
    }
  };
  const admin = wrap(async (req, res) => {
    const user = await app.locals.identity(req);
    if (!user) R.fail("Vui lòng đăng nhập quản trị.", 401, "UNAUTHENTICATED");
    if (!["Admin", "Administrator"].includes(user.role))
      R.fail("Tài khoản không có quyền quản trị.", 403, "FORBIDDEN");
    req.admin = user;
    res.locals.authorized = true;
  });
  // Middleware must call next after the asynchronous authorization completes.
  const gate = (req, res, next) =>
    admin(req, res).then(() => {
      if (res.locals.authorized && !res.headersSent) next();
    });
  async function transaction(fn) {
    const tx = app.locals.pool.transaction();
    await tx.begin(sql.ISOLATION_LEVEL.SERIALIZABLE);
    try {
      const value = await fn(tx);
      await tx.commit();
      return value;
    } catch (e) {
      try {
        await tx.rollback();
      } catch {}
      throw e;
    }
  }
  const currentFields = `e.ScheduleID AS scheduleId,e.MuseumID AS museumId,e.Name AS museum,e.Address AS museumAddress,e.Latitude AS latitude,e.Longitude AS longitude,e.Contact AS museumContact,CONVERT(varchar(10),e.StartDate,23) AS startDate,CONVERT(varchar(10),e.EndDate,23) AS endDate,e.Source AS exhibitionSource,CONVERT(varchar(10),e.VerifiedOn,23) AS verifiedOn,e.IsDemo AS museumIsDemo`;
  const publicFrom = `FROM dbo.Artworks a JOIN dbo.Artists ar ON ar.ArtistID=a.ArtistID JOIN dbo.Categories c ON c.CategoryID=a.CategoryID
 JOIN dbo.ArtworkDescriptions vi ON vi.ArtworkID=a.ArtworkID AND vi.PublicationStatus='Published' AND NULLIF(LTRIM(RTRIM(vi.Title)),'') IS NOT NULL AND NULLIF(LTRIM(RTRIM(vi.FullDescription)),'') IS NOT NULL
 JOIN dbo.Languages vl ON vl.LanguageID=vi.LanguageID AND vl.LanguageCode='vi'
 LEFT JOIN dbo.Languages dl ON dl.LanguageCode=@lang
 LEFT JOIN dbo.ArtworkDescriptions d ON d.ArtworkID=a.ArtworkID AND d.LanguageID=dl.LanguageID AND d.PublicationStatus='Published' AND NULLIF(LTRIM(RTRIM(d.Title)),'') IS NOT NULL AND NULLIF(LTRIM(RTRIM(d.FullDescription)),'') IS NOT NULL
 OUTER APPLY(SELECT TOP(1) s.ScheduleID,s.MuseumID,m.Name,m.Address,m.Latitude,m.Longitude,m.Contact,s.StartDate,s.EndDate,s.Source,s.VerifiedOn,m.IsDemo FROM dbo.DisplaySchedules s JOIN dbo.Museums m ON m.MuseumID=s.MuseumID WHERE s.ArtworkID=a.ArtworkID AND ${CURRENT} ORDER BY s.StartDate DESC,s.ScheduleID) e
 OUTER APPLY(SELECT TOP(1) ImageURL FROM dbo.ArtworkImages i WHERE i.ArtworkID=a.ArtworkID ORDER BY i.IsPrimary DESC,i.DisplayOrder,i.ImageID) img`;
  const fields = `a.ArtworkID AS id,COALESCE(d.Title,vi.Title) AS title,ar.ArtistName AS artist,ar.ArtistID AS artistId,c.CategoryID AS categoryId,c.CategoryName AS category,a.MaterialID AS materialId,a.Material AS material,a.CreationPeriod AS creationPeriod,a.Dimensions AS dimensions,a.IsNationalTreasure AS isNationalTreasure,a.TreasureYear AS treasureYear,COALESCE(d.FullDescription,vi.FullDescription) AS description,CASE WHEN d.DescriptionID IS NOT NULL THEN d.ShortDescription ELSE vi.ShortDescription END AS shortDescription,CASE WHEN d.DescriptionID IS NOT NULL THEN d.AudioURL ELSE vi.AudioURL END AS audioUrl,CASE WHEN d.DescriptionID IS NOT NULL THEN @lang ELSE 'vi' END AS contentLanguage,CASE WHEN d.DescriptionID IS NOT NULL THEN @lang ELSE 'vi' END AS descriptionLanguage,a.InformationSource AS source,a.ImageSource AS imageSource,CASE WHEN d.DescriptionID IS NOT NULL THEN d.InformationSource ELSE vi.InformationSource END AS translationSource,img.ImageURL AS imageUrl,a.OwnerMuseumID AS ownerMuseumId,a.IsDemo AS isDemo,${currentFields}`;
  function format(row, lang) {
    const result = {
      ...row,
      requestedLanguage: lang,
      isFallback: row.contentLanguage !== lang,
    };
    result.currentExhibition = row.scheduleId
      ? {
          id: row.scheduleId,
          museumId: row.museumId,
          name: row.museum,
          address: row.museumAddress,
          latitude: Number(row.latitude),
          longitude: Number(row.longitude),
          startDate: row.startDate,
          endDate: row.endDate,
          source: row.exhibitionSource,
          verifiedOn: row.verifiedOn,
          isDemo: Boolean(row.isDemo || row.museumIsDemo),
        }
      : null;
    return result;
  }
  async function list(req, res, paginated) {
    const lang = R.language(req.query.lang || "vi");
    const q = R.text(req.query.q || "", "Từ khóa", 250) || "";
    const values = {
      lang,
      q: `%${q.replace(/[\[\]%_]/g, "[$&]")}%`,
      artist: req.query.artist ? R.id(req.query.artist) : null,
      material: req.query.material ? R.id(req.query.material) : null,
      museum: req.query.museum ? R.id(req.query.museum) : null,
      offset: 0,
      limit: paginated ? 12 : 200,
    };
    if (paginated) {
      const page = R.id(req.query.page || 1);
      if (page > 100000) R.fail("Trang không hợp lệ.");
      values.offset = (page - 1) * 12;
    }
    const where = `WHERE a.PublicationStatus='Published' AND (@artist IS NULL OR a.ArtistID=@artist) AND (@material IS NULL OR a.MaterialID=@material) AND (@museum IS NULL OR e.MuseumID=@museum) AND (a.ArtworkName COLLATE Latin1_General_100_CI_AI LIKE @q OR ar.ArtistName COLLATE Latin1_General_100_CI_AI LIKE @q OR d.Title COLLATE Latin1_General_100_CI_AI LIKE @q OR vi.Title COLLATE Latin1_General_100_CI_AI LIKE @q)`;
    const result = await query(
      app.locals.pool,
      `SELECT ${fields} ${publicFrom} ${where} ORDER BY a.ArtworkID OFFSET @offset ROWS FETCH NEXT @limit ROWS ONLY; SELECT COUNT(*) AS total ${publicFrom} ${where};`,
      values,
    );
    const items = result.recordset.map((row) => format(row, lang));
    res.json(
      paginated
        ? {
            items,
            total: result.recordsets[1][0].total,
            page: values.offset / 12 + 1,
            pageSize: 12,
          }
        : items,
    );
  }
  app.get(
    "/api/artworks",
    wrap((req, res) => list(req, res, false)),
  );
  app.get(
    "/api/catalog/artworks",
    wrap((req, res) => list(req, res, true)),
  );
  app.get(
    "/api/artworks/:id",
    wrap(async (req, res) => {
      const lang = R.language(req.query.lang || "vi"),
        id = R.id(req.params.id);
      const result = await query(
        app.locals.pool,
        `SELECT ${fields} ${publicFrom} WHERE a.ArtworkID=@id AND a.PublicationStatus='Published';`,
        { id, lang },
      );
      if (!result.recordset.length)
        R.fail("Không tìm thấy tác phẩm.", 404, "NOT_FOUND");
      res.json(format(result.recordset[0], lang));
    }),
  );
  app.get(
    "/api/catalog/filters",
    wrap(async (_req, res) => {
      const result = await query(
        app.locals.pool,
        `${selections.artists} ORDER BY name; ${selections.materials} ORDER BY name; ${selections.museums} WHERE IsPublic=1 ORDER BY name;`,
      );
      res.json({
        artists: result.recordsets[0],
        materials: result.recordsets[1],
        museums: result.recordsets[2],
      });
    }),
  );
  app.get(
    "/api/museums",
    wrap(async (req, res) => {
      const term = R.text(req.query.q || "", "Tên bảo tàng", 250) || "";
      const result = await query(
        app.locals.pool,
        `${selections.museums} WHERE IsPublic=1 AND Name COLLATE Latin1_General_100_CI_AI LIKE @q ORDER BY Name;`,
        { q: `%${term.replace(/[\[\]%_]/g, "[$&]")}%` },
      );
      res.json(result.recordset);
    }),
  );
  app.get(
    "/api/museums/:id",
    wrap(async (req, res) => {
      const id = R.id(req.params.id),
        lang = R.language(req.query.lang || "vi");
      const result = await query(
        app.locals.pool,
        `${selections.museums} WHERE MuseumID=@id AND IsPublic=1;`,
        { id },
      );
      if (!result.recordset.length)
        R.fail("Không tìm thấy bảo tàng.", 404, "NOT_FOUND");
      const artworks = await query(
        app.locals.pool,
        `SELECT ${fields} ${publicFrom} WHERE a.PublicationStatus='Published' AND e.MuseumID=@id ORDER BY a.ArtworkID;`,
        { id, lang },
      );
      res.json({
        ...result.recordset[0],
        artworks: artworks.recordset.map((row) => format(row, lang)),
      });
    }),
  );
  app.get(
    "/api/admin/catalog/:entity",
    gate,
    wrap(async (req, res) => {
      if (!selections[req.params.entity])
        R.fail("Không tìm thấy dữ liệu.", 404, "NOT_FOUND");
      res.json(
        (await query(app.locals.pool, selections[req.params.entity])).recordset,
      );
    }),
  );
  async function save(req, res) {
    const entity = req.params.entity,
      originalId = req.params.id ? R.id(req.params.id) : null;
    if (!entities[entity]) R.fail("Không tìm thấy dữ liệu.", 404, "NOT_FOUND");
    const [table, key] = entities[entity],
      body = req.body || {};
    const data =
      entity === "artworks"
        ? R.artwork(body)
        : entity === "translations"
          ? R.translation(body)
          : entity === "museums"
            ? R.museum(body)
            : entity === "schedules"
              ? R.schedule(body)
              : {
                  name: R.text(
                    body.name,
                    "Tên",
                    entity === "artists"
                      ? 200
                      : entity === "categories"
                        ? 100
                        : 200,
                    true,
                  ),
                  description: R.text(
                    body.description,
                    "Mô tả",
                    entity === "categories" ? 500 : 12000,
                  ),
                };
    const id = await transaction(async (tx) => {
      let old;
      if (originalId) {
        old = (
          await query(
            tx,
            `SELECT * FROM dbo.${table} WITH(UPDLOCK,HOLDLOCK) WHERE ${key}=@id`,
            { id: originalId },
          )
        ).recordset[0];
        if (!old) R.fail("Bản ghi không còn tồn tại.", 404, "NOT_FOUND");
      }
      if (entity === "schedules" || entity === "translations") {
        const artwork = (
          await query(
            tx,
            `SELECT ArtworkID,PublicationStatus FROM dbo.Artworks WITH(UPDLOCK,HOLDLOCK) WHERE ArtworkID=@artworkId`,
            { artworkId: data.artworkId },
          )
        ).recordset[0];
        if (!artwork) R.fail("Không tìm thấy tác phẩm.");
        if (entity === "translations" && old) {
          const oldLang = (
            await query(
              tx,
              "SELECT LanguageCode FROM dbo.Languages WHERE LanguageID=@id",
              { id: old.LanguageID },
            )
          ).recordset[0]?.LanguageCode;
          if (old.ArtworkID !== data.artworkId || oldLang !== data.language)
            R.fail("Không đổi tác phẩm hoặc ngôn ngữ của bản dịch đã lưu.");
        }
        if (
          entity === "translations" &&
          data.language === "vi" &&
          data.status !== "Published" &&
          artwork.PublicationStatus === "Published"
        )
          R.fail(
            "Ẩn tác phẩm trước khi chuyển bản tiếng Việt về nháp.",
            409,
            "DEFAULT_TRANSLATION_REQUIRED",
          );
      }
      if (entity === "schedules") {
        const museum = (
          await query(
            tx,
            "SELECT MuseumID,IsPublic FROM dbo.Museums WITH(UPDLOCK,HOLDLOCK) WHERE MuseumID=@museumId",
            { museumId: data.museumId },
          )
        ).recordset[0];
        if (!museum) R.fail("Không tìm thấy bảo tàng.");
        if (data.status === "Confirmed") {
          if (!museum.IsPublic)
            R.fail("Chỉ xác nhận lịch tại bảo tàng đang công khai.");
          const conflicts = await query(
            tx,
            `SELECT TOP(1) ScheduleID FROM dbo.DisplaySchedules WITH(UPDLOCK,HOLDLOCK) WHERE ArtworkID=@artworkId AND Status='Confirmed' AND (@id IS NULL OR ScheduleID<>@id) AND (@endDate IS NULL OR StartDate<CONVERT(date,@endDate)) AND (EndDate IS NULL OR CONVERT(date,@startDate)<EndDate);`,
            { ...data, id: originalId },
          );
          if (conflicts.recordset.length)
            R.fail(
              "Tác phẩm đã có lịch trưng bày được xác nhận trong khoảng này.",
              409,
              "SCHEDULE_OVERLAP",
            );
        }
      }
      if (entity === "museums" && old && !data.isPublic) {
        const active = await query(
          tx,
          `SELECT TOP(1) ScheduleID FROM dbo.DisplaySchedules WITH(UPDLOCK,HOLDLOCK) WHERE MuseumID=@id AND Status='Confirmed' AND (EndDate IS NULL OR EndDate>${TODAY})`,
          { id: originalId },
        );
        if (active.recordset.length)
          R.fail(
            "Không thể ẩn bảo tàng còn lịch hiện tại hoặc tương lai đã xác nhận.",
            409,
            "MUSEUM_HAS_SCHEDULES",
          );
      }
      if (entity === "artworks") {
        const material = (
          await query(
            tx,
            "SELECT Name FROM dbo.Materials WITH(HOLDLOCK) WHERE MaterialID=@id",
            { id: data.materialId },
          )
        ).recordset[0];
        if (!material) R.fail("Chất liệu không tồn tại.");
        data.material = material.Name;
        if (data.status === "Published") {
          if (!originalId)
            R.fail(
              "Lưu nháp và công bố bản tiếng Việt trước khi công bố tác phẩm.",
            );
          const vi = await query(
            tx,
            `SELECT d.DescriptionID FROM dbo.ArtworkDescriptions d WITH(UPDLOCK,HOLDLOCK) JOIN dbo.Languages l ON l.LanguageID=d.LanguageID WHERE d.ArtworkID=@id AND l.LanguageCode='vi' AND d.PublicationStatus='Published' AND NULLIF(LTRIM(RTRIM(d.Title)),'') IS NOT NULL AND NULLIF(LTRIM(RTRIM(d.FullDescription)),'') IS NOT NULL;`,
            { id: originalId },
          );
          if (!vi.recordset.length)
            R.fail(
              "Cần tên và mô tả tiếng Việt đã công bố trước khi công bố tác phẩm.",
              409,
              "DEFAULT_TRANSLATION_REQUIRED",
            );
        }
      }
      if (entity === "materials" && old && old.Name !== data.name)
        await query(
          tx,
          "UPDATE dbo.Artworks SET Material=@name WHERE MaterialID=@id",
          { name: data.name, id: originalId },
        );
      const maps = {
        artworks: {
          title: "ArtworkName",
          artistId: "ArtistID",
          categoryId: "CategoryID",
          materialId: "MaterialID",
          material: "Material",
          creationPeriod: "CreationPeriod",
          dimensions: "Dimensions",
          source: "InformationSource",
          imageSource: "ImageSource",
          ownerMuseumId: "OwnerMuseumID",
          status: "PublicationStatus",
        },
        museums: {
          name: "Name",
          address: "Address",
          description: "Description",
          contact: "Contact",
          latitude: "Latitude",
          longitude: "Longitude",
          isPublic: "IsPublic",
          pinVerified: "PinVerified",
          source: "Source",
        },
        schedules: {
          artworkId: "ArtworkID",
          museumId: "MuseumID",
          startDate: "StartDate",
          endDate: "EndDate",
          status: "Status",
          source: "Source",
          verifiedOn: "VerifiedOn",
          updatedBy: "UpdatedBy",
        },
        translations: {
          artworkId: "ArtworkID",
          languageId: "LanguageID",
          title: "Title",
          description: "FullDescription",
          shortDescription: "ShortDescription",
          source: "InformationSource",
          audioUrl: "AudioURL",
          status: "PublicationStatus",
        },
        artists: { name: "ArtistName", description: "Biography" },
        materials: { name: "Name" },
        categories: { name: "CategoryName", description: "Description" },
      };
      if (entity === "translations")
        data.languageId = (
          await query(
            tx,
            "SELECT LanguageID FROM dbo.Languages WHERE LanguageCode=@language",
            { language: data.language },
          )
        ).recordset[0]?.LanguageID;
      if (entity === "schedules") data.updatedBy = req.admin.id;
      const fields = Object.entries(maps[entity]);
      const statement = originalId
        ? `UPDATE dbo.${table} SET ${fields.map(([name, column]) => `${column}=@${name}`).join(",")}${entity === "schedules" ? ",UpdatedAt=SYSUTCDATETIME()" : ""} WHERE ${key}=@id; SELECT @id AS id;`
        : `INSERT INTO dbo.${table}(${fields.map(([, column]) => column).join(",")}) OUTPUT INSERTED.${key} AS id VALUES(${fields.map(([name]) => `@${name}`).join(",")});`;
      const savedId = (
        await query(tx, statement, {
          ...Object.fromEntries(fields.map(([name]) => [name, data[name]])),
          id: originalId,
        })
      ).recordset[0].id;
      if (entity === "artworks" && data.imageUrl)
        await query(
          tx,
          `UPDATE dbo.ArtworkImages SET IsPrimary=0 WHERE ArtworkID=@id; IF EXISTS(SELECT 1 FROM dbo.ArtworkImages WHERE ArtworkID=@id AND ImageURL=@image) UPDATE dbo.ArtworkImages SET IsPrimary=1 WHERE ArtworkID=@id AND ImageURL=@image; ELSE INSERT INTO dbo.ArtworkImages(ArtworkID,ImageURL,IsPrimary,DisplayOrder) VALUES(@id,@image,1,0);`,
          { id: savedId, image: data.imageUrl },
        );
      return savedId;
    });
    res.status(originalId ? 200 : 201).json({ id, message: "Đã lưu dữ liệu." });
  }
  app.post("/api/admin/catalog/:entity", gate, wrap(save));
  app.put("/api/admin/catalog/:entity/:id", gate, wrap(save));
  app.delete(
    "/api/admin/catalog/:entity/:id",
    gate,
    wrap(async (req, res) => {
      const entity = req.params.entity,
        id = R.id(req.params.id);
      if (entity === "artworks") {
        await transaction(async (tx) => {
          const found = await query(
            tx,
            "SELECT ArtworkID FROM dbo.Artworks WITH(UPDLOCK,HOLDLOCK) WHERE ArtworkID=@id",
            { id },
          );
          if (!found.recordset.length)
            R.fail("Không tìm thấy tác phẩm.", 404, "NOT_FOUND");
          await query(
            tx,
            "UPDATE dbo.Artworks SET PublicationStatus='Hidden' WHERE ArtworkID=@id",
            { id },
          );
        });
        return res.json({
          message: "Đã xóa khỏi công khai; giữ dữ liệu và lịch sử tham chiếu.",
        });
      }
      if (!["artists", "materials", "categories"].includes(entity))
        R.fail(
          "Dùng ẩn tác phẩm, ẩn bảo tàng hoặc hủy lịch để giữ lịch sử tham chiếu.",
          409,
          "USE_SOFT_DELETE",
        );
      const [table, key] = entities[entity];
      await transaction(async (tx) => {
        const found = await query(
          tx,
          `SELECT ${key} FROM dbo.${table} WITH(UPDLOCK,HOLDLOCK) WHERE ${key}=@id`,
          { id },
        );
        if (!found.recordset.length)
          R.fail("Không tìm thấy bản ghi.", 404, "NOT_FOUND");
        // Foreign keys atomically reject deletion of referenced classifications.
        await query(tx, `DELETE FROM dbo.${table} WHERE ${key}=@id`, { id });
      });
      res.json({ message: "Đã xóa mục chưa được sử dụng." });
    }),
  );
}
module.exports = { attachCatalogRoutes, CURRENT, TODAY };
