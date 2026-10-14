import { SirenBeaconIcon } from "./EmergencySirenModal";

export default function Navbar({ view, onNav, onEmergency }) {
  return (
    <nav style={{
      background: "#FFFFFF",
      display: "flex", alignItems: "center", justifyContent: "space-between",
      padding: "0 28px", height: 60,
      borderBottom: "1.5px solid #A7F3D0",
      boxShadow: "0 2px 16px rgba(5, 150, 105, 0.08)",
      position: "sticky", top: 0, zIndex: 20,
    }}>
      {/* brand */}
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
            fontSize: 18, fontWeight: 800, color: "#065F46", letterSpacing: "-0.01em", display: "flex", alignItems: "center", gap: 8
          }}>
            <span>CEMS</span>
          </div>
          <div style={{
            fontSize: 9, color: "#059669", letterSpacing: "0.12em", fontWeight: 700
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
              border: `1.5px solid ${view === v ? "#059669" : "#A7F3D0"}`,
              background: view === v
                ? "linear-gradient(135deg, #10B981, #059669)"
                : "#FFFFFF",
              color: view === v ? "#ffffff" : "#065F46",
              fontSize: 13, fontWeight: 700, cursor: "pointer",
              letterSpacing: "0.01em",
              transition: "all 0.2s cubic-bezier(0.4, 0, 0.2, 1)",
              textTransform: "capitalize",
              boxShadow: view === v ? "0 4px 14px rgba(5, 150, 105, 0.25)" : "none",
            }}>
            {v}
          </button>
        ))}

        {/* emergency button at top of page in navbar */}
        <button onClick={onEmergency}
          title="Emergency SOS: Scan Face or ID Card for emergency assistance"
          style={{
            display: "flex", alignItems: "center", gap: 7,
            padding: "8px 18px", borderRadius: 9999,
            border: "1.5px solid #FCA5A5",
            background: "#FEF2F2",
            color: "#DC2626",
            fontSize: 13, fontWeight: 800, cursor: "pointer",
            boxShadow: "0 2px 8px rgba(220, 38, 38, 0.15)",
            marginLeft: 4,
            transition: "all 0.2s cubic-bezier(0.4, 0, 0.2, 1)",
          }}>
          <SirenBeaconIcon size={16} color="#DC2626" />
          Emergency SOS
        </button>
      </div>
    </nav>
  );
}
