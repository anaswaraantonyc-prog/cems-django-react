import { useState, useEffect, useRef } from "react";
import {
  maroon, maroonDark, maroonSoft, offWhite, gold, goldLight,
  emergencyRed, floralBackground,
} from "../theme";
import MedicalModule from "../modules/MedicalModule";

/* ════════════════════════════════════════════════════════════
   ICONS
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
  <svg width="13" height="13" viewBox="0 0 24 24" fill="none"
    stroke="#2e7d52" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="20 6 9 17 4 12"/>
  </svg>
);

const XIcon = () => (
  <svg width="13" height="13" viewBox="0 0 24 24" fill="none"
    stroke="#b3202e" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
    <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
  </svg>
);

/* ════════════════════════════════════════════════════════════
   PULSING RING ANIMATION  (pure CSS-in-JS keyframe via style tag)
════════════════════════════════════════════════════════════ */
function PulseStyle() {
  return (
    <style>{`
      @keyframes sos-pulse {
        0%   { box-shadow: 0 0 0 0   rgba(179,32,46,0.7), 0 6px 24px rgba(179,32,46,0.5); }
        50%  { box-shadow: 0 0 0 18px rgba(179,32,46,0),  0 6px 24px rgba(179,32,46,0.5); }
        100% { box-shadow: 0 0 0 0   rgba(179,32,46,0.7), 0 6px 24px rgba(179,32,46,0.5); }
      }
      @keyframes sos-ring {
        0%  { transform: scale(1); }
        10% { transform: scale(1.12); }
        20% { transform: scale(1); }
        30% { transform: scale(1.08); }
        40% { transform: scale(1); }
      }
      .sos-btn {
        animation: sos-pulse 1.8s ease-in-out infinite;
        transition: transform 0.15s;
      }
      .sos-btn:hover {
        transform: scale(1.06);
        animation: sos-ring 0.5s ease forwards, sos-pulse 1.8s ease-in-out 0.5s infinite;
      }
      @keyframes call-bounce {
        0%, 100% { transform: rotate(0deg); }
        20%  { transform: rotate(-18deg); }
        40%  { transform: rotate(18deg); }
        60%  { transform: rotate(-10deg); }
        80%  { transform: rotate(10deg); }
      }
      .call-icon-anim { animation: call-bounce 1.4s ease-in-out infinite; }
    `}</style>
  );
}

