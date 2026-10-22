// All positions use UTF-16 offsets, matching SpeechSynthesisEvent.charIndex.
export function speechSegments(value, locale = "vi", maxLength = 240) {
  const text = String(value || "");
  const sentences =
    typeof Intl.Segmenter === "function"
      ? [
          ...new Intl.Segmenter(locale, { granularity: "sentence" }).segment(
            text,
          ),
        ].map((s) => ({ text: s.segment, start: s.index }))
      : [
          ...text.matchAll(
            /[^.!?。！？\n]+(?:[.!?。！？]+|\n|$)|[.!?。！？\n]+/gu,
          ),
        ].map((m) => ({ text: m[0], start: m.index }));
  const result = [];
  for (const sentence of sentences) {
    let cursor = 0;
    while (cursor < sentence.text.length) {
      let end = Math.min(cursor + maxLength, sentence.text.length);
      if (end < sentence.text.length) {
        const space = sentence.text.lastIndexOf(" ", end);
        if (space > cursor) end = space + 1;
        // Never cut a surrogate pair.
        else if (/[\uD800-\uDBFF]/.test(sentence.text[end - 1])) end--;
      }
      const raw = sentence.text.slice(cursor, end);
      const leading = raw.length - raw.trimStart().length;
      const spoken = raw.trim();
      if (spoken)
        result.push({
          text: spoken,
          start: sentence.start + cursor + leading,
          end: sentence.start + cursor + leading + spoken.length,
        });
      cursor = end;
    }
  }
  return result;
}
export function spokenWord(text, index) {
  if (
    !Number.isInteger(index) ||
    index < 0 ||
    index >= text.length ||
    /\s/u.test(text[index])
  )
    return null;
  let start = index,
    end = index;
  while (start > 0 && !/\s/u.test(text[start - 1])) start--;
  while (end < text.length && !/\s/u.test(text[end])) end++;
  return { start, end };
}
