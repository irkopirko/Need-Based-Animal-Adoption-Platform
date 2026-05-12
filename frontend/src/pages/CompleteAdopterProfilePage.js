import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import { ConfirmDialog } from "../components/ConfirmDialog";
import { usePopup } from "../components/PopupProvider";
import {
  broadcastStoredUserRefresh,
  getApiBaseUrl,
  getStoredUser,
  normalizeRole
} from "../utils/auth";
import "./CompleteAdopterProfilePage.css";

const MIN_STREET = 10;

const GENDER_OPTIONS = [
  { value: "", label: "Select gender" },
  { value: "MALE", label: "Male" },
  { value: "FEMALE", label: "Female" }
];

function CompleteAdopterProfilePage() {
  const navigate = useNavigate();
  const { showPopup } = usePopup();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [userId, setUserId] = useState(null);
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [addressLine, setAddressLine] = useState("");
  const [birthYear, setBirthYear] = useState("");
  const [gender, setGender] = useState("");
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deleteBusy, setDeleteBusy] = useState(false);

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
    if (normalizeRole(stored.role) !== "ADOPTER") {
      showPopup({
        type: "info",
        title: "Wrong account type",
        message: "This page is only for adopters."
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
              adopterProfileCompleted: profile.adopterProfileCompleted,
              fullName: profile.fullName || prev.fullName || ""
            })
          );
          broadcastStoredUserRefresh();
          if (profile.adopterProfileCompleted) {
            navigate("/adopterhomepage", { replace: true });
            return;
          }
          const full = String(profile.fullName || "").trim();
          const parts = full.split(/\s+/).filter(Boolean);
          if (parts.length >= 2) {
            setFirstName(parts[0]);
            setLastName(parts.slice(1).join(" "));
          } else if (parts.length === 1) {
            setFirstName(parts[0]);
            setLastName("");
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

    const fn = firstName.trim();
    const ln = lastName.trim();
    if (!fn) {
      showPopup({
        type: "warning",
        title: "First name required",
        message: "Please enter your first name."
      });
      return;
    }
    if (!ln) {
      showPopup({
        type: "warning",
        title: "Last name required",
        message: "Please enter your last name."
      });
      return;
    }
    const addr = addressLine.trim();
    if (!addr || addr.length < MIN_STREET) {
      showPopup({
        type: "warning",
        title: "Street address required",
        message: `Please enter your full street address (at least ${MIN_STREET} characters).`
      });
      return;
    }
    const yearNum = parseInt(String(birthYear).trim(), 10);
    const currentYear = new Date().getFullYear();
    if (!Number.isFinite(yearNum) || yearNum < 1900 || yearNum > currentYear - 13) {
      showPopup({
        type: "warning",
        title: "Birth year required",
        message: "Enter a valid birth year. You must be at least 13."
      });
      return;
    }
    if (!gender || (gender !== "MALE" && gender !== "FEMALE")) {
      showPopup({
        type: "warning",
        title: "Gender required",
        message: "Please select male or female."
      });
      return;
    }

    setSaving(true);
    const apiBaseUrl = getApiBaseUrl();
    try {
      const response = await fetch(`${apiBaseUrl}/api/auth/complete-adopter-profile`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId,
          firstName: fn,
          lastName: ln,
          addressLine: addr,
          birthYear: yearNum,
          gender
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
      const combined = `${fn} ${ln}`.trim();
      localStorage.setItem(
        "paviaUser",
        JSON.stringify({
          ...prev,
          adopterProfileCompleted: true,
          fullName: data.fullName || combined
        })
      );
      broadcastStoredUserRefresh();

      showPopup({
        type: "success",
        title: "Profile complete",
        message: "You can now browse animals and start an adoption request."
      });
      navigate("/adopterhomepage", { replace: true });
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

  const handleConfirmDeleteAccount = async () => {
    if (!userId) return;
    setDeleteBusy(true);
    const apiBaseUrl = getApiBaseUrl();
    try {
      const response = await fetch(`${apiBaseUrl}/api/auth/delete-account`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId })
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) {
        showPopup({
          type: "error",
          title: "Could not delete account",
          message: data.error || "Account could not be deleted."
        });
        return;
      }
      localStorage.removeItem("paviaUser");
      broadcastStoredUserRefresh();
      setDeleteDialogOpen(false);
      showPopup({
        type: "success",
        title: "Account deleted",
        message: "Your account and related data have been permanently removed."
      });
      navigate("/login", { replace: true });
    } catch (err) {
      console.error(err);
      showPopup({
        type: "error",
        title: "Connection error",
        message: "Could not reach the server."
      });
    } finally {
      setDeleteBusy(false);
    }
  };

  return (
    <div className="complete-profile-page complete-adopter-profile">
      <ConfirmDialog
        open={deleteDialogOpen}
        title="Delete your account?"
        description="Are you sure? This will permanently delete your account, profile, adoption requests, saved animals, and activity logs. This cannot be undone."
        confirmLabel="Yes, delete everything"
        cancelLabel="Cancel"
        confirmDanger
        busy={deleteBusy}
        onCancel={() => {
          if (!deleteBusy) setDeleteDialogOpen(false);
        }}
        onConfirm={handleConfirmDeleteAccount}
      />
      <Navbar />
      <main className="complete-profile-main">
        <div className="complete-profile-card">
          <p className="complete-profile-kicker">Welcome</p>
          <h1 className="complete-profile-title">Complete your adopter profile</h1>
          <p className="complete-profile-lead">
            We need a few details once before you can browse matches and submit adoption requests.
            You can update address and contact later in Account.
          </p>

          {loading ? (
            <p className="complete-profile-loading">Loading…</p>
          ) : (
            <form className="complete-profile-form" noValidate onSubmit={handleSubmit}>
              <div className="complete-profile-name-row">
                <label className="complete-profile-label">
                  <span className="complete-profile-label-heading">
                    First name <span className="complete-profile-req" aria-hidden="true">*</span>
                  </span>
                  <input
                    className="complete-profile-input"
                    value={firstName}
                    onChange={(e) => setFirstName(e.target.value)}
                    autoComplete="given-name"
                    placeholder="First name"
                  />
                </label>
                <label className="complete-profile-label">
                  <span className="complete-profile-label-heading">
                    Last name <span className="complete-profile-req" aria-hidden="true">*</span>
                  </span>
                  <input
                    className="complete-profile-input"
                    value={lastName}
                    onChange={(e) => setLastName(e.target.value)}
                    autoComplete="family-name"
                    placeholder="Last name"
                  />
                </label>
              </div>

              <label className="complete-profile-label">
                <span className="complete-profile-label-heading">
                  Street address <span className="complete-profile-req" aria-hidden="true">*</span>
                </span>
                <textarea
                  className="complete-profile-textarea"
                  value={addressLine}
                  onChange={(e) => setAddressLine(e.target.value)}
                  rows={3}
                  autoComplete="street-address"
                  placeholder={`Building, street, apartment… (min. ${MIN_STREET} characters)`}
                />
              </label>

              <label className="complete-profile-label">
                <span className="complete-profile-label-heading">
                  Birth year <span className="complete-profile-req" aria-hidden="true">*</span>
                </span>
                <input
                  className="complete-profile-input"
                  type="number"
                  value={birthYear}
                  onChange={(e) => setBirthYear(e.target.value)}
                  placeholder="e.g. 1998"
                  min={1900}
                  max={new Date().getFullYear()}
                />
              </label>

              <label className="complete-profile-label">
                <span className="complete-profile-label-heading">
                  Gender <span className="complete-profile-req" aria-hidden="true">*</span>
                </span>
                <select
                  className="complete-profile-select"
                  value={gender}
                  onChange={(e) => setGender(e.target.value)}
                >
                  {GENDER_OPTIONS.map((opt) => (
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
                  onClick={() => navigate("/adopterhomepage")}
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

        <section className="complete-profile-delete-panel" aria-label="Delete account">
          <h2 className="complete-profile-delete-panel-title">Delete your account</h2>
          <p className="complete-profile-delete-panel-lead">
            Permanently remove your account and all related data.
          </p>
          <button
            type="button"
            className="complete-profile-delete-btn"
            onClick={() => setDeleteDialogOpen(true)}
            disabled={loading || saving}
          >
            Delete account
          </button>
        </section>
      </main>
      <Footer />
    </div>
  );
}

export default CompleteAdopterProfilePage;
