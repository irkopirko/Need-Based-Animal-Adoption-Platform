import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import "./AdopterHomePage.css";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import animalSlide1 from "../images/animalSlide1.jpg";
import animalSlide2 from "../images/animalSlide2.jpg";
import animalSlide3 from "../images/animalSlide3.jpg";
import animalSlide4 from "../images/animalSlide4.jpg";
import animalSlide5 from "../images/animalSlide5.jpg";
import animalSlide6 from "../images/animalSlide6.jpg";
import animalSlide7 from "../images/animalSlide7.jpg";
import animalSlide8 from "../images/animalSlide8.jpg";
import animalSlide9 from "../images/animalSlide9.jpg";
import animalSlide10 from "../images/animalSlide10.jpg";
import animalSlide11 from "../images/animalSlide11.jpg";
import animalSlide12 from "../images/animalSlide12.jpg";
import animalSlide13 from "../images/animalSlide13.jpg";
import animalSlide14 from "../images/animalSlide14.jpg";
import animalSlide15 from "../images/animalSlide15.jpg";
import {
  broadcastStoredUserRefresh,
  getApiBaseUrl,
  getResolvedUserId,
  getStoredUser,
  normalizeRole
} from "../utils/auth";
import {
  loadAdopterHomeSummary,
  PAVIA_ADOPTER_HOME_SUMMARY_UPDATED,
  readAdopterHomeSummaryCache,
  summarizeAdoptionRequests
} from "../utils/adopterJourney";

function initialSummaryForUser() {
  const user = getStoredUser();
  const uid = getResolvedUserId(user);
  if (uid == null) {
    return null;
  }
  return readAdopterHomeSummaryCache(uid);
}

