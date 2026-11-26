import { useAdminLanguage } from "../AdminLanguage";
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
const hourLabel = (hour) =>
  `${String(hour).padStart(2, "0")}:00–${String(hour + 1).padStart(2, "0")}:00`;
export default function Analytics({ mode = "overview", search = "" }) {
  const { t, lang } = useAdminLanguage();
  const clock = (value) => new Date(value).toLocaleString(lang, { timeZone: "Asia/Ho_Chi_Minh" });
  const formatDay = (day) => new Date(day + "T00:00:00Z").toLocaleDateString(lang, { timeZone: "UTC" });
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
  const dayLabel = formatDay(hourDate);
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
        <p role="status">{t("Checking login session…")}</p>
      </div>
    );
  if (!user)
    return (
      <div className="pg-workspace analytics">
        <Panel title={t("Admin Login")}>
          <form className="analytics-login" onSubmit={login}>
            <p>{t("View visitor traffic and activity at reading points.")}</p>
            <Field label={t("Email")}>
              <input
                name="email"
                type="email"
                required
                autoComplete="username"
              />
            </Field>
            <Field label={t("Password")}>
              <input
                name="password"
                type="password"
                required
                autoComplete="current-password"
                maxLength={128}
              />
            </Field>
            <button className="primary" disabled={authBusy}>
              {authBusy ? t("Logging in…") : t("Login")}
            </button>
            {authError && <p role="alert">{t(authError)}</p>}
          </form>
        </Panel>
      </div>
    );
  if (!["Admin", "Administrator"].includes(user.role))
    return (
      <div className="pg-workspace">
        <p role="alert">{t("This account does not have permission to view admin statistics.")}</p>
        <button onClick={logout}>{t("Sign out")}</button>
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
      fold(`${row.id} ${row.name || t("Guest")}`).includes(fold(search.trim())) &&
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
        title={isOverview ? t("Hello, {name}", { name: user.name }) : t("Reports")}
        description={
          isOverview
            ? t("Overview of traffic, interactions, and recent sessions.")
            : t("Monitor activity on the website and at reading points.")
        }
        action={
          isOverview ? (
            <a className="primary" href="#Reports">
              {t("View Reports")}
            </a>
          ) : null
        }
      />
      <div className="analytics-filters">
        <label>
          {t("From")}
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
          {t("To")}
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
          {t("Today")}
        </button>
        <button
          aria-pressed={from === weekStart() && to === today()}
          onClick={() => {
            setFrom(weekStart());
            setTo(today());
          }}
        >
          {t("7 Days")}
        </button>
        <button
          onClick={() => setAttempt((n) => n + 1)}
          disabled={loading}
          aria-busy={loading}
        >
          {t("Refresh")}
        </button>
        <span role="status">
          {loading
            ? t("Updating…")
            : data
              ? t("Updated {time}", { time: clock(data.updatedAt) })
              : ""}
        </span>
        <small>{t("Automatically updates every 5 seconds while viewing the page")}</small>
      </div>
      {error && (
        <p className="analytics-error" role="alert">
          {t(error)}{" "}
          <button onClick={() => setAttempt((n) => n + 1)}>{t("Try again")}</button>
        </p>
      )}
      {s?.trackingReady === 0 && (
        <p className="analytics-error" role="alert">
          {t("The SQL account of the backend does not have sufficient permissions to record access. Please update the permissions for the AnalyticsSessions and AnalyticsEvents tables using the db:setup command in muses-backend.")}
        </p>
      )}
      <Stats
        items={[
          [
            t("Active Visitors"),
            s?.activeVisitors ?? "—",
            t("In the last 5 minutes"),
            "green",
            "people",
          ],
          [
            t("Access Devices"),
            s?.visitors ?? "—",
            t("Different devices used during the period"),
            "pink",
            "people",
          ],
          [
            t("Sessions"),
            s?.sessions ?? "—",
            t("Sessions during the period"),
            "yellow",
            "chart",
          ],
          [
            t("QR Opens"),
            s?.qrScans ?? "—",
            t("Opened the work page from QR"),
            "green",
            "qr",
          ],
          [
            t("Audio Plays"),
            s?.audioPlays ?? "—",
            t("Excluding pause/Continue"),
            "blue",
            "audio",
          ],
        ]}
      />
      {data && !data.trackingSince && (
        <p className="analytics-empty">
          {t("No activity recorded yet. Open the website or scan the QR code at the reading point to begin generating data.")}
        </p>
      )}
      <Panel
        title={t("Report by time interval")}
        subtitle={t("{date} · Vietnam time (GMT+7)", { date: dayLabel })}
      >
        <div className="analytics-hour-filters">
          <label>
            {t("Date viewed")}
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
            {t("Today")}
          </button>
          <label>
            {t("From")}
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
            {t("To hour")}
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
            {t("All day")}
          </button>
        </div>
        <p className="analytics-hour-summary" role="status">
          {hourly.loading && t("Loading…") + " "}{dayLabel}
          {hourDate === today() ? ` (${t("Today")})` : ""} · {" "}
          {fromHour === 0 && toHour === 24 ? t("All day") + " · " : ""}
          {String(fromHour).padStart(2, "0")}:00–
          {String(toHour).padStart(2, "0")}:00
        </p>
        {hourly.error && (
          <p className="analytics-error" role="alert">
            {t(hourly.error)}{" "}
            <button onClick={() => setAttempt((n) => n + 1)}>{t("Try again")}</button>
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
            aria-label={t("Hourly devices on {date}", { date: dayLabel })}
          >
            {hours.map((row) => (
              <div
                key={row.hour}
                title={`${dayLabel} · ${hourLabel(row.hour)}: ${t("{devices} devices, {interactions} interactions", { devices: row.visitors, interactions: row.interactions })}`}
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
          title={t("Participation at each reading point")}
          subtitle={t("Devices that opened QR or started listening to the narration")}
        >
          <div className="pg-table-wrap">
            <table>
              <thead>
                <tr>
                  <th>{t("Point/ Entry")}</th>
                  <th>{t("Device")}</th>
                  <th>{t("Guest")}</th>
                  <th>{t("Watch Artwork")}</th>
                  <th>{t("Open QR")}</th>
                  <th>{t("Start Listening")}</th>
                </tr>
              </thead>
              <tbody>
                {pointRows.map((row) => (
                  <tr key={`${row.point}-${row.artworkId}`}>
                    <td>
                      <strong>{row.title || t("Read Point")}</strong>
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
                        ? t("Not have matching read points.")
                        : t("Failed to load data.")}
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
          <Panel title={t("Daily Activity")}>
            <div className="pg-table-wrap">
              <table>
                <thead>
                  <tr>
                    <th>{t("Date")}</th>
                    <th>{t("Session")}</th>
                    <th>{t("Device")}</th>
                    <th>QR</th>
                    <th>{t("Listening")}</th>
                  </tr>
                </thead>
                <tbody>
                  {data?.daily.map((row) => (
                    <tr key={row.day}>
                      <td>{formatDay(row.day)}</td>
                      <td>{row.sessions}</td>
                      <td>{row.visitors}</td>
                      <td>{row.qrScans}</td>
                      <td>{row.audioPlays}</td>
                    </tr>
                  ))}
                  {!data?.daily.length && (
                    <tr>
                      <td colSpan={5}>{t("No activity recorded.")}</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </Panel>
        )}
        <Panel
          title={
            showVisitors ? t("List of Recent Sessions") : t("Recent Sessions")
          }
          subtitle={t("Maximum 100 sessions, sorted by last activity")}
        >
          {showVisitors && (
            <div className="analytics-visitor-tools">
              <label>
                {t("Status")}
                <select
                  value={visitorStatus}
                  onChange={(e) => setVisitorStatus(e.target.value)}
                >
                  <option value="all">{t("All")}</option>
                  <option value="active">{t("Active")}</option>
                  <option value="inactive">{t("Inactive")}</option>
                </select>
              </label>
              <span role="status">
                {t("Showing {count} of {total} recent sessions", { count: recentRows.length, total: data?.recent?.length || 0 })}
              </span>
            </div>
          )}
          <div className="pg-table-wrap">
            <table>
              <thead>
                <tr>
                  <th>{t("Guest")}</th>
                  {showVisitors && (
                    <>
                      <th>{t("Sessions Code")}</th>
                      <th>{t("Start")}</th>
                    </>
                  )}
                  <th>{t("Last Active")}</th>
                  <th>{t("Status")}</th>
                </tr>
              </thead>
              <tbody>
                {recentRows.map((row) => (
                  <tr key={row.id}>
                    <td>{row.name || `${t("Guest")} · ${row.id.slice(0, 8)}`}</td>
                    {showVisitors && (
                      <>
                        <td>
                          <code title={row.id}>{row.id.slice(0, 12)}</code>
                        </td>
                        <td>{clock(row.startedAt)}</td>
                      </>
                    )}
                    <td>{clock(row.lastSeenAt)}</td>
                    <td>{row.active ? t("Active") : t("Inactive")}</td>
                  </tr>
                ))}
                {!recentRows.length && (
                  <tr>
                    <td colSpan={showVisitors ? 5 : 3}>
                      {loading
                        ? t("Loading…")
                        : error && !data
                          ? t("Failed to load session.")
                          : t("No matching sessions.")}
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
          ? t("A single visitor can have multiple sessions. 'Active' status is determined based on interactions within the last 5 minutes.")
          : t("A single device can be shared by multiple users. Each entry is recorded as a distinct device at a specific location; this does not verify the actual presence of the visitor at the museum.")}
      </p>
    </div>
  );
}
