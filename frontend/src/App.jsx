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
import MyProfileModule from "./modules/MyProfileModule";
import { Toast } from "./components/Shared";
import EmergencySirenModal, { SirenBeaconIcon } from "./components/EmergencySirenModal";
import EmergencyAlertPopup from "./components/EmergencyAlertPopup";
import ResponderAlertsDesk from "./components/ResponderAlertsDesk";
import GlobalEmergencyDock from "./components/GlobalEmergencyDock";


/* ── SVG Icons for sidebar modules ─────────────────────── */
const ModuleIcon = ({ name, active }) => {
  const color = active ? "#064E3B" : "#065F46";
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
    profile: (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/>
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
  medical_staff: "Medical Staff",
};

/* ── Main page header icon ─────────────────────────────── */
const PageHeaderIcon = ({ name }) => {
  const color = "#065F46";
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
    profile: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/>
      </svg>
    ),
  };
  return (
    <div style={{
      width: 40, height: 40, borderRadius: 12,
      background: "#DCFCE7",
      border: "1.5px solid #A7F3D0",
      display: "flex", alignItems: "center", justifyContent: "center",
      flexShrink: 0,
    }}>
      {icons[name] || null}
    </div>
  );
};

export default function App() {
  const [view, setView]               = useState("login");
  const [emergencyModalOpen, setEmergencyModalOpen] = useState(false);
  const [accessToken, setAccessToken] = useState("");
  const [userName, setUserName]       = useState("");
  const [role, setRole]               = useState("student");
  const [activeModule, setActiveModule] = useState("booking");

  // Global Broadcast State
  const [broadcastMessage, setBroadcastMessage] = useState("");
  const [lastSeenLostId, setLastSeenLostId] = useState(null);

  // Active Emergency Panic Siren Alarm State
  const [activeEmergencyAlarm, setActiveEmergencyAlarm] = useState(null);
  const [showAlarmDetailModal, setShowAlarmDetailModal] = useState(false);
  const [dismissedAlarmId, setDismissedAlarmId] = useState(null);

  // Global 1-Tap Emergency States (Accessible from anywhere / PWA shortcuts)
  const [globalSirenOpen, setGlobalSirenOpen] = useState(false);
  const [globalSosOpen, setGlobalSosOpen] = useState(false);

  const parseJwtPayload = (tokenStr) => {
    try {
      const parts = (tokenStr || "").split(".");
      if (parts.length < 2) return null;
      let base64 = parts[1].replace(/-/g, "+").replace(/_/g, "/");
      while (base64.length % 4) {
        base64 += "=";
      }
      const binaryStr = atob(base64);
      const bytes = new Uint8Array(binaryStr.length);
      for (let i = 0; i < binaryStr.length; i++) {
        bytes[i] = binaryStr.charCodeAt(i);
      }
      return JSON.parse(new TextDecoder().decode(bytes));
    } catch {
      try {
        return JSON.parse(atob((tokenStr || "").split(".")[1]));
      } catch {
        return null;
      }
    }
  };

  /* ── after successful login: decode JWT role ── */
  const handleLoggedIn = (data, isEmergency = false) => {
    const token = data?.access || localStorage.getItem("cems_access") || "";
    if (!token || typeof token !== "string" || !token.includes(".")) {
      localStorage.removeItem("cems_access");
      localStorage.removeItem("cems_refresh");
      setAccessToken("");
      setView("login");
      return;
    }

    if (data?.access) {
      localStorage.setItem("cems_access", data.access);
    }
    if (data?.refresh) {
      localStorage.setItem("cems_refresh", data.refresh);
    }
    setAccessToken(token);

    try {
      const payload = parseJwtPayload(token) || {};
      // Check token expiration only if exp is present
      if (payload.exp && payload.exp * 1000 < Date.now()) {
        localStorage.removeItem("cems_access");
        localStorage.removeItem("cems_refresh");
        setAccessToken("");
        setView("login");
        return;
      }

      const raw = (data?.role || payload.role || "STUDENT").toLowerCase().replace(/_/g, "");
      const map = {
        student: "student", classrep: "class_rep", class_rep: "class_rep",
        faculty: "faculty", principal: "principal", admin: "admin",
        canteen: "canteen", canteenstaff: "canteen",
        warden: "warden",
        medicalstaff: "medical_staff", medical_staff: "medical_staff",
      };
      const resolvedRole = map[raw] || "student";
      const resolvedName = data?.full_name || payload.full_name || data?.username || payload.username || (resolvedRole === "canteen" ? "Neethu" : "");
      setRole(resolvedRole);
      setUserName(resolvedName);
      if (isEmergency) {
        setActiveModule("medical");
      } else {
        setActiveModule(modulesByRole[resolvedRole]?.[0] || "booking");
      }
      setView("dashboard");
    } catch {
      setRole("student");
      setUserName("");
      setView("dashboard");
    }
  };

  // Restore session on reload
  useEffect(() => {
    const token = localStorage.getItem("cems_access");
    if (token) {
      handleLoggedIn({ access: token });
    } else {
      setView("login");
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Poll for newly reported missing items
  useEffect(() => {
    if (view !== "dashboard" || !accessToken) return;
    
    const checkLostItems = async () => {
      try {
        const res = await fetch("/api/lostfound/items/?item_status=LOST", {
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

  // Listen for college-wide emergency panic alarm broadcasts
  useEffect(() => {
    const checkAlarm = async () => {
      try {
        const res = await fetch("/api/emergency/alarm/");
        if (res.ok) {
          const data = await res.json();
          if (data && data.active_alarm && data.active_alarm.is_active) {
            setActiveEmergencyAlarm(data.active_alarm);
            return;
          }
        }
      } catch (e) {}

      try {
        const raw = localStorage.getItem("cems_active_emergency_alarm");
        if (raw) {
          const parsed = JSON.parse(raw);
          if (parsed && parsed.location) {
            setActiveEmergencyAlarm(parsed);
            return;
          }
        }
      } catch (e) {}

      setActiveEmergencyAlarm(null);
    };

    checkAlarm();
    const interval = setInterval(checkAlarm, 2500);

    let bc = null;
    if (window.BroadcastChannel) {
      bc = new BroadcastChannel("cems_emergency_channel");
      bc.onmessage = (ev) => {
        if (ev.data?.type === "EMERGENCY_ALARM_TRIGGERED") {
          setActiveEmergencyAlarm(ev.data.data);
        } else if (ev.data?.type === "EMERGENCY_ALARM_DEACTIVATED") {
          setActiveEmergencyAlarm(null);
        }
      };
    }

    return () => {
      clearInterval(interval);
      if (bc) bc.close();
    };
  }, []);

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
    localStorage.removeItem("cems_refresh");
    localStorage.removeItem("cems_shared_bookings");
    setAccessToken("");
    setUserName("");
    setView("login");
  };

  /* ══════════════════════════════════════════
     PUBLIC PAGES  (login / register)
     Only the login / registration interface is visible when opening the website
  ══════════════════════════════════════════ */
  if (view === "login" || view === "register") {
    return (
      <div style={{ minHeight: "100vh", position: "relative" }}>
        {/* ── College Emergency Panic Siren Banner on Public Pages ── */}
        {activeEmergencyAlarm && (
          <div style={{
            background: "linear-gradient(90deg, #991B1B 0%, #DC2626 50%, #991B1B 100%)",
            color: "#FFFFFF",
            padding: "10px 24px",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            boxShadow: "0 4px 20px rgba(220, 38, 38, 0.6)",
            zIndex: 100,
            animation: "emergencyTopBarPulse 1.2s infinite alternate",
          }}>
            <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
              <div style={{ animation: "sirenSpin 1.4s infinite", display: "flex", alignItems: "center" }}>
                <SirenBeaconIcon size={28} color="#FFFFFF" />
              </div>
              <div>
                <div style={{ fontSize: 13, fontWeight: 900, letterSpacing: "0.02em" }}>
                  CRITICAL CAMPUS EMERGENCY: Person at <u>{activeEmergencyAlarm.location}</u> needs immediate help!
                </div>
                <div style={{ fontSize: 11, color: "#FEE2E2", marginTop: 2 }}>
                  Reported by: <strong>{activeEmergencyAlarm.caller_name || "Campus Member"}</strong> · {activeEmergencyAlarm.created_at || "Just now"}
                  {activeEmergencyAlarm.phone ? ` · Phone: ${activeEmergencyAlarm.phone}` : ""}
                </div>
              </div>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <button
                type="button"
                onClick={() => setShowAlarmDetailModal(true)}
                style={{
                  background: "#FFFFFF", color: "#DC2626", border: "none",
                  borderRadius: 8, padding: "7px 14px", fontWeight: 800, fontSize: 12, cursor: "pointer",
                  boxShadow: "0 2px 8px rgba(0,0,0,0.2)",
                }}
              >
                📍 View Live Location & Siren Map
              </button>
              <button
                type="button"
                onClick={async () => {
                  setActiveEmergencyAlarm(null);
                  try {
                    await fetch("/api/emergency/alarm/", {
                      method: "POST",
                      headers: { "Content-Type": "application/json" },
                      body: JSON.stringify({ action: "deactivate" }),
                    });
                    localStorage.removeItem("cems_active_emergency_alarm");
                    if (window.BroadcastChannel) {
                      const bc = new BroadcastChannel("cems_emergency_channel");
                      bc.postMessage({ type: "EMERGENCY_ALARM_DEACTIVATED" });
                      bc.close();
                    }
                  } catch (e) {}
                }}
                style={{
                  background: "rgba(255,255,255,0.2)",
                  color: "#FFFFFF",
                  border: "1px solid rgba(255,255,255,0.4)",
                  borderRadius: 8,
                  padding: "7px 12px",
                  fontWeight: 700,
                  fontSize: 12,
                  cursor: "pointer",
                }}
              >
                Dismiss
              </button>
            </div>
          </div>
        )}

        <Navbar
          view={view}
          onNav={(v) => { setView(v); setEmergencyModalOpen(false); }}
          onEmergency={() => { setView("login"); setEmergencyModalOpen(true); }}
        />
        {view === "login" && (
          <LoginPage
            initialEmergency={emergencyModalOpen}
            onGoRegister={() => { setView("register"); setEmergencyModalOpen(false); }}
            onLoggedIn={handleLoggedIn}
          />
        )}
        {view === "register" && (
          <RegisterPage
            onGoLogin={() => { setView("login"); setEmergencyModalOpen(false); }}
          />
        )}

        {showAlarmDetailModal && (
          <EmergencySirenModal
            onClose={() => setShowAlarmDetailModal(false)}
            callerDefaultName={userName || "Campus Member"}
          />
        )}

        {/* ── Emergency Alert Pop-up on Public Pages ── */}
        {activeEmergencyAlarm && activeEmergencyAlarm.id !== dismissedAlarmId && !showAlarmDetailModal && (
          <EmergencyAlertPopup
            alarm={activeEmergencyAlarm}
            onDismiss={() => setDismissedAlarmId(activeEmergencyAlarm.id)}
          />
        )}

        {/* ── Global 1-Tap Mobile Emergency Dock & PWA Installer (Public View) ── */}
        <GlobalEmergencyDock
          onTriggerSiren={() => setGlobalSirenOpen(true)}
          onTriggerSos={() => setGlobalSosOpen(true)}
          activeAlarm={activeEmergencyAlarm}
        />

        {globalSirenOpen && (
          <EmergencySirenModal
            onClose={() => setGlobalSirenOpen(false)}
            callerDefaultName={userName || "Campus Visitor / Student"}
          />
        )}

        {globalSosOpen && (
          <div
            style={{
              position: "fixed",
              inset: 0,
              background: "rgba(15, 23, 42, 0.78)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              zIndex: 99999,
              padding: "16px",
              backdropFilter: "blur(8px)",
              WebkitBackdropFilter: "blur(8px)",
            }}
          >
            <div
              style={{
                width: "min(540px, 100%)",
                maxHeight: "94vh",
                overflowY: "auto",
                borderRadius: "18px",
                overflow: "hidden",
                boxShadow: "0 24px 60px rgba(0,0,0,0.35)",
              }}
            >
              <MedicalModule
                emergencyMode
                onSuccess={(data) => {
                  setGlobalSosOpen(false);
                  handleLoggedIn(data, true);
                }}
                onClose={() => setGlobalSosOpen(false)}
              />
            </div>
          </div>
        )}
      </div>
    );
  }

  /* ══════════════════════════════════════════
     DASHBOARD
  ══════════════════════════════════════════ */
  return (
    <div style={{
      minHeight: "100vh", display: "flex", flexDirection: "column",
      background: "#F0FDF4",
    }}>
      <Toast message={broadcastMessage} type="warning" visible={!!broadcastMessage} onClose={() => setBroadcastMessage("")} />

      {/* ── College Emergency Panic Siren Banner in Dashboard ── */}
      {activeEmergencyAlarm && (
        <div style={{
          background: "linear-gradient(90deg, #991B1B 0%, #DC2626 50%, #991B1B 100%)",
          color: "#FFFFFF",
          padding: "10px 24px",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          boxShadow: "0 4px 20px rgba(220, 38, 38, 0.6)",
          zIndex: 100,
          animation: "emergencyTopBarPulse 1.2s infinite alternate",
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <div style={{ animation: "sirenSpin 1.4s infinite", display: "flex", alignItems: "center" }}>
              <SirenBeaconIcon size={28} color="#FFFFFF" />
            </div>
            <div>
              <div style={{ fontSize: 13, fontWeight: 900, letterSpacing: "0.02em" }}>
                CRITICAL CAMPUS EMERGENCY: Person at <u>{activeEmergencyAlarm.location}</u> needs immediate help!
              </div>
              <div style={{ fontSize: 11, color: "#FEE2E2", marginTop: 2 }}>
                Reported by: <strong>{activeEmergencyAlarm.caller_name || "Campus Member"}</strong> · {activeEmergencyAlarm.created_at || "Just now"}
                {activeEmergencyAlarm.phone ? ` · Phone: ${activeEmergencyAlarm.phone}` : ""}
              </div>
            </div>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <button
              type="button"
              onClick={() => setShowAlarmDetailModal(true)}
              style={{
                background: "#FFFFFF", color: "#DC2626", border: "none",
                borderRadius: 8, padding: "7px 14px", fontWeight: 800, fontSize: 12, cursor: "pointer",
                boxShadow: "0 2px 8px rgba(0,0,0,0.2)",
              }}
            >
              📍 View Live Location & Siren Map
            </button>
            <button
              type="button"
              onClick={async () => {
                setActiveEmergencyAlarm(null);
                try {
                  await fetch("/api/emergency/alarm/", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ action: "deactivate" }),
                  });
                  localStorage.removeItem("cems_active_emergency_alarm");
                  if (window.BroadcastChannel) {
                    const bc = new BroadcastChannel("cems_emergency_channel");
                    bc.postMessage({ type: "EMERGENCY_ALARM_DEACTIVATED" });
                    bc.close();
                  }
                } catch (e) {}
              }}
              style={{
                background: "rgba(255,255,255,0.2)",
                color: "#FFFFFF",
                border: "1px solid rgba(255,255,255,0.4)",
                borderRadius: 8,
                padding: "7px 12px",
                fontWeight: 700,
                fontSize: 12,
                cursor: "pointer",
              }}
            >
              Dismiss
            </button>
          </div>
        </div>
      )}

      {/* ── top navbar ── */}
      <header style={{
        background: "#FFFFFF",
        display: "flex", alignItems: "center", justifyContent: "space-between",
        padding: "0 24px", height: 60,
        boxShadow: "0 2px 16px rgba(5, 150, 105, 0.08)",
        position: "sticky", top: 0, zIndex: 20,
        borderBottom: "1.5px solid #A7F3D0",
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <div style={{
            width: 34, height: 34, borderRadius: 8,
            background: "linear-gradient(135deg, #059669 0%, #047857 100%)",
            display: "flex", alignItems: "center", justifyContent: "center",
            color: "#FFFFFF",
            boxShadow: "0 2px 8px rgba(5, 150, 105, 0.25)",
            flexShrink: 0
          }}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M22 10v6M2 10l10-5 10 5-10 5z"/>
              <path d="M6 12v5c3 3 9 3 12 0v-5"/>
            </svg>
          </div>
          <div>
            <div style={{
              fontSize: 17, fontWeight: 800,
              color: "#065F46", letterSpacing: "-0.01em", display: "flex", alignItems: "center", gap: 8
            }}>
              <span>CEMS</span>
            </div>
            <div style={{
              fontSize: 9, color: "#059669", letterSpacing: "0.12em", fontWeight: 700
            }}>
              CAMPUS EVENT MANAGEMENT
            </div>
          </div>
        </div>

        {/* Quick Emergency SOS & Sign out */}
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <button
            type="button"
            onClick={() => setShowAlarmDetailModal(true)}
            style={{
              background: "#FEF2F2",
              border: "1.5px solid #FCA5A5",
              color: "#DC2626",
              fontSize: 12,
              padding: "7px 16px",
              borderRadius: 9999,
              cursor: "pointer",
              fontWeight: 800,
              display: "flex",
              alignItems: "center",
              gap: 6,
              transition: "all 0.2s ease",
            }}
          >
            <SirenBeaconIcon size={14} color="#DC2626" />
            Emergency SOS
          </button>

          <button onClick={handleSignOut}
            style={{
              background: "#F0FDF4",
              border: "1.5px solid #A7F3D0",
              color: "#065F46", fontSize: 12, padding: "7px 16px", borderRadius: 9999,
              cursor: "pointer", fontWeight: 700,
              display: "flex", alignItems: "center", gap: 6,
              transition: "all 0.2s ease",
            }}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none"
              stroke="#065F46" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/>
              <polyline points="16 17 21 12 16 7"/>
              <line x1="21" y1="12" x2="9" y2="12"/>
            </svg>
            Sign out
          </button>
        </div>
      </header>

      {/* ── Mobile Horizontal Module Navigation (Visible only on mobile/tablet) ── */}
      <div className="cems-mobile-nav-strip">
        {modules.map((m) => {
          const active = current === m;
          return (
            <button
              key={m}
              type="button"
              onClick={() => setActiveModule(m)}
              className={`cems-mobile-tab-btn ${active ? "active" : ""}`}
            >
              <ModuleIcon name={m} active={active} />
              <span>{moduleLabels[m]}</span>
            </button>
          );
        })}
      </div>

      <div style={{ display: "flex", flex: 1, minHeight: 0 }}>

        {/* ── sidebar ── */}
        <aside className="dashboard-sidebar" style={{
          background: "#FFFFFF",
          width: 240, flexShrink: 0, padding: "20px 14px",
          borderRight: "1.5px solid #A7F3D0",
          display: "flex", flexDirection: "column", gap: 0,
          overflowY: "auto",
        }}>

          {/* modules label */}
          <div style={{
            fontSize: 10, color: "#059669", letterSpacing: "0.1em",
            textTransform: "uppercase", marginBottom: 10, paddingLeft: 12, fontWeight: 800,
          }}>
            Modules
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 3 }}>
            {modules.map((m) => {
              const active = current === m;
              return (
                <button key={m} onClick={() => setActiveModule(m)}
                  style={{
                    textAlign: "left", padding: "10px 12px", borderRadius: 10,
                    border: active ? "1.5px solid #A7F3D0" : "1.5px solid transparent",
                    cursor: "pointer", fontSize: 13,
                    fontWeight: active ? 800 : 600,
                    background: active
                      ? "#DCFCE7"
                      : "transparent",
                    color: active ? "#064E3B" : "#065F46",
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
          <div
            onClick={() => setActiveModule("profile")}
            title="Click to view My Profile"
            style={{
              marginTop: "auto", paddingTop: 16,
              borderTop: "1.5px solid #A7F3D0",
              paddingLeft: 12, paddingRight: 8, paddingBottom: 8,
              cursor: "pointer", borderRadius: 10,
              transition: "background 0.2s ease",
            }}
            onMouseEnter={(e) => e.currentTarget.style.background = "#F0FDF4"}
            onMouseLeave={(e) => e.currentTarget.style.background = "transparent"}
          >
            <div style={{ fontSize: 10, color: "#059669", marginBottom: 6, fontWeight: 700, display: "flex", justifyContent: "space-between" }}>
              <span>Signed in as</span>
              <span style={{ fontSize: 9, color: "#065F46", fontWeight: 700 }}>View Profile →</span>
            </div>
            <div style={{
              display: "flex", alignItems: "center", gap: 10,
            }}>
              <div style={{
                width: 32, height: 32, borderRadius: 8,
                background: "linear-gradient(135deg, #10B981, #059669)",
                display: "flex", alignItems: "center", justifyContent: "center",
                color: "#FFFFFF", fontSize: 13, fontWeight: 800, flexShrink: 0,
              }}>
                {(userName || roles.find(r => r.id === role)?.label || "U").charAt(0).toUpperCase()}
              </div>
              <div style={{ minWidth: 0 }}>
                <div style={{
                  color: "#064E3B", fontWeight: 700, fontSize: 13,
                  whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis",
                }}>
                  {role === "canteen" ? (userName ? `${userName}` : "Neethu") : (userName || roles.find(r => r.id === role)?.label)}
                </div>
                <div style={{ color: "#059669", fontSize: 10, fontWeight: 600 }}>
                  {roleLabelsClean[role] || roles.find(r => r.id === role)?.label}
                </div>
              </div>
            </div>
          </div>
        </aside>

        {/* ── main content ── */}
        <main className="dashboard-main" style={{
          flex: 1, padding: "28px 36px", overflowY: "auto",
          background: "#F0FDF4",
        }}>

          {/* page header */}
          <div style={{
            marginBottom: 28, paddingBottom: 18,
            borderBottom: "1.5px solid #A7F3D0",
            animation: "fadeIn 0.3s ease",
          }}>
            <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
              <PageHeaderIcon name={current} />
              <div>
                <h1 style={{
                  margin: 0, fontSize: 22,
                  fontWeight: 800, color: "#064E3B", letterSpacing: "-0.02em",
                }}>
                  {moduleLabels[current]}
                </h1>
                <div style={{ fontSize: 13, color: "#059669", marginTop: 3 }}>
                  {roleLabelsClean[role] || roles.find(r => r.id === role)?.label} dashboard
                </div>
              </div>
            </div>
          </div>

          {/* module content */}
          <div style={{ animation: "slideUp 0.3s cubic-bezier(0.4, 0, 0.2, 1)" }}>
            {current === "register"  && <RegistrationModule />}
            {current === "booking"   && <BookingModule role={role} userName={userName} />}
            {current === "refund"    && <RefundModule role={role} />}
            {current === "rebook"    && <RebookModule role={role} userName={userName} accessToken={accessToken} />}
            {current === "medical"   && <MedicalModule role={role} accessToken={accessToken} userName={userName} />}
            {current === "complaint" && <ComplaintModule role={role} />}
            {current === "ledger"    && <LedgerModule />}
            {current === "lostfound" && <LostFoundModule role={role} />}
            {current === "access"    && <AccessModule accessToken={accessToken} />}
            {current === "canteen"   && <CanteenModule userName={userName} />}
            {current === "warden"    && <WardenModule userName={userName} />}
            {current === "profile"   && (
              <MyProfileModule
                accessToken={accessToken}
                onUserUpdated={(u) => {
                  if (u) {
                    const name = `${u.first_name || ""} ${u.last_name || ""}`.trim() || u.username;
                    setUserName(name);
                  }
                }}
              />
            )}
          </div>
        </main>
      </div>

      {showAlarmDetailModal && (
        <EmergencySirenModal
          onClose={() => setShowAlarmDetailModal(false)}
          callerDefaultName={userName || "Campus Member"}
        />
      )}

      {/* ── Emergency Alert Pop-up with Live Location & Sound for all registered people ── */}
      {activeEmergencyAlarm && activeEmergencyAlarm.id !== dismissedAlarmId && !showAlarmDetailModal && (
        <EmergencyAlertPopup
          alarm={activeEmergencyAlarm}
          onDismiss={() => setDismissedAlarmId(activeEmergencyAlarm.id)}
        />
      )}

      {/* ── Global 1-Tap Mobile Emergency Dock & PWA Installer (Dashboard View) ── */}
      <GlobalEmergencyDock
        onTriggerSiren={() => setGlobalSirenOpen(true)}
        onTriggerSos={() => setGlobalSosOpen(true)}
        activeAlarm={activeEmergencyAlarm}
      />

      {globalSirenOpen && (
        <EmergencySirenModal
          onClose={() => setGlobalSirenOpen(false)}
          callerDefaultName={userName || "Campus Member"}
        />
      )}

      {globalSosOpen && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(15, 23, 42, 0.78)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 99999,
            padding: "16px",
            backdropFilter: "blur(8px)",
            WebkitBackdropFilter: "blur(8px)",
          }}
        >
          <div
            style={{
              width: "min(540px, 100%)",
              maxHeight: "94vh",
              overflowY: "auto",
              borderRadius: "18px",
              overflow: "hidden",
              boxShadow: "0 24px 60px rgba(0,0,0,0.35)",
            }}
          >
            <MedicalModule
              emergencyMode
              onClose={() => setGlobalSosOpen(false)}
            />
          </div>
        </div>
      )}
    </div>
  );
}

