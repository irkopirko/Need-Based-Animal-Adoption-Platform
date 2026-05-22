import React, { useCallback, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import "./AdopterMessagesPage.css";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import { getResolvedUserId, getStoredUser, normalizeRole } from "../utils/auth";
import {
  loadAdopterJourneyState,
  STRONG_MATCH_THRESHOLD
} from "../utils/adopterJourney";
import {
  fetchAdopterInquiries,
  fetchInquiryThread,
  sendInquiryMessage
} from "../utils/platformApi";
import { usePopup } from "../components/PopupProvider";

function GatePanel({ badge, title, body, primaryLabel, onPrimary }) {
  return (
    <div className="messages-gate-wrap">
      <div className="messages-locked-card messages-locked-card-wide">
        <span className="messages-locked-badge">{badge}</span>
        <h1>{title}</h1>
        <p>{body}</p>
        <button type="button" className="messages-primary-btn" onClick={onPrimary}>
          {primaryLabel}
        </button>
      </div>
    </div>
  );
}

function AdopterMessagesPage() {
  const navigate = useNavigate();
  const { showPopup } = usePopup();
  const [loading, setLoading] = useState(true);
  const [scenario, setScenario] = useState("LOADING");
  const [inquiries, setInquiries] = useState([]);
  const [selectedId, setSelectedId] = useState(null);
  const [thread, setThread] = useState(null);
  const [draft, setDraft] = useState("");

  const user = getStoredUser();
  const uid = getResolvedUserId(user);

  const refresh = useCallback(async () => {
    const role = normalizeRole(user?.role);
    if (uid == null || role !== "ADOPTER") {
      setScenario("NOT_ADOPTER");
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      const state = await loadAdopterJourneyState(uid);
      if (state.noRequest) {
        setScenario("NO_REQUEST");
      } else if (state.draftOnly) {
        setScenario("DRAFT_ONLY");
      } else if (state.submitted && state.strongMatches.length === 0) {
        setScenario("SUBMITTED_NO_MATCHES");
      } else if (state.submitted && state.strongMatches.length > 0) {
        const list = await fetchAdopterInquiries(uid);
        const arr = Array.isArray(list) ? list : [];
        setInquiries(arr);
        if (arr.length === 0) {
          setScenario("READY_EMPTY");
        } else {
          setScenario("READY");
          setSelectedId(arr[0].id);
        }
      } else {
        setScenario("NO_REQUEST");
      }
    } catch (e) {
      console.error(e);
      setScenario("NO_REQUEST");
    } finally {
      setLoading(false);
    }
  }, [uid, user?.role]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  useEffect(() => {
    if (!selectedId || uid == null || scenario !== "READY") {
      setThread(null);
      return;
    }
    fetchInquiryThread(selectedId, uid)
      .then(setThread)
      .catch(() => setThread(null));
  }, [selectedId, uid, scenario]);

  const handleSend = async () => {
    const text = draft.trim();
    if (!text || !selectedId) {
      return;
    }
    try {
      await sendInquiryMessage(selectedId, {
        userId: uid,
        senderRole: "ADOPTER",
        body: text
      });
      setDraft("");
      const updated = await fetchInquiryThread(selectedId, uid);
      setThread(updated);
      refresh();
    } catch (e) {
      showPopup({ type: "error", title: "Send failed", message: e.message });
    }
  };

  if (loading) {
    return (
      <div className="adopter-messages-page">
        <Navbar />
        <main className="messages-page-shell">
          <p className="messages-loading-msg">Loading…</p>
        </main>
        <Footer />
      </div>
    );
  }

  if (scenario === "NOT_ADOPTER") {
    return (
      <div className="adopter-messages-page">
        <Navbar />
        <main className="messages-page-shell">
          <GatePanel
            badge="Adopters only"
            title="Messages are for adopters"
            body="Sign in with an adopter account to see your messaging journey."
            primaryLabel="Sign in"
            onPrimary={() => navigate("/login")}
          />
        </main>
        <Footer />
      </div>
    );
  }

  const shell = (heroTitle, heroSubtitle, inner) => (
    <div className="adopter-messages-page">
      <Navbar />
      <main className="messages-page-shell">
        <section className="messages-page-hero">
          <p className="messages-page-hero-tag">Messages</p>
          <h1 className="messages-page-hero-title">{heroTitle}</h1>
          <p className="messages-page-hero-sub">{heroSubtitle}</p>
        </section>
        {inner}
      </main>
      <Footer />
    </div>
  );

  if (scenario === "NO_REQUEST") {
    return shell(
      "Start with your adoption request",
      "Messaging opens once your request is submitted and strong matches exist.",
      <GatePanel
        badge="Step 1"
        title="No adoption request yet"
        body={`Submit an adoption request first. Owner messaging unlocks for listings at ≥ ${STRONG_MATCH_THRESHOLD}% compatibility.`}
        primaryLabel="Create adoption request"
        onPrimary={() => navigate("/adoption-request")}
      />
    );
  }

  if (scenario === "DRAFT_ONLY") {
    return shell(
      "Almost there",
      "Submit your draft so we can run the match engine.",
      <GatePanel
        badge="Draft saved"
        title="Submit your adoption request"
        body="After submission, contact owners from compatible animal profiles."
        primaryLabel="Continue adoption request"
        onPrimary={() => navigate("/adoption-request")}
      />
    );
  }

  if (scenario === "SUBMITTED_NO_MATCHES") {
    return shell(
      "Waiting for a strong match",
      `Animals need ≥ ${STRONG_MATCH_THRESHOLD}% compatibility.`,
      <GatePanel
        badge={`No ≥${STRONG_MATCH_THRESHOLD}% matches`}
        title="No compatible animals at the threshold yet"
        body="When strong matches appear, use Contact owner on a listing profile."
        primaryLabel="View compatible animals"
        onPrimary={() => navigate("/compatible-animals")}
      />
    );
  }

  if (scenario === "READY_EMPTY") {
    return shell(
      "Your conversations",
      "Message history is kept for every inquiry you send.",
      <GatePanel
        badge="No messages yet"
        title="No conversations in your inbox"
        body="Open a compatible animal profile and use Contact owner to start a thread."
        primaryLabel="Browse compatible animals"
        onPrimary={() => navigate("/compatible-animals")}
      />
    );
  }

  return (
    <div className="adopter-messages-page">
      <Navbar />
      <main className="messages-active-main adopter-inquiry-main">
        <h1 className="messages-title">Your conversations</h1>
        <div className="adopter-inquiry-layout">
          <aside className="adopter-inquiry-list">
            {inquiries.map((inq) => (
              <button
                key={inq.id}
                type="button"
                className={`adopter-inquiry-item ${inq.id === selectedId ? "is-selected" : ""}`}
                onClick={() => setSelectedId(inq.id)}
              >
                <strong>{inq.animalName}</strong>
                <span>{inq.status}</span>
              </button>
            ))}
          </aside>
          {thread && (
            <section className="adopter-inquiry-thread-panel">
              <h2>
                {thread.animalName} · {thread.listingCode}
              </h2>
              <p className="adopter-inquiry-status">Status: {thread.status}</p>
              <div className="adopter-inquiry-messages">
                {(thread.messages || []).map((m) => (
                  <div
                    key={m.id}
                    className={`adopter-inquiry-msg adopter-inquiry-msg-${m.senderRole?.toLowerCase()}`}
                  >
                    <p>{m.body}</p>
                    <time>{m.createdAt ? new Date(m.createdAt).toLocaleString() : ""}</time>
                  </div>
                ))}
              </div>
              {thread.status === "REJECTED" ? (
                <p className="adopter-inquiry-wait">
                  This inquiry was declined. The conversation is closed.
                </p>
              ) : (
                <div className="adopter-inquiry-compose">
                  <textarea
                    value={draft}
                    onChange={(e) => setDraft(e.target.value)}
                    rows={3}
                    placeholder="Type a message…"
                    maxLength={1000}
                  />
                  <button type="button" className="messages-primary-btn" onClick={handleSend}>
                    Send
                  </button>
                  {thread.status === "PENDING" && (
                    <p className="adopter-inquiry-hint">
                      Your messages are saved. The owner can accept to continue the adoption
                      process.
                    </p>
                  )}
                </div>
              )}
            </section>
          )}
        </div>
      </main>
      <Footer />
    </div>
  );
}

export default AdopterMessagesPage;
