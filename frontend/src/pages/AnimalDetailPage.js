import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import "./AnimalDetailPage.css";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import ReportListingModal from "../components/ReportListingModal";
import ContactOwnerModal from "../components/ContactOwnerModal";
import SaveHeartButton from "../components/SaveHeartButton";
import { usePopup } from "../components/PopupProvider";
import {
  STRONG_MATCH_THRESHOLD,
  resolveMediaUrl
} from "../utils/adopterJourney";
import {
  getApiBaseUrl,
  getResolvedUserId,
  getStoredUser,
  normalizeRole
} from "../utils/auth";
import {
  fetchSavedAnimalIds,
  formatListingCode,
  saveAnimalForUser,
  unsaveAnimalForUser
} from "../utils/platformApi";

function AnimalDetailPage() {
  const user = getStoredUser();
  const { id } = useParams();
  const navigate = useNavigate();
  const { showPopup } = usePopup();

  const [animal, setAnimal] = useState(null);
  const [selectedImage, setSelectedImage] = useState("");
  const [saved, setSaved] = useState(false);
  const [reportOpen, setReportOpen] = useState(false);
  const [contactOpen, setContactOpen] = useState(false);

  const role = normalizeRole(user?.role);
  const isOwner = role === "OWNER";
  const isAdopter = role === "ADOPTER";
  const adopterUid = getResolvedUserId(user);

  useEffect(() => {
    const fetchAnimal = async () => {
      try {
        const api = getApiBaseUrl();
        const response = await fetch(`${api}/api/animals/${id}`);
        const data = await response.json();
        setAnimal(data);
        const imgs = Array.isArray(data.images) ? data.images.filter(Boolean) : [];
        setSelectedImage(imgs.length > 0 ? resolveMediaUrl(imgs[0], api) || "" : "");
      } catch (error) {
        console.error("Error fetching animal:", error);
      }
    };

    fetchAnimal();
  }, [id]);

  useEffect(() => {
    if (!isAdopter || adopterUid == null || !animal?.id) {
      return;
    }
    let cancelled = false;
    fetchSavedAnimalIds(adopterUid)
      .then((ids) => {
        if (!cancelled) {
          setSaved(ids.includes(Number(animal.id)));
        }
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, [isAdopter, adopterUid, animal?.id]);

  const handleSave = async () => {
    if (adopterUid == null || !animal?.id) {
      return;
    }
    try {
      if (saved) {
        await unsaveAnimalForUser(adopterUid, animal.id);
        setSaved(false);
        showPopup({
          type: "info",
          title: "Removed",
          message: "Removed from saved animals."
        });
      } else {
        await saveAnimalForUser(adopterUid, animal.id);
        setSaved(true);
        showPopup({
          type: "success",
          title: "Saved",
          message: "Animal added to your saved list."
        });
      }
    } catch (e) {
      showPopup({
        type: "error",
        title: "Could not update",
        message: e.message || "Try again."
      });
    }
  };

  const isStrongMatch =
    animal?.compatibilityScore != null &&
    Math.round(animal.compatibilityScore) >= STRONG_MATCH_THRESHOLD;

  if (!animal) {
    return <div className="loading">Loading...</div>;
  }

  const apiBase = getApiBaseUrl();
  const listingCode = formatListingCode(animal);

  return (
    <div className="animal-detail-page">
      <Navbar />

      <main className="animal-detail-main">
        <section className="animal-detail-hero">
          <div className="animal-detail-hero-left">
            <div className="animal-detail-main-image-wrap">
              {selectedImage ? (
                <img
                  src={selectedImage}
                  alt={animal.name}
                  className="animal-detail-main-image"
                />
              ) : (
                <div
                  className="animal-detail-main-image-placeholder"
                  role="img"
                  aria-label="No photo available"
                >
                  No photo
                </div>
              )}
              {isAdopter && (
                <SaveHeartButton saved={saved} onClick={handleSave} />
              )}
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
                const resolved = resolveMediaUrl(img, apiBase) || "";
                if (!resolved) {
                  return null;
                }
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
            {listingCode && (
              <p className="animal-listing-code" title="Listing ID">
                {listingCode}
              </p>
            )}
            <h1>{animal.name}</h1>
            <p className="animal-breed">
              {animal.breed} • {animal.animalType}
            </p>

            {isAdopter && animal.compatibilityScore != null && (
              <p className="animal-compatibility-threshold-note">
                {isStrongMatch
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
                  {animal.ownerId != null && isStrongMatch && (
                    <button
                      type="button"
                      className="secondary-btn animal-detail-contact-btn"
                      onClick={() => setContactOpen(true)}
                    >
                      Contact owner
                    </button>
                  )}
                  <button type="button" className="secondary-btn" onClick={handleSave}>
                    {saved ? "Saved ✓" : "Save animal"}
                  </button>
                  <button
                    type="button"
                    className="secondary-btn animal-detail-report-btn"
                    onClick={() => setReportOpen(true)}
                  >
                    Report listing
                  </button>
                </>
              )}

              {isOwner && (
                <>
                  <button
                    className="primary-btn"
                    onClick={() => navigate(`/register-animal?edit=${animal.id}`)}
                  >
                    Edit Listing
                  </button>
                  <button
                    className="secondary-btn"
                    onClick={() => navigate(`/animal/${animal.id}/requests`)}
                  >
                    Manage Requests
                  </button>
                  <button
                    className="secondary-btn"
                    onClick={() => navigate("/owner-messages")}
                  >
                    Inquiries
                  </button>
                </>
              )}
            </div>
          </div>
        </section>
      </main>

      <ReportListingModal
        open={reportOpen}
        onClose={() => setReportOpen(false)}
        animalId={Number(animal.id)}
        reporterUserId={adopterUid}
      />
      <ContactOwnerModal
        open={contactOpen}
        onClose={() => setContactOpen(false)}
        animal={animal}
        adopterUserId={adopterUid}
      />

      <Footer />
    </div>
  );
}

export default AnimalDetailPage;
