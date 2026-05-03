import React, { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import "./OwnerMessagesPage.css";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import { getStoredUser, normalizeRole } from "../utils/auth";
import {
  loadOwnerEngagementState,
  resolveOwnerScenario,
  appendOwnerThreadMessage,
  getInquiryPreview,
  formatInquiryDate,
  PAVIA_OWNER_ENGAGEMENT_UPDATED,
  STRONG_MATCH_THRESHOLD
} from "../utils/ownerJourney";

function Gate({ badge, title, body, primaryLabel, onPrimary, secondaryLabel, onSecondary }) {
  return (
    <div className="owner-messages-page">
      <Navbar />
      <main className="owner-messages-locked-main">
        <div className="owner-messages-locked-card owner-messages-locked-card-wide">
          <span className="owner-messages-badge">{badge}</span>
          <h1>{title}</h1>
          <p>{body}</p>
          <button type="button" className="owner-primary-btn" onClick={onPrimary}>
            {primaryLabel}
          </button>
          {secondaryLabel && onSecondary && (
            <button
              type="button"
              className="owner-secondary-outline-btn"
              onClick={onSecondary}
            >
              {secondaryLabel}
            </button>
          )}
        </div>
      </main>
      <Footer />
    </div>
  );
}

function OwnerMessagesPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [loading, setLoading] = useState(true);
  const [scenario, setScenario] = useState("NO_LISTINGS");
  const [engage, setEngage] = useState(null);
  const [selectedChatId, setSelectedChatId] = useState(null);
  const [draft, setDraft] = useState("");

  const refresh = useCallback(async () => {
    const user = getStoredUser();
    if (!user?.userId || normalizeRole(user.role) !== "OWNER") {
      setScenario("NOT_OWNER");
      setEngage(null);
      setLoading(false);
      return;
    }
    setLoading(true);
    const data = await loadOwnerEngagementState(user.userId);
    const scen = resolveOwnerScenario({
      hasListings: data.hasListings,
      hasStrongMatchOnListings: data.hasStrongMatchOnListings,
      hasInquiries: data.hasInquiries,
      hasAnyMessages: data.hasAnyMessages
    });
    setEngage(data);
    setScenario(scen);

    if (scen === "INQUIRY_NO_MESSAGES" || scen === "FULL") {
      const sorted = [...(data.inquiries || [])].sort(
        (a, b) => new Date(b.createdAt) - new Date(a.createdAt)
      );
      const fromUrl = searchParams.get("inquiry");
      const pick = sorted.find((i) => i.id === fromUrl) || sorted[0] || null;
      setSelectedChatId(pick?.id || null);
    } else {
      setSelectedChatId(null);
    }
    setLoading(false);
  }, [searchParams]);

  useEffect(() => {
    refresh();
    const fn = () => {
      refresh();
    };
    window.addEventListener(PAVIA_OWNER_ENGAGEMENT_UPDATED, fn);
    return () => window.removeEventListener(PAVIA_OWNER_ENGAGEMENT_UPDATED, fn);
  }, [refresh]);

  const selectedInquiry = useMemo(
    () => engage?.inquiries?.find((i) => i.id === selectedChatId),
    [engage, selectedChatId]
  );

  const selectedMessages = useMemo(() => {
    if (!engage?.threads || !selectedChatId) {
      return [];
    }
    return engage.threads[selectedChatId] || [];
  }, [engage, selectedChatId]);

  const handleSend = () => {
    const user = getStoredUser();
    const text = draft.trim();
    if (!user?.userId || !selectedChatId || !text) {
      return;
    }
    appendOwnerThreadMessage(user.userId, selectedChatId, {
      sender: "owner",
      text
    });
    setDraft("");
    refresh();
  };

  if (loading) {
    return (
      <div className="owner-messages-page">
        <Navbar />
        <main className="owner-messages-locked-main">
          <p className="owner-messages-loading-msg">Loading…</p>
        </main>
        <Footer />
      </div>
    );
  }

  if (scenario === "NOT_OWNER") {
    return (
      <Gate
        badge="Owners only"
        title="Owner messages"
        body="Sign in with an owner account to use this inbox."
        primaryLabel="Sign in"
        onPrimary={() => navigate("/login")}
      />
    );
  }

  if (scenario === "NO_LISTINGS") {
    return (
      <Gate
        badge="No listings"
        title="Register an animal first"
        body="Messaging opens after you have at least one listing. When adopters reach out, threads show up here."
        primaryLabel="Register animal"
        onPrimary={() => navigate("/register-animal")}
        secondaryLabel="Owner home"
        onSecondary={() => navigate("/ownerhomepage")}
      />
    );
  }

  if (scenario === "LISTINGS_NO_STRONG_MATCH") {
    return (
      <Gate
        badge="No strong matches on your listings"
        title="None of your animals appear in adopters’ strong-match results yet"
        body={`Adopters only see animals at ${STRONG_MATCH_THRESHOLD}% compatibility or higher (inclusive). None of your current listings are in that pool right now—check listing quality or wait for new adopters.`}
        primaryLabel="View my listings"
        onPrimary={() => navigate("/ownerhomepage")}
        secondaryLabel="Manage requests"
        onSecondary={() => navigate("/owner-requests")}
      />
    );
  }

  if (scenario === "STRONG_MATCH_NO_INQUIRY") {
    return (
      <Gate
        badge="No inquiries yet"
        title="Strong matches exist, but no inquiries"
        body={`Your listing(s) can appear for adopters at ${STRONG_MATCH_THRESHOLD}% or higher. No one has sent an inquiry yet. You can remind adopters to use “Get in contact” on the animal page.`}
        primaryLabel="Manage requests"
        onPrimary={() => navigate("/owner-requests")}
        secondaryLabel="Owner home"
        onSecondary={() => navigate("/ownerhomepage")}
      />
    );
  }

  const conversations = (engage?.inquiries || [])
    .slice()
    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
    .map((inq) => ({
      id: inq.id,
      adopterName: inq.adopterName,
      animalName: inq.animalName,
      preview: getInquiryPreview(engage?.threads, inq.id),
      time: formatInquiryDate(inq.createdAt),
      status: engage?.threads?.[inq.id]?.length ? "Active" : "New inquiry"
    }));

  const showInquiryCta =
    scenario === "INQUIRY_NO_MESSAGES" &&
    selectedInquiry &&
    selectedMessages.length === 0;

  return (
    <div className="owner-messages-page">
      <Navbar />

      <main className="owner-messages-main">
        <section className="owner-messages-hero">
          <div className="owner-messages-hero-left">
            <p className="owner-messages-tag">Owner Messages</p>
            <h1>Connect with adopters who reached out</h1>
            <p>
              Inquiries arrive when an adopter uses Get in contact on a strong
              match (≥ {STRONG_MATCH_THRESHOLD}%). Reply here to keep the adoption
              process moving.
            </p>
          </div>

          <div className="owner-messages-hero-right">
            <div className="owner-messages-highlight-card">
              <span className="owner-highlight-badge">Inbox</span>
              <h3>Threads follow real inquiries</h3>
              <p>
                No inquiry yet means no thread—once an inquiry exists, you can
                send the first message or wait for the adopter.
              </p>
            </div>
          </div>
        </section>

        <section className="owner-messages-layout">
          <div className="owner-conversation-panel">
            <h2>Conversations</h2>
            <div className="owner-conversation-list">
              {conversations.map((c) => (
                <button
                  key={c.id}
                  type="button"
                  className={`owner-conversation-card ${
                    selectedChatId === c.id ? "owner-conversation-card-active" : ""
                  }`}
                  onClick={() => setSelectedChatId(c.id)}
                >
                  <div
                    className="owner-conversation-avatar-placeholder"
                    aria-hidden="true"
                  />
                  <div className="owner-conversation-content">
                    <h3>{c.adopterName}</h3>
                    <p>Regarding {c.animalName}</p>
                    <span className="owner-conversation-preview">{c.preview}</span>
                  </div>
                  <span className="owner-conversation-time">{c.time}</span>
                </button>
              ))}
            </div>
          </div>

          <div className="owner-chat-panel">
            {selectedInquiry ? (
              <>
                <div className="owner-chat-header">
                  <div>
                    <h2>{selectedInquiry.adopterName}</h2>
                    <p className="owner-chat-sub">Regarding {selectedInquiry.animalName}</p>
                  </div>
                  <span className="owner-chat-badge">
                    {selectedMessages.length ? "Active" : "New inquiry"}
                  </span>
                </div>

                {showInquiryCta && (
                  <div className="owner-chat-get-contact-banner">
                    <strong>Get in contact</strong>
                    <p>
                      There are no messages in this thread yet. Send a short reply
                      to introduce yourself and next steps—the adopter will see it
                      here when they return.
                    </p>
                  </div>
                )}

                <div className="owner-chat-messages">
                  {selectedMessages.map((message) => (
                    <div
                      key={message.id}
                      className={`owner-chat-bubble-row ${
                        message.sender === "owner"
                          ? "owner-chat-user"
                          : "owner-chat-adopter"
                      }`}
                    >
                      <div className="owner-chat-bubble">
                        <p>{message.text}</p>
                        <span>{message.time}</span>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="owner-chat-input-area">
                  <input
                    type="text"
                    value={draft}
                    onChange={(e) => setDraft(e.target.value)}
                    placeholder="Write your message…"
                    className="owner-chat-input"
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        handleSend();
                      }
                    }}
                  />
                  <button type="button" className="owner-chat-send-btn" onClick={handleSend}>
                    Send
                  </button>
                </div>
              </>
            ) : (
              <p className="owner-chat-empty-select">Select a conversation.</p>
            )}
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}

export default OwnerMessagesPage;
