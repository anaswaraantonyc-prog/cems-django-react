import { useState, useCallback } from "react";

/* ═══════════════════════════════════════════════════════════
   ICONS
═══════════════════════════════════════════════════════════ */
const EyeIcon = ({ open }) => (
  <svg width="17" height="17" viewBox="0 0 24 24" fill="none"
    stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    {open
      ? <><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></>
      : <><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94"/><path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19"/><line x1="1" y1="1" x2="23" y2="23"/></>
    }
  </svg>
);
const Check = () => (
  <svg width="13" height="13" viewBox="0 0 24 24" fill="none"
    stroke="#16A34A" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="20 6 9 17 4 12"/>
  </svg>
);
const Cross = () => (
  <svg width="13" height="13" viewBox="0 0 24 24" fill="none"
    stroke="#DC2626" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
    <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
  </svg>
);
const UploadIcon = () => (
  <svg width="28" height="28" viewBox="0 0 24 24" fill="none"
    stroke="#64748B" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="16 16 12 12 8 16"/><line x1="12" y1="12" x2="12" y2="21"/>
    <path d="M20.39 18.39A5 5 0 0 0 18 9h-1.26A8 8 0 1 0 3 16.3"/>
  </svg>
);

/* ═══════════════════════════════════════════════════════════
   VALIDATION RULES
═══════════════════════════════════════════════════════════ */
const RULES = {
  first_name:  v => !v.trim() ? "First name is required."
    : !/^[A-Za-z][A-Za-z \-]{1,149}$/.test(v.trim()) ? "Letters, spaces or hyphens only." : null,
  last_name:   v => !v.trim() ? "Last name is required."
    : !/^[A-Za-z][A-Za-z \-]{1,149}$/.test(v.trim()) ? "Letters, spaces or hyphens only." : null,
  username:    v => !v.trim() ? "Username is required."
    : !/^[A-Za-z0-9._]{4,150}$/.test(v.trim()) ? "4-150 chars — letters, numbers, . or _ only." : null,
  email:       v => !v.trim() ? "Email is required."
    : !/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v.trim()) ? "Enter a valid email address." : null,
  phone_number:v => !v.trim() ? "Phone number is required."
    : !/^\d{10}$/.test(v.trim()) ? "Enter exactly 10 digits (e.g. 9876543210)." : null,
  id_number:   v => !v.trim() ? "ID card number is required."
    : !/^[A-Za-z0-9\-]{4,50}$/.test(v.trim()) ? "4-50 letters, numbers or hyphens." : null,
  password:    v => !v ? "Password is required."
    : v.length < 8 ? "At least 8 characters required."
    : !/[A-Za-z]/.test(v) ? "Must include at least one letter."
    : !/\d/.test(v) ? "Must include at least one number."
    : !/[^A-Za-z0-9]/.test(v) ? "Add a special character (e.g. @, #, !)." : null,
  password_confirm: (v, form) => !v ? "Please confirm your password."
    : v !== form.password ? "Passwords do not match." : null,
  designation: (v, form) => (form.role === "MEDICAL_STAFF" && !v.trim()) ? "Designation is required for Medical Staff." : null,
  education: (v, form) => (form.role === "MEDICAL_STAFF" && !v.trim()) ? "Education/Qualification is required." : null,
};

/* password strength */
function pwStrength(pw) {
  let score = 0;
  if (pw.length >= 8) score++;
  if (pw.length >= 12) score++;
  if (/[A-Z]/.test(pw)) score++;
  if (/[a-z]/.test(pw)) score++;
  if (/\d/.test(pw)) score++;
  if (/[^A-Za-z0-9]/.test(pw)) score++;
  if (score <= 2) return { label: "Weak", color: "#EF4444", pct: 25 };
  if (score <= 3) return { label: "Fair", color: "#F59E0B", pct: 50 };
  if (score <= 4) return { label: "Good", color: "#22C55E", pct: 75 };
  return { label: "Strong", color: "#15803D", pct: 100 };
}

