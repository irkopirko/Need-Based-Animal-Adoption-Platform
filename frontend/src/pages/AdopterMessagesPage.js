import React, { useCallback, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import "./AdopterMessagesPage.css";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import { getResolvedUserId, getStoredUser, normalizeRole } from "../utils/auth";
import {
  fetchAdopterInquiries,
  fetchInquiryThread,
  sendInquiryMessage
} from "../utils/platformApi";
import {
  adopterComposeBlockedReason,
  canAdopterComposeInThread,
  isInquiryRejected,
  normalizeInquiryStatus
} from "../utils/inquiryStatus";
import { usePopup } from "../components/PopupProvider";
import { updateNavbarStateForUser } from "../utils/navbarState";
import {
  countUnreadThreads,
  hasUnreadInThread,
  markThreadRead
} from "../utils/messageReadState";

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
  const [inquiriesLoading, setInquiriesLoading] = useState(false);
  const [scenario, setScenario] = useState("LOADING");
  const [inquiries, setInquiries] = useState([]);
  const [selectedId, setSelectedId] = useState(null);
  const [thread, setThread] = useState(null);
  const [threadLoading, setThreadLoading] = useState(false);
  const [draft, setDraft] = useState("");

  const user = getStoredUser();
  const uid = getResolvedUserId(user);
  const inquiriesCacheKey = uid != null ? `paviaAdopterInquiries:${uid}` : null;

  const applyInquiryList = useCallback(
    (arr) => {
      const next = Array.isArray(arr) ? arr : [];
      setInquiries(next);
      updateNavbarStateForUser(uid, {
        adopterUnreadMessages: countUnreadThreads("ADOPTER", uid, next)
      });
      if (next.length === 0) {
        setScenario("READY_EMPTY");
        setSelectedId(null);
        setThread(null);
        return;
      }
      setScenario("READY");
      setSelectedId((prev) => {
        if (prev != null && next.some((i) => Number(i.id) === Number(prev))) {
          return prev;
        }
        return next[0].id;
      });
    },
    [uid]
  );

  const refresh = useCallback(async () => {
    const role = normalizeRole(user?.role);
    if (uid == null || role !== "ADOPTER") {
      setScenario("NOT_ADOPTER");
      setInquiriesLoading(false);
      setLoading(false);
      return;
    }
    let cached = [];
    if (inquiriesCacheKey && typeof window !== "undefined") {
      try {
        const raw = sessionStorage.getItem(inquiriesCacheKey);
        if (raw) {
          const parsed = JSON.parse(raw);
          if (Array.isArray(parsed?.data)) {
            cached = parsed.data;
          }
        }
      } catch {
        cached = [];
      }
    }
    if (cached.length > 0) {
      applyInquiryList(cached);
      setLoading(false);
    }
    setInquiriesLoading(true);
    try {
      let list = null;
      if (inquiriesCacheKey && typeof window !== "undefined") {
        try {
          const raw = sessionStorage.getItem(inquiriesCacheKey);
          if (raw) {
            const parsed = JSON.parse(raw);
            if (
              parsed?.at &&
              Date.now() - parsed.at < 30_000 &&
              Array.isArray(parsed.data) &&
              parsed.data.length > 0
            ) {
              list = parsed.data;
            }
          }
        } catch {
          // ignore malformed cache
        }
      }
      if (!Array.isArray(list)) {
        list = await fetchAdopterInquiries(uid);
        if (inquiriesCacheKey && typeof window !== "undefined") {
          try {
            sessionStorage.setItem(
              inquiriesCacheKey,
              JSON.stringify({ at: Date.now(), data: Array.isArray(list) ? list : [] })
            );
          } catch {
            // ignore cache write issues
          }
        }
      }
      let arr = Array.isArray(list) ? list : [];
      if (arr.length === 0 && cached.length > 0) {
        arr = cached;
      }
      applyInquiryList(arr);
    } catch (e) {
      console.error(e);
      if (cached.length > 0) {
        applyInquiryList(cached);
      } else {
        setScenario("READY_EMPTY");
      }
      showPopup({
        type: "warning",
        title: "Messages unavailable",
        message: "Could not refresh conversations right now. Showing latest available state."
      });
    } finally {
      setInquiriesLoading(false);
      setLoading(false);
    }
  }, [uid, user?.role, inquiriesCacheKey, applyInquiryList, showPopup]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  useEffect(() => {
    if (!selectedId || uid == null || scenario !== "READY") {
      setThread(null);
      setThreadLoading(false);
      return;
    }
    const threadCacheKey = `paviaInquiryThread:${uid}:${selectedId}`;
    if (typeof window !== "undefined") {
      try {
        const raw = sessionStorage.getItem(threadCacheKey);
        if (raw) {
          const parsed = JSON.parse(raw);
          if (parsed?.at && Date.now() - parsed.at < 60_000 && parsed?.data) {
            setThread(parsed.data);
          }
        }
      } catch {
        // ignore malformed cache
      }
    }
    setThreadLoading(true);
    fetchInquiryThread(selectedId, uid)
      .then((data) => {
        setThread(data);
        if (typeof window !== "undefined") {
          try {
            sessionStorage.setItem(threadCacheKey, JSON.stringify({ at: Date.now(), data }));
          } catch {
            // ignore cache write issues
          }
        }
      })
      .catch(() => setThread(null))
      .finally(() => setThreadLoading(false));
  }, [selectedId, uid, scenario]);

  useEffect(() => {
    if (uid == null) {
      return;
    }
    const unread = countUnreadThreads("ADOPTER", uid, inquiries.filter((inq) => inq.id !== selectedId));
    updateNavbarStateForUser(uid, { adopterUnreadMessages: unread });
  }, [uid, inquiries, selectedId]);

  useEffect(() => {
    if (uid == null || selectedId == null) {
      return;
    }
    const selected = inquiries.find((inq) => Number(inq.id) === Number(selectedId));
    if (!selected) {
      return;
    }
    markThreadRead("ADOPTER", uid, selected.id, selected.updatedAt);
    const unread = countUnreadThreads(
      "ADOPTER",
      uid,
      inquiries.filter((inq) => Number(inq.id) !== Number(selectedId))
    );
    updateNavbarStateForUser(uid, { adopterUnreadMessages: unread });
  }, [uid, selectedId, inquiries]);

  const handleSend = async () => {
    const text = draft.trim();
    if (!text || !selectedId) {
      return;
    }
    const blocked = adopterComposeBlockedReason(thread);
    if (blocked) {
      showPopup({ type: "warning", title: "Cannot send", message: blocked });
      return;
    }
    if (!canAdopterComposeInThread(thread)) {
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
      if (typeof window !== "undefined") {
        try {
          sessionStorage.setItem(
            `paviaInquiryThread:${uid}:${selectedId}`,
            JSON.stringify({ at: Date.now(), data: updated })
          );
        } catch {
          // ignore cache write issues
        }
      }
      if (inquiriesCacheKey && typeof window !== "undefined") {
        try {
          sessionStorage.removeItem(inquiriesCacheKey);
        } catch {
          // ignore
        }
      }
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
            {inquiriesLoading && inquiries.length === 0 ? (
              <p className="messages-loading-msg">Loading conversations…</p>
            ) : null}
            {inquiries.map((inq) => {
              const unread = hasUnreadInThread("ADOPTER", uid, inq);
              return (
              <button
                key={inq.id}
                type="button"
                className={`adopter-inquiry-item ${inq.id === selectedId ? "is-selected" : ""}`}
                onClick={() => setSelectedId(inq.id)}
              >
                <span className="adopter-inquiry-item-top">
                  <strong>{inq.animalName}</strong>
                  {unread && inq.id !== selectedId ? (
                    <span className="adopter-inquiry-unread-dot" aria-label="Unread messages" />
                  ) : null}
                </span>
                <span
                  className={
                    isInquiryRejected(inq.status) ? "adopter-inquiry-item-status-rejected" : ""
                  }
                >
                  {normalizeInquiryStatus(inq.status) === "REJECTED"
                    ? "Declined"
                    : inq.status}
                </span>
              </button>
              );
            })}
          </aside>
          {(threadLoading || thread) && (
            <section className="adopter-inquiry-thread-panel">
              {threadLoading || !thread ? (
                <p className="messages-loading-msg">Loading conversation…</p>
              ) : (
                <>
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
                  {canAdopterComposeInThread(thread) ? (
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
                      {normalizeInquiryStatus(thread.status) === "PENDING" && (
                        <p className="adopter-inquiry-hint">
                          Your message request is with the owner. They can read your adoption
                          profile and approve before you can send more messages here.
                        </p>
                      )}
                    </div>
                  ) : (
                    <p className="adopter-inquiry-wait" role="status">
                      {adopterComposeBlockedReason(thread)}
                    </p>
                  )}
                </>
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
