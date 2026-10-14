import { useState, useEffect } from "react";
import { SirenBeaconIcon } from "./EmergencySirenModal";
import { WhatsAppIcon, openWhatsApp } from "../modules/MedicalModule";

const RESPONDER_ROLES = ["admin", "principal", "medical_staff", "warden"];

export default function ResponderAlertsDesk({ role, accessToken, onAlertCountChange }) {
  const [alerts, setAlerts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [actionInProgress, setActionInProgress] = useState({});
  const [expanded, setExpanded] = useState(true);

  const isResponder = RESPONDER_ROLES.includes((role || "").toLowerCase());

  const fetchAlerts = async () => {
    if (!isResponder || !accessToken) return;
    try {
      const res = await fetch("/api/emergency/responder/alerts/", {
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "Content-Type": "application/json",
        },
      });
      if (res.ok) {
        const data = await res.json();
        const list = data.alerts || [];
        setAlerts(list);
        const activeCount = list.filter(
          (a) =>
            a.status === "received" ||
            a.status === "ACTIVE_EMERGENCY" ||
            a.status === "acknowledged" ||
            a.status === "responding" ||
            a.status === "ACKNOWLEDGED" ||
            a.status === "RESPONDING"
        ).length;
        onAlertCountChange?.(activeCount);
      }
    } catch (e) {
      console.warn("Error fetching responder emergency alerts:", e);
    }
  };

  useEffect(() => {
    if (!isResponder || !accessToken) return;
    fetchAlerts();
    const interval = setInterval(fetchAlerts, 5000);
    return () => clearInterval(interval);
  }, [isResponder, accessToken]);

  const handleAction = async (alertId, actionName) => {
    setActionInProgress((prev) => ({ ...prev, [alertId]: actionName }));
    try {
      const res = await fetch(`/api/emergency/responder/alerts/${alertId}/action/`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ action: actionName }),
      });
      if (res.ok) {
        await fetchAlerts();
      }
    } catch (e) {
      console.warn(`Error updating alert ${alertId} to ${actionName}:`, e);
    } finally {
      setActionInProgress((prev) => {
        const copy = { ...prev };
        delete copy[alertId];
        return copy;
      });
    }
  };

  if (!isResponder) return null;

  const activeAlerts = alerts.filter(
    (a) =>
      a.status === "received" ||
      a.status === "ACTIVE_EMERGENCY" ||
      a.status === "acknowledged" ||
      a.status === "responding" ||
      a.status === "ACKNOWLEDGED" ||
      a.status === "RESPONDING"
  );
  const resolvedAlerts = alerts.filter(
    (a) =>
      a.status === "resolved" ||
      a.status === "cancelled" ||
      a.status === "RESOLVED"
  );

  return (
    <div
      style={{
        background: "#FFFFFF",
        border: "2px solid #EF4444",
        borderRadius: 16,
        boxShadow: activeAlerts.length > 0 ? "0 8px 30px rgba(220, 38, 38, 0.25)" : "0 4px 16px rgba(0, 0, 0, 0.06)",
        overflow: "hidden",
        marginBottom: 24,
        fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
      }}
    >
      {/* Top Banner Header */}
      <div
        style={{
          background: "linear-gradient(135deg, #991B1B 0%, #DC2626 50%, #B91C1C 100%)",
          color: "#FFFFFF",
          padding: "14px 20px",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          cursor: "pointer",
        }}
        onClick={() => setExpanded(!expanded)}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <div
            style={{
              animation: activeAlerts.length > 0 ? "sirenSpin 1.4s ease-in-out infinite" : "none",
              display: "flex",
              alignItems: "center",
            }}
          >
            <SirenBeaconIcon size={26} color="#FFFFFF" />
          </div>
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <h3 style={{ margin: 0, fontSize: 16, fontWeight: 900, color: "#FFFFFF" }}>
                Emergency Responder Alert Desk
              </h3>
              {activeAlerts.length > 0 ? (
                <span
                  style={{
                    background: "#FEF2F2",
                    color: "#DC2626",
                    fontSize: 11,
                    fontWeight: 900,
                    padding: "2px 8px",
                    borderRadius: 20,
                    boxShadow: "0 0 10px rgba(255, 255, 255, 0.8)",
                  }}
                >
                  {activeAlerts.length} ACTIVE SOS
                </span>
              ) : (
                <span
                  style={{
                    background: "rgba(255,255,255,0.2)",
                    color: "#FFFFFF",
                    fontSize: 11,
                    fontWeight: 700,
                    padding: "2px 8px",
                    borderRadius: 20,
                  }}
                >
                  All Clear
                </span>
              )}
            </div>
            <div style={{ fontSize: 11, color: "#FEE2E2", marginTop: 2 }}>
              Authorized responder panel for Anonymous SOS triage ({role.toUpperCase()})
            </div>
          </div>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              fetchAlerts();
            }}
            style={{
              background: "rgba(255,255,255,0.2)",
              color: "#FFFFFF",
              border: "1px solid rgba(255,255,255,0.4)",
              borderRadius: 6,
              padding: "4px 10px",
              fontSize: 11,
              fontWeight: 700,
              cursor: "pointer",
            }}
          >
            ↻ Refresh
          </button>
          <span style={{ fontSize: 14, color: "#FFFFFF" }}>{expanded ? "▲" : "▼"}</span>
        </div>
      </div>

      {expanded && (
        <div style={{ padding: "16px 20px" }}>
          {activeAlerts.length === 0 && (
            <div
              style={{
                background: "#F0FDF4",
                border: "1px solid #BBF7D0",
                borderRadius: 10,
                padding: "16px",
                textAlign: "center",
                color: "#166534",
                fontSize: 13,
                fontWeight: 600,
              }}
            >
              ✓ No active anonymous emergency alerts at this time. All reported alarms are resolved.
            </div>
          )}

          {/* List of Active Emergency Alerts */}
          {activeAlerts.map((alert) => (
            <div
              key={alert.alert_id}
              style={{
                background: "#FEF2F2",
                border: "2px solid #F87171",
                borderRadius: 12,
                padding: 16,
                marginBottom: 14,
                boxShadow: "0 4px 12px rgba(239, 68, 68, 0.15)",
              }}
            >
              {/* Alert Header Row */}
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "flex-start",
                  flexWrap: "wrap",
                  gap: 8,
                  marginBottom: 10,
                }}
              >
                <div>
                  <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <span style={{ fontSize: 13, fontWeight: 900, color: "#991B1B", fontFamily: "monospace" }}>
                      🚨 {alert.alert_id}
                    </span>
                    <span
                      style={{
                        fontSize: 10,
                        fontWeight: 800,
                        padding: "2px 8px",
                        borderRadius: 6,
                        background:
                          alert.status === "received" || alert.status === "ACTIVE_EMERGENCY"
                            ? "#DC2626"
                            : alert.status === "acknowledged" || alert.status === "ACKNOWLEDGED"
                            ? "#D97706"
                            : "#2563EB",
                        color: "#FFFFFF",
                        textTransform: "uppercase",
                      }}
                    >
                      {alert.status}
                    </span>
                    <span style={{ fontSize: 11, color: "#64748B", fontWeight: 600 }}>
                      Type: <code>{alert.alert_type}</code>
                    </span>
                  </div>
                  <div style={{ fontSize: 11, color: "#64748B", marginTop: 3 }}>
                    Logged at: <strong>{alert.created_at}</strong>
                    {alert.responder ? ` · Handled by: ${alert.responder}` : ""}
                  </div>
                </div>

                {/* Location Availability Badge */}
                <div>
                  {alert.location_available ? (
                    <span
                      style={{
                        background: "#DCFCE7",
                        color: "#15803D",
                        border: "1px solid #86EFAC",
                        fontSize: 11,
                        fontWeight: 800,
                        padding: "4px 10px",
                        borderRadius: 20,
                        display: "inline-flex",
                        alignItems: "center",
                        gap: 4,
                      }}
                    >
                      📍 Location Found
                    </span>
                  ) : (
                    <span
                      style={{
                        background: "#FEF3C7",
                        color: "#B45309",
                        border: "1px solid #FCD34D",
                        fontSize: 11,
                        fontWeight: 800,
                        padding: "4px 10px",
                        borderRadius: 20,
                        display: "inline-flex",
                        alignItems: "center",
                        gap: 4,
                      }}
                    >
                      ⚠️ Location Unavailable
                    </span>
                  )}
                </div>
              </div>

              {/* Public SOS specific Unit / Society / Phone Details */}
              {(alert.unit_number || alert.contact_phone) && (
                <div
                  style={{
                    background: "#FEF2F2",
                    border: "1.5px solid #FCA5A5",
                    borderRadius: 10,
                    padding: "10px 14px",
                    marginBottom: 10,
                    display: "grid",
                    gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))",
                    gap: 8,
                    fontSize: 12,
                  }}
                >
                  <div>
                    <span style={{ color: "#7F1D1D", fontWeight: 700, fontSize: 10, textTransform: "uppercase" }}>
                      Unit / Flat
                    </span>
                    <div style={{ fontWeight: 800, color: "#991B1B", fontSize: 13 }}>
                      🏢 Unit {alert.unit_number} ({alert.society_name || "Society"})
                    </div>
                  </div>
                  <div>
                    <span style={{ color: "#7F1D1D", fontWeight: 700, fontSize: 10, textTransform: "uppercase" }}>
                      Emergency Category
                    </span>
                    <div style={{ fontWeight: 800, color: "#DC2626", fontSize: 13 }}>
                      🚨 {alert.emergency_type || "SECURITY"}
                    </div>
                  </div>
                  <div>
                    <span style={{ color: "#7F1D1D", fontWeight: 700, fontSize: 10, textTransform: "uppercase" }}>
                      Caller Contact ({alert.contact_phone})
                    </span>
                    <div style={{ display: "flex", gap: 8, alignItems: "center", marginTop: 2 }}>
                      <button
                        type="button"
                        onClick={() => openWhatsApp(alert.contact_phone, "Campus Resident")}
                        style={{
                          background: "#25D366", color: "#FFFFFF",
                          border: "none", borderRadius: 6, padding: "4px 10px",
                          fontSize: 11, fontWeight: 700, cursor: "pointer",
                          display: "inline-flex", alignItems: "center", gap: 5,
                        }}
                      >
                        <WhatsAppIcon size={13} color="#FFFFFF" /> Message on WhatsApp ({alert.contact_phone})
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* Location Details & Map Link */}
              <div
                style={{
                  background: "#FFFFFF",
                  border: "1px solid #FECACA",
                  borderRadius: 10,
                  padding: "10px 14px",
                  marginBottom: 12,
                }}
              >
                <div style={{ fontSize: 11, fontWeight: 700, color: "#991B1B", textTransform: "uppercase" }}>
                  Incident Physical Location:
                </div>
                <div style={{ fontSize: 14, fontWeight: 800, color: "#1E293B", marginTop: 2 }}>
                  {alert.location_display || "Campus Premises (Location Unavailable)"}
                </div>
                {alert.latitude && alert.longitude && (
                  <div style={{ marginTop: 6, display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
                    <span
                      style={{
                        fontFamily: "monospace",
                        fontSize: 12,
                        background: "#F1F5F9",
                        padding: "2px 8px",
                        borderRadius: 4,
                        color: "#334155",
                      }}
                    >
                      GPS: {alert.latitude}° N, {alert.longitude}° E {alert.accuracy ? `(±${alert.accuracy}m)` : ""}
                    </span>
                    {alert.maps_url && (
                      <a
                        href={alert.maps_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        style={{
                          background: "#2563EB",
                          color: "#FFFFFF",
                          padding: "4px 10px",
                          borderRadius: 6,
                          fontSize: 11,
                          fontWeight: 800,
                          textDecoration: "none",
                          display: "inline-flex",
                          alignItems: "center",
                          gap: 4,
                        }}
                      >
                        🗺️ View Google Maps Pin
                      </a>
                    )}
                  </div>
                )}
              </div>

              {/* Action Buttons for Responders */}
              <div style={{ display: "flex", gap: 8, flexWrap: "wrap", alignItems: "center" }}>
                {(alert.status === "received" || alert.status === "ACTIVE_EMERGENCY") && (
                  <button
                    type="button"
                    disabled={!!actionInProgress[alert.alert_id]}
                    onClick={() => handleAction(alert.alert_id, "acknowledge")}
                    style={{
                      background: "#D97706",
                      color: "#FFFFFF",
                      border: "none",
                      borderRadius: 8,
                      padding: "8px 14px",
                      fontSize: 12,
                      fontWeight: 800,
                      cursor: "pointer",
                    }}
                  >
                    {actionInProgress[alert.alert_id] === "acknowledge" ? "Updating…" : "✓ Acknowledge Alert"}
                  </button>
                )}

                {(alert.status === "received" || alert.status === "ACTIVE_EMERGENCY" || alert.status === "acknowledged" || alert.status === "ACKNOWLEDGED") && (
                  <button
                    type="button"
                    disabled={!!actionInProgress[alert.alert_id]}
                    onClick={() => handleAction(alert.alert_id, "responding")}
                    style={{
                      background: "#2563EB",
                      color: "#FFFFFF",
                      border: "none",
                      borderRadius: 8,
                      padding: "8px 14px",
                      fontSize: 12,
                      fontWeight: 800,
                      cursor: "pointer",
                    }}
                  >
                    {actionInProgress[alert.alert_id] === "responding" ? "Updating…" : "🚑 Mark as Responding"}
                  </button>
                )}

                <button
                  type="button"
                  disabled={!!actionInProgress[alert.alert_id]}
                  onClick={() => handleAction(alert.alert_id, "resolve")}
                  style={{
                    background: "#16A34A",
                    color: "#FFFFFF",
                    border: "none",
                    borderRadius: 8,
                    padding: "8px 14px",
                    fontSize: 12,
                    fontWeight: 800,
                    cursor: "pointer",
                  }}
                >
                  {actionInProgress[alert.alert_id] === "resolve" ? "Updating…" : "✓ Mark as Resolved"}
                </button>
              </div>
            </div>
          ))}

          {/* Past Resolved Alerts Collapsible Section */}
          {resolvedAlerts.length > 0 && (
            <div style={{ marginTop: 14 }}>
              <div
                style={{
                  fontSize: 12,
                  fontWeight: 700,
                  color: "#64748B",
                  textTransform: "uppercase",
                  marginBottom: 8,
                }}
              >
                Recent Resolved / Cancelled SOS ({resolvedAlerts.length}):
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                {resolvedAlerts.slice(0, 5).map((ra) => (
                  <div
                    key={ra.alert_id}
                    style={{
                      background: "#F8FAFC",
                      border: "1px solid #E2E8F0",
                      borderRadius: 8,
                      padding: "8px 12px",
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                      fontSize: 12,
                    }}
                  >
                    <div>
                      <strong style={{ fontFamily: "monospace", color: "#334155" }}>{ra.alert_id}</strong>
                      <span style={{ color: "#64748B", marginLeft: 8 }}>{ra.created_at}</span>
                    </div>
                    <span
                      style={{
                        fontSize: 10,
                        fontWeight: 700,
                        padding: "2px 8px",
                        borderRadius: 12,
                        background: ra.status === "resolved" ? "#DCFCE7" : "#F1F5F9",
                        color: ra.status === "resolved" ? "#15803D" : "#64748B",
                        textTransform: "uppercase",
                      }}
                    >
                      {ra.status}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
