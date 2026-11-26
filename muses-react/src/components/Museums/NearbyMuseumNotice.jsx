import { useCallback, useEffect, useRef } from "react";
import { label } from "../../i18n/catalog.mjs";
import { chooseVoice, speechLocale } from "../Narration/speechLanguage.mjs";

export default function NearbyMuseumNotice({ nearest, lang, radius }) {
  const active = useRef(null);
  const lastAnnouncement = useRef(null);
  const speech = window.speechSynthesis;
  const canSpeak = Boolean(speech && window.SpeechSynthesisUtterance);
  let message = label(lang, "No matching museums within {radius} km.").replace("{radius}", radius);
  if (nearest) {
    const meters = nearest.distance < 1;
    const distance = new Intl.NumberFormat(lang, {
      style: "unit",
      unit: meters ? "meter" : "kilometer",
      unitDisplay: "long",
      maximumFractionDigits: meters ? 0 : 2,
    }).format(meters ? nearest.distance * 1000 : nearest.distance);
    message = label(lang, nearest.inside
      ? "{name} is the nearest museum, about {distance} away."
      : "You are just outside the {radius} km radius of {name}, about {distance} away.")
      .replace("{radius}", radius)
      .replace("{distance}", distance)
      .replace("{name}", () => nearest.place.names?.[lang] || nearest.place.name);
  }
  const key = nearest ? JSON.stringify([nearest.place.id, nearest.inside, lang]) : null;
  const stop = useCallback(() => {
    if (active.current) {
      active.current = null;
      speech.cancel();
    }
  }, [speech]);
  const speak = useCallback(() => {
    if (!canSpeak) return;
    stop();
    const utterance = new SpeechSynthesisUtterance(message);
    utterance.lang = speechLocale(lang);
    const voice = chooseVoice(speech.getVoices(), lang);
    if (voice) utterance.voice = voice;
    active.current = utterance;
    utterance.onend = utterance.onerror = () => {
      if (active.current === utterance) active.current = null;
    };
    speech.speak(utterance);
  }, [canSpeak, speech, stop, message, lang]);

  useEffect(() => {
    if (lastAnnouncement.current === key) return;
    stop();
    if (!key) {
      lastAnnouncement.current = null;
      return;
    }
    const timer = setTimeout(() => {
      lastAnnouncement.current = key;
      speak();
    }, 0);
    return () => clearTimeout(timer);
  }, [key, speak, stop]);
  useEffect(() => stop, [stop]);

  return (
    <div className="nearby-museums">
      <p role="status">{message}</p>
      {nearest && canSpeak && (
        <button type="button" onClick={speak}>{label(lang, "Read nearby museum alerts")}</button>
      )}
    </div>
  );
}
