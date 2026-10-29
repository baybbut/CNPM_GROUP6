import { useEffect, useState } from "react";
import { Header, Panel, Stats, Field, download, csv } from "./shared";
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
    [visitorStatus, setVisitorStatus] = useState("all");
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
  const isOverview = mode === "overview";
  const showDetails = !isOverview;
  const showVisitors = isOverview;
  const fold = (value) =>
    String(value)
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/đ/gi, "d")
      .toLowerCase();
  const recentRows = (data?.recent || []).filter(
    (row) =>
      fold(`${row.id} ${row.name || "Khách"}`).includes(fold(search.trim())) &&
      (!showVisitors ||
        visitorStatus === "all" ||
        (visitorStatus === "active" ? Boolean(row.active) : !row.active)),
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
  function exportData(visitorsOnly = false) {
    const rows = [
      ["Từ ngày", from, "Đến ngày", to],
      ["Múi giờ", "Asia/Ho_Chi_Minh"],
      [],
      ...(visitorsOnly
        ? [
            ["Mã phiên", "Khách", "Bắt đầu", "Hoạt động cuối", "Trạng thái"],
            ...recentRows.map((row) => [
              row.id,
              row.name || "Khách",
              clock(row.startedAt),
              clock(row.lastSeenAt),
              row.active ? "Đang hoạt động" : "Đã rời",
            ]),
          ]
        : [
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
          ]),
    ];
    download(
      visitorsOnly ? "muses-visitors.csv" : "muses-statistics.csv",
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
        title={isOverview ? `Xin chào, ${user.name}` : "Báo cáo hoạt động"}
        description={
          isOverview
            ? "Tổng quan lượng truy cập, tương tác và các phiên gần đây."
            : "Theo dõi hoạt động trên website và tại các điểm đọc."
        }
        action={
          <div className="analytics-actions">
            {isOverview ? (
              <a className="primary" href="#Reports">
                Xem báo cáo
              </a>
            ) : (
              <button
                className="primary"
                disabled={!data}
                onClick={() => exportData(false)}
              >
                Xuất CSV
              </button>
            )}
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
      {showDetails && (
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
      )}
      <div
        className={
          showVisitors ? "analytics-visitor-list" : "analytics-columns"
        }
      >
        {showDetails && (
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
        )}
        <Panel
          title={
            showVisitors ? "Danh sách phiên truy cập" : "Phiên truy cập gần đây"
          }
          subtitle="Tối đa 100 phiên mới nhất trong khoảng ngày đã chọn"
          action={
            showVisitors && (
              <button
                className="primary"
                disabled={!data}
                onClick={() => exportData(true)}
              >
                Xuất CSV phiên truy cập
              </button>
            )
          }
        >
          {showVisitors && (
            <div className="analytics-visitor-tools">
              <label>
                Trạng thái
                <select
                  value={visitorStatus}
                  onChange={(e) => setVisitorStatus(e.target.value)}
                >
                  <option value="all">Tất cả</option>
                  <option value="active">Đang hoạt động</option>
                  <option value="inactive">Đã rời</option>
                </select>
              </label>
              <span role="status">
                Hiển thị {recentRows.length} / {data?.recent?.length || 0} phiên
                gần đây
              </span>
            </div>
          )}
          <div className="pg-table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Khách</th>
                  {showVisitors && (
                    <>
                      <th>Mã phiên</th>
                      <th>Bắt đầu</th>
                    </>
                  )}
                  <th>Hoạt động cuối</th>
                  <th>Trạng thái</th>
                </tr>
              </thead>
              <tbody>
                {recentRows.map((row) => (
                  <tr key={row.id}>
                    <td>{row.name || `Khách · ${row.id.slice(0, 8)}`}</td>
                    {showVisitors && (
                      <>
                        <td>
                          <code title={row.id}>{row.id.slice(0, 12)}</code>
                        </td>
                        <td>{clock(row.startedAt)}</td>
                      </>
                    )}
                    <td>{clock(row.lastSeenAt)}</td>
                    <td>{row.active ? "Đang hoạt động" : "Đã rời"}</td>
                  </tr>
                ))}
                {!recentRows.length && (
                  <tr>
                    <td colSpan={showVisitors ? 5 : 3}>
                      {loading
                        ? "Đang tải phiên truy cập…"
                        : error && !data
                          ? "Chưa tải được phiên truy cập."
                          : "Chưa có phiên phù hợp."}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </Panel>
      </div>
      <p className="analytics-caption">
        {showVisitors
          ? "Một khách có thể có nhiều phiên truy cập. Trạng thái đang hoạt động tính theo tương tác trong 5 phút gần nhất."
          : "Một thiết bị có thể được nhiều người dùng chung. Số tham gia là thiết bị riêng biệt tại mỗi điểm, không xác nhận khách đã có mặt tại bảo tàng."}
      </p>
    </div>
  );
}
