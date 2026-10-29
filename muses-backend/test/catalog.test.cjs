const { test, before, after } = require("node:test");
const assert = require("node:assert/strict");
const express = require("express");
const sql = require("mssql");
const R = require("../catalog-rules.cjs");
const { attachCatalogRoutes } = require("../catalog.cjs");
const schedule = {
  artworkId: 1,
  museumId: 1,
  startDate: "2026-10-01",
  endDate: "2026-11-01",
  verifiedOn: "2026-10-01",
  source: "Confirmed catalogue",
  status: "Confirmed",
};
test("Vietnam date boundaries are start-inclusive and end-exclusive, no owner inference", () => {
  assert.equal(R.todayVN(new Date("2026-10-28T17:00:00Z")), "2026-10-29");
  const s = { ...schedule, isPublic: true };
  assert.equal(R.isCurrent(s, "2026-09-30"), false);
  assert.equal(R.isCurrent(s, "2026-10-01"), true);
  assert.equal(R.isCurrent(s, "2026-11-01"), false);
  assert.equal(R.isCurrent({ ...s, status: "Draft" }, "2026-10-02"), false);
  assert.equal(R.isCurrent({ ...s, status: "Cancelled" }, "2026-10-02"), false);
  assert.equal(R.isCurrent({ ...s, isPublic: false }, "2026-10-02"), false);
  assert.equal(R.isCurrent({ ...s, endDate: null }, "2030-01-01"), true);
});
test("overlap covers unbounded dates, same museum, adjacency, and reversed dates", () => {
  assert.equal(
    R.overlaps(schedule, { startDate: "2026-10-31", endDate: null }),
    true,
  );
  assert.equal(
    R.overlaps(schedule, { startDate: "2026-11-01", endDate: null }),
    false,
  );
  assert.equal(
    R.overlaps(
      { ...schedule, endDate: null },
      { startDate: "2030-01-01", endDate: null },
    ),
    true,
  );
  for (const input of [
    { ...schedule, endDate: schedule.startDate },
    { ...schedule, startDate: "2026-02-30" },
    { ...schedule, source: "" },
    { ...schedule, verifiedOn: "2099-01-01" },
  ])
    assert.throws(() => R.schedule(input));
});
test("coordinates, address and verified pin are validated without requesting visitor GPS", () => {
  const museum = {
    name: "Test",
    address: "Test address",
    latitude: 10,
    longitude: 106,
    isPublic: true,
    pinVerified: true,
    source: "Official source",
  };
  assert.equal(R.museum(museum).latitude, 10);
  for (const input of [
    { ...museum, latitude: 91 },
    { ...museum, longitude: -181 },
    { ...museum, latitude: "" },
    { ...museum, address: "" },
    { ...museum, pinVerified: false },
  ])
    assert.throws(() => R.museum(input));
});
test("translation drafts cannot masquerade as published data; target language set includes Korean", () => {
  assert.deepEqual(R.LANGUAGES, ["vi", "en", "zh", "ja", "ko"]);
  assert.throws(() =>
    R.translation({
      artworkId: 1,
      language: "ko",
      status: "Published",
      description: "Text",
    }),
  );
  assert.throws(() =>
    R.translation({ artworkId: 1, language: "xx", status: "Draft" }),
  );
  assert.equal(
    R.translation({ artworkId: 1, language: "ko", status: "Draft" }).status,
    "Draft",
  );
  for (const bad of [
    "javascript:alert(1)",
    "https://a:b@example.com/a",
    "/images/../secret",
  ])
    assert.throws(() => R.url(bad));
});
let server,
  origin,
  role = null,
  calls = [],
  conflict = false,
  requiredVi = false,
  hasSchedules = false;
