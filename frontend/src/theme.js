/* ===========================================================
   CEMS THEME - Rich Warm Brown Dashboard & Cute Floral Theme
   =========================================================== */
export const maroon      = "#4E0F1C";   // rich plum/burgundy (primary)
export const maroonDark  = "#2D070E";   // deep forest berry headings
export const maroonSoft  = "#80283C";   // muted rose pink
export const maroonMid   = "#3D0B16";   // warm wine red

export const brownDark   = "#2B1B17";   // deep chocolate brown (sidebar / dark sections)
export const brownMedium = "#4A3228";   // rich mocha brown
export const brownSoft   = "#6E4D3E";   // soft warm brown
export const brownLight  = "#8C6A58";   // light warm brown
export const brownBorder = "#4A3228";   // border color

export const offWhite    = "#FAF4ED";   // rich warm ivory cream
export const offWhiteDim = "#F3E7DA";   // soft rose-tinted off-white cream
export const cream       = "#F7EACD";   // vintage ivory accent
export const gold        = "#D4AF37";   // vintage gold / active icons
export const goldLight   = "#F7EACD";   // champagne blossom gold
export const emergencyRed= "#E03C3C";   // vibrant cherry red

/* --- legacy aliases kept for old imports ------------------- */
export const ink      = brownDark;
export const inkSoft  = maroon;
export const parchment    = offWhite;
export const parchmentDim = offWhiteDim;
export const brass    = gold;
export const brassDark= "#A37B2E";
export const sage     = "#4E7A5A";      // soft leaf green
export const brick    = "#B34233";
export const line     = brownBorder;    // rich brown border line
export const brown    = brownBorder;

/* ===========================================================
   CUTE MICRO SMALL FLORAL PRINT BACKGROUNDS
   =========================================================== */
export const floralBackground = (bg = offWhite, stroke = brownMedium, opacity = 0.09) => {
  // Cute 24px micro floral print pattern tile
  const tinyFloralSvg = `
<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24">
  <g fill="none" stroke="${stroke}" stroke-width="0.85" stroke-linecap="round" opacity="${opacity}">
    <!-- Cute 4-petal micro blossom -->
    <circle cx="12" cy="10" r="1.2" fill="${stroke}" fill-opacity="0.35" />
    <circle cx="14" cy="12" r="1.2" fill="${stroke}" fill-opacity="0.35" />
    <circle cx="12" cy="14" r="1.2" fill="${stroke}" fill-opacity="0.35" />
    <circle cx="10" cy="12" r="1.2" fill="${stroke}" fill-opacity="0.35" />
    <circle cx="12" cy="12" r="0.8" fill="${stroke}" />
    <!-- Micro Dots -->
    <circle cx="4" cy="4" r="0.6" fill="${stroke}" fill-opacity="0.4" />
    <circle cx="20" cy="20" r="0.6" fill="${stroke}" fill-opacity="0.4" />
  </g>
</svg>
`.trim();
  const base64Svg = btoa(tinyFloralSvg);
  return {
    backgroundColor: bg,
    backgroundImage: `url("data:image/svg+xml;base64,${base64Svg}"), radial-gradient(ellipse at 15% 15%, #FAF4ED 0%, #F3E7DA 50%, #E6D2C0 100%)`,
    backgroundSize: "24px 24px, auto",
    backgroundRepeat: "repeat, no-repeat",
  };
};

/* sidebar - rich chocolate brown gradient with gold line accent & micro floral overlay */
export const sidebarFloral = {
  ...floralBackground(brownDark, goldLight, 0.12),
  backgroundImage: `radial-gradient(ellipse at top left, #3A2520 0%, #2B1B17 60%, #1A0E0C 100%)`,
  borderRight: `3px solid ${gold}`,
  boxShadow: "4px 0 24px rgba(0,0,0,0.25)",
};

/* main content area - warm luxury brown-cream background with micro floral print */
export const mainFloral = {
  ...floralBackground(offWhite, brownMedium, 0.09),
};

