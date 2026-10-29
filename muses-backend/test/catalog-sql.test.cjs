// Opt-in live SQL acceptance. Creates/drops ONLY a uniquely named disposable test database.
const { test } = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
require("dotenv").config({
  path: path.join(__dirname, "../.env.test.local"),
  quiet: true,
});
const sql = require("mssql");
const express = require("express");
const { attachActivityRoutes, hashPassword } = require("../activity.cjs");
const { attachCatalogRoutes } = require("../catalog.cjs");
const { todayVN } = require("../catalog-rules.cjs");
const enabled = Boolean(
  process.env.TEST_SQL_USER && process.env.TEST_SQL_PASSWORD,
);
test(
  "LIVE SQL: migration rerun, publication, reviewed translations, current museum, overlap concurrency, hide guard, logout",
  { skip: !enabled, timeout: 120000 },
  async () => {
    const database = `MusesPrdTest_${Date.now()}_${process.pid}`;
    const config = {
      server: process.env.TEST_SQL_SERVER || "localhost",
      port: Number(process.env.TEST_SQL_PORT || 1433),
      database: "master",
      user: process.env.TEST_SQL_USER,
      password: process.env.TEST_SQL_PASSWORD,
      options: {
        encrypt: true,
        trustServerCertificate:
          process.env.TEST_SQL_TRUST_CERTIFICATE === "true",
      },
    };
    let master, pool, server;
    try {
      master = await new sql.ConnectionPool(config).connect();
      await master.request().query(`CREATE DATABASE [${database}];`);
      pool = await new sql.ConnectionPool({ ...config, database }).connect();
      await pool.request()
        .query(`CREATE TABLE Users(UserID INT IDENTITY PRIMARY KEY,FullName NVARCHAR(150),Email VARCHAR(255) UNIQUE,PasswordHash NVARCHAR(500),Role VARCHAR(30),IsActive BIT DEFAULT 1);
  CREATE TABLE Languages(LanguageID INT IDENTITY PRIMARY KEY,LanguageCode VARCHAR(10) UNIQUE,LanguageName NVARCHAR(100));
  CREATE TABLE Artists(ArtistID INT IDENTITY PRIMARY KEY,ArtistName NVARCHAR(200),Biography NVARCHAR(MAX));
  CREATE TABLE Categories(CategoryID INT IDENTITY PRIMARY KEY,CategoryName NVARCHAR(100) UNIQUE,Description NVARCHAR(500));
  CREATE TABLE Artworks(ArtworkID INT IDENTITY PRIMARY KEY,ArtworkName NVARCHAR(250) NOT NULL,ArtistID INT NOT NULL REFERENCES Artists(ArtistID),CategoryID INT NOT NULL REFERENCES Categories(CategoryID),Material NVARCHAR(200),CreationPeriod NVARCHAR(150),Dimensions NVARCHAR(100),IsNationalTreasure BIT DEFAULT 0,TreasureYear INT);
  CREATE TABLE ArtworkImages(ImageID INT IDENTITY PRIMARY KEY,ArtworkID INT REFERENCES Artworks(ArtworkID),ImageURL NVARCHAR(500),IsPrimary BIT,DisplayOrder INT);
  CREATE TABLE ArtworkDescriptions(DescriptionID INT IDENTITY PRIMARY KEY,ArtworkID INT REFERENCES Artworks(ArtworkID),LanguageID INT REFERENCES Languages(LanguageID),ShortDescription NVARCHAR(1000),FullDescription NVARCHAR(MAX),AudioURL NVARCHAR(500),UNIQUE(ArtworkID,LanguageID));`);
      for (let run = 0; run < 2; run++)
        for (const file of [
          "ActivityAnalytics.sql",
          "Catalog.sql",
          "Tickets.sql",
        ])
          for (const batch of fs
            .readFileSync(path.join(__dirname, "../MusesDB", file), "utf8")
            .split(/^GO\s*$/im)
            .filter((x) => x.trim()))
            await pool.request().query(batch);
      await pool
        .request()
        .input(
          "hash",
          sql.NVarChar(500),
          await hashPassword("Prd-test-password"),
        )
        .query(
          "INSERT INTO Users(FullName,Email,PasswordHash,Role) VALUES(N'Acceptance','admin@prd.invalid',@hash,'Admin');",
        );
      const app = express();
      app.use(express.json({ limit: "64kb" }));
      app.locals.pool = pool;
      attachActivityRoutes(app, sql);
      attachCatalogRoutes(app, sql);
      server = app.listen(0, "127.0.0.1");
      await new Promise((r) => server.once("listening", r));
      const origin = `http://127.0.0.1:${server.address().port}`;
      let cookie = "";
      async function api(url, method = "GET", body, expected = 200) {
        const r = await fetch(origin + url, {
          method,
          headers: { "Content-Type": "application/json", Cookie: cookie },
          body: body ? JSON.stringify(body) : undefined,
        });
        const data = await r.json();
        assert.equal(r.status, expected, JSON.stringify(data));
        return data;
      }
      const login = await fetch(origin + "/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: "admin@prd.invalid",
          password: "Prd-test-password",
        }),
      });
      assert.equal(login.status, 200);
      cookie = login.headers.get("set-cookie").split(";")[0];
      const add = (kind, body) =>
        api("/api/admin/catalog/" + kind, "POST", body, 201);
      const artistId = (await add("artists", { name: "Artist" })).id,
        categoryId = (await add("categories", { name: "Category" })).id,
        materialId = (await add("materials", { name: "Oil" })).id;
      const museumBody = {
        name: "Owner",
        address: "Test address",
        latitude: 10.8,
        longitude: 106.6,
        isPublic: true,
        pinVerified: true,
        source: "Acceptance fixture",
      };
      const owner = (await add("museums", museumBody)).id,
        current = (await add("museums", { ...museumBody, name: "Current" })).id;
      const body = {
        title: "Physical object",
        artistId,
        categoryId,
        materialId,
        ownerMuseumId: owner,
        source: "Test source",
        imageSource: "Self created",
        imageUrl: "https://example.org/self-created.svg",
        status: "Draft",
      };
      const id = (await add("artworks", body)).id;
      await api(`/api/artworks/${id}`, "GET", undefined, 404);
      await api(
        `/api/admin/catalog/artworks/${id}`,
        "PUT",
        { ...body, status: "Published" },
        409,
      );
      const vi = (
        await add("translations", {
          artworkId: id,
          language: "vi",
          title: "Hiện vật",
          description: "Mô tả kiểm thử",
          source: "Manual test",
          status: "Published",
        })
      ).id;
      await api(`/api/admin/catalog/artworks/${id}`, "PUT", {
        ...body,
        status: "Published",
      });
      let detail = await api(`/api/artworks/${id}?lang=ko`);
      assert.equal(detail.isFallback, true);
      assert.equal(detail.contentLanguage, "vi");
      assert.equal(detail.currentExhibition, null);
      const translated = {
        artworkId: id,
        language: "ko",
        title: "작품",
        description: "테스트 설명",
        source: "Manual fixture",
        status: "Draft",
      };
      const ko = (await add("translations", translated)).id;
      assert.equal((await api(`/api/artworks/${id}?lang=ko`)).isFallback, true);
      await api(`/api/admin/catalog/translations/${ko}`, "PUT", {
        ...translated,
        status: "Published",
      });
      assert.equal(
        (await api(`/api/artworks/${id}?lang=ko`)).contentLanguage,
        "ko",
      );
      await api("/api/admin/catalog/translations", "POST", translated, 409);
      await api(
        `/api/admin/catalog/translations/${vi}`,
        "PUT",
        { artworkId: id, language: "vi", status: "Draft" },
        409,
      );
      const inlineBody = {
        ...body,
        title: "Một form công bố",
        descriptionVi: "Nội dung tiếng Việt lưu cùng tác phẩm.",
        shortDescriptionVi: "Mô tả ngắn",
        status: "Published",
      };
      const inlineId = (await add("artworks", inlineBody)).id;
      assert.equal(
        (await api(`/api/artworks/${inlineId}`)).description,
        inlineBody.descriptionVi,
      );
      const adminInline = (await api("/api/admin/catalog/artworks")).find(
        (row) => row.id === inlineId,
      );
      assert.equal(adminInline.descriptionVi, inlineBody.descriptionVi);
      await pool
        .request()
        .input("id", sql.Int, inlineId)
        .query(
          "UPDATE dbo.ArtworkDescriptions SET AudioURL='https://example.org/original.mp3',InformationSource=N'Existing translation source' WHERE ArtworkID=@id;",
        );
      await api(`/api/admin/catalog/artworks/${inlineId}`, "PUT", {
        ...inlineBody,
        descriptionVi: "Mô tả chỉnh sửa.",
      });
      const preserved = await pool
        .request()
        .input("id", sql.Int, inlineId)
        .query(
          "SELECT AudioURL,InformationSource FROM dbo.ArtworkDescriptions WHERE ArtworkID=@id;",
        );
      assert.equal(
        preserved.recordset[0].AudioURL,
        "https://example.org/original.mp3",
      );
      assert.equal(
        preserved.recordset[0].InformationSource,
        "Existing translation source",
      );
      const countBefore = (
        await pool
          .request()
          .query("SELECT COUNT(*) AS count FROM dbo.Artworks;")
      ).recordset[0].count;
      await pool
        .request()
        .query(
          "CREATE TRIGGER dbo.ForceInlineFailure ON dbo.ArtworkDescriptions AFTER INSERT,UPDATE AS BEGIN THROW 51001,N'Forced inline test failure',1; END;",
        );
      try {
        await api(
          "/api/admin/catalog/artworks",
          "POST",
          { ...inlineBody, title: "Must roll back" },
          503,
        );
      } finally {
        await pool.request().query("DROP TRIGGER dbo.ForceInlineFailure;");
      }
      assert.equal(
        (
          await pool
            .request()
            .query("SELECT COUNT(*) AS count FROM dbo.Artworks;")
        ).recordset[0].count,
        countBefore,
      );
      const today = todayVN(),
        shift = (n) =>
          new Date(new Date(today + "T00:00:00Z").getTime() + n * 86400000)
            .toISOString()
            .slice(0, 10);
      const s = {
        artworkId: id,
        museumId: current,
        startDate: shift(-2),
        endDate: today,
        status: "Confirmed",
        verifiedOn: today,
        source: "Verified test",
      };
      await add("schedules", s);
      assert.equal(
        (await api(`/api/artworks/${id}`)).currentExhibition,
        null,
        "end day excluded",
      );
      const future = (
        await add("schedules", { ...s, startDate: shift(1), endDate: shift(2) })
      ).id;
      assert.equal(
        (await api(`/api/artworks/${id}`)).currentExhibition,
        null,
        "future not current",
      );
      await api(`/api/admin/catalog/schedules/${future}`, "PUT", {
        ...s,
        startDate: shift(1),
        endDate: shift(2),
        status: "Cancelled",
      });
      const schedule = (
        await add("schedules", { ...s, startDate: today, endDate: null })
      ).id;
      detail = await api(`/api/artworks/${id}`);
      assert.equal(detail.currentExhibition.museumId, current);
      assert.notEqual(detail.currentExhibition.museumId, detail.ownerMuseumId);
      await api(
        `/api/admin/catalog/museums/${current}`,
        "PUT",
        { ...museumBody, name: "Current", isPublic: false },
        409,
      );
      await api(`/api/admin/catalog/schedules/${schedule}`, "PUT", {
        ...s,
        startDate: today,
        endDate: null,
        status: "Cancelled",
      });
      const responses = await Promise.all(
        [current, owner].map((museumId) =>
          fetch(origin + "/api/admin/catalog/schedules", {
            method: "POST",
            headers: { "Content-Type": "application/json", Cookie: cookie },
            body: JSON.stringify({
              ...s,
              museumId,
              startDate: today,
              endDate: null,
            }),
          }),
        ),
      );
      assert.deepEqual(
        responses.map((r) => r.status).sort(),
        [201, 409],
        "exactly one overlapping concurrent confirmation succeeds",
      );
      await api(
        "/api/admin/catalog/artists/" + artistId,
        "DELETE",
        undefined,
        409,
      );
      await api("/api/auth/logout", "POST", {});
      await api("/api/admin/catalog/artworks", "GET", undefined, 401);
    } finally {
      if (server) await new Promise((r) => server.close(r));
      if (pool) await pool.close();
      if (master) {
        await master
          .request()
          .query(
            `IF DB_ID(N'${database}') IS NOT NULL BEGIN ALTER DATABASE [${database}] SET SINGLE_USER WITH ROLLBACK IMMEDIATE;DROP DATABASE [${database}];END;`,
          );
        await master.close();
      }
    }
  },
);
