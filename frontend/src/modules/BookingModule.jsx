import { useState, useEffect, useCallback } from "react";
import { Card, Label, Field, Stamp } from "../components/Shared";
import { inputStyle, buttonStyle, sage, brick, maroonDark, gold } from "../theme";

export const FOOD_MENU = [
  // ── Hot Beverages ──
  { id: "tea_normal", name: "Normal Tea", icon: "☕", price: 15, category: "Beverages" },
  { id: "tea_no_sugar", name: "Tea (No Sugar)", icon: "☕", price: 15, category: "Beverages" },
  { id: "tea_black", name: "Black Tea", icon: "☕", price: 10, category: "Beverages" },
  { id: "tea_masala", name: "Masala Tea", icon: "☕", price: 20, category: "Beverages" },
  { id: "tea_ginger", name: "Ginger Tea", icon: "☕", price: 20, category: "Beverages" },
  { id: "tea_green", name: "Green Tea", icon: "🍵", price: 25, category: "Beverages" },
  { id: "coffee_normal", name: "Normal Coffee", icon: "☕", price: 25, category: "Beverages" },
  { id: "coffee_black", name: "Black Coffee", icon: "☕", price: 20, category: "Beverages" },
  { id: "coffee_bru", name: "Bru Coffee", icon: "☕", price: 30, category: "Beverages" },
  { id: "coffee_filter", name: "Filter Coffee", icon: "☕", price: 25, category: "Beverages" },
  { id: "milk_badam", name: "Hot Badam Milk", icon: "🥛", price: 35, category: "Beverages" },
  { id: "milk_boost", name: "Boost / Horlicks", icon: "🥛", price: 30, category: "Beverages" },

  // ── Fresh Juices & Cold Drinks ──
  { id: "juice_apple", name: "Apple Juice", icon: "🧃", price: 40, category: "Juices" },
  { id: "juice_orange", name: "Orange Juice", icon: "🧃", price: 40, category: "Juices" },
  { id: "juice_mango", name: "Mango Juice", icon: "🧃", price: 50, category: "Juices" },
  { id: "juice_mixed", name: "Mixed Fruit Juice", icon: "🧃", price: 50, category: "Juices" },
  { id: "juice_watermelon", name: "Watermelon Juice", icon: "🍉", price: 35, category: "Juices" },
  { id: "juice_pineapple", name: "Pineapple Juice", icon: "🍍", price: 40, category: "Juices" },
  { id: "juice_lime", name: "Fresh Lime Juice", icon: "🍋", price: 25, category: "Juices" },
  { id: "juice_lime_soda", name: "Fresh Lime Soda", icon: "🥤", price: 30, category: "Juices" },
  { id: "juice_elaneer", name: "Tender Coconut Shake", icon: "🥥", price: 60, category: "Juices" },
  { id: "cold_coffee", name: "Cold Coffee with Ice Cream", icon: "🧋", price: 60, category: "Juices" },
  { id: "shake_mango", name: "Mango Milkshake", icon: "🥭", price: 55, category: "Juices" },
  { id: "shake_strawberry", name: "Strawberry Shake", icon: "🍓", price: 55, category: "Juices" },

  // ── Snacks, Puffs & Bakery ──
  { id: "snack_banana_fritter", name: "Banana Fritters (Pazham Pori)", icon: "🍌", price: 20, category: "Snacks" },
  { id: "snack_samosa", name: "Veg Samosa", icon: "🥟", price: 15, category: "Snacks" },
  { id: "snack_cutlet", name: "Veg Cutlet", icon: "🍘", price: 20, category: "Snacks" },
  { id: "snack_egg_puff", name: "Egg Puff", icon: "🥐", price: 25, category: "Snacks" },
  { id: "snack_chicken_puff", name: "Chicken Puff", icon: "🥐", price: 35, category: "Snacks" },
  { id: "snack_veg_puff", name: "Veg Puff", icon: "🥐", price: 20, category: "Snacks" },
  { id: "snack_burger", name: "Chicken Burger", icon: "🍔", price: 60, category: "Snacks" },
  { id: "snack_sandwich", name: "Veg Grilled Sandwich", icon: "🥪", price: 40, category: "Snacks" },
  { id: "snack_chicken_sandwich", name: "Chicken Sandwich", icon: "🥪", price: 55, category: "Snacks" },
  { id: "snack_chicken_roll", name: "Chicken Roll", icon: "🌯", price: 50, category: "Snacks" },
  { id: "snack_paneer_roll", name: "Paneer Roll", icon: "🌯", price: 45, category: "Snacks" },
  { id: "snack_sweet_bun", name: "Sweet Bun", icon: "🍞", price: 15, category: "Snacks" },
  { id: "snack_french_fries", name: "French Fries", icon: "🍟", price: 50, category: "Snacks" },
  { id: "snack_shawarma", name: "Chicken Shawarma", icon: "🥙", price: 90, category: "Snacks" },
  { id: "snack_spring_roll", name: "Veg Spring Roll", icon: "🥖", price: 35, category: "Snacks" },

  // ── Meals & Main Dishes ──
  { id: "lunch", name: "Veg Lunch Meal", icon: "🍛", price: 80, category: "Meals" },
  { id: "biriyani", name: "Chicken Biriyani", icon: "🍗", price: 130, category: "Meals" },
  { id: "biriyani_veg", name: "Veg Biriyani", icon: "🍚", price: 90, category: "Meals" },
  { id: "fried_rice_chicken", name: "Chicken Fried Rice", icon: "🍱", price: 120, category: "Meals" },
  { id: "fried_rice_veg", name: "Veg Fried Rice", icon: "🍱", price: 90, category: "Meals" },
  { id: "noodles_chicken", name: "Chicken Noodles", icon: "🍜", price: 120, category: "Meals" },
  { id: "noodles_veg", name: "Veg Noodles", icon: "🍜", price: 90, category: "Meals" },
  { id: "porotta_chicken", name: "Kerala Porotta (2 pcs) + Chicken Curry", icon: "🫓", price: 110, category: "Meals" },
  { id: "chappathi_paneer", name: "Chappathi (3 pcs) + Paneer Curry", icon: "🫓", price: 80, category: "Meals" },
  { id: "masala_dosa", name: "Masala Dosa", icon: "🥞", price: 50, category: "Meals" },
  { id: "ghee_roast", name: "Ghee Roast Dosa", icon: "🥞", price: 45, category: "Meals" },

  // ── Ice Creams & Desserts ──
  { id: "icecream_chocobar", name: "Chocobar", icon: "🍦", price: 30, category: "Desserts" },
  { id: "icecream_mangobar", name: "Mangobar", icon: "🥭", price: 30, category: "Desserts" },
  { id: "icecream_kulfi", name: "Kulfi", icon: "🍨", price: 20, category: "Desserts" },
  { id: "icecream_cone", name: "Cone Ice Cream", icon: "🍦", price: 40, category: "Desserts" },
  { id: "icecream_ball", name: "Ball Ice Cream", icon: "🍧", price: 25, category: "Desserts" },
  { id: "icecream_sipup", name: "Sipup", icon: "🧊", price: 10, category: "Desserts" },
  { id: "dessert_falooda", name: "Royal Falooda", icon: "🍧", price: 90, category: "Desserts" },
  { id: "dessert_gulab_jamun", name: "Gulab Jamun (2 pcs)", icon: "🥟", price: 40, category: "Desserts" },
  { id: "dessert_brownie", name: "Sizzling Brownie with Ice Cream", icon: "🍰", price: 80, category: "Desserts" },
  { id: "dessert_fruit_salad", name: "Fruit Salad with Ice Cream", icon: "🍨", price: 65, category: "Desserts" }
];

