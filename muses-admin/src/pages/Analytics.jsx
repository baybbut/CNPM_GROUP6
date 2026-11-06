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
      throw Error("Cant connect to backend server.");
    }
    if (!response.ok) {
      const error = Error(data.message || "Cant fetch data.");
      error.status = response.status;
      throw error;
    }
    return data;
  } catch (error) {
    if (error.name === "AbortError" && !signal?.aborted)
      throw Error("Cant connect to backend server.");
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
              {authBusy ? "Logging in…" : "Log in"}
            </button>
            {authError && <p role="alert">{authError}</p>}
          </form>
        </Panel>
      </div>
    );
  if (!["Admin", "Administrator"].includes(user.role))
    return (
      <div className="pg-workspace">
        <p role="alert">This account does not have permission to view admin statistics.</p>
        <button onClick={logout}>Log out</button>
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
      fold(`${row.id} ${row.name || "Guest"}`).includes(fold(search.trim())) &&
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
        title={isOverview ? `Hello, ${user.name}` : "Reports"}
        description={
          isOverview
            ? "Overview of traffic, interactions, and recent sessions."
            : "Monitor activity on the website and at reading points."
        }
        action={
          isOverview ? (
            <a className="primary" href="#Reports">
              View Reports
            </a>
          ) : null
        }
      />
      <div className="analytics-filters">
        <label>
          From
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
          To
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
          Today
        </button>
        <button
          aria-pressed={from === weekStart() && to === today()}
          onClick={() => {
            setFrom(weekStart());
            setTo(today());
          }}
        >
          7 Days
        </button>
        <button
          onClick={() => setAttempt((n) => n + 1)}
          disabled={loading}
          aria-busy={loading}
        >
          Refresh
        </button>
        <span role="status">
          {loading
            ? "Updating…"
            : data
              ? `Updated ${clock(data.updatedAt)}`
              : ""}
        </span>
        <small>Automatically updates every 5 seconds while viewing the page</small>
      </div>
      {error && (
        <p className="analytics-error" role="alert">
          {error}{" "}
          <button onClick={() => setAttempt((n) => n + 1)}>Try again</button>
        </p>
      )}
      {s?.trackingReady === 0 && (
        <p className="analytics-error" role="alert">
          The SQL account of the backend does not have sufficient permissions to record access. Please update the permissions for the AnalyticsSessions and AnalyticsEvents tables using the db:setup command in muses-backend.
        </p>
      )}
      <Stats
        items={[
          [
            "Active Visitors",
            s?.activeVisitors ?? "—",
            "In the last 5 minutes",
            "green",
            "people",
          ],
          [
            "Access Devices",
            s?.visitors ?? "—",
            "Different devices used during the period",
            "pink",
            "people",
          ],
          [
            "Sessions",
            s?.sessions ?? "—",
            "Sessions during the period",
            "yellow",
            "chart",
          ],
          [
            "QR Opens",
            s?.qrScans ?? "—",
            "Opened the work page from QR",
            "green",
            "qr",
          ],
          [
            "Audio Plays",
            s?.audioPlays ?? "—",
            "Excluding pause/Continue",
            "blue",
            "audio",
          ],
        ]}
      />
      {data && !data.trackingSince && (
        <p className="analytics-empty">
          No activity recorded yet. Open the website or scan the QR code at the reading point to begin generating data.
        </p>
      )}
      <Panel
        title="Report by time interval"
        subtitle={`Days ${dayLabel} · time at Vietnam (GMT+7)`}
      >
        <div className="analytics-hour-filters">
          <label>
            Date viewed
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
            Today
          </button>
          <label>
            From
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
            To hour
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
            All day
          </button>
        </div>
        <p className="analytics-hour-summary" role="status">
          {hourly.loading ? "Loading" : "Loading"} Day {dayLabel}
          {hourDate === today() ? " (Today)" : ""} · {" "}
          {fromHour === 0 && toHour === 24 ? "All day · " : ""}
          {String(fromHour).padStart(2, "0")}:00–
          {String(toHour).padStart(2, "0")}:00
        </p>
        {hourly.error && (
          <p className="analytics-error" role="alert">
            {hourly.error}{" "}
            <button onClick={() => setAttempt((n) => n + 1)}>Try Again</button>
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
            aria-label={`Number of accessing devices by hour of the day ${dayLabel}`}
          >
            {hours.map((row) => (
              <div
                key={row.hour}
                title={`${dayLabel} · ${hourLabel(row.hour)}: ${row.visitors} devices, ${row.interactions} interactions`}
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
          title="Participation at each reading point"
          subtitle="Devices that opened QR or started listening to the narration"
        >
          <div className="pg-table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Point/ Entry</th>
                  <th>Device</th>
                  <th>Guest</th>
                  <th>Watch Artwork</th>
                  <th>Open QR</th>
                  <th>Start Listening</th>
                </tr>
              </thead>
              <tbody>
                {pointRows.map((row) => (
                  <tr key={`${row.point}-${row.artworkId}`}>
                    <td>
                      <strong>{row.title || "Read Point"}</strong>
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
                        ? "Not have matching read points."
                        : "Failed to load data."}
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
          <Panel title="Daily Activity">
            <div className="pg-table-wrap">
              <table>
                <thead>
                  <tr>
                    <th>Date</th>
                    <th>Session</th>
                    <th>Device</th>
                    <th>QR</th>
                    <th>Listening</th>
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
                      <td colSpan={5}>No activity recorded.</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </Panel>
        )}
        <Panel
          title={
            showVisitors ? "List of Recent Sessions" : "Recent Sessions"
          }
          subtitle="Maximum 100 sessions, sorted by last activity"
        >
          {showVisitors && (
            <div className="analytics-visitor-tools">
              <label>
                Status
                <select
                  value={visitorStatus}
                  onChange={(e) => setVisitorStatus(e.target.value)}
                >
                  <option value="all">All</option>
                  <option value="active">Active</option>
                  <option value="inactive">Inactive</option>
                </select>
              </label>
              <span role="status">
                Display {recentRows.length} / {data?.recent?.length || 0} recent sessions
              </span>
            </div>
          )}
          <div className="pg-table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Guest</th>
                  {showVisitors && (
                    <>
                      <th>Sessions Code</th>
                      <th>Start</th>
                    </>
                  )}
                  <th>Last Active</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {recentRows.map((row) => (
                  <tr key={row.id}>
                    <td>{row.name || `Guest · ${row.id.slice(0, 8)}`}</td>
                    {showVisitors && (
                      <>
                        <td>
                          <code title={row.id}>{row.id.slice(0, 12)}</code>
                        </td>
                        <td>{clock(row.startedAt)}</td>
                      </>
                    )}
                    <td>{clock(row.lastSeenAt)}</td>
                    <td>{row.active ? "Active" : "Inactive"}</td>
                  </tr>
                ))}
                {!recentRows.length && (
                  <tr>
                    <td colSpan={showVisitors ? 5 : 3}>
                      {loading
                        ? "Loading session..."
                        : error && !data
                          ? "Failed to load session."
                          : "No matching sessions."}
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
          ? "A single visitor can have multiple sessions. 'Active' status is determined based on interactions within the last 5 minutes."
          : "A single device can be shared by multiple users. Each entry is recorded as a distinct device at a specific location; this does not verify the actual presence of the visitor at the museum."}
      </p>
    </div>
  );
}
