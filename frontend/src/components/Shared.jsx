import { useState, useEffect } from "react";
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
export function Card({ children, style, hover = false }) {
  const [hovered, setHovered] = useState(false);
  return (
    <div
      onMouseEnter={hover ? () => setHovered(true) : undefined}
      onMouseLeave={hover ? () => setHovered(false) : undefined}
      style={{
        background: "#FFFFFF",
        border: "1px solid #E2E8F0",
        borderRadius: 16,
        padding: "22px 24px",
        marginBottom: 16,
        boxShadow: hovered
          ? "0 12px 40px rgba(10, 25, 47, 0.12)"
          : "0 2px 12px rgba(10, 25, 47, 0.05)",
        transition: "all 0.2s cubic-bezier(0.4, 0, 0.2, 1)",
        transform: hovered ? "translateY(-2px)" : "none",
        animation: "slideUp 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
        ...style,
      }}
    >
      {children}
    </div>
  );
}

/* ── Label ─────────────────────────────────────────────────── */
export function Label({ children }) {
  return (
    <div style={{
      fontSize: 11,
      letterSpacing: "0.06em",
      textTransform: "uppercase",
      color: "#64748B",
      marginBottom: 6,
      fontWeight: 700,
    }}>
      {children}
    </div>
  );
}

/* ── Field ─────────────────────────────────────────────────── */
export function Field({ label, children, error }) {
  return (
    <div style={{ marginBottom: 16 }}>
      {label && <Label>{label}</Label>}
      {children}
      {error && (
        <div style={{
          fontSize: 12, color: "#DC2626", marginTop: 5,
          display: "flex", alignItems: "center", gap: 5,
          fontWeight: 500,
        }}>
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none"
            stroke="#DC2626" strokeWidth="2.5" strokeLinecap="round">
            <circle cx="12" cy="12" r="10"/>
            <line x1="15" y1="9" x2="9" y2="15"/>
            <line x1="9" y1="9" x2="15" y2="15"/>
          </svg>
          {error}
        </div>
      )}
    </div>
  );
}

/* ── SectionHeading ────────────────────────────────────────── */
export function SectionHeading({ children }) {
  return (
    <div style={{
      fontSize: 16,
      fontWeight: 700,
      color: "#0A192F",
      marginBottom: 16,
      paddingBottom: 10,
      borderBottom: "1.5px solid #E2E8F0",
      letterSpacing: "-0.01em",
    }}>
      {children}
    </div>
  );
}

/* ── StatusBadge ───────────────────────────────────────────── */
export function StatusBadge({ status }) {
  const map = {
    CONFIRMED:        { bg: "#F0FDF4", color: "#15803D", label: "Confirmed",        icon: "check" },
    COMPLETED:        { bg: "#F0FDF4", color: "#15803D", label: "Completed",         icon: "check" },
    PENDING:          { bg: "#FFFBEB", color: "#B45309", label: "Pending",           icon: "clock" },
    PENDING_APPROVAL: { bg: "#FFFBEB", color: "#B45309", label: "Pending Approval",  icon: "clock" },
    CANCELLED:        { bg: "#FEF2F2", color: "#B91C1C", label: "Cancelled",         icon: "x" },
    REFUNDED:         { bg: "#EFF6FF", color: "#1D4ED8", label: "Refunded",          icon: "arrow" },
    APPROVED:         { bg: "#F0FDF4", color: "#15803D", label: "Approved",          icon: "check" },
    REJECTED:         { bg: "#FEF2F2", color: "#B91C1C", label: "Rejected",          icon: "x" },
    PAID:             { bg: "#F0FDF4", color: "#15803D", label: "Paid",              icon: "check" },
    UNPAID:           { bg: "#FEF2F2", color: "#B91C1C", label: "Unpaid",            icon: "x" },
  };
  const s = map[status] || { bg: "#F1F5F9", color: "#475569", label: status, icon: null };
  return (
    <span style={{
      fontSize: 11,
      fontWeight: 700,
      padding: "4px 12px",
      borderRadius: 9999,
      background: s.bg,
      color: s.color,
      letterSpacing: "0.03em",
      display: "inline-flex",
      alignItems: "center",
      gap: 5,
      border: `1px solid ${s.color}18`,
    }}>
      {s.icon === "check" && (
        <svg width="11" height="11" viewBox="0 0 24 24" fill="none"
          stroke={s.color} strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
          <polyline points="20 6 9 17 4 12"/>
        </svg>
      )}
      {s.icon === "clock" && (
        <svg width="11" height="11" viewBox="0 0 24 24" fill="none"
          stroke={s.color} strokeWidth="2.5" strokeLinecap="round">
          <circle cx="12" cy="12" r="10"/>
          <polyline points="12 6 12 12 16 14"/>
        </svg>
      )}
      {s.icon === "x" && (
        <svg width="11" height="11" viewBox="0 0 24 24" fill="none"
          stroke={s.color} strokeWidth="3" strokeLinecap="round">
          <line x1="18" y1="6" x2="6" y2="18"/>
          <line x1="6" y1="6" x2="18" y2="18"/>
        </svg>
      )}
      {s.label}
    </span>
  );
}

