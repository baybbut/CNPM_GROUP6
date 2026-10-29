export function highlightArtworks(published, slots, limit = 5) {
  const chosen = [],
    seen = new Set();
  function add(work, imageOverride) {
    if (work?.id && !seen.has(work.id) && chosen.length < limit) {
      seen.add(work.id);
      chosen.push(imageOverride ? { ...work, imageUrl: imageOverride } : work);
    }
  }
  slots.forEach((slot, index) => {
    const mapped = published.find((a) => a.id === slot.artworkId);
    add(mapped || published[index], mapped ? slot.configuredImg : null);
  });
  published.forEach((work) => add(work));
  return chosen;
}
export function nextHighlight(index, delta, count) {
  return count ? (((index + delta) % count) + count) % count : 0;
}
