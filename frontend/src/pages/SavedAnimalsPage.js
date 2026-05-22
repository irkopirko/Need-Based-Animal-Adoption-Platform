import React, { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import "./SavedAnimalsPage.css";
import "./AdopterMyRequestsPage.css";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import SaveHeartButton from "../components/SaveHeartButton";
import { usePopup } from "../components/PopupProvider";
import { unsaveAnimalForUser } from "../utils/platformApi";
import { getStoredUser, normalizeRole, getApiBaseUrl, getResolvedUserId } from "../utils/auth";
import {
  fetchSavedAnimalEntries,
  fetchStrongMatchAnimals,
  fetchUserAdoptionRequests,
  formatAdoptionRequestSummary,
  mergeSavedWithCompatibility,
  summarizeAdoptionRequests,
  STRONG_MATCH_THRESHOLD
} from "../utils/adopterJourney";

function formatPhase(phase) {
  const p = String(phase || "").toUpperCase();
  return p === "SUBMITTED" ? "Submitted" : "Draft";
}

function countSavedForRequest(entries, requestId) {
  const rid = Number(requestId);
  return entries.filter(
    (entry) => entry.adoptionRequestId === rid || entry.adoptionRequestId == null
  ).length;
}

function SavedAnimalsPage() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const filterRequestId = searchParams.get("requestId");
  const { showPopup } = usePopup();

  const [loading, setLoading] = useState(true);
  const [scenario, setScenario] = useState("LOADING");
  const [submittedRequests, setSubmittedRequests] = useState([]);
  const [savedEntries, setSavedEntries] = useState([]);
  const [requestGroup, setRequestGroup] = useState(null);
  const [userId, setUserId] = useState(null);

  const refresh = useCallback(async () => {
    const user = getStoredUser();
    const role = normalizeRole(user?.role);
    const uid = getResolvedUserId(user);
    if (uid == null || role !== "ADOPTER") {
      setUserId(null);
      setScenario("NOT_ADOPTER");
      setSubmittedRequests([]);
      setSavedEntries([]);
      setRequestGroup(null);
      setLoading(false);
      return;
    }
    setUserId(uid);
    setLoading(true);

    try {
      const apiBaseUrl = getApiBaseUrl();
      const requests = await fetchUserAdoptionRequests(uid);
      const { hasSubmitted, hasDraft } = summarizeAdoptionRequests(requests);
      const submitted = requests.filter(
        (r) => String(r.requestPhase || "").toUpperCase() === "SUBMITTED"
      );
      setSubmittedRequests(submitted);

      if (!hasSubmitted && !hasDraft && requests.length === 0) {
        setScenario("NO_REQUEST");
        setRequestGroup(null);
        setLoading(false);
        return;
      }
      if (!hasSubmitted) {
        setScenario("DRAFT_ONLY");
        setRequestGroup(null);
        setLoading(false);
        return;
      }
      if (submitted.length === 0) {
        setScenario("NO_REQUEST");
        setRequestGroup(null);
        setLoading(false);
        return;
      }

      const entries = await fetchSavedAnimalEntries(uid);
      setSavedEntries(entries);

      const ridParam =
        filterRequestId != null && /^\d+$/.test(String(filterRequestId).trim())
          ? Number(filterRequestId)
          : null;

      if (submitted.length === 1 && ridParam == null) {
        navigate(`/saved-animals?requestId=${encodeURIComponent(String(submitted[0].id))}`, {
          replace: true
        });
        return;
      }

      if (ridParam == null) {
        setScenario("PICK_REQUEST");
        setRequestGroup(null);
        setLoading(false);
        return;
      }

      const selectedRequest = submitted.find((r) => Number(r.id) === ridParam);
      if (!selectedRequest) {
        setScenario("PICK_REQUEST");
        setRequestGroup(null);
        setLoading(false);
        return;
      }

      const matches = await fetchStrongMatchAnimals(uid, ridParam);
      const matchIds = new Set((matches || []).map((a) => Number(a.id)));
      const savedForRequest = entries.filter((e) => {
        if (e.adoptionRequestId === ridParam) {
          return true;
        }
        if (e.adoptionRequestId == null && submitted.length === 1) {
          return true;
        }
        if (e.adoptionRequestId == null && matchIds.has(Number(e.animalId))) {
          return true;
        }
        return false;
      });
      const merged = mergeSavedWithCompatibility(
        savedForRequest.map((e) => e.animal),
        matches,
        apiBaseUrl
      );

      if (merged.length === 0) {
        const anyMatches = await fetchStrongMatchAnimals(uid, ridParam);
        setScenario(anyMatches.length === 0 ? "SUBMITTED_NO_MATCHES" : "READY_EMPTY");
        setRequestGroup({
          requestId: ridParam,
          request: selectedRequest,
          animals: []
        });
      } else {
        setScenario("READY");
        setRequestGroup({
          requestId: ridParam,
          request: selectedRequest,
          animals: merged
        });
      }
    } catch (e) {
      console.error(e);
      setScenario("NO_REQUEST");
      setRequestGroup(null);
    } finally {
      setLoading(false);
    }
  }, [filterRequestId, navigate]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const [typeFilter, setTypeFilter] = useState("All");
  const [sortBy, setSortBy] = useState("Compatibility");

  const visibleAnimals = useMemo(() => {
    if (!requestGroup) {
      return [];
    }
    let result = [...requestGroup.animals];
    if (typeFilter !== "All") {
      result = result.filter((animal) => animal.type === typeFilter);
    }
    if (sortBy === "Compatibility") {
      result.sort((a, b) => b.compatibility - a.compatibility);
    }
    if (sortBy === "Name") {
      result.sort((a, b) => a.name.localeCompare(b.name));
    }
    return result;
  }, [requestGroup, typeFilter, sortBy]);

  const handleUnsave = async (animalId, e) => {
    e?.stopPropagation?.();
    e?.preventDefault?.();
    if (!userId) {
      return;
    }
    try {
      await unsaveAnimalForUser(userId, Number(animalId));
      setRequestGroup((prev) =>
        prev
          ? {
              ...prev,
              animals: prev.animals.filter((a) => Number(a.id) !== Number(animalId))
            }
          : null
      );
      setSavedEntries((prev) =>
        prev.filter((entry) => Number(entry.animalId) !== Number(animalId))
      );
      showPopup({
        type: "info",
        title: "Removed",
        message: "Animal removed from your saved list."
      });
    } catch (err) {
      console.error(err);
      showPopup({
        type: "error",
        title: "Could not remove",
        message: err?.message || "Please try again."
      });
    }
  };

  const goToAnimalDetail = (id) => {
    const base = `/animal/${id}`;
    if (requestGroup?.requestId) {
      navigate(`${base}?requestId=${encodeURIComponent(String(requestGroup.requestId))}`);
      return;
    }
    navigate(base);
  };

  const goToAdoptionRequest = () => navigate("/adoption-request");

  const selectRequest = (id) => {
    setSearchParams({ requestId: String(id) });
  };

  const clearRequestFilter = () => {
    navigate("/saved-animals");
  };

  if (loading) {
    return (
      <div className="saved-animals-page">
        <Navbar />
        <main className="saved-animals-main">
          <p className="saved-animals-loading-msg">Loading…</p>
        </main>
        <Footer />
      </div>
    );
  }

  if (scenario === "NOT_ADOPTER") {
    return (
      <div className="saved-animals-page">
        <Navbar />
        <main className="saved-animals-main">
          <section className="saved-animals-empty-shell">
            <div className="saved-animals-empty-card">
              <span className="saved-animals-empty-badge">Adopters only</span>
              <h2>Saved animals is for adopters</h2>
              <p>Sign in as an adopter to use this page.</p>
              <div className="saved-animals-empty-actions">
                <button
                  type="button"
                  className="saved-animals-primary-btn"
                  onClick={() => navigate("/login")}
                >
                  Sign in
                </button>
              </div>
            </div>
          </section>
        </main>
        <Footer />
      </div>
    );
  }

  const gateCard = (badge, title, body, actions) => (
    <section className="saved-animals-empty-shell">
      <div className="saved-animals-empty-card locked">
        <span className="saved-animals-empty-badge">{badge}</span>
        <h2>{title}</h2>
        <p>{body}</p>
        <div className="saved-animals-empty-actions">{actions}</div>
      </div>
    </section>
  );

  return (
    <div className="saved-animals-page">
      <Navbar />

      <main className="saved-animals-main">
        <section className="saved-animals-hero">
          <div className="saved-animals-hero-left">
            <p className="saved-animals-tag">Saved Animals</p>
            <h1>
              {scenario === "PICK_REQUEST"
                ? "Choose an adoption request"
                : "Saved listings for your request"}
            </h1>
            <p>
              {scenario === "PICK_REQUEST"
                ? "Select which submitted adoption request you want to review saved animals for."
                : "Animals you saved for this adoption request. Compatibility % is shown when available."}
            </p>
            {requestGroup?.requestId && (
              <p className="saved-animals-filter-note">
                Showing request #{requestGroup.requestId}.{" "}
                {submittedRequests.length > 1 && (
                  <button
                    type="button"
                    className="saved-animals-link-btn"
                    onClick={clearRequestFilter}
                  >
                    Choose another request
                  </button>
                )}
              </p>
            )}
          </div>
        </section>

        {scenario === "PICK_REQUEST" && (
          <section className="saved-animals-picker-wrap">
            <ul className="adopter-requests-list">
              {submittedRequests.map((r) => {
                const savedCount = countSavedForRequest(savedEntries, r.id);
                const phaseKey = String(r.requestPhase || "draft").toLowerCase();
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
                      <p className="saved-animals-picker-count">
                        {savedCount > 0
                          ? `${savedCount} saved animal${savedCount === 1 ? "" : "s"}`
                          : "No saved animals yet"}
                      </p>
                    </div>
                    <div className="adopter-requests-actions">
                      <button
                        type="button"
                        className="adopter-requests-btn"
                        onClick={() => selectRequest(r.id)}
                      >
                        Open saved animals
                      </button>
                    </div>
                  </li>
                );
              })}
            </ul>
          </section>
        )}

        {scenario === "NO_REQUEST" &&
          gateCard(
            "Get started",
            "Create an adoption request first",
            `Submit a request before saving compatible animals (≥ ${STRONG_MATCH_THRESHOLD}%).`,
            <>
              <button
                type="button"
                className="saved-animals-primary-btn"
                onClick={goToAdoptionRequest}
              >
                Start adoption request
              </button>
            </>
          )}

        {scenario === "DRAFT_ONLY" &&
          gateCard(
            "Draft in progress",
            "Finish and submit your request",
            "Saved animals are organised per submitted request.",
            <>
              <button
                type="button"
                className="saved-animals-primary-btn"
                onClick={goToAdoptionRequest}
              >
                Continue adoption request
              </button>
            </>
          )}

        {scenario === "SUBMITTED_NO_MATCHES" &&
          gateCard(
            "No strong matches yet",
            `No animals at ${STRONG_MATCH_THRESHOLD}% compatibility or higher`,
            "Check again later or browse compatible animals for this request.",
            <>
              {requestGroup?.requestId && (
                <button
                  type="button"
                  className="saved-animals-primary-btn"
                  onClick={() =>
                    navigate(
                      `/compatible-animals?requestId=${encodeURIComponent(String(requestGroup.requestId))}`
                    )
                  }
                >
                  View compatible animals
                </button>
              )}
            </>
          )}

        {(scenario === "READY_EMPTY" ||
          (scenario === "READY" && visibleAnimals.length === 0)) &&
          gateCard(
            "No saved animals yet",
            "Save from your compatible list",
            "Open compatible animals for this request and tap the heart to save.",
            <>
              {requestGroup?.requestId && (
                <button
                  type="button"
                  className="saved-animals-primary-btn"
                  onClick={() =>
                    navigate(
                      `/compatible-animals?requestId=${encodeURIComponent(String(requestGroup.requestId))}`
                    )
                  }
                >
                  View compatible animals
                </button>
              )}
              {submittedRequests.length > 1 && (
                <button
                  type="button"
                  className="saved-animals-secondary-btn"
                  onClick={clearRequestFilter}
                >
                  Choose another request
                </button>
              )}
            </>
          )}

        {scenario === "READY" && visibleAnimals.length > 0 && requestGroup && (
          <>
            <header className="saved-animals-request-header saved-animals-request-header-inline">
              <div>
                <h2>Request #{requestGroup.requestId}</h2>
                <p>{formatAdoptionRequestSummary(requestGroup.request)}</p>
              </div>
              <button
                type="button"
                className="saved-animals-link-btn"
                onClick={() =>
                  navigate(
                    `/compatible-animals?requestId=${encodeURIComponent(String(requestGroup.requestId))}`
                  )
                }
              >
                View compatible animals
              </button>
            </header>

            <section className="saved-animals-toolbar">
              <div className="saved-animals-toolbar-left">
                <label>
                  Type
                  <select value={typeFilter} onChange={(e) => setTypeFilter(e.target.value)}>
                    <option value="All">All</option>
                    <option value="Dog">Dog</option>
                    <option value="Cat">Cat</option>
                    <option value="Rabbit">Rabbit</option>
                  </select>
                </label>
                <label>
                  Sort By
                  <select value={sortBy} onChange={(e) => setSortBy(e.target.value)}>
                    <option value="Compatibility">Compatibility</option>
                    <option value="Name">Name</option>
                  </select>
                </label>
              </div>
              <div className="saved-animals-toolbar-right">
                <span>{visibleAnimals.length} saved</span>
              </div>
            </section>

            <section className="saved-animals-grid">
              {visibleAnimals.map((animal) => (
                <div key={animal.id} className="saved-animal-card">
                  <div className="saved-animal-image-wrap">
                    {animal.image ? (
                      <img
                        src={animal.image}
                        alt={animal.name}
                        className="saved-animal-image"
                      />
                    ) : (
                      <div className="saved-animal-image-placeholder" aria-hidden />
                    )}
                    <SaveHeartButton
                      className="saved-animal-save-heart"
                      saved
                      onClick={(e) => handleUnsave(animal.id, e)}
                    />
                    <span
                      className={`saved-animal-badge ${
                        animal.compatibility >= STRONG_MATCH_THRESHOLD
                          ? ""
                          : "saved-animal-badge-muted"
                      }`}
                    >
                      {animal.compatibility > 0
                        ? `${animal.compatibility}% compatibility`
                        : "Saved"}
                    </span>
                  </div>
                  <div className="saved-animal-content">
                    <h3>{animal.name}</h3>
                    <p>
                      {animal.type} · {animal.breed}
                    </p>
                    <div className="saved-animal-actions">
                      <button
                        type="button"
                        className="saved-animal-primary-btn"
                        onClick={() => goToAnimalDetail(animal.id)}
                      >
                        View Details
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </section>
          </>
        )}
      </main>

      <Footer />
    </div>
  );
}

export default SavedAnimalsPage;
