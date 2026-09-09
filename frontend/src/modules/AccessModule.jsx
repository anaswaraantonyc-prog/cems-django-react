import { useState, useEffect, useCallback } from "react";
import { ink, line, sage, brass, parchment, maroon, maroonDark, maroonSoft } from "../theme";

const gold = "#C99A3C";

/* ── helpers ─────────────────────────────────────────────── */
const api = (path, token, opts = {}) =>
  fetch(path, {
    ...opts,
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
      ...(opts.headers || {}),
    },
  });

function avatarLetter(user) {
  return ((user.first_name?.[0] || user.username?.[0] || "?")).toUpperCase();
}

function roleBadge(role) {
  const map = {
    STUDENT: { bg: "#E3F2FD", color: "#1565C0", label: "Student" },
    FACULTY: { bg: "#E8F5E9", color: "#2E7D32", label: "Faculty" },
    EXTERNAL_PARTICIPANT: { bg: "#FFF3E0", color: "#E65100", label: "External" },
    PRINCIPAL: { bg: "#F3E5F5", color: "#6A1B9A", label: "Principal" },
    ADMIN: { bg: "#FCE4EC", color: "#880E4F", label: "Admin" },
    CANTEEN_STAFF: { bg: "#F1F8E9", color: "#558B2F", label: "Canteen" },
    WARDEN: { bg: "#E0F7FA", color: "#006064", label: "Warden" },
    MEDICAL_STAFF: { bg: "#FBE9E7", color: "#BF360C", label: "Medical" },
  };
  const s = map[role] || { bg: "#F5F5F5", color: "#424242", label: role };
  return (
    <span style={{ fontSize: 11, fontWeight: 700, padding: "3px 8px",
      borderRadius: 20, background: s.bg, color: s.color, letterSpacing: "0.04em" }}>
      {s.label}
    </span>
  );
}

function Avatar({ user, size = 48 }) {
  const src = user.profile_image;
  return src ? (
    <img src={src} alt={user.username}
      style={{ width: size, height: size, borderRadius: "50%",
        objectFit: "cover", border: `2px solid ${gold}` }} />
  ) : (
    <div style={{ width: size, height: size, borderRadius: "50%",
      background: `linear-gradient(135deg, ${maroon}, ${maroonSoft})`,
      display: "flex", alignItems: "center", justifyContent: "center",
      color: "#fff", fontWeight: 700, fontSize: size * 0.4,
      border: `2px solid ${gold}` }}>
      {avatarLetter(user)}
    </div>
  );
}

function IDCardThumb({ src, label }) {
  return (
    <div style={{ textAlign: "center" }}>
      <div style={{ width: 80, height: 56, borderRadius: 6,
        border: `1.5px solid ${line}`, overflow: "hidden",
        background: "#FFFDF8", display: "flex", alignItems: "center", justifyContent: "center" }}>
        {src
          ? <img src={src} alt={label} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
          : <span style={{ fontSize: 10, color: "#9A8088", textAlign: "center", padding: 4 }}>No image</span>}
      </div>
      <div style={{ fontSize: 10, color: "#9A8088", marginTop: 3 }}>{label}</div>
    </div>
  );
}

