import React, { useCallback, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import { getStoredUser, normalizeRole, getResolvedUserId } from "../utils/auth";
import {
  fetchUserAdoptionRequests,
  formatAdoptionRequestSummary
} from "../utils/adopterJourney";
import "./AdopterMyRequestsPage.css";

function formatPhase(phase) {
  const p = String(phase || "").toUpperCase();
  if (p === "SUBMITTED") {
    return "Submitted";
  }
  return "Draft";
}

function AdopterMyRequestsPage() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [requests, setRequests] = useState([]);

  const load = useCallback(async () => {
    const user = getStoredUser();
    const uid = getResolvedUserId(user);
    if (uid == null || normalizeRole(user.role) !== "ADOPTER") {
      navigate("/login", { replace: true });
      return;
    }
    setLoading(true);
    const list = await fetchUserAdoptionRequests(uid);
    const sorted = [...list].sort((a, b) => {
      const ta = a.requestTime ? new Date(a.requestTime).getTime() : 0;
      const tb = b.requestTime ? new Date(b.requestTime).getTime() : 0;
      return tb - ta;
    });
    setRequests(sorted);
    setLoading(false);
  }, [navigate]);

  useEffect(() => {
    load();
  }, [load]);

  const goMatchesForRequest = (id, phase) => {
    const p = String(phase || "").toUpperCase();
    if (p === "SUBMITTED") {
      navigate(`/compatible-animals?requestId=${encodeURIComponent(String(id))}`);
    } else {
      navigate("/adoption-request");
    }
  };

  const goSavedForRequest = (id, phase) => {
    const p = String(phase || "").toUpperCase();
    if (p === "SUBMITTED") {
      navigate(`/saved-animals?requestId=${encodeURIComponent(String(id))}`);
    } else {
      navigate("/adoption-request");
    }
  };

  return (
    <div className="adopter-requests-page">
      <Navbar />
      <main className="adopter-requests-main">
        <section className="adopter-requests-hero">
          <p className="adopter-requests-tag">Adopter</p>
          <h1>View my matches</h1>
          <p>
            Choose a <strong>submitted</strong> adoption request to see compatible animals,
            contact owners, and review saved listings for that request.
          </p>
        </section>
        {loading ? (
          <p className="adopter-requests-loading">Loading…</p>
        ) : requests.length === 0 ? (
          <div className="adopter-requests-empty-block">
            <p className="adopter-requests-empty">You have no adoption requests yet.</p>
            <button
              type="button"
              className="adopter-requests-btn"
              onClick={() => navigate("/adoption-request")}
            >
              Create adoption request
            </button>
          </div>
        ) : (
          <ul className="adopter-requests-list">
            {requests.map((r) => {
              const phaseKey = String(r.requestPhase || "draft").toLowerCase();
              const isSubmitted = String(r.requestPhase || "").toUpperCase() === "SUBMITTED";
              return (
                <li key={r.id} className="adopter-requests-row">
                  <div className="adopter-requests-row-body">
                    <div className="adopter-requests-row-head">
                      <strong>Request #{r.id}</strong>
                      <span
                        className={`adopter-requests-phase adopter-requests-phase-${phaseKey === "submitted" ? "submitted" : "draft"}`}
                      >
                        {formatPhase(r.requestPhase)}
                      </span>
                    </div>
                    <p className="adopter-requests-meta">
                      {r.requestTime ? new Date(r.requestTime).toLocaleString() : "—"}
                    </p>
                    <p className="adopter-requests-detail">
                      {formatAdoptionRequestSummary(r)}
                    </p>
                    {r.notes && (
                      <p className="adopter-requests-notes">
                        <span>Notes:</span> {r.notes}
                      </p>
                    )}
                  </div>
                  <div className="adopter-requests-actions">
                    <button
                      type="button"
                      className="adopter-requests-btn"
                      onClick={() => goMatchesForRequest(r.id, r.requestPhase)}
                    >
                      {isSubmitted ? "Compatible animals" : "Continue draft"}
                    </button>
                    {isSubmitted && (
                      <button
                        type="button"
                        className="adopter-requests-btn adopter-requests-btn-secondary"
                        onClick={() => goSavedForRequest(r.id, r.requestPhase)}
                      >
                        Saved for this request
                      </button>
                    )}
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </main>
      <Footer />
    </div>
  );
}

export default AdopterMyRequestsPage;
