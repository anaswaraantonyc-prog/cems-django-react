import { useState, useEffect } from "react";
import MedicalModule from "../modules/MedicalModule";
import EmergencySirenModal, { SirenBeaconIcon } from "./EmergencySirenModal";
import PublicEmergencySOSModal from "./PublicEmergencySOSModal";

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

const UserIcon = () => (
  <svg width="17" height="17" viewBox="0 0 24 24" fill="none"
    stroke="#059669" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/>
  </svg>
);

const LockIcon = () => (
  <svg width="17" height="17" viewBox="0 0 24 24" fill="none"
    stroke="#059669" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/>
  </svg>
);

export function SosHandsetIcon({ size = 44, color = "#FFFFFF" }) {
  return (
    <svg width={size} height={size * 1.25} viewBox="0 -2 24 32" fill="none">
      <path className="sos-waves" d="M15 8a4 4 0 0 1 2 2" stroke={color} strokeWidth="2.5" strokeLinecap="round" />
      <path className="sos-waves delay-1" d="M15 4a8 8 0 0 1 5 5" stroke={color} strokeWidth="2.5" strokeLinecap="round" />
      <path className="sos-waves delay-2" d="M15 0a12 12 0 0 1 8 8" stroke={color} strokeWidth="2.5" strokeLinecap="round" />
      <path d="M21.5 16.5v2.8c0 1.2-1 2.2-2.3 2.1a19.8 19.8 0 0 1-8.6-3.1 19.5 19.5 0 0 1-6-6 19.8 19.8 0 0 1-3.1-8.6C1.4 2.5 2.4 1.5 3.6 1.5h2.8c1 0 1.9.8 2.1 1.8.2.9.4 1.8.7 2.6.2.7 0 1.5-.6 2l-1.3 1.3a16 16 0 0 0 6 6l1.3-1.3c.5-.6 1.3-.8 2-.6.8.3 1.7.5 2.6.7 1 .2 1.8 1 1.8 2.1z" fill={color} />
    </svg>
  );
}

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
  error, touched, autoComplete, placeholder, rightSlot, leftIcon }) {
  const ok  = touched && !error && value.length > 0;
  const bad = touched && !!error;
  return (
    <div style={{ marginBottom: 18 }}>
      <label htmlFor={id} style={{
        display: "block", fontSize: 12, fontWeight: 700,
        letterSpacing: "0.05em", color: "#064E3B", marginBottom: 6, textTransform: "uppercase"
      }}>
        {label}
      </label>
      <div style={{ position: "relative" }}>
        {leftIcon && (
          <span style={{
            position: "absolute", left: 13, top: "50%",
            transform: "translateY(-50%)", display: "flex", alignItems: "center",
            pointerEvents: "none", zIndex: 1
          }}>
            {leftIcon}
          </span>
        )}
        <input id={id} type={type} value={value} onChange={onChange} onBlur={onBlur}
          autoComplete={autoComplete} placeholder={placeholder}
          style={{
            width: "100%", boxSizing: "border-box",
            padding: leftIcon
              ? (rightSlot ? "12px 42px 12px 38px" : "12px 38px 12px 38px")
              : (rightSlot ? "12px 42px 12px 14px" : "12px 38px 12px 14px"),
            border: `1.5px solid ${bad ? "#ef4444" : ok ? "#10b981" : "#A7F3D0"}`,
            borderRadius: 10, fontSize: 14,
            fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
            background: bad ? "#fef2f2" : ok ? "#F0FDF4" : "#FFFFFF",
            color: "#064E3B", outline: "none",
            boxShadow: bad ? "0 0 0 3px rgba(239, 68, 68, 0.12)"
              : ok ? "0 0 0 3px rgba(16, 185, 129, 0.15)" : "none",
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
function validateField(key, value) {
  if (key === "username") {
    const val = (value || "").trim();
    if (!val) return "Username or email is required.";
  }
  if (key === "password") {
    if (!value) return "Password is required.";
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
        title="Emergency Panic Siren: Trigger immediate alarm sound, geolocation, and campus alert"
        style={{
          width: 80, height: 80,
          background: "linear-gradient(135deg, #DC2626 0%, #991B1B 100%)",
          border: "4px solid #ffffff",
          borderRadius: "50%",
          cursor: "pointer",
          position: "relative",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          padding: "0",
          boxShadow: "0 6px 24px rgba(220, 38, 38, 0.45)",
          animation: "emergencyPulse 1.5s infinite",
        }}>

        <div style={{ animation: "sirenSpin 1.8s infinite" }}>
          <SirenBeaconIcon size={34} color="#FFFFFF" />
        </div>
      </button>

      {/* Caption under icon */}
      <span style={{
        fontSize: 11,
        fontWeight: 800,
        color: "#DC2626",
        letterSpacing: "0.04em",
      }}>
        Emergency Siren
      </span>
    </div>
  );
}

/* ════════════════════════════════════════════════════════════
   MAIN LOGIN PAGE
════════════════════════════════════════════════════════════ */
export default function LoginPage({ onGoRegister, onLoggedIn, initialEmergency = false }) {
  const [form, setForm]       = useState({ username: "", password: "" });
  const [touched, setTouched] = useState({});
  const [errors, setErrors]   = useState({});
  const [showPwd, setShowPwd] = useState(false);
  const [apiError, setApiError]   = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [showEmergency, setShowEmergency] = useState(initialEmergency);
  const [showSirenModal, setShowSirenModal] = useState(false);
  const [showPublicSosModal, setShowPublicSosModal] = useState(false);

  useEffect(() => {
    if (initialEmergency) {
      setShowEmergency(true);
    }
  }, [initialEmergency]);

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
    if (!data || (!data.authenticated && !data.verified) || !data.user) {
      return;
    }
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
        background: "radial-gradient(ellipse at top left, #FFFFFF 0%, #F0FDF4 60%, #D1FAE5 100%)",
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
            background: "#FFFFFF",
            border: "1.5px solid #A7F3D0",
            borderRadius: 20,
            padding: "42px 38px",
            width: 370,
            boxShadow: "0 20px 50px rgba(5, 150, 105, 0.1), 0 2px 8px rgba(16, 185, 129, 0.06)",
            zIndex: 2,
          }}>
            {/* Header */}
            <div style={{ textAlign: "center", marginBottom: 24 }}>
              <div style={{
                fontSize: 24, fontWeight: 800, color: "#064E3B", letterSpacing: "-0.02em"
              }}>
                Welcome back
              </div>
              <div style={{ fontSize: 13, color: "#059669", marginTop: 4, fontWeight: 600 }}>
                Sign in to your CEMS account
              </div>
            </div>

            <form onSubmit={submit} noValidate>
              <Input label="Username or Email" id="login-username"
                value={form.username} onChange={change("username")} onBlur={blur("username")}
                error={errors.username} touched={touched.username}
                autoComplete="username" placeholder="e.g. anaswara or anaswara@gmail.com"
                leftIcon={<UserIcon />} />

              <Input label="Password" id="login-password"
                type={showPwd ? "text" : "password"}
                value={form.password} onChange={change("password")} onBlur={blur("password")}
                error={errors.password} touched={touched.password}
                autoComplete="current-password" placeholder="Your password"
                leftIcon={<LockIcon />}
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
                    : "linear-gradient(135deg, #10B981, #059669)",
                  color: "#ffffff", fontSize: 15, fontWeight: 700,
                  cursor: submitting ? "not-allowed" : "pointer",
                  letterSpacing: "0.01em",
                  boxShadow: submitting ? "none" : "0 4px 16px rgba(5, 150, 105, 0.35)",
                  transition: "all 0.2s ease",
                  display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
                }}>
                <span>{submitting ? "Signing in…" : "Sign In"}</span>
                {!submitting && <span style={{ fontSize: 16 }}>➔</span>}
              </button>

              <div style={{ display: "flex", alignItems: "center", margin: "16px 0 12px", gap: 10 }}>
                <div style={{ flex: 1, height: 1, background: "#E2E8F0" }} />
                <span style={{ fontSize: 11, color: "#64748B", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.05em" }}>OR</span>
                <div style={{ flex: 1, height: 1, background: "#E2E8F0" }} />
              </div>

              <button
                type="button"
                onClick={() => setShowEmergency(true)}
                style={{
                  width: "100%", padding: "11px", borderRadius: 10,
                  border: "1.5px solid #A7F3D0",
                  background: "#F0FDF4",
                  color: "#065F46", fontSize: 13, fontWeight: 700,
                  cursor: "pointer",
                  display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
                  transition: "all 0.2s ease",
                }}>
                <span style={{ fontSize: 16 }}>📷</span>
                <span>Scan to Sign In (Face / ID Card)</span>
              </button>
            </form>

            <div style={{ textAlign: "center", marginTop: 18, fontSize: 13, color: "#065F46" }}>
              New here?{" "}
              <button onClick={onGoRegister}
                style={{ background: "none", border: "none", color: "#059669",
                  fontWeight: 700, cursor: "pointer", padding: 0, fontSize: 13 }}>
                Create an account
              </button>
            </div>
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

      {/* ── Emergency Siren / Panic Alarm Modal ── */}
      {showSirenModal && (
        <EmergencySirenModal
          onClose={() => setShowSirenModal(false)}
          callerDefaultName="Campus Visitor / Student"
        />
      )}

      {/* ── Public Emergency SOS Modal ── */}
      {showPublicSosModal && (
        <PublicEmergencySOSModal
          onClose={() => setShowPublicSosModal(false)}
        />
      )}
    </>
  );
}
