/* ===========================================================
   CEMS THEME - Navy Blue & Pure White High-Contrast System
   Modern SaaS Redesign
   =========================================================== */

/* --- Navy Blue Palette --- */
export const navyBlue      = "#0A192F";   // Deep Classic Navy Blue
export const navyBlueDark  = "#0B132B";   // Midnight Navy
export const navyBlueSoft  = "#1C2541";   // Slate Navy Blue
export const navyBlueMid   = "#3A506B";   // Mid Navy

/* --- Pure White Palette --- */
export const pureWhite     = "#FFFFFF";   // Pure Crisp White
export const offWhite      = "#FFFFFF";   // Pure White Background / Canvas
export const offWhiteDim   = "#F8FAFC";   // Light Pure White Surface
export const cream         = "#F1F5F9";   // Ice White Accent

/* --- Royal/Navy Accents --- */
export const royalBlue     = "#1D4ED8";   // Rich Navy Royal Accent
export const royalBlueDark = "#1E40AF";   // Deep Navy Accent

/* --- Emergency --- */
export const emergencyRed  = "#DC2626";   // Vibrant Emergency Red

/* --- Legacy Aliases mapped to Navy Blue & Pure White tokens --- */
export const darkBlue      = navyBlue;
export const darkBlueNavy  = navyBlueDark;
export const darkBlueSoft  = navyBlueSoft;
export const darkBlueMid   = navyBlueMid;

export const maroon        = royalBlue;     // Swapped to Royal Blue
export const maroonDark    = navyBlue;      // Swapped to Navy Blue
export const maroonSoft    = "#3B82F6";     // Light Royal Blue
export const maroonMid     = royalBlueDark;

export const brownDark     = navyBlue;
export const brownMedium   = navyBlueSoft;
export const brownSoft     = navyBlueMid;
export const brownLight    = "#64748B";     // Slate-500
export const brownBorder   = "#E2E8F0";     // Slate-200

export const ink           = navyBlue;
export const inkSoft       = navyBlueDark;
export const parchment     = pureWhite;
export const parchmentDim  = offWhiteDim;
export const brass         = royalBlue;
export const brassDark     = royalBlueDark;
export const sage          = "#16A34A";     // Green-500
export const brick         = "#DC2626";     // Red-500
export const gold          = royalBlue;
export const goldLight     = offWhiteDim;
export const line          = brownBorder;
export const brown         = brownBorder;

/* ===========================================================
   BACKGROUND & CONTAINER STYLES
   =========================================================== */
export const floralBackground = (bg = pureWhite) => {
  return {
    backgroundColor: bg,
    backgroundImage: `none`, // Removed radial gradient for cleaner look
  };
};

export const sidebarFloral = {
  background: `linear-gradient(180deg, ${navyBlue} 0%, ${navyBlueSoft} 100%)`,
  borderRight: "1px solid rgba(255,255,255,0.06)",
  boxShadow: "none",
};

export const mainFloral = {
  background: offWhiteDim, // #F8FAFC
};

export const cardFloral = {
  backgroundColor: pureWhite,
  border: `1px solid ${brownBorder}`,
  boxShadow: "0 4px 16px rgba(10, 25, 47, 0.04)",
  borderRadius: 16,
};

/* ===========================================================
   INPUT STYLES
   =========================================================== */
export const maroonInputStyle = {
  width: "100%",
  boxSizing: "border-box",
  padding: "10px 14px",
  border: `1.5px solid ${brownBorder}`,
  borderRadius: 10,
  fontSize: 14,
  fontFamily: "var(--font-sans)",
  background: pureWhite,
  color: navyBlue,
  outline: "none",
  transition: "all 0.2s ease",
};

export const inputStyle = {
  width: "100%",
  boxSizing: "border-box",
  padding: "10px 14px",
  border: `1.5px solid ${brownBorder}`,
  borderRadius: 10,
  fontSize: 14,
  fontFamily: "var(--font-sans)",
  background: pureWhite,
  color: navyBlue,
  outline: "none",
  transition: "all 0.2s ease",
};

