import React, { useState, useEffect, useRef } from "react";
import Icon from "../Icons";
import {
  useSavedState,
  uid,
  matches,
  Empty,
  Field,
  Panel,
  Modal,
  Header,
  TextButton,
  categorySeed,
} from "./shared";
export default function Artists({ rows, setRows, search, toast }) {
  const [artists, setArtists] = useSavedState("muses-admin-artists", [
    {
      id: "a1",
      name: "Tô Ngọc Vân",
      description: "Vietnamese modern painting",
    },
    { id: "a2", name: "Nguyễn Gia Trí", description: "The poetry of lacquer" },
    {
      id: "a3",
      name: "Muses Collection",
      description: "Works from the museum archive",
    },
  ]);
  const [categories, setCategories] = useSavedState(
    "muses-admin-categories",
    categorySeed,
  );
  const [tab, setTab] = useState("Artists"),
    [edit, setEdit] = useState(null),
    [error, setError] = useState("");
  const data = tab === "Artists" ? artists : categories,
    setData = tab === "Artists" ? setArtists : setCategories;
  return (
    <>
      <Header
        title="The people behind the art"
        description="Celebrate the makers. Bring clarity to your collections."
        action={
          <button
            className="primary"
            onClick={() => {
              setError("");
              setEdit({});
            }}
          >
            <Icon name="plus" />
            Add {tab === "Artists" ? "artist" : "category"}
          </button>
        }
      />
      <div className="pg-tabs pg-tabs-standalone">
        {["Artists", "Categories"].map((x) => (
          <button
            className={x === tab ? "active" : ""}
            key={x}
            onClick={() => setTab(x)}
          >
            {x}
            <span>{x === "Artists" ? artists.length : categories.length}</span>
          </button>
        ))}
      </div>
      <div className="pg-profile-grid">
        {data
          .filter((a) => matches(a, search))
          .map((a, i) => (
            <Panel
              title={a.name}
              key={a.id}
              className={`pg-profile color-${i % 4}`}
            >
              <div className="pg-profile-symbol">
                <Icon name={tab === "Artists" ? "user" : "image"} size={37} />
              </div>
              <p>{a.description}</p>
              <strong>
                {
                  rows.filter(
                    (r) =>
                      (tab === "Artists"
                        ? r.artist
                        : r.category || "Oil painting") === a.name,
                  ).length
                }{" "}
                artworks
              </strong>
              <TextButton
                onClick={() => {
                  setError("");
                  setEdit(a);
                }}
              >
                Edit {tab === "Artists" ? "artist" : "category"}
              </TextButton>
            </Panel>
          ))}
      </div>
      {!data.some((a) => matches(a, search)) && <Empty />}
      {edit && (
        <Modal
          title={`${edit.id ? "Edit" : "Add"} ${tab === "Artists" ? "artist" : "category"}`}
          onClose={() => setEdit(null)}
        >
          <form
            onSubmit={(e) => {
              e.preventDefault();
              const f = new FormData(e.currentTarget),
                name = f.get("name").trim();
              if (!name) return setError("Enter a name.");
              if (
                data.some(
                  (a) =>
                    a.name.toLowerCase() === name.toLowerCase() &&
                    a.id !== edit.id,
                )
              )
                return setError("This name already exists.");
              setData(
                edit.id
                  ? data.map((a) =>
                      a.id === edit.id
                        ? { ...a, name, description: f.get("description") }
                        : a,
                    )
                  : [
                      ...data,
                      { id: uid(), name, description: f.get("description") },
                    ],
              );
              if (edit.id)
                setRows(
                  rows.map((r) =>
                    tab === "Artists" && r.artist === edit.name
                      ? { ...r, artist: name }
                      : tab === "Categories" &&
                          (r.category || "Oil painting") === edit.name
                        ? { ...r, category: name }
                        : r,
                  ),
                );
              setEdit(null);
              toast(
                `${tab === "Artists" ? "Artist" : "Category"} saved locally`,
              );
            }}
          >
            <Field label="Name">
              <input required name="name" defaultValue={edit.name} />
            </Field>
            <Field label="About">
              <textarea
                name="description"
                rows="3"
                defaultValue={edit.description}
              />
            </Field>
            {error && (
              <p className="pg-error" role="alert">
                {error}
              </p>
            )}
            <button className="primary">Save changes</button>
          </form>
        </Modal>
      )}
    </>
  );
}
