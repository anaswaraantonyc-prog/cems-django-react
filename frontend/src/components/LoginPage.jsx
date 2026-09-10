import { useState } from "react";
import MedicalModule from "../modules/MedicalModule";

/* ════════════════════════════════════════════════════════════
   ICONS (Clean SVG Icons)
════════════════════════════════════════════════════════════ */
const EyeIcon = ({ open }) => (
  <svg width="17" height="17" viewBox="0 0 24 24" fill="none"
    stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    {open
      ? <><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></>
      : <><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94"/>
          <path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19"/>
          <line x1="1" y1="1" x2="23" y2="23"/></>
    }
  </svg>
);

const CheckIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none"
    stroke="#16a34a" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="20 6 9 17 4 12"/>
  </svg>
);

const XIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none"
    stroke="#dc2626" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
  </svg>
);

/* ════════════════════════════════════════════════════════════
   PULSING RING ANIMATION & RESPONSIVE LAYOUT
════════════════════════════════════════════════════════════ */
/* PulseStyle removed — all SOS animations, @font-face, and responsive
   rules are now in src/index.css */
function PulseStyle() { return null; }

/* ════════════════════════════════════════════════════════════
   FIELD INPUT
════════════════════════════════════════════════════════════ */
function Input({ label, id, type = "text", value, onChange, onBlur,
  error, touched, autoComplete, placeholder, rightSlot }) {
  const ok  = touched && !error && value.length > 0;
  const bad = touched && !!error;
  return (
    <div style={{ marginBottom: 18 }}>
      <label htmlFor={id} style={{
        display: "block", fontSize: 12, fontWeight: 700,
        letterSpacing: "0.05em", color: "#334155", marginBottom: 6, textTransform: "uppercase"
      }}>
        {label}
      </label>
      <div style={{ position: "relative" }}>
        <input id={id} type={type} value={value} onChange={onChange} onBlur={onBlur}
          autoComplete={autoComplete} placeholder={placeholder}
          style={{
            width: "100%", boxSizing: "border-box",
            padding: rightSlot ? "12px 42px 12px 14px" : "12px 38px 12px 14px",
            border: `1.5px solid ${bad ? "#ef4444" : ok ? "#22c55e" : "#cbd5e1"}`,
            borderRadius: 10, fontSize: 14,
            fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
            background: bad ? "#fef2f2" : ok ? "#f0fdf4" : "#f8fafc",
            color: "#0f172a", outline: "none",
            boxShadow: bad ? "0 0 0 3px rgba(239, 68, 68, 0.12)"
              : ok ? "0 0 0 3px rgba(34, 197, 94, 0.12)" : "none",
            transition: "all 0.2s ease",
          }}
        />
        {!rightSlot && touched && value.length > 0 && (
          <span style={{ position: "absolute", right: 14, top: "50%",
            transform: "translateY(-50%)", display: "flex" }}>
            {ok ? <CheckIcon /> : <XIcon />}
          </span>
        )}
        {rightSlot && (
          <span style={{ position: "absolute", right: 12, top: "50%",
            transform: "translateY(-50%)" }}>{rightSlot}</span>
        )}
      </div>
      {bad && (
        <p style={{ margin: "5px 0 0", fontSize: 12, color: "#dc2626",
          display: "flex", alignItems: "center", gap: 4, fontWeight: 500 }}>
          <XIcon />{error}
        </p>
      )}
    </div>
  );
}

/* ════════════════════════════════════════════════════════════
   VALIDATION
════════════════════════════════════════════════════════════ */
const USERNAME_RE = /^[A-Za-z0-9._]{4,150}$/;
function validateField(key, value) {
  if (key === "username") {
    if (!value.trim()) return "Username is required.";
    if (!USERNAME_RE.test(value.trim())) return "4+ chars — letters, numbers, . or _ only.";
  }
  if (key === "password") {
    if (!value) return "Password is required.";
    if (value.length < 8) return "At least 8 characters required.";
  }
  return null;
}

