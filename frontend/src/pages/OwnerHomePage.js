import React, { useCallback, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import "./OwnerHomePage.css";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import ownerHomeHeroImage from "../images/ownerHomeHeroImage.jpg";
import { getApiBaseUrl, getStoredUser, getResolvedUserId, normalizeRole } from "../utils/auth";
import {
  fetchOwnerListings,
  ownerListingImageUrls,
  resolveOwnerListingImageUrl
} from "../utils/ownerJourney";

function listingStatusPillClass(status) {
  const s = String(status || "").toLowerCase();
  if (s.includes("draft")) {
    return "owner-status-pill owner-status-draft";
  }
  if (s.includes("closed") || s.includes("adopted") || s.includes("removed")) {
    return "owner-status-pill owner-status-muted";
  }
  return "owner-status-pill owner-status-active";
}

function ownerAnimalIconClass(index) {
  const cycle = ["owner-animal-icon-green", "owner-animal-icon-mint", "owner-animal-icon-cream"];
  return cycle[index % cycle.length];
}

function OwnerHomePage() {
  const navigate = useNavigate();
  const [listings, setListings] = useState([]);
  const [listingsLoaded, setListingsLoaded] = useState(false);
  const apiBaseUrl = getApiBaseUrl();

  const refreshListings = useCallback(async () => {
    const stored = getStoredUser();
    const uid = getResolvedUserId(stored);
    if (!uid || normalizeRole(stored?.role) !== "OWNER") {
      setListings([]);
      setListingsLoaded(true);
      return;
    }
    setListingsLoaded(false);
    try {
      const list = await fetchOwnerListings(uid);
      setListings(Array.isArray(list) ? list : []);
    } catch (err) {
      console.error(err);
      setListings([]);
    } finally {
      setListingsLoaded(true);
    }
  }, []);

  useEffect(() => {
    const stored = getStoredUser();
    const uid = getResolvedUserId(stored);
    if (!uid || normalizeRole(stored?.role) !== "OWNER") {
      return;
    }
    const base = getApiBaseUrl().replace(/\/$/, "");
    const profileUrl = base ? `${base}/api/auth/profile/${uid}` : `/api/auth/profile/${uid}`;
    fetch(profileUrl)
      .then((res) => (res.ok ? res.json() : null))
      .then((profile) => {
        if (profile && profile.ownerProfileCompleted === false) {
          navigate("/complete-owner-profile", { replace: true });
        }
      })
      .catch(() => {});
  }, [navigate]);

  useEffect(() => {
    refreshListings();
  }, [refreshListings]);

  useEffect(() => {
    const onFocus = () => {
      if (normalizeRole(getStoredUser()?.role) === "OWNER") {
        refreshListings();
      }
    };
    window.addEventListener("focus", onFocus);
    return () => window.removeEventListener("focus", onFocus);
  }, [refreshListings]);

  const goToRegisterAnimal = () => {
    navigate("/register-animal");
  };

  const goToRequests = () => {
    navigate("/owner-requests");
  };

  const goToListings = () => {
    navigate("/owner-listings");
  };

  const listingCount = listings.length;
  const previewRows = listings.slice(0, 5);

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
          <button
            type="button"
            className="owner-summary-card owner-summary-card--clickable"
            onClick={goToListings}
          >
            <div className="owner-summary-head">
              <span className="owner-summary-label">Listed animals</span>
              <span className="owner-summary-mini-dot"></span>
            </div>
            <p className="owner-summary-value">
              {!listingsLoaded ? "…" : listingCount}
            </p>
            <span className="owner-summary-note">
              Listed animals · {listingsLoaded ? listingCount : "…"} — open full list
            </span>
          </button>

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

              {!listingsLoaded ? (
                <div className="owner-list-row">
                  <span style={{ color: "#777", fontSize: 14 }}>Loading listings…</span>
                </div>
              ) : previewRows.length === 0 ? (
                <div className="owner-list-row">
                  <span style={{ color: "#777", fontSize: 14 }}>No animals yet. Register one to see it here.</span>
                </div>
              ) : (
                previewRows.map((animal, index) => {
                  const thumbs = ownerListingImageUrls(animal);
                  const thumbUrl =
                    thumbs.length > 0
                      ? resolveOwnerListingImageUrl(thumbs[0], apiBaseUrl)
                      : null;
                  return (
                  <button
                    key={animal.id}
                    type="button"
                    className="owner-list-row owner-list-row--link"
                    onClick={() => navigate(`/animal/${animal.id}`)}
                  >
                    <div className="owner-animal-meta">
                      {thumbUrl ? (
                        <img
                          src={thumbUrl}
                          alt=""
                          className="owner-animal-thumb"
                        />
                      ) : (
                        <div
                          className={`owner-animal-icon ${ownerAnimalIconClass(index)}`}
                          aria-hidden
                        />
                      )}
                      <div>
                        <strong>{animal.name || "Unnamed"}</strong>
                        <p>{animal.breed || "—"}</p>
                      </div>
                    </div>
                    <span className={listingStatusPillClass(animal.listingStatus)}>
                      {animal.listingStatus || "Listed"}
                    </span>
                  </button>
                  );
                })
              )}
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