const transactions = [];
let failInlineVi = false;
const row = {
  id: 1,
  title: "Vietnamese title",
  description: "Vietnamese description",
  contentLanguage: "vi",
  descriptionLanguage: "vi",
  scheduleId: 8,
  museumId: 2,
  museum: "Current, not owner",
  museumAddress: "Address",
  latitude: 10,
  longitude: 106,
  startDate: "2026-10-01",
  source: "Source",
};
before(async () => {
  const app = express();
  app.use(express.json());
  app.locals.identity = async () => (role ? { id: 1, role } : null);
  function request() {
    const values = {};
    return {
      input(name, type, value) {
        values[name] = value;
        return this;
      },
      async query(statement) {
        calls.push({ statement, values });
        if (
          statement.startsWith(
            "SELECT LanguageID FROM dbo.Languages WHERE LanguageCode='vi'",
          )
        )
          return { recordset: [{ LanguageID: 1 }] };
        if (
          statement.includes(
            "UPDATE dbo.ArtworkDescriptions WITH(UPDLOCK,HOLDLOCK)",
          ) &&
          failInlineVi
        )
          throw Error("Forced inline save failure");
        if (statement.includes("AS contentLanguage"))
          return {
            recordset: values.id === 999 ? [] : [row],
            recordsets: [[row], [{ total: 1 }]],
          };
        if (statement.includes("SELECT Name FROM dbo.Materials"))
          return { recordset: [{ Name: "Oil" }] };
        if (statement.includes("SELECT ArtworkID,PublicationStatus"))
          return { recordset: [{ ArtworkID: 1, PublicationStatus: "Draft" }] };
        if (statement.includes("SELECT MuseumID,IsPublic"))
          return { recordset: [{ MuseumID: 1, IsPublic: 1 }] };
        if (statement.includes("ScheduleID FROM dbo.DisplaySchedules"))
          return {
            recordset: conflict || hasSchedules ? [{ ScheduleID: 1 }] : [],
          };
        if (statement.includes("d.DescriptionID FROM"))
          return { recordset: requiredVi ? [] : [{ DescriptionID: 1 }] };
        if (statement.includes("SELECT * FROM dbo."))
          return { recordset: [{ ArtworkID: 1, Name: "Museum" }] };
        return {
          recordset: [{ id: 1 }],
          recordsets: [[{ id: 1 }], [{ total: 1 }]],
        };
      },
    };
  }
  app.locals.pool = {
    request,
    transaction() {
      const tx = {
        async begin() {},
        async commit() {
          this.committed = true;
        },
        async rollback() {
          this.rolledBack = true;
        },
        request,
      };
      transactions.push(tx);
      return tx;
    },
  };
  attachCatalogRoutes(app, sql);
  server = app.listen(0, "127.0.0.1");
  await new Promise((r) => server.once("listening", r));
  origin = `http://127.0.0.1:${server.address().port}`;
});
after(() => new Promise((r) => server.close(r)));
const send = (path, method = "GET", body) =>
  fetch(origin + path, {
    method,
    headers: { "Content-Type": "application/json" },
    body: body ? JSON.stringify(body) : undefined,
  });
