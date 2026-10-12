import { useEffect, useState } from "react";

export default function ArtworkApiDemo() {
  const [lang, setLang] = useState("vi");
  const [artworks, setArtworks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const controller = new AbortController();

    async function loadArtworks() {
      setLoading(true);
      setError("");

      try {
        const response = await fetch(
          `http://localhost:3001/api/artworks?lang=${lang}`,
          { signal: controller.signal }
        );

        if (!response.ok) {
          throw new Error("Không lấy được danh sách tác phẩm.");
        }

        const data = await response.json();
        setArtworks(data);
      } catch (err) {
        if (err.name !== "AbortError") {
          setError(err.message);
        }
      } finally {
        if (!controller.signal.aborted) {
          setLoading(false);
        }
      }
    }

    loadArtworks();

    return () => controller.abort();
  }, [lang]);

  return (
    <section>
      <h2>Thử API tác phẩm</h2>

      <select
        value={lang}
        onChange={(event) => setLang(event.target.value)}
      >
        <option value="vi">Tiếng Việt</option>
        <option value="en">English</option>
      </select>

      {loading ? (
        <p>Đang tải...</p>
      ) : error ? (
        <p>{error}</p>
      ) : (
        artworks.map((artwork) => (
          <article key={artwork.id}>
            <h3>{artwork.title}</h3>
            <p>{artwork.artist}</p>
            <p>{artwork.description}</p>
          </article>
        ))
      )}
    </section>
  );
}