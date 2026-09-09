import { useState, useCallback } from "react";
import { maroon, maroonDark, maroonSoft, offWhite, gold, floralBackground, line } from "../theme";

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
    stroke="#2e7d52" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="20 6 9 17 4 12"/>
  </svg>
);
const Cross = () => (
  <svg width="13" height="13" viewBox="0 0 24 24" fill="none"
    stroke="#b3202e" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
    <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
  </svg>
);
const UploadIcon = () => (
  <svg width="28" height="28" viewBox="0 0 24 24" fill="none"
    stroke="#8A5560" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
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
  if (score <= 2) return { label: "Weak", color: "#e53935", pct: 25 };
  if (score <= 3) return { label: "Fair", color: "#fb8c00", pct: 50 };
  if (score <= 4) return { label: "Good", color: "#43a047", pct: 75 };
  return { label: "Strong", color: "#1b5e20", pct: 100 };
}

/* ═══════════════════════════════════════════════════════════
   STYLED INPUT COMPONENT
═══════════════════════════════════════════════════════════ */
function Input({ label, id, type = "text", value, onChange, onBlur,
  error, touched, placeholder, autoComplete, required = true, rightSlot, hint, maxLength, inputMode }) {
  const ok  = touched && !error && value.length > 0;
  const bad = touched && !!error;
  return (
    <div style={{ marginBottom: 14 }}>
      <label htmlFor={id} style={{ display: "flex", alignItems: "center", gap: 4,
        fontSize: 11, fontWeight: 700, letterSpacing: "0.07em", color: "#7A3A44",
        textTransform: "uppercase", marginBottom: 5 }}>
        {label}
        {required && <span style={{ color: "#b3202e", fontSize: 13 }}>*</span>}
      </label>
      <div style={{ position: "relative" }}>
        <input id={id} type={type} value={value} onChange={onChange} onBlur={onBlur}
          autoComplete={autoComplete} placeholder={placeholder}
          maxLength={maxLength} inputMode={inputMode}
          style={{
            width: "100%", boxSizing: "border-box",
            padding: `11px ${rightSlot ? "42px" : "36px"} 11px 13px`,
            border: `1.5px solid ${bad ? "#e57373" : ok ? "#66bb6a" : "#D9C8CC"}`,
            borderRadius: 8, fontSize: 14, fontFamily: "inherit",
            background: bad ? "#fff8f8" : ok ? "#f6fff9" : "#fff",
            color: maroonDark, outline: "none",
            boxShadow: bad ? "0 0 0 3px rgba(179,32,46,0.07)"
              : ok ? "0 0 0 3px rgba(46,125,82,0.07)" : "none",
            transition: "border-color 0.2s, box-shadow 0.2s, background 0.2s",
          }}
        />
        {!rightSlot && touched && value.length > 0 && (
          <span style={{ position: "absolute", right: 12, top: "50%", transform: "translateY(-50%)", display:"flex" }}>
            {ok ? <Check /> : <Cross />}
          </span>
        )}
        {rightSlot && (
          <span style={{ position: "absolute", right: 10, top: "50%", transform: "translateY(-50%)" }}>
            {rightSlot}
          </span>
        )}
      </div>
      {bad  && <p style={{ margin: "4px 0 0", fontSize: 11, color: "#b3202e", display:"flex", alignItems:"center", gap:3 }}><Cross />{error}</p>}
      {!bad && hint && <p style={{ margin: "4px 0 0", fontSize: 11, color: "#9A8088" }}>{hint}</p>}
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
    <div style={{ marginBottom: 14 }}>
      <label style={{ display: "block", fontSize: 11, fontWeight: 700,
        letterSpacing: "0.07em", color: "#7A3A44", textTransform: "uppercase", marginBottom: 5 }}>
        {label} <span style={{ color: "#b3202e" }}>*</span>
      </label>
      <label htmlFor={id} onDragOver={e => e.preventDefault()} onDrop={drag}
        style={{ display: "flex", gap: 14, alignItems: "center", cursor: "pointer",
          border: `2px dashed ${bad ? "#e57373" : ok ? "#66bb6a" : "#D9C8CC"}`,
          borderRadius: 10, padding: 14,
          background: bad ? "#fff8f8" : ok ? "#f6fff9" : "#fdfbf8",
          transition: "border-color 0.2s" }}>
        {preview
          ? <img src={preview} alt="preview" style={{ width: 70, height: 70,
              objectFit: "cover", borderRadius: 8, border: `2px solid ${ok ? "#66bb6a" : line}` }} />
          : <div style={{ width: 70, height: 70, display: "flex", flexDirection: "column",
              alignItems: "center", justifyContent: "center", gap: 4,
              border: `1px solid ${line}`, borderRadius: 8, color: "#8A5560" }}>
              <UploadIcon />
              <span style={{ fontSize: 9, textAlign:"center" }}>Drag or click</span>
            </div>
        }
        <div>
          <div style={{ fontSize: 13, fontWeight: 600, color: maroonDark }}>
            {file ? file.name : "Choose a file"}
          </div>
          <div style={{ fontSize: 11, color: "#9A8088", marginTop: 3 }}>{hint}</div>
          {file && <div style={{ fontSize: 11, color: "#9A8088", marginTop: 2 }}>
            {(file.size / 1024).toFixed(0)} KB
          </div>}
        </div>
      </label>
      <input id={id} type="file" accept="image/jpeg,image/png,image/webp"
        onChange={pick} style={{ display: "none" }} />
      {bad && <p style={{ margin: "4px 0 0", fontSize: 11, color: "#b3202e", display:"flex", gap:3 }}><Cross />{error}</p>}
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════
   SECTION CARD
═══════════════════════════════════════════════════════════ */
function Section({ title, subtitle, children }) {
  return (
    <div style={{ marginBottom: 24, background: "rgba(255, 255, 255, 0.88)",
      backdropFilter: "blur(12px)", WebkitBackdropFilter: "blur(12px)",
      border: `1.5px solid ${line}`,
      borderRadius: 12, padding: "22px 24px",
      boxShadow: "0 4px 18px rgba(138, 37, 59, 0.06)" }}>
      <div style={{ marginBottom: 16 }}>
        <div style={{ fontFamily: "Georgia, serif", fontSize: 16, fontWeight: 700, color: maroonDark }}>{title}</div>
        {subtitle && <div style={{ fontSize: 12, color: "#9A8088", marginTop: 2 }}>{subtitle}</div>}
      </div>
      {children}
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════
   ROLE OPTIONS
═══════════════════════════════════════════════════════════ */
const ROLES = [
  { value: "STUDENT", label: "Student", icon: "🎓" },
  { value: "CLASS_REP", label: "Class Representative", icon: "⭐" },
  { value: "FACULTY", label: "Faculty", icon: "👨‍🏫" },
  { value: "PRINCIPAL", label: "Principal", icon: "🏛️" },
  { value: "EXTERNAL_PARTICIPANT", label: "External Participant", icon: "🌐" },
  { value: "MEDICAL_STAFF", label: "Medical Staff", icon: "🏥" },
  { value: "CANTEEN_STAFF", label: "Canteen Staff", icon: "🍱" },
  { value: "WARDEN", label: "Warden", icon: "🏨" },
];

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
    <div style={{ ...floralBackground(offWhite, maroon, 0.10), minHeight: "100vh",
      padding: "36px 20px", fontFamily: "'Inter', system-ui, sans-serif" }}>
      <div style={{ maxWidth: 660, margin: "0 auto" }}>

        {/* ── header ── */}
        <div style={{ textAlign: "center", marginBottom: 28 }}>
          <div style={{ width: 54, height: 54, borderRadius: "50%",
            background: `linear-gradient(135deg, ${maroon}, ${maroonSoft})`,
            margin: "0 auto 12px", display: "flex", alignItems: "center", justifyContent: "center",
            boxShadow: `0 4px 18px ${maroon}44` }}>
            <span style={{ color: gold, fontFamily: "Georgia, serif", fontWeight: 700, fontSize: 24 }}>C</span>
          </div>
          <h1 style={{ margin: 0, fontFamily: "Georgia, serif", fontSize: 26,
            fontWeight: 700, color: maroonDark }}>Create your CEMS account</h1>
          <p style={{ margin: "6px 0 0", fontSize: 13, color: "#8A5560" }}>
            Fill in all fields carefully. Your account will be reviewed by an Admin before activation.
          </p>
        </div>

        {/* ── progress bar ── */}
        <div style={{ marginBottom: 24 }}>
          <div style={{ display: "flex", justifyContent: "space-between",
            fontSize: 12, color: "#8A5560", marginBottom: 6 }}>
            <span>Form completion</span>
            <span style={{ fontWeight: 700, color: progress === 100 ? "#2e7d52" : maroon }}>{progress}%</span>
          </div>
          <div style={{ height: 6, background: "#EDE0E3", borderRadius: 99 }}>
            <div style={{ height: "100%", borderRadius: 99, width: `${progress}%`,
              background: progress === 100
                ? "linear-gradient(90deg, #2e7d52, #66bb6a)"
                : `linear-gradient(90deg, ${maroon}, ${maroonSoft})`,
              transition: "width 0.4s ease" }} />
          </div>
        </div>

        {/* ── success banner ── */}
        {result?.ok && (
          <div style={{ background: "#f0fff4", border: "1.5px solid #66bb6a",
            borderRadius: 12, padding: "18px 20px", marginBottom: 24,
            display: "flex", gap: 12, alignItems: "flex-start" }}>
            <span style={{ fontSize: 22 }}>✅</span>
            <div>
              <div style={{ fontWeight: 700, color: "#1b5e20", marginBottom: 4 }}>Registration Submitted!</div>
              <div style={{ fontSize: 13, color: "#2e7d52" }}>{result.message}</div>
            </div>
          </div>
        )}

        {/* ── error banner ── */}
        {result && !result.ok && (
          <div style={{ background: "#fff0f0", border: "1.5px solid #e57373",
            borderRadius: 12, padding: "14px 18px", marginBottom: 20,
            display: "flex", gap: 10, alignItems: "flex-start" }}>
            <Cross />
            <div style={{ fontSize: 13, color: "#b71c1c" }}>{result.message}</div>
          </div>
        )}

        <form onSubmit={submit} noValidate id="reg-form-top">

          {/* ── SECTION 1: Personal Info ── */}
          <Section title="Personal Information" subtitle="Your full name as on your ID card.">
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0 16px" }}>
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
            <div style={{ marginBottom: 14 }}>
              <label style={{ display: "block", fontSize: 11, fontWeight: 700,
                letterSpacing: "0.07em", color: "#7A3A44", textTransform: "uppercase", marginBottom: 8 }}>
                Role <span style={{ color: "#b3202e" }}>*</span>
              </label>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
                {ROLES.map(r => (
                  <button key={r.value} type="button" onClick={() => setForm(f => ({ ...f, role: r.value }))}
                    style={{ padding: "10px 6px", borderRadius: 8, cursor: "pointer",
                      border: `2px solid ${form.role === r.value ? maroon : "#D9C8CC"}`,
                      background: form.role === r.value ? `${maroon}12` : "#fff",
                      color: form.role === r.value ? maroonDark : "#666",
                      fontWeight: form.role === r.value ? 700 : 400,
                      fontSize: 12, transition: "all 0.15s", textAlign: "center" }}>
                    <div style={{ fontSize: 20, marginBottom: 4 }}>{r.icon}</div>
                    {r.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Dynamic designation & education fields for MEDICAL_STAFF */}
            {form.role === "MEDICAL_STAFF" && (
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0 16px", marginTop: 12 }}>
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
          <Section title="Account Credentials" subtitle="These will be used to log in.">
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0 16px" }}>
              <Input label="Username" id="reg-username" value={form.username}
                onChange={change("username")} onBlur={blur("username")}
                error={errors.username} touched={touched.username}
                autoComplete="username" placeholder="e.g. rahul.sharma"
                maxLength={150} hint="4–150 chars · letters, numbers, . or _" />
              <Input label="Email Address" id="reg-email" type="email" value={form.email}
                onChange={change("email")} onBlur={blur("email")}
                error={errors.email} touched={touched.email}
                autoComplete="email" placeholder="e.g. rahul@college.edu"
                hint="Must be a valid email (e.g. user@example.com)" />
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
              autoComplete="new-password" placeholder="Min. 8 chars · letter + number + symbol"
              hint="Min. 8 chars · include letter, number & special char (@#!…)"
              rightSlot={
                <button type="button" onClick={() => setShowPwd(s => !s)}
                  style={{ background: "none", border: "none", cursor: "pointer",
                    color: "#8A5560", padding: 2, display: "flex" }}>
                  <EyeIcon open={showPwd} />
                </button>
              }
            />

            {/* Strength meter */}
            {form.password && (
              <div style={{ marginTop: -8, marginBottom: 14 }}>
                <div style={{ height: 4, background: "#EDE0E3", borderRadius: 99, marginBottom: 4 }}>
                  <div style={{ height: "100%", borderRadius: 99, width: `${strength.pct}%`,
                    background: strength.color, transition: "width 0.3s, background 0.3s" }} />
                </div>
                <div style={{ fontSize: 11, color: strength.color, fontWeight: 600 }}>
                  Password strength: {strength.label}
                </div>
                <div style={{ fontSize: 11, color: "#9A8088", marginTop: 2 }}>
                  {["8+ chars", "uppercase", "lowercase", "number", "symbol"].map(req => {
                    const checks = {
                      "8+ chars": form.password.length >= 8,
                      "uppercase": /[A-Z]/.test(form.password),
                      "lowercase": /[a-z]/.test(form.password),
                      "number": /\d/.test(form.password),
                      "symbol": /[^A-Za-z0-9]/.test(form.password),
                    };
                    return (
                      <span key={req} style={{ marginRight: 10,
                        color: checks[req] ? "#2e7d52" : "#bbb", display: "inline-flex", alignItems: "center", gap: 2 }}>
                        {checks[req] ? <Check /> : "○"} {req}
                      </span>
                    );
                  })}
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
                    color: "#8A5560", padding: 2, display: "flex" }}>
                  <EyeIcon open={showPwd2} />
                </button>
              }
            />
          </Section>

          {/* ── SECTION 3: Identity ── */}
          <Section title="Identity Verification" subtitle="Required for emergency medical access.">
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0 16px" }}>
              <ImageUpload label="Your Profile Photo" id="img-profile"
                hint="Clear face photo · JPEG/PNG/WEBP · max 5 MB"
                file={profileImage} onChange={changeImg("profileImage")}
                error={imgErrors.profileImage} touched={imgTouched.profileImage} />
              <ImageUpload label="Physical ID Card Photo" id="img-idcard"
                hint="Full front of college ID · max 5 MB"
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
            style={{ width: "100%", padding: "14px", borderRadius: 10, border: "none",
              background: submitting ? "#A06070" : `linear-gradient(135deg, ${maroon}, ${maroonSoft})`,
              color: "#fff", fontSize: 16, fontWeight: 700, cursor: submitting ? "not-allowed" : "pointer",
              letterSpacing: "0.02em", boxShadow: submitting ? "none" : `0 6px 20px ${maroon}55`,
              transition: "all 0.2s", marginBottom: 20 }}>
            {submitting ? "Submitting…" : "Create Account"}
          </button>
        </form>

        <div style={{ textAlign: "center", fontSize: 13, color: "#8A5560", paddingBottom: 32 }}>
          Already have an account?{" "}
          <button onClick={onGoLogin} style={{ background: "none", border: "none",
            color: maroon, fontWeight: 700, cursor: "pointer", padding: 0, fontSize: 13 }}>
            Sign in
          </button>
        </div>
      </div>
    </div>
  );
}
