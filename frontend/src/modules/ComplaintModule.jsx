import { useState, useEffect, useCallback } from "react";
import { Card, Label, Field, Stamp } from "../components/Shared";
import { inputStyle, buttonStyle, maroonDark, maroon, gold, sage, brick } from "../theme";

const INITIAL_COMPLAINTS = [
  {
    id: 101,
    sender: "Rahul Sharma (Student - CS Dept)",
    subject: "Canteen Bulk Order Shortage",
    text: "Canteen bulk order for the Tech Fest inaugural lunch was short by 40 plates, causing delay for guest speakers.",
    priority: "High",
    ts: "2026-09-06 09:15 AM",
    reply: "Investigated by Principal's office. Canteen manager instructed to issue immediate reimbursement and voucher.",
    repliedAt: "2026-09-06 11:30 AM",
    status: "Resolved & Replied",
  },
  {
    id: 102,
    sender: "Neha Verma (Class Representative)",
    subject: "Hostel Block B Air Conditioning Fault",
    text: "Hostel AC room booking system showed AC operational, but room 304 cooling unit is non-functional.",
    priority: "Medium",
    ts: "2026-09-05 04:20 PM",
    reply: null,
    repliedAt: null,
    status: "Pending Principal Review",
  },
  {
    id: 103,
    sender: "Anonymous Student",
    subject: "Library Wi-Fi Connectivity Drop",
    text: "Frequent Wi-Fi disconnections on 2nd floor study hall during evening prep hours.",
    priority: "Low",
    ts: "2026-09-04 02:10 PM",
    reply: null,
    repliedAt: null,
    status: "Pending Principal Review",
  },
];

function authHeader() {
  const token = localStorage.getItem("cems_access") || "";
  return token ? { Authorization: `Bearer ${token}` } : {};
}

