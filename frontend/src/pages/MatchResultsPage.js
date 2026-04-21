import React, { useEffect, useState } from "react";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import "./MatchResultsPage.css";

function MatchResultsPage() {
  const [matches, setMatches] = useState([]);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");

  const user = JSON.parse(localStorage.getItem("paviaUser"));
  const userId = user?.userId || 1;

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [matchResponse, profileResponse] = await Promise.all([
          fetch(`http://localhost:8080/api/match/${userId}`),
          fetch(`http://localhost:8080/api/profile/${userId}`)
        ]);

        if (!matchResponse.ok) {
          throw new Error("Failed to fetch matches");
        }

        const matchData = await matchResponse.json();
        setMatches(matchData);

        if (profileResponse.ok) {
          const profileData = await profileResponse.json();
          setProfile(profileData);
        }
      } catch (error) {
        console.error(error);
        setMessage("Could not load compatibility results.");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [userId]);

  return (
    <div className="match-page">
      <Navbar />

      <main className="match-main">
        <section className="match-hero">
          <p className="match-tag">Compatibility Results</p>
          <h1 className="match-title">Your Best Matches</h1>
          <p className="match-description">
            Based on your preferences and lifestyle, these animals are the most compatible with you.
          </p>
        </section>

        <section className="match-summary">
          <div className="summary-card">
            <h3>Your Preferences</h3>

            {profile ? (
              <div className="summary-grid">
                <div><span>Animal Type:</span> {profile.preferredAnimalType}</div>
                <div><span>Size:</span> {profile.preferredSize}</div>
                <div><span>Age:</span> {profile.preferredAge}</div>
                <div><span>Home:</span> {profile.homeType}</div>
                <div><span>Activity:</span> {profile.activityLevel}</div>
                <div><span>Indoor Space:</span> {profile.indoorSpace}</div>
              </div>
            ) : (
              <p className="match-info">Profile information could not be loaded.</p>
            )}

            <button className="edit-preferences-btn">
              Edit Preferences
            </button>
          </div>
        </section>

        <section className="match-toolbar">
          <div className="toolbar-left">
            <span>Sort by:</span>
            <button className="toolbar-btn active">Highest Match</button>
            <button className="toolbar-btn">Age</button>
            <button className="toolbar-btn">Size</button>
          </div>

          <div className="toolbar-right">
            <span>Filters coming soon</span>
          </div>
        </section>

        <section className="match-results">
          {loading && <p className="match-info">Loading matches...</p>}

          {!loading && message && (
            <div className="match-error">{message}</div>
          )}

          {!loading && !message && matches.length === 0 && (
            <div className="match-empty">
              <h3>No strong matches found yet</h3>
              <p>Try editing your preferences to discover more compatible animals.</p>
              <button className="empty-btn">Edit Preferences</button>
            </div>
          )}

          {!loading && !message && matches.length > 0 && (
            <div className="match-grid">
              {matches.map((animal) => (
                <div className="match-card" key={animal.animalId}>
                  <div className="match-image-placeholder">
                    Animal Photo
                  </div>

                  <div className="match-card-body">
                    <div className="match-card-top">
                      <div>
                        <h2>{animal.name}</h2>
                        <p className="match-meta">{animal.animalType}</p>
                      </div>

                      <div className="match-badge">
                        %{Math.round(animal.matchPercentage)}
                      </div>
                    </div>

                    <p className="match-text">
                      This animal appears to be one of your strongest compatibility matches based on your current profile.
                    </p>

                    <div className="match-tags">
                      <span>Compatible</span>
                      <span>Profile-Based</span>
                      <span>Recommended</span>
                    </div>

                    <div className="match-actions">
                      <button className="details-btn">View Details</button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      </main>

      <Footer />
    </div>
  );
  return <div>Match Page</div>;
}

export default MatchResultsPage;