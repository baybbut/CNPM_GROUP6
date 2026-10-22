import React, { useState, useEffect, useRef } from "react";
import Icon from "../Icons";
import {
  useSavedState,
  matches,
  rowKey,
  Badge,
  Empty,
  Field,
  Panel,
  Modal,
  Stats,
  Header,
  TextButton,
} from "./shared";
import Narration from "../../../muses-react/src/components/Narration/Narration";

export default function Languages({ rows, search, toast }) {
  const [language, setLanguage] = useState("Vietnamese"),
    [content, setContent] = useSavedState("muses-admin-content", {}),
    [edit, setEdit] = useState(null),
    [error, setError] = useState(""),
    [preview, setPreview] = useState(null),
    [narration, setNarration] = useState(null);
  const key = (r) => `${rowKey(r)}:${language}`;
  const current = edit ? content[key(edit)] || {} : {};
  const save = (e) => {
    e.preventDefault();
    const f = new FormData(e.currentTarget);
    setContent({
      ...content,
      [key(edit)]: {
        ...current,
        text: f.get("text").trim(),
        status: f.get("status"),
      },
    });
    setEdit(null);
    toast("Translation saved locally");
  };
  const fileChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith("audio/") || file.size > 700000)
      return setError("Choose an audio file under 700 KB for browser storage.");
    const reader = new FileReader();
    reader.onload = () => {
      setContent({
        ...content,
        [key(edit)]: { ...current, audio: reader.result, fileName: file.name },
      });
      setError("");
    };
    reader.readAsDataURL(file);
  };
  return (
    <>
      <Header
        title="Art speaks every language"
        description="Make every story accessible through words and sound."
      />
      <Stats
        items={[
          [
            "Languages",
            2,
            "Vietnamese and English workspace",
            "yellow",
            "list",
          ],
          [
            "Translations",
            Object.values(content).filter((c) => c.text).length,
            "Descriptions written locally",
            "pink",
            "list",
          ],
          [
            "Audio guides",
            Object.values(content).filter((c) => c.audio).length,
            "Uploaded to this browser",
            "blue",
            "audio",
          ],
        ]}
      />
      <Panel
        title="Language & audio studio"
        subtitle="Select an artwork to review its translation and audio."
        action={
          <select
            aria-label="Content language"
            value={language}
            onChange={(e) => setLanguage(e.target.value)}
          >
            <option>Vietnamese</option>
            <option>English</option>
          </select>
        }
      >
        <div className="pg-table-wrap">
          <table>
            <thead>
              <tr>
                <th>Artwork</th>
                <th>Language</th>
                <th>Translation</th>
                <th>Audio</th>
                <th />
              </tr>
            </thead>
            <tbody>
              {rows
                .filter((r) => matches(r, search))
                .map((r) => {
                  const c = content[key(r)] || {};
                  return (
                    <tr key={rowKey(r)}>
                      <td>
                        <div className="artwork-cell">
                          <img src={r.img} alt="" />
                          <strong>{r.title}</strong>
                        </div>
                      </td>
                      <td>{language}</td>
                      <td>
                        <Badge>{c.status || "Pending"}</Badge>
                        {c.text && (
                          <button
                            type="button"
                            className="pg-text-btn"
                            aria-label={`Read ${r.title}`}
                            onClick={() =>
                              setNarration({
                                text: c.text,
                                language:
                                  language === "Vietnamese" ? "vi" : "en",
                                title: r.title,
                              })
                            }
                          >
                            Read aloud <Icon name="audio" size={16} />
                          </button>
                        )}
                      </td>
                      <td>
                        {c.audio ? (
                          <button
                            className="pg-outline"
                            onClick={() => setPreview(c)}
                          >
                            Play guide
                          </button>
                        ) : (
                          <span className="pg-muted">No audio yet</span>
                        )}
                      </td>
                      <td>
                        <TextButton
                          onClick={() => {
                            setError("");
                            setEdit(r);
                          }}
                        >
                          Edit
                        </TextButton>
                      </td>
                    </tr>
                  );
                })}
            </tbody>
          </table>
        </div>
        {!rows.some((r) => matches(r, search)) && <Empty />}
      </Panel>
      {edit && (
        <Modal
          title={`${language} · ${edit.title}`}
          onClose={() => setEdit(null)}
        >
          <form onSubmit={save}>
            <Field label="Description">
              <textarea
                name="text"
                rows="6"
                defaultValue={current.text}
                placeholder="Give this artwork a voice…"
                required
              />
            </Field>
            <Field label="Review status">
              <select
                name="status"
                defaultValue={current.status || "Needs review"}
              >
                <option>Needs review</option>
                <option>Approved</option>
              </select>
            </Field>
            <Field label="Audio guide">
              <input type="file" accept="audio/*" onChange={fileChange} />
              <small>
                {current.fileName ||
                  "Up to 700 KB · stored in this browser only"}
              </small>
            </Field>
            {current.audio && <audio controls src={current.audio} />}
            <p className="pg-muted">
              Audio selection is saved locally when chosen; text is saved below.
            </p>
            {error && (
              <p className="pg-error" role="alert">
                {error}
              </p>
            )}
            <button className="primary">Save translation</button>
          </form>
        </Modal>
      )}
      {preview && (
        <Modal title="Listen to the story" onClose={() => setPreview(null)}>
          <p>{preview.fileName}</p>
          <audio
            controls
            autoPlay
            onPlay={() => window.dispatchEvent(new Event("muses-audio-play"))}
            src={preview.audio}
          />
        </Modal>
      )}
      {narration && (
        <Modal
          title={`Read along · ${narration.title}`}
          onClose={() => setNarration(null)}
        >
          <Narration
            text={narration.text}
            language={narration.language}
            vi={false}
          />
        </Modal>
      )}
    </>
  );
}