function AdopterHomePage() {
  const navigate = useNavigate();
  const [currentSlide, setCurrentSlide] = useState(0);
  const [summary, setSummary] = useState(initialSummaryForUser);
  const [summaryLoading, setSummaryLoading] = useState(() => !initialSummaryForUser());

  const slides = [
    animalSlide1,
    animalSlide2,
    animalSlide3,
    animalSlide4,
    animalSlide5,
    animalSlide6,
    animalSlide7,
    animalSlide8,
    animalSlide9,
    animalSlide10,
    animalSlide11,
    animalSlide12,
    animalSlide13,
    animalSlide14,
    animalSlide15
  ];

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % slides.length);
    }, 3000);

    return () => clearInterval(interval);
  }, [slides.length]);

  useEffect(() => {
    const user = getStoredUser();
    const uid = getResolvedUserId(user);
    if (uid == null || normalizeRole(user.role) !== "ADOPTER") {
      return undefined;
    }

    let cancelled = false;
    const apiBaseUrl = getApiBaseUrl();

    fetch(`${apiBaseUrl}/api/auth/profile/${uid}`)
      .then((res) => (res.ok ? res.json() : null))
      .then((profile) => {
        if (cancelled || !profile) {
          return;
        }
        const prev = getStoredUser() || {};
        localStorage.setItem(
          "paviaUser",
          JSON.stringify({
            ...prev,
            adopterProfileCompleted: profile.adopterProfileCompleted
          })
        );
        broadcastStoredUserRefresh();
        if (!profile.adopterProfileCompleted) {
          navigate("/complete-adopter-profile", { replace: true });
        }
      })
      .catch(() => {});

    const cached = readAdopterHomeSummaryCache(uid);
    if (cached && !cancelled) {
      setSummary(cached);
      setSummaryLoading(false);
    } else if (!cancelled) {
      setSummaryLoading(true);
    }

    loadAdopterHomeSummary(uid)
      .then((data) => {
        if (!cancelled) {
          setSummary(data);
        }
      })
      .finally(() => {
        if (!cancelled) {
          setSummaryLoading(false);
        }
      });

    const onSummaryUpdated = (event) => {
      const detailUid = Number(event?.detail?.userId);
      if (detailUid === uid && event.detail?.data && !cancelled) {
        setSummary(event.detail.data);
        setSummaryLoading(false);
      }
    };
    window.addEventListener(PAVIA_ADOPTER_HOME_SUMMARY_UPDATED, onSummaryUpdated);

    return () => {
      cancelled = true;
      window.removeEventListener(PAVIA_ADOPTER_HOME_SUMMARY_UPDATED, onSummaryUpdated);
    };
  }, [navigate]);

  const requests = summary?.requests || [];
  const submittedRequests = requests.filter(
    (r) => String(r.requestPhase || "").toUpperCase() === "SUBMITTED"
  );
  const { hasSubmitted, hasDraft, hasAny } = summarizeAdoptionRequests(requests);
  const localSubmitted =
    typeof window !== "undefined" &&
    localStorage.getItem("adoptionRequestCompleted") === "true";
  const submitted = hasSubmitted || (!hasAny && localSubmitted);
  const noRequest = !hasAny && !localSubmitted;
  const draftOnly = hasAny && hasDraft && !hasSubmitted && !localSubmitted;

  const goToAdoptionRequest = () => {
    navigate("/adoption-request");
  };

  const goToMyMatches = () => {
    navigate("/my-adoption-requests");
  };

  const goToSavedAnimals = () => {
    const primaryRid =
      summary?.primarySubmittedRequestId ??
      (submittedRequests.length === 1 ? submittedRequests[0].id : null);
    if (primaryRid != null) {
      navigate(
        `/saved-animals?requestId=${encodeURIComponent(String(primaryRid))}`
      );
      return;
    }
    navigate("/saved-animals");
  };

  const goToMessages = () => {
    navigate("/adopter-messages");
  };

  const handleRequestCardClick = () => {
    if (noRequest) {
      goToAdoptionRequest();
      return;
    }
    if (hasDraft && !hasSubmitted) {
      goToAdoptionRequest();
      return;
    }
    goToMyMatches();
  };

  const handleCompatibleCardClick = () => {
    if (!submitted) {
      goToAdoptionRequest();
      return;
    }
    const primaryRid =
      summary?.primarySubmittedRequestId ??
      (submittedRequests.length === 1 ? submittedRequests[0].id : null);
    if (primaryRid != null) {
      navigate(
        `/compatible-animals?requestId=${encodeURIComponent(String(primaryRid))}`
      );
      return;
    }
    navigate("/compatible-animals");
  };

  const handleSavedCardClick = () => {
    if (!submitted) {
      goToAdoptionRequest();
      return;
    }
    goToSavedAnimals();
  };

  const requestSummaryValue = () => {
    if (!summary && summaryLoading) {
      return "…";
    }
    if (noRequest) {
      return "Not started";
    }
    if (draftOnly) {
      return "Draft";
    }
    if (hasSubmitted) {
      const n = summary?.submittedRequestCount ?? submittedRequests.length;
      return n > 0 ? `${n} submitted` : "Submitted";
    }
    return "In progress";
  };

  const compatibleSummaryValue = () => {
    if (!summary && summaryLoading) {
      return "…";
    }
    if (noRequest || draftOnly || !submitted) {
      return "Locked";
    }
    const n = summary?.strongMatchCount ?? 0;
    return n > 0 ? `${n} matches` : "No matches yet";
  };

  const savedSummaryValue = () => {
    if (!summary && summaryLoading) {
      return "…";
    }
    if (!submitted) {
      return "Locked";
    }
    const n = summary?.savedCount ?? 0;
    return n > 0 ? `${n} saved` : "None yet";
  };

  const onSummaryKeyDown = (event, handler) => {
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      handler();
    }
  };

  return (
    <div className="adopter-page">
      <Navbar />

      <main className="adopter-main">
        <section className="adopter-hero">
          <div className="adopter-hero-left">
            <p className="adopter-hero-tag">Adopter Dashboard</p>

            <h1 className="adopter-hero-title">
              Your adoption journey
              <br />
              starts with a request,
              <br />
              not random browsing.
            </h1>

            <p className="adopter-hero-text">
              Many animals are still waiting for the right home. Complete your
              adoption request so Pavia can unlock more suitable matches based on
              your lifestyle, home, and expectations.
            </p>

            <div className="adopter-hero-buttons">
              <button
                type="button"
                className="adopter-primary-btn"
                onClick={goToAdoptionRequest}
              >
                Create Adoption Request
              </button>

              <button
                type="button"
                className="adopter-secondary-btn"
                onClick={goToMyMatches}
              >
                View my matches
              </button>
            </div>
          </div>

          <div className="adopter-hero-right">
            <div className="adopter-slider">
              <img
                src={slides[currentSlide]}
                alt="Animals waiting for adoption"
                className="adopter-slider-image"
              />

              <div className="adopter-slider-overlay">
                <span className="adopter-slider-badge">Waiting for a Home</span>
                <h3>15 animals could be one step closer to the right match</h3>
                <p>
                  Complete your adoption request to begin seeing compatible
                  animals through a more thoughtful process.
                </p>
              </div>

              <div className="adopter-slider-dots">
                {slides.map((_, index) => (
                  <span
                    key={index}
                    className={`adopter-dot ${index === currentSlide ? "active" : ""}`}
                  ></span>
                ))}
              </div>
            </div>
          </div>
        </section>

        <section className="adopter-summary-grid">
          <button
            type="button"
            className="adopter-summary-card adopter-summary-card-btn"
            onClick={handleRequestCardClick}
            onKeyDown={(e) => onSummaryKeyDown(e, handleRequestCardClick)}
            aria-label="Go to adoption requests"
          >
            <div className="adopter-summary-head">
              <span className="adopter-summary-label">Adoption Request</span>
              <span className="adopter-summary-mini-dot"></span>
            </div>
            <p className="adopter-summary-value">{requestSummaryValue()}</p>
            <span className="adopter-summary-note">
              {hasSubmitted
                ? "Tap to pick a request and view matches"
                : "Required before matching begins"}
            </span>
          </button>

          <button
            type="button"
            className="adopter-summary-card adopter-summary-card-btn"
            onClick={handleCompatibleCardClick}
            onKeyDown={(e) => onSummaryKeyDown(e, handleCompatibleCardClick)}
            aria-label="Go to compatible animals"
          >
            <div className="adopter-summary-head">
              <span className="adopter-summary-label">Compatible Animals</span>
              <span className="adopter-summary-mini-dot"></span>
            </div>
            <p className="adopter-summary-value">{compatibleSummaryValue()}</p>
            <span className="adopter-summary-note">
              {hasSubmitted
                ? submittedRequests.length > 1
                  ? "Pick a request, then view matches"
                  : "View strong matches for your request"
                : "Available after request submission"}
            </span>
          </button>

          <button
            type="button"
            className="adopter-summary-card adopter-summary-card-btn"
            onClick={handleSavedCardClick}
            onKeyDown={(e) => onSummaryKeyDown(e, handleSavedCardClick)}
            aria-label="Go to saved animals"
          >
            <div className="adopter-summary-head">
              <span className="adopter-summary-label">Saved Animals</span>
              <span className="adopter-summary-mini-dot"></span>
            </div>
            <p className="adopter-summary-value">{savedSummaryValue()}</p>
            <span className="adopter-summary-note">
              {hasSubmitted
                ? submittedRequests.length > 1
                  ? "Pick a request, then view saved animals"
                  : "Saved animals for your request"
                : "Unlocks after you submit a request"}
            </span>
          </button>
        </section>

        <section className="adopter-panel-grid">
          <div className="adopter-panel-card">
            <div className="adopter-panel-top">
              <div>
                <h2>Why this step comes first</h2>
                <p>
                  Pavia is designed to avoid random, appearance-based browsing.
                  Instead, it begins with structured adopter information so the
                  platform can support more suitable and responsible matches.
                </p>
              </div>
            </div>

            <div className="adopter-mini-points">
              <div className="adopter-mini-point">
                <span className="adopter-mini-point-dot"></span>
                <p>More compatibility-based matching</p>
              </div>

              <div className="adopter-mini-point">
                <span className="adopter-mini-point-dot"></span>
                <p>Fewer rushed or unsuitable choices</p>
              </div>

              <div className="adopter-mini-point">
                <span className="adopter-mini-point-dot"></span>
                <p>A more structured and transparent adoption flow</p>
              </div>
            </div>
          </div>

          <div className="adopter-panel-card">
            <div className="adopter-panel-top">
              <div>
                <h2>What your request includes</h2>
                <p>
                  Your request helps the platform understand your environment
                  before any animal becomes visible in your matching flow.
                </p>
              </div>
            </div>

            <div className="adopter-request-list">
              <div className="adopter-request-item">
                <strong>Home Conditions</strong>
                <p>Space, housing type, garden, and living environment</p>
              </div>

              <div className="adopter-request-item">
                <strong>Lifestyle Details</strong>
                <p>Routine, activity level, and time available at home</p>
              </div>

              <div className="adopter-request-item">
                <strong>Household & Preferences</strong>
                <p>Household structure and preferred animal characteristics</p>
              </div>
            </div>
          </div>
        </section>

        <section className="adopter-action-strip">
          <button
            type="button"
            className="adopter-action-card adopter-action-card-btn"
            onClick={handleRequestCardClick}
            aria-label="Adoption request"
          >
            <h3>Adoption request</h3>
            <p>Create, continue, or review your submitted requests.</p>
            <span className="adopter-action-card-cta">Open requests</span>
          </button>

          <button
            type="button"
            className="adopter-action-card adopter-action-card-btn"
            onClick={handleCompatibleCardClick}
            aria-label="Compatible animals"
          >
            <h3>Compatible animals</h3>
            <p>View listings that strongly match your submitted request.</p>
            <span className="adopter-action-card-cta">View matches</span>
          </button>

          <button
            type="button"
            className="adopter-action-card adopter-action-card-btn"
            onClick={handleSavedCardClick}
            aria-label="Saved animals"
          >
            <h3>Saved animals</h3>
            <p>Saved listings are organised under each submitted request.</p>
            <span className="adopter-action-card-cta">View saved</span>
          </button>

          <button
            type="button"
            className="adopter-action-card adopter-action-card-btn"
            onClick={goToMessages}
            aria-label="Messages"
          >
            <h3>Messages</h3>
            <p>Review your communication as the process moves forward.</p>
            <span className="adopter-action-card-cta">Open messages</span>
          </button>
        </section>
      </main>

      <Footer />
    </div>
  );
}

export default AdopterHomePage;
