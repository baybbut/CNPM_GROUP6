
const API_URL = "http://localhost:3001";

export async function getArtworks(lang = "vi") {
  const response = await fetch(
    `${API_URL}/api/artworks?lang=${lang}`
  );

  if (!response.ok) {
    throw new Error("Không lấy được danh sách tác phẩm");
  }

  return response.json();
}

export async function getArtwork(id, lang = "vi") {
  const response = await fetch(
    `${API_URL}/api/artworks/${id}?lang=${lang}`
  );

  if (!response.ok) {
    throw new Error("Không lấy được chi tiết tác phẩm");
  }

  return response.json();
}
