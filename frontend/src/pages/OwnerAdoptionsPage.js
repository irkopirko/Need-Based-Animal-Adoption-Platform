import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import "./OwnerAdoptionsPage.css";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import { getResolvedUserId, getStoredUser, normalizeRole } from "../utils/auth";
import { fetchOwnerAdoptionCases } from "../utils/platformApi";

function statusLabel(status) {
  const s = String(status || "").toUpperCase();
  if (s === "COMPLETED") return "Adopted";
  if (s === "RESERVED") return "Reserved";
  if (s === "ACCEPTED") return "Approved";
  if (s === "PROPOSED") return "New request";
  if (s === "CANCELLED") return "Cancelled";
  return status || "—";
}

function OwnerAdoptionsPage() {
  const navigate = useNavigate();
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const ownerId = getResolvedUserId(getStoredUser());

  useEffect(() => {
    if (ownerId == null || normalizeRole(getStoredUser()?.role) !== "OWNER") {
      setLoading(false);
      return;
    }
    fetchOwnerAdoptionCases(ownerId)
      .then((data) => setRows(Array.isArray(data) ? data : []))
      .catch(() => setRows([]))
      .finally(() => setLoading(false));
  }, [ownerId]);

  return (
    <div className="owner-adoptions-page">
      <Navbar />
      <main className="owner-adoptions-main">
        <header>
          <p className="owner-adoptions-tag">Owner</p>
          <h1>Adoption pipeline</h1>
          <p>All adoption cases linked to your listings.</p>
        </header>
        {loading && <p>Loading…</p>}
        {!loading && rows.length === 0 && <p>No adoption cases yet.</p>}
        <ul className="owner-adoptions-list">
          {rows.map((r) => (
            <li key={r.id} className="owner-adoptions-row">
              <div>
                <strong>{r.animalName}</strong>
                <span className="owner-adoptions-status">{statusLabel(r.status)}</span>
                <p>
                  {r.adopterName || "Adopter"} · {r.listingCode}
                  {r.matchPercentageSnapshot != null
                    ? ` · ${Math.round(r.matchPercentageSnapshot)}%`
                    : ""}
                </p>
              </div>
              <div className="owner-adoptions-actions">
                {r.inquiryId && (
                  <button
                    type="button"
                    className="owner-adoptions-outline"
                    onClick={() =>
                      navigate(`/owner-messages?inquiry=${encodeURIComponent(r.inquiryId)}`)
                    }
                  >
                    Messages
                  </button>
                )}
                <button type="button" onClick={() => navigate(`/animal/${r.animalId}`)}>
                  Listing
                </button>
              </div>
            </li>
          ))}
        </ul>
      </main>
      <Footer />
    </div>
  );
}

export default OwnerAdoptionsPage;
