import { useState, useEffect } from "react";
import { Card, Label, Field, Stamp } from "../components/Shared";
import { inputStyle, buttonStyle, maroonDark, roles } from "../theme";

export default function RebookModule({ role = "student" }) {
  const [activeRole, setActiveRole] = useState(role);

  useEffect(() => {
    setActiveRole(role);
  }, [role]);

  const [requests, setRequests] = useState([
    {
      id: 1,
      event: "Alumni meet",
      canceledOn: "2026-06-20",
      newDate: "2026-09-14",
      description: "Guest speaker's flight was cancelled; requesting relocation to September slot.",
      status: "pending",
    },
  ]);
  const [event, setEvent] = useState("");
  const [newDate, setNewDate] = useState("");
  const [description, setDescription] = useState("");

  const submit = (e) => {
    e.preventDefault();
    if (!event || !newDate || !description) return;
    setRequests((r) => [
      ...r,
      {
        id: r.length + 1,
        event,
        canceledOn: new Date().toISOString().slice(0, 10),
        newDate,
        description,
        status: "pending",
      },
    ]);
    setEvent("");
    setNewDate("");
    setDescription("");
  };

  const decide = (id, status) => {
    setRequests((r) => r.map((req) => (req.id === id ? { ...req, status } : req)));
  };

  const rebookRoles = roles.filter(r => ["student", "class_rep", "faculty", "principal"].includes(r.id));

  return (
    <div style={{ maxWidth: 640, margin: "0 auto" }}>


      {activeRole !== "principal" && (
        <Card>
          <Label>Rebooking description box</Label>
          <form onSubmit={submit}>
            <Field label="Event">
              <input style={inputStyle} value={event} onChange={(e) => setEvent(e.target.value)} placeholder="Alumni meet" />
            </Field>
            <Field label="Requested new date">
              <input style={inputStyle} type="date" value={newDate} onChange={(e) => setNewDate(e.target.value)} />
            </Field>
            <Field label="Logistical reason for the change">
              <textarea
                style={{ ...inputStyle, minHeight: 70, resize: "vertical" }}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Explain what forced the change"
              />
            </Field>
            <button style={buttonStyle("primary")} type="submit">
              Send to principal
            </button>
          </form>
        </Card>
      )}

      {requests.map((r) => (
        <Card key={r.id}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 12 }}>
            <div style={{ flex: 1 }}>
              <div style={{ fontWeight: 600 }}>{r.event}</div>
              <div style={{ fontSize: 13, color: "#6B644C", marginTop: 2 }}>
                Canceled {r.canceledOn} · requested relocation to {r.newDate}
              </div>
              <div style={{ fontSize: 13, color: "#6B644C", marginTop: 6 }}>"{r.description}"</div>
            </div>
            {r.status === "pending" ? (
              activeRole === "principal" ? (
                <div style={{ display: "flex", gap: 8, flexShrink: 0 }}>
                  <button style={buttonStyle("secondary")} onClick={() => decide(r.id, "denied")}>
                    Deny
                  </button>
                  <button style={buttonStyle("primary")} onClick={() => decide(r.id, "approved")}>
                    Authorize
                  </button>
                </div>
              ) : (
                <Stamp text="Awaiting principal" tone="brass" />
              )
            ) : (
              <Stamp text={r.status === "approved" ? "Authorized" : "Denied"} tone={r.status === "approved" ? "sage" : "brick"} />
            )}
          </div>
        </Card>
      ))}
    </div>
  );
}
