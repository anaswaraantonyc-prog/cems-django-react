import { useState, useEffect, useCallback } from "react";
import { maroon, maroonDark, maroonSoft, gold, line } from "../theme";

/* ═══════════════════════════════════════════════════════════
   HELPERS
═══════════════════════════════════════════════════════════ */
const MEDIA_BASE = "http://127.0.0.1:8000";

function absUrl(src) {
  if (!src) return null;
  return src.startsWith("http") ? src : `${MEDIA_BASE}${src}`;
}

function authHeader() {
  const token = localStorage.getItem("cems_access") || "";
  return token ? { Authorization: `Bearer ${token}` } : {};
}

const ROLE_COLOR = {
  STUDENT:              { bg: "#EBF5FF", color: "#1565C0", label: "Student" },
  FACULTY:              { bg: "#FFF3E0", color: "#E65100", label: "Faculty" },
  CLASS_REP:            { bg: "#EFF6FF", color: "#1E40AF", label: "Class Rep" },
  CANTEEN_STAFF:        { bg: "#DCFCE7", color: "#15803D", label: "Canteen Staff" },
  WARDEN:               { bg: "#EDE9FE", color: "#5B21B6", label: "Hostel Warden" },
  EXTERNAL_PARTICIPANT: { bg: "#F3E5F5", color: "#6A1B9A", label: "External" },
  ADMIN:                { bg: "#FCE4EC", color: "#880E4F", label: "Admin" },
  PRINCIPAL:            { bg: "#E8F5E9", color: "#1B5E20", label: "Principal" },
  MEDICAL_STAFF:        { bg: "#FFE4E6", color: "#9F1239", label: "Medical Staff" },
};

/* ═══════════════════════════════════════════════════════════
   LIGHTBOX — full-screen image preview
═══════════════════════════════════════════════════════════ */
function Lightbox({ src, label, onClose }) {
  // close on Escape key
  useEffect(() => {
    const onKey = (e) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  return (
    <div
      onClick={onClose}
      style={{
        position: "fixed", inset: 0, zIndex: 2000,
        background: "rgba(10,4,6,0.88)",
        display: "flex", flexDirection: "column",
        alignItems: "center", justifyContent: "center",
        padding: 20, backdropFilter: "blur(6px)",
        animation: "lbFadeIn 0.18s ease",
      }}
    >
      {/* image */}
      <img
        src={src} alt={label}
        onClick={(e) => e.stopPropagation()}
        style={{
          maxWidth: "min(92vw, 780px)", maxHeight: "78vh",
          objectFit: "contain", borderRadius: 12,
          border: `3px solid ${gold}66`,
          boxShadow: "0 20px 60px rgba(0,0,0,0.6)",
        }}
      />
      {/* label */}
      <div style={{
        marginTop: 16, fontSize: 13, color: "rgba(255,255,255,0.80)",
        fontWeight: 600, letterSpacing: "0.05em",
      }}>{label}</div>
      {/* close hint */}
      <div style={{
        marginTop: 8, fontSize: 11, color: "rgba(255,255,255,0.40)",
      }}>Click anywhere or press Esc to close</div>

      {/* X button */}
      <button
        onClick={onClose}
        style={{
          position: "fixed", top: 18, right: 20,
          background: "rgba(255,255,255,0.12)", border: "none",
          color: "#fff", fontSize: 22, width: 38, height: 38,
          borderRadius: "50%", cursor: "pointer",
          display: "flex", alignItems: "center", justifyContent: "center",
        }}
      >×</button>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════
   CLICKABLE IMAGE THUMBNAIL
═══════════════════════════════════════════════════════════ */
function ImgThumb({ src, label, style = {} }) {
  const [open, setOpen] = useState(false);
  const [err, setErr] = useState(false);
  const url = absUrl(src);

  if (!url || err) {
    return (
      <div style={{
        display: "flex", flexDirection: "column", alignItems: "center",
        gap: 4, ...style,
      }}>
        <div style={{
          width: style.width || 72, height: style.height || 72,
          borderRadius: style.borderRadius || 8,
          background: "#f0e8ea", border: `1px dashed ${line}`,
          display: "flex", alignItems: "center", justifyContent: "center",
          fontSize: 22, color: "#bbb",
        }}>🖼️</div>
        <span style={{ fontSize: 10, color: "#bbb" }}>No image</span>
      </div>
    );
  }

  return (
    <>
      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 4 }}>
        <div
          onClick={() => setOpen(true)}
          title={`View ${label}`}
          style={{
            cursor: "zoom-in", position: "relative",
            borderRadius: style.borderRadius || 8,
            overflow: "hidden",
            border: `2px solid ${line}`,
            transition: "border-color 0.2s, transform 0.15s",
            width: style.width || 72,
            height: style.height || 72,
          }}
          onMouseEnter={e => {
            e.currentTarget.style.borderColor = gold;
            e.currentTarget.style.transform = "scale(1.04)";
          }}
          onMouseLeave={e => {
            e.currentTarget.style.borderColor = line;
            e.currentTarget.style.transform = "scale(1)";
          }}
        >
          <img
            src={url} alt={label}
            onError={() => setErr(true)}
            style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }}
          />
          {/* hover overlay */}
          <div style={{
            position: "absolute", inset: 0,
            background: "rgba(0,0,0,0.30)",
            display: "flex", alignItems: "center", justifyContent: "center",
            opacity: 0, transition: "opacity 0.15s",
            fontSize: 18,
          }}
            onMouseEnter={e => e.currentTarget.style.opacity = "1"}
            onMouseLeave={e => e.currentTarget.style.opacity = "0"}
          >🔍</div>
        </div>
        <span style={{
          fontSize: 10, fontWeight: 600, color: "#9A7A58",
          textTransform: "uppercase", letterSpacing: "0.05em",
        }}>{label}</span>
      </div>

      {open && <Lightbox src={url} label={label} onClose={() => setOpen(false)} />}
    </>
  );
}

