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
    description: "Quản lý từng hiện vật, thông tin nguồn và nội dung công bố.",
    fields: [
      ["title", "Tên tác phẩm", "text", true],
      ["artistId", "Tác giả", "artists", true],
      ["categoryId", "Thể loại", "categories", true],
      ["materialId", "Chất liệu", "materials", true],
      ["creationPeriod", "Năm / khoảng năm"],
      ["dimensions", "Kích thước"],
      ["source", "Nguồn thông tin", "textarea"],
      ["imageUrl", "URL ảnh đại diện"],
      ["imageSource", "Nguồn / quyền sử dụng ảnh"],
      ["ownerMuseumId", "Bảo tàng sở hữu (khác nơi đang trưng bày)", "museums"],
      ["status", "Trạng thái", "publication", true],
    ],
  },
  translations: {
    title: "Bản dịch & thuyết minh",
    description:
      "Nhập và duyệt bản dịch thủ công. Nội dung tiếng Việt cần công bố trước tác phẩm.",
    fields: [
      ["artworkId", "Tác phẩm", "artworks", true],
      ["language", "Ngôn ngữ", "languages", true],
      ["title", "Tên tác phẩm đã dịch"],
      ["description", "Mô tả đầy đủ", "textarea"],
      ["shortDescription", "Mô tả ngắn", "textarea"],
      ["audioUrl", "URL bản thu âm (không bắt buộc)"],
      ["source", "Nguồn bản dịch / người biên dịch", "textarea"],
      ["status", "Trạng thái", "translationStatus", true],
    ],
  },
  museums: {
    title: "Bảo tàng & bản đồ",
    description:
      "Kiểm chứng địa chỉ và ghim trước khi công khai. Không ẩn bảo tàng còn lịch đã xác nhận.",
    fields: [
      ["name", "Tên bảo tàng", "text", true],
      ["address", "Địa chỉ", "text", true],
      ["description", "Mô tả", "textarea"],
      ["contact", "Liên hệ"],
      ["latitude", "Vĩ độ [-90,90]", "number", true],
      ["longitude", "Kinh độ [-180,180]", "number", true],
      ["source", "Nguồn thông tin", "textarea"],
      ["pinVerified", "Đã đối chiếu ghim với địa chỉ", "checkbox"],
      ["isPublic", "Công khai bảo tàng", "checkbox"],
    ],
  },
  schedules: {
    title: "Lịch trưng bày",
    description:
      "Ngày kết thúc không được tính vào thời gian trưng bày. Lịch nháp và đã hủy không dùng xác định nơi hiện tại.",
    fields: [
      ["artworkId", "Tác phẩm", "artworks", true],
      ["museumId", "Bảo tàng trưng bày", "museums", true],
      ["startDate", "Ngày bắt đầu", "date", true],
      ["endDate", "Ngày kết thúc (không bao gồm ngày này)", "date"],
      ["source", "Nguồn xác nhận lịch", "textarea", true],
      ["verifiedOn", "Ngày kiểm chứng", "date", true],
      ["status", "Trạng thái", "scheduleStatus", true],
    ],
  },
  artists: {
    title: "Tác giả",
    description: "Mục đang được tác phẩm tham chiếu không thể xóa.",
    fields: [
      ["name", "Tên tác giả", "text", true],
      ["description", "Tiểu sử", "textarea"],
    ],
  },
  materials: {
    title: "Chất liệu",
    description:
      "Thay đổi tên sẽ cập nhật tên chất liệu trên các tác phẩm liên quan.",
    fields: [["name", "Tên chất liệu", "text", true]],
  },
  categories: {
    title: "Thể loại",
    description: "Quản lý phân loại các hiện vật trong bộ sưu tập.",
    fields: [
      ["name", "Tên thể loại", "text", true],
      ["description", "Mô tả", "textarea"],
    ],
  },
};
const columns = {
  artworks: [
    ["title", "Tác phẩm"],
    ["artist", "Tác giả"],
    ["material", "Chất liệu"],
    ["status", "Trạng thái"],
  ],
  translations: [
    ["artwork", "Tác phẩm"],
    ["language", "Ngôn ngữ"],
    ["title", "Tên bản dịch"],
    ["status", "Trạng thái"],
  ],
  museums: [
    ["name", "Bảo tàng"],
    ["address", "Địa chỉ"],
    ["isPublic", "Công khai"],
  ],
  schedules: [
    ["artwork", "Tác phẩm"],
    ["museum", "Bảo tàng"],
    ["startDate", "Từ ngày"],
    ["endDate", "Đến trước ngày"],
    ["status", "Trạng thái"],
  ],
  artists: [["name", "Tác giả"]],
  materials: [["name", "Chất liệu"]],
  categories: [["name", "Thể loại"]],
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
    setEdit(
      row
        ? { ...row }
        : {
            status: kind === "schedules" ? "Draft" : "Draft",
            language: "vi",
            isPublic: false,
            pinVerified: false,
          },
    );
  }
  async function save(e) {
    e.preventDefault();
    setSaving(true);
    setSaveError("");
    try {
      await adminApi(
        `/api/admin/catalog/${kind}${edit.id ? `/${edit.id}` : ""}`,
        edit.id ? "PUT" : "POST",
        edit,
      );
      setEdit(null);
      setNotice("Đã lưu dữ liệu.");
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
          ? `Xóa “${row.title}” khỏi công khai và giữ lịch sử?`
          : `Xóa mục “${row.name}” nếu chưa được sử dụng?`,
      )
    )
      return;
    try {
      await adminApi(`/api/admin/catalog/${kind}/${row.id}`, "DELETE");
      setAttempt((n) => n + 1);
      setNotice(
        kind === "artworks"
          ? "Đã chuyển tác phẩm sang ẩn, giữ lịch sử."
          : "Đã xóa.",
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
            value={value}
            rows={name === "description" ? 6 : 3}
            maxLength={
              name === "description"
                ? 12000
                : name === "shortDescription"
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
        <nav className="catalog-tabs" aria-label="Dữ liệu phân loại">
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
          ["Tổng bản ghi", loading ? "—" : rows.length, "Đang quản lý", "pink"],
          [
            "Công bố / xác nhận",
            loading
              ? "—"
              : rows.filter(
                  (r) =>
                    ["Published", "Confirmed"].includes(r.status) || r.isPublic,
                ).length,
            "Nội dung đã duyệt",
            "green",
          ],
          [
            "Nháp / ẩn",
            loading
              ? "—"
              : rows.filter(
                  (r) =>
                    ["Draft", "Hidden", "Cancelled"].includes(r.status) ||
                    r.isPublic === false,
                ).length,
            "Cần kiểm tra",
            "yellow",
          ],
        ]}
      />
      {notice && <p role="status">{notice}</p>}
      {error && (
        <p role="alert">
          {error}{" "}
          <button onClick={() => setAttempt((n) => n + 1)}>Thử lại</button>
        </p>
      )}
      <Panel title={definitions[kind].title}>
        {loading ? (
          <p role="status">Đang tải dữ liệu…</p>
        ) : (
          <div className="catalog-table-wrap">
            <table>
              <thead>
                <tr>
                  {columns[kind].map(([key, title]) => (
                    <th key={key}>{title}</th>
                  ))}
                  <th>Thao tác</th>
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
                          <small className="catalog-demo-badge">Minh họa</small>
                        )}
                      </td>
                    ))}
                    <td>
                      <button onClick={() => launch(row)}>Sửa</button>
                      {[
                        "artworks",
                        "artists",
                        "materials",
                        "categories",
                      ].includes(kind) && (
                        <button onClick={() => remove(row)}>
                          {kind === "artworks" ? "Xóa khỏi công khai" : "Xóa"}
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {!visible.length && !error && <p>Chưa có bản ghi phù hợp.</p>}
          </div>
        )}
      </Panel>
      {edit && (
        <Modal
          title={`${edit.id ? "Sửa" : "Thêm"} · ${definitions[kind].title}`}
          onClose={() => {
            if (!saving) setEdit(null);
          }}
        >
          <form onSubmit={save} className="catalog-form">
            <fieldset disabled={saving}>
              {definitions[kind].fields.map(field)}
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
                    Kiểm tra ghim trên bản đồ
                  </a>
                )}
              <div className="catalog-form-actions">
                <button type="button" onClick={() => setEdit(null)}>
                  Hủy
                </button>
                <button className="primary">
                  {saving ? "Đang lưu…" : "Lưu"}
                </button>
              </div>
            </fieldset>
            {saveError && <p role="alert">{saveError}</p>}
          </form>
        </Modal>
      )}
    </div>
  );
}
