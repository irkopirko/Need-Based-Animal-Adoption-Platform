import React, { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import "./OwnerManageRequestsPage.css";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import { getStoredUser, normalizeRole } from "../utils/auth";
import {
  loadOwnerEngagementState,
  resolveOwnerScenario,
  formatInquiryDate,
  PAVIA_OWNER_ENGAGEMENT_UPDATED,
  STRONG_MATCH_THRESHOLD
} from "../utils/ownerJourney";

function OwnerManageRequestsPage() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [scenario, setScenario] = useState("NO_LISTINGS");
  const [engage, setEngage] = useState(null);
  const [selectedRequestId, setSelectedRequestId] = useState(null);

  const refresh = useCallback(async () => {
    const user = getStoredUser();
    if (!user?.userId || normalizeRole(user.role) !== "OWNER") {
      setScenario("NOT_OWNER");
      setEngage(null);
      setLoading(false);
      return;
    }
    setLoading(true);
    const data = await loadOwnerEngagementState(user.userId);
    const scen = resolveOwnerScenario({
      hasListings: data.hasListings,
      hasStrongMatchOnListings: data.hasStrongMatchOnListings,
      hasInquiries: data.hasInquiries,
      hasAnyMessages: data.hasAnyMessages
    });
    setEngage(data);
    setScenario(scen);

    if (
      scen === "INQUIRY_NO_MESSAGES" ||
      scen === "FULL"
    ) {
      const sorted = [...(data.inquiries || [])].sort(
        (a, b) => new Date(b.createdAt) - new Date(a.createdAt)
      );
      setSelectedRequestId((prev) => {
        if (prev && sorted.some((i) => i.id === prev)) {
          return prev;
        }
        return sorted[0]?.id || null;
      });
    } else {
      setSelectedRequestId(null);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    refresh();
    const fn = () => refresh();
    window.addEventListener(PAVIA_OWNER_ENGAGEMENT_UPDATED, fn);
    return () => window.removeEventListener(PAVIA_OWNER_ENGAGEMENT_UPDATED, fn);
  }, [refresh]);

  const selectedInquiry = useMemo(
    () => engage?.inquiries?.find((i) => i.id === selectedRequestId),
    [engage, selectedRequestId]
  );

  const threadMessages = useMemo(() => {
    if (!selectedInquiry?.messages) {
      return [];
    }
    return selectedInquiry.messages;
  }, [selectedInquiry]);

  const listings = engage?.listings || [];
  const inquiriesSorted = useMemo(
    () =>
      [...(engage?.inquiries || [])].sort(
        (a, b) => new Date(b.createdAt) - new Date(a.createdAt)
      ),
    [engage]
  );

  const goToRegisterAnimal = () => {
    navigate("/register-animal");
  };

  const goToListings = () => {
    navigate("/ownerhomepage");
  };

  const goToListingDetail = (listingId) => {
    navigate(`/animal/${listingId}`);
  };

  const goToMessages = (inquiryId) => {
    if (inquiryId) {
      navigate(`/owner-messages?inquiry=${encodeURIComponent(inquiryId)}`);
    } else {
      navigate("/owner-messages");
    }
  };

  if (loading) {
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

  if (scenario === "LISTINGS_NO_STRONG_MATCH") {
    return (
      <div className="owner-requests-page">
        <Navbar />
        <main className="owner-requests-main">
          <section className="owner-requests-hero owner-requests-hero-simple">
            <div className="owner-requests-hero-left owner-requests-hero-full">
              <p className="owner-requests-tag">Manage requests</p>
              <h1>No strong matches on your listings yet</h1>
              <p>
                Adopters only see animals with compatibility scores of at least{" "}
                {STRONG_MATCH_THRESHOLD}% (inclusive). None of your listings are in
                that pool right now, so no inquiry flow has started from matches.
              </p>
            </div>
          </section>

          <section className="owner-requests-empty-section">
            <div className="owner-requests-empty-card">
              <span className="owner-requests-empty-badge">Listings without strong visibility</span>
              <h2>Keep listings accurate and complete</h2>
              <p>
                Better profiles can improve compatibility scoring. You can still
                receive inquiries later when your animals qualify.
              </p>
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

  return (
    <div className="owner-requests-page">
      <Navbar />

      <main className="owner-requests-main">
        <section className="owner-requests-hero owner-requests-hero-simple">
          <div className="owner-requests-hero-left owner-requests-hero-full">
            <p className="owner-requests-tag">Manage requests</p>
            <h1>Review inquiries from adopters</h1>
            <p>
              Each row is a real inquiry tied to one of your animals. Use Get in
              contact in Messages when a thread has no replies yet.
            </p>
          </div>
        </section>

        <section className="owner-requests-layout">
          <div className="owner-request-list-panel">
            <div className="owner-request-list-head">
              <div>
                <h2>Incoming inquiries</h2>
                <p>Strong matches (≥ {STRONG_MATCH_THRESHOLD}%) who reached out</p>
              </div>
              <span className="owner-request-count">{inquiriesSorted.length}</span>
            </div>

            <div className="owner-request-cards">
              {inquiriesSorted.map((request) => (
                <button
                  key={request.id}
                  type="button"
                  className={`owner-request-card ${
                    selectedRequestId === request.id ? "owner-request-card-active" : ""
                  }`}
                  onClick={() => setSelectedRequestId(request.id)}
                >
                  <div className="owner-request-card-top">
                    <div>
                      <h3>{request.adopterName}</h3>
                      <p>For {request.animalName}</p>
                    </div>
                    <span className="owner-request-date">
                      {formatInquiryDate(request.createdAt)}
                    </span>
                  </div>

                  <p className="owner-request-summary">{request.initialMessage}</p>

                  <div className="owner-request-meta">
                    <span className="owner-request-status">{request.status}</span>
                  </div>
                </button>
              ))}
            </div>
          </div>

          <div className="owner-request-detail-panel">
            {selectedInquiry ? (
              <>
                <div className="owner-request-detail-head">
                  <div>
                    <h2>{selectedInquiry.adopterName}</h2>
                    <p>Request for {selectedInquiry.animalName}</p>
                  </div>
                  <span className="owner-request-detail-badge">
                    {selectedInquiry.status}
                  </span>
                </div>

                {threadMessages.length === 0 && (
                  <div className="owner-request-get-contact-panel">
                    <strong>Get in contact</strong>
                    <p>
                      There are no messages in this thread yet. Open Messages to
                      send the first reply, or nudge the adopter from your side with
                      a short introduction.
                    </p>
                    <button
                      type="button"
                      className="owner-request-get-contact-btn"
                      onClick={() => goToMessages(selectedInquiry.id)}
                    >
                      Open messages &amp; reply
                    </button>
                  </div>
                )}

                <div className="owner-request-detail-grid">
                  <div className="owner-request-detail-card owner-request-detail-card-wide">
                    <h3>Inquiry</h3>
                    <p>{selectedInquiry.initialMessage}</p>
                  </div>

                  <div className="owner-request-detail-card">
                    <h3>Thread</h3>
                    <p>
                      {threadMessages.length
                        ? `${threadMessages.length} message(s) in inbox.`
                        : "No messages yet."}
                    </p>
                  </div>

                  <div className="owner-request-detail-card">
                    <h3>Animal</h3>
                    <p>Listing #{selectedInquiry.animalId}</p>
                  </div>
                </div>

                <div className="owner-request-action-strip">
                  <button
                    type="button"
                    className="owner-request-message-btn"
                    onClick={() => goToMessages(selectedInquiry.id)}
                  >
                    Open messages
                  </button>
                  <button
                    type="button"
                    className="owner-request-accept-btn"
                    onClick={() => navigate(`/animal/${selectedInquiry.animalId}`)}
                  >
                    View animal
                  </button>
                </div>
              </>
            ) : (
              <p className="owner-request-detail-empty">Select an inquiry.</p>
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
