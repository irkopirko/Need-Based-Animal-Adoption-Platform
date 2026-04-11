import React from "react";
import "./AboutUsPage.css";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";

import aboutHeroImage from "../images/aboutHeroImage.jpg";
import aboutStoryMainImage from "../images/aboutStoryMainImage.jpg";
import aboutStoryDogImage from "../images/aboutStoryDogImage.jpg";
import aboutStoryCatImage from "../images/aboutStoryCatImage.jpg";
import aboutEmotionImage from "../images/aboutEmotionImage.jpg";
import aboutImpactImage from "../images/aboutImpactImage.jpg";

function AboutUsPage() {
  return (
    <div className="about-page">
      <Navbar />

      <main className="about-main">
        {/* HERO SECTION */}
        <section
          className="about-hero"
          style={{ backgroundImage: `url(${aboutHeroImage})` }}
        >
          <div className="about-hero-overlay"></div>
          <div className="about-hero-content">
            <p className="about-hero-tag">About Pavia</p>
            <h1>
              Finding the right
              <br />
              home should feel
              <br />
              thoughtful, warm,
              <br />
              and human.
            </h1>
            <p className="about-hero-text">
              Pavia is a compatibility-based animal adoption platform designed
              to create meaningful matches. We focus on care, responsibility, and
              trust to build lasting connections between adopters and animals.
            </p>
          </div>
        </section>

        {/* STORY SECTION */}
        <section className="about-story">
          <div className="about-story-left">
            <p className="about-section-tag">Why We Exist</p>
            <h2>
              Adoption should be more
              <br />
              than endless scrolling.
            </h2>
            <p>
              Too many platforms reduce animals to simple listings. Pavia creates
              a more thoughtful and guided adoption experience by considering
              lifestyle, environment, and compatibility.
            </p>
            <p>
              We aim to build trust and ensure every adoption is responsible,
              informed, and compassionate.
            </p>
          </div>

          <div className="about-story-right">
            <div className="about-polaroid about-polaroid-main">
              <img
                src={aboutStoryMainImage}
                alt="Person holding a dog"
              />
            </div>

            <div className="about-polaroid about-polaroid-small top">
              <img
                src={aboutStoryDogImage}
                alt="Dog portrait"
              />
            </div>

            <div className="about-polaroid about-polaroid-small bottom">
              <img
                src={aboutStoryCatImage}
                alt="Cat portrait"
              />
            </div>
          </div>
        </section>

        {/* VALUES SECTION */}
        <section className="about-values">
          <div className="about-value-card soft-green">
            <span className="about-value-number">01</span>
            <h3>Compatibility First</h3>
            <p>
              We ensure better matches by evaluating lifestyles, living spaces,
              and animal needs.
            </p>
          </div>

          <div className="about-value-card soft-cream">
            <span className="about-value-number">02</span>
            <h3>Guided Adoption</h3>
            <p>
              Our structured process helps users make responsible and informed
              decisions.
            </p>
          </div>

          <div className="about-value-card soft-mint">
            <span className="about-value-number">03</span>
            <h3>Trust & Transparency</h3>
            <p>
              Pavia provides a secure and transparent environment for both
              adopters and owners.
            </p>
          </div>
        </section>

        {/* HOW IT WORKS */}
        <section className="about-how">
          <div className="about-how-head">
            <p className="about-section-tag">How It Works</p>
            <h2>A calmer and more guided adoption experience</h2>
          </div>

          <div className="about-how-grid">
            <div className="about-how-card">
              <div className="about-how-icon">01</div>
              <h3>Create an Account</h3>
              <p>Sign up as an adopter or owner to access the platform.</p>
            </div>

            <div className="about-how-card">
              <div className="about-how-icon">02</div>
              <h3>Complete the Process</h3>
              <p>
                Adopters submit adoption requests, while owners create and manage
                animal listings.
              </p>
            </div>

            <div className="about-how-card">
              <div className="about-how-icon">03</div>
              <h3>Find the Perfect Match</h3>
              <p>
                Our system ensures compatibility and responsible adoptions.
              </p>
            </div>
          </div>
        </section>

        {/* EMOTIONAL SECTION */}
        <section className="about-emotion-band">
          <div className="about-emotion-text">
            <p className="about-section-tag">What We Care About</p>
            <h2>
              Every adoption story
              <br />
              begins with trust.
            </h2>
            <p>
              Trust between adopters, owners, and animals. Our mission is to make
              every adoption meaningful, ethical, and compassionate.
            </p>
          </div>

          <div className="about-emotion-photo">
            <img
              src={aboutEmotionImage}
              alt="Woman with dog outdoors"
            />
          </div>
        </section>

        {/* IMPACT ON THE ANIMALS  SECTION */}
        <section className="about-impact-section">
          <div className="about-impact-image-wrap">
            <img
              src={aboutImpactImage}
              alt="Stray dog looking hopeful"
              className="about-impact-image"
            />
            <div className="about-impact-overlay"></div>
          </div>

          <div className="about-impact-content">
            <p className="about-section-tag">Our Impact</p>
            <h2>
              Every better match means
              <br />
              one less stray animal
              <br />
              left without a home.
            </h2>

            <p>
              Pavia is committed to improving the lives of stray and vulnerable
              animals. By creating meaningful and compatible matches, we help
              reduce abandonment and promote responsible adoption.
            </p>

            <div className="about-impact-points">
              <div className="about-impact-point">
                <span className="about-impact-dot"></span>
                <p>More visibility for homeless animals</p>
              </div>

              <div className="about-impact-point">
                <span className="about-impact-dot"></span>
                <p>Better matches reduce abandonment rates</p>
              </div>

              <div className="about-impact-point">
                <span className="about-impact-dot"></span>
                <p>A humane and sustainable adoption ecosystem</p>
              </div>
            </div>
          </div>
        </section>

        {/* REVIEWS */}
        <section className="about-reviews">
          <div className="about-reviews-head">
            <p className="about-section-tag">Community Voice</p>
            <h2>What our users say about Pavia</h2>
          </div>

          <div className="about-reviews-grid">
            <div className="about-review-card featured">
              <div className="about-review-top">
                <img
                  src="https://randomuser.me/api/portraits/women/44.jpg"
                  alt="Reviewer"
                />
                <div>
                  <h3>Elif A.</h3>
                  <span>Adopter</span>
                </div>
              </div>
              <p className="about-review-quote">
                “Pavia transforms adoption into a thoughtful and meaningful
                experience.”
              </p>
            </div>

            <div className="about-review-card">
              <div className="about-review-top">
                <img
                  src="https://randomuser.me/api/portraits/men/32.jpg"
                  alt="Reviewer"
                />
                <div>
                  <h3>Mert K.</h3>
                  <span>Owner</span>
                </div>
              </div>
              <p className="about-review-quote">
                “Managing animal listings and adoption requests has never been
                this clear and organized.”
              </p>
            </div>

            <div className="about-review-card">
              <div className="about-review-top">
                <img
                  src="https://randomuser.me/api/portraits/women/68.jpg"
                  alt="Reviewer"
                />
                <div>
                  <h3>Ayşe T.</h3>
                  <span>Adopter</span>
                </div>
              </div>
              <p className="about-review-quote">
                “It feels less like browsing and more like finding the perfect
                companion.”
              </p>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}

export default AboutUsPage;