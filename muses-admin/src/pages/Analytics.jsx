import { useEffect, useState } from "react";
import { Header, Panel, Stats, Field } from "./shared";
import "./analytics.css";
const base = (import.meta.env.VITE_API_BASE_URL || "").replace(/\/$/, "");
async function api(path, body, signal) {
  const controller = new AbortController();
  const abort = () => controller.abort();
  if (signal?.aborted) abort();
  signal?.addEventListener("abort", abort, { once: true });
  const timeout = setTimeout(abort, 15000);
  try {
    const response = await fetch(base + path, {
      method: body ? "POST" : "GET",
      credentials: "include",
      headers: body ? { "Content-Type": "application/json" } : undefined,
      body: body ? JSON.stringify(body) : undefined,
      cache: "no-store",
      signal: controller.signal,
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
  } catch (error) {
    if (error.name === "AbortError" && !signal?.aborted)
      throw Error("Kết nối backend hết thời gian chờ. Vui lòng thử lại.");
    throw error;
  } finally {
    clearTimeout(timeout);
    signal?.removeEventListener("abort", abort);
  }
}
function useReport(user, path, attempt, onUnauthorized) {
  const [data, setData] = useState(null),
    [error, setError] = useState(""),
    [loading, setLoading] = useState(false);
  useEffect(() => {
    if (!path || !user || !["Admin", "Administrator"].includes(user.role)) return;
    const controller = new AbortController();
    let pending = false;
    async function refresh() {
      if (pending) return;
      pending = true;
      setLoading(true);
      setError("");
      try {
        const result = await api(path, null, controller.signal);
        if (!controller.signal.aborted) setData(result);
      } catch (e) {
        if (!controller.signal.aborted) {
          setError(e.message);
          if (e.status === 401) onUnauthorized(null);
        }
      } finally {
        pending = false;
        if (!controller.signal.aborted) setLoading(false);
      }
    }
    setData(null);
    void refresh();
    const refreshVisible = () => {
      if (document.visibilityState === "visible") void refresh();
    };
    const timer = setInterval(refreshVisible, 5000);
    window.addEventListener("focus", refreshVisible);
    document.addEventListener("visibilitychange", refreshVisible);
    return () => {
      controller.abort();
      clearInterval(timer);
      window.removeEventListener("focus", refreshVisible);
      document.removeEventListener("visibilitychange", refreshVisible);
    };
  }, [user, path, attempt, onUnauthorized]);
  return { data, error, loading };
}
const today = () =>
  new Date(Date.now() + 420 * 60000).toISOString().slice(0, 10);
const weekStart = () =>
  new Date(Date.now() + 420 * 60000 - 6 * 86400000).toISOString().slice(0, 10);
const clock = (value) =>
  new Date(value).toLocaleString("vi-VN", { timeZone: "Asia/Ho_Chi_Minh" });
const hourLabel = (hour) =>
  `${String(hour).padStart(2, "0")}:00–${String(hour + 1).padStart(2, "0")}:00`;
export default function Analytics({ mode = "overview", search = "" }) {
  const [user, setUser] = useState(null),
    [authLoading, setAuthLoading] = useState(true),
    [authBusy, setAuthBusy] = useState(false),
    [authError, setAuthError] = useState("");
  const [from, setFrom] = useState(weekStart),
    [to, setTo] = useState(today),
    [fromHour, setFromHour] = useState(0),
    [toHour, setToHour] = useState(24),
    [hourDate, setHourDate] = useState(today),
    [attempt, setAttempt] = useState(0),
    [visitorStatus, setVisitorStatus] = useState("all");
  const { data, error, loading } = useReport(
    user,
    `/api/admin/analytics?from=${from}&to=${to}&fromHour=${fromHour}&toHour=${toHour}`,
    attempt,
    setUser,
  );
  const sameDay = from === hourDate && to === hourDate;
  const singleDayReport = useReport(
    user,
    sameDay
      ? null
      : `/api/admin/analytics?from=${hourDate}&to=${hourDate}&fromHour=${fromHour}&toHour=${toHour}`,
    attempt,
    setUser,
  );
  const hourly = sameDay ? { data, error, loading } : singleDayReport;
  const dayLabel = hourDate.split("-").reverse().join("/");
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
  const hours = Array.from({ length: toHour - fromHour }, (_, index) => ({
    hour: fromHour + index,
    visitors: 0,
    interactions: 0,
    ...hourly.data?.hours?.find((row) => row.hour === fromHour + index),
  }));
  const maximum = Math.max(1, ...hours.map((row) => row.visitors));
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
          isOverview ? (
            <a className="primary" href="#Reports">
              Xem báo cáo
            </a>
          ) : null
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
          aria-pressed={from === today() && to === today()}
          onClick={() => {
            setFrom(today());
            setTo(today());
          }}
        >
          Hôm nay
        </button>
        <button
          aria-pressed={from === weekStart() && to === today()}
          onClick={() => {
            setFrom(weekStart());
            setTo(today());
          }}
        >
          7 ngày
        </button>
        <button
          onClick={() => setAttempt((n) => n + 1)}
          disabled={loading}
          aria-busy={loading}
        >
          Làm mới
        </button>
        <span role="status">
          {loading
            ? "Đang cập nhật…"
            : data
              ? `Cập nhật ${clock(data.updatedAt)}`
              : ""}
        </span>
        <small>Tự cập nhật mỗi 5 giây khi đang xem trang</small>
      </div>
      {error && (
        <p className="analytics-error" role="alert">
          {error}{" "}
          <button onClick={() => setAttempt((n) => n + 1)}>Thử lại</button>
        </p>
      )}
      {s?.trackingReady === 0 && (
        <p className="analytics-error" role="alert">
          Tài khoản SQL của backend chưa đủ quyền ghi nhận truy cập. Cần cập
          nhật quyền cho các bảng AnalyticsSessions và AnalyticsEvents bằng
          lệnh db:setup trong muses-backend.
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
        title="Báo cáo theo khung giờ"
        subtitle={`Số liệu ngày ${dayLabel} · giờ Việt Nam`}
      >
        <div className="analytics-hour-filters">
          <label>
            Ngày xem
            <input
              type="date"
              value={hourDate}
              max={today()}
              onChange={(e) => {
                if (e.target.value && e.target.value <= today())
                  setHourDate(e.target.value);
              }}
            />
          </label>
          <button
            onClick={() => setHourDate(today())}
            aria-pressed={hourDate === today()}
          >
            Hôm nay
          </button>
          <label>
            Từ giờ
            <select
              value={fromHour}
              onChange={(e) => {
                const next = Number(e.target.value);
                setFromHour(next);
                if (next >= toHour) setToHour(next + 1);
              }}
            >
              {Array.from({ length: 24 }, (_, h) => (
                <option key={h} value={h}>
                  {String(h).padStart(2, "0")}:00
                </option>
              ))}
            </select>
          </label>
          <label>
            Đến giờ
            <select
              value={toHour}
              onChange={(e) => setToHour(Number(e.target.value))}
            >
              {Array.from(
                { length: 24 - fromHour },
                (_, i) => fromHour + i + 1,
              ).map((h) => (
                <option key={h} value={h}>
                  {String(h).padStart(2, "0")}:00
                </option>
              ))}
            </select>
          </label>
          <button
            onClick={() => {
              setFromHour(0);
              setToHour(24);
            }}
            aria-pressed={fromHour === 0 && toHour === 24}
          >
            Cả ngày
          </button>
        </div>
        <p className="analytics-hour-summary" role="status">
          {hourly.loading ? "Đang tải" : "Đang hiển thị"} ngày {dayLabel}
          {hourDate === today() ? " (hôm nay)" : ""} · {" "}
          {fromHour === 0 && toHour === 24 ? "Cả ngày · " : ""}
          {String(fromHour).padStart(2, "0")}:00–
          {String(toHour).padStart(2, "0")}:00
        </p>
        {hourly.error && (
          <p className="analytics-error" role="alert">
            {hourly.error}{" "}
            <button onClick={() => setAttempt((n) => n + 1)}>Thử lại</button>
          </p>
        )}
        <div className="analytics-chart-scroll" aria-busy={hourly.loading}>
          <div
            className="analytics-hours"
            style={{
              gridTemplateColumns: `repeat(${hours.length}, minmax(24px, 1fr))`,
              minWidth: `${hours.length * 30}px`,
              maxWidth:
                hours.length < 6 ? `${hours.length * 100}px` : undefined,
            }}
            role="img"
            aria-label={`Số thiết bị truy cập theo từng giờ ngày ${dayLabel}`}
          >
            {hours.map((row) => (
              <div
                key={row.hour}
                title={`${dayLabel} · ${hourLabel(row.hour)}: ${row.visitors} thiết bị, ${row.interactions} tương tác`}
              >
                <strong>{hourly.data ? row.visitors : "—"}</strong>
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
