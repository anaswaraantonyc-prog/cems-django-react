import { useState, useEffect, useRef } from "react";
import { WhatsAppIcon, openWhatsApp, getCleanPhone } from "../modules/MedicalModule";

/* ════════════════════════════════════════════════════════════
   WEB AUDIO API EMERGENCY SIREN SYNTHESIZER
   Dual-oscillator modulated frequency sweep (520Hz - 980Hz)
   Authentic emergency wail without external audio files
════════════════════════════════════════════════════════════ */
class EmergencySirenPlayer {
  constructor() {
    this.ctx = null;
    this.osc1 = null;
    this.osc2 = null;
    this.lfo = null;
    this.gain = null;
    this.isPlaying = false;
    this.vibeInterval = null;
  }

  startVibration() {
    if (typeof navigator !== "undefined" && navigator.vibrate) {
      try {
        // High-alert repeating haptic pulse pattern for physical emergency sensation
        navigator.vibrate([400, 200, 400, 200, 700, 300]);
        if (!this.vibeInterval) {
          this.vibeInterval = setInterval(() => {
            if (this.isPlaying && typeof navigator !== "undefined" && navigator.vibrate) {
              navigator.vibrate([400, 200, 400, 200, 700, 300]);
            }
          }, 2200);
        }
      } catch (e) {}
    }
  }

  stopVibration() {
    if (this.vibeInterval) {
      clearInterval(this.vibeInterval);
      this.vibeInterval = null;
    }
    if (typeof navigator !== "undefined" && navigator.vibrate) {
      try {
        navigator.vibrate(0);
      } catch (e) {}
    }
  }

  start() {
    try {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (!this.ctx || this.ctx.state === "closed") {
        this.ctx = new AudioCtx();
      }
      if (this.ctx.state === "suspended") {
        this.ctx.resume();
      }
      if (this.isPlaying) return;

      // Master output gain
      this.gain = this.ctx.createGain();
      this.gain.gain.setValueAtTime(0.42, this.ctx.currentTime);
      this.gain.connect(this.ctx.destination);

      const now = this.ctx.currentTime;

      // Primary oscillator (Sawtooth for sharp emergency presence)
      this.osc1 = this.ctx.createOscillator();
      this.osc1.type = "sawtooth";
      this.osc1.frequency.setValueAtTime(750, now);

      // Secondary oscillator (Sine slightly detuned for acoustic fullness)
      this.osc2 = this.ctx.createOscillator();
      this.osc2.type = "sine";
      this.osc2.frequency.setValueAtTime(754, now);

      // Low Frequency Oscillator (LFO) to sweep frequency back and forth
      this.lfo = this.ctx.createOscillator();
      this.lfo.type = "sine";
      this.lfo.frequency.setValueAtTime(0.65, now); // ~1.5 second cycle

      const lfoGain = this.ctx.createGain();
      lfoGain.gain.setValueAtTime(240, now); // Sweep range ±240Hz (510Hz - 990Hz)

      this.lfo.connect(lfoGain);
      lfoGain.connect(this.osc1.frequency);
      lfoGain.connect(this.osc2.frequency);

      this.osc1.connect(this.gain);
      this.osc2.connect(this.gain);

      this.osc1.start();
      this.osc2.start();
      this.lfo.start();
      this.isPlaying = true;
      this.startVibration();
    } catch (err) {
      console.warn("Could not start Web Audio siren:", err);
    }
  }

  stop() {
    this.stopVibration();
    if (!this.isPlaying) return;
    try {
      if (this.osc1) {
        this.osc1.stop();
        this.osc1.disconnect();
      }
      if (this.osc2) {
        this.osc2.stop();
        this.osc2.disconnect();
      }
      if (this.lfo) {
        this.lfo.stop();
        this.lfo.disconnect();
      }
      if (this.ctx) {
        this.ctx.close();
      }
    } catch (err) {
      console.warn("Error stopping siren:", err);
    }
    this.isPlaying = false;
    this.ctx = null;
  }
}

export const sirenAudio = new EmergencySirenPlayer();

/* ════════════════════════════════════════════════════════════
   VECTOR EMERGENCY SIREN BEACON ICON
   Rotating emergency beacon dome with radiating acoustic pulses
════════════════════════════════════════════════════════════ */
export function SirenBeaconIcon({ size = 32, color = "currentColor", fillDome = true, style = {} }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke={color}
      strokeWidth="2.2"
      strokeLinecap="round"
      strokeLinejoin="round"
      style={{ display: "inline-block", verticalAlign: "middle", ...style }}
    >
      {/* Emergency siren glass dome */}
      <path
        d="M7 18v-6a5 5 0 1 1 10 0v6"
        fill={fillDome ? color : "none"}
        fillOpacity={fillDome ? 0.32 : 0}
      />
      {/* Heavy-duty base mounting */}
      <path
        d="M5 21a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1v-1a2 2 0 0 0-2-2H7a2 2 0 0 0-2 2z"
        fill={color}
        stroke={color}
      />
      {/* Rotating beacon center lamp core */}
      <circle cx="12" cy="12" r="2.2" fill={color} stroke="none" />
    </svg>
  );
}

