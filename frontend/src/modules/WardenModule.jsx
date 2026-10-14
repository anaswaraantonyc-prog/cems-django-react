import { useState, useEffect } from "react";
import { Card } from "../components/Shared";
import { maroonDark, gold, sage, brick } from "../theme";

const INITIAL_HOSTEL_BOOKINGS = [
  {
    id: "BK-2026-8750",
    title: "Boys Hostel Block A - Semester Accommodation (AC)",
    applicant: "Ankit Patel",
    applicantRole: "STUDENT",
    date: "2026-08-10",
    roomType: "AC Room 304",
    hostelType: "BOYS",
    status: "CONFIRMED",
    wardenStatus: "APPROVED",
    paymentStatus: "PAID",
    paymentMethod: "UPI",
    paymentTxnId: "UPI-2026-875011",
    paidAt: "2026-08-01 03:45 PM",
    details: "Single occupancy AC room for odd semester 2026.",
    adminReply: "Room 304 allocated. Collect keys from warden desk at 9 AM.",
    amount: 3500,
    submittedAt: "2026-08-01",
  },
  {
    id: "BK-2026-8640",
    title: "Girls Hostel Guest House - Visiting Scholar Stay",
    applicant: "Kavita Verma",
    applicantRole: "FACULTY",
    date: "2026-07-20",
    roomType: "AC Suite 102",
    hostelType: "GIRLS",
    status: "COMPLETED",
    wardenStatus: "APPROVED",
    paymentStatus: "PAID",
    paymentMethod: "CARD",
    paymentTxnId: "CARD-2026-864022",
    paidAt: "2026-07-12 10:00 AM",
    details: "3-day accommodation for visiting guest speaker from IIT Madras.",
    adminReply: "Guest suite 102 reserved and prepared.",
    amount: 3500,
    submittedAt: "2026-07-12",
  },
];

const wardenStatusColor = (s) => {
  if (s === "APPROVED")  return { bg: "#F0FDF4", border: "#BBF7D0", text: "#15803D" };
  if (s === "REJECTED")  return { bg: "#FEF2F2", border: "#FECACA", text: "#B91C1C" };
  if (s === "PENDING")   return { bg: "#F8FAFC", border: "#E2E8F0", text: "#722F37" };
  return { bg: "#F8FAFC", border: "#CBD5E1", text: "#334155" };
};

