import Narration from "../../../muses-react/src/components/Narration/Narration";
import { useEffect, useState } from "react";
import { adminApi } from "../AdminAuth";
import { Header, Panel, Modal, Field, Stats } from "./shared";
import "./catalog.css";
const languages = [
  ["vi", "Tiếng Việt"],
  ["en", "English"],
  ["zh", "中文"],
  ["ja", "日本語"],
  ["ko", "한국어"],
];
const statusLabel = {
  Draft: "Nháp",
  Published: "Công bố",
  Hidden: "Ẩn",
  Confirmed: "Xác nhận",
  Cancelled: "Đã hủy",
};
const definitions = {
  artworks: {
    title: "Tác phẩm",
    description:
      "Enter the Vietnamese content, details about the work, and publish it right here.",
    fields: [
      ["title", "Name (Vietnamese)", "text", true],
      ["descriptionVi", "Vietnamese Description", "textarea"],
      ["shortDescriptionVi", "Short Description (Optional)", "textarea"],
      ["artistId", "Artist", "artists", true],
      ["categoryId", "Category", "categories", true],
      ["materialId", "Material", "materials", true],
      ["creationPeriod", "Year / Approximate Year"],
      ["dimensions", "Dimensions"],
      ["source", "Source (Optional)", "textarea"],
      ["imageUrl", "Image URL"],
      ["imageSource", "Image Source / Rights (Optional)"],
      ["ownerMuseumId", "Owning Museum (Different from Displaying Museum)", "museums"],
    ],
  },
  translations: {
    title: "Translation & voice-over",
    description: "Manage translations and preview voiceovers for each language.",
    fields: [
      ["artworkId", "Artwork", "artworks", true],
      ["language", "Languages", "languages", true],
      ["title", "Name Artwork Translation", "text", true],
      ["description", "Full Description", "textarea"],
      ["shortDescription", "Short Description", "textarea"],
      ["audioUrl", "Audio URL (Optional)"],
      [
        "source",
        "Translation Source / Translator (Optional)",
        "textarea",
      ],
      ["status", "Status", "translationStatus", true],
    ],
  },
  museums: {
    title: "Museums & Maps",
    description:
      "Verify addresses and pins before publishing. Do not hide museums with confirmed schedules.",
    fields: [
      ["name", "Museum Name", "text", true],
      ["address", "Address", "text", true],
      ["description", "Description", "textarea"],
      ["contact", "Contact", "textarea"],
      ["latitude", "Latitude [-90,90]", "number", true],
      ["longitude", "Longitude [-180,180]", "number", true],
      ["source", "Source", "textarea"],
      ["pinVerified", "Pin Verified", "checkbox"],
      ["isPublic", "Public Museum", "checkbox"],
    ],
  },
  schedules: {
    title: "Exhibition Schedule",
    description:
      "The end date is not included in the exhibition period. Draft and cancelled schedules do not use the current location.",
    fields: [
      ["artworkId", "Artwork", "artworks", true],
      ["museumId", "Displaying Museum", "museums", true],
      ["startDate", "Start Date", "date", true],
      ["endDate", "End Date (Exclusive)", "date"],
      ["source", "Schedule Confirmation Source", "textarea", true],
      ["verifiedOn", "Verification Date", "date", true],
      ["status", "Status", "scheduleStatus", true],
    ],
  },
  artists: {
    title: "Artists",
    description: "This item cannot be deleted if it is referenced by an artwork.",
    fields: [
      ["name", "Artist Name", "text", true],
      ["description", "Biography", "textarea"],
    ],
  },
  materials: {
    title: "Materials",
    description:
      "Changing the name will update the material name on related artworks.",
    fields: [["name", "Material Name", "text", true]],
  },
  categories: {
    title: "Categories",
    description: "Manage the classification of artifacts in the collection.",
    fields: [
      ["name", "Category Name", "text", true],
      ["description", "Description", "textarea"],
    ],
  },
};
const columns = {
  artworks: [
    ["title", "Artwork"],
    ["artist", "Artist"],
    ["material", "Material"],
    ["status", "Status"],
  ],
  translations: [
    ["artwork", "Artwork"],
    ["language", "Language"],
    ["title", "Translation Title"],
    ["status", "Status"],
  ],
  museums: [
    ["name", "Museum"],
    ["address", "Address"],
    ["isPublic", "Public Museum"],
  ],
  schedules: [
    ["artwork", "Artwork"],
    ["museum", "Museum"],
    ["startDate", "Start Date"],
    ["endDate", "End Date (Exclusive)"],
    ["status", "Status"],
  ],
  artists: [["name", "Artist"]],
  materials: [["name", "Material"]],
  categories: [["name", "Category"]],
};
export default function Catalog({ entity = "artworks", search = "" }) {
  const [kind, setKind] = useState(entity),
    [rows, setRows] = useState([]),
    [options, setOptions] = useState({}),
    [loading, setLoading] = useState(true),
    [error, setError] = useState(""),
    [attempt, setAttempt] = useState(0),
    [edit, setEdit] = useState(null),
    [saving, setSaving] = useState(false),
    [saveError, setSaveError] = useState(""),
    [notice, setNotice] = useState("");
  useEffect(() => {
    setKind(entity);
    setEdit(null);
  }, [entity]);
  useEffect(() => {
    const c = new AbortController();
    setLoading(true);
    setError("");
    setRows([]);
    const names = [
      ...new Set([
        kind,
        ...definitions[kind].fields
          .map((f) => f[2])
          .filter((x) => definitions[x]),
      ]),
    ];
    Promise.all(
      names.map(async (name) => [
        name,
        await adminApi(
          `/api/admin/catalog/${name}`,
          "GET",
          undefined,
          c.signal,
        ),
      ]),
    )
      .then((results) => {
        if (!c.signal.aborted) {
          const all = Object.fromEntries(results);
          setRows(all[kind]);
          setOptions(all);
        }
      })
      .catch((e) => {
        if (!c.signal.aborted) setError(e.message);
      })
      .finally(() => {
        if (!c.signal.aborted) setLoading(false);
      });
    return () => c.abort();
  }, [kind, attempt]);
  function launch(row) {
    setSaveError("");
    setNotice("");
    const next = row
      ? { ...row }
      : {
          status: "Draft",
          language: "vi",
          isPublic: false,
          pinVerified: false,
        };
    if (kind === "artworks") {
      next.descriptionVi = row?.descriptionVi ?? "";
      next.shortDescriptionVi = row?.shortDescriptionVi ?? "";
    }
    setEdit(next);
  }
  async function save(e) {
    e.preventDefault();
    const intent =
      kind === "artworks"
        ? e.nativeEvent.submitter?.value || edit.status || "Draft"
        : edit.status;
    if (
      kind === "artworks" &&
      intent === "Published" &&
      !edit.descriptionVi?.trim()
    ) {
      setSaveError("Nhập mô tả tiếng Việt trong form này để công bố tác phẩm.");
      e.currentTarget.querySelector('[name="descriptionVi"]')?.focus();
      return;
    }
    setSaving(true);
    setSaveError("");
    try {
      await adminApi(
        `/api/admin/catalog/${kind}${edit.id ? `/${edit.id}` : ""}`,
        edit.id ? "PUT" : "POST",
        { ...edit, status: intent },
      );
      setEdit(null);
      setNotice(
        kind === "artworks" && intent === "Published"
          ? "Save and published."
          : "Data saved.",
      );
      setAttempt((n) => n + 1);
    } catch (e) {
      setSaveError(e.message);
    } finally {
      setSaving(false);
    }
  }
  async function remove(row) {
    if (
      !window.confirm(
        kind === "artworks"
          ? `Delete “${row.title}” Delete and saved story?`
          : `Delete “${row.name}” If not used?`,
      )
    )
      return;
    try {
      await adminApi(`/api/admin/catalog/${kind}/${row.id}`, "DELETE");
      setAttempt((n) => n + 1);
      setNotice(
        kind === "artworks"
          ? "Artwork has been hidden, keeping history."
          : "Deleted.",
      );
    } catch (e) {
      setError(e.message);
    }
  }
  function field([name, title, type = "text", required]) {
    const value = edit[name] ?? "";
    const select =
      options[type] ||
      {
        languages: languages.map(([id, name]) => ({ id, name })),
        publication: ["Draft", "Published", "Hidden"].map((id) => ({
          id,
          name: statusLabel[id],
        })),
        translationStatus: ["Draft", "Published"].map((id) => ({
          id,
          name: statusLabel[id],
        })),
        scheduleStatus: ["Draft", "Confirmed", "Cancelled"].map((id) => ({
          id,
          name: statusLabel[id],
        })),
      }[type];
    const update = (value) => setEdit((old) => ({ ...old, [name]: value }));
    return (
      <Field key={name} label={title}>
        {select ? (
          <select
            name={name}
            required={required}
            value={value}
            disabled={
              !!edit.id &&
              kind === "translations" &&
              ["artworkId", "language"].includes(name)
            }
            onChange={(e) => update(e.target.value)}
          >
            <option value="">Chọn…</option>
            {select.map((o) => (
              <option key={o.id} value={o.id}>
                {o.name || o.title}
              </option>
            ))}
          </select>
        ) : type === "textarea" ? (
          <textarea
            name={name}
            value={value}
            rows={["description", "descriptionVi"].includes(name) ? 6 : 3}
            maxLength={
              ["description", "descriptionVi"].includes(name)
                ? 12000
                : ["shortDescription", "shortDescriptionVi"].includes(name)
                  ? 1000
                  : 4000
            }
            required={required}
            onChange={(e) => update(e.target.value)}
          />
        ) : type === "checkbox" ? (
          <input
            type="checkbox"
            checked={!!value}
            onChange={(e) => update(e.target.checked)}
          />
        ) : (
          <input
            name={name}
            type={type}
            value={value}
            step={type === "number" ? "any" : undefined}
            required={required}
            onChange={(e) => update(e.target.value)}
          />
        )}
      </Field>
    );
  }
  const visible = rows.filter((row) =>
    JSON.stringify(row).toLowerCase().includes(search.toLowerCase()),
  );
  return (
    <div className="pg-workspace catalog-admin">
      <Header
        title={definitions[kind].title}
        description={definitions[kind].description}
        action={
          <button
            className="primary"
            disabled={loading || !!error}
            onClick={() => launch(null)}
          >
            + Thêm mới
          </button>
        }
      />
      {["artists", "categories", "materials"].includes(entity) && (
        <nav className="catalog-tabs" aria-label="Classification data">
          {["artists", "materials", "categories"].map((k) => (
            <button
              key={k}
              aria-pressed={k === kind}
              onClick={() => {
                setKind(k);
                setEdit(null);
              }}
            >
              {definitions[k].title}
            </button>
          ))}
        </nav>
      )}
      <Stats
        items={[
          ["Total Records", loading ? "—" : rows.length, "Managing", "pink"],
          [
            "Published / Confirmed",
            loading
              ? "—"
              : rows.filter(
                  (r) =>
                    ["Published", "Confirmed"].includes(r.status) || r.isPublic,
                ).length,
            "Published / Confirmed",
            "green",
          ],
          [
            "Draft / Hidden",
            loading
              ? "—"
              : rows.filter(
                  (r) =>
                    ["Draft", "Hidden", "Cancelled"].includes(r.status) ||
                    r.isPublic === false,
                ).length,
            "Needs Review",
            "yellow",
          ],
        ]}
      />
      {notice && <p role="status">{notice}</p>}
      {error && (
        <p role="alert">
          {error}{" "}
          <button onClick={() => setAttempt((n) => n + 1)}>Try Again</button>
        </p>
      )}
      <Panel title={definitions[kind].title}>
        {loading ? (
          <p role="status">Loading data…</p>
        ) : (
          <div className="catalog-table-wrap">
            <table>
              <thead>
                <tr>
                  {columns[kind].map(([key, title]) => (
                    <th key={key}>{title}</th>
                  ))}
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {visible.map((row) => (
                  <tr key={row.id}>
                    {columns[kind].map(([key]) => (
                      <td key={key}>
                        {key === "isPublic"
                          ? row[key]
                            ? "Có"
                            : "Không"
                          : statusLabel[row[key]] || row[key] || "—"}
                        {key === columns[kind][0][0] && row.isDemo && (
                          <small className="catalog-demo-badge">Demo</small>
                        )}
                      </td>
                    ))}
                    <td>
                      <button onClick={() => launch(row)}>Edit</button>
                      {[
                        "artworks",
                        "artists",
                        "materials",
                        "categories",
                      ].includes(kind) && (
                        <button onClick={() => remove(row)}>
                          {kind === "artworks" ? "Delete from public" : "Delete"}
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {!visible.length && !error && <p>No matching records found.</p>}
          </div>
        )}
      </Panel>
      {edit && (
        <Modal
          title={`${edit.id ? "Edit" : "Add"} · ${definitions[kind].title}`}
          onClose={() => {
            if (!saving) setEdit(null);
          }}
        >
          <form onSubmit={save} className="catalog-form">
            <fieldset disabled={saving}>
              {kind === "artworks" ? (
                <>
                  <section className="catalog-form-group">
                    <h3>Vietnamese Content</h3>
                    {definitions.artworks.fields.slice(0, 3).map(field)}
                  </section>
                  <section className="catalog-form-group">
                    <h3>Artwork Information</h3>
                    {definitions.artworks.fields.slice(3).map(field)}
                  </section>
                </>
              ) : (
                definitions[kind].fields.map(field)
              )}
              {kind === "translations" && edit.description && (
                <Narration
                  key={`${edit.artworkId}-${edit.language}`}
                  text={edit.description}
                  language={edit.language || "vi"}
                  requestedLanguage={edit.language || "vi"}
                  vi={edit.language === "vi"}
                />
              )}
              {kind === "museums" &&
                edit.latitude !== "" &&
                edit.latitude != null &&
                edit.longitude != null && (
                  <a
                    target="_blank"
                    rel="noopener noreferrer"
                    href={`https://www.openstreetmap.org/?mlat=${Number(edit.latitude)}&mlon=${Number(edit.longitude)}#map=17/${Number(edit.latitude)}/${Number(edit.longitude)}`}
                  >
                    Check the pin on the map
                  </a>
                )}
              <div className="catalog-form-actions">
                <button type="button" onClick={() => setEdit(null)}>
                  Cancel
                </button>
                {kind === "artworks" ? (
                  <>
                    <button
                      type="submit"
                      value={
                        edit.status === "Published" ? "Published" : "Draft"
                      }
                      className={edit.status === "Published" ? "primary" : ""}
                    >
                      {saving
                        ? "Saving…"
                        : edit.status === "Published"
                          ? "Save Changes"
                          : "Save Drafts"}
                    </button>
                    <button
                      type="submit"
                      value={
                        edit.status === "Published" ? "Draft" : "Published"
                      }
                      className={edit.status === "Published" ? "" : "primary"}
                    >
                      {edit.status === "Published"
                        ? "Move to Draft"
                        : "Save and Publish"}
                    </button>
                  </>
                ) : (
                  <button className="primary">
                    {saving ? "Saving…" : "Save"}
                  </button>
                )}
              </div>
            </fieldset>
            {saveError && <p role="alert">{saveError}</p>}
          </form>
        </Modal>
      )}
    </div>
  );
}
