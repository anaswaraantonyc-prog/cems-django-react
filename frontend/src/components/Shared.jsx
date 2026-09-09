import { maroon, maroonDark, brownLight, gold, line, offWhiteDim } from "../theme";

/* ── Stamp ─────────────────────────────────────────────────── */
export function Stamp({ text, tone = "gold" }) {
  const colors = {
    gold:  gold,
    sage:  "#3F6B4C",
    brick: "#A5432B",
    brass: gold,
  };
  const c = colors[tone] || gold;
  return (
    <span style={{
      display: "inline-block",
      border: `2px solid ${c}`,
      color: c,
      fontFamily: "'Courier New', monospace",
      fontSize: 11,
      letterSpacing: "0.12em",
      textTransform: "uppercase",
      padding: "3px 9px",
      borderRadius: 3,
      transform: "rotate(-3deg)",
      fontWeight: 700,
      background: "rgba(255,255,255,0.5)",
    }}>
      {text}
    </span>
  );
}

/* ── Card ──────────────────────────────────────────────────── */
export function Card({ children, style }) {
  return (
    <div style={{
      background: "#FFFFFF",
      border: `1.5px solid #E8D5D8`,
      borderRadius: 14,
      padding: "20px 22px",
      marginBottom: 16,
      boxShadow: "0 4px 18px rgba(107,30,43,0.07)",
      ...style,
    }}>
      {children}
    </div>
  );
}

/* ── Label ─────────────────────────────────────────────────── */
export function Label({ children }) {
  return (
    <div style={{
      fontSize: 11,
      letterSpacing: "0.08em",
      textTransform: "uppercase",
      color: brownLight,
      marginBottom: 5,
      fontWeight: 700,
    }}>
      {children}
    </div>
  );
}

/* ── Field ─────────────────────────────────────────────────── */
export function Field({ label, children, error }) {
  return (
    <div style={{ marginBottom: 14 }}>
      {label && <Label>{label}</Label>}
      {children}
      {error && (
        <div style={{ fontSize: 12, color: "#A5432B", marginTop: 4,
          display: "flex", alignItems: "center", gap: 4 }}>
          ✕ {error}
        </div>
      )}
    </div>
  );
}

/* ── SectionHeading ────────────────────────────────────────── */
export function SectionHeading({ children }) {
  return (
    <div style={{
      fontFamily: "Georgia, serif",
      fontSize: 16,
      fontWeight: 700,
      color: maroonDark,
      marginBottom: 14,
      paddingBottom: 8,
      borderBottom: `1.5px solid #FFFFFF`,
    }}>
      {children}
    </div>
  );
}

/* ── StatusBadge ───────────────────────────────────────────── */
export function StatusBadge({ status }) {
  const map = {
    CONFIRMED: { bg: "#E8F5E9", color: "#2E7D32", label: "Confirmed" },
    PENDING:   { bg: "#FFF8E1", color: "#F57F17", label: "Pending"   },
    CANCELLED: { bg: "#FFEBEE", color: "#B71C1C", label: "Cancelled" },
    REFUNDED:  { bg: "#E3F2FD", color: "#1565C0", label: "Refunded"  },
  };
  const s = map[status] || { bg: "#F5F5F5", color: "#616161", label: status };
  return (
    <span style={{
      fontSize: 11, fontWeight: 700, padding: "3px 10px",
      borderRadius: 20, background: s.bg, color: s.color,
      letterSpacing: "0.04em",
    }}>
      {s.label}
    </span>
  );
}
