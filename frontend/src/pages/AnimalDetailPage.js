import React, { useEffect, useMemo, useState } from "react";
import { useParams, useNavigate, useSearchParams } from "react-router-dom";
import "./AnimalDetailPage.css";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import ReportListingModal from "../components/ReportListingModal";
import ContactOwnerModal from "../components/ContactOwnerModal";
import ListingReportButton from "../components/ListingReportButton";
import ListingImageLightbox from "../components/ListingImageLightbox";
import ListingPhotoFrame from "../components/ListingPhotoFrame";
import SaveHeartButton from "../components/SaveHeartButton";
import { usePopup } from "../components/PopupProvider";
import {
  STRONG_MATCH_THRESHOLD,
  resolveMediaUrl,
  fetchStrongMatchAnimals
} from "../utils/adopterJourney";
import {
  getApiBaseUrl,
  getResolvedUserId,
  getStoredUser,
  normalizeRole
} from "../utils/auth";
import {
  deleteOwnerListing,
  fetchSavedAnimalIds,
  formatListingCode,
  saveAnimalForUser,
  unsaveAnimalForUser
} from "../utils/platformApi";
import { formatAnimalGenderLabel, formatListedDate } from "../utils/listingDisplay";

function titleCase(value) {
  if (!value) return "";
  const t = String(value).toLowerCase().replace(/_/g, " ");
  return t.charAt(0).toUpperCase() + t.slice(1);
}