/* ===========================================================
   BUTTON STYLES
   =========================================================== */
export const maroonButtonStyle = (kind = "primary") => ({
  padding: "10px 18px",
  borderRadius: 10,
  fontSize: 14,
  fontWeight: 600,
  letterSpacing: "0.01em",
  cursor: "pointer",
  border: kind === "primary" ? "none" : `1px solid ${brownBorder}`,
  background: kind === "primary"
    ? `linear-gradient(135deg, ${royalBlue}, ${royalBlueDark})`
    : pureWhite,
  color: kind === "primary" ? pureWhite : navyBlue,
  boxShadow: kind === "primary" ? "0 4px 12px rgba(29, 78, 216, 0.2)" : "none",
  transition: "all 0.2s ease",
});

export const buttonStyle = (kind = "primary") => ({
  padding: "10px 18px",
  borderRadius: 10,
  fontSize: 13,
  fontWeight: 600,
  letterSpacing: "0.01em",
  cursor: "pointer",
  border: kind === "primary" ? "none" : `1px solid ${brownBorder}`,
  background: kind === "primary"
    ? `linear-gradient(135deg, ${royalBlue}, ${royalBlueDark})`
    : pureWhite,
  color: kind === "primary" ? pureWhite : navyBlue,
  boxShadow: kind === "primary" ? "0 4px 12px rgba(29, 78, 216, 0.2)" : "none",
  transition: "all 0.2s ease",
});

/* ===========================================================
   UTILITY FUNCTIONS
   =========================================================== */
export function refundPercentByHours(hoursBefore) {
  if (hoursBefore >= 72) return 100;
  if (hoursBefore >= 48) return 50;
  if (hoursBefore >= 24) return 50;
  return 0;
}

export function refundPercent(daysBefore) {
  if (daysBefore >= 14) return 100;
  if (daysBefore >= 7)  return 70;
  return 50;
}

export function hoursUntil(dateStr) {
  if (!dateStr) return 0;
  const diffMs = new Date(dateStr) - new Date();
  const hrs = Math.ceil(diffMs / (1000 * 60 * 60));
  return Math.max(0, hrs);
}

export function daysUntil(dateStr) {
  const diff = (new Date(dateStr) - new Date()) / (1000 * 60 * 60 * 24);
  return Math.max(0, Math.ceil(diff));
}

/* ===========================================================
   DASHBOARD CONFIG
   =========================================================== */
export const roles = [
  { id: "student",   label: "Student",   icon: "" },
  { id: "class_rep", label: "Class Representative", icon: "" },
  { id: "faculty",   label: "Faculty",   icon: "" },
  { id: "principal", label: "Principal", icon: "" },
  { id: "admin",     label: "Admin",     icon: "" },
  { id: "canteen",   label: "Canteen Staff", icon: "" },
  { id: "warden",    label: "Hostel Warden", icon: "" },
];

export const modulesByRole = {
  student:   ["booking", "refund", "rebook", "medical", "complaint", "lostfound"],
  class_rep: ["booking", "refund", "rebook", "medical", "complaint", "lostfound"],
  faculty:   ["booking", "refund", "rebook", "medical", "complaint", "lostfound"],
  principal: ["booking", "refund", "complaint", "rebook", "lostfound"],
  admin:     ["register", "lostfound"],
  canteen:   ["canteen", "lostfound"],
  warden:    ["warden", "lostfound"],
};

export const moduleLabels = {
  register: "Registration & ID Card",
  booking:  "Event Bookings",
  refund:   "Refunds",
  rebook:   "Rebooking",
  medical:  "Medical Rapid Access",
  complaint:"Complaint Box",
  ledger:   "User Registrations & Approvals",
  access:   "Access Control",
  canteen:  "Canteen Orders",
  warden:   "Hostel Warden",
  lostfound:"Lost & Found",
};

export const moduleIcons = {
  register: "",
  booking:  "",
  refund:   "",
  rebook:   "",
  medical:  "",
  complaint:"",
  ledger:   "",
  access:   "",
  canteen:  "",
  warden:   "",
  lostfound:"",
};
