import { test } from "node:test";
import assert from "node:assert/strict";
import {
  speechSegments,
  spokenWord,
} from "../src/components/Narration/speechText.mjs";
test("Vietnamese sentences preserve exact offsets and text", () => {
  const text =
    "  Thiếu nữ bên hoa huệ.\nTô Ngọc Vân sáng tác năm 1943! Đây là mô tả.";
  const pieces = speechSegments(text, "vi");
  assert.ok(pieces.length >= 3);
  for (const piece of pieces)
    assert.equal(text.slice(piece.start, piece.end), piece.text);
  assert.equal(
    pieces
      .map((p) => p.text)
      .join(" ")
      .replace(/\s/g, ""),
    text.replace(/\s/g, ""),
  );
});
test("long text is bounded without dropping content or breaking emoji", () => {
  const text = "Tác phẩm 🎨 " + "mô tả chi tiết ".repeat(90);
  const pieces = speechSegments(text, "vi", 80);
  assert.ok(pieces.every((p) => p.text.length <= 80));
  assert.equal(
    pieces
      .map((p) => p.text)
      .join("")
      .replace(/\s/g, ""),
    text.replace(/\s/g, ""),
  );
  for (const p of pieces) assert.equal(text.slice(p.start, p.end), p.text);
});
test("word boundaries map accented words using UTF-16 offsets", () => {
  const text = "🎨 Thiếu nữ bên hoa huệ.";
  const index = text.indexOf("Thiếu");
  const range = spokenWord(text, index);
  assert.equal(text.slice(range.start, range.end), "Thiếu");
  assert.equal(spokenWord(text, -1), null);
  assert.equal(spokenWord(text, text.length), null);
  assert.equal(spokenWord(text, text.indexOf(" ")), null);
});
test("empty text has no utterances; text without punctuation stays complete", () => {
  assert.deepEqual(speechSegments("  \n"), []);
  assert.equal(
    speechSegments("A single description")[0].text,
    "A single description",
  );
});
