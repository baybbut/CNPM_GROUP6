const SUPPORTED = ["vi", "en", "fr", "ja", "zh"];
function createTranslator({
  enabled = process.env.TRANSLATE_ENABLED === "true",
  url = process.env.TRANSLATE_URL || "http://127.0.0.1:5000",
  fetcher = fetch,
} = {}) {
  const cache = new Map(),
    pending = new Map();
  async function translate(text, source, target) {
    const key = JSON.stringify([source, target, text]);
    const hit = cache.get(key);
    if (hit && hit.until > Date.now()) return hit.text;
    if (pending.has(key)) return pending.get(key);
    const task = (async () => {
      const response = await fetcher(`${url.replace(/\/$/, "")}/translate`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          q: text,
          source,
          target,
          format: "text",
          ...(process.env.TRANSLATE_API_KEY
            ? { api_key: process.env.TRANSLATE_API_KEY }
            : {}),
        }),
        signal: AbortSignal.timeout(60000),
      });
      if (!response.ok) throw new Error("Translation unavailable");
      const data = await response.json();
      if (
        typeof data.translatedText !== "string" ||
        !data.translatedText.trim()
      )
        throw new Error("Invalid translation");
      if (cache.size >= 100) cache.delete(cache.keys().next().value);
      cache.set(key, {
        text: data.translatedText,
        until: Date.now() + 3600000,
      });
      return data.translatedText;
    })();
    pending.set(key, task);
    try {
      return await task;
    } finally {
      pending.delete(key);
    }
  }
  return {
    async artwork(item, target) {
      const result = {
        ...item,
        requestedLanguage: target,
        translationSource: "database",
      };
      if (!item.description || item.descriptionLanguage === target)
        return result;
      result.translationSource = "original";
      result.translationStatus = "unavailable";
      if (!enabled || !SUPPORTED.includes(item.descriptionLanguage))
        return result;
      try {
        const [description, shortDescription] = await Promise.all([
          translate(item.description, item.descriptionLanguage, target),
          item.shortDescription
            ? translate(item.shortDescription, item.descriptionLanguage, target)
            : Promise.resolve(null),
        ]);
        return {
          ...result,
          description,
          shortDescription,
          descriptionLanguage: target,
          translationSource: "automatic",
          translationStatus: "available",
        };
      } catch {
        return result;
      }
    },
    async health() {
      if (!enabled) return { enabled, ready: false, languages: SUPPORTED };
      try {
        const response = await fetcher(`${url.replace(/\/$/, "")}/languages`, {
          signal: AbortSignal.timeout(3000),
        });
        if (!response.ok) throw new Error();
        const languages = await response.json();
        return {
          enabled,
          ready: SUPPORTED.every((code) =>
            languages.some((l) => l.code === code),
          ),
          languages: languages.map((l) => l.code),
        };
      } catch {
        return { enabled, ready: false, languages: [] };
      }
    },
  };
}
module.exports = { SUPPORTED, createTranslator };
