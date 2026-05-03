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
  getStoredUser,
  normalizeRole
} from "../utils/auth";

function AdopterHomePage() {
  const navigate = useNavigate();
  const [currentSlide, setCurrentSlide] = useState(0);

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
    if (!user?.userId || normalizeRole(user.role) !== "ADOPTER") {
      return undefined;
    }

    let cancelled = false;
    const apiBaseUrl = getApiBaseUrl();

    fetch(`${apiBaseUrl}/api/auth/profile/${user.userId}`)
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

    return () => {
      cancelled = true;
    };
  }, [navigate]);

  const goToAdoptionRequest = () => {
    navigate("/adoption-request");
  };

  const goToSavedAnimals = () => {
    navigate("/saved-animals");
  };

  const goToMessages = () => {
    navigate("/adopter-messages");
  };

  const goToMatches = ()  => {
    navigate("/matches");
    
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
                onClick={goToMatches}
              >
                View Compatible Animals
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
          <div className="adopter-summary-card">
            <div className="adopter-summary-head">
              <span className="adopter-summary-label">Adoption Request</span>
              <span className="adopter-summary-mini-dot"></span>
            </div>
            <p className="adopter-summary-value">Not Started</p>
            <span className="adopter-summary-note">Required before matching begins</span>
          </div>

          <div className="adopter-summary-card">
            <div className="adopter-summary-head">
              <span className="adopter-summary-label">Compatible Animals</span>
              <span className="adopter-summary-mini-dot"></span>
            </div>
            <p className="adopter-summary-value">Locked</p>
            <span className="adopter-summary-note">Available after request completion</span>
          </div>

          <div className="adopter-summary-card">
            <div className="adopter-summary-head">
              <span className="adopter-summary-label">Saved Animals</span>
              <span className="adopter-summary-mini-dot"></span>
            </div>
            <p className="adopter-summary-value">Pending</p>
            <span className="adopter-summary-note">Starts once matching is active</span>
          </div>
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
          <div className="adopter-action-card">
            <h3>Start your request</h3>
            <p>Complete the required flow so matching can begin.</p>
            <button type="button" onClick={goToAdoptionRequest}>
              Create Adoption Request
            </button>
          </div>

          <div className="adopter-action-card">
            <h3>Saved animals</h3>
            <p>Access saved animals after compatible matches are unlocked.</p>
            <button type="button" onClick={goToSavedAnimals}>
              View Saved Animals
            </button>
          </div>

          <div className="adopter-action-card">
            <h3>Messages</h3>
            <p>Review your communication as the process moves forward.</p>
            <button type="button" onClick={goToMessages}>
              Open Messages
            </button>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}

export default AdopterHomePage;