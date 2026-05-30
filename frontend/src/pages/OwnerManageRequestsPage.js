import React, { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import "./OwnerManageRequestsPage.css";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import { getStoredUser, normalizeRole } from "../utils/auth";
import { STRONG_MATCH_THRESHOLD } from "../utils/adopterJourney";
import {
  loadOwnerInboxState,
  resolveOwnerScenario,
  formatInquiryDate,
  listingsWithInquiries,
  PAVIA_OWNER_ENGAGEMENT_UPDATED,
  readOwnerListingsCache,
  readOwnerInquiriesCache
} from "../utils/ownerJourney";
import OwnerInquiryThreadPanel from "../components/OwnerInquiryThreadPanel";
import {
  getApiBaseUrl,
  getResolvedUserId
} from "../utils/auth";
import {
  ownerListingImageUrls,
  resolveOwnerListingImageUrl
} from "../utils/ownerJourney";
import { updateNavbarStateForUser } from "../utils/navbarState";

function OwnerManageRequestsPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const statusFilter = String(searchParams.get("filter") || "").toLowerCase();
  const [loading, setLoading] = useState(() => {
    const uid = getResolvedUserId(getStoredUser());
    return uid == null || (!readOwnerListingsCache(uid) && !readOwnerInquiriesCache(uid));
  });
  const [scenario, setScenario] = useState("NO_LISTINGS");
  const [engage, setEngage] = useState(null);
  const [selectedRequestId, setSelectedRequestId] = useState(null);
  const [selectedListingId, setSelectedListingId] = useState(null);

  const ownerId = getResolvedUserId(getStoredUser());
  const apiBase = getApiBaseUrl();

  const refresh = useCallback(async () => {
    const user = getStoredUser();
    const resolvedOwnerId = getResolvedUserId(user);
    if (resolvedOwnerId == null || normalizeRole(user?.role) !== "OWNER") {
      setScenario("NOT_OWNER");
      setEngage(null);
      setLoading(false);
      return;
    }
    const cachedListings = readOwnerListingsCache(resolvedOwnerId);
    const cachedInquiries = readOwnerInquiriesCache(resolvedOwnerId);
    if (!cachedListings && !cachedInquiries) {
      setLoading(true);
    }
    try {
      const data = await loadOwnerInboxState(resolvedOwnerId, { force: false });
      const scen = resolveOwnerScenario({
        hasListings: data.hasListings,
        hasStrongMatchOnListings: data.hasStrongMatchOnListings,
        hasInquiries: data.hasInquiries,
        hasAnyMessages: data.hasAnyMessages
      });
      setEngage(data);
      setScenario(scen);
      const pendingCount = (data.inquiries || []).filter(
        (i) => String(i.status || "").toUpperCase() === "PENDING"
      ).length;
      updateNavbarStateForUser(resolvedOwnerId, {
        ownerPendingRequests: pendingCount
      });

      if (scen === "INQUIRY_NO_MESSAGES" || scen === "FULL") {
        let sorted = [...(data.inquiries || [])].sort(
          (a, b) => new Date(b.createdAt) - new Date(a.createdAt)
        );
        if (statusFilter === "pending") {
          sorted = sorted.filter(
            (i) => String(i.status || "").toUpperCase() === "PENDING"
          );
        } else if (statusFilter === "accepted") {
          sorted = sorted.filter(
            (i) => String(i.status || "").toUpperCase() === "ACCEPTED"
          );
        }
        const firstAnimalId = sorted[0]?.animalId;
        setSelectedListingId((prev) => {
          if (prev && sorted.some((i) => Number(i.animalId) === prev)) {
            return prev;
          }
          return firstAnimalId != null ? Number(firstAnimalId) : null;
        });
        setSelectedRequestId((prev) => {
          if (prev && sorted.some((i) => i.id === prev)) {
            return prev;
          }
          return sorted[0]?.id || null;
        });
      } else {
        setSelectedRequestId(null);
        setSelectedListingId(null);
      }
    } catch {
      setEngage(null);
      setScenario("NO_LISTINGS");
    } finally {
      setLoading(false);
    }
  }, [statusFilter]);

  useEffect(() => {
    refresh();
    const fn = () => refresh();
    window.addEventListener(PAVIA_OWNER_ENGAGEMENT_UPDATED, fn);
    return () => window.removeEventListener(PAVIA_OWNER_ENGAGEMENT_UPDATED, fn);
  }, [refresh]);

  const listings = engage?.listings || [];
  const inquiriesSorted = useMemo(() => {
    let rows = [...(engage?.inquiries || [])].sort(
      (a, b) => new Date(b.createdAt) - new Date(a.createdAt)
    );
    if (statusFilter === "pending") {
      rows = rows.filter(
        (i) => String(i.status || "").toUpperCase() === "PENDING"
      );
    } else if (statusFilter === "accepted") {
      rows = rows.filter(
        (i) => String(i.status || "").toUpperCase() === "ACCEPTED"
      );
    }
    return rows;
  }, [engage, statusFilter]);

  const inquiriesForListing = useMemo(() => {
    if (selectedListingId == null) {
      return inquiriesSorted;
    }
    return inquiriesSorted.filter(
      (i) => Number(i.animalId) === selectedListingId
    );
  }, [inquiriesSorted, selectedListingId]);

  const inquiryCountByListing = useMemo(() => {
    const map = new Map();
    for (const inq of inquiriesSorted) {
      const aid = Number(inq.animalId);
      map.set(aid, (map.get(aid) || 0) + 1);
    }
    return map;
  }, [inquiriesSorted]);

  const listingsWithRequests = useMemo(
    () => listingsWithInquiries(engage?.listings || [], inquiriesSorted),
    [engage, inquiriesSorted]
  );

  useEffect(() => {
    if (inquiriesForListing.length === 0) {
      setSelectedRequestId(null);
      return;
    }
    if (!inquiriesForListing.some((i) => i.id === selectedRequestId)) {
      setSelectedRequestId(inquiriesForListing[0]?.id ?? null);
    }
  }, [inquiriesForListing, selectedRequestId]);

  const goToRegisterAnimal = () => {
    navigate("/register-animal");
  };

  const goToListings = () => {
    navigate("/ownerhomepage");
  };

  const selectListing = (listingId) => {
    setSelectedListingId(Number(listingId));
  };

  const goToListingDetail = (listingId) => {
    navigate(`/animal/${listingId}/requests`);
  };

  const goToMessages = (inquiryId) => {
    if (inquiryId) {
      navigate(`/owner-messages?inquiry=${encodeURIComponent(inquiryId)}`);
    } else {
      navigate("/owner-messages");
    }
  };

  if (loading && !engage) {
    return (
      <div className="owner-requests-page">
        <Navbar />
        <main className="owner-requests-main">
          <p className="owner-requests-loading-msg">Loading…</p>
        </main>
        <Footer />
      </div>
    );
  }

  if (scenario === "NOT_OWNER") {
    return (
      <div className="owner-requests-page">
        <Navbar />
        <main className="owner-requests-locked-main">
          <div className="owner-requests-locked-card">
            <span className="owner-requests-locked-badge">Owners only</span>
            <h1>Manage requests</h1>
            <p>Sign in as an owner to review inquiries.</p>
            <button
              type="button"
              className="owner-requests-primary-btn"
              onClick={() => navigate("/login")}
            >
              Sign in
            </button>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  if (scenario === "NO_LISTINGS") {
    return (
      <div className="owner-requests-page">
        <Navbar />
        <main className="owner-requests-locked-main">
          <div className="owner-requests-locked-card">
            <span className="owner-requests-locked-badge">No listings</span>
            <h1>Create a listing first</h1>
            <p>
              Incoming inquiries appear here once you have animals on the
              platform and adopters reach out.
            </p>
            <button
              type="button"
              className="owner-requests-primary-btn"
              onClick={goToRegisterAnimal}
            >
              Register animal
            </button>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  if (scenario === "STRONG_MATCH_NO_INQUIRY") {
    return (
      <div className="owner-requests-page">
        <Navbar />
        <main className="owner-requests-main">
          <section className="owner-requests-hero owner-requests-hero-simple">
            <div className="owner-requests-hero-left owner-requests-hero-full">
              <p className="owner-requests-tag">Manage requests</p>
              <h1>Strong matches — no inquiries yet</h1>
              <p>
                Your listing(s) can appear to adopters at {STRONG_MATCH_THRESHOLD}%
                or higher. Nobody has used Get in contact yet, so there is nothing
                to review here.
              </p>
            </div>
          </section>

          <section className="owner-requests-empty-section">
            <div className="owner-requests-empty-card">
              <span className="owner-requests-empty-badge">Waiting on adopters</span>
              <h2>Inquiries will land in this inbox</h2>
              <p>
                When an adopter opens a strong-matched animal and taps Get in
                contact, you will see their note here and can open Messages to
                reply.
              </p>
              <button
                type="button"
                className="owner-requests-primary-btn"
                onClick={() => goToMessages()}
              >
                Open messages (empty until first inquiry)
              </button>
            </div>
          </section>

          <ListingsShowcase
            listings={listings}
            goToListings={goToListings}
            goToListingDetail={goToListingDetail}
          />
        </main>
        <Footer />
      </div>
    );
  }

  const selectedListing = listingsWithRequests.find(
    (l) => Number(l.id) === selectedListingId
  );

  return (
    <div className="owner-requests-page">
      <Navbar />

      <main className="owner-requests-main">
        <section className="owner-requests-hero owner-requests-hero-simple">
          <div className="owner-requests-hero-left owner-requests-hero-full">
            <p className="owner-requests-tag">Manage requests</p>
            <h1>
              {statusFilter === "pending"
                ? "Pending message requests"
                : statusFilter === "accepted"
                  ? "Accepted inquiries"
                  : "Message requests"}
            </h1>
            <p>
              Pick a listing, review the adopter&apos;s profile, approve the request, then reply.
            </p>
          </div>
        </section>

        <section className="owner-requests-split-layout">
          <aside className="owner-requests-animal-sidebar">
            <div className="owner-requests-animal-sidebar-head">
              <h2>Animals with requests</h2>
              <span className="owner-request-count">{listingsWithRequests.length}</span>
            </div>

            {listingsWithRequests.length === 0 ? (
              <p className="owner-request-detail-empty">
                No message requests yet.
              </p>
            ) : (
              <div className="owner-requests-animal-stack">
                {listingsWithRequests.map((listing) => {
                  const urls = ownerListingImageUrls(listing);
                  const thumb = urls[0]
                    ? resolveOwnerListingImageUrl(urls[0], apiBase)
                    : "";
                  const count = inquiryCountByListing.get(Number(listing.id)) || 0;
                  const active = selectedListingId === Number(listing.id);
                  return (
                    <button
                      key={listing.id}
                      type="button"
                      className={`owner-requests-animal-row ${
                        active ? "owner-requests-animal-row-active" : ""
                      }`}
                      onClick={() => selectListing(listing.id)}
                    >
                      {thumb ? (
                        <img src={thumb} alt="" className="owner-requests-animal-thumb" />
                      ) : (
                        <span
                          className="owner-requests-animal-thumb-placeholder"
                          aria-hidden
                        />
                      )}
                      <span className="owner-requests-animal-row-text">
                        <span className="owner-requests-animal-row-name">{listing.name}</span>
                        <span className="owner-requests-animal-row-meta">
                          {listing.animalType} · {listing.breed}
                        </span>
                        <span className="owner-requests-animal-row-requests">
                          {count} request{count === 1 ? "" : "s"}
                        </span>
                      </span>
                    </button>
                  );
                })}
              </div>
            )}
          </aside>

          <div className="owner-requests-detail-column">
            {!selectedListingId || !selectedListing ? (
              <p className="owner-request-detail-empty owner-request-detail-empty-tall">
                Select an animal on the left to view message requests.
              </p>
            ) : (
              <>
                <div className="owner-requests-selected-animal-head">
                  <h2>{selectedListing.name}</h2>
                  <p>
                    {selectedListing.animalType} · {selectedListing.breed}
                  </p>
                </div>

                {inquiriesForListing.length > 1 && (
                  <div className="owner-requests-request-picker">
                    <p className="owner-requests-request-picker-label">
                      Select a request
                    </p>
                    <div className="owner-request-cards owner-request-cards-compact">
                      {inquiriesForListing.map((request) => (
                        <button
                          key={request.id}
                          type="button"
                          className={`owner-request-card ${
                            selectedRequestId === request.id
                              ? "owner-request-card-active"
                              : ""
                          }`}
                          onClick={() => setSelectedRequestId(request.id)}
                        >
                          <div className="owner-request-card-top">
                            <div>
                              <h3>{request.adopterName}</h3>
                              <span className="owner-request-status">{request.status}</span>
                            </div>
                            <span className="owner-request-date">
                              {formatInquiryDate(request.createdAt)}
                            </span>
                          </div>
                          <p className="owner-request-summary">{request.initialMessage}</p>
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                <div className="owner-request-detail-panel owner-request-detail-panel-thread">
                  <OwnerInquiryThreadPanel
                    inquiryId={selectedRequestId}
                    ownerId={ownerId}
                    onUpdated={refresh}
                  />
                </div>
              </>
            )}
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}

function ListingsShowcase({ listings, goToListings, goToListingDetail }) {
  return (
    <section className="owner-listings-showcase">
      <div className="owner-listings-showcase-head">
        <div>
          <p className="owner-requests-tag">Your listings</p>
          <h2>Animals on your profile</h2>
        </div>

        <button
          type="button"
          className="owner-listings-showcase-link"
          onClick={goToListings}
        >
          View dashboard
        </button>
      </div>

      <div className="owner-listings-grid">
        {listings.map((listing) => (
          <div key={listing.id} className="owner-listing-card">
            <div className="owner-listing-top">
              <div>
                <h3>{listing.name}</h3>
                <p>
                  {listing.animalType} · {listing.breed}
                </p>
              </div>
              <span
                className={`owner-listing-status ${
                  listing.listingStatus === "Active" || !listing.listingStatus
                    ? "owner-listing-status-active"
                    : "owner-listing-status-draft"
                }`}
              >
                {listing.listingStatus || "Active"}
              </span>
            </div>

            <button
              type="button"
              className="owner-listing-view-btn"
              onClick={() => goToListingDetail(listing.id)}
            >
              View listing
            </button>
          </div>
        ))}
      </div>
    </section>
  );
}

export default OwnerManageRequestsPage;
