import { useState } from "react";
import { WhatsAppIcon, openWhatsApp } from "../modules/MedicalModule";

export default function PublicEmergencySOSModal({ onClose }) {
  const [formData, setFormData] = useState({
    contact_phone: "",
    unit_number: "",
    society_name: "Campus Society / Main Residency",
    emergency_type: "SECURITY",
    notes: "",
  });

  const [errors, setErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState(null); // success payload

  const emergencyTypes = [
    { id: "SECURITY", label: "Security", icon: "🛡️", desc: "Intruder / Theft / Threat" },
    { id: "MEDICAL", label: "Medical", icon: "🚑", desc: "Ambulance / Health Crisis" },
    { id: "FIRE", label: "Fire", icon: "🚒", desc: "Fire outbreak / Smoke" },
    { id: "LIFT", label: "Lift", icon: "🛗", desc: "Trapped in elevator" },
  ];

  const validate = () => {
    const errs = {};
    const phoneDigits = (formData.contact_phone || "").replace(/\D/g, "");
    if (!formData.contact_phone.trim()) {
      errs.contact_phone = "Contact phone number is required.";
    } else if (phoneDigits.length < 7) {
      errs.contact_phone = "Please enter a valid phone number (at least 7 digits).";
    }

    if (!formData.unit_number.trim()) {
      errs.unit_number = "Unit / Flat number is required.";
    }

    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;

    setSubmitting(true);
    setErrors({});

    try {
      const token = localStorage.getItem("cems_access");
      const headers = { "Content-Type": "application/json" };
      if (token) headers["Authorization"] = `Bearer ${token}`;

      const res = await fetch("/api/v1/emergency/public-sos/", {
        method: "POST",
        headers,
        body: JSON.stringify({
          contact_phone: formData.contact_phone.trim(),
          unit_number: formData.unit_number.trim(),
          society_name: formData.society_name.trim() || "Campus Society / Main Residency",
          emergency_type: formData.emergency_type,
          notes: formData.notes.trim(),
        }),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        if (typeof navigator !== "undefined" && navigator.vibrate) {
          try { navigator.vibrate([200, 100, 200, 100, 300]); } catch (e) {}
        }
        setResult(data);
      } else {
        if (data.errors) {
          setErrors(data.errors);
        } else {
          setErrors({ general: data.message || "Failed to dispatch SOS alert. Please try again." });
        }
      }
    } catch (err) {
      setErrors({ general: "Network error. Please call 112 directly if urgent." });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(15, 23, 42, 0.85)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        zIndex: 99999,
        padding: 16,
        backdropFilter: "blur(6px)",
        fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
      }}
    >
      <div
        style={{
          width: "min(540px, 100%)",
          maxHeight: "92vh",
          overflowY: "auto",
          background: "#FFFFFF",
          borderRadius: 20,
          boxShadow: "0 25px 60px rgba(220, 38, 38, 0.4), 0 0 0 3px #EF4444",
          border: "2px solid #DC2626",
        }}
      >
        {/* Header */}
        <div
          style={{
            background: "linear-gradient(135deg, #991B1B 0%, #DC2626 50%, #B91C1C 100%)",
            color: "#FFFFFF",
            padding: "18px 22px",
            borderTopLeftRadius: 18,
            borderTopRightRadius: 18,
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <span style={{ fontSize: 24 }}>🚨</span>
            <div>
              <h2 style={{ margin: 0, fontSize: 18, fontWeight: 900, color: "#FFFFFF" }}>
                PUBLIC EMERGENCY SOS
              </h2>
              <div style={{ fontSize: 11, color: "#FEE2E2", marginTop: 2 }}>
                Instant Dispatch to Gate Security & Society / RWA Desk (No login required)
              </div>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            style={{
              background: "rgba(255,255,255,0.2)",
              color: "#FFFFFF",
              border: "none",
              borderRadius: "50%",
              width: 32,
              height: 32,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              cursor: "pointer",
              fontSize: 16,
              fontWeight: 800,
            }}
          >
            ✕
          </button>
        </div>

        {/* Content Body */}
        <div style={{ padding: "20px 22px" }}>
          {!result ? (
            <form onSubmit={handleSubmit} noValidate>
              {errors.general && (
                <div
                  style={{
                    background: "#FEF2F2",
                    border: "1px solid #FCA5A5",
                    color: "#991B1B",
                    borderRadius: 10,
                    padding: "10px 14px",
                    marginBottom: 16,
                    fontSize: 13,
                    fontWeight: 600,
                  }}
                >
                  ⚠️ {errors.general}
                </div>
              )}

              {/* Emergency Type Selector */}
              <div style={{ marginBottom: 18 }}>
                <label
                  style={{
                    display: "block",
                    fontSize: 12,
                    fontWeight: 800,
                    color: "#334155",
                    textTransform: "uppercase",
                    letterSpacing: "0.04em",
                    marginBottom: 8,
                  }}
                >
                  Emergency Category *
                </label>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
                  {emergencyTypes.map((type) => {
                    const isSelected = formData.emergency_type === type.id;
                    return (
                      <button
                        key={type.id}
                        type="button"
                        onClick={() => setFormData({ ...formData, emergency_type: type.id })}
                        style={{
                          background: isSelected ? "#FEF2F2" : "#F8FAFC",
                          border: `2px solid ${isSelected ? "#DC2626" : "#E2E8F0"}`,
                          borderRadius: 10,
                          padding: "10px",
                          textAlign: "left",
                          cursor: "pointer",
                          display: "flex",
                          alignItems: "center",
                          gap: 10,
                          transition: "all 0.15s ease",
                          boxShadow: isSelected ? "0 2px 8px rgba(220, 38, 38, 0.15)" : "none",
                        }}
                      >
                        <span style={{ fontSize: 22 }}>{type.icon}</span>
                        <div>
                          <div style={{ fontWeight: 800, fontSize: 13, color: isSelected ? "#991B1B" : "#1E293B" }}>
                            {type.label}
                          </div>
                          <div style={{ fontSize: 10, color: "#64748B" }}>{type.desc}</div>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Contact Phone & Unit Number Row */}
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: 12, marginBottom: 14 }}>
                <div>
                  <label
                    style={{
                      display: "block",
                      fontSize: 12,
                      fontWeight: 800,
                      color: "#334155",
                      textTransform: "uppercase",
                      letterSpacing: "0.04em",
                      marginBottom: 6,
                    }}
                  >
                    Contact Phone *
                  </label>
                  <input
                    type="tel"
                    placeholder="e.g. 9876543210"
                    value={formData.contact_phone}
                    onChange={(e) => setFormData({ ...formData, contact_phone: e.target.value })}
                    style={{
                      width: "100%",
                      boxSizing: "border-box",
                      padding: "11px 12px",
                      borderRadius: 8,
                      border: `1.5px solid ${errors.contact_phone ? "#EF4444" : "#CBD5E1"}`,
                      fontSize: 14,
                      fontWeight: 600,
                      outline: "none",
                      background: errors.contact_phone ? "#FEF2F2" : "#FFFFFF",
                    }}
                  />
                  {errors.contact_phone && (
                    <div style={{ fontSize: 11, color: "#DC2626", marginTop: 4, fontWeight: 600 }}>
                      {errors.contact_phone}
                    </div>
                  )}
                </div>

                <div>
                  <label
                    style={{
                      display: "block",
                      fontSize: 12,
                      fontWeight: 800,
                      color: "#334155",
                      textTransform: "uppercase",
                      letterSpacing: "0.04em",
                      marginBottom: 6,
                    }}
                  >
                    Unit / Flat Number *
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Flat 402, Block B"
                    value={formData.unit_number}
                    onChange={(e) => setFormData({ ...formData, unit_number: e.target.value })}
                    style={{
                      width: "100%",
                      boxSizing: "border-box",
                      padding: "11px 12px",
                      borderRadius: 8,
                      border: `1.5px solid ${errors.unit_number ? "#EF4444" : "#CBD5E1"}`,
                      fontSize: 14,
                      fontWeight: 600,
                      outline: "none",
                      background: errors.unit_number ? "#FEF2F2" : "#FFFFFF",
                    }}
                  />
                  {errors.unit_number && (
                    <div style={{ fontSize: 11, color: "#DC2626", marginTop: 4, fontWeight: 600 }}>
                      {errors.unit_number}
                    </div>
                  )}
                </div>
              </div>

              {/* Society / Residency Name */}
              <div style={{ marginBottom: 14 }}>
                <label
                  style={{
                    display: "block",
                    fontSize: 12,
                    fontWeight: 800,
                    color: "#334155",
                    textTransform: "uppercase",
                    letterSpacing: "0.04em",
                    marginBottom: 6,
                  }}
                >
                  Society / Campus Residency Name
                </label>
                <input
                  type="text"
                  placeholder="Campus Society / Main Residency"
                  value={formData.society_name}
                  onChange={(e) => setFormData({ ...formData, society_name: e.target.value })}
                  style={{
                    width: "100%",
                    boxSizing: "border-box",
                    padding: "10px 12px",
                    borderRadius: 8,
                    border: "1.5px solid #CBD5E1",
                    fontSize: 13,
                    fontWeight: 600,
                    outline: "none",
                  }}
                />
              </div>

              {/* Optional Incident Details */}
              <div style={{ marginBottom: 20 }}>
                <label
                  style={{
                    display: "block",
                    fontSize: 12,
                    fontWeight: 800,
                    color: "#334155",
                    textTransform: "uppercase",
                    letterSpacing: "0.04em",
                    marginBottom: 6,
                  }}
                >
                  Brief Incident Note (Optional)
                </label>
                <input
                  type="text"
                  placeholder="e.g. Need immediate security support at entrance"
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  style={{
                    width: "100%",
                    boxSizing: "border-box",
                    padding: "10px 12px",
                    borderRadius: 8,
                    border: "1.5px solid #CBD5E1",
                    fontSize: 13,
                    outline: "none",
                  }}
                />
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={submitting}
                style={{
                  width: "100%",
                  padding: "14px",
                  borderRadius: 10,
                  border: "none",
                  background: submitting
                    ? "#94A3B8"
                    : "linear-gradient(135deg, #DC2626 0%, #991B1B 100%)",
                  color: "#FFFFFF",
                  fontSize: 14,
                  fontWeight: 900,
                  letterSpacing: "0.02em",
                  cursor: submitting ? "not-allowed" : "pointer",
                  boxShadow: submitting ? "none" : "0 4px 16px rgba(220, 38, 38, 0.4)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: 8,
                  transition: "all 0.2s ease",
                }}
              >
                <span>🚨</span>
                <span>{submitting ? "DISPATCHING SOS TO GATE SECURITY…" : "DISPATCH EMERGENCY ALERT NOW"}</span>
              </button>

              {/* Direct WhatsApp Action */}
              <div style={{ marginTop: 16, display: "flex", flexDirection: "column", gap: 8, alignItems: "center" }}>
                <div style={{ fontSize: 12, color: "#64748B" }}>
                  For immediate assistance without submitting form:
                </div>
                <button
                  type="button"
                  onClick={() => openWhatsApp("9987766898", "Campus Gate Security & Control")}
                  style={{
                    background: "#25D366", color: "#FFFFFF",
                    padding: "9px 18px", borderRadius: 8, border: "none",
                    fontWeight: 800, fontSize: 13, cursor: "pointer",
                    display: "inline-flex", alignItems: "center", gap: 8,
                    boxShadow: "0 2px 6px rgba(37,211,102,0.35)",
                  }}
                >
                  <WhatsAppIcon size={16} color="#FFFFFF" /> Contact Security Desk on WhatsApp
                </button>
              </div>
            </form>
          ) : (
            /* Successful Alert Feedback */
            <div>
              <div
                style={{
                  background: "#F0FDF4",
                  border: "2px solid #22C55E",
                  borderRadius: 14,
                  padding: "20px 18px",
                  textAlign: "center",
                  marginBottom: 20,
                  boxShadow: "0 4px 16px rgba(34, 197, 94, 0.15)",
                }}
              >
                <div style={{ fontSize: 36, marginBottom: 8 }}>✅</div>
                <h3 style={{ margin: 0, fontSize: 18, fontWeight: 900, color: "#15803D" }}>
                  Alert dispatched to Gate Security & RWA Desk
                </h3>
                <p style={{ margin: "6px 0 0", fontSize: 13, color: "#166534", fontWeight: 600 }}>
                  Security guards at the main gate and the society command desk have received your immediate emergency ping.
                </p>

                <div
                  style={{
                    background: "#FFFFFF",
                    border: "1px solid #BBF7D0",
                    borderRadius: 10,
                    padding: "12px 14px",
                    marginTop: 14,
                    display: "grid",
                    gridTemplateColumns: "1fr 1fr",
                    gap: 8,
                    textAlign: "left",
                    fontSize: 12,
                  }}
                >
                  <div>
                    <span style={{ color: "#64748B", fontWeight: 700, fontSize: 10, textTransform: "uppercase" }}>
                      Emergency Alert ID
                    </span>
                    <div style={{ fontWeight: 800, color: "#0F172A", fontFamily: "monospace" }}>
                      {result.alert_id}
                    </div>
                  </div>
                  <div>
                    <span style={{ color: "#64748B", fontWeight: 700, fontSize: 10, textTransform: "uppercase" }}>
                      Current Status
                    </span>
                    <div>
                      <span
                        style={{
                          background: "#DC2626",
                          color: "#FFFFFF",
                          fontSize: 10,
                          fontWeight: 800,
                          padding: "2px 6px",
                          borderRadius: 4,
                        }}
                      >
                        {result.status || "ACTIVE_EMERGENCY"}
                      </span>
                    </div>
                  </div>
                  <div>
                    <span style={{ color: "#64748B", fontWeight: 700, fontSize: 10, textTransform: "uppercase" }}>
                      Unit / Flat
                    </span>
                    <div style={{ fontWeight: 800, color: "#1E293B" }}>
                      Unit {result.unit_number} ({result.society_name})
                    </div>
                  </div>
                  <div>
                    <span style={{ color: "#64748B", fontWeight: 700, fontSize: 10, textTransform: "uppercase" }}>
                      Emergency Type
                    </span>
                    <div style={{ fontWeight: 800, color: "#DC2626" }}>
                      {result.emergency_type}
                    </div>
                  </div>
                </div>

                {/* Emergency Contact Auto-Dispatch Card */}
                {result.emergency_contact && (
                  <div
                    style={{
                      background: "#FEF2F2",
                      border: "1.5px solid #F87171",
                      borderRadius: 10,
                      padding: "12px 14px",
                      marginTop: 14,
                      textAlign: "left",
                    }}
                  >
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                      <span style={{ fontSize: 11, fontWeight: 900, color: "#991B1B", textTransform: "uppercase" }}>
                        🚨 EMERGENCY CONTACT AUTOMATICALLY ALERTED
                      </span>
                      <span style={{ background: "#DCFCE7", color: "#15803D", fontSize: 10, fontWeight: 800, padding: "2px 6px", borderRadius: 4 }}>
                        ✓ DISPATCHED
                      </span>
                    </div>
                    <div style={{ fontSize: 14, fontWeight: 800, color: "#7F1D1D", marginTop: 4 }}>
                      {result.emergency_contact.contact_name} ({result.emergency_contact.contact_relation}) · 📞 {result.emergency_contact.contact_number}
                    </div>
                    <div style={{ fontSize: 11.5, color: "#991B1B", marginTop: 3 }}>
                      ✓ Emergency distress message with incident details was auto-dispatched to your contact.
                    </div>
                    <div style={{ marginTop: 10, display: "flex", gap: 8, flexWrap: "wrap" }}>
                      <button
                        type="button"
                        onClick={() => window.open(result.emergency_contact.whatsapp_url, "_blank", "noopener,noreferrer")}
                        style={{
                          background: "#25D366", color: "#FFFFFF", border: "none",
                          padding: "7px 14px", borderRadius: 6, fontSize: 12, fontWeight: 800, cursor: "pointer",
                          display: "inline-flex", alignItems: "center", gap: 6
                        }}
                      >
                        💬 Open WhatsApp Alert
                      </button>
                      <a
                        href={`tel:${result.emergency_contact.contact_number}`}
                        style={{
                          background: "#DC2626", color: "#FFFFFF", border: "none",
                          padding: "7px 14px", borderRadius: 6, fontSize: 12, fontWeight: 800, textDecoration: "none",
                          display: "inline-flex", alignItems: "center", gap: 6
                        }}
                      >
                        📞 Call Contact
                      </a>
                    </div>
                  </div>
                )}
              </div>

              {/* Fallback Emergency Dialer Prompt */}
              <div
                style={{
                  background: "#FEF2F2",
                  border: "1.5px solid #FCA5A5",
                  borderRadius: 12,
                  padding: "14px 16px",
                  marginBottom: 20,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  flexWrap: "wrap",
                  gap: 10,
                }}
              >
                <div>
                  <div style={{ fontWeight: 800, color: "#991B1B", fontSize: 13 }}>
                    🚨 Fallback Emergency Desk
                  </div>
                  <div style={{ fontSize: 11, color: "#7F1D1D", marginTop: 2 }}>
                    If urgent physical intervention is required right now:
                  </div>
                </div>
                <div>
                  <button
                    type="button"
                    onClick={() => openWhatsApp("9987766898", "Gate Security Desk")}
                    style={{
                      background: "#25D366", color: "#FFFFFF",
                      padding: "9px 18px", borderRadius: 8, border: "none",
                      fontWeight: 800, fontSize: 13, cursor: "pointer",
                      display: "inline-flex", alignItems: "center", gap: 8,
                      boxShadow: "0 2px 6px rgba(37,211,102,0.35)",
                    }}
                  >
                    <WhatsAppIcon size={16} color="#FFFFFF" /> Message Security Desk on WhatsApp
                  </button>
                </div>
              </div>

              <button
                type="button"
                onClick={onClose}
                style={{
                  width: "100%",
                  padding: "12px",
                  borderRadius: 10,
                  border: "1.5px solid #CBD5E1",
                  background: "#FFFFFF",
                  color: "#475569",
                  fontSize: 13,
                  fontWeight: 800,
                  cursor: "pointer",
                }}
              >
                Close Window
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
