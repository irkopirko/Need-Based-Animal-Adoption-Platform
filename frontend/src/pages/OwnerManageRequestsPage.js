import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import "./OwnerManageRequestsPage.css";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";

function OwnerManageRequestsPage() {
  const navigate = useNavigate();
  const [hasListings] = useState(true);
  const [hasRequests] = useState(false);
  const [selectedRequestId, setSelectedRequestId] = useState(1);

  const listings = [
    {
      id: 1,
      name: "Luna",
      type: "Dog",
      breed: "Golden Retriever",
      status: "Active"
    },
    {
      id: 2,
      name: "Milo",
      type: "Cat",
      breed: "British Shorthair",
      status: "Active"
    },
    {
      id: 3,
      name: "Daisy",
      type: "Dog",
      breed: "Mixed Breed",
      status: "Draft"
    }
  ];

  const requests = [
    {
      id: 1,
      adopterName: "Ceren Sarıgül",
      animalName: "Luna",
      requestDate: "Today",
      status: "New",
      summary: "Interested in a medium-energy companion for apartment living."
    },
    {
      id: 2,
      adopterName: "Elif Aydın",
      animalName: "Milo",
      requestDate: "Yesterday",
      status: "In Review",
      summary: "Has previous cat experience and a quiet home environment."
    },
    {
      id: 3,
      adopterName: "Mert Kaya",
      animalName: "Luna",
      requestDate: "Mon",
      status: "Pending",
      summary: "Looking for a social and family-friendly animal."
    }
  ];

  const requestDetails = {
    1: {
      adopterName: "Ceren Sarıgül",
      animalName: "Luna",
      status: "New",
      household: "Lives in an apartment with one other adult.",
      lifestyle: "Works hybrid and spends most evenings at home.",
      note: "Interested in a friendly animal that can adapt to apartment life."
    },
    2: {
      adopterName: "Elif Aydın",
      animalName: "Milo",
      status: "In Review",
      household: "Quiet two-person household with no children.",
      lifestyle: "Stable routine and prior experience with cats.",
      note: "Prefers a low-energy animal and indoor living."
    },
    3: {
      adopterName: "Mert Kaya",
      animalName: "Luna",
      status: "Pending",
      household: "Family household with a garden.",
      lifestyle: "Active weekends and flexible weekday schedule.",
      note: "Searching for a social animal with playful energy."
    }
  };

  const selectedRequest = requestDetails[selectedRequestId];

  const goToRegisterAnimal = () => {
    navigate("/register-animal");
  };

  const goToListings = () => {
    navigate("/ownerhomepage");
  };

  const goToListingDetail = (listingId) => {
    navigate(`/listing/${listingId}`);
  };

  const goToMessages = () => {
    navigate("/owner-messages");
  };

  if (!hasListings) {
    return (
      <div className="owner-requests-page">
        <Navbar />

        <main className="owner-requests-locked-main">
          <div className="owner-requests-locked-card">
            <span className="owner-requests-locked-badge">No Listings</span>
            <h1>You need to create a listing first</h1>
            <p>
              Manage Requests only becomes active after you register at least one
              animal. Once your listings are visible, incoming adopter requests
              will appear here.
            </p>
            <button
              type="button"
              className="owner-requests-primary-btn"
              onClick={goToRegisterAnimal}
            >
              Register Animal
            </button>
          </div>
        </main>

        <Footer />
      </div>
    );
  }

  if (hasListings && !hasRequests) {
    return (
      <div className="owner-requests-page">
        <Navbar />

        <main className="owner-requests-main">
          <section className="owner-requests-hero owner-requests-hero-simple">
            <div className="owner-requests-hero-left owner-requests-hero-full">
              <p className="owner-requests-tag">Manage Requests</p>
              <h1>No requests yet, but your listings are live.</h1>
              <p>
                Once adopters begin showing interest in your animals, their
                requests will appear here for review and follow-up.
              </p>
            </div>
          </section>

          <section className="owner-requests-empty-section">
            <div className="owner-requests-empty-card">
              <span className="owner-requests-empty-badge">No Requests Yet</span>
              <h2>Your inbox is currently quiet</h2>
              <p>
                You already have active listings, but no adopter requests have
                arrived yet. Below you can review your existing listings while
                you wait for interest to come in.
              </p>
            </div>
          </section>

          <section className="owner-listings-showcase">
            <div className="owner-listings-showcase-head">
              <div>
                <p className="owner-requests-tag">Your Listings</p>
                <h2>Animals currently listed on your profile</h2>
              </div>

              <button
                type="button"
                className="owner-listings-showcase-link"
                onClick={goToListings}
              >
                View Dashboard
              </button>
            </div>

            <div className="owner-listings-grid">
              {listings.map((listing) => (
                <div key={listing.id} className="owner-listing-card">
                  <div className="owner-listing-top">
                    <div>
                      <h3>{listing.name}</h3>
                      <p>
                        {listing.type} · {listing.breed}
                      </p>
                    </div>
                    <span
                      className={`owner-listing-status ${
                        listing.status === "Active"
                          ? "owner-listing-status-active"
                          : "owner-listing-status-draft"
                      }`}
                    >
                      {listing.status}
                    </span>
                  </div>

                  <button
                    type="button"
                    className="owner-listing-view-btn"
                    onClick={() => goToListingDetail(listing.id)}
                  >
                    View Listing
                  </button>
                </div>
              ))}
            </div>
          </section>
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
            <p className="owner-requests-tag">Manage Requests</p>
            <h1>Review adopter interest with more clarity and control.</h1>
            <p>
              Track incoming requests, review adopter information, and move
              forward with a more structured decision-making flow.
            </p>
          </div>
        </section>

        <section className="owner-requests-layout">
          <div className="owner-request-list-panel">
            <div className="owner-request-list-head">
              <div>
                <h2>Incoming Requests</h2>
                <p>Review adopter interest across your listed animals</p>
              </div>
              <span className="owner-request-count">{requests.length}</span>
            </div>

            <div className="owner-request-cards">
              {requests.map((request) => (
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
                      <p>For {request.animalName}</p>
                    </div>
                    <span className="owner-request-date">{request.requestDate}</span>
                  </div>

                  <p className="owner-request-summary">{request.summary}</p>

                  <div className="owner-request-meta">
                    <span className="owner-request-status">{request.status}</span>
                  </div>
                </button>
              ))}
            </div>
          </div>

          <div className="owner-request-detail-panel">
            <div className="owner-request-detail-head">
              <div>
                <h2>{selectedRequest.adopterName}</h2>
                <p>Request for {selectedRequest.animalName}</p>
              </div>
              <span className="owner-request-detail-badge">
                {selectedRequest.status}
              </span>
            </div>

            <div className="owner-request-detail-grid">
              <div className="owner-request-detail-card">
                <h3>Household</h3>
                <p>{selectedRequest.household}</p>
              </div>

              <div className="owner-request-detail-card">
                <h3>Lifestyle</h3>
                <p>{selectedRequest.lifestyle}</p>
              </div>

              <div className="owner-request-detail-card owner-request-detail-card-wide">
                <h3>Adopter Note</h3>
                <p>{selectedRequest.note}</p>
              </div>
            </div>

            <div className="owner-request-action-strip">
              <button type="button" className="owner-request-accept-btn">
                Mark as Reviewed
              </button>
              <button
                type="button"
                className="owner-request-message-btn"
                onClick={goToMessages}
              >
                Open Messages
              </button>
              <button type="button" className="owner-request-decline-btn">
                Archive
              </button>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}

export default OwnerManageRequestsPage;