function AnimalDetailPage() {
  const user = getStoredUser();
  const { id } = useParams();
  const [searchParams] = useSearchParams();
  const requestIdFromUrl = searchParams.get("requestId");
  const navigate = useNavigate();
  const { showPopup, showConfirm } = usePopup();

  const [animal, setAnimal] = useState(null);
  const [imageIndex, setImageIndex] = useState(0);
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [saved, setSaved] = useState(false);
  const [reportOpen, setReportOpen] = useState(false);
  const [contactOpen, setContactOpen] = useState(false);
  const role = normalizeRole(user?.role);
  const isOwner = role === "OWNER";
  const isAdopter = role === "ADOPTER";
  const viewerUid = getResolvedUserId(user);
  const adopterUid = viewerUid;

  useEffect(() => {
    const fetchAnimal = async () => {
      try {
        const api = getApiBaseUrl();
        const response = await fetch(`${api}/api/animals/${id}`);
        const data = await response.json();
        let merged = { ...data };

        if (isAdopter && adopterUid != null) {
          const rid =
            requestIdFromUrl != null && /^\d+$/.test(String(requestIdFromUrl).trim())
              ? Number(requestIdFromUrl)
              : null;
          try {
            const matches = await fetchStrongMatchAnimals(adopterUid, rid);
            const row = matches.find((m) => Number(m.id) === Number(data.id));
            if (row?.compatibilityScore != null) {
              merged = {
                ...merged,
                compatibilityScore: row.compatibilityScore
              };
            }
          } catch {
            /* keep DB score if any */
          }
        }

        setAnimal(merged);
        setImageIndex(0);
      } catch (error) {
        console.error("Error fetching animal:", error);
      }
    };

    fetchAnimal();
  }, [id, isAdopter, adopterUid, requestIdFromUrl]);

  const apiBase = getApiBaseUrl();

  const galleryUrls = useMemo(() => {
    if (!animal?.images) {
      return [];
    }
    return animal.images
      .map((img) => resolveMediaUrl(img, apiBase))
      .filter(Boolean);
  }, [animal, apiBase]);

  const hasMultipleImages = galleryUrls.length > 1;

  const goPrevImage = () => {
    if (galleryUrls.length === 0) {
      return;
    }
    setImageIndex((i) => (i - 1 + galleryUrls.length) % galleryUrls.length);
  };

  const goNextImage = () => {
    if (galleryUrls.length === 0) {
      return;
    }
    setImageIndex((i) => (i + 1) % galleryUrls.length);
  };

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

  const handleSave = async (e) => {
    e?.stopPropagation?.();
    if (adopterUid == null || !animal?.id) {
      showPopup({
        type: "warning",
        title: "Sign in required",
        message: "Log in as an adopter to save animals."
      });
      return;
    }
    const animalId = Number(animal.id);
    const rid =
      requestIdFromUrl != null && /^\d+$/.test(String(requestIdFromUrl).trim())
        ? Number(requestIdFromUrl)
        : null;
    const nextSaved = !saved;
    try {
      if (nextSaved) {
        await saveAnimalForUser(adopterUid, animalId, rid);
        setSaved(true);
        showPopup({
          type: "success",
          title: "Saved",
          message: "Animal added to your saved list."
        });
      } else {
        await unsaveAnimalForUser(adopterUid, animalId);
        setSaved(false);
        showPopup({
          type: "info",
          title: "Removed",
          message: "Animal removed from your saved list."
        });
      }
    } catch (err) {
      showPopup({
        type: "error",
        title: "Could not update",
        message: err?.message || "Try again."
      });
    }
  };

  const compatibilityScore =
    animal?.compatibilityScore != null ? Math.round(animal.compatibilityScore) : null;

  const isStrongMatch =
    compatibilityScore != null && compatibilityScore >= STRONG_MATCH_THRESHOLD;

  const isListingOwner =
    isOwner &&
    animal?.ownerId != null &&
    viewerUid != null &&
    Number(animal.ownerId) === Number(viewerUid);

  const promptDeleteListing = () => {
    if (!animal?.id || viewerUid == null) {
      return;
    }
    const name = animal.name || "this animal";
    showConfirm({
      type: "critical",
      title: "Are you sure?",
      message: `This will permanently delete ${name}'s listing from Pavia. You will not be able to undo this.`,
      confirmLabel: "Yes, delete",
      cancelLabel: "No",
      confirmDanger: true,
      onConfirm: async () => {
        try {
          await deleteOwnerListing(animal.id, viewerUid);
          showPopup({
            type: "success",
            title: "Listing deleted",
            message:
              "The listing was removed successfully. A confirmation email was sent to your account."
          });
          navigate("/owner-listings", { replace: true });
        } catch (err) {
          showPopup({
            type: "error",
            title: "Could not delete",
            message: err?.message || "The listing was not removed."
          });
          throw err;
        }
      }
    });
  };

  if (!animal) {
    return <div className="loading">Loading...</div>;
  }

  const listingCode = formatListingCode(animal);

  return (
    <div className="animal-detail-page">
      <Navbar />

      <main className="animal-detail-main">
        <section className="animal-detail-hero">
          <div className="animal-detail-hero-left">
            <div className="animal-detail-main-image-wrap">
              <ListingPhotoFrame
                urls={galleryUrls}
                activeIndex={imageIndex}
                onOpenLightbox={
                  galleryUrls.length > 0 ? () => setLightboxOpen(true) : undefined
                }
                variant="detail"
                expandHint={`View full size photo of ${animal.name}`}
                emptyLabel="No photo"
              />

              {hasMultipleImages && (
                <>
                  <button
                    type="button"
                    className="animal-detail-gallery-nav animal-detail-gallery-nav-prev"
                    onClick={goPrevImage}
                    aria-label="Previous photo"
                  >
                    ‹
                  </button>
                  <button
                    type="button"
                    className="animal-detail-gallery-nav animal-detail-gallery-nav-next"
                    onClick={goNextImage}
                    aria-label="Next photo"
                  >
                    ›
                  </button>
                </>
              )}

              {isAdopter && (
                <SaveHeartButton
                  className="animal-detail-save-heart"
                  saved={saved}
                  onClick={(e) => handleSave(e)}
                />
              )}

              <div className="animal-detail-image-topbar">
                <span className="animal-detail-status-badge">
                  {animal.listingStatus || "Active"}
                </span>
                {isAdopter && compatibilityScore != null && (
                  <span className="animal-detail-score-badge">
                    {compatibilityScore}% compatibility
                  </span>
                )}
              </div>

              {hasMultipleImages && (
                <span className="animal-detail-image-counter" aria-live="polite">
                  {imageIndex + 1} / {galleryUrls.length}
                </span>
              )}
            </div>

            {galleryUrls.length > 1 && (
              <div className="animal-detail-gallery">
                {galleryUrls.map((resolved, index) => (
                  <button
                    key={resolved}
                    type="button"
                    className={`animal-detail-gallery-thumb ${
                      index === imageIndex ? "active" : ""
                    }`}
                    onClick={() => setImageIndex(index)}
                    aria-label={`Show photo ${index + 1}`}
                  >
                    <img src={resolved} alt="" />
                  </button>
                ))}
              </div>
            )}

            {lightboxOpen && (
              <ListingImageLightbox
                urls={galleryUrls}
                startIndex={imageIndex}
                onClose={() => setLightboxOpen(false)}
                title={animal.name || "Listing photo"}
              />
            )}
          </div>

          <div className="animal-detail-hero-right">
            {isAdopter && (
              <div className="animal-detail-panel-report">
                <ListingReportButton
                  variant="panel"
                  tooltip="Report listing"
                  onClick={() => setReportOpen(true)}
                />
              </div>
            )}

            <div className="animal-detail-panel-body">
              {listingCode && (
                <p className="animal-listing-code" title="Listing ID">
                  {listingCode}
                </p>
              )}
              <h1>{animal.name}</h1>
              <p className="animal-breed">
                {animal.breed} • {titleCase(animal.animalType)}
              </p>

              {animal.registerTime && (
                <p className="animal-listed-date">
                  Listed on{" "}
                  <time dateTime={String(animal.registerTime)}>
                    {formatListedDate(animal.registerTime)}
                  </time>
                </p>
              )}

              {isAdopter && compatibilityScore != null && (
                <p className="animal-compatibility-threshold-note">
                  {isStrongMatch
                    ? `Strong match — ${compatibilityScore}% compatibility (platform uses ≥ ${STRONG_MATCH_THRESHOLD}%, inclusive).`
                    : `${compatibilityScore}% compatibility — below the strong-match cutoff (≥ ${STRONG_MATCH_THRESHOLD}%, inclusive).`}
                </p>
              )}

              <div className="animal-info-grid">
                <div>
                  <strong>Gender:</strong>{" "}
                  {formatAnimalGenderLabel(animal.gender) || "—"}
                </div>
                <div><strong>Age:</strong> {titleCase(animal.ageGroup)}</div>
                <div><strong>Size:</strong> {titleCase(animal.size)}</div>
                <div><strong>Energy Level:</strong> {titleCase(animal.energyLevel)}</div>
                <div><strong>Grooming:</strong> {titleCase(animal.groomingNeed)}</div>
                <div><strong>Special Needs:</strong> {titleCase(animal.specialNeeds)}</div>
                <div>
                  <strong>Good with Children:</strong> {titleCase(animal.goodWithChildren)}
                </div>
              </div>

              <p className="animal-description">{animal.description}</p>
            </div>

            {isAdopter && animal.ownerId != null && isStrongMatch && (
              <div className="animal-detail-panel-actions">
                <button
                  type="button"
                  className="primary-btn animal-detail-btn-contact"
                  onClick={() => setContactOpen(true)}
                >
                  Message owner
                </button>
              </div>
            )}

            {isListingOwner && (
              <div className="animal-detail-panel-actions animal-detail-panel-actions-owner">
                <button
                  type="button"
                  className="animal-detail-owner-btn"
                  onClick={() => navigate(`/register-animal?edit=${animal.id}`)}
                >
                  Edit listing
                </button>
                <button
                  type="button"
                  className="animal-detail-owner-btn"
                  onClick={() => navigate(`/animal/${animal.id}/requests`)}
                >
                  Manage requests
                </button>
                <button
                  type="button"
                  className="animal-detail-owner-btn"
                  onClick={() => navigate(`/owner-messages?animalId=${animal.id}`)}
                >
                  Messages
                </button>
                <button
                  type="button"
                  className="animal-detail-owner-btn animal-detail-owner-btn--delete"
                  onClick={promptDeleteListing}
                >
                  Delete listing
                </button>
              </div>
            )}
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
        onClose={(sent) => {
          setContactOpen(false);
          if (sent) {
            navigate("/adopter-messages");
          }
        }}
        animal={animal}
        adopterUserId={adopterUid}
      />

      <Footer />
    </div>
  );
}

export default AnimalDetailPage;
