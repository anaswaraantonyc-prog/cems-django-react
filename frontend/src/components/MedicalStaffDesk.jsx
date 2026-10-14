import { useState, useEffect, useCallback } from "react";
import { WhatsAppIcon, openWhatsApp } from "../modules/MedicalModule";
import EmergencySirenModal, { SirenBeaconIcon } from "./EmergencySirenModal";

function extractPatientCondition(notes) {
  if (!notes) return "Medical assistance requested";
  if (notes.includes(" | ")) {
    const parts = notes.split(" | ");
    return parts[parts.length - 1] || notes;
  }
  return notes;
}

// ── Small Box for Other Users (Principal, Admin, etc. without Medical Staff) ──
function PatientAlertSmallBox({ alert, isHandled }) {
  const callerPhone = alert.contact_phone || "";
  const callerName = alert.unit_number && alert.society_name
    ? `Unit ${alert.unit_number} (${alert.society_name})`
    : alert.society_name || alert.caller_name || (alert.unit_number ? `Unit ${alert.unit_number}` : "Campus Member");
  const locationStr = alert.location_display || (alert.unit_number ? `Unit/Flat ${alert.unit_number}${alert.society_name ? `, ${alert.society_name}` : ""}` : "Campus Premises");
  const conditionStr = extractPatientCondition(alert.notes);

  return (
    <div
      style={{
        background: "#FFFFFF",
        border: isHandled ? "1.5px solid #86EFAC" : "1.5px solid #FCA5A5",
        borderRadius: 12,
        padding: "14px 18px",
        boxShadow: isHandled
          ? "0 2px 8px rgba(5, 150, 105, 0.06)"
          : "0 2px 10px rgba(220, 38, 38, 0.08)",
        display: "flex",
        flexDirection: "column",
        gap: 10,
        transition: "all 0.15s ease",
      }}
    >
      {/* ── Top Row: Category & Timing ── */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 8 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <span style={{ fontSize: 13, fontWeight: 900, color: isHandled ? "#065F46" : "#DC2626" }}>
            🚨 {alert.alert_type === "EMERGENCY_SIREN" || alert.alert_type === "LOGIN_PAGE_ANONYMOUS_SOS" || (alert.notes && alert.notes.toLowerCase().includes("siren"))
              ? "EMERGENCY SIREN"
              : alert.emergency_type || alert.alert_type || "MEDICAL"}
          </span>
          <span
            style={{
              fontSize: 10,
              fontWeight: 800,
              padding: "2px 8px",
              borderRadius: 12,
              background: isHandled ? "#DCFCE7" : "#FEE2E2",
              color: isHandled ? "#166534" : "#DC2626",
              textTransform: "uppercase",
            }}
          >
            {isHandled ? "✓ Attended" : "⏳ Pending Staff"}
          </span>
        </div>

        {/* Timing */}
        <div style={{ fontSize: 11.5, color: "#475569", fontWeight: 700, display: "flex", alignItems: "center", gap: 4 }}>
          <span>⏰ Timing:</span>
          <strong style={{ color: "#0F172A" }}>{alert.created_at}</strong>
        </div>
      </div>

      {/* ── Small Grid Box: Patient Details & Location ── */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
          gap: 10,
          background: "#F8FAFC",
          borderRadius: 8,
          padding: "10px 14px",
          border: "1px solid #E2E8F0",
        }}
      >
        {/* Person Details */}
        <div>
          <div style={{ fontSize: 10, fontWeight: 800, color: "#64748B", textTransform: "uppercase", letterSpacing: "0.04em" }}>
            👤 Person Details
          </div>
          <div style={{ fontSize: 13, fontWeight: 800, color: "#0F172A", marginTop: 2 }}>
            {callerName}
          </div>
          {callerPhone && (
            <div style={{ fontSize: 11.5, fontWeight: 700, color: "#065F46", marginTop: 3, display: "flex", alignItems: "center", gap: 6 }}>
              <span>📞 {callerPhone}</span>
              <button
                type="button"
                onClick={() => openWhatsApp(callerPhone, callerName)}
                style={{
                  background: "#25D366",
                  color: "#FFFFFF",
                  border: "none",
                  borderRadius: 4,
                  padding: "2px 7px",
                  fontSize: 10,
                  fontWeight: 700,
                  cursor: "pointer",
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 3,
                }}
              >
                WhatsApp
              </button>
            </div>
          )}
        </div>

        {/* Location */}
        <div>
          <div style={{ fontSize: 10, fontWeight: 800, color: "#64748B", textTransform: "uppercase", letterSpacing: "0.04em" }}>
            📍 Location
          </div>
          <div style={{ fontSize: 12.5, fontWeight: 700, color: "#1E293B", marginTop: 2 }}>
            {locationStr}
          </div>
          {alert.maps_url && (
            <a
              href={alert.maps_url}
              target="_blank"
              rel="noopener noreferrer"
              style={{ fontSize: 11, color: "#2563EB", fontWeight: 700, textDecoration: "underline", display: "inline-block", marginTop: 2 }}
            >
              [View Maps Pin]
            </a>
          )}
        </div>
      </div>

      {/* Condition / Message */}
      <div style={{ fontSize: 12, color: "#334155", lineHeight: 1.4, background: "#FFFBEB", border: "1px solid #FDE68A", borderRadius: 8, padding: "8px 12px" }}>
        <strong style={{ color: "#92400E" }}>📋 Condition:</strong>{" "}
        <span style={{ color: "#78350F", fontWeight: 600 }}>{conditionStr}</span>
      </div>

      {/* Medical Staff Note if replied */}
      {alert.responder_notes && (
        <div style={{ fontSize: 11.5, background: "#F0FDF4", border: "1px solid #86EFAC", borderRadius: 6, padding: "6px 10px", color: "#166534", fontWeight: 600 }}>
          ✓ <strong>Medical Staff Note:</strong> "{alert.responder_notes}"
        </div>
      )}
    </div>
  );
}

