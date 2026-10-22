const { test } = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const sql = fs.readFileSync(
  path.join(__dirname, "../MusesDB/ArtworkImages.sql"),
  "utf8",
);
const values = sql
  .split("INSERT INTO @ImageMap (ArtworkName, ImageURL)")[1]
  .split("-- Mỗi tên")[0];
const entries = [...values.matchAll(/N'([^']+)'\s*,\s*N'(\/images\/[^']+)'/g)];
test("every seeded artwork maps to an existing case-sensitive image file", () => {
  assert.equal(entries.length, 32);
  assert.equal(new Set(entries.map((x) => x[1])).size, 32);
  for (const [, title, url] of entries)
    assert.ok(
      fs.existsSync(
        path.join(__dirname, "../../muses-react", url.replace("/images/", "")),
      ),
      `${title}: ${url}`,
    );
});
test("image map does not drop the database or delete custom images", () => {
  assert.doesNotMatch(
    sql,
    /\bDROP\s+(TABLE|DATABASE)\b|\bTRUNCATE\b|\bDELETE\s+FROM\b/i,
  );
  assert.match(sql, /WHERE NOT EXISTS/);
});

const homeSQL = fs.readFileSync(
  path.join(__dirname, "../MusesDB/HomeImages.sql"),
  "utf8",
);
test("14 homepage placements preserve the original images and have real files", () => {
  const rows = [...homeSQL.matchAll(/\('(home\.[^']+)','(\/images\/[^']+)'/g)];
  assert.equal(rows.length, 14);
  assert.equal(new Set(rows.map((r) => r[1])).size, 14);
  for (const [, slot, url] of rows)
    assert.ok(
      fs.existsSync(
        path.join(__dirname, "../../muses-react", url.replace("/images/", "")),
      ),
      slot,
    );
  assert.equal(
    rows.filter((r) => r[1].startsWith("home.highlight.")).length,
    5,
  );
  assert.equal(rows.filter((r) => r[1].startsWith("home.welcome.")).length, 6);
  assert.match(homeSQL, /WHERE NOT EXISTS/);
  assert.doesNotMatch(homeSQL, /DROP\s+(TABLE|DATABASE)|TRUNCATE/i);
});

test("image map covers every artwork in the database seed by exact name", () => {
  const seed = fs.readFileSync(
    path.join(__dirname, "../MusesDB/MusesMuseumDB.sql"),
    "utf8",
  );
  const art = seed
    .split("-- 4. Thêm Tác phẩm")[1]
    .split("-- 5. Thêm dữ liệu")[0];
  const titles = [
    ...art.matchAll(/\(N'([^']+)', [123], \(SELECT ArtistID/g),
  ].map((m) => m[1]);
  assert.equal(titles.length, 32);
  assert.deepEqual(new Set(entries.map((e) => e[1])), new Set(titles));
});
