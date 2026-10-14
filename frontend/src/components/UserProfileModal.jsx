import { useState, useEffect } from "react";
import { maroon, maroonDark, maroonSoft, winePrimary, wineSoft, dustyRoseAccent } from "../theme";
import { resolveMediaUrl } from "../apiConfig";

function absUrl(src) {
  return resolveMediaUrl(src);
}

const ROLE_OPTIONS = [
  { value: "STUDENT", label: "Student" },
  { value: "CLASS_REP", label: "Class Representative" },
  { value: "FACULTY", label: "Faculty" },
  { value: "PRINCIPAL", label: "Principal" },
  { value: "ADMIN", label: "Admin" },
  { value: "CANTEEN_STAFF", label: "Canteen Staff" },
  { value: "WARDEN", label: "Hostel Warden" },
  { value: "MEDICAL_STAFF", label: "Medical Staff" },
  { value: "EXTERNAL_PARTICIPANT", label: "External Participant" },
];

function RoleBadge({ role }) {
  const map = {
    STUDENT: { bg: "#E3F2FD", color: "#1565C0", label: "Student" },
    CLASS_REP: { bg: "#ECFDF5", color: "#065F46", label: "Class Rep" },
    FACULTY: { bg: "#E8F5E9", color: "#2E7D32", label: "Faculty" },
    EXTERNAL_PARTICIPANT: { bg: "#FFF3E0", color: "#E65100", label: "External" },
    PRINCIPAL: { bg: "#F3E5F5", color: "#6A1B9A", label: "Principal" },
    ADMIN: { bg: "#FCE4EC", color: "#880E4F", label: "Admin" },
    CANTEEN_STAFF: { bg: "#F1F8E9", color: "#558B2F", label: "Canteen" },
    WARDEN: { bg: "#E0F7FA", color: "#006064", label: "Warden" },
    MEDICAL_STAFF: { bg: "#FFE4E6", color: "#9F1239", label: "Medical" },
  };
  const s = map[role] || { bg: "#F5F5F5", color: "#424242", label: role || "User" };
  return (
    <span
      style={{
        fontSize: 11,
        fontWeight: 700,
        padding: "3px 10px",
        borderRadius: 20,
        background: s.bg,
        color: s.color,
        letterSpacing: "0.04em",
      }}
    >
      {s.label}
    </span>
  );
}