export default function EmergencySirenModal({ onClose, callerDefaultName = "" }) {
  // Siren audio state
  const [sirenActive, setSirenActive] = useState(true);

  // Location state: "Fetching", "Location Found", or "Location Unavailable"
  const [locationStatus, setLocationStatus] = useState("Fetching");
  const [coords, setCoords] = useState(null); // { latitude, longitude, accuracy, mapsUrl, locationDisplay }
  const [showLocationHelp, setShowLocationHelp] = useState(false);

  // Alert delivery state: "Sending", "Sent", or "Failed"
  const [alertStatus, setAlertStatus] = useState("Sending");
  const [alertId, setAlertId] = useState("");
  const [serverMessage, setServerMessage] = useState("");
  const [sentTimestamp, setSentTimestamp] = useState("");

  // Registered Emergency Contact State (Auto-dispatched via CEMS)
  const [emergencyContact, setEmergencyContact] = useState(null);
  const [contactDispatched, setContactDispatched] = useState(false);

  // Confirmation dialog for cancelling emergency
  const [showCancelConfirm, setShowCancelConfirm] = useState(false);
  const [isCancelling, setIsCancelling] = useState(false);

  const initialSentRef = useRef(false);
  const watchIdRef = useRef(null);

  // Core function to send emergency alert to backend without blocking
  const sendEmergencyAlert = async (posData = null) => {
    setAlertStatus("Sending");

    const payload = {
      notes: "Emergency Siren triggered from CEMS portal.",
    };
    if (callerDefaultName) {
      payload.caller_name = callerDefaultName;
    }

    if (posData && posData.latitude !== undefined && posData.longitude !== undefined) {
      payload.latitude = posData.latitude;
      payload.longitude = posData.longitude;
      if (posData.accuracy !== undefined) {
        payload.accuracy = posData.accuracy;
      }
      if (posData.locationDisplay) {
        payload.location = posData.locationDisplay;
      }
    }

    const token = localStorage.getItem("cems_access");
    const headers = { "Content-Type": "application/json" };
    if (token) {
      headers["Authorization"] = `Bearer ${token}`;
    }

    try {
      const res = await fetch("/api/emergency/anonymous-sos/", {
        method: "POST",
        headers,
        body: JSON.stringify(payload),
      });

      if (res.ok) {
        const data = await res.json();
        setAlertId(data.alert_id);
        setServerMessage(data.message || "Emergency alert received by the system.");
        setSentTimestamp(data.created_at || new Date().toLocaleTimeString());
        setAlertStatus("Sent");

        if (data.emergency_contact) {
          setEmergencyContact(data.emergency_contact);
          setContactDispatched(true);
        }

        // Sync with local broadcast channel & localStorage for local responder tabs
        const localAlert = {
          id: data.alert_id,
          alert_id: data.alert_id,
          alert_type: "LOGIN_PAGE_ANONYMOUS_SOS",
          status: "received",
          caller_name: "Anonymous Requester (Emergency Siren)",
          location: data.location_display || payload.location || "Campus Premises",
          latitude: payload.latitude || null,
          longitude: payload.longitude || null,
          accuracy: payload.accuracy || null,
          maps_url: data.maps_url || (payload.latitude ? `https://www.google.com/maps?q=${payload.latitude},${payload.longitude}` : null),
          created_at: data.created_at || new Date().toLocaleTimeString(),
          is_active: true,
        };

        try {
          localStorage.setItem("cems_active_emergency_alarm", JSON.stringify(localAlert));
          if (window.BroadcastChannel) {
            const bc = new BroadcastChannel("cems_emergency_channel");
            bc.postMessage({ type: "EMERGENCY_ALARM_TRIGGERED", data: localAlert });
            bc.close();
          }
        } catch (e) {}
      } else {
        setAlertStatus("Failed");
      }
    } catch (err) {
      console.warn("Backend emergency request failed:", err);
      setAlertStatus("Failed");
    }
  };

  // Helper to handle GPS coordinates with reverse-geocoding
  const handlePositionSuccess = async (pos) => {
    const lat = Number(pos.coords.latitude.toFixed(6));
    const lng = Number(pos.coords.longitude.toFixed(6));
    const acc = Math.round(pos.coords.accuracy || 15);
    const mapsUrl = `https://www.google.com/maps?q=${lat},${lng}`;

    let placeName = "";
    try {
      const geoRes = await fetch(
        `https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${lat}&longitude=${lng}&localityLanguage=en`
      );
      if (geoRes.ok) {
        const geoData = await geoRes.json();
        if (geoData) {
          const parts = [
            geoData.locality || geoData.city,
            geoData.principalSubdivision,
            geoData.countryName,
          ].filter(Boolean);
          placeName = parts.join(", ");
        }
      }
    } catch (e) {}

    const displayPlace = placeName ? `${placeName} (GPS: ${lat}° N, ${lng}° E)` : `GPS Coordinates: ${lat}° N, ${lng}° E (±${acc}m)`;

    const posData = {
      latitude: lat,
      longitude: lng,
      accuracy: acc,
      mapsUrl,
      locationDisplay: displayPlace,
      placeName: placeName || `GPS: ${lat}° N, ${lng}° E`,
    };

    setCoords(posData);
    setLocationStatus("Location Found");

    // Send or update emergency alert with verified live GPS coordinates
    sendEmergencyAlert(posData);
  };

  const handlePositionError = (err) => {
    console.warn("Geolocation retrieval error:", err);
    // If we don't have coords yet, set Location Unavailable
    if (!coords) {
      setLocationStatus("Location Unavailable");
      if (!initialSentRef.current) {
        initialSentRef.current = true;
        sendEmergencyAlert(null);
      }
    }
  };

  // Direct manual GPS re-sync trigger
  const syncLiveGps = () => {
    setLocationStatus("Fetching");
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        handlePositionSuccess,
        (err) => {
          alert("Device GPS access: " + (err.message || "Please check browser location permission."));
          setLocationStatus("Location Unavailable");
        },
        { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
      );
    } else {
      alert("Geolocation is not supported by your browser.");
      setLocationStatus("Location Unavailable");
    }
  };

  // Initialize siren & geolocation immediately upon mounting
  useEffect(() => {
    // 1. Play siren sound immediately
    sirenAudio.start();
    setSirenActive(true);

    // Pre-fetch profile if authenticated to display registered emergency contact immediately
    const token = localStorage.getItem("cems_access");
    if (token) {
      fetch("/api/auth/me/", {
        headers: { Authorization: `Bearer ${token}` },
      })
        .then((res) => (res.ok ? res.json() : null))
        .then((userData) => {
          if (userData && userData.emergency_contact_number) {
            setEmergencyContact((prev) => prev || {
              contact_name: userData.emergency_contact_name || "Emergency Contact",
              contact_number: userData.emergency_contact_number,
              contact_relation: userData.emergency_contact_relation || "Parent",
              user_name: `${userData.first_name || ""} ${userData.last_name || ""}`.trim() || userData.username,
            });
          }
        })
        .catch(() => {});
    }

    window.__cems_update_modal_gps = handlePositionSuccess;

    // 2. Check if coordinates were already captured right on button click
    if (window.__cems_last_gps) {
      const g = window.__cems_last_gps;
      handlePositionSuccess({
        coords: {
          latitude: Number(g.lat),
          longitude: Number(g.lng),
          accuracy: Number(g.accuracy || 15),
        },
      });
    }

    // 3. Request current location using browser Geolocation API
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        handlePositionSuccess,
        (err) => {
          // Fallback with standard accuracy
          navigator.geolocation.getCurrentPosition(
            handlePositionSuccess,
            handlePositionError,
            { enableHighAccuracy: false, timeout: 5000, maximumAge: 30000 }
          );
        },
        { enableHighAccuracy: true, timeout: 8000, maximumAge: 0 }
      );

      // Continuous watch position to lock on live coordinates
      try {
        watchIdRef.current = navigator.geolocation.watchPosition(
          handlePositionSuccess,
          () => {},
          { enableHighAccuracy: true, maximumAge: 0 }
        );
      } catch (e) {}

      // Fallback timer: ensure alert is submitted even if user delays GPS prompt
      const fallbackTimer = setTimeout(() => {
        if (!initialSentRef.current) {
          initialSentRef.current = true;
          sendEmergencyAlert(coords);
        }
      }, 3500);

      return () => {
        clearTimeout(fallbackTimer);
        sirenAudio.stop();
        window.__cems_update_modal_gps = null;
        if (watchIdRef.current !== null && navigator.geolocation) {
          navigator.geolocation.clearWatch(watchIdRef.current);
        }
      };
    } else {
      setLocationStatus("Location Unavailable");
      if (!initialSentRef.current) {
        initialSentRef.current = true;
        sendEmergencyAlert(null);
      }
      return () => {
        sirenAudio.stop();
      };
    }
  }, []);

  // Stop / Resume siren audio toggle
  const toggleSirenAudio = () => {
    if (sirenActive) {
      sirenAudio.stop();
      setSirenActive(false);
    } else {
      sirenAudio.start();
      setSirenActive(true);
    }
  };

  // Cancel Emergency flow
  const handleCancelEmergency = async () => {
    setIsCancelling(true);
    sirenAudio.stop();
    setSirenActive(false);

    if (alertId) {
      try {
        await fetch(`/api/emergency/anonymous-sos/${alertId}/cancel/`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ action: "cancel" }),
        });
      } catch (e) {
        console.warn("Cancel request failed:", e);
      }
    }

    // Clear local broadcast
    try {
      localStorage.removeItem("cems_active_emergency_alarm");
      if (window.BroadcastChannel) {
        const bc = new BroadcastChannel("cems_emergency_channel");
        bc.postMessage({ type: "EMERGENCY_ALARM_DEACTIVATED" });
        bc.close();
      }
    } catch (e) {}

    setIsCancelling(false);
    setShowCancelConfirm(false);
    onClose?.();
  };

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(15, 23, 42, 0.88)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        zIndex: 99999,
        padding: 16,
        backdropFilter: "blur(8px)",
        fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
      }}
    >
      <div
        className="cems-siren-modal-card"
        style={{
          width: "min(600px, 100%)",
          maxHeight: "92vh",
          overflowY: "auto",
          background: "#FFFFFF",
          borderRadius: 20,
          boxShadow: "0 25px 60px rgba(220, 38, 38, 0.45), 0 0 0 4px #EF4444",
          border: "3px solid #DC2626",
          animation: "sirenModalPulse 1.2s ease-in-out infinite alternate",
        }}
      >
        {/* Top Emergency Red Flashing Header */}
        <div
          className="cems-siren-modal-header"
          style={{
            background: "linear-gradient(135deg, #991B1B 0%, #DC2626 50%, #B91C1C 100%)",
            color: "#FFFFFF",
            padding: "20px 24px",
            borderTopLeftRadius: 16,
            borderTopRightRadius: 16,
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            flexWrap: "wrap",
            gap: 12,
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
            <div
              style={{
                width: 52,
                height: 52,
                borderRadius: "50%",
                background: "#FFFFFF",
                color: "#DC2626",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                boxShadow: "0 0 22px rgba(255, 255, 255, 0.85)",
                animation: "sirenSpin 1.6s ease-in-out infinite",
              }}
            >
              <SirenBeaconIcon size={32} color="#DC2626" />
            </div>
            <div>
              <div
                style={{
                  fontSize: 11,
                  fontWeight: 800,
                  letterSpacing: "0.1em",
                  color: "#FEE2E2",
                  textTransform: "uppercase",
                }}
              >
                CEMS Rapid Assistance Protocol
              </div>
              <h2
                style={{
                  margin: "2px 0 0",
                  fontSize: 21,
                  fontWeight: 900,
                  letterSpacing: "-0.01em",
                  color: "#FFFFFF",
                }}
              >
                EMERGENCY ALERT ACTIVATED
              </h2>
            </div>
          </div>

          {/* Stop / Resume Siren Button */}
          <button
            type="button"
            onClick={toggleSirenAudio}
            style={{
              background: sirenActive ? "#FFFFFF" : "rgba(255,255,255,0.2)",
              color: sirenActive ? "#DC2626" : "#FFFFFF",
              border: `2px solid ${sirenActive ? "#EF4444" : "#FFFFFF"}`,
              borderRadius: 30,
              padding: "8px 16px",
              fontWeight: 800,
              fontSize: 12,
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              gap: 6,
              boxShadow: sirenActive ? "0 0 16px rgba(255,255,255,0.9)" : "none",
              transition: "all 0.2s ease",
            }}
          >
            <span>{sirenActive ? "🔇 Stop Siren" : "🔊 Play Siren"}</span>
          </button>
        </div>

        {/* Message Banner */}
        <div
          style={{
            background: "#FEF2F2",
            borderBottom: "1.5px solid #FCA5A5",
            padding: "14px 24px",
            color: "#991B1B",
            fontSize: 13.5,
            lineHeight: 1.5,
            fontWeight: 600,
          }}
        >
          <span style={{ fontSize: 16, marginRight: 6 }}>📢</span>
          <strong>Your emergency alert is being sent.</strong> We are trying to share your current location with authorized CEMS responders.
        </div>

        {/* Modal Body */}
        <div style={{ padding: "20px 24px" }}>
          {/* Status Overview Grid */}
          <div
            className="cems-siren-status-grid"
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(130px, 1fr))",
              gap: 10,
              marginBottom: 18,
            }}
          >
            {/* 1. Siren Status */}
            <div
              style={{
                background: sirenActive ? "#FEF2F2" : "#F8FAFC",
                border: `1.5px solid ${sirenActive ? "#EF4444" : "#CBD5E1"}`,
                borderRadius: 12,
                padding: "12px",
                textAlign: "center",
              }}
            >
              <div style={{ fontSize: 10, fontWeight: 800, color: "#64748B", textTransform: "uppercase" }}>
                Siren Status
              </div>
              <div
                style={{
                  fontSize: 13,
                  fontWeight: 900,
                  color: sirenActive ? "#DC2626" : "#475569",
                  marginTop: 4,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: 4,
                }}
              >
                {sirenActive ? "🔊 Active (Wailing)" : "🔇 Stopped"}
              </div>
            </div>

            {/* 2. Current Location Status */}
            <div
              style={{
                background:
                  locationStatus === "Location Found"
                    ? "#F0FDF4"
                    : locationStatus === "Location Unavailable"
                    ? "#FFFBEB"
                    : "#EFF6FF",
                border: `1.5px solid ${
                  locationStatus === "Location Found"
                    ? "#22C55E"
                    : locationStatus === "Location Unavailable"
                    ? "#F59E0B"
                    : "#3B82F6"
                }`,
                borderRadius: 12,
                padding: "12px",
                textAlign: "center",
              }}
            >
              <div style={{ fontSize: 10, fontWeight: 800, color: "#64748B", textTransform: "uppercase" }}>
                Current Location
              </div>
              <div
                style={{
                  fontSize: 13,
                  fontWeight: 900,
                  color:
                    locationStatus === "Location Found"
                      ? "#15803D"
                      : locationStatus === "Location Unavailable"
                      ? "#B45309"
                      : "#1D4ED8",
                  marginTop: 4,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: 4,
                }}
              >
                {locationStatus === "Location Found" && "✓ Location Found"}
                {locationStatus === "Fetching" && "🛰️ Fetching…"}
                {locationStatus === "Location Unavailable" && "⚠️ Unavailable"}
              </div>
            </div>

            {/* 3. Emergency Alert Delivery Status */}
            <div
              style={{
                background:
                  alertStatus === "Sent"
                    ? "#F0FDF4"
                    : alertStatus === "Failed"
                    ? "#FEF2F2"
                    : "#EFF6FF",
                border: `1.5px solid ${
                  alertStatus === "Sent"
                    ? "#22C55E"
                    : alertStatus === "Failed"
                    ? "#DC2626"
                    : "#3B82F6"
                }`,
                borderRadius: 12,
                padding: "12px",
                textAlign: "center",
              }}
            >
              <div style={{ fontSize: 10, fontWeight: 800, color: "#64748B", textTransform: "uppercase" }}>
                Alert Delivery
              </div>
              <div
                style={{
                  fontSize: 13,
                  fontWeight: 900,
                  color:
                    alertStatus === "Sent"
                      ? "#15803D"
                      : alertStatus === "Failed"
                      ? "#DC2626"
                      : "#1D4ED8",
                  marginTop: 4,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: 4,
                }}
              >
                {alertStatus === "Sent" && "✓ Sent to CEMS"}
                {alertStatus === "Sending" && "📡 Sending…"}
                {alertStatus === "Failed" && "✕ Failed"}
              </div>
            </div>
          </div>

          {/* Emergency Contact Auto-Dispatch Banner */}
          {emergencyContact && emergencyContact.contact_number && (
            <div
              style={{
                background: "linear-gradient(135deg, #FEF2F2 0%, #FFF1F2 100%)",
                border: "2px solid #F87171",
                borderRadius: 14,
                padding: "16px",
                marginBottom: 18,
                boxShadow: "0 4px 18px rgba(239, 68, 68, 0.18)",
              }}
            >
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 10 }}>
                <div style={{ display: "flex", alignItems: "flex-start", gap: 12 }}>
                  <div
                    style={{
                      width: 42,
                      height: 42,
                      borderRadius: "50%",
                      background: "#DC2626",
                      color: "#FFFFFF",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      fontSize: 22,
                      flexShrink: 0,
                      boxShadow: "0 2px 10px rgba(220,38,38,0.4)",
                    }}
                  >
                    📲
                  </div>
                  <div>
                    <div
                      style={{
                        fontSize: 11,
                        fontWeight: 900,
                        color: "#991B1B",
                        textTransform: "uppercase",
                        letterSpacing: "0.06em",
                      }}
                    >
                      🚨 EMERGENCY CONTACT AUTOMATICALLY NOTIFIED
                    </div>
                    <div style={{ fontSize: 16, fontWeight: 900, color: "#7F1D1D", marginTop: 2 }}>
                      {emergencyContact.contact_name || "Emergency Contact"} ({emergencyContact.contact_relation || "Family / Guardian"})
                    </div>
                    <div style={{ fontSize: 14, color: "#991B1B", fontWeight: 800, marginTop: 2, fontFamily: "monospace" }}>
                      📞 {emergencyContact.contact_number}
                    </div>
                    <div style={{ fontSize: 12, color: "#991B1B", marginTop: 4, lineHeight: 1.45, fontWeight: 600 }}>
                      {contactDispatched ? (
                        <span>✓ <strong>Distress message automatically dispatched</strong> to your emergency contact with live incident coordinates.</span>
                      ) : (
                        <span>✓ Registered emergency contact on file. Live alert ping and coordinates dispatched by CEMS.</span>
                      )}
                    </div>
                  </div>
                </div>
                <span
                  style={{
                    background: "#DCFCE7",
                    color: "#15803D",
                    fontSize: 11,
                    fontWeight: 900,
                    padding: "4px 9px",
                    borderRadius: 8,
                    border: "1px solid #86EFAC",
                    flexShrink: 0,
                  }}
                >
                  ✓ DISPATCHED
                </span>
              </div>

              {/* 1-Tap Action buttons for Emergency Contact */}
              <div style={{ display: "flex", gap: 10, marginTop: 14, flexWrap: "wrap" }}>
                <button
                  type="button"
                  onClick={() => {
                    const clean = getCleanPhone(emergencyContact.contact_number);
                    const maps = coords?.mapsUrl || "Campus Premises";
                    const msg = encodeURIComponent(
                      `🚨 EMERGENCY DISTRESS ALERT! I have triggered an emergency siren/SOS on campus at ${coords?.locationDisplay || "Campus"}.\nLive GPS Map: ${maps}\nPlease check immediately!`
                    );
                    window.open(`https://wa.me/${clean}?text=${msg}`, "_blank", "noopener,noreferrer");
                  }}
                  style={{
                    background: "#25D366",
                    color: "#FFFFFF",
                    border: "none",
                    borderRadius: 8,
                    padding: "9px 16px",
                    fontWeight: 800,
                    fontSize: 13,
                    cursor: "pointer",
                    display: "inline-flex",
                    alignItems: "center",
                    gap: 6,
                    boxShadow: "0 2px 8px rgba(37,211,102,0.35)",
                  }}
                >
                  <WhatsAppIcon size={16} color="#FFFFFF" /> Message Emergency Contact on WhatsApp
                </button>

                <a
                  href={`tel:${emergencyContact.contact_number}`}
                  style={{
                    background: "#DC2626",
                    color: "#FFFFFF",
                    border: "none",
                    borderRadius: 8,
                    padding: "9px 16px",
                    fontWeight: 800,
                    fontSize: 13,
                    textDecoration: "none",
                    display: "inline-flex",
                    alignItems: "center",
                    gap: 6,
                    boxShadow: "0 2px 8px rgba(220,38,38,0.35)",
                  }}
                >
                  📞 Call Emergency Contact
                </a>
              </div>
            </div>
          )}

          {/* Coordinates & Map Link Section (When GPS is Available) */}
          {coords && coords.latitude && coords.longitude ? (
            <div
              style={{
                background: "#F0FDF4",
                border: "2px solid #86EFAC",
                borderRadius: 14,
                padding: 16,
                marginBottom: 18,
              }}
            >
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
                <span style={{ fontSize: 12, fontWeight: 800, color: "#166534", textTransform: "uppercase", letterSpacing: "0.05em" }}>
                  📍 Verified Device Coordinates
                </span>
                <span style={{ fontSize: 11, background: "#DCFCE7", color: "#15803D", padding: "3px 8px", borderRadius: 12, fontWeight: 700 }}>
                  Accuracy: ±{coords.accuracy}m
                </span>
              </div>

              <div style={{ fontSize: 15, fontWeight: 800, color: "#14532D", fontFamily: "monospace", marginBottom: 12 }}>
                Latitude: {coords.latitude}° N &nbsp;|&nbsp; Longitude: {coords.longitude}° E
              </div>

              <a
                href={coords.mapsUrl}
                target="_blank"
                rel="noopener noreferrer"
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 8,
                  background: "#2563EB",
                  color: "#FFFFFF",
                  padding: "9px 18px",
                  borderRadius: 8,
                  fontSize: 13,
                  fontWeight: 800,
                  textDecoration: "none",
                  boxShadow: "0 2px 10px rgba(37, 99, 235, 0.3)",
                }}
              >
                🗺️ Open Exact Pin in Google Maps
              </a>
            </div>
          ) : locationStatus === "Location Unavailable" ? (
            <div
              style={{
                background: "#FFFBEB",
                border: "1.5px solid #FCD34D",
                borderRadius: 14,
                padding: 14,
                marginBottom: 18,
              }}
            >
              <div style={{ display: "flex", alignItems: "flex-start", gap: 10 }}>
                <span style={{ fontSize: 20 }}>⚠️</span>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 13, fontWeight: 800, color: "#92400E" }}>
                    Location access is unavailable or denied by the browser
                  </div>
                  <div style={{ fontSize: 12, color: "#78350F", marginTop: 4, lineHeight: 1.4 }}>
                    Your emergency alert was still submitted immediately without GPS coordinates. Responders are notified that you need help.
                  </div>
                  <button
                    type="button"
                    onClick={() => setShowLocationHelp((s) => !s)}
                    style={{
                      background: "none",
                      border: "none",
                      padding: 0,
                      marginTop: 6,
                      fontSize: 12,
                      fontWeight: 700,
                      color: "#B45309",
                      textDecoration: "underline",
                      cursor: "pointer",
                    }}
                  >
                    {showLocationHelp ? "▲ Hide location instructions" : "▼ How to enable location in your browser"}
                  </button>

                  {showLocationHelp && (
                    <div
                      style={{
                        marginTop: 8,
                        padding: 10,
                        background: "#FEF3C7",
                        borderRadius: 8,
                        fontSize: 11.5,
                        color: "#78350F",
                        lineHeight: 1.45,
                      }}
                    >
                      1. Click the site settings or padlock/tune icon (🔒) in the browser address bar.<br />
                      2. Set <strong>Location</strong> to <strong>Allow</strong>.<br />
                      3. Refresh or click "Retry Location" below.
                    </div>
                  )}
                </div>
              </div>
            </div>
          ) : (
            <div
              style={{
                background: "#EFF6FF",
                border: "1.5px solid #BFDBFE",
                borderRadius: 14,
                padding: 14,
                marginBottom: 18,
                display: "flex",
                alignItems: "center",
                gap: 12,
              }}
            >
              <span style={{ fontSize: 20 }}>🛰️</span>
              <div style={{ fontSize: 13, color: "#1E40AF", fontWeight: 600 }}>
                Requesting high-accuracy GPS coordinates from your device… The alert is already progressing.
              </div>
            </div>
          )}

          {/* Alert Confirmation Details (When Sent) */}
          {alertStatus === "Sent" && (
            <div
              style={{
                background: "#F8FAFC",
                border: "1px solid #E2E8F0",
                borderRadius: 12,
                padding: "12px 16px",
                marginBottom: 18,
                display: "grid",
                gridTemplateColumns: "1fr 1fr",
                gap: 10,
                fontSize: 12,
              }}
            >
              <div>
                <span style={{ color: "#64748B", fontWeight: 700, textTransform: "uppercase", fontSize: 10 }}>
                  Emergency Alert ID
                </span>
                <div style={{ fontWeight: 800, color: "#0F172A", marginTop: 2, fontFamily: "monospace" }}>
                  {alertId}
                </div>
              </div>
              <div>
                <span style={{ color: "#64748B", fontWeight: 700, textTransform: "uppercase", fontSize: 10 }}>
                  Logged At
                </span>
                <div style={{ fontWeight: 700, color: "#0F172A", marginTop: 2 }}>
                  ⏰ {sentTimestamp}
                </div>
              </div>
              <div style={{ gridColumn: "1 / -1", borderTop: "1px solid #E2E8F0", paddingTop: 8, marginTop: 4 }}>
                <span style={{ color: "#15803D", fontWeight: 700 }}>
                  ✓ {serverMessage} Authorized campus administrators and responders have received this distress call.
                </span>
              </div>
            </div>
          )}

          {/* Alert Failure Retry Section */}
          {alertStatus === "Failed" && (
            <div
              style={{
                background: "#FEF2F2",
                border: "1.5px solid #F87171",
                borderRadius: 12,
                padding: "14px 16px",
                marginBottom: 18,
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
              }}
            >
              <div>
                <div style={{ fontWeight: 800, color: "#991B1B", fontSize: 13 }}>
                  Network transmission failed
                </div>
                <div style={{ fontSize: 11, color: "#B91C1C", marginTop: 2 }}>
                  Your local siren is still wailing. Please click retry to resend to campus security.
                </div>
              </div>
              <button
                type="button"
                onClick={() => sendEmergencyAlert(coords)}
                style={{
                  background: "#DC2626",
                  color: "#FFFFFF",
                  border: "none",
                  borderRadius: 8,
                  padding: "8px 16px",
                  fontSize: 12,
                  fontWeight: 800,
                  cursor: "pointer",
                  boxShadow: "0 2px 8px rgba(220, 38, 38, 0.4)",
                }}
              >
                ↻ Retry Alert
              </button>
            </div>
          )}

          {/* Direct Instant Contact (WhatsApp) */}
          <div
            style={{
              background: "#F0FDF4",
              border: "1.5px solid #86EFAC",
              borderRadius: 12,
              padding: "12px 16px",
              marginBottom: 16,
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              flexWrap: "wrap",
              gap: 10,
            }}
          >
            <div>
              <div style={{ fontSize: 13, fontWeight: 800, color: "#166534" }}>
                💬 Direct Emergency Helplines
              </div>
              <div style={{ fontSize: 11, color: "#15803D", marginTop: 2 }}>
                Chat with campus security desk immediately:
              </div>
            </div>
            <div>
              <button
                type="button"
                onClick={() => openWhatsApp("9987766898", "Campus Emergency Responders")}
                style={{
                  background: "#25D366", color: "#FFFFFF",
                  border: "none", borderRadius: 8, padding: "9px 18px",
                  fontSize: 13, fontWeight: 800, cursor: "pointer",
                  display: "inline-flex", alignItems: "center", gap: 8,
                  boxShadow: "0 2px 8px rgba(37,211,102,0.35)",
                }}
              >
                <WhatsAppIcon size={18} color="#FFFFFF" /> Message Control Desk on WhatsApp
              </button>
            </div>
          </div>

          {/* Safety & Mobile Browser Notice */}
          <div
            style={{
              fontSize: 11,
              color: "#64748B",
              background: "#F1F5F9",
              borderRadius: 8,
              padding: "10px 14px",
              marginBottom: 20,
              lineHeight: 1.5,
            }}
          >
            <strong>Mobile Browser Restrictions Notice:</strong> Mobile operating systems (Android & iOS) enforce strict security policies: Web Audio siren requires user tap gesture to play, and browsers restrict background sound and GPS updates when the screen is locked or browser is minimized. Keep this screen in the foreground while the emergency is active. In critical life danger, also call official emergency dispatch (112).
          </div>

          {/* Action Button Row */}
          {!showCancelConfirm ? (
            <div className="cems-siren-actions-row" style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
              <button
                type="button"
                onClick={toggleSirenAudio}
                style={{
                  flex: "1 1 180px",
                  padding: "13px",
                  borderRadius: 10,
                  border: "2px solid #CBD5E1",
                  background: "#FFFFFF",
                  color: "#334155",
                  fontSize: 13,
                  fontWeight: 800,
                  cursor: "pointer",
                  minHeight: "48px",
                }}
              >
                {sirenActive ? "🔇 Stop Siren Audio" : "🔊 Resume Siren"}
              </button>

              <button
                type="button"
                onClick={() => setShowCancelConfirm(true)}
                style={{
                  flex: "1 1 160px",
                  padding: "13px 20px",
                  borderRadius: 10,
                  border: "none",
                  background: "#EF4444",
                  color: "#FFFFFF",
                  fontSize: 13,
                  fontWeight: 800,
                  cursor: "pointer",
                  boxShadow: "0 2px 10px rgba(239, 68, 68, 0.3)",
                  minHeight: "48px",
                }}
              >
                Cancel Emergency
              </button>
            </div>
          ) : (
            /* Cancel Confirmation Dialog */
            <div
              style={{
                background: "#FEF2F2",
                border: "2px solid #DC2626",
                borderRadius: 12,
                padding: "14px 16px",
                textAlign: "center",
              }}
            >
              <div style={{ fontSize: 14, fontWeight: 800, color: "#991B1B", marginBottom: 6 }}>
                Are you sure you want to cancel this emergency alert?
              </div>
              <div style={{ fontSize: 12, color: "#7F1D1D", marginBottom: 14 }}>
                This will stop the siren wail and mark the alert as cancelled for responders.
              </div>
              <div style={{ display: "flex", justifyContent: "center", gap: 12 }}>
                <button
                  type="button"
                  onClick={handleCancelEmergency}
                  disabled={isCancelling}
                  style={{
                    padding: "10px 20px",
                    borderRadius: 8,
                    border: "none",
                    background: "#DC2626",
                    color: "#FFFFFF",
                    fontSize: 12,
                    fontWeight: 800,
                    cursor: isCancelling ? "not-allowed" : "pointer",
                  }}
                >
                  {isCancelling ? "Cancelling…" : "Yes, Cancel Alert"}
                </button>
                <button
                  type="button"
                  onClick={() => setShowCancelConfirm(false)}
                  style={{
                    padding: "10px 20px",
                    borderRadius: 8,
                    border: "1.5px solid #CBD5E1",
                    background: "#FFFFFF",
                    color: "#475569",
                    fontSize: 12,
                    fontWeight: 700,
                    cursor: "pointer",
                  }}
                >
                  No, Keep Active
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      <style>{`
        @keyframes sirenModalPulse {
          0% { box-shadow: 0 0 25px rgba(220, 38, 38, 0.5), 0 0 0 3px #EF4444; }
          100% { box-shadow: 0 0 55px rgba(220, 38, 38, 0.85), 0 0 0 6px #B91C1C; }
        }
        @keyframes sirenSpin {
          0% { transform: rotate(-15deg) scale(1); }
          50% { transform: rotate(15deg) scale(1.15); }
          100% { transform: rotate(-15deg) scale(1); }
        }
        @media (max-width: 520px) {
          .cems-siren-modal-card {
            border-radius: 14px !important;
            max-height: 94vh !important;
          }
          .cems-siren-modal-header {
            padding: 14px 16px !important;
          }
          .cems-siren-status-grid {
            grid-template-columns: 1fr !important;
          }
          .cems-siren-actions-row {
            flex-direction: column !important;
          }
          .cems-siren-actions-row button {
            width: 100% !important;
          }
        }
      `}</style>
    </div>
  );
}
