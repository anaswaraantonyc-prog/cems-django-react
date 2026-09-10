import { useState } from "react";
import { maroonDark, gold, sage, brick } from "../theme";

const FOOD_MENU = [
  { id: "tea",    name: "Tea",    icon: "☕", price: 15 },
  { id: "coffee", name: "Coffee", icon: "☕", price: 25 },
  { id: "juice",  name: "Juice",  icon: "🧃", price: 40 },
  { id: "snacks", name: "Snacks", icon: "🥐", price: 30 },
];

const INITIAL_CANTEEN_ORDERS = [
  {
    id: "BK-2026-8712",
    title: "Department Alumni Meet Lunch & Refreshment Catering",
    applicant: "Dr. Meena Nair",
    applicantRole: "FACULTY",
    date: "2026-08-25",
    canteenStatus: "APPROVED",
    paymentStatus: "PAID",
    paymentMethod: "UPI",
    paymentTxnId: "UPI-2026-871299",
    items: { tea: 100, coffee: 50, juice: 30, snacks: 100 },
    amount: 6950,
    submittedAt: "2026-08-15",
    rejectionReason: "",
  },
  {
    id: "BK-2026-8521",
    title: "Freshers Welcome Ceremony Refreshment Order",
    applicant: "Rohan Gupta",
    applicantRole: "CLASS_REP",
    date: "2026-07-05",
    canteenStatus: "REJECTED",
    paymentStatus: "REFUNDED",
    paymentMethod: "UPI",
    paymentTxnId: "UPI-2026-852144",
    items: { tea: 150, coffee: 0, juice: 50, snacks: 150 },
    amount: 8750,
    submittedAt: "2026-06-28",
    rejectionReason: "Event was cancelled by organizer.",
  },
  {
    id: "BK-2026-9010",
    title: "Mid-Semester Faculty Meeting Refreshments",
    applicant: "Prof. Anand Raj",
    applicantRole: "FACULTY",
    date: "2026-09-12",
    canteenStatus: "PENDING",
    paymentStatus: "PAID",
    paymentMethod: "CARD",
    paymentTxnId: "CARD-2026-901044",
    items: { tea: 20, coffee: 15, juice: 0, snacks: 30 },
    amount: 1525,
    submittedAt: "2026-09-07",
    rejectionReason: "",
  },
  {
    id: "BK-2026-9021",
    title: "Student Council Annual Day Food Arrangement",
    applicant: "Priya Mehta",
    applicantRole: "CLASS_REP",
    date: "2026-09-20",
    canteenStatus: "PENDING",
    paymentStatus: "PAID",
    paymentMethod: "UPI",
    paymentTxnId: "UPI-2026-902188",
    items: { tea: 200, coffee: 100, juice: 80, snacks: 200 },
    amount: 16700,
    submittedAt: "2026-09-08",
    rejectionReason: "",
  },
];

const statusStyle = (s) => {
  if (s === "APPROVED") return { bg: "#F0FDF4", border: "#BBF7D0", text: "#15803D", dot: "#16A34A" };
  if (s === "REJECTED") return { bg: "#FEF2F2", border: "#FECACA", text: "#B91C1C", dot: "#DC2626" };
  return { bg: "#F8FAFC", border: "#E2E8F0", text: "#1E40AF", dot: "#3B82F6" };
};

