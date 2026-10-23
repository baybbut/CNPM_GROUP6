import { useEffect, useState } from "react";
import QRCode from "qrcode";
import { Header, Panel, Stats, Modal, Field, download, csv } from "./shared";
import "./analytics.css";
const base = (import.meta.env.VITE_API_BASE_URL || "").replace(/\/$/, "");
async function api(path, body, signal) {
  const response = await fetch(base + path, {
    method: body ? "POST" : "GET",
    credentials: "include",
    headers: body ? { "Content-Type": "application/json" } : undefined,
    body: body ? JSON.stringify(body) : undefined,
    signal,
  });
  let data;
  try {
    data = await response.json();
  } catch {
    throw Error("Không kết nối được backend.");
  }
  if (!response.ok) {
    const error = Error(data.message || "Không tải được dữ liệu.");
    error.status = response.status;
    throw error;
  }
  return data;
}
const today = () =>
  new Date(Date.now() + 420 * 60000).toISOString().slice(0, 10);
const weekStart = () =>
  new Date(Date.now() + 420 * 60000 - 6 * 86400000).toISOString().slice(0, 10);
const clock = (value) =>
  new Date(value).toLocaleString("vi-VN", { timeZone: "Asia/Ho_Chi_Minh" });
const hourLabel = (hour) =>
  `${String(hour).padStart(2, "0")}:00–${String((hour + 1) % 24).padStart(2, "0")}:00`;
