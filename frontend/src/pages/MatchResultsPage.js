import React, { useEffect, useState } from "react";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import "./MatchResultsPage.css";
import { useNavigate } from "react-router-dom";
import { STRONG_MATCH_THRESHOLD } from "../utils/adopterJourney";
import { getApiBaseUrl, getResolvedUserId, getStoredUser } from "../utils/auth";

function MatchResultsPage() {
  const [matches, setMatches] = useState([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");
  const [requestData, setRequestData] = useState(null);
  const navigate = useNavigate();

  const user = getStoredUser();
  const userId = getResolvedUserId(user);

  const handleEditPreferences = () => {
  const storedRequests = JSON.parse(localStorage.getItem("adoptionRequests")) || [];

  if (storedRequests.length > 0) {
    const latestRequest = storedRequests[storedRequests.length - 1];
    localStorage.setItem("editingRequestId", latestRequest.id);
  }

  navigate("/adoption-request");
};

  useEffect(() => {
    const fetchData = async () => {
      if (userId == null) {
        setMessage("Could not load compatibility results. Please sign in again.");
        setLoading(false);
        return;
      }
      try {
        const api = getApiBaseUrl();
        const params = new URLSearchParams();
        params.set("minOverlap", String(STRONG_MATCH_THRESHOLD));
        const matchResponse = await fetch(`${api}/api/match/${userId}?${params.toString()}`);

        if (!matchResponse.ok) {
          throw new Error("Failed to fetch matches");
        }

        const matchData = await matchResponse.json();
        setMatches(matchData);
      } catch (error) {
        console.error(error);
        setMessage("Could not load compatibility results.");
      } finally {
        setLoading(false);
      }
    };
    const stored = localStorage.getItem("adoptionRequest");
    if (stored) {
      setRequestData(JSON.parse(stored));
    }

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
            Based on your preferences and lifestyle, these animals are the most
            compatible with you. Strong matches use a minimum compatibility score
            of {STRONG_MATCH_THRESHOLD}% (inclusive).
          </p>
        </section>

        <section className="match-summary">
          <div className="summary-card">
            <h3>Your Preferences</h3>

            {requestData ? (
              <div className="summary-grid">
  <div><span>Animal Type:</span> {requestData.preferredAnimalTypes?.join(", ")}</div>
  <div><span>Size:</span> {requestData.preferredSizes?.join(", ")}</div>
  <div><span>Age:</span> {requestData.preferredAgeRanges?.join(", ")}</div>
  <div><span>Home:</span> {requestData.livingSpace}</div>
  <div><span>Activity:</span> {requestData.activityLevel}</div>
</div>
            ) : (
              <p className="match-info">Profile information could not be loaded.</p>
            )}

            <button className="edit-preferences-btn"
            onClick={handleEditPreferences}>
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
              <button className="empty-btn"
              onClick={handleEditPreferences}>
                Edit Preferences
                </button>
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
}

export default MatchResultsPage;