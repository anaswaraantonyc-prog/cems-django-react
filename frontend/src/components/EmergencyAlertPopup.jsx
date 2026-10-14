import { useState, useEffect } from "react";
import { SirenBeaconIcon } from "./EmergencySirenModal";
import { WhatsAppIcon, openWhatsApp } from "../modules/MedicalModule";

/* ════════════════════════════════════════════════════════════
   WEB AUDIO ALERT CHIME / SIREN BURST FOR RECEIVERS
════════════════════════════════════════════════════════════ */
class AlertSoundPlayer {
  constructor() {
    this.ctx = null;
    this.osc1 = null;
    this.osc2 = null;
    this.gain = null;
    this.isPlaying = false;
  }

  play() {
    try {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (!this.ctx || this.ctx.state === "closed") {
        this.ctx = new AudioCtx();
      }
      if (this.ctx.state === "suspended") {
        this.ctx.resume();
      }
      if (this.isPlaying) return;

      this.gain = this.ctx.createGain();
      this.gain.gain.setValueAtTime(0.35, this.ctx.currentTime);
      this.gain.connect(this.ctx.destination);

      this.osc1 = this.ctx.createOscillator();
      this.osc1.type = "sawtooth";
      this.osc1.frequency.setValueAtTime(800, this.ctx.currentTime);

      this.osc2 = this.ctx.createOscillator();
      this.osc2.type = "sine";
      this.osc2.frequency.setValueAtTime(805, this.ctx.currentTime);

      // Alternating alarm pitch every 0.3s
      const lfo = this.ctx.createOscillator();
      lfo.type = "square";
      lfo.frequency.setValueAtTime(2.5, this.ctx.currentTime); // 2.5 Hz warble

      const lfoGain = this.ctx.createGain();
      lfoGain.gain.setValueAtTime(200, this.ctx.currentTime);

      lfo.connect(lfoGain);
      lfoGain.connect(this.osc1.frequency);
      lfoGain.connect(this.osc2.frequency);

      this.osc1.connect(this.gain);
      this.osc2.connect(this.gain);

      this.osc1.start();
      this.osc2.start();
      lfo.start();

      this.isPlaying = true;
    } catch (e) {
      console.warn("Could not start alert audio:", e);
    }
  }

  stop() {
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
      if (this.ctx) {
        this.ctx.close();
      }
    } catch (e) {}
    this.isPlaying = false;
    this.ctx = null;
  }
}

export const alertSound = new AlertSoundPlayer();

