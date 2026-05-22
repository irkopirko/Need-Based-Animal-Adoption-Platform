import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import ProvinceDistrictFields from "../components/ProvinceDistrictFields";
import { usePopup } from "../components/PopupProvider";
import {
  broadcastStoredUserRefresh,
  getApiBaseUrl,
  getBirthYearSelectOptions,
  getLatestAllowedBirthYear,
  getStoredUser,
  isBirthYearValidForMinAge,
  MIN_PROFILE_AGE_YEARS,
  normalizeRole
} from "../utils/auth";
import {
  buildLocationFromIdsAsync,
  provinceIdFromName,
  splitSavedLocation
} from "../utils/turkeyLocation";
import "./CompleteAdopterProfilePage.css";

const MIN_STREET = 10;

const GENDER_OPTIONS = [
  { value: "", label: "Select gender" },
  { value: "MALE", label: "Male" },
  { value: "FEMALE", label: "Female" }
];

const BIRTH_YEAR_OPTIONS = getBirthYearSelectOptions();
const LATEST_BIRTH_YEAR = getLatestAllowedBirthYear();

function CompleteAdopterProfilePage() {
  const navigate = useNavigate();
  const { showPopup, showConfirm } = usePopup();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [userId, setUserId] = useState(null);
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [addressLine, setAddressLine] = useState("");
  const [provinceId, setProvinceId] = useState("");
  const [districtId, setDistrictId] = useState("");
  const [matchDistrictName, setMatchDistrictName] = useState(null);
  const [birthYear, setBirthYear] = useState("");
  const [gender, setGender] = useState("");

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
          if (profile.addressLine) {
            setAddressLine(profile.addressLine);
          }
          const { provinceName, districtName } = splitSavedLocation(profile.location || "");
          const pid = provinceIdFromName(provinceName);
          setDistrictId("");
          if (pid && districtName) {
            setMatchDistrictName(districtName);
            setProvinceId(pid);
          } else if (pid) {
            setProvinceId(pid);
            setMatchDistrictName(null);
          } else {
            setProvinceId("");
            setMatchDistrictName(null);
          }
          if (profile.birthYear != null) {
            setBirthYear(String(profile.birthYear));
          }
          if (profile.gender) {
            setGender(String(profile.gender).toUpperCase());
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
    if (!isBirthYearValidForMinAge(yearNum)) {
      showPopup({
        type: "warning",
        title: "Birth year required",
        message: `Select a valid birth year. You must be at least ${MIN_PROFILE_AGE_YEARS} years old (latest allowed year: ${LATEST_BIRTH_YEAR}).`
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

    if (!provinceId) {
      showPopup({
        type: "warning",
        title: "Province required",
        message: "Please select your province."
      });
      return;
    }

    const location = await buildLocationFromIdsAsync(provinceId, districtId);
    if (!location) {
      showPopup({
        type: "warning",
        title: "District required",
        message:
          "Please select your district from the list. If districts did not load, use “Retry loading districts”."
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
          location,
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

  const promptDeleteAccount = () => {
    if (!userId) {
      return;
    }
    showConfirm({
      type: "critical",
      title: "Delete your account?",
      message:
        "Are you sure? This will permanently delete your account, profile, adoption requests, saved animals, and activity logs. This cannot be undone.",
      confirmLabel: "Yes, delete everything",
      cancelLabel: "Cancel",
      confirmDanger: true,
      onConfirm: async () => {
        const apiBaseUrl = getApiBaseUrl();
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
          throw new Error(data.error || "Account could not be deleted.");
        }
        localStorage.removeItem("paviaUser");
        broadcastStoredUserRefresh();
        showPopup({
          type: "success",
          title: "Account deleted",
          message: "Your account and related data have been permanently removed."
        });
        navigate("/login", { replace: true });
      }
    });
  };

  return (
    <div className="complete-profile-page complete-adopter-profile">
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

              <ProvinceDistrictFields
                provinceId={provinceId}
                districtId={districtId}
                onProvinceChange={(id) => {
                  setMatchDistrictName(null);
                  setProvinceId(id);
                  setDistrictId("");
                }}
                onDistrictChange={setDistrictId}
                selectClassName="complete-profile-select"
                matchDistrictName={matchDistrictName}
              />

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
                <select
                  className="complete-profile-select"
                  value={birthYear}
                  onChange={(e) => setBirthYear(e.target.value)}
                  required
                >
                  <option value="">Select birth year</option>
                  {BIRTH_YEAR_OPTIONS.map((year) => (
                    <option key={year} value={String(year)}>
                      {year}
                    </option>
                  ))}
                </select>
                <span className="complete-profile-field-hint">
                  Only years that mean you are at least {MIN_PROFILE_AGE_YEARS} years old are
                  listed (latest: {LATEST_BIRTH_YEAR}).
                </span>
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
            onClick={promptDeleteAccount}
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
