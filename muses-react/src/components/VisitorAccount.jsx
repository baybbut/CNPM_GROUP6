import { useEffect, useState } from "react";
import { authRequest } from "../api/activity.mjs";
import { useLang } from "../context/LangContext";
import "./visitor-account.css";
export default function VisitorAccount() {
  const { lang } = useLang(),
    vi = lang === "vi";
  const [user, setUser] = useState(null),
    [register, setRegister] = useState(false),
    [message, setMessage] = useState(""),
    [busy, setBusy] = useState(false);
  useEffect(() => {
    authRequest("me")
      .then((data) => setUser(data.user))
      .catch(() => {});
  }, []);
  async function submit(e) {
    e.preventDefault();
    setBusy(true);
    setMessage("");
    const data = Object.fromEntries(new FormData(e.currentTarget));
    try {
      if (register) {
        await authRequest("register", data);
        setRegister(false);
        setMessage(
          vi
            ? "Tạo tài khoản thành công. Vui lòng đăng nhập."
            : "Account created. Please sign in.",
        );
      } else {
        const result = await authRequest("login", data);
        setUser(result.user);
        window.dispatchEvent(new Event("muses-auth-change"));
        setMessage("");
      }
    } catch (error) {
      setMessage(error.message);
    } finally {
      setBusy(false);
    }
  }
  return (
    <div className="visitor-account">
      <section>
        <p>MUSES</p>
        <h1>
          {user
            ? vi
              ? "Tài khoản của bạn"
              : "Your account"
            : register
              ? vi
                ? "Tạo tài khoản"
                : "Create an account"
              : vi
                ? "Đăng nhập"
                : "Sign in"}
        </h1>
        {user ? (
          <>
            <p>{user.name}</p>
            <button
              className="account-primary"
              disabled={busy}
              onClick={async () => {
                setBusy(true);
                try {
                  await authRequest("logout", {});
                  setUser(null);
                  window.dispatchEvent(new Event("muses-auth-change"));
                } catch (e) {
                  setMessage(e.message);
                } finally {
                  setBusy(false);
                }
              }}
            >
              {vi ? "Đăng xuất" : "Sign out"}
            </button>
          </>
        ) : (
          <>
            <form onSubmit={submit}>
              {register && (
                <label>
                  {vi ? "Họ tên" : "Name"}
                  <input
                    name="name"
                    required
                    maxLength={150}
                    autoComplete="name"
                  />
                </label>
              )}
              <label>
                Email
                <input
                  name="email"
                  type="email"
                  required
                  maxLength={255}
                  autoComplete="email"
                />
              </label>
              <label>
                {vi ? "Mật khẩu" : "Password"}
                <input
                  name="password"
                  type="password"
                  required
                  minLength={register ? 8 : 1}
                  maxLength={128}
                  autoComplete={register ? "new-password" : "current-password"}
                />
              </label>
              <button className="account-primary" disabled={busy}>
                {busy
                  ? vi
                    ? "Đang xử lý…"
                    : "Please wait…"
                  : register
                    ? vi
                      ? "Đăng ký"
                      : "Register"
                    : vi
                      ? "Đăng nhập"
                      : "Sign in"}
              </button>
            </form>
            <button
              onClick={() => {
                setRegister(!register);
                setMessage("");
              }}
            >
              {register
                ? vi
                  ? "Đã có tài khoản? Đăng nhập"
                  : "Already registered? Sign in"
                : vi
                  ? "Tạo tài khoản mới"
                  : "Create an account"}
            </button>
          </>
        )}
        {message && <p role="status">{message}</p>}
      </section>
    </div>
  );
}
