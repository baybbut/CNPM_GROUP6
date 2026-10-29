import { useEffect, useState } from "react";
import { adminApi } from "../AdminAuth";
import { Header, Panel, Modal, Field } from "./shared";
import "./catalog.css";
const money = (value) =>
  new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" }).format(
    value,
  );
export default function Tickets({ search = "" }) {
  const [data, setData] = useState(null),
    [error, setError] = useState(""),
    [attempt, setAttempt] = useState(0),
    [edit, setEdit] = useState(null),
    [busy, setBusy] = useState(false),
    [saveError, setSaveError] = useState("");
  useEffect(() => {
    const c = new AbortController();
    setError("");
    Promise.all([
      adminApi("/api/admin/tickets/offers", "GET", undefined, c.signal),
      adminApi("/api/admin/catalog/museums", "GET", undefined, c.signal),
    ])
      .then(([offers, museums]) => {
        if (!c.signal.aborted) setData({ offers, museums });
      })
      .catch((e) => {
        if (!c.signal.aborted) setError(e.message);
      });
    return () => c.abort();
  }, [attempt]);
  function launch(museum) {
    const offer = data.offers.find((o) => o.id === museum.id);
    setSaveError("");
    setEdit(
      offer
        ? {
            ...offer,
            closedWeekdays: String(offer.closedWeekdays || "")
              .split(",")
              .filter(Boolean)
              .map(Number),
          }
        : {
            id: museum.id,
            name: museum.name,
            adultPrice: "",
            concessionPrice: "",
            childPrice: "",
            terms: "",
            closedWeekdays: [],
            isEnabled: false,
          },
    );
  }
  async function save(e) {
    e.preventDefault();
    setBusy(true);
    setSaveError("");
    try {
      await adminApi(`/api/admin/tickets/offers/${edit.id}`, "PUT", {
        ...edit,
        adultPrice: Number(edit.adultPrice),
        concessionPrice: Number(edit.concessionPrice),
        childPrice: Number(edit.childPrice),
      });
      setEdit(null);
      setAttempt((n) => n + 1);
    } catch (e) {
      setSaveError(e.message);
    } finally {
      setBusy(false);
    }
  }
  const visible = (data?.museums || []).filter((m) =>
    `${m.name} ${m.address}`
      .toLocaleLowerCase("vi")
      .includes(search.toLocaleLowerCase("vi")),
  );
  return (
    <div className="pg-workspace catalog-admin">
      <Header
        title="Giá vé bảo tàng"
        description="Cập nhật giá vé và điều kiện để khách tra cứu theo từng bảo tàng."
      />
      {error && (
        <p role="alert">
          {error}{" "}
          <button onClick={() => setAttempt((n) => n + 1)}>Thử lại</button>
        </p>
      )}
      {!data ? (
        <p role="status">Đang tải…</p>
      ) : (
        <>
          <Panel title="Bảng giá tra cứu">
            <div className="catalog-table-wrap">
              <table>
                <thead>
                  <tr>
                    <th>Bảo tàng</th>
                    <th>Người lớn</th>
                    <th>Ưu đãi</th>
                    <th>Trẻ em</th>
                    <th>Trạng thái</th>
                    <th>Thao tác</th>
                  </tr>
                </thead>
                <tbody>
                  {visible.map((m) => {
                    const offer = data.offers.find((o) => o.id === m.id);
                    return (
                      <tr key={m.id}>
                        <td>
                          {m.name}
                          {m.isDemo && (
                            <small className="catalog-demo-badge">
                              Minh họa
                            </small>
                          )}
                        </td>
                        <td>{offer ? money(offer.adultPrice) : "—"}</td>
                        <td>{offer ? money(offer.concessionPrice) : "—"}</td>
                        <td>{offer ? money(offer.childPrice) : "—"}</td>
                        <td>
                          {offer?.isEnabled
                            ? "Công khai bảng giá"
                            : "Chưa công khai"}
                        </td>
                        <td>
                          <button onClick={() => launch(m)}>Cấu hình</button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
              {!!data.museums.length && !visible.length && (
                <p>Không tìm thấy bảo tàng phù hợp.</p>
              )}
              {!data.museums.length && (
                <p>Tạo bảo tàng trước khi thiết lập bảng giá.</p>
              )}
            </div>
          </Panel>
        </>
      )}
      {edit && (
        <Modal
          title={`Bảng giá · ${edit.name}`}
          onClose={() => {
            if (!busy) setEdit(null);
          }}
        >
          <form onSubmit={save} className="catalog-form">
            <fieldset disabled={busy}>
              {[
                ["adultPrice", "Người lớn (VND)"],
                ["concessionPrice", "Vé ưu đãi (VND)"],
                ["childPrice", "Trẻ em (VND)"],
              ].map(([key, title]) => (
                <Field key={key} label={title}>
                  <input
                    type="number"
                    min="0"
                    max="10000000"
                    step="1"
                    required
                    value={edit[key]}
                    onChange={(e) =>
                      setEdit((old) => ({ ...old, [key]: e.target.value }))
                    }
                  />
                </Field>
              ))}
              <Field label="Điều kiện áp dụng / độ tuổi / giấy tờ ưu đãi">
                <textarea
                  required
                  maxLength={1500}
                  rows={5}
                  value={edit.terms}
                  onChange={(e) =>
                    setEdit((old) => ({ ...old, terms: e.target.value }))
                  }
                />
              </Field>
              <fieldset>
                <legend>Ngày không áp dụng bảng vé</legend>
                <div style={{ display: "flex", gap: 14, flexWrap: "wrap" }}>
                  {["CN", "T2", "T3", "T4", "T5", "T6", "T7"].map((day, n) => (
                    <label key={day}>
                      <input
                        type="checkbox"
                        checked={edit.closedWeekdays.includes(n)}
                        onChange={(e) =>
                          setEdit((old) => ({
                            ...old,
                            closedWeekdays: e.target.checked
                              ? [...old.closedWeekdays, n]
                              : old.closedWeekdays.filter((v) => v !== n),
                          }))
                        }
                      />
                      {day}
                    </label>
                  ))}
                </div>
              </fieldset>
              <Field label="Công khai bảng giá (bảo tàng cũng cần công khai)">
                <input
                  type="checkbox"
                  checked={edit.isEnabled}
                  onChange={(e) =>
                    setEdit((old) => ({ ...old, isEnabled: e.target.checked }))
                  }
                />
              </Field>
              <div className="catalog-form-actions">
                <button type="button" onClick={() => setEdit(null)}>
                  Hủy
                </button>
                <button className="primary">
                  {busy ? "Đang lưu…" : "Lưu bảng giá"}
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
