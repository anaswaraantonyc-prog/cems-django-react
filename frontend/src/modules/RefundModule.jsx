import { useState, useEffect } from "react";
import { Card, Label, Field, Stamp } from "../components/Shared";
import { inputStyle, buttonStyle, refundPercentByHours, hoursUntil, maroonDark, gold, sage, brick } from "../theme";

const INITIAL_REFUND_REQUESTS = [
  {
    id: "REF-2026-101",
    title: "Freshers' Welcome Ceremony Catering Cancellation",
    user: "Rohan Gupta",
    userRole: "CLASS_REP",
    paidAmount: 2500,
    refundAmount: 2500,
    pct: 100,
    hoursAhead: 76,
    reason: "Event date rescheduled due to University semester exam clash.",
    status: "Pending Sign-off",
    submittedAt: "2026-09-02"
  },
  {
    id: "REF-2026-098",
    title: "Auditorium Evening Concert Booking Change",
    user: "Prof. Rajesh Kumar",
    userRole: "FACULTY",
    paidAmount: 3000,
    refundAmount: 1500,
    pct: 50,
    hoursAhead: 36,
    reason: "Chief guest requested virtual session; full auditorium hall not required.",
    status: "Approved",
    submittedAt: "2026-08-28"
  },
  {
    id: "REF-2026-085",
    title: "Hostel Guest House AC Suite Stay Cancellation",
    user: "Kavita Verma",
    userRole: "FACULTY",
    paidAmount: 4000,
    refundAmount: 4000,
    pct: 100,
    hoursAhead: 96,
    reason: "Visiting professor itinerary cancelled.",
    status: "Approved",
    submittedAt: "2026-08-14"
  },
  {
    id: "REF-2026-072",
    title: "Late Canteen Food Pre-Order Cancellation",
    user: "Ankit Patel",
    userRole: "STUDENT",
    paidAmount: 1200,
    refundAmount: 0,
    pct: 0,
    hoursAhead: 12,
    reason: "Cancelled less than 24 hours before scheduled time.",
    status: "Rejected",
    submittedAt: "2026-08-01"
  }
];

