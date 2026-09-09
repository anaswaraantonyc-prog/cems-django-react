import { useState, useEffect } from "react";
import { Card, Label, Field, Stamp } from "../components/Shared";
import { inputStyle, buttonStyle, sage, brick, maroonDark, gold } from "../theme";

const getBookingFee = (venueName, roomTypeVal, foodAmountVal) => {
  if (!venueName) return 1000;
  const v = venueName.toLowerCase();
  if (v.includes("auditorium")) return 15000;
  if (v.includes("hostel")) return roomTypeVal === "AC" ? 3500 : 2000;
  if (v.includes("canteen") || v.includes("food")) return foodAmountVal || 6950;
  return 2000;
};

const INITIAL_BOOKING_HISTORY = [
  {
    id: "BK-2026-8901",
    title: "Annual Campus Tech Symposium 2026 - Keynote & Expo",
    venue: "Auditorium",
    applicant: "Prof. Rajesh Kumar",
    applicantRole: "FACULTY",
    date: "2026-09-15",
    status: "CONFIRMED",
    roomType: "N/A",
    amount: 15000,
    paymentStatus: "PAID",
    paymentMethod: "UPI",
    paymentTxnId: "UPI-2026-890123",
    paidAt: "2026-09-02 11:30 AM",
    details: "Main hall booking, AC, audio-visual system & stage lighting requested.",
    submittedAt: "2026-09-02"
  },
  {
    id: "BK-2026-8894",
    title: "Inter-College Cultural Fest - Classical Dance Rehearsal",
    venue: "Auditorium",
    applicant: "Sneha Sharma",
    applicantRole: "CLASS_REP",
    date: "2026-09-18",
    status: "PENDING_APPROVAL",
    roomType: "N/A",
    amount: 15000,
    paymentStatus: "UNPAID",
    paymentMethod: null,
    paymentTxnId: null,
    paidAt: null,
    details: "Stage lighting and green room access requested for 4 hours.",
    submittedAt: "2026-09-05"
  },
  {
    id: "BK-2026-8750",
    title: "Hostel Block A - Semester Accommodation (AC)",
    venue: "Hostel",
    applicant: "Ankit Patel",
    applicantRole: "STUDENT",
    date: "2026-08-10",
    status: "COMPLETED",
    roomType: "AC Room 304",
    amount: 3500,
    paymentStatus: "PAID",
    paymentMethod: "UPI",
    paymentTxnId: "UPI-2026-875011",
    paidAt: "2026-08-01 03:45 PM",
    details: "Single occupancy AC room for odd semester 2026.",
    submittedAt: "2026-08-01"
  },
  {
    id: "BK-2026-8712",
    title: "Department Alumni Meet Lunch & Refreshment Catering",
    venue: "Canteen / program food",
    applicant: "Dr. Meena Nair",
    applicantRole: "FACULTY",
    date: "2026-08-25",
    status: "COMPLETED",
    roomType: "N/A",
    amount: 6950,
    paymentStatus: "PAID",
    paymentMethod: "UPI",
    paymentTxnId: "UPI-2026-871299",
    paidAt: "2026-08-15 02:15 PM",
    details: "Food Pre-Order Menu: ☕ Tea: 100 × ₹15 = ₹1500, ☕ Coffee: 50 × ₹25 = ₹1250, 🧃 Juice: 30 × ₹40 = ₹1200, 🥐 Snacks: 100 × ₹30 = ₹3000 | Total Items: 280 | Grand Total: ₹6,950",
    submittedAt: "2026-08-15"
  },
  {
    id: "BK-2026-8640",
    title: "Hostel Guest House - Visiting Guest Lecturer Stay",
    venue: "Hostel",
    applicant: "Kavita Verma",
    applicantRole: "FACULTY",
    date: "2026-07-20",
    status: "COMPLETED",
    roomType: "AC Suite 102",
    amount: 3500,
    paymentStatus: "PAID",
    paymentMethod: "CARD",
    paymentTxnId: "CARD-2026-864022",
    paidAt: "2026-07-12 10:00 AM",
    details: "3-day accommodation for visiting guest speaker from IIT Madras.",
    submittedAt: "2026-07-12"
  },
  {
    id: "BK-2026-8521",
    title: "Freshers' Welcome Ceremony Refreshment Order",
    venue: "Canteen / program food",
    applicant: "Rohan Gupta",
    applicantRole: "CLASS_REP",
    date: "2026-07-05",
    status: "CANCELLED",
    roomType: "N/A",
    amount: 8750,
    paymentStatus: "REFUNDED",
    paymentMethod: "UPI",
    paymentTxnId: "UPI-2026-852144",
    paidAt: "2026-06-28 04:20 PM",
    details: "Food Pre-Order Menu: ☕ Tea: 150 × ₹15 = ₹2250, 🧃 Juice: 50 × ₹40 = ₹2000, 🥐 Snacks: 150 × ₹30 = ₹4500 | Total Items: 350 | Grand Total: ₹8,750 (Event cancelled)",
    submittedAt: "2026-06-28"
  }
];

const FOOD_MENU = [
  { id: "tea", name: "Tea", icon: "☕", price: 15 },
  { id: "coffee", name: "Coffee", icon: "☕", price: 25 },
  { id: "juice", name: "Juice", icon: "🧃", price: 40 },
  { id: "snacks", name: "Snacks", icon: "🥐", price: 30 }
];