/* ═══════════════════════════════════════════════════════════
   STYLED INPUT COMPONENT
═══════════════════════════════════════════════════════════ */
function Input({ label, id, type = "text", value, onChange, onBlur,
  error, touched, placeholder, autoComplete, required = true, rightSlot, hint, maxLength, inputMode }) {
  const ok  = touched && !error && value.length > 0;
  const bad = touched && !!error;
  return (
    <div style={{ marginBottom: 16 }}>
      <label htmlFor={id} style={{ display: "flex", alignItems: "center", gap: 4,
        fontSize: 12, fontWeight: 700, letterSpacing: "0.05em", color: "#334155",
        textTransform: "uppercase", marginBottom: 6 }}>
        {label}
        {required && <span style={{ color: "#DC2626", fontSize: 13 }}>*</span>}
      </label>
      <div style={{ position: "relative" }}>
        <input id={id} type={type} value={value} onChange={onChange} onBlur={onBlur}
          autoComplete={autoComplete} placeholder={placeholder}
          maxLength={maxLength} inputMode={inputMode}
          style={{
            width: "100%", boxSizing: "border-box",
            padding: `12px ${rightSlot ? "42px" : "38px"} 12px 14px`,
            border: `1.5px solid ${bad ? "#EF4444" : ok ? "#22C55E" : "#CBD5E1"}`,
            borderRadius: 10, fontSize: 14, fontFamily: "inherit",
            background: bad ? "#FEF2F2" : ok ? "#F0FDF4" : "#F8FAFC",
            color: "#0F172A", outline: "none",
            boxShadow: bad ? "0 0 0 3px rgba(239, 68, 68, 0.12)"
              : ok ? "0 0 0 3px rgba(34, 197, 94, 0.12)" : "none",
            transition: "all 0.2s ease",
          }}
        />
        {!rightSlot && touched && value.length > 0 && (
          <span style={{ position: "absolute", right: 14, top: "50%", transform: "translateY(-50%)", display:"flex" }}>
            {ok ? <Check /> : <Cross />}
          </span>
        )}
        {rightSlot && (
          <span style={{ position: "absolute", right: 12, top: "50%", transform: "translateY(-50%)" }}>
            {rightSlot}
          </span>
        )}
      </div>
      {bad  && <p style={{ margin: "5px 0 0", fontSize: 12, color: "#DC2626", display:"flex", alignItems:"center", gap:4, fontWeight: 500 }}><Cross />{error}</p>}
      {!bad && hint && <p style={{ margin: "5px 0 0", fontSize: 12, color: "#64748B" }}>{hint}</p>}
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════
   IMAGE UPLOAD COMPONENT
═══════════════════════════════════════════════════════════ */
function ImageUpload({ label, id, hint, file, onChange, error, touched }) {
  const [preview, setPreview] = useState("");
  const bad = touched && !!error;
  const ok  = touched && !error && !!file;

  const pick = (e) => {
    const f = e.target.files?.[0] || null;
    onChange(f);
    setPreview(f ? URL.createObjectURL(f) : "");
  };
  const drag = useCallback((e) => {
    e.preventDefault();
    const f = e.dataTransfer.files?.[0] || null;
    if (f) { onChange(f); setPreview(URL.createObjectURL(f)); }
  }, [onChange]);

  return (
    <div style={{ marginBottom: 16 }}>
      <label style={{ display: "block", fontSize: 12, fontWeight: 700,
        letterSpacing: "0.05em", color: "#334155", textTransform: "uppercase", marginBottom: 6 }}>
        {label} <span style={{ color: "#DC2626" }}>*</span>
      </label>
      <label htmlFor={id} onDragOver={e => e.preventDefault()} onDrop={drag}
        style={{ display: "flex", gap: 14, alignItems: "center", cursor: "pointer",
          border: `2px dashed ${bad ? "#EF4444" : ok ? "#22C55E" : "#CBD5E1"}`,
          borderRadius: 12, padding: 14,
          background: bad ? "#FEF2F2" : ok ? "#F0FDF4" : "#F8FAFC",
          transition: "all 0.2s ease" }}>
        {preview
          ? <img src={preview} alt="preview" style={{ width: 70, height: 70,
              objectFit: "cover", borderRadius: 8, border: `2px solid ${ok ? "#22C55E" : "#CBD5E1"}` }} />
          : <div style={{ width: 70, height: 70, display: "flex", flexDirection: "column",
              alignItems: "center", justifyContent: "center", gap: 4,
              border: `1px solid #CBD5E1`, borderRadius: 8, color: "#64748B", background: "#FFFFFF" }}>
              <UploadIcon />
              <span style={{ fontSize: 10, textAlign:"center", fontWeight: 500 }}>Drag/Click</span>
            </div>
        }
        <div>
          <div style={{ fontSize: 14, fontWeight: 600, color: "#0A192F" }}>
            {file ? file.name : "Choose a file"}
          </div>
          <div style={{ fontSize: 12, color: "#64748B", marginTop: 3 }}>{hint}</div>
          {file && <div style={{ fontSize: 12, color: "#64748B", marginTop: 2 }}>
            {(file.size / 1024).toFixed(0)} KB
          </div>}
        </div>
      </label>
      <input id={id} type="file" accept="image/jpeg,image/png,image/webp"
        onChange={pick} style={{ display: "none" }} />
      {bad && <p style={{ margin: "5px 0 0", fontSize: 12, color: "#DC2626", display:"flex", alignItems:"center", gap:4, fontWeight: 500 }}><Cross />{error}</p>}
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════
   SECTION CARD
═══════════════════════════════════════════════════════════ */
function Section({ title, subtitle, children }) {
  return (
    <div className="animate-slide-up" style={{ marginBottom: 24, background: "#FFFFFF",
      border: `1px solid #E2E8F0`,
      borderRadius: 16, padding: "24px 28px",
      boxShadow: "0 4px 16px rgba(10, 25, 47, 0.04)" }}>
      <div style={{ marginBottom: 20, paddingBottom: 12, borderBottom: "1.5px solid #E2E8F0" }}>
        <div style={{ fontSize: 18, fontWeight: 800, color: "#0A192F", letterSpacing: "-0.01em" }}>{title}</div>
        {subtitle && <div style={{ fontSize: 13, color: "#64748B", marginTop: 2 }}>{subtitle}</div>}
      </div>
      {children}
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════
   ROLE OPTIONS
═══════════════════════════════════════════════════════════ */
const ROLES = [
  { value: "STUDENT", label: "Student", icon: "svg-student" },
  { value: "CLASS_REP", label: "Class Representative", icon: "svg-star" },
  { value: "FACULTY", label: "Faculty", icon: "svg-faculty" },
  { value: "PRINCIPAL", label: "Principal", icon: "svg-building" },
  { value: "EXTERNAL_PARTICIPANT", label: "External Participant", icon: "svg-globe" },
  { value: "MEDICAL_STAFF", label: "Medical Staff", icon: "svg-medical" },
  { value: "CANTEEN_STAFF", label: "Canteen Staff", icon: "svg-food" },
  { value: "WARDEN", label: "Warden", icon: "svg-home" },
];

const renderRoleIcon = (iconName, active) => {
  const color = active ? "#1D4ED8" : "#64748B";
  const props = { width: 22, height: 22, viewBox: "0 0 24 24", fill: "none", stroke: color, strokeWidth: 2, strokeLinecap: "round", strokeLinejoin: "round" };
  
  if (iconName === "svg-student") return <svg {...props}><path d="M22 10v6M2 10l10-5 10 5-10 5z"/><path d="M6 12v5c3 3 9 3 12 0v-5"/></svg>;
  if (iconName === "svg-star") return <svg {...props}><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>;
  if (iconName === "svg-faculty") return <svg {...props}><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>;
  if (iconName === "svg-building") return <svg {...props}><rect x="4" y="2" width="16" height="20" rx="2" ry="2"/><path d="M9 22v-4h6v4"/><path d="M8 6h.01"/><path d="M16 6h.01"/><path d="M12 6h.01"/><path d="M12 10h.01"/><path d="M12 14h.01"/><path d="M16 10h.01"/><path d="M16 14h.01"/><path d="M8 10h.01"/><path d="M8 14h.01"/></svg>;
  if (iconName === "svg-globe") return <svg {...props}><circle cx="12" cy="12" r="10"/><path d="M2 12h20"/><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/></svg>;
  if (iconName === "svg-medical") return <svg {...props}><path d="M22 12h-4l-3 9L9 3l-3 9H2"/></svg>;
  if (iconName === "svg-food") return <svg {...props}><path d="M18 8h1a4 4 0 0 1 0 8h-1"/><path d="M2 8h16v9a4 4 0 0 1-4 4H6a4 4 0 0 1-4-4V8z"/><line x1="6" y1="1" x2="6" y2="4"/><line x1="10" y1="1" x2="10" y2="4"/><line x1="14" y1="1" x2="14" y2="4"/></svg>;
  if (iconName === "svg-home") return <svg {...props}><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>;
  return null;
};

/* ═══════════════════════════════════════════════════════════
   MAIN REGISTER COMPONENT
═══════════════════════════════════════════════════════════ */
const EMPTY = {
  username: "", email: "", first_name: "", last_name: "",
  password: "", password_confirm: "", role: "STUDENT",
  phone_number: "", department: "", id_number: "",
  designation: "", education: "",
};

export default function RegisterPage({ onGoLogin }) {
  const [form, setForm] = useState(EMPTY);
  const [touched, setTouched] = useState({});
  const [errors, setErrors] = useState({});
  const [profileImage, setProfileImage] = useState(null);
  const [idCardImage, setIdCardImage] = useState(null);
  const [imgTouched, setImgTouched] = useState({});
  const [imgErrors, setImgErrors] = useState({});
  const [showPwd, setShowPwd] = useState(false);
  const [showPwd2, setShowPwd2] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState(null);

  const strength = form.password ? pwStrength(form.password) : null;

  /* ── field change ── */
  const change = (key) => (e) => {
    let val = e.target.value;
    if (key === "phone_number") val = val.replace(/\D/g, "").slice(0, 10);
    setForm(f => ({ ...f, [key]: val }));
    setTouched(t => ({ ...t, [key]: true }));
    const err = (key === "password_confirm" || key === "designation" || key === "education")
      ? RULES[key](val, { ...form, [key]: val })
      : RULES[key]?.(val);
    setErrors(er => ({ ...er, [key]: err }));

    if (key === "password" && touched.password_confirm) {
      setErrors(er => ({ ...er, password_confirm: RULES.password_confirm(form.password_confirm, { ...form, password: val }) }));
    }
  };

  const blur = (key) => () => {
    setTouched(t => ({ ...t, [key]: true }));
    const err = (key === "password_confirm" || key === "designation" || key === "education")
      ? RULES[key](form[key], form)
      : RULES[key]?.(form[key]);
    setErrors(er => ({ ...er, [key]: err }));
  };

  /* ── image change ── */
  const changeImg = (key, maxMB = 5) => (file) => {
    if (key === "profileImage") setProfileImage(file);
    else setIdCardImage(file);
    setImgTouched(t => ({ ...t, [key]: true }));
    if (!file) { setImgErrors(e => ({ ...e, [key]: "This image is required." })); return; }
    if (file.size > maxMB * 1024 * 1024) { setImgErrors(e => ({ ...e, [key]: `Max size is ${maxMB} MB.` })); return; }
    setImgErrors(e => ({ ...e, [key]: null }));
  };

  /* ── submit ── */
  const submit = async (e) => {
    e.preventDefault();
    setResult(null);

    // validate all text fields
    const allTouched = {};
    const allErrors = {};
    Object.keys(RULES).forEach(k => {
      allTouched[k] = true;
      allErrors[k] = (k === "password_confirm" || k === "designation" || k === "education")
        ? RULES[k](form[k], form) : RULES[k]?.(form[k]);
    });
    setTouched(allTouched);
    setErrors(allErrors);

    // validate images
    const iErr = {};
    const iTouched = { profileImage: true, idCardImage: true };
    if (!profileImage) iErr.profileImage = "Your profile photo is required.";
    else if (profileImage.size > 5 * 1024 * 1024) iErr.profileImage = "Max 5 MB.";
    if (!idCardImage) iErr.idCardImage = "College ID card photo is required.";
    else if (idCardImage.size > 5 * 1024 * 1024) iErr.idCardImage = "Max 5 MB.";
    setImgTouched(iTouched);
    setImgErrors(iErr);

    const hasFieldErrors = Object.values(allErrors).some(Boolean);
    const hasImgErrors   = Object.values(iErr).some(Boolean);
    if (hasFieldErrors || hasImgErrors) {
      setResult({ ok: false, message: "Please fix the highlighted fields before submitting." });
      // scroll to top of form
      document.getElementById("reg-form-top")?.scrollIntoView({ behavior: "smooth" });
      return;
    }

    // build FormData
    const body = new FormData();
    Object.entries(form).forEach(([k, v]) => body.append(k, typeof v === "string" ? v.trim() : v));
    body.append("profile_image", profileImage);
    body.append("id_card_image", idCardImage);

    setSubmitting(true);
    try {
      const res = await fetch("/api/auth/register/", { method: "POST", body });
      const data = await res.json();
      if (!res.ok) {
        const mapped = {};
        const summary = [];
        Object.entries(data).forEach(([key, value]) => {
          const text = Array.isArray(value) ? value.join(" ") : String(value);
          if (key in EMPTY || key === "profile_image" || key === "id_card_image") mapped[key] = text;
          else summary.push(text);
        });
        setErrors(er => ({ ...er, ...mapped }));
        setTouched(t => { const n = { ...t }; Object.keys(mapped).forEach(k => n[k] = true); return n; });
        setResult({ ok: false, message: summary.join(" ") || "Registration failed. Please check the highlighted fields." });
        return;
      }
      setResult({ ok: true, message: "Registration submitted! Your account is pending Admin approval. You will receive access once the Admin approves your registration." });
      setForm(EMPTY);
      setProfileImage(null);
      setIdCardImage(null);
      setTouched({});
      setErrors({});
      setImgTouched({});
      setImgErrors({});
    } catch {
      setResult({ ok: false, message: "Could not reach the Django server. Please check your connection." });
    } finally {
      setSubmitting(false);
    }
  };

  /* ── how many fields are filled & valid ── */
  const totalFields = Object.keys(RULES).length + 2; // +2 images
  const validFields = Object.keys(RULES).filter(k => touched[k] && !errors[k] && form[k]).length
    + (profileImage && !imgErrors.profileImage ? 1 : 0)
    + (idCardImage && !imgErrors.idCardImage ? 1 : 0);
  const progress = Math.round((validFields / totalFields) * 100);

  return (
    <div style={{
      minHeight: "calc(100vh - 60px)",
      background: "var(--slate-50)",
      padding: "40px 20px",
      fontFamily: "var(--font-sans)",
      backgroundImage: "radial-gradient(ellipse at top left, #FFFFFF 0%, #F8FAFC 60%, #E2E8F0 100%)",
    }}>
      <div style={{ maxWidth: 660, margin: "0 auto", animation: "fadeIn 0.3s ease" }}>

        {/* ── header ── */}
        <div style={{ textAlign: "center", marginBottom: 32 }}>
          <div style={{ width: 56, height: 56, borderRadius: 16,
            background: "linear-gradient(135deg, #0A192F, #1E3A8A)",
            margin: "0 auto 16px", display: "flex", alignItems: "center", justifyContent: "center",
            boxShadow: "0 6px 20px rgba(10, 25, 47, 0.3)" }}>
            <span style={{ color: "#FFFFFF", fontWeight: 800, fontSize: 24, letterSpacing: "-0.03em" }}>C</span>
          </div>
          <h1 style={{ margin: 0, fontSize: 28,
            fontWeight: 800, color: "#0A192F", letterSpacing: "-0.02em" }}>Create your account</h1>
          <p style={{ margin: "8px 0 0", fontSize: 14, color: "#64748B" }}>
            Fill in all fields carefully. Your account will be reviewed by an Admin before activation.
          </p>
        </div>

        {/* ── progress bar ── */}
        <div style={{ marginBottom: 28, padding: "0 8px" }}>
          <div style={{ display: "flex", justifyContent: "space-between",
            fontSize: 12, color: "#64748B", marginBottom: 8, fontWeight: 600 }}>
            <span>Form completion</span>
            <span style={{ fontWeight: 800, color: progress === 100 ? "#16A34A" : "#1D4ED8" }}>{progress}%</span>
          </div>
          <div style={{ height: 6, background: "#E2E8F0", borderRadius: 99, overflow: "hidden" }}>
            <div style={{ height: "100%", borderRadius: 99, width: `${progress}%`,
              background: progress === 100
                ? "linear-gradient(90deg, #16A34A, #22C55E)"
                : "linear-gradient(90deg, #1D4ED8, #3B82F6)",
              transition: "width 0.4s cubic-bezier(0.4, 0, 0.2, 1)" }} />
          </div>
        </div>

        {/* ── success banner ── */}
        {result?.ok && (
          <div className="animate-slide-up" style={{ background: "#F0FDF4", border: "1px solid #BBF7D0",
            borderRadius: 12, padding: "20px 24px", marginBottom: 28,
            display: "flex", gap: 16, alignItems: "flex-start",
            boxShadow: "0 4px 12px rgba(22, 163, 74, 0.05)" }}>
            <div style={{ background: "#DCFCE7", padding: 8, borderRadius: "50%", color: "#16A34A" }}>
              <Check />
            </div>
            <div>
              <div style={{ fontWeight: 700, color: "#15803D", marginBottom: 6, fontSize: 15 }}>Registration Submitted!</div>
              <div style={{ fontSize: 14, color: "#16A34A", lineHeight: 1.5 }}>{result.message}</div>
            </div>
          </div>
        )}

        {/* ── error banner ── */}
        {result && !result.ok && (
          <div className="animate-slide-up" style={{ background: "#FEF2F2", border: "1px solid #FECACA",
            borderRadius: 12, padding: "16px 20px", marginBottom: 24,
            display: "flex", gap: 12, alignItems: "flex-start",
            boxShadow: "0 4px 12px rgba(220, 38, 38, 0.05)" }}>
            <div style={{ color: "#DC2626", marginTop: 2 }}><Cross /></div>
            <div style={{ fontSize: 14, color: "#B91C1C", fontWeight: 500, lineHeight: 1.4 }}>{result.message}</div>
          </div>
        )}

        <form onSubmit={submit} noValidate id="reg-form-top">

          {/* ── SECTION 1: Personal Info ── */}
          <Section title="Personal Information" subtitle="Your full name exactly as it appears on your ID card.">
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0 20px" }}>
              <Input label="First Name" id="reg-first" value={form.first_name}
                onChange={change("first_name")} onBlur={blur("first_name")}
                error={errors.first_name} touched={touched.first_name}
                placeholder="e.g. Rahul" maxLength={150}
                hint="Letters, spaces or hyphens only" />
              <Input label="Last Name" id="reg-last" value={form.last_name}
                onChange={change("last_name")} onBlur={blur("last_name")}
                error={errors.last_name} touched={touched.last_name}
                placeholder="e.g. Sharma" maxLength={150}
                hint="Letters, spaces or hyphens only" />
            </div>
            <Input label="Department" id="reg-dept" value={form.department}
              onChange={change("department")} onBlur={() => {}}
              error={null} touched={false} required={false}
              placeholder="e.g. Computer Science" />
              
            {/* Role selector */}
            <div style={{ marginBottom: 16 }}>
              <label style={{ display: "block", fontSize: 12, fontWeight: 700,
                letterSpacing: "0.05em", color: "#334155", textTransform: "uppercase", marginBottom: 10 }}>
                Role <span style={{ color: "#DC2626" }}>*</span>
              </label>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                {ROLES.map(r => {
                  const active = form.role === r.value;
                  return (
                    <button key={r.value} type="button" onClick={() => setForm(f => ({ ...f, role: r.value }))}
                      style={{ padding: "14px 10px", borderRadius: 12, cursor: "pointer",
                        border: `1.5px solid ${active ? "#1D4ED8" : "#E2E8F0"}`,
                        background: active ? "#EFF6FF" : "#F8FAFC",
                        color: active ? "#1E40AF" : "#475569",
                        fontWeight: active ? 700 : 500,
                        fontSize: 13, transition: "all 0.2s ease", textAlign: "center",
                        display: "flex", flexDirection: "column", alignItems: "center", gap: 8,
                        boxShadow: active ? "0 0 0 3px rgba(29, 78, 216, 0.1)" : "none" }}>
                      <div style={{ display: "flex", alignItems: "center", justifyContent: "center", 
                        background: active ? "#FFFFFF" : "transparent", padding: 8, borderRadius: "50%",
                        boxShadow: active ? "0 2px 8px rgba(29,78,216,0.15)" : "none" }}>
                        {renderRoleIcon(r.icon, active)}
                      </div>
                      {r.label}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Dynamic designation & education fields for MEDICAL_STAFF */}
            {form.role === "MEDICAL_STAFF" && (
              <div className="animate-slide-up" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0 20px", marginTop: 20 }}>
                <Input label="Designation" id="reg-designation" value={form.designation}
                  onChange={change("designation")} onBlur={blur("designation")}
                  error={errors.designation} touched={touched.designation}
                  placeholder="e.g. Doctor / Nurse" hint="Your official title" />
                <Input label="Education / Qualification" id="reg-education" value={form.education}
                  onChange={change("education")} onBlur={blur("education")}
                  error={errors.education} touched={touched.education}
                  placeholder="e.g. MBBS, MD / B.Sc Nursing" hint="Degrees or credentials" />
              </div>
            )}
          </Section>

          {/* ── SECTION 2: Account Details ── */}
          <Section title="Account Credentials" subtitle="These will be used to log in securely.">
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0 20px" }}>
              <Input label="Username" id="reg-username" value={form.username}
                onChange={change("username")} onBlur={blur("username")}
                error={errors.username} touched={touched.username}
                autoComplete="username" placeholder="e.g. rahul.sharma"
                maxLength={150} hint="4–150 chars · letters, numbers, . or _" />
              <Input label="Email Address" id="reg-email" type="email" value={form.email}
                onChange={change("email")} onBlur={blur("email")}
                error={errors.email} touched={touched.email}
                autoComplete="email" placeholder="e.g. rahul@college.edu"
                hint="Must be a valid email" />
              <Input label="Phone Number" id="reg-phone" type="tel" value={form.phone_number}
                onChange={change("phone_number")} onBlur={blur("phone_number")}
                error={errors.phone_number} touched={touched.phone_number}
                placeholder="e.g. 9876543210" inputMode="numeric" maxLength={10}
                hint="Exactly 10 digits · numbers only" />
            </div>

            {/* Password */}
            <Input label="Password" id="reg-password" type={showPwd ? "text" : "password"}
              value={form.password}
              onChange={change("password")} onBlur={blur("password")}
              error={errors.password} touched={touched.password}
              autoComplete="new-password" placeholder="Min. 8 chars"
              hint="Min. 8 chars · include letter, number & special char"
              rightSlot={
                <button type="button" onClick={() => setShowPwd(s => !s)}
                  style={{ background: "none", border: "none", cursor: "pointer",
                    color: "#64748B", padding: 4, display: "flex", borderRadius: 6 }}>
                  <EyeIcon open={showPwd} />
                </button>
              }
            />

            {/* Strength meter */}
            {form.password && (
              <div className="animate-fade-in" style={{ marginTop: -10, marginBottom: 20, padding: "12px", background: "#F8FAFC", borderRadius: 10, border: "1px solid #E2E8F0" }}>
                <div style={{ height: 6, background: "#E2E8F0", borderRadius: 99, marginBottom: 8, overflow: "hidden" }}>
                  <div style={{ height: "100%", borderRadius: 99, width: `${strength.pct}%`,
                    background: strength.color, transition: "width 0.3s cubic-bezier(0.4, 0, 0.2, 1), background 0.3s" }} />
                </div>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                  <div style={{ fontSize: 13, color: strength.color, fontWeight: 700 }}>
                    {strength.label} password
                  </div>
                  <div style={{ fontSize: 11, color: "#64748B", display: "grid", gridTemplateColumns: "1fr 1fr", gap: "4px 12px", textAlign: "left" }}>
                    {["8+ chars", "uppercase", "lowercase", "number", "symbol"].map(req => {
                      const checks = {
                        "8+ chars": form.password.length >= 8,
                        "uppercase": /[A-Z]/.test(form.password),
                        "lowercase": /[a-z]/.test(form.password),
                        "number": /\d/.test(form.password),
                        "symbol": /[^A-Za-z0-9]/.test(form.password),
                      };
                      return (
                        <span key={req} style={{ 
                          color: checks[req] ? "#16A34A" : "#94A3B8", display: "flex", alignItems: "center", gap: 4, fontWeight: checks[req] ? 600 : 400 }}>
                          {checks[req] ? <Check /> : <span style={{display:"inline-block", width:13, height:13, border:"1.5px solid #CBD5E1", borderRadius:"50%"}}></span>} {req}
                        </span>
                      );
                    })}
                  </div>
                </div>
              </div>
            )}

            <Input label="Confirm Password" id="reg-password2" type={showPwd2 ? "text" : "password"}
              value={form.password_confirm}
              onChange={change("password_confirm")} onBlur={blur("password_confirm")}
              error={errors.password_confirm} touched={touched.password_confirm}
              autoComplete="new-password" placeholder="Re-enter your password"
              rightSlot={
                <button type="button" onClick={() => setShowPwd2(s => !s)}
                  style={{ background: "none", border: "none", cursor: "pointer",
                    color: "#64748B", padding: 4, display: "flex", borderRadius: 6 }}>
                  <EyeIcon open={showPwd2} />
                </button>
              }
            />
          </Section>

          {/* ── SECTION 3: Identity ── */}
          <Section title="Identity Verification" subtitle="Required for role validation and emergency access.">
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0 20px" }}>
              <ImageUpload label="Profile Photo" id="img-profile"
                hint="Clear face photo · max 5 MB"
                file={profileImage} onChange={changeImg("profileImage")}
                error={imgErrors.profileImage} touched={imgTouched.profileImage} />
              <ImageUpload label="College ID Card" id="img-idcard"
                hint="Full front of ID · max 5 MB"
                file={idCardImage} onChange={changeImg("idCardImage")}
                error={imgErrors.idCardImage} touched={imgTouched.idCardImage} />
            </div>
            <Input label="ID Card Number" id="reg-idnumber" value={form.id_number}
              onChange={change("id_number")} onBlur={blur("id_number")}
              error={errors.id_number} touched={touched.id_number}
              placeholder="e.g. CEMS-2026-0142"
              hint="4-50 characters — letters, numbers, hyphens" />
          </Section>

          {/* ── submit ── */}
          <button type="submit" disabled={submitting}
            style={{ width: "100%", padding: "16px", borderRadius: 12, border: "none",
              background: submitting ? "#94A3B8" : "linear-gradient(135deg, #1D4ED8, #1E40AF)",
              color: "#FFFFFF", fontSize: 16, fontWeight: 700, cursor: submitting ? "not-allowed" : "pointer",
              letterSpacing: "0.01em", boxShadow: submitting ? "none" : "0 8px 24px rgba(29, 78, 216, 0.3)",
              transition: "all 0.2s ease", marginBottom: 24, marginTop: 8 }}>
            {submitting ? "Submitting Registration…" : "Create Account"}
          </button>
        </form>

        <div style={{ textAlign: "center", fontSize: 14, color: "#475569", paddingBottom: 40 }}>
          Already have an account?{" "}
          <button onClick={onGoLogin} style={{ background: "none", border: "none",
            color: "#1D4ED8", fontWeight: 700, cursor: "pointer", padding: 0, fontSize: 14, textDecoration: "underline", textUnderlineOffset: 4 }}>
            Sign in
          </button>
        </div>
      </div>
    </div>
  );
}
