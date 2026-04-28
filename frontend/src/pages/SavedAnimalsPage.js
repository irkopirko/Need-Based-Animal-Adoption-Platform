import React, { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import "./SavedAnimalsPage.css";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import animalSlide1 from "../images/animalSlide1.jpg";
import animalSlide2 from "../images/animalSlide2.jpg";
import animalSlide3 from "../images/animalSlide3.jpg";
import animalSlide4 from "../images/animalSlide4.jpg";

function SavedAnimalsPage() {
  const navigate = useNavigate();

  const [adoptionRequestExists] = useState(false);
  const [savedAnimals, setSavedAnimals] = useState([
    {
      id: 1,
      name: "Luna",
      type: "Dog",
      breed: "Golden Retriever",
      age: "2 years",
      size: "Large",
      energy: "Medium",
      compatibility: 92,
      image: animalSlide1
    },
    {
      id: 2,
      name: "Milo",
      type: "Cat",
      breed: "British Shorthair",
      age: "1 year",
      size: "Small",
      energy: "Low",
      compatibility: 89,
      image: animalSlide2
    },
    {
      id: 3,
      name: "Daisy",
      type: "Dog",
      breed: "Mixed Breed",
      age: "3 years",
      size: "Medium",
      energy: "Medium",
      compatibility: 87,
      image: animalSlide3
    },
    {
      id: 4,
      name: "Nala",
      type: "Cat",
      breed: "Tabby",
      age: "8 months",
      size: "Small",
      energy: "High",
      compatibility: 85,
      image: animalSlide4
    }
  ]);

  const [typeFilter, setTypeFilter] = useState("All");
  const [sortBy, setSortBy] = useState("Compatibility");

  const visibleAnimals = useMemo(() => {
    if (!adoptionRequestExists) {
      return [];
    }

    let result = [...savedAnimals];

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
  }, [adoptionRequestExists, savedAnimals, sortBy, typeFilter]);

  const handleRemove = (id) => {
    setSavedAnimals((prev) => prev.filter((animal) => animal.id !== id));
  };

  const goToAnimalDetail = (id) => {
    navigate(`/animal/${id}`);
  };

  const goToAdoptionRequest = () => {
    navigate("/adoption-request");
  };

  const goToCompatibleAnimals = () => {
    navigate("/adopterhomepage");
  };

  return (
    <div className="saved-animals-page">
      <Navbar />

      <main className="saved-animals-main">
        <section className="saved-animals-hero">
          <div className="saved-animals-hero-left">
            <p className="saved-animals-tag">Saved Animals</p>
            <h1>Keep track of animals you want to revisit later.</h1>
            <p>
              This page only becomes active after your adoption request is
              completed and compatible animals start appearing in your matching
              flow.
            </p>
          </div>

          <div className="saved-animals-hero-right">
            <div className="saved-animals-hero-card">
              <span className="saved-animals-hero-badge">Adopter Space</span>
              <h3>Saved animals come after matching begins</h3>
              <p>
                You can only save animals after your adoption request is created
                and compatible matches are unlocked by the platform.
              </p>
            </div>
          </div>
        </section>

        {!adoptionRequestExists && (
          <section className="saved-animals-empty-shell">
            <div className="saved-animals-empty-card locked">
              <span className="saved-animals-empty-badge">Locked</span>
              <h2>Complete your adoption request first</h2>
              <p>
                Saved animals are not available until you submit your adoption
                request. Once the platform starts generating compatible matches,
                you will be able to save animals from that list here.
              </p>
              <div className="saved-animals-empty-actions">
                <button
                  type="button"
                  className="saved-animals-primary-btn"
                  onClick={goToAdoptionRequest}
                >
                  Create Adoption Request
                </button>
              </div>
            </div>
          </section>
        )}

        {adoptionRequestExists && visibleAnimals.length === 0 && (
          <section className="saved-animals-empty-shell">
            <div className="saved-animals-empty-card">
              <span className="saved-animals-empty-badge">No Saved Animals Yet</span>
              <h2>Your saved list is still empty</h2>
              <p>
                You already have an adoption request, but you have not saved any
                compatible animals yet. Once you begin reviewing your matches,
                you can add animals to this list and compare them later.
              </p>
              <div className="saved-animals-empty-actions">
                <button
                  type="button"
                  className="saved-animals-primary-btn"
                  onClick={goToCompatibleAnimals}
                >
                  View Compatible Animals
                </button>
              </div>
            </div>
          </section>
        )}

        {adoptionRequestExists && visibleAnimals.length > 0 && (
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
                <span>{visibleAnimals.length} saved animals</span>
              </div>
            </section>

            <section className="saved-animals-grid">
              {visibleAnimals.map((animal) => (
                <div key={animal.id} className="saved-animal-card">
                  <div className="saved-animal-image-wrap">
                    <img
                      src={animal.image}
                      alt={animal.name}
                      className="saved-animal-image"
                    />
                    <span className="saved-animal-badge">
                      {animal.compatibility}% Match
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