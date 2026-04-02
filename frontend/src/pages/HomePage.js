import React from "react";
import "./HomePage.css";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";

function HomePage() {
  const goToRegister = () => {
    window.location.pathname = "/register";
  };

  const goToAbout = () => {
    window.location.pathname = "/about";
  };

  return (
    <div className="home-page">
      <Navbar />

      <main className="home-main">
        <section className="home-hero-banner">
          <div className="home-hero-overlay"></div>

          <div className="home-hero-grid">
            <div className="home-hero-left">
              <p className="home-hero-tag">Thoughtful adoption starts here</p>

              <h1 className="home-hero-title">
                Find the right
                <br />
                companion for
                <br />
                your life.
              </h1>
            </div>

            <div className="home-hero-right">
              <p className="home-hero-description">
                Pavia helps adopters and shelters connect through lifestyle
                compatibility, care expectations, and daily routine — not only
                appearance. The goal is to support warmer, smarter, and more
                lasting matches.
              </p>

              <div className="home-hero-buttons">
                <button
                  type="button"
                  className="home-primary-btn"
                  onClick={goToRegister}
                >
                  Get Started
                </button>

                <button
                  type="button"
                  className="home-secondary-btn"
                  onClick={goToAbout}
                >
                  Learn More
                </button>
              </div>
            </div>
          </div>
        </section>

        <section className="home-highlight-section">
          <div className="home-highlight-card home-highlight-green">
            <div className="home-card-icon">🐾</div>
            <h3>Compatibility First</h3>
            <p>
              We focus on lifestyle, routine, and care needs before showing
              possible matches.
            </p>
          </div>

          <div className="home-highlight-card">
            <div className="home-card-icon">🏡</div>
            <h3>Better Home Fit</h3>
            <p>
              Adopters can discover animals that better suit their living
              conditions and daily life.
            </p>
          </div>

          <div className="home-highlight-card">
            <div className="home-card-icon">🤝</div>
            <h3>Smarter Adoption</h3>
            <p>
              Shelters and adopters can make more informed choices with a more
              structured process.
            </p>
          </div>
        </section>

        <section className="home-info-section">
          <div className="home-info-left">
            <h2>Why Pavia?</h2>
            <p>
              Traditional adoption platforms often depend too much on photos and
              basic listings. Pavia aims to support a more meaningful process by
              bringing compatibility and responsibility into the center of the
              experience.
            </p>
          </div>

          <div className="home-info-right">
            <div className="home-info-box">
              <span className="home-info-number">01</span>
              <h4>Create your profile</h4>
              <p>Tell us about your home, routine, and preferences.</p>
            </div>

            <div className="home-info-box">
              <span className="home-info-number">02</span>
              <h4>See suitable matches</h4>
              <p>Animals are recommended based on compatibility.</p>
            </div>

            <div className="home-info-box">
              <span className="home-info-number">03</span>
              <h4>Contact and adopt</h4>
              <p>Move forward with more confidence and clarity.</p>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}

export default HomePage;