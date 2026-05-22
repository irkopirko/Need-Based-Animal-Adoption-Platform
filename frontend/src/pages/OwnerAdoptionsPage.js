import React, { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import "./OwnerAdoptionsPage.css";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import { getResolvedUserId, getStoredUser, normalizeRole } from "../utils/auth";
import { fetchOwnerAdoptionCases } from "../utils/platformApi";
import { fetchOwnerListings, ownerListingImageUrls, resolveOwnerListingImageUrl } from "../utils/ownerJourney";
import { getApiBaseUrl } from "../utils/auth";

function statusLabel(status) {
  const s = String(status || "").toUpperCase();
  if (s === "COMPLETED") return "Adopted";
  if (s === "RESERVED") return "Reserved";
  if (s === "ACCEPTED") return "Approved";
  if (s === "PROPOSED") return "In progress";
  if (s === "CANCELLED") return "Cancelled";
  return status || "—";
}

function OwnerAdoptionsPage() {
  const navigate = useNavigate();
  const [cases, setCases] = useState([]);
  const [listings, setListings] = useState([]);
  const [loading, setLoading] = useState(true);
  const ownerId = getResolvedUserId(getStoredUser());
  const apiBase = getApiBaseUrl();

  useEffect(() => {
    if (ownerId == null || normalizeRole(getStoredUser()?.role) !== "OWNER") {
      setLoading(false);
      return;
    }
    Promise.all([
      fetchOwnerAdoptionCases(ownerId),
      fetchOwnerListings(ownerId)
    ])
      .then(([caseRows, listingRows]) => {
        setCases(Array.isArray(caseRows) ? caseRows : []);
        setListings(Array.isArray(listingRows) ? listingRows : []);
      })
      .catch(() => {
        setCases([]);
        setListings([]);
      })
      .finally(() => setLoading(false));
  }, [ownerId]);

  const adoptedFromListings = useMemo(
    () =>
      listings.filter(
        (l) => String(l.listingStatus || "").toUpperCase() === "ADOPTED"
      ),
    [listings]
  );

  const completedCases = useMemo(
    () =>
      cases.filter((c) => String(c.status || "").toUpperCase() === "COMPLETED"),
    [cases]
  );

  const rows = useMemo(() => {
    const byAnimal = new Map();
    for (const c of completedCases) {
      byAnimal.set(Number(c.animalId), { case: c, listing: null });
    }
    for (const l of adoptedFromListings) {
      const existing = byAnimal.get(Number(l.id));
      if (existing) {
        existing.listing = l;
      } else {
        byAnimal.set(Number(l.id), { case: null, listing: l });
      }
    }
    return [...byAnimal.values()];
  }, [completedCases, adoptedFromListings]);

  const openThread = (inquiryId) => {
    if (inquiryId) {
      navigate(`/owner-messages?inquiry=${encodeURIComponent(inquiryId)}`);
      return;
    }
    navigate("/owner-messages");
  };

  return (
    <div className="owner-adoptions-page">
      <Navbar />
      <main className="owner-adoptions-main">
        <header>
          <p className="owner-adoptions-tag">Owner</p>
          <h1>Adopted animals</h1>
          <p>
            Listings marked as adopted are kept here separately from active and archived
            animals. You can still view the adopter profile and continue messaging after
            the adoption is complete.
          </p>
        </header>

        {loading && <p>Loading…</p>}

        {!loading && rows.length === 0 && (
          <p className="owner-adoptions-empty">
            No adopted listings yet. When you mark an adoption complete in Messages, the
            animal appears here.
          </p>
        )}

        <ul className="owner-adoptions-list">
          {rows.map(({ case: c, listing }) => {
            const animalId = c?.animalId ?? listing?.id;
            const animalName = c?.animalName ?? listing?.name ?? "Animal";
            const listingCode = c?.listingCode;
            const imgs = listing ? ownerListingImageUrls(listing) : [];
            const thumb = imgs[0] ? resolveOwnerListingImageUrl(imgs[0], apiBase) : "";
            return (
              <li key={`adopted-${animalId}`} className="owner-adoptions-row">
                {thumb ? (
                  <img src={thumb} alt="" className="owner-adoptions-thumb" />
                ) : (
                  <span className="owner-adoptions-thumb-placeholder" aria-hidden />
                )}
                <div className="owner-adoptions-row-body">
                  <strong>{animalName}</strong>
                  <span className="owner-adoptions-status">
                    {statusLabel(c?.status || "ADOPTED")}
                  </span>
                  <p>
                    {c?.adopterName || "Adopter"}
                    {listingCode ? ` · ${listingCode}` : ""}
                    {c?.matchPercentageSnapshot != null
                      ? ` · ${Math.round(c.matchPercentageSnapshot)}% match`
                      : ""}
                  </p>
                  <p className="owner-adoptions-hint">
                    Hidden from compatibility matching. Messaging stays available for this
                    adoption.
                  </p>
                </div>
                <div className="owner-adoptions-actions">
                  {c?.inquiryId && (
                    <button
                      type="button"
                      className="owner-adoptions-outline"
                      onClick={() => openThread(c.inquiryId)}
                    >
                      Messages &amp; profile
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={() => navigate(`/animal/${animalId}/requests`)}
                  >
                    Manage requests
                  </button>
                </div>
              </li>
            );
          })}
        </ul>
      </main>
      <Footer />
    </div>
  );
}

export default OwnerAdoptionsPage;
