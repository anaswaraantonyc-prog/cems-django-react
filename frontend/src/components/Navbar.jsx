export default function Navbar({ view, onNav, onEmergency }) {
  return (
    <nav style={{
      background: "linear-gradient(90deg, #581124 0%, #722F37 100%)",
      display: "flex", alignItems: "center", justifyContent: "space-between",
      padding: "0 28px", height: 60,
      borderBottom: "1px solid rgba(255,255,255,0.06)",
      boxShadow: "0 4px 24px rgba(88, 17, 36, 0.35)",
      position: "sticky", top: 0, zIndex: 20,
      backdropFilter: "blur(12px)",
    }}>
      {/* brand */}
      <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
        <div style={{
          width: 38, height: 38, borderRadius: 10,
          background: "linear-gradient(135deg, #8B1E3F, #722F37)",
          display: "flex", alignItems: "center", justifyContent: "center",
          color: "#ffffff", fontWeight: 800, fontSize: 18,
          boxShadow: "0 4px 14px rgba(201, 107, 133, 0.5)",
          letterSpacing: "-0.02em",
        }}>
          C
        </div>
        <div>
          <div style={{
            fontSize: 18, fontWeight: 800, color: "#ffffff", letterSpacing: "-0.01em"
          }}>
            CEMS
          </div>
          <div style={{
            fontSize: 9, color: "rgba(203,213,225,0.8)", letterSpacing: "0.12em", fontWeight: 600
          }}>
            COLLEGE EVENT MANAGEMENT
          </div>
        </div>
      </div>

      {/* nav buttons */}
      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
        {["login", "register"].map((v) => (
          <button key={v} onClick={() => onNav(v)}
            style={{
              padding: "8px 20px", borderRadius: 9999,
              border: `1.5px solid ${view === v ? "#8B1E3F" : "rgba(255, 255, 255, 0.15)"}`,
              background: view === v
                ? "linear-gradient(135deg, #8B1E3F, #722F37)"
                : "rgba(255,255,255,0.04)",
              color: view === v ? "#ffffff" : "rgba(203,213,225,0.9)",
              fontSize: 13, fontWeight: 600, cursor: "pointer",
              letterSpacing: "0.01em",
              transition: "all 0.2s cubic-bezier(0.4, 0, 0.2, 1)",
              textTransform: "capitalize",
              boxShadow: view === v ? "0 4px 16px rgba(201, 107, 133, 0.4)" : "none",
            }}>
            {v}
          </button>
        ))}

        {/* emergency button */}
        <button onClick={onEmergency}
          title="Emergency SOS: Scan Face or ID Card for emergency assistance"
          style={{
            display: "flex", alignItems: "center", gap: 7,
            padding: "8px 18px", borderRadius: 9999, border: "none",
            background: "linear-gradient(135deg, #dc2626, #b91c1c)",
            color: "#ffffff",
            fontSize: 13, fontWeight: 700, cursor: "pointer",
            boxShadow: "0 4px 16px rgba(220, 38, 38, 0.35)",
            marginLeft: 4,
            transition: "all 0.2s cubic-bezier(0.4, 0, 0.2, 1)",
          }}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#ffffff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M19.5 12.572L12 20l-7.5-7.428A5 5 0 1 1 12 6.006a5 5 0 1 1 7.5 6.572" fill="rgba(255,255,255,0.15)"/>
            <path d="M3.5 12h3.5l1.5-4 2.5 8 2.5-6 1.5 2H20.5" stroke="#ffffff" strokeWidth="2"/>
          </svg>
          Emergency
        </button>
      </div>
    </nav>
  );
}
