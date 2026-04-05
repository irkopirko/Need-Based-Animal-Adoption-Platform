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

  return (
    <div className="owner-page">
      <Navbar />

      <main className="owner-main">
        <section className="owner-hero">
          <div className="owner-hero-left">
            <p className="owner-hero-tag">Owner dashboard</p>
            <h1 className="owner-hero-title">
              Manage your animal
              <br />
              listings and review
              <br />
              adoption requests.
            </h1>
            <p className="owner-hero-text">
              This page helps owners register new animals, track listed profiles,
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
                disabled
              >
                Request Review Panel
              </button>
            </div>
          </div>

          <div className="owner-hero-right">
            <div className="owner-status-card">
              <div className="owner-status-badge">Owner Workspace</div>

              <h3>Your main actions start here</h3>

              <p>
                Add animal profiles, keep track of active listings, and monitor
                adoption requests from potential adopters.
              </p>

              <div className="owner-status-steps">
                <div className="owner-step">
                  <span className="owner-step-number">01</span>
                  <div>
                    <h4>Create animal profile</h4>
                    <p>Add animal details, needs, and compatibility info.</p>
                  </div>
                </div>

                <div className="owner-step">
                  <span className="owner-step-number">02</span>
                  <div>
                    <h4>Publish and manage listing</h4>
                    <p>Keep profiles updated and visible to the system.</p>
                  </div>
                </div>

                <div className="owner-step">
                  <span className="owner-step-number">03</span>
                  <div>
                    <h4>Review incoming requests</h4>
                    <p>See adopter interest and continue the process.</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="owner-summary-grid">
          <div className="owner-summary-card">
            <h3>Active Listings</h3>
            <p>3 animals</p>
          </div>

          <div className="owner-summary-card">
            <h3>Pending Requests</h3>
            <p>5 requests</p>
          </div>

          <div className="owner-summary-card">
            <h3>Completed Adoptions</h3>
            <p>2 records</p>
          </div>
        </section>

        <section className="owner-work-grid">
          <div className="owner-work-card">
            <h2>My Animal Listings</h2>
            <p>
              View, edit, or archive the animal profiles you have already added
              to the platform.
            </p>

            <div className="owner-mini-list">
              <div className="owner-mini-item">
                <strong>Luna</strong>
                <span>Active listing</span>
              </div>
              <div className="owner-mini-item">
                <strong>Milo</strong>
                <span>Active listing</span>
              </div>
              <div className="owner-mini-item">
                <strong>Daisy</strong>
                <span>Draft profile</span>
              </div>
            </div>
          </div>

          <div className="owner-work-card">
            <h2>Incoming Adoption Requests</h2>
            <p>
              Review adopters who are interested in your listed animals and
              continue the process from there.
            </p>

            <div className="owner-mini-list">
              <div className="owner-mini-item">
                <strong>Request #104</strong>
                <span>For Luna</span>
              </div>
              <div className="owner-mini-item">
                <strong>Request #105</strong>
                <span>For Milo</span>
              </div>
              <div className="owner-mini-item">
                <strong>Request #106</strong>
                <span>For Luna</span>
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