/* ===========================================================
   CEMS THEME - Wine & Dusty Rose System
   Modern SaaS Redesign
   =========================================================== */

/* --- Wine Palette --- */
export const winePrimary   = "#581124";   // Deep Wine (Primary Header / Sidebar / Brand)
export const wineDark      = "#380A15";   // Midnight Wine
export const wineSoft      = "#722F37";   // Classic / Rich Wine
export const wineMid       = "#6E172C";   // Mid Wine
export const wineCrimson   = "#8B1E3F";   // Crimson Wine Accent

/* --- Dusty Rose Palette --- */
export const dustyRoseAccent = "#059669"; // Vibrant Dusty Rose Accent
export const dustyRoseSoft   = "#34D399"; // Soft Dusty Rose
export const dustyRoseBorder = "#A7F3D0"; // Dusty Rose Border
export const dustyRoseBg     = "#F0FDF4"; // Soft Dusty Rose Canvas Background
export const dustyRoseCard   = "#FFFFFF"; // Dusty Rose Card Surface
export const dustyRosePill   = "#D1FAE5"; // Dusty Rose Accent Pill

/* --- Aliases mapped to Wine & Dusty Rose tokens --- */
export const lavender        = dustyRoseAccent;
export const lavenderLight   = dustyRoseSoft;
export const lavenderPale    = dustyRoseSoft;
export const lavenderBorder  = dustyRoseBorder;
export const lavenderBg      = dustyRoseBg;
export const lavenderPill    = dustyRosePill;

export const navyBlue      = winePrimary;
export const navyBlueDark  = wineDark;
export const navyBlueSoft  = wineSoft;
export const navyBlueMid   = wineMid;

/* --- Card & Canvas Palette --- */
export const pureWhite     = dustyRoseCard;   // Dusty Rose Card Surface
export const offWhite      = dustyRoseBg;     // Dusty Rose Canvas Background
export const offWhiteDim   = dustyRoseBg;     // Dusty Rose Canvas
export const cream         = dustyRosePill;   // Dusty Rose Accent Background

/* --- Action / Accent Variables --- */
export const royalBlue     = wineSoft;    // Rich Wine Primary
export const royalBlueDark = winePrimary; // Deep Wine Secondary

/* --- Emergency --- */
export const emergencyRed  = "#DC2626";   // Vibrant Emergency Red

/* --- Legacy Aliases --- */
export const darkBlue      = winePrimary;
export const darkBlueNavy  = wineDark;
export const darkBlueSoft  = wineSoft;
export const darkBlueMid   = wineMid;

export const maroon        = wineSoft;
export const maroonDark    = winePrimary;
export const maroonSoft    = dustyRoseSoft;
export const maroonMid     = wineCrimson;

export const brownDark     = winePrimary;
export const brownMedium   = wineSoft;
export const brownSoft     = wineMid;
export const brownLight    = dustyRoseSoft;
export const brownBorder   = dustyRoseBorder;

export const ink           = "#581124";   // Deep Wine Text
export const inkSoft       = "#065F46";   // Muted Dusty Rose Gray Text
export const parchment     = pureWhite;
export const parchmentDim  = offWhiteDim;
export const brass         = lavender;
export const brassDark     = wineCrimson;
export const sage          = "#16A34A";     // Green-500
export const brick         = "#DC2626";     // Red-500
export const gold          = lavender;
export const goldLight     = offWhiteDim;
export const line          = brownBorder;
export const brown         = brownBorder;

/* ===========================================================
   BACKGROUND & CONTAINER STYLES
   =========================================================== */
export const floralBackground = (bg = pureWhite) => {
  return {
    backgroundColor: bg, color: "#581124",
    backgroundImage: `none`,
  };
};

export const sidebarFloral = {
  background: `linear-gradient(180deg, ${winePrimary} 0%, ${wineSoft} 100%)`,
  borderRight: "1px solid rgba(255,255,255,0.06)",
  boxShadow: "none",
};

export const mainFloral = {
  background: offWhiteDim, // #F0FDF4
};

export const cardFloral = {
  backgroundColor: pureWhite,
  border: `1px solid ${brownBorder}`,
  boxShadow: "0 4px 16px rgba(88, 17, 36, 0.06)",
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
  background: "#FFFFFF",
  color: "#581124",
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
  background: "#FFFFFF",
  color: "#581124",
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
    ? `linear-gradient(135deg, ${wineSoft}, ${winePrimary})`
    : pureWhite,
  color: kind === "primary" ? pureWhite : winePrimary,
  boxShadow: kind === "primary" ? "0 4px 12px rgba(88, 17, 36, 0.35)" : "none",
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
    ? `linear-gradient(135deg, ${wineSoft}, ${winePrimary})`
    : pureWhite,
  color: kind === "primary" ? pureWhite : winePrimary,
  boxShadow: kind === "primary" ? "0 4px 12px rgba(88, 17, 36, 0.35)" : "none",
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
  student:   ["booking", "refund", "rebook", "medical", "complaint", "lostfound", "profile"],
  class_rep: ["booking", "refund", "rebook", "medical", "complaint", "lostfound", "profile"],
  faculty:   ["booking", "refund", "rebook", "medical", "complaint", "lostfound", "profile"],
  principal: ["booking", "refund", "complaint", "rebook", "lostfound", "profile"],
  admin:     ["register", "booking", "access", "complaint", "lostfound", "profile"],
  canteen:   ["canteen", "lostfound", "profile"],
  warden:    ["warden", "lostfound", "profile"],
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
  profile:  "My Profile",
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
  profile:  "",
};

