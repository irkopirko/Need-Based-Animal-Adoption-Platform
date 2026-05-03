import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import "./CompatibleAnimalsPage.css";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import { usePopup } from "../components/PopupProvider";
import { getStoredUser, getApiBaseUrl } from "../utils/auth";
import {
  fetchUserAdoptionRequests,
  summarizeAdoptionRequests,
  STRONG_MATCH_THRESHOLD,
  resolveAnimalImageUrl
} from "../utils/adopterJourney";

function CompatibleAnimalsPage() {
  const navigate = useNavigate();
  const { showPopup } = usePopup();

  const [animals, setAnimals] = useState([]);
  const [savedIds, setSavedIds] = useState([]);
  const [typeFilter, setTypeFilter] = useState("All");
  const [sortBy, setSortBy] = useState("Highest Match");
  const [loading, setLoading] = useState(true);
  const [hasAdoptionRequest, setHasAdoptionRequest] = useState(false);

  useEffect(() => {
    let cancelled = false;

    const run = async () => {
      setLoading(true);
      const user = getStoredUser();
      let allowed =
        typeof window !== "undefined" &&
        localStorage.getItem("adoptionRequestCompleted") === "true";

      if (user?.userId) {
        const requests = await fetchUserAdoptionRequests(user.userId);
        const { hasSubmitted } = summarizeAdoptionRequests(requests);
        allowed = hasSubmitted || allowed;
      }

      if (cancelled) {
        return;
      }
      setHasAdoptionRequest(allowed);

      if (!allowed) {
        setAnimals([]);
        setLoading(false);
        return;
      }

      try {
        const response = await fetch(
          `${getApiBaseUrl()}/api/animals/compatible?threshold=${STRONG_MATCH_THRESHOLD}`
        );

        if (!response.ok) {
          throw new Error("Failed to fetch compatible animals");
        }

        const data = await response.json();
        const apiBase = getApiBaseUrl();
        const normalized = (Array.isArray(data) ? data : []).map((a) => {
          if (!a.images?.length) {
            return a;
          }
          const resolved = resolveAnimalImageUrl(a, apiBase);
          return { ...a, images: [resolved || a.images[0]] };
        });
        if (!cancelled) {
          setAnimals(normalized);
        }
      } catch (error) {
        console.error("Error fetching compatible animals:", error);
        if (!cancelled) {
          showPopup({
            type: "critical",
            title: "Loading Failed",
            message: "Compatible animals could not be loaded from backend."
          });
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    };

    run();
    return () => {
      cancelled = true;
    };
    // showPopup from context is stable; avoid re-fetch on identity change
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  let filteredAnimals = [...animals];

  if (typeFilter !== "All") {
    filteredAnimals = filteredAnimals.filter((animal) => animal.animalType === typeFilter);
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

  const handleSave = (animalId) => {
    if (savedIds.includes(animalId)) {
      setSavedIds(savedIds.filter((id) => id !== animalId));
      showPopup({
        type: "warning",
        title: "Removed From Saved",
        message: "Animal removed from your saved list."
      });
      return;
    }

    setSavedIds([...savedIds, animalId]);
    showPopup({
      type: "success",
      title: "Saved",
      message: "Animal added to your saved list."
    });
  };

  const goToAnimalDetail = (animalId) => {
    navigate(`/animal/${animalId}`);
  };

  const goToRequestForm = () => {
    navigate("/adoption-request");
  };

  const goToSavedAnimals = () => {
    navigate("/saved-animals");
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
            <button
              type="button"
              className="compatible-primary-btn"
              onClick={goToRequestForm}
            >
              Review Adoption Request
            </button>
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
            <h1 className="compatible-hero-title">
              Animals that fit
              <br />
              your lifestyle best.
            </h1>
            <p className="compatible-hero-text">
              These listings all have a compatibility score of at least{" "}
              {STRONG_MATCH_THRESHOLD}% (scores of {STRONG_MATCH_THRESHOLD}% and
              higher count as strong matches). Explore them in order of fit for
              your home and routine.
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
          </div>
        </section>

        <section className="compatible-grid">
          {filteredAnimals.map((animal) => (
            <article key={animal.id} className="compatible-card">
              <div className="compatible-card-image-wrap">
                <img
                  src={animal.images?.[0]}
                  alt={animal.name}
                  className="compatible-card-image"
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
                    onClick={() => goToAnimalDetail(animal.id)}
                  >
                    View Profile
                  </button>

                  <button
                    type="button"
                    className={`compatible-save-btn ${
                      savedIds.includes(animal.id)
                        ? "compatible-save-btn-active"
                        : ""
                    }`}
                    onClick={() => handleSave(animal.id)}
                  >
                    {savedIds.includes(animal.id) ? "Saved" : "Save"}
                  </button>
                </div>
              </div>
            </article>
          ))}
        </section>
      </main>

      <Footer />
    </div>
  );
}

export default CompatibleAnimalsPage;