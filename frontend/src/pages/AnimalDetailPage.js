import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import "./AnimalDetailPage.css";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";

function AnimalDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [animal, setAnimal] = useState(null);
  const [selectedImage, setSelectedImage] = useState("");
  const [saved, setSaved] = useState(false);

   const user = getStoredUser();
    const isOwner = user?.role === "OWNER";
    const isAdopter = user?.role === "ADOPTER";

  useEffect(() => {
    const fetchAnimal = async () => {
      try {
        const response = await fetch(
          `http://localhost:8080/api/animals/${id}`
        );
        const data = await response.json();
        setAnimal(data);
        if (data.images && data.images.length > 0) {
          setSelectedImage(data.images[0]);
        }
      } catch (error) {
        console.error("Error fetching animal:", error);
      }
    };

    fetchAnimal();
  }, [id]);

  const handleSave = () => {
    setSaved(!saved);
  };

  if (!animal) {
    return <div className="loading">Loading...</div>;
  }

  return (
    <div className="animal-detail-page">
      <Navbar />

      <main className="animal-detail-main">
        <section className="animal-detail-hero">
          <div className="animal-detail-hero-left">
            <div className="animal-detail-main-image-wrap">
              <img
                src={selectedImage}
                alt={animal.name}
                className="animal-detail-main-image"
              />
              <div className="animal-detail-image-topbar">
                <span className="animal-detail-status-badge">
                  {animal.listingStatus || "Active"}
                </span>
                {isAdopter && (
                  <span className="animal-detail-score-badge">
                    {animal.compatibilityScore || 0}% Match
                  </span>
                )}
              </div>
            </div>

            <div className="animal-detail-gallery">
              {animal.images.map((img, index) => (
                <img
                  key={index}
                  src={img}
                  alt={`Animal ${index}`}
                  className={`animal-detail-gallery-item ${
                    selectedImage === img ? "active" : ""
                  }`}
                  onClick={() => setSelectedImage(img)}
                />
              ))}
            </div>
          </div>

          <div className="animal-detail-hero-right">
            <h1>{animal.name}</h1>
            <p className="animal-breed">
              {animal.breed} • {animal.animalType}
            </p>

            <div className="animal-info-grid">
              <div><strong>Age:</strong> {animal.ageGroup}</div>
              <div><strong>Size:</strong> {animal.size}</div>
              <div><strong>Energy Level:</strong> {animal.energyLevel}</div>
              <div><strong>Grooming:</strong> {animal.groomingNeed}</div>
              <div><strong>Special Needs:</strong> {animal.specialNeeds}</div>
              <div><strong>Good with Children:</strong> {animal.goodWithChildren}</div>
            </div>

            <p className="animal-description">{animal.description}</p>

            <div className="animal-actions">
              {isAdopter && (
                <>
                  <button
                    className="primary-btn"
                    onClick={() => navigate("/adoption-request")}
                  >
                    Send Adoption Request
                  </button>
                  <button className="secondary-btn" onClick={handleSave}>
                    {saved ? "Saved ✓" : "Save Animal"}
                  </button>
                </>
              )}

              {isOwner && (
                <>
                  <button
                    className="primary-btn"
                    onClick={() => navigate(`/listing/${animal.id}`)}
                  >
                    Edit Listing
                  </button>
                  <button
                    className="secondary-btn"
                    onClick={() => navigate("/owner-requests")}
                  >
                    Manage Requests
                  </button>
                </>
              )}
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}

export default AnimalDetailPage;