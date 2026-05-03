import React, { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import "./SavedAnimalsPage.css";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import { usePopup } from "../components/PopupProvider";
import { getStoredUser, normalizeRole, getApiBaseUrl } from "../utils/auth";
import {
  loadAdopterJourneyState,
  mergeSavedWithCompatibility,
  STRONG_MATCH_THRESHOLD
} from "../utils/adopterJourney";

function SavedAnimalsPage() {
  const navigate = useNavigate();
  const { showPopup } = usePopup();

  const [loading, setLoading] = useState(true);
  const [scenario, setScenario] = useState("LOADING");
  const [savedRows, setSavedRows] = useState([]);
  const [userId, setUserId] = useState(null);

  const refresh = useCallback(async () => {
    const user = getStoredUser();
    const role = normalizeRole(user?.role);
    if (!user?.userId || role !== "ADOPTER") {
      setUserId(null);
      setScenario("NOT_ADOPTER");
      setSavedRows([]);
      setLoading(false);
      return;
    }
    setUserId(user.userId);
    setLoading(true);
    try {
      const state = await loadAdopterJourneyState(user.userId);
      const merged = mergeSavedWithCompatibility(
        state.savedAnimals,
        state.strongMatches,
        state.apiBaseUrl
      );
      const eligible = merged.filter(
        (a) => a.compatibility >= STRONG_MATCH_THRESHOLD
      );

      if (state.noRequest) {
        setScenario("NO_REQUEST");
        setSavedRows([]);
      } else if (state.draftOnly) {
        setScenario("DRAFT_ONLY");
        setSavedRows([]);
      } else if (state.submitted && state.strongMatches.length === 0) {
        setScenario("SUBMITTED_NO_MATCHES");
        setSavedRows([]);
      } else if (state.submitted && state.strongMatches.length > 0) {
        setScenario("READY");
        setSavedRows(eligible);
      } else {
        setScenario("NO_REQUEST");
        setSavedRows([]);
      }
    } catch (e) {
      console.error(e);
      setScenario("NO_REQUEST");
      setSavedRows([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const [typeFilter, setTypeFilter] = useState("All");
  const [sortBy, setSortBy] = useState("Compatibility");

  const visibleAnimals = useMemo(() => {
    let result = [...savedRows];
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
  }, [savedRows, sortBy, typeFilter]);

  const handleRemove = async (id) => {
    if (!userId) {
      return;
    }
    try {
      const api = getApiBaseUrl();
      const res = await fetch(
        `${api}/api/saved?userId=${userId}&animalId=${id}`,
        { method: "DELETE" }
      );
      if (!res.ok) {
        const t = await res.text();
        throw new Error(t || "Remove failed");
      }
      setSavedRows((prev) => prev.filter((animal) => animal.id !== id));
      showPopup({
        type: "warning",
        title: "Removed",
        message: "Animal removed from saved list."
      });
    } catch (err) {
      console.error(err);
      showPopup({
        type: "error",
        title: "Could not remove",
        message: "Please try again."
      });
    }
  };

  const goToAnimalDetail = (id) => {
    navigate(`/animal/${id}`);
  };

  const goToAdoptionRequest = () => {
    navigate("/adoption-request");
  };

  const goToCompatibleAnimals = () => {
    navigate("/compatible-animals");
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
            <h1>Keep track of animals you want to revisit later.</h1>
            <p>
              After you submit your adoption request, only animals with a
              compatibility score of {STRONG_MATCH_THRESHOLD}% or higher
              (inclusive) count as strong matches. Save those from your compatible
              list and manage them here.
            </p>
          </div>

          <div className="saved-animals-hero-right">
            <div className="saved-animals-hero-card">
              <span className="saved-animals-hero-badge">Adopter Space</span>
              <h3>Three steps to this page</h3>
              <p>
                Submit your request, unlock animals with scores of at least{" "}
                {STRONG_MATCH_THRESHOLD}% (inclusive), then save the ones you love
                from the compatible list.
              </p>
            </div>
          </div>
        </section>

        {scenario === "NO_REQUEST" &&
          gateCard(
            "Get started",
            "Create an adoption request first",
            `You have not started an adoption request yet. Saved animals appear after you submit a request and the platform finds animals with a compatibility score of ${STRONG_MATCH_THRESHOLD}% or higher (inclusive).`,
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
            "You have a draft adoption request. Submit it so we can calculate compatibility. Until then, saved animals stay locked.",
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
            `Your request is in, but right now there are no animals with a compatibility score of ${STRONG_MATCH_THRESHOLD}% or higher (inclusive). Check again later or adjust your preferences on the adoption form if needed.`,
            <>
              <button
                type="button"
                className="saved-animals-primary-btn"
                onClick={goToCompatibleAnimals}
              >
                View compatible animals
              </button>
            </>
          )}

        {scenario === "READY" && visibleAnimals.length === 0 && (
          <>
            {gateCard(
              "No saved animals yet",
              "You have matches — save some from the list",
              `Animals at ${STRONG_MATCH_THRESHOLD}% compatibility or higher are ready for you. Open compatible animals and tap save on any profile; they will show up here with filters and sorting.`,
              <>
                <button
                  type="button"
                  className="saved-animals-primary-btn"
                  onClick={goToCompatibleAnimals}
                >
                  Browse compatible animals
                </button>
              </>
            )}
          </>
        )}

        {scenario === "READY" && visibleAnimals.length > 0 && (
          <>
            <section className="saved-animals-toolbar">
              <div className="saved-animals-toolbar-left">
                <label>
                  Type
                  <select
                    value={typeFilter}
                    onChange={(e) => setTypeFilter(e.target.value)}
                  >
                    <option value="All">All</option>
                    <option value="Dog">Dog</option>
                    <option value="Cat">Cat</option>
                    <option value="Rabbit">Rabbit</option>
                  </select>
                </label>

                <label>
                  Sort By
                  <select
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value)}
                  >
                    <option value="Compatibility">Compatibility</option>
                    <option value="Name">Name</option>
                  </select>
                </label>
              </div>

              <div className="saved-animals-toolbar-right">
                <span>{visibleAnimals.length} saved (≥{STRONG_MATCH_THRESHOLD}%)</span>
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
                      <div
                        className="saved-animal-image-placeholder"
                        aria-hidden="true"
                      />
                    )}
                    <span className="saved-animal-badge">
                      {animal.compatibility}% compatibility
                    </span>
                  </div>

                  <div className="saved-animal-content">
                    <div className="saved-animal-top">
                      <div>
                        <h3>{animal.name}</h3>
                        <p>
                          {animal.type} · {animal.breed}
                        </p>
                      </div>
                    </div>

                    <div className="saved-animal-meta">
                      <span>{animal.age}</span>
                      <span>{animal.size}</span>
                      <span>{animal.energy} Energy</span>
                    </div>

                    <div className="saved-animal-actions">
                      <button
                        type="button"
                        className="saved-animal-primary-btn"
                        onClick={() => goToAnimalDetail(animal.id)}
                      >
                        View Details
                      </button>

                      <button
                        type="button"
                        className="saved-animal-secondary-btn"
                        onClick={() => handleRemove(animal.id)}
                      >
                        Remove
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