/* card background - modern frosted glass container with rich brown border */
export const cardFloral = {
  backgroundColor: "rgba(255, 250, 245, 0.94)",
  backdropFilter: "blur(16px)",
  WebkitBackdropFilter: "blur(16px)",
  border: `2.5px solid ${brownBorder}`,
  boxShadow: "0 10px 30px rgba(43, 27, 23, 0.12), 0 2px 6px rgba(0,0,0,0.08)",
  borderRadius: 16,
};

/* ===========================================================
   INPUT STYLES WITH BROWN BORDER
   =========================================================== */
export const maroonInputStyle = {
  width: "100%",
  boxSizing: "border-box",
  padding: "11px 13px",
  border: `2px solid ${brownBorder}`,
  borderRadius: 8,
  fontSize: 14,
  fontFamily: "inherit",
  background: "rgba(255, 252, 248, 0.95)",
  color: brownDark,
  outline: "none",
};

export const inputStyle = {
  width: "100%",
  boxSizing: "border-box",
  padding: "10px 12px",
  border: `2px solid ${brownBorder}`,
  borderRadius: 8,
  fontSize: 14,
  fontFamily: "inherit",
  background: "rgba(255, 252, 248, 0.95)",
  color: brownDark,
  outline: "none",
};

/* ===========================================================
   BUTTON STYLES WITH BROWN BORDER
   =========================================================== */
export const maroonButtonStyle = (kind = "primary") => ({
  padding: "11px 20px",
  borderRadius: 8,
  fontSize: 14,
  fontWeight: 700,
  letterSpacing: "0.02em",
  cursor: "pointer",
  border: `2px solid ${brownBorder}`,
  background: kind === "primary"
    ? `linear-gradient(135deg, ${maroon}, ${maroonSoft})`
    : "transparent",
  color: kind === "primary" ? offWhite : maroon,
  boxShadow: kind === "primary" ? `0 3px 12px ${maroon}44` : "none",
});

export const buttonStyle = (kind = "primary") => ({
  padding: "10px 18px",
  borderRadius: 8,
  fontSize: 13,
  fontWeight: 700,
  letterSpacing: "0.02em",
  cursor: "pointer",
  border: `2px solid ${brownBorder}`,
  background: kind === "primary"
    ? `linear-gradient(135deg, ${maroon}, ${maroonSoft})`
    : "rgba(250, 244, 237, 0.85)",
  color: kind === "primary" ? offWhite : brownDark,
  boxShadow: kind === "primary" ? `0 3px 10px ${maroon}44` : "none",
});

/* ===========================================================
   UTILITY FUNCTIONS
   =========================================================== */
export function refundPercentByHours(hoursBefore) {
  if (hoursBefore >= 72) return 100;
  if (hoursBefore >= 48) return 50;
  if (hoursBefore >= 24) return 50;
  return 0; // < 24 hrs = 0%
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
  { id: "student",   label: "Student",   icon: "🎓" },
  { id: "class_rep", label: "Class Representative", icon: "⭐" },
  { id: "faculty",   label: "Faculty",   icon: "👨‍🏫" },
  { id: "principal", label: "Principal", icon: "🏛️" },
  { id: "admin",     label: "Admin",     icon: "⚙️" },
  { id: "canteen",   label: "Canteen Staff", icon: "🍱" },
  { id: "warden",    label: "Hostel Warden", icon: "🏨" },
];

export const modulesByRole = {
  student:   ["booking", "refund", "rebook", "medical", "complaint"],
  class_rep: ["booking", "refund", "rebook", "medical", "complaint"],
  faculty:   ["booking", "refund", "rebook", "medical", "complaint"],
  principal: ["booking", "refund", "complaint", "rebook"],
  admin:     ["register"],
  canteen:   ["canteen"],
  warden:    ["warden"],
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
};

export const moduleIcons = {
  register: "📋",
  booking:  "📅",
  refund:   "💸",
  rebook:   "🔄",
  medical:  "🏥",
  complaint:"📣",
  ledger:   "👥",
  access:   "🔐",
  canteen:  "🍱",
  warden:   "🏨",
};
