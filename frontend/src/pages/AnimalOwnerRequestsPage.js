import React, { useCallback, useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import "./OwnerManageRequestsPage.css";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import { getApiBaseUrl, getResolvedUserId, getStoredUser, normalizeRole } from "../utils/auth";
import OwnerInquiryThreadPanel from "../components/OwnerInquiryThreadPanel";
import { STRONG_MATCH_THRESHOLD } from "../utils/adopterJourney";
import {
  normalizeAnimalFromApi,
  fetchInquiriesForAnimal,
  formatInquiryDate
} from "../utils/ownerJourney";

function AnimalOwnerRequestsPage() {
  const { animalId } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [forbidden, setForbidden] = useState(false);
  const [animal, setAnimal] = useState(null);
  const [inquiries, setInquiries] = useState([]);
  const [selectedId, setSelectedId] = useState(null);

  const aid = Number(animalId);
  const ownerId = getResolvedUserId(getStoredUser());

  const loadInquiries = useCallback(async (ownerUserId) => {
    const list = await fetchInquiriesForAnimal(ownerUserId, aid);
    const sorted = list.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    setInquiries(sorted);
    setSelectedId((prev) => {
      if (prev && sorted.some((i) => i.id === prev)) {
        return prev;
      }
      return sorted[0]?.id || null;
    });
  }, [aid]);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      setForbidden(false);
      const user = getStoredUser();
      if (!user?.userId || normalizeRole(user.role) !== "OWNER") {
        setForbidden(true);
        setAnimal(null);
        setLoading(false);
        return;
      }
      if (!Number.isFinite(aid)) {
        setForbidden(true);
        setLoading(false);
        return;
      }
      try {
        const api = getApiBaseUrl();
        const res = await fetch(`${api}/api/animals/${aid}`);
        if (!res.ok) {
          setForbidden(true);
          setAnimal(null);
          setLoading(false);
          return;
        }
        const raw = await res.json();
        const data = normalizeAnimalFromApi(raw);
        if (Number(data.ownerId) !== Number(user.userId)) {
          setForbidden(true);
          setAnimal(null);
        } else {
          setAnimal(data);
          await loadInquiries(Number(user.userId));
        }
      } catch {
        setForbidden(true);
        setAnimal(null);
      }
      setLoading(false);
    };
    load();
  }, [aid, loadInquiries]);

  const reloadInquiries = useCallback(async () => {
    if (ownerId == null) {
      return;
    }
    await loadInquiries(ownerId);
  }, [ownerId, loadInquiries]);

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

  if (forbidden || !animal) {
    return (
      <div className="owner-requests-page">
        <Navbar />
        <main className="owner-requests-main">
          <section className="owner-requests-hero owner-requests-hero-simple">
            <p className="owner-requests-tag">Manage requests</p>
            <h1>Unavailable</h1>
            <p>You can only view requests for your own listings. Sign in as the owner of this animal.</p>
            <button
              type="button"
              className="owner-request-message-btn"
              onClick={() => navigate("/ownerhomepage")}
            >
              Back to owner home
            </button>
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
            <p className="owner-requests-tag">Manage requests</p>
            <h1>Requests for {animal.name}</h1>
            <p>
              Inquiries from adopters who used <strong>Get in contact with owner</strong> on this
              listing (strong match ≥ {STRONG_MATCH_THRESHOLD}%). Open Messages to reply.
            </p>
            <div style={{ display: "flex", gap: "0.75rem", flexWrap: "wrap", marginTop: "1rem" }}>
              <button
                type="button"
                className="owner-request-message-btn"
                onClick={() => navigate(`/animal/${animal.id}`)}
              >
                Back to listing
              </button>
              <button
                type="button"
                className="owner-request-accept-btn"
                onClick={() => navigate("/owner-requests")}
              >
                All requests
              </button>
            </div>
          </div>
        </section>

        <section className="owner-requests-layout">
          <div className="owner-request-list-panel">
            <div className="owner-request-list-head">
              <div>
                <h2>Inquiries for this animal</h2>
                <p>Saved in the database for this listing</p>
              </div>
              <span className="owner-request-count">{inquiries.length}</span>
            </div>

            {inquiries.length === 0 ? (
              <p className="owner-request-detail-empty" style={{ padding: "1rem" }}>
                No inquiries yet for this listing. When an adopter with a strong match uses Get in
                contact on the animal page, it will appear here.
              </p>
            ) : (
              <div className="owner-request-cards">
                {inquiries.map((request) => (
                  <button
                    key={request.id}
                    type="button"
                    className={`owner-request-card ${
                      selectedId === request.id ? "owner-request-card-active" : ""
                    }`}
                    onClick={() => setSelectedId(request.id)}
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
            )}
          </div>

          <div className="owner-request-detail-panel owner-request-detail-panel-thread">
            <OwnerInquiryThreadPanel
              inquiryId={selectedId}
              ownerId={ownerId}
              onUpdated={reloadInquiries}
            />
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}

export default AnimalOwnerRequestsPage;
