import { maroon, maroonDark, offWhite, gold, goldLight, emergencyRed, sidebarFloral } from "../theme";

export default function Navbar({ view, onNav, onEmergency }) {
  return (
    <nav style={{
      ...sidebarFloral,
      display: "flex", alignItems: "center", justifyContent: "space-between",
      padding: "0 28px", height: 58,
      boxShadow: "0 2px 14px rgba(74,18,28,0.28)",
      position: "sticky", top: 0, zIndex: 20,
    }}>
      {/* ── brand ── */}
      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
        <div style={{ width: 36, height: 36, borderRadius: "50%",
          border: `2px solid ${gold}`,
          display: "flex", alignItems: "center", justifyContent: "center",
          color: gold, fontFamily: "Georgia, serif", fontWeight: 700, fontSize: 16 }}>
          C
        </div>
        <div>
          <div style={{ fontFamily: "Georgia, serif", fontSize: 20,
            fontWeight: 700, color: offWhite, letterSpacing: "0.02em" }}>
            CEMS
          </div>
          <div style={{ fontSize: 9, color: goldLight, letterSpacing: "0.12em" }}>
            CAMPUS EVENT MANAGEMENT
          </div>
        </div>
      </div>

      {/* ── nav buttons ── */}
      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
        {["login", "register"].map((v) => (
          <button key={v} onClick={() => onNav(v)}
            style={{
              padding: "7px 18px", borderRadius: 20,
              border: `1.5px solid ${view === v ? gold : "rgba(255,255,255,0.35)"}`,
              background: view === v ? gold : "transparent",
              color: view === v ? maroonDark : offWhite,
              fontSize: 13, fontWeight: 700, cursor: "pointer",
              letterSpacing: "0.02em", transition: "all 0.15s",
              textTransform: "capitalize",
            }}>
            {v}
          </button>
        ))}

        {/* ── emergency button ── */}
        <button onClick={onEmergency}
          title="Emergency: scan ID card and call medical rep"
          style={{
            display: "flex", alignItems: "center", gap: 6,
            padding: "7px 16px", borderRadius: 20, border: "none",
            background: emergencyRed, color: "#fff",
            fontSize: 13, fontWeight: 700, cursor: "pointer",
            boxShadow: "0 2px 10px rgba(179,32,46,0.55)",
            marginLeft: 4,
          }}>
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none">
            <path d="M12 21s-7.5-4.6-10-9.1C0.3 8.1 2 4.5 5.6 4C8 3.7 9.9 5 12 7.2C14.1 5 16 3.7 18.4 4C22 4.5 23.7 8.1 22 11.9C19.5 16.4 12 21 12 21z"
              fill="#fff"/>
            <path d="M6 12h3l1.5-3 2 6L14 12h4"
              stroke={emergencyRed} strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
          Emergency
        </button>
      </div>
    </nav>
  );
}
