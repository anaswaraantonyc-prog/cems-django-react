import { useState } from "react";
import { Card } from "../components/Shared";
import { maroonDark, gold, sage, brick } from "../theme";

const INITIAL_HOSTEL_BOOKINGS = [
  {
    id: "BK-2026-8750",
    title: "Hostel Block A - Semester Accommodation (AC)",
    applicant: "Ankit Patel",
    applicantRole: "STUDENT",
    date: "2026-08-10",
    roomType: "AC Room 304",
    status: "CONFIRMED",
    wardenStatus: "APPROVED",
    paymentStatus: "PAID",
    paymentMethod: "UPI",
    paymentTxnId: "UPI-2026-875011",
    paidAt: "2026-08-01 03:45 PM",
    details: "Single occupancy AC room for odd semester 2026.",
    amount: 3500,
    submittedAt: "2026-08-01",
  },
  {
    id: "BK-2026-8640",
    title: "Hostel Guest House - Visiting Guest Lecturer Stay",
    applicant: "Kavita Verma",
    applicantRole: "FACULTY",
    date: "2026-07-20",
    roomType: "AC Suite 102",
    status: "COMPLETED",
    wardenStatus: "APPROVED",
    paymentStatus: "PAID",
    paymentMethod: "CARD",
    paymentTxnId: "CARD-2026-864022",
    paidAt: "2026-07-12 10:00 AM",
    details: "3-day accommodation for visiting guest speaker from IIT Madras.",
    amount: 3500,
    submittedAt: "2026-07-12",
  },
];

const wardenStatusColor = (s) => {
  if (s === "APPROVED")  return { bg: "#F0FDF4", border: "#86EFAC", text: "#166534" };
  if (s === "REJECTED")  return { bg: "#FEF2F2", border: "#FCA5A5", text: "#991B1B" };
  if (s === "PENDING")   return { bg: "#FFFBEB", border: "#FCD34D", text: "#92400E" };
  return { bg: "#F9FAFB", border: "#D1D5DB", text: "#374151" };
};