export default function BookingModule({ role = "student" }) {
  const [activeRole, setActiveRole] = useState(role);
  
  // Persistent booking state synced with localStorage
  const [bookings, setBookings] = useState(() => {
    const saved = localStorage.getItem("cems_shared_bookings");
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      } catch (e) {}
    }
    return INITIAL_BOOKING_HISTORY;
  });

  const [activeTab, setActiveTab] = useState("ALL"); // "ALL", "PENDING", "HISTORY"
  const [venueFilter, setVenueFilter] = useState("ALL");
  const [searchQuery, setSearchQuery] = useState("");
  const [showCreateForm, setShowCreateForm] = useState(true);

  useEffect(() => {
    setActiveRole(role);
  }, [role]);

  // Helper to update both state and localStorage
  const updateBookings = (newBookingsOrFn) => {
    setBookings((prev) => {
      const next = typeof newBookingsOrFn === "function" ? newBookingsOrFn(prev) : newBookingsOrFn;
      localStorage.setItem("cems_shared_bookings", JSON.stringify(next));
      return next;
    });
  };

  // Fetch real backend bookings & rebookings with Authentication header
  useEffect(() => {
    const token = localStorage.getItem("cems_access");
    const headers = token ? { Authorization: `Bearer ${token}`, "Content-Type": "application/json" } : {};

    fetch("http://localhost:8000/api/bookings/bookings/", { headers })
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (!data) return;
        const rawList = Array.isArray(data) ? data : data.results || [];
        if (rawList.length > 0) {
          const formatted = rawList.map((b) => {
            const venueName =
              b.booking_type === "AUDITORIUM"
                ? "Auditorium"
                : b.booking_type === "HOSTEL"
                ? "Hostel"
                : b.booking_type === "CANTEEN"
                ? "Canteen / program food"
                : b.booking_type || b.venue || "Auditorium";

            return {
              id: `BK-${b.id}`,
              title: b.title || b.event_name || "Campus Event Booking",
              venue: venueName,
              applicant: b.user_full_name || (typeof b.user === "string" ? b.user : "Registered User"),
              applicantRole: b.user_role || "STUDENT",
              date: b.event_datetime ? b.event_datetime.split("T")[0] : b.date || "2026-09-10",
              status: b.status || "CONFIRMED",
              roomType: b.room_type || "N/A",
              details: b.cancellation_reason || b.purpose || `${venueName} booking request recorded.`,
              submittedAt: b.created_at ? b.created_at.split("T")[0] : "2026-09-01"
            };
          });

          updateBookings((prev) => {
            const existingIds = new Set(prev.map((item) => item.id));
            const newItems = formatted.filter((item) => !existingIds.has(item.id));
            return [...newItems, ...prev];
          });
        }
      })
      .catch(() => {});
  }, []);

  const isStudent = activeRole === "student";
  const isPrincipal = activeRole === "principal" || activeRole === "admin";

  const [venue, setVenue] = useState(isStudent ? "Hostel" : "Auditorium");
  const [eventName, setEventName] = useState("");
  const [date, setDate] = useState("");
  const [roomType, setRoomType] = useState("AC");
  const [error, setError] = useState("");
  const [confirmed, setConfirmed] = useState(null);

  // Inline payment method in booking form
  const [formPayMethod, setFormPayMethod] = useState("UPI");
  const [formUpiId, setFormUpiId] = useState("");
  const [formCardNum, setFormCardNum] = useState("");
  const [formCardExpiry, setFormCardExpiry] = useState("");
  const [formCardCvv, setFormCardCvv] = useState("");
  const [formBank, setFormBank] = useState("State Bank of India");

  // Food Menu state
  const [foodQuantities, setFoodQuantities] = useState({
    tea: 0,
    coffee: 0,
    juice: 0,
    snacks: 0,
  });

  const handleFoodQtyChange = (id, deltaOrVal) => {
    setFoodQuantities((prev) => {
      let val;
      if (typeof deltaOrVal === "number" && deltaOrVal >= 0 && deltaOrVal < 1000) {
        val = deltaOrVal;
      } else {
        val = (prev[id] || 0) + deltaOrVal;
      }
      return { ...prev, [id]: Math.max(0, val) };
    });
  };

  const totalFoodQuantity = FOOD_MENU.reduce((sum, item) => sum + (foodQuantities[item.id] || 0), 0);
  const totalFoodAmount = FOOD_MENU.reduce((sum, item) => sum + (foodQuantities[item.id] || 0) * item.price, 0);

  // Payment Modal States
  const [selectedBookingForPayment, setSelectedBookingForPayment] = useState(null);
  const [selectedBookingForReceipt, setSelectedBookingForReceipt] = useState(null);
  const [payMethod, setPayMethod] = useState("UPI");
  const [upiIdInput, setUpiIdInput] = useState("student@upi");
  const [cardDetails, setCardDetails] = useState({ number: "", expiry: "", cvv: "" });
  const [selectedBank, setSelectedBank] = useState("State Bank of India");
  const [isProcessingPayment, setIsProcessingPayment] = useState(false);
  const [paymentError, setPaymentError] = useState("");

  useEffect(() => {
    if (isStudent && venue === "Auditorium") {
      setVenue("Hostel");
    }
  }, [activeRole, isStudent, venue]);

  const submit = (e) => {
    e.preventDefault();
    setError("");
    if (!eventName || !date) {
      setError("Please fill in both the event/purpose title and date.");
      return;
    }

    if (isStudent && venue === "Auditorium") {
      setError("⚠️ Students are not permitted to book the Auditorium. Only Faculty & Class Representatives can book the Auditorium.");
      return;
    }

    if (venue === "Canteen / program food" && totalFoodQuantity === 0) {
      setError("⚠️ Please select quantity for at least one food menu item (Tea, Coffee, Juice, or Snacks).");
      return;
    }

    let bookingDetails = "";
    if (venue === "Canteen / program food") {
      const orderedList = FOOD_MENU.filter((item) => (foodQuantities[item.id] || 0) > 0)
        .map((item) => `${item.icon} ${item.name}: ${foodQuantities[item.id]} × ₹${item.price} = ₹${foodQuantities[item.id] * item.price}`)
        .join(", ");
      bookingDetails = `Food Pre-Order Menu: ${orderedList} | Total Items: ${totalFoodQuantity} | Grand Total: ₹${totalFoodAmount}`;
    } else {
      bookingDetails = `${venue} booking requested for ${eventName} scheduled on ${date}.`;
    }

    const calculatedFee = getBookingFee(venue, roomType, totalFoodAmount);
    const txnRef = `${formPayMethod}-2026-${Math.floor(100000 + Math.random() * 900000)}`;
    const paidTime = new Date().toLocaleString();

    const newBookingObj = {
      id: `BK-2026-${Math.floor(1000 + Math.random() * 9000)}`,
      title: eventName,
      venue,
      applicant: isStudent ? "Student (Roll: 22CS045)" : activeRole === "faculty" ? "Faculty Member" : activeRole === "class_rep" ? "Class Representative" : "Applicant",
      applicantRole: activeRole.toUpperCase(),
      date,
      status: "PENDING_APPROVAL",
      roomType: venue === "Hostel" ? roomType : "N/A",
      amount: calculatedFee,
      paymentStatus: "PAID",
      paymentMethod: formPayMethod,
      paymentTxnId: txnRef,
      paidAt: paidTime,
      details: bookingDetails,
      submittedAt: new Date().toISOString().split("T")[0]
    };

    updateBookings((prev) => [newBookingObj, ...prev]);
    setConfirmed({ venue, eventName, date, roomType, bookedBy: activeRole, details: bookingDetails, totalFoodAmount, amount: calculatedFee, paymentMethod: formPayMethod, txnRef });
    setEventName("");
    setDate("");
    setFormUpiId("");
    setFormCardNum(""); setFormCardExpiry(""); setFormCardCvv("");
    setFoodQuantities({ tea: 0, coffee: 0, juice: 0, snacks: 0 });

    // Try posting to backend API if authenticated
    const token = localStorage.getItem("cems_access");
    if (token) {
      fetch("http://localhost:8000/api/bookings/bookings/", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          title: eventName,
          booking_type: venue.toLowerCase().includes("auditorium") ? "AUDITORIUM" : venue.toLowerCase().includes("hostel") ? "HOSTEL" : "CANTEEN",
          room_type: roomType,
          seats_or_units: venue === "Canteen / program food" ? totalFoodQuantity : 1,
          amount: calculatedFee,
          event_datetime: `${date}T10:00:00Z`
        })
      }).catch(() => {});
    }
  };

  const handleProcessPayment = (e) => {
    e.preventDefault();
    if (!selectedBookingForPayment) return;
    setPaymentError("");

    if (payMethod === "UPI" && !upiIdInput.trim()) {
      setPaymentError("Please enter a valid UPI ID (e.g. username@upi).");
      return;
    }

    setIsProcessingPayment(true);

    setTimeout(() => {
      const txnRef = `${payMethod}-${new Date().getFullYear()}-${Math.floor(100000 + Math.random() * 900000)}`;
      const paidTime = new Date().toLocaleString();

      updateBookings((prev) =>
        prev.map((b) =>
          b.id === selectedBookingForPayment.id
            ? {
                ...b,
                paymentStatus: "PAID",
                paymentMethod: payMethod,
                paymentTxnId: txnRef,
                paidAt: paidTime,
              }
            : b
        )
      );

      // Backend sync
      const token = localStorage.getItem("cems_access");
      if (token) {
        fetch("http://localhost:8000/api/payments/payments/", {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json"
          },
          body: JSON.stringify({
            booking: selectedBookingForPayment.id.replace("BK-", ""),
            amount: selectedBookingForPayment.amount || getBookingFee(selectedBookingForPayment.venue, selectedBookingForPayment.roomType),
            method: payMethod,
            transaction_reference: txnRef,
            status: "SUCCESS"
          })
        }).catch(() => {});
      }

      const completedReceiptObj = {
        ...selectedBookingForPayment,
        paymentStatus: "PAID",
        paymentMethod: payMethod,
        paymentTxnId: txnRef,
        paidAt: paidTime,
      };

      setIsProcessingPayment(false);
      setSelectedBookingForPayment(null);
      setSelectedBookingForReceipt(completedReceiptObj);
    }, 1200);
  };

  const handleUpdateStatus = (id, newStatus) => {
    updateBookings((prev) =>
      prev.map((b) => (b.id === id ? { ...b, status: newStatus } : b))
    );
  };

  // Filter bookings — Booking page shows only pending (no history).
  // Principal: only Auditorium. Students/Faculty: Auditorium only (Hostel→Warden, Canteen→Canteen page)
  const filteredBookings = bookings.filter((b) => {
    // PRINCIPAL: only sees Auditorium booking requests (pending)
    if (isPrincipal) {
      return b.venue.toLowerCase().includes("auditorium") && b.status.includes("PENDING");
    }

    // All other roles: only see their pending (non-history) auditorium bookings
    // Canteen and Hostel bookings are handled in dedicated Canteen/Warden pages
    const isAuditorium = b.venue.toLowerCase().includes("auditorium");
    const isPending = b.status.includes("PENDING");

    // Venue filter from search bar
    const matchesVenue =
      venueFilter === "ALL" ||
      b.venue.toLowerCase().includes(venueFilter.toLowerCase());

    // Search query
    const q = searchQuery.toLowerCase();
    const matchesSearch =
      !q ||
      b.title.toLowerCase().includes(q) ||
      b.applicant.toLowerCase().includes(q) ||
      b.venue.toLowerCase().includes(q) ||
      b.id.toLowerCase().includes(q);

    return isAuditorium && isPending && matchesVenue && matchesSearch;
  });

  const totalCount = filteredBookings.length;
  const pendingCount = bookings.filter((b) => b.status.includes("PENDING") && b.venue.toLowerCase().includes("auditorium")).length;

  const getStatusBadge = (status) => {
    if (status === "CONFIRMED" || status === "APPROVED") {
      return <Stamp text="Approved / Confirmed" tone="sage" />;
    }
    if (status === "COMPLETED") {
      return <Stamp text="Completed History" tone="gold" />;
    }
    if (status.includes("PENDING")) {
      return <Stamp text="Pending Principal Review" tone="brass" />;
    }
    return <Stamp text="Cancelled / Declined" tone="brick" />;
  };

  return (
    <div style={{ maxWidth: 860, margin: "0 auto", paddingBottom: 40 }}>
      {/* ── Header Banner ── */}
      {isPrincipal ? (
        <div
          style={{
            background: `linear-gradient(135deg, ${maroonDark} 0%, #4A121A 100%)`,
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
                Principal Campus Booking Review & Approval Portal
              </strong>
              <div style={{ fontSize: 13, marginTop: 3, opacity: 0.9 }}>
                Review incoming student/faculty booking requests, click approve/decline, and inspect complete historical logs.
              </div>
            </div>
          </div>
        </div>
      ) : (
        /* ── Role Clearance Banner (For Non-Principal Roles like Student) ── */
        <div
          style={{
            background: isStudent ? "#FFFBEB" : "#F0FDF4",
            border: `1.5px solid ${isStudent ? "#FCD34D" : "#86EFAC"}`,
            borderRadius: 12,
            padding: "16px 20px",
            marginBottom: 20,
            color: isStudent ? "#92400E" : "#166534",
            boxShadow: "0 4px 12px rgba(0,0,0,0.06)",
          }}
        >
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
              <span style={{ fontSize: 28 }}>{isStudent ? "🎓" : activeRole === "class_rep" ? "⭐" : "👨‍🏫"}</span>
              <div>
                <strong style={{ fontSize: 16, display: "block" }}>
                  {isStudent
                    ? "Student Booking Submission & Approval Status"
                    : activeRole === "class_rep"
                    ? "Class Representative Booking Clearance & History"
                    : "Faculty Booking Clearance & History"}
                </strong>
                <div style={{ fontSize: 13, marginTop: 3, opacity: 0.9 }}>
                  {isStudent
                    ? "Submit your Hostel or Canteen booking requests below. Approved status will be updated here after Principal review."
                    : "Full clearance: You can request Auditorium slots, Hostel rooms, and Canteen catering."}
                </div>
              </div>
            </div>
            <button
              onClick={() => setShowCreateForm(!showCreateForm)}
              style={{
                ...buttonStyle(showCreateForm ? "secondary" : "primary"),
                fontSize: 12,
                padding: "8px 14px",
                borderRadius: 8,
                whiteSpace: "nowrap",
              }}
            >
              {showCreateForm ? "✖ Hide Form" : "➕ New Booking Request"}
            </button>
          </div>
        </div>
      )}

      {/* ── New Booking Request Form (ONLY for Non-Principal Users) ── */}
      {!isPrincipal && showCreateForm && (
        <Card style={{ marginBottom: 24, border: `2px solid ${gold}` }}>
          <Label>➕ Submit New Booking Request</Label>

          {error && (
            <div
              style={{
                background: "#FFF5F5",
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

          <form onSubmit={submit}>
            <Field label="Booking Sub-System / Venue">
              <select
                style={inputStyle}
                value={venue}
                onChange={(e) => {
                  setError("");
                  setVenue(e.target.value);
                }}
              >
                {!isStudent && <option value="Auditorium">🎭 Auditorium (Faculty & Class Rep Only)</option>}
                <option value="Hostel">🏨 Hostel Accommodation</option>
                <option value="Canteen / program food">🍱 Canteen / Program Food Pre-Order</option>
              </select>
            </Field>

            <Field label="Event Title or Booking Purpose">
              <input
                style={inputStyle}
                value={eventName}
                onChange={(e) => setEventName(e.target.value)}
                placeholder={
                  venue === "Auditorium"
                    ? "Tech Fest Inauguration / Cultural Night"
                    : venue === "Hostel"
                    ? "Semester Hostel Accommodation"
                    : "Department Lunch / Refreshment Pre-Order"
                }
              />
            </Field>

            {venue === "Hostel" && (
              <Field label="Hostel Room Category">
                <select style={inputStyle} value={roomType} onChange={(e) => setRoomType(e.target.value)}>
                  <option value="AC">AC Room</option>
                  <option value="Non-AC">Non-AC Room</option>
                </select>
              </Field>
            )}

            {venue === "Canteen / program food" && (
              <div
                style={{
                  background: "#FFFBF0",
                  border: `1.5px solid ${gold}`,
                  borderRadius: 10,
                  padding: 16,
                  marginBottom: 16,
                }}
              >
                <div style={{ fontWeight: 800, fontSize: 14, color: maroonDark, marginBottom: 12, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <span>🍱 Select Refreshment Menu Items & Quantities</span>
                  <span style={{ fontSize: 12, color: "#92400E", fontWeight: 700 }}>
                    Unit Prices Enforced
                  </span>
                </div>

                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(170px, 1fr))", gap: 12 }}>
                  {FOOD_MENU.map((item) => {
                    const qty = foodQuantities[item.id] || 0;
                    const subtotal = qty * item.price;
                    return (
                      <div
                        key={item.id}
                        style={{
                          background: "#FFFFFF",
                          border: `1.5px solid ${qty > 0 ? maroonDark : "#E5E7EB"}`,
                          borderRadius: 8,
                          padding: 12,
                          display: "flex",
                          flexDirection: "column",
                          gap: 8,
                          boxShadow: qty > 0 ? "0 2px 8px rgba(107,30,43,0.15)" : "none",
                          transition: "all 0.15s ease",
                        }}
                      >
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                          <span style={{ fontWeight: 700, fontSize: 14, color: maroonDark }}>
                            {item.icon} {item.name}
                          </span>
                          <span style={{ fontSize: 11, fontWeight: 700, color: "#4B5563", background: "#F3F4F6", padding: "2px 6px", borderRadius: 4 }}>
                            ₹{item.price} / item
                          </span>
                        </div>

                        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 6, marginTop: 4 }}>
                          <button
                            type="button"
                            onClick={() => handleFoodQtyChange(item.id, -1)}
                            style={{
                              width: 32,
                              height: 32,
                              borderRadius: 6,
                              border: "1px solid #D1D5DB",
                              background: "#F9FAFB",
                              color: maroonDark,
                              fontWeight: 800,
                              fontSize: 16,
                              cursor: "pointer",
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "center",
                            }}
                          >
                            -
                          </button>

                          <input
                            type="number"
                            min="0"
                            value={qty}
                            onChange={(e) => handleFoodQtyChange(item.id, parseInt(e.target.value) || 0)}
                            style={{
                              width: 55,
                              textAlign: "center",
                              padding: "4px",
                              borderRadius: 6,
                              border: `1px solid ${qty > 0 ? maroonDark : "#D1D5DB"}`,
                              fontSize: 14,
                              fontWeight: 700,
                              color: maroonDark,
                            }}
                          />

                          <button
                            type="button"
                            onClick={() => handleFoodQtyChange(item.id, 1)}
                            style={{
                              width: 32,
                              height: 32,
                              borderRadius: 6,
                              border: "none",
                              background: maroonDark,
                              color: "#FFF",
                              fontWeight: 800,
                              fontSize: 16,
                              cursor: "pointer",
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "center",
                            }}
                          >
                            +
                          </button>
                        </div>

                        <div style={{ fontSize: 12, textAlign: "right", fontWeight: 700, color: qty > 0 ? "#166534" : "#9CA3AF" }}>
                          Subtotal: ₹{subtotal}
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Grand Summary Bar */}
                <div
                  style={{
                    marginTop: 14,
                    padding: "10px 14px",
                    background: "#FFF",
                    borderRadius: 8,
                    border: `1px dashed ${gold}`,
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    fontSize: 13,
                  }}
                >
                  <div style={{ color: "#4B5563" }}>
                    Total Selected Items: <strong style={{ color: maroonDark }}>{totalFoodQuantity}</strong>
                  </div>
                  <div style={{ fontWeight: 800, fontSize: 15, color: maroonDark }}>
                    Total Order Bill: <span style={{ color: "#166534", fontSize: 16 }}>₹{totalFoodAmount}</span>
                  </div>
                </div>
              </div>
            )}

            <Field label="Scheduled Event Date">
              <input style={inputStyle} type="date" value={date} onChange={(e) => setDate(e.target.value)} />
            </Field>

            {/* ── Payment Method Section ── */}
            <div style={{
              background: "linear-gradient(135deg, #FFFBF0, #FFF9EC)",
              border: `1.5px solid ${gold}`,
              borderRadius: 12,
              padding: 18,
              marginTop: 4,
              marginBottom: 4,
            }}>
              <div style={{ fontWeight: 800, fontSize: 14, color: maroonDark, marginBottom: 12, display: "flex", alignItems: "center", gap: 8 }}>
                <span style={{ fontSize: 18 }}>💳</span> Select Payment Method
              </div>

              {/* Method Tabs */}
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, marginBottom: 14 }}>
                {[
                  { id: "UPI",         label: "📱 UPI",          desc: "GPay / PhonePe / BHIM" },
                  { id: "CARD",        label: "💳 Debit / Credit Card", desc: "Visa, Mastercard, RuPay" },
                  { id: "NET_BANKING", label: "🏦 Net Banking",   desc: "All Indian Banks" },
                  { id: "WALLET",      label: "👛 Campus Wallet", desc: "Instant · No OTP" },
                ].map((m) => (
                  <button
                    key={m.id}
                    type="button"
                    onClick={() => setFormPayMethod(m.id)}
                    style={{
                      padding: "10px 12px",
                      borderRadius: 8,
                      border: `1.5px solid ${formPayMethod === m.id ? maroonDark : "#D1D5DB"}`,
                      background: formPayMethod === m.id ? "#FFF5F5" : "#FFF",
                      color: formPayMethod === m.id ? maroonDark : "#4B5563",
                      fontWeight: formPayMethod === m.id ? 800 : 600,
                      fontSize: 12,
                      cursor: "pointer",
                      textAlign: "left",
                      transition: "all 0.15s ease",
                      boxShadow: formPayMethod === m.id ? `0 2px 8px ${maroonDark}22` : "none",
                    }}
                  >
                    <div>{m.label}</div>
                    <div style={{ fontSize: 10, opacity: 0.65, marginTop: 2 }}>{m.desc}</div>
                  </button>
                ))}
              </div>

              {/* UPI Input */}
              {formPayMethod === "UPI" && (
                <div>
                  <label style={{ fontSize: 12, fontWeight: 700, color: maroonDark, display: "block", marginBottom: 6 }}>
                    UPI ID / VPA:
                  </label>
                  <input
                    type="text"
                    value={formUpiId}
                    onChange={(e) => setFormUpiId(e.target.value)}
                    placeholder="e.g. 9876543210@paytm or name@ybl"
                    style={{ ...inputStyle, marginBottom: 8 }}
                  />
                  <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                    {["@okicici", "@ybl", "@paytm", "@upi", "@axisbank"].map((tag) => (
                      <button
                        key={tag}
                        type="button"
                        onClick={() => {
                          const base = formUpiId.split("@")[0] || "student";
                          setFormUpiId(`${base}${tag}`);
                        }}
                        style={{
                          background: "#FFF", border: "1px solid #D1D5DB", borderRadius: 4,
                          padding: "2px 8px", fontSize: 11, color: "#4B5563", cursor: "pointer",
                        }}
                      >
                        {tag}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Card Input */}
              {formPayMethod === "CARD" && (
                <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                  <div>
                    <label style={{ fontSize: 12, fontWeight: 700, color: maroonDark, display: "block", marginBottom: 4 }}>Card Number</label>
                    <input
                      type="text"
                      maxLength={19}
                      value={formCardNum}
                      onChange={(e) => {
                        const v = e.target.value.replace(/[^0-9]/g, "").slice(0, 16);
                        setFormCardNum(v.replace(/(\d{4})(?=\d)/g, "$1 ").trim());
                      }}
                      placeholder="4532 •••• •••• 8912"
                      style={inputStyle}
                    />
                  </div>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
                    <div>
                      <label style={{ fontSize: 12, fontWeight: 700, color: maroonDark, display: "block", marginBottom: 4 }}>Expiry (MM/YY)</label>
                      <input
                        type="text"
                        maxLength={5}
                        value={formCardExpiry}
                        onChange={(e) => {
                          let v = e.target.value.replace(/[^0-9]/g, "").slice(0, 4);
                          if (v.length > 2) v = v.slice(0, 2) + "/" + v.slice(2);
                          setFormCardExpiry(v);
                        }}
                        placeholder="MM/YY"
                        style={inputStyle}
                      />
                    </div>
                    <div>
                      <label style={{ fontSize: 12, fontWeight: 700, color: maroonDark, display: "block", marginBottom: 4 }}>CVV</label>
                      <input
                        type="password"
                        maxLength={3}
                        value={formCardCvv}
                        onChange={(e) => setFormCardCvv(e.target.value.replace(/[^0-9]/g, "").slice(0, 3))}
                        placeholder="•••"
                        style={inputStyle}
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* Net Banking */}
              {formPayMethod === "NET_BANKING" && (
                <div>
                  <label style={{ fontSize: 12, fontWeight: 700, color: maroonDark, display: "block", marginBottom: 6 }}>Select Your Bank:</label>
                  <select
                    style={inputStyle}
                    value={formBank}
                    onChange={(e) => setFormBank(e.target.value)}
                  >
                    {["State Bank of India", "HDFC Bank", "ICICI Bank", "Axis Bank", "Kotak Mahindra",
                      "Punjab National Bank", "Bank of Baroda", "Canara Bank", "Union Bank", "Indian Bank"
                    ].map((b) => <option key={b} value={b}>{b}</option>)}
                  </select>
                </div>
              )}

              {/* Campus Wallet */}
              {formPayMethod === "WALLET" && (
                <div style={{
                  background: "#F0FDF4", border: "1px solid #86EFAC",
                  borderRadius: 8, padding: "10px 14px", fontSize: 13,
                }}>
                  <div style={{ fontWeight: 700, color: "#166534", marginBottom: 4 }}>👛 Campus Wallet Balance: ₹2,450</div>
                  <div style={{ fontSize: 12, color: "#4B5563" }}>Payment will be instantly debited from your CEMS campus wallet.</div>
                </div>
              )}

              {/* Fee Summary */}
              <div style={{
                marginTop: 14,
                background: "#FFF",
                border: `1px dashed ${gold}`,
                borderRadius: 8,
                padding: "10px 14px",
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                fontSize: 13,
              }}>
                <span style={{ color: "#4B5563" }}>Booking Fee</span>
                <span style={{ fontWeight: 900, fontSize: 16, color: maroonDark }}>
                  ₹{getBookingFee(venue, roomType, totalFoodAmount).toLocaleString()}
                </span>
              </div>
            </div>

            <button style={{ ...buttonStyle("primary"), width: "100%", marginTop: 12, padding: "12px 18px", fontSize: 14 }} type="submit">
              💳 Pay & Submit Booking Request
            </button>
          </form>

          {confirmed && (
            <div style={{
              marginTop: 18,
              background: "linear-gradient(135deg, #F0FDF4, #ECFDF5)",
              border: "1.5px solid #86EFAC",
              borderRadius: 12,
              overflow: "hidden",
              boxShadow: "0 4px 12px rgba(22,163,74,0.12)",
            }}>
              {/* Receipt Header */}
              <div style={{
                background: "#16A34A", color: "#FFF",
                padding: "12px 18px",
                display: "flex", alignItems: "center", gap: 10,
              }}>
                <span style={{ fontSize: 22 }}>✅</span>
                <div>
                  <div style={{ fontWeight: 800, fontSize: 15 }}>Payment Successful — Booking Submitted!</div>
                  <div style={{ fontSize: 11, opacity: 0.9, marginTop: 2 }}>Your booking is now pending principal review.</div>
                </div>
              </div>
              {/* Receipt Body */}
              <div style={{ padding: "14px 18px" }}>
                <div style={{ fontWeight: 800, fontSize: 14, color: maroonDark, marginBottom: 10 }}>
                  {confirmed.eventName}
                </div>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, fontSize: 12 }}>
                  <div style={{ color: "#4B5563" }}>📍 Venue</div>
                  <div style={{ fontWeight: 700, color: maroonDark }}>{confirmed.venue}{confirmed.venue === "Hostel" ? ` (${confirmed.roomType})` : ""}</div>
                  <div style={{ color: "#4B5563" }}>📅 Date</div>
                  <div style={{ fontWeight: 700, color: maroonDark }}>{confirmed.date}</div>
                  <div style={{ color: "#4B5563" }}>💳 Paid via</div>
                  <div style={{ fontWeight: 700, color: "#166534" }}>
                    {confirmed.paymentMethod === "UPI" ? "📱 UPI"
                      : confirmed.paymentMethod === "CARD" ? "💳 Card"
                      : confirmed.paymentMethod === "NET_BANKING" ? "🏦 Net Banking"
                      : "👛 Campus Wallet"}
                  </div>
                  <div style={{ color: "#4B5563" }}>🔖 Txn Ref</div>
                  <div style={{ fontWeight: 700, color: "#374151", fontSize: 11 }}>{confirmed.txnRef}</div>
                  <div style={{ color: "#4B5563" }}>💰 Amount Paid</div>
                  <div style={{ fontWeight: 900, fontSize: 15, color: "#166534" }}>₹{(confirmed.amount || 0).toLocaleString()}</div>
                </div>
                <div style={{
                  marginTop: 12, background: "#FFF", border: "1px dashed #86EFAC",
                  borderRadius: 8, padding: "8px 12px", fontSize: 12, color: "#4A7C59", fontWeight: 600,
                }}>
                  ⏳ Status: Pending Principal / Warden Review — you will be notified once approved.
                </div>
              </div>
            </div>
          )}
        </Card>
      )}

      {/* ── Auditorium Pending Requests Section ── */}
      <Card style={{ padding: 20 }}>
        {/* Header info bar */}
        <div style={{
          display: "flex", justifyContent: "space-between", alignItems: "center",
          marginBottom: 16, paddingBottom: 12, borderBottom: "2px solid #E5E7EB"
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <span style={{ fontSize: 22 }}>🎭</span>
            <div>
              <div style={{ fontWeight: 800, fontSize: 15, color: maroonDark }}>
                {isPrincipal ? "Auditorium Booking Requests — Pending Approval" : "Auditorium Booking Requests"}
              </div>
              <div style={{ fontSize: 12, color: "#6B7280", marginTop: 2 }}>
                {isPrincipal
                  ? "Review and approve/decline auditorium requests from faculty and class representatives."
                  : "Your submitted auditorium booking requests awaiting principal review."}
              </div>
            </div>
          </div>
          <div style={{
            background: `${gold}22`, border: `1px solid ${gold}`,
            borderRadius: 20, padding: "4px 14px", fontSize: 13, fontWeight: 800, color: maroonDark
          }}>
            {filteredBookings.length} pending
          </div>
        </div>

        {/* Info chips — Canteen and Hostel redirects */}
        <div style={{ display: "flex", gap: 8, marginBottom: 14, flexWrap: "wrap" }}>
          <div style={{
            background: "#FFF3CD", border: "1px solid #FCD34D", borderRadius: 8,
            padding: "6px 12px", fontSize: 12, color: "#92400E", fontWeight: 600
          }}>
            🍱 Food / Canteen orders → <strong>Canteen Module</strong>
          </div>
          <div style={{
            background: "#EFF6FF", border: "1px solid #93C5FD", borderRadius: 8,
            padding: "6px 12px", fontSize: 12, color: "#1E40AF", fontWeight: 600
          }}>
            🏨 Hostel bookings → <strong>Warden Module</strong>
          </div>
        </div>

        {/* Search Box */}
        <div style={{ marginBottom: 14 }}>
          <input
            type="text"
            placeholder="🔍 Search event title or applicant name..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={{
              padding: "8px 14px", borderRadius: 8,
              border: "1px solid #D1D5DB", fontSize: 13,
              width: "100%", boxSizing: "border-box", background: "#FFF",
            }}
          />
        </div>

        {/* Booking List */}
        {filteredBookings.length === 0 ? (
          <div style={{
            textAlign: "center", padding: "40px 20px", color: "#6B7280", fontSize: 14,
            background: "#FAFAFA", borderRadius: 10, border: "1px dashed #D1D5DB"
          }}>
            <div style={{ fontSize: 32, marginBottom: 8 }}>🎭</div>
            <div style={{ fontWeight: 700, marginBottom: 4, color: maroonDark }}>No Pending Auditorium Requests</div>
            <div>All auditorium booking requests have been reviewed, or none have been submitted yet.</div>
          </div>

        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            {filteredBookings.map((item) => (
              <div
                key={item.id}
                style={{
                  border: "1px solid #E5E7EB",
                  borderRadius: 10,
                  padding: 14,
                  background: item.status.includes("PENDING") ? "#FFFDF5" : "#FFFFFF",
                  borderLeft: `4px solid ${
                    item.status.includes("PENDING")
                      ? gold
                      : item.status === "CONFIRMED" || item.status === "APPROVED"
                      ? sage
                      : item.status === "COMPLETED"
                      ? "#3B82F6"
                      : brick
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
                        {item.id}
                      </span>
                      <span style={{ fontSize: 12, fontWeight: 700, color: maroonDark }}>
                        📍 {item.venue} {item.roomType !== "N/A" ? `(${item.roomType})` : ""}
                      </span>
                    </div>
                    <div style={{ fontWeight: 800, fontSize: 15, color: maroonDark, marginTop: 4 }}>
                      {item.title}
                    </div>
                  </div>
                  <div>{getStatusBadge(item.status)}</div>
                </div>

                <div style={{ fontSize: 13, color: "#4B5563", background: "#F9FAFB", padding: "8px 12px", borderRadius: 6 }}>
                  {item.details}
                </div>

                {/* Financial Fee & Payment Status Bar */}
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    background: "#FDFBF7",
                    border: `1px solid ${gold}40`,
                    padding: "8px 12px",
                    borderRadius: 6,
                    fontSize: 12,
                  }}
                >
                  <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                    <span>
                      💰 Booking Fee: <strong style={{ color: maroonDark, fontSize: 13 }}>₹{(item.amount || getBookingFee(item.venue, item.roomType, item.totalFoodAmount)).toLocaleString()}</strong>
                    </span>

                    {item.paymentStatus === "PAID" ? (
                      <span style={{ color: "#166534", fontWeight: 700, display: "inline-flex", alignItems: "center", gap: 4 }}>
                        ✅ Paid via {item.paymentMethod || "UPI"} <span style={{ opacity: 0.7, fontWeight: 500 }}>(Ref: {item.paymentTxnId || "N/A"})</span>
                      </span>
                    ) : item.paymentStatus === "REFUNDED" ? (
                      <span style={{ color: "#B91C1C", fontWeight: 700 }}>
                        ↩️ Refund Settled (Ref: {item.paymentTxnId || "N/A"})
                      </span>
                    ) : (
                      <span style={{ color: "#D97706", fontWeight: 700 }}>
                        ⚠️ Payment Pending
                      </span>
                    )}
                  </div>

                  <div>
                    {item.paymentStatus === "PAID" ? (
                      <button
                        onClick={() => setSelectedBookingForReceipt(item)}
                        style={{
                          background: "#F3F4F6",
                          border: "1px solid #D1D5DB",
                          borderRadius: 6,
                          padding: "4px 10px",
                          fontSize: 11,
                          fontWeight: 700,
                          color: maroonDark,
                          cursor: "pointer",
                          display: "inline-flex",
                          alignItems: "center",
                          gap: 4,
                        }}
                      >
                        🧾 View Receipt
                      </button>
                    ) : (
                      <button
                        onClick={() => {
                          setSelectedBookingForPayment(item);
                          setPayMethod("UPI");
                          setPaymentError("");
                        }}
                        style={{
                          background: `linear-gradient(135deg, ${maroonDark}, ${gold})`,
                          border: "none",
                          borderRadius: 6,
                          padding: "5px 12px",
                          fontSize: 11,
                          fontWeight: 800,
                          color: "#FFF",
                          cursor: "pointer",
                          boxShadow: "0 2px 6px rgba(107,30,43,0.25)",
                          display: "inline-flex",
                          alignItems: "center",
                          gap: 4,
                        }}
                      >
                        💳 Pay via UPI / Card
                      </button>
                    )}
                  </div>
                </div>

                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", fontSize: 12, color: "#6B7280", paddingTop: 4 }}>
                  <div>
                    👤 <strong>{item.applicant}</strong> ({item.applicantRole})
                  </div>
                  <div style={{ display: "flex", gap: 14 }}>
                    <span>📅 Event Date: <strong>{item.date}</strong></span>
                    <span>🕒 Requested: {item.submittedAt}</span>
                  </div>
                </div>

                {/* Principal Quick Approval Actions */}
                {isPrincipal && item.status.includes("PENDING") && (
                  <div style={{ display: "flex", gap: 8, marginTop: 6, paddingTop: 8, borderTop: "1px dashed #E5E7EB", justifyContent: "flex-end" }}>
                    <button
                      onClick={() => handleUpdateStatus(item.id, "CONFIRMED")}
                      style={{
                        ...buttonStyle("primary"),
                        fontSize: 12,
                        padding: "6px 14px",
                        borderRadius: 6,
                        background: sage,
                      }}
                    >
                      ✔ Approve Booking Request
                    </button>
                    <button
                      onClick={() => handleUpdateStatus(item.id, "CANCELLED")}
                      style={{
                        ...buttonStyle("secondary"),
                        fontSize: 12,
                        padding: "6px 14px",
                        borderRadius: 6,
                        color: brick,
                        borderColor: brick,
                      }}
                    >
                      ✖ Decline Request
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </Card>

      {/* ══════════════════════════════════════════════════════════════
          PAYMENT GATEWAY MODAL (UPI, Cards, Net Banking, Wallet)
         ══════════════════════════════════════════════════════════════ */}
      {selectedBookingForPayment && (
        <div
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: "rgba(0,0,0,0.65)",
            backdropFilter: "blur(4px)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 9999,
            padding: 16,
          }}
        >
          <div
            style={{
              background: "#FFFFFF",
              borderRadius: 14,
              maxWidth: 520,
              width: "100%",
              boxShadow: "0 20px 40px rgba(0,0,0,0.3)",
              overflow: "hidden",
              border: `2px solid ${gold}`,
            }}
          >
            {/* Modal Header */}
            <div
              style={{
                background: `linear-gradient(135deg, ${maroonDark}, #4A121A)`,
                color: "#FFF",
                padding: "16px 20px",
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <span style={{ fontSize: 24 }}>💳</span>
                <div>
                  <strong style={{ fontSize: 16, display: "block", color: gold }}>
                    CEMS Official Payment Gateway
                  </strong>
                  <span style={{ fontSize: 11, opacity: 0.85 }}>
                    Booking ID: {selectedBookingForPayment.id}
                  </span>
                </div>
              </div>
              <button
                onClick={() => setSelectedBookingForPayment(null)}
                style={{
                  background: "none",
                  border: "none",
                  color: "#FFF",
                  fontSize: 22,
                  fontWeight: 700,
                  cursor: "pointer",
                }}
              >
                ×
              </button>
            </div>

            {/* Modal Content */}
            <form onSubmit={handleProcessPayment} style={{ padding: 20 }}>
              {/* Order Summary Box */}
              <div
                style={{
                  background: "#F9FAFB",
                  border: "1px solid #E5E7EB",
                  borderRadius: 10,
                  padding: 12,
                  marginBottom: 16,
                }}
              >
                <div style={{ fontSize: 13, fontWeight: 700, color: maroonDark }}>
                  {selectedBookingForPayment.title}
                </div>
                <div style={{ fontSize: 12, color: "#6B7280", marginTop: 2 }}>
                  📍 {selectedBookingForPayment.venue} · 👤 {selectedBookingForPayment.applicant}
                </div>
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    marginTop: 8,
                    paddingTop: 8,
                    borderTop: "1px dashed #D1D5DB",
                  }}
                >
                  <span style={{ fontSize: 13, fontWeight: 700, color: "#374151" }}>Payable Amount:</span>
                  <span style={{ fontSize: 18, fontWeight: 900, color: "#166534" }}>
                    ₹{(selectedBookingForPayment.amount || getBookingFee(selectedBookingForPayment.venue, selectedBookingForPayment.roomType)).toLocaleString()}
                  </span>
                </div>
              </div>

              {/* Payment Method Selector Tabs */}
              <div style={{ marginBottom: 16 }}>
                <label style={{ fontSize: 12, fontWeight: 700, color: maroonDark, display: "block", marginBottom: 6 }}>
                  Select Payment Method:
                </label>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
                  {[
                    { id: "UPI", label: "📱 UPI (GPay / PhonePe)", desc: "Instant UPI ID or QR" },
                    { id: "CARD", label: "💳 Debit / Credit Card", desc: "Visa, MasterCard, RuPay" },
                    { id: "NET_BANKING", label: "🏦 Net Banking", desc: "All Indian Banks" },
                    { id: "WALLET", label: "👛 Campus Wallet", desc: "Instant Debit" },
                  ].map((m) => (
                    <button
                      key={m.id}
                      type="button"
                      onClick={() => {
                        setPayMethod(m.id);
                        setPaymentError("");
                      }}
                      style={{
                        padding: "8px 10px",
                        borderRadius: 8,
                        border: `1.5px solid ${payMethod === m.id ? maroonDark : "#D1D5DB"}`,
                        background: payMethod === m.id ? "#FFF5F5" : "#FFF",
                        color: payMethod === m.id ? maroonDark : "#374151",
                        fontWeight: payMethod === m.id ? 800 : 600,
                        fontSize: 12,
                        cursor: "pointer",
                        textAlign: "left",
                        transition: "all 0.15s ease",
                      }}
                    >
                      <div>{m.label}</div>
                      <div style={{ fontSize: 10, opacity: 0.7, marginTop: 1 }}>{m.desc}</div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Error Alert */}
              {paymentError && (
                <div
                  style={{
                    background: "#FFF5F5",
                    border: `1px solid ${brick}`,
                    borderRadius: 8,
                    padding: "8px 12px",
                    marginBottom: 12,
                    fontSize: 12,
                    color: brick,
                    fontWeight: 600,
                  }}
                >
                  {paymentError}
                </div>
              )}

              {/* UPI Tab View */}
              {payMethod === "UPI" && (
                <div
                  style={{
                    background: "#FFFBF0",
                    border: `1px solid ${gold}`,
                    borderRadius: 10,
                    padding: 14,
                    marginBottom: 16,
                  }}
                >
                  <label style={{ fontSize: 12, fontWeight: 700, color: maroonDark, display: "block", marginBottom: 6 }}>
                    Enter Virtual Payment Address (VPA / UPI ID):
                  </label>
                  <input
                    type="text"
                    value={upiIdInput}
                    onChange={(e) => setUpiIdInput(e.target.value)}
                    placeholder="e.g. 9876543210@paytm or student@ybl"
                    style={{
                      width: "100%",
                      padding: "8px 12px",
                      borderRadius: 6,
                      border: "1px solid #D1D5DB",
                      fontSize: 13,
                      marginBottom: 8,
                      background: "#FFF",
                    }}
                  />
                  {/* Quick Handle Tag Buttons */}
                  <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginBottom: 12 }}>
                    {["@okicici", "@ybl", "@paytm", "@upi", "@axisbank"].map((tag) => (
                      <button
                        key={tag}
                        type="button"
                        onClick={() => {
                          const base = upiIdInput.split("@")[0] || "student";
                          setUpiIdInput(`${base}${tag}`);
                        }}
                        style={{
                          background: "#FFF",
                          border: "1px solid #D1D5DB",
                          borderRadius: 4,
                          padding: "2px 6px",
                          fontSize: 11,
                          color: "#4B5563",
                          cursor: "pointer",
                        }}
                      >
                        {tag}
                      </button>
                    ))}
                  </div>

                  {/* QR Code Simulation Container */}
                  <div
                    style={{
                      borderTop: "1px dashed #FCD34D",
                      paddingTop: 10,
                      display: "flex",
                      alignItems: "center",
                      gap: 12,
                    }}
                  >
                    <div
                      style={{
                        width: 70,
                        height: 70,
                        background: "#FFF",
                        border: "2px solid #374151",
                        borderRadius: 6,
                        padding: 4,
                        display: "flex",
                        flexDirection: "column",
                        alignItems: "center",
                        justifyContent: "center",
                        fontSize: 8,
                        fontWeight: 800,
                        color: maroonDark,
                        textAlign: "center",
                      }}
                    >
                      <span style={{ fontSize: 24 }}>📱</span>
                      <span>UPI QR</span>
                    </div>
                    <div style={{ fontSize: 11, color: "#6B644C", lineHeight: 1.4 }}>
                      <strong>Or scan UPI QR code:</strong>
                      <div>Scan using GPay, PhonePe, Paytm, or BHIM UPI app.</div>
                      <div style={{ color: maroonDark, fontWeight: 700, marginTop: 2 }}>
                        UPI VPA: cems.booking@upi
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* CARD Tab View */}
              {payMethod === "CARD" && (
                <div style={{ background: "#F9FAFB", border: "1px solid #E5E7EB", borderRadius: 10, padding: 12, marginBottom: 16 }}>
                  <div style={{ marginBottom: 8 }}>
                    <label style={{ fontSize: 11, fontWeight: 700, color: "#374151", display: "block" }}>Card Number</label>
                    <input
                      type="text"
                      placeholder="4532 •••• •••• 8912"
                      value={cardDetails.number}
                      onChange={(e) => setCardDetails({ ...cardDetails, number: e.target.value })}
                      style={{ width: "100%", padding: "6px 10px", borderRadius: 6, border: "1px solid #D1D5DB", fontSize: 12 }}
                    />
                  </div>
                  <div style={{ display: "flex", gap: 10 }}>
                    <div style={{ flex: 1 }}>
                      <label style={{ fontSize: 11, fontWeight: 700, color: "#374151", display: "block" }}>Expiry (MM/YY)</label>
                      <input
                        type="text"
                        placeholder="08/28"
                        value={cardDetails.expiry}
                        onChange={(e) => setCardDetails({ ...cardDetails, expiry: e.target.value })}
                        style={{ width: "100%", padding: "6px 10px", borderRadius: 6, border: "1px solid #D1D5DB", fontSize: 12 }}
                      />
                    </div>
                    <div style={{ flex: 1 }}>
                      <label style={{ fontSize: 11, fontWeight: 700, color: "#374151", display: "block" }}>CVV</label>
                      <input
                        type="password"
                        maxLength="4"
                        placeholder="•••"
                        value={cardDetails.cvv}
                        onChange={(e) => setCardDetails({ ...cardDetails, cvv: e.target.value })}
                        style={{ width: "100%", padding: "6px 10px", borderRadius: 6, border: "1px solid #D1D5DB", fontSize: 12 }}
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* NET BANKING Tab View */}
              {payMethod === "NET_BANKING" && (
                <div style={{ background: "#F9FAFB", border: "1px solid #E5E7EB", borderRadius: 10, padding: 12, marginBottom: 16 }}>
                  <label style={{ fontSize: 11, fontWeight: 700, color: "#374151", display: "block", marginBottom: 4 }}>Select Bank</label>
                  <select
                    value={selectedBank}
                    onChange={(e) => setSelectedBank(e.target.value)}
                    style={{ width: "100%", padding: "8px", borderRadius: 6, border: "1px solid #D1D5DB", fontSize: 12 }}
                  >
                    <option value="State Bank of India">State Bank of India (SBI)</option>
                    <option value="HDFC Bank">HDFC Bank</option>
                    <option value="ICICI Bank">ICICI Bank</option>
                    <option value="Axis Bank">Axis Bank</option>
                    <option value="Punjab National Bank">Punjab National Bank</option>
                  </select>
                </div>
              )}

              {/* WALLET Tab View */}
              {payMethod === "WALLET" && (
                <div style={{ background: "#F0FDF4", border: "1px solid #86EFAC", borderRadius: 10, padding: 12, marginBottom: 16, fontSize: 12, color: "#166534" }}>
                  💳 <strong>CEMS Student Campus Wallet</strong>
                  <div style={{ marginTop: 4 }}>Available Balance: <strong>₹25,000.00</strong></div>
                </div>
              )}

              {/* Submit Buttons */}
              <div style={{ display: "flex", gap: 10 }}>
                <button
                  type="button"
                  onClick={() => setSelectedBookingForPayment(null)}
                  style={{
                    ...buttonStyle("secondary"),
                    flex: 1,
                    fontSize: 13,
                    padding: "10px",
                    borderRadius: 8,
                  }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isProcessingPayment}
                  style={{
                    ...buttonStyle("primary"),
                    flex: 2,
                    fontSize: 13,
                    padding: "10px",
                    borderRadius: 8,
                    background: `linear-gradient(135deg, ${maroonDark}, ${gold})`,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: 8,
                  }}
                >
                  {isProcessingPayment ? (
                    <span>⏳ Authorizing Payment...</span>
                  ) : (
                    <span>⚡ Complete ₹{(selectedBookingForPayment.amount || getBookingFee(selectedBookingForPayment.venue, selectedBookingForPayment.roomType)).toLocaleString()} Payment</span>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ══════════════════════════════════════════════════════════════
          DIGITAL PAYMENT RECEIPT MODAL
         ══════════════════════════════════════════════════════════════ */}
      {selectedBookingForReceipt && (
        <div
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: "rgba(0,0,0,0.65)",
            backdropFilter: "blur(4px)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 9999,
            padding: 16,
          }}
        >
          <div
            style={{
              background: "#FFFFFF",
              borderRadius: 14,
              maxWidth: 480,
              width: "100%",
              boxShadow: "0 20px 40px rgba(0,0,0,0.3)",
              overflow: "hidden",
              border: `2px solid ${sage}`,
            }}
          >
            {/* Receipt Header */}
            <div
              style={{
                background: `linear-gradient(135deg, #166534, #15803D)`,
                color: "#FFF",
                padding: "16px 20px",
                textAlign: "center",
              }}
            >
              <div style={{ fontSize: 28, marginBottom: 4 }}>🧾</div>
              <strong style={{ fontSize: 16, display: "block", letterSpacing: "0.05em" }}>
                OFFICIAL PAYMENT RECEIPT
              </strong>
              <div style={{ fontSize: 11, opacity: 0.9, marginTop: 2 }}>
                Central Educational Management System (CEMS)
              </div>
            </div>

            {/* Receipt Details Body */}
            <div style={{ padding: 20 }}>
              <div
                style={{
                  background: "#F6FBF7",
                  border: `1px solid ${sage}`,
                  borderRadius: 10,
                  padding: 14,
                  marginBottom: 16,
                  fontSize: 12,
                  display: "flex",
                  flexDirection: "column",
                  gap: 8,
                }}
              >
                <div style={{ display: "flex", justifyContent: "space-between" }}>
                  <span style={{ color: "#6B7280" }}>Receipt Reference:</span>
                  <strong style={{ color: maroonDark }}>{selectedBookingForReceipt.paymentTxnId || "UPI-2026-REG"}</strong>
                </div>
                <div style={{ display: "flex", justifyContent: "space-between" }}>
                  <span style={{ color: "#6B7280" }}>Booking ID:</span>
                  <strong>{selectedBookingForReceipt.id}</strong>
                </div>
                <div style={{ display: "flex", justifyContent: "space-between" }}>
                  <span style={{ color: "#6B7280" }}>Purpose / Event:</span>
                  <strong>{selectedBookingForReceipt.title}</strong>
                </div>
                <div style={{ display: "flex", justifyContent: "space-between" }}>
                  <span style={{ color: "#6B7280" }}>Venue / System:</span>
                  <strong>{selectedBookingForReceipt.venue}</strong>
                </div>
                <div style={{ display: "flex", justifyContent: "space-between" }}>
                  <span style={{ color: "#6B7280" }}>Payer:</span>
                  <strong>{selectedBookingForReceipt.applicant}</strong>
                </div>
                <div style={{ display: "flex", justifyContent: "space-between" }}>
                  <span style={{ color: "#6B7280" }}>Payment Channel:</span>
                  <strong style={{ color: "#166534" }}>{selectedBookingForReceipt.paymentMethod || "UPI"} Payment</strong>
                </div>
                <div style={{ display: "flex", justifyContent: "space-between" }}>
                  <span style={{ color: "#6B7280" }}>Payment Date:</span>
                  <span>{selectedBookingForReceipt.paidAt || new Date().toLocaleString()}</span>
                </div>

                <div
                  style={{
                    borderTop: "1px dashed #86EFAC",
                    paddingTop: 8,
                    marginTop: 4,
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                  }}
                >
                  <span style={{ fontSize: 13, fontWeight: 700, color: "#15803D" }}>Total Amount Paid:</span>
                  <span style={{ fontSize: 18, fontWeight: 900, color: "#166534" }}>
                    ₹{(selectedBookingForReceipt.amount || getBookingFee(selectedBookingForReceipt.venue, selectedBookingForReceipt.roomType)).toLocaleString()}
                  </span>
                </div>
              </div>

              {/* Verified Stamp */}
              <div style={{ textAlign: "center", marginBottom: 16 }}>
                <Stamp text="VERIFIED PAID 🟢" tone="sage" />
              </div>

              {/* Action Buttons */}
              <div style={{ display: "flex", gap: 10 }}>
                <button
                  type="button"
                  onClick={() => window.print()}
                  style={{
                    ...buttonStyle("secondary"),
                    flex: 1,
                    fontSize: 12,
                    padding: "8px",
                    borderRadius: 6,
                  }}
                >
                  🖨️ Print Receipt
                </button>
                <button
                  type="button"
                  onClick={() => setSelectedBookingForReceipt(null)}
                  style={{
                    ...buttonStyle("primary"),
                    flex: 1,
                    fontSize: 12,
                    padding: "8px",
                    borderRadius: 6,
                    background: "#166534",
                  }}
                >
                  Close Receipt
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