/* ── user card ─────────────────────────────────────────────── */
function UserCard({ user, token, onValidated }) {
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState("");

  const validate = async () => {
    setErr("");
    setLoading(true);
    try {
      const res = await api(`/api/auth/pending/${user.id}/validate/`, token, { method: "POST" });
      if (!res.ok) {
        const d = await res.json();
        setErr(d.detail || "Validation failed.");
        return;
      }
      onValidated(user.id);
    } catch {
      setErr("Network error. Check Django is running.");
    } finally {
      setLoading(false);
    }
  };

  const idCardSrc = user.college_id?.id_card_image
    ? (user.college_id.id_card_image.startsWith("http") ? user.college_id.id_card_image : `/media/${user.college_id.id_card_image}`)
    : null;
  const profileSrc = user.profile_image
    ? (user.profile_image.startsWith("http") ? user.profile_image : `/media/${user.profile_image}`)
    : null;

  return (
    <div style={{ background: "#fff", border: `1.5px solid #EDE0E3`,
      borderRadius: 14, padding: "18px 22px", marginBottom: 14,
      boxShadow: "0 2px 12px rgba(107,30,43,0.07)",
      display: "flex", gap: 18, alignItems: "center", flexWrap: "wrap" }}>

      {/* avatar */}
      <Avatar user={{ ...user, profile_image: profileSrc }} size={54} />

      {/* info */}
      <div style={{ flex: 1, minWidth: 160 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
          <span style={{ fontWeight: 700, fontSize: 15, color: maroonDark }}>
            {user.first_name} {user.last_name}
          </span>
          {roleBadge(user.role)}
        </div>
        <div style={{ fontSize: 12, color: "#8A5560", marginTop: 2 }}>@{user.username}</div>
        {user.email && <div style={{ fontSize: 12, color: "#9A8088" }}>{user.email}</div>}
        {user.phone_number && <div style={{ fontSize: 12, color: "#9A8088" }}>{user.phone_number}</div>}
        {user.college_id?.id_number && (
          <div style={{ fontSize: 12, color: "#7A6A50", marginTop: 2, fontFamily: "monospace" }}>
            ID: {user.college_id.id_number}
          </div>
        )}
        {user.department && (
          <div style={{ fontSize: 12, color: "#9A8088" }}>{user.department}</div>
        )}
      </div>

      {/* id card thumbs */}
      <div style={{ display: "flex", gap: 10 }}>
        <IDCardThumb src={profileSrc} label="Profile photo" />
        <IDCardThumb src={idCardSrc} label="ID card" />
      </div>

      {/* action */}
      <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 6 }}>
        <button onClick={validate} disabled={loading}
          style={{ padding: "10px 18px", borderRadius: 8, border: "none",
            background: loading ? "#A06070" : `linear-gradient(135deg, ${maroon}, ${maroonSoft})`,
            color: "#fff", fontWeight: 700, fontSize: 13, cursor: loading ? "not-allowed" : "pointer",
            boxShadow: `0 3px 10px ${maroon}44`, whiteSpace: "nowrap",
            transition: "all 0.2s" }}>
          {loading ? "Validating…" : "Validate & Activate"}
        </button>
        {err && <div style={{ fontSize: 11, color: "#b3202e", maxWidth: 180, textAlign: "right" }}>{err}</div>}
      </div>
    </div>
  );
}

/* ── validated user row ────────────────────────────────────── */
function ValidatedRow({ user }) {
  const profileSrc = user.profile_image
    ? (user.profile_image.startsWith("http") ? user.profile_image : `/media/${user.profile_image}`)
    : null;
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 12, padding: "10px 16px",
      background: "#f6fff9", border: "1px solid #c8e6c9", borderRadius: 10, marginBottom: 8 }}>
      <Avatar user={{ ...user, profile_image: profileSrc }} size={36} />
      <div style={{ flex: 1 }}>
        <span style={{ fontWeight: 600, color: "#1b5e20", fontSize: 13 }}>
          {user.first_name} {user.last_name}
        </span>
        <span style={{ fontSize: 12, color: "#4CAF50", marginLeft: 8 }}>@{user.username}</span>
      </div>
      {roleBadge(user.role)}
      <span style={{ fontSize: 11, background: "#c8e6c9", color: "#1b5e20",
        padding: "3px 10px", borderRadius: 20, fontWeight: 700 }}>Active</span>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════
   MAIN MODULE
