import React from "react";
import { useNavigate } from "react-router-dom";
import "./AdopterHomePage.css";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";

function AdopterHomePage() {
  const navigate = useNavigate();

  const goToProfileForm = () => {
    navigate("/adoption-profile");
  };

  return (
    <div className="adopter-page">
      <Navbar />

      <main className="adopter-main">
        <section className="adopter-hero">
          <div className="adopter-hero-left">
            <p className="adopter-hero-tag">Welcome back</p>
            <h1 className="adopter-hero-title">
              Before seeing any matches,
              <br />
              you need to complete
              <br />
              your adoption profile.
            </h1>
            <p className="adopter-hero-text">
              Pavia does not show animals before this step. Your housing,
              routine, household details, and animal preferences are needed so
              the system can calculate compatibility and only show animals above
              the required threshold.
            </p>

            <div className="adopter-hero-buttons">
              <button
                type="button"
                className="adopter-primary-btn"
                onClick={goToProfileForm}
              >
                Start Adoption Profile
              </button>

              <button
                type="button"
                className="adopter-secondary-btn"
                disabled
              >
                Compatible Animals Locked
              </button>
            </div>
          </div>

          <div className="adopter-hero-right">
            <div className="adopter-status-card">
              <div className="adopter-status-badge">Profile Required</div>

              <h3>Your matching flow has not started yet</h3>

              <p>
                Once your adoption profile is completed, the system will generate
                compatibility scores and only show suitable animals.
              </p>

              <div className="adopter-status-steps">
                <div className="adopter-step">
                  <span className="adopter-step-number">01</span>
                  <div>
                    <h4>Fill adoption profile</h4>
                    <p>Enter home, lifestyle, and preference details.</p>
                  </div>
                </div>

                <div className="adopter-step">
                  <span className="adopter-step-number">02</span>
                  <div>
                    <h4>System calculates matches</h4>
                    <p>Animals are evaluated with compatibility scoring.</p>
                  </div>
                </div>

                <div className="adopter-step">
                  <span className="adopter-step-number">03</span>
                  <div>
                    <h4>View only suitable animals</h4>
                    <p>Only animals above the threshold will appear.</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="adopter-summary-grid">
          <div className="adopter-summary-card">
            <h3>Adoption Profile</h3>
            <p>Not started</p>
          </div>

          <div className="adopter-summary-card">
            <h3>Compatible Animals</h3>
            <p>Locked</p>
          </div>

          <div className="adopter-summary-card">
            <h3>Saved Animals</h3>
            <p>Available after matching</p>
          </div>
        </section>

        <section className="adopter-info-section">
          <div className="adopter-info-card">
            <h2>Why this step comes first</h2>
            <p>
              In Pavia, adopters do not browse all animals freely. This is a
              deliberate design decision. The platform first collects structured
              adopter information, then compares it with animal profiles to
              avoid random or appearance-based choices.
            </p>
          </div>

          <div className="adopter-info-card">
            <h2>What you will fill in</h2>
            <ul className="adopter-info-list">
              <li>Home environment and available space</li>
              <li>Daily routine and activity level</li>
              <li>Household information</li>
              <li>Preferred animal characteristics</li>
            </ul>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}

export default AdopterHomePage;