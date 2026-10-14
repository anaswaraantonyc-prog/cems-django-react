import { useState, useEffect } from "react";
import { maroonDark, gold, sage, brick } from "../theme";
import { FOOD_MENU } from "./BookingModule";

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
    items: { tea_normal: 100, coffee_normal: 50, juice_mixed: 30, snack_samosa: 100 },
    amount: 6950,
    submittedAt: "2026-08-15",
    adminReply: "Food and refreshments confirmed. Ready at Counter 1 by 12:30 PM.",
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
    items: { tea_no_sugar: 150, juice_orange: 50, snack_burger: 150 },
    amount: 8750,
    submittedAt: "2026-06-28",
    adminReply: "Event was cancelled by organizer.",
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
    items: { tea_normal: 20, coffee_bru: 15, snack_banana_fritter: 30 },
    amount: 1525,
    submittedAt: "2026-09-07",
    adminReply: "",
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
    items: { tea_normal: 200, coffee_normal: 100, juice_mango: 80, snack_sandwich: 200 },
    amount: 16700,
    submittedAt: "2026-09-08",
    adminReply: "",
    rejectionReason: "",
  },
];

const statusStyle = (s) => {
  if (s === "APPROVED") return { bg: "#F0FDF4", border: "#BBF7D0", text: "#15803D", dot: "#16A34A" };
  if (s === "REJECTED") return { bg: "#FEF2F2", border: "#FECACA", text: "#B91C1C", dot: "#DC2626" };
  return { bg: "#F8FAFC", border: "#E2E8F0", text: "#722F37", dot: "#059669" };
};

