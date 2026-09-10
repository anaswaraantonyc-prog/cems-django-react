import { useEffect, useRef, useState, useCallback } from "react";
import { Card, Label, Stamp } from "../components/Shared";
import { buttonStyle, line, sage, brick, gold, goldLight, maroon, maroonDark, offWhite, maroonSoft } from "../theme";

/* ═══════════════════════════════════════════════════════════
   ICONS & HELPERS
═══════════════════════════════════════════════════════════ */
function PhoneIcon({ size = 22 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none"
      stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.8 19.8 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6A19.8 19.8 0 0 1 2.12 4.18 2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72c.12.9.33 1.78.62 2.63a2 2 0 0 1-.45 2.11L8 9.73a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.85.29 1.73.5 2.63.62A2 2 0 0 1 22 16.92z" />
    </svg>
  );
}

function authHeader() {
  const token = localStorage.getItem("cems_access") || "";
  return token ? { Authorization: `Bearer ${token}` } : {};
}

/* ── Detect if we're likely on a mobile device that supports tel: ── */
function isMobile() {
  return /Android|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
}

/* ── Open call: tel: on mobile, Google search on desktop ── */
function openCall(number, name) {
  if (isMobile()) {
    window.location.href = `tel:${number.replace(/[^\d+]/g, "")}`;
  } else {
    const query = encodeURIComponent(`${name} ${number} medical representative contact`);
    window.open(`https://www.google.com/search?q=${query}`, "_blank", "noopener,noreferrer");
  }
}

/* ── auto-trigger call on load ── */
function AutoCall({ number, name }) {
  useEffect(() => {
    // Small delay so the calling screen renders first, then trigger
    const t = setTimeout(() => openCall(number, name), 800);
    return () => clearTimeout(t);
  }, [number, name]);
  return null;
}

/* ═══════════════════════════════════════════════════════════
   CAMERA SCANNER COMPONENT (Only used in Emergency Login Mode)
═══════════════════════════════════════════════════════════ */
function CameraView({ mode, onCapture }) {
  const videoRef   = useRef(null);
  const canvasRef  = useRef(null);
  const streamRef  = useRef(null);
  const countRef   = useRef(null);

  const [starting,  setStarting]  = useState(true);
  const [camError,  setCamError]  = useState("");
  const [countdown, setCountdown] = useState(null);

  const isIdCard = mode === "idcard";
  const frameLabel = isIdCard
    ? "Hold the complete ID card flat inside the frame"
    : "Look straight at the camera with your face in the oval";

  /* start camera */
  useEffect(() => {
    let cancelled = false;
    (async () => {
      if (!navigator.mediaDevices?.getUserMedia) {
        setCamError("Camera not available in this browser."); setStarting(false); return;
      }
      try {
        let stream;
        try {
          const facing = isIdCard ? { ideal: "environment" } : { ideal: "user" };
          stream = await navigator.mediaDevices.getUserMedia({
            video: { width: { ideal: 1280 }, height: { ideal: 720 }, facingMode: facing },
            audio: false,
          });
        } catch {
          stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: false });
        }
        if (cancelled) { stream.getTracks().forEach(t => t.stop()); return; }
        streamRef.current = stream;
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
        setStarting(false);
        setCountdown(3); // start countdown immediately
      } catch (err) {
        setCamError(err.message || "Camera permission denied."); setStarting(false);
      }
    })();
    return () => {
      cancelled = true;
      streamRef.current?.getTracks().forEach(t => t.stop());
      if (countRef.current) clearTimeout(countRef.current);
    };
  }, [isIdCard]);

  /* countdown tick → auto capture */
  useEffect(() => {
    if (countdown === null) return;
    if (countdown === 0) { doCapture(); return; }
    const id = setTimeout(() => setCountdown(c => c - 1), 1000);
    countRef.current = id;
    return () => clearTimeout(id);
  }, [countdown]); // eslint-disable-line

  const doCapture = useCallback(() => {
    const video  = videoRef.current;
    const canvas = canvasRef.current;
    if (!video || !video.videoWidth) { setTimeout(doCapture, 300); return; }
    canvas.width  = video.videoWidth;
    canvas.height = video.videoHeight;
    canvas.getContext("2d").drawImage(video, 0, 0);
    canvas.toBlob(blob => {
      if (blob) {
        const fname = isIdCard ? "id-card-scan.jpg" : "face-scan.jpg";
        onCapture(new File([blob], fname, { type: "image/jpeg" }));
      }
    }, "image/jpeg", 0.95);
  }, [isIdCard, onCapture]);

  const resetCountdown = () => {
    if (countRef.current) clearTimeout(countRef.current);
    setCountdown(3);
  };

  const cdColor = countdown === 1 ? "#ff5252" : countdown === 2 ? "#ffb300" : "#69f0ae";

  return (
    <div style={{ textAlign: "center" }}>
      {/* preview box */}
      <div style={{
        position: "relative", width: "100%", maxWidth: 440,
        height: 280, margin: "0 auto 12px", borderRadius: 12,
        overflow: "hidden", border: `2.5px solid ${gold}`, background: "#000",
      }}>
        <video ref={videoRef} muted playsInline
          style={{ width: "100%", height: "100%", objectFit: "cover" }} />

        {isIdCard
          ? <div style={{
              position: "absolute", left: "5%", right: "5%",
              top: "12%", bottom: "12%",
              border: "2.5px dashed rgba(255,255,255,0.90)",
              borderRadius: 8, pointerEvents: "none",
            }} />
          : <div style={{
              position: "absolute", left: "25%", right: "25%",
              top: "8%", bottom: "8%",
              border: "3px solid rgba(255,255,255,0.85)",
              borderRadius: "50%", pointerEvents: "none",
            }} />
        }

        {countdown !== null && countdown > 0 && (
          <div style={{
            position: "absolute", inset: 0,
            background: "rgba(0,0,0,0.42)",
            display: "flex", flexDirection: "column",
            alignItems: "center", justifyContent: "center",
            pointerEvents: "none",
          }}>
            <div style={{ fontSize: 70, fontWeight: 900, color: cdColor,
              textShadow: "0 2px 14px rgba(0,0,0,0.7)", lineHeight: 1,
              fontFamily: "Georgia, serif" }}>{countdown}</div>
            <div style={{ fontSize: 13, color: "#fff", marginTop: 8,
              fontWeight: 600, letterSpacing: "0.04em" }}>Hold steady…</div>
          </div>
        )}

        {countdown === 0 && (
          <div style={{
            position: "absolute", inset: 0,
            background: "rgba(255,255,255,0.88)",
            animation: "flash 0.28s ease-out forwards",
            pointerEvents: "none",
          }} />
        )}
      </div>

      <canvas ref={canvasRef} style={{ display: "none" }} />

      {starting && !camError && (
        <div style={{ fontSize: 12, color: "#8A8368", marginBottom: 6 }}>Starting camera…</div>
      )}
      {camError && (
        <div style={{ fontSize: 12, color: brick, marginBottom: 8 }}>⚠️ {camError}</div>
      )}

      <div style={{ fontSize: 12, color: "#6B644C", marginBottom: 12 }}>
        {camError ? "Use the file upload option below." : frameLabel}
      </div>

      <div style={{ display: "flex", gap: 10, justifyContent: "center", flexWrap: "wrap" }}>
        <button
          disabled={!!camError || starting}
          onClick={() => { if (countRef.current) clearTimeout(countRef.current); doCapture(); }}
          style={{
            padding: "9px 22px", borderRadius: 8, border: "none",
            background: `linear-gradient(135deg, ${maroon}, ${maroonSoft})`,
            color: "#fff", fontWeight: 700, fontSize: 13,
            cursor: (camError || starting) ? "not-allowed" : "pointer",
            opacity: (camError || starting) ? 0.5 : 1,
            boxShadow: "0 3px 10px rgba(107,30,43,0.35)",
          }}>
          {isIdCard ? "📷 Scan Card Now" : "🤳 Scan Face Now"}
        </button>
        {!camError && !starting && (
          <button onClick={resetCountdown}
            style={{
              padding: "9px 18px", borderRadius: 8,
              border: `1.5px solid ${gold}`, background: "transparent",
              color: gold, fontWeight: 700, fontSize: 13, cursor: "pointer",
            }}>↻ Retry</button>
        )}
      </div>

      <label style={{
        display: "inline-block", marginTop: 14,
        fontSize: 12, color: "#6B644C",
        textDecoration: "underline", cursor: "pointer",
      }}>
        Or upload a {isIdCard ? "photo of the ID card" : "face photo"} from file
        <input type="file" accept="image/jpeg,image/png,image/webp"
          style={{ display: "none" }}
          onChange={e => { const f = e.target.files?.[0]; if (f) onCapture(f); }} />
      </label>

      <style>{`
        @keyframes flash { from { opacity:1; } to { opacity:0; } }
      `}</style>
    </div>
  );
}

