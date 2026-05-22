import React, { useState } from "react";
import "./ContactOwnerModal.css";
import { createListingInquiry } from "../utils/platformApi";
import { usePopup } from "./PopupProvider";

function ContactOwnerModal({ open, onClose, animal, adopterUserId }) {
  const { showPopup } = usePopup();
  const [message, setMessage] = useState("");
  const [submitting, setSubmitting] = useState(false);

  if (!open) {
    return null;
  }

  const handleSubmit = async (e) => {
    e.preventDefault();
    const text = message.trim();
    if (!text) {
      showPopup({
        type: "warning",
        title: "Message required",
        message: "Please write a short message to the owner."
      });
      return;
    }
    setSubmitting(true);
    try {
      await createListingInquiry({
        adopterUserId,
        animalId: animal.id,
        message: text
      });
      showPopup({
        type: "success",
        title: "Messaging request sent",
        message:
          "Your message request was sent. The owner can review your adoption profile and reply before approving the conversation."
      });
      setMessage("");
      onClose(true);
    } catch (err) {
      showPopup({
        type: "error",
        title: "Could not send",
        message: err.message || "Try again later."
      });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="contact-modal-backdrop" role="presentation" onClick={() => onClose(false)}>
      <div
        className="contact-modal-card"
        role="dialog"
        aria-modal="true"
        onClick={(e) => e.stopPropagation()}
      >
        <h2>Message owner</h2>
        <p className="contact-modal-lead">
          About <strong>{animal?.name}</strong>. The owner receives a message request and can
          read your submitted adoption profile before approving the conversation.
        </p>
        <form onSubmit={handleSubmit}>
          <label className="contact-modal-label">
            Your message
            <textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              rows={4}
              maxLength={1000}
              placeholder="Introduce yourself and why you are interested…"
              required
            />
          </label>
          <div className="contact-modal-actions">
            <button type="button" className="contact-modal-secondary" onClick={() => onClose(false)}>
              Cancel
            </button>
            <button type="submit" className="contact-modal-primary" disabled={submitting}>
              {submitting ? "Sending…" : "Send message"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default ContactOwnerModal;