function formatDate(val) {
  if (!val) return "—";
  try {
    const d = new Date(val);
    if (isNaN(d.getTime())) return String(val);
    return d.toLocaleString("en-IN", {
      year: "numeric",
      month: "short",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return String(val);
  }
}

export default function UserProfileModal({
  user,
  isOpen,
  onClose,
  onUserUpdated,
  canEdit = true,
}) {
  const [mode, setMode] = useState("view"); // 'view' | 'edit'
  const [formData, setFormData] = useState({});
  const [newImageFile, setNewImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [successMsg, setSuccessMsg] = useState("");
  const [lightboxImg, setLightboxImg] = useState(null);

  // Sync form when user changes or modal opens
  useEffect(() => {
    if (user) {
      setFormData({
        first_name: user.first_name || "",
        last_name: user.last_name || "",
        email: user.email || "",
        phone_number: user.phone_number || "",
        department: user.department || "",
        role: user.role || "STUDENT",
        is_validated: user.is_validated ?? true,
        is_active: user.is_active ?? true,
        id_year: user.college_id?.id_year || user.college_id?.id_number || "",
        emergency_contact_number: user.emergency_contact_number || "",
        emergency_contact_name: user.emergency_contact_name || "",
        emergency_contact_relation: user.emergency_contact_relation || "Parent",
      });
      setNewImageFile(null);
      setImagePreview(null);
      setErrorMsg("");
      setSuccessMsg("");
      setMode("view");
    }
  }, [user, isOpen]);

  // Esc key listener
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === "Escape" && isOpen && !loading) {
        onClose();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, loading, onClose]);

  if (!isOpen || !user) return null;

  const profileSrc = newImageFile
    ? imagePreview
    : absUrl(user.profile_image);

  const collegeIdCardSrc = absUrl(user.college_id?.id_card_image);

  const avatarLetter = (
    user.first_name?.[0] ||
    user.username?.[0] ||
    "U"
  ).toUpperCase();

  const handleImageChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate type
    if (!file.type.startsWith("image/")) {
      setErrorMsg("Please select a valid image file (JPG, PNG, WEBP).");
      return;
    }
    // Validate size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      setErrorMsg("Image file size must be less than 5MB.");
      return;
    }

    setErrorMsg("");
    setNewImageFile(file);
    const reader = new FileReader();
    reader.onloadend = () => setImagePreview(reader.result);
    reader.readAsDataURL(file);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setErrorMsg("");
    setSuccessMsg("");

    // Client-side validations
    if (!formData.first_name.trim()) {
      setErrorMsg("First name is required.");
      return;
    }
    if (!formData.last_name.trim()) {
      setErrorMsg("Last name is required.");
      return;
    }
    if (!formData.email.trim()) {
      setErrorMsg("Email address is required.");
      return;
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.email.trim())) {
      setErrorMsg("Please enter a valid email address.");
      return;
    }
    if (
      formData.phone_number &&
      (!/^\d+$/.test(formData.phone_number) || formData.phone_number.length !== 10)
    ) {
      setErrorMsg("Phone number must be exactly 10 digits.");
      return;
    }

    setLoading(true);
    const token = localStorage.getItem("cems_access") || "";

    try {
      let res;
      if (newImageFile) {
        // Multipart upload
        const data = new FormData();
        data.append("first_name", formData.first_name.trim());
        data.append("last_name", formData.last_name.trim());
        data.append("email", formData.email.trim());
        data.append("phone_number", formData.phone_number.trim());
        data.append("department", formData.department.trim());
        data.append("role", formData.role);
        data.append("is_validated", formData.is_validated);
        data.append("is_active", formData.is_active);
        if (formData.id_year !== undefined) {
          data.append("id_year", formData.id_year.trim());
        }
        data.append("emergency_contact_number", (formData.emergency_contact_number || "").trim());
        data.append("emergency_contact_name", (formData.emergency_contact_name || "").trim());
        data.append("emergency_contact_relation", (formData.emergency_contact_relation || "Parent").trim());
        data.append("profile_image", newImageFile);

        res = await fetch(`/api/auth/users/${user.id}/`, {
          method: "PATCH",
          headers: {
            Authorization: `Bearer ${token}`,
          },
          body: data,
        });
      } else {
        // JSON payload
        res = await fetch(`/api/auth/users/${user.id}/`, {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            first_name: formData.first_name.trim(),
            last_name: formData.last_name.trim(),
            email: formData.email.trim(),
            phone_number: formData.phone_number.trim(),
            department: formData.department.trim(),
            role: formData.role,
            is_validated: formData.is_validated,
            is_active: formData.is_active,
            id_year: (formData.id_year || "").trim(),
            emergency_contact_number: (formData.emergency_contact_number || "").trim(),
            emergency_contact_name: (formData.emergency_contact_name || "").trim(),
            emergency_contact_relation: (formData.emergency_contact_relation || "Parent").trim(),
          }),
        });
      }

      const resData = await res.json();
      if (!res.ok) {
        const detail =
          resData.detail ||
          Object.entries(resData)
            .map(([k, v]) => `${k}: ${Array.isArray(v) ? v.join(" ") : v}`)
            .join(" ") ||
          "Failed to update profile.";
        setErrorMsg(detail);
        setLoading(false);
        return;
      }

      setSuccessMsg("Profile updated successfully!");
      if (onUserUpdated) {
        onUserUpdated(resData);
      }
      setTimeout(() => {
        setMode("view");
        setSuccessMsg("");
      }, 1000);
    } catch {
      setErrorMsg("Network error. Please check backend connection.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      {/* Lightbox for enlarge images */}
      {lightboxImg && (
        <div
          onClick={() => setLightboxImg(null)}
          style={{
            position: "fixed",
            inset: 0,
            zIndex: 3000,
            background: "rgba(10,4,6,0.9)",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            padding: 20,
            backdropFilter: "blur(6px)",
          }}
        >
          <img
            src={lightboxImg.src}
            alt={lightboxImg.title}
            onClick={(e) => e.stopPropagation()}
            style={{
              maxWidth: "min(90vw, 720px)",
              maxHeight: "80vh",
              objectFit: "contain",
              borderRadius: 12,
              border: `2px solid ${dustyRoseAccent}`,
              boxShadow: "0 20px 60px rgba(0,0,0,0.6)",
            }}
          />
          <div style={{ color: "#fff", marginTop: 14, fontWeight: 700, fontSize: 14 }}>
            {lightboxImg.title}
          </div>
          <button
            onClick={() => setLightboxImg(null)}
            style={{
              position: "fixed",
              top: 20,
              right: 24,
              background: "rgba(255,255,255,0.2)",
              border: "none",
              color: "#fff",
              fontSize: 24,
              width: 40,
              height: 40,
              borderRadius: "50%",
              cursor: "pointer",
            }}
          >
            ×
          </button>
        </div>
      )}

      {/* Main Overlay Backdrop */}
      <div
        onClick={loading ? undefined : onClose}
        style={{
          position: "fixed",
          inset: 0,
          zIndex: 2000,
          background: "rgba(15, 6, 10, 0.75)",
          backdropFilter: "blur(4px)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          padding: 16,
          animation: "fadeIn 0.2s ease",
        }}
      >
        {/* Modal Container */}
        <div
          onClick={(e) => e.stopPropagation()}
          style={{
            background: "#FFFFFF",
            width: "100%",
            maxWidth: 640,
            maxHeight: "90vh",
            borderRadius: 20,
            boxShadow: "0 20px 50px rgba(5, 150, 105, 0.15)",
            overflowY: "auto",
            display: "flex",
            flexDirection: "column",
            border: "1.5px solid #A7F3D0",
            animation: "slideUp 0.25s cubic-bezier(0.4, 0, 0.2, 1)",
          }}
        >
          {/* Header */}
          <div
            style={{
              background: "linear-gradient(135deg, #059669 0%, #047857 100%)",
              padding: "20px 24px",
              color: "#FFFFFF",
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              borderBottom: "1px solid rgba(255,255,255,0.15)",
            }}
          >
            <div>
              <div
                style={{
                  fontSize: 11,
                  letterSpacing: "0.1em",
                  textTransform: "uppercase",
                  color: "rgba(255,255,255,0.65)",
                  fontWeight: 700,
                }}
              >
                CEMS User Management
              </div>
              <h3 style={{ margin: "2px 0 0", fontSize: 20, fontWeight: 800 }}>
                {mode === "edit" ? "Edit User Profile" : "User Profile View"}
              </h3>
            </div>

            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              {canEdit && mode === "view" && (
                <button
                  onClick={() => {
                    setMode("edit");
                    setErrorMsg("");
                    setSuccessMsg("");
                  }}
                  style={{
                    background: "rgba(255,255,255,0.15)",
                    border: "1px solid rgba(255,255,255,0.3)",
                    color: "#FFFFFF",
                    padding: "6px 14px",
                    borderRadius: 8,
                    fontSize: 12,
                    fontWeight: 700,
                    cursor: "pointer",
                    display: "flex",
                    alignItems: "center",
                    gap: 6,
                    transition: "all 0.2s",
                  }}
                >
                  <span>✏️ Edit Profile</span>
                </button>
              )}

              {mode === "edit" && (
                <button
                  onClick={() => {
                    setMode("view");
                    setErrorMsg("");
                  }}
                  disabled={loading}
                  style={{
                    background: "rgba(255,255,255,0.15)",
                    border: "1px solid rgba(255,255,255,0.3)",
                    color: "#FFFFFF",
                    padding: "6px 14px",
                    borderRadius: 8,
                    fontSize: 12,
                    fontWeight: 700,
                    cursor: "pointer",
                  }}
                >
                  ← Back to View
                </button>
              )}

              <button
                onClick={onClose}
                disabled={loading}
                style={{
                  background: "transparent",
                  border: "none",
                  color: "#FFFFFF",
                  fontSize: 22,
                  cursor: "pointer",
                  lineHeight: 1,
                  padding: 4,
                  opacity: 0.8,
                }}
              >
                ✕
              </button>
            </div>
          </div>

          {/* Messages */}
          {errorMsg && (
            <div
              style={{
                background: "#FEF2F2",
                borderBottom: "1px solid #FECDD3",
                color: "#991B1B",
                padding: "12px 24px",
                fontSize: 13,
                fontWeight: 600,
              }}
            >
              ⚠️ {errorMsg}
            </div>
          )}

          {successMsg && (
            <div
              style={{
                background: "#ECFDF5",
                borderBottom: "1px solid #A7F3D0",
                color: "#065F46",
                padding: "12px 24px",
                fontSize: 13,
                fontWeight: 700,
              }}
            >
              ✅ {successMsg}
            </div>
          )}

          {/* Modal Body */}
          <div style={{ padding: 24, flex: 1 }}>
            {/* ═══════════════════════════════════════════════════════════
                MODE 1: VIEW PROFILE
               ═══════════════════════════════════════════════════════════ */}
            {mode === "view" && (
              <div>
                {/* Hero Header Card */}
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 20,
                    padding: "18px 20px",
                    background: "#F0FDF4",
                    borderRadius: 16,
                    border: "1px solid #A7F3D0",
                    marginBottom: 24,
                    flexWrap: "wrap",
                  }}
                >
                  {/* Photo */}
                  <div style={{ position: "relative", flexShrink: 0 }}>
                    {profileSrc ? (
                      <img
                        src={profileSrc}
                        alt={user.username}
                        onClick={() =>
                          setLightboxImg({ src: profileSrc, title: `${user.first_name} ${user.last_name}` })
                        }
                        style={{
                          width: 72,
                          height: 72,
                          borderRadius: "50%",
                          objectFit: "cover",
                          border: `3px solid ${wineSoft}`,
                          boxShadow: "0 4px 12px rgba(88,17,36,0.15)",
                          cursor: "pointer",
                        }}
                      />
                    ) : (
                      <div
                        style={{
                          width: 72,
                          height: 72,
                          borderRadius: "50%",
                          background: `linear-gradient(135deg, ${winePrimary}, ${wineSoft})`,
                          color: "#FFF",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          fontSize: 28,
                          fontWeight: 800,
                          border: `3px solid ${wineSoft}`,
                          boxShadow: "0 4px 12px rgba(88,17,36,0.15)",
                        }}
                      >
                        {avatarLetter}
                      </div>
                    )}
                  </div>

                  {/* Name & Badges */}
                  <div style={{ flex: 1, minWidth: 200 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
                      <h4 style={{ margin: 0, fontSize: 18, fontWeight: 800, color: maroonDark }}>
                        {user.first_name} {user.last_name}
                      </h4>
                      <RoleBadge role={user.role} />
                    </div>

                    <div style={{ fontSize: 13, color: "#065F46", fontWeight: 600, marginTop: 3 }}>
                      @{user.username}
                    </div>

                    <div style={{ display: "flex", gap: 8, marginTop: 8, flexWrap: "wrap" }}>
                      <span
                        style={{
                          fontSize: 11,
                          fontWeight: 700,
                          padding: "2px 9px",
                          borderRadius: 12,
                          background: user.is_validated ? "#D1FAE5" : "#FEF3C7",
                          color: user.is_validated ? "#047857" : "#B45309",
                        }}
                      >
                        {user.is_validated ? "● Validated Profile" : "⏳ Pending Validation"}
                      </span>

                      <span
                        style={{
                          fontSize: 11,
                          fontWeight: 700,
                          padding: "2px 9px",
                          borderRadius: 12,
                          background: user.is_active ? "#ECFDF5" : "#FEE2E2",
                          color: user.is_active ? "#15803D" : "#B91C1C",
                        }}
                      >
                        {user.is_active ? "Active Account" : "Inactive Account"}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Section 1: Personal Info */}
                <div style={{ marginBottom: 20 }}>
                  <div
                    style={{
                      fontSize: 11,
                      fontWeight: 800,
                      letterSpacing: "0.08em",
                      color: maroonDark,
                      textTransform: "uppercase",
                      borderBottom: "1.5px solid #A7F3D0",
                      paddingBottom: 6,
                      marginBottom: 14,
                    }}
                  >
                    PERSONAL INFORMATION
                  </div>

                  <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: 14 }}>
                    <div>
                      <div style={{ fontSize: 11, color: "#065F46", fontWeight: 700 }}>Username</div>
                      <div style={{ fontSize: 14, fontWeight: 600, color: maroonDark }}>{user.username}</div>
                    </div>

                    <div>
                      <div style={{ fontSize: 11, color: "#065F46", fontWeight: 700 }}>Full Name</div>
                      <div style={{ fontSize: 14, fontWeight: 600, color: maroonDark }}>
                        {user.first_name} {user.last_name}
                      </div>
                    </div>

                    <div>
                      <div style={{ fontSize: 11, color: "#065F46", fontWeight: 700 }}>Email Address</div>
                      <div style={{ fontSize: 14, fontWeight: 600, color: maroonDark }}>{user.email || "—"}</div>
                    </div>

                    <div>
                      <div style={{ fontSize: 11, color: "#065F46", fontWeight: 700 }}>Phone Number</div>
                      <div style={{ fontSize: 14, fontWeight: 600, color: maroonDark }}>{user.phone_number || "—"}</div>
                    </div>

                    <div>
                      <div style={{ fontSize: 11, color: "#065F46", fontWeight: 700 }}>Department</div>
                      <div style={{ fontSize: 14, fontWeight: 600, color: maroonDark }}>{user.department || "—"}</div>
                    </div>
                  </div>
                </div>

                {/* Section: Emergency Distress Contact */}
                <div style={{ marginBottom: 20 }}>
                  <div
                    style={{
                      fontSize: 11,
                      fontWeight: 800,
                      letterSpacing: "0.08em",
                      color: "#991B1B",
                      textTransform: "uppercase",
                      borderBottom: "1.5px solid #FCA5A5",
                      paddingBottom: 6,
                      marginBottom: 14,
                      display: "flex",
                      alignItems: "center",
                      gap: 6,
                    }}
                  >
                    <span>🚨</span> EMERGENCY DISTRESS CONTACT (AUTO-SOS / SIREN)
                  </div>

                  <div
                    style={{
                      display: "grid",
                      gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
                      gap: 14,
                      background: "#FEF2F2",
                      padding: "14px 18px",
                      borderRadius: 12,
                      border: "1px solid #FECACA",
                    }}
                  >
                    <div>
                      <div style={{ fontSize: 11, color: "#991B1B", fontWeight: 700 }}>Contact Phone Number</div>
                      <div style={{ fontSize: 14, fontWeight: 700, color: "#7F1D1D" }}>
                        {user.emergency_contact_number || "— Not configured —"}
                      </div>
                    </div>

                    <div>
                      <div style={{ fontSize: 11, color: "#991B1B", fontWeight: 700 }}>Contact Person Name</div>
                      <div style={{ fontSize: 14, fontWeight: 600, color: "#7F1D1D" }}>
                        {user.emergency_contact_name || "—"}
                      </div>
                    </div>

                    <div>
                      <div style={{ fontSize: 11, color: "#991B1B", fontWeight: 700 }}>Relationship</div>
                      <div style={{ fontSize: 14, fontWeight: 600, color: "#7F1D1D" }}>
                        {user.emergency_contact_relation || "—"}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Section 2: Account Information */}
                <div style={{ marginBottom: 20 }}>
                  <div
                    style={{
                      fontSize: 11,
                      fontWeight: 800,
                      letterSpacing: "0.08em",
                      color: maroonDark,
                      textTransform: "uppercase",
                      borderBottom: "1.5px solid #A7F3D0",
                      paddingBottom: 6,
                      marginBottom: 14,
                    }}
                  >
                    ACCOUNT & CLEARANCE DETAILS
                  </div>

                  <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: 14 }}>
                    <div>
                      <div style={{ fontSize: 11, color: "#065F46", fontWeight: 700 }}>System Role</div>
                      <div style={{ fontSize: 14, fontWeight: 600, color: maroonDark }}>
                        {ROLE_OPTIONS.find((r) => r.value === user.role)?.label || user.role}
                      </div>
                    </div>

                    <div>
                      <div style={{ fontSize: 11, color: "#065F46", fontWeight: 700 }}>Admin Validation Status</div>
                      <div style={{ fontSize: 14, fontWeight: 600, color: user.is_validated ? "#047857" : "#B45309" }}>
                        {user.is_validated ? "Cleared & Validated" : "Awaiting Clearance"}
                      </div>
                    </div>

                    <div>
                      <div style={{ fontSize: 11, color: "#065F46", fontWeight: 700 }}>Account Status</div>
                      <div style={{ fontSize: 14, fontWeight: 600, color: user.is_active ? "#15803D" : "#B91C1C" }}>
                        {user.is_active ? "Active" : "Disabled / Inactive"}
                      </div>
                    </div>

                    <div>
                      <div style={{ fontSize: 11, color: "#065F46", fontWeight: 700 }}>Registered On</div>
                      <div style={{ fontSize: 14, fontWeight: 600, color: maroonDark }}>{formatDate(user.created_at)}</div>
                    </div>
                  </div>
                </div>

                {/* Section 3: College ID Information */}
                <div>
                  <div
                    style={{
                      fontSize: 11,
                      fontWeight: 800,
                      letterSpacing: "0.08em",
                      color: maroonDark,
                      textTransform: "uppercase",
                      borderBottom: "1.5px solid #A7F3D0",
                      paddingBottom: 6,
                      marginBottom: 14,
                    }}
                  >
                    COLLEGE ID CARD INFORMATION
                  </div>

                  {user.college_id ? (
                    <div
                      style={{
                        display: "flex",
                        gap: 20,
                        alignItems: "center",
                        flexWrap: "wrap",
                        background: "#F8FAFC",
                        padding: "16px 20px",
                        borderRadius: 12,
                        border: "1px solid #E2E8F0",
                      }}
                    >
                      <div style={{ flex: 1, minWidth: 200 }}>
                        <div style={{ marginBottom: 6 }}>
                          <span style={{ fontSize: 11, color: "#64748B", fontWeight: 700 }}>ID Year: </span>
                          <strong style={{ fontSize: 14, color: maroonDark, fontFamily: "monospace" }}>
                            {user.college_id.id_year || user.college_id.id_number || "—"}
                          </strong>
                        </div>

                        <div style={{ marginBottom: 6 }}>
                          <span style={{ fontSize: 11, color: "#64748B", fontWeight: 700 }}>Card Status: </span>
                          <span
                            style={{
                              fontSize: 12,
                              fontWeight: 700,
                              color: user.college_id.is_active ? "#047857" : "#B91C1C",
                            }}
                          >
                            {user.college_id.is_active ? "Active" : "Inactive"}
                          </span>
                        </div>

                        <div style={{ fontSize: 12, color: "#475569" }}>
                          Issued: {formatDate(user.college_id.issued_at)}
                        </div>
                        {user.college_id.expires_at && (
                          <div style={{ fontSize: 12, color: "#475569" }}>
                            Expires: {formatDate(user.college_id.expires_at)}
                          </div>
                        )}
                      </div>

                      {collegeIdCardSrc && (
                        <div style={{ textAlign: "center" }}>
                          <img
                            src={collegeIdCardSrc}
                            alt="College ID Card"
                            onClick={() =>
                              setLightboxImg({ src: collegeIdCardSrc, title: `ID Card: ${user.college_id?.id_number}` })
                            }
                            style={{
                              width: 110,
                              height: 70,
                              objectFit: "cover",
                              borderRadius: 8,
                              border: "1.5px solid #CBD5E1",
                              cursor: "pointer",
                              boxShadow: "0 2px 8px rgba(0,0,0,0.08)",
                            }}
                          />
                          <div style={{ fontSize: 10, color: "#64748B", marginTop: 4 }}>Click to view ID card</div>
                        </div>
                      )}
                    </div>
                  ) : (
                    <div style={{ fontSize: 13, color: "#64748B", fontStyle: "italic" }}>
                      No College ID record found for this user.
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* ═══════════════════════════════════════════════════════════
                MODE 2: EDIT PROFILE FORM
               ═══════════════════════════════════════════════════════════ */}
            {mode === "edit" && (
              <form onSubmit={handleSave}>
                {/* Image Upload section */}
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 16,
                    padding: 16,
                    background: "#F0FDF4",
                    borderRadius: 14,
                    border: "1px solid #A7F3D0",
                    marginBottom: 20,
                  }}
                >
                  <div style={{ position: "relative" }}>
                    {profileSrc ? (
                      <img
                        src={profileSrc}
                        alt="Preview"
                        style={{
                          width: 64,
                          height: 64,
                          borderRadius: "50%",
                          objectFit: "cover",
                          border: `2px solid ${wineSoft}`,
                        }}
                      />
                    ) : (
                      <div
                        style={{
                          width: 64,
                          height: 64,
                          borderRadius: "50%",
                          background: winePrimary,
                          color: "#FFF",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          fontSize: 24,
                          fontWeight: 700,
                        }}
                      >
                        {avatarLetter}
                      </div>
                    )}
                  </div>

                  <div>
                    <label style={{ fontSize: 12, fontWeight: 700, color: maroonDark, display: "block", marginBottom: 4 }}>
                      Change Profile Photo
                    </label>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleImageChange}
                      style={{ fontSize: 12, color: "#065F46" }}
                    />
                    <div style={{ fontSize: 11, color: "#065F46", marginTop: 2 }}>
                      Max 5MB. JPG, PNG or WEBP formats.
                    </div>
                  </div>
                </div>

                {/* Grid Fields */}
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", gap: 16 }}>
                  {/* First Name */}
                  <div>
                    <label style={{ fontSize: 12, fontWeight: 700, color: "#065F46", display: "block", marginBottom: 4 }}>
                      First Name *
                    </label>
                    <input
                      type="text"
                      value={formData.first_name}
                      onChange={(e) => setFormData({ ...formData, first_name: e.target.value })}
                      required
                      style={{
                        width: "100%",
                        boxSizing: "border-box",
                        padding: "9px 12px",
                        borderRadius: 8,
                        border: "1.5px solid #A7F3D0",
                        fontSize: 13,
                        outline: "none",
                      }}
                    />
                  </div>

                  {/* Last Name */}
                  <div>
                    <label style={{ fontSize: 12, fontWeight: 700, color: "#065F46", display: "block", marginBottom: 4 }}>
                      Last Name *
                    </label>
                    <input
                      type="text"
                      value={formData.last_name}
                      onChange={(e) => setFormData({ ...formData, last_name: e.target.value })}
                      required
                      style={{
                        width: "100%",
                        boxSizing: "border-box",
                        padding: "9px 12px",
                        borderRadius: 8,
                        border: "1.5px solid #A7F3D0",
                        fontSize: 13,
                        outline: "none",
                      }}
                    />
                  </div>

                  {/* Email */}
                  <div>
                    <label style={{ fontSize: 12, fontWeight: 700, color: "#065F46", display: "block", marginBottom: 4 }}>
                      Email Address *
                    </label>
                    <input
                      type="email"
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      required
                      style={{
                        width: "100%",
                        boxSizing: "border-box",
                        padding: "9px 12px",
                        borderRadius: 8,
                        border: "1.5px solid #A7F3D0",
                        fontSize: 13,
                        outline: "none",
                      }}
                    />
                  </div>

                  {/* Phone Number */}
                  <div>
                    <label style={{ fontSize: 12, fontWeight: 700, color: "#065F46", display: "block", marginBottom: 4 }}>
                      Phone Number (10 digits)
                    </label>
                    <input
                      type="text"
                      maxLength={10}
                      value={formData.phone_number}
                      onChange={(e) => setFormData({ ...formData, phone_number: e.target.value })}
                      placeholder="e.g. 9876543210"
                      style={{
                        width: "100%",
                        boxSizing: "border-box",
                        padding: "9px 12px",
                        borderRadius: 8,
                        border: "1.5px solid #A7F3D0",
                        fontSize: 13,
                        outline: "none",
                      }}
                    />
                  </div>

                  {/* Department */}
                  <div>
                    <label style={{ fontSize: 12, fontWeight: 700, color: "#065F46", display: "block", marginBottom: 4 }}>
                      Department
                    </label>
                    <input
                      type="text"
                      value={formData.department}
                      onChange={(e) => setFormData({ ...formData, department: e.target.value })}
                      placeholder="e.g. Computer Science"
                      style={{
                        width: "100%",
                        boxSizing: "border-box",
                        padding: "9px 12px",
                        borderRadius: 8,
                        border: "1.5px solid #A7F3D0",
                        fontSize: 13,
                        outline: "none",
                      }}
                    />
                  </div>

                  {/* ID Year */}
                  <div>
                    <label style={{ fontSize: 12, fontWeight: 700, color: "#065F46", display: "block", marginBottom: 4 }}>
                      ID Year
                    </label>
                    <input
                      type="text"
                      value={formData.id_year || ""}
                      onChange={(e) => setFormData({ ...formData, id_year: e.target.value })}
                      placeholder="e.g. MCA-2025-2027"
                      style={{
                        width: "100%",
                        boxSizing: "border-box",
                        padding: "9px 12px",
                        borderRadius: 8,
                        border: "1.5px solid #A7F3D0",
                        fontSize: 13,
                        outline: "none",
                      }}
                    />
                    <span style={{ fontSize: 11, color: "#64748B", marginTop: 2, display: "block" }}>
                      Course duration printed on ID card (e.g. MCA-2025-2027)
                    </span>
                  </div>

                  {/* Role */}
                  <div>
                    <label style={{ fontSize: 12, fontWeight: 700, color: "#065F46", display: "block", marginBottom: 4 }}>
                      Role
                    </label>
                    <select
                      value={formData.role}
                      onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                      style={{
                        width: "100%",
                        boxSizing: "border-box",
                        padding: "9px 12px",
                        borderRadius: 8,
                        border: "1.5px solid #A7F3D0",
                        fontSize: 13,
                        outline: "none",
                        background: "#FFF",
                        fontWeight: 600,
                      }}
                    >
                      {ROLE_OPTIONS.map((opt) => (
                        <option key={opt.value} value={opt.value}>
                          {opt.label}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Validation Status */}
                  <div>
                    <label style={{ fontSize: 12, fontWeight: 700, color: "#065F46", display: "block", marginBottom: 4 }}>
                      Validation Status
                    </label>
                    <select
                      value={formData.is_validated ? "true" : "false"}
                      onChange={(e) => setFormData({ ...formData, is_validated: e.target.value === "true" })}
                      style={{
                        width: "100%",
                        boxSizing: "border-box",
                        padding: "9px 12px",
                        borderRadius: 8,
                        border: "1.5px solid #A7F3D0",
                        fontSize: 13,
                        outline: "none",
                        background: "#FFF",
                        fontWeight: 600,
                      }}
                    >
                      <option value="true">Validated & Approved</option>
                      <option value="false">Pending Validation</option>
                    </select>
                  </div>

                  {/* Active Account Status */}
                  <div>
                    <label style={{ fontSize: 12, fontWeight: 700, color: "#065F46", display: "block", marginBottom: 4 }}>
                      Account State
                    </label>
                    <select
                      value={formData.is_active ? "true" : "false"}
                      onChange={(e) => setFormData({ ...formData, is_active: e.target.value === "true" })}
                      style={{
                        width: "100%",
                        boxSizing: "border-box",
                        padding: "9px 12px",
                        borderRadius: 8,
                        border: "1.5px solid #A7F3D0",
                        fontSize: 13,
                        outline: "none",
                        background: "#FFF",
                        fontWeight: 600,
                      }}
                    >
                      <option value="true">Active Account</option>
                      <option value="false">Disabled / Inactive Account</option>
                    </select>
                  </div>

                  {/* Emergency Contact Phone */}
                  <div>
                    <label style={{ fontSize: 12, fontWeight: 700, color: "#991B1B", display: "block", marginBottom: 4 }}>
                      🚨 Emergency Contact Phone (SOS)
                    </label>
                    <input
                      type="tel"
                      value={formData.emergency_contact_number}
                      onChange={(e) => setFormData({ ...formData, emergency_contact_number: e.target.value })}
                      placeholder="e.g. 9876543210"
                      maxLength={15}
                      style={{
                        width: "100%",
                        boxSizing: "border-box",
                        padding: "9px 12px",
                        borderRadius: 8,
                        border: "1.5px solid #FCA5A5",
                        fontSize: 13,
                        outline: "none",
                        background: "#FFF",
                      }}
                    />
                  </div>

                  {/* Emergency Contact Name */}
                  <div>
                    <label style={{ fontSize: 12, fontWeight: 700, color: "#991B1B", display: "block", marginBottom: 4 }}>
                      Emergency Contact Name
                    </label>
                    <input
                      type="text"
                      value={formData.emergency_contact_name}
                      onChange={(e) => setFormData({ ...formData, emergency_contact_name: e.target.value })}
                      placeholder="e.g. Parent / Guardian Name"
                      maxLength={100}
                      style={{
                        width: "100%",
                        boxSizing: "border-box",
                        padding: "9px 12px",
                        borderRadius: 8,
                        border: "1.5px solid #FCA5A5",
                        fontSize: 13,
                        outline: "none",
                        background: "#FFF",
                      }}
                    />
                  </div>

                  {/* Emergency Contact Relation */}
                  <div>
                    <label style={{ fontSize: 12, fontWeight: 700, color: "#991B1B", display: "block", marginBottom: 4 }}>
                      Emergency Contact Relation
                    </label>
                    <select
                      value={formData.emergency_contact_relation}
                      onChange={(e) => setFormData({ ...formData, emergency_contact_relation: e.target.value })}
                      style={{
                        width: "100%",
                        boxSizing: "border-box",
                        padding: "9px 12px",
                        borderRadius: 8,
                        border: "1.5px solid #FCA5A5",
                        fontSize: 13,
                        outline: "none",
                        background: "#FFF",
                        fontWeight: 600,
                      }}
                    >
                      <option value="Parent">Parent (Father / Mother)</option>
                      <option value="Guardian">Guardian</option>
                      <option value="Spouse">Spouse / Partner</option>
                      <option value="Sibling">Sibling</option>
                      <option value="Relative">Relative</option>
                      <option value="Friend">Friend</option>
                      <option value="Other">Other Contact</option>
                    </select>
                  </div>
                </div>

                {/* Non-editable field disclaimer */}
                <div style={{ marginTop: 18, fontSize: 11, color: "#64748B", fontStyle: "italic" }}>
                  * Password and security tokens cannot be edited from this profile form and are managed separately for user safety.
                </div>

                {/* Form Buttons */}
                <div style={{ marginTop: 24, display: "flex", gap: 12, justifyContent: "flex-end" }}>
                  <button
                    type="button"
                    onClick={() => {
                      setMode("view");
                      setErrorMsg("");
                    }}
                    disabled={loading}
                    style={{
                      padding: "10px 20px",
                      borderRadius: 10,
                      border: "1.5px solid #CBD5E1",
                      background: "#FFFFFF",
                      color: "#475569",
                      fontSize: 13,
                      fontWeight: 700,
                      cursor: loading ? "not-allowed" : "pointer",
                    }}
                  >
                    Cancel
                  </button>

                  <button
                    type="submit"
                    disabled={loading}
                    style={{
                      padding: "10px 24px",
                      borderRadius: 10,
                      border: "none",
                      background: loading ? "#94A3B8" : `linear-gradient(135deg, ${wineSoft}, ${winePrimary})`,
                      color: "#FFFFFF",
                      fontSize: 13,
                      fontWeight: 700,
                      cursor: loading ? "not-allowed" : "pointer",
                      boxShadow: "0 4px 14px rgba(88,17,36,0.25)",
                      display: "flex",
                      alignItems: "center",
                      gap: 8,
                    }}
                  >
                    {loading ? (
                      <>
                        <span style={{ display: "inline-block", animation: "spin 1s linear infinite" }}>⏳</span>
                        Saving Profile...
                      </>
                    ) : (
                      "💾 Save Profile Changes"
                    )}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
