import React, { useEffect, useState } from "react";
import "../pages/OwnerMessagesPage.css";
import OwnerAdoptionProfilePanel from "./OwnerAdoptionProfilePanel";
import OwnerAdopterContactPanel from "./OwnerAdopterContactPanel";
import { usePopup } from "./PopupProvider";
import { STRONG_MATCH_THRESHOLD } from "../utils/ownerJourney";
import {
  acceptInquiry,
  completeAdoptionCase,
  fetchAdoptionCaseByInquiry,
  fetchInquiryThread,
  rejectInquiry,
  reserveAdoptionCase,
  sendInquiryMessage
} from "../utils/platformApi";
import { isInquiryRejected, normalizeInquiryStatus } from "../utils/inquiryStatus";

function OwnerInquiryThreadPanel({ inquiryId, ownerId, onUpdated }) {
  const { showPopup, showConfirm } = usePopup();
  const [thread, setThread] = useState(null);
  const [draft, setDraft] = useState("");
  const [actionBusy, setActionBusy] = useState(false);
  const [adoptionCase, setAdoptionCase] = useState(null);

  useEffect(() => {
    if (!inquiryId || ownerId == null) {
      setThread(null);
      setAdoptionCase(null);
      setDraft("");
      return;
    }
    let cancelled = false;
    Promise.all([
      fetchInquiryThread(inquiryId, ownerId),
      fetchAdoptionCaseByInquiry(inquiryId, ownerId).catch(() => null)
    ])
      .then(([t, c]) => {
        if (!cancelled) {
          setThread(t);
          setAdoptionCase(c);
        }
      })
      .catch(() => {
        if (!cancelled) {
          setThread(null);
          setAdoptionCase(null);
        }
      });
    return () => {
      cancelled = true;
    };
  }, [inquiryId, ownerId]);

  const reloadCase = async () => {
    if (!inquiryId || ownerId == null) {
      return;
    }
    try {
      const c = await fetchAdoptionCaseByInquiry(inquiryId, ownerId);
      setAdoptionCase(c);
    } catch {
      setAdoptionCase(null);
    }
  };

  const refreshThread = async () => {
    if (!inquiryId || ownerId == null) {
      return;
    }
    const updated = await fetchInquiryThread(inquiryId, ownerId);
    setThread(updated);
    onUpdated?.();
    return updated;
  };

  const handleSend = async () => {
    const text = draft.trim();
    if (!text || !inquiryId || ownerId == null) {
      return;
    }
    if (isInquiryRejected(thread?.status)) {
      showPopup({
        type: "warning",
        title: "Thread closed",
        message: "This inquiry was rejected. No further messages can be sent."
      });
      return;
    }
    try {
      await sendInquiryMessage(inquiryId, {
        userId: ownerId,
        senderRole: "OWNER",
        body: text
      });
      setDraft("");
      await refreshThread();
    } catch (e) {
      showPopup({ type: "error", title: "Send failed", message: e.message });
    }
  };

  const handleAccept = async () => {
    if (!inquiryId || ownerId == null) {
      return;
    }
    setActionBusy(true);
    try {
      await acceptInquiry(inquiryId, ownerId);
      await refreshThread();
      await reloadCase();
      showPopup({
        type: "success",
        title: "Message request approved",
        message: "You can continue the conversation with this adopter."
      });
    } catch (e) {
      showPopup({ type: "error", title: "Could not approve", message: e.message });
    } finally {
      setActionBusy(false);
    }
  };

  const handleReject = async () => {
    if (!inquiryId || ownerId == null) {
      return;
    }
    const ok = await showConfirm({
      type: "warning",
      title: "Decline message request?",
      message:
        "The adopter will not be able to send more messages for this listing.",
      confirmLabel: "Yes, decline",
      cancelLabel: "Cancel",
      confirmDanger: true
    });
    if (!ok) {
      return;
    }
    setActionBusy(true);
    try {
      await rejectInquiry(inquiryId, ownerId);
      await refreshThread();
      showPopup({
        type: "info",
        title: "Message request declined",
        message: "This thread is closed."
      });
    } catch (e) {
      showPopup({ type: "error", title: "Could not decline", message: e.message });
    } finally {
      setActionBusy(false);
    }
  };

  const handleReserve = async () => {
    const caseId = adoptionCase?.id || thread?.adoptionCaseId;
    if (!caseId || ownerId == null) {
      return;
    }
    setActionBusy(true);
    try {
      await reserveAdoptionCase(caseId, ownerId);
      await reloadCase();
      onUpdated?.();
      showPopup({
        type: "success",
        title: "Listing reserved",
        message: "This animal is reserved for the adopter."
      });
    } catch (e) {
      showPopup({ type: "error", title: "Reserve failed", message: e.message });
    } finally {
      setActionBusy(false);
    }
  };

  const handleCompleteAdoption = async () => {
    const caseId = adoptionCase?.id || thread?.adoptionCaseId;
    if (!caseId || ownerId == null) {
      return;
    }
    const ok = await showConfirm({
      type: "warning",
      title: "Mark adoption as completed?",
      message:
        "The listing will be closed and marked as adopted. You cannot undo this step.",
      confirmLabel: "Yes, complete",
      cancelLabel: "Cancel"
    });
    if (!ok) {
      return;
    }
    setActionBusy(true);
    try {
      await completeAdoptionCase(caseId, ownerId);
      await reloadCase();
      await refreshThread();
      showPopup({
        type: "success",
        title: "Adoption completed",
        message: "The listing is marked as adopted."
      });
    } catch (e) {
      showPopup({ type: "error", title: "Could not complete", message: e.message });
    } finally {
      setActionBusy(false);
    }
  };

  if (!inquiryId) {
    return (
      <p className="owner-chat-empty-select">
        Select a message request to read the adopter&apos;s note, review their profile, and reply.
      </p>
    );
  }

  if (!thread) {
    return <p className="owner-chat-empty-select">Loading conversation…</p>;
  }

  const threadStatus = normalizeInquiryStatus(thread.status);
  const showPendingActions = threadStatus === "PENDING";
  const canCompose =
    !isInquiryRejected(thread.status) &&
    (threadStatus === "PENDING" || threadStatus === "ACCEPTED");
  const caseStatus = adoptionCase?.status;
  const adoptionComplete = caseStatus === "COMPLETED";
  const canComplete =
    !adoptionComplete &&
    adoptionCase &&
    (caseStatus === "ACCEPTED" || caseStatus === "RESERVED") &&
    thread.status === "ACCEPTED";
  const canReserve =
    !adoptionComplete &&
    adoptionCase &&
    (caseStatus === "ACCEPTED" || caseStatus === "PROPOSED") &&
    thread.status === "ACCEPTED";

  return (
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

      {thread.initialMessage && (
        <div className="owner-chat-get-contact-banner">
          <strong>Adopter message request</strong>
          <p>{thread.initialMessage}</p>
        </div>
      )}

      {adoptionComplete && (
        <p className="owner-inquiry-match-pill owner-adoption-complete-note">
          Adoption completed — this listing is hidden from matching. You can still view the
          adopter profile and send messages in this thread.
        </p>
      )}

      <OwnerAdopterContactPanel
        adopterUserId={thread.adopterUserId}
        adopterName={thread.adopterName}
      />

      <OwnerAdoptionProfilePanel
        inquiryId={inquiryId}
        ownerId={ownerId}
        adopterName={thread.adopterName}
      />

      {thread.matchPercentageAtContact != null && (
        <p className="owner-inquiry-match-pill">
          Strong match at contact: {Math.round(thread.matchPercentageAtContact)}% (≥{" "}
          {STRONG_MATCH_THRESHOLD}%)
        </p>
      )}

      {showPendingActions && (
        <div className="owner-inquiry-decision-block">
          <p className="owner-inquiry-decision-hint">
            Review the adoption profile above, reply below if you wish, then approve or decline
            the message request.
          </p>
          <div className="owner-inquiry-decision-btns">
            <button
              type="button"
              className="owner-request-accept-btn"
              disabled={actionBusy}
              onClick={handleAccept}
            >
              Approve message request
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
        </div>
      )}

      {(canReserve || canComplete) && (
        <div className="owner-inquiry-lifecycle-btns">
          {canReserve && (
            <button
              type="button"
              className="owner-secondary-outline-btn"
              disabled={actionBusy}
              onClick={handleReserve}
            >
              Reserve for adopter
            </button>
          )}
          {canComplete && (
            <button
              type="button"
              className="owner-request-accept-btn"
              disabled={actionBusy}
              onClick={handleCompleteAdoption}
            >
              Mark adoption complete
            </button>
          )}
          {adoptionCase?.status && (
            <span className="owner-adoption-case-status">Case: {adoptionCase.status}</span>
          )}
        </div>
      )}

      <div className="owner-inquiry-thread">
        {(thread.messages || []).map((m) => (
          <div
            key={m.id}
            className={`owner-inquiry-msg owner-inquiry-msg-${m.senderRole?.toLowerCase()}`}
          >
            <p>{m.body}</p>
            <time>{m.createdAt ? new Date(m.createdAt).toLocaleString() : ""}</time>
          </div>
        ))}
      </div>

      {canCompose ? (
        <div className="owner-inquiry-compose">
          <textarea
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            rows={3}
            placeholder="Write your reply to the adopter…"
            maxLength={1000}
          />
          <button type="button" className="owner-chat-send-btn" onClick={handleSend}>
            Send reply
          </button>
        </div>
      ) : (
        <p className="owner-chat-closed-note">This thread is closed.</p>
      )}
    </>
  );
}

export default OwnerInquiryThreadPanel;