export default function EmergencyAlertPopup({ alarm, onDismiss }) {
  const [soundActive, setSoundActive] = useState(true);

  // Play alarm sound automatically when the popup opens on any user's screen
  useEffect(() => {
    alertSound.play();
    setSoundActive(true);

    const onUserTouch = () => {
      alertSound.play();
    };
    window.addEventListener("pointerdown", onUserTouch, { once: true });
    window.addEventListener("keydown", onUserTouch, { once: true });

    return () => {
      window.removeEventListener("pointerdown", onUserTouch);
      window.removeEventListener("keydown", onUserTouch);
      alertSound.stop();
    };
  }, [alarm?.id]);

  const toggleSound = () => {
    if (soundActive) {
      alertSound.stop();
      setSoundActive(false);
    } else {
      alertSound.play();
      setSoundActive(true);
    }
  };

  const mapsUrl = alarm?.maps_url || (alarm?.latitude && alarm?.longitude
    ? `https://www.google.com/maps?q=${alarm.latitude},${alarm.longitude}`
    : null);

  return (
    <div style={{
      position: "fixed",
      inset: 0,
      background: "rgba(15, 23, 42, 0.88)",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      zIndex: 100000,
      padding: 16,
      backdropFilter: "blur(8px)",
      fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, sans-serif",
    }}>
      <div style={{
        width: "min(560px, 100%)",
        background: "#FFFFFF",
        borderRadius: 20,
        boxShadow: "0 25px 60px rgba(220, 38, 38, 0.5), 0 0 0 4px #DC2626",
        border: "3px solid #EF4444",
        overflow: "hidden",
        animation: "sirenModalPulse 1.2s ease-in-out infinite alternate",
      }}>
        {/* Flashing Red Top Header */}
        <div style={{
          background: "linear-gradient(135deg, #7F1D1D 0%, #DC2626 50%, #991B1B 100%)",
          color: "#FFFFFF",
          padding: "18px 22px",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <div style={{
              width: 46, height: 46, borderRadius: "50%",
              background: "#FFFFFF",
              color: "#DC2626",
              display: "flex", alignItems: "center", justifyContent: "center",
              boxShadow: "0 0 18px rgba(255,255,255,0.85)",
              animation: "sirenSpin 1.4s ease-in-out infinite",
            }}>
              <SirenBeaconIcon size={28} color="#DC2626" />
            </div>
            <div>
              <div style={{ fontSize: 11, fontWeight: 800, letterSpacing: "0.08em", color: "#FEE2E2", textTransform: "uppercase" }}>
                High Priority Alert · All Registered Users
              </div>
              <h2 style={{ margin: "2px 0 0", fontSize: 19, fontWeight: 900, color: "#FFFFFF" }}>
                🚨 CAMPUS EMERGENCY ALERT
              </h2>
            </div>
          </div>

          <button
            type="button"
            onClick={toggleSound}
            style={{
              background: soundActive ? "#FEF2F2" : "rgba(255,255,255,0.2)",
              color: soundActive ? "#DC2626" : "#FFFFFF",
              border: `2px solid ${soundActive ? "#EF4444" : "#FFFFFF"}`,
              borderRadius: 30,
              padding: "6px 14px",
              fontWeight: 800,
              fontSize: 11,
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              gap: 6,
            }}
          >
            {soundActive ? "🔊 Mute Alarm" : "🔇 Unmute Alarm"}
          </button>
        </div>

        {/* Modal Body */}
        <div style={{ padding: "20px 22px" }}>
          {/* Situation Notice */}
          <div style={{
            background: "#FEF2F2",
            border: "1.5px solid #FCA5A5",
            borderRadius: 12,
            padding: "12px 16px",
            marginBottom: 16,
            color: "#991B1B",
            fontSize: 13,
            lineHeight: 1.5,
          }}>
            <strong style={{ display: "block", fontSize: 14, marginBottom: 4 }}>
              ⚠️ A person has pressed the Emergency Panic Siren on campus!
            </strong>
            Please be aware of the live location below and assist if you are nearby or notify security.
          </div>

          {/* Automated Real-Time Location Card */}
          <div style={{
            background: "linear-gradient(135deg, #FFFBEB 0%, #FEF3C7 100%)",
            border: "2px solid #F59E0B",
            borderRadius: 14,
            padding: "16px",
            marginBottom: 16,
            boxShadow: "0 4px 12px rgba(245, 158, 11, 0.15)",
          }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
              <span style={{ fontSize: 22 }}>📍</span>
              <span style={{ fontSize: 12, fontWeight: 800, color: "#92400E", textTransform: "uppercase", letterSpacing: "0.06em" }}>
                Automated Detected Location of Person:
              </span>
            </div>

            <div style={{
              fontSize: 16,
              fontWeight: 900,
              color: "#78350F",
              marginBottom: 8,
              lineHeight: 1.4,
            }}>
              {alarm?.location || "Campus Premises"}
            </div>

            {alarm?.latitude && alarm?.longitude && (
              <div style={{
                fontSize: 12,
                color: "#92400E",
                fontFamily: "monospace",
                marginBottom: 10,
                background: "rgba(255,255,255,0.7)",
                padding: "4px 8px",
                borderRadius: 6,
                display: "inline-block",
              }}>
                GPS: {alarm.latitude}° N, {alarm.longitude}° E
                {alarm.accuracy ? ` (±${alarm.accuracy}m)` : ""}
              </div>
            )}

            {mapsUrl && (
              <div>
                <a
                  href={mapsUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: 8,
                    background: "#2563EB",
                    color: "#FFFFFF",
                    padding: "8px 16px",
                    borderRadius: 8,
                    fontWeight: 800,
                    fontSize: 13,
                    textDecoration: "none",
                    boxShadow: "0 3px 10px rgba(37, 99, 235, 0.3)",
                  }}
                >
                  🗺️ View Exact Pin on Google Maps
                </a>
              </div>
            )}
          </div>

          {/* Caller Details & Timestamp */}
          <div style={{
            background: "#F8FAFC",
            border: "1px solid #E2E8F0",
            borderRadius: 12,
            padding: "12px 16px",
            marginBottom: 18,
            display: "grid",
            gridTemplateColumns: "1fr 1fr",
            gap: 12,
            fontSize: 13,
          }}>
            <div>
              <div style={{ color: "#64748B", fontSize: 11, fontWeight: 700, textTransform: "uppercase" }}>
                Person Reporting
              </div>
              <div style={{ fontWeight: 800, color: "#1E293B", marginTop: 2 }}>
                👤 {alarm?.caller_name || "Campus Member"}
              </div>
            </div>

            <div>
              <div style={{ color: "#64748B", fontSize: 11, fontWeight: 700, textTransform: "uppercase" }}>
                Time of Alert
              </div>
              <div style={{ fontWeight: 700, color: "#1E293B", marginTop: 2 }}>
                ⏰ {alarm?.created_at || "Just now"}
              </div>
            </div>

            {alarm?.phone && (
              <div>
                <div style={{ color: "#64748B", fontSize: 11, fontWeight: 700, textTransform: "uppercase" }}>
                  Contact Phone
                </div>
                <div style={{ fontWeight: 800, color: "#059669", marginTop: 2 }}>
                  📞 {alarm.phone}
                </div>
              </div>
            )}

            {alarm?.notes && (
              <div>
                <div style={{ color: "#64748B", fontSize: 11, fontWeight: 700, textTransform: "uppercase" }}>
                  Notes
                </div>
                <div style={{ color: "#475569", fontSize: 12, marginTop: 2 }}>
                  {alarm.notes}
                </div>
              </div>
            )}
          </div>

          {/* Emergency WhatsApp Contact Button */}
          <div style={{ marginBottom: 16 }}>
            <button
              type="button"
              onClick={() => openWhatsApp("9987766898", "Campus Emergency Alert Desk")}
              style={{
                width: "100%",
                background: "#25D366",
                color: "#FFFFFF",
                border: "none",
                borderRadius: 8,
                padding: "10px 14px",
                textAlign: "center",
                fontWeight: 800,
                fontSize: 13,
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: 8,
                boxShadow: "0 2px 8px rgba(37,211,102,0.35)",
              }}
            >
              <WhatsAppIcon size={18} color="#FFFFFF" /> Chat with Campus Responders on WhatsApp
            </button>
          </div>

          {/* Dismiss Action */}
          <button
            type="button"
            onClick={() => {
              alertSound.stop();
              onDismiss?.();
            }}
            style={{
              width: "100%",
              padding: "12px",
              borderRadius: 10,
              border: "none",
              background: "linear-gradient(135deg, #15803D, #16A34A)",
              color: "#FFFFFF",
              fontSize: 14,
              fontWeight: 800,
              cursor: "pointer",
              boxShadow: "0 4px 14px rgba(22, 163, 74, 0.35)",
            }}
          >
            ✓ I Acknowledge · Close Pop-up
          </button>
        </div>
      </div>
    </div>
  );
}
