/* ===========================================================
   CEMS THEME - Purple & Lavender System
   Modern SaaS Redesign
   =========================================================== */

/* --- Purple Palette (Mapped to legacy navyBlue variables) --- */
export const navyBlue      = "#4C1D95";   // Deep Violet (Purple 900)
export const navyBlueDark  = "#2E1065";   // Midnight Purple (Purple 950)
export const navyBlueSoft  = "#6D28D9";   // Soft Deep Purple (Purple 700)
export const navyBlueMid   = "#5B21B6";   // Mid Purple (Purple 800)

/* --- Pure White Palette --- */
export const pureWhite     = "#FFFFFF";   // Pure Crisp White
export const offWhite      = "#FFFFFF";   // Pure White Background / Canvas
export const offWhiteDim   = "#F5F3FF";   // Light Lavender Tint (Purple 50)
export const cream         = "#EDE9FE";   // Lavender Accent (Purple 100)

/* --- Lavender/Purple Accents (Mapped to legacy royalBlue variables) --- */
export const royalBlue     = "#8B5CF6";   // Lavender / Vibrant Purple (Purple 500)
export const royalBlueDark = "#7C3AED";   // Deep Lavender (Purple 600)

/* --- Emergency --- */
export const emergencyRed  = "#DC2626";   // Vibrant Emergency Red

/* --- Legacy Aliases mapped to Navy Blue & Pure White tokens --- */
export const darkBlue      = navyBlue;
export const darkBlueNavy  = navyBlueDark;
export const darkBlueSoft  = navyBlueSoft;
export const darkBlueMid   = navyBlueMid;

export const maroon        = royalBlue;     // Swapped to Purple
export const maroonDark    = navyBlue;      // Swapped to Deep Purple
export const maroonSoft    = "#A78BFA";     // Light Lavender (Purple 400)
export const maroonMid     = royalBlueDark;

export const brownDark     = navyBlue;
export const brownMedium   = navyBlueSoft;
export const brownSoft     = navyBlueMid;
export const brownLight    = "#A78BFA";     // Lavender
export const brownBorder   = "#DDD6FE";     // Purple 200

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