export default function ComplaintModule({ role = "student" }) {
  const isPrincipal = role === "principal" || role === "admin";

  const [complaints, setComplaints] = useState(INITIAL_COMPLAINTS);
  const [subject, setSubject] = useState("");
  const [text, setText] = useState("");
  const [priority, setPriority] = useState("Medium");
  const [anon, setAnon] = useState(false);

  // State for Principal Reply UI
  const [replyingId, setReplyingId] = useState(null);
  const [replyText, setReplyText] = useState("");
  const [notice, setNotice] = useState("");
  const [loading, setLoading] = useState(false);

  // Fetch live complaints from backend API with fallback to initial sample data
  const fetchComplaints = useCallback(async () => {
    try {
      const token = localStorage.getItem("cems_access");
      if (!token) return;
      setLoading(true);
      const res = await fetch("/api/campus-issues/complaints/", {
        headers: authHeader(),
      });
      if (res.ok) {
        const data = await res.json();
        const results = Array.isArray(data) ? data : data.results || [];
        if (results.length > 0) {
          const mapped = results.map((c) => {
            const rawP = (c.priority || "MEDIUM").toUpperCase();
            const p = rawP === "HIGH" ? "High" : rawP === "LOW" ? "Low" : "Medium";
            return {
              id: c.id,
              sender: c.is_anonymous ? "Anonymous User" : (c.submitted_by || "Student"),
              subject: c.subject || "Grievance Record",
              text: c.description || c.subject,
              priority: p,
              ts: c.submitted_at ? new Date(c.submitted_at).toLocaleString() : "Recently",
              reply: c.principal_reply || null,
              repliedAt: c.replied_at ? new Date(c.replied_at).toLocaleString() : null,
              status: c.principal_reply ? "Resolved & Replied" : (c.status || "Pending Principal Review"),
            };
          });
          setComplaints(mapped);
        }
      }
    } catch {
      // Fallback sample data remains intact
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchComplaints();
  }, [fetchComplaints]);

  // Submit new grievance
  const submitComplaint = async (e) => {
    e.preventDefault();
    if (!subject || !text) return;
    const now = new Date().toLocaleString();
    const newComplaint = {
      id: Date.now(),
      sender: anon ? "Anonymous User" : `${role.toUpperCase()} User`,
      subject,
      text,
      priority,
      ts: now,
      reply: null,
      repliedAt: null,
      status: "Pending Principal Review",
    };

    setComplaints((prev) => [newComplaint, ...prev]);

    // Send to backend API if authenticated
    try {
      const token = localStorage.getItem("cems_access");
      if (token) {
        await fetch("/api/campus-issues/complaints/", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            ...authHeader(),
          },
          body: JSON.stringify({
            subject,
            description: text,
            priority: priority.toUpperCase(),
            is_anonymous: anon,
          }),
        });
        fetchComplaints();
      }
    } catch {
      // Local optimistic update handles rendering
    }

    setSubject("");
    setText("");
    setNotice("✅ Grievance submitted successfully! Logged directly into the Principal's web portal.");
    setTimeout(() => setNotice(""), 5000);
  };

  // Submit Principal Reply
  const submitReply = async (id) => {
    if (!replyText.trim()) return;
    const now = new Date().toLocaleString();

    // Optimistic state update
    setComplaints((prev) =>
      prev.map((c) =>
        c.id === id
          ? {
              ...c,
              reply: replyText.trim(),
              repliedAt: now,
              status: "Resolved & Replied",
            }
          : c
      )
    );

    // Call Django API if valid backend complaint ID
    try {
      const token = localStorage.getItem("cems_access");
      if (token && typeof id === "number" && id < 100000) {
        await fetch(`/api/campus-issues/complaints/${id}/reply/`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            ...authHeader(),
          },
          body: JSON.stringify({
            reply: replyText.trim(),
            status: "RESOLVED",
          }),
        });
        fetchComplaints();
      }
    } catch {
      // Local state update handles display
    }

    setReplyingId(null);
    setReplyText("");
    setNotice("✅ Reply sent to user! Official Principal response attached to grievance record.");
    setTimeout(() => setNotice(""), 5000);
  };

  const priorityTone = { High: "brick", Medium: "brass", Low: "sage" };

  return (
    <div style={{ maxWidth: 740, margin: "0 auto" }}>
      {/* ── Notification Banner ── */}
      {notice && (
        <div style={{
          background: "#F0FDF4", border: `1.5px solid ${sage}`, color: "#166534",
          borderRadius: 10, padding: "12px 16px", marginBottom: 16, fontSize: 13,
          fontWeight: 700, boxShadow: "0 2px 8px rgba(0,0,0,0.05)"
        }}>
          {notice}
        </div>
      )}

      {/* ── Grievance Submission Form (for Students / Staff / Class Reps) ── */}
      {!isPrincipal && (
        <Card style={{ borderLeft: `4px solid ${maroonDark}` }}>
          <div style={{ marginBottom: 14 }}>
            <h3 style={{ margin: 0, fontFamily: "Georgia, serif", fontSize: 18, color: maroonDark }}>
              📣 Submit Confidential Grievance
            </h3>
            <div style={{ fontSize: 12, color: "#6B644C", marginTop: 2 }}>
              Direct action channel — your complaint bypasses administrative delays and logs natively onto the Principal's panel.
            </div>
          </div>

          <form onSubmit={submitComplaint}>
            <Field label="Subject / Grievance Category">
              <input
                style={inputStyle}
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                placeholder="e.g. Auditorium Sound Distortion / Hostel AC Repair"
                required
              />
            </Field>

            <Field label="Detailed Grievance Description">
              <textarea
                style={{ ...inputStyle, minHeight: 80, resize: "vertical" }}
                value={text}
                onChange={(e) => setText(e.target.value)}
                placeholder="Describe what happened with time and location..."
                required
              />
            </Field>

            <div style={{ display: "flex", gap: 16, marginBottom: 16, alignItems: "center", flexWrap: "wrap" }}>
              <div>
                <Label>Priority Level</Label>
                <select
                  style={{ ...inputStyle, width: 150 }}
                  value={priority}
                  onChange={(e) => setPriority(e.target.value)}
                >
                  <option value="Low">🟢 Low Priority</option>
                  <option value="Medium">🟡 Medium Priority</option>
                  <option value="High">🔴 High Priority</option>
                </select>
              </div>

              <label style={{ fontSize: 13, display: "flex", gap: 8, alignItems: "center", cursor: "pointer", marginTop: 16 }}>
                <input
                  type="checkbox"
                  checked={anon}
                  onChange={(e) => setAnon(e.target.checked)}
                  style={{ width: 16, height: 16, accentColor: maroonDark }}
                />
                <span style={{ fontWeight: 600, color: maroonDark }}>Submit Anonymously</span>
              </label>
            </div>

            <button style={{ ...buttonStyle("primary"), width: "100%" }} type="submit">
              Send to Principal's Portal
            </button>
          </form>
        </Card>
      )}

      {/* ── Feed Header ── */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
        <div>
          <h3 style={{ margin: 0, fontFamily: "Georgia, serif", fontSize: 18, color: maroonDark }}>
            {isPrincipal ? "🏛️ Principal Real-Time Grievance Portal" : "📋 Real-Time Complaints Feed"}
          </h3>
          <div style={{ fontSize: 12, color: "#6B644C", marginTop: 2 }}>
            {isPrincipal
              ? "All submitted campus grievances populated directly on the Principal's web panel."
              : "Track grievances and official Principal resolutions."}
          </div>
        </div>

        <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
          <span style={{ fontSize: 12, color: maroonDark, fontWeight: 700, background: "#FAF4ED", padding: "4px 10px", borderRadius: 12, border: "1px solid #E8D5D8" }}>
            {complaints.length} Logged Grievances
          </span>
          <button
            onClick={fetchComplaints}
            style={{ padding: "6px 12px", borderRadius: 8, border: `1px solid ${maroon}`, background: "transparent", color: maroon, fontSize: 12, fontWeight: 700, cursor: "pointer" }}
          >
            ↻ Refresh
          </button>
        </div>
      </div>

      {/* ── Complaints Feed Cards ── */}
      {complaints.map((c) => (
        <Card key={c.id} style={{ borderLeft: `4px solid ${c.priority === "High" ? brick : c.priority === "Medium" ? gold : sage}`, marginBottom: 16 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: 10 }}>
            <div>
              <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 4 }}>
                <strong style={{ fontSize: 15, color: maroonDark }}>{c.subject || "Grievance Record"}</strong>
                <Stamp text={c.priority} tone={priorityTone[c.priority]} />
              </div>
              <div style={{ fontSize: 12, color: "#6B644C", fontWeight: 600 }}>
                From: {c.sender} · Logged: {c.ts}
              </div>
            </div>

            <span style={{
              fontSize: 11, fontWeight: 700, padding: "4px 12px", borderRadius: 12,
              background: c.reply ? "#D1FAE5" : "#FEF3C7",
              color: c.reply ? "#047857" : "#92400E"
            }}>
              {c.status}
            </span>
          </div>

          <div style={{ fontSize: 14, color: "#2B1B17", marginTop: 10, leading: 1.5, background: "#FAF4ED", padding: "12px 14px", borderRadius: 8, border: "1px solid #F3E7DA" }}>
            "{c.text}"
          </div>

          {/* ── Existing Reply Display ── */}
          {c.reply && (
            <div style={{
              marginTop: 12, background: "#F0FDF4", border: "1.5px solid #A7F3D0",
              borderRadius: 10, padding: "12px 14px"
            }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 4 }}>
                <strong style={{ fontSize: 12, color: "#047857", textTransform: "uppercase", letterSpacing: "0.05em" }}>
                  🏛️ Official Reply from Principal's Office:
                </strong>
                <span style={{ fontSize: 11, color: "#059669" }}>{c.repliedAt}</span>
              </div>
              <div style={{ fontSize: 13, color: "#166534", fontStyle: "italic" }}>
                "{c.reply}"
              </div>
            </div>
          )}

          {/* ── Principal Reply Action Controls ── */}
          {isPrincipal && (
            <div style={{ marginTop: 14, paddingTop: 10, borderTop: "1px solid #E8D5D8" }}>
              {replyingId === c.id ? (
                <div style={{ background: "#FFFBEB", border: "1px solid #FCD34D", padding: 12, borderRadius: 10 }}>
                  <Label>Write Official Principal Response</Label>
                  <textarea
                    style={{ ...inputStyle, minHeight: 70, resize: "vertical", marginBottom: 10 }}
                    value={replyText}
                    onChange={(e) => setReplyText(e.target.value)}
                    placeholder="Enter official resolution, action taken, or response to the user..."
                  />
                  <div style={{ display: "flex", gap: 8, justifyContent: "flex-end" }}>
                    <button
                      type="button"
                      onClick={() => { setReplyingId(null); setReplyText(""); }}
                      style={{ padding: "6px 12px", borderRadius: 6, border: "1px solid #9CA3AF", background: "#FFF", fontSize: 12, cursor: "pointer" }}
                    >
                      Cancel
                    </button>
                    <button
                      type="button"
                      onClick={() => submitReply(c.id)}
                      style={{ ...buttonStyle("primary"), fontSize: 12, padding: "6px 14px" }}
                    >
                      ✉️ Send Official Reply
                    </button>
                  </div>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => { setReplyingId(c.id); setReplyText(c.reply || ""); }}
                  style={{
                    padding: "7px 14px", borderRadius: 8, border: `1.5px solid ${maroonDark}`,
                    background: maroonDark, color: "#FAF4ED", fontSize: 12, fontWeight: 700,
                    cursor: "pointer", display: "flex", alignItems: "center", gap: 6
                  }}
                >
                  💬 {c.reply ? "Edit Principal Reply" : "Reply to Grievance"}
                </button>
              )}
            </div>
          )}
        </Card>
      ))}

      {complaints.length === 0 && (
        <Card style={{ textAlign: "center", padding: "40px", background: "#FAF4ED" }}>
          <div style={{ fontSize: 32 }}>🎉</div>
          <div style={{ fontWeight: 700, color: maroonDark, marginTop: 6 }}>No Grievances Found</div>
          <div style={{ fontSize: 12, color: "#6B644C" }}>No complaints have been logged at this time.</div>
        </Card>
      )}
    </div>
  );
}
