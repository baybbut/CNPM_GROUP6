import { LanguageSelect, useAdminLanguage } from "./AdminLanguage";
import { createContext, useContext, useEffect, useState } from "react";
import "./pages/analytics.css";
export const AdminContext = createContext(null);
export const useAdmin = () => useContext(AdminContext);
export async function adminApi(path, method = "GET", body, signal) {
  const base = (import.meta.env.VITE_API_BASE_URL || "").replace(/\/$/, "");
  let response;
  try {
    response = await fetch(base + path, {
      method,
      credentials: "include",
      cache: "no-store",
      signal: signal
        ? AbortSignal.any([signal, AbortSignal.timeout(20000)])
        : AbortSignal.timeout(20000),
      headers: body ? { "Content-Type": "application/json" } : undefined,
      body: body ? JSON.stringify(body) : undefined,
    });
  } catch (e) {
    if (e.name === "AbortError") throw e;
    throw Error("Cant connect to backend server.");
  }
  let data;
  try {
    data = await response.json();
  } catch {
    throw Error("Cant parse backend response.");
  }
  if (!response.ok) {
    if (response.status === 401 && method === "GET")
      window.dispatchEvent(new Event("muses-admin-session-ended"));
    const e = Error(data.message || "Cant save data.");
    e.status = response.status;
    throw e;
  }
  return data;
}
export default function AdminGate({ children }) {
  const { t } = useAdminLanguage();
  const [user, setUser] = useState(null),
    [loading, setLoading] = useState(true),
    [busy, setBusy] = useState(false),
    [error, setError] = useState("");
  useEffect(() => {
    let live = true;
    adminApi("/api/auth/me")
      .then((r) => {
        if (live) setUser(r.user);
      })
      .catch((e) => {
        if (live) setError(e.message);
      })
      .finally(() => {
        if (live) setLoading(false);
      });
    const expired = () => setUser(null);
    window.addEventListener("muses-admin-session-ended", expired);
    return () => {
      live = false;
      window.removeEventListener("muses-admin-session-ended", expired);
    };
  }, []);
  async function submit(e) {
    e.preventDefault();
    setBusy(true);
    setError("");
    const values = Object.fromEntries(new FormData(e.currentTarget));
    try {
      setUser((await adminApi("/api/auth/login", "POST", values)).user);
    } catch (e) {
      setError(e.message);
    } finally {
      setBusy(false);
    }
  }
  async function logout() {
    if (busy) return;
    setBusy(true);
    setError("");
    try {
      await adminApi("/api/auth/logout", "POST", {});
      setUser(null);
    } catch (e) {
      if (e.status === 401) setUser(null);
      else setError(e.message);
    } finally {
      setBusy(false);
    }
  }
  if (loading)
    return (
      <div className="catalog-auth" role="status">
        {t("Checking login session…")}
      </div>
    );
  if (user && !["Admin", "Administrator"].includes(user.role))
    return (
      <div className="catalog-auth">
        <h1>MUSES</h1>
        <p role="alert">{t("Access denied.")}</p>
        <button disabled={busy} onClick={logout}>{t(busy ? "Signing out…" : "Sign out")}</button>
        {error && <p role="alert">{t(error)}</p>}
      </div>
    );
  if (!user)
    return (
      <main className="catalog-auth">
        <div className="catalog-auth-card">
          <div className="admin-login-heading">
            <p>MUSES · ADMIN</p>
            <LanguageSelect />
          </div>
          <h1>{t("Admin Login")}</h1>
          <form onSubmit={submit}>
            <label>
              {t("Email")}
              <input
                type="email"
                name="email"
                autoComplete="username"
                required
              />
            </label>
            <label>
              {t("Password")}
              <input
                type="password"
                name="password"
                autoComplete="current-password"
                maxLength={128}
                required
              />
            </label>
            <button className="primary" disabled={busy}>
              {busy ? t("Logging in…") : t("Login")}
            </button>
            {error && <p role="alert">{t(error)}</p>}
          </form>
        </div>
      </main>
    );
  return (
    <AdminContext.Provider value={{ user, logout, busy, error }}>
      {children}
    </AdminContext.Provider>
  );
}
