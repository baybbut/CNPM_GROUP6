import { useState } from "react";
import { useLang } from "../../context/LangContext";
import { label } from "../../i18n/catalog.mjs";

export default function MuseumFloorPlans({ plans }) {
  const { lang } = useLang(),
    t = (key) => label(lang, key);
  const [selected, setSelected] = useState(0),
    [failed, setFailed] = useState(false);
  const plan = plans[selected] || plans[0];
  return (
    <div className="guide-floorplan">
      <h4>{t("Museum floor plan")}</h4>
      {!plan ? (
        <p>
          {t(
            "A verified floor plan is not available yet. Ask the museum reception for the current room and floor layout.",
          )}
        </p>
      ) : (
        <>
          {plans.length > 1 && (
            <div className="place-actions" aria-label={t("Museum floor plan")}>
              {plans.map((p, i) => (
                <button
                  key={p.url}
                  aria-pressed={selected === i}
                  onClick={() => {
                    setSelected(i);
                    setFailed(false);
                  }}
                >
                  {p.title}
                </button>
              ))}
            </div>
          )}
          {failed ? (
            <p role="alert">
              {t("Unable to load data. Please try again.")}{" "}
              <button onClick={() => setFailed(false)}>{t("Try again")}</button>
            </p>
          ) : (
            <figure>
              <a
                href={plan.url}
                target="_blank"
                rel="noopener noreferrer"
                aria-label={`${t("Open full-size plan")}: ${plan.title}`}
              >
                <img
                  src={plan.url}
                  alt={plan.title}
                  loading="lazy"
                  onError={() => setFailed(true)}
                />
              </a>
              <figcaption>
                {plan.title}
                {plan.sourceUrl && (
                  <>
                    {" "}
                    ·{" "}
                    <a
                      href={plan.sourceUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      {t("Source")}
                    </a>
                  </>
                )}
              </figcaption>
            </figure>
          )}
          <a href={plan.url} target="_blank" rel="noopener noreferrer">
            {t("Open full-size plan")} ↗
          </a>
        </>
      )}
    </div>
  );
}
