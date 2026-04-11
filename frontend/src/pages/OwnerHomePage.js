import React from "react";
import { useNavigate } from "react-router-dom";
import "./OwnerHomePage.css";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";

function OwnerHomePage() {
  const navigate = useNavigate();

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
        <section className="owner-hero">
          <div className="owner-hero-left">
            <p className="owner-hero-tag">Owner Dashboard</p>

            <h1 className="owner-hero-title">
              Manage your animals,
              <br />
              review adoption requests,
              <br />
              and track your listings.
            </h1>

            <p className="owner-hero-text">
              Use your dashboard to register new animals, monitor listing status,
              and review incoming adoption requests in one place.
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
                View Requests
              </button>
            </div>
          </div>

          <div className="owner-hero-right">
            <div className="owner-status-card">
              <div className="owner-status-top">
                <span className="owner-status-badge">Owner Workspace</span>
                <span className="owner-status-dot"></span>
              </div>

              <h3>Your dashboard is ready</h3>

              <p>
                Keep your animal profiles updated, manage active listings, and
                continue the adoption process from one organized view.
              </p>

              <div className="owner-status-steps">
                <div className="owner-step">
                  <span className="owner-step-number">01</span>
                  <div>
                    <h4>Add Animal Profile</h4>
                    <p>Create a detailed profile for each animal.</p>
                  </div>
                </div>

                <div className="owner-step">
                  <span className="owner-step-number">02</span>
                  <div>
                    <h4>Track Listing Status</h4>
                    <p>Monitor whether listings are active, draft, or closed.</p>
                  </div>
                </div>

                <div className="owner-step">
                  <span className="owner-step-number">03</span>
                  <div>
                    <h4>Review Requests</h4>
                    <p>Check incoming adopter interest and continue matching.</p>
                  </div>
                </div>
              </div>
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
          <div className="owner-panel-card">
            <div className="owner-panel-top">
              <div>
                <h2>My Animal Listings</h2>
                <p>
                  Review the animal profiles you created and keep their status up
                  to date.
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
                  <div className="owner-animal-icon"></div>
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
                  <div className="owner-animal-icon"></div>
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
                  <div className="owner-animal-icon"></div>
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

          <div className="owner-panel-card">
            <div className="owner-panel-top">
              <div>
                <h2>Incoming Adoption Requests</h2>
                <p>
                  Review adopter interest, check which animal they selected, and
                  continue the process.
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