export default function WardenModule() {
  const [bookings, setBookings] = useState(() => {
    try {
      const saved = localStorage.getItem("cems_shared_bookings");
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) {
          const hostelBookings = parsed.filter(
            (b) => b.venue && b.venue.toLowerCase().includes("hostel")
          );
          if (hostelBookings.length > 0) return hostelBookings;
        }
      }
    } catch (e) {}
    return INITIAL_HOSTEL_BOOKINGS;
  });

  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState("ALL");
  const [expandedId, setExpandedId] = useState(null);

  const updateWardenStatus = (id, newStatus) => {
    setBookings((prev) =>
      prev.map((b) =>
        b.id === id
          ? { ...b, wardenStatus: newStatus, status: newStatus === "APPROVED" ? "CONFIRMED" : "CANCELLED" }
          : b
      )
    );
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
    <div style={{ maxWidth: 900, margin: "0 auto", paddingBottom: 40 }}>
      {/* ── Banner ── */}
      <div style={{
        background: "linear-gradient(135deg, #1E3A5F 0%, #2563EB 60%, #3B82F6 100%)",
        border: `1.5px solid ${gold}`, borderRadius: 14, padding: "20px 24px",
        marginBottom: 22, color: "#FFF", boxShadow: "0 6px 20px rgba(0,0,0,0.12)",
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
          <span style={{ fontSize: 36 }}>🏨</span>
          <div>
            <strong style={{ fontSize: 18, display: "block", color: gold }}>
              Hostel Warden — Accommodation Booking Dashboard
            </strong>
            <div style={{ fontSize: 13, marginTop: 4, opacity: 0.9 }}>
              Review and approve or reject hostel room booking requests from students and faculty.
            </div>
          </div>
        </div>
      </div>

      {/* ── Stats Row ── */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(130px,1fr))", gap: 12, marginBottom: 22 }}>
        {[
          { label: "Total Requests", value: stats.total,    color: maroonDark, icon: "📋" },
          { label: "Pending",        value: stats.pending,  color: "#92400E",  icon: "⏳" },
          { label: "Approved",       value: stats.approved, color: "#166534",  icon: "✅" },
          { label: "Rejected",       value: stats.rejected, color: "#991B1B",  icon: "❌" },
          { label: "Revenue",        value: `₹${totalRevenue.toLocaleString()}`, color: "#1D4ED8", icon: "💰" },
        ].map((st) => (
          <div key={st.label} style={{
            background: "#FFF", border: "1px solid #E5E7EB", borderRadius: 10,
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
            style={{ padding: "8px 14px", borderRadius: 8, border: "1px solid #D1D5DB", fontSize: 13, flex: "1 1 200px", background: "#FFF" }}
          />
          <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
            {["ALL","PENDING","APPROVED","REJECTED"].map((s) => (
              <button key={s} onClick={() => setFilterStatus(s)} style={{
                padding: "6px 12px", borderRadius: 6, border: "none", fontSize: 12, fontWeight: 700,
                cursor: "pointer",
                background: filterStatus === s ? maroonDark : "#E5E7EB",
                color: filterStatus === s ? "#FFF" : "#374151",
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
          background: "#FAFAFA", borderRadius: 12, border: "1px dashed #D1D5DB",
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
                        <div style={{ fontWeight: 800, fontSize: 14, color: maroonDark }}>{booking.title}</div>
                        <div style={{ fontSize: 12, color: "#6B7280", marginTop: 2 }}>
                          👤 {booking.applicant} ({booking.applicantRole}) · 📅 {booking.date}
                        </div>
                      </div>
                    </div>
                    <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                      <span style={{ background: col.bg, border: `1px solid ${col.border}`, color: col.text, fontWeight: 800, fontSize: 11, padding: "3px 10px", borderRadius: 20 }}>
                        {ws}
                      </span>
                      <span style={{ fontSize: 18, color: "#9CA3AF" }}>{isExpanded ? "▲" : "▼"}</span>
                    </div>
                  </div>
                  <div style={{ display: "flex", gap: 16, marginTop: 10, flexWrap: "wrap" }}>
                    <span style={{ fontSize: 12, color: "#374151", fontWeight: 600 }}>
                      🛏️ {booking.roomType || "Room not specified"}
                    </span>
                    <span style={{ fontSize: 12, color: "#1D4ED8", fontWeight: 700 }}>
                      💰 ₹{(booking.amount || 0).toLocaleString()}
                    </span>
                    <span style={{ fontSize: 12, fontWeight: 600, color: booking.paymentStatus === "PAID" ? "#166534" : "#D97706" }}>
                      {booking.paymentStatus === "PAID" ? "✅ Paid" : booking.paymentStatus === "REFUNDED" ? "↩️ Refunded" : "⚠️ Unpaid"}
                    </span>
                    <span style={{ fontSize: 12, color: "#6B7280" }}>ID: {booking.id}</span>
                  </div>
                </div>

                {/* Expanded Details */}
                {isExpanded && (
                  <div style={{ padding: "16px 18px", borderTop: `1px solid ${col.border}` }}>
                    {/* Booking Details Grid */}
                    <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px,1fr))", gap: 10, marginBottom: 16 }}>
                      <div style={{ background: "#F9FAFB", border: "1px solid #E5E7EB", borderRadius: 8, padding: "10px 14px" }}>
                        <div style={{ fontSize: 11, color: "#6B7280", fontWeight: 600, marginBottom: 4 }}>APPLICANT</div>
                        <div style={{ fontWeight: 700, color: maroonDark }}>{booking.applicant}</div>
                        <div style={{ fontSize: 12, color: "#6B7280" }}>{booking.applicantRole}</div>
                      </div>
                      <div style={{ background: "#F9FAFB", border: "1px solid #E5E7EB", borderRadius: 8, padding: "10px 14px" }}>
                        <div style={{ fontSize: 11, color: "#6B7280", fontWeight: 600, marginBottom: 4 }}>ROOM TYPE</div>
                        <div style={{ fontWeight: 700, color: maroonDark }}>
                          {booking.roomType && booking.roomType !== "N/A" ? booking.roomType : "Not specified"}
                        </div>
                        <div style={{ fontSize: 12, color: "#6B7280" }}>
                          {booking.roomType && booking.roomType.toLowerCase().includes("ac") ? "Air Conditioned" : "Non-AC"}
                        </div>
                      </div>
                      <div style={{ background: "#F9FAFB", border: "1px solid #E5E7EB", borderRadius: 8, padding: "10px 14px" }}>
                        <div style={{ fontSize: 11, color: "#6B7280", fontWeight: 600, marginBottom: 4 }}>CHECK-IN DATE</div>
                        <div style={{ fontWeight: 700, color: maroonDark }}>{booking.date}</div>
                        <div style={{ fontSize: 12, color: "#6B7280" }}>Submitted: {booking.submittedAt}</div>
                      </div>
                      <div style={{ background: "#F9FAFB", border: "1px solid #E5E7EB", borderRadius: 8, padding: "10px 14px" }}>
                        <div style={{ fontSize: 11, color: "#6B7280", fontWeight: 600, marginBottom: 4 }}>BOOKING FEE</div>
                        <div style={{ fontWeight: 900, fontSize: 18, color: "#166534" }}>₹{(booking.amount || 0).toLocaleString()}</div>
                        <div style={{ fontSize: 12, color: booking.paymentStatus === "PAID" ? "#166534" : "#D97706", fontWeight: 600 }}>
                          {booking.paymentStatus === "PAID" ? `✅ Paid via ${booking.paymentMethod}` : "⚠️ Payment Pending"}
                        </div>
                      </div>
                    </div>

                    {/* Purpose / Details */}
                    {booking.details && (
                      <div style={{
                        background: "#F9FAFB", border: "1px solid #E5E7EB", borderRadius: 8,
                        padding: "10px 14px", marginBottom: 14, fontSize: 13, color: "#4B5563",
                      }}>
                        <span style={{ fontWeight: 700, color: maroonDark }}>📝 Details: </span>{booking.details}
                      </div>
                    )}

                    {/* Payment Txn Info */}
                    {booking.paymentStatus === "PAID" && booking.paymentTxnId && (
                      <div style={{
                        background: "#F0FDF4", border: "1px solid #86EFAC", borderRadius: 8,
                        padding: "8px 14px", marginBottom: 14, fontSize: 12, color: "#166534", fontWeight: 600,
                      }}>
                        ✅ Txn Ref: {booking.paymentTxnId} · Paid on: {booking.paidAt || "N/A"}
                      </div>
                    )}

                    {/* Warden Action Buttons */}
                    {ws === "PENDING" ? (
                      <div>
                        <div style={{ fontSize: 12, fontWeight: 700, color: maroonDark, marginBottom: 8 }}>
                          Warden Decision:
                        </div>
                        <div style={{ display: "flex", gap: 10 }}>
                          <button onClick={() => updateWardenStatus(booking.id, "APPROVED")} style={{
                            padding: "10px 20px", borderRadius: 8, border: "none",
                            background: "#16A34A", color: "#FFF", fontWeight: 800, fontSize: 13,
                            cursor: "pointer", boxShadow: "0 2px 8px rgba(22,163,74,0.3)",
                            transition: "all 0.15s ease", flex: 1,
                          }}>
                            ✔ Approve & Allocate Room
                          </button>
                          <button onClick={() => updateWardenStatus(booking.id, "REJECTED")} style={{
                            padding: "10px 20px", borderRadius: 8,
                            border: "2px solid #DC2626", background: "#FFF",
                            color: "#DC2626", fontWeight: 800, fontSize: 13,
                            cursor: "pointer", transition: "all 0.15s ease", flex: 1,
                          }}>
                            ✖ Reject Request
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div style={{
                        background: ws === "APPROVED" ? "#F0FDF4" : "#FEF2F2",
                        border: `1px solid ${ws === "APPROVED" ? "#86EFAC" : "#FCA5A5"}`,
                        borderRadius: 8, padding: "12px 16px", fontSize: 13, fontWeight: 700,
                        color: ws === "APPROVED" ? "#166534" : "#991B1B",
                        display: "flex", alignItems: "center", gap: 8,
                      }}>
                        {ws === "APPROVED"
                          ? "✅ Room allocation approved. Student/faculty may check in on the scheduled date."
                          : "❌ Room allocation rejected. The applicant has been notified."}
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
