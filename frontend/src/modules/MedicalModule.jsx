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
   CAMERA SCANNER COMPONENT (Two Completely Independent Methods)
   METHOD 1: ID Card Scanner (Rectangular guide, OCR, no face)
   METHOD 2: Face Scanner (Oval guide, biometrics, no card)
═══════════════════════════════════════════════════════════ */
function CameraView({ mode, onCapture, onCancel }) {
  const videoRef    = useRef(null);
  const canvasRef   = useRef(null);
  const streamRef   = useRef(null);
  const scanLoopRef = useRef(null);

  const [starting,        setStarting]        = useState(true);
  const [camError,        setCamError]        = useState("");
  const [scanWarning,     setScanWarning]     = useState("");
  const [identityInput,   setIdentityInput]   = useState("");
  const [scanStatus,      setScanStatus]      = useState("searching"); // 'searching' | 'detected' | 'reading' | 'verified'
  const [holdProgress,    setHoldProgress]    = useState(0); // 0 to 100%
  const [capturedPreview, setCapturedPreview] = useState(null);

  const isIdCard = mode === "idcard";

  /* Guidance titles and subtitles per specifications */
  let guidanceTitle = "";
  let guidanceSubtitle = "";

  if (isIdCard) {
    if (scanStatus === "verified") {
      guidanceTitle = "✓ ID card verified";
      guidanceSubtitle = "Identity verified. Opening emergency profile...";
    } else if (scanStatus === "reading") {
      guidanceTitle = "Reading ID card...";
      guidanceSubtitle = "Extracting card information via optical scan...";
    } else if (scanStatus === "detected") {
      guidanceTitle = "ID card detected";
      guidanceSubtitle = "Hold steady inside the card frame...";
    } else {
      guidanceTitle = "Scan your College ID Card";
      guidanceSubtitle = "Place the ID card inside the frame.";
    }
  } else {
    // Face Scanner mode
    if (starting) {
      guidanceTitle = "Initializing camera...";
      guidanceSubtitle = "Please allow camera access and position your face inside the frame...";
    } else if (scanStatus === "verified") {
      guidanceTitle = "Face verified";
      guidanceSubtitle = "Identity confirmed. Opening emergency profile...";
    } else if (scanStatus === "reading") {
      guidanceTitle = "Verifying identity...";
      guidanceSubtitle = "Analyzing face & authenticating against registered face reference...";
    } else if (scanStatus === "detected") {
      guidanceTitle = "Face detected";
      guidanceSubtitle = "Hold still...";
    } else {
      guidanceTitle = "Face Verification";
      guidanceSubtitle = "Position your face inside the frame.";
    }
  }

  /* Start camera */
  useEffect(() => {
    let cancelled = false;
    (async () => {
      if (!navigator.mediaDevices?.getUserMedia) {
        setCamError("Camera permission is required. Camera API is not accessible in this browser.");
        setStarting(false);
        return;
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
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          await videoRef.current.play();
        }
        setStarting(false);
      } catch (err) {
        if (err.name === "NotAllowedError" || err.name === "PermissionDeniedError") {
          setCamError("Camera permission denied. Please allow camera access in your browser settings and try again.");
        } else if (err.name === "NotFoundError" || err.name === "DevicesNotFoundError") {
          setCamError("Camera unavailable. No webcam or camera device was found on this system.");
        } else if (err.name === "NotReadableError" || err.name === "TrackStartError") {
          setCamError("Camera is already in use by another application. Please close other software using your camera.");
        } else {
          setCamError("Camera permission is required. Please enable camera access in your browser settings.");
        }
        setStarting(false);
      }
    })();
    return () => {
      cancelled = true;
      streamRef.current?.getTracks().forEach(t => t.stop());
      if (scanLoopRef.current) clearInterval(scanLoopRef.current);
    };
  }, [isIdCard]);

  /* Capture ID Card Flow (Pure ID Card - NO face step) */
  const doCaptureCard = useCallback(async () => {
    const video = videoRef.current;
    if (!video || !video.videoWidth) return;

    const vw = video.videoWidth;
    const vh = video.videoHeight;

    // Crop to the rectangular card guide: left 7%, top 12%, width 86%, height 76%
    const cropX = Math.round(vw * 0.07);
    const cropY = Math.round(vh * 0.12);
    const cropW = Math.round(vw * 0.86);
    const cropH = Math.round(vh * 0.76);

    const cardCanvas = document.createElement("canvas");
    cardCanvas.width = cropW;
    cardCanvas.height = cropH;
    const cctx = cardCanvas.getContext("2d");
    cctx.drawImage(video, cropX, cropY, cropW, cropH, 0, 0, cropW, cropH);

    const previewUrl = cardCanvas.toDataURL("image/jpeg", 0.92);
    setCapturedPreview(previewUrl);
    setScanStatus("reading");

    let extractedOcr = "";
    try {
      const { default: Tesseract } = await import("tesseract.js");
      const ocrRes = await Promise.race([
        Tesseract.recognize(cardCanvas, "eng"),
        new Promise(resolve => setTimeout(() => resolve(null), 6500)),
      ]);
      if (ocrRes?.data?.text) {
        extractedOcr = ocrRes.data.text;
      }
    } catch {}

    cardCanvas.toBlob(blob => {
      if (!blob) return;
      const cardFile = new File([blob], "id-card-scan.jpg", { type: "image/jpeg" });
      setScanStatus("verified");
      setTimeout(() => {
        onCapture(cardFile, identityInput, {
          idCardFile: cardFile,
          cardPreview: previewUrl,
          ocrText: extractedOcr,
          identityInput,
        });
      }, 400);
    }, "image/jpeg", 0.95);
  }, [identityInput, onCapture]);

  /* Capture Face Flow (Pure Face - NO ID card step) */
  const doCaptureFace = useCallback(() => {
    const video = videoRef.current;
    const canvas = canvasRef.current;
    if (!video || !video.videoWidth) return;

    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const ctx = canvas.getContext("2d");
    ctx.drawImage(video, 0, 0);

    const facePreview = canvas.toDataURL("image/jpeg", 0.92);
    setCapturedPreview(facePreview);
    setScanStatus("reading");

    canvas.toBlob(blob => {
      if (!blob) return;
      const faceFile = new File([blob], "face-scan.jpg", { type: "image/jpeg" });
      setScanStatus("verified");
      setTimeout(() => {
        onCapture(faceFile, "", {
          faceFile,
          facePreview,
        });
      }, 500);
    }, "image/jpeg", 0.95);
  }, [onCapture]);

  /* Real-time frame detection loop */
  useEffect(() => {
    if (starting || camError) return;

    let steadyCounter = 0;
    scanLoopRef.current = setInterval(() => {
      const video = videoRef.current;
      if (!video || !video.videoWidth || !video.videoHeight) return;

      const sampleW = 160;
      const sampleH = 100;
      const sampleCanvas = document.createElement("canvas");
      sampleCanvas.width = sampleW;
      sampleCanvas.height = sampleH;
      const ctx = sampleCanvas.getContext("2d");
      ctx.drawImage(video, 0, 0, sampleW, sampleH);
      const imgData = ctx.getImageData(0, 0, sampleW, sampleH);
      const d = imgData.data;

      if (isIdCard) {
        // ID Card mode: Check rectangular sharpness & contrast
        if (scanStatus === "reading" || scanStatus === "verified") return;

        let sum = 0, sumSq = 0, count = 0, totalB = 0;
        for (let y = 2; y < sampleH - 2; y += 3) {
          for (let x = 2; x < sampleW - 2; x += 3) {
            const idx = (y * sampleW + x) * 4;
            const gray = (d[idx] + d[idx + 1] + d[idx + 2]) / 3;
            totalB += gray;
            const top = (d[idx - sampleW * 4] + d[idx - sampleW * 4 + 1] + d[idx - sampleW * 4 + 2]) / 3;
            const bot = (d[idx + sampleW * 4] + d[idx + sampleW * 4 + 1] + d[idx + sampleW * 4 + 2]) / 3;
            const left = (d[idx - 4] + d[idx - 3] + d[idx - 2]) / 3;
            const right = (d[idx + 4] + d[idx + 5] + d[idx + 6]) / 3;
            const lap = Math.abs(4 * gray - top - bot - left - right);
            sum += lap;
            sumSq += lap * lap;
            count++;
          }
        }
        const mean = sum / count;
        const variance = (sumSq / count) - (mean * mean);
        const avgBrightness = totalB / count;

        const hasCardInFrame = variance > 12.0 && avgBrightness > 30 && avgBrightness < 240;

        if (hasCardInFrame) {
          steadyCounter++;
          const progressPct = Math.min(100, Math.round((steadyCounter / 7) * 100));
          setHoldProgress(progressPct);
          setScanStatus("detected");
          setScanWarning("");

          if (steadyCounter >= 7) {
            doCaptureCard();
          }
        } else {
          steadyCounter = Math.max(0, steadyCounter - 1);
          setHoldProgress(0);
          setScanStatus("searching");
        }
      } else {
        // Face Scanner mode: Check centered face presence & lighting
        if (scanStatus === "reading" || scanStatus === "verified") return;

        let skinCount = 0;
        let leftSideSkin = 0;
        let rightSideSkin = 0;
        let totalCount = 0;
        let totalB = 0;

        for (let i = 0; i < d.length; i += 16) {
          const r = d[i], g = d[i + 1], b = d[i + 2];
          totalB += (r + g + b) / 3;
          const pixelX = ((i / 4) % sampleW);
          if (r > 60 && g > 40 && b > 20 && r > g && r > b && (r - b) > 10) {
            skinCount++;
            if (pixelX < sampleW * 0.4) leftSideSkin++;
            if (pixelX > sampleW * 0.6) rightSideSkin++;
          }
          totalCount++;
        }

        const skinRatio = skinCount / totalCount;
        const avgB = totalB / totalCount;

        if (avgB < 25) {
          setScanWarning("Face image quality is insufficient (too dark). Move to better light.");
          setScanStatus("searching");
          steadyCounter = 0;
          setHoldProgress(0);
        } else if (avgB > 240) {
          setScanWarning("Face image quality is insufficient (overexposed). Reduce glare.");
          setScanStatus("searching");
          steadyCounter = 0;
          setHoldProgress(0);
        } else if (leftSideSkin > totalCount * 0.15 && rightSideSkin > totalCount * 0.15) {
          setScanWarning("Only one person should be visible during face verification.");
          setScanStatus("searching");
          steadyCounter = 0;
          setHoldProgress(0);
        } else if (skinRatio > 0.06) {
          steadyCounter++;
          const progressPct = Math.min(100, Math.round((steadyCounter / 7) * 100));
          setHoldProgress(progressPct);
          setScanStatus("detected");
          setScanWarning("");

          if (steadyCounter >= 7) {
            doCaptureFace();
          }
        } else {
          steadyCounter = Math.max(0, steadyCounter - 1);
          setHoldProgress(0);
          setScanStatus("searching");
          setScanWarning("Face not detected. Please position your face inside the frame.");
        }
      }
    }, 200);

    return () => {
      if (scanLoopRef.current) clearInterval(scanLoopRef.current);
    };
  }, [starting, camError, isIdCard, scanStatus, doCaptureCard, doCaptureFace]);

  const handleManualCapture = () => {
    setScanWarning("");
    if (isIdCard) {
      doCaptureCard();
    } else {
      doCaptureFace();
    }
  };

  const resetScan = () => {
    setScanStatus("searching");
    setHoldProgress(0);
    setCapturedPreview(null);
    setScanWarning("");
    setCamError("");
    setIdentityInput("");
  };

  return (
    <div style={{ textAlign: "center" }}>
      {/* Guidance Header Banner */}
      <div style={{
        background: scanStatus === "verified" ? "#ECFDF5" : scanStatus === "detected" ? "#FFFBEB" : "#F8FAFC",
        border: `1.5px solid ${scanStatus === "verified" ? "#10B981" : scanStatus === "detected" ? gold : "#CBD5E1"}`,
        borderRadius: 10, padding: "12px 14px", marginBottom: 12, textAlign: "center",
        boxShadow: "0 2px 8px rgba(0,0,0,0.04)"
      }}>
        <div style={{
          fontSize: 15, fontWeight: 800,
          color: scanStatus === "verified" ? "#15803D" : maroonDark,
          display: "flex", alignItems: "center", justifyContent: "center", gap: 8
        }}>
          <span style={{ fontSize: 18 }}>{isIdCard ? "🪪" : "👤"}</span>
          <span>{guidanceTitle}</span>
        </div>
        <div style={{ fontSize: 12, color: "#64748B", marginTop: 3 }}>
          {guidanceSubtitle}
        </div>
      </div>

      {/* Camera Viewport with Mode-Specific Guides */}
      <div style={{
        position: "relative", width: "100%", maxWidth: 440,
        height: 290, margin: "0 auto 12px", borderRadius: 14,
        overflow: "hidden",
        border: `2.5px solid ${scanStatus === "verified" ? "#10B981" : scanWarning ? "#DC2626" : gold}`,
        background: "#000",
        boxShadow: "0 8px 24px rgba(0,0,0,0.25)"
      }}>
        <video
          ref={videoRef}
          muted
          playsInline
          style={{ width: "100%", height: "100%", objectFit: "cover" }}
        />

        {/* ── METHOD 1: CARD RECTANGULAR GUIDE (NO FACE GUIDE) ── */}
        {isIdCard && (
          <div style={{
            position: "absolute", left: "7%", right: "7%",
            top: "14%", bottom: "14%",
            borderRadius: 10,
            border: scanStatus === "verified"
              ? "3px solid #10B981"
              : scanStatus === "detected"
              ? `2.5px solid ${gold}`
              : "2px dashed rgba(255,255,255,0.75)",
            boxShadow: scanStatus === "verified"
              ? "0 0 20px rgba(16,185,129,0.7)"
              : scanStatus === "detected"
              ? "0 0 16px rgba(212,175,55,0.5)"
              : "none",
            pointerEvents: "none",
            transition: "all 0.25s ease",
            overflow: "hidden"
          }}>
            {/* 4 Corner Reticles */}
            <span style={{ position: "absolute", top: 0, left: 0, width: 18, height: 18, borderTop: "3.5px solid #F59E0B", borderLeft: "3.5px solid #F59E0B" }} />
            <span style={{ position: "absolute", top: 0, right: 0, width: 18, height: 18, borderTop: "3.5px solid #F59E0B", borderRight: "3.5px solid #F59E0B" }} />
            <span style={{ position: "absolute", bottom: 0, left: 0, width: 18, height: 18, borderBottom: "3.5px solid #F59E0B", borderLeft: "3.5px solid #F59E0B" }} />
            <span style={{ position: "absolute", bottom: 0, right: 0, width: 18, height: 18, borderBottom: "3.5px solid #F59E0B", borderRight: "3.5px solid #F59E0B" }} />

            {/* Scanning radar line */}
            {scanStatus !== "verified" && (
              <div style={{
                position: "absolute", left: 0, right: 0, height: 2.5,
                background: "linear-gradient(90deg, transparent, #F59E0B, #10B981, transparent)",
                boxShadow: "0 0 8px #10B981",
                animation: "scanBeam 2s ease-in-out infinite alternate",
              }} />
            )}

            {/* Center frame guide label */}
            {scanStatus !== "verified" && (
              <div style={{
                position: "absolute",
                top: "50%",
                left: "50%",
                transform: "translate(-50%, -50%)",
                textAlign: "center",
                color: "rgba(255, 255, 255, 0.85)",
                textShadow: "0 2px 6px rgba(0,0,0,0.85)",
                pointerEvents: "none",
                userSelect: "none",
                width: "90%",
              }}>
                <div style={{ fontSize: 13, fontWeight: 900, letterSpacing: "0.06em", textTransform: "uppercase" }}>
                  PLACE ENTIRE ID CARD
                </div>
                <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: "0.04em", opacity: 0.9, marginTop: 2 }}>
                  INSIDE THIS FRAME
                </div>
              </div>
            )}

            {/* Hold Steady Progress Bar */}
            {scanStatus === "detected" && holdProgress > 0 && (
              <div style={{
                position: "absolute", bottom: 0, left: 0, height: 6,
                width: `${holdProgress}%`, background: "#10B981",
                transition: "width 0.15s linear"
              }} />
            )}
          </div>
        )}

        {/* ── METHOD 2: FACE OVAL GUIDE (NO CARD GUIDE) ── */}
        {!isIdCard && (
          <div style={{
            position: "absolute", left: "22%", right: "22%",
            top: "8%", bottom: "8%",
            borderRadius: "50%",
            border: scanStatus === "verified"
              ? "3.5px solid #10B981"
              : scanStatus === "detected"
              ? "3px solid #10B981"
              : `2.5px solid ${gold}`,
            boxShadow: scanStatus === "detected"
              ? "0 0 20px rgba(16,185,129,0.6)"
              : "0 0 12px rgba(212,175,55,0.4)",
            pointerEvents: "none",
            transition: "all 0.25s ease"
          }}>
            {/* Hold Steady Progress Bar around face oval */}
            {scanStatus === "detected" && holdProgress > 0 && (
              <div style={{
                position: "absolute", bottom: 10, left: "20%", right: "20%", height: 5,
                background: "#10B981", borderRadius: 3,
                width: `${holdProgress * 0.6}%`, margin: "0 auto",
                transition: "width 0.15s linear"
              }} />
            )}
          </div>
        )}

        {/* Flash overlay upon successful capture */}
        {scanStatus === "verified" && (
          <div style={{
            position: "absolute", inset: 0, background: "rgba(16,185,129,0.35)",
            animation: "flash 0.4s ease-out forwards", pointerEvents: "none"
          }} />
        )}

        {/* Camera starting indicator */}
        {starting && (
          <div style={{
            position: "absolute", inset: 0, background: "rgba(0,0,0,0.75)",
            display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
            color: "#fff", gap: 10
          }}>
            <div style={{ width: 32, height: 32, border: "3px solid #ccc", borderTopColor: gold, borderRadius: "50%", animation: "spin 0.8s linear infinite" }} />
            <div style={{ fontSize: 13, fontWeight: 600 }}>Starting camera…</div>
          </div>
        )}
      </div>

      <canvas ref={canvasRef} style={{ display: "none" }} />

      {/* Warnings & Errors */}
      {camError && (
        <div style={{
          background: "#FEF2F2", border: "1.5px solid #FECACA",
          borderRadius: 8, padding: "10px 14px", marginBottom: 10,
          fontSize: 12, color: "#DC2626", textAlign: "left"
        }}>
          ⚠️ {camError}
        </div>
      )}

      {scanWarning && (
        <div style={{
          background: "#FEF2F2", border: "1.5px solid #FECACA",
          borderRadius: 8, padding: "10px 14px", marginBottom: 10,
          fontSize: 12, color: "#DC2626", textAlign: "left"
        }}>
          ⚠️ {scanWarning}
        </div>
      )}

      {/* Optional Card Metadata Hint (For ID Card Scanner only if text is worn out) */}
      {isIdCard && (
        <div style={{
          marginBottom: 12, textAlign: "left", background: "#FFFFFF",
          border: "1.5px solid #E2E8F0", borderRadius: 10, padding: "10px 14px"
        }}>
          <label style={{ display: "block", fontSize: 11, fontWeight: 700, color: maroonDark, marginBottom: 4 }}>
            Card worn out or low lighting? (Optional identifier hint)
          </label>
          <input
            type="text"
            placeholder="Student Name, Email, or ID Year (e.g. Rahul Jacob or rahul@gmail.com)"
            value={identityInput}
            onChange={e => setIdentityInput(e.target.value)}
            style={{
              width: "100%", padding: "7px 10px", fontSize: 12, borderRadius: 6,
              border: "1px solid #CBD5E1", outline: "none", boxSizing: "border-box"
            }}
          />
          <div style={{ fontSize: 10, color: "#64748B", marginTop: 4 }}>
            Note: ID Year (e.g. MCA-2025-2027) is a batch identifier. Backend verifies your exact registered account using card details.
          </div>
        </div>
      )}

      {/* Action Controls */}
      <div style={{ display: "flex", gap: 10, justifyContent: "center", flexWrap: "wrap", marginTop: 6 }}>
        <button
          disabled={!!camError || starting}
          onClick={handleManualCapture}
          style={{
            padding: "10px 22px", borderRadius: 8, border: "none",
            background: isIdCard
              ? `linear-gradient(135deg, ${maroon}, ${maroonSoft})`
              : "linear-gradient(135deg, #15803D, #16A34A)",
            color: "#fff", fontWeight: 800, fontSize: 13,
            cursor: (camError || starting) ? "not-allowed" : "pointer",
            opacity: (camError || starting) ? 0.5 : 1,
            boxShadow: isIdCard ? "0 3px 10px rgba(107,30,43,0.35)" : "0 3px 10px rgba(22,163,74,0.35)",
          }}>
          {isIdCard ? "📷 Capture ID Card Now" : "🤳 Scan Face Now"}
        </button>

        {!camError && !starting && (
          <button
            onClick={resetScan}
            style={{
              padding: "10px 16px", borderRadius: 8,
              border: `1.5px solid ${gold}`, background: "transparent",
              color: maroonDark, fontWeight: 700, fontSize: 13, cursor: "pointer",
            }}>
            ↻ Restart Scan
          </button>
        )}

        {onCancel && (
          <button
            onClick={onCancel}
            style={{
              padding: "10px 16px", borderRadius: 8,
              border: "1.5px solid #CBD5E1", background: "transparent",
              color: "#64748B", fontWeight: 700, fontSize: 13, cursor: "pointer",
            }}>
            Cancel
          </button>
        )}
      </div>

      {/* File upload alternative */}
      <label style={{
        display: "inline-block", marginTop: 14,
        fontSize: 12, color: "#6B644C",
        textDecoration: "underline", cursor: "pointer",
      }}>
        Or upload {isIdCard ? "ID card photo" : "face photo"} from device
        <input
          type="file"
          accept="image/jpeg,image/png,image/webp"
          style={{ display: "none" }}
          onChange={e => {
            const f = e.target.files?.[0];
            if (!f) return;
            const url = URL.createObjectURL(f);
            setCapturedPreview(url);
            if (isIdCard) {
              setScanStatus("reading");
              (async () => {
                let extractedOcr = "";
                try {
                  const { default: Tesseract } = await import("tesseract.js");
                  const ocrRes = await Promise.race([
                    Tesseract.recognize(f, "eng"),
                    new Promise(resolve => setTimeout(() => resolve(null), 6500)),
                  ]);
                  if (ocrRes?.data?.text) {
                    extractedOcr = ocrRes.data.text;
                  }
                } catch {}
                setScanStatus("verified");
                setTimeout(() => {
                  onCapture(f, identityInput, {
                    idCardFile: f,
                    cardPreview: url,
                    ocrText: extractedOcr,
                    identityInput,
                  });
                }, 300);
              })();
            } else {
              setScanStatus("verified");
              setTimeout(() => {
                onCapture(f, "", {
                  faceFile: f,
                  facePreview: url,
                });
              }, 300);
            }
          }}
        />
      </label>

      <style>{`
        @keyframes scanBeam {
          0% { top: 4%; }
          100% { top: 92%; }
        }
        @keyframes flash {
          from { opacity: 0.8; }
          to { opacity: 0; }
        }
      `}</style>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════
   MAIN MEDICAL MODULE