/* ════════════════════════════════════════════════════════════
   EXACT ECG HEART LINE EMERGENCY SOS BUTTON
════════════════════════════════════════════════════════════ */
function SosButton({ onClick }) {
  return (
    <div style={{
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      gap: 6,
    }}>
      <button
        className="sos-btn"
        onClick={onClick}
        title="Medical Emergency: Click to scan ID card and auto-call responder"
        style={{
          width: 80, height: 80,
          background: "#0A192F",
          border: "4px solid #ffffff",
          borderRadius: "50%",
          cursor: "pointer",
          position: "relative",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          padding: "0",
          boxShadow: "0 6px 20px rgba(10, 25, 47, 0.2)",
        }}>

        <svg width="60" height="76" viewBox="0 -2 24 32" fill="none" style={{ marginTop: "4px" }}>
          {/* Blinking Waves */}
          <path className="sos-waves" d="M15 8a4 4 0 0 1 2 2" stroke="#ffffff" strokeWidth="2.5" strokeLinecap="round" />
          <path className="sos-waves delay-1" d="M15 4a8 8 0 0 1 5 5" stroke="#ffffff" strokeWidth="2.5" strokeLinecap="round" />
          <path className="sos-waves delay-2" d="M15 0a12 12 0 0 1 8 8" stroke="#ffffff" strokeWidth="2.5" strokeLinecap="round" />
          
          {/* Handset */}
          <path d="M21.5 16.5v2.8c0 1.2-1 2.2-2.3 2.1a19.8 19.8 0 0 1-8.6-3.1 19.5 19.5 0 0 1-6-6 19.8 19.8 0 0 1-3.1-8.6C1.4 2.5 2.4 1.5 3.6 1.5h2.8c1 0 1.9.8 2.1 1.8.2.9.4 1.8.7 2.6.2.7 0 1.5-.6 2l-1.3 1.3a16 16 0 0 0 6 6l1.3-1.3c.5-.6 1.3-.8 2-.6.8.3 1.7.5 2.6.7 1 .2 1.8 1 1.8 2.1z" fill="#ffffff" />
        </svg>
      </button>

      {/* Small caption under icon */}
      <span style={{
        fontSize: 11,
        fontWeight: 700,
        color: "#0a192f",
        letterSpacing: "0.04em",
        fontFamily: "'Sentient', serif",
      }}>
        Emergency SOS
      </span>
    </div>
  );
}

