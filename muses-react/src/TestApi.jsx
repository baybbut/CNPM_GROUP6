
import { useEffect, useState } from "react";
import { getArtworks } from "./api";

export default function TestApi() {
  const [artworks, setArtworks] = useState([]);
  const [error, setError] = useState("");

  useEffect(() => {
    getArtworks("vi")
      .then(setArtworks)
      .catch((err) => setError(err.message));
  }, []);

  if (error) {
    return <p>Lỗi: {error}</p>;
  }

  if (artworks.length === 0) {
    return <p>Đang tải dữ liệu...</p>;
  }

  return (
    <div>
      <h2>Danh sách tác phẩm từ database</h2>

      {artworks.map((artwork) => (
        <div key={artwork.id}>
          <h3>{artwork.title}</h3>
          <p>Họa sĩ: {artwork.artist}</p>
          <p>Thể loại: {artwork.category}</p>
          <p>Chất liệu: {artwork.material}</p>
        </div>
      ))}
    </div>
  );
}