/* ── Role badge ── */
function RoleBadge({ role }) {
  const c = ROLE_COLOR[role] || { bg: "#F5F5F5", color: "#424242", label: role };
  return (
    <span style={{
      display: "inline-block", padding: "2px 9px", borderRadius: 20,
      fontSize: 11, fontWeight: 700, letterSpacing: "0.05em",
      background: c.bg, color: c.color,
    }}>{c.label}</span>
  );
}

/* ═══════════════════════════════════════════════════════════
   MAIN COMPONENT
═══════════════════════════════════════════════════════════ */
export default function RegistrationModule() {
  const [users, setUsers]     = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState("");
  const [busy, setBusy]       = useState({});
  const [toast, setToast]     = useState(null);
  const [activeTab, setActiveTab] = useState("pending"); // 'pending' | 'history'
  const [historyFilter, setHistoryFilter] = useState("ALL"); // 'ALL' | 'Accepted' | 'Rejected'
  const [historyQuery, setHistoryQuery]   = useState("");

  // History Log State for Accepted & Rejected Registrations
  const [historyLogs, setHistoryLogs] = useState([
    {
      id: "HIS-101",
      username: "neha.v",
      first_name: "Neha",
      last_name: "Verma",
      email: "neha.v@college.edu",
      role: "CLASS_REP",
      department: "Information Technology",
      id_number: "ID-2026-IT-012",
      status: "Accepted",
      decidedAt: "2026-09-06 11:30 AM",
      notes: "Valid student ID card verified; approved as Class Rep.",
    },
    {
      id: "HIS-102",
      username: "karan.malhotra",
      first_name: "Karan",
      last_name: "Malhotra",
      email: "karan.m@gmail.com",
      role: "EXTERNAL_PARTICIPANT",
      department: "Unknown",
      id_number: "INVALID-99",
      status: "Rejected",
      decidedAt: "2026-09-05 04:15 PM",
      notes: "Blurry ID card photo; rejected by admin audit.",
    },
    {
      id: "HIS-103",
      username: "ramesh.canteen",
      first_name: "Ramesh",
      last_name: "Kumar",
      email: "ramesh.canteen@college.edu",
      role: "CANTEEN_STAFF",
      department: "Central Dining Services",
      id_number: "STF-302",
      status: "Accepted",
      decidedAt: "2026-09-04 09:20 AM",
      notes: "Staff identity confirmed by dining supervisor.",
    },
    {
      id: "HIS-104",
      username: "neethu",
      first_name: "Neethu",
      last_name: "Vasu",
      email: "neethu@gmail.com",
      role: "CANTEEN_STAFF",
      department: "Central Dining & Canteen Operations",
      id_number: "CEMS-CAN-002",
      status: "Accepted",
      decidedAt: "2026-09-08 12:10 PM",
      notes: "Verified as Canteen Staff; authorized for food order approvals and menu management.",
    },
  ]);

  const showToast = (msg, ok = true) => {
    setToast({ msg, ok });
    setTimeout(() => setToast(null), 3500);
  };

  const load = useCallback(async () => {
    setLoading(true); setError("");
    try {
      const res = await fetch("/api/auth/pending/", { headers: authHeader() });
      if (res.status === 401 || res.status === 403) {
        setError("You must be logged in as Admin to view this page."); return;
      }
      if (!res.ok) { setError("Failed to load pending registrations."); return; }
      const data = await res.json();
      setUsers(Array.isArray(data) ? data : (data.results ?? []));
    } catch {
      setError("Could not reach the server. Make sure Django is running.");
    } finally { setLoading(false); }
  }, []);

  useEffect(() => { load(); }, [load]);

  const accept = async (u) => {
    setBusy(b => ({ ...b, [u.id]: "accept" }));
    try {
      const res = await fetch(`/api/auth/pending/${u.id}/validate/`, {
        method: "POST", headers: authHeader(),
      });
      if (!res.ok) { showToast("Accept failed. Try again.", false); return; }
      
      // Log to history
      const now = new Date().toLocaleString();
      setHistoryLogs(h => [
        {
          id: `HIS-${Date.now()}`,
          username: u.username,
          first_name: u.first_name,
          last_name: u.last_name,
          email: u.email,
          role: u.role,
          department: u.department,
          id_number: u.college_id?.id_number || "Verified",
          status: "Accepted",
          decidedAt: now,
          notes: "Approved by Admin; platform clearance issued.",
        },
        ...h,
      ]);

      setUsers(list => list.filter(x => x.id !== u.id));
      showToast(`✅ ${u.username} approved — recorded in history.`);
    } catch { showToast("Network error. Try again.", false); }
    finally { setBusy(b => { const n = { ...b }; delete n[u.id]; return n; }); }
  };

  const reject = async (u) => {
    if (!window.confirm(`Reject and permanently delete "${u.username}"?`)) return;
    setBusy(b => ({ ...b, [u.id]: "reject" }));
    try {
      const res = await fetch(`/api/auth/pending/${u.id}/reject/`, {
        method: "DELETE", headers: authHeader(),
      });
      if (!res.ok) { showToast("Reject failed. Try again.", false); return; }
      
      // Log to history
      const now = new Date().toLocaleString();
      setHistoryLogs(h => [
        {
          id: `HIS-${Date.now()}`,
          username: u.username,
          first_name: u.first_name,
          last_name: u.last_name,
          email: u.email,
          role: u.role,
          department: u.department,
          id_number: u.college_id?.id_number || "Rejected",
          status: "Rejected",
          decidedAt: now,
          notes: "Registration rejected and account removed by Admin.",
        },
        ...h,
      ]);

      setUsers(list => list.filter(x => x.id !== u.id));
      showToast(`🗑️ ${u.username}'s registration rejected — recorded in history.`, false);
    } catch { showToast("Network error. Try again.", false); }
    finally { setBusy(b => { const n = { ...b }; delete n[u.id]; return n; }); }
  };

  // Filtered history logs
  const filteredHistory = historyLogs.filter(h => {
    const matchStatus = historyFilter === "ALL" || h.status === historyFilter;
    const q = historyQuery.toLowerCase();
    const matchQ = !q ||
      h.username.toLowerCase().includes(q) ||
      `${h.first_name} ${h.last_name}`.toLowerCase().includes(q) ||
      (h.email || "").toLowerCase().includes(q) ||
      (h.role || "").toLowerCase().includes(q);
    return matchStatus && matchQ;
  });

  return (
    <div style={{ fontFamily: "'Inter', system-ui, sans-serif", maxWidth: 900 }}>

      {/* ── Toast ── */}
      {toast && (
        <div style={{
          position: "fixed", top: 24, right: 24, zIndex: 1500,
          background: toast.ok ? "#f0fff4" : "#fff0f0",
          border: `1.5px solid ${toast.ok ? "#66bb6a" : "#e57373"}`,
          borderRadius: 10, padding: "14px 20px",
          boxShadow: "0 8px 32px rgba(0,0,0,0.15)",
          fontSize: 13, color: toast.ok ? "#1b5e20" : "#b71c1c",
          fontWeight: 600, maxWidth: 380, animation: "fadein 0.2s ease",
        }}>{toast.msg}</div>
      )}

      {/* ── Header ── */}
      <div style={{ display: "flex", alignItems: "center",
        justifyContent: "space-between", marginBottom: 20 }}>
        <div>
          <h2 style={{ margin: 0, fontFamily: "Georgia, serif", fontSize: 22,
            fontWeight: 700, color: maroonDark }}>
            User Registrations & Approvals Portal
          </h2>
          <p style={{ margin: "4px 0 0", fontSize: 13, color: "#9A7A58" }}>
            Review pending applicants, approve clearance, and audit registration decisions history.
          </p>
        </div>
        <button onClick={load} disabled={loading}
          style={{ padding: "8px 16px", borderRadius: 8,
            border: `1.5px solid ${maroon}`, background: "transparent",
            color: maroon, fontWeight: 700, fontSize: 13,
            cursor: loading ? "not-allowed" : "pointer",
            opacity: loading ? 0.6 : 1, transition: "all 0.2s" }}>
          {loading ? "Loading…" : "↻ Refresh"}
        </button>
      </div>

      {/* ── Navigation Tabs: Pending vs History ── */}
      <div style={{
        display: "flex", gap: 10, marginBottom: 20, borderBottom: "2px solid #EDE0E3", paddingBottom: 8
      }}>
        <button
          onClick={() => setActiveTab("pending")}
          style={{
            padding: "9px 18px", borderRadius: 8, border: "none", cursor: "pointer",
            fontWeight: 700, fontSize: 13,
            background: activeTab === "pending" ? maroonDark : "transparent",
            color: activeTab === "pending" ? "#FAF4ED" : maroonDark,
            display: "flex", alignItems: "center", gap: 8, transition: "all 0.15s"
          }}
        >
          <span>⏳ Pending Registrations</span>
          {users.length > 0 && (
            <span style={{
              background: gold, color: maroonDark, fontSize: 11, padding: "2px 7px",
              borderRadius: 10, fontWeight: 800
            }}>
              {users.length}
            </span>
          )}
        </button>

        <button
          onClick={() => setActiveTab("history")}
          style={{
            padding: "9px 18px", borderRadius: 8, border: "none", cursor: "pointer",
            fontWeight: 700, fontSize: 13,
            background: activeTab === "history" ? maroonDark : "transparent",
            color: activeTab === "history" ? "#FAF4ED" : maroonDark,
            display: "flex", alignItems: "center", gap: 8, transition: "all 0.15s"
          }}
        >
          <span>📜 Accept & Reject Audit History</span>
          <span style={{
            background: "rgba(255,255,255,0.2)", color: activeTab === "history" ? "#FAF4ED" : maroonDark,
            fontSize: 11, padding: "2px 7px", borderRadius: 10, fontWeight: 700, border: "1px solid #D9C8CC"
          }}>
            {historyLogs.length}
          </span>
        </button>
      </div>

      {/* ═══════════════════════════════════════════════════════════
          PENDING REGISTRATIONS TAB CONTENT
         ═══════════════════════════════════════════════════════════ */}
      {activeTab === "pending" && (
        <>
          {/* ── Count pill ── */}
          {!loading && !error && (
            <div style={{
              display: "inline-flex", alignItems: "center", gap: 8,
              background: users.length === 0 ? "#f0fff4" : `${maroon}12`,
              border: `1px solid ${users.length === 0 ? "#66bb6a44" : maroon + "44"}`,
              borderRadius: 20, padding: "5px 14px", fontSize: 13,
              color: users.length === 0 ? "#2e7d52" : maroon,
              fontWeight: 700, marginBottom: 20,
            }}>
              {users.length === 0
                ? "✅ No pending registrations"
                : `${users.length} pending registration${users.length > 1 ? "s" : ""}`}
            </div>
          )}

          {/* ── Error ── */}
          {error && (
            <div style={{ background: "#fff0f0", border: "1.5px solid #e57373",
              borderRadius: 10, padding: "16px 20px", color: "#b71c1c",
              fontSize: 14, marginBottom: 20 }}>
              ⚠️ {error}
            </div>
          )}

          {/* ── Skeleton ── */}
          {loading && (
            <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
              {[1, 2, 3].map(i => (
                <div key={i} style={{ height: 130, borderRadius: 14,
                  background: "linear-gradient(90deg,#f0e8ea 25%,#e8dce0 50%,#f0e8ea 75%)",
                  backgroundSize: "200% 100%", animation: "shimmer 1.4s infinite",
                  border: "1px solid #EDE0E3" }} />
              ))}
            </div>
          )}

          {/* ── Empty ── */}
          {!loading && !error && users.length === 0 && (
            <div style={{ textAlign: "center", padding: "60px 0", color: "#9A7A58" }}>
              <div style={{ fontSize: 52, marginBottom: 12 }}>🎉</div>
              <div style={{ fontSize: 16, fontWeight: 700, color: maroonDark, marginBottom: 6 }}>
                All caught up!
              </div>
              <div style={{ fontSize: 13 }}>No pending registrations at this time.</div>
            </div>
          )}

          {/* ── User Cards ── */}
          {!loading && !error && users.length > 0 && (
            <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
              {users.map(u => {
                const isBusy = !!busy[u.id];
                const action = busy[u.id];
                const profileSrc  = u.profile_image;
                const idCardSrc   = u.college_id?.id_card_image;
                const idNumber    = u.college_id?.id_number;

                return (
                  <div key={u.id} style={{
                    background: "#fff",
                    border: `1.5px solid #EDE0E3`,
                    borderRadius: 16,
                    padding: "20px 24px",
                    boxShadow: "0 2px 16px rgba(107,30,43,0.08)",
                    opacity: isBusy ? 0.65 : 1,
                    transition: "opacity 0.2s",
                  }}>
                    <div style={{ display: "flex", gap: 20, alignItems: "flex-start",
                      flexWrap: "wrap" }}>

                      {/* ── PHOTOS COLUMN ── */}
                      <div style={{
                        display: "flex", flexDirection: "column", gap: 10,
                        alignItems: "center", flexShrink: 0,
                        background: "#FDFAF6", borderRadius: 10, padding: "12px 14px",
                        border: `1px solid #EDE0E3`, minWidth: 170,
                      }}>
                        <div style={{ fontSize: 10, fontWeight: 700, color: "#9A7A58",
                          textTransform: "uppercase", letterSpacing: "0.07em",
                          marginBottom: 4 }}>
                          Click image to enlarge
                        </div>
                        <div style={{ display: "flex", gap: 14 }}>
                          {/* Profile photo */}
                          <ImgThumb
                            src={profileSrc}
                            label="Profile Photo"
                            style={{
                              width: 70, height: 70, borderRadius: "50%",
                            }}
                          />
                          {/* ID Card */}
                          <ImgThumb
                            src={idCardSrc}
                            label="ID Card"
                            style={{
                              width: 105, height: 70, borderRadius: 8,
                            }}
                          />
                        </div>
                        {idNumber && (
                          <div style={{ fontSize: 11, color: "#7A5A60", fontWeight: 600,
                            background: "#f0e8ea", padding: "3px 10px",
                            borderRadius: 20, marginTop: 2 }}>
                            🪪 {idNumber}
                          </div>
                        )}
                      </div>

                      {/* ── INFO COLUMN ── */}
                      <div style={{ flex: 1, minWidth: 220 }}>
                        <div style={{ display: "flex", alignItems: "center",
                          gap: 10, flexWrap: "wrap", marginBottom: 4 }}>
                          <span style={{ fontWeight: 700, fontSize: 16, color: maroonDark }}>
                            {u.first_name} {u.last_name}
                          </span>
                          <RoleBadge role={u.role} />
                        </div>
                        <div style={{ fontSize: 12, color: "#7A5A60", marginBottom: 10 }}>
                          @{u.username}
                        </div>

                        {/* Detail rows */}
                        <div style={{ display: "flex", flexDirection: "column", gap: 5 }}>
                          {u.email && (
                            <div style={{ fontSize: 13, color: "#6B4C2A",
                              display: "flex", alignItems: "center", gap: 6 }}>
                              <span style={{ fontSize: 15 }}>✉️</span>
                              <span>{u.email}</span>
                            </div>
                          )}
                          {u.phone_number && (
                            <div style={{ fontSize: 13, color: "#6B4C2A",
                              display: "flex", alignItems: "center", gap: 6 }}>
                              <span style={{ fontSize: 15 }}>📱</span>
                              <span>{u.phone_number}</span>
                            </div>
                          )}
                          {u.department && (
                            <div style={{ fontSize: 13, color: "#6B4C2A",
                              display: "flex", alignItems: "center", gap: 6 }}>
                              <span style={{ fontSize: 15 }}>🏫</span>
                              <span>{u.department}</span>
                            </div>
                          )}
                        </div>

                        <div style={{ fontSize: 11, color: "#B0928A", marginTop: 10 }}>
                          Registered:{" "}
                          {u.created_at
                            ? new Date(u.created_at).toLocaleString("en-IN", {
                                day: "2-digit", month: "short", year: "numeric",
                                hour: "2-digit", minute: "2-digit",
                              })
                            : "—"}
                        </div>
                      </div>

                      {/* ── ACTIONS COLUMN ── */}
                      <div style={{
                        display: "flex", flexDirection: "column", gap: 10,
                        flexShrink: 0, justifyContent: "center",
                        minWidth: 130,
                      }}>
                        <button
                          onClick={() => accept(u)}
                          disabled={isBusy}
                          title="Approve this registration"
                          style={{
                            padding: "10px 0", width: "100%",
                            borderRadius: 8, border: "none",
                            background: (isBusy && action === "accept")
                              ? "#aaa"
                              : "linear-gradient(135deg, #2e7d52, #43a047)",
                            color: "#fff", fontWeight: 700, fontSize: 13,
                            cursor: isBusy ? "not-allowed" : "pointer",
                            boxShadow: "0 3px 10px rgba(46,125,82,0.30)",
                            transition: "all 0.2s",
                          }}>
                          {isBusy && action === "accept" ? "Approving…" : "✅ Accept"}
                        </button>
                        <button
                          onClick={() => reject(u)}
                          disabled={isBusy}
                          title="Reject and delete this registration"
                          style={{
                            padding: "10px 0", width: "100%",
                            borderRadius: 8,
                            border: "1.5px solid #e57373",
                            background: (isBusy && action === "reject") ? "#aaa" : "#fff0f0",
                            color: "#c62828", fontWeight: 700, fontSize: 13,
                            cursor: isBusy ? "not-allowed" : "pointer",
                            transition: "all 0.2s",
                          }}>
                          {isBusy && action === "reject" ? "Rejecting…" : "❌ Reject"}
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </>
      )}

      {/* ═══════════════════════════════════════════════════════════
          ACCEPT & REJECT AUDIT HISTORY TAB CONTENT
         ═══════════════════════════════════════════════════════════ */}
      {activeTab === "history" && (
        <div>
          {/* Filter Bar */}
          <div style={{
            background: "#FFF", border: "1.5px solid #EDE0E3", borderRadius: 14,
            padding: "14px 18px", marginBottom: 18, display: "flex",
            justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 12
          }}>
            <div>
              <strong style={{ fontSize: 15, color: maroonDark }}>Registration Decision History Logs</strong>
              <div style={{ fontSize: 12, color: "#9A7A58" }}>
                Total {filteredHistory.length} audit records found
              </div>
            </div>

            <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
              <input
                placeholder="🔍 Search name, email, or role..."
                value={historyQuery}
                onChange={(e) => setHistoryQuery(e.target.value)}
                style={{
                  padding: "8px 12px", borderRadius: 8, border: "1.5px solid #D9C8CC",
                  fontSize: 13, outline: "none", width: 220
                }}
              />
              <select
                value={historyFilter}
                onChange={(e) => setHistoryFilter(e.target.value)}
                style={{
                  padding: "8px 12px", borderRadius: 8, border: "1.5px solid #D9C8CC",
                  fontSize: 13, outline: "none", background: "#FFF", fontWeight: 600, color: maroonDark
                }}
              >
                <option value="ALL">All Decisions</option>
                <option value="Accepted">✅ Accepted Only</option>
                <option value="Rejected">❌ Rejected Only</option>
              </select>
            </div>
          </div>

          {/* History Cards List */}
          <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
            {filteredHistory.map((item) => {
              const isAccepted = item.status === "Accepted";
              return (
                <div key={item.id} style={{
                  background: "#FFF",
                  border: `1.5px solid ${isAccepted ? "#A7F3D0" : "#FECDD3"}`,
                  borderRadius: 14, padding: "16px 20px",
                  boxShadow: "0 2px 10px rgba(0,0,0,0.03)",
                  borderLeft: `5px solid ${isAccepted ? "#10B981" : "#EF4444"}`
                }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: 12 }}>
                    <div>
                      <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
                        <span style={{ fontWeight: 700, fontSize: 16, color: maroonDark }}>
                          {item.first_name} {item.last_name}
                        </span>
                        <span style={{ fontSize: 12, color: "#7A5A60", fontWeight: 600 }}>
                          (@{item.username})
                        </span>
                        <RoleBadge role={item.role} />
                      </div>

                      <div style={{ fontSize: 13, color: "#475569", marginTop: 6 }}>
                        📧 {item.email} · Department: <strong>{item.department || "N/A"}</strong> · ID: <strong>{item.id_number}</strong>
                      </div>

                      <div style={{ fontSize: 12, color: "#78350F", marginTop: 6, fontStyle: "italic" }}>
                        💬 Audit Note: "{item.notes}"
                      </div>
                    </div>

                    <div style={{ textAlign: "right" }}>
                      <span style={{
                        fontSize: 12, fontWeight: 800, padding: "4px 12px", borderRadius: 20,
                        background: isAccepted ? "#D1FAE5" : "#FEE2E2",
                        color: isAccepted ? "#047857" : "#B91C1C",
                        display: "inline-block", letterSpacing: "0.02em"
                      }}>
                        {isAccepted ? "✅ ACCEPTED & APPROVED" : "❌ REJECTED & DELETED"}
                      </span>
                      <div style={{ fontSize: 11, color: "#64748B", marginTop: 6, fontWeight: 500 }}>
                        Decision Date: {item.decidedAt}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}

            {filteredHistory.length === 0 && (
              <div style={{ textAlign: "center", padding: "40px", background: "#FAF4ED", borderRadius: 14, color: "#9A7A58" }}>
                <div style={{ fontSize: 32 }}>📜</div>
                <div style={{ fontWeight: 700, color: maroonDark, marginTop: 6 }}>No Decision Logs Found</div>
                <div style={{ fontSize: 12 }}>No history logs match your search or filter criteria.</div>
              </div>
            )}
          </div>
        </div>
      )}

      <style>{`
        @keyframes shimmer {
          0%   { background-position: -200% 0; }
          100% { background-position:  200% 0; }
        }
        @keyframes fadein {
          from { opacity: 0; transform: translateY(-8px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        @keyframes lbFadeIn {
          from { opacity: 0; }
          to   { opacity: 1; }
        }
      `}</style>
    </div>
  );
}
