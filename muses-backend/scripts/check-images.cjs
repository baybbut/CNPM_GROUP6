// Read-only check against the user's running API, never changes the database.
const api = (process.argv[2] || "http://localhost:3001").replace(/\/$/, "");
async function main() {
  const response = await fetch(`${api}/api/artworks?lang=vi`, {
    signal: AbortSignal.timeout(15000),
  });
  if (!response.ok) throw new Error(`API HTTP ${response.status}`);
  const artworks = await response.json();
  if (!Array.isArray(artworks) || !artworks.length)
    throw new Error("API has no artworks to check.");
  const homeResponse = await fetch(`${api}/api/site-images`, {
    signal: AbortSignal.timeout(15000),
  });
  if (!homeResponse.ok)
    throw new Error(
      `Site images HTTP ${homeResponse.status}; run HomeImages.sql first.`,
    );
  const placements = await homeResponse.json();
  if (!Array.isArray(placements) || !placements.length)
    throw new Error("No homepage image placements; run HomeImages.sql.");
  artworks.push(
    ...placements.map((row) => ({
      id: row.slot,
      title: row.slot,
      imageUrl: row.imageUrl,
    })),
  );
  let failed = 0;
  for (const artwork of artworks) {
    let result = "MISSING ImageURL";
    if (artwork.imageUrl) {
      const url = new URL(artwork.imageUrl, api);
      if (!["http:", "https:"].includes(url.protocol)) {
        result = "Invalid image protocol";
      } else {
        try {
          const image = await fetch(url, {
            method: "HEAD",
            signal: AbortSignal.timeout(10000),
          });
          result =
            image.ok && image.headers.get("content-type")?.startsWith("image/")
              ? "OK"
              : `HTTP ${image.status} / ${image.headers.get("content-type")}`;
        } catch {
          result = "Image request failed";
        }
      }
    }
    if (result !== "OK") failed++;
    // Print artwork identities and result only, never signed URLs or credentials.
    console.log(
      `${result === "OK" ? "✓" : "✗"} [${artwork.id}] ${artwork.title}: ${result}`,
    );
  }
  console.log(
    `${artworks.length - failed}/${artworks.length} artwork/home image entries available.`,
  );
  if (failed) process.exitCode = 1;
}
main().catch((error) => {
  console.error("Image audit failed:", error.message);
  process.exitCode = 1;
});
