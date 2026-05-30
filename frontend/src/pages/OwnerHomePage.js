import React, { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import "./OwnerHomePage.css";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import ownerHomeHeroImage from "../images/ownerHomeHeroImage.jpg";
import {
  broadcastStoredUserRefresh,
  getApiBaseUrl,
  getResolvedUserId,
  getStoredUser,
  isOwnerProfileIncomplete,
  normalizeRole
} from "../utils/auth";
import {
  loadOwnerHomePanels,
  loadOwnerHomeSummary,
  ownerListingImageUrls,
  PAVIA_OWNER_ENGAGEMENT_UPDATED,
  PAVIA_OWNER_HOME_SUMMARY_UPDATED,
  readOwnerHomePanelsCache,
  readOwnerHomeSummaryCache,
  resolveOwnerListingImageUrl
} from "../utils/ownerJourney";

const ICON_CLASSES = [
  "owner-animal-icon-green",
  "owner-animal-icon-mint",
  "owner-animal-icon-cream"
];

function titleCase(value) {
  if (!value) return "";
  const text = String(value).toLowerCase().replace(/_/g, " ");
  return text.charAt(0).toUpperCase() + text.slice(1);
}

function statusPillClass(status) {
  const normalized = String(status || "ACTIVE").toUpperCase();
  if (normalized === "ACTIVE") return "owner-status-pill owner-status-active";
  return "owner-status-pill owner-status-draft";
}

function inquiryTagClass(status) {
  const normalized = String(status || "PENDING").toUpperCase();
  if (normalized === "PENDING") return "owner-request-tag";
  if (normalized === "ACCEPTED") return "owner-request-tag owner-request-tag-accepted";
  return "owner-request-tag owner-request-tag-muted";
}

function initialSummaryForUser() {
  const user = getStoredUser();
  const uid = getResolvedUserId(user);
  if (uid == null) {
    return null;
  }
  return readOwnerHomeSummaryCache(uid);
}

function initialPanelsForUser() {
  const uid = getResolvedUserId(getStoredUser());
  if (uid == null) {
    return { listings: [], inquiries: [], hasCache: false };
  }
  const cached = readOwnerHomePanelsCache(uid);
  if (!cached) {
    return { listings: [], inquiries: [], hasCache: false };
  }
  return {
    listings: cached.listings || [],
    inquiries: cached.inquiries || [],
    hasCache: (cached.listings || []).length > 0
  };
}

function OwnerHomePage() {
  const navigate = useNavigate();
  const initialPanels = initialPanelsForUser();
  const initialHasPanelsCache = initialPanels.hasCache;
  const [panelsLoading, setPanelsLoading] = useState(!initialHasPanelsCache);
  const [summary, setSummary] = useState(initialSummaryForUser);
  const [summaryLoading, setSummaryLoading] = useState(() => !initialSummaryForUser());
  const [listings, setListings] = useState(initialPanels.listings);
  const [inquiries, setInquiries] = useState(initialPanels.inquiries);
  const apiBaseUrl = getApiBaseUrl();

  useEffect(() => {
    const stored = getStoredUser();
    const uid = getResolvedUserId(stored);
    if (!uid || normalizeRole(stored?.role) !== "OWNER") {
      navigate("/", { replace: true });
      return undefined;
    }

    let cancelled = false;

    fetch(`${apiBaseUrl}/api/auth/profile/${uid}`)
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
            ownerProfileCompleted: profile.ownerProfileCompleted,
            ownerListingType: profile.ownerListingType || ""
          })
        );
        broadcastStoredUserRefresh();
        if (!profile.ownerProfileCompleted) {
          navigate("/complete-owner-profile", { replace: true });
        }
      })
      .catch(() => {});

    Promise.all([loadOwnerHomeSummary(uid), loadOwnerHomePanels(uid)])
      .then(([summaryData, panelsData]) => {
        if (cancelled) {
          return;
        }
        setSummary(summaryData);
        setListings(panelsData.listings || []);
        setInquiries(panelsData.inquiries || []);
      })
      .catch(() => {
        if (!cancelled) {
          setSummary((prev) => prev || {
            activeListings: 0,
            pendingRequests: 0,
            acceptedInquiries: 0,
            adoptedCount: 0,
            archivedCount: 0
          });
          if (!initialHasPanelsCache) {
            setListings([]);
            setInquiries([]);
          }
        }
      })
      .finally(() => {
        if (!cancelled) {
          setSummaryLoading(false);
          setPanelsLoading(false);
        }
      });

    const onSummary = () => {
      const cached = readOwnerHomeSummaryCache(uid);
      if (cached) {
        setSummary(cached);
      }
    };
    const onEngagement = () => {
      loadOwnerHomePanels(uid, { force: true })
        .then((panels) => {
          if (!cancelled) {
            setListings(panels.listings || []);
            setInquiries(panels.inquiries || []);
          }
        })
        .catch(() => {});
      loadOwnerHomeSummary(uid, { force: true })
        .then((data) => {
          if (!cancelled) {
            setSummary(data);
          }
        })
        .catch(() => {});
    };

    window.addEventListener(PAVIA_OWNER_HOME_SUMMARY_UPDATED, onSummary);
    window.addEventListener(PAVIA_OWNER_ENGAGEMENT_UPDATED, onEngagement);

    return () => {
      cancelled = true;
      window.removeEventListener(PAVIA_OWNER_HOME_SUMMARY_UPDATED, onSummary);
      window.removeEventListener(PAVIA_OWNER_ENGAGEMENT_UPDATED, onEngagement);
    };
  }, [apiBaseUrl, navigate, initialHasPanelsCache]);

  const previewListings = useMemo(() => (listings || []).slice(0, 3), [listings]);

  const previewInquiries = useMemo(() => {
    return [...(inquiries || [])]
      .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
      .slice(0, 3);
  }, [inquiries]);

  const statValue = (key) => {
    if (summaryLoading && !summary) {
      return "—";
    }
    return summary?.[key] ?? 0;
  };

  if (isOwnerProfileIncomplete(getStoredUser())) {
    return null;
  }

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
                className="owner-primary-btn owner-hero-action-btn"
                onClick={() => navigate("/register-animal")}
              >
                Register New Animal
              </button>

              <button
                type="button"
                className="owner-secondary-btn owner-hero-action-btn"
                onClick={() => navigate("/owner-requests")}
              >
                Manage Requests
              </button>
            </div>
          </div>
        </section>

        <section className="owner-summary-grid" aria-label="Overview">
          <button
            type="button"
            className="owner-summary-card owner-summary-card-link"
            onClick={() => navigate("/owner-listings")}
          >
            <div className="owner-summary-head">
              <span className="owner-summary-label">Active Listings</span>
              <span className="owner-summary-mini-dot" />
            </div>
            <p className="owner-summary-value">{statValue("activeListings")}</p>
            <span className="owner-summary-note">Animals currently visible</span>
          </button>

          <button
            type="button"
            className="owner-summary-card owner-summary-card-link"
            onClick={() => navigate("/owner-requests?filter=pending")}
          >
            <div className="owner-summary-head">
              <span className="owner-summary-label">Pending Requests</span>
              <span className="owner-summary-mini-dot" />
            </div>
            <p className="owner-summary-value">{statValue("pendingRequests")}</p>
            <span className="owner-summary-note">Waiting for owner review</span>
          </button>

          <button
            type="button"
            className="owner-summary-card owner-summary-card-link"
            onClick={() => navigate("/owner-requests?filter=accepted")}
          >
            <div className="owner-summary-head">
              <span className="owner-summary-label">Accepted Inquiries</span>
              <span className="owner-summary-mini-dot" />
            </div>
            <p className="owner-summary-value">{statValue("acceptedInquiries")}</p>
            <span className="owner-summary-note">Successfully accepted</span>
          </button>

          <button
            type="button"
            className="owner-summary-card owner-summary-card-link owner-summary-card-adopted"
            onClick={() => navigate("/owner-listings?tab=adopted")}
          >
            <div className="owner-summary-head">
              <span className="owner-summary-label">Found their forever home</span>
              <span className="owner-summary-mini-dot owner-summary-dot-adopted" />
            </div>
            <p className="owner-summary-value">{statValue("adoptedCount")}</p>
            <span className="owner-summary-note">Adopted listings · View all</span>
          </button>
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
                onClick={() => navigate("/owner-listings")}
              >
                See All
              </button>
            </div>

            <div className="owner-list-table">
              <div className="owner-list-row owner-list-header">
                <span>Animal</span>
                <span>Status</span>
              </div>

              {panelsLoading ? (
                <p className="owner-panel-empty">Loading listings…</p>
              ) : previewListings.length === 0 ? (
                <p className="owner-panel-empty">
                  No active listings yet. Register your first animal to get started.
                </p>
              ) : (
                previewListings.map((animal, index) => {
                  const imageUrl = ownerListingImageUrls(animal)[0];
                  const resolvedImage = imageUrl
                    ? resolveOwnerListingImageUrl(imageUrl, apiBaseUrl)
                    : null;

                  return (
                    <div className="owner-list-row" key={animal.id}>
                      <div className="owner-animal-meta">
                        {resolvedImage ? (
                          <img
                            src={resolvedImage}
                            alt=""
                            className="owner-animal-thumb"
                          />
                        ) : (
                          <div
                            className={`owner-animal-icon ${ICON_CLASSES[index % ICON_CLASSES.length]}`}
                          />
                        )}
                        <div>
                          <strong>{animal.name || "Unnamed"}</strong>
                          <p>{animal.breed || titleCase(animal.animalType) || "—"}</p>
                        </div>
                      </div>
                      <span className={statusPillClass(animal.listingStatus)}>
                        {titleCase(animal.listingStatus || "ACTIVE")}
                      </span>
                    </div>
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
                onClick={() => navigate("/owner-requests")}
              >
                Open Panel
              </button>
            </div>

            <div className="owner-request-list">
              {panelsLoading ? (
                <p className="owner-panel-empty">Loading requests…</p>
              ) : previewInquiries.length === 0 ? (
                <p className="owner-panel-empty">No adoption requests yet.</p>
              ) : (
                previewInquiries.map((inquiry) => (
                  <div className="owner-request-item" key={inquiry.id}>
                    <div>
                      <strong>Request #{inquiry.id}</strong>
                      <p>For {inquiry.animalName || "your listing"}</p>
                    </div>
                    <span className={inquiryTagClass(inquiry.status)}>
                      {titleCase(inquiry.status || "PENDING")}
                    </span>
                  </div>
                ))
              )}
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}

export default OwnerHomePage;
