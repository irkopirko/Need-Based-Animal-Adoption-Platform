import React, { useCallback, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import "./AdminHomePage.css";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import { usePopup } from "../components/PopupProvider";
import { getStoredUser, isAdminEmail, normalizeRole } from "../utils/auth";
import {
  adminArchiveListing,
  adminDeleteListing,
  fetchPendingReports,
  resolveReport
} from "../utils/platformApi";

function AdminHomePage() {
  const navigate = useNavigate();
  const { showPopup, showConfirm } = usePopup();
  const user = getStoredUser();
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionReason, setActionReason] = useState({});

  const load = useCallback(async () => {
    if (!user?.email || normalizeRole(user.role) !== "ADMIN" || !isAdminEmail(user.email)) {
      navigate("/login", { replace: true });
      return;
    }
    setLoading(true);
    try {
      const data = await fetchPendingReports(user.email);
      setReports(Array.isArray(data) ? data : []);
    } catch (e) {
      showPopup({
        type: "error",
        title: "Load failed",
        message: e.message || "Could not load reports."
      });
      setReports([]);
    } finally {
      setLoading(false);
    }
  }, [navigate, showPopup, user?.email, user?.role]);

  useEffect(() => {
    load();
  }, [load]);

  const getReason = (animalId) => actionReason[animalId] || "Reviewed by platform administrator.";

  const handleArchive = async (report) => {
    try {
      await adminArchiveListing(report.animalId, user.email, getReason(report.animalId));
      await resolveReport(report.id, user.email);
      showPopup({
        type: "success",
        title: "Listing archived",
        message: `Listing ${report.listingCode || report.animalId} archived. Owner notified by email.`
      });
      load();
    } catch (e) {
      showPopup({ type: "error", title: "Failed", message: e.message });
    }
  };

  const handleDelete = async (report) => {
    const code = report.listingCode || report.animalId;
    const ok = await showConfirm({
      type: "critical",
      title: "Delete this listing?",
      message: `Permanently delete listing ${code}? The owner will be notified by email.`,
      confirmLabel: "Yes, delete",
      cancelLabel: "Cancel",
      confirmDanger: true
    });
    if (!ok) {
      return;
    }
    try {
      await adminDeleteListing(report.animalId, user.email, getReason(report.animalId));
      showPopup({
        type: "success",
        title: "Listing deleted",
        message: "Owner has been notified by email."
      });
      load();
    } catch (e) {
      showPopup({ type: "error", title: "Failed", message: e.message });
    }
  };

  const handleDismiss = async (reportId) => {
    try {
      await resolveReport(reportId, user.email);
      showPopup({ type: "info", title: "Dismissed", message: "Report marked resolved." });
      load();
    } catch (e) {
      showPopup({ type: "error", title: "Failed", message: e.message });
    }
  };

  return (
    <div className="admin-home-page">
      <Navbar />
      <main className="admin-home-main">
        <header className="admin-home-hero">
          <p className="admin-home-tag">Admin</p>
          <h1>Listing moderation</h1>
          <p>Review reports from adopters. Archive or delete listings when needed.</p>
        </header>

        {loading ? (
          <p>Loading reports…</p>
        ) : reports.length === 0 ? (
          <section className="admin-empty-card">
            <h2>No pending reports</h2>
            <p>Reported listings will appear here for review.</p>
          </section>
        ) : (
          <div className="admin-report-list">
            {reports.map((r) => (
              <article key={r.id} className="admin-report-card">
                <div className="admin-report-head">
                  <h3>{r.animalName || "Listing"}</h3>
                  <span className="admin-listing-code">{r.listingCode}</span>
                </div>
                <div className="admin-report-body">
                  <p className="admin-report-title-line">
                    <strong>Title:</strong> {r.title || "—"}
                  </p>
                  <p className="admin-report-description">
                    <strong>Description:</strong> {r.description || "—"}
                  </p>
                </div>
                <p className="admin-report-meta">
                  Reporter: {r.reporterEmail || r.reporterUserId} · Listing ID: {r.animalId}
                  {r.createdAt
                    ? ` · ${new Date(r.createdAt).toLocaleString()}`
                    : ""}
                </p>
                <label className="admin-reason-input">
                  Owner email reason
                  <input
                    type="text"
                    value={actionReason[r.animalId] || ""}
                    onChange={(e) =>
                      setActionReason((prev) => ({
                        ...prev,
                        [r.animalId]: e.target.value
                      }))
                    }
                    placeholder="Why this listing is archived/deleted"
                  />
                </label>
                <div className="admin-report-actions">
                  <button
                    type="button"
                    className="admin-btn-view"
                    onClick={() => navigate(`/animal/${r.animalId}?from=admin`)}
                  >
                    View listing details
                  </button>
                  <button type="button" className="admin-btn-archive" onClick={() => handleArchive(r)}>
                    Archive listing
                  </button>
                  <button type="button" className="admin-btn-delete" onClick={() => handleDelete(r)}>
                    Delete listing
                  </button>
                  <button type="button" className="admin-btn-dismiss" onClick={() => handleDismiss(r.id)}>
                    Dismiss report
                  </button>
                </div>
              </article>
            ))}
          </div>
        )}
      </main>
      <Footer />
    </div>
  );
}

export default AdminHomePage;