/* ── LoadingSkeleton ───────────────────────────────────────── */
export function LoadingSkeleton({ lines = 3, style }) {
  return (
    <div style={{ padding: "8px 0", ...style }}>
      {Array.from({ length: lines }).map((_, i) => (
        <div key={i} className="skeleton" style={{
          height: 16,
          marginBottom: 12,
          width: i === lines - 1 ? "60%" : i % 2 === 0 ? "100%" : "85%",
        }} />
      ))}
    </div>
  );
}

/* ── Toast Notification ────────────────────────────────────── */
export function Toast({ message, type = "success", visible, onClose }) {
  useEffect(() => {
    if (visible) {
      const t = setTimeout(onClose, 4000);
      return () => clearTimeout(t);
    }
  }, [visible, onClose]);

  if (!visible) return null;

  const colors = {
    success: { bg: "#F0FDF4", border: "#16A34A", color: "#15803D", icon: "check" },
    error:   { bg: "#FEF2F2", border: "#DC2626", color: "#B91C1C", icon: "x" },
    info:    { bg: "#EFF6FF", border: "#3B82F6", color: "#1D4ED8", icon: "info" },
    warning: { bg: "#FFFBEB", border: "#F59E0B", color: "#B45309", icon: "warn" },
  };
  const c = colors[type] || colors.success;

  return (
    <div style={{
      position: "fixed",
      top: 20,
      right: 20,
      zIndex: 9999,
      background: c.bg,
      border: `1px solid ${c.border}30`,
      borderLeft: `4px solid ${c.border}`,
      borderRadius: 12,
      padding: "14px 20px",
      minWidth: 280,
      maxWidth: 400,
      boxShadow: "0 12px 40px rgba(10, 25, 47, 0.15)",
      animation: "toast-slide-in 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
      display: "flex",
      alignItems: "center",
      gap: 12,
    }}>
      {c.icon === "check" && (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none"
          stroke={c.color} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/>
          <polyline points="22 4 12 14.01 9 11.01"/>
        </svg>
      )}
      {c.icon === "x" && (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none"
          stroke={c.color} strokeWidth="2.5" strokeLinecap="round">
          <circle cx="12" cy="12" r="10"/>
          <line x1="15" y1="9" x2="9" y2="15"/>
          <line x1="9" y1="9" x2="15" y2="15"/>
        </svg>
      )}
      <span style={{ flex: 1, fontSize: 13, fontWeight: 600, color: c.color }}>
        {message}
      </span>
      <button onClick={onClose} style={{
        background: "none", border: "none", cursor: "pointer", padding: 2,
        color: c.color, opacity: 0.6, display: "flex",
      }}>
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none"
          stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
          <line x1="18" y1="6" x2="6" y2="18"/>
          <line x1="6" y1="6" x2="18" y2="18"/>
        </svg>
      </button>
    </div>
  );
}

/* ── EmptyState ────────────────────────────────────────────── */
export function EmptyState({ message = "No data found", icon }) {
  return (
    <div style={{
      textAlign: "center",
      padding: "48px 24px",
      color: "#94A3B8",
    }}>
      <svg width="48" height="48" viewBox="0 0 24 24" fill="none"
        stroke="#CBD5E1" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"
        style={{ margin: "0 auto 16px" }}>
        <path d="M13 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V9z"/>
        <polyline points="13 2 13 9 20 9"/>
      </svg>
      <div style={{ fontSize: 14, fontWeight: 600 }}>{message}</div>
    </div>
  );
}
