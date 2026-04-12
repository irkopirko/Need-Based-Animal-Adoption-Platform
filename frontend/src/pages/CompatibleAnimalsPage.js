import React, { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import "./CompatibleAnimalsPage.css";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";

function CompatibleAnimalsPage() {
  const navigate = useNavigate();

  const [animals, setAnimals] = useState([]);
  const [savedIds, setSavedIds] = useState([]);
  const [typeFilter, setTypeFilter] = useState("All");
  const [sortBy, setSortBy] = useState("Highest Match");
  const [loading, setLoading] = useState(true);
  const [hasAdoptionRequest, setHasAdoptionRequest] = useState(true);

  useEffect(() => {
    const storedRequest = localStorage.getItem("adoptionRequestCompleted");
    setHasAdoptionRequest(storedRequest === "true");
  }, []);

  useEffect(() => {
    if (!hasAdoptionRequest) {
      setLoading(false);
      return;
    }

    const fetchCompatibleAnimals = async () => {
      try {
        const response = await fetch(
          "http://localhost:8080/api/animals/compatible?threshold=75"
        );

        if (!response.ok) {
          throw new Error("Failed to fetch compatible animals");
        }

        const data = await response.json();
        setAnimals(data);
      } catch (error) {
        console.error("Error fetching compatible animals:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchCompatibleAnimals();
  }, [hasAdoptionRequest]);

  const filteredAnimals = useMemo(() => {
    let result = [...animals];

    if (typeFilter !== "All") {
      result = result.filter((animal) => animal.animalType === typeFilter);
    }

    if (sortBy === "Highest Match") {
      result.sort(
        (a, b) => (b.compatibilityScore || 0) - (a.compatibilityScore || 0)
      );
    }

    if (sortBy === "Lowest Match") {
      result.sort(
        (a, b) => (a.compatibilityScore || 0) - (b.compatibilityScore || 0)
      );
    }

    if (sortBy === "Name") {
      result.sort((a, b) => a.name.localeCompare(b.name));
    }

    return result;
  }, [animals, sortBy, typeFilter]);

  const handleSave = (animalId) => {
    if (savedIds.includes(animalId)) {
      setSavedIds(savedIds.filter((id) => id !== animalId));
      return;
    }

    setSavedIds([...savedIds, animalId]);
  };

  const goToAnimalDetail = (animalId) => {
    navigate(`/animals/${animalId}`);
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
              calculate compatibility scores and show suitable animals.
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
            <h1>No animals passed the compatibility threshold</h1>
            <p>
              There are currently no dogs or cats matching your profile strongly
              enough. You can review your request later or wait for new listings.
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
              These dogs and cats passed the compatibility threshold based on
              your adoption request. Explore stronger matches first and focus on
              animals more likely to suit your home and routine.
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
                Only animals scoring 75% or above appear here. This helps reduce
                random browsing and makes the adoption flow more focused and
                meaningful.
              </p>

              <div className="compatible-highlight-stats">
                <div className="compatible-mini-stat">
                  <strong>{filteredAnimals.length}</strong>
                  <span>Visible Matches</span>
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
                  {animal.compatibilityScore || 0}% Match
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