═══════════════════════════════════════════════════════════ */
export default function MedicalModule({ emergencyMode = false, onSuccess, onClose }) {
  /* Common States - TWO INDEPENDENT METHODS ONLY: "idcard" | "face" */
  const [mode, setMode]                   = useState("idcard"); // "idcard" | "face"
  const [stage, setStage]                 = useState(emergencyMode ? "select" : "dashboard_calling");
  const [error, setError]                 = useState("");
  const [notRegistered, setNotRegistered] = useState(false);
  const [verifiedUser, setVerifiedUser]   = useState(null);
  const [scanPreviews, setScanPreviews]   = useState({ card: null, face: null });
  
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
        const active = list[0];
        setActiveStaff(active);
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
     EMERGENCY / SCANNER AUTHENTICATION
     Two Completely Separate Endpoints:
     METHOD 1: /api/emergency/verify-id-card/ (ID Card only)
     METHOD 2: /api/emergency/verify-face/ (Face only)
  ────────────────────────────────────────────────────────── */
  const handleCapture = async (file, idNumberInput = "", scanData = null) => {
    localStorage.removeItem("cems_access");
    localStorage.removeItem("cems_refresh");

    // Critical: Clear ANY previous verified identity before starting a new scan
    setVerifiedUser(null);
    setError("");
    setNotRegistered(false);

    // Save preview for verification screen
    if (scanData?.cardPreview || scanData?.facePreview) {
      setScanPreviews({
        card: scanData.cardPreview || null,
        face: scanData.facePreview || null,
      });
    }

    setStage("verifying");

    const body = new FormData();
    let endpoint = "";

    if (mode === "idcard") {
      // METHOD 1: ID CARD SCANNER ONLY
      endpoint = "/api/emergency/verify-id-card/";
      const cardFile = scanData?.idCardFile || file;
      if (cardFile) {
        body.append("id_card_image", cardFile);
      }
      if (scanData?.ocrText) {
        body.append("ocr_text", scanData.ocrText);
      }
      const rawInput = (scanData?.identityInput || idNumberInput || "").trim();
      if (rawInput) {
        if (rawInput.includes("@")) {
          body.append("email", rawInput);
        } else if (/^[A-Za-z]{2,5}-\d{4}-\d{4}$/i.test(rawInput)) {
          body.append("id_year", rawInput);
        } else {
          body.append("name", rawInput);
        }
      }
    } else {
      // METHOD 2: FACE SCANNER ONLY
      endpoint = "/api/emergency/verify-face/";
      const faceFile = scanData?.faceFile || file;
      if (faceFile) {
        body.append("face_image", faceFile);
        body.append("image", faceFile);
      }
    }

    try {
      const res  = await fetch(endpoint, { method: "POST", body });
      const data = await res.json();
      if (!res.ok || data.authenticated === false || (data.success === false && !data.verified)) {
        setVerifiedUser(null);
        localStorage.removeItem("cems_access");
        localStorage.removeItem("cems_refresh");
        setError(data.message || data.detail || "Identity verification failed.");
        setNotRegistered(!!data.not_registered);
        setStage("failed");
        return;
      }
      // Successful match! Store tokens and show verified screen with exact user info
      if (data.access) localStorage.setItem("cems_access", data.access);
      if (data.refresh) localStorage.setItem("cems_refresh", data.refresh);

      setVerifiedUser(data);
      setStage("success");
    } catch {
      setVerifiedUser(null);
      localStorage.removeItem("cems_access");
      localStorage.removeItem("cems_refresh");
      setError("Cannot reach the server. Make sure Django is running on port 8000.");
      setNotRegistered(false);
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
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 18, borderBottom: `2px solid ${line}`, paddingBottom: 12 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <span style={{ fontSize: 28 }}>🚨</span>
              <div style={{ textAlign: "left" }}>
                <div style={{ fontFamily: "Georgia, serif", fontSize: 20, fontWeight: 900, color: "#9E2A2B", letterSpacing: "0.02em" }}>
                  EMERGENCY SOS
                </div>
                <div style={{ fontSize: 12, color: "#6B644C", fontWeight: 600 }}>
                  Verify your identity to continue
                </div>
              </div>
            </div>
            {onClose && (
              <button onClick={onClose} style={{ border: "none", background: "none", cursor: "pointer", fontSize: 24, color: "#666", fontWeight: 700 }}>
                &times;
              </button>
            )}
          </div>

          {/* Verification Choice: TWO COMPLETELY SEPARATE METHODS */}
          <div style={{ marginBottom: 20 }}>
            <p style={{ fontSize: 13, color: "#475569", margin: "0 0 14px 0", fontWeight: 700, textAlign: "center" }}>
              Choose a verification method:
            </p>

            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              {/* Option 1: ID Card Scanner */}
              <div
                id="btn-scan-id-card"
                onClick={() => {
                  setVerifiedUser(null);
                  setError("");
                  setNotRegistered(false);
                  setScanPreviews({ card: null, face: null });
                  setMode("idcard");
                  setStage("scanning");
                }}
                style={{
                  background: "#FFFFFF",
                  border: `2px solid ${gold}`,
                  borderRadius: 12,
                  padding: "18px 20px",
                  cursor: "pointer",
                  textAlign: "center",
                  transition: "all 0.18s ease-in-out",
                  boxShadow: "0 3px 12px rgba(212,175,55,0.18)",
                }}
                onMouseEnter={e => {
                  e.currentTarget.style.transform = "translateY(-2px)";
                  e.currentTarget.style.borderColor = maroon;
                  e.currentTarget.style.boxShadow = "0 6px 18px rgba(107,30,43,0.22)";
                }}
                onMouseLeave={e => {
                  e.currentTarget.style.transform = "translateY(0)";
                  e.currentTarget.style.borderColor = gold;
                  e.currentTarget.style.boxShadow = "0 3px 12px rgba(212,175,55,0.18)";
                }}
              >
                <div style={{ fontSize: 32, marginBottom: 6 }}>🪪</div>
                <div style={{ fontSize: 16, fontWeight: 800, color: maroonDark, marginBottom: 4 }}>
                  [ Scan ID Card ]
                </div>
                <div style={{ fontSize: 12, color: "#6B644C", fontWeight: 600 }}>
                  Use your physical college ID card
                </div>
              </div>

              {/* OR Separator */}
              <div style={{
                display: "flex", alignItems: "center", justifyContent: "center",
                gap: 12, margin: "4px 0"
              }}>
                <div style={{ flex: 1, height: 1, background: line }} />
                <span style={{ fontSize: 12, fontWeight: 800, color: "#94A3B8", letterSpacing: "0.1em" }}>OR</span>
                <div style={{ flex: 1, height: 1, background: line }} />
              </div>

              {/* Option 2: Face Scanner */}
              <div
                id="btn-scan-face"
                onClick={() => {
                  setVerifiedUser(null);
                  setError("");
                  setNotRegistered(false);
                  setScanPreviews({ card: null, face: null });
                  setMode("face");
                  setStage("scanning");
                }}
                style={{
                  background: "#FFFFFF",
                  border: "2px solid #86EFAC",
                  borderRadius: 12,
                  padding: "18px 20px",
                  cursor: "pointer",
                  textAlign: "center",
                  transition: "all 0.18s ease-in-out",
                  boxShadow: "0 3px 12px rgba(16,185,129,0.15)",
                }}
                onMouseEnter={e => {
                  e.currentTarget.style.transform = "translateY(-2px)";
                  e.currentTarget.style.borderColor = "#16A34A";
                  e.currentTarget.style.boxShadow = "0 6px 18px rgba(22,163,74,0.22)";
                }}
                onMouseLeave={e => {
                  e.currentTarget.style.transform = "translateY(0)";
                  e.currentTarget.style.borderColor = "#86EFAC";
                  e.currentTarget.style.boxShadow = "0 3px 12px rgba(16,185,129,0.15)";
                }}
              >
                <div style={{ fontSize: 32, marginBottom: 6 }}>👤</div>
                <div style={{ fontSize: 16, fontWeight: 800, color: "#166534", marginBottom: 4 }}>
                  [ Scan Face ]
                </div>
                <div style={{ fontSize: 12, color: "#15803D", fontWeight: 600 }}>
                  Use facial verification
                </div>
              </div>
            </div>
          </div>

          {/* Section: Immediate Assistance Calling (No Login Required) */}
          <div style={{ borderTop: `1.5px solid ${line}`, paddingTop: 16 }}>
            <h3 style={{ margin: "0 0 10px 0", fontSize: 11, fontWeight: 800, color: maroonDark, letterSpacing: "0.05em", textTransform: "uppercase", textAlign: "left" }}>
              📞 Immediate Assistance (No Login Required)
            </h3>
            {loadingStaff ? (
              <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "10px", background: "rgba(0,0,0,0.02)", borderRadius: 8 }}>
                <div style={{ width: 14, height: 14, border: "2px solid #ccc", borderTopColor: maroon, borderRadius: "50%", animation: "spin 0.8s linear infinite" }} />
                <span style={{ fontSize: 11, color: "#666" }}>Loading available representatives...</span>
              </div>
            ) : staffList.length === 0 ? (
              <div style={{ padding: "10px", background: "#FEF2F2", borderRadius: 8, fontSize: 11, color: brick, border: `1px dashed ${brick}` }}>
                ⚠️ No medical staff on duty. Campus Security: 100 · Ambulance: 108
              </div>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                {staffList.slice(0, 2).map(s => (
                  <div key={s.id} style={{
                    background: "#fff", border: `1.5px solid ${line}`,
                    borderRadius: 10, padding: "10px 12px",
                    display: "flex", justifyContent: "space-between", alignItems: "center",
                    boxShadow: "0 2px 6px rgba(0,0,0,0.03)"
                  }}>
                    <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
                      {s.profile_image ? (
                        <img
                          src={s.profile_image.startsWith("http") ? s.profile_image : `http://127.0.0.1:8000${s.profile_image}`}
                          alt={s.name}
                          style={{ width: 40, height: 40, borderRadius: "50%", objectFit: "cover", border: `2px solid ${gold}` }}
                        />
                      ) : (
                        <div style={{ width: 40, height: 40, borderRadius: "50%", background: maroonSoft, display: "flex", alignItems: "center", justifyContent: "center", color: gold, fontWeight: 700, border: `2px solid ${gold}` }}>
                          {(s.name || "?")[0].toUpperCase()}
                        </div>
                      )}
                      <div style={{ textAlign: "left" }}>
                        <div style={{ fontWeight: 800, fontSize: 13, color: maroonDark }}>{s.name}</div>
                        <div style={{ fontSize: 11, color: "#6B644C" }}>{s.designation} · {s.contact_number}</div>
                      </div>
                    </div>
                    <a href={`tel:${s.contact_number}`} style={{
                      display: "inline-flex", alignItems: "center", justifyContent: "center",
                      width: 36, height: 36, borderRadius: "50%", background: "#e53935",
                      color: "#fff", boxShadow: "0 3px 8px rgba(229,57,53,0.35)",
                      textDecoration: "none",
                    }}
                    title={`Call ${s.name}`}
                    >
                      <PhoneIcon size={16} />
                    </a>
                  </div>
                ))}
              </div>
            )}
          </div>
        </Card>
      );
    }

    if (stage === "scanning") {
      return (
        <Card>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
            <Label>
              {mode === "idcard" ? "🪪 College ID Card Scanner" : "👤 Face Verification Scanner"}
            </Label>
            <div style={{ display: "flex", gap: 10 }}>
              <button
                onClick={() => setStage("select")}
                style={{
                  border: "none", background: "none", cursor: "pointer",
                  fontSize: 12, color: maroon, fontWeight: 700, textDecoration: "underline"
                }}
              >
                ← Change Method
              </button>
              {onClose && (
                <button onClick={onClose} style={{ border: "none", background: "none", cursor: "pointer", fontSize: 20 }}>
                  &times;
                </button>
              )}
            </div>
          </div>
          <CameraView mode={mode} onCapture={handleCapture} onCancel={() => setStage("select")} />
        </Card>
      );
    }

    if (stage === "verifying") {
      const isCard = mode === "idcard";
      return (
        <Card style={{ padding: "26px", border: `2px solid ${isCard ? gold : "#10B981"}` }}>
          <div style={{ textAlign: "center", marginBottom: 20 }}>
            <div style={{
              width: 52, height: 52, border: "4px solid #A7F3D0",
              borderTopColor: isCard ? maroon : "#15803D", borderRadius: "50%",
              animation: "spin 0.8s linear infinite", margin: "0 auto 12px"
            }} />
            <div style={{ fontSize: 18, fontWeight: 900, color: isCard ? maroonDark : "#166534" }}>
              {isCard ? "Verifying ID Card..." : "Verifying Face..."}
            </div>
            <div style={{ fontSize: 12, color: "#6B644C", marginTop: 4 }}>
              {isCard
                ? "Reading card information and identifying registered account…"
                : "Comparing live face against registered reference profile…"}
            </div>
          </div>

          {/* Captured Preview */}
          {((isCard && scanPreviews.card) || (!isCard && scanPreviews.face)) && (
            <div style={{
              display: "flex", justifyContent: "center", marginBottom: 18,
              background: "#FAF9F6", padding: "12px", borderRadius: 10, border: `1px solid ${line}`
            }}>
              {isCard && scanPreviews.card && (
                <div style={{ textAlign: "center" }}>
                  <img
                    src={scanPreviews.card}
                    alt="Captured ID Card"
                    style={{ width: 180, height: 114, objectFit: "cover", borderRadius: 8, border: `2px solid ${gold}` }}
                  />
                  <div style={{ fontSize: 11, fontWeight: 700, color: maroonDark, marginTop: 4 }}>
                    Captured College ID Card
                  </div>
                </div>
              )}
              {!isCard && scanPreviews.face && (
                <div style={{ textAlign: "center" }}>
                  <img
                    src={scanPreviews.face}
                    alt="Captured Live Face"
                    style={{ width: 100, height: 100, objectFit: "cover", borderRadius: "50%", border: "2px solid #10B981" }}
                  />
                  <div style={{ fontSize: 11, fontWeight: 700, color: "#166534", marginTop: 4 }}>
                    Live Face Capture
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Status checklist */}
          <div style={{
            background: "#FFFFFF", border: "1.5px solid #E2E8F0",
            borderRadius: 10, padding: "14px 16px", textAlign: "left", fontSize: 12, color: "#334155"
          }}>
            {isCard ? (
              <>
                <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8, color: "#166534", fontWeight: 700 }}>
                  <span>✓</span> <span>Physical ID card detected</span>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8, color: "#166534", fontWeight: 700 }}>
                  <span>✓</span> <span>Card image captured &amp; quality verified</span>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8, color: maroonDark, fontWeight: 700 }}>
                  <span style={{ display: "inline-block", width: 10, height: 10, borderRadius: "50%", background: "#F59E0B" }} />
                  <span>OCR reading and registered account lookup…</span>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: 8, color: "#64748B", fontWeight: 600 }}>
                  <span>🔒</span> <span>Independent ID verification (ID Year treated as non-unique batch)</span>
                </div>
              </>
            ) : (
              <>
                <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8, color: "#166534", fontWeight: 700 }}>
                  <span>✓</span> <span>Live face detected</span>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8, color: "#166534", fontWeight: 700 }}>
                  <span>✓</span> <span>Single subject &amp; illumination confirmed</span>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8, color: "#166534", fontWeight: 700 }}>
                  <span style={{ display: "inline-block", width: 10, height: 10, borderRadius: "50%", background: "#10B981" }} />
                  <span>Matching live face against registered reference biometrics…</span>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: 8, color: "#64748B", fontWeight: 600 }}>
                  <span>🔒</span> <span>Independent facial authentication (No ID card required)</span>
                </div>
              </>
            )}
          </div>
          <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
        </Card>
      );
    }

    if (stage === "success") {
      const isCard = verifiedUser?.verification_method === "id_card";
      const responder = verifiedUser?.responder || (staffList.length > 0 ? staffList[0] : null);
      return (
        <Card style={{ padding: "26px", background: "#F0FDF4", border: "2.5px solid #10B981" }}>
          {/* Header */}
          <div style={{ textAlign: "center", marginBottom: 18 }}>
            <div style={{
              width: 58, height: 58, borderRadius: "50%",
              background: "#DCFCE7", border: "2px solid #10B981",
              display: "flex", alignItems: "center", justifyContent: "center",
              margin: "0 auto 10px", fontSize: 30, color: "#15803D"
            }}>
              ✓
            </div>
            <div style={{ fontSize: 20, fontWeight: 900, color: "#166534" }}>
              Identity Verified
            </div>
            <div style={{
              display: "inline-block", marginTop: 6, padding: "4px 12px", borderRadius: 20,
              background: isCard ? "#FEF3C7" : "#E0E7FF",
              color: isCard ? "#92400E" : "#3730A3",
              fontSize: 11, fontWeight: 800, letterSpacing: "0.03em"
            }}>
              {isCard ? "🪪 Verified via ID Card Scanner" : "👤 Verified via Face Scanner"}
            </div>
          </div>

          {/* User Details Card */}
          {verifiedUser && (
            <div style={{
              background: "#FFFFFF", border: "1.5px solid #86EFAC",
              borderRadius: 12, padding: "16px", marginBottom: 16,
              display: "flex", gap: 14, alignItems: "center",
              boxShadow: "0 2px 8px rgba(22, 101, 52, 0.08)"
            }}>
              {verifiedUser.identity?.profile_image ? (
                <img
                  src={verifiedUser.identity.profile_image}
                  alt={verifiedUser.full_name}
                  style={{ width: 64, height: 64, borderRadius: "50%", objectFit: "cover", border: `2.5px solid ${gold}` }}
                />
              ) : (
                <div style={{
                  width: 64, height: 64, borderRadius: "50%", background: maroonSoft,
                  display: "flex", alignItems: "center", justifyContent: "center",
                  color: gold, fontSize: 24, fontWeight: 800, border: `2.5px solid ${gold}`
                }}>
                  {(verifiedUser.full_name || verifiedUser.username || "?")[0].toUpperCase()}
                </div>
              )}
              <div style={{ textAlign: "left", flex: 1 }}>
                <div style={{ fontSize: 16, fontWeight: 800, color: maroonDark }}>
                  {verifiedUser.full_name || verifiedUser.username}
                </div>
                <div style={{ fontSize: 12, color: "#475569", fontWeight: 600, marginTop: 2 }}>
                  Role: <span style={{ textTransform: "capitalize", color: maroon }}>{verifiedUser.role || "Student"}</span>
                  {verifiedUser.identity?.department && ` • ${verifiedUser.identity.department}`}
                </div>
                {verifiedUser.identity?.email && (
                  <div style={{ fontSize: 11, color: "#64748B", marginTop: 2 }}>
                    ✉️ {verifiedUser.identity.email}
                  </div>
                )}
                {verifiedUser.identity?.id_year && (
                  <div style={{
                    display: "inline-flex", alignItems: "center", gap: 6,
                    marginTop: 6, padding: "3px 10px", borderRadius: 12,
                    background: "#F0FDF4", border: "1px solid #86EFAC",
                    fontSize: 11, fontWeight: 700, color: "#166534"
                  }}>
                    <span>🪪 ID Year (Batch):</span>
                    <span>{verifiedUser.identity.id_year}</span>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Assigned Medical Responder */}
          {responder && (
            <div style={{
              background: "#FFFBEB", border: "1.5px solid #FCD34D",
              borderRadius: 12, padding: "14px", marginBottom: 18,
              display: "flex", justifyContent: "space-between", alignItems: "center"
            }}>
              <div style={{ textAlign: "left" }}>
                <div style={{ fontSize: 11, fontWeight: 800, color: "#92400E", letterSpacing: "0.04em", textTransform: "uppercase" }}>
                  🚨 Assigned On-Duty Medical Representative
                </div>
                <div style={{ fontSize: 14, fontWeight: 800, color: maroonDark, marginTop: 2 }}>
                  {responder.name || responder.user?.get_full_name}
                </div>
                <div style={{ fontSize: 11, color: "#78350F" }}>
                  {responder.designation || "Medical Officer"} • {responder.contact_number}
                </div>
              </div>
              <a
                href={`tel:${responder.contact_number}`}
                style={{
                  display: "inline-flex", alignItems: "center", gap: 6,
                  padding: "9px 16px", borderRadius: 8,
                  background: "#DC2626", color: "#fff",
                  textDecoration: "none", fontWeight: 800, fontSize: 13,
                  boxShadow: "0 3px 8px rgba(220,38,38,0.3)"
                }}
              >
                <PhoneIcon size={16} /> Call Responder
              </a>
            </div>
          )}

          {/* Action buttons */}
          <div style={{ display: "flex", gap: 10, justifyContent: "center" }}>
            <button
              onClick={() => {
                if (verifiedUser && (verifiedUser.authenticated || verifiedUser.verified) && verifiedUser.user) {
                  onSuccess?.(verifiedUser);
                }
              }}
              style={{
                flex: 1, padding: "12px 18px", borderRadius: 8, border: "none",
                background: `linear-gradient(135deg, ${maroon}, ${maroonSoft})`,
                color: "#fff", fontWeight: 800, fontSize: 14, cursor: "pointer",
                boxShadow: "0 3px 10px rgba(107,30,43,0.3)"
              }}
            >
              🚑 Access Emergency SOS / Medical Records
            </button>
            {onClose && (
              <button
                onClick={onClose}
                style={{
                  padding: "12px 18px", borderRadius: 8,
                  border: `1.5px solid ${gold}`, background: "transparent",
                  color: maroonDark, fontWeight: 700, fontSize: 13, cursor: "pointer"
                }}
              >
                Close
              </button>
            )}
          </div>
        </Card>
      );
    }

    if (stage === "failed") {
      return (
        <Card style={{ borderColor: notRegistered ? "#8B1E3F" : brick }}>
          <Label>{notRegistered ? "🚫 Not Registered" : "Verification Failed"}</Label>

          {notRegistered ? (
            /* ── NOT REGISTERED PANEL ── */
            <div style={{ textAlign: "center", padding: "10px 0" }}>
              <div style={{ fontSize: 48, marginBottom: 12 }}>🚫</div>
              <div style={{ fontWeight: 800, fontSize: 16, color: "#581124", marginBottom: 10 }}>
                {mode === "idcard" ? "ID Card Not Registered" : "Face Not Recognized"}
              </div>
              <div style={{
                background: "#F5F3FF", border: "1.5px solid #A7F3D0",
                borderRadius: 10, padding: "14px 16px", marginBottom: 16,
                fontSize: 13, color: "#6E172C", lineHeight: 1.6, textAlign: "left",
              }}>
                <div style={{ fontWeight: 700, marginBottom: 6 }}>ℹ️ What does this mean?</div>
                <p style={{ margin: 0 }}>
                  {mode === "idcard"
                    ? "This physical ID card could not be matched to an active, approved student account in CEMS."
                    : "The scanned face could not be matched to a registered user's profile photo in CEMS."}
                </p>
              </div>
              <div style={{
                background: "#FEF2F2", border: "1.5px solid #FECACA",
                borderRadius: 10, padding: "14px 16px", marginBottom: 18,
                fontSize: 13, color: "#991B1B", lineHeight: 1.6, textAlign: "left",
              }}>
                <div style={{ fontWeight: 700, marginBottom: 6 }}>🆘 Need emergency help right now?</div>
                <p style={{ margin: 0 }}>
                  Call campus emergency services directly:
                  <br /><strong>Campus Security:</strong> 100<br />
                  <strong>Medical Emergency:</strong> 108<br />
                  <strong>Admin Office:</strong> Contact college administration
                </p>
              </div>
              <div style={{ display: "flex", gap: 10, justifyContent: "center", flexWrap: "wrap" }}>
                <button onClick={() => { setVerifiedUser(null); setScanPreviews({ card: null, face: null }); setStage("scanning"); setError(""); setNotRegistered(false); }} style={buttonStyle("primary")}>
                  🔄 Try Again
                </button>
                <button onClick={() => { setVerifiedUser(null); setScanPreviews({ card: null, face: null }); setStage("select"); setError(""); setNotRegistered(false); }}
                  style={buttonStyle("secondary")}>
                  ← Back to Methods
                </button>
                {onClose && <button onClick={onClose} style={buttonStyle("secondary")}>Close</button>}
              </div>
            </div>
          ) : (
            /* ── SCAN FAILED PANEL ── */
            <div>
              <div style={{
                background: "#fff0f0", border: "1px solid #f5c6c6",
                borderRadius: 8, padding: "14px 16px", marginBottom: 16,
                fontSize: 13, color: "#b71c1c", lineHeight: 1.5,
              }}>
                <strong>⚠️ Verification issue:</strong><br />
                {error || "Verification could not be completed."}
              </div>
              <div style={{ display: "flex", gap: 10 }}>
                <button onClick={() => { setVerifiedUser(null); setScanPreviews({ card: null, face: null }); setStage("scanning"); setError(""); setNotRegistered(false); }} style={buttonStyle("primary")}>
                  🔄 Try Again
                </button>
                <button onClick={() => { setVerifiedUser(null); setScanPreviews({ card: null, face: null }); setStage("select"); setError(""); setNotRegistered(false); }}
                  style={buttonStyle("secondary")}>
                  ← Choose Verification Method
                </button>
                {onClose && <button onClick={onClose} style={buttonStyle("secondary")}>Close</button>}
              </div>
            </div>
          )}
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
          <div style={{ width: 40, height: 40, border: "4px solid #A7F3D0",
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
                    <span>🆔 ID Year: {log.scanned_id_year || log.scanned_id_number || "Emergency Scan"}</span>
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

