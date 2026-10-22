import { useEffect, useMemo, useRef, useState } from "react";
import { SvgIcon } from "../Icons";
import { speechSegments, spokenWord } from "./speechText.mjs";
import "./narration.css";

export default function Narration({ text = "", language = "vi", vi = true }) {
  const supported =
    typeof window !== "undefined" &&
    typeof window.speechSynthesis?.speak === "function" &&
    typeof window.SpeechSynthesisUtterance === "function";
  const lang = language.startsWith("vi")
    ? "vi-VN"
    : language.startsWith("en")
      ? "en-US"
      : language;
  const segments = useMemo(() => speechSegments(text, lang), [text, lang]);
  const [voices, setVoices] = useState([]),
    [voiceId, setVoiceId] = useState(""),
    [speed, setSpeed] = useState("1");
  const [status, setStatus] = useState("idle"),
    [sentence, setSentence] = useState(-1),
    [word, setWord] = useState(null),
    [error, setError] = useState(""),
    [follow, setFollow] = useState(true);
  const run = useRef(0),
    current = useRef(null),
    transcript = useRef(null),
    highlighted = useRef(null);
  const available = voices.filter(
    (v) =>
      v.lang.toLowerCase().split("-")[0] === lang.toLowerCase().split("-")[0],
  );
  const busy = status === "playing" || status === "paused";
  function stop() {
    run.current++;
    if (current.current && supported) {
      window.speechSynthesis.cancel();
      current.current = null;
    }
    setStatus("idle");
    setSentence(-1);
    setWord(null);
  }
  useEffect(() => {
    setStatus("idle");
    setSentence(-1);
    setWord(null);
    setError("");
    setVoiceId("");
    if (!supported) return;
    const synth = window.speechSynthesis;
    const load = () => setVoices(synth.getVoices());
    load();
    synth.addEventListener("voiceschanged", load);
    const audioStarted = () => stop();
    window.addEventListener("muses-audio-play", audioStarted);
    return () => {
      run.current++;
      if (current.current) synth.cancel();
      current.current = null;
      synth.removeEventListener("voiceschanged", load);
      window.removeEventListener("muses-audio-play", audioStarted);
    };
  }, [text, lang, supported]);
  useEffect(() => {
    if (!follow || !highlighted.current || !transcript.current) return;
    const target = highlighted.current.getBoundingClientRect(),
      box = transcript.current.getBoundingClientRect();
    if (target.bottom > box.bottom - 20)
      transcript.current.scrollTop += target.bottom - box.bottom + 30;
    else if (target.top < box.top + 15)
      transcript.current.scrollTop -= box.top - target.top + 20;
  }, [sentence, word, follow]);

  function read() {
    if (!supported || !segments.length) return;
    const synth = window.speechSynthesis;
    if (status === "paused") {
      synth.resume();
      setStatus("playing");
      return;
    }
    const generation = ++run.current;
    synth.cancel();
    synth.resume();
    document
      .querySelectorAll(".artwork-detail-page audio, .pg-modal audio")
      .forEach((audio) => audio.pause());
    setError("");
    setWord(null);
    setStatus("playing");
    const voice =
      available.find((v) => v.voiceURI === voiceId) ||
      available.find((v) => v.default) ||
      available[0];
    function speak(index) {
      if (generation !== run.current) return;
      if (index >= segments.length) {
        current.current = null;
        setStatus("ended");
        setSentence(-1);
        setWord(null);
        return;
      }
      const segment = segments[index];
      const utterance = new SpeechSynthesisUtterance(segment.text);
      utterance.lang = lang;
      utterance.rate = Number(speed);
      if (voice) utterance.voice = voice;
      current.current = utterance;
      utterance.onstart = () => {
        if (generation === run.current) {
          setSentence(index);
          setWord(null);
          setStatus("playing");
        }
      };
      utterance.onboundary = (event) => {
        if (generation !== run.current || event.name === "sentence") return;
        const range = spokenWord(segment.text, event.charIndex);
        if (range)
          setWord({
            start: segment.start + range.start,
            end: segment.start + range.end,
          });
      };
      utterance.onend = () => {
        if (generation === run.current) speak(index + 1);
      };
      utterance.onerror = (event) => {
        if (generation !== run.current) return;
        current.current = null;
        setStatus("idle");
        setSentence(-1);
        setWord(null);
        if (!["canceled", "interrupted"].includes(event.error))
          setError(
            vi
              ? "Chưa phát được giọng đọc. Hãy chọn giọng khác hoặc kiểm tra giọng đọc của thiết bị."
              : "Speech could not start. Choose another voice or check your device speech settings.",
          );
      };
      synth.speak(utterance);
    }
    speak(0);
  }
  function pause() {
    if (supported) {
      window.speechSynthesis.pause();
      setStatus("paused");
    }
  }
  const tokens = [...String(text).matchAll(/\S+|\s+/gu)];
  const activeSegment = segments[sentence];
  const label =
    status === "playing"
      ? vi
        ? "Đang đọc"
        : "Reading"
      : status === "paused"
        ? vi
          ? "Đã tạm dừng"
          : "Paused"
        : status === "ended"
          ? vi
            ? "Đã đọc xong"
            : "Finished"
          : vi
            ? "Sẵn sàng đọc"
            : "Ready";
  return (
    <div className="narration">
      <div className="narration-controls">
        <div className="narration-heading">
          <SvgIcon kind="headphones" size={22} />
          <strong>
            {vi ? "Nghe và theo dõi văn bản" : "Listen and read along"}
          </strong>
          <span role="status">{label}</span>
        </div>
        {supported ? (
          <>
            <div className="narration-buttons">
              <button
                type="button"
                className="narration-primary"
                disabled={!segments.length}
                onClick={status === "playing" ? pause : read}
              >
                {status === "playing"
                  ? vi
                    ? "Tạm dừng"
                    : "Pause"
                  : status === "paused"
                    ? vi
                      ? "Tiếp tục"
                      : "Resume"
                    : vi
                      ? "Đọc văn bản"
                      : "Read aloud"}
              </button>
              <button type="button" disabled={!busy} onClick={stop}>
                {vi ? "Dừng" : "Stop"}
              </button>
              <label>
                {vi ? "Tốc độ" : "Speed"}
                <select
                  aria-label={vi ? "Tốc độ đọc" : "Reading speed"}
                  value={speed}
                  disabled={busy}
                  onChange={(e) => setSpeed(e.target.value)}
                >
                  {["0.75", "1", "1.25", "1.5"].map((n) => (
                    <option key={n} value={n}>
                      {n}×
                    </option>
                  ))}
                </select>
              </label>
              <label className="narration-voice">
                {vi ? "Giọng đọc" : "Voice"}
                <select
                  aria-label={vi ? "Giọng đọc" : "Voice"}
                  value={voiceId}
                  disabled={busy}
                  onChange={(e) => setVoiceId(e.target.value)}
                >
                  <option value="">
                    {vi ? "Tự chọn giọng phù hợp" : "Automatic voice"}
                  </option>
                  {available.map((v) => (
                    <option value={v.voiceURI} key={v.voiceURI}>
                      {v.name} · {v.lang}
                    </option>
                  ))}
                </select>
              </label>
            </div>
            <div className="narration-options">
              <label>
                <input
                  type="checkbox"
                  checked={follow}
                  onChange={(e) => setFollow(e.target.checked)}
                />
                {vi ? "Tự cuộn theo lời đọc" : "Follow the narration"}
              </label>
              <small>
                {vi
                  ? "Tô sáng theo câu; theo từng từ khi giọng đọc hỗ trợ."
                  : "Sentence highlighting; word highlighting when supported by the voice."}
              </small>
            </div>
            {voices.length > 0 && !available.length && (
              <p className="narration-note">
                {vi
                  ? `Thiết bị chưa cung cấp giọng ${lang.startsWith("vi") ? "tiếng Việt" : lang}. Bạn có thể cần thêm giọng đọc trong cài đặt thiết bị.`
                  : `No ${lang} voice is listed. You may need to add a matching voice in your device settings.`}
              </p>
            )}
          </>
        ) : (
          <p className="narration-note">
            {vi
              ? "Trình duyệt này chưa hỗ trợ đọc văn bản thành tiếng. Bạn vẫn có thể đọc mô tả bên dưới."
              : "This browser does not support speech synthesis. You can still read the description below."}
          </p>
        )}
        {error && (
          <p className="narration-error" role="alert">
            {error}
          </p>
        )}
      </div>
      <div
        className="narration-transcript"
        ref={transcript}
        tabIndex={0}
        aria-label={vi ? "Nội dung thuyết minh" : "Narration transcript"}
      >
        <p>
          {tokens.map((token, index) => {
            const start = token.index,
              end = start + token[0].length;
            const isSentence =
              activeSegment &&
              start < activeSegment.end &&
              end > activeSegment.start;
            const isWord = word && start < word.end && end > word.start;
            return (
              <span
                key={index}
                ref={
                  isWord ||
                  (!word && isSentence && start === activeSegment.start)
                    ? highlighted
                    : undefined
                }
                className={`${isSentence ? "narration-sentence " : ""}${isWord ? "narration-word" : ""}`}
              >
                {token[0]}
              </span>
            );
          })}
        </p>
      </div>
    </div>
  );
}