test("all admin catalog APIs require an authenticated administrator", async () => {
  for (role of [null, "Visitor"])
    for (const method of ["GET", "POST", "PUT", "DELETE"]) {
      const response = await send(
        "/api/admin/catalog/artworks" +
          (["PUT", "DELETE"].includes(method) ? "/1" : ""),
        method,
        method === "GET" ? undefined : {},
      );
      assert.equal(response.status, role ? 403 : 401);
    }
  role = "Admin";
  assert.equal((await send("/api/admin/catalog/artworks")).status, 200);
});
test("public queries filter publication at API level, manual fallback metadata and current schedule only", async () => {
  calls = [];
  const response = await send("/api/artworks/1?lang=ko");
  assert.equal(response.status, 200);
  const data = await response.json();
  assert.equal(data.requestedLanguage, "ko");
  assert.equal(data.contentLanguage, "vi");
  assert.equal(data.isFallback, true);
  assert.equal(data.currentExhibition.museumId, 2);
  assert.match(calls[0].statement, /a.PublicationStatus='Published'/);
  assert.match(calls[0].statement, /d.PublicationStatus='Published'/);
  assert.match(calls[0].statement, /s.Status='Confirmed'/);
  assert.match(calls[0].statement, /m.IsPublic=1/);
  assert.equal((await send("/api/artworks/999")).status, 404);
});
test("combined filters and pagination bind parameters, never interpolate the search text", async () => {
  calls = [];
  const response = await send(
    "/api/catalog/artworks?lang=ja&q=%27%20DROP&artist=1&material=2&museum=3&page=2",
  );
  assert.equal(response.status, 200);
  assert.equal((await response.json()).page, 2);
  const call = calls.at(-1);
  assert.equal(call.values.artist, 1);
  assert.equal(call.values.material, 2);
  assert.equal(call.values.museum, 3);
  assert.equal(call.values.offset, 12);
  assert.ok(!call.statement.includes("DROP"));
  assert.equal((await send("/api/catalog/artworks?page=-1")).status, 400);
});
test("publication requires Vietnamese translation and does not erase entered draft on failure", async () => {
  role = "Admin";
  requiredVi = true;
  const response = await send("/api/admin/catalog/artworks/1", "PUT", {
    title: "Draft",
    artistId: 1,
    categoryId: 1,
    materialId: 1,
    status: "Published",
    source: "Source",
    imageUrl: "https://example.org/test.jpg",
    imageSource: "Licensed",
  });
  assert.equal(response.status, 409);
  assert.equal((await response.json()).code, "DEFAULT_TRANSLATION_REQUIRED");
  requiredVi = false;
});
test("artworks and reviewed translations can be published without source fields", async () => {
  const input = {
    title: "Tác phẩm",
    artistId: 1,
    categoryId: 1,
    materialId: 1,
    imageUrl: "https://example.org/artwork.jpg",
    status: "Published",
  };
  assert.equal(R.artwork(input).source, null);
  assert.equal(R.artwork(input).imageSource, null);
  assert.equal(
    R.translation({
      artworkId: 1,
      language: "vi",
      title: "Tác phẩm",
      description: "Mô tả đã duyệt.",
      status: "Published",
    }).source,
    null,
  );
  role = "Admin";
  calls = [];
  assert.equal(
    (await send("/api/admin/catalog/artworks/1", "PUT", input)).status,
    200,
  );
  const update = calls.find((c) =>
    c.statement.startsWith("UPDATE dbo.Artworks SET ArtworkName="),
  );
  assert.equal(update.values.source, null);
  assert.equal(update.values.imageSource, null);
});
test("overlapping confirmed schedules and museum hiding with schedules are rejected", async () => {
  role = "Admin";
  conflict = true;
  assert.equal(
    (await send("/api/admin/catalog/schedules", "POST", schedule)).status,
    409,
  );
  conflict = false;
  hasSchedules = true;
  assert.equal(
    (
      await send("/api/admin/catalog/museums/1", "PUT", {
        name: "Test",
        address: "Address",
        latitude: 10,
        longitude: 106,
        isPublic: false,
      })
    ).status,
    409,
  );
  hasSchedules = false;
});
test("schedule save uses serializable transaction, locks physical artwork and parameterizes audit user", async () => {
  role = "Admin";
  calls = [];
  const response = await send("/api/admin/catalog/schedules", "POST", schedule);
  assert.equal(response.status, 201);
  assert.ok(
    calls.some((c) =>
      c.statement.includes("dbo.Artworks WITH(UPDLOCK,HOLDLOCK)"),
    ),
  );
  assert.ok(
    calls.some((c) =>
      c.statement.includes("dbo.DisplaySchedules WITH(UPDLOCK,HOLDLOCK)"),
    ),
  );
  const save = calls.find((c) =>
    c.statement.startsWith("INSERT INTO dbo.DisplaySchedules"),
  );
  assert.equal(save.values.updatedBy, 1);
});
test("artworks are soft deleted; other referenced history cannot be hard deleted", async () => {
  calls = [];
  role = "Admin";
  assert.equal(
    (await send("/api/admin/catalog/artworks/1", "DELETE")).status,
    200,
  );
  assert.ok(
    calls.some((c) => c.statement.includes("PublicationStatus='Hidden'")),
  );
  assert.ok(
    !calls.some((c) => c.statement.includes("DELETE FROM dbo.Artworks")),
  );
  role = "Admin";
  for (const entity of ["museums", "schedules", "translations"])
    assert.equal(
      (await send(`/api/admin/catalog/${entity}/1`, "DELETE")).status,
      409,
    );
});