export default function CanteenModule() {
  const [orders, setOrders] = useState(() => {
    try {
      const saved = localStorage.getItem("cems_shared_bookings");
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) {
          const canteenOrders = parsed
            .filter((b) => b.venue && (b.venue.toLowerCase().includes("canteen") || b.venue.toLowerCase().includes("food")))
            .map((b) => ({ ...b, canteenStatus: b.canteenStatus || "PENDING", rejectionReason: b.rejectionReason || "" }));
          if (canteenOrders.length > 0) return canteenOrders;
        }
      }
    } catch (e) {}
    return INITIAL_CANTEEN_ORDERS;
  });

  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState("ALL");
  // Track per-order rejection reason draft
  const [rejectReasons, setRejectReasons] = useState({});
  // Track which order has the reject reason box open
  const [rejectingId, setRejectingId] = useState(null);

  const approveOrder = (id) => {
    setOrders((prev) =>
      prev.map((o) => o.id === id ? { ...o, canteenStatus: "APPROVED", rejectionReason: "" } : o)
    );
    if (rejectingId === id) setRejectingId(null);
  };

  const openReject = (id) => {
    setRejectingId(id);
    if (!rejectReasons[id]) setRejectReasons((r) => ({ ...r, [id]: "" }));
  };

  const confirmReject = (id) => {
    const reason = (rejectReasons[id] || "").trim();
    setOrders((prev) =>
      prev.map((o) =>
        o.id === id ? { ...o, canteenStatus: "REJECTED", rejectionReason: reason || "No reason provided." } : o
      )
    );
    setRejectingId(null);
  };

  const resetOrder = (id) => {
    setOrders((prev) =>
      prev.map((o) => o.id === id ? { ...o, canteenStatus: "PENDING", rejectionReason: "" } : o)
    );
  };

  const filtered = orders.filter((o) => {
    const cs = o.canteenStatus || "PENDING";
    const matchStatus = filterStatus === "ALL" || cs === filterStatus;
    const q = search.toLowerCase();
    return (
      matchStatus &&
      (!q ||
        o.title.toLowerCase().includes(q) ||
        o.applicant.toLowerCase().includes(q) ||
        o.id.toLowerCase().includes(q))
    );
  });

  const counts = {
    all: orders.length,
    pending: orders.filter((o) => (o.canteenStatus || "PENDING") === "PENDING").length,
    approved: orders.filter((o) => o.canteenStatus === "APPROVED").length,
    rejected: orders.filter((o) => o.canteenStatus === "REJECTED").length,
  };
  const totalRevenue = orders
    .filter((o) => o.canteenStatus === "APPROVED" && o.paymentStatus === "PAID")
    .reduce((s, o) => s + (o.amount || 0), 0);

  return (
    <div style={{ maxWidth: 920, margin: "0 auto", paddingBottom: 48, fontFamily: "inherit" }}>

      {/* ── Banner ── */}
      <div style={{
        background: "linear-gradient(135deg, #1B4332 0%, #2D6A4F 55%, #40916C 100%)",
        border: `2px solid ${gold}`, borderRadius: 14, padding: "20px 26px",
        marginBottom: 22, color: "#FFF", boxShadow: "0 6px 24px rgba(0,0,0,0.14)",
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
          <span style={{ fontSize: 40 }}>🍱</span>
          <div>
            <strong style={{ fontSize: 19, display: "block", color: gold, letterSpacing: "0.01em" }}>
              Canteen — Food Order Review Dashboard
            </strong>
            <div style={{ fontSize: 13, marginTop: 5, opacity: 0.9 }}>
              Review all incoming food pre-orders. Approve or reject with a reason.
            </div>
          </div>
        </div>
      </div>

      {/* ── Stats ── */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(120px,1fr))", gap: 12, marginBottom: 22 }}>
        {[
          { label: "Total Orders",   value: counts.all,      color: maroonDark,  icon: "📋" },
          { label: "Pending Review", value: counts.pending,  color: "#1E40AF",   icon: "⏳" },
          { label: "Approved",       value: counts.approved, color: "#15803D",   icon: "✅" },
          { label: "Rejected",       value: counts.rejected, color: "#B91C1C",   icon: "❌" },
          { label: "Approved Revenue", value: `₹${totalRevenue.toLocaleString()}`, color: "#1D4ED8", icon: "💰" },
        ].map((st) => (
          <div key={st.label} style={{
            background: "#FFF", border: "1px solid #E2E8F0", borderRadius: 10,
            padding: "14px 12px", boxShadow: "0 1px 4px rgba(0,0,0,0.05)", textAlign: "center",
          }}>
            <div style={{ fontSize: 20 }}>{st.icon}</div>
            <div style={{ fontSize: 20, fontWeight: 900, color: st.color, marginTop: 4 }}>{st.value}</div>
            <div style={{ fontSize: 10, color: "#6B7280", marginTop: 2 }}>{st.label}</div>
          </div>
        ))}
      </div>

      {/* ── Filter Bar ── */}
      <div style={{
        background: "#FFF", border: "1px solid #E2E8F0", borderRadius: 10,
        padding: "12px 14px", marginBottom: 16,
        display: "flex", gap: 10, flexWrap: "wrap", alignItems: "center",
        boxShadow: "0 1px 4px rgba(0,0,0,0.04)",
      }}>
        <input
          type="text"
          placeholder="🔍 Search by order title, applicant or ID..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          style={{
            flex: "1 1 220px", padding: "8px 14px", borderRadius: 8,
            border: "1px solid #CBD5E1", fontSize: 13, background: "#F8FAFC",
          }}
        />
        <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
          {[
            { id: "ALL",      label: `All (${counts.all})` },
            { id: "PENDING",  label: `⏳ Pending (${counts.pending})` },
            { id: "APPROVED", label: `✅ Approved (${counts.approved})` },
            { id: "REJECTED", label: `❌ Rejected (${counts.rejected})` },
          ].map((f) => (
            <button key={f.id} onClick={() => setFilterStatus(f.id)} style={{
              padding: "7px 14px", borderRadius: 7, border: "none",
              fontSize: 12, fontWeight: 700, cursor: "pointer",
              background: filterStatus === f.id ? maroonDark : "#F3F4F6",
              color: filterStatus === f.id ? "#FFF" : "#334155",
              transition: "all 0.15s ease",
            }}>
              {f.label}
            </button>
          ))}
        </div>
      </div>

      {/* ── Order History List ── */}
      {filtered.length === 0 ? (
        <div style={{
          textAlign: "center", padding: "60px 20px", color: "#6B7280",
          background: "#F8FAFC", borderRadius: 12, border: "1.5px dashed #CBD5E1",
        }}>
          <div style={{ fontSize: 48, marginBottom: 12 }}>🍱</div>
          <div style={{ fontWeight: 800, fontSize: 16, color: maroonDark, marginBottom: 6 }}>No Orders Found</div>
          <div style={{ fontSize: 13 }}>No canteen food orders match your current filter.</div>
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          {filtered.map((order) => {
            const cs = order.canteenStatus || "PENDING";
            const ss = statusStyle(cs);
            const items = order.items || {};
            const totalQty = FOOD_MENU.reduce((s, m) => s + (items[m.id] || 0), 0);
            const isRejecting = rejectingId === order.id;

            return (
              <div key={order.id} style={{
                background: "#FFF",
                border: `1.5px solid ${ss.border}`,
                borderRadius: 14,
                overflow: "hidden",
                boxShadow: "0 2px 10px rgba(0,0,0,0.06)",
                transition: "box-shadow 0.2s ease",
              }}>

                {/* ── Order Header ── */}
                <div style={{
                  background: ss.bg,
                  borderLeft: `6px solid ${ss.dot}`,
                  padding: "14px 18px",
                }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: 10 }}>
                    {/* Left info */}
                    <div style={{ display: "flex", gap: 12, alignItems: "flex-start" }}>
                      <span style={{ fontSize: 28, lineHeight: 1 }}>🍱</span>
                      <div>
                        <div style={{ fontWeight: 800, fontSize: 15, color: maroonDark }}>{order.title}</div>
                        <div style={{ fontSize: 12, color: "#6B7280", marginTop: 3 }}>
                          👤 <strong>{order.applicant}</strong> &nbsp;·&nbsp;
                          🎓 {order.applicantRole} &nbsp;·&nbsp;
                          📅 {order.date} &nbsp;·&nbsp;
                          <span style={{ color: "#64748B" }}>ID: {order.id}</span>
                        </div>
                        <div style={{ display: "flex", gap: 12, marginTop: 7, flexWrap: "wrap" }}>
                          <span style={{ fontSize: 12, fontWeight: 700, color: "#334155" }}>📦 {totalQty} items</span>
                          <span style={{ fontSize: 12, fontWeight: 800, color: "#15803D" }}>💰 ₹{(order.amount || 0).toLocaleString()}</span>
                          <span style={{ fontSize: 12, fontWeight: 600, color: order.paymentStatus === "PAID" ? "#15803D" : "#3B82F6" }}>
                            {order.paymentStatus === "PAID" ? "✅ Paid" : order.paymentStatus === "REFUNDED" ? "↩️ Refunded" : "⚠️ Unpaid"}
                          </span>
                          <span style={{ fontSize: 11, color: "#64748B" }}>Submitted: {order.submittedAt}</span>
                        </div>
                      </div>
                    </div>

                    {/* Status Badge */}
                    <div style={{
                      background: ss.bg, border: `1.5px solid ${ss.border}`,
                      color: ss.text, fontWeight: 800, fontSize: 12,
                      padding: "5px 14px", borderRadius: 20,
                      display: "flex", alignItems: "center", gap: 6, whiteSpace: "nowrap",
                    }}>
                      <span style={{ width: 8, height: 8, borderRadius: "50%", background: ss.dot, display: "inline-block" }} />
                      {cs}
                    </div>
                  </div>
                </div>

                {/* ── Food Items Breakdown (always visible) ── */}
                <div style={{ padding: "14px 18px", borderBottom: "1px solid #F3F4F6" }}>
                  <div style={{ fontSize: 12, fontWeight: 700, color: "#6B7280", marginBottom: 10, textTransform: "uppercase", letterSpacing: "0.06em" }}>
                    Order Breakdown
                  </div>
                  <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 8 }}>
                    {FOOD_MENU.map((m) => {
                      const qty = items[m.id] || 0;
                      return (
                        <div key={m.id} style={{
                          background: qty > 0 ? "#F0FDF4" : "#F8FAFC",
                          border: `1px solid ${qty > 0 ? "#BBF7D0" : "#E2E8F0"}`,
                          borderRadius: 8, padding: "10px 12px",
                          opacity: qty === 0 ? 0.45 : 1,
                          textAlign: "center",
                        }}>
                          <div style={{ fontSize: 20 }}>{m.icon}</div>
                          <div style={{ fontWeight: 700, fontSize: 13, color: maroonDark, marginTop: 4 }}>{m.name}</div>
                          <div style={{ fontSize: 11, color: "#6B7280", marginTop: 2 }}>₹{m.price} / item</div>
                          {qty > 0 ? (
                            <>
                              <div style={{ fontWeight: 900, fontSize: 14, color: "#15803D", marginTop: 6 }}>{qty}</div>
                              <div style={{ fontSize: 11, color: "#475569" }}>= ₹{qty * m.price}</div>
                            </>
                          ) : (
                            <div style={{ fontSize: 12, color: "#64748B", marginTop: 6 }}>—</div>
                          )}
                        </div>
                      );
                    })}
                  </div>

                  {/* Grand Total */}
                  <div style={{
                    display: "flex", justifyContent: "space-between", alignItems: "center",
                    marginTop: 12, background: "#F8FAFC", border: `1px dashed ${gold}`,
                    borderRadius: 8, padding: "9px 14px", fontSize: 13,
                  }}>
                    <span style={{ color: "#475569" }}>Total Items: <strong style={{ color: maroonDark }}>{totalQty}</strong></span>
                    <span style={{ fontWeight: 900, fontSize: 15, color: "#15803D" }}>Grand Total: ₹{(order.amount || 0).toLocaleString()}</span>
                  </div>
                </div>

                {/* ── Rejection Reason (if rejected) ── */}
                {cs === "REJECTED" && order.rejectionReason && (
                  <div style={{
                    margin: "0 18px", marginTop: 12,
                    background: "#FEF2F2", border: "1px solid #FECACA",
                    borderRadius: 8, padding: "10px 14px", fontSize: 13, color: "#B91C1C",
                  }}>
                    <span style={{ fontWeight: 700 }}>❌ Rejection Reason: </span>{order.rejectionReason}
                  </div>
                )}

                {/* ── Action Buttons ── */}
                <div style={{ padding: "14px 18px" }}>
                  {cs === "PENDING" ? (
                    <div>
                      {/* Approve + Reject row */}
                      <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
                        {/* APPROVE */}
                        <button
                          onClick={() => approveOrder(order.id)}
                          style={{
                            flex: 1, minWidth: 140,
                            padding: "11px 20px", borderRadius: 9, border: "none",
                            background: "linear-gradient(135deg, #16A34A, #15803D)",
                            color: "#FFF", fontWeight: 800, fontSize: 13,
                            cursor: "pointer",
                            boxShadow: "0 3px 10px rgba(22,163,74,0.35)",
                            display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
                            transition: "transform 0.12s ease, box-shadow 0.12s ease",
                          }}
                          onMouseEnter={(e) => { e.currentTarget.style.transform = "translateY(-1px)"; e.currentTarget.style.boxShadow = "0 5px 14px rgba(22,163,74,0.4)"; }}
                          onMouseLeave={(e) => { e.currentTarget.style.transform = "translateY(0)"; e.currentTarget.style.boxShadow = "0 3px 10px rgba(22,163,74,0.35)"; }}
                        >
                          ✔ Approve Order
                        </button>

                        {/* REJECT */}
                        <button
                          onClick={() => isRejecting ? setRejectingId(null) : openReject(order.id)}
                          style={{
                            flex: 1, minWidth: 140,
                            padding: "11px 20px", borderRadius: 9,
                            border: "2px solid #DC2626",
                            background: isRejecting ? "#FEF2F2" : "#FFF",
                            color: "#DC2626", fontWeight: 800, fontSize: 13,
                            cursor: "pointer",
                            display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
                            transition: "all 0.15s ease",
                          }}
                        >
                          ✖ {isRejecting ? "Cancel Reject" : "Reject Order"}
                        </button>
                      </div>

                      {/* Rejection Reason Box — shown when Reject is clicked */}
                      {isRejecting && (
                        <div style={{
                          marginTop: 12,
                          background: "#FEF2F2",
                          border: "1.5px solid #FECACA",
                          borderRadius: 10,
                          padding: "14px 16px",
                          animation: "fadeIn 0.2s ease",
                        }}>
                          <label style={{ fontSize: 13, fontWeight: 700, color: "#B91C1C", display: "block", marginBottom: 8 }}>
                            ❌ Reason for Rejection <span style={{ fontWeight: 400, color: "#6B7280" }}>(optional but recommended)</span>
                          </label>
                          <textarea
                            rows={3}
                            placeholder="e.g. Order quantity exceeds canteen capacity, insufficient notice period, item unavailable..."
                            value={rejectReasons[order.id] || ""}
                            onChange={(e) =>
                              setRejectReasons((r) => ({ ...r, [order.id]: e.target.value }))
                            }
                            style={{
                              width: "100%", boxSizing: "border-box",
                              padding: "10px 12px", borderRadius: 8,
                              border: "1.5px solid #FECACA", fontSize: 13,
                              fontFamily: "inherit", resize: "vertical",
                              background: "#FFF", color: "#334155",
                              outline: "none",
                            }}
                          />
                          <div style={{ display: "flex", gap: 8, marginTop: 10, justifyContent: "flex-end" }}>
                            <button
                              onClick={() => setRejectingId(null)}
                              style={{
                                padding: "8px 16px", borderRadius: 7,
                                border: "1px solid #CBD5E1", background: "#FFF",
                                color: "#6B7280", fontWeight: 700, fontSize: 12, cursor: "pointer",
                              }}
                            >
                              Cancel
                            </button>
                            <button
                              onClick={() => confirmReject(order.id)}
                              style={{
                                padding: "8px 20px", borderRadius: 7,
                                border: "none",
                                background: "linear-gradient(135deg, #DC2626, #B91C1C)",
                                color: "#FFF", fontWeight: 800, fontSize: 12,
                                cursor: "pointer",
                                boxShadow: "0 2px 8px rgba(220,38,38,0.35)",
                              }}
                            >
                              ✖ Confirm Rejection
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  ) : (
                    /* Already actioned — show result + Reset option */
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 10 }}>
                      <div style={{
                        flex: 1,
                        background: cs === "APPROVED" ? "#F0FDF4" : "#FEF2F2",
                        border: `1px solid ${cs === "APPROVED" ? "#BBF7D0" : "#FECACA"}`,
                        borderRadius: 8, padding: "10px 14px", fontSize: 13, fontWeight: 700,
                        color: cs === "APPROVED" ? "#15803D" : "#B91C1C",
                      }}>
                        {cs === "APPROVED"
                          ? "✅ Order approved — canteen is preparing this order."
                          : `❌ Order rejected. ${order.rejectionReason ? `Reason: "${order.rejectionReason}"` : ""}`}
                      </div>
                      <button
                        onClick={() => resetOrder(order.id)}
                        style={{
                          padding: "8px 16px", borderRadius: 7,
                          border: "1px solid #CBD5E1", background: "#FFF",
                          color: "#6B7280", fontWeight: 700, fontSize: 12, cursor: "pointer",
                          whiteSpace: "nowrap",
                        }}
                      >
                        ↩ Reset to Pending
                      </button>
                    </div>
                  )}
                </div>

              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