/* ════════════════════════════════════════════════════════════
   MAIN LOGIN PAGE
════════════════════════════════════════════════════════════ */
export default function LoginPage({ onGoRegister, onLoggedIn }) {
  const [form, setForm]       = useState({ username: "", password: "" });
  const [touched, setTouched] = useState({});
  const [errors, setErrors]   = useState({});
  const [showPwd, setShowPwd] = useState(false);
  const [apiError, setApiError]   = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [showEmergency, setShowEmergency] = useState(false);

  const change = (key) => (e) => {
    const val = e.target.value;
    setForm(f => ({ ...f, [key]: val }));
    setTouched(t => ({ ...t, [key]: true }));
    setErrors(er => ({ ...er, [key]: validateField(key, val) }));
    setApiError("");
  };
  const blur = (key) => () => {
    setTouched(t => ({ ...t, [key]: true }));
    setErrors(er => ({ ...er, [key]: validateField(key, form[key]) }));
  };

  const submit = async (e) => {
    e.preventDefault();
    const newErrors = {
      username: validateField("username", form.username),
      password: validateField("password", form.password),
    };
    setTouched({ username: true, password: true });
    setErrors(newErrors);
    if (Object.values(newErrors).some(Boolean)) return;

    setSubmitting(true);
    setApiError("");
    try {
      const res = await fetch("/api/auth/login/", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username: form.username.trim(), password: form.password }),
      });
      const data = await res.json();
      if (!res.ok) {
        setApiError(
          Array.isArray(data.non_field_errors)
            ? data.non_field_errors.join(" ")
            : data.detail || "Invalid username or password."
        );
        return;
      }
      localStorage.setItem("cems_access",  data.access);
      localStorage.setItem("cems_refresh", data.refresh);
      onLoggedIn?.(data);
    } catch {
      setApiError("Could not reach the server. Make sure Django is running on port 8000.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleEmergencySuccess = (data) => {
    if (data.access) {
      localStorage.setItem("cems_access",  data.access);
      localStorage.setItem("cems_refresh", data.refresh || "");
    }
    setShowEmergency(false);
    onLoggedIn?.(data, true);
  };

  return (
    <>
      <PulseStyle />

      <div style={{
        minHeight: "calc(100vh - 58px)",
        padding: "40px 20px",
        display: "flex", justifyContent: "center", alignItems: "center",
        fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
        background: "radial-gradient(ellipse at top left, #ffffff 0%, #f1f5f9 60%, #e2e8f0 100%)",
        position: "relative",
        boxSizing: "border-box",
        overflowX: "hidden",
      }}>
        <div className="login-main-wrapper" style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          width: "100%",
          maxWidth: 1100,
          position: "relative",
        }}>

          {/* ── login card (centered) ── */}
          <div style={{
            background: "#ffffff",
            border: "1px solid #cbd5e1",
            borderRadius: 20,
            padding: "42px 38px",
            width: 370,
            boxShadow: "0 20px 50px rgba(10, 25, 47, 0.12), 0 2px 8px rgba(0, 0, 0, 0.04)",
            zIndex: 2,
          }}>
            {/* logo */}
            <div style={{ textAlign: "center", marginBottom: 28 }}>
              <div style={{
                width: 54, height: 54, borderRadius: 16, margin: "0 auto 14px",
                background: "linear-gradient(135deg, #0a192f, #1e3a8a)",
                display: "flex", alignItems: "center", justifyContent: "center",
                boxShadow: "0 6px 20px rgba(10, 25, 47, 0.35)",
              }}>
                <span style={{
                  color: "#ffffff", fontWeight: 800, fontSize: 24, letterSpacing: "-0.03em"
                }}>C</span>
              </div>
              <div style={{
                fontSize: 24, fontWeight: 800, color: "#0a192f", letterSpacing: "-0.02em"
              }}>
                Welcome back
              </div>
              <div style={{ fontSize: 14, color: "#475569", marginTop: 4 }}>
                Sign in to your CEMS account
              </div>
            </div>

            <form onSubmit={submit} noValidate>
              <Input label="Username" id="login-username"
                value={form.username} onChange={change("username")} onBlur={blur("username")}
                error={errors.username} touched={touched.username}
                autoComplete="username" placeholder="e.g. john.doe" />

              <Input label="Password" id="login-password"
                type={showPwd ? "text" : "password"}
                value={form.password} onChange={change("password")} onBlur={blur("password")}
                error={errors.password} touched={touched.password}
                autoComplete="current-password" placeholder="Your password"
                rightSlot={
                  <button type="button" onClick={() => setShowPwd(s => !s)}
                    style={{ background: "none", border: "none", cursor: "pointer",
                      color: "#64748b", padding: 2, display: "flex" }}>
                    <EyeIcon open={showPwd} />
                  </button>
                }
              />

              {apiError && (
                <div style={{
                  background: "#fef2f2", border: "1px solid #fca5a5",
                  borderRadius: 10, padding: "11px 14px", marginBottom: 16,
                  fontSize: 13, color: "#dc2626", display: "flex", gap: 8, alignItems: "flex-start", fontWeight: 500
                }}>
                  <XIcon /><span>{apiError}</span>
                </div>
              )}

              <button type="submit" disabled={submitting}
                style={{
                  width: "100%", padding: "13px", borderRadius: 10, border: "none",
                  background: submitting
                    ? "#94a3b8"
                    : "linear-gradient(135deg, #0a192f, #1e3a8a)",
                  color: "#ffffff", fontSize: 15, fontWeight: 700,
                  cursor: submitting ? "not-allowed" : "pointer",
                  letterSpacing: "0.01em",
                  boxShadow: submitting ? "none" : "0 4px 16px rgba(10, 25, 47, 0.3)",
                  transition: "all 0.2s ease",
                }}>
                {submitting ? "Signing in…" : "Sign In"}
              </button>
            </form>

            <div style={{ textAlign: "center", marginTop: 18, fontSize: 13, color: "#475569" }}>
              New here?{" "}
              <button onClick={onGoRegister}
                style={{ background: "none", border: "none", color: "#1d4ed8",
                  fontWeight: 700, cursor: "pointer", padding: 0, fontSize: 13 }}>
                Create an account
              </button>
            </div>
          </div>

          {/* ── SOS emergency button (side) ── */}
          <div className="sos-side-wrapper" style={{
            position: "absolute",
            right: 20,
            top: "50%",
            transform: "translateY(-50%)",
            zIndex: 3,
          }}>
            <SosButton onClick={() => setShowEmergency(true)} />
          </div>
        </div>
      </div>

      {/* ── emergency scan modal ── */}
      {showEmergency && (
        <div style={{
          position: "fixed", inset: 0,
          background: "rgba(15, 23, 42, 0.75)",
          display: "flex", alignItems: "center", justifyContent: "center",
          zIndex: 100, padding: 20,
          backdropFilter: "blur(6px)",
        }}>
          <div style={{ width: "min(540px, 100%)", maxHeight: "92vh", overflowY: "auto",
            borderRadius: 16, overflow: "hidden" }}>
            <MedicalModule
              emergencyMode
              onSuccess={handleEmergencySuccess}
              onClose={() => setShowEmergency(false)}
            />
          </div>
        </div>
      )}
    </>
  );
}