export default function CanteenModule({ userName = "" }) {
  const [orders, setOrders] = useState(INITIAL_CANTEEN_ORDERS);
  const [replyDrafts, setReplyDrafts] = useState({});
  const [actionSuccessMsg, setActionSuccessMsg] = useState("");

  const fetchOrders = () => {
    const token = localStorage.getItem("cems_access");
    let localOrders = [];
    try {
      const stored = localStorage.getItem("cems_canteen_orders");
      if (stored) localOrders = JSON.parse(stored);
    } catch (e) {}

    const headers = {
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      "X-Active-Role": "CANTEEN_STAFF"
    };

    fetch("/api/bookings/bookings/?booking_type=CANTEEN", { headers })
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        let serverList = [];
        if (data) {
          serverList = Array.isArray(data) ? data : data.results || [];
        }

        const map = new Map();
        // Base seed orders
        INITIAL_CANTEEN_ORDERS.forEach((o) => map.set(o.id, o));
        // Merge local storage orders
        localOrders.forEach((o) => map.set(o.id, { ...map.get(o.id), ...o }));

        // Merge server orders
        serverList.forEach((b) => {
          const id = `BK-${b.id}`;
          const existing = map.get(id) || {};
          let parsedItems = b.order_items || {};
          if (typeof parsedItems === "string") {
            try { parsedItems = JSON.parse(parsedItems); } catch (e) { parsedItems = {}; }
          }

          let calculatedStatus = "PENDING";
          if (b.status === "CONFIRMED" || b.status === "APPROVED") {
            calculatedStatus = "APPROVED";
          } else if (b.status === "CANCELLED") {
            calculatedStatus = "REJECTED";
          } else if (existing.canteenStatus === "APPROVED") {
            calculatedStatus = "APPROVED";
          }

          map.set(id, {
            ...existing,
            id,
            rawBackendId: b.id,
            title: b.title,
            applicant: b.user_full_name || (typeof b.user === "string" ? b.user : "Student"),
            applicantRole: b.user_role || "STUDENT",
            date: b.event_datetime ? b.event_datetime.split("T")[0] : (b.date || "2026-10-10"),
            canteenStatus: calculatedStatus,
            paymentStatus: b.payment_status || "PAID",
            paymentMethod: b.payment_method || "UPI",
            paymentTxnId: b.payment_txn_id || `UPI-2026-${b.id}`,
            items: parsedItems && Object.keys(parsedItems).length > 0 ? parsedItems : (existing.items || {}),
            details: b.details || existing.details || "",
            amount: Number(b.amount) || existing.amount || 0,
            submittedAt: b.created_at ? b.created_at.split("T")[0] : (existing.submittedAt || "2026-10-01"),
            adminReply: (b.admin_reply !== undefined && b.admin_reply !== "") ? b.admin_reply : (existing.adminReply || ""),
            rejectionReason: b.cancellation_reason || existing.rejectionReason || "",
          });
        });

        const merged = Array.from(map.values()).sort((a, b) => {
          // Sort pending first, then by date/id descending
          if (a.canteenStatus === "PENDING" && b.canteenStatus !== "PENDING") return -1;
          if (b.canteenStatus === "PENDING" && a.canteenStatus !== "PENDING") return 1;
          return String(b.id).localeCompare(String(a.id));
        });

        setOrders(merged);
        try {
          localStorage.setItem("cems_canteen_orders", JSON.stringify(merged));
        } catch (e) {}
      })
      .catch(() => {
        if (localOrders.length > 0) {
          setOrders(localOrders);
        }
      });
  };

  useEffect(() => {
    fetchOrders();

    // Auto-poll every 3.5 seconds so incoming orders appear in real time
    const interval = setInterval(fetchOrders, 3500);

    // Live cross-tab sync via BroadcastChannel
    let bc = null;
    if (window.BroadcastChannel) {
      bc = new BroadcastChannel("cems_canteen_channel");
      bc.onmessage = (ev) => {
        if (ev.data?.type === "CANTEEN_ORDER_CREATED" || ev.data?.type === "CANTEEN_STATUS_UPDATED") {
          fetchOrders();
        }
      };
    }

    const handleStorage = (e) => {
      if (e.key === "cems_canteen_orders") {
        fetchOrders();
      }
    };
    window.addEventListener("storage", handleStorage);

    return () => {
      clearInterval(interval);
      if (bc) bc.close();
      window.removeEventListener("storage", handleStorage);
    };
  }, []);

  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState("ALL");
  const [rejectReasons, setRejectReasons] = useState({});
  const [rejectingId, setRejectingId] = useState(null);

  const approveOrder = async (id, customReply = "") => {
    const targetOrder = orders.find((o) => o.id === id);
    const replyText = (customReply || replyDrafts[id] || "").trim() || "Order accepted! Food is being prepared at the counter.";

    // Optimistically update local state immediately for instant UI feedback
    setOrders((prev) => {
      const updated = prev.map((o) =>
        o.id === id ? { ...o, canteenStatus: "APPROVED", adminReply: replyText, rejectionReason: "" } : o
      );
      try {
        localStorage.setItem("cems_canteen_orders", JSON.stringify(updated));
      } catch (e) {}
      return updated;
    });
    if (rejectingId === id) setRejectingId(null);

    const token = localStorage.getItem("cems_access");
    const headers = {
      "Content-Type": "application/json",
      "X-Active-Role": "CANTEEN_STAFF",
      ...(token ? { Authorization: `Bearer ${token}` } : {})
    };

    const payload = { 
      status: "CONFIRMED",
      admin_reply: replyText
    };

    let numericId = targetOrder?.rawBackendId;
    if (!numericId && id && !String(id).startsWith("BK-2026-")) {
      const raw = String(id).replace("BK-", "");
      if (!isNaN(raw) && Number(raw) > 0) {
        numericId = Number(raw);
      }
    }

    if (numericId) {
      try {
        const patchRes = await fetch(`/api/bookings/bookings/${numericId}/`, {
          method: "PATCH",
          headers,
          body: JSON.stringify(payload)
        });
        if (patchRes.ok) {
          console.log("Canteen order confirmed on backend for booking", numericId);
        } else {
          console.warn("Backend PATCH returned status:", patchRes.status);
        }
      } catch (e) {
        console.error("Error approving order on backend:", e);
      }
    }

    // Broadcast live across tabs so applicant's page updates instantly
    try {
      if (window.BroadcastChannel) {
        const bc = new BroadcastChannel("cems_canteen_channel");
        bc.postMessage({
          type: "CANTEEN_STATUS_UPDATED",
          orderId: id,
          status: "CONFIRMED",
          adminReply: replyText
        });
        bc.close();
      }
    } catch (e) {}

    setActionSuccessMsg(`✅ Order ${id} ACCEPTED! Acceptance confirmation and pickup notice sent to student.`);
    setTimeout(() => setActionSuccessMsg(""), 5000);
  };

  const openReject = (id) => {
    setRejectingId(id);
    if (!rejectReasons[id]) setRejectReasons((r) => ({ ...r, [id]: "" }));
  };

  const confirmReject = async (id) => {
    const reason = (rejectReasons[id] || "").trim() || "Declined by canteen staff.";
    const targetOrder = orders.find((o) => o.id === id);

    setOrders((prev) => {
      const updated = prev.map((o) =>
        o.id === id
          ? {
              ...o,
              canteenStatus: "REJECTED",
              rejectionReason: reason,
              adminReply: reason,
            }
          : o
      );
      try {
        localStorage.setItem("cems_canteen_orders", JSON.stringify(updated));
      } catch (e) {}
      return updated;
    });
    setRejectingId(null);

    const token = localStorage.getItem("cems_access");
    const headers = {
      "Content-Type": "application/json",
      "X-Active-Role": "CANTEEN_STAFF",
      ...(token ? { Authorization: `Bearer ${token}` } : {})
    };

    let numericId = targetOrder?.rawBackendId;
    if (!numericId && id && !String(id).startsWith("BK-2026-")) {
      const raw = String(id).replace("BK-", "");
      if (!isNaN(raw) && Number(raw) > 0) {
        numericId = Number(raw);
      }
    }

    if (numericId) {
      try {
        await fetch(`/api/bookings/bookings/${numericId}/`, {
          method: "PATCH",
          headers,
          body: JSON.stringify({
            status: "CANCELLED",
            cancellation_reason: reason,
            admin_reply: reason
          })
        });
      } catch (e) {
        console.error("Error rejecting order on backend:", e);
      }
    }

    try {
      if (window.BroadcastChannel) {
        const bc = new BroadcastChannel("cems_canteen_channel");
        bc.postMessage({
          type: "CANTEEN_STATUS_UPDATED",
          orderId: id,
          status: "CANCELLED",
          rejectionReason: reason,
          adminReply: reason
        });
        bc.close();
      }
    } catch (e) {}

    setActionSuccessMsg(`❌ Order ${id} rejected & notification sent.`);
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

    setOrders((prev) => {
      const updated = prev.map((o) => (o.id === id ? { ...o, adminReply: replyText } : o));
      try {
        localStorage.setItem("cems_canteen_orders", JSON.stringify(updated));
      } catch (e) {}
      return updated;
    });

    try {
      if (window.BroadcastChannel) {
        const bc = new BroadcastChannel("cems_canteen_channel");
        bc.postMessage({
          type: "CANTEEN_STATUS_UPDATED",
          orderId: id,
          adminReply: replyText
        });
        bc.close();
      }
    } catch (e) {}

    setActionSuccessMsg(`💬 Reply message for ${id} sent to student successfully.`);
    setTimeout(() => setActionSuccessMsg(""), 4000);
  };

  const resetOrder = async (id) => {
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
          body: JSON.stringify({ status: "PENDING_APPROVAL" })
        });
      } catch (e) {}
    }
    setOrders((prev) => {
      const updated = prev.map((o) => o.id === id ? { ...o, canteenStatus: "PENDING", rejectionReason: "" } : o);
      try {
        localStorage.setItem("cems_canteen_orders", JSON.stringify(updated));
      } catch (e) {}
      return updated;
    });

    try {
      if (window.BroadcastChannel) {
        const bc = new BroadcastChannel("cems_canteen_channel");
        bc.postMessage({
          type: "CANTEEN_STATUS_UPDATED",
          orderId: id,
          status: "PENDING"
        });
        bc.close();
      }
    } catch (e) {}
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
        background: "linear-gradient(135deg, #064E3B 0%, #059669 60%, #15803D 100%)",
        border: `1.5px solid ${gold}`, borderRadius: 14, padding: "20px 24px",
        marginBottom: 22, color: "#FFF", boxShadow: "0 6px 20px rgba(0,0,0,0.12)",
      }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 14 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
            <span style={{ fontSize: 38 }}>🍱</span>
            <div>
              <strong style={{ fontSize: 19, display: "block", color: gold }}>
                Canteen & Food Catering Dashboard {userName ? `— ${userName}` : ""}
              </strong>
              <div style={{ fontSize: 13, marginTop: 4, opacity: 0.9 }}>
                Review refreshment and food pre-order bookings, accept orders, and send pickup reply messages.
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
            🍽️ Role: Canteen Staff
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
      <div style={{
        display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(130px, 1fr))",
        gap: 12, marginBottom: 20,
      }}>
        {[
          { label: "Total Orders",   value: counts.all,      color: maroonDark, icon: "📋" },
          { label: "Pending",        value: counts.pending,  color: "#722F37",  icon: "⏳" },
          { label: "Approved",       value: counts.approved, color: "#15803D",  icon: "✅" },
          { label: "Rejected",       value: counts.rejected, color: "#B91C1C",  icon: "❌" },
          { label: "Total Revenue",  value: `₹${totalRevenue.toLocaleString()}`, color: "#059669", icon: "💰" },
        ].map((s) => (
          <div key={s.label} style={{
            background: "#FFF", border: "1px solid #E2E8F0", borderRadius: 10,
            padding: "14px 16px", textAlign: "center",
            boxShadow: "0 1px 4px rgba(0,0,0,0.05)",
          }}>
            <div style={{ fontSize: 22 }}>{s.icon}</div>
            <div style={{ fontSize: 20, fontWeight: 900, color: s.color, marginTop: 4 }}>{s.value}</div>
            <div style={{ fontSize: 11, color: "#6B7280", marginTop: 2 }}>{s.label}</div>
          </div>
        ))}
      </div>

      {/* ── Search & Filter Controls ── */}
      <div style={{
        background: "#FFF", border: "1px solid #E2E8F0", borderRadius: 10,
        padding: 14, marginBottom: 18,
        display: "flex", gap: 10, flexWrap: "wrap", alignItems: "center",
        boxShadow: "0 1px 4px rgba(0,0,0,0.04)",
      }}>
        <input
          type="text"
          placeholder="🔍 Search orders, applicants, or booking ID..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          style={{
            flex: "1 1 200px", padding: "8px 14px", borderRadius: 8,
            border: "1px solid #CBD5E1", fontSize: 13, background: "#FFF",
          }}
        />
        <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
          {[
            { id: "ALL",      label: `All (${counts.all})` },
            { id: "PENDING",  label: `Pending (${counts.pending})` },
            { id: "APPROVED", label: `Approved (${counts.approved})` },
            { id: "REJECTED", label: `Rejected (${counts.rejected})` },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setFilterStatus(tab.id)}
              style={{
                padding: "6px 14px", borderRadius: 7, border: "none",
                fontSize: 12, fontWeight: 700, cursor: "pointer",
                background: filterStatus === tab.id ? "#065F46" : "#F1F5F9",
                color: filterStatus === tab.id ? "#FFF" : "#334155",
                transition: "all 0.15s ease",
              }}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* ── Order Cards List ── */}
      {filtered.length === 0 ? (
        <div style={{
          textAlign: "center", padding: "50px 20px", color: "#6B7280",
          background: "#F8FAFC", borderRadius: 12, border: "1px dashed #CBD5E1",
        }}>
          <div style={{ fontSize: 40, marginBottom: 10 }}>🍱</div>
          <div style={{ fontWeight: 700, fontSize: 15, color: maroonDark, marginBottom: 4 }}>No Catering Orders Found</div>
          <div>No orders match your search or filter selection.</div>
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          {filtered.map((order) => {
            const cs = order.canteenStatus || "PENDING";
            const sty = statusStyle(cs);
            const isRejecting = rejectingId === order.id;
            const items = order.items || {};
            const totalQty = Object.values(items).reduce((s, q) => s + (Number(q) || 0), 0);
            const currentReply = replyDrafts[order.id] !== undefined ? replyDrafts[order.id] : (order.adminReply || "");

            return (
              <div
                key={order.id}
                style={{
                  background: "#FFF",
                  border: `1.5px solid ${sty.border}`,
                  borderRadius: 12,
                  boxShadow: "0 2px 8px rgba(0,0,0,0.06)",
                  overflow: "hidden",
                  transition: "box-shadow 0.15s ease",
                }}
              >
                {/* ── Header ── */}
                <div style={{
                  padding: "14px 18px",
                  background: sty.bg,
                  borderBottom: `1px solid ${sty.border}`,
                  display: "flex", justifyContent: "space-between", alignItems: "flex-start",
                  flexWrap: "wrap", gap: 10,
                }}>
                  <div>
                    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                      <span style={{
                        width: 8, height: 8, borderRadius: "50%",
                        background: sty.dot, display: "inline-block",
                      }} />
                      <span style={{ fontSize: 11, fontWeight: 700, color: "#64748B" }}>{order.id}</span>
                      <span style={{
                        fontSize: 11, fontWeight: 700,
                        background: sty.border, color: sty.text,
                        padding: "2px 8px", borderRadius: 20,
                      }}>
                        {cs}
                      </span>
                    </div>
                    <div style={{ fontWeight: 800, fontSize: 15, color: maroonDark, marginTop: 4 }}>
                      {order.title}
                    </div>
                    <div style={{ fontSize: 12, color: "#6B7280", marginTop: 2 }}>
                      👤 <strong>{order.applicant}</strong> ({order.applicantRole}) · 📅 Event Date: <strong>{order.date}</strong> · Submitted: {order.submittedAt}
                    </div>
                  </div>

                  <div style={{ textAlign: "right" }}>
                    <div style={{ fontWeight: 900, fontSize: 18, color: "#15803D" }}>
                      ₹{(order.amount || 0).toLocaleString()}
                    </div>
                    <div style={{
                      fontSize: 11, fontWeight: 700, marginTop: 2,
                      color: order.paymentStatus === "PAID" ? "#15803D" : "#B91C1C",
                    }}>
                      {order.paymentStatus === "PAID"
                        ? `✅ Paid via ${order.paymentMethod || "UPI"}`
                        : "⚠️ Payment Pending"}
                    </div>
                    {order.paymentTxnId && (
                      <div style={{ fontSize: 10, color: "#6B7280", marginTop: 1 }}>
                        Ref: {order.paymentTxnId}
                      </div>
                    )}
                  </div>
                </div>

                {/* ── Ordered Food Items Grid & Specification ── */}
                <div style={{ padding: "14px 18px", borderBottom: "1px solid #F1F5F9" }}>
                  <div style={{ fontSize: 12, fontWeight: 700, color: "#475569", marginBottom: 10 }}>
                    🛒 ORDERED MENU ITEMS {totalQty > 0 ? `(${totalQty} total items)` : ""}:
                  </div>

                  {Object.keys(items).length > 0 ? (
                    <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: 8 }}>
                      {Object.entries(items).filter(([_, q]) => Number(q) > 0).map(([itemId, qty]) => {
                        const m = FOOD_MENU.find((x) => x.id === itemId);
                        const name = m ? m.name : itemId.replace(/_/g, " ").replace(/\b\w/g, l => l.toUpperCase());
                        const icon = m ? m.icon : "🍱";
                        const price = m ? m.price : Math.round((order.amount || 0) / (totalQty || 1));
                        return (
                          <div key={itemId} style={{
                            background: "#F0FDF4",
                            border: "1.5px solid #BBF7D0",
                            borderRadius: 8, padding: "8px 12px",
                            display: "flex", justifyContent: "space-between", alignItems: "center",
                          }}>
                            <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                              <span style={{ fontSize: 20 }}>{icon}</span>
                              <div>
                                <div style={{ fontWeight: 800, fontSize: 12, color: maroonDark }}>{name}</div>
                                <div style={{ fontSize: 10, color: "#6B7280" }}>₹{price} each</div>
                              </div>
                            </div>
                            <div style={{ textAlign: "right" }}>
                              <div style={{ fontWeight: 900, fontSize: 13, color: "#15803D" }}>× {qty}</div>
                              <div style={{ fontSize: 10, color: "#475569" }}>₹{Number(qty) * price}</div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  ) : null}

                  {/* Order Details / Notes */}
                  {order.details && (
                    <div style={{
                      marginTop: Object.keys(items).length > 0 ? 10 : 0,
                      background: "#F8FAFC",
                      border: "1px solid #CBD5E1",
                      borderRadius: 8,
                      padding: "10px 14px",
                      fontSize: 12,
                      color: "#334155",
                      lineHeight: 1.5,
                    }}>
                      <strong style={{ color: "#065F46" }}>📋 Order Notes & Description: </strong>
                      <span>{order.details}</span>
                    </div>
                  )}

                  {/* Grand Total Bar */}
                  <div style={{
                    display: "flex", justifyContent: "space-between", alignItems: "center",
                    marginTop: 12, background: "#F8FAFC", border: `1px dashed ${gold}`,
                    borderRadius: 8, padding: "9px 14px", fontSize: 13,
                  }}>
                    <span style={{ color: "#475569" }}>Total Units: <strong style={{ color: maroonDark }}>{totalQty || 1}</strong></span>
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

                {/* ── Previously Sent Canteen Reply Callout ── */}
                {order.adminReply && (
                  <div style={{
                    margin: "0 18px", marginTop: 12,
                    background: "#EFF6FF", border: "1.5px solid #BFDBFE",
                    borderRadius: 8, padding: "10px 14px", fontSize: 13, color: "#1E40AF",
                  }}>
                    <span style={{ fontWeight: 800 }}>💬 Currently Sent Canteen Staff Reply: </span>
                    <span>{order.adminReply}</span>
                  </div>
                )}

                {/* ── Reply Message Drafting Box & Quick Suggestions ── */}
                <div style={{ margin: "14px 18px 0" }}>
                  <label style={{ fontSize: 12, fontWeight: 700, color: maroonDark, display: "block", marginBottom: 6 }}>
                    ✉️ Canteen Staff Pickup Notice / Reply Message (Sent to Student):
                  </label>
                  <textarea
                    rows={2}
                    placeholder="e.g. Order accepted! Your food will be ready for pickup at Counter 1 at 12:30 PM."
                    value={currentReply}
                    onChange={(e) => setReplyDrafts((prev) => ({ ...prev, [order.id]: e.target.value }))}
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
                  {/* Quick-add chips */}
                  <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginTop: 6 }}>
                    {[
                      "Ready at Counter 1 by 12:30 PM",
                      "Order confirmed! Food is being prepared",
                      "Pickup ready at Counter 2 in 15 mins",
                      "Freshly prepared — collect at Counter 1",
                    ].map((chip) => (
                      <button
                        key={chip}
                        type="button"
                        onClick={() => setReplyDrafts((prev) => ({ ...prev, [order.id]: chip }))}
                        style={{
                          fontSize: 11, padding: "4px 8px", borderRadius: 6,
                          border: "1px dashed #A7F3D0", background: "#F0FDF4",
                          color: "#065F46", cursor: "pointer", fontWeight: 600,
                        }}
                      >
                        + {chip}
                      </button>
                    ))}
                  </div>
                </div>

                {/* ── Action Buttons ── */}
                <div style={{ padding: "14px 18px" }}>
                  {cs === "PENDING" ? (
                    <div>
                      {/* Approve + Reject row */}
                      <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
                        {/* ACCEPT BUTTON */}
                        <button
                          onClick={() => approveOrder(order.id)}
                          style={{
                            flex: 1.5, minWidth: 170,
                            padding: "12px 22px", borderRadius: 9, border: "none",
                            background: "linear-gradient(135deg, #16A34A 0%, #15803D 100%)",
                            color: "#FFF", fontWeight: 800, fontSize: 14,
                            cursor: "pointer",
                            boxShadow: "0 4px 12px rgba(22,163,74,0.35)",
                            display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
                            transition: "all 0.15s ease",
                          }}
                        >
                          <span style={{ fontSize: 16 }}>✔</span>
                          <span>Accept Order</span>
                        </button>

                        {/* REJECT BUTTON */}
                        <button
                          onClick={() => isRejecting ? setRejectingId(null) : openReject(order.id)}
                          style={{
                            flex: 1, minWidth: 130,
                            padding: "12px 18px", borderRadius: 9,
                            border: "2px solid #DC2626",
                            background: isRejecting ? "#FEF2F2" : "#FFF",
                            color: "#DC2626", fontWeight: 800, fontSize: 13,
                            cursor: "pointer",
                            display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
                            transition: "all 0.15s ease",
                          }}
                        >
                          <span>✖</span>
                          <span>{isRejecting ? "Cancel Reject" : "Reject Order"}</span>
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
                            ❌ Reason for Rejection <span style={{ fontWeight: 400, color: "#6B7280" }}>(sent to student)</span>
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
                              ✖ Confirm Rejection & Send
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  ) : (
                    /* Already actioned — show result + Reply Update option */
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
                      <div style={{ display: "flex", gap: 8 }}>
                        <button
                          onClick={() => sendOnlyReply(order.id)}
                          style={{
                            padding: "8px 16px", borderRadius: 7,
                            border: "none", background: "#065F46",
                            color: "#FFF", fontWeight: 700, fontSize: 12, cursor: "pointer",
                            whiteSpace: "nowrap",
                          }}
                        >
                          💬 Update / Send Reply
                        </button>
                        <button
                          onClick={() => resetOrder(order.id)}
                          style={{
                            padding: "8px 14px", borderRadius: 7,
                            border: "1px solid #CBD5E1", background: "#FFF",
                            color: "#6B7280", fontWeight: 700, fontSize: 12, cursor: "pointer",
                            whiteSpace: "nowrap",
                          }}
                        >
                          ↩ Reset to Pending
                        </button>
                      </div>
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
