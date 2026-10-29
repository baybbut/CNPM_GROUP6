// NFR01: run against a prepared 1000-artwork test database, not a fake SQL adapter.
const origin = process.env.TEST_API_ORIGIN || "http://127.0.0.1:3001";
(async () => {
  const samples = [],
    errors = [];
  await Promise.all(
    Array.from({ length: 20 }, async (_, worker) => {
      for (let n = 0; n < 10; n++) {
        const start = performance.now();
        try {
          const response = await fetch(
            `${origin}/api/catalog/artworks?lang=vi&page=${(worker % 10) + 1}`,
            { signal: AbortSignal.timeout(10000) },
          );
          const data = await response.json();
          if (!response.ok || !Array.isArray(data.items) || data.total < 1000)
            throw Error(
              "Cần API hợp lệ với ít nhất 1000 tác phẩm đã công bố trong DB kiểm thử.",
            );
          samples.push(performance.now() - start);
        } catch (e) {
          errors.push(e.message);
        }
      }
    }),
  );
  samples.sort((a, b) => a - b);
  const p95 = samples[Math.ceil(samples.length * 0.95) - 1];
  console.log(
    JSON.stringify(
      {
        concurrency: 20,
        requests: 200,
        successful: samples.length,
        errors: errors.length,
        p95ms: p95 ?? null,
        passed: errors.length === 0 && p95 <= 2000,
      },
      null,
      2,
    ),
  );
  if (errors.length) console.error(errors[0]);
  if (errors.length || p95 > 2000) process.exitCode = 1;
})();