function ModeTab({ active, onClick, icon, title, desc }) {
  return (
    <button onClick={onClick} style={{
      flex: 1, padding: "14px 10px", borderRadius: 10, cursor: "pointer",
      border: `2px solid ${active ? maroon : "#DDD0C4"}`,
      background: active ? `${maroon}0D` : "#fff",
      color: active ? maroonDark : "#7A5A60",
      fontWeight: active ? 700 : 400,
      textAlign: "center", transition: "all 0.18s",
    }}>
      <div style={{ fontSize: 28, marginBottom: 4 }}>{icon}</div>
      <div style={{ fontSize: 13, fontWeight: 700 }}>{title}</div>
      <div style={{ fontSize: 11, marginTop: 3, color: active ? maroon : "#9A8088", lineHeight: 1.4 }}>
        {desc}
      </div>
    </button>
  );
}

/* ═══════════════════════════════════════════════════════════
   MAIN MEDICAL MODULE
═══════════════════════════════════════════════════════════ */
export default function MedicalModule({ emergencyMode = false, onSuccess, onClose }) {
  /* Common States */
  const [mode, setMode]           = useState("idcard"); // "idcard" | "face"
  const [stage, setStage]         = useState(emergencyMode ? "select" : "dashboard_calling");
  const [error, setError]         = useState("");
  
  /* Responder / Staff List States (For calling setup) */
  const [loadingStaff, setLoadingStaff] = useState(false);
  const [staffList, setStaffList]       = useState([]);
  const [activeStaff, setActiveStaff]   = useState(null);

  /* Trigger Call State helper */
  const [dialTrigger, setDialTrigger] = useState(0);

  /* ──────────────────────────────────────────────────────────
     FETCH ON-DUTY STAFF (For dashboard calling setup and public login screen)
  ────────────────────────────────────────────────────────── */
  const fetchOnDutyStaff = useCallback(async () => {
    setLoadingStaff(true);
    setError("");
    try {
      const res = await fetch("/api/emergency/on-duty/", {
        headers: authHeader(),
      });
      if (!res.ok) {
        setError("Failed to retrieve medical representative details.");
        return;
      }
      const data = await res.json();
      const list = Array.isArray(data) ? data : (data.results ?? []);
      setStaffList(list);
      if (list.length > 0) {
        // Default to the first medical representative on duty
        const active = list[0];
        setActiveStaff(active);
        // Automatically dial on load ONLY inside dashboard calling setup
        if (!emergencyMode) {
          setDialTrigger(prev => prev + 1);
        }
      }
    } catch {
      setError("Unable to reach event medical server. Check connectivity.");
    } finally {
      setLoadingStaff(false);
    }
  }, [emergencyMode]);

  useEffect(() => {
    fetchOnDutyStaff();
  }, [fetchOnDutyStaff]);

  /* ──────────────────────────────────────────────────────────
     EMERGENCY VERIFICATION SCAN HANDLE (Login Page mode only)
  ────────────────────────────────────────────────────────── */
  const handleCapture = async (file) => {
    setStage("verifying");
    setError("");

    const body = new FormData();
    let endpoint;

    if (mode === "idcard") {
      body.append("id_card_image", file);
      endpoint = "/api/emergency/id-card-login/";
    } else {
      body.append("face_image", file);
      endpoint = "/api/emergency/face-login/";
    }

    try {
      const res  = await fetch(endpoint, { method: "POST", body });
      const data = await res.json();
      if (!res.ok) {
        setError(data.detail || "Identity verification failed.");
        setStage("failed");
        return;
      }
      // Successful match! Immediately call parent handleEmergencySuccess
      // This will set state, store tokens, and open the dashboard calling module.
      onSuccess?.(data);
    } catch {
      setError("Cannot reach the server. Make sure Django is running on port 8000.");
      setStage("failed");
    }
  };

  /* ═══════════════════════════════════════════════════════════
     RENDER SCENARIO A: LOGIN PAGE SCANNER (emergencyMode = true)
  ═══════════════════════════════════════════════════════════ */
  if (emergencyMode) {
    if (stage === "select") {
      return (
        <Card style={{ padding: "24px", background: "#FFFBFB", border: `2px solid ${brick}` }}>
          {/* Header */}
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16, borderBottom: `2px solid ${line}`, paddingBottom: 10 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <span style={{ fontSize: 24 }}>🚨</span>
              <span style={{ fontFamily: "Georgia, serif", fontSize: 18, fontWeight: 800, color: "#9E2A2B" }}>Emergency Help Desk</span>
            </div>
            {onClose && (
              <button onClick={onClose} style={{ border: "none", background: "none", cursor: "pointer", fontSize: 22, color: "#666", fontWeight: 700 }}>
                &times;
              </button>
            )}
          </div>

          {/* Section 1: Immediate Assistance Calling */}
          <div style={{ marginBottom: 24 }}>
            <h3 style={{ margin: "0 0 10px 0", fontSize: 12, fontWeight: 800, color: maroonDark, letterSpacing: "0.05em", textTransform: "uppercase" }}>
              📞 Immediate Assistance (No Login Required)
            </h3>
            {loadingStaff ? (
              <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "12px", background: "rgba(0,0,0,0.02)", borderRadius: 8 }}>
                <div style={{ width: 16, height: 16, border: "2px solid #ccc", borderTopColor: maroon, borderRadius: "50%", animation: "spin 0.8s linear infinite" }} />
                <span style={{ fontSize: 12, color: "#666" }}>Loading available representatives...</span>
              </div>
            ) : staffList.length === 0 ? (
              <div style={{ padding: "12px", background: "#FEF2F2", borderRadius: 8, fontSize: 12, color: brick, border: `1px dashed ${brick}` }}>
                ⚠️ No medical staff on duty. Please use campus emergency services.
              </div>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                {staffList.map(s => (
                  <div key={s.id} style={{
                    background: "#fff", border: `1.5px solid ${line}`,
                    borderRadius: 10, padding: "12px",
                    display: "flex", justifyContent: "space-between", alignItems: "center",
                    boxShadow: "0 2px 6px rgba(0,0,0,0.03)"
                  }}>
                    <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
                      {s.profile_image ? (
                        <img
                          src={s.profile_image.startsWith("http") ? s.profile_image : `http://127.0.0.1:8000${s.profile_image}`}
                          alt={s.name}
                          style={{ width: 46, height: 46, borderRadius: "50%", objectFit: "cover", border: `2px solid ${gold}` }}
                        />
                      ) : (
                        <div style={{ width: 46, height: 46, borderRadius: "50%", background: maroonSoft, display: "flex", alignItems: "center", justifyContent: "center", color: gold, fontWeight: 700, border: `2px solid ${gold}` }}>
                          {(s.name || "?")[0].toUpperCase()}
                        </div>
                      )}
                      <div style={{ textAlign: "left" }}>
                        <div style={{ fontWeight: 800, fontSize: 14, color: maroonDark }}>{s.name}</div>
                        <div style={{ fontSize: 11, color: "#6B644C", fontWeight: 600 }}>{s.designation}</div>
                        {s.education && (
                          <div style={{ fontSize: 10, color: "#9A8088", marginTop: 2 }}>
                            🎓 {s.education}
                          </div>
                        )}
                      </div>
                    </div>
                    <a href={`tel:${s.contact_number}`} style={{
                      display: "inline-flex", alignItems: "center", justifyContent: "center",
                      width: 38, height: 38, borderRadius: "50%", background: "#e53935",
                      color: "#fff", boxShadow: "0 3px 8px rgba(229,57,53,0.35)",
                      textDecoration: "none", transition: "transform 0.15s",
                    }}
                    onMouseEnter={e => e.currentTarget.style.transform = "scale(1.1)"}
                    onMouseLeave={e => e.currentTarget.style.transform = "scale(1)"}
                    title={`Call ${s.name}`}
                    >
                      <PhoneIcon size={16} />
                    </a>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Section 2: Scan & Authenticate Verification */}
          <div style={{ borderTop: `1.5px solid ${line}`, paddingTop: 18 }}>
            <h3 style={{ margin: "0 0 10px 0", fontSize: 12, fontWeight: 800, color: maroonDark, letterSpacing: "0.05em", textTransform: "uppercase" }}>
              🔒 Scan to Authenticate &amp; Log In
            </h3>
            <p style={{ fontSize: 12, color: "#6B644C", margin: "0 0 14px 0", lineHeight: 1.4 }}>
              Scan your physical ID card or verify your face to log in immediately and auto-access the calling dashboard.
            </p>
            <div style={{ display: "flex", gap: 12, marginBottom: 14 }}>
              <ModeTab
                active={mode === "idcard"}
                onClick={() => { setMode("idcard"); setStage("scanning"); }}
                icon="🪪"
                title="ID Card Scan"
                desc="Click to launch camera & scan ID"
              />
              <ModeTab
                active={mode === "face"}
                onClick={() => { setMode("face"); setStage("scanning"); }}
                icon="🤳"
                title="Face Scan"
                desc="Click to launch camera & match face"
              />
            </div>
            <button
              onClick={() => setStage("scanning")}
              style={{
                width: "100%", padding: "13px", borderRadius: 8, border: "none",
                background: `linear-gradient(135deg, ${maroon}, ${maroonSoft})`,
                color: "#fff", fontWeight: 800, fontSize: 14, cursor: "pointer",
                boxShadow: "0 4px 16px rgba(107,30,43,0.3)",
                transition: "all 0.2s",
              }}>
              {mode === "idcard" ? "📷 Start ID Card Camera Scan" : "🤳 Start Face Camera Scan"}
            </button>
          </div>
        </Card>
      );
    }

    if (stage === "scanning") {
      return (
        <Card>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
            <Label>{mode === "idcard" ? "🪪 ID Card Scan" : "🤳 Face Scan"}</Label>
            <div style={{ display: "flex", gap: 8 }}>
              <button onClick={() => setStage("select")}
                style={{ border: "none", background: "none", cursor: "pointer",
                  fontSize: 12, color: "#9A7A58", textDecoration: "underline" }}>
                ← Change method
              </button>
              {onClose && <button onClick={onClose}
                style={{ border: "none", background: "none", cursor: "pointer", fontSize: 20 }}>×</button>}
            </div>
          </div>
          <CameraView mode={mode} onCapture={handleCapture} />
        </Card>
      );
    }

    if (stage === "verifying") {
      return (
        <Card>
          <Label>Verifying identity…</Label>
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center",
            padding: "30px 0", gap: 14 }}>
            <div style={{ width: 44, height: 44, border: "4px solid #E8D0D4",
              borderTopColor: maroon, borderRadius: "50%",
              animation: "spin 0.8s linear infinite" }} />
            <p style={{ fontSize: 13, color: "#6B644C", textAlign: "center" }}>
              {mode === "idcard"
                ? "Comparing physical card image with all registered ID cards…"
                : "Analyzing live camera capture with registered face profile photo…"}
            </p>
          </div>
          <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
        </Card>
      );
    }

    if (stage === "failed") {
      return (
        <Card style={{ borderColor: brick }}>
          <Label>Match failed</Label>
          <div style={{
            background: "#fff0f0", border: "1px solid #f5c6c6",
            borderRadius: 8, padding: "14px 16px", marginBottom: 16,
            fontSize: 13, color: "#b71c1c",
          }}>⚠️ {error}</div>
          <div style={{ display: "flex", gap: 10 }}>
            <button onClick={() => setStage("scanning")} style={buttonStyle("primary")}>
              Try Again
            </button>
            <button onClick={() => { setStage("select"); setError(""); }}
              style={buttonStyle("secondary")}>
              Change Method
            </button>
            {onClose && (
              <button onClick={onClose} style={buttonStyle("secondary")}>Close</button>
            )}
          </div>
        </Card>
      );
    }
  }

  /* ── Inside Dashboard Internal Sub-Tab State ── */
  const [internalTab, setInternalTab] = useState("helpline"); // "helpline" | "sos" | "logs" | "stations"

  /* Logs State (Tab 3) */
  const [logsList, setLogsList]       = useState([]);
  const [loadingLogs, setLoadingLogs] = useState(false);
  const [logsError, setLogsError]     = useState("");

  /* SOS Form State (Tab 2) */
  const [sosData, setSosData] = useState({
    type: "Medical Injury 🩹",
    severity: "High (Urgent)",
    location: "Main Academic Block - Ground Floor",
    phone: "",
    notes: "",
  });
  const [sosSuccess, setSosSuccess] = useState(null);

  /* Accordion State (Tab 4) */
  const [openProtocol, setOpenProtocol] = useState("cpr");

  /* Fetch Access Logs */
  const fetchLogs = useCallback(async () => {
    setLoadingLogs(true);
    setLogsError("");
    try {
      const res = await fetch("/api/emergency/logs/", { headers: authHeader() });
      if (!res.ok) {
        setLogsError("Unable to fetch access logs. Authentication required.");
        return;
      }
      const data = await res.json();
      setLogsList(Array.isArray(data) ? data : (data.results ?? []));
    } catch {
      setLogsError("Failed to reach emergency logs endpoint.");
    } finally {
      setLoadingLogs(false);
    }
  }, []);

  useEffect(() => {
    if (!emergencyMode && internalTab === "logs") {
      fetchLogs();
    }
  }, [emergencyMode, internalTab, fetchLogs]);

  const handleSosSubmit = (e) => {
    e.preventDefault();
    const ticketId = "SOS-" + Math.floor(100000 + Math.random() * 900000);
    setSosSuccess({
      ticketId,
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      assignedStaff: activeStaff ? activeStaff.name : "On-Duty Medical Team",
      phone: activeStaff ? activeStaff.contact_number : "Emergency Hotline",
    });
  };

  /* ═══════════════════════════════════════════════════════════
     RENDER SCENARIO B: APP INSIDE HELPLINE (emergencyMode = false)
     Rich internal structure with Sub-Tabs for Helpline, SOS Dispatch,
     Access History, and First-Aid Protocols.
  ═══════════════════════════════════════════════════════════ */
  if (loadingStaff && staffList.length === 0) {
    return (
      <Card>
        <Label>Loading Medical Module…</Label>
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", padding: "40px 0", gap: 14 }}>
          <div style={{ width: 40, height: 40, border: "4px solid #E8D0D4",
            borderTopColor: maroon, borderRadius: "50%",
            animation: "spin 0.8s linear infinite" }} />
          <p style={{ fontSize: 13, color: "#8A5560" }}>Fetching on-duty medical representatives…</p>
        </div>
      </Card>
    );
  }

  return (
    <div style={{ fontFamily: "'Inter', system-ui, sans-serif", maxWidth: 760, margin: "0 auto" }}>
      {/* ── Auto dial link trigger ── */}
      {activeStaff && dialTrigger > 0 && (
        <AutoCall key={`${activeStaff.id}-${dialTrigger}`} number={activeStaff.contact_number} name={activeStaff.name} />
      )}

      {/* ── Sub-Navigation Tabs Bar ── */}
      <div style={{
        display: "flex", gap: 6, padding: "6px", background: "#F4EBE8",
        borderRadius: 12, marginBottom: 20, border: `1px solid ${line}`,
        boxShadow: "inset 0 1px 3px rgba(0,0,0,0.06)", overflowX: "auto"
      }}>
        {[
          { id: "helpline", label: "📞 Helpline & Call", desc: "Live Representatives" },
          { id: "sos",      label: "🚨 Report SOS",      desc: "Emergency Dispatch" },
          { id: "logs",     label: "📜 Access Logs",     desc: "History Records" },
          { id: "stations", label: "🏥 First-Aid Posts", desc: "Guide & Locations" },
        ].map(tab => {
          const isActive = internalTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setInternalTab(tab.id)}
              style={{
                flex: 1, minWidth: 130, padding: "10px 12px", borderRadius: 8,
                border: "none", cursor: "pointer",
                background: isActive ? `linear-gradient(135deg, ${maroon}, ${maroonSoft})` : "transparent",
                color: isActive ? "#fff" : maroonDark,
                fontWeight: isActive ? 700 : 600, fontSize: 13,
                boxShadow: isActive ? "0 3px 10px rgba(107,30,43,0.3)" : "none",
                transition: "all 0.18s ease-in-out", textAlign: "center",
              }}
            >
              <div>{tab.label}</div>
              <div style={{ fontSize: 10, opacity: isActive ? 0.85 : 0.65, marginTop: 2, fontWeight: 400 }}>
                {tab.desc}
              </div>
            </button>
          );
        })}
      </div>

      {/* ──────────────────────────────────────────────────────────
         TAB 1: HELPLINE & CALLING
      ────────────────────────────────────────────────────────── */}
      {internalTab === "helpline" && (
        <div>
          {staffList.length === 0 ? (
            <Card style={{ borderColor: brick }}>
              <Label>No Medical Staff On-Duty</Label>
              <div style={{ padding: "20px 0", textAlign: "center" }}>
                <span style={{ fontSize: 44 }}>⚠️</span>
                <p style={{ fontSize: 14, fontWeight: 700, color: maroonDark, marginTop: 10 }}>
                  No representative configured!
                </p>
                <p style={{ fontSize: 13, color: "#6B644C", marginTop: 4 }}>
                  There are currently no medical staff set as "On Duty" in the CEMS database.
                </p>
              </div>
              <button onClick={fetchOnDutyStaff} style={{ ...buttonStyle("secondary"), width: "100%" }}>
                ↻ Refresh List
              </button>
            </Card>
          ) : (
            <>
              {/* Active Hero Call Panel */}
              <div style={{
                background: `linear-gradient(160deg, ${maroonDark} 0%, ${maroon} 60%, ${maroonSoft} 100%)`,
                borderRadius: 16, padding: "28px 24px",
                boxShadow: "0 8px 36px rgba(107,30,43,0.35)",
                textAlign: "center", color: "#fff",
              }}>
                <div style={{
                  display: "inline-flex", alignItems: "center", gap: 6,
                  background: "rgba(255,255,255,0.12)", border: "1px solid rgba(255,255,255,0.25)",
                  padding: "4px 12px", borderRadius: 20, fontSize: 11, color: goldLight,
                  fontWeight: 700, letterSpacing: "0.08em", marginBottom: 16, textTransform: "uppercase"
                }}>
                  <span style={{ width: 8, height: 8, borderRadius: "50%", background: "#4caf50", display: "inline-block", boxShadow: "0 0 8px #4caf50" }} />
                  Line Open · Active Responder
                </div>

                {/* Pulsing SOS Ring */}
                <div 
                  onClick={() => {
                    if (activeStaff) openCall(activeStaff.contact_number, activeStaff.name);
                    setDialTrigger(prev => prev + 1);
                  }}
                  title="Click to place emergency call"
                  style={{
                    width: 100, height: 100, borderRadius: "50%",
                    background: "radial-gradient(circle at 35% 35%, #e53935, #b71c1c)",
                    margin: "0 auto 16px", cursor: "pointer",
                    display: "flex", alignItems: "center", justifyContent: "center",
                    animation: "sosPulse 1.6s ease-in-out infinite",
                    border: `3px solid ${gold}`,
                    transition: "transform 0.15s",
                  }}
                  onMouseEnter={e => e.currentTarget.style.transform = "scale(1.06)"}
                  onMouseLeave={e => e.currentTarget.style.transform = "scale(1)"}
                >
                  <PhoneIcon size={44} />
                </div>

                {activeStaff && (
                  <>
                    <div style={{ display: "flex", gap: 16, alignItems: "center", justifyContent: "center", margin: "14px auto 16px", maxWidth: 440 }}>
                      {activeStaff.profile_image ? (
                        <img
                          src={activeStaff.profile_image.startsWith("http") ? activeStaff.profile_image : `http://127.0.0.1:8000${activeStaff.profile_image}`}
                          alt={activeStaff.name}
                          style={{ width: 72, height: 72, borderRadius: "50%", objectFit: "cover", border: `3px solid ${gold}`, boxShadow: "0 4px 14px rgba(0,0,0,0.3)" }}
                        />
                      ) : (
                        <div style={{ width: 72, height: 72, borderRadius: "50%", background: maroonSoft, display: "flex", alignItems: "center", justifyContent: "center", color: gold, fontSize: 28, fontWeight: 700, border: `3px solid ${gold}` }}>
                          {(activeStaff.name || "?")[0].toUpperCase()}
                        </div>
                      )}
                      <div style={{ textAlign: "left" }}>
                        <div style={{ color: "#fff", fontSize: 20, fontWeight: 800, lineHeight: 1.2 }}>{activeStaff.name}</div>
                        <div style={{ color: goldLight, fontSize: 13, fontWeight: 700, marginTop: 3 }}>{activeStaff.designation}</div>
                        {activeStaff.education && (
                          <div style={{ color: "rgba(255,255,255,0.75)", fontSize: 12, marginTop: 3 }}>
                            🎓 {activeStaff.education}
                          </div>
                        )}
                        {activeStaff.current_location && (
                          <div style={{ color: "rgba(255,255,255,0.6)", fontSize: 11, marginTop: 2 }}>
                            📍 {activeStaff.current_location}
                          </div>
                        )}
                      </div>
                    </div>

                    <div style={{ color: "#ff8a80", fontSize: 20, fontWeight: 700, letterSpacing: "0.06em", marginBottom: 18 }}>
                      {activeStaff.contact_number}
                    </div>

                    <button
                      onClick={() => {
                        openCall(activeStaff.contact_number, activeStaff.name);
                        setDialTrigger(prev => prev + 1);
                      }}
                      style={{
                        display: "inline-flex", alignItems: "center", gap: 8,
                        padding: "12px 32px", borderRadius: 50, border: "none",
                        background: "#e53935", cursor: "pointer",
                        color: "#fff", fontWeight: 800, fontSize: 14,
                        boxShadow: "0 6px 20px rgba(229,57,53,0.50)",
                        letterSpacing: "0.03em", transition: "background 0.2s",
                      }}
                    >
                      <PhoneIcon size={16} /> Call Representative Now
                    </button>
                  </>
                )}
              </div>

              {/* Alternate Staff Roster */}
              {staffList.length > 1 && (
                <div style={{ marginTop: 20 }}>
                  <div style={{ fontSize: 11, color: "#8A5560", fontWeight: 800, textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 10 }}>
                    Alternate On-Duty Representatives ({staffList.length - 1}):
                  </div>
                  <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                    {staffList.map(s => {
                      if (s.id === activeStaff?.id) return null;
                      return (
                        <div key={s.id} style={{
                          background: "#fff", border: `1.5px solid ${line}`,
                          borderRadius: 10, padding: "12px 16px",
                          display: "flex", justifyContent: "space-between", alignItems: "center",
                          boxShadow: "0 2px 6px rgba(0,0,0,0.02)"
                        }}>
                          <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
                            {s.profile_image ? (
                              <img
                                src={s.profile_image.startsWith("http") ? s.profile_image : `http://127.0.0.1:8000${s.profile_image}`}
                                alt={s.name}
                                style={{ width: 44, height: 44, borderRadius: "50%", objectFit: "cover", border: `1.5px solid ${gold}` }}
                              />
                            ) : (
                              <div style={{ width: 44, height: 44, borderRadius: "50%", background: maroonSoft, display: "flex", alignItems: "center", justifyContent: "center", color: gold, fontWeight: 700, border: `1.5px solid ${gold}` }}>
                                {(s.name || "?")[0].toUpperCase()}
                              </div>
                            )}
                            <div style={{ textAlign: "left" }}>
                              <div style={{ fontWeight: 700, fontSize: 14, color: maroonDark }}>{s.name}</div>
                              <div style={{ fontSize: 11, color: "#6B644C" }}>
                                {s.designation} {s.education && `· ${s.education}`}
                              </div>
                            </div>
                          </div>
                          <button
                            onClick={() => { setActiveStaff(s); openCall(s.contact_number, s.name); setDialTrigger(prev => prev + 1); }}
                            style={{
                              background: "transparent", border: `1.5px solid ${maroon}`,
                              borderRadius: 8, color: maroon, fontWeight: 700, fontSize: 12,
                              padding: "6px 14px", cursor: "pointer", display: "flex",
                              alignItems: "center", gap: 6,
                            }}
                          >
                            <PhoneIcon size={14} /> Dial Direct
                          </button>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      )}

      {/* ──────────────────────────────────────────────────────────
         TAB 2: REPORT EMERGENCY SOS DISPATCH
      ────────────────────────────────────────────────────────── */}
      {internalTab === "sos" && (
        <Card style={{ background: "#FFFBFB", border: `1.5px solid ${brick}` }}>
          <div style={{ borderBottom: `1.5px solid ${line}`, paddingBottom: 12, marginBottom: 16 }}>
            <h3 style={{ margin: 0, fontFamily: "Georgia, serif", fontSize: 18, color: maroonDark, fontWeight: 800 }}>
              🚨 Emergency SOS Dispatch Request
            </h3>
            <p style={{ margin: "4px 0 0 0", fontSize: 12, color: "#6B644C" }}>
              Submit an urgent alert to instantly request medical staff on location.
            </p>
          </div>

          {sosSuccess ? (
            <div style={{ background: "#F0FDF4", border: "1.5px solid #BBF7D0", borderRadius: 12, padding: "20px", textAlign: "center" }}>
              <span style={{ fontSize: 42 }}>✅</span>
              <h4 style={{ margin: "10px 0 4px 0", color: "#15803D", fontSize: 18, fontWeight: 800 }}>
                Emergency Alert Dispatched!
              </h4>
              <p style={{ fontSize: 13, color: "#15803D", margin: "0 0 14px 0" }}>
                Ticket <strong>{sosSuccess.ticketId}</strong> has been logged at {sosSuccess.time}.
              </p>
              <div style={{ background: "#fff", padding: "12px", borderRadius: 8, border: "1px solid #DCFCE7", fontSize: 12, color: "#334155", textAlign: "left", marginBottom: 16 }}>
                <div><strong>Assigned Team:</strong> {sosSuccess.assignedStaff}</div>
                <div style={{ marginTop: 4 }}><strong>Emergency Line:</strong> {sosSuccess.phone}</div>
                <div style={{ marginTop: 4 }}><strong>Status:</strong> En-route to {sosData.location}</div>
              </div>
              <button
                onClick={() => setSosSuccess(null)}
                style={{ padding: "8px 20px", background: "#15803D", color: "#fff", border: "none", borderRadius: 8, fontWeight: 700, cursor: "pointer", fontSize: 13 }}
              >
                + Submit Another Report
              </button>
            </div>
          ) : (
            <form onSubmit={handleSosSubmit} style={{ display: "flex", flexDirection: "column", gap: 14 }}>
              <div>
                <Label>Emergency Category</Label>
                <select
                  value={sosData.type}
                  onChange={e => setSosData({ ...sosData, type: e.target.value })}
                  style={{ width: "100%", padding: "10px", borderRadius: 8, border: `1px solid ${line}`, background: "#fff", fontSize: 13 }}
                >
                  <option>Medical Injury 🩹</option>
                  <option>Sudden Illness / High Fever 🤒</option>
                  <option>Asthma / Breathing Trouble 🫁</option>
                  <option>Cardiac / Unconscious / Faint 🫀</option>
                  <option>Severe Allergy / Anaphylaxis ⚠️</option>
                  <option>Other Emergency 🚨</option>
                </select>
              </div>

              <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
                <div style={{ flex: 1, minWidth: 200 }}>
                  <Label>Urgency Level</Label>
                  <select
                    value={sosData.severity}
                    onChange={e => setSosData({ ...sosData, severity: e.target.value })}
                    style={{ width: "100%", padding: "10px", borderRadius: 8, border: `1px solid ${line}`, background: "#fff", fontSize: 13 }}
                  >
                    <option>High (Urgent - Send Team Now)</option>
                    <option>Critical (Life Threatening)</option>
                    <option>Moderate (First Aid Needed)</option>
                  </select>
                </div>
                <div style={{ flex: 1, minWidth: 200 }}>
                  <Label>Callback Phone Number</Label>
                  <input
                    type="tel"
                    placeholder="Enter phone number"
                    value={sosData.phone}
                    onChange={e => setSosData({ ...sosData, phone: e.target.value })}
                    style={{ width: "100%", padding: "10px", borderRadius: 8, border: `1px solid ${line}`, fontSize: 13 }}
                  />
                </div>
              </div>

              <div>
                <Label>Campus Location Details</Label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Main Auditorium - Row 4, Main Block Floor 2"
                  value={sosData.location}
                  onChange={e => setSosData({ ...sosData, location: e.target.value })}
                  style={{ width: "100%", padding: "10px", borderRadius: 8, border: `1px solid ${line}`, fontSize: 13 }}
                />
              </div>

              <div>
                <Label>Additional Situation Notes</Label>
                <textarea
                  rows={3}
                  placeholder="Briefly describe patient condition or symptoms..."
                  value={sosData.notes}
                  onChange={e => setSosData({ ...sosData, notes: e.target.value })}
                  style={{ width: "100%", padding: "10px", borderRadius: 8, border: `1px solid ${line}`, fontSize: 13, resize: "vertical" }}
                />
              </div>

              <button
                type="submit"
                style={{
                  padding: "13px", borderRadius: 8, border: "none",
                  background: "linear-gradient(135deg, #b71c1c, #e53935)",
                  color: "#fff", fontWeight: 800, fontSize: 14,
                  cursor: "pointer", boxShadow: "0 4px 14px rgba(183,28,28,0.4)",
                  marginTop: 6,
                }}
              >
                🚨 Send Emergency SOS Dispatch Now
              </button>
            </form>
          )}
        </Card>
      )}

      {/* ──────────────────────────────────────────────────────────
         TAB 3: EMERGENCY ACCESS & DISPATCH LOGS
      ────────────────────────────────────────────────────────── */}
      {internalTab === "logs" && (
        <Card>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14, borderBottom: `1.5px solid ${line}`, paddingBottom: 10 }}>
            <div>
              <h3 style={{ margin: 0, fontFamily: "Georgia, serif", fontSize: 18, color: maroonDark, fontWeight: 800 }}>
                📜 Emergency Activity Logs
              </h3>
              <div style={{ fontSize: 11, color: "#6B644C", marginTop: 2 }}>
                Audit trails of emergency logins and responder dispatches.
              </div>
            </div>
            <button
              onClick={fetchLogs}
              style={{ padding: "6px 12px", borderRadius: 6, border: `1px solid ${maroon}`, background: "transparent", color: maroon, fontSize: 12, fontWeight: 700, cursor: "pointer" }}
            >
              ↻ Refresh
            </button>
          </div>

          {loadingLogs ? (
            <div style={{ padding: "30px 0", textAlign: "center", color: "#666", fontSize: 13 }}>
              Loading access logs…
            </div>
          ) : logsError ? (
            <div style={{ padding: "12px", background: "#FEF2F2", borderRadius: 8, color: brick, fontSize: 12 }}>
              ⚠️ {logsError}
            </div>
          ) : logsList.length === 0 ? (
            <div style={{ padding: "24px 0", textAlign: "center", color: "#8A5560", fontSize: 13 }}>
              No emergency access entries logged yet.
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              {logsList.map((log, idx) => (
                <div key={log.id || idx} style={{
                  background: "#FFFBFB", border: `1px solid ${line}`, borderRadius: 8,
                  padding: "12px 14px", fontSize: 12, color: maroonDark,
                }}>
                  <div style={{ display: "flex", justifyContent: "space-between", fontWeight: 700, marginBottom: 4 }}>
                    <span>🆔 Card: {log.scanned_id_number || "Emergency Scan"}</span>
                    <span style={{ fontSize: 11, color: "#888", fontWeight: 400 }}>
                      {new Date(log.accessed_at).toLocaleString()}
                    </span>
                  </div>
                  <div style={{ color: "#555", fontSize: 11 }}>
                    <strong>Notes:</strong> {log.notes || "Emergency authentication access."}
                  </div>
                  {log.dispatched_staff && (
                    <div style={{ marginTop: 4, color: maroon, fontWeight: 600, fontSize: 11 }}>
                      👨‍⚕️ Dispatched: {log.dispatched_staff.name || "Medical Representative"}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </Card>
      )}

      {/* ──────────────────────────────────────────────────────────
         TAB 4: FIRST AID STATIONS & GUIDELINES
      ────────────────────────────────────────────────────────── */}
      {internalTab === "stations" && (
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          <Card>
            <h3 style={{ margin: "0 0 12px 0", fontFamily: "Georgia, serif", fontSize: 18, color: maroonDark, fontWeight: 800 }}>
              🏥 Campus First-Aid Kit Stations
            </h3>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: 12 }}>
              {[
                { location: "Main Health Center", area: "Ground Floor, Admin Wing", status: "Fully Stocked 🟢", phone: "Ext. 101" },
                { location: "Sports Complex & Gym", area: "Near Indoor Stadium", status: "Fully Stocked 🟢", phone: "Ext. 204" },
                { location: "Central Library", area: "1st Floor Information Desk", status: "Kit Available 🟡", phone: "Ext. 312" },
                { location: "Hostel Block A & B", area: "Warden Office Reception", status: "24/7 Available 🟢", phone: "Ext. 405" },
              ].map((st, i) => (
                <div key={i} style={{ background: "#FAF6F0", border: `1px solid ${line}`, borderRadius: 10, padding: "12px 14px" }}>
                  <div style={{ fontWeight: 800, fontSize: 13, color: maroonDark }}>{st.location}</div>
                  <div style={{ fontSize: 11, color: "#6B644C", marginTop: 2 }}>📍 {st.area}</div>
                  <div style={{ fontSize: 11, color: "#15803D", marginTop: 4, fontWeight: 700 }}>{st.status}</div>
                  <div style={{ fontSize: 11, color: maroon, marginTop: 4, fontWeight: 600 }}>📞 Hotline: {st.phone}</div>
                </div>
              ))}
            </div>
          </Card>

          <Card style={{ background: "#FFFBFB" }}>
            <h3 style={{ margin: "0 0 12px 0", fontFamily: "Georgia, serif", fontSize: 17, color: maroonDark, fontWeight: 800 }}>
              📘 Quick First-Aid Protocols
            </h3>
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {[
                { id: "cpr", title: "❤️ Unresponsive / CPR Procedure", text: "1. Check for responsiveness & breathing. 2. Call Emergency Helpline immediately. 3. Perform firm chest compressions at 100-120 bpm until medical team arrives." },
                { id: "bleed", title: "🩸 Severe Bleeding Control", text: "1. Apply firm direct pressure using a clean cloth or bandage. 2. Elevate the injured limb above heart level if possible. 3. Keep victim calm & warm." },
                { id: "faint", title: "💫 Fainting / Dizziness Recovery", text: "1. Lay person flat on back and elevate legs by 12 inches. 2. Loosen tight clothing around neck and waist. 3. Provide fresh air and do not give food/water until fully conscious." },
              ].map(item => (
                <div key={item.id} style={{ border: `1px solid ${line}`, borderRadius: 8, overflow: "hidden" }}>
                  <button
                    onClick={() => setOpenProtocol(openProtocol === item.id ? null : item.id)}
                    style={{
                      width: "100%", padding: "12px 14px", textAlign: "left",
                      background: openProtocol === item.id ? "#6B1E2B0D" : "#fff",
                      border: "none", cursor: "pointer", fontWeight: 700, fontSize: 13,
                      color: maroonDark, display: "flex", justifyContent: "space-between", alignItems: "center"
                    }}
                  >
                    <span>{item.title}</span>
                    <span>{openProtocol === item.id ? "▲" : "▼"}</span>
                  </button>
                  {openProtocol === item.id && (
                    <div style={{ padding: "12px 14px", fontSize: 12, color: "#4A4535", lineHeight: 1.5, background: "#FAF8F5", borderTop: `1px solid ${line}` }}>
                      {item.text}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </Card>
        </div>
      )}

      {/* ── CSS Animations ── */}
      <style>{`
        @keyframes sosPulse {
          0%   { box-shadow: 0 0 0 0   rgba(229,57,53,0.75); }
          50%  { box-shadow: 0 0 0 18px rgba(229,57,53,0);   }
          100% { box-shadow: 0 0 0 0   rgba(229,57,53,0.75); }
        }
      `}</style>
    </div>
  );
}

