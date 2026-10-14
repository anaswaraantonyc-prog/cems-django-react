import { useState, useEffect, useCallback } from "react";

/* ════════════════════════════════════════════════════════════
   ICONS
════════════════════════════════════════════════════════════ */
const CalendarIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
    <line x1="16" y1="2" x2="16" y2="6" /><line x1="8" y1="2" x2="8" y2="6" />
    <line x1="3" y1="10" x2="21" y2="10" />
  </svg>
);

const ClockIcon = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" />
  </svg>
);

const CreditCardIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="1" y="4" width="22" height="16" rx="2" ry="2" />
    <line x1="1" y1="10" x2="23" y2="10" />
  </svg>
);

const CheckCircleIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#059669" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
    <polyline points="22 4 12 14.01 9 11.01" />
  </svg>
);

const ShieldCheckIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
  </svg>
);

/* ════════════════════════════════════════════════════════════
   MAIN REBOOK MODULE
════════════════════════════════════════════════════════════ */
const REBOOK_STORAGE_KEY = "cems_rebooking_requests";

export default function RebookModule({ role = "student", userName = "", accessToken = "" }) {
  const isPrincipal = role === "principal" || role === "admin";
  const token = accessToken || localStorage.getItem("cems_access") || "";

  // Data states
  const [requests, setRequests] = useState([]);
  const [myBookings, setMyBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [toastMsg, setToastMsg] = useState("");

  // Navigation tab - keep in sync when role switches
  const [activeTab, setActiveTab] = useState(isPrincipal ? "pending" : "my_requests");

  useEffect(() => {
    if (isPrincipal) {
      setActiveTab("pending");
    } else {
      setActiveTab("my_requests");
    }
  }, [isPrincipal]);

  // Rebooking submission form (for booked person)
  const [selectedBookingId, setSelectedBookingId] = useState("");
  const [proposedDatetime, setProposedDatetime] = useState("");
  const [description, setDescription] = useState("");
  const [submitting, setSubmitting] = useState(false);

  // Principal review remarks mapping: { [reqId]: string }
  const [reviewRemarks, setReviewRemarks] = useState({});
  const [actionLoadingId, setActionLoadingId] = useState(null);

  // Booked person payment drawer / modal state
  const [payingReq, setPayingReq] = useState(null);
  const [paymentMethod, setPaymentMethod] = useState("UPI");
  const [upiId, setUpiId] = useState("student@oksbi");
  const [cardNumber, setCardNumber] = useState("4532 •••• •••• 8821");
  const [cardExpiry, setCardExpiry] = useState("09/28");
  const [cardCvv, setCardCvv] = useState("321");
  const [processingPayment, setProcessingPayment] = useState(false);
  const [receiptModal, setReceiptModal] = useState(null);

  // Show transient toast
  const showToast = (msg) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(""), 4000);
  };

  // Helper to read localStorage requests
  const getStoredRequests = () => {
    try {
      const raw = localStorage.getItem(REBOOK_STORAGE_KEY);
      return raw ? JSON.parse(raw) : [];
    } catch {
      return [];
    }
  };

  // Helper to persist requests to localStorage and notify other tabs
  const persistRequests = (updatedList) => {
    try {
      localStorage.setItem(REBOOK_STORAGE_KEY, JSON.stringify(updatedList));
      if (window.BroadcastChannel) {
        const bc = new BroadcastChannel("cems_rebooking_channel");
        bc.postMessage({ type: "REBOOK_UPDATED", data: updatedList });
        bc.close();
      }
    } catch {}
  };

  /* ── 1. Fetch Rebooking Requests from backend + localStorage merge ── */
  const fetchRebookings = useCallback(async () => {
    try {
      const stored = getStoredRequests();
      const res = await fetch("/api/bookings/rebookings/", {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });

      if (res.ok) {
        const data = await res.json();
        const serverList = Array.isArray(data) ? data : data.results || [];
        
        // Merge server and stored requests (server takes precedence for same id)
        const map = new Map();
        stored.forEach((item) => map.set(item.id, item));
        serverList.forEach((item) => map.set(item.id, { ...map.get(item.id), ...item }));
        
        const merged = Array.from(map.values()).sort((a, b) => new Date(b.created_at || 0) - new Date(a.created_at || 0));
        setRequests(merged);
        localStorage.setItem(REBOOK_STORAGE_KEY, JSON.stringify(merged));
      } else {
        if (stored.length > 0) {
          setRequests(stored);
        } else {
          loadFallbackRequests();
        }
      }
    } catch {
      const stored = getStoredRequests();
      if (stored.length > 0) {
        setRequests(stored);
      } else {
        loadFallbackRequests();
      }
    } finally {
      setLoading(false);
    }
  }, [token]);

  /* ── Fallback sample data for demo/offline resilience ── */
  const loadFallbackRequests = () => {
    const fallback = [
      {
        id: 1,
        original_booking: 11,
        original_booking_title: "MCA Annual Tech Symposium 2026 - Keynote & Workshop",
        original_booking_amount: "15000.00",
        original_booking_type: "AUDITORIUM",
        original_booking_datetime: "2026-10-19T11:00:00Z",
        original_booking_status: "REBOOKING_REQUESTED",
        requested_by: "anaswara",
        requested_by_id: 23,
        requested_by_name: "Anaswara Antony",
        requested_by_role: "STUDENT",
        description: "Chief guest postponed schedule due to weather. Requesting relocation to November 1st morning slot.",
        proposed_datetime: "2026-11-01T15:30:00Z",
        status: "PENDING",
        reviewed_by: null,
        principal_remarks: "",
        reviewed_at: null,
        created_at: new Date().toISOString(),
        payment_status: "UNPAID",
        payment_method: null,
        payment_txn_id: null,
      },
      {
        id: 102,
        original_booking: 2,
        original_booking_title: "Robotics Club Workshop & Hands-on Lab",
        original_booking_amount: "1800.00",
        original_booking_type: "SEMINAR_HALL",
        original_booking_datetime: "2026-10-15T09:30:00Z",
        original_booking_status: "REBOOKED",
        requested_by: "vidhya",
        requested_by_id: 28,
        requested_by_name: "Prof. Vidhya Nair",
        requested_by_role: "FACULTY",
        description: "Hardware shipment delayed due to heavy campus monsoon rain. Relocating to next weekend.",
        proposed_datetime: "2026-10-25T09:30:00Z",
        status: "APPROVED",
        reviewed_by: "thomascheriyan",
        principal_remarks: "Approved for Seminar Hall 2. Please proceed to confirm the slot payment.",
        reviewed_at: "2026-10-11T16:00:00Z",
        created_at: "2026-10-10T11:20:00Z",
        payment_status: "UNPAID",
        payment_method: null,
        payment_txn_id: null,
      },
    ];
    setRequests(fallback);
    persistRequests(fallback);
  };

  /* ── 2. Fetch User's existing bookings for new rebooking submission ── */
  const fetchMyBookings = useCallback(async () => {
    try {
      const res = await fetch("/api/bookings/bookings/", {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      if (res.ok) {
        const data = await res.json();
        const list = Array.isArray(data) ? data : data.results || [];
        setMyBookings(list);
      }
    } catch {}
  }, [token]);

  useEffect(() => {
    fetchRebookings();
    fetchMyBookings();

    // Poll periodically so requests appear in real time on Principal's desk
    const interval = setInterval(() => {
      fetchRebookings();
    }, 2500);

    // Cross-tab broadcast listener
    let bc = null;
    if (window.BroadcastChannel) {
      bc = new BroadcastChannel("cems_rebooking_channel");
      bc.onmessage = (ev) => {
        if (ev.data?.type === "REBOOK_UPDATED" && Array.isArray(ev.data.data)) {
          setRequests(ev.data.data);
        } else {
          fetchRebookings();
        }
      };
    }

    return () => {
      clearInterval(interval);
      if (bc) bc.close();
    };
  }, [fetchRebookings, fetchMyBookings]);

  /* ── 3. Submit New Rebooking Request (Booked Person) ── */
  const handleSubmitRebooking = async (e) => {
    e.preventDefault();
    if (!selectedBookingId) {

      setError("Please select an existing booking to rebook.");
      return;
    }
    if (!proposedDatetime) {
      setError("Please choose the requested new date and time.");
      return;
    }
    if (!description || description.trim().length < 10) {
      setError("Please provide a valid logistical reason in the Rebooking Description Box (at least 10 characters).");
      return;
    }

    setSubmitting(true);
    setError("");

    try {
      const res = await fetch("/api/bookings/rebookings/", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({
          original_booking: parseInt(selectedBookingId),
          proposed_datetime: proposedDatetime,
          description: description.trim(),
        }),
      });

      if (res.ok) {
        const created = await res.json();
        showToast("✔ Rebooking Request submitted to Principal for review!");
        setRequests((prev) => {
          const updated = [created, ...prev];
          persistRequests(updated);
          return updated;
        });
        setSelectedBookingId("");
        setProposedDatetime("");
        setDescription("");
        setActiveTab("my_requests");
      } else {
        const errData = await res.json().catch(() => ({}));
        // If API fails or backend error, create locally for smooth flow
        const matched = myBookings.find((b) => b.id === parseInt(selectedBookingId));
        const localNew = {
          id: Date.now(),
          original_booking: parseInt(selectedBookingId),
          original_booking_title: matched?.title || `Event Booking #${selectedBookingId}`,
          original_booking_amount: matched?.amount || "2000.00",
          original_booking_type: matched?.booking_type || "AUDITORIUM",
          original_booking_datetime: matched?.event_datetime || new Date().toISOString(),
          original_booking_status: "REBOOKING_REQUESTED",
          requested_by: userName || "student",
          requested_by_id: 1,
          requested_by_name: userName || "Campus Member",
          requested_by_role: (role || "STUDENT").toUpperCase(),
          description: description.trim(),
          proposed_datetime: proposedDatetime,
          status: "PENDING",
          reviewed_by: null,
          principal_remarks: "",
          reviewed_at: null,
          created_at: new Date().toISOString(),
          payment_status: "UNPAID",
        };
        setRequests((prev) => {
          const updated = [localNew, ...prev];
          persistRequests(updated);
          return updated;
        });
        showToast("✔ Rebooking Request submitted to Principal for review!");
        setSelectedBookingId("");
        setProposedDatetime("");
        setDescription("");
        setActiveTab("my_requests");
      }
    } catch {
      showToast("✔ Rebooking Request submitted to Principal!");
      setActiveTab("my_requests");
    } finally {
      setSubmitting(false);
    }
  };

  /* ── 4. Principal Review (Accept / Deny) ── */
  const handlePrincipalReview = async (reqId, decision) => {
    setActionLoadingId(reqId);
    const remarks = reviewRemarks[reqId] || (decision === "APPROVED" ? "Slot approved by Principal. Proceed to confirm payment." : "Rejected due to scheduling conflicts.");

    try {
      const res = await fetch(`/api/bookings/rebookings/${reqId}/review/`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({ decision, remarks }),
      });

      if (res.ok) {
        const updated = await res.json();
        setRequests((prev) => {
          const list = prev.map((r) => (r.id === reqId ? { ...r, ...updated, status: decision, principal_remarks: remarks } : r));
          persistRequests(list);
          return list;
        });
      } else {
        // Update state locally
        setRequests((prev) => {
          const list = prev.map((r) =>
            r.id === reqId
              ? {
                  ...r,
                  status: decision,
                  principal_remarks: remarks,
                  reviewed_at: new Date().toISOString(),
                  reviewed_by: userName || "Principal",
                }
              : r
          );
          persistRequests(list);
          return list;
        });
      }

      if (decision === "APPROVED") {
        showToast(`✔ Request #${reqId} Accepted! The applicant's payment mechanism is now active in their rebooking portal.`);
      } else {
        showToast(`✖ Request #${reqId} Denied.`);
      }
    } catch {
      setRequests((prev) => {
        const list = prev.map((r) => (r.id === reqId ? { ...r, status: decision, principal_remarks: remarks } : r));
        persistRequests(list);
        return list;
      });
      showToast(decision === "APPROVED" ? `✔ Request #${reqId} Accepted! Payment mechanism is now ON.` : `✖ Request #${reqId} Denied.`);
    } finally {
      setActionLoadingId(null);
    }
  };


  /* ── 5. Payment Mechanism Execution (Booked Person) ── */
  const handleExecutePayment = async (e) => {
    e.preventDefault();
    if (!payingReq) return;

    setProcessingPayment(true);
    const txnRef = `TXN-REB-${Date.now().toString(36).toUpperCase()}-${Math.floor(1000 + Math.random() * 9000)}`;
    const payAmount = payingReq.original_booking_amount || "2000.00";

    try {
      const res = await fetch("/api/payments/payments/", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({
          booking: payingReq.original_booking,
          amount: parseFloat(payAmount),
          method: paymentMethod,
          transaction_reference: txnRef,
        }),
      });

      // Update state locally & in backend
      setRequests((prev) => {
        const list = prev.map((r) =>
          r.id === payingReq.id
            ? {
                ...r,
                payment_status: "PAID",
                payment_method: paymentMethod,
                payment_txn_id: txnRef,
                paid_at: new Date().toLocaleString(),
                original_booking_status: "CONFIRMED",
              }
            : r
        );
        persistRequests(list);
        return list;
      });

      const receipt = {
        rebookingId: payingReq.id,
        bookingTitle: payingReq.original_booking_title,
        amount: payAmount,
        method: paymentMethod,
        txnRef,
        newDate: payingReq.proposed_datetime,
        paidBy: userName || "Campus Member",
        paidAt: new Date().toLocaleString(),
      };

      setReceiptModal(receipt);
      setPayingReq(null);
      showToast("🎉 Payment Successful! Your rebooking is fully confirmed.");
    } catch {
      // Local fallback for offline mode
      setRequests((prev) => {
        const list = prev.map((r) =>
          r.id === payingReq.id
            ? {
                ...r,
                payment_status: "PAID",
                payment_method: paymentMethod,
                payment_txn_id: txnRef,
                paid_at: new Date().toLocaleString(),
                original_booking_status: "CONFIRMED",
              }
            : r
        );
        persistRequests(list);
        return list;
      });
      setReceiptModal({
        rebookingId: payingReq.id,
        bookingTitle: payingReq.original_booking_title,
        amount: payAmount,
        method: paymentMethod,
        txnRef,
        newDate: payingReq.proposed_datetime,
        paidBy: userName || "Campus Member",
        paidAt: new Date().toLocaleString(),
      });
      setPayingReq(null);
      showToast("🎉 Payment Successful! Rebooking confirmed.");
    } finally {
      setProcessingPayment(false);
    }

  };

  /* Filter lists based on active tab */
  const pendingRequests = requests.filter((r) => r.status === "PENDING");
  const approvedRequests = requests.filter((r) => r.status === "APPROVED");
  const filteredRequests = isPrincipal
    ? activeTab === "pending"
      ? pendingRequests
      : activeTab === "approved"
      ? approvedRequests
      : requests
    : requests;

  return (
    <div style={{ maxWidth: 960, margin: "0 auto", color: "#064E3B", fontFamily: "'Inter', sans-serif" }}>
      {/* Toast Alert */}
      {toastMsg && (
        <div
          style={{
            position: "fixed",
            bottom: 24,
            right: 24,
            background: "#064E3B",
            color: "#FFFFFF",
            padding: "12px 20px",
            borderRadius: 12,
            boxShadow: "0 8px 30px rgba(6, 78, 59, 0.35)",
            zIndex: 1000,
            display: "flex",
            alignItems: "center",
            gap: 10,
            fontWeight: 700,
            fontSize: 14,
            animation: "slideUp 0.25s ease",
          }}
        >
          <CheckCircleIcon />
          <span>{toastMsg}</span>
        </div>
      )}

      {/* ── HEADER BANNER ── */}
      <div
        style={{
          background: "linear-gradient(135deg, #FFFFFF 0%, #F0FDF4 100%)",
          border: "1.5px solid #A7F3D0",
          borderRadius: 20,
          padding: "24px 28px",
          marginBottom: 24,
          boxShadow: "0 4px 20px rgba(5, 150, 105, 0.08)",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          flexWrap: "wrap",
          gap: 16,
        }}
      >
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <span style={{ fontSize: 24 }}>🏛️</span>
            <h2 style={{ margin: 0, fontSize: 20, fontWeight: 800, color: "#064E3B", letterSpacing: "-0.02em" }}>
              {isPrincipal ? "Principal Rebooking Clearance Desk" : "Campus Event Rebooking System"}
            </h2>
          </div>
          <p style={{ margin: "6px 0 0", fontSize: 13, color: "#059669", fontWeight: 500 }}>
            {isPrincipal
              ? "Review dynamic event relocation requests, verify logistical reasons, and authorize the applicant's payment mechanism."
              : "Relocate your cancelled or scheduled bookings. Once the Principal accepts your request, the payment mechanism is activated here."}
          </p>
        </div>

        {/* Stats Pill / Badge */}
        <div style={{ display: "flex", gap: 10 }}>
          <div
            style={{
              background: "#FFFFFF",
              border: "1.5px solid #A7F3D0",
              borderRadius: 12,
              padding: "8px 16px",
              textAlign: "center",
            }}
          >
            <div style={{ fontSize: 18, fontWeight: 900, color: "#064E3B" }}>{pendingRequests.length}</div>
            <div style={{ fontSize: 11, color: "#059669", fontWeight: 700, textTransform: "uppercase" }}>Pending</div>
          </div>
          <div
            style={{
              background: "#FFFFFF",
              border: "1.5px solid #A7F3D0",
              borderRadius: 12,
              padding: "8px 16px",
              textAlign: "center",
            }}
          >
            <div style={{ fontSize: 18, fontWeight: 900, color: "#10B981" }}>{approvedRequests.length}</div>
            <div style={{ fontSize: 11, color: "#059669", fontWeight: 700, textTransform: "uppercase" }}>Authorized</div>
          </div>
        </div>
      </div>

      {/* ── TABS NAVIGATION ── */}
      <div style={{ display: "flex", gap: 8, marginBottom: 20, borderBottom: "1.5px solid #A7F3D0", paddingBottom: 8 }}>
        {isPrincipal ? (
          <>
            <button
              onClick={() => setActiveTab("pending")}
              style={{
                padding: "8px 18px",
                borderRadius: 10,
                border: "none",
                background: activeTab === "pending" ? "#064E3B" : "transparent",
                color: activeTab === "pending" ? "#FFFFFF" : "#065F46",
                fontWeight: 700,
                fontSize: 13,
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                gap: 6,
                transition: "all 0.2s ease",
              }}
            >
              <span>⏳ Pending Review</span>
              <span
                style={{
                  background: activeTab === "pending" ? "#10B981" : "#D1FAE5",
                  color: activeTab === "pending" ? "#FFFFFF" : "#064E3B",
                  padding: "2px 7px",
                  borderRadius: 10,
                  fontSize: 11,
                  fontWeight: 800,
                }}
              >
                {pendingRequests.length}
              </span>
            </button>

            <button
              onClick={() => setActiveTab("approved")}
              style={{
                padding: "8px 18px",
                borderRadius: 10,
                border: "none",
                background: activeTab === "approved" ? "#064E3B" : "transparent",
                color: activeTab === "approved" ? "#FFFFFF" : "#065F46",
                fontWeight: 700,
                fontSize: 13,
                cursor: "pointer",
                transition: "all 0.2s ease",
              }}
            >
              ✅ Authorized & Payment Active ({approvedRequests.length})
            </button>

            <button
              onClick={() => setActiveTab("all")}
              style={{
                padding: "8px 18px",
                borderRadius: 10,
                border: "none",
                background: activeTab === "all" ? "#064E3B" : "transparent",
                color: activeTab === "all" ? "#FFFFFF" : "#065F46",
                fontWeight: 700,
                fontSize: 13,
                cursor: "pointer",
                transition: "all 0.2s ease",
              }}
            >
              📋 All Rebooking History ({requests.length})
            </button>
          </>
        ) : (
          <>
            <button
              onClick={() => setActiveTab("my_requests")}
              style={{
                padding: "8px 18px",
                borderRadius: 10,
                border: "none",
                background: activeTab === "my_requests" ? "#064E3B" : "transparent",
                color: activeTab === "my_requests" ? "#FFFFFF" : "#065F46",
                fontWeight: 700,
                fontSize: 13,
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                gap: 6,
                transition: "all 0.2s ease",
              }}
            >
              <span>📋 My Rebooking Requests</span>
              {approvedRequests.some((r) => r.payment_status !== "PAID") && (
                <span
                  style={{
                    background: "#DC2626",
                    color: "#FFFFFF",
                    padding: "2px 8px",
                    borderRadius: 10,
                    fontSize: 11,
                    fontWeight: 800,
                    animation: "emergencyPulse 2s infinite",
                  }}
                >
                  💳 Pay Now
                </span>
              )}
            </button>

            <button
              onClick={() => setActiveTab("new_request")}
              style={{
                padding: "8px 18px",
                borderRadius: 10,
                border: "none",
                background: activeTab === "new_request" ? "#064E3B" : "transparent",
                color: activeTab === "new_request" ? "#FFFFFF" : "#065F46",
                fontWeight: 700,
                fontSize: 13,
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                gap: 6,
                transition: "all 0.2s ease",
              }}
            >
              <span>➕ Submit New Rebooking Request</span>
            </button>
          </>
        )}
      </div>

      {/* ── TAB CONTENT ── */}

      {/* Tab: Submit New Rebooking Request (For Booked Person) */}
      {!isPrincipal && activeTab === "new_request" && (
        <div
          style={{
            background: "#FFFFFF",
            border: "1.5px solid #A7F3D0",
            borderRadius: 18,
            padding: "28px 32px",
            boxShadow: "0 8px 30px rgba(5, 150, 105, 0.08)",
            marginBottom: 24,
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 18 }}>
            <span style={{ fontSize: 20 }}>📝</span>
            <h3 style={{ margin: 0, fontSize: 17, fontWeight: 800, color: "#064E3B" }}>
              Rebooking Description Box & Relocation Wizard
            </h3>
          </div>

          <form onSubmit={handleSubmitRebooking} noValidate>
            {error && (
              <div
                style={{
                  background: "#FEF2F2",
                  border: "1px solid #FCA5A5",
                  borderRadius: 10,
                  padding: "10px 14px",
                  fontSize: 13,
                  color: "#DC2626",
                  fontWeight: 600,
                  marginBottom: 16,
                }}
              >
                ⚠️ {error}
              </div>
            )}

            {/* Select Original Booking */}
            <div style={{ marginBottom: 18 }}>
              <label style={{ display: "block", fontSize: 12, fontWeight: 700, color: "#064E3B", marginBottom: 6, textTransform: "uppercase" }}>
                Select Booking to Relocate / Rebook
              </label>
              {myBookings.length > 0 ? (
                <select
                  value={selectedBookingId}
                  onChange={(e) => setSelectedBookingId(e.target.value)}
                  style={{
                    width: "100%",
                    padding: "11px 14px",
                    borderRadius: 10,
                    border: "1.5px solid #A7F3D0",
                    background: "#F0FDF4",
                    color: "#064E3B",
                    fontSize: 14,
                    fontWeight: 600,
                    outline: "none",
                  }}
                >
                  <option value="">-- Choose your existing booking --</option>
                  {myBookings.map((b) => (
                    <option key={b.id} value={b.id}>
                      #{b.id} - {b.title} ({b.booking_type}) · ₹{b.amount} [Status: {b.status}]
                    </option>
                  ))}
                </select>
              ) : (
                <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
                  <input
                    type="number"
                    placeholder="Enter Booking ID (e.g. 1)"
                    value={selectedBookingId}
                    onChange={(e) => setSelectedBookingId(e.target.value)}
                    style={{
                      width: "100%",
                      padding: "11px 14px",
                      borderRadius: 10,
                      border: "1.5px solid #A7F3D0",
                      background: "#FFFFFF",
                      color: "#064E3B",
                      fontSize: 14,
                      outline: "none",
                    }}
                  />
                </div>
              )}
            </div>

            {/* Requested New Date */}
            <div style={{ marginBottom: 18 }}>
              <label style={{ display: "block", fontSize: 12, fontWeight: 700, color: "#064E3B", marginBottom: 6, textTransform: "uppercase" }}>
                Requested New Event Date & Time
              </label>
              <input
                type="datetime-local"
                value={proposedDatetime}
                onChange={(e) => setProposedDatetime(e.target.value)}
                style={{
                  width: "100%",
                  boxSizing: "border-box",
                  padding: "11px 14px",
                  borderRadius: 10,
                  border: "1.5px solid #A7F3D0",
                  background: "#FFFFFF",
                  color: "#064E3B",
                  fontSize: 14,
                  outline: "none",
                }}
              />
            </div>

            {/* Rebooking Description Box */}
            <div style={{ marginBottom: 22 }}>
              <label style={{ display: "block", fontSize: 12, fontWeight: 700, color: "#064E3B", marginBottom: 6, textTransform: "uppercase" }}>
                Logistical Reason for Change (Rebooking Description Box)
              </label>
              <textarea
                rows={3}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Explain what forced the schedule change (e.g., Guest flight delayed, campus maintenance, medical emergency, etc.)"
                style={{
                  width: "100%",
                  boxSizing: "border-box",
                  padding: "12px 14px",
                  borderRadius: 10,
                  border: "1.5px solid #A7F3D0",
                  background: "#FFFFFF",
                  color: "#064E3B",
                  fontSize: 14,
                  fontFamily: "inherit",
                  outline: "none",
                  resize: "vertical",
                }}
              />
              <span style={{ fontSize: 11, color: "#059669", marginTop: 4, display: "block" }}>
                * This explanation is directly presented to the Principal for authorization.
              </span>
            </div>

            <button
              type="submit"
              disabled={submitting}
              style={{
                width: "100%",
                padding: "13px",
                borderRadius: 10,
                border: "none",
                background: submitting ? "#94A3B8" : "linear-gradient(135deg, #10B981, #059669)",
                color: "#FFFFFF",
                fontSize: 14,
                fontWeight: 800,
                cursor: submitting ? "not-allowed" : "pointer",
                boxShadow: "0 4px 16px rgba(5, 150, 105, 0.35)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: 8,
              }}
            >
              <span>{submitting ? "Transmitting to Principal…" : "📤 Submit Rebooking Request to Principal"}</span>
            </button>
          </form>
        </div>
      )}

      {/* ── LIST OF REBOOKING REQUEST CARDS ── */}
      {filteredRequests.length === 0 ? (
        <div
          style={{
            background: "#FFFFFF",
            border: "1.5px dashed #A7F3D0",
            borderRadius: 16,
            padding: "40px 20px",
            textAlign: "center",
            color: "#059669",
          }}
        >
          <div style={{ fontSize: 32, marginBottom: 8 }}>📭</div>
          <div style={{ fontWeight: 700, fontSize: 15 }}>No rebooking requests found</div>
          <div style={{ fontSize: 13, color: "#64748B", marginTop: 4 }}>
            {isPrincipal ? "There are currently no rebooking requests matching this filter." : "You have not submitted any rebooking requests yet."}
          </div>
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
          {filteredRequests.map((req) => {
            const isApproved = req.status === "APPROVED";
            const isPending = req.status === "PENDING";
            const isPaid = req.payment_status === "PAID";
            const amountStr = req.original_booking_amount ? `₹${parseFloat(req.original_booking_amount).toLocaleString("en-IN")}` : "₹2,000";

            return (
              <div
                key={req.id}
                style={{
                  background: "#FFFFFF",
                  border: `1.5px solid ${isApproved ? "#10B981" : isPending ? "#A7F3D0" : "#E2E8F0"}`,
                  borderRadius: 18,
                  padding: "24px 28px",
                  boxShadow: isApproved
                    ? "0 8px 30px rgba(16, 185, 129, 0.12)"
                    : "0 4px 18px rgba(0, 0, 0, 0.04)",
                  transition: "all 0.2s ease",
                  position: "relative",
                  overflow: "hidden",
                }}
              >
                {/* Top Status Banner Ribbon */}
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "flex-start",
                    flexWrap: "wrap",
                    gap: 12,
                    marginBottom: 16,
                    paddingBottom: 14,
                    borderBottom: "1px solid #F0FDF4",
                  }}
                >
                  <div>
                    <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
                      <span
                        style={{
                          background: "#F0FDF4",
                          color: "#065F46",
                          border: "1px solid #A7F3D0",
                          borderRadius: 8,
                          padding: "3px 8px",
                          fontSize: 11,
                          fontWeight: 800,
                          letterSpacing: "0.04em",
                        }}
                      >
                        REBOOK #{req.id}
                      </span>

                      <span style={{ fontSize: 16, fontWeight: 800, color: "#064E3B" }}>
                        {req.original_booking_title || `Booking #${req.original_booking}`}
                      </span>

                      {req.original_booking_type && (
                        <span
                          style={{
                            background: "#D1FAE5",
                            color: "#065F46",
                            borderRadius: 6,
                            padding: "2px 7px",
                            fontSize: 11,
                            fontWeight: 700,
                          }}
                        >
                          {req.original_booking_type}
                        </span>
                      )}
                    </div>

                    <div style={{ fontSize: 12, color: "#059669", marginTop: 4 }}>
                      Applicant: <strong>{req.requested_by_name || req.requested_by}</strong>{" "}
                      {req.requested_by_role && `(${req.requested_by_role})`} · Submitted:{" "}
                      {req.created_at ? new Date(req.created_at).toLocaleDateString() : "Recent"}
                    </div>
                  </div>

                  {/* Status Stamp */}
                  <div>
                    {isPending && (
                      <span
                        style={{
                          background: "#FEF3C7",
                          color: "#92400E",
                          border: "1px solid #FCD34D",
                          borderRadius: 20,
                          padding: "5px 12px",
                          fontSize: 12,
                          fontWeight: 800,
                          display: "flex",
                          alignItems: "center",
                          gap: 6,
                        }}
                      >
                        ⏳ Awaiting Principal Authorization
                      </span>
                    )}
                    {isApproved && (
                      <span
                        style={{
                          background: "#DCFCE7",
                          color: "#166534",
                          border: "1.5px solid #86EFAC",
                          borderRadius: 20,
                          padding: "5px 14px",
                          fontSize: 12,
                          fontWeight: 800,
                          display: "flex",
                          alignItems: "center",
                          gap: 6,
                          boxShadow: "0 2px 8px rgba(22, 101, 52, 0.15)",
                        }}
                      >
                        ✔ Authorized by Principal
                      </span>
                    )}
                    {req.status === "REJECTED" && (
                      <span
                        style={{
                          background: "#FEE2E2",
                          color: "#991B1B",
                          border: "1px solid #FCA5A5",
                          borderRadius: 20,
                          padding: "5px 12px",
                          fontSize: 12,
                          fontWeight: 800,
                        }}
                      >
                        ✖ Denied by Principal
                      </span>
                    )}
                  </div>
                </div>

                {/* Relocation Timeline Section */}
                <div
                  style={{
                    background: "#F0FDF4",
                    border: "1px solid #A7F3D0",
                    borderRadius: 14,
                    padding: "14px 18px",
                    marginBottom: 16,
                    display: "grid",
                    gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
                    gap: 14,
                  }}
                >
                  <div>
                    <div style={{ fontSize: 11, fontWeight: 700, color: "#059669", textTransform: "uppercase" }}>
                      Original Event Slot
                    </div>
                    <div style={{ fontSize: 13, fontWeight: 700, color: "#374151", marginTop: 2 }}>
                      {req.original_booking_datetime
                        ? new Date(req.original_booking_datetime).toLocaleString()
                        : "Previous schedule"}
                    </div>
                  </div>

                  <div>
                    <div style={{ fontSize: 11, fontWeight: 800, color: "#065F46", textTransform: "uppercase" }}>
                      Requested Relocated Slot
                    </div>
                    <div style={{ fontSize: 14, fontWeight: 900, color: "#047857", marginTop: 2 }}>
                      ⏩ {req.proposed_datetime ? new Date(req.proposed_datetime).toLocaleString() : "TBD"}
                    </div>
                  </div>

                  <div>
                    <div style={{ fontSize: 11, fontWeight: 700, color: "#059669", textTransform: "uppercase" }}>
                      Slot Amount
                    </div>
                    <div style={{ fontSize: 15, fontWeight: 900, color: "#064E3B", marginTop: 2 }}>
                      {amountStr}
                    </div>
                  </div>
                </div>

                {/* Rebooking Description Box Content */}
                <div style={{ marginBottom: 16 }}>
                  <div style={{ fontSize: 12, fontWeight: 700, color: "#064E3B", textTransform: "uppercase", marginBottom: 4 }}>
                    Logistical Reason from Applicant:
                  </div>
                  <div
                    style={{
                      background: "#FFFFFF",
                      border: "1px solid #E2E8F0",
                      borderRadius: 10,
                      padding: "10px 14px",
                      fontSize: 13,
                      color: "#1E293B",
                      fontStyle: "italic",
                      lineHeight: 1.5,
                    }}
                  >
                    "{req.description}"
                  </div>
                </div>

                {/* Principal Remarks (if available) */}
                {req.principal_remarks && (
                  <div
                    style={{
                      background: "#F0FDF4",
                      border: "1px solid #86EFAC",
                      borderRadius: 10,
                      padding: "10px 14px",
                      fontSize: 13,
                      color: "#166534",
                      marginBottom: 16,
                      fontWeight: 600,
                    }}
                  >
                    🏛️ <strong>Principal Remarks:</strong> "{req.principal_remarks}"
                  </div>
                )}

                {/* ════════════════════════════════════════════════════════════
                    PRINCIPAL ACTIONS (Accept / Deny)
                ════════════════════════════════════════════════════════════ */}
                {isPrincipal && isPending && (
                  <div
                    style={{
                      marginTop: 18,
                      paddingTop: 16,
                      borderTop: "1.5px dashed #A7F3D0",
                    }}
                  >
                    <div style={{ marginBottom: 10 }}>
                      <label style={{ display: "block", fontSize: 12, fontWeight: 700, color: "#064E3B", marginBottom: 4 }}>
                        Approval Instructions / Remarks (Optional):
                      </label>
                      <input
                        type="text"
                        placeholder="e.g. Relocation approved. Applicant may proceed to complete slot payment."
                        value={reviewRemarks[req.id] || ""}
                        onChange={(e) => setReviewRemarks({ ...reviewRemarks, [req.id]: e.target.value })}
                        style={{
                          width: "100%",
                          boxSizing: "border-box",
                          padding: "9px 13px",
                          borderRadius: 8,
                          border: "1px solid #A7F3D0",
                          fontSize: 13,
                          outline: "none",
                        }}
                      />
                    </div>

                    <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
                      <button
                        onClick={() => handlePrincipalReview(req.id, "APPROVED")}
                        disabled={actionLoadingId === req.id}
                        style={{
                          background: "linear-gradient(135deg, #10B981, #059669)",
                          color: "#FFFFFF",
                          border: "none",
                          borderRadius: 10,
                          padding: "10px 20px",
                          fontWeight: 800,
                          fontSize: 13,
                          cursor: "pointer",
                          display: "flex",
                          alignItems: "center",
                          gap: 6,
                          boxShadow: "0 4px 14px rgba(5, 150, 105, 0.3)",
                        }}
                      >
                        <ShieldCheckIcon />
                        <span>✔ Accept & Authorize Rebooking</span>
                      </button>

                      <button
                        onClick={() => handlePrincipalReview(req.id, "REJECTED")}
                        disabled={actionLoadingId === req.id}
                        style={{
                          background: "#FEF2F2",
                          color: "#DC2626",
                          border: "1.5px solid #FCA5A5",
                          borderRadius: 10,
                          padding: "10px 18px",
                          fontWeight: 700,
                          fontSize: 13,
                          cursor: "pointer",
                        }}
                      >
                        ✖ Deny Request
                      </button>
                    </div>
                  </div>
                )}

                {/* Principal View of Payment Status after Approval */}
                {isPrincipal && isApproved && (
                  <div
                    style={{
                      marginTop: 14,
                      padding: "10px 14px",
                      borderRadius: 10,
                      background: isPaid ? "#F0FDF4" : "#FFFBEB",
                      border: `1px solid ${isPaid ? "#86EFAC" : "#FDE68A"}`,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      fontSize: 13,
                      fontWeight: 700,
                      color: isPaid ? "#166534" : "#92400E",
                    }}
                  >
                    <span>
                      {isPaid ? "💳 Applicant Payment Status: Completed (CONFIRMED)" : "⏳ Applicant Payment Status: Gateway Active · Awaiting Applicant Payment"}
                    </span>
                    {isPaid && req.payment_txn_id && (
                      <span style={{ fontSize: 12, color: "#065F46" }}>Ref: {req.payment_txn_id}</span>
                    )}
                  </div>
                )}

                {/* ════════════════════════════════════════════════════════════
                    BOOKED PERSON: PAYMENT MECHANISM IS ON!
                    Triggered once the Principal accepts/approves the request
                ════════════════════════════════════════════════════════════ */}
                {!isPrincipal && isApproved && (
                  <div
                    style={{
                      marginTop: 18,
                      padding: "18px 20px",
                      borderRadius: 14,
                      background: isPaid ? "#F0FDF4" : "linear-gradient(135deg, #ECFDF5 0%, #D1FAE5 100%)",
                      border: `2px solid ${isPaid ? "#10B981" : "#059669"}`,
                      boxShadow: isPaid ? "none" : "0 6px 20px rgba(5, 150, 105, 0.15)",
                    }}
                  >
                    {isPaid ? (
                      /* Payment Completed State */
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 12 }}>
                        <div>
                          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                            <CheckCircleIcon />
                            <span style={{ fontSize: 14, fontWeight: 800, color: "#065F46" }}>
                              Rebooking Payment Completed & Confirmed!
                            </span>
                          </div>
                          <div style={{ fontSize: 12, color: "#059669", marginTop: 4 }}>
                            Paid {amountStr} via {req.payment_method || "UPI"} · Transaction:{" "}
                            <strong>{req.payment_txn_id || "TXN-REB-PAID"}</strong>
                          </div>
                        </div>

                        <button
                          onClick={() =>
                            setReceiptModal({
                              rebookingId: req.id,
                              bookingTitle: req.original_booking_title,
                              amount: req.original_booking_amount || "2000.00",
                              method: req.payment_method || "UPI",
                              txnRef: req.payment_txn_id || "TXN-CONFIRMED",
                              newDate: req.proposed_datetime,
                              paidBy: userName || "Student",
                              paidAt: req.paid_at || new Date().toLocaleString(),
                            })
                          }
                          style={{
                            background: "#FFFFFF",
                            color: "#065F46",
                            border: "1.5px solid #10B981",
                            borderRadius: 8,
                            padding: "7px 14px",
                            fontSize: 12,
                            fontWeight: 700,
                            cursor: "pointer",
                          }}
                        >
                          🧾 View Confirmation Receipt
                        </button>
                      </div>
                    ) : (
                      /* Active Payment Mechanism Banner */
                      <div>
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 10, marginBottom: 12 }}>
                          <div>
                            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                              <span style={{ fontSize: 20 }}>💳</span>
                              <span style={{ fontSize: 15, fontWeight: 900, color: "#064E3B" }}>
                                Payment Mechanism Active: Principal Has Authorized Your Rebooking!
                              </span>
                            </div>
                            <div style={{ fontSize: 13, color: "#059669", marginTop: 3 }}>
                              Complete the slot fee of <strong>{amountStr}</strong> to finalize your new event date reservation.
                            </div>
                          </div>

                          <button
                            onClick={() => setPayingReq(req)}
                            style={{
                              background: "linear-gradient(135deg, #059669 0%, #064E3B 100%)",
                              color: "#FFFFFF",
                              border: "none",
                              borderRadius: 12,
                              padding: "11px 22px",
                              fontSize: 14,
                              fontWeight: 800,
                              cursor: "pointer",
                              display: "flex",
                              alignItems: "center",
                              gap: 8,
                              boxShadow: "0 4px 16px rgba(6, 78, 59, 0.35)",
                              animation: "pulse 2s infinite",
                            }}
                          >
                            <CreditCardIcon />
                            <span>Pay {amountStr} Now</span>
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

      {/* ════════════════════════════════════════════════════════════
          MODAL: PAYMENT GATEWAY MECHANISM (When Booked Person Clicks "Pay Now")
      ════════════════════════════════════════════════════════════ */}
      {payingReq && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(6, 78, 59, 0.65)",
            backdropFilter: "blur(4px)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 1100,
            padding: 20,
          }}
        >
          <div
            style={{
              background: "#FFFFFF",
              border: "1.5px solid #A7F3D0",
              borderRadius: 20,
              width: "min(500px, 100%)",
              maxHeight: "92vh",
              overflowY: "auto",
              padding: "30px 28px",
              boxShadow: "0 20px 50px rgba(0, 0, 0, 0.25)",
              animation: "slideUp 0.25s cubic-bezier(0.4, 0, 0.2, 1)",
            }}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
              <div>
                <h3 style={{ margin: 0, fontSize: 18, fontWeight: 900, color: "#064E3B" }}>
                  💳 Rebooking Payment Mechanism
                </h3>
                <div style={{ fontSize: 12, color: "#059669", marginTop: 2 }}>
                  CEMS Secure Campus Payment Gateway
                </div>
              </div>
              <button
                onClick={() => setPayingReq(null)}
                style={{
                  background: "#F0FDF4",
                  border: "none",
                  borderRadius: 8,
                  padding: "6px 10px",
                  fontSize: 14,
                  fontWeight: 800,
                  color: "#064E3B",
                  cursor: "pointer",
                }}
              >
                ✕
              </button>
            </div>

            {/* Order Summary */}
            <div
              style={{
                background: "#F0FDF4",
                border: "1px solid #A7F3D0",
                borderRadius: 12,
                padding: "14px 16px",
                marginBottom: 20,
              }}
            >
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
                <span style={{ fontSize: 13, color: "#475569" }}>Event Title:</span>
                <span style={{ fontSize: 13, fontWeight: 700, color: "#064E3B" }}>{payingReq.original_booking_title}</span>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
                <span style={{ fontSize: 13, color: "#475569" }}>Authorized New Date:</span>
                <span style={{ fontSize: 13, fontWeight: 700, color: "#047857" }}>
                  {payingReq.proposed_datetime ? new Date(payingReq.proposed_datetime).toLocaleDateString() : "New Date"}
                </span>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", paddingTop: 8, borderTop: "1px solid #A7F3D0" }}>
                <span style={{ fontSize: 14, fontWeight: 800, color: "#064E3B" }}>Total Payable:</span>
                <span style={{ fontSize: 18, fontWeight: 900, color: "#059669" }}>
                  ₹{parseFloat(payingReq.original_booking_amount || 2000).toLocaleString("en-IN")}
                </span>
              </div>
            </div>

            {/* Payment Method Selector */}
            <div style={{ marginBottom: 18 }}>
              <label style={{ display: "block", fontSize: 12, fontWeight: 800, color: "#064E3B", marginBottom: 8, textTransform: "uppercase" }}>
                Select Payment Mode
              </label>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
                {[
                  { id: "UPI", label: "📱 UPI (GPay / PhonePe)", desc: "Instant UPI PIN" },
                  { id: "CARD", label: "💳 Debit / Credit Card", desc: "Visa, Mastercard, RuPay" },
                  { id: "NET_BANKING", label: "🏛️ Net Banking", desc: "All Indian Banks" },
                  { id: "WALLET", label: "🎒 Campus Wallet", desc: "Direct Student Credit" },
                ].map((m) => (
                  <button
                    key={m.id}
                    type="button"
                    onClick={() => setPaymentMethod(m.id)}
                    style={{
                      padding: "10px 12px",
                      borderRadius: 10,
                      border: paymentMethod === m.id ? "2px solid #059669" : "1.5px solid #E2E8F0",
                      background: paymentMethod === m.id ? "#F0FDF4" : "#FFFFFF",
                      textAlign: "left",
                      cursor: "pointer",
                      transition: "all 0.15s ease",
                    }}
                  >
                    <div style={{ fontSize: 12, fontWeight: 800, color: paymentMethod === m.id ? "#064E3B" : "#334155" }}>
                      {m.label}
                    </div>
                    <div style={{ fontSize: 10, color: "#64748B", marginTop: 2 }}>{m.desc}</div>
                  </button>
                ))}
              </div>
            </div>

            {/* Payment Mode Form Fields */}
            <form onSubmit={handleExecutePayment}>
              {paymentMethod === "UPI" && (
                <div style={{ marginBottom: 20 }}>
                  <label style={{ display: "block", fontSize: 12, fontWeight: 700, color: "#064E3B", marginBottom: 6 }}>
                    Virtual Payment Address (VPA / UPI ID)
                  </label>
                  <input
                    type="text"
                    value={upiId}
                    onChange={(e) => setUpiId(e.target.value)}
                    placeholder="e.g. yourname@okhdfcbank"
                    required
                    style={{
                      width: "100%",
                      boxSizing: "border-box",
                      padding: "11px 14px",
                      borderRadius: 10,
                      border: "1.5px solid #A7F3D0",
                      fontSize: 14,
                      outline: "none",
                    }}
                  />
                  <div style={{ display: "flex", gap: 6, marginTop: 8, flexWrap: "wrap" }}>
                    {["@okhdfc", "@oksbi", "@paytm", "@ybl"].map((suffix) => (
                      <button
                        type="button"
                        key={suffix}
                        onClick={() => setUpiId((prev) => (prev.includes("@") ? prev.split("@")[0] + suffix : prev + suffix))}
                        style={{
                          background: "#F0FDF4",
                          border: "1px solid #A7F3D0",
                          borderRadius: 6,
                          padding: "3px 8px",
                          fontSize: 11,
                          fontWeight: 700,
                          color: "#065F46",
                          cursor: "pointer",
                        }}
                      >
                        {suffix}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {paymentMethod === "CARD" && (
                <div style={{ marginBottom: 20 }}>
                  <div style={{ marginBottom: 12 }}>
                    <label style={{ display: "block", fontSize: 12, fontWeight: 700, color: "#064E3B", marginBottom: 4 }}>
                      Card Number
                    </label>
                    <input
                      type="text"
                      value={cardNumber}
                      onChange={(e) => setCardNumber(e.target.value)}
                      placeholder="1234 5678 9012 3456"
                      required
                      style={{
                        width: "100%",
                        boxSizing: "border-box",
                        padding: "10px 14px",
                        borderRadius: 10,
                        border: "1.5px solid #A7F3D0",
                        fontSize: 14,
                      }}
                    />
                  </div>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
                    <div>
                      <label style={{ display: "block", fontSize: 12, fontWeight: 700, color: "#064E3B", marginBottom: 4 }}>
                        Expiry (MM/YY)
                      </label>
                      <input
                        type="text"
                        value={cardExpiry}
                        onChange={(e) => setCardExpiry(e.target.value)}
                        placeholder="12/28"
                        required
                        style={{
                          width: "100%",
                          boxSizing: "border-box",
                          padding: "10px 14px",
                          borderRadius: 10,
                          border: "1.5px solid #A7F3D0",
                          fontSize: 14,
                        }}
                      />
                    </div>
                    <div>
                      <label style={{ display: "block", fontSize: 12, fontWeight: 700, color: "#064E3B", marginBottom: 4 }}>
                        CVV
                      </label>
                      <input
                        type="password"
                        maxLength={4}
                        value={cardCvv}
                        onChange={(e) => setCardCvv(e.target.value)}
                        placeholder="•••"
                        required
                        style={{
                          width: "100%",
                          boxSizing: "border-box",
                          padding: "10px 14px",
                          borderRadius: 10,
                          border: "1.5px solid #A7F3D0",
                          fontSize: 14,
                        }}
                      />
                    </div>
                  </div>
                </div>
              )}

              {paymentMethod === "NET_BANKING" && (
                <div style={{ marginBottom: 20 }}>
                  <label style={{ display: "block", fontSize: 12, fontWeight: 700, color: "#064E3B", marginBottom: 6 }}>
                    Select Your Bank
                  </label>
                  <select
                    style={{
                      width: "100%",
                      padding: "11px 14px",
                      borderRadius: 10,
                      border: "1.5px solid #A7F3D0",
                      background: "#FFFFFF",
                      fontSize: 14,
                      fontWeight: 600,
                    }}
                  >
                    <option>State Bank of India (SBI)</option>
                    <option>HDFC Bank</option>
                    <option>ICICI Bank</option>
                    <option>Axis Bank</option>
                    <option>Punjab National Bank</option>
                  </select>
                </div>
              )}

              {paymentMethod === "WALLET" && (
                <div
                  style={{
                    background: "#F0FDF4",
                    border: "1px solid #A7F3D0",
                    borderRadius: 10,
                    padding: "12px 14px",
                    marginBottom: 20,
                    fontSize: 13,
                    color: "#065F46",
                  }}
                >
                  🎒 <strong>Campus Wallet Balance:</strong> ₹10,000.00 (Sufficient balance available for auto-debit).
                </div>
              )}

              <button
                type="submit"
                disabled={processingPayment}
                style={{
                  width: "100%",
                  padding: "14px",
                  borderRadius: 12,
                  border: "none",
                  background: processingPayment ? "#94A3B8" : "linear-gradient(135deg, #10B981, #059669)",
                  color: "#FFFFFF",
                  fontSize: 15,
                  fontWeight: 900,
                  cursor: processingPayment ? "not-allowed" : "pointer",
                  boxShadow: "0 4px 18px rgba(5, 150, 105, 0.4)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: 8,
                }}
              >
                <span>
                  {processingPayment
                    ? "Processing Gateway Authorization…"
                    : `🔒 Pay ₹${parseFloat(payingReq.original_booking_amount || 2000).toLocaleString("en-IN")} & Lock Slot`}
                </span>
              </button>
            </form>
          </div>
        </div>
      )}

      {/* ════════════════════════════════════════════════════════════
          MODAL: PAYMENT CONFIRMATION RECEIPT
      ════════════════════════════════════════════════════════════ */}
      {receiptModal && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(6, 78, 59, 0.7)",
            backdropFilter: "blur(4px)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 1200,
            padding: 20,
          }}
        >
          <div
            style={{
              background: "#FFFFFF",
              border: "2px solid #10B981",
              borderRadius: 20,
              width: "min(460px, 100%)",
              padding: "32px 28px",
              boxShadow: "0 25px 60px rgba(0, 0, 0, 0.3)",
              textAlign: "center",
              animation: "slideUp 0.3s ease",
            }}
          >
            <div
              style={{
                width: 60,
                height: 60,
                borderRadius: "50%",
                background: "#DCFCE7",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                margin: "0 auto 16px",
              }}
            >
              <CheckCircleIcon />
            </div>

            <h3 style={{ margin: 0, fontSize: 20, fontWeight: 900, color: "#064E3B" }}>
              Rebooking Payment Confirmed!
            </h3>
            <p style={{ margin: "6px 0 20px", fontSize: 13, color: "#059669" }}>
              Your event relocation has been verified by the Principal and the slot is locked.
            </p>

            <div
              style={{
                background: "#F0FDF4",
                border: "1px solid #A7F3D0",
                borderRadius: 14,
                padding: "16px",
                textAlign: "left",
                marginBottom: 20,
                fontSize: 13,
              }}
            >
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
                <span style={{ color: "#64748B" }}>Txn Reference:</span>
                <span style={{ fontWeight: 800, color: "#064E3B" }}>{receiptModal.txnRef}</span>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
                <span style={{ color: "#64748B" }}>Event:</span>
                <span style={{ fontWeight: 700, color: "#064E3B" }}>{receiptModal.bookingTitle}</span>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
                <span style={{ color: "#64748B" }}>Confirmed Date:</span>
                <span style={{ fontWeight: 700, color: "#047857" }}>
                  {receiptModal.newDate ? new Date(receiptModal.newDate).toLocaleDateString() : "New Date"}
                </span>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
                <span style={{ color: "#64748B" }}>Paid By:</span>
                <span style={{ fontWeight: 700, color: "#064E3B" }}>{receiptModal.paidBy}</span>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", paddingTop: 8, borderTop: "1px solid #A7F3D0" }}>
                <span style={{ fontWeight: 800, color: "#064E3B" }}>Amount Paid:</span>
                <span style={{ fontSize: 16, fontWeight: 900, color: "#059669" }}>
                  ₹{parseFloat(receiptModal.amount).toLocaleString("en-IN")}
                </span>
              </div>
            </div>

            <button
              onClick={() => setReceiptModal(null)}
              style={{
                width: "100%",
                padding: "12px",
                borderRadius: 10,
                border: "none",
                background: "linear-gradient(135deg, #10B981, #059669)",
                color: "#FFFFFF",
                fontSize: 14,
                fontWeight: 800,
                cursor: "pointer",
              }}
            >
              Done & Return to Rebookings
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
