import React, { useState, useEffect, useRef } from "react";
import Icon from "../Icons";
import { lilies } from "../assets";
import {
  useSavedState,
  uid,
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
  categorySeed,
} from "./shared";
export default function Artworks({ rows, setRows, search, toast }) {
  const [categories] = useSavedState("muses-admin-categories", categorySeed);
  const [filter, setFilter] = useState("All artworks"),
    [view, setView] = useState("Grid"),
    [edit, setEdit] = useState(null),
    [image, setImage] = useState(lilies),
    [remove, setRemove] = useState(null),
    [error, setError] = useState("");
  const visible = rows.filter(
    (r) =>
      matches(r, search) && (filter === "All artworks" || r.status === filter),
  );
  const launch = (row) => {
    setError("");
    setEdit(row || {});
    setImage(row?.img || lilies);
  };
  const save = (e) => {
    e.preventDefault();
    const f = new FormData(e.currentTarget),
      title = f.get("title").trim(),
      artist = f.get("artist").trim();
    if (!title || !artist) return setError("Enter a title and artist.");
    if (
      rows.some(
        (r) =>
          r.title.toLowerCase() === title.toLowerCase() &&
          rowKey(r) !== rowKey(edit),
      )
    )
      return setError("An artwork with this title already exists.");
    const item = {
      ...edit,
      id: edit.id || uid(),
      title,
      artist,
      category: f.get("category"),
      content: f.get("content").trim(),
      status: f.get("status"),
      img: image,
    };
    setRows(
      edit.title
        ? rows.map((r) => (rowKey(r) === rowKey(edit) ? item : r))
        : [...rows, item],
    );
    setEdit(null);
    toast("Artwork saved locally");
  };
  const upload = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith("image/") || file.size > 600000)
      return setError("Choose an image under 600 KB for this local demo.");
    const reader = new FileReader();
    reader.onload = () => {
      setImage(reader.result);
      setError("");
    };
    reader.readAsDataURL(file);
  };
  return (
    <>
      <Header
        title="The art of collecting"
        description="A home for every artwork, and every story behind it."
        action={
          <button className="primary" onClick={() => launch()}>
            <Icon name="plus" />
            Add artwork
          </button>
        }
      />
      <Stats
        items={[
          [
            "Collection",
            rows.length,
            "Artworks in this workspace",
            "yellow",
            "image",
          ],
          [
            "Published",
            rows.filter((r) => r.status === "Published").length,
            "Ready to be discovered",
            "pink",
            "eye",
          ],
          [
            "In progress",
            rows.filter((r) => r.status === "Draft").length,
            "A little care goes a long way",
            "green",
            "list",
          ],
        ]}
      />
      <Panel
        title="Artwork collection"
        subtitle="Curate images, descriptions and publication status."
        action={
          <div className="pg-segment">
            {["Grid", "List"].map((x) => (
              <button
                key={x}
                onClick={() => setView(x)}
                className={view === x ? "active" : ""}
              >
                {x}
              </button>
            ))}
          </div>
        }
      >
        <div className="pg-toolbar">
          <div className="pg-tabs">
            {["All artworks", "Published", "Draft"].map((x) => (
              <button
                className={filter === x ? "active" : ""}
                key={x}
                onClick={() => setFilter(x)}
              >
                {x}
              </button>
            ))}
          </div>
          <span>{visible.length} artworks</span>
        </div>
        {!visible.length ? (
          <Empty />
        ) : view === "Grid" ? (
          <div className="pg-art-grid">
            {visible.map((r) => (
              <article className="pg-art-card" key={rowKey(r)}>
                <button
                  className="pg-art-cover"
                  onClick={() => launch(r)}
                  aria-label={`Edit ${r.title}`}
                >
                  <img src={r.img} alt={r.title} />
                </button>
                <div className="pg-art-info">
                  <div>
                    <small>{r.category || "Museum collection"}</small>
                    <Badge>{r.status}</Badge>
                  </div>
                  <h3>{r.title}</h3>
                  <p>{r.artist}</p>
                  <footer>
                    <button onClick={() => launch(r)}>Edit artwork ↗</button>
                    <button
                      aria-label={`Delete ${r.title}`}
                      onClick={() => setRemove(r)}
                    >
                      Delete
                    </button>
                  </footer>
                </div>
              </article>
            ))}
          </div>
        ) : (
          <div className="pg-table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Artwork</th>
                  <th>Artist</th>
                  <th>Content</th>
                  <th>Status</th>
                  <th />
                </tr>
              </thead>
              <tbody>
                {visible.map((r) => (
                  <tr key={rowKey(r)}>
                    <td>
                      <div className="artwork-cell">
                        <img src={r.img} alt="" />
                        <strong>{r.title}</strong>
                      </div>
                    </td>
                    <td>{r.artist}</td>
                    <td>{r.content}</td>
                    <td>
                      <Badge>{r.status}</Badge>
                    </td>
                    <td>
                      <TextButton onClick={() => launch(r)}>Edit</TextButton>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Panel>
      {edit && (
        <Modal
          title={edit.title ? "Edit artwork" : "A new addition"}
          onClose={() => setEdit(null)}
        >
          <form onSubmit={save}>
            <div className="pg-upload">
              <img src={image} alt="Artwork preview" />
              <Field label="Artwork image">
                <input type="file" accept="image/*" onChange={upload} />
                <small>Up to 600 KB · saved in this browser</small>
              </Field>
            </div>
            <Field label="Title">
              <input name="title" required defaultValue={edit.title} />
            </Field>
            <Field label="Artist">
              <input name="artist" required defaultValue={edit.artist} />
            </Field>
            <div className="pg-form-row">
              <Field label="Category">
                <select
                  name="category"
                  defaultValue={edit.category || "Oil painting"}
                >
                  {categories.map((c) => (
                    <option key={c.id}>{c.name}</option>
                  ))}
                </select>
              </Field>
              <Field label="Status">
                <select name="status" defaultValue={edit.status || "Draft"}>
                  <option>Draft</option>
                  <option>Published</option>
                </select>
              </Field>
            </div>
            <Field label="Content summary">
              <input name="content" defaultValue={edit.content || "VI · EN"} />
            </Field>
            {error && (
              <p role="alert" className="pg-error">
                {error}
              </p>
            )}
            <button className="primary">Save artwork</button>
          </form>
        </Modal>
      )}
      {remove && (
        <Modal title="Remove this artwork?" onClose={() => setRemove(null)}>
          <p>
            Remove “{remove.title}” from this local collection? This does not
            change the museum database.
          </p>
          <div className="pg-dialog-actions">
            <button className="pg-outline" onClick={() => setRemove(null)}>
              Keep artwork
            </button>
            <button
              className="primary"
              onClick={() => {
                setRows(rows.filter((r) => rowKey(r) !== rowKey(remove)));
                setRemove(null);
                toast("Artwork removed locally");
              }}
            >
              Remove artwork
            </button>
          </div>
        </Modal>
      )}
    </>
  );
}