export default function RefundModule({ role = "student" }) {
  const [activeRole, setActiveRole] = useState(role);

  useEffect(() => {
    setActiveRole(role);
  }, [role]);

  // Compute current effective role and principal flag
  const propRole = String(role || "").toLowerCase();
  const stateRole = String(activeRole || "").toLowerCase();
  const isPrincipal =
    propRole === "principal" ||
    propRole === "admin" ||
    stateRole === "principal" ||
    stateRole === "admin";
  const isStudent = propRole === "student" || stateRole === "student";

  // Persistent state synced with localStorage
  const [refunds, setRefunds] = useState(() => {
    const saved = localStorage.getItem("cems_shared_refunds");
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      } catch (e) {}
    }
    return INITIAL_REFUND_REQUESTS;
  });

  const [activeTab, setActiveTab] = useState("ALL"); // "ALL", "PENDING", "APPROVED", "REJECTED"
  const [searchQuery, setSearchQuery] = useState("");
  const [eventDate, setEventDate] = useState("");
  const [amount, setAmount] = useState("");
  const [reason, setReason] = useState("");
  const [error, setError] = useState("");
  const [successMsg, setSuccessMsg] = useState("");
  const [request, setRequest] = useState(null);

  const updateRefunds = (newRefundsOrFn) => {
    setRefunds((prev) => {
      const next = typeof newRefundsOrFn === "function" ? newRefundsOrFn(prev) : newRefundsOrFn;
      localStorage.setItem("cems_shared_refunds", JSON.stringify(next));
      return next;
    });
  };

  // Fetch real backend refunds with Authentication header
  useEffect(() => {
    const token = localStorage.getItem("cems_access");
    const headers = token ? { Authorization: `Bearer ${token}`, "Content-Type": "application/json" } : {};

    fetch("http://localhost:8000/api/payments/refunds/", { headers })
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (!data) return;
        const rawList = Array.isArray(data) ? data : data.results || [];
        if (rawList.length > 0) {
          const formatted = rawList.map((r) => ({
            id: `REF-${r.id}`,
            title: r.booking_title || "Cancelled Booking Refund",
            user: r.requested_by || "Applicant",
            userRole: "STUDENT",
            paidAmount: Number(r.original_amount || 2000),
            refundAmount: Number(r.refund_amount || 2000),
            pct: Number(r.refund_percentage || 100),
            hoursAhead: 48,
            reason: r.reason || "Refund requested on booking cancellation.",
            status: r.status === "PENDING" ? "Pending Sign-off" : r.status === "SETTLED" ? "Approved" : r.status === "REJECTED" ? "Rejected" : r.status,
            submittedAt: r.created_at ? r.created_at.split("T")[0] : "2026-09-01"
          }));

          updateRefunds((prev) => {
            const existingIds = new Set(prev.map((item) => item.id));
            const newItems = formatted.filter((item) => !existingIds.has(item.id));
            return [...newItems, ...prev];
          });
        }
      })
      .catch(() => {});
  }, []);

  const submit = (e) => {
    e.preventDefault();
    setError("");
    setSuccessMsg("");

    if (!amount || Number(amount) <= 0) {
      setError("⚠️ Please enter a valid amount paid (greater than ₹0).");
      return;
    }

    if (!reason || !reason.trim()) {
      setError("⚠️ Please enter a reason in the refund description box.");
      return;
    }

    let hrs = 72;
    if (eventDate) {
      hrs = hoursUntil(eventDate);
    }
    const pct = refundPercentByHours(hrs);
    const owed = (Number(amount) * pct) / 100;

    const newReq = {
      id: `REF-2026-${Math.floor(100 + Math.random() * 900)}`,
      title: "Cancelled Event Booking Refund",
      user: isStudent ? "Student (Roll: 22CS045)" : propRole === "faculty" ? "Faculty Member" : propRole === "class_rep" ? "Class Representative" : propRole.toUpperCase(),
      userRole: propRole.toUpperCase(),
      paidAmount: Number(amount),
      refundAmount: owed,
      pct,
      hoursAhead: hrs,
      reason: reason.trim(),
      status: "Pending Sign-off",
      submittedAt: new Date().toISOString().split("T")[0]
    };

    updateRefunds((prev) => [newReq, ...prev]);
    setRequest(newReq);
    setSuccessMsg(`✅ Refund request of ₹${owed.toLocaleString("en-IN")} (${pct}% policy tier) submitted successfully! Awaiting Principal sign-off.`);
    setEventDate("");
    setAmount("");
    setReason("");
  };

  const handleSignOff = (id, newStatus) => {
    updateRefunds((prev) =>
      prev.map((item) => (item.id === id ? { ...item, status: newStatus } : item))
    );
  };

  // Filter refunds
  const filteredRefunds = refunds.filter((r) => {
    const matchesTab =
      activeTab === "ALL" ||
      (activeTab === "PENDING" && r.status.includes("Pending")) ||
      (activeTab === "APPROVED" && (r.status === "Approved" || r.status === "SETTLED")) ||
      (activeTab === "REJECTED" && (r.status === "Rejected" || r.status.includes("Denied")));

    const q = searchQuery.toLowerCase();
    const matchesSearch =
      !q ||
      r.id.toLowerCase().includes(q) ||
      (r.title && r.title.toLowerCase().includes(q)) ||
      (r.user && r.user.toLowerCase().includes(q)) ||
      r.reason.toLowerCase().includes(q);

    return matchesTab && matchesSearch;
  });

  const totalCount = refunds.length;
  const pendingCount = refunds.filter((r) => r.status.includes("Pending")).length;
  const approvedCount = refunds.filter((r) => r.status === "Approved" || r.status === "SETTLED").length;
  const rejectedCount = refunds.filter((r) => r.status === "Rejected" || r.status.includes("Denied")).length;

  return (
    <div style={{ maxWidth: 860, margin: "0 auto", paddingBottom: 40 }}>
      {/* Header Banner */}
      {isPrincipal ? (
        <div
          style={{
            background: `linear-gradient(135deg, ${maroonDark} 0%, #0B132B 100%)`,
            border: `1.5px solid ${gold}`,
            borderRadius: 12,
            padding: "16px 20px",
            marginBottom: 20,
            color: "#FFF",
            boxShadow: "0 4px 12px rgba(0,0,0,0.06)",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <span style={{ fontSize: 28 }}>🏛️</span>
            <div>
              <strong style={{ fontSize: 16, display: "block", color: gold }}>
                Principal Refund Approval & History Portal
              </strong>
              <div style={{ fontSize: 13, marginTop: 3, opacity: 0.9 }}>
                Review pending refund requests, approve or reject cancellations, and inspect full approval/rejection history logs.
              </div>
            </div>
          </div>
        </div>
      ) : (
        /* Hour Policy banner for Student, Faculty & Class Rep Roles */
        <div
          style={{
            background: "#F8FAFC",
            border: "1.5px solid #E2E8F0",
            borderRadius: 12,
            padding: "14px 18px",
            marginBottom: 20,
            fontSize: 13,
            color: "#78350F",
            boxShadow: "0 2px 8px rgba(0,0,0,0.03)",
          }}
        >
          <strong style={{ fontSize: 14, color: maroonDark }}>⏱️ Hour-Based Cancellation & Refund Ledger Policy:</strong>
          <ul style={{ margin: "6px 0 0 0", paddingLeft: 20, fontSize: 12 }}>
            <li><strong>&lt; 24 Hours:</strong> 0% Refund (No refund available)</li>
            <li><strong>24 to 47 Hours (48h tier):</strong> 50% Refund</li>
            <li><strong>72+ Hours:</strong> 100% Full Refund</li>
          </ul>
        </div>
      )}

      {/* ── Refund Submission Form (For Student, Faculty & Class Rep Roles) ── */}
      {!isPrincipal && (
        <Card style={{ marginBottom: 24, border: `2px solid ${gold}` }}>
          <Label>➕ Cancel Booking & Request Refund</Label>

          {error && (
            <div
              style={{
                background: "#FEF2F2",
                border: `1px solid ${brick}`,
                borderRadius: 8,
                padding: "10px 14px",
                marginBottom: 14,
                fontSize: 13,
                color: brick,
                fontWeight: 600,
              }}
            >
              {error}
            </div>
          )}

          {successMsg && (
            <div
              style={{
                background: "#F0FDF4",
                border: `1px solid ${sage}`,
                borderRadius: 8,
                padding: "10px 14px",
                marginBottom: 14,
                fontSize: 13,
                color: "#15803D",
                fontWeight: 600,
              }}
            >
              {successMsg}
            </div>
          )}

          <form onSubmit={submit}>
            <Field label="Original Event Date & Time">
              <input style={inputStyle} type="datetime-local" value={eventDate} onChange={(e) => setEventDate(e.target.value)} />
            </Field>
            <Field label="Amount Paid (₹)">
              <input
                style={inputStyle}
                type="number"
                min="1"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="2500"
              />
            </Field>
            <Field label="Refund Description Box">
              <textarea
                style={{ ...inputStyle, minHeight: 70, resize: "vertical" }}
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                placeholder="Reason for cancellation, attached to transaction ledger for Principal sign-off"
              />
            </Field>
            <button style={{ ...buttonStyle("primary"), width: "100%", marginTop: 8 }} type="submit">
              Confirm & Submit Refund Request
            </button>
          </form>

          {request && (
            <Card style={{ borderColor: sage, marginTop: 18, background: "#F6FBF7" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <div>
                  <div style={{ fontWeight: 800, fontSize: 16, color: maroonDark }}>
                    ₹{request.refundAmount.toLocaleString("en-IN")} Owed ({request.pct}%)
                  </div>
                  <div style={{ fontSize: 13, color: "#6B644C", marginTop: 4 }}>
                    Original Paid: ₹{request.paidAmount.toLocaleString("en-IN")} · Cancelled {request.hoursAhead} hours ahead
                  </div>
                </div>
                <Stamp text="Submitted" tone="brass" />
              </div>
            </Card>
          )}
        </Card>
      )}

      {/* Refund History & Approval Ledger Section */}
      <Card style={{ padding: 20 }}>
        {/* Filter Tabs */}
        <div style={{ display: "flex", gap: 10, borderBottom: "2px solid #E2E8F0", paddingBottom: 12, marginBottom: 16, flexWrap: "wrap" }}>
          <button
            onClick={() => setActiveTab("ALL")}
            style={{
              padding: "8px 16px",
              borderRadius: 8,
              border: "none",
              fontSize: 13,
              fontWeight: 700,
              cursor: "pointer",
              background: activeTab === "ALL" ? maroonDark : "#F3F4F6",
              color: activeTab === "ALL" ? "#FFF" : "#475569",
              transition: "all 0.15s ease",
            }}
          >
            📋 All Refunds ({totalCount})
          </button>

          <button
            onClick={() => setActiveTab("PENDING")}
            style={{
              padding: "8px 16px",
              borderRadius: 8,
              border: "none",
              fontSize: 13,
              fontWeight: 700,
              cursor: "pointer",
              background: activeTab === "PENDING" ? gold : "#F3F4F6",
              color: activeTab === "PENDING" ? "#FFF" : "#475569",
              transition: "all 0.15s ease",
            }}
          >
            ⏳ Pending Requests ({pendingCount})
          </button>

          <button
            onClick={() => setActiveTab("APPROVED")}
            style={{
              padding: "8px 16px",
              borderRadius: 8,
              border: "none",
              fontSize: 13,
              fontWeight: 700,
              cursor: "pointer",
              background: activeTab === "APPROVED" ? sage : "#F3F4F6",
              color: activeTab === "APPROVED" ? "#FFF" : "#475569",
              transition: "all 0.15s ease",
            }}
          >
            ✅ Approved History ({approvedCount})
          </button>

          <button
            onClick={() => setActiveTab("REJECTED")}
            style={{
              padding: "8px 16px",
              borderRadius: 8,
              border: "none",
              fontSize: 13,
              fontWeight: 700,
              cursor: "pointer",
              background: activeTab === "REJECTED" ? brick : "#F3F4F6",
              color: activeTab === "REJECTED" ? "#FFF" : "#475569",
              transition: "all 0.15s ease",
            }}
          >
            ❌ Rejected History ({rejectedCount})
          </button>
        </div>

        {/* Filter Controls Bar */}
        <div
          style={{
            display: "flex",
            justify: "space-between",
            alignItems: "center",
            background: "#F8FAFC",
            padding: 12,
            borderRadius: 10,
            border: "1px solid #EEEEEE",
            marginBottom: 16,
          }}
        >
          <div style={{ fontSize: 13, color: "#6B7280" }}>
            Displaying <strong>{filteredRefunds.length}</strong> refund record(s)
          </div>

          <input
            type="text"
            placeholder="🔍 Search refund ID, student, reason..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={{
              padding: "6px 12px",
              borderRadius: 6,
              border: "1px solid #CBD5E1",
              fontSize: 12,
              width: 240,
              background: "#FFF",
            }}
          />
        </div>

        {/* Refund List Cards */}
        {filteredRefunds.length === 0 ? (
          <div style={{ textAlign: "center", padding: "30px 20px", color: "#6B7280", fontSize: 14 }}>
            No refund records match your current filters.
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            {filteredRefunds.map((r) => (
              <div
                key={r.id}
                style={{
                  border: "1px solid #E2E8F0",
                  borderRadius: 10,
                  padding: 14,
                  background: r.status.includes("Pending") ? "#FFFDF5" : "#FFFFFF",
                  borderLeft: `4px solid ${
                    r.status === "Approved" || r.status === "SETTLED" ? sage : r.status.includes("Pending") ? gold : brick
                  }`,
                  boxShadow: "0 1px 3px rgba(0,0,0,0.03)",
                  display: "flex",
                  flexDirection: "column",
                  gap: 8,
                }}
              >
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                  <div>
                    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                      <span style={{ fontSize: 12, fontWeight: 800, color: "#6B7280", background: "#F3F4F6", padding: "2px 6px", borderRadius: 4 }}>
                        {r.id}
                      </span>
                      <span style={{ fontSize: 12, fontWeight: 700, color: maroonDark }}>
                        👤 {r.user} ({r.userRole})
                      </span>
                    </div>
                    <div style={{ fontWeight: 800, fontSize: 15, color: maroonDark, marginTop: 4 }}>
                      ₹{r.refundAmount.toLocaleString("en-IN")} Refund Owed ({r.pct}% Policy Tier)
                    </div>
                  </div>
                  <Stamp
                    text={r.status === "Approved" || r.status === "SETTLED" ? "Approved" : r.status.includes("Pending") ? "Pending Principal Review" : "Rejected"}
                    tone={r.status === "Approved" || r.status === "SETTLED" ? "sage" : r.status.includes("Pending") ? "brass" : "brick"}
                  />
                </div>

                <div style={{ fontSize: 13, color: "#475569", background: "#F8FAFC", padding: "8px 12px", borderRadius: 6 }}>
                  "{r.reason}"
                </div>

                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", fontSize: 12, color: "#6B7280", paddingTop: 4 }}>
                  <div>
                    Original Paid: <strong>₹{r.paidAmount.toLocaleString("en-IN")}</strong> · Cancelled {r.hoursAhead}h ahead of event
                  </div>
                  <div>📅 Submitted: {r.submittedAt}</div>
                </div>

                {/* Principal Approval / Rejection Action Buttons */}
                {isPrincipal && r.status.includes("Pending") && (
                  <div style={{ display: "flex", gap: 8, marginTop: 6, paddingTop: 8, borderTop: "1px dashed #E2E8F0", justifyContent: "flex-end" }}>
                    <button
                      onClick={() => handleSignOff(r.id, "Approved")}
                      style={{ ...buttonStyle("primary"), fontSize: 12, padding: "6px 14px", background: sage }}
                    >
                      ✔ Approve Refund
                    </button>
                    <button
                      onClick={() => handleSignOff(r.id, "Rejected")}
                      style={{ ...buttonStyle("secondary"), fontSize: 12, padding: "6px 14px", color: brick, borderColor: brick }}
                    >
                      ✖ Reject Refund
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </Card>
    </div>
  );
}
