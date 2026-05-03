import React, { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import "./OwnerHomePage.css";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import ownerHomeHeroImage from "../images/ownerHomeHeroImage.jpg";
import { getApiBaseUrl, getStoredUser, normalizeRole } from "../utils/auth";

function OwnerHomePage() {
  const navigate = useNavigate();

  useEffect(() => {
    const stored = getStoredUser();
    if (!stored?.userId || normalizeRole(stored.role) !== "OWNER") {
      return;
    }
    const apiBaseUrl = getApiBaseUrl();
    fetch(`${apiBaseUrl}/api/auth/profile/${stored.userId}`)
      .then((res) => (res.ok ? res.json() : null))
      .then((profile) => {
        if (profile && profile.ownerProfileCompleted === false) {
          navigate("/complete-owner-profile", { replace: true });
        }
      })
      .catch(() => {});
  }, [navigate]);

  const goToRegisterAnimal = () => {
    navigate("/register-animal");
  };

  const goToRequests = () => {
    navigate("/owner-requests");
  };

  const goToListings = () => {
    navigate("/owner-listings");
  };

  return (
    <div className="owner-page">
      <Navbar />

      <main className="owner-main">
        <section
          className="owner-hero"
          style={{ backgroundImage: `url(${ownerHomeHeroImage})` }}
        >
          <div className="owner-hero-overlay">
            <p className="owner-hero-tag">Owner Dashboard</p>

            <h1 className="owner-hero-title">
              Manage your animals,
              <br />
              review adoption requests,
              <br />
              and guide better matches.
            </h1>

            <p className="owner-hero-text">
              Use your dashboard to register new animals, monitor listing status,
              and review incoming adoption requests through a cleaner and more
              organized owner experience.
            </p>

            <div className="owner-hero-buttons">
              <button
                type="button"
                className="owner-primary-btn"
                onClick={goToRegisterAnimal}
              >
                Register New Animal
              </button>

              <button
                type="button"
                className="owner-secondary-btn"
                onClick={goToRequests}
              >
                Manage Requests
              </button>
            </div>
          </div>
        </section>

        <section className="owner-summary-grid">
          <div className="owner-summary-card">
            <div className="owner-summary-head">
              <span className="owner-summary-label">Active Listings</span>
              <span className="owner-summary-mini-dot"></span>
            </div>
            <p className="owner-summary-value">3</p>
            <span className="owner-summary-note">Animals currently visible</span>
          </div>

          <div className="owner-summary-card">
            <div className="owner-summary-head">
              <span className="owner-summary-label">Pending Requests</span>
              <span className="owner-summary-mini-dot"></span>
            </div>
            <p className="owner-summary-value">5</p>
            <span className="owner-summary-note">Waiting for owner review</span>
          </div>

          <div className="owner-summary-card">
            <div className="owner-summary-head">
              <span className="owner-summary-label">Completed Adoptions</span>
              <span className="owner-summary-mini-dot"></span>
            </div>
            <p className="owner-summary-value">2</p>
            <span className="owner-summary-note">Successfully completed</span>
          </div>
        </section>

        <section className="owner-panel-grid">
          <div className="owner-panel-card owner-panel-card-green">
            <div className="owner-panel-top">
              <div>
                <h2>My Animal Listings</h2>
                <p>
                  Review the animal profiles you created and keep their status up
                  to date through a structured listing panel.
                </p>
              </div>

              <button
                type="button"
                className="owner-panel-link"
                onClick={goToListings}
              >
                See All
              </button>
            </div>

            <div className="owner-list-table">
              <div className="owner-list-row owner-list-header">
                <span>Animal</span>
                <span>Status</span>
              </div>

              <div className="owner-list-row">
                <div className="owner-animal-meta">
                  <div className="owner-animal-icon owner-animal-icon-green"></div>
                  <div>
                    <strong>Luna</strong>
                    <p>Golden Retriever</p>
                  </div>
                </div>
                <span className="owner-status-pill owner-status-active">
                  Active
                </span>
              </div>

              <div className="owner-list-row">
                <div className="owner-animal-meta">
                  <div className="owner-animal-icon owner-animal-icon-mint"></div>
                  <div>
                    <strong>Milo</strong>
                    <p>British Shorthair</p>
                  </div>
                </div>
                <span className="owner-status-pill owner-status-active">
                  Active
                </span>
              </div>

              <div className="owner-list-row">
                <div className="owner-animal-meta">
                  <div className="owner-animal-icon owner-animal-icon-cream"></div>
                  <div>
                    <strong>Daisy</strong>
                    <p>Mixed Breed</p>
                  </div>
                </div>
                <span className="owner-status-pill owner-status-draft">
                  Draft
                </span>
              </div>
            </div>
          </div>

          <div className="owner-panel-card owner-panel-card-mint">
            <div className="owner-panel-top">
              <div>
                <h2>Incoming Adoption Requests</h2>
                <p>
                  Review adopter interest and continue the process through a
                  more organized request view.
                </p>
              </div>

              <button
                type="button"
                className="owner-panel-link"
                onClick={goToRequests}
              >
                Open Panel
              </button>
            </div>

            <div className="owner-request-list">
              <div className="owner-request-item">
                <div>
                  <strong>Request #104</strong>
                  <p>For Luna</p>
                </div>
                <span className="owner-request-tag">New</span>
              </div>

              <div className="owner-request-item">
                <div>
                  <strong>Request #105</strong>
                  <p>For Milo</p>
                </div>
                <span className="owner-request-tag">Pending</span>
              </div>

              <div className="owner-request-item">
                <div>
                  <strong>Request #106</strong>
                  <p>For Luna</p>
                </div>
                <span className="owner-request-tag">Pending</span>
              </div>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}

export default OwnerHomePage;