export default function MedicalStaffDesk({ accessToken, userName = "Josmy Jose", role = "" }) {
  let resolvedRole = (role || "").toLowerCase().replace(/_/g, "");
  if (!resolvedRole) {
    try {
      const storedToken = accessToken || localStorage.getItem("cems_access") || "";
      if (storedToken && storedToken.includes(".")) {
        const payload = JSON.parse(atob(storedToken.split(".")[1]));
        resolvedRole = (payload.role || "").toLowerCase().replace(/_/g, "");
      }
    } catch {}
  }
  const isMedicalStaff = resolvedRole === "medicalstaff";
  const [alerts, setAlerts] = useState([]);
  const [callLogs, setCallLogs] = useState([]);
  const [loadingAlerts, setLoadingAlerts] = useState(false);
  const [loadingLogs, setLoadingLogs] = useState(false);
  const [actionInProgress, setActionInProgress] = useState({});
  const [replyOpen, setReplyOpen] = useState({});
  const [replyText, setReplyText] = useState({});
  const [searchQuery, setSearchQuery] = useState("");
  const [activeTab, setActiveTab] = useState("pending"); // "pending" | "handled" | "history" | "sos"

  // ── Principal / Executive SOS System States ──
  const [showSosModal, setShowSosModal] = useState(false);
  const [sosLocation, setSosLocation] = useState("Principal Office - Administrative Block");
  const [sosNotes, setSosNotes] = useState("");
  const [sosPhone, setSosPhone] = useState("9987766898");
  const [sosEmergencyType, setSosEmergencyType] = useState("MEDICAL");
  const [sosSending, setSosSending] = useState(false);
  const [sosSuccess, setSosSuccess] = useState(null);
  const [sirenTriggering, setSirenTriggering] = useState(false);
  const [sirenSuccess, setSirenSuccess] = useState(false);

  const token = accessToken || localStorage.getItem("cems_access") || "";

  // ── Trigger Campus-Wide Emergency Panic Siren ──
  const handleTriggerSirenAlarm = async () => {
    setSirenTriggering(true);
    try {
      const res = await fetch("/api/emergency/alarm/", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({
          action: "trigger",
          caller_name: userName ? `Principal (${userName})` : "Principal",
          location: sosLocation || "Principal Office - Administrative Block",
          notes: sosNotes || "Emergency panic siren initiated by Principal. Immediate response required!",
          phone: sosPhone || "9987766898",
        }),
      });
      if (res.ok) {
        const data = await res.json();
        setSirenSuccess(true);
        if (window.BroadcastChannel) {
          const bc = new BroadcastChannel("cems_emergency_channel");
          bc.postMessage({ type: "EMERGENCY_ALARM_TRIGGERED", data: data.alarm });
          bc.close();
        }
        await fetchAlerts();
      }
    } catch (e) {
      console.warn("Error triggering siren alarm:", e);
    } finally {
      setSirenTriggering(false);
    }
  };

  // ── Submit Urgent Medical Dispatch Request ──
  const handleSubmitSosDispatch = async (e) => {
    if (e) e.preventDefault();
    setSosSending(true);
    try {
      const res = await fetch("/api/emergency/public-sos/", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({
          contact_phone: sosPhone || "9987766898",
          unit_number: sosLocation || "Principal Office - Administrative Block",
          society_name: userName || "Principal",
          emergency_type: sosEmergencyType || "MEDICAL",
          notes: `[EMERGENCY FROM PRINCIPAL DESK] ${sosNotes || "Immediate medical attention requested in Principal Office."}`,
        }),
      });
      const data = await res.json();
      setSosSuccess(data);
      await fetchAlerts();
      await fetchCallLogs();
    } catch (err) {
      console.warn("Error submitting SOS dispatch:", err);
    } finally {
      setSosSending(false);
    }
  };

  // ── Fetch active and recent emergency alerts ──
  const fetchAlerts = useCallback(async () => {
    if (!token) return;
    try {
      setLoadingAlerts(true);
      const res = await fetch("/api/emergency/responder/alerts/", {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });
      if (res.ok) {
        const data = await res.json();
        setAlerts(data.alerts || []);
      }
    } catch (e) {
      console.warn("Error fetching responder emergency alerts:", e);
    } finally {
      setLoadingAlerts(false);
    }
  }, [token]);

  // ── Fetch all emergency call & access logs ──
  const fetchCallLogs = useCallback(async () => {
    if (!token) return;
    try {
      setLoadingLogs(true);
      const res = await fetch("/api/emergency/logs/", {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });
      if (res.ok) {
        const data = await res.json();
        const list = Array.isArray(data) ? data : (data.results || []);
        setCallLogs(list);
      }
    } catch (e) {
      console.warn("Error fetching emergency logs:", e);
    } finally {
      setLoadingLogs(false);
    }
  }, [token]);

  useEffect(() => {
    fetchAlerts();
    fetchCallLogs();
    const interval = setInterval(() => {
      fetchAlerts();
    }, 4000);
    return () => clearInterval(interval);
  }, [fetchAlerts, fetchCallLogs]);

  // ── Handle Accept, Reply, and Resolve actions ──
  const handleAction = async (alertId, actionName, note = "") => {
    setActionInProgress((prev) => ({ ...prev, [alertId]: actionName }));
    try {
      const payload = { action: actionName };
      if (note) payload.notes = note;

      const res = await fetch(`/api/emergency/responder/alerts/${alertId}/action/`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });
      if (res.ok) {
        await fetchAlerts();
        await fetchCallLogs();
        if (actionName === "reply") {
          setReplyOpen((prev) => ({ ...prev, [alertId]: false }));
          setReplyText((prev) => ({ ...prev, [alertId]: "" }));
        }
      }
    } catch (e) {
      console.warn(`Error updating alert ${alertId} with action ${actionName}:`, e);
    } finally {
      setActionInProgress((prev) => {
        const copy = { ...prev };
        delete copy[alertId];
        return copy;
      });
    }
  };

  // ── Separate Alerts: PENDING vs ACCEPTED/REPLIED ──
  const pendingAlerts = alerts.filter((a) => {
    const s = (a.status || "").toLowerCase();
    const isHandled =
      s === "acknowledged" ||
      s === "responding" ||
      s === "resolved" ||
      s === "cancelled" ||
      Boolean(a.responder_notes);
    return !isHandled;
  });

  const handledAlerts = alerts.filter((a) => {
    const s = (a.status || "").toLowerCase();
    return (
      s === "acknowledged" ||
      s === "responding" ||
      s === "resolved" ||
      s === "cancelled" ||
      Boolean(a.responder_notes)
    );
  });

  // Filter call logs by search query
  const filteredLogs = callLogs.filter((log) => {
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    const userStr = typeof log.user === "string" ? log.user : (log.user?.username || log.user?.name || "");
    const notesStr = log.notes || "";
    const idStr = log.scanned_id_year || log.scanned_id_number || "";
    return userStr.toLowerCase().includes(q) || notesStr.toLowerCase().includes(q) || idStr.toLowerCase().includes(q);
  });

  // ── NON-MEDICAL STAFF VIEW (Faculty, Hostel Warden, Class Rep, Canteen Staff, Principal, Admin) ──
  // Display ONLY the small box with person details, location, and timing.
  // NO fields / tabs, NO responder action buttons!
  if (!isMedicalStaff) {
    const roleTitles = {
      faculty: "Faculty",
      warden: "Hostel Warden",
      class_rep: "Class Representative",
      canteen: "Canteen Staff",
      principal: "Principal",
      admin: "Admin",
      student: "Student",
    };
    const currentRoleName = roleTitles[(role || "").toLowerCase()] || roleTitles[(role || "").toLowerCase().replace(/_/g, "")] || "Campus Staff";

    return (
      <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
        {/* Top Header */}
        <div
          style={{
            background: "linear-gradient(135deg, #065F46 0%, #047857 50%, #059669 100%)",
            borderRadius: 14,
            padding: "16px 22px",
            color: "#FFFFFF",
            boxShadow: "0 4px 16px rgba(5, 150, 105, 0.15)",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            flexWrap: "wrap",
            gap: 12,
          }}
        >
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <span style={{ fontSize: 24 }}>🚨</span>
              <h2 style={{ margin: 0, fontSize: 18, fontWeight: 900, color: "#FFFFFF" }}>
                Emergency Siren &amp; Alert History
              </h2>
            </div>
            <p style={{ margin: "4px 0 0 0", fontSize: 12.5, color: "#D1FAE5" }}>
              Live Emergency Siren &amp; Location History &bull; {currentRoleName} Desk ({userName || "Staff Member"})
            </p>
          </div>

          <button
            type="button"
            onClick={() => {
              fetchAlerts();
              fetchCallLogs();
            }}
            style={{
              background: "#FFFFFF",
              color: "#065F46",
              border: "none",
              borderRadius: 20,
              padding: "6px 16px",
              fontSize: 12,
              fontWeight: 800,
              cursor: "pointer",
            }}
          >
            ↻ Refresh
          </button>
        </div>

        {/* Small Box Alerts Only — No tabs, No fields, No medical responder buttons */}
        {loadingAlerts ? (
          <div style={{ textAlign: "center", padding: "30px 0", color: "#065F46", fontSize: 13 }}>
            Loading emergency alerts…
          </div>
        ) : alerts.length === 0 ? (
          <div
            style={{
              background: "#FFFFFF",
              border: "1.5px dashed #A7F3D0",
              borderRadius: 12,
              padding: "32px 20px",
              textAlign: "center",
              color: "#065F46",
            }}
          >
            <div style={{ fontSize: 32, marginBottom: 6 }}>✅</div>
            <div style={{ fontSize: 15, fontWeight: 800, color: "#065F46" }}>
              No Active Emergencies
            </div>
            <div style={{ fontSize: 12.5, color: "#059669", marginTop: 4 }}>
              All emergency calls and requests are clear.
            </div>
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            {alerts.map((alert) => {
              const isHandled =
                (alert.status || "").toLowerCase() !== "pending" &&
                (alert.status || "").toLowerCase() !== "open";
              return (
                <PatientAlertSmallBox
                  key={alert.alert_id}
                  alert={alert}
                  isHandled={isHandled}
                />
              );
            })}
          </div>
        )}
      </div>
    );
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
      {/* ── Top Header Banner (White & Light Green Aesthetics) ── */}
      <div
        style={{
          background: "linear-gradient(135deg, #065F46 0%, #047857 50%, #059669 100%)",
          borderRadius: 16,
          padding: "22px 28px",
          color: "#FFFFFF",
          boxShadow: "0 6px 20px rgba(5, 150, 105, 0.18)",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          flexWrap: "wrap",
          gap: 16,
        }}
      >
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <span style={{ fontSize: 28 }}>🏥</span>
            <h2 style={{ margin: 0, fontSize: 22, fontWeight: 900, color: "#FFFFFF", letterSpacing: "-0.01em" }}>
              Medical Rapid Access System
            </h2>
          </div>
          <p style={{ margin: "6px 0 0 0", fontSize: 13, color: "#D1FAE5", fontWeight: 500 }}>
            Live Emergency Calls, Incoming Messages &amp; Dispatch Desk
          </p>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: 12, flexWrap: "wrap" }}>
          <div
            style={{
              background: "rgba(255, 255, 255, 0.18)",
              border: "1.5px solid rgba(255, 255, 255, 0.4)",
              borderRadius: 30,
              padding: "6px 16px",
              display: "flex",
              alignItems: "center",
              gap: 8,
              fontSize: 12,
              fontWeight: 800,
              color: "#FFFFFF",
            }}
          >
            <span
              style={{
                width: 10,
                height: 10,
                borderRadius: "50%",
                background: "#34D399",
                boxShadow: "0 0 10px #34D399",
                display: "inline-block",
              }}
            />
            {role === "principal"
              ? `Principal Desk (${userName || "Principal"})`
              : role === "admin"
              ? `Admin Console (${userName || "Admin"})`
              : isMedicalStaff
              ? `On Duty · Medical Staff (${userName || "Josmy Jose"})`
              : `Emergency Monitor (${userName || "Campus Member"})`}
          </div>

          <button
            onClick={() => setShowSosModal(true)}
            style={{
              background: "#EF4444",
              color: "#FFFFFF",
              border: "1.5px solid #FCA5A5",
              borderRadius: 30,
              padding: "7px 18px",
              fontSize: 12,
              fontWeight: 900,
              cursor: "pointer",
              boxShadow: "0 2px 10px rgba(239, 68, 68, 0.4)",
              display: "inline-flex",
              alignItems: "center",
              gap: 6,
            }}
          >
            <SirenBeaconIcon size={14} color="#FFFFFF" />
            🚨 Trigger Emergency SOS
          </button>

          <button
            onClick={() => {
              fetchAlerts();
              fetchCallLogs();
            }}
            style={{
              background: "#FFFFFF",
              color: "#065F46",
              border: "none",
              borderRadius: 30,
              padding: "7px 18px",
              fontSize: 12,
              fontWeight: 800,
              cursor: "pointer",
              boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
              display: "inline-flex",
              alignItems: "center",
              gap: 6,
            }}
          >
            ↻ Refresh
          </button>
        </div>
      </div>

      {/* ── Field / Tab Navigation ── */}
      <div
        style={{
          display: "flex",
          gap: 12,
          borderBottom: "2px solid #A7F3D0",
          paddingBottom: 4,
          flexWrap: "wrap",
        }}
      >
        {/* FIELD 1: ONLY PENDING MESSAGES (Default Screen) */}
        <button
          onClick={() => setActiveTab("pending")}
          style={{
            background: activeTab === "pending" ? "#065F46" : "#FFFFFF",
            color: activeTab === "pending" ? "#FFFFFF" : "#065F46",
            border: "1.5px solid #A7F3D0",
            borderRadius: "10px 10px 0 0",
            padding: "11px 22px",
            fontSize: 13,
            fontWeight: 800,
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            gap: 10,
            boxShadow: activeTab === "pending" ? "0 4px 12px rgba(6, 95, 70, 0.2)" : "none",
            transition: "all 0.15s ease",
          }}
        >
          <span>⏳ Pending Messages &amp; Calls</span>
          <span
            style={{
              background: pendingAlerts.length > 0 ? "#EF4444" : "#10B981",
              color: "#FFFFFF",
              fontSize: 11,
              fontWeight: 900,
              padding: "2px 8px",
              borderRadius: 20,
            }}
          >
            {pendingAlerts.length}
          </span>
        </button>

        {/* FIELD 2: ACCEPTED & REPLIED MESSAGES (Another Field) */}
        <button
          onClick={() => setActiveTab("handled")}
          style={{
            background: activeTab === "handled" ? "#065F46" : "#FFFFFF",
            color: activeTab === "handled" ? "#FFFFFF" : "#065F46",
            border: "1.5px solid #A7F3D0",
            borderRadius: "10px 10px 0 0",
            padding: "11px 22px",
            fontSize: 13,
            fontWeight: 800,
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            gap: 10,
            boxShadow: activeTab === "handled" ? "0 4px 12px rgba(6, 95, 70, 0.2)" : "none",
            transition: "all 0.15s ease",
          }}
        >
          <span>✅ Accepted &amp; Replied Messages</span>
          <span
            style={{
              background: activeTab === "handled" ? "rgba(255,255,255,0.3)" : "#DCFCE7",
              color: activeTab === "handled" ? "#FFFFFF" : "#065F46",
              fontSize: 11,
              fontWeight: 800,
              padding: "2px 8px",
              borderRadius: 20,
            }}
          >
            {handledAlerts.length}
          </span>
        </button>

        {/* FIELD 3: ALL EMERGENCY CALL HISTORY */}
        <button
          onClick={() => setActiveTab("history")}
          style={{
            background: activeTab === "history" ? "#065F46" : "#FFFFFF",
            color: activeTab === "history" ? "#FFFFFF" : "#065F46",
            border: "1.5px solid #A7F3D0",
            borderRadius: "10px 10px 0 0",
            padding: "11px 22px",
            fontSize: 13,
            fontWeight: 800,
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            gap: 10,
            boxShadow: activeTab === "history" ? "0 4px 12px rgba(6, 95, 70, 0.2)" : "none",
            transition: "all 0.15s ease",
          }}
        >
          <span>📋 All Emergency Call History</span>
          <span
            style={{
              background: activeTab === "history" ? "rgba(255,255,255,0.3)" : "#DCFCE7",
              color: activeTab === "history" ? "#FFFFFF" : "#065F46",
              fontSize: 11,
              fontWeight: 800,
              padding: "2px 8px",
              borderRadius: 20,
            }}
          >
            {callLogs.length}
          </span>
        </button>

      </div>

      {/* ══════════════════════════════════════════════════════════
          FIELD 1: ONLY PENDING MESSAGES & CALLS
          (This screen displays ONLY unhandled pending alerts!)
      ══════════════════════════════════════════════════════════ */}
      {activeTab === "pending" && (
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          {pendingAlerts.length === 0 ? (
            <div
              style={{
                background: "#FFFFFF",
                border: "2px dashed #A7F3D0",
                borderRadius: 14,
                padding: "36px 20px",
                textAlign: "center",
                color: "#065F46",
              }}
            >
              <div style={{ fontSize: 38, marginBottom: 8 }}>✅</div>
              <h3 style={{ margin: "0 0 6px 0", fontSize: 17, fontWeight: 800, color: "#065F46" }}>
                No Pending Messages or Calls
              </h3>
              <p style={{ margin: 0, fontSize: 13, color: "#059669" }}>
                All incoming emergency requests have been accepted or replied to. Any new message sent by a user will appear right here immediately.
              </p>
            </div>
          ) : (
            pendingAlerts.map((alert) => {
              if (!isMedicalStaff) {
                return <PatientAlertSmallBox key={alert.alert_id} alert={alert} isHandled={false} />;
              }
              const isReplying = !!replyOpen[alert.alert_id];
              const callerPhone = alert.contact_phone || "";
              const callerName = alert.unit_number
                ? `Unit ${alert.unit_number} (${alert.society_name || "Campus"})`
                : alert.caller_name || "Campus Member";

              return (
                <div
                  key={alert.alert_id}
                  style={{
                    background: "#FFFFFF",
                    border: "2px solid #F87171",
                    borderRadius: 14,
                    padding: "20px 24px",
                    boxShadow: "0 4px 16px rgba(239, 68, 68, 0.15)",
                    transition: "all 0.2s ease",
                  }}
                >
                  {/* Alert Header */}
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "flex-start",
                      flexWrap: "wrap",
                      gap: 10,
                      marginBottom: 12,
                      borderBottom: "1px solid #FEE2E2",
                      paddingBottom: 10,
                    }}
                  >
                    <div>
                      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                        <span
                          style={{
                            fontFamily: "monospace",
                            fontSize: 14,
                            fontWeight: 900,
                            color: "#DC2626",
                          }}
                        >
                          🚨 {alert.alert_id}
                        </span>
                        <span
                          style={{
                            fontSize: 11,
                            fontWeight: 800,
                            padding: "3px 10px",
                            borderRadius: 20,
                            background: "#FEE2E2",
                            color: "#DC2626",
                            textTransform: "uppercase",
                          }}
                        >
                          ⏳ PENDING CALL / SOS
                        </span>
                        <span style={{ fontSize: 12, color: "#64748B", fontWeight: 600 }}>
                          Category: <strong>{alert.emergency_type || alert.alert_type}</strong>
                        </span>
                      </div>
                      <div style={{ fontSize: 11, color: "#64748B", marginTop: 4 }}>
                        Received at: <strong>{alert.created_at}</strong>
                      </div>
                    </div>

                    {alert.location_available && (
                      <span
                        style={{
                          background: "#DCFCE7",
                          color: "#15803D",
                          border: "1px solid #86EFAC",
                          fontSize: 11,
                          fontWeight: 700,
                          padding: "3px 10px",
                          borderRadius: 20,
                          display: "inline-flex",
                          alignItems: "center",
                          gap: 4,
                        }}
                      >
                        📍 Location Tagged
                      </span>
                    )}
                  </div>

                  {/* Caller Details */}
                  <div
                    style={{
                      display: "grid",
                      gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
                      gap: 12,
                      background: "#F8FAFC",
                      borderRadius: 10,
                      padding: "12px 16px",
                      marginBottom: 14,
                    }}
                  >
                    <div>
                      <div style={{ fontSize: 10, fontWeight: 800, color: "#64748B", textTransform: "uppercase" }}>
                        Caller / Resident
                      </div>
                      <div style={{ fontSize: 13, fontWeight: 800, color: "#1E293B", marginTop: 2 }}>
                        {callerName}
                      </div>
                    </div>

                    {callerPhone && (
                      <div>
                        <div style={{ fontSize: 10, fontWeight: 800, color: "#64748B", textTransform: "uppercase" }}>
                          Contact Phone
                        </div>
                        <div style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 2 }}>
                          <span style={{ fontSize: 13, fontWeight: 800, color: "#065F46" }}>
                            {callerPhone}
                          </span>
                          <button
                            type="button"
                            onClick={() => openWhatsApp(callerPhone, callerName)}
                            style={{
                              background: "#25D366",
                              color: "#FFFFFF",
                              border: "none",
                              borderRadius: 6,
                              padding: "3px 8px",
                              fontSize: 11,
                              fontWeight: 700,
                              cursor: "pointer",
                              display: "inline-flex",
                              alignItems: "center",
                              gap: 4,
                            }}
                            title="Chat or Call on WhatsApp"
                          >
                            <WhatsAppIcon size={12} color="#FFFFFF" /> WhatsApp
                          </button>
                        </div>
                      </div>
                    )}

                    <div>
                      <div style={{ fontSize: 10, fontWeight: 800, color: "#64748B", textTransform: "uppercase" }}>
                        Location
                      </div>
                      <div style={{ fontSize: 13, fontWeight: 700, color: "#1E293B", marginTop: 2 }}>
                        {alert.location_display || "Campus Premises"}
                        {alert.maps_url && (
                          <a
                            href={alert.maps_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            style={{
                              color: "#2563EB",
                              marginLeft: 8,
                              fontSize: 11,
                              fontWeight: 700,
                              textDecoration: "underline",
                            }}
                          >
                            [Maps Pin]
                          </a>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Incident Message / Notes */}
                  <div
                    style={{
                      background: "#FEF2F2",
                      border: "1.5px solid #FECACA",
                      borderRadius: 10,
                      padding: "12px 16px",
                      marginBottom: 14,
                    }}
                  >
                    <div style={{ fontSize: 11, fontWeight: 800, color: "#991B1B", textTransform: "uppercase" }}>
                      📩 User Emergency Message:
                    </div>
                    <div style={{ fontSize: 13, color: "#7F1D1D", marginTop: 4, lineHeight: 1.5, fontWeight: 700 }}>
                      {alert.notes || "Emergency SOS Triggered. Immediate medical triage requested."}
                    </div>
                  </div>

                  {/* Inline Reply Form */}
                  {isReplying && (
                    <div
                      style={{
                        background: "#EFF6FF",
                        border: "1.5px solid #93C5FD",
                        borderRadius: 10,
                        padding: "14px 16px",
                        marginBottom: 14,
                        animation: "fadeIn 0.2s ease",
                      }}
                    >
                      <div style={{ fontSize: 12, fontWeight: 800, color: "#1E40AF", marginBottom: 6 }}>
                        💬 Send Reply to Caller ({callerPhone || callerName}):
                      </div>
                      <textarea
                        rows={3}
                        placeholder={`Type a response message (e.g. "Nurse Josmy Jose has accepted your call. First aid kit on the way to ${alert.location_display || 'your location'}...")`}
                        value={replyText[alert.alert_id] || ""}
                        onChange={(e) =>
                          setReplyText((prev) => ({ ...prev, [alert.alert_id]: e.target.value }))
                        }
                        style={{
                          width: "100%",
                          boxSizing: "border-box",
                          padding: "10px",
                          borderRadius: 8,
                          border: "1.5px solid #BFDBFE",
                          fontSize: 13,
                          fontFamily: "inherit",
                          resize: "vertical",
                        }}
                      />
                      <div style={{ display: "flex", gap: 10, marginTop: 10, flexWrap: "wrap", alignItems: "center" }}>
                        <button
                          type="button"
                          disabled={actionInProgress[alert.alert_id] === "reply"}
                          onClick={() =>
                            handleAction(
                              alert.alert_id,
                              "reply",
                              replyText[alert.alert_id] || `Attended by ${userName}`
                            )
                          }
                          style={{
                            background: "#2563EB",
                            color: "#FFFFFF",
                            border: "none",
                            borderRadius: 8,
                            padding: "8px 16px",
                            fontSize: 12,
                            fontWeight: 800,
                            cursor: "pointer",
                          }}
                        >
                          {actionInProgress[alert.alert_id] === "reply" ? "Sending…" : "✓ Send Reply Note"}
                        </button>

                        {callerPhone && (
                          <button
                            type="button"
                            onClick={() => {
                              const msg = encodeURIComponent(
                                replyText[alert.alert_id] ||
                                  `Hello, this is Medical Staff (${userName}) regarding your emergency alert ${alert.alert_id}. We are on our way to assist you.`
                              );
                              const cleanDigits = callerPhone.replace(/\D/g, "");
                              const fullDigits = cleanDigits.length === 10 ? `91${cleanDigits}` : cleanDigits;
                              window.open(`https://wa.me/${fullDigits}?text=${msg}`, "_blank");
                            }}
                            style={{
                              background: "#25D366",
                              color: "#FFFFFF",
                              border: "none",
                              borderRadius: 8,
                              padding: "8px 16px",
                              fontSize: 12,
                              fontWeight: 800,
                              cursor: "pointer",
                              display: "inline-flex",
                              alignItems: "center",
                              gap: 6,
                            }}
                          >
                            <WhatsAppIcon size={14} color="#FFFFFF" /> Send on WhatsApp
                          </button>
                        )}

                        <button
                          type="button"
                          onClick={() => setReplyOpen((prev) => ({ ...prev, [alert.alert_id]: false }))}
                          style={{
                            background: "transparent",
                            border: "1px solid #94A3B8",
                            color: "#475569",
                            borderRadius: 8,
                            padding: "8px 14px",
                            fontSize: 12,
                            fontWeight: 700,
                            cursor: "pointer",
                          }}
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  )}

                  {/* Action Buttons: ACCEPT & REPLY */}
                  <div style={{ display: "flex", gap: 10, flexWrap: "wrap", alignItems: "center" }}>
                    <button
                      type="button"
                      disabled={!!actionInProgress[alert.alert_id]}
                      onClick={() => handleAction(alert.alert_id, "accept")}
                      style={{
                        background: "#059669",
                        color: "#FFFFFF",
                        border: "none",
                        borderRadius: 8,
                        padding: "10px 20px",
                        fontSize: 13,
                        fontWeight: 800,
                        cursor: "pointer",
                        display: "inline-flex",
                        alignItems: "center",
                        gap: 6,
                        boxShadow: "0 2px 6px rgba(5, 150, 105, 0.3)",
                      }}
                    >
                      {actionInProgress[alert.alert_id] === "accept" ? "Accepting…" : "✓ Accept Emergency"}
                    </button>

                    <button
                      type="button"
                      onClick={() =>
                        setReplyOpen((prev) => ({ ...prev, [alert.alert_id]: !prev[alert.alert_id] }))
                      }
                      style={{
                        background: "#3B82F6",
                        color: "#FFFFFF",
                        border: "none",
                        borderRadius: 8,
                        padding: "10px 20px",
                        fontSize: 13,
                        fontWeight: 800,
                        cursor: "pointer",
                        display: "inline-flex",
                        alignItems: "center",
                        gap: 6,
                        boxShadow: "0 2px 6px rgba(59, 130, 246, 0.2)",
                      }}
                    >
                      💬 Reply to Caller
                    </button>

                    <button
                      type="button"
                      disabled={!!actionInProgress[alert.alert_id]}
                      onClick={() => handleAction(alert.alert_id, "resolve")}
                      style={{
                        background: "#475569",
                        color: "#FFFFFF",
                        border: "none",
                        borderRadius: 8,
                        padding: "10px 18px",
                        fontSize: 13,
                        fontWeight: 800,
                        cursor: "pointer",
                        display: "inline-flex",
                        alignItems: "center",
                        gap: 6,
                      }}
                    >
                      {actionInProgress[alert.alert_id] === "resolve" ? "Resolving…" : "✓ Mark as Resolved"}
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>
      )}

      {/* ══════════════════════════════════════════════════════════
          FIELD 2: ACCEPTED & REPLIED MESSAGES
          ("calling replayed or accepted messages are display in another filed")
      ══════════════════════════════════════════════════════════ */}
      {activeTab === "handled" && (
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          {handledAlerts.length === 0 ? (
            <div
              style={{
                background: "#FFFFFF",
                border: "2px dashed #A7F3D0",
                borderRadius: 14,
                padding: "36px 20px",
                textAlign: "center",
                color: "#065F46",
              }}
            >
              <div style={{ fontSize: 38, marginBottom: 8 }}>📭</div>
              <h3 style={{ margin: "0 0 6px 0", fontSize: 17, fontWeight: 800, color: "#065F46" }}>
                No Accepted or Replied Messages Yet
              </h3>
              <p style={{ margin: 0, fontSize: 13, color: "#059669" }}>
                When you accept an emergency or send a reply from the Pending Messages field, it will be moved and displayed here.
              </p>
            </div>
          ) : (
            handledAlerts.map((alert) => {
              if (!isMedicalStaff) {
                return <PatientAlertSmallBox key={alert.alert_id} alert={alert} isHandled={true} />;
              }
              const isReplying = !!replyOpen[alert.alert_id];
              const isResolved = (alert.status || "").toLowerCase() === "resolved";
              const isReplied = Boolean(alert.responder_notes) || (alert.status || "").toLowerCase() === "responding";

              const callerPhone = alert.contact_phone || "";
              const callerName = alert.unit_number
                ? `Unit ${alert.unit_number} (${alert.society_name || "Campus"})`
                : alert.caller_name || "Campus Member";

              return (
                <div
                  key={alert.alert_id}
                  style={{
                    background: "#FFFFFF",
                    border: isResolved ? "1.5px solid #CBD5E1" : "2px solid #86EFAC",
                    borderRadius: 14,
                    padding: "20px 24px",
                    boxShadow: "0 2px 10px rgba(0,0,0,0.04)",
                  }}
                >
                  {/* Top Row */}
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "flex-start",
                      flexWrap: "wrap",
                      gap: 10,
                      marginBottom: 12,
                      borderBottom: "1px solid #E2E8F0",
                      paddingBottom: 10,
                    }}
                  >
                    <div>
                      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                        <span
                          style={{
                            fontFamily: "monospace",
                            fontSize: 14,
                            fontWeight: 900,
                            color: "#065F46",
                          }}
                        >
                          ✓ {alert.alert_id}
                        </span>
                        <span
                          style={{
                            fontSize: 11,
                            fontWeight: 800,
                            padding: "3px 10px",
                            borderRadius: 20,
                            background: isResolved
                              ? "#F1F5F9"
                              : isReplied
                              ? "#DBEAFE"
                              : "#DCFCE7",
                            color: isResolved
                              ? "#475569"
                              : isReplied
                              ? "#1D4ED8"
                              : "#15803D",
                            textTransform: "uppercase",
                          }}
                        >
                          {isResolved ? "RESOLVED" : isReplied ? "REPLIED & ATTENDING" : "ACCEPTED"}
                        </span>
                        <span style={{ fontSize: 12, color: "#64748B", fontWeight: 600 }}>
                          Category: <strong>{alert.emergency_type || alert.alert_type}</strong>
                        </span>
                      </div>
                      <div style={{ fontSize: 11, color: "#64748B", marginTop: 4 }}>
                        Received: <strong>{alert.created_at}</strong>
                        {alert.responder ? ` · Handled by: ${alert.responder}` : ` · Handled by: ${userName}`}
                      </div>
                    </div>
                  </div>

                  {/* Caller Details */}
                  <div
                    style={{
                      display: "grid",
                      gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
                      gap: 12,
                      background: "#F8FAFC",
                      borderRadius: 10,
                      padding: "12px 16px",
                      marginBottom: 12,
                    }}
                  >
                    <div>
                      <div style={{ fontSize: 10, fontWeight: 800, color: "#64748B", textTransform: "uppercase" }}>
                        Caller / Resident
                      </div>
                      <div style={{ fontSize: 13, fontWeight: 800, color: "#1E293B", marginTop: 2 }}>
                        {callerName}
                      </div>
                    </div>

                    {callerPhone && (
                      <div>
                        <div style={{ fontSize: 10, fontWeight: 800, color: "#64748B", textTransform: "uppercase" }}>
                          Contact Phone
                        </div>
                        <div style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 2 }}>
                          <span style={{ fontSize: 13, fontWeight: 800, color: "#065F46" }}>
                            {callerPhone}
                          </span>
                          <button
                            type="button"
                            onClick={() => openWhatsApp(callerPhone, callerName)}
                            style={{
                              background: "#25D366",
                              color: "#FFFFFF",
                              border: "none",
                              borderRadius: 6,
                              padding: "3px 8px",
                              fontSize: 11,
                              fontWeight: 700,
                              cursor: "pointer",
                              display: "inline-flex",
                              alignItems: "center",
                              gap: 4,
                            }}
                          >
                            <WhatsAppIcon size={12} color="#FFFFFF" /> WhatsApp
                          </button>
                        </div>
                      </div>
                    )}

                    <div>
                      <div style={{ fontSize: 10, fontWeight: 800, color: "#64748B", textTransform: "uppercase" }}>
                        Location
                      </div>
                      <div style={{ fontSize: 13, fontWeight: 700, color: "#1E293B", marginTop: 2 }}>
                        {alert.location_display || "Campus Premises"}
                      </div>
                    </div>
                  </div>

                  {/* Original Caller Message */}
                  <div
                    style={{
                      background: "#F8FAFC",
                      border: "1px solid #E2E8F0",
                      borderRadius: 10,
                      padding: "10px 14px",
                      marginBottom: 10,
                    }}
                  >
                    <div style={{ fontSize: 11, fontWeight: 700, color: "#475569", textTransform: "uppercase" }}>
                      Original Message:
                    </div>
                    <div style={{ fontSize: 13, color: "#334155", marginTop: 3 }}>
                      {alert.notes || "Emergency call logged."}
                    </div>
                  </div>

                  {/* Medical Staff Reply */}
                  {alert.responder_notes && (
                    <div
                      style={{
                        background: "#F0FDF4",
                        border: "1.5px solid #86EFAC",
                        borderRadius: 10,
                        padding: "12px 14px",
                        marginBottom: 14,
                      }}
                    >
                      <div style={{ fontSize: 11, fontWeight: 800, color: "#166534", textTransform: "uppercase" }}>
                        💬 Medical Staff Reply / Action Sent:
                      </div>
                      <div style={{ fontSize: 13, color: "#14532D", marginTop: 4, fontWeight: 700, lineHeight: 1.5 }}>
                        "{alert.responder_notes}"
                      </div>
                    </div>
                  )}

                  {/* Reply Form if toggled */}
                  {isReplying && (
                    <div
                      style={{
                        background: "#EFF6FF",
                        border: "1.5px solid #93C5FD",
                        borderRadius: 10,
                        padding: "14px 16px",
                        marginBottom: 14,
                      }}
                    >
                      <textarea
                        rows={2}
                        placeholder="Type an additional response note..."
                        value={replyText[alert.alert_id] || ""}
                        onChange={(e) =>
                          setReplyText((prev) => ({ ...prev, [alert.alert_id]: e.target.value }))
                        }
                        style={{
                          width: "100%",
                          boxSizing: "border-box",
                          padding: "10px",
                          borderRadius: 8,
                          border: "1.5px solid #BFDBFE",
                          fontSize: 13,
                        }}
                      />
                      <div style={{ display: "flex", gap: 10, marginTop: 8 }}>
                        <button
                          type="button"
                          onClick={() =>
                            handleAction(
                              alert.alert_id,
                              "reply",
                              replyText[alert.alert_id] || "Follow-up attended"
                            )
                          }
                          style={{
                            background: "#2563EB",
                            color: "#FFFFFF",
                            border: "none",
                            borderRadius: 6,
                            padding: "6px 14px",
                            fontSize: 12,
                            fontWeight: 700,
                            cursor: "pointer",
                          }}
                        >
                          Update Reply
                        </button>
                        <button
                          type="button"
                          onClick={() => setReplyOpen((prev) => ({ ...prev, [alert.alert_id]: false }))}
                          style={{
                            background: "transparent",
                            border: "1px solid #94A3B8",
                            color: "#475569",
                            borderRadius: 6,
                            padding: "6px 12px",
                            fontSize: 12,
                            cursor: "pointer",
                          }}
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  )}

                  {/* Bottom Actions */}
                  <div style={{ display: "flex", gap: 10, flexWrap: "wrap", alignItems: "center" }}>
                    <button
                      type="button"
                      onClick={() =>
                        setReplyOpen((prev) => ({ ...prev, [alert.alert_id]: !prev[alert.alert_id] }))
                      }
                      style={{
                        background: "#3B82F6",
                        color: "#FFFFFF",
                        border: "none",
                        borderRadius: 8,
                        padding: "8px 16px",
                        fontSize: 12,
                        fontWeight: 700,
                        cursor: "pointer",
                      }}
                    >
                      💬 Send Another Reply
                    </button>

                    {!isResolved && (
                      <button
                        type="button"
                        disabled={!!actionInProgress[alert.alert_id]}
                        onClick={() => handleAction(alert.alert_id, "resolve")}
                        style={{
                          background: "#16A34A",
                          color: "#FFFFFF",
                          border: "none",
                          borderRadius: 8,
                          padding: "8px 16px",
                          fontSize: 12,
                          fontWeight: 700,
                          cursor: "pointer",
                        }}
                      >
                        {actionInProgress[alert.alert_id] === "resolve" ? "Resolving…" : "✓ Mark as Resolved"}
                      </button>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>
      )}

      {/* ══════════════════════════════════════════════════════════
          FIELD 3: ALL EMERGENCY CALL HISTORY & ACCESS LOGS
      ══════════════════════════════════════════════════════════ */}
      {activeTab === "history" && (
        <div
          style={{
            background: "#FFFFFF",
            border: "1.5px solid #A7F3D0",
            borderRadius: 14,
            padding: "20px 24px",
            boxShadow: "0 2px 10px rgba(0,0,0,0.03)",
          }}
        >
          {/* Controls: Search and Refresh */}
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              flexWrap: "wrap",
              gap: 12,
              marginBottom: 16,
            }}
          >
            <div style={{ flex: 1, minWidth: 260 }}>
              <input
                type="text"
                placeholder="Search emergency logs by caller, ID year, or notes…"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                style={{
                  width: "100%",
                  boxSizing: "border-box",
                  padding: "9px 14px",
                  borderRadius: 8,
                  border: "1.5px solid #A7F3D0",
                  fontSize: 13,
                  outline: "none",
                }}
              />
            </div>

            <button
              onClick={fetchCallLogs}
              style={{
                background: "#F0FDF4",
                border: "1.5px solid #A7F3D0",
                color: "#065F46",
                borderRadius: 8,
                padding: "8px 16px",
                fontSize: 12,
                fontWeight: 800,
                cursor: "pointer",
              }}
            >
              ↻ Refresh Logs
            </button>
          </div>

          {loadingLogs ? (
            <div style={{ textAlign: "center", padding: "30px 0", color: "#065F46", fontSize: 13 }}>
              Loading emergency call history…
            </div>
          ) : filteredLogs.length === 0 ? (
            <div style={{ textAlign: "center", padding: "30px 0", color: "#64748B", fontSize: 13 }}>
              No emergency call logs found.
            </div>
          ) : (
            <div style={{ overflowX: "auto" }}>
              <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12 }}>
                <thead>
                  <tr style={{ background: "#F0FDF4", borderBottom: "2px solid #A7F3D0", textAlign: "left" }}>
                    <th style={{ padding: "10px 12px", color: "#065F46", fontWeight: 800 }}>#</th>
                    <th style={{ padding: "10px 12px", color: "#065F46", fontWeight: 800 }}>Timestamp</th>
                    <th style={{ padding: "10px 12px", color: "#065F46", fontWeight: 800 }}>Caller / User</th>
                    <th style={{ padding: "10px 12px", color: "#065F46", fontWeight: 800 }}>Category / ID</th>
                    <th style={{ padding: "10px 12px", color: "#065F46", fontWeight: 800 }}>Incident Message &amp; Notes</th>
                    <th style={{ padding: "10px 12px", color: "#065F46", fontWeight: 800 }}>Dispatched Staff</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredLogs.map((log, idx) => {
                    const timeStr = log.accessed_at
                      ? new Date(log.accessed_at).toLocaleString()
                      : "—";
                    const userDisplay =
                      typeof log.user === "string" ? log.user : log.user?.username || log.user?.name || "Campus Member";

                    return (
                      <tr
                        key={log.id || idx}
                        style={{
                          borderBottom: "1px solid #F1F5F9",
                          background: idx % 2 === 0 ? "#FFFFFF" : "#F8FAFC",
                        }}
                      >
                        <td style={{ padding: "10px 12px", color: "#64748B", fontFamily: "monospace" }}>
                          {log.id}
                        </td>
                        <td style={{ padding: "10px 12px", color: "#334155", whiteSpace: "nowrap" }}>
                          {timeStr}
                        </td>
                        <td style={{ padding: "10px 12px", fontWeight: 700, color: "#064E3B" }}>
                          {userDisplay}
                        </td>
                        <td style={{ padding: "10px 12px" }}>
                          <span
                            style={{
                              background: "#DCFCE7",
                              color: "#166534",
                              padding: "2px 8px",
                              borderRadius: 4,
                              fontSize: 11,
                              fontWeight: 700,
                            }}
                          >
                            {log.scanned_id_year || log.scanned_id_number || "EMERGENCY"}
                          </span>
                        </td>
                        <td style={{ padding: "10px 12px", color: "#334155", maxWidth: 360, lineHeight: 1.4 }}>
                          {log.notes || "—"}
                        </td>
                        <td style={{ padding: "10px 12px", color: "#047857", fontWeight: 600 }}>
                          {log.dispatched_staff ? `Staff #${log.dispatched_staff}` : userName || "Medical Staff"}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* ══════════════════════════════════════════════════════════
          FIELD 4: PRINCIPAL EMERGENCY SOS SYSTEM & SIREN TRIGGER
      ══════════════════════════════════════════════════════════ */}
      {activeTab === "sos" && (
        <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
          {/* Top SOS Hero Card */}
          <div
            style={{
              background: "linear-gradient(135deg, #7F1D1D 0%, #991B1B 50%, #B91C1C 100%)",
              borderRadius: 16,
              padding: "24px 28px",
              color: "#FFFFFF",
              boxShadow: "0 8px 30px rgba(185, 28, 28, 0.35)",
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              flexWrap: "wrap",
              gap: 18,
            }}
          >
            <div>
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <span style={{ fontSize: 32 }}>🚨</span>
                <div>
                  <h3 style={{ margin: 0, fontSize: 20, fontWeight: 900, color: "#FFFFFF" }}>
                    Emergency SOS &amp; Medical Rapid Alarm
                  </h3>
                  <div style={{ fontSize: 13, color: "#FECACA", marginTop: 4 }}>
                    Immediate Campus-Wide Alarm Dispatch &bull; Responders: Josmy Jose &amp; Medical Staff
                  </div>
                </div>
              </div>
            </div>

            <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
              <button
                type="button"
                onClick={() => setShowSosModal(true)}
                style={{
                  background: "#FFFFFF",
                  color: "#DC2626",
                  border: "none",
                  borderRadius: 30,
                  padding: "10px 20px",
                  fontSize: 13,
                  fontWeight: 900,
                  cursor: "pointer",
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 8,
                  boxShadow: "0 4px 14px rgba(0, 0, 0, 0.25)",
                }}
              >
                <SirenBeaconIcon size={18} color="#DC2626" />
                Open Live Siren &amp; GPS Screen
              </button>
            </div>
          </div>

          {/* Quick Siren Activation & WhatsApp Bar */}
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
              gap: 16,
            }}
          >
            {/* Box 1: Instant Siren Alarm Sounding */}
            <div
              style={{
                background: "#FEF2F2",
                border: "2px solid #FCA5A5",
                borderRadius: 14,
                padding: "20px",
                display: "flex",
                flexDirection: "column",
                justifyContent: "space-between",
                gap: 14,
              }}
            >
              <div>
                <div style={{ display: "flex", alignItems: "center", gap: 8, color: "#991B1B", fontWeight: 800, fontSize: 15 }}>
                  <SirenBeaconIcon size={22} color="#DC2626" />
                  Campus-Wide Panic Siren
                </div>
                <p style={{ margin: "8px 0 0 0", fontSize: 12.5, color: "#7F1D1D", lineHeight: 1.5 }}>
                  Starts the dual-oscillator acoustic wail and sends instant notification to all registered people (students, faculty, staff) across campus.
                </p>
              </div>

              {sirenSuccess ? (
                <div style={{ background: "#DCFCE7", border: "1.5px solid #86EFAC", borderRadius: 8, padding: "10px", color: "#166534", fontSize: 12, fontWeight: 700 }}>
                  ✓ Siren Alarm is running! Notification transmitted to all registered people on campus.
                </div>
              ) : null}

              <button
                type="button"
                disabled={sirenTriggering}
                onClick={handleTriggerSirenAlarm}
                style={{
                  background: "linear-gradient(135deg, #DC2626, #B91C1C)",
                  color: "#FFFFFF",
                  border: "none",
                  borderRadius: 10,
                  padding: "12px 18px",
                  fontSize: 13,
                  fontWeight: 900,
                  cursor: sirenTriggering ? "not-allowed" : "pointer",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: 8,
                  boxShadow: "0 4px 12px rgba(220, 38, 38, 0.35)",
                }}
              >
                <SirenBeaconIcon size={16} color="#FFFFFF" />
                {sirenTriggering ? "Sounding Siren…" : "🔊 Sound Panic Siren to All Registered Users"}
              </button>
            </div>

            {/* Box 2: Direct WhatsApp Call to Josmy Jose */}
            <div
              style={{
                background: "#F0FDF4",
                border: "2px solid #86EFAC",
                borderRadius: 14,
                padding: "20px",
                display: "flex",
                flexDirection: "column",
                justifyContent: "space-between",
                gap: 14,
              }}
            >
              <div>
                <div style={{ display: "flex", alignItems: "center", gap: 8, color: "#166534", fontWeight: 800, fontSize: 15 }}>
                  <WhatsAppIcon size={22} color="#25D366" />
                  Direct Call On-Duty Staff (Josmy Jose)
                </div>
                <p style={{ margin: "8px 0 0 0", fontSize: 12.5, color: "#14532D", lineHeight: 1.5 }}>
                  Phone / WhatsApp: <strong>9987766898</strong>. Direct emergency channel to the medical staff on duty.
                </p>
              </div>

              <button
                type="button"
                onClick={() => openWhatsApp("9987766898", "Nurse Josmy Jose (Medical Staff)")}
                style={{
                  background: "#25D366",
                  color: "#FFFFFF",
                  border: "none",
                  borderRadius: 10,
                  padding: "12px 18px",
                  fontSize: 13,
                  fontWeight: 900,
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: 8,
                  boxShadow: "0 4px 12px rgba(37, 211, 102, 0.35)",
                }}
              >
                <WhatsAppIcon size={18} color="#FFFFFF" />
                Call / Message Josmy Jose on WhatsApp
              </button>
            </div>
          </div>

          {/* Form: Send Medical SOS Dispatch */}
          <div
            style={{
              background: "#FFFFFF",
              border: "1.5px solid #A7F3D0",
              borderRadius: 14,
              padding: "24px",
              boxShadow: "0 2px 10px rgba(0,0,0,0.03)",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 14 }}>
              <span style={{ fontSize: 20 }}>📝</span>
              <h4 style={{ margin: 0, fontSize: 16, fontWeight: 800, color: "#065F46" }}>
                Send Urgent Medical SOS Dispatch Alert
              </h4>
            </div>

            {sosSuccess ? (
              <div
                style={{
                  background: "#F0FDF4",
                  border: "1.5px solid #86EFAC",
                  borderRadius: 10,
                  padding: "16px 20px",
                  marginBottom: 16,
                  color: "#166534",
                }}
              >
                <div style={{ fontSize: 15, fontWeight: 800 }}>✓ Emergency SOS Dispatched Successfully!</div>
                <div style={{ fontSize: 13, marginTop: 4 }}>
                  Ticket ID: <strong>{sosSuccess.alert_id}</strong> &bull; All on-duty medical responders have been alerted.
                </div>
                <button
                  type="button"
                  onClick={() => setSosSuccess(null)}
                  style={{
                    marginTop: 10,
                    background: "#059669",
                    color: "#FFFFFF",
                    border: "none",
                    borderRadius: 6,
                    padding: "6px 14px",
                    fontSize: 12,
                    fontWeight: 700,
                    cursor: "pointer",
                  }}
                >
                  Send Another SOS Alert
                </button>
              </div>
            ) : (
              <form onSubmit={handleSubmitSosDispatch} style={{ display: "flex", flexDirection: "column", gap: 14 }}>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: 14 }}>
                  <div>
                    <label style={{ display: "block", fontSize: 11, fontWeight: 800, color: "#065F46", textTransform: "uppercase", marginBottom: 4 }}>
                      Emergency Category
                    </label>
                    <select
                      value={sosEmergencyType}
                      onChange={(e) => setSosEmergencyType(e.target.value)}
                      style={{
                        width: "100%",
                        boxSizing: "border-box",
                        padding: "10px",
                        borderRadius: 8,
                        border: "1.5px solid #A7F3D0",
                        fontSize: 13,
                        outline: "none",
                        background: "#FFFFFF",
                      }}
                    >
                      <option value="MEDICAL">Medical Emergency 🩹</option>
                      <option value="CARDIAC">Cardiac / Chest Pain / Faint 🫀</option>
                      <option value="ASTHMA">Asthma / Breathing Trouble 🫁</option>
                      <option value="INJURY">Physical Injury / Fall ⚠️</option>
                      <option value="SECURITY">Urgent Security Concern 🛡️</option>
                    </select>
                  </div>

                  <div>
                    <label style={{ display: "block", fontSize: 11, fontWeight: 800, color: "#065F46", textTransform: "uppercase", marginBottom: 4 }}>
                      Location Details
                    </label>
                    <input
                      type="text"
                      required
                      value={sosLocation}
                      onChange={(e) => setSosLocation(e.target.value)}
                      placeholder="e.g. Principal Office - Administrative Block Floor 1"
                      style={{
                        width: "100%",
                        boxSizing: "border-box",
                        padding: "10px",
                        borderRadius: 8,
                        border: "1.5px solid #A7F3D0",
                        fontSize: 13,
                        outline: "none",
                      }}
                    />
                  </div>

                  <div>
                    <label style={{ display: "block", fontSize: 11, fontWeight: 800, color: "#065F46", textTransform: "uppercase", marginBottom: 4 }}>
                      Contact Callback Phone
                    </label>
                    <input
                      type="text"
                      required
                      value={sosPhone}
                      onChange={(e) => setSosPhone(e.target.value)}
                      placeholder="e.g. 9987766898"
                      style={{
                        width: "100%",
                        boxSizing: "border-box",
                        padding: "10px",
                        borderRadius: 8,
                        border: "1.5px solid #A7F3D0",
                        fontSize: 13,
                        outline: "none",
                      }}
                    />
                  </div>
                </div>

                <div>
                  <label style={{ display: "block", fontSize: 11, fontWeight: 800, color: "#065F46", textTransform: "uppercase", marginBottom: 4 }}>
                    Situation Notes &amp; Patient Symptoms
                  </label>
                  <textarea
                    rows={3}
                    value={sosNotes}
                    onChange={(e) => setSosNotes(e.target.value)}
                    placeholder="Describe patient condition, conscious level, immediate equipment needed (wheelchair, oxygen, stretcher)..."
                    style={{
                      width: "100%",
                      boxSizing: "border-box",
                      padding: "10px",
                      borderRadius: 8,
                      border: "1.5px solid #A7F3D0",
                      fontSize: 13,
                      outline: "none",
                      fontFamily: "inherit",
                    }}
                  />
                </div>

                <div style={{ display: "flex", gap: 12, alignItems: "center", flexWrap: "wrap" }}>
                  <button
                    type="submit"
                    disabled={sosSending}
                    style={{
                      background: "linear-gradient(135deg, #DC2626, #B91C1C)",
                      color: "#FFFFFF",
                      border: "none",
                      borderRadius: 8,
                      padding: "11px 24px",
                      fontSize: 13,
                      fontWeight: 800,
                      cursor: sosSending ? "not-allowed" : "pointer",
                      boxShadow: "0 3px 10px rgba(220, 38, 38, 0.35)",
                    }}
                  >
                    {sosSending ? "Dispatching SOS…" : "🚨 Send Urgent SOS Dispatch"}
                  </button>

                  <span style={{ fontSize: 12, color: "#64748B" }}>
                    Notifies on-duty responder Josmy Jose and logs an emergency dispatch record.
                  </span>
                </div>
              </form>
            )}
          </div>

          {/* Emergency Hotlines Card */}
          <div
            style={{
              background: "#F8FAFC",
              border: "1px solid #E2E8F0",
              borderRadius: 12,
              padding: "14px 20px",
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              flexWrap: "wrap",
              gap: 12,
            }}
          >
            <div style={{ fontSize: 13, fontWeight: 800, color: "#334155" }}>
              ☎️ Official Campus &amp; National Helplines:
            </div>
            <div style={{ display: "flex", gap: 16, flexWrap: "wrap", fontSize: 12, fontWeight: 700 }}>
              <span style={{ color: "#DC2626" }}>🚑 Ambulance: <strong>108</strong></span>
              <span style={{ color: "#2563EB" }}>👮 Police: <strong>100</strong></span>
              <span style={{ color: "#D97706" }}>🛡️ Campus Security: <strong>101</strong></span>
              <span style={{ color: "#059669" }}>🏥 Health Centre: <strong>9987766898</strong></span>
            </div>
          </div>
        </div>
      )}

      {/* ── Emergency Siren & Live GPS Modal ── */}
      {showSosModal && (
        <EmergencySirenModal
          onClose={() => setShowSosModal(false)}
          callerDefaultName={userName ? `Principal (${userName})` : "Principal"}
        />
      )}
    </div>
  );
}
