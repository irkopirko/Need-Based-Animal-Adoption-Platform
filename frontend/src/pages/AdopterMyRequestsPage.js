import React, { useCallback, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import { getStoredUser, normalizeRole, getResolvedUserId } from "../utils/auth";
import { fetchUserAdoptionRequests } from "../utils/adopterJourney";
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

  return (
    <div className="adopter-requests-page">
      <Navbar />
      <main className="adopter-requests-main">
        <section className="adopter-requests-hero">
          <p className="adopter-requests-tag">Adopter</p>
          <h1>My adoption requests</h1>
          <p>
            For a <strong>submitted</strong> request, open strong matches to see listings scored
            against that form (≥ 75%). Drafts continue in the adoption request wizard.
          </p>
        </section>
        {loading ? (
          <p className="adopter-requests-loading">Loading…</p>
        ) : requests.length === 0 ? (
          <p className="adopter-requests-empty">You have no adoption requests yet.</p>
        ) : (
          <ul className="adopter-requests-list">
            {requests.map((r) => {
              const phaseKey = String(r.requestPhase || "draft").toLowerCase();
              const isSubmitted = String(r.requestPhase || "").toUpperCase() === "SUBMITTED";
              return (
                <li key={r.id} className="adopter-requests-row">
                  <div>
                    <strong>Request #{r.id}</strong>
                    <span
                      className={`adopter-requests-phase adopter-requests-phase-${phaseKey === "submitted" ? "submitted" : "draft"}`}
                    >
                      {formatPhase(r.requestPhase)}
                    </span>
                    <p className="adopter-requests-meta">
                      {r.requestTime ? new Date(r.requestTime).toLocaleString() : "—"}
                    </p>
                  </div>
                  <button
                    type="button"
                    className="adopter-requests-btn"
                    onClick={() => goMatchesForRequest(r.id, r.requestPhase)}
                  >
                    {isSubmitted ? "View strong matches" : "Continue draft"}
                  </button>
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
