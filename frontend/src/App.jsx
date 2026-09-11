import { useState, useEffect } from "react";
import {
  maroon, maroonDark, maroonSoft, maroonMid,
  offWhite, gold, goldLight, brownLight,
  sidebarFloral, mainFloral,
  roles, modulesByRole, moduleLabels, moduleIcons,
} from "./theme";

import Navbar from "./components/Navbar";
import LoginPage from "./components/LoginPage";
import RegisterPage from "./components/RegisterPage";

import BookingModule   from "./modules/BookingModule";
import RefundModule    from "./modules/RefundModule";
import RebookModule    from "./modules/RebookModule";
import MedicalModule   from "./modules/MedicalModule";
import ComplaintModule from "./modules/ComplaintModule";
import LedgerModule    from "./modules/LedgerModule";
import AccessModule    from "./modules/AccessModule";
import RegistrationModule from "./modules/RegistrationModule";
import CanteenModule   from "./modules/CanteenModule";
import WardenModule    from "./modules/WardenModule";
import LostFoundModule from "./modules/LostFoundModule";
import { Toast } from "./components/Shared";

/* ── SVG Icons for sidebar modules ─────────────────────── */
const ModuleIcon = ({ name, active }) => {
  const color = active ? "#FFFFFF" : "rgba(255,255,255,0.5)";
  const icons = {
    booking: (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/>
      </svg>
    ),
    refund: (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <polyline points="23 4 23 10 17 10"/><path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10"/>
      </svg>
    ),
    rebook: (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <polyline points="17 1 21 5 17 9"/><path d="M3 11V9a4 4 0 0 1 4-4h14"/><polyline points="7 23 3 19 7 15"/><path d="M21 13v2a4 4 0 0 1-4 4H3"/>
      </svg>
    ),
    medical: (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M19.5 12.572L12 20l-7.5-7.428A5 5 0 1 1 12 6.006a5 5 0 1 1 7.5 6.572"/>
      </svg>
    ),
    complaint: (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
      </svg>
    ),
    register: (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="8.5" cy="7" r="4"/><line x1="20" y1="8" x2="20" y2="14"/><line x1="23" y1="11" x2="17" y2="11"/>
      </svg>
    ),
    canteen: (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M18 8h1a4 4 0 0 1 0 8h-1"/><path d="M2 8h16v9a4 4 0 0 1-4 4H6a4 4 0 0 1-4-4V8z"/><line x1="6" y1="1" x2="6" y2="4"/><line x1="10" y1="1" x2="10" y2="4"/><line x1="14" y1="1" x2="14" y2="4"/>
      </svg>
    ),
    warden: (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/>
      </svg>
    ),
    ledger: (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/>
      </svg>
    ),
    lostfound: (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="10"/><path d="M12 8v4"/><path d="M12 16h.01"/>
      </svg>
    ),
    access: (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/>
      </svg>
    ),
  };
  return icons[name] || null;
};

/* ── Role labels without emojis ────────────────────────── */
const roleLabelsClean = {
  canteen: "Canteen Staff",
  student: "Student",
  principal: "Principal",
  warden: "Hostel Warden",
  faculty: "Faculty",
  class_rep: "Class Representative",
  admin: "Admin",
};

/* ── Main page header icon ─────────────────────────────── */
const PageHeaderIcon = ({ name }) => {
  const color = "#1D4ED8";
  const icons = {
    booking: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/>
      </svg>
    ),
    refund: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <polyline points="23 4 23 10 17 10"/><path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10"/>
      </svg>
    ),
    rebook: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <polyline points="17 1 21 5 17 9"/><path d="M3 11V9a4 4 0 0 1 4-4h14"/><polyline points="7 23 3 19 7 15"/><path d="M21 13v2a4 4 0 0 1-4 4H3"/>
      </svg>
    ),
    medical: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M19.5 12.572L12 20l-7.5-7.428A5 5 0 1 1 12 6.006a5 5 0 1 1 7.5 6.572"/>
      </svg>
    ),
    complaint: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
      </svg>
    ),
    register: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="8.5" cy="7" r="4"/><line x1="20" y1="8" x2="20" y2="14"/><line x1="23" y1="11" x2="17" y2="11"/>
      </svg>
    ),
    canteen: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M18 8h1a4 4 0 0 1 0 8h-1"/><path d="M2 8h16v9a4 4 0 0 1-4 4H6a4 4 0 0 1-4-4V8z"/><line x1="6" y1="1" x2="6" y2="4"/><line x1="10" y1="1" x2="10" y2="4"/><line x1="14" y1="1" x2="14" y2="4"/>
      </svg>
    ),
    warden: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/>
      </svg>
    ),
    ledger: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/>
      </svg>
    ),
    lostfound: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="10"/><path d="M12 8v4"/><path d="M12 16h.01"/>
      </svg>
    ),
    access: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/>
      </svg>
    ),
  };
  return (
    <div style={{
      width: 40, height: 40, borderRadius: 12,
      background: "#EFF6FF",
      display: "flex", alignItems: "center", justifyContent: "center",
      flexShrink: 0,
    }}>
      {icons[name] || null}
    </div>
  );
};

