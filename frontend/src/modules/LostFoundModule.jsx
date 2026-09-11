import { useState, useEffect } from "react";
import { Card, Field, Stamp, Toast } from "../components/Shared";
import { buttonStyle, inputStyle, navyBlue, royalBlue } from "../theme";

export default function LostFoundModule({ role = "student" }) {
  const [items, setItems] = useState([]);
  const [activeTab, setActiveTab] = useState("ALL");
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [selectedItem, setSelectedItem] = useState(null);
  const [toastMessage, setToastMessage] = useState("");

  // Create Form State
  const [formStatus, setFormStatus] = useState("LOST");
  const [formTitle, setFormTitle] = useState("");
  const [formDesc, setFormDesc] = useState("");
  const [formCat, setFormCat] = useState("Electronics");
  const [formLoc, setFormLoc] = useState("");
  const [formImage, setFormImage] = useState(null);
  const [formVideo, setFormVideo] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Chat Form State
  const [chatText, setChatText] = useState("");
  const [chatImage, setChatImage] = useState(null);
  const [chatVideo, setChatVideo] = useState(null);
  const [isSendingChat, setIsSendingChat] = useState(false);

  const fetchItems = () => {
    const token = localStorage.getItem("cems_access");
    fetch("http://localhost:8000/api/lostfound/items/", {
      headers: { Authorization: `Bearer ${token}` }
    })
      .then((res) => res.json())
      .then((data) => {
        setItems(Array.isArray(data) ? data : (data.results || []));
      })
      .catch(() => {});
  };

  useEffect(() => {
    fetchItems();
  }, []);

  const handleCreateSubmit = async (e) => {
    e.preventDefault();
    if (!formTitle.trim() || !formDesc.trim()) {
      setToastMessage("Title and description are required.");
      return;
    }
    setIsSubmitting(true);
    const token = localStorage.getItem("cems_access");
    
    const formData = new FormData();
    formData.append("item_status", formStatus);
    formData.append("title", formTitle);
    formData.append("description", formDesc);
    formData.append("category", formCat);
    formData.append("location", formLoc);
    if (formImage) formData.append("image", formImage);
    if (formVideo) formData.append("video", formVideo);

    try {
      const res = await fetch("http://localhost:8000/api/lostfound/items/", {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
        body: formData
      });
      if (res.ok) {
        setToastMessage(`Item reported successfully!`);
        setShowCreateForm(false);
        setFormTitle(""); setFormDesc(""); setFormLoc(""); setFormImage(null); setFormVideo(null);
        fetchItems();
      } else {
        const errorData = await res.text();
        setToastMessage("Error: " + errorData.substring(0, 100));
        console.error("Submit Error:", errorData);
      }
    } catch(err) {
      setToastMessage("Server error: " + err.message);
      console.error(err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSendChat = async (e) => {
    e.preventDefault();
    if (!selectedItem) return;
    if (!chatText.trim() && !chatImage && !chatVideo) return;

    setIsSendingChat(true);
    const token = localStorage.getItem("cems_access");
    
    const formData = new FormData();
    formData.append("text", chatText);
    if (chatImage) formData.append("image", chatImage);
    if (chatVideo) formData.append("video", chatVideo);

    try {
      const res = await fetch(`http://localhost:8000/api/lostfound/items/${selectedItem.id}/messages/`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
        body: formData
      });
      if (res.ok) {
        const newMsg = await res.json();
        setSelectedItem((prev) => ({
          ...prev,
          messages: [...(prev.messages || []), newMsg]
        }));
        setItems((prev) => prev.map(i => i.id === selectedItem.id ? { ...i, messages: [...(i.messages || []), newMsg] } : i));
        setChatText(""); setChatImage(null); setChatVideo(null);
      }
    } catch {
      setToastMessage("Failed to send message.");
    } finally {
      setIsSendingChat(false);
    }
  };

  const filteredItems = items.filter(item => {
    if (activeTab === "ALL") return true;
    return item.item_status === activeTab;
  });

  const renderBadge = (status) => {
    if (status === "FOUND") return <Stamp text="Found" tone="sage" />;
    if (status === "LOST") return <Stamp text="Lost" tone="brick" />;
    return <Stamp text="Claimed" tone="slate" />;
  };

  return (
    <div style={{ maxWidth: 1000, margin: "0 auto", paddingBottom: 40 }}>
      {toastMessage && <Toast message={toastMessage} onClose={() => setToastMessage("")} />}
      
      {/* Header Banner */}
      <div style={{
        background: `linear-gradient(135deg, ${navyBlue} 0%, #0B132B 100%)`,
        borderRadius: 12, padding: "20px 24px", marginBottom: 20, color: "#FFF",
        boxShadow: "0 4px 12px rgba(0,0,0,0.1)", display: "flex", justifyContent: "space-between", alignItems: "center"
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
          <span style={{ fontSize: 32 }}>🔍</span>
          <div>
            <strong style={{ fontSize: 18, display: "block" }}>Lost & Found Center</strong>
            <div style={{ fontSize: 13, marginTop: 4, opacity: 0.9 }}>
              Report lost belongings or items you've found on campus.
            </div>
          </div>
        </div>
        <button
          onClick={() => setShowCreateForm(!showCreateForm)}
          style={{ ...buttonStyle("primary"), background: "#FFF", color: navyBlue, fontWeight: 800 }}
        >
          {showCreateForm ? "Cancel" : "➕ Report Item"}
        </button>
      </div>

      {/* Create Form */}
      {showCreateForm && (
        <Card className="animate-slide-up" style={{ marginBottom: 24, border: `2px solid ${royalBlue}` }}>
          <div style={{ fontWeight: 800, fontSize: 16, color: navyBlue, marginBottom: 16 }}>
            Report a Lost or Found Item
          </div>
          <form onSubmit={handleCreateSubmit}>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
              <Field label="Status">
                <select style={inputStyle} value={formStatus} onChange={e => {
                  setFormStatus(e.target.value);
                  setFormImage(null);
                  setFormVideo(null);
                }}>
                  <option value="LOST">I Lost Something</option>
                  <option value="FOUND">I Found Something</option>
                </select>
              </Field>
              <Field label="Category">
                <select style={inputStyle} value={formCat} onChange={e => setFormCat(e.target.value)}>
                  <option value="Electronics">Electronics (Phones, Laptops)</option>
                  <option value="ID Card">ID Cards / Wallet</option>
                  <option value="Books">Books / Stationery</option>
                  <option value="Other">Other</option>
                </select>
              </Field>
            </div>
            
            <Field label="Title / Short Description">
              <input style={inputStyle} placeholder="e.g. Blue Dell Backpack" value={formTitle} onChange={e => setFormTitle(e.target.value)} />
            </Field>

            <Field label="Detailed Description">
              <textarea style={{...inputStyle, minHeight: 80}} placeholder="Provide identifying details..." value={formDesc} onChange={e => setFormDesc(e.target.value)} />
            </Field>

            <Field label="Location (Where was it lost/found?)">
              <input style={inputStyle} placeholder="e.g. Near Library, Main Gate" value={formLoc} onChange={e => setFormLoc(e.target.value)} />
            </Field>

            {formStatus === "FOUND" && (
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginBottom: 16 }}>
                <Field label="Upload Image (Optional)">
                  <input type="file" accept="image/*" onChange={e => setFormImage(e.target.files[0])} style={{ fontSize: 13 }} />
                </Field>
                <Field label="Upload Video (Optional)">
                  <input type="file" accept="video/*" onChange={e => setFormVideo(e.target.files[0])} style={{ fontSize: 13 }} />
                </Field>
              </div>
            )}

            <button type="submit" disabled={isSubmitting} style={{ ...buttonStyle("primary"), width: "100%" }}>
              {isSubmitting ? "Submitting..." : "Submit Report"}
            </button>
          </form>
        </Card>
      )}

      {/* Item Details & Chat Modal */}
      {selectedItem && (
        <div style={{
          position: "fixed", inset: 0, background: "rgba(10, 25, 47, 0.7)", zIndex: 1000,
          display: "flex", justifyContent: "center", alignItems: "center", padding: 20, backdropFilter: "blur(4px)"
        }}>
          <div className="animate-slide-up" style={{
            background: "#FFF", width: "100%", maxWidth: 800, maxHeight: "90vh", borderRadius: 16,
            display: "flex", flexDirection: "column", overflow: "hidden", boxShadow: "0 20px 50px rgba(0,0,0,0.3)"
          }}>
            <div style={{ padding: 20, borderBottom: "1px solid #E2E8F0", display: "flex", justifyContent: "space-between", alignItems: "center", background: "#F8FAFC" }}>
              <div>
                <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                  <h2 style={{ fontSize: 20, margin: 0, color: navyBlue }}>{selectedItem.title}</h2>
                  {renderBadge(selectedItem.item_status)}
                </div>
                <div style={{ fontSize: 13, color: "#64748B", marginTop: 4 }}>
                  Reported by {selectedItem.reported_by || "User"} • {selectedItem.category} • {selectedItem.location}
                </div>
              </div>
              <button onClick={() => setSelectedItem(null)} style={{ background: "none", border: "none", fontSize: 24, cursor: "pointer", color: "#64748B" }}>×</button>
            </div>
            
            <div style={{ display: "flex", flex: 1, overflow: "hidden" }}>
              {/* Item Details Section */}
              <div style={{ flex: 1, padding: 20, overflowY: "auto", borderRight: "1px solid #E2E8F0" }}>
                <div style={{ fontSize: 14, color: "#334155", marginBottom: 20, lineHeight: 1.6 }}>
                  {selectedItem.description}
                </div>
                {selectedItem.image && (
                  <div style={{ marginBottom: 16 }}>
                    <div style={{ fontSize: 12, fontWeight: 700, color: "#64748B", marginBottom: 8 }}>ATTACHED IMAGE</div>
                    <img src={selectedItem.image} alt="Lost/Found Item" style={{ width: "100%", borderRadius: 8, border: "1px solid #E2E8F0" }} />
                  </div>
                )}
                {selectedItem.video && (
                  <div>
                    <div style={{ fontSize: 12, fontWeight: 700, color: "#64748B", marginBottom: 8 }}>ATTACHED VIDEO</div>
                    <video src={selectedItem.video} controls style={{ width: "100%", borderRadius: 8, border: "1px solid #E2E8F0" }} />
                  </div>
                )}
              </div>
              
              {/* Chat Box Section */}
              <div style={{ width: 360, display: "flex", flexDirection: "column", background: "#F8FAFC" }}>
                <div style={{ padding: "12px 16px", borderBottom: "1px solid #E2E8F0", fontWeight: 700, color: navyBlue, fontSize: 14 }}>
                  💬 Discussion & Identification
                </div>
                <div style={{ flex: 1, overflowY: "auto", padding: 16, display: "flex", flexDirection: "column", gap: 12 }}>
                  {(!selectedItem.messages || selectedItem.messages.length === 0) ? (
                    <div style={{ textAlign: "center", color: "#94A3B8", fontSize: 13, marginTop: 20 }}>
                      No messages yet. Help identify this item!
                    </div>
                  ) : (
                    selectedItem.messages.map(msg => (
                      <div key={msg.id} style={{ background: "#FFF", padding: 12, borderRadius: 10, border: "1px solid #E2E8F0", boxShadow: "0 1px 2px rgba(0,0,0,0.05)" }}>
                        <div style={{ fontSize: 11, fontWeight: 700, color: royalBlue, marginBottom: 4 }}>
                          {msg.sender_name || "User"} <span style={{ color: "#94A3B8", fontWeight: 400 }}>• {new Date(msg.created_at).toLocaleTimeString()}</span>
                        </div>
                        {msg.text && <div style={{ fontSize: 13, color: "#334155" }}>{msg.text}</div>}
                        {msg.image && <img src={msg.image} style={{ width: "100%", borderRadius: 6, marginTop: 8 }} alt="Chat Attachment" />}
                        {msg.video && <video src={msg.video} controls style={{ width: "100%", borderRadius: 6, marginTop: 8 }} />}
                      </div>
                    ))
                  )}
                </div>
                <div style={{ padding: 16, background: "#FFF", borderTop: "1px solid #E2E8F0" }}>
                  <form onSubmit={handleSendChat}>
                    <input 
                      type="text" 
                      placeholder="Type a message..." 
                      value={chatText} 
                      onChange={e => setChatText(e.target.value)}
                      style={{ ...inputStyle, width: "100%", marginBottom: 8, padding: "8px 12px", fontSize: 13 }}
                    />
                    <div style={{ display: "flex", gap: 8, marginBottom: 8 }}>
                      <input type="file" accept="image/*" onChange={e => setChatImage(e.target.files[0])} style={{ fontSize: 11, flex: 1 }} />
                      <input type="file" accept="video/*" onChange={e => setChatVideo(e.target.files[0])} style={{ fontSize: 11, flex: 1 }} />
                    </div>
                    <button type="submit" disabled={isSendingChat} style={{ ...buttonStyle("primary"), width: "100%", padding: "6px", fontSize: 13 }}>
                      {isSendingChat ? "Sending..." : "Send Message"}
                    </button>
                  </form>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Tabs */}
      <div style={{ display: "flex", gap: 12, marginBottom: 20 }}>
        {["ALL", "LOST", "FOUND"].map(tab => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            style={{
              padding: "8px 16px", borderRadius: 8, fontWeight: 700, fontSize: 13,
              background: activeTab === tab ? navyBlue : "#FFF",
              color: activeTab === tab ? "#FFF" : "#475569",
              border: `1px solid ${activeTab === tab ? navyBlue : "#CBD5E1"}`,
              cursor: "pointer", transition: "all 0.2s"
            }}
          >
            {tab} ITEMS
          </button>
        ))}
      </div>

      {/* Grid */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: 20 }}>
        {filteredItems.map(item => (
          <Card key={item.id} className="animate-fade-in" style={{ cursor: "pointer", display: "flex", flexDirection: "column" }} onClick={() => setSelectedItem(item)}>
            {item.image ? (
              <div style={{ height: 160, background: "#F1F5F9", margin: "-20px -20px 16px -20px", borderTopLeftRadius: 12, borderTopRightRadius: 12, backgroundImage: `url(${item.image})`, backgroundSize: "cover", backgroundPosition: "center" }} />
            ) : item.video ? (
               <div style={{ height: 160, background: "#F1F5F9", margin: "-20px -20px 16px -20px", borderTopLeftRadius: 12, borderTopRightRadius: 12, display: "flex", alignItems: "center", justifyContent: "center", color: "#94A3B8" }}>
                 🎥 Video Attached
               </div>
            ) : (
              <div style={{ height: 120, background: "#F1F5F9", margin: "-20px -20px 16px -20px", borderTopLeftRadius: 12, borderTopRightRadius: 12, display: "flex", alignItems: "center", justifyContent: "center", color: "#94A3B8" }}>
                No Media
              </div>
            )}
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 8 }}>
              <h3 style={{ fontSize: 16, margin: 0, color: navyBlue, flex: 1, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{item.title}</h3>
              {renderBadge(item.item_status)}
            </div>
            <div style={{ fontSize: 13, color: "#64748B", marginBottom: 12, flex: 1 }}>
              {item.description.length > 80 ? item.description.substring(0, 80) + "..." : item.description}
            </div>
            <div style={{ fontSize: 12, color: royalBlue, fontWeight: 700, display: "flex", justifyContent: "space-between", borderTop: "1px solid #E2E8F0", paddingTop: 12 }}>
              <span>📍 {item.location || "Campus"}</span>
              <span>💬 {(item.messages || []).length}</span>
            </div>
          </Card>
        ))}
        {filteredItems.length === 0 && (
          <div style={{ gridColumn: "1 / -1", textAlign: "center", padding: 40, color: "#94A3B8", background: "#FFF", borderRadius: 12, border: "1px dashed #CBD5E1" }}>
            No items found.
          </div>
        )}
      </div>
    </div>
  );
}