const getBookingFee = (venueName, roomTypeVal, acTypeVal, foodAmountVal, hostelFoodAmount = 0, hostelDays = 1) => {
  if (!venueName) return 1000;
  const v = venueName.toLowerCase();
  if (v.includes("auditorium")) return 15000;
  if (v.includes("hostel")) {
    let roomCost = 400; // default (Dormitory)
    if (roomTypeVal && roomTypeVal.includes("Single")) roomCost = 1500;
    if (roomTypeVal && roomTypeVal.includes("2 Share")) roomCost = 1000;
    if (roomTypeVal && roomTypeVal.includes("3 Share")) roomCost = 800;
    
    if (acTypeVal === "AC") roomCost += 500;
    
    return (roomCost * hostelDays) + hostelFoodAmount;
  }
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

export default function BookingModule({ role = "student", userName = "" }) {
  const [activeRole, setActiveRole] = useState(role);
  
  // Page view controller: "FORM" | "PAYMENT_PAGE" | "PIN_PAGE" | "SUCCESS_PAGE"
  const [pageView, setPageView] = useState("FORM");

  // Booking state - strictly fetched from backend for the authenticated user
  const [bookings, setBookings] = useState([]);
  const [isLoadingBookings, setIsLoadingBookings] = useState(true);

  // History Tab: "ALL" | "AUDITORIUM" | "HOSTEL" | "CANTEEN"
  const [historyTab, setHistoryTab] = useState("ALL");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [searchQuery, setSearchQuery] = useState("");
  const [showCreateForm, setShowCreateForm] = useState(true);

  // Food Menu Filters
  const [foodCategoryFilter, setFoodCategoryFilter] = useState("ALL");
  const [foodSearchQuery, setFoodSearchQuery] = useState("");

  // ── Rebooking State & Cross-Sync with Principal ──
  const [rebookingRequests, setRebookingRequests] = useState([]);
  const [rebookingRemarks, setRebookingRemarks] = useState({});
  const [actionLoadingReqId, setActionLoadingReqId] = useState(null);
  const [rebookingTargetBooking, setRebookingTargetBooking] = useState(null);
  const [rebookProposedDatetime, setRebookProposedDatetime] = useState("");
  const [rebookDescription, setRebookDescription] = useState("");
  const [isSubmittingRebook, setIsSubmittingRebook] = useState(false);
  const [rebookToast, setRebookToast] = useState("");
  const [canteenAcceptToast, setCanteenAcceptToast] = useState("");

  const fetchRebookingRequests = useCallback(async () => {
    const token = localStorage.getItem("cems_access");
    let localReqs = [];
    try {
      const raw = localStorage.getItem("cems_rebooking_requests");
      if (raw) localReqs = JSON.parse(raw);
    } catch (e) {}

    try {
      const res = await fetch("/api/bookings/rebookings/", {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      if (res.ok) {
        const data = await res.json();
        const serverList = Array.isArray(data) ? data : data.results || [];
        const map = new Map();
        localReqs.forEach((item) => map.set(item.id, item));
        serverList.forEach((item) => map.set(item.id, { ...map.get(item.id), ...item }));
        const merged = Array.from(map.values()).sort((a, b) => new Date(b.created_at || 0) - new Date(a.created_at || 0));
        setRebookingRequests(merged);
        localStorage.setItem("cems_rebooking_requests", JSON.stringify(merged));
      } else if (localReqs.length > 0) {
        setRebookingRequests(localReqs);
      }
    } catch {
      if (localReqs.length > 0) setRebookingRequests(localReqs);
    }
  }, []);

  const handleReviewRebooking = async (reqId, decision) => {
    setActionLoadingReqId(reqId);
    const remarks = rebookingRemarks[reqId] || (decision === "APPROVED" ? "Slot approved by Principal. Payment mechanism is active." : "Rejected due to scheduling conflicts.");
    const token = localStorage.getItem("cems_access");

    try {
      await fetch(`/api/bookings/rebookings/${reqId}/review/`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({ decision, remarks }),
      });
    } catch (e) {}

    setRebookingRequests((prev) => {
      const updated = prev.map((r) => r.id === reqId ? { ...r, status: decision, principal_remarks: remarks, reviewed_at: new Date().toISOString() } : r);
      try {
        localStorage.setItem("cems_rebooking_requests", JSON.stringify(updated));
        if (window.BroadcastChannel) {
          const bc = new BroadcastChannel("cems_rebooking_channel");
          bc.postMessage({ type: "REBOOK_UPDATED", data: updated });
          bc.close();
        }
      } catch (e) {}
      return updated;
    });

    setRebookToast(decision === "APPROVED" ? `✔ Rebooking #${reqId} Accepted! Payment mechanism is now ON for applicant.` : `✖ Rebooking #${reqId} rejected.`);
    setTimeout(() => setRebookToast(""), 4500);
    setActionLoadingReqId(null);
    fetchUserBookings();
  };

  const handleSubmitNewRebooking = async (e) => {
    e.preventDefault();
    if (!rebookingTargetBooking) return;
    if (!rebookProposedDatetime) {
      alert("Please choose the requested new event date and time.");
      return;
    }
    if (!rebookDescription || rebookDescription.trim().length < 10) {
      alert("Please provide the logistical reason in the Rebooking Description Box (at least 10 characters).");
      return;
    }
    setIsSubmittingRebook(true);
    const token = localStorage.getItem("cems_access");
    const rawId = rebookingTargetBooking.rawBackendId || parseInt(String(rebookingTargetBooking.id).replace(/\D/g, "")) || 1;

    const newReq = {
      id: Date.now(),
      original_booking: rawId,
      original_booking_title: rebookingTargetBooking.title,
      original_booking_amount: String(rebookingTargetBooking.amount || "2000.00"),
      original_booking_type: (rebookingTargetBooking.venue || "").toUpperCase().includes("AUDITORIUM") ? "AUDITORIUM" : (rebookingTargetBooking.venue || "").toUpperCase().includes("HOSTEL") ? "HOSTEL" : "CANTEEN",
      original_booking_datetime: rebookingTargetBooking.date,
      original_booking_status: "REBOOKING_REQUESTED",
      requested_by: userName || "Student",
      requested_by_id: 1,
      requested_by_name: userName || "Campus Member",
      requested_by_role: (activeRole || "STUDENT").toUpperCase(),
      description: rebookDescription.trim(),
      proposed_datetime: rebookProposedDatetime,
      status: "PENDING",
      reviewed_by: null,
      principal_remarks: "",
      reviewed_at: null,
      created_at: new Date().toISOString(),
      payment_status: "UNPAID",
    };

    try {
      const res = await fetch("/api/bookings/rebookings/", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({
          original_booking: rawId,
          proposed_datetime: rebookProposedDatetime,
          description: rebookDescription.trim(),
        }),
      });
      if (res.ok) {
        const created = await res.json();
        Object.assign(newReq, created);
      }
    } catch (e) {}

    setRebookingRequests((prev) => {
      const updated = [newReq, ...prev.filter((r) => r.id !== newReq.id)];
      try {
        localStorage.setItem("cems_rebooking_requests", JSON.stringify(updated));
        if (window.BroadcastChannel) {
          const bc = new BroadcastChannel("cems_rebooking_channel");
          bc.postMessage({ type: "REBOOK_UPDATED", data: updated });
          bc.close();
        }
      } catch (e) {}
      return updated;
    });

    setBookings((prev) => prev.map((b) => (b.id === rebookingTargetBooking.id ? { ...b, status: "REBOOKING_REQUESTED" } : b)));
    setIsSubmittingRebook(false);
    setRebookingTargetBooking(null);
    setRebookProposedDatetime("");
    setRebookDescription("");
    setRebookToast("✔ Rebooking Request submitted to Principal for review!");
    setTimeout(() => setRebookToast(""), 4500);
  };

  useEffect(() => {
    setActiveRole(role);
  }, [role]);

  // Helper to update bookings in local component state
  const updateBookings = (newBookingsOrFn) => {
    setBookings((prev) => {
      return typeof newBookingsOrFn === "function" ? newBookingsOrFn(prev) : newBookingsOrFn;
    });
  };


  // Fetch real backend bookings scoped strictly to the authenticated user
  const fetchUserBookings = () => {
    // Clear any legacy shared localStorage key so other users' mock data never leaks
    localStorage.removeItem("cems_shared_bookings");

    const token = localStorage.getItem("cems_access");
    if (!token) {
      setBookings([]);
      setIsLoadingBookings(false);
      return;
    }
    const headers = { Authorization: `Bearer ${token}`, "Content-Type": "application/json" };

    setIsLoadingBookings(true);
    fetch("/api/bookings/bookings/", { headers })
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (!data) {
          setBookings([]);
          setIsLoadingBookings(false);
          return;
        }
        const rawList = Array.isArray(data) ? data : data.results || [];
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
            rawBackendId: b.id,
            title: b.title || b.event_name || "Campus Event Booking",
            venue: venueName,
            applicant: b.user_full_name || (typeof b.user === "string" ? b.user : "Registered User"),
            applicantRole: b.user_role || "STUDENT",
            date: b.event_datetime ? b.event_datetime.split("T")[0] : b.date || "2026-09-10",
            status: b.status || "CONFIRMED",
            roomType: b.room_type || "N/A",
            hostelType: b.hostel_type || (b.title && b.title.toLowerCase().includes("girl") ? "GIRLS" : "BOYS"),
            adminReply: b.admin_reply || "",
            details: b.details || b.cancellation_reason || b.purpose || `${venueName} booking request recorded.`,
            submittedAt: b.created_at ? b.created_at.split("T")[0] : "2026-09-01",
            amount: Number(b.amount) || 0,
            paymentStatus: b.payment_status || "UNPAID",
            paymentMethod: b.payment_method || null,
            paymentTxnId: b.payment_txn_id || null,
            paidAt: b.paid_at || null,
            rawBooking: b,
          };
        });

        setBookings(formatted);
        setIsLoadingBookings(false);
      })
      .catch(() => {
        setBookings([]);
        setIsLoadingBookings(false);
      });
  };

  useEffect(() => {
    fetchUserBookings();
    fetchRebookingRequests();

    const interval = setInterval(() => {
      fetchRebookingRequests();
      fetchUserBookings();
    }, 3500);

    let bc = null;
    if (window.BroadcastChannel) {
      bc = new BroadcastChannel("cems_rebooking_channel");
      bc.onmessage = (ev) => {
        if (ev.data?.type === "REBOOK_UPDATED" && Array.isArray(ev.data.data)) {
          setRebookingRequests(ev.data.data);
        } else {
          fetchRebookingRequests();
        }
        fetchUserBookings();
      };
    }

    let canteenBc = null;
    if (window.BroadcastChannel) {
      canteenBc = new BroadcastChannel("cems_canteen_channel");
      canteenBc.onmessage = (ev) => {
        if (ev.data?.type === "CANTEEN_STATUS_UPDATED") {
          const { orderId, status, adminReply } = ev.data;
          fetchUserBookings();
          if (status === "CONFIRMED" || status === "APPROVED") {
            setCanteenAcceptToast(`🍱 Canteen Staff has ACCEPTED order ${orderId}! ${adminReply ? `Notice: "${adminReply}"` : "Food preparation is in progress."}`);
            setTimeout(() => setCanteenAcceptToast(""), 7000);
          }
        } else if (ev.data?.type === "CANTEEN_ORDER_CREATED") {
          fetchUserBookings();
        }
      };
    }

    return () => {
      clearInterval(interval);
      if (bc) bc.close();
      if (canteenBc) canteenBc.close();
    };
  }, [activeRole, fetchRebookingRequests]);


  const isStudent = activeRole === "student";
  const isPrincipal = activeRole === "principal" || activeRole === "admin";

  const [venue, setVenue] = useState(isStudent ? "Hostel" : "Auditorium");
  const [eventName, setEventName] = useState("");
  const [date, setDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [hostelDurationType, setHostelDurationType] = useState("single");
  const [roomType, setRoomType] = useState("Single Room");
  const [acType, setAcType] = useState("Non-AC");
  const [hostelType, setHostelType] = useState("BOYS");
  const [error, setError] = useState("");

  // If student role is detected, Auditorium booking is not allowed; default to Hostel
  useEffect(() => {
    if (isStudent && venue === "Auditorium") {
      setVenue("Hostel");
    }
  }, [isStudent, venue]);

  // If student role is active, keep historyTab away from AUDITORIUM
  useEffect(() => {
    if (isStudent && historyTab === "AUDITORIUM") {
      setHistoryTab("ALL");
    }
  }, [isStudent, historyTab]);

  // Hostel Mess Food state (Per day)
  const [hostelFoodByDay, setHostelFoodByDay] = useState({});

  const getDays = (start, end) => {
    if (!start || !end) return 1;
    const s = new Date(start);
    const e = new Date(end);
    const diff = Math.ceil((e - s) / (1000 * 60 * 60 * 24));
    return diff > 0 ? diff + 1 : 1; 
  };

  const currentHostelDays = venue === "Hostel" && hostelDurationType === "multiple" ? getDays(date, endDate) : 1;

  // Food Menu state (key: itemId, value: integer quantity)
  const [foodQuantities, setFoodQuantities] = useState({});

  // Correct quantity increment / decrement
  const handleFoodQtyChange = (id, delta) => {
    setFoodQuantities((prev) => {
      const current = prev[id] || 0;
      const next = Math.max(0, current + delta);
      return { ...prev, [id]: next };
    });
  };

  // Direct numeric input handler
  const handleFoodQtyDirectInput = (id, valStr) => {
    const parsed = parseInt(valStr, 10);
    setFoodQuantities((prev) => ({
      ...prev,
      [id]: isNaN(parsed) || parsed < 0 ? 0 : Math.min(999, parsed)
    }));
  };

  // Quick addition (+5, +10, +25, etc.)
  const handleFoodQtyQuickAdd = (id, amount) => {
    setFoodQuantities((prev) => {
      const current = prev[id] || 0;
      return { ...prev, [id]: Math.min(999, current + amount) };
    });
  };

  const totalFoodQuantity = FOOD_MENU.reduce((sum, item) => sum + (foodQuantities[item.id] || 0), 0);
  const totalFoodAmount = FOOD_MENU.reduce((sum, item) => sum + (foodQuantities[item.id] || 0) * item.price, 0);

  // ── Dedicated Payment Gateway State ──
  const [checkoutBooking, setCheckoutBooking] = useState(null);
  const [payMethod, setPayMethod] = useState("UPI");
  const [upiIdInput, setUpiIdInput] = useState("student@okaxis");
  const [cardDetails, setCardDetails] = useState({ number: "", expiry: "", cvv: "" });
  const [selectedBank, setSelectedBank] = useState("State Bank of India");
  const [paymentMethodError, setPaymentMethodError] = useState("");
  
  // Security PIN and Confirm PIN state (Dedicated Page Step)
  const [paymentPin, setPaymentPin] = useState("");
  const [confirmPin, setConfirmPin] = useState("");
  const [showPin, setShowPin] = useState(false);
  const [showConfirmPin, setShowConfirmPin] = useState(false);
  const [pinError, setPinError] = useState("");
  const [isProcessingPayment, setIsProcessingPayment] = useState(false);

  // Success Receipt State
  const [paymentSuccessReceipt, setPaymentSuccessReceipt] = useState(null);
  const [selectedBookingForReceipt, setSelectedBookingForReceipt] = useState(null);

  // Step 1: Validate Form & Go to Step 2 (Payment Method Page)
  const handleProceedToPayment = (e) => {
    e.preventDefault();
    setError("");

    if (isStudent && venue === "Auditorium") {
      setError("⚠️ Students are not permitted to book the Auditorium. Only Faculty & Class Representatives can book the Auditorium.");
      return;
    }

    if (!eventName || !date || (venue === "Hostel" && hostelDurationType === "multiple" && !endDate)) {
      setError("Please fill in all required event titles and dates.");
      return;
    }

    if (venue === "Canteen / program food" && totalFoodQuantity === 0) {
      setError("⚠️ Please select quantity for at least one food menu item (Tea, Coffee, Juice, Snacks, Meals, etc.).");
      return;
    }

    const hostelDays = currentHostelDays;

    let hostelFoodCost = 0;
    const messSelectionsByDay = [];
    
    for (let i = 0; i < hostelDays; i++) {
      const dayFood = hostelFoodByDay[i] || { breakfast: false, lunch: false, teaSnacks: false, dinner: false };
      const dayCost = 
        (dayFood.breakfast ? 50 : 0) + 
        (dayFood.lunch ? 80 : 0) + 
        (dayFood.teaSnacks ? 30 : 0) + 
        (dayFood.dinner ? 80 : 0);
      hostelFoodCost += dayCost;

      const daySelections = [
        dayFood.breakfast && "Breakfast", 
        dayFood.lunch && "Lunch", 
        dayFood.teaSnacks && "4 PM Tea & Snacks", 
        dayFood.dinner && "Dinner"
      ].filter(Boolean);

      if (daySelections.length > 0) {
        messSelectionsByDay.push(`Day ${i + 1}: ${daySelections.join(", ")}`);
      }
    }

    let bookingDetails = "";
    if (venue === "Canteen / program food") {
      const orderedList = FOOD_MENU.filter((item) => (foodQuantities[item.id] || 0) > 0)
        .map((item) => `${item.icon} ${item.name}: ${foodQuantities[item.id]} × ₹${item.price} = ₹${foodQuantities[item.id] * item.price}`)
        .join(", ");
      bookingDetails = `Food Pre-Order Menu: ${orderedList} | Total Items: ${totalFoodQuantity} | Grand Total: ₹${totalFoodAmount}`;
    } else if (venue === "Hostel") {
      const messText = messSelectionsByDay.length > 0 ? ` | Mess Food: [${messSelectionsByDay.join(" | ")}]` : "";
      const dateText = hostelDurationType === "multiple" ? `${date} to ${endDate} (${hostelDays} days)` : date;
      bookingDetails = `Hostel booking requested for ${eventName} scheduled on ${dateText}. Room: ${roomType} (${acType})${messText}`;
    } else {
      bookingDetails = `${venue} booking requested for ${eventName} scheduled on ${date}.`;
    }

    const calculatedFee = getBookingFee(venue, roomType, acType, totalFoodAmount, hostelFoodCost, hostelDays);

    const draftBooking = {
      id: `BK-DRAFT`,
      title: eventName,
      venue,
      applicant: userName || (isStudent ? "Student" : activeRole === "faculty" ? "Faculty Member" : activeRole === "class_rep" ? "Class Representative" : "Applicant"),
      applicantRole: activeRole.toUpperCase(),
      date: hostelDurationType === "multiple" ? `${date} to ${endDate}` : date,
      status: "PENDING_APPROVAL",
      roomType: venue === "Hostel" ? `${roomType} (${acType})` : "N/A",
      hostelType: venue === "Hostel" ? (hostelType || "BOYS") : "",
      amount: calculatedFee,
      details: bookingDetails,
      submittedAt: new Date().toISOString().split("T")[0],
      isNewForm: true,
      rawEventName: eventName,
      rawDate: date,
      rawEndDate: hostelDurationType === "multiple" ? endDate : null,
      rawVenue: venue,
      rawRoomType: venue === "Hostel" ? `${roomType} (${acType})` : "N/A",
      rawTotalFoodQuantity: totalFoodQuantity,
      rawFoodQuantities: foodQuantities,
    };

    setCheckoutBooking(draftBooking);
    setPaymentMethodError("");
    setPaymentPin("");
    setConfirmPin("");
    setPinError("");
    setPageView("PAYMENT_PAGE");
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  // Step 2: Validate Payment Method & Proceed to Next Page (PIN Verification)
  const handleProceedToPinPage = (e) => {
    e.preventDefault();
    setPaymentMethodError("");

    if (payMethod === "UPI" && !upiIdInput.trim()) {
      setPaymentMethodError("⚠️ Please enter a valid UPI ID (e.g. yourname@okaxis).");
      return;
    }

    if (payMethod === "CARD" && (!cardDetails.number || cardDetails.number.replace(/\s/g, "").length < 16)) {
      setPaymentMethodError("⚠️ Please enter a valid 16-digit Card Number.");
      return;
    }

    setPaymentPin("");
    setConfirmPin("");
    setPinError("");
    setPageView("PIN_PAGE");
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  // Step 3: Submit Payment on PIN Page
  const handleSubmitPayment = async (e) => {
    e.preventDefault();
    setPinError("");

    if (!checkoutBooking) return;

    // Strict PIN & Confirm PIN Validation
    if (!paymentPin || !paymentPin.trim()) {
      setPinError("⚠️ Please enter your Security PIN.");
      return;
    }

    if (!/^\d{4,6}$/.test(paymentPin.trim())) {
      setPinError("⚠️ PIN must be a 4 to 6 digit numeric code (e.g. 1234 or 123456).");
      return;
    }

    if (!confirmPin || !confirmPin.trim()) {
      setPinError("⚠️ Please re-enter your PIN in the Confirm PIN field.");
      return;
    }

    if (paymentPin.trim() !== confirmPin.trim()) {
      setPinError("⚠️ Security PIN and Confirm PIN do not match! Please check and re-type.");
      return;
    }

    setIsProcessingPayment(true);

    const txnRef = `${payMethod}-2026-${Math.floor(100000 + Math.random() * 900000)}`;
    const paidTime = new Date().toLocaleString();
    const token = localStorage.getItem("cems_access");
    const headers = token
      ? { Authorization: `Bearer ${token}`, "Content-Type": "application/json" }
      : { "Content-Type": "application/json" };

    let realBookingId = checkoutBooking.rawBackendId;

    try {
      if (checkoutBooking.isNewForm) {
        const venueLower = checkoutBooking.venue.toLowerCase();
        const bookingType = venueLower.includes("auditorium")
          ? "AUDITORIUM"
          : venueLower.includes("hostel")
          ? "HOSTEL"
          : "CANTEEN";

        const bookingPayload = {
          title: checkoutBooking.rawEventName || checkoutBooking.title,
          booking_type: bookingType,
          room_type: checkoutBooking.rawRoomType || checkoutBooking.roomType || "N/A",
          hostel_type: checkoutBooking.hostelType || (bookingType === "HOSTEL" ? "BOYS" : ""),
          seats_or_units: checkoutBooking.rawTotalFoodQuantity || 1,
          amount: checkoutBooking.amount,
          event_datetime: checkoutBooking.rawDate ? `${checkoutBooking.rawDate}T10:00:00Z` : new Date().toISOString(),
          end_datetime: checkoutBooking.rawEndDate ? `${checkoutBooking.rawEndDate}T10:00:00Z` : null,
          details: checkoutBooking.details || "",
          order_items: checkoutBooking.rawFoodQuantities || {},
        };

        const bRes = await fetch("/api/bookings/bookings/", {
          method: "POST",
          headers,
          body: JSON.stringify(bookingPayload),
        });

        if (bRes.ok) {
          const createdBackendBooking = await bRes.json();
          realBookingId = createdBackendBooking.id;
        } else {
          const errData = await bRes.json();
          console.error("Failed to create booking:", errData);
        }
      }

      // Record payment against the real booking ID
      if (realBookingId) {
        await fetch("/api/payments/payments/", {
          method: "POST",
          headers,
          body: JSON.stringify({
            booking: realBookingId,
            amount: checkoutBooking.amount,
            method: payMethod,
            transaction_reference: txnRef,
            status: "SUCCESS",
          }),
        });
      }
    } catch (err) {
      console.error("Backend booking/payment error:", err);
    }

    const isCanteenBooking = String(checkoutBooking.venue || "").toLowerCase().includes("canteen") || String(checkoutBooking.venue || "").toLowerCase().includes("food");
    const initialBookingStatus = isCanteenBooking ? "PENDING" : "CONFIRMED";

    const completedBooking = {
      ...checkoutBooking,
      id: realBookingId ? `BK-${realBookingId}` : checkoutBooking.id,
      rawBackendId: realBookingId,
      status: initialBookingStatus,
      paymentStatus: "PAID",
      paymentMethod: payMethod,
      paymentTxnId: txnRef,
      paidAt: paidTime,
    };

    if (isCanteenBooking) {
      try {
        const stored = localStorage.getItem("cems_canteen_orders");
        let list = stored ? JSON.parse(stored) : [];
        const formattedCanteenOrder = {
          id: completedBooking.id,
          rawBackendId: realBookingId,
          title: completedBooking.title,
          applicant: completedBooking.applicant,
          applicantRole: completedBooking.applicantRole,
          date: completedBooking.rawDate || completedBooking.date,
          canteenStatus: "PENDING",
          paymentStatus: "PAID",
          paymentMethod: payMethod,
          paymentTxnId: txnRef,
          items: completedBooking.rawFoodQuantities || {},
          details: completedBooking.details || "",
          amount: completedBooking.amount,
          submittedAt: new Date().toISOString().split("T")[0],
          adminReply: "",
          rejectionReason: "",
        };
        list = [formattedCanteenOrder, ...list.filter((x) => x.id !== completedBooking.id)];
        localStorage.setItem("cems_canteen_orders", JSON.stringify(list));

        if (window.BroadcastChannel) {
          const bc = new BroadcastChannel("cems_canteen_channel");
          bc.postMessage({ type: "CANTEEN_ORDER_CREATED", order: formattedCanteenOrder });
          bc.close();
        }
      } catch (e) {}
    }

    if (checkoutBooking.isNewForm) {
      setBookings((prev) => [completedBooking, ...prev]);

      // Reset the form inputs
      setEventName("");
      setDate("");
      setEndDate("");
      setHostelDurationType("single");
      setHostelFoodByDay({});
      setFoodQuantities({});
    } else {
      setBookings((prev) =>
        prev.map((b) => (b.id === checkoutBooking.id ? completedBooking : b))
      );
    }

    setIsProcessingPayment(false);
    setPaymentSuccessReceipt(completedBooking);
    setPageView("SUCCESS_PAGE");
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  // Open payment for an existing unpaid booking
  const handleOpenPaymentForExisting = (item) => {
    setCheckoutBooking({
      ...item,
      rawBackendId: item.rawBackendId || String(item.id).replace("BK-", ""),
      isNewForm: false,
    });
    setPaymentMethodError("");
    setPaymentPin("");
    setConfirmPin("");
    setPinError("");
    setPayMethod("UPI");
    setPageView("PAYMENT_PAGE");
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleUpdateStatus = async (id, newStatus) => {
    const numericId = String(id).replace("BK-", "");
    const token = localStorage.getItem("cems_access");
    if (token) {
      try {
        await fetch(`/api/bookings/bookings/${numericId}/`, {
          method: "PATCH",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ status: newStatus }),
        });
      } catch (e) {}
    }
    setBookings((prev) =>
      prev.map((b) => (b.id === id ? { ...b, status: newStatus } : b))
    );
  };

  // Filter bookings by Venue Category Tab and Status/Search
  const filteredBookings = bookings.filter((b) => {
    // 1. Category Tab Filter
    if (historyTab === "AUDITORIUM" && !b.venue.toLowerCase().includes("auditorium")) return false;
    if (historyTab === "HOSTEL" && !b.venue.toLowerCase().includes("hostel")) return false;
    if (historyTab === "CANTEEN" && !(b.venue.toLowerCase().includes("canteen") || b.venue.toLowerCase().includes("food"))) return false;

    // 2. Status Filter
    if (statusFilter === "PENDING" && !b.status.includes("PENDING")) return false;
    if (statusFilter === "CONFIRMED" && b.status !== "CONFIRMED" && b.status !== "APPROVED") return false;
    if (statusFilter === "PAID" && b.paymentStatus !== "PAID") return false;
    if (statusFilter === "UNPAID" && b.paymentStatus === "PAID") return false;

    // 3. Search Query
    const q = searchQuery.toLowerCase().trim();
    if (q) {
      const matchTitle = b.title && b.title.toLowerCase().includes(q);
      const matchId = b.id && b.id.toLowerCase().includes(q);
      const matchApplicant = b.applicant && b.applicant.toLowerCase().includes(q);
      const matchVenue = b.venue && b.venue.toLowerCase().includes(q);
      const matchDetails = b.details && b.details.toLowerCase().includes(q);
      if (!matchTitle && !matchId && !matchApplicant && !matchVenue && !matchDetails) return false;
    }

    return true;
  });

  const counts = {
    all: bookings.length,
    auditorium: bookings.filter((b) => b.venue.toLowerCase().includes("auditorium")).length,
    hostel: bookings.filter((b) => b.venue.toLowerCase().includes("hostel")).length,
    canteen: bookings.filter((b) => b.venue.toLowerCase().includes("canteen") || b.venue.toLowerCase().includes("food")).length,
  };

  const getStatusBadge = (status, venue = "") => {
    const isCanteen = String(venue || "").toLowerCase().includes("canteen") || String(venue || "").toLowerCase().includes("food");
    if (isCanteen) {
      if (status === "CONFIRMED" || status === "APPROVED") {
        return (
          <div style={{ display: "flex", flexDirection: "column", gap: 3, alignItems: "center" }}>
            <span style={{
              fontSize: 11, fontWeight: 800, color: "#15803D", background: "#DCFCE7",
              border: "1.5px solid #86EFAC", padding: "4px 10px", borderRadius: 20,
              display: "inline-flex", alignItems: "center", gap: 4, whiteSpace: "nowrap",
              boxShadow: "0 1px 3px rgba(22,163,74,0.15)"
            }}>
              ✔ Accepted
            </span>
            <span style={{ fontSize: 10, color: "#166534", fontWeight: 700 }}>
              👨‍🍳 Preparing Food
            </span>
          </div>
        );
      }
      if (status.includes("PENDING")) {
        return (
          <div style={{ display: "flex", flexDirection: "column", gap: 3, alignItems: "center" }}>
            <span style={{
              fontSize: 11, fontWeight: 800, color: "#B45309", background: "#FEF3C7",
              border: "1.5px solid #FCD34D", padding: "4px 10px", borderRadius: 20,
              display: "inline-flex", alignItems: "center", gap: 4, whiteSpace: "nowrap"
            }}>
              ⏳ Awaiting Accept
            </span>
            <span style={{ fontSize: 10, color: "#92400E", fontWeight: 600 }}>
              Under Staff Review
            </span>
          </div>
        );
      }
      if (status === "CANCELLED" || status === "REJECTED") {
        return (
          <span style={{
            fontSize: 11, fontWeight: 800, color: "#B91C1C", background: "#FEE2E2",
            border: "1.5px solid #FCA5A5", padding: "4px 10px", borderRadius: 20,
            display: "inline-flex", alignItems: "center", gap: 4, whiteSpace: "nowrap"
          }}>
            ✖ Declined
          </span>
        );
      }
    }

    if (status === "REBOOKING_REQUESTED") {
      return <Stamp text="🔄 Rebooking Requested" tone="brass" />;
    }
    if (status === "REBOOKED") {
      return <Stamp text="✅ Rebooking Authorized" tone="sage" />;
    }
    if (status === "CONFIRMED" || status === "APPROVED") {
      return <Stamp text="Approved / Confirmed" tone="sage" />;
    }
    if (status === "COMPLETED") {
      return <Stamp text="Completed History" tone="gold" />;
    }
    if (status.includes("PENDING")) {
      return <Stamp text="Pending Review" tone="brass" />;
    }
    return <Stamp text="Cancelled / Declined" tone="brick" />;
  };


  // Filtered Food Menu
  const displayedFoodMenu = FOOD_MENU.filter((item) => {
    const matchCat = foodCategoryFilter === "ALL" || item.category === foodCategoryFilter;
    const matchSearch = !foodSearchQuery || item.name.toLowerCase().includes(foodSearchQuery.toLowerCase());
    return matchCat && matchSearch;
  });

  return (
    <div style={{ maxWidth: 960, margin: "0 auto", paddingBottom: 40, position: "relative" }}>
      {/* ── Canteen Acceptance Real-Time Alert Toast ── */}
      {canteenAcceptToast && (
        <div style={{
          position: "fixed",
          top: 80,
          right: 24,
          zIndex: 9999,
          background: "linear-gradient(135deg, #059669 0%, #064E3B 100%)",
          color: "#FFFFFF",
          padding: "16px 22px",
          borderRadius: 14,
          boxShadow: "0 10px 30px rgba(5, 150, 105, 0.45)",
          display: "flex",
          alignItems: "center",
          gap: 14,
          border: "2px solid #6EE7B7",
          animation: "slideDown 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
          maxWidth: 420,
        }}>
          <span style={{ fontSize: 28 }}>🍱</span>
          <div style={{ flex: 1 }}>
            <div style={{ fontWeight: 800, fontSize: 14, color: "#FDE68A" }}>
              Canteen Order Accepted!
            </div>
            <div style={{ fontSize: 12, marginTop: 3, lineHeight: 1.4 }}>
              {canteenAcceptToast}
            </div>
          </div>
          <button
            onClick={() => setCanteenAcceptToast("")}
            style={{
              background: "rgba(255,255,255,0.2)",
              border: "none",
              color: "#FFF",
              borderRadius: "50%",
              width: 24,
              height: 24,
              cursor: "pointer",
              fontWeight: 800,
              fontSize: 12,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            ✕
          </button>
        </div>
      )}
      {/* ══════════════════════════════════════════════════════════════
          PAGE 2: PAYMENT METHOD SELECTION
         ══════════════════════════════════════════════════════════════ */}
      {pageView === "PAYMENT_PAGE" && checkoutBooking && (
        <div style={{ animation: "fadeIn 0.25s ease" }}>
          {/* Breadcrumb / Step bar */}
          <div style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            background: "#FFFFFF",
            border: "1.5px solid #A7F3D0",
            borderRadius: 12,
            padding: "12px 18px",
            marginBottom: 20,
            boxShadow: "0 2px 8px rgba(5,150,105,0.06)",
          }}>
            <button
              type="button"
              onClick={() => setPageView("FORM")}
              style={{
                background: "#F0FDF4",
                border: "1px solid #A7F3D0",
                borderRadius: 8,
                padding: "6px 14px",
                fontSize: 12,
                fontWeight: 700,
                color: "#065F46",
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                gap: 6,
              }}
            >
              ← Back to Booking Details
            </button>
            <div style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 12, fontWeight: 700 }}>
              <span style={{ color: "#059669" }}>1. Details ✓</span>
              <span style={{ color: "#CBD5E1" }}>➔</span>
              <span style={{ color: "#581124", background: "#FEF2F2", padding: "3px 10px", borderRadius: 9999, border: "1px solid #FECACA" }}>
                2. Select Method 💳
              </span>
              <span style={{ color: "#CBD5E1" }}>➔</span>
              <span style={{ color: "#94A3B8" }}>3. PIN Verification 🔒</span>
              <span style={{ color: "#CBD5E1" }}>➔</span>
              <span style={{ color: "#94A3B8" }}>4. Confirmation</span>
            </div>
          </div>

          <Card style={{ padding: 24, border: "2px solid #059669", boxShadow: "0 10px 30px rgba(5,150,105,0.12)" }}>
            {/* Payment Page Header Banner */}
            <div style={{
              background: "linear-gradient(135deg, #581124 0%, #380A15 100%)",
              color: "#FFF",
              padding: "18px 22px",
              borderRadius: 12,
              marginBottom: 20,
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
            }}>
              <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
                <span style={{ fontSize: 32 }}>💳</span>
                <div>
                  <strong style={{ fontSize: 18, display: "block", color: "#FDE68A" }}>
                    Select Payment Method
                  </strong>
                  <div style={{ fontSize: 12, opacity: 0.9, marginTop: 2 }}>
                    Step 2 of 3: Choose your preferred payment mode
                  </div>
                </div>
              </div>
              <div style={{
                background: "rgba(255,255,255,0.12)",
                border: "1px solid rgba(255,255,255,0.25)",
                padding: "6px 14px",
                borderRadius: 8,
                textAlign: "right",
              }}>
                <div style={{ fontSize: 10, opacity: 0.8, textTransform: "uppercase" }}>Ref Booking</div>
                <div style={{ fontWeight: 800, fontSize: 13, color: "#A7F3D0" }}>{checkoutBooking.id}</div>
              </div>
            </div>

            <form onSubmit={handleProceedToPinPage}>
              {/* Order Bill Summary */}
              <div style={{
                background: "#F0FDF4",
                border: "1.5px solid #A7F3D0",
                borderRadius: 12,
                padding: 16,
                marginBottom: 20,
              }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 10 }}>
                  <div>
                    <span style={{
                      fontSize: 11, fontWeight: 800, color: "#065F46", background: "#D1FAE5",
                      padding: "2px 8px", borderRadius: 4, textTransform: "uppercase", display: "inline-block", marginBottom: 6
                    }}>
                      📍 {checkoutBooking.venue} {checkoutBooking.roomType && checkoutBooking.roomType !== "N/A" ? `(${checkoutBooking.roomType})` : ""}
                    </span>
                    <div style={{ fontSize: 16, fontWeight: 800, color: "#581124" }}>
                      {checkoutBooking.title}
                    </div>
                  </div>
                  <div style={{ textAlign: "right" }}>
                    <div style={{ fontSize: 11, color: "#065F46", fontWeight: 600 }}>Total Payable</div>
                    <div style={{ fontSize: 24, fontWeight: 900, color: "#059669" }}>
                      ₹{checkoutBooking.amount?.toLocaleString()}
                    </div>
                  </div>
                </div>

                <div style={{ fontSize: 12, color: "#334155", background: "#FFFFFF", padding: "10px 12px", borderRadius: 8, border: "1px solid #E2E8F0" }}>
                  <strong>Booking Details:</strong> {checkoutBooking.details}
                </div>
              </div>

              {/* Payment Method Selector Tabs */}
              <div style={{ marginBottom: 20 }}>
                <label style={{ fontSize: 13, fontWeight: 800, color: "#581124", display: "block", marginBottom: 8 }}>
                  Choose Payment Option:
                </label>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
                  {[
                    { id: "UPI", label: "📱 UPI (GPay / PhonePe / Paytm)", desc: "Instant UPI ID / QR Payment" },
                    { id: "CARD", label: "💳 Debit / Credit Card", desc: "Visa, Mastercard, RuPay Cards" },
                    { id: "NET_BANKING", label: "🏦 Net Banking", desc: "State Bank, HDFC, ICICI, Axis" },
                    { id: "WALLET", label: "👛 Campus Wallet", desc: "Available Balance: ₹25,000" },
                  ].map((m) => (
                    <button
                      key={m.id}
                      type="button"
                      onClick={() => {
                        setPayMethod(m.id);
                        setPaymentMethodError("");
                      }}
                      style={{
                        padding: "12px 14px",
                        borderRadius: 10,
                        border: `2px solid ${payMethod === m.id ? "#059669" : "#E2E8F0"}`,
                        background: payMethod === m.id ? "#F0FDF4" : "#FFFFFF",
                        color: payMethod === m.id ? "#065F46" : "#334155",
                        fontWeight: payMethod === m.id ? 800 : 600,
                        fontSize: 13,
                        cursor: "pointer",
                        textAlign: "left",
                        transition: "all 0.15s ease",
                        boxShadow: payMethod === m.id ? "0 4px 12px rgba(5,150,105,0.15)" : "none",
                      }}
                    >
                      <div>{m.label}</div>
                      <div style={{ fontSize: 11, opacity: 0.7, marginTop: 2 }}>{m.desc}</div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Method Dependent Fields */}
              {payMethod === "UPI" && (
                <div style={{
                  background: "#F8FAFC", border: "1.5px solid #CBD5E1", borderRadius: 10,
                  padding: 16, marginBottom: 20
                }}>
                  <label style={{ fontSize: 12, fontWeight: 700, color: "#334155", display: "block", marginBottom: 6 }}>
                    Enter Virtual Payment Address (UPI ID / VPA):
                  </label>
                  <input
                    type="text"
                    value={upiIdInput}
                    onChange={(e) => setUpiIdInput(e.target.value)}
                    placeholder="e.g. 9876543210@paytm or student@okaxis"
                    style={{ ...inputStyle, marginBottom: 8, background: "#FFF" }}
                  />
                  <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginBottom: 12 }}>
                    {["@okaxis", "@okhdfcbank", "@okicici", "@ybl", "@paytm", "@upi"].map((tag) => (
                      <button
                        key={tag}
                        type="button"
                        onClick={() => {
                          const base = upiIdInput.split("@")[0] || "student";
                          setUpiIdInput(`${base}${tag}`);
                        }}
                        style={{
                          background: "#FFF", border: "1px solid #CBD5E1", borderRadius: 4,
                          padding: "3px 8px", fontSize: 11, color: "#475569", cursor: "pointer",
                        }}
                      >
                        {tag}
                      </button>
                    ))}
                  </div>

                  {/* QR Code view */}
                  <div style={{
                    display: "flex", alignItems: "center", gap: 14,
                    background: "#FFF", padding: 10, borderRadius: 8, border: "1px dashed #A7F3D0"
                  }}>
                    <div style={{
                      width: 60, height: 60, background: "#065F46", color: "#FFF",
                      borderRadius: 6, display: "flex", flexDirection: "column",
                      alignItems: "center", justifyContent: "center", fontSize: 10, fontWeight: 800
                    }}>
                      <span style={{ fontSize: 20 }}>📲</span>
                      <span>UPI QR</span>
                    </div>
                    <div style={{ fontSize: 11, color: "#475569" }}>
                      <div>Scan with any UPI App (GPay, PhonePe, Paytm, BHIM)</div>
                      <div style={{ fontWeight: 700, color: "#065F46", marginTop: 2 }}>VPA: cems.official@icici</div>
                    </div>
                  </div>
                </div>
              )}

              {payMethod === "CARD" && (
                <div style={{
                  background: "#F8FAFC", border: "1.5px solid #CBD5E1", borderRadius: 10,
                  padding: 16, marginBottom: 20
                }}>
                  <div style={{ marginBottom: 10 }}>
                    <label style={{ fontSize: 12, fontWeight: 700, color: "#334155", display: "block", marginBottom: 4 }}>
                      Card Number
                    </label>
                    <input
                      type="text"
                      maxLength={19}
                      placeholder="4532 •••• •••• 8912"
                      value={cardDetails.number}
                      onChange={(e) => {
                        const v = e.target.value.replace(/[^0-9]/g, "").slice(0, 16);
                        setCardDetails({ ...cardDetails, number: v.replace(/(\d{4})(?=\d)/g, "$1 ").trim() });
                      }}
                      style={{ ...inputStyle, background: "#FFF" }}
                    />
                  </div>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
                    <div>
                      <label style={{ fontSize: 12, fontWeight: 700, color: "#334155", display: "block", marginBottom: 4 }}>
                        Expiry (MM/YY)
                      </label>
                      <input
                        type="text"
                        maxLength={5}
                        placeholder="MM/YY"
                        value={cardDetails.expiry}
                        onChange={(e) => {
                          let v = e.target.value.replace(/[^0-9]/g, "").slice(0, 4);
                          if (v.length > 2) v = v.slice(0, 2) + "/" + v.slice(2);
                          setCardDetails({ ...cardDetails, expiry: v });
                        }}
                        style={{ ...inputStyle, background: "#FFF" }}
                      />
                    </div>
                    <div>
                      <label style={{ fontSize: 12, fontWeight: 700, color: "#334155", display: "block", marginBottom: 4 }}>
                        CVV
                      </label>
                      <input
                        type="password"
                        maxLength={3}
                        placeholder="•••"
                        value={cardDetails.cvv}
                        onChange={(e) => setCardDetails({ ...cardDetails, cvv: e.target.value.replace(/[^0-9]/g, "").slice(0, 3) })}
                        style={{ ...inputStyle, background: "#FFF" }}
                      />
                    </div>
                  </div>
                </div>
              )}

              {payMethod === "NET_BANKING" && (
                <div style={{
                  background: "#F8FAFC", border: "1.5px solid #CBD5E1", borderRadius: 10,
                  padding: 16, marginBottom: 20
                }}>
                  <label style={{ fontSize: 12, fontWeight: 700, color: "#334155", display: "block", marginBottom: 6 }}>
                    Select Your Bank:
                  </label>
                  <select
                    value={selectedBank}
                    onChange={(e) => setSelectedBank(e.target.value)}
                    style={{ ...inputStyle, background: "#FFF" }}
                  >
                    {["State Bank of India", "HDFC Bank", "ICICI Bank", "Axis Bank", "Punjab National Bank", "Canara Bank", "Kotak Mahindra Bank", "Bank of Baroda"].map((b) => (
                      <option key={b} value={b}>{b}</option>
                    ))}
                  </select>
                </div>
              )}

              {payMethod === "WALLET" && (
                <div style={{
                  background: "#F0FDF4", border: "1.5px solid #A7F3D0", borderRadius: 10,
                  padding: 16, marginBottom: 20
                }}>
                  <div style={{ fontWeight: 800, color: "#065F46", fontSize: 14 }}>
                    👛 Campus Wallet Balance: ₹25,000.00
                  </div>
                  <div style={{ fontSize: 12, color: "#475569", marginTop: 4 }}>
                    Amount of ₹{checkoutBooking.amount?.toLocaleString()} will be debited on the next step upon entering your PIN.
                  </div>
                </div>
              )}

              {paymentMethodError && (
                <div style={{
                  background: "#FEF2F2",
                  border: "1.5px solid #DC2626",
                  borderRadius: 8,
                  padding: "10px 14px",
                  marginBottom: 16,
                  color: "#991B1B",
                  fontSize: 13,
                  fontWeight: 700,
                }}>
                  {paymentMethodError}
                </div>
              )}

              {/* Next Button -> Moves to PIN Page */}
              <div style={{ display: "flex", gap: 12 }}>
                <button
                  type="button"
                  onClick={() => setPageView("FORM")}
                  style={{
                    ...buttonStyle("secondary"),
                    flex: 1,
                    fontSize: 14,
                    padding: "12px",
                    borderRadius: 8,
                  }}
                >
                  ← Back to Form
                </button>
                <button
                  type="submit"
                  style={{
                    ...buttonStyle("primary"),
                    flex: 2,
                    fontSize: 15,
                    fontWeight: 800,
                    padding: "12px 20px",
                    borderRadius: 8,
                    background: "linear-gradient(135deg, #059669 0%, #065F46 100%)",
                    color: "#FFFFFF",
                    boxShadow: "0 4px 14px rgba(5,150,105,0.3)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: 10,
                  }}
                >
                  👉 Proceed to PIN Verification & Pay (₹{checkoutBooking.amount?.toLocaleString()})
                </button>
              </div>
            </form>
          </Card>
        </div>
      )}

      {/* ══════════════════════════════════════════════════════════════
          PAGE 3: DEDICATED PIN & SUBMIT PAGE (NEXT PAGE)
         ══════════════════════════════════════════════════════════════ */}
      {pageView === "PIN_PAGE" && checkoutBooking && (
        <div style={{ animation: "fadeIn 0.25s ease" }}>
          {/* Breadcrumb / Step bar */}
          <div style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            background: "#FFFFFF",
            border: "1.5px solid #A7F3D0",
            borderRadius: 12,
            padding: "12px 18px",
            marginBottom: 20,
            boxShadow: "0 2px 8px rgba(5,150,105,0.06)",
          }}>
            <button
              type="button"
              onClick={() => setPageView("PAYMENT_PAGE")}
              style={{
                background: "#F0FDF4",
                border: "1px solid #A7F3D0",
                borderRadius: 8,
                padding: "6px 14px",
                fontSize: 12,
                fontWeight: 700,
                color: "#065F46",
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                gap: 6,
              }}
            >
              ← Back to Payment Methods
            </button>
            <div style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 12, fontWeight: 700 }}>
              <span style={{ color: "#059669" }}>1. Details ✓</span>
              <span style={{ color: "#CBD5E1" }}>➔</span>
              <span style={{ color: "#059669" }}>2. Method ({payMethod}) ✓</span>
              <span style={{ color: "#CBD5E1" }}>➔</span>
              <span style={{ color: "#581124", background: "#FEF2F2", padding: "3px 10px", borderRadius: 9999, border: "1px solid #FECACA" }}>
                3. Enter PIN & Submit 🔒
              </span>
              <span style={{ color: "#CBD5E1" }}>➔</span>
              <span style={{ color: "#94A3B8" }}>4. Confirmation</span>
            </div>
          </div>

          <Card style={{ padding: 24, border: "2px solid #059669", boxShadow: "0 10px 30px rgba(5,150,105,0.12)" }}>
            {/* PIN Page Header Banner */}
            <div style={{
              background: "linear-gradient(135deg, #581124 0%, #380A15 100%)",
              color: "#FFF",
              padding: "18px 22px",
              borderRadius: 12,
              marginBottom: 20,
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
            }}>
              <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
                <span style={{ fontSize: 32 }}>🔒</span>
                <div>
                  <strong style={{ fontSize: 18, display: "block", color: "#FDE68A" }}>
                    Security PIN Verification & Authorization
                  </strong>
                  <div style={{ fontSize: 12, opacity: 0.9, marginTop: 2 }}>
                    Step 3 of 3: Enter your PIN and click Submit to complete payment
                  </div>
                </div>
              </div>
              <div style={{
                background: "rgba(255,255,255,0.12)",
                border: "1px solid rgba(255,255,255,0.25)",
                padding: "6px 14px",
                borderRadius: 8,
                textAlign: "right",
              }}>
                <div style={{ fontSize: 10, opacity: 0.8, textTransform: "uppercase" }}>Channel</div>
                <div style={{ fontWeight: 800, fontSize: 13, color: "#A7F3D0" }}>{payMethod}</div>
              </div>
            </div>

            <form onSubmit={handleSubmitPayment}>
              {/* Transaction Summary Bar */}
              <div style={{
                background: "#F0FDF4",
                border: "1.5px solid #A7F3D0",
                borderRadius: 12,
                padding: 16,
                marginBottom: 20,
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center"
              }}>
                <div>
                  <div style={{ fontSize: 11, color: "#065F46", fontWeight: 700, textTransform: "uppercase" }}>Authorizing Payment For</div>
                  <div style={{ fontSize: 16, fontWeight: 800, color: "#581124" }}>{checkoutBooking.title}</div>
                  <div style={{ fontSize: 12, color: "#475569", marginTop: 2 }}>
                    📍 {checkoutBooking.venue} · Mode: <strong>{payMethod}</strong>
                  </div>
                </div>
                <div style={{ textAlign: "right" }}>
                  <div style={{ fontSize: 11, color: "#065F46", fontWeight: 600 }}>Amount to Authorize</div>
                  <div style={{ fontSize: 24, fontWeight: 900, color: "#059669" }}>
                    ₹{checkoutBooking.amount?.toLocaleString()}
                  </div>
                </div>
              </div>

              {/* PIN and Confirm PIN */}
              <div style={{
                background: "#FFFBEB",
                border: "2px solid #FDE68A",
                borderRadius: 12,
                padding: "20px 22px",
                marginBottom: 22,
                boxShadow: "0 2px 8px rgba(245,158,11,0.08)"
              }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 14 }}>
                  <span style={{ fontSize: 22 }}>🔑</span>
                  <div>
                    <strong style={{ fontSize: 15, color: "#92400E", display: "block" }}>
                      Enter and Confirm Your Transaction PIN
                    </strong>
                    <div style={{ fontSize: 12, color: "#B45309" }}>
                      Type your 4 to 6 digit security PIN to approve this ₹{checkoutBooking.amount?.toLocaleString()} charge.
                    </div>
                  </div>
                </div>

                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
                  {/* PIN Field */}
                  <div>
                    <label style={{ fontSize: 13, fontWeight: 800, color: "#78350F", display: "block", marginBottom: 6 }}>
                      Enter PIN: *
                    </label>
                    <div style={{ position: "relative" }}>
                      <input
                        type={showPin ? "text" : "password"}
                        maxLength={6}
                        value={paymentPin}
                        onChange={(e) => {
                          const v = e.target.value.replace(/[^0-9]/g, "").slice(0, 6);
                          setPaymentPin(v);
                          if (pinError) setPinError("");
                        }}
                        placeholder="4 to 6 digit PIN (e.g. 1234)"
                        style={{
                          ...inputStyle,
                          background: "#FFFFFF",
                          letterSpacing: showPin ? "2px" : "4px",
                          fontWeight: 800,
                          fontSize: 16,
                          paddingRight: 40,
                          border: `2px solid ${paymentPin ? "#059669" : "#D97706"}`
                        }}
                      />
                      <button
                        type="button"
                        onClick={() => setShowPin(!showPin)}
                        style={{
                          position: "absolute",
                          right: 10,
                          top: "50%",
                          transform: "translateY(-50%)",
                          background: "none",
                          border: "none",
                          cursor: "pointer",
                          fontSize: 15,
                          color: "#64748B"
                        }}
                        title={showPin ? "Hide PIN" : "Show PIN"}
                      >
                        {showPin ? "👁️‍🗨️" : "👁️"}
                      </button>
                    </div>
                  </div>

                  {/* Confirm PIN Field */}
                  <div>
                    <label style={{ fontSize: 13, fontWeight: 800, color: "#78350F", display: "block", marginBottom: 6 }}>
                      Confirm PIN: *
                    </label>
                    <div style={{ position: "relative" }}>
                      <input
                        type={showConfirmPin ? "text" : "password"}
                        maxLength={6}
                        value={confirmPin}
                        onChange={(e) => {
                          const v = e.target.value.replace(/[^0-9]/g, "").slice(0, 6);
                          setConfirmPin(v);
                          if (pinError) setPinError("");
                        }}
                        placeholder="Re-enter PIN to confirm"
                        style={{
                          ...inputStyle,
                          background: "#FFFFFF",
                          letterSpacing: showConfirmPin ? "2px" : "4px",
                          fontWeight: 800,
                          fontSize: 16,
                          paddingRight: 40,
                          border: `2px solid ${confirmPin && confirmPin === paymentPin ? "#059669" : confirmPin ? "#DC2626" : "#D97706"}`
                        }}
                      />
                      <button
                        type="button"
                        onClick={() => setShowConfirmPin(!showConfirmPin)}
                        style={{
                          position: "absolute",
                          right: 10,
                          top: "50%",
                          transform: "translateY(-50%)",
                          background: "none",
                          border: "none",
                          cursor: "pointer",
                          fontSize: 15,
                          color: "#64748B"
                        }}
                        title={showConfirmPin ? "Hide Confirm PIN" : "Show Confirm PIN"}
                      >
                        {showConfirmPin ? "👁️‍🗨️" : "👁️"}
                      </button>
                    </div>
                  </div>
                </div>

                {/* Real-time PIN Match Indicator */}
                {confirmPin.length > 0 && (
                  <div style={{ marginTop: 10, fontSize: 12, fontWeight: 700 }}>
                    {confirmPin === paymentPin ? (
                      <span style={{ color: "#15803D" }}>✅ PINs match successfully.</span>
                    ) : (
                      <span style={{ color: "#DC2626" }}>⚠️ Confirm PIN does not match the entered PIN.</span>
                    )}
                  </div>
                )}
              </div>

              {/* Error Banner */}
              {pinError && (
                <div style={{
                  background: "#FEF2F2",
                  border: "1.5px solid #DC2626",
                  borderRadius: 8,
                  padding: "10px 14px",
                  marginBottom: 16,
                  color: "#991B1B",
                  fontSize: 13,
                  fontWeight: 700,
                }}>
                  {pinError}
                </div>
              )}

              {/* Submit & Authorize Button */}
              <div style={{ display: "flex", gap: 12 }}>
                <button
                  type="button"
                  onClick={() => setPageView("PAYMENT_PAGE")}
                  style={{
                    ...buttonStyle("secondary"),
                    flex: 1,
                    fontSize: 14,
                    padding: "12px",
                    borderRadius: 8,
                  }}
                >
                  ← Back to Method
                </button>
                <button
                  type="submit"
                  disabled={isProcessingPayment}
                  style={{
                    ...buttonStyle("primary"),
                    flex: 2,
                    fontSize: 15,
                    fontWeight: 800,
                    padding: "12px 20px",
                    borderRadius: 8,
                    background: "linear-gradient(135deg, #059669 0%, #065F46 100%)",
                    color: "#FFFFFF",
                    boxShadow: "0 4px 14px rgba(5,150,105,0.3)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: 10,
                  }}
                >
                  {isProcessingPayment ? (
                    <span>⏳ Authorizing Payment with Bank Server...</span>
                  ) : (
                    <span>💳 Submit & Authorize ₹{checkoutBooking.amount?.toLocaleString()} Payment</span>
                  )}
                </button>
              </div>
            </form>
          </Card>
        </div>
      )}

      {/* ══════════════════════════════════════════════════════════════
          PAGE 4: DEDICATED PAYMENT SUCCESSFUL SCREEN
         ══════════════════════════════════════════════════════════════ */}
      {pageView === "SUCCESS_PAGE" && paymentSuccessReceipt && (
        <div style={{ animation: "fadeIn 0.3s ease" }}>
          <Card style={{ padding: 0, overflow: "hidden", border: "2px solid #059669", boxShadow: "0 12px 36px rgba(5,150,105,0.18)" }}>
            {/* Success Celebration Header */}
            <div style={{
              background: "linear-gradient(135deg, #059669 0%, #065F46 100%)",
              color: "#FFF",
              padding: "28px 24px",
              textAlign: "center",
            }}>
              <div style={{
                width: 64,
                height: 64,
                borderRadius: 9999,
                background: "#FFFFFF",
                color: "#059669",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: 34,
                margin: "0 auto 12px",
                boxShadow: "0 6px 18px rgba(0,0,0,0.15)",
              }}>
                ✓
              </div>
              <strong style={{ fontSize: 24, display: "block", letterSpacing: "-0.01em" }}>
                Payment Successful!
              </strong>
              <div style={{ fontSize: 13, opacity: 0.95, marginTop: 4 }}>
                Your payment has been successfully authorized and confirmed.
              </div>
            </div>

            {/* Official Digital Payment Receipt */}
            <div style={{ padding: 24 }}>
              <div style={{
                background: "#F0FDF4",
                border: "1.5px solid #A7F3D0",
                borderRadius: 12,
                padding: 18,
                marginBottom: 20,
              }}>
                <div style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  borderBottom: "1px dashed #A7F3D0",
                  paddingBottom: 10,
                  marginBottom: 12,
                }}>
                  <div>
                    <div style={{ fontSize: 11, color: "#065F46", fontWeight: 700, textTransform: "uppercase" }}>
                      Transaction Reference
                    </div>
                    <div style={{ fontSize: 15, fontWeight: 900, color: "#581124" }}>
                      {paymentSuccessReceipt.paymentTxnId}
                    </div>
                  </div>
                  <Stamp text="VERIFIED PAID 🟢" tone="sage" />
                </div>

                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, fontSize: 13 }}>
                  <div>
                    <div style={{ color: "#64748B", fontSize: 11 }}>Booking Reference</div>
                    <div style={{ fontWeight: 800, color: "#334155" }}>{paymentSuccessReceipt.id}</div>
                  </div>
                  <div>
                    <div style={{ color: "#64748B", fontSize: 11 }}>Event / Purpose</div>
                    <div style={{ fontWeight: 800, color: "#581124" }}>{paymentSuccessReceipt.title}</div>
                  </div>
                  <div>
                    <div style={{ color: "#64748B", fontSize: 11 }}>Venue / Resource</div>
                    <div style={{ fontWeight: 700, color: "#334155" }}>
                      {paymentSuccessReceipt.venue} {paymentSuccessReceipt.roomType && paymentSuccessReceipt.roomType !== "N/A" ? `(${paymentSuccessReceipt.roomType})` : ""}
                    </div>
                  </div>
                  <div>
                    <div style={{ color: "#64748B", fontSize: 11 }}>Applicant Name</div>
                    <div style={{ fontWeight: 700, color: "#334155" }}>{paymentSuccessReceipt.applicant}</div>
                  </div>
                  <div>
                    <div style={{ color: "#64748B", fontSize: 11 }}>Payment Channel</div>
                    <div style={{ fontWeight: 800, color: "#059669" }}>
                      {paymentSuccessReceipt.paymentMethod === "UPI" ? "📱 UPI" : paymentSuccessReceipt.paymentMethod === "CARD" ? "💳 Card" : paymentSuccessReceipt.paymentMethod === "NET_BANKING" ? "🏦 Net Banking" : "👛 Campus Wallet"} Payment
                    </div>
                  </div>
                  <div>
                    <div style={{ color: "#64748B", fontSize: 11 }}>Date & Timestamp</div>
                    <div style={{ fontWeight: 600, color: "#334155" }}>{paymentSuccessReceipt.paidAt}</div>
                  </div>
                </div>

                <div style={{
                  borderTop: "1.5px dashed #A7F3D0",
                  marginTop: 14,
                  paddingTop: 12,
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                }}>
                  <span style={{ fontSize: 14, fontWeight: 800, color: "#065F46" }}>Total Amount Authorized & Paid:</span>
                  <span style={{ fontSize: 22, fontWeight: 900, color: "#059669" }}>
                    ₹{paymentSuccessReceipt.amount?.toLocaleString()}
                  </span>
                </div>
              </div>

              {/* Action Buttons */}
              <div style={{ display: "flex", gap: 10 }}>
                <button
                  type="button"
                  onClick={() => window.print()}
                  style={{
                    ...buttonStyle("secondary"),
                    flex: 1,
                    fontSize: 13,
                    padding: "10px",
                    borderRadius: 8,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: 6,
                  }}
                >
                  🖨️ Print Receipt
                </button>
                <button
                  type="button"
                  onClick={() => setPageView("FORM")}
                  style={{
                    ...buttonStyle("primary"),
                    flex: 1.5,
                    fontSize: 13,
                    padding: "10px",
                    borderRadius: 8,
                    background: "linear-gradient(135deg, #059669 0%, #065F46 100%)",
                    color: "#FFFFFF",
                  }}
                >
                  📋 View in My Bookings
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setCheckoutBooking(null);
                    setPaymentSuccessReceipt(null);
                    setPageView("FORM");
                  }}
                  style={{
                    ...buttonStyle("secondary"),
                    flex: 1.2,
                    fontSize: 13,
                    padding: "10px",
                    borderRadius: 8,
                    borderColor: "#059669",
                    color: "#065F46",
                  }}
                >
                  ➕ New Booking
                </button>
              </div>
            </div>
          </Card>
        </div>
      )}

      {/* ══════════════════════════════════════════════════════════════
          PAGE 1: MAIN BOOKING FORM & FULL BOOKING HISTORY IN TABLE FORMAT
         ══════════════════════════════════════════════════════════════ */}
      {pageView === "FORM" && (
        <div>
          {/* ── Header Banner ── */}
          {isPrincipal ? (
            <>
              <div
                style={{
                background: "linear-gradient(135deg, #581124 0%, #380A15 100%)",
                border: "1.5px solid #FDE68A",
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
                  <strong style={{ fontSize: 16, display: "block", color: "#FDE68A" }}>
                    Principal Campus Booking Review & Approval Portal
                  </strong>
                  <div style={{ fontSize: 13, marginTop: 3, opacity: 0.9 }}>
                    Review incoming student/faculty booking requests across Auditorium, Hostel, and Canteen.
                  </div>
                </div>
              </div>
            </div>

            {/* ── Principal Rebooking Clearance Desk ── */}
            <div
              style={{
                background: "linear-gradient(135deg, #FFFFFF 0%, #F0FDF4 100%)",
                border: "2px solid #10B981",
                borderRadius: 14,
                padding: "20px 22px",
                marginBottom: 24,
                boxShadow: "0 6px 20px rgba(16, 185, 129, 0.12)",
              }}
            >
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14, flexWrap: "wrap", gap: 10 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                  <span style={{ fontSize: 24 }}>🏛️</span>
                  <div>
                    <h3 style={{ margin: 0, fontSize: 16, fontWeight: 800, color: "#064E3B" }}>
                      Principal Rebooking Clearance Desk
                    </h3>
                    <div style={{ fontSize: 12, color: "#059669", marginTop: 2 }}>
                      Review dynamic calendar relocation requests and authorize applicant payment mechanism.
                    </div>
                  </div>
                </div>
                <div style={{
                  background: rebookingRequests.filter(r => r.status === "PENDING").length > 0 ? "#DC2626" : "#059669",
                  color: "#FFF", padding: "4px 12px", borderRadius: 20, fontSize: 11, fontWeight: 800,
                  display: "flex", alignItems: "center", gap: 6,
                }}>
                  <span>{rebookingRequests.filter(r => r.status === "PENDING").length} PENDING REVIEW</span>
                </div>
              </div>

              {rebookingRequests.filter(r => r.status === "PENDING").length === 0 ? (
                <div style={{
                  background: "#FFFFFF", border: "1px dashed #A7F3D0", borderRadius: 10,
                  padding: "16px", textAlign: "center", color: "#059669", fontSize: 13, fontWeight: 600
                }}>
                  ✨ All incoming rebooking requests are cleared. No pending requests.
                </div>
              ) : (
                <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                  {rebookingRequests.filter(r => r.status === "PENDING").map((req) => (
                    <div
                      key={req.id}
                      style={{
                        background: "#FFFFFF",
                        border: "1.5px solid #A7F3D0",
                        borderRadius: 12,
                        padding: "16px 18px",
                        boxShadow: "0 2px 8px rgba(0,0,0,0.04)",
                      }}
                    >
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: 8, marginBottom: 8 }}>
                        <div>
                          <div style={{ fontSize: 14, fontWeight: 800, color: "#064E3B" }}>
                            {req.original_booking_title || `Booking #${req.original_booking}`}
                          </div>
                          <div style={{ fontSize: 12, color: "#64748B", marginTop: 2 }}>
                            Applicant: <strong>{req.requested_by_name || req.requested_by || "Student"}</strong> ({req.requested_by_role || "STUDENT"}) · Booking #{req.original_booking} · Fee: ₹{req.original_booking_amount || "15,000"}
                          </div>
                        </div>
                        <span style={{
                          background: "#FEF3C7", color: "#92400E", padding: "3px 8px",
                          borderRadius: 6, fontSize: 11, fontWeight: 700
                        }}>
                          ⏳ Awaiting Principal Authorization
                        </span>
                      </div>

                      {/* Date Change Comparison */}
                      <div style={{
                        display: "flex", gap: 16, background: "#F8FAFC", padding: "10px 14px",
                        borderRadius: 8, fontSize: 12, marginBottom: 10, flexWrap: "wrap"
                      }}>
                        <div>
                          <span style={{ color: "#64748B", fontWeight: 600 }}>Original Date: </span>
                          <span style={{ color: "#334155", fontWeight: 700 }}>
                            {req.original_booking_datetime ? new Date(req.original_booking_datetime).toLocaleDateString() : "Scheduled slot"}
                          </span>
                        </div>
                        <div style={{ color: "#059669", fontWeight: 800 }}>➔</div>
                        <div>
                          <span style={{ color: "#065F46", fontWeight: 600 }}>Requested New Date & Time: </span>
                          <span style={{ color: "#059669", fontWeight: 800 }}>
                            {req.proposed_datetime ? new Date(req.proposed_datetime).toLocaleString() : "New requested slot"}
                          </span>
                        </div>
                      </div>

                      {/* Rebooking Description Box */}
                      <div style={{
                        background: "#F0FDF4", border: "1px solid #BBF7D0", borderRadius: 8,
                        padding: "10px 14px", marginBottom: 12
                      }}>
                        <div style={{ fontSize: 11, fontWeight: 800, color: "#065F46", textTransform: "uppercase", marginBottom: 4 }}>
                          📝 Rebooking Description Box (Logistical Reason):
                        </div>
                        <div style={{ fontSize: 13, color: "#064E3B", fontStyle: "italic", lineHeight: 1.5 }}>
                          "{req.description}"
                        </div>
                      </div>

                      {/* Review Remarks and Action Buttons */}
                      <div style={{ display: "flex", gap: 10, alignItems: "center", flexWrap: "wrap" }}>
                        <input
                          type="text"
                          placeholder="Optional Principal remarks (e.g. Approved for Morning slot)..."
                          value={rebookingRemarks[req.id] || ""}
                          onChange={(e) => setRebookingRemarks({ ...rebookingRemarks, [req.id]: e.target.value })}
                          style={{
                            flex: 1, minWidth: 220, padding: "8px 12px", borderRadius: 6,
                            border: "1px solid #CBD5E1", fontSize: 12, outline: "none",
                          }}
                        />
                        <button
                          type="button"
                          disabled={actionLoadingReqId === req.id}
                          onClick={() => handleReviewRebooking(req.id, "APPROVED")}
                          style={{
                            background: "linear-gradient(135deg, #059669, #047857)",
                            color: "#FFFFFF", border: "none", borderRadius: 6,
                            padding: "8px 16px", fontSize: 12, fontWeight: 800, cursor: "pointer",
                            display: "flex", alignItems: "center", gap: 6,
                            boxShadow: "0 2px 8px rgba(5,150,105,0.25)"
                          }}
                        >
                          ✔ Accept & Authorize Rebooking
                        </button>
                        <button
                          type="button"
                          disabled={actionLoadingReqId === req.id}
                          onClick={() => handleReviewRebooking(req.id, "REJECTED")}
                          style={{
                            background: "#FEE2E2", color: "#DC2626", border: "1px solid #FCA5A5",
                            borderRadius: 6, padding: "8px 14px", fontSize: 12, fontWeight: 700,
                            cursor: "pointer",
                          }}
                        >
                          ✖ Reject
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </>
          ) : (


            <div
              style={{
                background: isStudent ? "#F8FAFC" : "#F0FDF4",
                border: `1.5px solid ${isStudent ? "#E2E8F0" : "#BBF7D0"}`,
                borderRadius: 12,
                padding: "16px 20px",
                marginBottom: 20,
                color: isStudent ? "#722F37" : "#15803D",
                boxShadow: "0 4px 12px rgba(0,0,0,0.06)",
              }}
            >
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                  <span style={{ fontSize: 28 }}>{isStudent ? "🎓" : activeRole === "class_rep" ? "⭐" : "👨‍🏫"}</span>
                  <div>
                    <strong style={{ fontSize: 16, display: "block" }}>
                      {isStudent
                        ? "Student Booking & Full Reservation History"
                        : activeRole === "class_rep"
                        ? "Class Representative Booking & Event Clearances"
                        : "Faculty Booking & Event History"}
                    </strong>
                    <div style={{ fontSize: 13, marginTop: 3, opacity: 0.9 }}>
                      {isStudent
                        ? "Create new bookings and track your Hostel and Canteen booking history."
                        : "Create new bookings and track your separate Auditorium, Hostel, and Canteen booking history."}
                    </div>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setShowCreateForm(!showCreateForm)}
                  style={{
                    background: showCreateForm ? "#F1F5F9" : "#059669",
                    color: showCreateForm ? "#334155" : "#FFF",
                    border: `1px solid ${showCreateForm ? "#CBD5E1" : "#059669"}`,
                    padding: "6px 14px",
                    borderRadius: 6,
                    fontSize: 12,
                    fontWeight: 700,
                    cursor: "pointer",
                  }}
                >
                  {showCreateForm ? "▲ Hide Form" : "+ Create Booking"}
                </button>
              </div>
            </div>
          )}

          {/* ── Booking Creation Form (For Students / Faculty / Class Reps) ── */}
          {!isPrincipal && showCreateForm && (
            <Card style={{ marginBottom: 24, padding: 20 }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16, borderBottom: "1px solid #E2E8F0", paddingBottom: 10 }}>
                <strong style={{ fontSize: 16, color: maroonDark }}>
                  ✨ Create New Campus Booking Request
                </strong>
                <span style={{ fontSize: 12, color: "#64748B" }}>Step 1 of 3: Fill in Details</span>
              </div>

              {error && (
                <div style={{
                  background: "#FEF2F2", border: "1px solid #DC2626", borderRadius: 8,
                  padding: "10px 14px", marginBottom: 16, color: "#991B1B", fontSize: 13, fontWeight: 600
                }}>
                  {error}
                </div>
              )}

              <form onSubmit={handleProceedToPayment}>
                <Field label="Campus Facility / Resource">
                  <select
                    style={inputStyle}
                    value={venue}
                    onChange={(e) => {
                      setVenue(e.target.value);
                      setError("");
                    }}
                  >
                    {!isStudent && <option value="Auditorium">Auditorium (Main Hall & Stage)</option>}
                    <option value="Hostel">Hostel (Guest House & Student Rooms)</option>
                    <option value="Canteen / program food">Canteen / Program Food Catering</option>
                  </select>
                </Field>

                <Field label="Event Title / Booking Purpose">
                  <input
                    style={inputStyle}
                    type="text"
                    placeholder="e.g. National Robotics Workshop / Guest Speaker Stay"
                    value={eventName}
                    onChange={(e) => setEventName(e.target.value)}
                  />
                </Field>

                {/* Hostel Wing Selector (Boys Hostel vs Girls Hostel) */}
                {venue === "Hostel" && (
                  <div style={{ marginBottom: 14 }}>
                    <Label>Select Hostel Wing / Category</Label>
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginTop: 4 }}>
                      <label
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: 10,
                          padding: "12px 14px",
                          borderRadius: 8,
                          border: `2px solid ${hostelType === "BOYS" ? "#065F46" : "#E2E8F0"}`,
                          background: hostelType === "BOYS" ? "#F0FDF4" : "#FFFFFF",
                          cursor: "pointer",
                          transition: "all 0.15s ease",
                        }}
                      >
                        <input
                          type="radio"
                          name="hostelTypeRadio"
                          value="BOYS"
                          checked={hostelType === "BOYS"}
                          onChange={() => setHostelType("BOYS")}
                          style={{ accentColor: "#065F46", width: 18, height: 18 }}
                        />
                        <div>
                          <strong style={{ fontSize: 13, color: hostelType === "BOYS" ? "#065F46" : "#1E293B", display: "block" }}>
                            🏢 Boys Hostel
                          </strong>
                          <span style={{ fontSize: 11, color: "#64748B" }}>
                            Routes to Boys Hostel Warden (Amith)
                          </span>
                        </div>
                      </label>

                      <label
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: 10,
                          padding: "12px 14px",
                          borderRadius: 8,
                          border: `2px solid ${hostelType === "GIRLS" ? "#9D174D" : "#E2E8F0"}`,
                          background: hostelType === "GIRLS" ? "#FDF2F8" : "#FFFFFF",
                          cursor: "pointer",
                          transition: "all 0.15s ease",
                        }}
                      >
                        <input
                          type="radio"
                          name="hostelTypeRadio"
                          value="GIRLS"
                          checked={hostelType === "GIRLS"}
                          onChange={() => setHostelType("GIRLS")}
                          style={{ accentColor: "#9D174D", width: 18, height: 18 }}
                        />
                        <div>
                          <strong style={{ fontSize: 13, color: hostelType === "GIRLS" ? "#9D174D" : "#1E293B", display: "block" }}>
                            🌸 Girls Hostel
                          </strong>
                          <span style={{ fontSize: 11, color: "#64748B" }}>
                            Routes to Girls Hostel Warden (Gracy)
                          </span>
                        </div>
                      </label>
                    </div>
                  </div>
                )}

                {/* Hostel Room Selector */}
                {venue === "Hostel" && (
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 12 }}>
                    <Field label="Room Sharing Type">
                      <select style={inputStyle} value={roomType} onChange={(e) => setRoomType(e.target.value)}>
                        <option value="Single Room">Single Room (₹1,500/day)</option>
                        <option value="2 Share">2 Share (₹1,000/day)</option>
                        <option value="3 Share">3 Share (₹800/day)</option>
                        <option value="Dormitory">Dormitory (₹400/day)</option>
                      </select>
                    </Field>
                    <Field label="AC / Climate Control">
                      <select style={inputStyle} value={acType} onChange={(e) => setAcType(e.target.value)}>
                        <option value="Non-AC">Non-AC</option>
                        <option value="AC">AC (+₹500/day)</option>
                      </select>
                    </Field>
                  </div>
                )}

                {/* Canteen Food Items Pre-Order Menu */}
                {venue === "Canteen / program food" && (
                  <div style={{
                    background: "#F8FAFC", border: "1.5px solid #A7F3D0",
                    borderRadius: 12, padding: 16, marginBottom: 16
                  }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12, flexWrap: "wrap", gap: 8 }}>
                      <div>
                        <strong style={{ fontSize: 15, color: "#065F46", display: "block" }}>
                          🍱 Canteen Refreshment & Food Catering Menu
                        </strong>
                        <div style={{ fontSize: 11, color: "#64748B" }}>
                          Select item quantities using + / - buttons or type any number directly.
                        </div>
                      </div>
                      {totalFoodQuantity > 0 && (
                        <button
                          type="button"
                          onClick={() => setFoodQuantities({})}
                          style={{
                            background: "#FEE2E2", border: "1px solid #FECACA",
                            borderRadius: 6, padding: "4px 10px", fontSize: 11,
                            fontWeight: 700, color: "#DC2626", cursor: "pointer"
                          }}
                        >
                          ✕ Clear Selection
                        </button>
                      )}
                    </div>

                    {/* Category Filter Pills & Search */}
                    <div style={{ display: "flex", gap: 8, marginBottom: 12, flexWrap: "wrap", alignItems: "center" }}>
                      <input
                        type="text"
                        placeholder="🔍 Search food or drink..."
                        value={foodSearchQuery}
                        onChange={(e) => setFoodSearchQuery(e.target.value)}
                        style={{
                          padding: "6px 10px", borderRadius: 6, border: "1px solid #CBD5E1",
                          fontSize: 12, flex: "1 1 160px", background: "#FFF"
                        }}
                      />
                      <div style={{ display: "flex", gap: 4, flexWrap: "wrap" }}>
                        {[
                          { id: "ALL", label: "All Items" },
                          { id: "Beverages", label: "☕ Hot Drinks" },
                          { id: "Juices", label: "🧃 Fresh Juices" },
                          { id: "Snacks", label: "🥐 Snacks & Rolls" },
                          { id: "Meals", label: "🍛 Meals & Rice" },
                          { id: "Desserts", label: "🍦 Ice Creams" },
                        ].map((cat) => (
                          <button
                            key={cat.id}
                            type="button"
                            onClick={() => setFoodCategoryFilter(cat.id)}
                            style={{
                              padding: "4px 8px", borderRadius: 6, border: "none",
                              fontSize: 11, fontWeight: 700, cursor: "pointer",
                              background: foodCategoryFilter === cat.id ? "#059669" : "#E2E8F0",
                              color: foodCategoryFilter === cat.id ? "#FFF" : "#475569"
                            }}
                          >
                            {cat.label}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Food Items Table */}
                    <div style={{ maxHeight: 300, overflowY: "auto", border: "1px solid #E2E8F0", borderRadius: 8, background: "#FFF" }}>
                      <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12 }}>
                        <thead>
                          <tr style={{ background: "#F1F5F9", color: "#334155", textAlign: "left", position: "sticky", top: 0, zIndex: 1 }}>
                            <th style={{ padding: "8px 12px" }}>Item & Category</th>
                            <th style={{ padding: "8px 12px" }}>Price</th>
                            <th style={{ padding: "8px 12px", textAlign: "center" }}>Quantity</th>
                            <th style={{ padding: "8px 12px", textAlign: "center" }}>Quick Add</th>
                            <th style={{ padding: "8px 12px", textAlign: "right" }}>Subtotal</th>
                          </tr>
                        </thead>
                        <tbody>
                          {displayedFoodMenu.length === 0 ? (
                            <tr>
                              <td colSpan="5" style={{ padding: "24px", textAlign: "center", color: "#64748B" }}>
                                No food items found matching "{foodSearchQuery}".
                              </td>
                            </tr>
                          ) : (
                            displayedFoodMenu.map((item) => {
                              const qty = foodQuantities[item.id] || 0;
                              return (
                                <tr key={item.id} style={{ borderBottom: "1px solid #F1F5F9", background: qty > 0 ? "#F0FDF4" : "transparent" }}>
                                  <td style={{ padding: "8px 12px" }}>
                                    <div style={{ fontWeight: 700, color: "#1E293B" }}>{item.icon} {item.name}</div>
                                    <div style={{ fontSize: 10, color: "#64748B" }}>{item.category}</div>
                                  </td>
                                  <td style={{ padding: "8px 12px", color: "#065F46", fontWeight: 700 }}>₹{item.price}</td>
                                  <td style={{ padding: "8px 12px", textAlign: "center" }}>
                                    <div style={{ display: "inline-flex", alignItems: "center", gap: 4 }}>
                                      <button
                                        type="button"
                                        onClick={() => handleFoodQtyChange(item.id, -1)}
                                        style={{
                                          width: 26, height: 26, borderRadius: 4,
                                          border: "1px solid #CBD5E1", background: "#F8FAFC",
                                          cursor: "pointer", fontWeight: 900, fontSize: 14
                                        }}
                                      >
                                        -
                                      </button>
                                      <input
                                        type="number"
                                        min="0"
                                        max="999"
                                        value={qty || ""}
                                        placeholder="0"
                                        onChange={(e) => handleFoodQtyDirectInput(item.id, e.target.value)}
                                        style={{
                                          width: 44, height: 26, textAlign: "center",
                                          borderRadius: 4, border: `1.5px solid ${qty > 0 ? "#059669" : "#CBD5E1"}`,
                                          fontSize: 13, fontWeight: 800, color: qty > 0 ? "#059669" : "#334155"
                                        }}
                                      />
                                      <button
                                        type="button"
                                        onClick={() => handleFoodQtyChange(item.id, 1)}
                                        style={{
                                          width: 26, height: 26, borderRadius: 4,
                                          border: "1px solid #059669", background: "#059669",
                                          color: "#FFF", cursor: "pointer", fontWeight: 900, fontSize: 14
                                        }}
                                      >
                                        +
                                      </button>
                                    </div>
                                  </td>
                                  <td style={{ padding: "8px 12px", textAlign: "center" }}>
                                    <div style={{ display: "inline-flex", gap: 3 }}>
                                      {[5, 10, 25].map((amt) => (
                                        <button
                                          key={amt}
                                          type="button"
                                          onClick={() => handleFoodQtyQuickAdd(item.id, amt)}
                                          style={{
                                            padding: "2px 5px", borderRadius: 4, border: "1px solid #CBD5E1",
                                            background: "#FFF", fontSize: 10, fontWeight: 700, color: "#475569", cursor: "pointer"
                                          }}
                                        >
                                          +{amt}
                                        </button>
                                      ))}
                                    </div>
                                  </td>
                                  <td style={{ padding: "8px 12px", textAlign: "right", fontWeight: 800, color: qty > 0 ? "#059669" : "#94A3B8" }}>
                                    ₹{qty * item.price}
                                  </td>
                                </tr>
                              );
                            })
                          )}
                        </tbody>
                      </table>
                    </div>

                    {/* Live Order Summary Footer */}
                    <div style={{
                      display: "flex", justifyContent: "space-between", alignItems: "center",
                      marginTop: 12, padding: "10px 14px", background: "#FFFFFF",
                      borderRadius: 8, border: "1px dashed #A7F3D0", fontSize: 13, fontWeight: 700
                    }}>
                      <span style={{ color: "#475569" }}>Total Items Selected: <strong style={{ color: "#065F46", fontSize: 14 }}>{totalFoodQuantity}</strong></span>
                      <span style={{ color: "#059669", fontSize: 15 }}>Total Food Catering Bill: <strong>₹{totalFoodAmount.toLocaleString()}</strong></span>
                    </div>
                  </div>
                )}

                {/* Date Fields */}
                {venue === "Hostel" ? (
                  <Field label="Hostel Allocation Duration">
                    <div style={{ display: "flex", gap: 12, marginBottom: 8 }}>
                      <label style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 13, cursor: "pointer" }}>
                        <input type="radio" name="hostelDuration" checked={hostelDurationType === "single"} onChange={() => setHostelDurationType("single")} />
                        Single Day
                      </label>
                      <label style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 13, cursor: "pointer" }}>
                        <input type="radio" name="hostelDuration" checked={hostelDurationType === "multiple"} onChange={() => setHostelDurationType("multiple")} />
                        Multiple Days
                      </label>
                    </div>
                    {hostelDurationType === "single" ? (
                      <input style={inputStyle} type="date" value={date} onChange={(e) => setDate(e.target.value)} />
                    ) : (
                      <div style={{ display: "flex", gap: 12 }}>
                        <div style={{ flex: 1 }}>
                          <div style={{ fontSize: 12, color: "#64748B", marginBottom: 4 }}>Check-in Date</div>
                          <input style={inputStyle} type="date" value={date} onChange={(e) => setDate(e.target.value)} />
                        </div>
                        <div style={{ flex: 1 }}>
                          <div style={{ fontSize: 12, color: "#64748B", marginBottom: 4 }}>Check-out Date</div>
                          <input style={inputStyle} type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} />
                        </div>
                      </div>
                    )}
                  </Field>
                ) : (
                  <Field label="Scheduled Event Date">
                    <input style={inputStyle} type="date" value={date} onChange={(e) => setDate(e.target.value)} />
                  </Field>
                )}

                {/* Fee Preview Bar */}
                <div style={{
                  marginTop: 14,
                  background: "#F0FDF4",
                  border: "1.5px dashed #A7F3D0",
                  borderRadius: 8,
                  padding: "12px 16px",
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  fontSize: 14,
                }}>
                  <span style={{ color: "#065F46", fontWeight: 700 }}>Estimated Total Booking Fee:</span>
                  <span style={{ fontWeight: 900, fontSize: 18, color: "#059669" }}>
                    ₹{getBookingFee(venue, roomType, acType, totalFoodAmount, 0, currentHostelDays).toLocaleString()}
                  </span>
                </div>

                <button
                  style={{
                    ...buttonStyle("primary"),
                    width: "100%",
                    marginTop: 16,
                    padding: "12px 18px",
                    fontSize: 14,
                    fontWeight: 800,
                    background: "linear-gradient(135deg, #059669 0%, #065F46 100%)",
                    color: "#FFFFFF",
                  }}
                  type="submit"
                >
                  👉 Proceed to Payment Method (₹{getBookingFee(venue, roomType, acType, totalFoodAmount, 0, currentHostelDays).toLocaleString()})
                </button>
              </form>
            </Card>
          )}

          {/* ══════════════════════════════════════════════════════════════
              FULL BOOKING HISTORY (TABLE FORMAT WITH SEPARATE CATEGORY TABS)
             ══════════════════════════════════════════════════════════════ */}
          <Card style={{ padding: 20 }}>
            {/* Header info bar */}
            <div style={{
              display: "flex", justifyContent: "space-between", alignItems: "center",
              marginBottom: 16, paddingBottom: 12, borderBottom: "2px solid #E2E8F0",
              flexWrap: "wrap", gap: 10
            }}>
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <span style={{ fontSize: 24 }}>📜</span>
                <div>
                  <div style={{ fontWeight: 800, fontSize: 16, color: maroonDark }}>
                    {isPrincipal ? "Campus Booking History & Administrative Clearance Log" : "My Campus Booking History"}
                  </div>
                  <div style={{ fontSize: 12, color: "#6B7280", marginTop: 2 }}>
                    {isPrincipal
                      ? "Inspect and manage all student/faculty reservations across Auditorium, Hostel, and Canteen."
                      : "View your reservations in a structured table separated by Auditorium, Hostel, and Canteen."}
                  </div>
                </div>
              </div>

              {/* Status Filter */}
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <span style={{ fontSize: 12, color: "#64748B", fontWeight: 700 }}>Status:</span>
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  style={{
                    padding: "6px 10px", borderRadius: 6, border: "1px solid #CBD5E1",
                    fontSize: 12, fontWeight: 700, background: "#FFF", color: "#334155"
                  }}
                >
                  <option value="ALL">All Statuses ({counts.all})</option>
                  <option value="PENDING">⏳ Pending Review</option>
                  <option value="CONFIRMED">✅ Approved / Confirmed</option>
                  <option value="PAID">💳 Paid</option>
                  <option value="UNPAID">⚠️ Unpaid</option>
                </select>
              </div>
            </div>

            {/* ── Separate Venue / Category Tabs ── */}
            <div style={{ display: "flex", gap: 8, marginBottom: 16, flexWrap: "wrap" }}>
              {[
                { id: "ALL", label: `📋 All Bookings (${counts.all})`, icon: "📋" },
                ...(!isStudent ? [{ id: "AUDITORIUM", label: `🎭 Auditorium (${counts.auditorium})`, icon: "🎭" }] : []),
                { id: "HOSTEL", label: `🏨 Hostel (${counts.hostel})`, icon: "🏨" },
                { id: "CANTEEN", label: `🍱 Canteen / Food Catering (${counts.canteen})`, icon: "🍱" },
              ].map((tab) => (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setHistoryTab(tab.id)}
                  style={{
                    padding: "8px 14px",
                    borderRadius: 8,
                    border: `1.5px solid ${historyTab === tab.id ? "#059669" : "#E2E8F0"}`,
                    background: historyTab === tab.id ? "#059669" : "#FFFFFF",
                    color: historyTab === tab.id ? "#FFFFFF" : "#475569",
                    fontWeight: historyTab === tab.id ? 800 : 600,
                    fontSize: 13,
                    cursor: "pointer",
                    transition: "all 0.15s ease",
                    boxShadow: historyTab === tab.id ? "0 2px 6px rgba(5,150,105,0.2)" : "none"
                  }}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            {/* Search Box */}
            <div style={{ marginBottom: 16 }}>
              <input
                type="text"
                placeholder="🔍 Search bookings by ID, event name, applicant, or details..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                style={{
                  padding: "8px 14px", borderRadius: 8,
                  border: "1px solid #CBD5E1", fontSize: 13,
                  width: "100%", boxSizing: "border-box", background: "#F8FAFC",
                }}
              />
            </div>

            {/* ── Table Format View ── */}
            {filteredBookings.length === 0 ? (
              <div style={{
                textAlign: "center", padding: "48px 20px", color: "#6B7280", fontSize: 14,
                background: "#F8FAFC", borderRadius: 12, border: "1.5px dashed #CBD5E1",
                margin: "12px 0"
              }}>
                <div style={{ fontSize: 36, marginBottom: 10 }}>
                  {historyTab === "AUDITORIUM" ? "🎭" : historyTab === "HOSTEL" ? "🏨" : historyTab === "CANTEEN" ? "🍱" : "📋"}
                </div>
                <div style={{ fontWeight: 800, fontSize: 16, color: maroonDark, marginBottom: 6 }}>
                  {historyTab === "AUDITORIUM"
                    ? "No event bookings yet."
                    : historyTab === "HOSTEL"
                    ? "No hostel bookings yet."
                    : historyTab === "CANTEEN"
                    ? "No canteen orders yet."
                    : "No booking history found."}
                </div>
                <div style={{ fontSize: 13, color: "#64748B" }}>
                  {historyTab === "AUDITORIUM"
                    ? "You have not reserved the auditorium or submitted any event bookings."
                    : historyTab === "HOSTEL"
                    ? "You have not booked any hostel accommodation yet."
                    : historyTab === "CANTEEN"
                    ? "You have not placed any canteen food orders yet."
                    : "Your personal campus booking history is currently empty."}
                </div>
              </div>
            ) : (
              <div style={{ overflowX: "auto", border: "1px solid #E2E8F0", borderRadius: 10 }}>
                <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12, background: "#FFF" }}>
                  <thead>
                    <tr style={{ background: "#F1F5F9", color: "#334155", textAlign: "left", borderBottom: "2px solid #CBD5E1" }}>
                      <th style={{ padding: "10px 12px", whiteSpace: "nowrap" }}>Booking ID</th>
                      <th style={{ padding: "10px 12px" }}>Event / Purpose</th>
                      <th style={{ padding: "10px 12px" }}>Venue & Date</th>
                      <th style={{ padding: "10px 12px" }}>Details</th>
                      <th style={{ padding: "10px 12px" }}>Fee & Payment</th>
                      <th style={{ padding: "10px 12px", textAlign: "center" }}>Status</th>
                      <th style={{ padding: "10px 12px", textAlign: "center" }}>Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredBookings.map((item) => {
                      const isAuditorium = item.venue.toLowerCase().includes("auditorium");
                      const isHostel = item.venue.toLowerCase().includes("hostel");
                      const isCanteen = item.venue.toLowerCase().includes("canteen") || item.venue.toLowerCase().includes("food");

                      return (
                        <tr
                          key={item.id}
                          style={{
                            borderBottom: "1px solid #E2E8F0",
                            transition: "background 0.15s ease",
                          }}
                          onMouseEnter={(e) => (e.currentTarget.style.background = "#F0FDF4")}
                          onMouseLeave={(e) => (e.currentTarget.style.background = "#FFF")}
                        >
                          {/* Booking ID & Submitted Date */}
                          <td style={{ padding: "10px 12px", verticalAlign: "top" }}>
                            <div style={{
                              fontWeight: 800, color: "#1E293B", background: "#F1F5F9",
                              padding: "2px 6px", borderRadius: 4, display: "inline-block", fontSize: 11
                            }}>
                              {item.id}
                            </div>
                            <div style={{ fontSize: 10, color: "#64748B", marginTop: 4 }}>
                              Req: {item.submittedAt}
                            </div>
                          </td>

                          {/* Event Title & Applicant */}
                          <td style={{ padding: "10px 12px", verticalAlign: "top" }}>
                            <div style={{ fontWeight: 800, color: "#581124", fontSize: 13 }}>
                              {item.title}
                            </div>
                            <div style={{ fontSize: 11, color: "#64748B", marginTop: 2 }}>
                              👤 <strong>{item.applicant}</strong> ({item.applicantRole})
                            </div>
                          </td>

                          {/* Venue & Event Date */}
                          <td style={{ padding: "10px 12px", verticalAlign: "top" }}>
                            <div style={{ fontWeight: 700, color: isAuditorium ? "#581124" : isHostel ? "#0369A1" : "#065F46" }}>
                              {isAuditorium ? "🎭 Auditorium" : isHostel ? "🏨 Hostel" : "🍱 Canteen"}
                              {item.roomType && item.roomType !== "N/A" ? ` (${item.roomType})` : ""}
                            </div>
                            {isHostel && (
                              <div style={{ marginTop: 3 }}>
                                {item.hostelType === "GIRLS" ? (
                                  <span style={{ fontSize: 10, fontWeight: 800, color: "#9D174D", background: "#FCE7F3", padding: "1px 6px", borderRadius: 4 }}>
                                    🌸 Girls Hostel
                                  </span>
                                ) : (
                                  <span style={{ fontSize: 10, fontWeight: 800, color: "#065F46", background: "#D1FAE5", padding: "1px 6px", borderRadius: 4 }}>
                                    🏢 Boys Hostel
                                  </span>
                                )}
                              </div>
                            )}
                            <div style={{ fontSize: 11, color: "#334155", marginTop: 2, fontWeight: 600 }}>
                              📅 {item.date}
                            </div>
                          </td>

                          {/* Details Summary & Staff Reply / Canteen Acceptance Mechanism */}
                          <td style={{ padding: "10px 12px", verticalAlign: "top", maxWidth: 260 }}>
                            <div style={{
                              fontSize: 11, color: "#475569", lineHeight: 1.4,
                              display: "-webkit-box", WebkitLineClamp: 3, WebkitBoxOrient: "vertical", overflow: "hidden"
                            }}>
                              {item.details}
                            </div>

                            {/* Canteen Specific Acceptance & Pickup Display */}
                            {isCanteen && (item.status === "CONFIRMED" || item.status === "APPROVED") && (
                              <div style={{
                                marginTop: 8,
                                padding: "8px 10px",
                                background: "linear-gradient(135deg, #ECFDF5 0%, #DCFCE7 100%)",
                                border: "1.5px solid #86EFAC",
                                borderRadius: 8,
                                boxShadow: "0 2px 6px rgba(16,185,129,0.12)",
                              }}>
                                <div style={{ display: "flex", alignItems: "center", gap: 5, color: "#166534", fontWeight: 800, fontSize: 11 }}>
                                  <span>✅</span>
                                  <span>Accepted by Canteen Staff</span>
                                </div>
                                <div style={{ fontSize: 11, color: "#15803D", marginTop: 3, fontWeight: 600 }}>
                                  {item.adminReply ? (
                                    <span>💬 <strong>Pickup Notice:</strong> {item.adminReply}</span>
                                  ) : (
                                    <span>Food order confirmed! Canteen is preparing your items.</span>
                                  )}
                                </div>
                              </div>
                            )}

                            {isCanteen && item.status.includes("PENDING") && (
                              <div style={{
                                marginTop: 8,
                                padding: "6px 9px",
                                background: "#FFFBEB",
                                border: "1.5px solid #FCD34D",
                                borderRadius: 8,
                                fontSize: 11,
                                color: "#92400E",
                              }}>
                                <div style={{ fontWeight: 800, display: "flex", alignItems: "center", gap: 4 }}>
                                  <span>⏳</span>
                                  <span>Awaiting Canteen Acceptance</span>
                                </div>
                                <div style={{ fontSize: 10, marginTop: 2, color: "#B45309" }}>
                                  Order placed & paid. Canteen staff will accept and start preparation shortly.
                                </div>
                              </div>
                            )}

                            {isCanteen && (item.status === "CANCELLED" || item.status === "REJECTED") && (
                              <div style={{
                                marginTop: 8,
                                padding: "6px 9px",
                                background: "#FEF2F2",
                                border: "1.5px solid #FCA5A5",
                                borderRadius: 8,
                                fontSize: 11,
                                color: "#B91C1C",
                              }}>
                                <div style={{ fontWeight: 800 }}>❌ Order Declined by Canteen</div>
                                {item.adminReply && <div style={{ fontSize: 10, marginTop: 2 }}>Reason: {item.adminReply}</div>}
                              </div>
                            )}

                            {!isCanteen && item.adminReply && (
                              <div style={{
                                marginTop: 6,
                                padding: "6px 8px",
                                background: "#EFF6FF",
                                border: "1px solid #BFDBFE",
                                borderRadius: 6,
                                fontSize: 11,
                                color: "#1E40AF",
                              }}>
                                <strong>💬 Staff Reply:</strong> {item.adminReply}
                              </div>
                            )}
                          </td>

                          {/* Amount & Payment Status */}
                          <td style={{ padding: "10px 12px", verticalAlign: "top" }}>
                            <div style={{ fontWeight: 900, color: "#065F46", fontSize: 13 }}>
                              ₹{(item.amount || getBookingFee(item.venue, item.roomType)).toLocaleString()}
                            </div>
                            <div style={{ marginTop: 3 }}>
                              {item.paymentStatus === "PAID" ? (
                                <span style={{
                                  fontSize: 10, fontWeight: 800, color: "#15803D",
                                  background: "#DCFCE7", padding: "2px 6px", borderRadius: 4,
                                  whiteSpace: "nowrap"
                                }}>
                                  ✅ Paid ({item.paymentMethod || "UPI"})
                                </span>
                              ) : item.paymentStatus === "REFUNDED" ? (
                                <span style={{
                                  fontSize: 10, fontWeight: 800, color: "#B91C1C",
                                  background: "#FEE2E2", padding: "2px 6px", borderRadius: 4
                                }}>
                                  ↩️ Refunded
                                </span>
                              ) : (
                                <span style={{
                                  fontSize: 10, fontWeight: 800, color: "#DC2626",
                                  background: "#FEF2F2", padding: "2px 6px", borderRadius: 4
                                }}>
                                  ⚠️ Unpaid
                                </span>
                              )}
                            </div>
                          </td>

                          {/* Status Badge */}
                          <td style={{ padding: "10px 12px", verticalAlign: "top", textAlign: "center" }}>
                            {getStatusBadge(item.status, item.venue)}
                          </td>

                          {/* Actions */}
                          <td style={{ padding: "10px 12px", verticalAlign: "top", textAlign: "center" }}>
                            <div style={{ display: "flex", flexDirection: "column", gap: 4, alignItems: "center" }}>
                              {item.paymentStatus === "PAID" ? (
                                <button
                                  type="button"
                                  onClick={() => setSelectedBookingForReceipt(item)}
                                  style={{
                                    background: "#FFF", border: "1px solid #CBD5E1",
                                    borderRadius: 6, padding: "4px 8px", fontSize: 11,
                                    fontWeight: 700, color: maroonDark, cursor: "pointer",
                                    whiteSpace: "nowrap"
                                  }}
                                >
                                  🧾 Receipt
                                </button>
                              ) : (
                                <button
                                  type="button"
                                  onClick={() => handleOpenPaymentForExisting(item)}
                                  style={{
                                    background: "linear-gradient(135deg, #059669, #065F46)",
                                    border: "none", borderRadius: 6, padding: "4px 10px",
                                    fontSize: 11, fontWeight: 800, color: "#FFF", cursor: "pointer",
                                    whiteSpace: "nowrap"
                                  }}
                                >
                                  💳 Pay Now
                                </button>
                              )}

                              {/* Rebook action for confirmed/completed bookings */}
                              {!isPrincipal && (item.status === "CONFIRMED" || item.status === "COMPLETED") && (
                                <button
                                  type="button"
                                  onClick={() => setRebookingTargetBooking(item)}
                                  style={{
                                    background: "#F0FDF4", border: "1px solid #A7F3D0",
                                    borderRadius: 6, padding: "4px 8px", fontSize: 11,
                                    fontWeight: 700, color: "#065F46", cursor: "pointer",
                                    whiteSpace: "nowrap"
                                  }}
                                  title="Request date/time relocation"
                                >
                                  🔄 Rebook
                                </button>
                              )}

                              {/* Rebooking status indicator or authorization */}
                              {item.status === "REBOOKING_REQUESTED" && (
                                isPrincipal ? (
                                  <button
                                    type="button"
                                    onClick={() => {
                                      const match = rebookingRequests.find(r => r.original_booking === item.rawBackendId || r.original_booking === parseInt(String(item.id).replace(/\D/g, "")));
                                      if (match) handleReviewRebooking(match.id, "APPROVED");
                                    }}
                                    style={{
                                      background: "#059669", color: "#FFF", border: "none",
                                      borderRadius: 6, padding: "4px 8px", fontSize: 10,
                                      fontWeight: 800, cursor: "pointer", whiteSpace: "nowrap"
                                    }}
                                    title="Accept & Authorize Rebooking"
                                  >
                                    ✔ Authorize
                                  </button>
                                ) : (
                                  <span style={{
                                    fontSize: 10, color: "#92400E", fontWeight: 700,
                                    background: "#FEF3C7", padding: "2px 6px", borderRadius: 4,
                                    whiteSpace: "nowrap"
                                  }}>
                                    ⏳ In Principal Review
                                  </span>
                                )
                              )}

                              {/* Principal Approval Actions */}
                              {isPrincipal && item.status.includes("PENDING") && (
                                <div style={{ display: "flex", gap: 4, marginTop: 2 }}>
                                  <button
                                    type="button"
                                    onClick={() => handleUpdateStatus(item.id, "CONFIRMED")}
                                    style={{
                                      background: sage, color: "#FFF", border: "none",
                                      borderRadius: 4, padding: "2px 6px", fontSize: 10,
                                      fontWeight: 700, cursor: "pointer"
                                    }}
                                    title="Approve Booking"
                                  >
                                    ✔
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => handleUpdateStatus(item.id, "CANCELLED")}
                                    style={{
                                      background: brick, color: "#FFF", border: "none",
                                      borderRadius: 4, padding: "2px 6px", fontSize: 10,
                                      fontWeight: 700, cursor: "pointer"
                                    }}
                                    title="Decline Booking"
                                  >
                                    ✖
                                  </button>
                                </div>
                              )}
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </Card>

          {/* ── Modal: Rebooking Submission from Booking History ── */}
          {rebookingTargetBooking && (
            <div style={{
              position: "fixed", top: 0, left: 0, right: 0, bottom: 0,
              background: "rgba(0,0,0,0.6)", backdropFilter: "blur(4px)",
              display: "flex", alignItems: "center", justifyContent: "center",
              zIndex: 9999, padding: 16
            }}>
              <div style={{
                background: "#FFFFFF", borderRadius: 16, maxWidth: 520, width: "100%",
                border: "2px solid #10B981", boxShadow: "0 20px 40px rgba(0,0,0,0.25)",
                padding: "24px 28px"
              }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                    <span style={{ fontSize: 22 }}>🔄</span>
                    <h3 style={{ margin: 0, fontSize: 17, fontWeight: 800, color: "#064E3B" }}>
                      Request Event Rebooking & Relocation
                    </h3>
                  </div>
                  <button
                    type="button"
                    onClick={() => setRebookingTargetBooking(null)}
                    style={{ background: "none", border: "none", fontSize: 20, cursor: "pointer", color: "#64748B" }}
                  >
                    ✕
                  </button>
                </div>

                <div style={{ background: "#F0FDF4", border: "1px solid #BBF7D0", borderRadius: 10, padding: "12px 14px", marginBottom: 16 }}>
                  <div style={{ fontSize: 13, fontWeight: 800, color: "#064E3B" }}>
                    {rebookingTargetBooking.title}
                  </div>
                  <div style={{ fontSize: 12, color: "#059669", marginTop: 2 }}>
                    {rebookingTargetBooking.venue} · Scheduled for {rebookingTargetBooking.date} · ₹{rebookingTargetBooking.amount}
                  </div>
                </div>

                <form onSubmit={handleSubmitNewRebooking}>
                  <div style={{ marginBottom: 14 }}>
                    <label style={{ display: "block", fontSize: 12, fontWeight: 700, color: "#064E3B", marginBottom: 6, textTransform: "uppercase" }}>
                      Requested New Event Date & Time *
                    </label>
                    <input
                      type="datetime-local"
                      required
                      value={rebookProposedDatetime}
                      onChange={(e) => setRebookProposedDatetime(e.target.value)}
                      style={{
                        width: "100%", padding: "10px 12px", borderRadius: 8,
                        border: "1.5px solid #A7F3D0", fontSize: 13, outline: "none",
                        background: "#F8FAFC", color: "#064E3B"
                      }}
                    />
                  </div>

                  <div style={{ marginBottom: 18 }}>
                    <label style={{ display: "block", fontSize: 12, fontWeight: 700, color: "#064E3B", marginBottom: 6, textTransform: "uppercase" }}>
                      Rebooking Description Box (Logistical Reason) *
                    </label>
                    <textarea
                      required
                      rows={4}
                      placeholder="Explain the logistical reason for this date change (e.g., flight rescheduling of chief guest, monsoon weather, semester exams shift)..."
                      value={rebookDescription}
                      onChange={(e) => setRebookDescription(e.target.value)}
                      style={{
                        width: "100%", padding: "10px 12px", borderRadius: 8,
                        border: "1.5px solid #A7F3D0", fontSize: 13, outline: "none",
                        background: "#F8FAFC", color: "#064E3B", resize: "vertical"
                      }}
                    />
                    <div style={{ fontSize: 11, color: "#059669", marginTop: 4 }}>
                      This request will be sent directly to the Principal's clearance desk for authorization.
                    </div>
                  </div>

                  <div style={{ display: "flex", gap: 10, justifyContent: "flex-end" }}>
                    <button
                      type="button"
                      onClick={() => setRebookingTargetBooking(null)}
                      style={{
                        background: "#F1F5F9", color: "#475569", border: "none",
                        borderRadius: 8, padding: "9px 16px", fontSize: 13, fontWeight: 700, cursor: "pointer"
                      }}
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={isSubmittingRebook}
                      style={{
                        background: "linear-gradient(135deg, #059669, #047857)", color: "#FFFFFF",
                        border: "none", borderRadius: 8, padding: "9px 18px", fontSize: 13,
                        fontWeight: 800, cursor: "pointer", boxShadow: "0 2px 8px rgba(5,150,105,0.25)"
                      }}
                    >
                      {isSubmittingRebook ? "Submitting…" : "📤 Submit Rebooking to Principal"}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}
        </div>
      )}


      {/* ══════════════════════════════════════════════════════════════
          MODAL: DIGITAL PAYMENT RECEIPT FOR HISTORICAL ITEMS
         ══════════════════════════════════════════════════════════════ */}
      {selectedBookingForReceipt && (
        <div style={{
          position: "fixed", top: 0, left: 0, right: 0, bottom: 0,
          background: "rgba(0,0,0,0.65)", backdropFilter: "blur(4px)",
          display: "flex", alignItems: "center", justifyContent: "center",
          zIndex: 9999, padding: 16
        }}>
          <div style={{
            background: "#FFFFFF", borderRadius: 14, maxWidth: 480, width: "100%",
            boxShadow: "0 20px 40px rgba(0,0,0,0.3)", overflow: "hidden", border: "2px solid #059669"
          }}>
            <div style={{ background: "linear-gradient(135deg, #059669, #065F46)", color: "#FFF", padding: "16px 20px", textAlign: "center" }}>
              <div style={{ fontSize: 28, marginBottom: 4 }}>🧾</div>
              <strong style={{ fontSize: 16, display: "block", letterSpacing: "0.05em" }}>
                OFFICIAL PAYMENT RECEIPT
              </strong>
              <div style={{ fontSize: 11, opacity: 0.9, marginTop: 2 }}>
                Central Educational Management System (CEMS)
              </div>
            </div>

            <div style={{ padding: 20 }}>
              <div style={{
                background: "#F0FDF4", border: "1px solid #A7F3D0", borderRadius: 10,
                padding: 14, marginBottom: 16, fontSize: 12, display: "flex", flexDirection: "column", gap: 8
              }}>
                <div style={{ display: "flex", justifyContent: "space-between" }}>
                  <span style={{ color: "#6B7280" }}>Receipt Ref:</span>
                  <strong style={{ color: "#581124" }}>{selectedBookingForReceipt.paymentTxnId || "UPI-2026-REG"}</strong>
                </div>
                <div style={{ display: "flex", justifyContent: "space-between" }}>
                  <span style={{ color: "#6B7280" }}>Booking ID:</span>
                  <strong>{selectedBookingForReceipt.id}</strong>
                </div>
                <div style={{ display: "flex", justifyContent: "space-between" }}>
                  <span style={{ color: "#6B7280" }}>Purpose:</span>
                  <strong>{selectedBookingForReceipt.title}</strong>
                </div>
                <div style={{ display: "flex", justifyContent: "space-between" }}>
                  <span style={{ color: "#6B7280" }}>Venue:</span>
                  <strong>{selectedBookingForReceipt.venue}</strong>
                </div>
                <div style={{ display: "flex", justifyContent: "space-between" }}>
                  <span style={{ color: "#6B7280" }}>Payer:</span>
                  <strong>{selectedBookingForReceipt.applicant}</strong>
                </div>
                <div style={{ display: "flex", justifyContent: "space-between" }}>
                  <span style={{ color: "#6B7280" }}>Channel:</span>
                  <strong style={{ color: "#059669" }}>{selectedBookingForReceipt.paymentMethod || "UPI"} Payment</strong>
                </div>
                <div style={{ display: "flex", justifyContent: "space-between" }}>
                  <span style={{ color: "#6B7280" }}>Payment Date:</span>
                  <span>{selectedBookingForReceipt.paidAt || "2026-09-02"}</span>
                </div>
                <div style={{ borderTop: "1px dashed #A7F3D0", paddingTop: 8, marginTop: 4, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <span style={{ fontSize: 13, fontWeight: 700, color: "#065F46" }}>Total Paid:</span>
                  <span style={{ fontSize: 18, fontWeight: 900, color: "#059669" }}>
                    ₹{(selectedBookingForReceipt.amount || getBookingFee(selectedBookingForReceipt.venue, selectedBookingForReceipt.roomType)).toLocaleString()}
                  </span>
                </div>
              </div>

              <div style={{ textAlign: "center", marginBottom: 16 }}>
                <Stamp text="VERIFIED PAID 🟢" tone="sage" />
              </div>

              <div style={{ display: "flex", gap: 10 }}>
                <button
                  type="button"
                  onClick={() => window.print()}
                  style={{ ...buttonStyle("secondary"), flex: 1, fontSize: 12, padding: "8px", borderRadius: 6 }}
                >
                  🖨️ Print Receipt
                </button>
                <button
                  type="button"
                  onClick={() => setSelectedBookingForReceipt(null)}
                  style={{ ...buttonStyle("primary"), flex: 1, fontSize: 12, padding: "8px", borderRadius: 6, background: "#059669", color: "#FFF" }}
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