export default function App() {
  const [view, setView]               = useState("login");
  const [accessToken, setAccessToken] = useState("");
  const [userName, setUserName]       = useState("");
  const [role, setRole]               = useState("student");
  const [activeModule, setActiveModule] = useState("booking");

  // Global Broadcast State
  const [broadcastMessage, setBroadcastMessage] = useState("");
  const [lastSeenLostId, setLastSeenLostId] = useState(null);

  /* ── after successful login: decode JWT role ── */
  const handleLoggedIn = (data, isEmergency = false) => {
    const token = data.access || localStorage.getItem("cems_access") || "";
    if (data.access) {
      localStorage.setItem("cems_access", data.access);
    }
    setAccessToken(token);
    try {
      const payload = JSON.parse(atob(token.split(".")[1]));
      const raw = (payload.role || "STUDENT").toLowerCase().replace(/_/g, "");
      const map = {
        student: "student", classrep: "class_rep", class_rep: "class_rep",
        faculty: "faculty", principal: "principal", admin: "admin",
        canteen: "canteen", canteenstaff: "canteen",
        warden: "warden",
      };
      const resolvedRole = map[raw] || "student";
      const resolvedName = payload.full_name || payload.username || (resolvedRole === "canteen" ? "Neethu" : "");
      setRole(resolvedRole);
      setUserName(resolvedName);
      if (isEmergency) {
        setActiveModule("medical");
      } else {
        setActiveModule(modulesByRole[resolvedRole]?.[0] || "booking");
      }
    } catch {
      setRole("student");
      setUserName("");
      if (isEmergency) {
        setActiveModule("medical");
      } else {
        setActiveModule(modulesByRole["student"][0]);
      }
    }
    setView("dashboard");
  };

  // Restore session on reload
  useEffect(() => {
    const token = localStorage.getItem("cems_access");
    if (token) {
      handleLoggedIn({ access: token });
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Poll for newly reported missing items
  useEffect(() => {
    if (view !== "dashboard" || !accessToken) return;
    
    const checkLostItems = async () => {
      try {
        const res = await fetch("http://localhost:8000/api/lostfound/items/?item_status=LOST", {
          headers: { Authorization: `Bearer ${accessToken}` }
        });
        if (res.ok) {
          const data = await res.json();
          const items = Array.isArray(data) ? data : (data.results || []);
          if (items.length > 0) {
            const maxId = Math.max(...items.map(i => i.id));
            if (lastSeenLostId !== null && maxId > lastSeenLostId) {
              const newItem = items.find(i => i.id === maxId);
              // Show popup if the item wasn't reported by the current user
              if (newItem && newItem.reported_by !== userName) {
                setBroadcastMessage(`🚨 MISSING ITEM: ${newItem.title} - ${newItem.description.substring(0, 50)}...`);
              }
            }
            if (lastSeenLostId === null || maxId > lastSeenLostId) {
               setLastSeenLostId(maxId);
            }
          }
        }
      } catch (e) {}
    };

    const interval = setInterval(checkLostItems, 10000); // Check every 10 seconds
    if (lastSeenLostId === null) checkLostItems();

    return () => clearInterval(interval);
  }, [view, accessToken, lastSeenLostId, userName]);

  const modules = modulesByRole[role] || modulesByRole["student"];
  const current = modules.includes(activeModule) ? activeModule : modules[0];

  const selectRole = (r) => {
    setRole(r);
    if (r === "canteen") setUserName("Neethu");
    setActiveModule(modulesByRole[r]?.[0] || "booking");
  };

  /* ── Sign out handler ── */
  const handleSignOut = () => {
    localStorage.removeItem("cems_access");
    setAccessToken("");
    setView("login");
  };

  /* ══════════════════════════════════════════
     PUBLIC PAGES  (login / register)
  ══════════════════════════════════════════ */
  if (view === "login" || view === "register") {
    return (
      <div style={{ minHeight: "100vh", position: "relative" }}>
        <Navbar view={view} onNav={setView} onEmergency={() => setView("login")} />
        {view === "login" && (
          <LoginPage
            onGoRegister={() => setView("register")}
            onLoggedIn={handleLoggedIn}
          />
        )}
        {view === "register" && <RegisterPage onGoLogin={() => setView("login")} />}
      </div>
    );
  }

  /* ══════════════════════════════════════════
     DASHBOARD
  ══════════════════════════════════════════ */
  return (
    <div style={{
      minHeight: "100vh", display: "flex", flexDirection: "column",
      background: "#F8FAFC",
    }}>
      <Toast message={broadcastMessage} type="warning" visible={!!broadcastMessage} onClose={() => setBroadcastMessage("")} />

      {/* ── top navbar ── */}
      <header style={{
        background: "linear-gradient(90deg, #0a192f 0%, #1c2541 100%)",
        display: "flex", alignItems: "center", justifyContent: "space-between",
        padding: "0 24px", height: 60,
        boxShadow: "0 4px 24px rgba(10, 25, 47, 0.2)",
        position: "sticky", top: 0, zIndex: 20,
        borderBottom: "1px solid rgba(255,255,255,0.06)",
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <div style={{
            width: 36, height: 36, borderRadius: 10,
            background: "linear-gradient(135deg, #1d4ed8, #1e40af)",
            display: "flex", alignItems: "center", justifyContent: "center",
            color: "#ffffff", fontWeight: 800, fontSize: 16,
            boxShadow: "0 4px 14px rgba(29, 78, 216, 0.35)",
          }}>
            C
          </div>
          <div>
            <div style={{
              fontSize: 17, fontWeight: 800,
              color: "#ffffff", letterSpacing: "-0.01em"
            }}>CEMS</div>
            <div style={{
              fontSize: 9, color: "rgba(203,213,225,0.7)", letterSpacing: "0.12em", fontWeight: 600
            }}>
              CAMPUS EVENT MANAGEMENT
            </div>
          </div>
        </div>

        {/* Role switcher & Sign out */}
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <div style={{
            display: "flex", alignItems: "center", gap: 8,
            background: "rgba(255,255,255,0.06)", padding: "6px 14px",
            borderRadius: 9999, border: "1px solid rgba(255,255,255,0.1)"
          }}>
            <span style={{
              fontSize: 11, color: "rgba(203,213,225,0.7)",
              textTransform: "uppercase", letterSpacing: "0.06em", fontWeight: 700
            }}>
              Role:
            </span>
            <select
              value={role}
              onChange={(e) => selectRole(e.target.value)}
              style={{
                background: "transparent",
                color: "#FFFFFF",
                border: "none",
                fontSize: 12,
                fontWeight: 700,
                cursor: "pointer",
                outline: "none",
              }}
            >
              <option value="canteen" style={{ background: "#0B132B", color: "#FFF" }}>Canteen Staff (Neethu)</option>
              <option value="student" style={{ background: "#0B132B", color: "#FFF" }}>Student</option>
              <option value="principal" style={{ background: "#0B132B", color: "#FFF" }}>Principal</option>
              <option value="warden" style={{ background: "#0B132B", color: "#FFF" }}>Hostel Warden</option>
              <option value="faculty" style={{ background: "#0B132B", color: "#FFF" }}>Faculty</option>
              <option value="class_rep" style={{ background: "#0B132B", color: "#FFF" }}>Class Representative</option>
              <option value="admin" style={{ background: "#0B132B", color: "#FFF" }}>Admin</option>
            </select>
          </div>

          <button onClick={handleSignOut}
            style={{
              background: "rgba(255,255,255,0.08)",
              border: "1px solid rgba(255,255,255,0.15)",
              color: "#FFFFFF", fontSize: 12, padding: "7px 16px", borderRadius: 9999,
              cursor: "pointer", fontWeight: 600,
              display: "flex", alignItems: "center", gap: 6,
              transition: "all 0.2s ease",
            }}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none"
              stroke="#FFFFFF" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/>
              <polyline points="16 17 21 12 16 7"/>
              <line x1="21" y1="12" x2="9" y2="12"/>
            </svg>
            Sign out
          </button>
        </div>
      </header>

      <div style={{ display: "flex", flex: 1, minHeight: 0 }}>

        {/* ── sidebar ── */}
        <aside className="dashboard-sidebar" style={{
          background: "linear-gradient(180deg, #0a192f 0%, #1c2541 100%)",
          width: 240, flexShrink: 0, padding: "20px 14px",
          borderRight: "1px solid rgba(255,255,255,0.06)",
          display: "flex", flexDirection: "column", gap: 0,
          overflowY: "auto",
        }}>

          {/* modules label */}
          <div style={{
            fontSize: 10, color: "rgba(203,213,225,0.5)", letterSpacing: "0.1em",
            textTransform: "uppercase", marginBottom: 10, paddingLeft: 12, fontWeight: 700,
          }}>
            Modules
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
            {modules.map((m) => {
              const active = current === m;
              return (
                <button key={m} onClick={() => setActiveModule(m)}
                  style={{
                    textAlign: "left", padding: "10px 12px", borderRadius: 10,
                    border: "none",
                    cursor: "pointer", fontSize: 13,
                    fontWeight: active ? 700 : 500,
                    background: active
                      ? "rgba(29, 78, 216, 0.2)"
                      : "transparent",
                    color: active ? "#FFFFFF" : "rgba(255,255,255,0.55)",
                    display: "flex", alignItems: "center", gap: 10,
                    transition: "all 0.15s cubic-bezier(0.4, 0, 0.2, 1)",
                    letterSpacing: active ? "0.01em" : "0",
                  }}>
                  <ModuleIcon name={m} active={active} />
                  {moduleLabels[m]}
                </button>
              );
            })}
          </div>

          {/* bottom: signed in as */}
          <div style={{
            marginTop: "auto", paddingTop: 16,
            borderTop: "1px solid rgba(255,255,255,0.06)",
            paddingLeft: 12,
          }}>
            <div style={{ fontSize: 10, color: "rgba(255,255,255,0.35)", marginBottom: 6, fontWeight: 600 }}>
              Signed in as
            </div>
            <div style={{
              display: "flex", alignItems: "center", gap: 10,
            }}>
              <div style={{
                width: 32, height: 32, borderRadius: 8,
                background: "linear-gradient(135deg, #1d4ed8, #1e40af)",
                display: "flex", alignItems: "center", justifyContent: "center",
                color: "#FFFFFF", fontSize: 13, fontWeight: 700, flexShrink: 0,
              }}>
                {(userName || roles.find(r => r.id === role)?.label || "U").charAt(0).toUpperCase()}
              </div>
              <div style={{ minWidth: 0 }}>
                <div style={{
                  color: "#FFFFFF", fontWeight: 700, fontSize: 13,
                  whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis",
                }}>
                  {role === "canteen" ? (userName ? `${userName}` : "Neethu") : (userName || roles.find(r => r.id === role)?.label)}
                </div>
                <div style={{ color: "rgba(255,255,255,0.45)", fontSize: 10 }}>
                  {roleLabelsClean[role] || roles.find(r => r.id === role)?.label}
                </div>
              </div>
            </div>
          </div>
        </aside>

        {/* ── main content ── */}
        <main className="dashboard-main" style={{
          flex: 1, padding: "28px 36px", overflowY: "auto",
          background: "#F8FAFC",
        }}>

          {/* page header */}
          <div style={{
            marginBottom: 28, paddingBottom: 18,
            borderBottom: "1.5px solid #E2E8F0",
            animation: "fadeIn 0.3s ease",
          }}>
            <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
              <PageHeaderIcon name={current} />
              <div>
                <h1 style={{
                  margin: 0, fontSize: 22,
                  fontWeight: 800, color: "#0A192F", letterSpacing: "-0.02em",
                }}>
                  {moduleLabels[current]}
                </h1>
                <div style={{ fontSize: 13, color: "#64748B", marginTop: 3 }}>
                  {roleLabelsClean[role] || roles.find(r => r.id === role)?.label} dashboard
                </div>
              </div>
            </div>
          </div>

          {/* module content */}
          <div style={{ animation: "slideUp 0.3s cubic-bezier(0.4, 0, 0.2, 1)" }}>
            {current === "register"  && <RegistrationModule />}
            {current === "booking"   && <BookingModule role={role} />}
            {current === "refund"    && <RefundModule role={role} />}
            {current === "rebook"    && <RebookModule role={role} />}
            {current === "medical"   && <MedicalModule />}
            {current === "complaint" && <ComplaintModule role={role} />}
            {current === "ledger"    && <LedgerModule />}
            {current === "lostfound" && <LostFoundModule role={role} />}
            {current === "access"    && <AccessModule accessToken={accessToken} />}
            {current === "canteen"   && <CanteenModule />}
            {current === "warden"    && <WardenModule />}
          </div>
        </main>
      </div>
    </div>
  );
}
