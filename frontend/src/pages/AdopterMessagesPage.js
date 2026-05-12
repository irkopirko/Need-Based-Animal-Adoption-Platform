import React, { useCallback, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import "./AdopterMessagesPage.css";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import { getStoredUser, normalizeRole, getResolvedUserId } from "../utils/auth";
import {
  loadAdopterJourneyState,
  STRONG_MATCH_THRESHOLD
} from "../utils/adopterJourney";

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
  const [loading, setLoading] = useState(true);
  const [scenario, setScenario] = useState("LOADING");
  const [conversations] = useState([]);

  const refresh = useCallback(async () => {
    const user = getStoredUser();
    const role = normalizeRole(user?.role);
    const uid = getResolvedUserId(user);
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
        setScenario("READY");
      } else {
        setScenario("NO_REQUEST");
      }
    } catch (e) {
      console.error(e);
      setScenario("NO_REQUEST");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

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
      "Messaging opens along the adoption path once your profile and request are in motion.",
      <GatePanel
        badge="Step 1"
        title="No adoption request yet"
        body={`We unlock owner messaging once you have submitted an adoption request and the platform finds animals for you with a compatibility score of ${STRONG_MATCH_THRESHOLD}% or higher (≥ ${STRONG_MATCH_THRESHOLD}%, inclusive).`}
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
        body="You have a draft on file. After you submit it, we can show compatible animals and then real conversations with owners when you reach out."
        primaryLabel="Continue adoption request"
        onPrimary={() => navigate("/adoption-request")}
      />
    );
  }

  if (scenario === "SUBMITTED_NO_MATCHES") {
    return shell(
      "Waiting for a strong match",
      `Animals need a compatibility score of at least ${STRONG_MATCH_THRESHOLD}% (inclusive) before messaging is relevant.`,
      <GatePanel
        badge={`No ≥${STRONG_MATCH_THRESHOLD}% matches`}
        title="No compatible animals at the threshold yet"
        body={`Your request is submitted, but there are currently no animals with a compatibility score of ${STRONG_MATCH_THRESHOLD}% or higher (inclusive). When strong matches appear, you can start inquiries and your threads will show here.`}
        primaryLabel="View compatible animals"
        onPrimary={() => navigate("/compatible-animals")}
      />
    );
  }

  if (scenario === "READY" && conversations.length === 0) {
    return shell(
      "Your conversations",
      "You have strong matches — say hello when you are ready.",
      <GatePanel
        badge="No messages yet"
        title="No conversations in your inbox"
        body={`You have animals with compatibility scores of ${STRONG_MATCH_THRESHOLD}% or higher. When you send an adoption inquiry and an owner replies, the thread will appear on this page.`}
        primaryLabel="Browse compatible animals"
        onPrimary={() => navigate("/compatible-animals")}
      />
    );
  }

  return (
    <div className="adopter-messages-page">
      <Navbar />
      <main className="messages-active-main">
        <h1 className="messages-title">Your Conversations</h1>
        <div className="messages-container">
          {conversations.map((conversation) => (
            <div key={conversation.id} className="conversation-card">
              <div
                className="conversation-avatar-placeholder"
                aria-hidden="true"
                title={conversation.animalName}
              />
              <div className="conversation-content">
                <h3>{conversation.ownerName}</h3>
                <p>Regarding {conversation.animalName}</p>
                <span className="conversation-preview">{conversation.preview}</span>
              </div>
              <span className="conversation-time">{conversation.time}</span>
            </div>
          ))}
        </div>
      </main>
      <Footer />
    </div>
  );
}

export default AdopterMessagesPage;
