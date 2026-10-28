import { useEffect, useState } from "react";
import { signInWithEmailAndPassword } from "firebase/auth";
import { auth } from "../firebase";

export default function Login() {
  const [email, setEmail] = useState(() => localStorage.getItem("rememberedEmail") || "");
  const [remember, setRemember] = useState(() => !!localStorage.getItem("rememberedEmail"));
  const [now, setNow] = useState(new Date());
  const [password, setPassword] = useState("");
  const [show, setShow] = useState(false);
  const [touched, setTouched] = useState({});
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    const timer = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const errors = {};
  if (!email.trim()) errors.email = "Email is required.";
  else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) errors.email = "Enter a valid email address.";
  if (!password) errors.password = "Password is required.";
  else if (password.length < 6) errors.password = "Password must be at least 6 characters.";

  const submit = async (event) => {
    event.preventDefault();
    setError("");
    setTouched({ email: true, password: true });
    if (Object.keys(errors).length) return;

    setBusy(true);
    try {
      await signInWithEmailAndPassword(auth, email.trim(), password);
      if (remember) localStorage.setItem("rememberedEmail", email.trim());
      else localStorage.removeItem("rememberedEmail");
    } catch (err) {
      const invalid = ["auth/invalid-credential", "auth/wrong-password", "auth/user-not-found"];
      if (invalid.includes(err.code)) setError("Incorrect email or password.");
      else if (err.code === "auth/too-many-requests") setError("Too many attempts. Please try again later.");
      else if (err.code === "auth/network-request-failed") setError("Network error. Check your connection.");
      else setError("Unable to sign in. Please try again.");
    } finally {
      setBusy(false);
    }
  };

  const blur = (field) => () => setTouched((current) => ({ ...current, [field]: true }));

  return (
    <div className="auth">
      <header className="auth-header">
        <span className="auth-title">Agriculture Monitoring System</span>
        <div className="clock">
          <b>{now.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" })}</b>
          <span>{now.toLocaleDateString([], { weekday: "short", month: "short", day: "numeric", year: "numeric" })}</span>
        </div>
      </header>
      <div className="auth-body">
        <div className="auth-brand">
          <img className="logo-img" src="/images/logo.png" alt="Agriculture Monitoring System logo" />
        </div>
        <div className="auth-panel">
          <form className="login-form" onSubmit={submit} noValidate>
            <h1>Welcome back</h1>
            <p className="sub">Sign in to Agriculture Monitoring System</p>

            <label htmlFor="email">Email</label>
            <div className="field">
              <svg className="ico" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="5" width="18" height="14" rx="2" /><path d="m3 7 9 6 9-6" /></svg>
              <input
                id="email"
                type="email"
                autoComplete="email"
                placeholder="you@example.com"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                onBlur={blur("email")}
                className={touched.email && errors.email ? "invalid" : ""}
              />
            </div>
            {touched.email && errors.email && <p className="error">{errors.email}</p>}

            <label htmlFor="password">Password</label>
            <div className="field pw-wrap">
              <svg className="ico" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="4" y="11" width="16" height="10" rx="2" /><path d="M8 11V7a4 4 0 0 1 8 0v4" /></svg>
              <input
                id="password"
                type={show ? "text" : "password"}
                autoComplete="current-password"
                placeholder="Enter your password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                onBlur={blur("password")}
                className={touched.password && errors.password ? "invalid" : ""}
              />
              <button
                type="button"
                className="pw-toggle"
                onClick={() => setShow((current) => !current)}
                aria-label={show ? "Hide password" : "Show password"}
              >
                {show ? "Hide" : "Show"}
              </button>
            </div>
            {touched.password && errors.password && <p className="error">{errors.password}</p>}

            <label className="remember">
              <input type="checkbox" checked={remember} onChange={(event) => setRemember(event.target.checked)} />
              Remember my email
            </label>

            {error && <div className="alert">{error}</div>}
            <button className="submit" disabled={busy}>
              {busy && <span className="spinner" aria-hidden="true" />}
              {busy ? "Signing in..." : "Sign in"}
            </button>
            <p className="note">Accounts are created by the administrator only.</p>
          </form>
        </div>
      </div>
    </div>
  );
}
