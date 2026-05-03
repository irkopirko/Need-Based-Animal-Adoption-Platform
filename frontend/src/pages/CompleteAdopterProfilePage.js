import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import { usePopup } from "../components/PopupProvider";
import {
  broadcastStoredUserRefresh,
  getApiBaseUrl,
  getStoredUser,
  normalizeRole
} from "../utils/auth";
import "./CompleteAdopterProfilePage.css";

const LISTING_OPTIONS = [
  { value: "", label: "Select one" },
  { value: "SHELTER", label: "Shelter — I list animals on behalf of a shelter or rescue" },
  {
    value: "INDIVIDUAL",
    label: "Individual owner — I list my own pets as a private person"
  }
];

function CompleteOwnerProfilePage() {
  const navigate = useNavigate();
  const { showPopup } = usePopup();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [ownerListingType, setOwnerListingType] = useState("");
  const [userId, setUserId] = useState(null);

  useEffect(() => {
    const stored = getStoredUser();
    if (!stored?.userId) {
      showPopup({
        type: "warning",
        title: "Sign in required",
        message: "Please log in to complete your profile."
      });
      navigate("/login", { replace: true });
      return;
    }
    if (normalizeRole(stored.role) !== "OWNER") {
      showPopup({
        type: "info",
        title: "Wrong account type",
        message: "This page is only for pet owners."
      });
      navigate("/", { replace: true });
      return;
    }

    const apiBaseUrl = getApiBaseUrl();
    fetch(`${apiBaseUrl}/api/auth/profile/${stored.userId}`)
      .then((res) => (res.ok ? res.json() : null))
      .then((profile) => {
        if (profile) {
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
          if (profile.ownerProfileCompleted) {
            navigate("/ownerhomepage", { replace: true });
            return;
          }
        }
        setUserId(stored.userId);
        setLoading(false);
      })
      .catch(() => {
        setUserId(stored.userId);
        setLoading(false);
      });
  }, [navigate, showPopup]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!userId) return;

    if (!ownerListingType) {
      showPopup({
        type: "warning",
        title: "Selection required",
        message: "Please choose whether you list as a shelter or as an individual owner."
      });
      return;
    }

    setSaving(true);
    const apiBaseUrl = getApiBaseUrl();
    try {
      const response = await fetch(`${apiBaseUrl}/api/auth/complete-owner-profile`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId,
          ownerListingType
        })
      });
      const data = await response.json();
      if (!response.ok) {
        showPopup({
          type: "error",
          title: "Could not save",
          message: data.error || "Profile could not be saved."
        });
        return;
      }

      const prev = getStoredUser() || {};
      localStorage.setItem(
        "paviaUser",
        JSON.stringify({
          ...prev,
          ownerProfileCompleted: true,
          ownerListingType: data.ownerListingType || ownerListingType
        })
      );
      broadcastStoredUserRefresh();

      showPopup({
        type: "success",
        title: "Profile complete",
        message: "You can now register animals for adoption."
      });
      navigate("/ownerhomepage", { replace: true });
    } catch (err) {
      console.error(err);
      showPopup({
        type: "error",
        title: "Connection error",
        message: "Could not reach the server."
      });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="complete-profile-page">
      <Navbar />
      <main className="complete-profile-main">
        <div className="complete-profile-card">
          <p className="complete-profile-kicker">Before you list</p>
          <h1 className="complete-profile-title">Complete your owner profile</h1>
          <p className="complete-profile-lead">
            Tell us how you list animals on Pavia. You need to complete this once before you
            can register any animal. Contact details stay in Edit profile.
          </p>

          {loading ? (
            <p className="complete-profile-loading">Loading…</p>
          ) : (
            <form className="complete-profile-form" noValidate onSubmit={handleSubmit}>
              <label className="complete-profile-label">
                <span className="complete-profile-label-heading">
                  How do you list? <span className="complete-profile-req" aria-hidden="true">*</span>
                </span>
                <select
                  className="complete-profile-select"
                  value={ownerListingType}
                  onChange={(e) => setOwnerListingType(e.target.value)}
                >
                  {LISTING_OPTIONS.map((opt) => (
                    <option key={opt.value || "empty"} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                </select>
              </label>

              <div className="complete-profile-actions">
                <button
                  type="button"
                  className="complete-profile-btn complete-profile-btn-ghost"
                  onClick={() => navigate("/ownerhomepage")}
                  disabled={saving}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="complete-profile-btn complete-profile-btn-primary"
                  disabled={saving}
                >
                  {saving ? "Saving…" : "Save and continue"}
                </button>
              </div>
            </form>
          )}

          <p className="complete-profile-required-note">
            <span className="complete-profile-required-star" aria-hidden="true">
              *
            </span>
            indicates required fields
          </p>
        </div>
      </main>
      <Footer />
    </div>
  );
}

export default CompleteOwnerProfilePage;
