import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import "./AdopterAdoptionsPage.css";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import { getResolvedUserId, getStoredUser, normalizeRole } from "../utils/auth";
import { fetchAdopterAdoptionCases } from "../utils/platformApi";

function statusLabel(status) {
  const s = String(status || "").toUpperCase();
  if (s === "COMPLETED") return "Adopted";
  if (s === "RESERVED") return "Reserved";
  if (s === "ACCEPTED") return "Approved";
  if (s === "PROPOSED") return "In review";
  if (s === "CANCELLED") return "Cancelled";
  return status || "—";
}

function AdopterAdoptionsPage() {
  const navigate = useNavigate();
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const uid = getResolvedUserId(getStoredUser());

  useEffect(() => {
    if (uid == null || normalizeRole(getStoredUser()?.role) !== "ADOPTER") {
      setLoading(false);
      return;
    }
    fetchAdopterAdoptionCases(uid)
      .then((data) => setRows(Array.isArray(data) ? data : []))
      .catch(() => setRows([]))
      .finally(() => setLoading(false));
  }, [uid]);

  return (
    <div className="adopter-adoptions-page">
      <Navbar />
      <main className="adopter-adoptions-main">
        <header>
          <p className="adopter-adoptions-tag">Adopter</p>
          <h1>My adoptions</h1>
          <p>Track animals you contacted, reserved, or adopted.</p>
        </header>
        {loading && <p>Loading…</p>}
        {!loading && rows.length === 0 && (
          <p className="adopter-adoptions-empty">
            No adoption cases yet. Message an owner from a compatible listing to start.
          </p>
        )}
        <ul className="adopter-adoptions-list">
          {rows.map((r) => (
            <li key={r.id} className="adopter-adoptions-row">
              <div>
                <strong>{r.animalName}</strong>
                <span className={`adopter-adoptions-status adopter-adoptions-status-${String(r.status || "").toLowerCase()}`}>
                  {statusLabel(r.status)}
                </span>
                <p>
                  {r.listingCode}
                  {r.matchPercentageSnapshot != null
                    ? ` · ${Math.round(r.matchPercentageSnapshot)}% match`
                    : ""}
                </p>
              </div>
              <button type="button" onClick={() => navigate(`/animal/${r.animalId}`)}>
                View listing
              </button>
            </li>
          ))}
        </ul>
      </main>
      <Footer />
    </div>
  );
}

export default AdopterAdoptionsPage;
