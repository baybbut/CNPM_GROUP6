// Compatibility exports for existing API consumers; use the shared proxy/configuration.
import { fetchArtworks } from "./api/artworks";
export const getArtworks = (lang = "vi", signal) =>
  fetchArtworks(lang, null, signal);
export const getArtwork = (id, lang = "vi", signal) =>
  fetchArtworks(lang, id, signal);