═══════════════════════════════════════════════════════════ */
export default function AccessModule({ accessToken }) {
  const token = accessToken || localStorage.getItem("cems_access") || "";

  const [pending, setPending]     = useState([]);
  const [validated, setValidated] = useState([]);
  const [loading, setLoading]     = useState(true);
  const [error, setError]         = useState("");
  const [tab, setTab]             = useState("pending"); // "pending" | "active"

  const load = useCallback(async () => {
    if (!token) { setError("Not authenticated. Please log in as Admin."); setLoading(false); return; }
    setLoading(true);
    setError("");
    try {
      const res = await api("/api/auth/pending/", token);
      if (res.status === 403) { setError("Access denied. This module requires Admin role."); setLoading(false); return; }
      if (!res.ok) { setError("Failed to load pending users."); setLoading(false); return; }
      const data = await res.json();
      const list = Array.isArray(data) ? data : (data.results || []);
      setPending(list);
    } catch {
      setError("Could not reach the Django server.");
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => { load(); }, [load]);

  const handleValidated = (userId) => {
    const user = pending.find(u => u.id === userId);
    setPending(p => p.filter(u => u.id !== userId));
    if (user) setValidated(v => [{ ...user, is_validated: true }, ...v]);
  };

  /* ── tab pill ── */
  const Pill = ({ id, label, count }) => (
    <button onClick={() => setTab(id)}
      style={{ padding: "8px 18px", borderRadius: 20, border: "none", cursor: "pointer",
        fontWeight: tab === id ? 700 : 400, fontSize: 13,
        background: tab === id ? maroon : "#f0e8ea",
        color: tab === id ? "#fff" : "#8A5560",
        transition: "all 0.15s" }}>
      {label}
      {count != null && (
        <span style={{ marginLeft: 6, background: tab === id ? "rgba(255,255,255,0.3)" : maroon,
          color: "#fff", fontSize: 11, fontWeight: 700, padding: "1px 7px",
          borderRadius: 20 }}>{count}</span>
      )}
    </button>
  );

  return (
    <div style={{ fontFamily: "'Inter', system-ui, sans-serif" }}>

      {/* header */}
      <div style={{ marginBottom: 20 }}>
        <h2 style={{ margin: 0, fontFamily: "Georgia, serif", fontSize: 20,
          fontWeight: 700, color: maroonDark }}>Access Control</h2>
        <p style={{ margin: "4px 0 0", fontSize: 13, color: "#8A5560" }}>
          Review and validate pending user registrations before they can log in.
        </p>
      </div>

      {/* tabs */}
      <div style={{ display: "flex", gap: 8, marginBottom: 20, alignItems: "center" }}>
        <Pill id="pending" label="Pending Approval" count={pending.length} />
        <Pill id="active"  label="Activated This Session" count={validated.length} />
        <button onClick={load} disabled={loading}
          style={{ marginLeft: "auto", padding: "8px 14px", borderRadius: 8,
            border: `1px solid #D9C8CC`, background: "#fff", cursor: "pointer",
            fontSize: 12, color: "#8A5560", display: "flex", alignItems: "center", gap: 6 }}>
          {loading ? "Loading…" : "⟳ Refresh"}
        </button>
      </div>

      {/* error */}
      {error && (
        <div style={{ background: "#fff0f0", border: "1px solid #e57373",
          borderRadius: 10, padding: "14px 18px", marginBottom: 16,
          fontSize: 13, color: "#b3202e" }}>
          {error}
        </div>
      )}

      {/* loading skeleton */}
      {loading && (
        <div style={{ textAlign: "center", padding: "40px 0", color: "#9A8088", fontSize: 14 }}>
          Loading users…
        </div>
      )}

      {/* pending tab */}
      {!loading && tab === "pending" && (
        <>
          {pending.length === 0 && !error && (
            <div style={{ textAlign: "center", padding: "48px 0",
              color: "#2e7d52", fontWeight: 600, fontSize: 15 }}>
              <div style={{ fontSize: 40, marginBottom: 8 }}>✅</div>
              No pending registrations — all users are validated!
            </div>
          )}
          {pending.map(u => (
            <UserCard key={u.id} user={u} token={token} onValidated={handleValidated} />
          ))}
        </>
      )}

      {/* activated tab */}
      {!loading && tab === "active" && (
        <>
          {validated.length === 0 ? (
            <div style={{ textAlign: "center", padding: "48px 0", color: "#9A8088", fontSize: 14 }}>
              No users validated in this session yet.
            </div>
          ) : (
            validated.map(u => <ValidatedRow key={u.id} user={u} />)
          )}
        </>
      )}
    </div>
  );
}