test("one artwork request saves Vietnamese content and publishes both new and existing artworks", async () => {
  role = "Admin";
  requiredVi = true;
  const input = {
    title: "Tác phẩm A",
    artistId: 1,
    categoryId: 1,
    materialId: 1,
    imageUrl: "/images/tranh/test.jpg",
    descriptionVi: "Mô tả tiếng Việt đã duyệt.",
    shortDescriptionVi: "Mô tả ngắn",
    status: "Published",
  };
  for (const [path, method, status] of [
    ["/api/admin/catalog/artworks", "POST", 201],
    ["/api/admin/catalog/artworks/1", "PUT", 200],
  ]) {
    calls = [];
    assert.equal((await send(path, method, input)).status, status);
    assert.ok(
      !calls.some((c) => c.statement.includes("SELECT d.DescriptionID FROM")),
      "inline publishing does not require a prior separate translation action",
    );
    const write = calls.find((c) =>
      c.statement.includes(
        "UPDATE dbo.ArtworkDescriptions WITH(UPDLOCK,HOLDLOCK)",
      ),
    );
    assert.equal(write.values.title, input.title);
    assert.equal(write.values.description, input.descriptionVi);
    assert.equal(write.values.artworkStatus, "Published");
    assert.ok(
      calls.findIndex((c) => c === write) <
        calls.findIndex(
          (c) =>
            c.statement ===
            "UPDATE dbo.Artworks SET PublicationStatus='Published' WHERE ArtworkID=@id",
        ),
      "publish only after saving Vietnamese",
    );
    assert.ok(!write.statement.includes("AudioURL="));
    assert.ok(!write.statement.includes("InformationSource="));
    assert.equal(transactions.at(-1).committed, true);
  }
  requiredVi = false;
});
test("incomplete Vietnamese text is allowed in drafts but blocks inline publication before writes", async () => {
  role = "Admin";
  const input = {
    title: "Draft A",
    artistId: 1,
    categoryId: 1,
    materialId: 1,
    imageUrl: "/images/tranh/test.jpg",
    descriptionVi: "",
    status: "Published",
  };
  calls = [];
  assert.equal(
    (await send("/api/admin/catalog/artworks", "POST", input)).status,
    400,
  );
  assert.equal(calls.length, 0);
  assert.equal(
    (
      await send("/api/admin/catalog/artworks", "POST", {
        ...input,
        status: "Draft",
      })
    ).status,
    201,
  );
  const write = calls.find((c) =>
    c.statement.includes(
      "UPDATE dbo.ArtworkDescriptions WITH(UPDLOCK,HOLDLOCK)",
    ),
  );
  assert.equal(write.values.description, null);
  assert.equal(write.values.artworkStatus, "Draft");
});
test("failure to save inline Vietnamese rolls back the artwork and image transaction", async () => {
  role = "Admin";
  failInlineVi = true;
  try {
    const response = await send("/api/admin/catalog/artworks", "POST", {
      title: "A",
      artistId: 1,
      categoryId: 1,
      materialId: 1,
      imageUrl: "/images/tranh/test.jpg",
      descriptionVi: "Mô tả",
      status: "Published",
    });
    assert.equal(response.status, 503);
    assert.equal(transactions.at(-1).rolledBack, true);
    assert.ok(!transactions.at(-1).committed);
  } finally {
    failInlineVi = false;
  }
});

test("QR catalogue filters paused QR in both page and total without hiding ordinary artworks", async () => {
  calls = [];
  assert.equal((await send("/api/catalog/artworks?qr=1")).status, 200);
  const qrQuery = calls.find((c) =>
    c.statement.includes("SELECT COUNT(*) AS total"),
  );
  assert.equal((qrQuery.statement.match(/a.QRIsEnabled=1/g) || []).length, 2);
  calls = [];
  assert.equal((await send("/api/catalog/artworks")).status, 200);
  assert.ok(calls.every((c) => !c.statement.includes("QRIsEnabled")));
});
