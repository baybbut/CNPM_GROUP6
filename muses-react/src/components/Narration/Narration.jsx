import { label } from "../../i18n/catalog.mjs";
import { trackAudio } from "../../api/activity.mjs";
import { useEffect, useMemo, useRef, useState } from "react";
import { SvgIcon } from "../Icons";
import { speechSegments, spokenWord } from "./speechText.mjs";
import "./narration.css";
import {
  baseLanguage,
  speechLocale,
  matchingVoices,
  chooseVoice,
} from "./speechLanguage.mjs";

export default function Narration({
  text = "",
  language = "vi",
  requestedLanguage = language,
  vi = true,
}) {
  const uiLanguage = requestedLanguage;
  const supported =
    typeof window !== "undefined" &&
    typeof window.speechSynthesis?.speak === "function" &&
    typeof window.SpeechSynthesisUtterance === "function";
  const lang = speechLocale(language);
  const translationReady =
    baseLanguage(language) === baseLanguage(requestedLanguage);
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
  const available = matchingVoices(voices, lang);
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
  }, [text, lang, requestedLanguage, supported]);
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
    const selectedVoice = chooseVoice(
      window.speechSynthesis.getVoices(),
      lang,
      voiceId,
    );
    if (!selectedVoice) {
      setError(
        label(
          uiLanguage,
          "No voice available for this language.",
          "Chưa có giọng đọc cho ngôn ngữ này.",
        ),
      );
      return;
    }
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
    const voice = selectedVoice;
    let counted = false;
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
          if (!counted) {
            counted = true;
            trackAudio(lang);
          }
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
            label(
              uiLanguage,
              "Speech could not start. Choose another voice or check your device speech settings.",
              "Chưa phát được giọng đọc. Hãy chọn giọng khác hoặc kiểm tra giọng đọc của thiết bị.",
            ),
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
  const statusLabel =
    status === "playing"
      ? label(uiLanguage, "Reading", "Đang đọc")
      : status === "paused"
        ? label(uiLanguage, "Paused", "Đã tạm dừng")
        : status === "ended"
          ? label(uiLanguage, "Finished", "Đã đọc xong")
          : label(uiLanguage, "Ready", "Sẵn sàng đọc");
  return (
    <div className="narration">
      <div className="narration-controls">
        <div className="narration-heading">
          <SvgIcon kind="headphones" size={22} />
          <strong>
            {label(
              uiLanguage,
              "Listen and read along",
              "Nghe và theo dõi văn bản",
            )}
          </strong>
          <span role="status">{statusLabel}</span>
        </div>
        {supported ? (
          <>
            <div className="narration-buttons">
              <button
                type="button"
                className="narration-primary"
                disabled={!segments.length || !available.length}
                onClick={status === "playing" ? pause : read}
              >
                {status === "playing"
                  ? label(uiLanguage, "Pause", "Tạm dừng")
                  : status === "paused"
                    ? label(uiLanguage, "Resume", "Tiếp tục")
                    : !translationReady
                      ? label(uiLanguage, "Read original", "Đọc bản gốc")
                      : label(uiLanguage, "Read aloud", "Đọc văn bản")}
              </button>
              <button type="button" disabled={!busy} onClick={stop}>
                {label(uiLanguage, "Stop", "Dừng")}
              </button>
              <label>
                {label(uiLanguage, "Speed", "Tốc độ")}
                <select
                  aria-label={label(uiLanguage, "Reading speed", "Tốc độ đọc")}
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
                {label(uiLanguage, "Voice", "Giọng đọc")}
                <select
                  aria-label={label(uiLanguage, "Voice", "Giọng đọc")}
                  value={voiceId}
                  disabled={busy}
                  onChange={(e) => setVoiceId(e.target.value)}
                >
                  <option value="">
                    {label(
                      uiLanguage,
                      "Automatic voice",
                      "Tự chọn giọng phù hợp",
                    )}
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
                {label(
                  uiLanguage,
                  "Follow the narration",
                  "Tự cuộn theo lời đọc",
                )}
              </label>
              <small>
                {label(
                  uiLanguage,
                  "Sentence highlighting; word highlighting when supported by the voice.",
                  "Tô sáng theo câu; theo từng từ khi giọng đọc hỗ trợ.",
                )}
              </small>
            </div>
            {!available.length && (
              <p className="narration-note">
                {label(uiLanguage, "No voice available for this language.")} (
                {lang})
              </p>
            )}
          </>
        ) : (
          <p className="narration-note">
            {label(
              uiLanguage,
              "This browser does not support speech synthesis. You can still read the description below.",
              "Trình duyệt này chưa hỗ trợ đọc văn bản thành tiếng. Bạn vẫn có thể đọc mô tả bên dưới.",
            )}
          </p>
        )}
        {!translationReady && (
          <p className="narration-note" role="status">
            {label(
              uiLanguage,
              "Translation unavailable. You can listen to the original.",
              "Chưa có bản dịch. Bạn có thể nghe bản gốc.",
            )}
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
        aria-label={label(
          uiLanguage,
          "Narration transcript",
          "Nội dung thuyết minh",
        )}
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
