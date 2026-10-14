import { useState, useEffect } from "react";
import { SirenBeaconIcon } from "./EmergencySirenModal";
import { SosHandsetIcon } from "./LoginPage";

export default function GlobalEmergencyDock({
  onTriggerSiren,
  onTriggerSos,
  activeAlarm = null,
}) {
  const [deferredInstallPrompt, setDeferredInstallPrompt] = useState(null);
  const [isAppInstalled, setIsAppInstalled] = useState(false);
  const [showInstallBanner, setShowInstallBanner] = useState(false);
  const [isIOS, setIsIOS] = useState(false);
  const [showIOSPrompt, setShowIOSPrompt] = useState(false);
  const [isExpanded, setIsExpanded] = useState(true);

  // 1. Detect PWA Installation State & BeforeInstallPrompt
  useEffect(() => {
    // Check if already in standalone (installed) mode
    const isStandalone =
      window.matchMedia("(display-mode: standalone)").matches ||
      window.navigator.standalone === true;

    if (isStandalone) {
      setIsAppInstalled(true);
    }

    // Check iOS Safari
    const userAgent = window.navigator.userAgent.toLowerCase();
    const isIosDevice = /iphone|ipad|ipod/.test(userAgent);
    setIsIOS(isIosDevice);

    const handleBeforeInstall = (e) => {
      e.preventDefault();
      setDeferredInstallPrompt(e);
      // Auto-show install banner on mobile phones if not yet installed
      const dismissed = localStorage.getItem("cems_pwa_install_dismissed");
      if (!dismissed) {
        setShowInstallBanner(true);
      }
    };

    const handleAppInstalled = () => {
      setIsAppInstalled(true);
      setShowInstallBanner(false);
      setDeferredInstallPrompt(null);
      localStorage.removeItem("cems_pwa_install_dismissed");
    };

    window.addEventListener("beforeinstallprompt", handleBeforeInstall);
    window.addEventListener("appinstalled", handleAppInstalled);

    // 2. Detect URL Action Shortcuts (?action=siren, ?action=sos)
    try {
      const params = new URLSearchParams(window.location.search);
      const action = params.get("action");
      if (action === "siren") {
        setTimeout(() => handleSirenClick(), 400);
      } else if (action === "sos") {
        setTimeout(() => handleSosClick(), 400);
      }
    } catch (e) {}

    return () => {
      window.removeEventListener("beforeinstallprompt", handleBeforeInstall);
      window.removeEventListener("appinstalled", handleAppInstalled);
    };
  }, []);

  // Handle PWA Install Button Click
  const handleInstallClick = async () => {
    if (deferredInstallPrompt) {
      deferredInstallPrompt.prompt();
      const choiceResult = await deferredInstallPrompt.userChoice;
      if (choiceResult.outcome === "accepted") {
        setIsAppInstalled(true);
        setShowInstallBanner(false);
      }
      setDeferredInstallPrompt(null);
    } else if (isIOS && !isAppInstalled) {
      setShowIOSPrompt(true);
    }
  };

  const dismissInstallBanner = () => {
    setShowInstallBanner(false);
    localStorage.setItem("cems_pwa_install_dismissed", "true");
  };

  // Safe Haptic Vibration Helper
  const triggerHaptic = (pattern = [150, 80, 150]) => {
    if (typeof window !== "undefined" && "navigator" in window && navigator.vibrate) {
      try {
        navigator.vibrate(pattern);
      } catch (e) {}
    }
  };

  // 1-Tap Emergency Siren Handler
  const handleSirenClick = () => {
    triggerHaptic([300, 100, 300, 100, 450]);
    // Unlock Web Audio context on mobile touch gesture
    try {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (AudioCtx) {
        const dummyCtx = new AudioCtx();
        dummyCtx.resume();
      }
    } catch (e) {}
    onTriggerSiren?.();
  };

  // 1-Tap Emergency SOS Handler
  const handleSosClick = () => {
    triggerHaptic([200, 80, 200]);
    onTriggerSos?.();
  };

  return (
    <>
      {/* ── 1. PWA Mobile Installation Bar (Sticky Header/Toast for mobile phones) ── */}
      {showInstallBanner && !isAppInstalled && (
        <div
          className="cems-pwa-install-bar"
          style={{
            position: "fixed",
            bottom: "86px",
            left: "16px",
            right: "16px",
            maxWidth: "460px",
            margin: "0 auto",
            background: "linear-gradient(135deg, #064E3B 0%, #065F46 100%)",
            color: "#FFFFFF",
            padding: "12px 16px",
            borderRadius: "16px",
            boxShadow: "0 10px 30px rgba(6, 78, 59, 0.4), 0 2px 10px rgba(0,0,0,0.2)",
            border: "1.5px solid #34D399",
            zIndex: 9998,
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: "12px",
            animation: "slideUp 0.35s cubic-bezier(0.16, 1, 0.3, 1)",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "10px", minWidth: 0 }}>
            <div
              style={{
                width: "40px",
                height: "40px",
                borderRadius: "10px",
                background: "linear-gradient(135deg, #10B981, #059669)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: "20px",
                flexShrink: 0,
                boxShadow: "0 2px 8px rgba(0,0,0,0.2)",
              }}
            >
              📲
            </div>
            <div style={{ minWidth: 0 }}>
              <div style={{ fontWeight: 800, fontSize: "13px", letterSpacing: "-0.01em" }}>
                Install CEMS App on Phone
              </div>
              <div style={{ fontSize: "11px", color: "#A7F3D0", lineHeight: "1.3" }}>
                1-Tap Emergency SOS & Siren from home screen
              </div>
            </div>
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: "6px", flexShrink: 0 }}>
            <button
              type="button"
              onClick={handleInstallClick}
              style={{
                background: "#FFFFFF",
                color: "#065F46",
                border: "none",
                borderRadius: "10px",
                padding: "8px 14px",
                fontWeight: 800,
                fontSize: "12px",
                cursor: "pointer",
                boxShadow: "0 2px 8px rgba(0,0,0,0.15)",
                display: "flex",
                alignItems: "center",
                gap: "5px",
              }}
            >
              <span>Install</span>
            </button>
            <button
              type="button"
              onClick={dismissInstallBanner}
              style={{
                background: "transparent",
                color: "#A7F3D0",
                border: "none",
                fontSize: "18px",
                padding: "4px 8px",
                cursor: "pointer",
              }}
              title="Dismiss"
            >
              ✕
            </button>
          </div>
        </div>
      )}

      {/* ── 2. iOS Safari Add-To-Home-Screen Instructions Modal ── */}
      {showIOSPrompt && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(15, 23, 42, 0.75)",
            zIndex: 99999,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: "20px",
            backdropFilter: "blur(6px)",
          }}
          onClick={() => setShowIOSPrompt(false)}
        >
          <div
            style={{
              background: "#FFFFFF",
              borderRadius: "20px",
              padding: "24px",
              maxWidth: "360px",
              width: "100%",
              boxShadow: "0 20px 40px rgba(0,0,0,0.25)",
              border: "2px solid #A7F3D0",
              textAlign: "center",
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ fontSize: "36px", marginBottom: "8px" }}>📲</div>
            <h3 style={{ fontSize: "17px", fontWeight: 800, color: "#064E3B", margin: "0 0 8px 0" }}>
              Install on iPhone / iPad
            </h3>
            <p style={{ fontSize: "13px", color: "#475569", lineHeight: "1.5", margin: "0 0 16px 0" }}>
              To install CEMS for 1-tap instant emergency access:
            </p>
            <div
              style={{
                textAlign: "left",
                background: "#F0FDF4",
                borderRadius: "12px",
                padding: "12px 16px",
                fontSize: "13px",
                color: "#065F46",
                lineHeight: "1.6",
                marginBottom: "16px",
                border: "1px solid #A7F3D0",
              }}
            >
              1. Tap the <strong>Share</strong> button <span style={{ fontSize: "16px" }}>⎋</span> at bottom of Safari.<br />
              2. Scroll down & tap <strong>"Add to Home Screen"</strong> <span style={{ fontSize: "14px" }}>➕</span>.<br />
              3. Tap <strong>"Add"</strong> in top right.
            </div>
            <button
              onClick={() => setShowIOSPrompt(false)}
              style={{
                width: "100%",
                background: "linear-gradient(135deg, #10B981, #059669)",
                color: "#FFFFFF",
                border: "none",
                borderRadius: "10px",
                padding: "11px",
                fontWeight: 700,
                fontSize: "14px",
                cursor: "pointer",
              }}
            >
              Got it
            </button>
          </div>
        </div>
      )}

      {/* ── 3. Global Mobile-Friendly Floating Emergency Action Dock ── */}
      <div
        className="cems-global-emergency-dock"
        style={{
          position: "fixed",
          bottom: "18px",
          right: "18px",
          zIndex: 9997,
          display: "flex",
          flexDirection: "column",
          alignItems: "flex-end",
          gap: "10px",
          pointerEvents: "auto",
        }}
      >
        {/* Active Campus Alarm Pulse Pill if an active alarm exists */}
        {activeAlarm && (
          <div
            onClick={handleSirenClick}
            style={{
              background: "linear-gradient(135deg, #DC2626, #991B1B)",
              color: "#FFFFFF",
              padding: "7px 14px",
              borderRadius: "30px",
              fontSize: "12px",
              fontWeight: 800,
              boxShadow: "0 4px 16px rgba(220,38,38,0.5)",
              display: "flex",
              alignItems: "center",
              gap: "8px",
              cursor: "pointer",
              animation: "emergencyTopBarPulse 1s infinite alternate",
            }}
          >
            <div style={{ animation: "sirenSpin 1s infinite" }}>
              <SirenBeaconIcon size={16} color="#FFFFFF" />
            </div>
            <span>ALARM ACTIVE: {activeAlarm.location || "Campus Emergency"}</span>
          </div>
        )}

        {/* The Action Buttons Container */}
        {isExpanded ? (
          <div
            className="emergency-buttons-row"
            style={{
              display: "flex",
              alignItems: "center",
              gap: "10px",
              background: "rgba(255, 255, 255, 0.94)",
              backdropFilter: "blur(12px)",
              WebkitBackdropFilter: "blur(12px)",
              padding: "8px 12px",
              borderRadius: "40px",
              boxShadow: "0 10px 32px rgba(0, 0, 0, 0.18), 0 2px 10px rgba(5,150,105,0.12)",
              border: "2px solid #A7F3D0",
              animation: "scaleIn 0.2s cubic-bezier(0.16, 1, 0.3, 1)",
            }}
          >
            {/* 🚨 1-Tap SIREN BUTTON */}
            <button
              type="button"
              onClick={handleSirenClick}
              title="1-Tap Emergency Siren: Triggers loud acoustic alarm, campus notification & GPS map"
              style={{
                display: "flex",
                alignItems: "center",
                gap: "8px",
                background: "linear-gradient(135deg, #DC2626 0%, #B91C1C 100%)",
                color: "#FFFFFF",
                border: "2px solid #FFFFFF",
                borderRadius: "30px",
                padding: "10px 18px",
                fontSize: "13px",
                fontWeight: 800,
                cursor: "pointer",
                boxShadow: "0 4px 14px rgba(220, 38, 38, 0.4)",
                transition: "all 0.15s ease",
                whiteSpace: "nowrap",
                touchAction: "manipulation",
              }}
            >
              <div style={{ animation: "sirenSpin 1.4s infinite", display: "flex", alignItems: "center" }}>
                <SirenBeaconIcon size={20} color="#FFFFFF" />
              </div>
              <span style={{ letterSpacing: "0.02em" }}>Siren Alarm</span>
            </button>

            {/* 🆘 1-Tap EMERGENCY SOS BUTTON */}
            <button
              type="button"
              onClick={handleSosClick}
              title="1-Tap Emergency SOS: Instant ID card face scan, medical dispatch & campus responders"
              style={{
                display: "flex",
                alignItems: "center",
                gap: "8px",
                background: "linear-gradient(135deg, #059669 0%, #064E3B 100%)",
                color: "#FFFFFF",
                border: "2px solid #FFFFFF",
                borderRadius: "30px",
                padding: "10px 18px",
                fontSize: "13px",
                fontWeight: 800,
                cursor: "pointer",
                boxShadow: "0 4px 14px rgba(5, 150, 105, 0.4)",
                transition: "all 0.15s ease",
                whiteSpace: "nowrap",
                touchAction: "manipulation",
              }}
            >
              <div style={{ display: "flex", alignItems: "center" }}>
                <SosHandsetIcon size={20} color="#FFFFFF" />
              </div>
              <span style={{ letterSpacing: "0.02em" }}>Emergency SOS</span>
            </button>

            {/* Minimize Toggle */}
            <button
              type="button"
              onClick={() => setIsExpanded(false)}
              title="Minimize Emergency Dock"
              style={{
                background: "#F1F5F9",
                border: "none",
                borderRadius: "50%",
                width: "28px",
                height: "28px",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: "#64748B",
                cursor: "pointer",
                fontSize: "13px",
                fontWeight: 700,
              }}
            >
              ✕
            </button>
          </div>
        ) : (
          /* Minimized Compact Capsule */
          <button
            type="button"
            onClick={() => setIsExpanded(true)}
            style={{
              background: "linear-gradient(135deg, #DC2626 0%, #059669 100%)",
              color: "#FFFFFF",
              border: "3px solid #FFFFFF",
              borderRadius: "32px",
              padding: "8px 16px",
              boxShadow: "0 8px 24px rgba(0,0,0,0.28)",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              gap: "8px",
              fontWeight: 800,
              fontSize: "13px",
              animation: "emergencyTopBarPulse 1.8s infinite alternate",
            }}
          >
            <span>🚨 🆘</span>
            <span>Emergency Quick Dock</span>
            <span style={{ fontSize: "10px", background: "rgba(255,255,255,0.25)", padding: "2px 6px", borderRadius: "10px" }}>Tap</span>
          </button>
        )}
      </div>
    </>
  );
}