/* ════════════════════════════════════════════════════════════
   FIELD INPUT
════════════════════════════════════════════════════════════ */
function Input({ label, id, type = "text", value, onChange, onBlur,
  error, touched, autoComplete, placeholder, rightSlot }) {
  const ok  = touched && !error && value.length > 0;
  const bad = touched && !!error;
  return (
    <div style={{ marginBottom: 16 }}>
      <label htmlFor={id} style={{ display: "block", fontSize: 11, fontWeight: 700,
        letterSpacing: "0.07em", color: "#7A3A44", marginBottom: 5, textTransform: "uppercase" }}>
        {label}
      </label>
      <div style={{ position: "relative" }}>
        <input id={id} type={type} value={value} onChange={onChange} onBlur={onBlur}
          autoComplete={autoComplete} placeholder={placeholder}
          style={{
            width: "100%", boxSizing: "border-box",
            padding: rightSlot ? "11px 42px 11px 13px" : "11px 36px 11px 13px",
            border: `1.5px solid ${bad ? "#e57373" : ok ? "#66bb6a" : "#D9C8CC"}`,
            borderRadius: 8, fontSize: 14, fontFamily: "inherit",
            background: bad ? "#fff8f8" : ok ? "#f6fff9" : "#fff",
            color: maroonDark, outline: "none",
            boxShadow: bad ? "0 0 0 3px rgba(179,32,46,0.07)"
              : ok ? "0 0 0 3px rgba(46,125,82,0.07)" : "none",
            transition: "border-color 0.2s, box-shadow 0.2s",
          }}
        />
        {!rightSlot && touched && value.length > 0 && (
          <span style={{ position: "absolute", right: 12, top: "50%",
            transform: "translateY(-50%)", display: "flex" }}>
            {ok ? <CheckIcon /> : <XIcon />}
          </span>
        )}
        {rightSlot && (
          <span style={{ position: "absolute", right: 10, top: "50%",
            transform: "translateY(-50%)" }}>{rightSlot}</span>
        )}
      </div>
      {bad && (
        <p style={{ margin: "4px 0 0", fontSize: 11, color: "#b3202e",
          display: "flex", alignItems: "center", gap: 3 }}>
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
   EMERGENCY SOS BUTTON  (Heart shape filled with 20 little hearts inside)
════════════════════════════════════════════════════════════ */
function SosButton({ onClick }) {
  // Exactly 20 little hearts rendered inside the heart shape
  const littleHearts = [
    { x: 32, y: 28, scale: 0.6, rot: -15, color: "#FFA4B2" },
    { x: 48, y: 24, scale: 0.65, rot: 10, color: "#FFE0E6" },
    { x: 63, y: 22, scale: 0.7, rot: 0, color: "#FFC2CD" },
    { x: 78, y: 24, scale: 0.65, rot: -10, color: "#FFA4B2" },
    { x: 94, y: 28, scale: 0.6, rot: 15, color: "#FFE0E6" },
    { x: 24, y: 42, scale: 0.55, rot: 25, color: "#FFE0E6" },
    { x: 38, y: 42, scale: 0.65, rot: -8, color: "#FFD1DA" },
    { x: 54, y: 38, scale: 0.7, rot: 12, color: "#FFA4B2" },
    { x: 72, y: 38, scale: 0.7, rot: -12, color: "#FFC2CD" },
    { x: 88, y: 42, scale: 0.65, rot: 8, color: "#FFD1DA" },
    { x: 102, y: 42, scale: 0.55, rot: -20, color: "#FFE0E6" },
    { x: 32, y: 58, scale: 0.6, rot: 18, color: "#FFC2CD" },
    { x: 48, y: 56, scale: 0.7, rot: -10, color: "#FFE0E6" },
    { x: 63, y: 54, scale: 0.75, rot: 5, color: "#FFA4B2" },
    { x: 78, y: 56, scale: 0.7, rot: -15, color: "#FFD1DA" },
    { x: 94, y: 58, scale: 0.6, rot: 12, color: "#FFE0E6" },
    { x: 44, y: 74, scale: 0.6, rot: -12, color: "#FFA4B2" },
    { x: 63, y: 72, scale: 0.7, rot: 0, color: "#FFE0E6" },
    { x: 82, y: 74, scale: 0.6, rot: 15, color: "#FFC2CD" },
    { x: 63, y: 92, scale: 0.55, rot: -5, color: "#FFD1DA" },
  ];

  return (
    <div style={{ display: "flex", flexDirection: "column",
      alignItems: "center", gap: 14, width: 220 }}>

      {/* Heart-shaped pulsing call button with 20 little hearts inside */}
      <button
        className="sos-btn"
        onClick={onClick}
        title="Tap to scan ID card and auto-call the medical rep"
        style={{
          width: 145, height: 135,
          background: "none",
          border: "none",
          cursor: "pointer",
          position: "relative",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          padding: 0,
        }}>
        
        <svg width="145" height="135" viewBox="0 0 126 120" style={{ filter: "drop-shadow(0 8px 22px rgba(179,32,46,0.65))" }}>
          <defs>
            <linearGradient id="mainHeartGrad" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#ff4d5a" />
              <stop offset="50%" stopColor="#e03c3c" />
              <stop offset="100%" stopColor="#9e0c1f" />
            </linearGradient>
            <clipPath id="heartClip">
              <path d="M63 110l-6.8-6.2C28.3 78.4 10 61.8 10 41.5 10 25 22.8 12 39 12c9.2 0 18 4.3 24 11 6-6.7 14.8-11 24-11 16.2 0 29 13 29 29.5 0 20.3-18.3 36.9-46.2 62.3L63 110z" />
            </clipPath>
          </defs>

          {/* Main outer Heart body with rich brown border */}
          <path
            d="M63 110l-6.8-6.2C28.3 78.4 10 61.8 10 41.5 10 25 22.8 12 39 12c9.2 0 18 4.3 24 11 6-6.7 14.8-11 24-11 16.2 0 29 13 29 29.5 0 20.3-18.3 36.9-46.2 62.3L63 110z"
            fill="url(#mainHeartGrad)"
            stroke="#3E2723"
            strokeWidth="3.5"
          />

          {/* Pattern of exactly 20 little hearts rendered inside the main heart */}
          <g clipPath="url(#heartClip)" opacity="0.75">
            {littleHearts.map((h, i) => (
              <g key={i} transform={`translate(${h.x}, ${h.y}) scale(${h.scale}) rotate(${h.rot})`}>
                <path
                  d="M0 6l-0.5-0.45C-2.4 3.2 -3.9 2.1 -3.9 0.8c0-1.1 0.9-1.9 1.9-1.9 0.6 0 1.2 0.3 1.6 0.8C0-0.8 0.6-1.1 1.2-1.1c1.1 0 1.9 0.9 1.9 1.9 0 1.3-1.5 2.4-3.3 4.75L0 6z"
                  fill={h.color}
                />
              </g>
            ))}
          </g>
        </svg>

        {/* Center content icon & text */}
        <div style={{
          position: "absolute",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          gap: 2,
          color: "#fff",
          marginTop: -2,
        }}>
          <span className="call-icon-anim" style={{ display: "flex" }}>
            <svg width="34" height="34" viewBox="0 0 24 24" fill="none"
              stroke="#fff" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.8 19.8 0 0 1-8.63-3.07
                A19.5 19.5 0 0 1 4.19 12 19.8 19.8 0 0 1 2.12 4.18
                A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72
                c.12.9.33 1.78.62 2.63a2 2 0 0 1-.45 2.11L8 9.73
                a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45
                c.85.29 1.73.5 2.63.62A2 2 0 0 1 22 16.92z"/>
            </svg>
          </span>
          <span style={{ fontSize: 12, fontWeight: 900, letterSpacing: "0.08em", textShadow: "0 2px 4px rgba(0,0,0,0.6)" }}>SOS</span>
        </div>
      </button>

      {/* label */}
      <div style={{ textAlign: "center" }}>
        <div style={{ fontFamily: "Georgia, serif", fontSize: 16, fontWeight: 700,
          color: "#3E2723", marginBottom: 4 }}>
          Medical Emergency?
        </div>
        <div style={{ fontSize: 12, color: "#6D4C41", lineHeight: 1.6 }}>
          Tap the red heart button —<br/>
          scan ID card → auto-call<br/>
          the on-duty medical rep.
        </div>
        <button onClick={onClick}
          style={{ marginTop: 10, padding: "8px 18px", borderRadius: 20,
            border: "2px solid #3E2723",
            background: "linear-gradient(135deg, #e03c3c, #b3202e)", color: "#fff", fontWeight: 700,
            fontSize: 12, cursor: "pointer", letterSpacing: "0.04em",
            boxShadow: "0 3px 10px rgba(179,32,46,0.45)",
            display: "flex", alignItems: "center", gap: 6, margin: "10px auto 0" }}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="#fff">
            <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/>
          </svg>
          Scan ID &amp; Call
        </button>
      </div>
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

  /* after emergency scan success → auto-login */
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
        ...floralBackground(offWhite, maroon, 0.10),
        minHeight: "calc(100vh - 58px)",
        padding: "52px 20px",
        display: "flex", justifyContent: "center", alignItems: "center",
        fontFamily: "'Inter', system-ui, sans-serif",
      }}>
        <div style={{ display: "flex", gap: 48, alignItems: "center",
          flexWrap: "wrap", justifyContent: "center" }}>

          {/* ── login card ── */}
          <div style={{
            background: "rgba(255, 255, 255, 0.92)",
            backdropFilter: "blur(12px)",
            WebkitBackdropFilter: "blur(12px)",
            border: "3px solid #3E2723",
            borderRadius: 20,
            padding: "40px 38px",
            width: 360,
            boxShadow: "0 20px 60px rgba(62, 39, 35, 0.22), 0 2px 8px rgba(0,0,0,0.12)",
          }}>
            {/* logo */}
            <div style={{ textAlign: "center", marginBottom: 28 }}>
              <div style={{
                width: 54, height: 54, borderRadius: "50%", margin: "0 auto 12px",
                background: `linear-gradient(135deg, ${maroon}, ${maroonSoft})`,
                display: "flex", alignItems: "center", justifyContent: "center",
                boxShadow: `0 4px 18px ${maroon}44`,
              }}>
                <span style={{ color: gold, fontFamily: "Georgia, serif",
                  fontWeight: 700, fontSize: 24 }}>C</span>
              </div>
              <div style={{ fontFamily: "Georgia, serif", fontSize: 24,
                fontWeight: 700, color: maroonDark }}>Welcome back</div>
              <div style={{ fontSize: 13, color: "#8A5560", marginTop: 3 }}>
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
                      color: "#8A5560", padding: 2, display: "flex" }}>
                    <EyeIcon open={showPwd} />
                  </button>
                }
              />

              {apiError && (
                <div style={{ background: "#fff0f0", border: "1px solid #f5c6c6",
                  borderRadius: 8, padding: "10px 14px", marginBottom: 14,
                  fontSize: 13, color: "#b3202e", display: "flex", gap: 8, alignItems: "flex-start" }}>
                  <XIcon /><span>{apiError}</span>
                </div>
              )}

              <button type="submit" disabled={submitting}
                style={{
                  width: "100%", padding: "13px", borderRadius: 8, border: "none",
                  background: submitting
                    ? "#A06070"
                    : `linear-gradient(135deg, ${maroon}, ${maroonSoft})`,
                  color: "#fff", fontSize: 15, fontWeight: 700,
                  cursor: submitting ? "not-allowed" : "pointer",
                  letterSpacing: "0.02em",
                  boxShadow: submitting ? "none" : `0 4px 16px ${maroon}55`,
                  transition: "all 0.2s",
                }}>
                {submitting ? "Signing in…" : "Sign In"}
              </button>
            </form>

            {/* Quick Demo Credentials for Principal, Faculty, Student */}
            <div style={{ marginTop: 18, paddingTop: 14, borderTop: "1px solid #EDE0E3", textAlign: "center" }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: "#8A5560", textTransform: "uppercase", marginBottom: 8, letterSpacing: "0.05em" }}>
                Quick Demo Sign-In
              </div>
              <div style={{ display: "flex", gap: 6, justifyContent: "center", flexWrap: "wrap" }}>
                <button
                  type="button"
                  onClick={() => {
                    setForm({ username: "neethu", password: "Passw0rd!123" });
                    setTouched({ username: true, password: true });
                  }}
                  style={{
                    padding: "5px 11px", borderRadius: 16, border: "1.5px solid #86EFAC",
                    background: "#F0FDF4", color: "#166534", fontSize: 11, fontWeight: 700, cursor: "pointer",
                    boxShadow: "0 1px 4px rgba(22,101,52,0.12)",
                  }}
                >
                  🍱 Canteen (Neethu)
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setForm({ username: "warden", password: "Passw0rd!123" });
                    setTouched({ username: true, password: true });
                  }}
                  style={{
                    padding: "5px 10px", borderRadius: 16, border: "1px solid #C4B5FD",
                    background: "#F5F3FF", color: "#5B21B6", fontSize: 11, fontWeight: 700, cursor: "pointer"
                  }}
                >
                  🏨 Warden
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setForm({ username: "principal", password: "pass1234" });
                    setTouched({ username: true, password: true });
                  }}
                  style={{
                    padding: "5px 10px", borderRadius: 16, border: "1px solid #D9C8CC",
                    background: "#FAF4ED", color: maroonDark, fontSize: 11, fontWeight: 700, cursor: "pointer"
                  }}
                >
                  🏛️ Principal
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setForm({ username: "faculty", password: "pass1234" });
                    setTouched({ username: true, password: true });
                  }}
                  style={{
                    padding: "5px 10px", borderRadius: 16, border: "1px solid #D9C8CC",
                    background: "#FAF4ED", color: maroonDark, fontSize: 11, fontWeight: 700, cursor: "pointer"
                  }}
                >
                  👨‍🏫 Faculty
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setForm({ username: "student", password: "pass1234" });
                    setTouched({ username: true, password: true });
                  }}
                  style={{
                    padding: "5px 10px", borderRadius: 16, border: "1px solid #D9C8CC",
                    background: "#FAF4ED", color: maroonDark, fontSize: 11, fontWeight: 700, cursor: "pointer"
                  }}
                >
                  🎓 Student
                </button>
              </div>
            </div>

            <div style={{ textAlign: "center", marginTop: 16, fontSize: 13, color: "#8A5560" }}>
              New here?{" "}
              <button onClick={onGoRegister}
                style={{ background: "none", border: "none", color: maroon,
                  fontWeight: 700, cursor: "pointer", padding: 0, fontSize: 13 }}>
                Create an account
              </button>
            </div>
          </div>

          {/* ── SOS emergency button ── */}
          <SosButton onClick={() => setShowEmergency(true)} />
        </div>
      </div>

      {/* ── emergency scan modal ── */}
      {showEmergency && (
        <div style={{
          position: "fixed", inset: 0,
          background: "rgba(20,6,9,0.65)",
          display: "flex", alignItems: "center", justifyContent: "center",
          zIndex: 100, padding: 20,
          backdropFilter: "blur(3px)",
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