export default function WardenModule({ userName = "" }) {
  const [bookings, setBookings] = useState(INITIAL_HOSTEL_BOOKINGS);
  const [replyDrafts, setReplyDrafts] = useState({});
  const [actionSuccessMsg, setActionSuccessMsg] = useState("");

  const isBoysWarden = (userName || "").toLowerCase().includes("amith");
  const isGirlsWarden = (userName || "").toLowerCase().includes("gracy");

  const fetchBookings = () => {
    const token = localStorage.getItem("cems_access");
    if (token) {
      fetch("/api/bookings/bookings/?booking_type=HOSTEL", {
        headers: { Authorization: `Bearer ${token}` }
      })
        .then((res) => (res.ok ? res.json() : null))
        .then((data) => {
          if (!data) return;
          const raw = Array.isArray(data) ? data : data.results || [];
          if (raw.length > 0) {
            const formatted = raw.map((b) => ({
              id: `BK-${b.id}`,
              title: b.title,
              applicant: b.user_full_name || (typeof b.user === "string" ? b.user : "Student"),
              applicantRole: b.user_role || "STUDENT",
              date: b.event_datetime ? b.event_datetime.split("T")[0] : "2026-10-10",
              roomType: b.room_type || "Hostel Room",
              hostelType: b.hostel_type || (b.title && b.title.toLowerCase().includes("girl") ? "GIRLS" : "BOYS"),
              adminReply: b.admin_reply || "",
              status: b.status || "CONFIRMED",
              wardenStatus: b.status === "CONFIRMED" ? "APPROVED" : b.status === "CANCELLED" ? "REJECTED" : "PENDING",
              paymentStatus: b.payment_status || "PAID",
              paymentMethod: b.payment_method || "UPI",
              paymentTxnId: b.payment_txn_id || `UPI-2026-${b.id}`,
              paidAt: b.paid_at || (b.created_at ? b.created_at.split("T")[0] : "2026-10-01"),
              details: b.details || "Hostel room booking",
              amount: Number(b.amount) || 0,
              submittedAt: b.created_at ? b.created_at.split("T")[0] : "2026-10-01",
            }));
            setBookings(formatted);
          }
        })
        .catch(() => {});
    }
  };

  useEffect(() => {
    fetchBookings();
  }, []);

  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState("ALL");
  const [expandedId, setExpandedId] = useState(null);

  const updateWardenStatus = async (id, newStatus, customReply) => {
    const numericId = String(id).replace("BK-", "");
    const token = localStorage.getItem("cems_access");
    const replyText = customReply !== undefined ? customReply : (replyDrafts[id] || "");

    const payload = {
      status: newStatus === "APPROVED" ? "CONFIRMED" : "CANCELLED",
    };
    if (replyText.trim()) {
      payload.admin_reply = replyText.trim();
    }

    if (token && !isNaN(numericId)) {
      try {
        await fetch(`/api/bookings/bookings/${numericId}/`, {
          method: "PATCH",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json"
          },
          body: JSON.stringify(payload)
        });
      } catch (e) {
        console.error("Error updating warden status:", e);
      }
    }

    setBookings((prev) =>
      prev.map((b) =>
        b.id === id
          ? {
              ...b,
              wardenStatus: newStatus,
              status: newStatus === "APPROVED" ? "CONFIRMED" : "CANCELLED",
              adminReply: replyText.trim() || b.adminReply,
            }
          : b
      )
    );

    setActionSuccessMsg(`Booking ${id} ${newStatus === "APPROVED" ? "accepted and confirmed" : "declined"} with reply message sent.`);
    setTimeout(() => setActionSuccessMsg(""), 4000);
  };

  const sendOnlyReply = async (id) => {
    const replyText = (replyDrafts[id] || "").trim();
    if (!replyText) return;

    const numericId = String(id).replace("BK-", "");
    const token = localStorage.getItem("cems_access");
    if (token && !isNaN(numericId)) {
      try {
        await fetch(`/api/bookings/bookings/${numericId}/`, {
          method: "PATCH",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json"
          },
          body: JSON.stringify({ admin_reply: replyText })
        });
      } catch (e) {
        console.error("Error sending reply:", e);
      }
    }

    setBookings((prev) =>
      prev.map((b) => (b.id === id ? { ...b, adminReply: replyText } : b))
    );

    setActionSuccessMsg(`Reply message for ${id} sent to student successfully.`);
    setTimeout(() => setActionSuccessMsg(""), 4000);
  };

  const filtered = bookings.filter((b) => {
    const ws = b.wardenStatus || (b.status.includes("PENDING") ? "PENDING" : "APPROVED");
    const matchStatus = filterStatus === "ALL" || ws === filterStatus;
    const q = search.toLowerCase();
    return matchStatus && (!q || b.title.toLowerCase().includes(q) || b.applicant.toLowerCase().includes(q) || b.id.toLowerCase().includes(q));
  });

  const stats = {
    total: bookings.length,
    pending: bookings.filter((b) => !b.wardenStatus || b.wardenStatus === "PENDING" || b.status.includes("PENDING")).length,
    approved: bookings.filter((b) => b.wardenStatus === "APPROVED" || b.status === "CONFIRMED" || b.status === "COMPLETED").length,
    rejected: bookings.filter((b) => b.wardenStatus === "REJECTED" || b.status === "CANCELLED").length,
  };

  const totalRevenue = bookings
    .filter((b) => b.paymentStatus === "PAID")
    .reduce((s, b) => s + (b.amount || 0), 0);

  return (
    <div style={{ maxWidth: 920, margin: "0 auto", paddingBottom: 40 }}>
      {/* ── Banner ── */}
      <div style={{
        background: isGirlsWarden
          ? "linear-gradient(135deg, #831843 0%, #BE185D 60%, #065F46 100%)"
          : isBoysWarden
          ? "linear-gradient(135deg, #064E3B 0%, #059669 60%, #1E3A5F 100%)"
          : "linear-gradient(135deg, #1E3A5F 0%, #2563EB 60%, #059669 100%)",
        border: `1.5px solid ${gold}`, borderRadius: 14, padding: "20px 24px",
        marginBottom: 22, color: "#FFF", boxShadow: "0 6px 20px rgba(0,0,0,0.12)",
      }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 14 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
            <span style={{ fontSize: 38 }}>🏨</span>
            <div>
              <strong style={{ fontSize: 19, display: "block", color: gold }}>
                {isBoysWarden
                  ? "Boys Hostel Warden Dashboard — Warden Amith"
                  : isGirlsWarden
                  ? "Girls Hostel Warden Dashboard — Warden Gracy"
                  : "Hostel Warden Accommodation & Approval Dashboard"}
              </strong>
              <div style={{ fontSize: 13, marginTop: 4, opacity: 0.9 }}>
                {isBoysWarden
                  ? "Exclusively managing all Boys Hostel room booking requests and student stay allotments."
                  : isGirlsWarden
                  ? "Exclusively managing all Girls Hostel room booking requests and student stay allotments."
                  : "Review hostel room booking requests, accept bookings, and send reply messages to students."}
              </div>
            </div>
          </div>
          <div style={{
            background: "rgba(255,255,255,0.15)",
            border: "1px solid rgba(255,255,255,0.3)",
            borderRadius: 8,
            padding: "8px 14px",
            fontSize: 12,
            fontWeight: 700,
            color: "#FFF",
          }}>
            {isBoysWarden ? "🏢 Assigned: Boys Hostel" : isGirlsWarden ? "🌸 Assigned: Girls Hostel" : "🏢 General Hostel Admin"}
          </div>
        </div>
      </div>

      {actionSuccessMsg && (
        <div style={{
          background: "#ECFDF5", border: "1.5px solid #10B981", borderRadius: 10,
          padding: "12px 18px", marginBottom: 18, color: "#065F46", fontSize: 13,
          fontWeight: 700, display: "flex", alignItems: "center", gap: 10,
          animation: "fadeIn 0.2s ease"
        }}>
          <span>✅</span>
          <span>{actionSuccessMsg}</span>
        </div>
      )}

      {/* ── Stats Row ── */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(130px,1fr))", gap: 12, marginBottom: 22 }}>
        {[
          { label: "Total Requests", value: stats.total,    color: maroonDark, icon: "📋" },
          { label: "Pending",        value: stats.pending,  color: "#722F37",  icon: "⏳" },
          { label: "Approved",       value: stats.approved, color: "#15803D",  icon: "✅" },
          { label: "Rejected",       value: stats.rejected, color: "#B91C1C",  icon: "❌" },
          { label: "Revenue",        value: `₹${totalRevenue.toLocaleString()}`, color: "#8B1E3F", icon: "💰" },
        ].map((st) => (
          <div key={st.label} style={{
            background: "#FFF", border: "1px solid #E2E8F0", borderRadius: 10,
            padding: "14px 16px", boxShadow: "0 1px 4px rgba(0,0,0,0.05)", textAlign: "center",
          }}>
            <div style={{ fontSize: 22 }}>{st.icon}</div>
            <div style={{ fontSize: 20, fontWeight: 900, color: st.color, marginTop: 4 }}>{st.value}</div>
            <div style={{ fontSize: 11, color: "#6B7280", marginTop: 2 }}>{st.label}</div>
          </div>
        ))}
      </div>

      {/* ── Filters ── */}
      <Card style={{ padding: 14, marginBottom: 16 }}>
        <div style={{ display: "flex", gap: 10, flexWrap: "wrap", alignItems: "center" }}>
          <input type="text" placeholder="🔍 Search booking or applicant..." value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={{ padding: "8px 14px", borderRadius: 8, border: "1px solid #CBD5E1", fontSize: 13, flex: "1 1 200px", background: "#FFF" }}
          />
          <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
            {["ALL","PENDING","APPROVED","REJECTED"].map((s) => (
              <button key={s} onClick={() => setFilterStatus(s)} style={{
                padding: "6px 12px", borderRadius: 6, border: "none", fontSize: 12, fontWeight: 700,
                cursor: "pointer",
                background: filterStatus === s ? maroonDark : "#E2E8F0",
                color: filterStatus === s ? "#FFF" : "#334155",
                transition: "all 0.15s ease",
              }}>
                {s === "ALL" ? "All Requests" : s.charAt(0) + s.slice(1).toLowerCase()}
              </button>
            ))}
          </div>
        </div>
      </Card>

      {/* ── Bookings List ── */}
      {filtered.length === 0 ? (
        <div style={{
          textAlign: "center", padding: "50px 20px", color: "#6B7280",
          background: "#F8FAFC", borderRadius: 12, border: "1px dashed #CBD5E1",
        }}>
          <div style={{ fontSize: 40, marginBottom: 10 }}>🏨</div>
          <div style={{ fontWeight: 700, fontSize: 15, color: maroonDark, marginBottom: 4 }}>No Hostel Requests Found</div>
          <div>No hostel booking requests match your current filters.</div>
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          {filtered.map((booking) => {
            const ws = booking.wardenStatus || (booking.status.includes("PENDING") ? "PENDING" : "APPROVED");
            const col = wardenStatusColor(ws);
            const isExpanded = expandedId === booking.id;
            const currentReply = replyDrafts[booking.id] !== undefined ? replyDrafts[booking.id] : (booking.adminReply || "");

            return (
              <div key={booking.id} style={{
                background: "#FFF", border: `1.5px solid ${col.border}`,
                borderRadius: 12, overflow: "hidden", boxShadow: "0 2px 8px rgba(0,0,0,0.05)",
              }}>
                {/* Card Header */}
                <div onClick={() => setExpandedId(isExpanded ? null : booking.id)}
                  style={{ padding: "14px 16px", borderLeft: `5px solid ${col.border}`, background: col.bg, cursor: "pointer" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                      <span style={{ fontSize: 24 }}>🏨</span>
                      <div>
                        <div style={{ fontWeight: 800, fontSize: 14, color: maroonDark, display: "flex", alignItems: "center", gap: 8 }}>
                          <span>{booking.title}</span>
                          {booking.hostelType === "GIRLS" ? (
                            <span style={{ fontSize: 10, fontWeight: 800, color: "#9D174D", background: "#FCE7F3", padding: "2px 8px", borderRadius: 12 }}>
                              🌸 Girls Hostel
                            </span>
                          ) : (
                            <span style={{ fontSize: 10, fontWeight: 800, color: "#065F46", background: "#D1FAE5", padding: "2px 8px", borderRadius: 12 }}>
                              🏢 Boys Hostel
                            </span>
                          )}
                        </div>
                        <div style={{ fontSize: 12, color: "#6B7280", marginTop: 2 }}>
                          👤 {booking.applicant} ({booking.applicantRole}) · 📅 {booking.date}
                        </div>
                      </div>
                    </div>
                    <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                      <span style={{ background: col.bg, border: `1px solid ${col.border}`, color: col.text, fontWeight: 800, fontSize: 11, padding: "3px 10px", borderRadius: 20 }}>
                        {ws}
                      </span>
                      <span style={{ fontSize: 18, color: "#64748B" }}>{isExpanded ? "▲" : "▼"}</span>
                    </div>
                  </div>
                  <div style={{ display: "flex", gap: 16, marginTop: 10, flexWrap: "wrap", alignItems: "center" }}>
                    <span style={{ fontSize: 12, color: "#334155", fontWeight: 600 }}>
                      🛏️ {booking.roomType || "Room not specified"}
                    </span>
                    <span style={{ fontSize: 12, color: "#8B1E3F", fontWeight: 700 }}>
                      💰 ₹{(booking.amount || 0).toLocaleString()}
                    </span>
                    <span style={{ fontSize: 12, fontWeight: 600, color: booking.paymentStatus === "PAID" ? "#15803D" : "#059669" }}>
                      {booking.paymentStatus === "PAID" ? "✅ Paid" : booking.paymentStatus === "REFUNDED" ? "↩️ Refunded" : "⚠️ Unpaid"}
                    </span>
                    <span style={{ fontSize: 12, color: "#6B7280" }}>ID: {booking.id}</span>
                    {booking.adminReply && (
                      <span style={{ fontSize: 11, color: "#1E40AF", background: "#EFF6FF", padding: "2px 8px", borderRadius: 4, fontWeight: 700 }}>
                        💬 Reply Sent
                      </span>
                    )}
                  </div>
                </div>

                {/* Expanded Details */}
                {isExpanded && (
                  <div style={{ padding: "16px 18px", borderTop: `1px solid ${col.border}` }}>
                    {/* Booking Details Grid */}
                    <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px,1fr))", gap: 10, marginBottom: 16 }}>
                      <div style={{ background: "#F8FAFC", border: "1px solid #E2E8F0", borderRadius: 8, padding: "10px 14px" }}>
                        <div style={{ fontSize: 11, color: "#6B7280", fontWeight: 600, marginBottom: 4 }}>APPLICANT</div>
                        <div style={{ fontWeight: 700, color: maroonDark }}>{booking.applicant}</div>
                        <div style={{ fontSize: 12, color: "#6B7280" }}>{booking.applicantRole}</div>
                      </div>
                      <div style={{ background: "#F8FAFC", border: "1px solid #E2E8F0", borderRadius: 8, padding: "10px 14px" }}>
                        <div style={{ fontSize: 11, color: "#6B7280", fontWeight: 600, marginBottom: 4 }}>HOSTEL WING & ROOM</div>
                        <div style={{ fontWeight: 700, color: maroonDark }}>
                          {booking.hostelType === "GIRLS" ? "🌸 Girls Hostel" : "🏢 Boys Hostel"}
                        </div>
                        <div style={{ fontSize: 12, color: "#6B7280" }}>
                          {booking.roomType && booking.roomType !== "N/A" ? booking.roomType : "Standard Room"}
                        </div>
                      </div>
                      <div style={{ background: "#F8FAFC", border: "1px solid #E2E8F0", borderRadius: 8, padding: "10px 14px" }}>
                        <div style={{ fontSize: 11, color: "#6B7280", fontWeight: 600, marginBottom: 4 }}>CHECK-IN DATE</div>
                        <div style={{ fontWeight: 700, color: maroonDark }}>{booking.date}</div>
                        <div style={{ fontSize: 12, color: "#6B7280" }}>Submitted: {booking.submittedAt}</div>
                      </div>
                      <div style={{ background: "#F8FAFC", border: "1px solid #E2E8F0", borderRadius: 8, padding: "10px 14px" }}>
                        <div style={{ fontSize: 11, color: "#6B7280", fontWeight: 600, marginBottom: 4 }}>BOOKING FEE</div>
                        <div style={{ fontWeight: 900, fontSize: 18, color: "#15803D" }}>₹{(booking.amount || 0).toLocaleString()}</div>
                        <div style={{ fontSize: 12, color: booking.paymentStatus === "PAID" ? "#15803D" : "#059669", fontWeight: 600 }}>
                          {booking.paymentStatus === "PAID" ? `✅ Paid via ${booking.paymentMethod}` : "⚠️ Payment Pending"}
                        </div>
                      </div>
                    </div>

                    {/* Purpose / Details */}
                    {booking.details && (
                      <div style={{
                        background: "#F8FAFC", border: "1px solid #E2E8F0", borderRadius: 8,
                        padding: "10px 14px", marginBottom: 14, fontSize: 13, color: "#475569",
                      }}>
                        <span style={{ fontWeight: 700, color: maroonDark }}>📝 Details: </span>{booking.details}
                      </div>
                    )}

                    {/* Previously Sent Reply Display */}
                    {booking.adminReply && (
                      <div style={{
                        background: "#EFF6FF", border: "1.5px solid #BFDBFE", borderRadius: 8,
                        padding: "10px 14px", marginBottom: 14, fontSize: 13, color: "#1E40AF",
                      }}>
                        <span style={{ fontWeight: 800 }}>💬 Currently Sent Warden Reply: </span>
                        <span>{booking.adminReply}</span>
                      </div>
                    )}

                    {/* Payment Txn Info */}
                    {booking.paymentStatus === "PAID" && booking.paymentTxnId && (
                      <div style={{
                        background: "#F0FDF4", border: "1px solid #BBF7D0", borderRadius: 8,
                        padding: "8px 14px", marginBottom: 14, fontSize: 12, color: "#15803D", fontWeight: 600,
                      }}>
                        ✅ Txn Ref: {booking.paymentTxnId} · Paid on: {booking.paidAt || "N/A"}
                      </div>
                    )}

                    {/* Reply Message Drafting Box */}
                    <div style={{
                      background: "#F8FAFC",
                      border: "1px solid #CBD5E1",
                      borderRadius: 8,
                      padding: "12px 14px",
                      marginBottom: 14,
                    }}>
                      <label style={{ fontSize: 12, fontWeight: 700, color: maroonDark, display: "block", marginBottom: 6 }}>
                        ✉️ Warden Reply Message / Room Allotment Note (Sent to Student):
                      </label>
                      <textarea
                        rows={2}
                        placeholder="e.g. Approved. Room 204 allocated on 2nd floor. Please collect keys from warden desk."
                        value={currentReply}
                        onChange={(e) => setReplyDrafts((prev) => ({ ...prev, [booking.id]: e.target.value }))}
                        style={{
                          width: "100%",
                          boxSizing: "border-box",
                          padding: "8px 12px",
                          borderRadius: 6,
                          border: "1px solid #CBD5E1",
                          fontSize: 13,
                          fontFamily: "inherit",
                          resize: "vertical",
                          background: "#FFF",
                        }}
                      />
                    </div>

                    {/* Warden Action Buttons */}
                    {ws === "PENDING" ? (
                      <div>
                        <div style={{ fontSize: 12, fontWeight: 700, color: maroonDark, marginBottom: 8 }}>
                          Warden Decision:
                        </div>
                        <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
                          <button
                            onClick={() => updateWardenStatus(booking.id, "APPROVED")}
                            style={{
                              padding: "10px 20px", borderRadius: 8, border: "none",
                              background: "linear-gradient(135deg, #16A34A, #15803D)", color: "#FFF", fontWeight: 800, fontSize: 13,
                              cursor: "pointer", boxShadow: "0 2px 8px rgba(22,163,74,0.3)",
                              transition: "all 0.15s ease", flex: 1, minWidth: 200,
                            }}
                          >
                            ✔ Accept & Send Reply
                          </button>
                          <button
                            onClick={() => updateWardenStatus(booking.id, "REJECTED")}
                            style={{
                              padding: "10px 20px", borderRadius: 8,
                              border: "2px solid #DC2626", background: "#FFF",
                              color: "#DC2626", fontWeight: 800, fontSize: 13,
                              cursor: "pointer", transition: "all 0.15s ease", flex: 1, minWidth: 200,
                            }}
                          >
                            ✖ Reject & Send Reply
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div>
                        <div style={{
                          background: ws === "APPROVED" ? "#F0FDF4" : "#FEF2F2",
                          border: `1px solid ${ws === "APPROVED" ? "#BBF7D0" : "#FECACA"}`,
                          borderRadius: 8, padding: "12px 16px", fontSize: 13, fontWeight: 700,
                          color: ws === "APPROVED" ? "#15803D" : "#B91C1C",
                          display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 10,
                        }}>
                          <span>
                            {ws === "APPROVED"
                              ? "✅ Room allocation approved. Student/faculty may check in on the scheduled date."
                              : "❌ Room allocation rejected. The applicant has been notified."}
                          </span>
                          <button
                            onClick={() => sendOnlyReply(booking.id)}
                            style={{
                              background: "#065F46",
                              color: "#FFF",
                              border: "none",
                              borderRadius: 6,
                              padding: "6px 14px",
                              fontSize: 12,
                              fontWeight: 700,
                              cursor: "pointer",
                            }}
                          >
                            💬 Update / Send Reply
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
