import React, { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import "./OwnerMessagesPage.css";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import { getResolvedUserId, getStoredUser, normalizeRole } from "../utils/auth";
import {
  loadOwnerEngagementState,
  resolveOwnerScenario,
  formatInquiryDate,
  getInquiryPreviewFromMessages,
  PAVIA_OWNER_ENGAGEMENT_UPDATED,
  STRONG_MATCH_THRESHOLD
} from "../utils/ownerJourney";
import {
  acceptInquiry,
  fetchInquiryThread,
  rejectInquiry,
  sendInquiryMessage
} from "../utils/platformApi";
import { usePopup } from "../components/PopupProvider";

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
  const { showPopup } = usePopup();
  const [loading, setLoading] = useState(true);
  const [scenario, setScenario] = useState("NO_LISTINGS");
  const [inquiries, setInquiries] = useState([]);
  const [selectedChatId, setSelectedChatId] = useState(null);
  const [thread, setThread] = useState(null);
  const [draft, setDraft] = useState("");
  const [actionBusy, setActionBusy] = useState(false);

  const user = getStoredUser();
  const ownerId = getResolvedUserId(user);

  const refresh = useCallback(async () => {
    if (ownerId == null || normalizeRole(user?.role) !== "OWNER") {
      setScenario("NOT_OWNER");
      setInquiries([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      const data = await loadOwnerEngagementState(ownerId);
      const scen = resolveOwnerScenario({
        hasListings: data.hasListings,
        hasStrongMatchOnListings: data.hasStrongMatchOnListings,
        hasInquiries: data.hasInquiries,
        hasAnyMessages: data.hasAnyMessages
      });
      setScenario(scen);
      const list = Array.isArray(data.inquiries) ? data.inquiries : [];
      setInquiries(list);

      if (scen === "INQUIRY_NO_MESSAGES" || scen === "FULL") {
        const sorted = [...list].sort(
          (a, b) => new Date(b.createdAt) - new Date(a.createdAt)
        );
        const fromUrl = searchParams.get("inquiry");
        const pick =
          sorted.find((i) => String(i.id) === String(fromUrl)) || sorted[0] || null;
        setSelectedChatId(pick?.id ?? null);
      } else {
        setSelectedChatId(null);
        setThread(null);
      }
    } catch (e) {
      console.error(e);
      setScenario("NO_LISTINGS");
      setInquiries([]);
    } finally {
      setLoading(false);
    }
  }, [ownerId, user?.role, searchParams]);

  useEffect(() => {
    refresh();
    const fn = () => refresh();
    window.addEventListener(PAVIA_OWNER_ENGAGEMENT_UPDATED, fn);
    return () => window.removeEventListener(PAVIA_OWNER_ENGAGEMENT_UPDATED, fn);
  }, [refresh]);

  useEffect(() => {
    if (!selectedChatId || ownerId == null) {
      setThread(null);
      return;
    }
    fetchInquiryThread(selectedChatId, ownerId)
      .then(setThread)
      .catch(() => setThread(null));
  }, [selectedChatId, ownerId]);

  const conversations = useMemo(
    () =>
      [...inquiries]
        .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
        .map((inq) => ({
          id: inq.id,
          adopterName: inq.adopterName,
          animalName: inq.animalName,
          preview: getInquiryPreviewFromMessages(inq),
          time: formatInquiryDate(inq.createdAt),
          status: inq.status
        })),
    [inquiries]
  );

  const handleSend = async () => {
    const text = draft.trim();
    if (!text || !selectedChatId || ownerId == null) {
      return;
    }
    if (thread?.status === "REJECTED") {
      showPopup({
        type: "warning",
        title: "Thread closed",
        message: "This inquiry was rejected. No further messages can be sent."
      });
      return;
    }
    try {
      await sendInquiryMessage(selectedChatId, {
        userId: ownerId,
        senderRole: "OWNER",
        body: text
      });
      setDraft("");
      const updated = await fetchInquiryThread(selectedChatId, ownerId);
      setThread(updated);
      refresh();
    } catch (e) {
      showPopup({ type: "error", title: "Send failed", message: e.message });
    }
  };

  const handleAccept = async () => {
    if (!selectedChatId || ownerId == null) {
      return;
    }
    setActionBusy(true);
    try {
      await acceptInquiry(selectedChatId, ownerId);
      const updated = await fetchInquiryThread(selectedChatId, ownerId);
      setThread(updated);
      refresh();
      showPopup({
        type: "success",
        title: "Inquiry accepted",
        message: "You can continue messaging in this thread."
      });
    } catch (e) {
      showPopup({ type: "error", title: "Could not accept", message: e.message });
    } finally {
      setActionBusy(false);
    }
  };

  const handleReject = async () => {
    if (!selectedChatId || ownerId == null) {
      return;
    }
    setActionBusy(true);
    try {
      await rejectInquiry(selectedChatId, ownerId);
      const updated = await fetchInquiryThread(selectedChatId, ownerId);
      setThread(updated);
      refresh();
      showPopup({
        type: "info",
        title: "Inquiry rejected",
        message: "The thread is closed. No new messages can be sent."
      });
    } catch (e) {
      showPopup({ type: "error", title: "Could not reject", message: e.message });
    } finally {
      setActionBusy(false);
    }
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
        body="Sign in with an owner or shelter account to use this inbox."
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
        body="Messaging opens after you have at least one listing. When adopters reach out, threads are stored in the database."
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
        body={`Adopters only see animals at ${STRONG_MATCH_THRESHOLD}% compatibility or higher. None of your current listings are in that pool right now.`}
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
        body="When an adopter uses Get in contact on a listing, the conversation is saved here for both sides."
        primaryLabel="Manage requests"
        onPrimary={() => navigate("/owner-requests")}
        secondaryLabel="Owner home"
        onSecondary={() => navigate("/ownerhomepage")}
      />
    );
  }

  const canCompose = thread && thread.status !== "REJECTED";
  const showPendingActions = thread?.status === "PENDING";

  return (
    <div className="owner-messages-page">
      <Navbar />

      <main className="owner-messages-main">
        <section className="owner-messages-hero">
          <div className="owner-messages-hero-left">
            <p className="owner-messages-tag">Owner Messages</p>
            <h1>Connect with adopters</h1>
            <p>
              Conversations are saved in the database for the adoption process. Reply
              when an adopter contacts you about a strong match (≥ {STRONG_MATCH_THRESHOLD}%).
            </p>
          </div>
        </section>

        <section className="owner-messages-layout owner-messages-layout-main">
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
                  <div className="owner-conversation-content">
                    <h3>{c.adopterName}</h3>
                    <p>Regarding {c.animalName}</p>
                    <span className="owner-conversation-preview">{c.preview}</span>
                    <span className="owner-conversation-status-pill">{c.status}</span>
                  </div>
                  <span className="owner-conversation-time">{c.time}</span>
                </button>
              ))}
            </div>
          </div>

          <div className="owner-chat-panel">
            {thread ? (
              <>
                <div className="owner-chat-header">
                  <div>
                    <h2>{thread.adopterName}</h2>
                    <p className="owner-chat-sub">
                      {thread.animalName} · {thread.listingCode}
                    </p>
                  </div>
                  <span className="owner-chat-badge">{thread.status}</span>
                </div>

                {showPendingActions && (
                  <div className="owner-inquiry-decision-btns">
                    <button
                      type="button"
                      className="owner-request-accept-btn"
                      disabled={actionBusy}
                      onClick={handleAccept}
                    >
                      Accept inquiry
                    </button>
                    <button
                      type="button"
                      className="owner-secondary-outline-btn"
                      disabled={actionBusy}
                      onClick={handleReject}
                    >
                      Decline
                    </button>
                  </div>
                )}

                <div className="owner-inquiry-thread">
                  {(thread.messages || []).map((m) => (
                    <div
                      key={m.id}
                      className={`owner-inquiry-msg owner-inquiry-msg-${m.senderRole?.toLowerCase()}`}
                    >
                      <p>{m.body}</p>
                      <time>
                        {m.createdAt ? new Date(m.createdAt).toLocaleString() : ""}
                      </time>
                    </div>
                  ))}
                </div>

                {canCompose ? (
                  <div className="owner-inquiry-compose">
                    <textarea
                      value={draft}
                      onChange={(e) => setDraft(e.target.value)}
                      rows={3}
                      placeholder="Write your message…"
                      maxLength={1000}
                    />
                    <button
                      type="button"
                      className="owner-chat-send-btn"
                      onClick={handleSend}
                    >
                      Send
                    </button>
                  </div>
                ) : (
                  <p className="owner-chat-closed-note">This thread is closed.</p>
                )}
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