export default function Analytics({ mode = "overview", search = "" }) {
  const [user, setUser] = useState(null),
    [authLoading, setAuthLoading] = useState(true),
    [authBusy, setAuthBusy] = useState(false),
    [authError, setAuthError] = useState("");
  const [from, setFrom] = useState(weekStart),
    [to, setTo] = useState(today),
    [data, setData] = useState(null),
    [error, setError] = useState(""),
    [loading, setLoading] = useState(false),
    [attempt, setAttempt] = useState(0),
    [qr, setQr] = useState(false);
  useEffect(() => {
    let live = true;
    api("/api/auth/me")
      .then((result) => {
        if (live) setUser(result.user);
      })
      .catch((e) => {
        if (live) setAuthError(e.message);
      })
      .finally(() => {
        if (live) setAuthLoading(false);
      });
    return () => {
      live = false;
    };
  }, []);
  useEffect(() => {
    if (!user || !["Admin", "Administrator"].includes(user.role)) return;
    const controller = new AbortController();
    let pending = false;
    async function refresh() {
      if (pending) return;
      pending = true;
      setLoading(true);
      setError("");
      try {
        const result = await api(
          `/api/admin/analytics?from=${from}&to=${to}`,
          null,
          controller.signal,
        );
        if (!controller.signal.aborted) setData(result);
      } catch (e) {
        if (!controller.signal.aborted) {
          setError(e.message);
          if (e.status === 401) setUser(null);
        }
      } finally {
        pending = false;
        if (!controller.signal.aborted) setLoading(false);
      }
    }
    setData(null);
    void refresh();
    const timer = setInterval(() => {
      if (document.visibilityState === "visible") void refresh();
    }, 30000);
    return () => {
      controller.abort();
      clearInterval(timer);
    };
  }, [user, from, to, attempt]);
  async function login(e) {
    e.preventDefault();
    setAuthBusy(true);
    setAuthError("");
    try {
      const result = await api(
        "/api/auth/login",
        Object.fromEntries(new FormData(e.currentTarget)),
      );
      setUser(result.user);
    } catch (e) {
      setAuthError(e.message);
    } finally {
      setAuthBusy(false);
    }
  }
  async function logout() {
    try {
      await api("/api/auth/logout", {});
      setUser(null);
      setData(null);
    } catch (e) {
      setAuthError(e.message);
    }
  }
  if (authLoading)
    return (
      <div className="pg-workspace">
        <p role="status">Đang kiểm tra tài khoản…</p>
      </div>
    );
  if (!user)
    return (
      <div className="pg-workspace analytics">
        <Panel title="Đăng nhập quản trị">
          <form className="analytics-login" onSubmit={login}>
            <p>Xem lượng truy cập và hoạt động tại các điểm đọc.</p>
            <Field label="Email">
              <input
                name="email"
                type="email"
                required
                autoComplete="username"
              />
            </Field>
            <Field label="Mật khẩu">
              <input
                name="password"
                type="password"
                required
                autoComplete="current-password"
                maxLength={128}
              />
            </Field>
            <button className="primary" disabled={authBusy}>
              {authBusy ? "Đang đăng nhập…" : "Đăng nhập"}
            </button>
            {authError && <p role="alert">{authError}</p>}
          </form>
        </Panel>
      </div>
    );
  if (!["Admin", "Administrator"].includes(user.role))
    return (
      <div className="pg-workspace">
        <p role="alert">Tài khoản này không có quyền xem thống kê quản trị.</p>
        <button onClick={logout}>Đăng xuất</button>
      </div>
    );
  const s = data?.summary;
  const pointRows = (data?.points || []).filter((row) =>
    `${row.point} ${row.title}`.toLowerCase().includes(search.toLowerCase()),
  );
  const recentRows = (data?.recent || []).filter((row) =>
    `${row.id} ${row.name || ""}`.toLowerCase().includes(search.toLowerCase()),
  );
  const hours = Array.from({ length: 24 }, (_, hour) => ({
    hour,
    visitors: 0,
    interactions: 0,
    ...data?.hours.find((row) => row.hour === hour),
  }));
  const maximum = Math.max(1, ...hours.map((row) => row.visitors));
  const peak = data?.peakHours.length
    ? data.peakHours.map(hourLabel).join(", ")
    : "Chưa có dữ liệu";
  function exportData() {
    const rows = [
      ["Từ ngày", from, "Đến ngày", to],
      ["Múi giờ", "Asia/Ho_Chi_Minh"],
      [],
      [
        "Điểm đọc",
        "Tác phẩm",
        "Thiết bị tham gia",
        "Tài khoản tham gia",
        "Thiết bị xem",
        "Lượt mở QR",
        "Lượt bắt đầu nghe",
      ],
      ...pointRows.map((row) => [
        row.point,
        row.title || "",
        row.participants,
        row.signedInParticipants ?? 0,
        row.viewers,
        row.qrScans,
        row.audioPlays,
      ]),
      [],
      ["Khung giờ", "Thiết bị", "Tương tác"],
      ...hours.map((row) => [
        hourLabel(row.hour),
        row.visitors,
        row.interactions,
      ]),
      [],
      ["Ngày", "Phiên", "Thiết bị", "Mở QR", "Bắt đầu nghe"],
      ...(data?.daily || []).map((row) => [
        row.day,
        row.sessions,
        row.visitors,
        row.qrScans,
        row.audioPlays,
      ]),
    ];
    download(
      "muses-statistics.csv",
      "\uFEFF" +
        csv(
          rows.map((row) =>
            row.map((value) =>
              typeof value === "string" && /^[=+@-]/.test(value)
                ? "'" + value
                : value,
            ),
          ),
        ),
    );
  }
  return (
    <div className="pg-workspace analytics">
      <Header
        title={
          mode === "visitors"
            ? "Khách tham quan"
            : mode === "reports"
              ? "Báo cáo hoạt động"
              : mode === "points"
                ? "Điểm đọc & QR"
                : `Xin chào, ${user.name}`
        }
        description="Theo dõi hoạt động trên website và tại các điểm đọc."
        action={
          <div className="analytics-actions">
            <button className="secondary" onClick={() => setQr(true)}>
              Tạo QR điểm đọc
            </button>
            <button className="primary" disabled={!data} onClick={exportData}>
              Xuất CSV
            </button>
            <button onClick={logout}>Đăng xuất</button>
          </div>
        }
      />
      <div className="analytics-filters">
        <label>
          Từ ngày
          <input
            type="date"
            value={from}
            max={to}
            onChange={(e) => {
              if (e.target.value) setFrom(e.target.value);
            }}
          />
        </label>
        <label>
          Đến ngày
          <input
            type="date"
            value={to}
            min={from}
            max={today()}
            onChange={(e) => {
              if (e.target.value) setTo(e.target.value);
            }}
          />
        </label>
        <button
          onClick={() => {
            setFrom(today());
            setTo(today());
          }}
        >
          Hôm nay
        </button>
        <button
          onClick={() => {
            setFrom(weekStart());
            setTo(today());
          }}
        >
          7 ngày
        </button>
        <button onClick={() => setAttempt((n) => n + 1)} disabled={loading}>
          Làm mới
        </button>
        <span role="status">
          {loading
            ? "Đang cập nhật…"
            : data
              ? `Cập nhật ${clock(data.updatedAt)}`
              : ""}
        </span>
      </div>
      {error && (
        <p className="analytics-error" role="alert">
          {error}{" "}
          <button onClick={() => setAttempt((n) => n + 1)}>Thử lại</button>
        </p>
      )}
      <Stats
        items={[
          [
            "Khách đang hoạt động",
            s?.activeVisitors ?? "—",
            "Trong 5 phút gần nhất",
            "green",
            "people",
          ],
          [
            "Tài khoản đang hoạt động",
            s?.activeLoggedIn ?? "—",
            "Khách đã đăng nhập",
            "pink",
            "user",
          ],
          [
            "Tài khoản đã đăng nhập",
            s?.loggedInUsers ?? "—",
            "Tài khoản khác nhau trong kỳ",
            "blue",
            "user",
          ],
          [
            "Tổng lượt đăng nhập",
            s?.logins ?? "—",
            "Đăng nhập thành công trong kỳ",
            "yellow",
            "chart",
          ],
        ]}
      />
      <Stats
        items={[
          [
            "Thiết bị truy cập",
            s?.visitors ?? "—",
            "Thiết bị khác nhau trong kỳ",
            "pink",
            "people",
          ],
          [
            "Phiên truy cập",
            s?.sessions ?? "—",
            "Phiên trong kỳ",
            "yellow",
            "chart",
          ],
          [
            "Lượt mở QR",
            s?.qrScans ?? "—",
            "Mở trang tác phẩm từ QR",
            "green",
            "qr",
          ],
          [
            "Lượt bắt đầu nghe",
            s?.audioPlays ?? "—",
            "Không tính tạm dừng / tiếp tục",
            "blue",
            "audio",
          ],
        ]}
      />
      {data && !data.trackingSince && (
        <p className="analytics-empty">
          Chưa ghi nhận hoạt động. Mở website hoặc quét QR điểm đọc để bắt đầu
          có số liệu.
        </p>
      )}
      <Panel
        title="Khung giờ đông nhất"
        subtitle="Thiết bị có tương tác theo từng giờ · giờ Việt Nam"
      >
        <p className="analytics-peak">{data ? peak : "—"}</p>
        <div className="analytics-chart-scroll">
          <div
            className="analytics-hours"
            role="img"
            aria-label="Số thiết bị truy cập theo từng giờ"
          >
            {hours.map((row) => (
              <div
                key={row.hour}
                title={`${hourLabel(row.hour)}: ${row.visitors} thiết bị, ${row.interactions} tương tác`}
              >
                <strong>{data ? row.visitors : "—"}</strong>
                <div>
                  <span
                    style={{ height: `${(row.visitors / maximum) * 100}%` }}
                  />
                </div>
                <small>{row.hour}h</small>
              </div>
            ))}
          </div>
        </div>
      </Panel>
      <Panel
        title="Tham gia tại từng điểm đọc"
        subtitle="Thiết bị đã mở QR hoặc bắt đầu nghe thuyết minh"
      >
        <div className="pg-table-wrap">
          <table>
            <thead>
              <tr>
                <th>Điểm / tác phẩm</th>
                <th>Thiết bị tham gia</th>
                <th>Tài khoản tham gia</th>
                <th>Xem tác phẩm</th>
                <th>Mở QR</th>
                <th>Bắt đầu nghe</th>
              </tr>
            </thead>
            <tbody>
              {pointRows.map((row) => (
                <tr key={`${row.point}-${row.artworkId}`}>
                  <td>
                    <strong>{row.title || "Điểm đọc"}</strong>
                    <small className="analytics-point-id">{row.point}</small>
                  </td>
                  <td>{row.participants}</td>
                  <td>{row.signedInParticipants ?? 0}</td>
                  <td>{row.viewers}</td>
                  <td>{row.qrScans}</td>
                  <td>{row.audioPlays}</td>
                </tr>
              ))}
              {!pointRows.length && (
                <tr>
                  <td colSpan={6}>
                    {data
                      ? "Chưa có điểm đọc phù hợp."
                      : "Chưa tải được dữ liệu."}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </Panel>
      <div className="analytics-columns">
        <Panel title="Hoạt động theo ngày">
          <div className="pg-table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Ngày</th>
                  <th>Phiên</th>
                  <th>Thiết bị</th>
                  <th>QR</th>
                  <th>Nghe</th>
                </tr>
              </thead>
              <tbody>
                {data?.daily.map((row) => (
                  <tr key={row.day}>
                    <td>{row.day.split("-").reverse().join("/")}</td>
                    <td>{row.sessions}</td>
                    <td>{row.visitors}</td>
                    <td>{row.qrScans}</td>
                    <td>{row.audioPlays}</td>
                  </tr>
                ))}
                {!data?.daily.length && (
                  <tr>
                    <td colSpan={5}>Chưa có hoạt động.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </Panel>
        <Panel
          title="Phiên truy cập gần đây"
          subtitle="Tối đa 100 phiên mới nhất"
        >
          <div className="pg-table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Khách</th>
                  <th>Hoạt động cuối</th>
                  <th>Trạng thái</th>
                </tr>
              </thead>
              <tbody>
                {recentRows.map((row) => (
                  <tr key={row.id}>
                    <td>{row.name || `Khách · ${row.id.slice(0, 8)}`}</td>
                    <td>{clock(row.lastSeenAt)}</td>
                    <td>{row.active ? "Đang hoạt động" : "Đã rời"}</td>
                  </tr>
                ))}
                {!recentRows.length && (
                  <tr>
                    <td colSpan={3}>Chưa có phiên phù hợp.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </Panel>
      </div>
      <p className="analytics-caption">
        Một thiết bị có thể được nhiều người dùng chung. Số tham gia là thiết bị
        riêng biệt tại mỗi điểm, không xác nhận khách đã có mặt tại bảo tàng.
      </p>
      {qr && <PointQR onClose={() => setQr(false)} />}
    </div>
  );
}
function PointQR({ onClose }) {
  const [rows, setRows] = useState([]),
    [artwork, setArtwork] = useState(""),
    [point, setPoint] = useState(""),
    [image, setImage] = useState(""),
    [error, setError] = useState("");
  const defaultBase =
    import.meta.env.VITE_VISITOR_BASE_URL ||
    (import.meta.env.DEV
      ? `${location.protocol}//${location.hostname}:5173`
      : location.origin);
  const [visitorBase, setVisitorBase] = useState(defaultBase);
  let url = "";
  try {
    const target = new URL(`/explore/artworks/${artwork}`, visitorBase);
    if (
      ["http:", "https:"].includes(target.protocol) &&
      !target.username &&
      !target.password
    ) {
      target.searchParams.set("lang", "vi");
      target.searchParams.set("source", "qr");
      if (point) target.searchParams.set("point", point);
      url = target.href;
    }
  } catch {}
  useEffect(() => {
    const controller = new AbortController();
    api("/api/artworks?lang=vi", null, controller.signal)
      .then((data) => {
        setRows(data);
        if (data[0]) setArtwork(String(data[0].id));
      })
      .catch((e) => {
        if (!controller.signal.aborted) setError(e.message);
      });
    return () => controller.abort();
  }, []);
  useEffect(() => {
    let live = true;
    setImage("");
    if (!artwork || !url || !point || !/^[\w:-]{1,80}$/.test(point)) return;
    QRCode.toDataURL(url, { width: 600, margin: 4 })
      .then((src) => {
        if (live) setImage(src);
      })
      .catch(() => {
        if (live) setError("Chưa tạo được QR.");
      });
    return () => {
      live = false;
    };
  }, [artwork, url, point]);
  return (
    <Modal title="Tạo QR điểm đọc" onClose={onClose}>
      <Field label="Địa chỉ website khách">
        <input
          type="url"
          value={visitorBase}
          onChange={(e) => setVisitorBase(e.target.value)}
          required
        />
      </Field>
      <Field label="Tác phẩm">
        <select value={artwork} onChange={(e) => setArtwork(e.target.value)}>
          {rows.map((row) => (
            <option key={row.id} value={row.id}>
              {row.title}
            </option>
          ))}
        </select>
      </Field>
      <Field label="Mã điểm đọc">
        <input
          value={point}
          onChange={(e) => setPoint(e.target.value)}
          maxLength={80}
          pattern="[a-zA-Z0-9:_-]+"
          placeholder="san-vuon-01"
        />
      </Field>
      <p>Dùng cùng mã điểm để xem thống kê chung tại vị trí đó.</p>
      {point && !/^[a-zA-Z0-9:_-]{1,80}$/.test(point) && (
        <p role="alert">
          Mã điểm chỉ gồm chữ không dấu, số, dấu gạch ngang, gạch dưới hoặc dấu
          hai chấm.
        </p>
      )}
      {!url && <p role="alert">Nhập địa chỉ website hợp lệ.</p>}
      {image && (
        <>
          <img className="analytics-qr" src={image} alt="QR điểm đọc" />
          <a className="primary" href={image} download={`muses-${point}.png`}>
            Tải QR
          </a>
        </>
      )}
      {error && <p role="alert">{error}</p>}
    </Modal>
  );
}
