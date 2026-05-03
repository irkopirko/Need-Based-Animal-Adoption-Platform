import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import "./AnimalDetailPage.css";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import { usePopup } from "../components/PopupProvider";
import {
  STRONG_MATCH_THRESHOLD,
  resolveAnimalImageUrl
} from "../utils/adopterJourney";
import { recordOwnerInquiry } from "../utils/ownerJourney";
import { getApiBaseUrl, getStoredUser, normalizeRole } from "../utils/auth";

function AnimalDetailPage() {
  const user = getStoredUser();
  const { id } = useParams();
  const navigate = useNavigate();
  const { showPopup } = usePopup();

  const [animal, setAnimal] = useState(null);
  const [selectedImage, setSelectedImage] = useState("");
  const [saved, setSaved] = useState(false);

  const role = normalizeRole(user?.role);
  const isOwner = role === "OWNER";
  const isAdopter = role === "ADOPTER";

  useEffect(() => {
    const fetchAnimal = async () => {
      try {
        const api = getApiBaseUrl();
        const response = await fetch(`${api}/api/animals/${id}`);
        const data = await response.json();
        setAnimal(data);
        const first = data.images?.[0];
        if (first) {
          setSelectedImage(resolveAnimalImageUrl(data, api) || first);
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

  const handleGetInContact = () => {
    if (!animal?.ownerId || !user?.userId) {
      showPopup({
        type: "error",
        title: "Cannot send",
        message: "Missing owner or account information."
      });
      return;
    }
    const adopterName =
      user.firstName ||
      user.fullName ||
      user.name ||
      user.email ||
      "Adopter";
    const res = recordOwnerInquiry({
      ownerId: animal.ownerId,
      adopterUserId: user.userId,
      adopterName,
      animalId: animal.id,
      animalName: animal.name,
      summary: `Interested in ${animal.name} — sent from animal profile.`
    });
    if (!res.ok) {
      if (res.error === "duplicate") {
        showPopup({
          type: "warning",
          title: "Already sent",
          message: "You already sent an inquiry for this animal."
        });
        return;
      }
      showPopup({
        type: "error",
        title: "Could not send",
        message: res.error || "Try again."
      });
      return;
    }
    showPopup({
      type: "success",
      title: "Inquiry sent",
      message: "The owner can see this under Manage requests and Messages."
    });
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
                    {Math.round(animal.compatibilityScore ?? 0)}% compatibility
                  </span>
                )}
              </div>
            </div>

            <div className="animal-detail-gallery">
              {(animal.images || []).map((img, index) => {
                const api = getApiBaseUrl();
                const resolved =
                  resolveAnimalImageUrl({ images: [img] }, api) || img;
                return (
                  <img
                    key={index}
                    src={resolved}
                    alt={`Animal ${index}`}
                    className={`animal-detail-gallery-item ${
                      selectedImage === resolved ? "active" : ""
                    }`}
                    onClick={() => setSelectedImage(resolved)}
                  />
                );
              })}
            </div>
          </div>

          <div className="animal-detail-hero-right">
            <h1>{animal.name}</h1>
            <p className="animal-breed">
              {animal.breed} • {animal.animalType}
            </p>

            {isAdopter && animal.compatibilityScore != null && (
              <p className="animal-compatibility-threshold-note">
                {(animal.compatibilityScore ?? 0) >= STRONG_MATCH_THRESHOLD
                  ? `Strong match — ${Math.round(
                      animal.compatibilityScore
                    )}% compatibility (platform uses ≥ ${STRONG_MATCH_THRESHOLD}%, inclusive).`
                  : `${Math.round(
                      animal.compatibilityScore
                    )}% compatibility — below the strong-match cutoff (≥ ${STRONG_MATCH_THRESHOLD}%, inclusive).`}
              </p>
            )}

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
                  {animal.ownerId != null &&
                    animal.compatibilityScore != null &&
                    Math.round(animal.compatibilityScore) >=
                      STRONG_MATCH_THRESHOLD && (
                      <button
                        type="button"
                        className="secondary-btn animal-detail-contact-btn"
                        onClick={handleGetInContact}
                      >
                        Get in contact with owner
                      </button>
                    )}
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