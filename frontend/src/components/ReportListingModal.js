import React, { useState } from "react";
import "./ReportListingModal.css";
import { REPORT_REASONS, submitListingReport } from "../utils/platformApi";
import { usePopup } from "./PopupProvider";

function ReportListingModal({ open, onClose, animalId, reporterUserId }) {
  const { showPopup } = usePopup();
  const [reason, setReason] = useState(REPORT_REASONS[0].value);
  const [note, setNote] = useState("");
  const [submitting, setSubmitting] = useState(false);

  if (!open) {
    return null;
  }

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!reporterUserId || !animalId) {
      showPopup({
        type: "error",
        title: "Cannot report",
        message: "Sign in as an adopter to report a listing."
      });
      return;
    }
    setSubmitting(true);
    try {
      await submitListingReport({
        reporterUserId,
        animalId,
        reason,
        note: note.trim()
      });
      showPopup({
        type: "success",
        title: "Report submitted",
        message: "Thank you. Our team will review this listing."
      });
      setNote("");
      onClose();
    } catch (err) {
      showPopup({
        type: "error",
        title: "Report failed",
        message: err.message || "Could not submit report."
      });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="report-modal-backdrop" role="presentation" onClick={onClose}>
      <div
        className="report-modal-card"
        role="dialog"
        aria-modal="true"
        aria-labelledby="report-modal-title"
        onClick={(e) => e.stopPropagation()}
      >
        <h2 id="report-modal-title">Report listing</h2>
        <p className="report-modal-lead">
          Tell us why this listing should be reviewed. Add a short note if helpful.
        </p>
        <form onSubmit={handleSubmit}>
          <label className="report-modal-label">
            Reason
            <select value={reason} onChange={(e) => setReason(e.target.value)} required>
              {REPORT_REASONS.map((r) => (
                <option key={r.value} value={r.value}>
                  {r.label}
                </option>
              ))}
            </select>
          </label>
          <label className="report-modal-label">
            Short explanation
            <textarea
              value={note}
              onChange={(e) => setNote(e.target.value)}
              maxLength={280}
              rows={3}
              placeholder="Optional details (max 280 characters)"
            />
          </label>
          <div className="report-modal-actions">
            <button type="button" className="report-modal-secondary" onClick={onClose}>
              Cancel
            </button>
            <button type="submit" className="report-modal-primary" disabled={submitting}>
              {submitting ? "Submitting…" : "Submit report"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default ReportListingModal;
