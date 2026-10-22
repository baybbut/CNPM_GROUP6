import React, { useState, useEffect, useRef } from "react";
import Icon from "../Icons";
import { Field, Panel, Header } from "./shared";
export default function Settings({
  toast,
  preferences: settings,
  setPreferences: setSettings,
}) {
  const [draft, setDraft] = useState(settings);
  return (
    <>
      <Header
        title="Make yourself at home"
        description="A few thoughtful settings for a smoother working day."
      />
      <div className="pg-two-col">
        <Panel
          title="Your workspace profile"
          subtitle="Saved in this browser; no live account is connected."
        >
          <form
            className="pg-form"
            onSubmit={(e) => {
              e.preventDefault();
              setSettings(draft);
              toast("Workspace preferences saved locally");
            }}
          >
            <div className="pg-profile-header">
              <div className="pg-initial color-0">
                {draft.name
                  .split(" ")
                  .map((x) => x[0])
                  .slice(0, 2)
                  .join("")}
              </div>
              <div>
                <strong>{draft.name}</strong>
                <small>Administrator · demo workspace</small>
              </div>
            </div>
            <Field label="Display name">
              <input
                required
                value={draft.name}
                onChange={(e) => setDraft({ ...draft, name: e.target.value })}
              />
            </Field>
            <Field label="Contact email">
              <input
                type="email"
                required
                value={draft.email}
                onChange={(e) => setDraft({ ...draft, email: e.target.value })}
              />
            </Field>
            <Field label="Preferred language">
              <select
                value={draft.language}
                onChange={(e) =>
                  setDraft({ ...draft, language: e.target.value })
                }
              >
                <option>English</option>
                <option>Tiếng Việt</option>
              </select>
              <small>
                Preference only; this admin prototype is currently presented in
                English.
              </small>
            </Field>
            <button className="primary">Save preferences</button>
          </form>
        </Panel>
        <Panel
          title="Stay in the loop"
          subtitle="Notification preferences only; no emails are sent."
          className="pg-pink-panel"
        >
          <div className="pg-setting-list">
            {[
              [
                "digest",
                "A daily overview",
                "A calm summary of museum activity.",
              ],
              [
                "review",
                "Content needs attention",
                "Translations, missing images and audio.",
              ],
              [
                "visits",
                "Visitor check-ins",
                "A note when new visits are recorded.",
              ],
            ].map(([key, title, desc]) => (
              <div key={key}>
                <span>
                  <strong>{title}</strong>
                  <small>{desc}</small>
                </span>
                <button
                  className={`pg-switch ${draft[key] ? "on" : ""}`}
                  role="switch"
                  aria-checked={draft[key]}
                  aria-label={title}
                  onClick={() => setDraft({ ...draft, [key]: !draft[key] })}
                >
                  <i />
                </button>
              </div>
            ))}
          </div>
          <div className="pg-settings-note">
            <Icon name="settings" size={30} />
            <h3>Your changes, your browser.</h3>
            <p>
              These pages are an interactive design workspace. Museum data,
              authentication and publishing will be connected through a separate
              backend integration.
            </p>
          </div>
        </Panel>
      </div>
    </>
  );
}
