import { useState, useEffect, useCallback } from "react";
import { maroon, maroonDark, maroonSoft, line } from "../theme";

const MEDIA_BASE = "http://127.0.0.1:8000";

function absUrl(src) {
  if (!src) return null;
  return src.startsWith("http") ? src : `${MEDIA_BASE}${src}`;
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

export default function MyProfileModule({ accessToken, onUserUpdated }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Edit Mode state
  const [isEditing, setIsEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [successMsg, setSuccessMsg] = useState("");
  const [formError, setFormError] = useState("");

  // Form fields
  const [username, setUsername] = useState("");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [department, setDepartment] = useState("");
  const [role, setRole] = useState("STUDENT");
  const [isValidated, setIsValidated] = useState(true);
  const [isActive, setIsActive] = useState(true);
  const [idYear, setIdYear] = useState("");

  // Image uploads state
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [idCardFile, setIdCardFile] = useState(null);
  const [idCardPreview, setIdCardPreview] = useState(null);

  // Digital ID Card modal state
  const [showIdCardModal, setShowIdCardModal] = useState(false);

  const fetchProfile = useCallback(async () => {
    setLoading(true);
    setError(null);
    const token = accessToken || localStorage.getItem("cems_access");
    if (!token) {
      setError("Authentication required. Please sign in.");
      setLoading(false);
      return;
    }
    try {
      const res = await fetch("/api/auth/me/", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      if (res.status === 401) {
        setError("Your session has expired. Please sign in again.");
        setLoading(false);
        return;
      }
      if (!res.ok) {
        let errDetail = "";
        try {
          const jsonErr = await res.json();
          errDetail = typeof jsonErr === "object" ? JSON.stringify(jsonErr) : jsonErr;
        } catch {
          errDetail = await res.text();
        }
        console.error("My Profile API Error:", res.status, errDetail);
        throw new Error(`Failed to load profile (Status ${res.status}): ${errDetail || res.statusText}`);
      }
      const data = await res.json();
      setUser(data);
      populateForm(data);
    } catch (err) {
      setError(err.message || "Unable to fetch user profile.");
    } finally {
      setLoading(false);
    }
  }, [accessToken]);

  const populateForm = (u) => {
    if (!u) return;
    setUsername(u.username || "");
    setFirstName(u.first_name || "");
    setLastName(u.last_name || "");
    setEmail(u.email || "");
    setPhoneNumber(u.phone_number || "");
    setDepartment(u.department || "");
    setRole(u.role || "STUDENT");
    setIsValidated(u.is_validated ?? true);
    setIsActive(u.is_active ?? true);
    setIdYear(u.college_id?.id_year || u.college_id?.id_number || "");

    setImageFile(null);
    setImagePreview(absUrl(u.profile_image));
    setIdCardFile(null);
    setIdCardPreview(absUrl(u.college_id?.id_card_image));
  };

  useEffect(() => {
    fetchProfile();
  }, [fetchProfile]);

  const handleStartEdit = () => {
    populateForm(user);
    setFormError("");
    setSuccessMsg("");
    setIsEditing(true);
  };

  const handleCancelEdit = () => {
    populateForm(user);
    setFormError("");
    setIsEditing(false);
  };

  const handleImageChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const validTypes = ["image/jpeg", "image/png", "image/jpg", "image/webp"];
    if (!validTypes.includes(file.type)) {
      setFormError("Invalid profile photo type. Please select a JPEG, PNG, or WebP image.");
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      setFormError("Profile photo file size must be smaller than 5 MB.");
      return;
    }

    setFormError("");
    setImageFile(file);
    setImagePreview(URL.createObjectURL(file));
  };

  const handleIdCardChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const validTypes = ["image/jpeg", "image/png", "image/jpg", "image/webp"];
    if (!validTypes.includes(file.type)) {
      setFormError("Invalid College ID Card image type. Select JPEG, PNG, or WebP.");
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      setFormError("College ID Card image must be smaller than 5 MB.");
      return;
    }

    setFormError("");
    setIdCardFile(file);
    setIdCardPreview(URL.createObjectURL(file));
  };

  const handleSaveProfile = async (e) => {
    e.preventDefault();
    setFormError("");
    setSuccessMsg("");

    if (!username.trim()) {
      setFormError("Username is required.");
      return;
    }
    if (!firstName.trim()) {
      setFormError("First name is required.");
      return;
    }
    if (!lastName.trim()) {
      setFormError("Last name is required.");
      return;
    }
    if (!email.trim() || !/\S+@\S+\.\S+/.test(email.trim())) {
      setFormError("Please enter a valid email address.");
      return;
    }
    if (phoneNumber.trim() && (!/^\d+$/.test(phoneNumber.trim()) || phoneNumber.trim().length !== 10)) {
      setFormError("Phone number must be exactly 10 digits.");
      return;
    }

    setSaving(true);
    const token = accessToken || localStorage.getItem("cems_access");

    try {
      const formData = new FormData();
      formData.append("username", username.trim());
      formData.append("first_name", firstName.trim());
      formData.append("last_name", lastName.trim());
      formData.append("email", email.trim());
      formData.append("phone_number", phoneNumber.trim());
      formData.append("department", department.trim());
      if (idYear.trim()) {
        formData.append("id_year", idYear.trim());
        formData.append("id_number", idYear.trim());
      }
      if (imageFile) {
        formData.append("profile_image", imageFile);
      }
      if (idCardFile) {
        formData.append("id_card_image", idCardFile);
      }

      const response = await fetch("/api/auth/me/", {
        method: "PATCH",
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: formData,
      });

      const resData = await response.json();

      if (!response.ok) {
        let msg = "Failed to update profile.";
        if (resData && typeof resData === "object") {
          const errList = [];
          for (const key in resData) {
            const val = Array.isArray(resData[key]) ? resData[key].join(" ") : resData[key];
            errList.push(`${key}: ${val}`);
          }
          if (errList.length > 0) msg = errList.join(" | ");
        }
        throw new Error(msg);
      }

      setUser(resData);
      populateForm(resData);
      setIsEditing(false);
      setSuccessMsg("Your profile has been updated successfully.");

      if (onUserUpdated && typeof onUserUpdated === "function") {
        onUserUpdated(resData);
      }
    } catch (err) {
      setFormError(err.message || "An error occurred while saving profile changes.");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div style={{
        padding: "60px 20px", textAlign: "center", background: "#FFFFFF",
        borderRadius: 16, border: `1px solid ${line}`, boxShadow: "0 4px 16px rgba(88,17,36,0.06)"
      }}>
        <div style={{
          width: 44, height: 44, border: `3px solid ${maroonSoft}`, borderTopColor: "transparent",
          borderRadius: "50%", margin: "0 auto 16px", animation: "spin 0.8s linear infinite"
        }} />
        <div style={{ color: maroon, fontWeight: 700, fontSize: 16 }}>Loading Profile...</div>
        <style>{`@keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

  if (error) {
    return (
      <div style={{
        padding: "40px 24px", background: "#FFFFFF", borderRadius: 16,
        border: "1.5px solid #FCA5A5", boxShadow: "0 4px 16px rgba(88,17,36,0.06)",
        textAlign: "center"
      }}>
        <div style={{ fontSize: 36, marginBottom: 12 }}>⚠️</div>
        <h3 style={{ margin: "0 0 8px", color: "#991B1B", fontWeight: 800 }}>Profile Unavailable</h3>
        <p style={{ margin: "0 0 20px", color: "#7F1D1D", fontSize: 14 }}>{error}</p>
        <button onClick={fetchProfile}
          style={{
            padding: "10px 20px", borderRadius: 10, background: maroon, color: "#FFF",
            border: "none", fontWeight: 700, cursor: "pointer", fontSize: 13
          }}>
          Retry Loading
        </button>
      </div>
    );
  }

  const fullName = `${user?.first_name || ""} ${user?.last_name || ""}`.trim() || user?.username;
  const roleLabel = (user?.role || "STUDENT").replace(/_/g, " ");
  const collegeIdData = user?.college_id;
  const profileImgUrl = imagePreview || absUrl(user?.profile_image);

  return (
    <div style={{ maxWidth: 960, margin: "0 auto", display: "flex", flexDirection: "column", gap: 24 }}>

      {/* Success Notification */}
      {successMsg && (
        <div style={{
          padding: "14px 20px", borderRadius: 12, background: "#D1FAE5", border: "1px solid #A7F3D0",
          color: "#065F46", fontWeight: 700, fontSize: 14, display: "flex", alignItems: "center", justifyContent: "space-between"
        }}>
          <span>✅ {successMsg}</span>
          <button onClick={() => setSuccessMsg("")} style={{ background: "none", border: "none", color: "#065F46", cursor: "pointer", fontWeight: 800 }}>✕</button>
        </div>
      )}

      {/* ── Top Header Hero Card ── */}
      <div style={{
        background: "linear-gradient(135deg, #581124 0%, #722F37 100%)",
        borderRadius: 20, padding: "32px 28px", color: "#FFFFFF",
        boxShadow: "0 8px 32px rgba(88, 17, 36, 0.25)", position: "relative",
        border: "1px solid rgba(255,255,255,0.1)", display: "flex", flexWrap: "wrap",
        alignItems: "center", justifyContent: "space-between", gap: 24
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 24, flexWrap: "wrap" }}>

          {/* Profile Photo / Avatar */}
          <div style={{ position: "relative" }}>
            <div style={{
              width: 100, height: 100, borderRadius: "50%",
              background: "linear-gradient(135deg, #059669, #34D399)",
              border: "4px solid rgba(255,255,255,0.9)",
              boxShadow: "0 6px 20px rgba(0,0,0,0.3)",
              display: "flex", alignItems: "center", justifyContent: "center",
              overflow: "hidden", flexShrink: 0
            }}>
              {profileImgUrl ? (
                <img src={profileImgUrl} alt={fullName} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
              ) : (
                <span style={{ fontSize: 36, fontWeight: 900, color: "#FFFFFF" }}>
                  {fullName.charAt(0).toUpperCase()}
                </span>
              )}
            </div>
          </div>

          {/* User Headline */}
          <div>
            <h2 style={{ margin: "0 0 6px", fontSize: 26, fontWeight: 900, letterSpacing: "-0.02em" }}>
              {fullName}
            </h2>
            <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
              <span style={{
                background: "rgba(255,255,255,0.18)", color: "#FFFFFF",
                fontSize: 11, fontWeight: 800, padding: "4px 12px", borderRadius: 9999,
                letterSpacing: "0.08em", textTransform: "uppercase",
                border: "1px solid rgba(255,255,255,0.2)"
              }}>
                {roleLabel}
              </span>
              <span style={{
                background: user?.is_validated ? "rgba(16,185,129,0.25)" : "rgba(245,158,11,0.25)",
                color: user?.is_validated ? "#6EE7B7" : "#FDE68A",
                fontSize: 12, fontWeight: 700, padding: "4px 12px", borderRadius: 9999,
                display: "flex", alignItems: "center", gap: 6,
                border: user?.is_validated ? "1px solid rgba(110,231,183,0.3)" : "1px solid rgba(253,230,138,0.3)"
              }}>
                <span style={{ width: 8, height: 8, borderRadius: "50%", background: user?.is_validated ? "#34D399" : "#F59E0B" }} />
                {user?.is_validated ? "Validated Account" : "Pending Approval"}
              </span>
              <span style={{
                background: user?.is_active ? "rgba(59,130,246,0.25)" : "rgba(239,68,68,0.25)",
                color: user?.is_active ? "#93C5FD" : "#FCA5A5",
                fontSize: 12, fontWeight: 700, padding: "4px 12px", borderRadius: 9999,
                display: "flex", alignItems: "center", gap: 6,
                border: user?.is_active ? "1px solid rgba(147,197,253,0.3)" : "1px solid rgba(252,165,165,0.3)"
              }}>
                <span style={{ width: 8, height: 8, borderRadius: "50%", background: user?.is_active ? "#60A5FA" : "#EF4444" }} />
                {user?.is_active ? "Active" : "Inactive"}
              </span>
            </div>
          </div>
        </div>

        {/* Action Toggle Button */}
        <div>
          {!isEditing ? (
            <button onClick={handleStartEdit}
              style={{
                padding: "12px 24px", borderRadius: 12,
                background: "#FFFFFF", color: maroonDark, border: "none",
                fontWeight: 800, fontSize: 14, cursor: "pointer",
                boxShadow: "0 4px 14px rgba(0,0,0,0.2)", display: "flex",
                alignItems: "center", gap: 8, transition: "all 0.2s ease"
              }}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
              </svg>
              Edit Profile
            </button>
          ) : (
            <button onClick={handleCancelEdit}
              style={{
                padding: "12px 20px", borderRadius: 12,
                background: "rgba(255,255,255,0.15)", color: "#FFFFFF",
                border: "1px solid rgba(255,255,255,0.3)",
                fontWeight: 700, fontSize: 13, cursor: "pointer"
              }}>
              Cancel Editing
            </button>
          )}
        </div>
      </div>

      {/* Form Error Banner */}
      {formError && (
        <div style={{
          padding: "14px 20px", borderRadius: 12, background: "#FEF2F2", border: "1px solid #FCA5A5",
          color: "#991B1B", fontWeight: 700, fontSize: 14
        }}>
          ⚠️ {formError}
        </div>
      )}

      {/* ── Main Content Grid ── */}
      {isEditing ? (
        /* ═══════════════════════════════════════════════════════════
           EDIT PROFILE FORM (ALL FIELDS EDITABLE)
           ═══════════════════════════════════════════════════════════ */
        <form onSubmit={handleSaveProfile} style={{ display: "flex", flexDirection: "column", gap: 24 }}>
          <div style={{
            background: "#FFFFFF", borderRadius: 16, padding: "28px",
            border: `1.5px solid ${maroonSoft}`, boxShadow: "0 4px 20px rgba(88,17,36,0.08)"
          }}>
            <h3 style={{ margin: "0 0 20px", color: maroonDark, fontSize: 18, fontWeight: 800, borderBottom: `2px solid ${line}`, paddingBottom: 10 }}>
              ✏️ Edit All Profile Information
            </h3>

            {/* Profile Image & ID Card Uploads */}
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))", gap: 18, marginBottom: 24 }}>

              {/* Profile Photo Upload */}
              <div style={{ background: "#F0FDF4", padding: 18, borderRadius: 12, border: "1px solid #A7F3D0" }}>
                <label style={{ display: "block", fontSize: 13, fontWeight: 800, color: maroonDark, marginBottom: 8 }}>
                  Profile Photo
                </label>
                <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
                  {imagePreview && (
                    <img src={imagePreview} alt="Profile Preview" style={{ width: 64, height: 64, borderRadius: "50%", objectFit: "cover", border: `2px solid ${maroonSoft}` }} />
                  )}
                  <div>
                    <input type="file" accept="image/jpeg,image/png,image/jpg,image/webp" onChange={handleImageChange} style={{ fontSize: 12 }} />
                    <div style={{ fontSize: 11, color: "#065F46", marginTop: 4 }}>JPG, PNG, WebP (Max 5MB)</div>
                  </div>
                </div>
              </div>

              {/* College ID Card Upload */}
              <div style={{ background: "#F0FDF4", padding: 18, borderRadius: 12, border: "1px solid #A7F3D0" }}>
                <label style={{ display: "block", fontSize: 13, fontWeight: 800, color: maroonDark, marginBottom: 8 }}>
                  College ID Card Image
                </label>
                <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
                  {idCardPreview && (
                    <img src={idCardPreview} alt="ID Card Preview" style={{ width: 80, height: 50, borderRadius: 6, objectFit: "cover", border: `1px solid ${line}` }} />
                  )}
                  <div>
                    <input type="file" accept="image/jpeg,image/png,image/jpg,image/webp" onChange={handleIdCardChange} style={{ fontSize: 12 }} />
                    <div style={{ fontSize: 11, color: "#065F46", marginTop: 4 }}>Digital ID photo upload</div>
                  </div>
                </div>
              </div>

            </div>

            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: 18 }}>

              {/* Username */}
              <div>
                <label style={{ display: "block", fontSize: 12, fontWeight: 800, color: maroonDark, marginBottom: 6 }}>
                  Username <span style={{ color: "#DC2626" }}>*</span>
                </label>
                <input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  style={{
                    width: "100%", padding: "10px 14px", borderRadius: 10,
                    border: `1.5px solid ${line}`, fontSize: 14, outline: "none", boxSizing: "border-box"
                  }}
                  required
                />
              </div>

              {/* First Name */}
              <div>
                <label style={{ display: "block", fontSize: 12, fontWeight: 800, color: maroonDark, marginBottom: 6 }}>
                  First Name <span style={{ color: "#DC2626" }}>*</span>
                </label>
                <input
                  type="text"
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                  style={{
                    width: "100%", padding: "10px 14px", borderRadius: 10,
                    border: `1.5px solid ${line}`, fontSize: 14, outline: "none", boxSizing: "border-box"
                  }}
                  required
                />
              </div>

              {/* Last Name */}
              <div>
                <label style={{ display: "block", fontSize: 12, fontWeight: 800, color: maroonDark, marginBottom: 6 }}>
                  Last Name <span style={{ color: "#DC2626" }}>*</span>
                </label>
                <input
                  type="text"
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                  style={{
                    width: "100%", padding: "10px 14px", borderRadius: 10,
                    border: `1.5px solid ${line}`, fontSize: 14, outline: "none", boxSizing: "border-box"
                  }}
                  required
                />
              </div>

              {/* Email */}
              <div>
                <label style={{ display: "block", fontSize: 12, fontWeight: 800, color: maroonDark, marginBottom: 6 }}>
                  Email Address <span style={{ color: "#DC2626" }}>*</span>
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  style={{
                    width: "100%", padding: "10px 14px", borderRadius: 10,
                    border: `1.5px solid ${line}`, fontSize: 14, outline: "none", boxSizing: "border-box"
                  }}
                  required
                />
              </div>

              {/* Phone Number */}
              <div>
                <label style={{ display: "block", fontSize: 12, fontWeight: 800, color: maroonDark, marginBottom: 6 }}>
                  Phone Number (10 digits)
                </label>
                <input
                  type="text"
                  maxLength={10}
                  value={phoneNumber}
                  onChange={(e) => setPhoneNumber(e.target.value)}
                  placeholder="e.g. 9876543210"
                  style={{
                    width: "100%", padding: "10px 14px", borderRadius: 10,
                    border: `1.5px solid ${line}`, fontSize: 14, outline: "none", boxSizing: "border-box"
                  }}
                />
              </div>

              {/* Department */}
              <div>
                <label style={{ display: "block", fontSize: 12, fontWeight: 800, color: maroonDark, marginBottom: 6 }}>
                  Department
                </label>
                <input
                  type="text"
                  value={department}
                  onChange={(e) => setDepartment(e.target.value)}
                  placeholder="e.g. Computer Science / MCA"
                  style={{
                    width: "100%", padding: "10px 14px", borderRadius: 10,
                    border: `1.5px solid ${line}`, fontSize: 14, outline: "none", boxSizing: "border-box"
                  }}
                />
              </div>

              {/* ID Year */}
              <div>
                <label style={{ display: "block", fontSize: 12, fontWeight: 800, color: maroonDark, marginBottom: 6 }}>
                  ID Year
                </label>
                <input
                  type="text"
                  value={idYear}
                  onChange={(e) => setIdYear(e.target.value)}
                  placeholder="e.g. MCA-2025-2027"
                  style={{
                    width: "100%", padding: "10px 14px", borderRadius: 10,
                    border: `1.5px solid ${line}`, fontSize: 14, outline: "none", boxSizing: "border-box"
                  }}
                />
                <span style={{ fontSize: 11, color: "#64748B", marginTop: 4, display: "block" }}>
                  Course and duration as printed on your ID card (e.g. MCA-2025-2027)
                </span>
              </div>

            </div>

            {/* Save & Cancel Buttons */}
            <div style={{ display: "flex", gap: 12, marginTop: 28, justifyContent: "flex-end" }}>
              <button type="button" onClick={handleCancelEdit} disabled={saving}
                style={{
                  padding: "10px 20px", borderRadius: 10, background: "#F1F5F9",
                  color: "#475569", border: "1px solid #CBD5E1", fontWeight: 700,
                  fontSize: 13, cursor: "pointer"
                }}>
                Cancel
              </button>
              <button type="submit" disabled={saving}
                style={{
                  padding: "10px 24px", borderRadius: 10,
                  background: saving ? "#94A3B8" : `linear-gradient(135deg, ${maroonSoft}, ${maroonDark})`,
                  color: "#FFFFFF", border: "none", fontWeight: 800, fontSize: 14,
                  cursor: saving ? "wait" : "pointer",
                  boxShadow: "0 4px 14px rgba(88,17,36,0.3)"
                }}>
                {saving ? "Saving Changes..." : "Save Changes"}
              </button>
            </div>
          </div>
        </form>
      ) : (
        /* ═══════════════════════════════════════════════════════════
           VIEW PROFILE CARDS
           ═══════════════════════════════════════════════════════════ */
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(420px, 1fr))", gap: 24 }}>

          {/* Personal Information */}
          <div style={{
            background: "#FFFFFF", borderRadius: 16, padding: "24px",
            border: `1px solid ${line}`, boxShadow: "0 4px 16px rgba(88,17,36,0.06)"
          }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 16, borderBottom: `1.5px solid ${line}`, paddingBottom: 10 }}>
              <span style={{ fontSize: 20 }}>👤</span>
              <h3 style={{ margin: 0, fontSize: 16, fontWeight: 800, color: maroonDark }}>
                PERSONAL INFORMATION
              </h3>
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
              <div>
                <div style={{ fontSize: 11, fontWeight: 700, color: "#065F46", textTransform: "uppercase", letterSpacing: "0.05em" }}>Full Name</div>
                <div style={{ fontSize: 15, fontWeight: 700, color: "#1E293B", marginTop: 2 }}>{fullName}</div>
              </div>
              <div>
                <div style={{ fontSize: 11, fontWeight: 700, color: "#065F46", textTransform: "uppercase", letterSpacing: "0.05em" }}>Username</div>
                <div style={{ fontSize: 14, fontWeight: 600, color: "#334155", marginTop: 2 }}>{user?.username}</div>
              </div>
              <div>
                <div style={{ fontSize: 11, fontWeight: 700, color: "#065F46", textTransform: "uppercase", letterSpacing: "0.05em" }}>Email Address</div>
                <div style={{ fontSize: 14, fontWeight: 600, color: "#334155", marginTop: 2 }}>{user?.email || "—"}</div>
              </div>
              <div>
                <div style={{ fontSize: 11, fontWeight: 700, color: "#065F46", textTransform: "uppercase", letterSpacing: "0.05em" }}>Phone Number</div>
                <div style={{ fontSize: 14, fontWeight: 600, color: "#334155", marginTop: 2 }}>{user?.phone_number || "—"}</div>
              </div>
            </div>
          </div>

          {/* Academic Information */}
          <div style={{
            background: "#FFFFFF", borderRadius: 16, padding: "24px",
            border: `1px solid ${line}`, boxShadow: "0 4px 16px rgba(88,17,36,0.06)"
          }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 16, borderBottom: `1.5px solid ${line}`, paddingBottom: 10 }}>
              <span style={{ fontSize: 20 }}>🎓</span>
              <h3 style={{ margin: 0, fontSize: 16, fontWeight: 800, color: maroonDark }}>
                ACADEMIC INFORMATION
              </h3>
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
              <div>
                <div style={{ fontSize: 11, fontWeight: 700, color: "#065F46", textTransform: "uppercase", letterSpacing: "0.05em" }}>Role</div>
                <div style={{ fontSize: 14, fontWeight: 800, color: maroonDark, marginTop: 2 }}>{roleLabel}</div>
              </div>
              <div>
                <div style={{ fontSize: 11, fontWeight: 700, color: "#065F46", textTransform: "uppercase", letterSpacing: "0.05em" }}>Department</div>
                <div style={{ fontSize: 14, fontWeight: 600, color: "#334155", marginTop: 2 }}>{user?.department || "General Campus"}</div>
              </div>
              <div>
                <div style={{ fontSize: 11, fontWeight: 700, color: "#065F46", textTransform: "uppercase", letterSpacing: "0.05em" }}>ID Year</div>
                <div style={{ fontSize: 14, fontWeight: 800, color: maroonDark, marginTop: 2 }}>{collegeIdData?.id_year || collegeIdData?.id_number || "—"}</div>
              </div>
              <div>
                <div style={{ fontSize: 11, fontWeight: 700, color: "#065F46", textTransform: "uppercase", letterSpacing: "0.05em" }}>Validation Clearance</div>
                <div style={{ fontSize: 14, fontWeight: 700, color: user?.is_validated ? "#059669" : "#D97706", marginTop: 2 }}>
                  {user?.is_validated ? "Validated by Administrator" : "Pending Validation"}
                </div>
              </div>
            </div>
          </div>

          {/* College ID Card */}
          <div style={{
            background: "#FFFFFF", borderRadius: 16, padding: "24px",
            border: `1px solid ${line}`, boxShadow: "0 4px 16px rgba(88,17,36,0.06)"
          }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 16, borderBottom: `1.5px solid ${line}`, paddingBottom: 10 }}>
              <span style={{ fontSize: 20 }}>🪪</span>
              <h3 style={{ margin: 0, fontSize: 16, fontWeight: 800, color: maroonDark }}>
                COLLEGE ID CARD
              </h3>
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
              <div>
                <div style={{ fontSize: 11, fontWeight: 700, color: "#065F46", textTransform: "uppercase", letterSpacing: "0.05em" }}>ID Year</div>
                <div style={{ fontSize: 15, fontWeight: 800, color: maroonDark, marginTop: 2, letterSpacing: "0.03em" }}>
                  {collegeIdData?.id_year || collegeIdData?.id_number || "Not Issued"}
                </div>
              </div>
              <div>
                <div style={{ fontSize: 11, fontWeight: 700, color: "#065F46", textTransform: "uppercase", letterSpacing: "0.05em" }}>ID Status</div>
                <div style={{ fontSize: 14, fontWeight: 700, color: collegeIdData?.is_active ? "#059669" : "#DC2626", marginTop: 2 }}>
                  {collegeIdData ? (collegeIdData.is_active ? "Active" : "Inactive") : "No ID Record"}
                </div>
              </div>
              {collegeIdData?.issued_at && (
                <div>
                  <div style={{ fontSize: 11, fontWeight: 700, color: "#065F46", textTransform: "uppercase", letterSpacing: "0.05em" }}>Issued Date</div>
                  <div style={{ fontSize: 13, fontWeight: 600, color: "#475569", marginTop: 2 }}>
                    {new Date(collegeIdData.issued_at).toLocaleDateString()}
                  </div>
                </div>
              )}
              {collegeIdData?.id_card_image && (
                <div style={{ marginTop: 6 }}>
                  <button onClick={() => setShowIdCardModal(true)}
                    style={{
                      padding: "8px 16px", borderRadius: 10, background: "#F0FDF4",
                      color: "#059669", border: "1px solid #A7F3D0", fontWeight: 700,
                      fontSize: 13, cursor: "pointer", display: "flex", alignItems: "center", gap: 6
                    }}>
                    🪪 View ID Card Image
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Account Information */}
          <div style={{
            background: "#FFFFFF", borderRadius: 16, padding: "24px",
            border: `1px solid ${line}`, boxShadow: "0 4px 16px rgba(88,17,36,0.06)"
          }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 16, borderBottom: `1.5px solid ${line}`, paddingBottom: 10 }}>
              <span style={{ fontSize: 20 }}>⚙️</span>
              <h3 style={{ margin: 0, fontSize: 16, fontWeight: 800, color: maroonDark }}>
                ACCOUNT METADATA
              </h3>
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
              <div>
                <div style={{ fontSize: 11, fontWeight: 700, color: "#065F46", textTransform: "uppercase", letterSpacing: "0.05em" }}>System Identifier</div>
                <div style={{ fontSize: 14, fontWeight: 600, color: "#334155", marginTop: 2 }}>ID #{user?.id}</div>
              </div>
              <div>
                <div style={{ fontSize: 11, fontWeight: 700, color: "#065F46", textTransform: "uppercase", letterSpacing: "0.05em" }}>Member Since</div>
                <div style={{ fontSize: 13, fontWeight: 600, color: "#475569", marginTop: 2 }}>
                  {user?.created_at || user?.date_joined
                    ? new Date(user.created_at || user.date_joined).toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' })
                    : "N/A"}
                </div>
              </div>
              {user?.validated_at && (
                <div>
                  <div style={{ fontSize: 11, fontWeight: 700, color: "#065F46", textTransform: "uppercase", letterSpacing: "0.05em" }}>Validated Date</div>
                  <div style={{ fontSize: 13, fontWeight: 600, color: "#475569", marginTop: 2 }}>
                    {new Date(user.validated_at).toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' })}
                  </div>
                </div>
              )}
              {user?.updated_at && (
                <div>
                  <div style={{ fontSize: 11, fontWeight: 700, color: "#065F46", textTransform: "uppercase", letterSpacing: "0.05em" }}>Last Profile Update</div>
                  <div style={{ fontSize: 13, fontWeight: 600, color: "#475569", marginTop: 2 }}>
                    {new Date(user.updated_at).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' })}
                  </div>
                </div>
              )}
              <div>
                <div style={{ fontSize: 11, fontWeight: 700, color: "#065F46", textTransform: "uppercase", letterSpacing: "0.05em" }}>Account Status</div>
                <div style={{ fontSize: 13, fontWeight: 700, color: user?.is_active ? "#059669" : "#DC2626", marginTop: 2 }}>
                  {user?.is_active ? "Active Member" : "Inactive Account"}
                </div>
              </div>

            </div>
          </div>

        </div>
      )}

      {/* ── ID Card Modal ── */}
      {showIdCardModal && collegeIdData?.id_card_image && (
        <div style={{
          position: "fixed", inset: 0, zIndex: 1000, background: "rgba(15,23,42,0.75)",
          backdropFilter: "blur(6px)", display: "flex", alignItems: "center", justifyContent: "center", padding: 20
        }}>
          <div style={{
            background: "#FFFFFF", borderRadius: 20, padding: 24, maxWidth: 480, width: "100%",
            boxShadow: "0 20px 40px rgba(0,0,0,0.3)", border: `2px solid ${maroonSoft}`
          }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
              <h3 style={{ margin: 0, color: maroonDark, fontSize: 18, fontWeight: 800 }}>Digital College ID Card</h3>
              <button onClick={() => setShowIdCardModal(false)}
                style={{ background: "none", border: "none", fontSize: 20, cursor: "pointer", color: "#64748B" }}>
                ✕
              </button>
            </div>
            <div style={{ textAlign: "center", padding: 12, background: "#F8FAFC", borderRadius: 12 }}>
              <img src={absUrl(collegeIdData.id_card_image)} alt="College ID Card" style={{ maxWidth: "100%", maxHeight: 360, borderRadius: 10, objectFit: "contain" }} />
            </div>
            <div style={{ marginTop: 16, textAlign: "center" }}>
              <div style={{ fontSize: 14, fontWeight: 800, color: maroonDark }}>{fullName}</div>
              <div style={{ fontSize: 12, color: "#64748B" }}>ID Year: {collegeIdData.id_year || collegeIdData.id_number}</div>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
