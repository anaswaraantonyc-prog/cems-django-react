import { useState, useMemo } from "react";
import { Card, Label, Stamp, StatusBadge } from "../components/Shared";
import { inputStyle, buttonStyle, maroonDark, maroon, gold, sage, brick, brownLight } from "../theme";

export default function LedgerModule() {
  const [activeTab, setActiveTab] = useState("registrations"); // 'registrations' | 'overview'
  const [actionNotice, setActionNotice] = useState("");
  const [regFilter, setRegFilter] = useState("ALL");
  const [searchQuery, setSearchQuery] = useState("");

  /* ─────────────────────────────────────────────────────────────
     USER REGISTRATIONS STATE (Approve Registration People)
     ───────────────────────────────────────────────────────────── */
  const [registrations, setRegistrations] = useState([
    {
      id: "REG-2001",
      name: "Aarav Sharma",
      email: "aarav.s@college.edu",
      role: "Student",
      dept: "Computer Science",
      idCard: "ID-2026-CS-041",
      registeredAt: "2026-09-06 10:15 AM",
      status: "pending",
    },
    {
      id: "REG-2002",
      name: "Dr. Meenakshi Sundaram",
      email: "meenakshi.s@college.edu",
      role: "Faculty",
      dept: "Electrical Engineering",
      idCard: "FAC-8842",
      registeredAt: "2026-09-06 02:30 PM",
      status: "pending",
    },
    {
      id: "REG-2003",
      name: "Vikramaditya Roy",
      email: "vikram.roy@external.org",
      role: "External Participant",
      dept: "Inter-College Tech Fest Delegate",
      idCard: "EXT-9910",
      registeredAt: "2026-09-05 04:45 PM",
      status: "pending",
    },
    {
      id: "REG-2004",
      name: "Neha Verma",
      email: "neha.v@college.edu",
      role: "Class Representative",
      dept: "Information Technology",
      idCard: "ID-2026-IT-012",
      registeredAt: "2026-09-04 11:00 AM",
      status: "approved",
      approvedAt: "2026-09-04 01:20 PM",
    },
    {
      id: "REG-2005",
      name: "Ramesh K. Staff",
      email: "ramesh.canteen@college.edu",
      role: "Canteen Staff",
      dept: "Central Dining Services",
      idCard: "STF-302",
      registeredAt: "2026-09-03 09:00 AM",
      status: "approved",
      approvedAt: "2026-09-03 10:30 AM",
    },
  ]);

  /* Master Overview Data */
  const allBookings = [
    { id: "BK-801", venue: "Auditorium", title: "Tech Fest Inauguration", bookedBy: "Dr. Meenakshi (Faculty)", amount: "₹15,000", date: "2026-09-15" },
    { id: "BK-802", venue: "Hostel AC Room", title: "Guest Speaker Accommodation", bookedBy: "Neha Verma (Class Rep)", amount: "₹3,500", date: "2026-09-18" },
    { id: "BK-803", venue: "Canteen Bulk Order", title: "Cultural Night Snack Packs", bookedBy: "Aarav Sharma (Student)", amount: "₹6,200", date: "2026-09-20" },
  ];

  /* Handler Actions */
  const approveRegistration = (id) => {
    const now = new Date().toLocaleString();
    setRegistrations((prev) =>
      prev.map((r) => (r.id === id ? { ...r, status: "approved", approvedAt: now } : r))
    );
    const reg = registrations.find((r) => r.id === id);
    setActionNotice(`✅ Registration Approved for ${reg ? reg.name : id}! Platform clearance issued.`);
    setTimeout(() => setActionNotice(""), 5000);
  };

  const rejectRegistration = (id) => {
    setRegistrations((prev) =>
      prev.map((r) => (r.id === id ? { ...r, status: "rejected" } : r))
    );
    setActionNotice(`❌ Registration Rejected for ${id}.`);
    setTimeout(() => setActionNotice(""), 5000);
  };

  /* Filtered pending registrations */
  const pendingRegs = useMemo(() => {
    return registrations.filter((r) => {
      const matchStatus = r.status === "pending";
      const matchRole = regFilter === "ALL" || r.role === regFilter;
      const q = searchQuery.toLowerCase();
      const matchSearch = !q || r.name.toLowerCase().includes(q) || r.idCard.toLowerCase().includes(q);
      return matchStatus && matchRole && matchSearch;
    });
  }, [registrations, regFilter, searchQuery]);

  return (
    <div style={{ maxWidth: 960, margin: "0 auto" }}>
      {/* ── Admin Header ── */}
      <div style={{
        background: `linear-gradient(135deg, ${maroonDark}, ${maroon})`,
        color: "#FAF4ED", borderRadius: 14, padding: "20px 24px", marginBottom: 20,
        boxShadow: "0 6px 20px rgba(45,7,14,0.3)", display: "flex", justifyContent: "space-between",
        alignItems: "center", flexWrap: "wrap", gap: 14
      }}>
        <div>
          <div style={{ fontSize: 11, letterSpacing: "0.14em", textTransform: "uppercase", color: gold, fontWeight: 700 }}>
            Admin Master Command Center
          </div>
          <h2 style={{ margin: "4px 0 0 0", fontFamily: "Georgia, serif", fontSize: 22, fontWeight: 700 }}>
            User Registrations & Approvals Portal
          </h2>
          <div style={{ fontSize: 12, color: "rgba(250,244,237,0.85)", marginTop: 4 }}>
            Review Registered Users & Approve Registration Clearance
          </div>
        </div>

        <div style={{
          background: "rgba(255,255,255,0.12)", border: "1px solid rgba(255,255,255,0.25)",
          padding: "6px 14px", borderRadius: 20, fontSize: 12, fontWeight: 700, color: gold
        }}>
          ⚙️ Admin Verified
        </div>
      </div>

      {/* ── Action Feedback Notice ── */}
      {actionNotice && (
        <div style={{
          background: "#F0FDF4", border: `1.5px solid ${sage}`, color: "#15803D",
          borderRadius: 10, padding: "12px 16px", marginBottom: 16, fontSize: 13,
          fontWeight: 700, boxShadow: "0 2px 8px rgba(0,0,0,0.05)"
        }}>
          {actionNotice}
        </div>
      )}

      {/* ── Admin Navigation Tabs ── */}
      <div style={{
        display: "flex", gap: 8, marginBottom: 20, borderBottom: "2px solid #E8D5D8", paddingBottom: 8,
        flexWrap: "wrap"
      }}>
        <button
          onClick={() => setActiveTab("registrations")}
          style={{
            padding: "10px 20px", borderRadius: 8, border: "none", cursor: "pointer",
            fontWeight: 700, fontSize: 13,
            background: activeTab === "registrations" ? maroonDark : "transparent",
            color: activeTab === "registrations" ? "#FAF4ED" : maroonDark,
            display: "flex", alignItems: "center", gap: 6, transition: "all 0.15s"
          }}
        >
          <span>👥 User Registration Approvals</span>
          {pendingRegs.length > 0 && (
            <span style={{
              background: gold, color: maroonDark, fontSize: 11, padding: "2px 7px",
              borderRadius: 10, fontWeight: 800
            }}>
              {pendingRegs.length}
            </span>
          )}
        </button>

        <button
          onClick={() => setActiveTab("overview")}
          style={{
            padding: "10px 20px", borderRadius: 8, border: "none", cursor: "pointer",
            fontWeight: 700, fontSize: 13,
            background: activeTab === "overview" ? maroonDark : "transparent",
            color: activeTab === "overview" ? "#FAF4ED" : maroonDark,
            transition: "all 0.15s"
          }}
        >
          📊 Master System Overview
        </button>
      </div>

      {/* ══════════════════════════════════════════════════════════════
          TAB 1: USER REGISTRATION APPROVALS
         ══════════════════════════════════════════════════════════════ */}
      {activeTab === "registrations" && (
        <div>
          {/* Header & Filter Card */}
          <Card style={{ padding: "14px 18px", marginBottom: 16 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 12 }}>
              <div>
                <h3 style={{ margin: 0, fontFamily: "Georgia, serif", fontSize: 17, color: maroonDark }}>
                  👥 Registered Users & Pending Approvals
                </h3>
                <div style={{ fontSize: 12, color: "#6B644C", marginTop: 2 }}>
                  See how many people are registered and approve new registration applicants.
                </div>
              </div>

              <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
                <input
                  style={{ ...inputStyle, width: 220 }}
                  placeholder="🔍 Search name or ID..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
                <select
                  style={{ ...inputStyle, width: "auto" }}
                  value={regFilter}
                  onChange={(e) => setRegFilter(e.target.value)}
                >
                  <option value="ALL">All Roles</option>
                  <option value="Student">Student</option>
                  <option value="Faculty">Faculty</option>
                  <option value="Class Representative">Class Rep</option>
                  <option value="External Participant">External</option>
                  <option value="Canteen Staff">Canteen Staff</option>
                </select>
              </div>
            </div>
          </Card>

          {/* Stat Summary Row */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: 14, marginBottom: 20 }}>
            <Card style={{ marginBottom: 0, borderLeft: `4px solid ${maroonDark}` }}>
              <Label>Total Registered Users</Label>
              <div style={{ fontSize: 26, fontWeight: 800, color: maroonDark }}>
                {registrations.length} Registered
              </div>
              <div style={{ fontSize: 11, color: brownLight, marginTop: 4 }}>
                Students, Faculty, Staff & External
              </div>
            </Card>

            <Card style={{ marginBottom: 0, borderLeft: "4px solid #F59E0B" }}>
              <Label>Pending Approvals</Label>
              <div style={{ fontSize: 26, fontWeight: 800, color: "#1D4ED8" }}>
                {registrations.filter((r) => r.status === "pending").length} Awaiting
              </div>
              <div style={{ fontSize: 11, color: brownLight, marginTop: 4 }}>
                Requires Admin Clearance
              </div>
            </Card>

            <Card style={{ marginBottom: 0, borderLeft: "4px solid #10B981" }}>
              <Label>Approved Profiles</Label>
              <div style={{ fontSize: 26, fontWeight: 800, color: "#047857" }}>
                {registrations.filter((r) => r.status === "approved").length} Active
              </div>
              <div style={{ fontSize: 11, color: brownLight, marginTop: 4 }}>
                Full Platform Clearance
              </div>
            </Card>
          </div>

          {/* Pending Approval Cards */}
          <div style={{ marginBottom: 24 }}>
            <h4 style={{ fontFamily: "Georgia, serif", fontSize: 15, color: maroonDark, marginBottom: 10 }}>
              ⏳ Pending Registration Approval Requests ({pendingRegs.length})
            </h4>

            {pendingRegs.map((reg) => (
              <Card key={reg.id} style={{ borderLeft: `4px solid ${gold}` }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 14 }}>
                  <div>
                    <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                      <strong style={{ fontSize: 16, color: maroonDark }}>{reg.name}</strong>
                      <span style={{
                        fontSize: 11, fontWeight: 700, padding: "3px 9px", borderRadius: 12,
                        background: reg.role === "Faculty" ? "#E8F5E9" : reg.role === "Student" ? "#E3F2FD" : "#FFF3E0",
                        color: reg.role === "Faculty" ? "#2E7D32" : reg.role === "Student" ? "#1565C0" : "#E65100"
                      }}>
                        {reg.role}
                      </span>
                    </div>

                    <div style={{ fontSize: 13, color: "#475569", marginTop: 4 }}>
                      📧 {reg.email} · Department: <strong>{reg.dept}</strong>
                    </div>
                    <div style={{ fontSize: 12, color: "#6B644C", marginTop: 2 }}>
                      College ID Code: <strong>{reg.idCard}</strong> · Submitted: {reg.registeredAt}
                    </div>
                  </div>

                  <div style={{ display: "flex", gap: 10 }}>
                    <button
                      onClick={() => rejectRegistration(reg.id)}
                      style={{
                        padding: "8px 14px", borderRadius: 8, border: `1.5px solid ${brick}`,
                        background: "transparent", color: brick, fontSize: 12, fontWeight: 700,
                        cursor: "pointer"
                      }}
                    >
                      Reject
                    </button>
                    <button
                      onClick={() => approveRegistration(reg.id)}
                      style={{
                        padding: "8px 16px", borderRadius: 8, border: `1.5px solid ${sage}`,
                        background: sage, color: "#FAF4ED", fontSize: 12, fontWeight: 700,
                        cursor: "pointer"
                      }}
                    >
                      ✓ Approve Registration
                    </button>
                  </div>
                </div>
              </Card>
            ))}

            {pendingRegs.length === 0 && (
              <Card style={{ textAlign: "center", padding: "28px", background: "#F8FAFC" }}>
                <div style={{ fontSize: 24 }}>✨</div>
                <div style={{ fontWeight: 700, color: maroonDark, marginTop: 4 }}>No Pending Registrations</div>
                <div style={{ fontSize: 12, color: "#6B644C" }}>All submitted user registration requests have been reviewed.</div>
              </Card>
            )}
          </div>

          {/* Approved Users List */}
          <div>
            <h4 style={{ fontFamily: "Georgia, serif", fontSize: 15, color: maroonDark, marginBottom: 10 }}>
              ✅ Approved Registered Users Log
            </h4>
            {registrations.filter((r) => r.status === "approved").map((reg) => (
              <Card key={reg.id} style={{ background: "#F6FBF7", borderColor: "#A7F3D0" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <div>
                    <div style={{ fontWeight: 700, color: maroonDark }}>{reg.name} ({reg.role})</div>
                    <div style={{ fontSize: 12, color: "#475569", marginTop: 2 }}>
                      {reg.email} · ID: {reg.idCard} · Department: {reg.dept}
                    </div>
                    <div style={{ fontSize: 11, color: "#047857", marginTop: 4 }}>
                      Platform Clearance Approved at {reg.approvedAt || "Recorded"}
                    </div>
                  </div>
                  <Stamp text="Approved" tone="sage" />
                </div>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* ══════════════════════════════════════════════════════════════
          TAB 2: MASTER FINANCIAL LEDGER & SYSTEM OVERVIEW
         ══════════════════════════════════════════════════════════════ */}
      {activeTab === "overview" && (() => {
        const savedBookingsStr = localStorage.getItem("cems_shared_bookings");
        let bookingList = allBookings;
        if (savedBookingsStr) {
          try {
            const parsed = JSON.parse(savedBookingsStr);
            if (Array.isArray(parsed) && parsed.length > 0) bookingList = parsed;
          } catch (e) {}
        }

        const totalRevenue = bookingList
          .filter((b) => b.paymentStatus === "PAID" || b.status === "COMPLETED" || b.status === "CONFIRMED")
          .reduce((sum, b) => sum + (b.amount || (b.venue?.includes("Auditorium") ? 15000 : 3500)), 0);

        const upiPaymentsCount = bookingList.filter((b) => b.paymentMethod === "UPI").length;
        const upiTotalRevenue = bookingList
          .filter((b) => b.paymentMethod === "UPI")
          .reduce((sum, b) => sum + (b.amount || 0), 0);

        return (
          <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            {/* Financial Summary Cards */}
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: 14 }}>
              <Card style={{ marginBottom: 0, borderLeft: "4px solid #10B981" }}>
                <Label>Total Collected Revenue</Label>
                <div style={{ fontSize: 24, fontWeight: 900, color: "#047857" }}>
                  ₹{totalRevenue.toLocaleString()}
                </div>
                <div style={{ fontSize: 11, color: brownLight, marginTop: 4 }}>
                  Auditorium, Hostel & Canteen Food
                </div>
              </Card>

              <Card style={{ marginBottom: 0, borderLeft: `4px solid ${maroonDark}` }}>
                <Label>📱 UPI Payment Transactions</Label>
                <div style={{ fontSize: 24, fontWeight: 900, color: maroonDark }}>
                  ₹{upiTotalRevenue.toLocaleString()}
                </div>
                <div style={{ fontSize: 11, color: brownLight, marginTop: 4 }}>
                  {upiPaymentsCount} Successful UPI Payments
                </div>
              </Card>

              <Card style={{ marginBottom: 0, borderLeft: `4px solid ${gold}` }}>
                <Label>Active Venue Reservations</Label>
                <div style={{ fontSize: 24, fontWeight: 900, color: "#1D4ED8" }}>
                  {bookingList.length} Total Logs
                </div>
                <div style={{ fontSize: 11, color: brownLight, marginTop: 4 }}>
                  Financial Master Ledger Sync
                </div>
              </Card>
            </div>

            {/* Detailed Financial Activity Table */}
            <Card>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
                <div>
                  <h3 style={{ margin: 0, fontFamily: "Georgia, serif", fontSize: 17, color: maroonDark }}>
                    💳 Master Financial Ledger & Payment Transactions
                  </h3>
                  <div style={{ fontSize: 12, color: "#6B644C", marginTop: 2 }}>
                    Real-time payment audit log across all sub-systems (Auditorium, Hostel, Canteen Food Pre-Orders).
                  </div>
                </div>
                <StatusBadge status="CONFIRMED" />
              </div>

              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                {bookingList.map((b) => {
                  const itemAmount = b.amount || (b.venue?.includes("Auditorium") ? 15000 : 3500);
                  const isPaid = b.paymentStatus === "PAID" || b.status === "COMPLETED";
                  return (
                    <div
                      key={b.id}
                      style={{
                        padding: "12px 14px",
                        borderRadius: 10,
                        background: isPaid ? "#F6FBF7" : "#FFFDF5",
                        border: `1px solid ${isPaid ? "#A7F3D0" : "#FDE68A"}`,
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                        flexWrap: "wrap",
                        gap: 10,
                      }}
                    >
                      <div>
                        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                          <span style={{ fontSize: 11, fontWeight: 800, color: maroonDark, background: "#FFF", padding: "2px 6px", borderRadius: 4, border: "1px solid #E2E8F0" }}>
                            {b.id}
                          </span>
                          <strong style={{ fontSize: 14, color: maroonDark }}>{b.title}</strong>
                        </div>
                        <div style={{ fontSize: 12, color: "#475569", marginTop: 4 }}>
                          Venue: <strong>{b.venue}</strong> · Applicant: <strong>{b.applicant || b.bookedBy}</strong>
                        </div>
                        <div style={{ fontSize: 11, color: "#6B644C", marginTop: 2 }}>
                          {b.details}
                        </div>
                      </div>

                      <div style={{ textAlign: "right" }}>
                        <div style={{ fontWeight: 900, color: isPaid ? "#059669" : "#3B82F6", fontSize: 15 }}>
                          ₹{itemAmount.toLocaleString()}
                        </div>
                        <div style={{ fontSize: 11, marginTop: 2, fontWeight: 700, color: isPaid ? "#15803D" : "#1D4ED8" }}>
                          {isPaid ? `✅ Paid via ${b.paymentMethod || "UPI"}` : "⚠️ Payment Due"}
                        </div>
                        {b.paymentTxnId && (
                          <div style={{ fontSize: 10, color: "#6B7280", marginTop: 2 }}>
                            Txn: {b.paymentTxnId}
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </Card>
          </div>
        );
      })()}
    </div>
  );
}
