import { useCallback, useEffect, useRef } from "react";
import { label } from "../../i18n/catalog.mjs";
import { chooseVoice, speechLocale } from "../Narration/speechLanguage.mjs";

export default function NearbyMuseumNotice({ nearest, lang, radius, searchRadius, nearbyCount }) {
  const active = useRef(null);
  const speech = window.speechSynthesis;
  const canSpeak = Boolean(speech && window.SpeechSynthesisUtterance);
  const expansion = searchRadius > radius
    ? label(lang, "No matching museums within {radius} km. Search expanded to {extended} km.")
        .replace("{radius}", radius).replace("{extended}", searchRadius)
    : "";
  let result = label(lang, "No matching museums within {radius} km.").replace("{radius}", searchRadius);
  if (nearest) {
    const meters = nearest.distance < 1;
    const distance = new Intl.NumberFormat(lang, {
      style: "unit",
      unit: meters ? "meter" : "kilometer",
      unitDisplay: "long",
      maximumFractionDigits: meters ? 0 : 2,
    }).format(meters ? nearest.distance * 1000 : nearest.distance);
    result = label(lang, nearest.zone === "approaching"
      ? "You are just outside the {radius} km radius of {name}, about {distance} away."
      : "{name} is the nearest museum, about {distance} away.")
      .replace("{radius}", radius)
      .replace("{distance}", distance)
      .replace("{name}", () => nearest.place.names?.[lang] || nearest.place.name);
  }
  const countMessage = label(lang, "Points of interest within {radius} km of you: {count}.")
    .replace("{radius}", radius).replace("{count}", nearbyCount);
  const message = [countMessage, expansion, result].filter(Boolean).join(" ");
  const stop = useCallback(() => {
    if (active.current) {
      active.current = null;
      speech.cancel();
    }
  }, [speech]);
  function speak() {
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
  }

  useEffect(() => stop, [stop, lang, nearest?.place.id, nearest?.zone]);

  return (
    <div className="nearby-museums">
      <p role="status">{message}</p>
      {nearest && canSpeak && (
        <button type="button" onClick={speak}>{label(lang, "Read nearby museum alerts")}</button>
      )}
    </div>
  );
}
