import { useEffect, useRef } from "react";
import { label } from "../../i18n/catalog.mjs";
import { chooseVoice, speechLocale } from "../Narration/speechLanguage.mjs";
import { MUSEUM_RADIUS_KM } from "./placeModel.mjs";

export default function NearbyMuseumNotice({ places, lang }) {
  const announced = useRef(new Set());
  const active = useRef(null);
  const speech = window.speechSynthesis;
  const canSpeak = Boolean(speech && window.SpeechSynthesisUtterance);
  const nearby = places.filter((place) =>
    place.kind === "museum" && Number.isFinite(place.distance) && place.distance <= MUSEUM_RADIUS_KM
  );

  function message(place) {
    return label(lang, "{name} is within {radius} km of you.")
      .replace("{radius}", MUSEUM_RADIUS_KM)
      .replace("{name}", () => place.name);
  }

  function speak(items) {
    if (!canSpeak || !items.length) return;
    const utterance = new SpeechSynthesisUtterance(items.map(message).join(" "));
    utterance.lang = speechLocale(lang);
    const voice = chooseVoice(speech.getVoices(), lang);
    if (voice) utterance.voice = voice;
    active.current = utterance;
    utterance.onend = utterance.onerror = () => {
      if (active.current === utterance) active.current = null;
    };
    speech.speak(utterance);
  }

  useEffect(() => {
    // Delay until mount completes so a StrictMode effect replay cannot swallow the alert.
    const timer = setTimeout(() => {
      const fresh = nearby.filter((place) => !announced.current.has(place.id));
      fresh.forEach((place) => announced.current.add(place.id));
      speak(fresh);
    }, 0);
    return () => clearTimeout(timer);
  }, [places, lang]);

  useEffect(() => () => {
    if (active.current) speech?.cancel();
  }, [speech]);

  return (
    <div className="nearby-museums">
      <div role="status">
        {nearby.length ? nearby.map((place) => <p key={place.id}>{message(place)}</p>) :
          <p>{label(lang, "No matching museums within {radius} km.").replace("{radius}", MUSEUM_RADIUS_KM)}</p>}
      </div>
      {canSpeak && nearby.length > 0 && (
        <button type="button" onClick={() => {
          if (active.current) speech.cancel();
          speak(nearby);
        }}>{label(lang, "Read nearby museum alerts")}</button>
      )}
    </div>
  );
}
