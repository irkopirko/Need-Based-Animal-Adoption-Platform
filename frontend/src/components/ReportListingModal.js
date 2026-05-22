import React, { useState } from "react";
import "./ReportListingModal.css";
import { submitListingReport } from "../utils/platformApi";
import { usePopup } from "./PopupProvider";

function ReportListingModal({ open, onClose, animalId, reporterUserId }) {
  const { showPopup } = usePopup();
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
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
    const trimmedTitle = title.trim();
    const trimmedDescription = description.trim();
    if (trimmedTitle.length < 3) {
      showPopup({
        type: "warning",
        title: "Title required",
        message: "Enter a short title (at least 3 characters)."
      });
      return;
    }
    if (trimmedDescription.length < 10) {
      showPopup({
        type: "warning",
        title: "Description required",
        message: "Describe the issue in at least 10 characters."
      });
      return;
    }
    setSubmitting(true);
    try {
      await submitListingReport({
        reporterUserId,
        animalId,
        title: trimmedTitle,
        description: trimmedDescription
      });
      showPopup({
        type: "success",
        title: "Report submitted",
        message: "Thank you. An administrator will review your report."
      });
      setTitle("");
      setDescription("");
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
          Provide a clear title and description. Administrators see both when reviewing this
          listing.
        </p>
        <form onSubmit={handleSubmit}>
          <label className="report-modal-label">
            Report title
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              maxLength={120}
              placeholder="e.g. Misleading photos or incorrect breed"
              required
            />
          </label>
          <label className="report-modal-label">
            Description
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              maxLength={1000}
              rows={5}
              placeholder="Explain what is wrong with this listing and why it should be reviewed…"
              required
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
