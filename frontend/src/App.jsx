import { useState } from "react";
import {
  maroon, maroonDark, maroonSoft, maroonMid,
  offWhite, gold, goldLight, brownLight,
  sidebarFloral, mainFloral,
  roles, modulesByRole, moduleLabels, moduleIcons,
} from "./theme";

import Navbar from "./components/Navbar";
import LoginPage from "./components/LoginPage";
import RegisterPage from "./components/RegisterPage";
import RainingFlowers from "./components/RainingFlowers";

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

export default function App() {
  const [view, setView]               = useState("login");
  const [accessToken, setAccessToken] = useState("");
  const [userName, setUserName]       = useState("");
  const [role, setRole]               = useState("student");
  const [activeModule, setActiveModule] = useState("booking");

  const modules = modulesByRole[role] || modulesByRole["student"];
  const current = modules.includes(activeModule) ? activeModule : modules[0];

  const selectRole = (r) => {
    setRole(r);
    if (r === "canteen") setUserName("Neethu");
    setActiveModule(modulesByRole[r]?.[0] || "booking");
  };

  /* ── after successful login: decode JWT role ── */
  const handleLoggedIn = (data, isEmergency = false) => {
    const token = data.access || localStorage.getItem("cems_access") || "";
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
        setActiveModule(modulesByRole[resolvedRole][0]);
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

  /* ══════════════════════════════════════════
     PUBLIC PAGES  (login / register)
  ══════════════════════════════════════════ */
  if (view === "login" || view === "register") {
    return (
      <div style={{ fontFamily: "'Inter', system-ui, sans-serif", minHeight: "100vh", position: "relative" }}>
        <RainingFlowers color={maroonSoft} count={32} />
        <Navbar view={view} onNav={setView} onEmergency={() => setView("login")} />
        {view === "login" && (
          <LoginPage
            onGoRegister={() => setView("register")}
            onLoggedIn={handleLoggedIn}
          />
        )}
        {view === "register" && <RegisterPage onGoLogin={() => setView("login")} />}
        <div style={{ textAlign: "center", padding: "12px 0",
          background: offWhite, borderTop: `1px solid #E8D8C0` }}>
          <button onClick={() => setView("dashboard")}
            style={{ background: "none", border: "none",
              color: brownLight, fontSize: 12, cursor: "pointer",
              textDecoration: "underline" }}>
            Skip to dashboard (demo)
          </button>
        </div>
      </div>
    );
  }

  /* ══════════════════════════════════════════
     DASHBOARD
  ══════════════════════════════════════════ */
  return (
    <div style={{ fontFamily: "'Inter', system-ui, sans-serif",
      ...mainFloral, minHeight: "100vh", display: "flex", flexDirection: "column" }}>


      {/* ── top navbar ── */}
      <header style={{
        ...sidebarFloral,
        display: "flex", alignItems: "center", justifyContent: "space-between",
        padding: "0 24px", height: 56,
        boxShadow: "0 2px 12px rgba(74,18,28,0.25)",
        position: "sticky", top: 0, zIndex: 20,
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <div style={{ width: 32, height: 32, borderRadius: "50%",
            border: `2px solid ${gold}`,
            display: "flex", alignItems: "center", justifyContent: "center",
            color: gold, fontFamily: "Georgia, serif", fontWeight: 700, fontSize: 14 }}>
            C
          </div>
          <div>
            <div style={{ fontFamily: "Georgia, serif", fontSize: 17, fontWeight: 700,
              color: offWhite, letterSpacing: "0.02em" }}>CEMS</div>
            <div style={{ fontSize: 9, color: goldLight, letterSpacing: "0.12em" }}>
              CAMPUS EVENT MANAGEMENT
            </div>
          </div>
        </div>

        {/* ── Role switcher & Sign out ── */}
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <div style={{
            display: "flex", alignItems: "center", gap: 8,
            background: "rgba(0,0,0,0.30)", padding: "5px 12px",
            borderRadius: 20, border: "1px solid rgba(255,255,255,0.18)"
          }}>
            <span style={{ fontSize: 11, color: goldLight, textTransform: "uppercase", letterSpacing: "0.06em", fontWeight: 700 }}>
              Role:
            </span>
            <select
              value={role}
              onChange={(e) => selectRole(e.target.value)}
              style={{
                background: "transparent",
                color: offWhite,
                border: "none",
                fontSize: 12,
                fontWeight: 700,
                cursor: "pointer",
                outline: "none",
              }}
            >
              <option value="canteen" style={{ background: maroonDark, color: "#FFF" }}>🍱 Canteen Staff (Neethu)</option>
              <option value="student" style={{ background: maroonDark, color: "#FFF" }}>🎓 Student</option>
              <option value="principal" style={{ background: maroonDark, color: "#FFF" }}>🏛️ Principal</option>
              <option value="warden" style={{ background: maroonDark, color: "#FFF" }}>🏨 Hostel Warden</option>
              <option value="faculty" style={{ background: maroonDark, color: "#FFF" }}>👨‍🏫 Faculty</option>
              <option value="class_rep" style={{ background: maroonDark, color: "#FFF" }}>⭐ Class Representative</option>
              <option value="admin" style={{ background: maroonDark, color: "#FFF" }}>⚙️ Admin</option>
            </select>
          </div>

          <button onClick={() => setView("login")}
            style={{ background: "rgba(255,255,255,0.12)", border: `1px solid rgba(255,255,255,0.3)`,
              color: offWhite, fontSize: 12, padding: "6px 14px", borderRadius: 20,
              cursor: "pointer", fontWeight: 600 }}>
            ← Sign out
          </button>
        </div>
      </header>

      <div style={{ display: "flex", flex: 1 }}>

        {/* ── sidebar ── */}
        <aside style={{
          ...sidebarFloral,
          width: 230, flexShrink: 0, padding: "20px 14px",
          borderRight: `1px solid ${maroonDark}`,
          display: "flex", flexDirection: "column", gap: 0,
        }}>

          {/* modules */}
          <div style={{ fontSize: 10, color: goldLight, letterSpacing: "0.1em",
            textTransform: "uppercase", marginBottom: 8, paddingLeft: 4 }}>
            Modules
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 3 }}>
            {modules.map((m) => {
              const active = current === m;
              return (
                <button key={m} onClick={() => setActiveModule(m)}
                  style={{
                    textAlign: "left", padding: "9px 12px", borderRadius: 8,
                    border: active ? `1px solid ${gold}55` : "1px solid transparent",
                    cursor: "pointer", fontSize: 13,
                    fontWeight: active ? 700 : 400,
                    background: active
                      ? "rgba(201,154,60,0.18)"
                      : "transparent",
                    color: active ? gold : "rgba(255,255,255,0.65)",
                    display: "flex", alignItems: "center", gap: 8,
                    transition: "all 0.15s",
                  }}>
                  <span style={{ fontSize: 15 }}>{moduleIcons[m]}</span>
                  {moduleLabels[m]}
                </button>
              );
            })}
          </div>

          {/* bottom: signed in as */}
          <div style={{ marginTop: "auto", paddingTop: 16,
            borderTop: "1px solid rgba(255,255,255,0.10)",
            fontSize: 11, color: "rgba(255,255,255,0.45)", paddingLeft: 4 }}>
            Signed in as:
            <div style={{ color: goldLight, fontWeight: 700, fontSize: 13, marginTop: 3 }}>
              {role === "canteen" ? (userName ? `${userName} (Canteen Staff)` : "Neethu (Canteen Staff)") : (userName || roles.find(r => r.id === role)?.label)}
            </div>
            <div style={{ color: "rgba(255,255,255,0.55)", fontSize: 10, marginTop: 1 }}>
              {roles.find(r => r.id === role)?.label}
            </div>
          </div>
        </aside>

        {/* ── main content ── */}
        <main style={{ flex: 1, padding: "28px 36px", overflowY: "auto" }}>

          {/* page header */}
          <div style={{ marginBottom: 24, paddingBottom: 16,
            borderBottom: `1.5px solid #FFFFFF` }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <span style={{ fontSize: 26 }}>{moduleIcons[current]}</span>
              <div>
                <h1 style={{ margin: 0, fontFamily: "Georgia, serif", fontSize: 22,
                  fontWeight: 700, color: maroonDark }}>
                  {moduleLabels[current]}
                </h1>
                <div style={{ fontSize: 12, color: brownLight, marginTop: 2 }}>
                  {roles.find(r => r.id === role)?.label} dashboard
                </div>
              </div>
            </div>
          </div>

          {/* module content */}
          {current === "register"  && <RegistrationModule />}
          {current === "booking"   && <BookingModule role={role} />}
          {current === "refund"    && <RefundModule role={role} />}
          {current === "rebook"    && <RebookModule role={role} />}
          {current === "medical"   && <MedicalModule />}
          {current === "complaint" && <ComplaintModule role={role} />}
          {current === "ledger"    && <LedgerModule />}
          {current === "access"    && <AccessModule accessToken={accessToken} />}
          {current === "canteen"   && <CanteenModule />}
          {current === "warden"    && <WardenModule />}
        </main>
      </div>
    </div>
  );
}
