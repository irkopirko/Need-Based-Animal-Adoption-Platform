import React, { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import "./CompatibleAnimalsPage.css";
import "./AdopterMyRequestsPage.css";
import Navbar from "../components/Navbar";
import SaveHeartButton from "../components/SaveHeartButton";
import ContactOwnerModal from "../components/ContactOwnerModal";
import ReportListingModal from "../components/ReportListingModal";
import ListingReportButton from "../components/ListingReportButton";
import Footer from "../components/Footer";
import { usePopup } from "../components/PopupProvider";
import { getStoredUser, getApiBaseUrl, getResolvedUserId } from "../utils/auth";
import {
  fetchUserAdoptionRequests,
  formatAdoptionRequestSummary,
  summarizeAdoptionRequests,
  STRONG_MATCH_THRESHOLD,
  resolveAnimalImageUrl,
  fetchStrongMatchAnimals
} from "../utils/adopterJourney";
import {
  saveAnimalForUser,
  unsaveAnimalForUser
} from "../utils/platformApi";
import { formatAnimalGenderLabel } from "../utils/listingDisplay";

const COMPATIBLE_RELOAD_MS = 120_000;
let lastCompatibleLoadAt = 0;

function formatRequestPhase(phase) {
  const p = String(phase || "").toUpperCase();
  return p === "SUBMITTED" ? "Submitted" : "Draft";
}

function sortAdoptionRequests(list) {
  return [...list].sort((a, b) => {
    const aSub = String(a.requestPhase || "").toUpperCase() === "SUBMITTED" ? 1 : 0;
    const bSub = String(b.requestPhase || "").toUpperCase() === "SUBMITTED" ? 1 : 0;
    if (aSub !== bSub) {
      return bSub - aSub;
    }
    const ta = a.requestTime ? new Date(a.requestTime).getTime() : 0;
    const tb = b.requestTime ? new Date(b.requestTime).getTime() : 0;
    return tb - ta;
  });
}

function CompatibleAnimalsPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const requestIdFromUrl = searchParams.get("requestId");
  const { showPopup } = usePopup();

  const [animals, setAnimals] = useState([]);
  const [savedIds, setSavedIds] = useState([]);
  const [typeFilter, setTypeFilter] = useState("All");
  const [sortBy, setSortBy] = useState("Highest Match");
  const [loading, setLoading] = useState(true);
  const [hasAdoptionRequest, setHasAdoptionRequest] = useState(false);
  const [contactOpen, setContactOpen] = useState(false);
  const [contactAnimal, setContactAnimal] = useState(null);
  const [reportOpen, setReportOpen] = useState(false);
  const [reportAnimalId, setReportAnimalId] = useState(null);
  const [submittedRequests, setSubmittedRequests] = useState([]);
  const [allRequests, setAllRequests] = useState([]);
  const [needsRequestPick, setNeedsRequestPick] = useState(false);
  const [reloadToken, setReloadToken] = useState(0);

  const user = getStoredUser();
  const adopterUid = getResolvedUserId(user);

  useEffect(() => {
    let cancelled = false;

    const run = async () => {
      setLoading(true);
      const user = getStoredUser();
      let allowed =
        typeof window !== "undefined" &&
        localStorage.getItem("adoptionRequestCompleted") === "true";

      const resolvedUid = getResolvedUserId(user);
      const apiBase = getApiBaseUrl();
      const ridNum =
        requestIdFromUrl != null && /^\d+$/.test(String(requestIdFromUrl).trim())
          ? Number(requestIdFromUrl)
          : null;

      let requests = [];
      try {
        if (resolvedUid != null && ridNum != null) {
          const fromMatch = await fetchStrongMatchAnimals(resolvedUid, ridNum);
          if (cancelled) {
            return;
          }
          const normalized = (Array.isArray(fromMatch) ? fromMatch : []).map((a) => {
            if (!a.images?.length) {
              return a;
            }
            const resolved = resolveAnimalImageUrl(a, apiBase);
            return { ...a, images: [resolved || a.images[0]] };
          });
          setAnimals(normalized);
          setSavedIds(
            normalized
              .filter((a) => a.isSaved === true)
              .map((a) => Number(a.id))
              .filter(Number.isFinite)
          );
          setHasAdoptionRequest(true);
          setNeedsRequestPick(false);
          setLoading(false);
          lastCompatibleLoadAt = Date.now();

          fetchUserAdoptionRequests(resolvedUid)
            .then((reqList) => {
              if (cancelled) {
                return;
              }
              const submitted = reqList.filter(
                (r) => String(r.requestPhase || "").toUpperCase() === "SUBMITTED"
              );
              setSubmittedRequests(submitted);
              setAllRequests(sortAdoptionRequests(reqList));
              const { hasSubmitted } = summarizeAdoptionRequests(reqList);
              setHasAdoptionRequest(hasSubmitted || allowed);
            })
            .catch(() => {});
          return;
        }

        requests = await fetchUserAdoptionRequests(resolvedUid);
        requests = sortAdoptionRequests(requests);
      } catch (error) {
        console.error("Error fetching compatible animals:", error);
        if (!cancelled) {
          showPopup({
            type: "critical",
            title: "Loading Failed",
            message: error?.message || "Compatible animals could not be loaded from backend."
          });
          setLoading(false);
        }
        return;
      }

      if (cancelled) {
        return;
      }

      const { hasSubmitted } = summarizeAdoptionRequests(requests);
      allowed = hasSubmitted || allowed;
      const submitted = requests.filter(
        (r) => String(r.requestPhase || "").toUpperCase() === "SUBMITTED"
      );
      setHasAdoptionRequest(allowed);
      setSubmittedRequests(submitted);
      setAllRequests(requests);

      if (!allowed) {
        setAnimals([]);
        setSavedIds([]);
        setNeedsRequestPick(false);
        setLoading(false);
        return;
      }

      if (submitted.length === 1 && ridNum == null) {
        navigate(
          `/compatible-animals?requestId=${encodeURIComponent(String(submitted[0].id))}`,
          { replace: true }
        );
        return;
      }

      if (submitted.length > 1 && ridNum == null) {
        setAnimals([]);
        setSavedIds([]);
        setNeedsRequestPick(true);
        setLoading(false);
        return;
      }

      setNeedsRequestPick(false);

      if (resolvedUid == null || ridNum == null) {
        setLoading(false);
        return;
      }

      try {
        const fromMatch = await fetchStrongMatchAnimals(resolvedUid, ridNum);
        const normalized = (Array.isArray(fromMatch) ? fromMatch : []).map((a) => {
          if (!a.images?.length) {
            return a;
          }
          const resolved = resolveAnimalImageUrl(a, apiBase);
          return { ...a, images: [resolved || a.images[0]] };
        });
        if (!cancelled) {
          setAnimals(normalized);
          setSavedIds(
            normalized
              .filter((a) => a.isSaved === true)
              .map((a) => Number(a.id))
              .filter(Number.isFinite)
          );
        }
      } catch (error) {
        console.error("Error fetching compatible animals:", error);
        if (!cancelled) {
          showPopup({
            type: "critical",
            title: "Loading Failed",
            message: error?.message || "Compatible animals could not be loaded from backend."
          });
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
          lastCompatibleLoadAt = Date.now();
        }
      }
    };

    run();
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [requestIdFromUrl, reloadToken]);

  useEffect(() => {
    const onVisible = () => {
      if (document.visibilityState !== "visible") {
        return;
      }
      if (Date.now() - lastCompatibleLoadAt < COMPATIBLE_RELOAD_MS) {
        return;
      }
      setReloadToken((t) => t + 1);
    };
    document.addEventListener("visibilitychange", onVisible);
    return () => document.removeEventListener("visibilitychange", onVisible);
  }, []);

  let filteredAnimals = [...animals];

  const animalTypeLabel = (t) => {
    const u = String(t || "").toUpperCase();
    if (u === "DOG") return "Dog";
    if (u === "CAT") return "Cat";
    return t || "";
  };

  if (typeFilter !== "All") {
    filteredAnimals = filteredAnimals.filter(
      (animal) => animalTypeLabel(animal.animalType) === typeFilter
    );
  }

  if (sortBy === "Highest Match") {
    filteredAnimals.sort(
      (a, b) => (b.compatibilityScore || 0) - (a.compatibilityScore || 0)
    );
  }

  if (sortBy === "Lowest Match") {
    filteredAnimals.sort(
      (a, b) => (a.compatibilityScore || 0) - (b.compatibilityScore || 0)
    );
  }

  if (sortBy === "Name") {
    filteredAnimals.sort((a, b) => a.name.localeCompare(b.name));
  }

  const handleSave = async (animalId, e) => {
    e?.stopPropagation?.();
    const uid = getResolvedUserId(getStoredUser());
    if (uid == null) {
      showPopup({
        type: "warning",
        title: "Sign in required",
        message: "Log in as an adopter to save animals."
      });
      return;
    }
    const idNum = Number(animalId);
    const isSaved = savedIds.includes(idNum);
    try {
      if (isSaved) {
        await unsaveAnimalForUser(uid, idNum);
        setSavedIds(savedIds.filter((id) => id !== idNum));
        showPopup({
          type: "info",
          title: "Removed",
          message: "Animal removed from your saved list."
        });
      } else {
        const rid =
          requestIdFromUrl != null && /^\d+$/.test(String(requestIdFromUrl).trim())
            ? Number(requestIdFromUrl)
            : null;
        await saveAnimalForUser(uid, idNum, rid);
        setSavedIds([...savedIds, idNum]);
        showPopup({
          type: "success",
          title: "Saved",
          message: "Animal added to your saved list."
        });
      }
    } catch (err) {
      showPopup({
        type: "error",
        title: "Could not update",
        message: err.message || "Try again."
      });
    }
  };

  const buildAnimalDetailPath = (animalId) => {
    const base = `/animal/${animalId}`;
    if (requestIdFromUrl != null && /^\d+$/.test(String(requestIdFromUrl).trim())) {
      return `${base}?requestId=${encodeURIComponent(String(requestIdFromUrl).trim())}`;
    }
    return base;
  };

  const goToAnimalDetail = (animalId, e) => {
    e?.stopPropagation?.();
    navigate(buildAnimalDetailPath(animalId));
  };

  const goToRequestForm = () => {
    navigate("/adoption-request");
  };

  const goToSavedAnimals = () => {
    if (requestIdFromUrl != null && /^\d+$/.test(String(requestIdFromUrl).trim())) {
      navigate(
        `/saved-animals?requestId=${encodeURIComponent(String(requestIdFromUrl).trim())}`
      );
      return;
    }
    navigate("/saved-animals");
  };

  const selectRequestForMatches = (id) => {
    navigate(`/compatible-animals?requestId=${encodeURIComponent(String(id))}`);
  };

  const selectRequestForSaved = (id) => {
    navigate(`/saved-animals?requestId=${encodeURIComponent(String(id))}`);
  };

  const continueDraft = () => {
    navigate("/adoption-request");
  };

  if (loading) {
    return (
      <div className="compatible-page">
        <Navbar />
        <main className="compatible-main">
          <div className="compatible-loading-card">
            <h1>Loading compatible animals...</h1>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  if (needsRequestPick) {
    return (
      <div className="compatible-page">
        <Navbar />
        <main className="compatible-main">
          <section className="compatible-hero compatible-hero-compact">
            <div className="compatible-hero-left">
              <p className="compatible-hero-tag">Compatible Animals</p>
              <h1 className="compatible-hero-title">Choose an adoption request</h1>
              <p className="compatible-hero-text">
                Submitted requests unlock compatible and saved animals. Drafts stay listed
                so you can continue editing them.
              </p>
            </div>
          </section>
          <ul className="adopter-requests-list">
            {allRequests.map((r) => {
              const phaseKey = String(r.requestPhase || "draft").toLowerCase();
              const isSubmitted = phaseKey === "submitted";
              return (
                <li key={r.id} className="adopter-requests-row">
                  <div className="adopter-requests-row-body">
                    <div className="adopter-requests-row-head">
                      <strong>Request #{r.id}</strong>
                      <span
                        className={`adopter-requests-phase adopter-requests-phase-${isSubmitted ? "submitted" : "draft"}`}
                      >
                        {formatRequestPhase(r.requestPhase)}
                      </span>
                    </div>
                    <p className="adopter-requests-meta">
                      {r.requestTime ? new Date(r.requestTime).toLocaleString() : "—"}
                    </p>
                    <p className="adopter-requests-detail">
                      {formatAdoptionRequestSummary(r)}
                    </p>
                  </div>
                  <div className="adopter-requests-actions">
                    {isSubmitted ? (
                      <>
                        <button
                          type="button"
                          className="adopter-requests-btn"
                          onClick={() => selectRequestForMatches(r.id)}
                        >
                          View compatible animals
                        </button>
                        <button
                          type="button"
                          className="adopter-requests-btn adopter-requests-btn-secondary"
                          onClick={() => selectRequestForSaved(r.id)}
                        >
                          View saved animals
                        </button>
                      </>
                    ) : (
                      <button
                        type="button"
                        className="adopter-requests-btn"
                        onClick={continueDraft}
                      >
                        Continue draft
                      </button>
                    )}
                  </div>
                </li>
              );
            })}
          </ul>
        </main>
        <Footer />
      </div>
    );
  }

  if (!hasAdoptionRequest) {
    return (
      <div className="compatible-page">
        <Navbar />

        <main className="compatible-main">
          <section className="compatible-locked-card">
            <span className="compatible-badge">Locked</span>
            <h1>Complete your adoption request first</h1>
            <p>
              This page becomes available after you submit your adoption request.
              Once your lifestyle and home information are saved, the system can
              calculate compatibility scores. Animals at{" "}
              {STRONG_MATCH_THRESHOLD}% or higher appear as strong matches.
            </p>
            <button
              type="button"
              className="compatible-primary-btn"
              onClick={goToRequestForm}
            >
              Create Adoption Request
            </button>
          </section>
        </main>

        <Footer />
      </div>
    );
  }

  if (filteredAnimals.length === 0) {
    return (
      <div className="compatible-page">
        <Navbar />

        <main className="compatible-main">
          <section className="compatible-empty-card">
            <span className="compatible-badge">No Matches Yet</span>
            <h1>
              No animals at {STRONG_MATCH_THRESHOLD}% compatibility or higher
            </h1>
            <p>
              Only animals with a compatibility score of {STRONG_MATCH_THRESHOLD}%
              or higher (inclusive) are shown here. None meet that bar right now.
              You can review your request later or wait for new listings.
            </p>
            <div className="compatible-hero-buttons">
              <button
                type="button"
                className="compatible-primary-btn"
                onClick={goToRequestForm}
              >
                Review Adoption Request
              </button>
              <button
                type="button"
                className="compatible-secondary-btn"
                onClick={goToSavedAnimals}
              >
                View saved animals
              </button>
            </div>
          </section>
        </main>

        <Footer />
      </div>
    );
  }

  return (
    <div className="compatible-page">
      <Navbar />

      <main className="compatible-main">
        <section className="compatible-hero">
          <div className="compatible-hero-left">
            <p className="compatible-hero-tag">Compatible Animals</p>
            {requestIdFromUrl && /^\d+$/.test(String(requestIdFromUrl).trim()) && (
              <p className="compatible-request-scope-note">
                Showing strong matches (≥ {STRONG_MATCH_THRESHOLD}%) for{" "}
                <strong>request #{String(requestIdFromUrl).trim()}</strong>.{" "}
                <button
                  type="button"
                  className="compatible-request-scope-link"
                  onClick={() => navigate("/compatible-animals")}
                >
                  {submittedRequests.length > 1
                    ? "Choose another request"
                    : "Clear request filter"}
                </button>
              </p>
            )}
            <h1 className="compatible-hero-title">
              Animals that fit
              <br />
              your lifestyle best.
            </h1>
            <p className="compatible-hero-text">
              Listings with at least <strong>{STRONG_MATCH_THRESHOLD}%</strong> fit to your adoption
              request, ranked by compatibility. Details refresh when owners update their listings.
            </p>

            <div className="compatible-hero-buttons">
              <button
                type="button"
                className="compatible-primary-btn"
                onClick={goToSavedAnimals}
              >
                View Saved Animals
              </button>

              <button
                type="button"
                className="compatible-secondary-btn"
                onClick={goToRequestForm}
              >
                Edit Request
              </button>
            </div>
          </div>

          <div className="compatible-hero-right">
            <div className="compatible-highlight-card">
              <div className="compatible-highlight-top">
                <span className="compatible-badge">Matching Active</span>
                <span className="compatible-highlight-dot"></span>
              </div>

              <h3>Your results are filtered by compatibility</h3>

              <p>
                Only animals with a compatibility score of at least{" "}
                {STRONG_MATCH_THRESHOLD}% (inclusive) appear here. This keeps
                browsing focused on meaningful fits.
              </p>

              <div className="compatible-highlight-stats">
                <div className="compatible-mini-stat">
                  <strong>{filteredAnimals.length}</strong>
                  <span>Strong matches (≥{STRONG_MATCH_THRESHOLD}%)</span>
                </div>

                <div className="compatible-mini-stat">
                  <strong>
                    {Math.max(
                      ...filteredAnimals.map(
                        (animal) => animal.compatibilityScore || 0
                      )
                    )}
                    %
                  </strong>
                  <span>Top Score</span>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="compatible-toolbar">
          <div className="compatible-toolbar-left">
            <div className="compatible-filter-group">
              <label>Animal Type</label>
              <select
                value={typeFilter}
                onChange={(e) => setTypeFilter(e.target.value)}
              >
                <option value="All">All</option>
                <option value="Dog">Dog</option>
                <option value="Cat">Cat</option>
              </select>
            </div>

            <div className="compatible-filter-group">
              <label>Sort By</label>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
              >
                <option value="Highest Match">Highest Match</option>
                <option value="Lowest Match">Lowest Match</option>
                <option value="Name">Name</option>
              </select>
            </div>
          </div>

          <div className="compatible-toolbar-right">
            <span>{filteredAnimals.length} animals available</span>
            <button
              type="button"
              className="compatible-toolbar-saved-btn"
              onClick={goToSavedAnimals}
            >
              Saved animals
            </button>
          </div>
        </section>

        <section className="compatible-grid">
          {filteredAnimals.map((animal) => (
            <article
              key={animal.id}
              className="compatible-card compatible-card-clickable"
              onClick={() => navigate(buildAnimalDetailPath(animal.id))}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") {
                  e.preventDefault();
                  navigate(buildAnimalDetailPath(animal.id));
                }
              }}
              role="link"
              tabIndex={0}
            >
              <div className="compatible-card-image-wrap">
                <img
                  src={animal.images?.[0]}
                  alt={animal.name}
                  className="compatible-card-image"
                />
                <SaveHeartButton
                  className="compatible-card-save-heart"
                  saved={savedIds.includes(Number(animal.id))}
                  onClick={(e) => handleSave(animal.id, e)}
                />
                <ListingReportButton
                  variant="overlay"
                  className="compatible-card-report-btn"
                  onClick={() => setReportAnimalId(Number(animal.id))}
                />
                <span className="compatible-score-pill">
                  {animal.compatibilityScore || 0}% compatibility
                </span>
              </div>

              <div className="compatible-card-content">
                <div className="compatible-card-head">
                  <div>
                    <h3>{animal.name}</h3>
                    <p>
                      {animal.animalType} · {animal.breed}
                    </p>
                  </div>
                </div>

                <div className="compatible-card-meta">
                  {formatAnimalGenderLabel(animal.gender) ? (
                    <span>{formatAnimalGenderLabel(animal.gender)}</span>
                  ) : null}
                  <span>{animal.ageGroup}</span>
                  <span>{animal.size}</span>
                  <span>{animal.energyLevel}</span>
                </div>

                <p className="compatible-card-description">
                  {animal.description}
                </p>

                <div className="compatible-card-actions">
                  <button
                    type="button"
                    className="compatible-dark-btn"
                    onClick={(e) => goToAnimalDetail(animal.id, e)}
                  >
                    View animal profile
                  </button>

                  {hasAdoptionRequest && animal.ownerId != null && (
                    <button
                      type="button"
                      className="compatible-secondary-outline-btn"
                      onClick={(e) => {
                        e.stopPropagation();
                        setContactAnimal(animal);
                        setContactOpen(true);
                      }}
                    >
                      Message owner
                    </button>
                  )}

                  {adopterUid != null && (
                    <button
                      type="button"
                      className="compatible-secondary-outline-btn compatible-report-btn"
                      onClick={(e) => {
                        e.stopPropagation();
                        setReportAnimalId(animal.id);
                        setReportOpen(true);
                      }}
                    >
                      Report listing
                    </button>
                  )}
                </div>
              </div>
            </article>
          ))}
        </section>
      </main>

      <ContactOwnerModal
        open={contactOpen}
        onClose={(sent) => {
          setContactOpen(false);
          setContactAnimal(null);
          if (sent) {
            navigate("/adopter-messages");
          }
        }}
        animal={contactAnimal}
        adopterUserId={adopterUid}
      />

      <ReportListingModal
        open={reportOpen}
        onClose={() => {
          setReportOpen(false);
          setReportAnimalId(null);
        }}
        animalId={reportAnimalId}
        reporterUserId={adopterUid}
      />

      <Footer />
    </div>
  );
}

export default CompatibleAnimalsPage;
