import React, { useEffect, useState } from "react";
import "./OwnerAdopterContactPanel.css";
import { fetchAdopterProfile } from "../utils/platformApi";
import { splitSavedLocation } from "../utils/turkeyLocation";

function displayValue(v) {
  if (v == null || v === "") {
    return "—";
  }
  return String(v);
}

function adopterAgeLabel(birthYear) {
  const y = Number(birthYear);
  if (!Number.isFinite(y) || y < 1900) {
    return null;
  }
  const age = new Date().getFullYear() - y;
  if (age < 1 || age > 120) {
    return null;
  }
  return `${age} years old`;
}

function OwnerAdopterContactPanel({ adopterUserId, adopterName }) {
  const [loading, setLoading] = useState(false);
  const [profile, setProfile] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (adopterUserId == null) {
      setProfile(null);
      setError(null);
      return;
    }
    let cancelled = false;
    setLoading(true);
    setError(null);
    fetchAdopterProfile(adopterUserId)
      .then((data) => {
        if (!cancelled) {
          setProfile(data);
        }
      })
      .catch((e) => {
        if (!cancelled) {
          setError(e.message || "Could not load adopter profile");
          setProfile(null);
        }
      })
      .finally(() => {
        if (!cancelled) {
          setLoading(false);
        }
      });
    return () => {
      cancelled = true;
    };
  }, [adopterUserId]);

  if (adopterUserId == null) {
    return null;
  }

  const { provinceName, districtName } = splitSavedLocation(profile?.location);
  const ageText = adopterAgeLabel(profile?.birthYear);

  return (
    <section
      className="owner-adopter-contact-panel"
      aria-labelledby="owner-adopter-contact-title"
    >
      <div className="owner-adopter-contact-head">
        <h3 id="owner-adopter-contact-title">Adopter profile</h3>
        {(adopterName || profile?.fullName) && (
          <p className="owner-adopter-contact-sub">
            {profile?.fullName || adopterName}
          </p>
        )}
      </div>

      {loading && <p className="owner-adopter-contact-muted">Loading profile…</p>}

      {!loading && error && (
        <p className="owner-adopter-contact-error">{error}</p>
      )}

      {!loading && !error && profile && (
        <dl className="owner-adopter-contact-grid">
          <div className="owner-adopter-contact-row">
            <dt>Email</dt>
            <dd>{displayValue(profile.email)}</dd>
          </div>
          <div className="owner-adopter-contact-row">
            <dt>Phone</dt>
            <dd>{displayValue(profile.phone)}</dd>
          </div>
          <div className="owner-adopter-contact-row">
            <dt>Province</dt>
            <dd>{displayValue(provinceName || profile.location)}</dd>
          </div>
          <div className="owner-adopter-contact-row">
            <dt>District</dt>
            <dd>{displayValue(districtName)}</dd>
          </div>
          <div className="owner-adopter-contact-row">
            <dt>Age</dt>
            <dd>{ageText || (profile.birthYear ? `Born ${profile.birthYear}` : "—")}</dd>
          </div>
        </dl>
      )}
    </section>
  );
}

export default OwnerAdopterContactPanel;
