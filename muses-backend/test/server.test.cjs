const { test, before, after } = require("node:test");
const assert = require("node:assert/strict");
const { app } = require("../server.cjs");
let server, origin;
const calls = [];
const artwork = {
  id: 1,
  title: "Em Thúy",
  artist: "Trần Văn Cẩn",
  category: "Tranh sơn dầu",
  categoryId: 2,
  imageUrl: "/images/tranh/EMTHUY.jpeg",
  description: "Mô tả tác phẩm.",
  descriptionLanguage: "vi",
  contentLanguage: "vi",
  audioUrl: null,
};
app.locals.pool = {
  request() {
    const values = {};
    return {
      input(name, _type, value) {
        values[name] = value;
        return this;
      },
      async query(sql) {
        calls.push({ ...values });
        if (sql.includes("dbo.SiteImages"))
          return {
            recordset: [
              {
                slot: "home.highlight.h4",
                imageUrl: "/images/tranh/tranhsonmai/GIAOMUA.jpg",
                artworkId: 1,
              },
            ],
          };
        if (sql.includes("DB_NAME()"))
          return { recordset: [{ databaseName: "MusesMuseumDB" }] };
        return { recordset: values.id === 999 ? [] : [artwork] };
      },
    };
  },
};
before(async () => {
  server = await new Promise((resolve) => {
    const s = app.listen(0, "127.0.0.1", () => resolve(s));
  });
  origin = `http://127.0.0.1:${server.address().port}`;
});
after(() => new Promise((resolve) => server.close(resolve)));
test("health checks the database connection", async () => {
  const r = await fetch(`${origin}/api/health`);
  assert.equal(r.status, 200);
  assert.equal((await r.json()).database, "MusesMuseumDB");
});
test("list and detail return artwork API data and bind language and id", async () => {
  const r = await fetch(`${origin}/api/artworks?lang=en`);
  assert.equal(r.status, 200);
  assert.deepEqual(await r.json(), [
    {
      ...artwork,
      requestedLanguage: "en",
      isFallback: true,
      currentExhibition: null,
    },
  ]);
  assert.equal(calls.at(-1).lang, "en");
  const detail = await fetch(`${origin}/api/artworks/1?lang=vi`);
  assert.equal(detail.status, 200);
  assert.equal((await detail.json()).id, 1);
  assert.equal(calls.at(-1).lang, "vi");
  assert.equal(calls.at(-1).id, 1);
});
test("all five content languages bind safely", async () => {
  for (const lang of ["vi", "en", "ko", "ja", "zh"]) {
    const response = await fetch(`${origin}/api/artworks?lang=${lang}`);
    assert.equal(response.status, 200);
    assert.equal(calls.at(-1).lang, lang);
  }
});
test("invalid language and IDs are rejected before querying the database", async () => {
  const count = calls.length;
  for (const route of [
    "/api/artworks?lang=xx",
    "/api/artworks/0",
    "/api/artworks/abc",
    "/api/artworks/2147483648",
  ])
    assert.equal((await fetch(origin + route)).status, 400);
  assert.equal(calls.length, count);
});
test("missing artwork and unknown API or image do not return the SPA shell", async () => {
  for (const route of [
    "/api/artworks/999",
    "/api/missing",
    "/images/missing.jpg",
  ])
    assert.equal((await fetch(origin + route)).status, 404);
});
test("real artwork image is served", async () => {
  for (const imageUrl of [artwork.imageUrl, "/images/background/muses4.jpg"]) {
    const r = await fetch(`${origin}${imageUrl}`);
    assert.equal(r.status, 200);
    assert.match(r.headers.get("content-type"), /image/);
  }
});
test("configured local frontend can access the API", async () => {
  const r = await fetch(`${origin}/api/artworks`, {
    headers: { Origin: "http://localhost:5173" },
  });
  assert.equal(
    r.headers.get("access-control-allow-origin"),
    "http://localhost:5173",
  );
});
test("database failure returns an error response, not sample data", async () => {
  const pool = app.locals.pool;
  app.locals.pool = {
    request() {
      throw new Error("Database unavailable");
    },
  };
  try {
    assert.equal((await fetch(`${origin}/api/artworks`)).status, 503);
    assert.equal((await fetch(`${origin}/api/health`)).status, 503);
  } finally {
    app.locals.pool = pool;
  }
});

test("homepage images expose stable placement keys", async () => {
  const response = await fetch(`${origin}/api/site-images`);
  assert.equal(response.status, 200);
  assert.deepEqual(await response.json(), [
    {
      slot: "home.highlight.h4",
      imageUrl: "/images/tranh/tranhsonmai/GIAOMUA.jpg",
      artworkId: 1,
    },
  ]);
});
