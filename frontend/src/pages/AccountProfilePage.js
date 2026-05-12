import React, { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import { ConfirmDialog } from "../components/ConfirmDialog";
import { usePopup } from "../components/PopupProvider";
import {
  broadcastStoredUserRefresh,
  formatTurkishPhoneInput,
  getApiBaseUrl,
  getStoredUser,
  normalizeRole,
  normalizeTurkishMobileToE164
} from "../utils/auth";
import { TURKEY_PROVINCES } from "../data/turkeyProvinces";
import { fetchDistrictsForProvince } from "../data/turkeyGeoApi";
import "./AccountProfilePage.css";

const MIN_STREET_ADDRESS_LENGTH = 10;
/** Same separator as RegisterPage when building `location` */
const LOCATION_SEP = " / ";

function splitSavedLocation(raw) {
  if (!raw || typeof raw !== "string") {
    return { provinceName: "", districtName: "" };
  }
  const t = raw.trim();
  const i = t.indexOf(LOCATION_SEP);
  if (i === -1) {
    return { provinceName: "", districtName: t };
  }
  return {
    provinceName: t.slice(0, i).trim(),
    districtName: t.slice(i + LOCATION_SEP.length).trim()
  };
}

function splitDisplayName(fullNameRaw) {
  const t = String(fullNameRaw || "").trim();
  if (!t) {
    return { firstName: "", lastName: "" };
  }
  const parts = t.split(/\s+/).filter(Boolean);
  if (parts.length === 1) {
    return { firstName: parts[0], lastName: "" };
  }
  return { firstName: parts[0], lastName: parts.slice(1).join(" ") };
}

const GENDER_OPTIONS = [
  { value: "", label: "Select gender" },
  { value: "MALE", label: "Male" },
  { value: "FEMALE", label: "Female" }
];

function AccountProfilePage() {
  const navigate = useNavigate();
  const { showPopup } = usePopup();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [provinceId, setProvinceId] = useState("");
  const [districtId, setDistrictId] = useState("");
  const [districts, setDistricts] = useState([]);
  const [districtLoading, setDistrictLoading] = useState(false);
  const [districtListFailed, setDistrictListFailed] = useState(false);
  const [districtRetryNonce, setDistrictRetryNonce] = useState(0);
  const pendingDistrictNameRef = useRef(null);
  const [addressLine, setAddressLine] = useState("");
  const [birthYear, setBirthYear] = useState("");
  const [gender, setGender] = useState("");
  const [userId, setUserId] = useState(null);
  const [role, setRole] = useState(null);
  const [hasDraftAdoptionRequest, setHasDraftAdoptionRequest] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deleteBusy, setDeleteBusy] = useState(false);

  const isAdopter = normalizeRole(role) === "ADOPTER";
  const contactLocked = isAdopter && hasDraftAdoptionRequest;

  useEffect(() => {
    if (!provinceId) {
      setDistricts([]);
      setDistrictLoading(false);
      setDistrictListFailed(false);
      return;
    }

    let cancelled = false;
    setDistrictLoading(true);
    setDistrictListFailed(false);

    fetchDistrictsForProvince(Number(provinceId))
      .then((list) => {
        if (cancelled) {
          return;
        }
        setDistricts(Array.isArray(list) ? list : []);
        const pending = pendingDistrictNameRef.current;
        if (pending != null && pending !== "") {
          const d = (Array.isArray(list) ? list : []).find((x) => x.name === pending);
          if (d) {
            setDistrictId(String(d.id));
          } else {
            setDistrictId("");
          }
          pendingDistrictNameRef.current = null;
        }
      })
      .catch(() => {
        if (cancelled) {
          return;
        }
        setDistricts([]);
        setDistrictListFailed(true);
        const pending = pendingDistrictNameRef.current;
        if (pending != null && pending !== "") {
          setDistrictId("");
          pendingDistrictNameRef.current = null;
        }
      })
      .finally(() => {
        if (!cancelled) {
          setDistrictLoading(false);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [provinceId, districtRetryNonce]);

  useEffect(() => {
    const stored = getStoredUser();
    if (!stored?.userId) {
      showPopup({
        type: "warning",
        title: "Sign in required",
        message: "Please log in to manage your account."
      });
      navigate("/login", { replace: true });
      return;
    }

    setUserId(stored.userId);
    setRole(normalizeRole(stored.role));
    setEmail(stored.email || "");

    const load = async () => {
      const apiBaseUrl = getApiBaseUrl();
      try {
        const response = await fetch(
          `${apiBaseUrl}/api/auth/profile/${stored.userId}`
        );
        if (!response.ok) {
          const fb = splitDisplayName(stored.fullName || "");
          setFirstName(fb.firstName);
          setLastName(fb.lastName);
          setPhone("");
          pendingDistrictNameRef.current = null;
          setProvinceId("");
          setDistrictId("");
          setAddressLine("");
          setBirthYear("");
          setGender("");
          setLoading(false);
          return;
        }
        const profile = await response.json();
        const nameParts = splitDisplayName(profile.fullName || "");
        setFirstName(nameParts.firstName);
        setLastName(nameParts.lastName);
        setEmail(profile.email || stored.email || "");
        setPhone(formatTurkishPhoneInput(profile.phone || ""));
        const { provinceName, districtName } = splitSavedLocation(profile.location || "");
        const province = TURKEY_PROVINCES.find((p) => p.name === provinceName);
        pendingDistrictNameRef.current = null;
        setDistrictId("");
        if (province && districtName) {
          pendingDistrictNameRef.current = districtName;
          setProvinceId(String(province.id));
        } else if (province && !districtName) {
          setProvinceId(String(province.id));
        } else if (!province && (districtName || provinceName)) {
          setProvinceId("");
        } else {
          setProvinceId("");
        }
        setAddressLine(profile.addressLine || "");
        setBirthYear(
          profile.birthYear != null && profile.birthYear !== ""
            ? String(profile.birthYear)
            : ""
        );
        {
          const g = (profile.gender || "").toUpperCase();
          setGender(g === "PREFER_NOT_TO_SAY" ? "" : profile.gender || "");
        }
        setHasDraftAdoptionRequest(Boolean(profile.hasDraftAdoptionRequest));

        const prevStored = getStoredUser() || {};
        localStorage.setItem(
          "paviaUser",
          JSON.stringify({
            ...prevStored,
            adopterProfileCompleted: profile.adopterProfileCompleted,
            ownerProfileCompleted: profile.ownerProfileCompleted,
            ownerListingType:
              profile.ownerListingType != null && profile.ownerListingType !== ""
                ? profile.ownerListingType
                : prevStored.ownerListingType || ""
          })
        );
        broadcastStoredUserRefresh();
      } catch (err) {
        console.error(err);
        const fb = splitDisplayName(stored.fullName || "");
        setFirstName(fb.firstName);
        setLastName(fb.lastName);
        showPopup({
          type: "error",
          title: "Connection error",
          message: "Could not load your profile. You can still try to save changes."
        });
      } finally {
        setLoading(false);
      }
    };

    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps -- load profile once on mount
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!userId) {
      return;
    }
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
    const trimmedName = `${fn} ${ln}`.trim();

    const phoneE164 = normalizeTurkishMobileToE164(phone);
    if (!phoneE164) {
      showPopup({
        type: "warning",
        title: "Phone required",
        message: "Enter a valid Turkish mobile number (e.g. 0554 xxx xx xx)."
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
    const provinceNameResolved =
      TURKEY_PROVINCES.find((p) => String(p.id) === String(provinceId))?.name || "";
    if (districtListFailed) {
      showPopup({
        type: "warning",
        title: "District list unavailable",
        message:
          "We could not load districts for your province. Use “Retry loading districts” below the province field, then choose your district."
      });
      return;
    }
    if (districtLoading) {
      showPopup({
        type: "info",
        title: "Please wait",
        message: "Districts are still loading. Try again in a moment."
      });
      return;
    }
    const districtNameResolved =
      districts.find((d) => String(d.id) === String(districtId))?.name || "";
    if (!districtNameResolved) {
      showPopup({
        type: "warning",
        title: "District required",
        message: "Please select your district from the list."
      });
      return;
    }
    const locationValue = `${provinceNameResolved}${LOCATION_SEP}${districtNameResolved}`;

    let yearNum = null;
    if (isAdopter) {
      const addr = addressLine.trim();
      if (!addr) {
        showPopup({
          type: "warning",
          title: "Street address required",
          message: "Please enter your full street address."
        });
        return;
      }
      if (addr.length < MIN_STREET_ADDRESS_LENGTH) {
        showPopup({
          type: "warning",
          title: "Street address too short",
          message: `Please enter at least ${MIN_STREET_ADDRESS_LENGTH} characters (building, street, details).`
        });
        return;
      }
      if (!gender) {
        showPopup({
          type: "warning",
          title: "Gender required",
          message: "Please select a gender option."
        });
        return;
      }
      yearNum = parseInt(birthYear.trim(), 10);
      const currentYear = new Date().getFullYear();
      if (
        !Number.isFinite(yearNum) ||
        yearNum < 1900 ||
        yearNum > currentYear - 13
      ) {
        showPopup({
          type: "warning",
          title: "Birth year required",
          message: "Enter a valid birth year. You must be at least 13."
        });
        return;
      }
    }

    setSaving(true);
    const apiBaseUrl = getApiBaseUrl();
    try {
      const body = {
        userId,
        fullName: trimmedName,
        phone: phoneE164,
        location: locationValue
      };
      if (isAdopter) {
        body.addressLine = addressLine.trim();
        body.birthYear = yearNum;
        body.gender = gender;
      }

      const response = await fetch(`${apiBaseUrl}/api/auth/profile`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body)
      });
      const data = await response.json();
      if (!response.ok) {
        showPopup({
          type: "error",
          title: "Could not save",
          message: data.error || "Profile update failed."
        });
        return;
      }

      const prev = getStoredUser() || {};
      localStorage.setItem(
        "paviaUser",
        JSON.stringify({
          ...prev,
          email: email || prev.email,
          userId,
          role: role || prev.role,
          fullName: trimmedName
        })
      );
      broadcastStoredUserRefresh();

      showPopup({
        type: "success",
        title: "Profile saved",
        message: "Your account details were updated."
      });
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
    if (!userId) {
      return;
    }
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
    <div className="account-page">
      <ConfirmDialog
        open={deleteDialogOpen}
        title="Delete your account?"
        description="Are you sure? This will permanently delete your account, profile, listings, adoption requests, saved animals, and activity logs. This cannot be undone."
        confirmLabel="Yes, delete everything"
        cancelLabel="Cancel"
        confirmDanger
        busy={deleteBusy}
        onCancel={() => {
          if (!deleteBusy) {
            setDeleteDialogOpen(false);
          }
        }}
        onConfirm={handleConfirmDeleteAccount}
      />
      <Navbar />
      <main className="account-main">
        <div className="account-card">
          <p className="account-kicker">Account</p>
          <h1 className="account-title">Profile &amp; contact</h1>
          <p className="account-lead">
            All fields below are required. Your email is verified and cannot be changed here.
          </p>

          {contactLocked && (
            <div className="account-locked-banner" role="status">
              You have an adoption request in progress. Phone, location, street address,
              birth year, and gender cannot be changed until you finish and submit that
              request from the adoption form (&quot;Submit and Go to Matches&quot;).
            </div>
          )}

          {loading ? (
            <p className="account-loading">Loading profile…</p>
          ) : (
            <form className="account-form" noValidate onSubmit={handleSubmit}>
              <div className="account-name-row">
                <label className="account-label">
                  <span className="account-label-heading">
                    First name <span className="account-req" aria-hidden="true">*</span>
                  </span>
                  <input
                    className="account-input"
                    value={firstName}
                    onChange={(e) => setFirstName(e.target.value)}
                    autoComplete="given-name"
                    placeholder="First name"
                  />
                </label>
                <label className="account-label">
                  <span className="account-label-heading">
                    Last name <span className="account-req" aria-hidden="true">*</span>
                  </span>
                  <input
                    className="account-input"
                    value={lastName}
                    onChange={(e) => setLastName(e.target.value)}
                    autoComplete="family-name"
                    placeholder="Last name"
                  />
                </label>
              </div>

              <label className="account-label account-label-muted">
                <span className="account-label-heading account-label-heading-muted">
                  Email <span className="account-req-muted">(read-only)</span>
                </span>
                <input
                  className="account-input account-input-readonly"
                  value={email}
                  readOnly
                  aria-readonly="true"
                />
              </label>

              <label className="account-label">
                <span className="account-label-heading">
                  Phone <span className="account-req" aria-hidden="true">*</span>
                </span>
                <input
                  className={`account-input ${contactLocked ? "account-input-readonly" : ""}`}
                  value={phone}
                  onChange={(e) => setPhone(formatTurkishPhoneInput(e.target.value))}
                  readOnly={contactLocked}
                  autoComplete="tel"
                  placeholder="0554 xxx xx xx"
                  maxLength={15}
                />
              </label>

              <div className="account-geo-block">
                <span className="account-label-heading account-geo-block-title">
                  Province &amp; district <span className="account-req" aria-hidden="true">*</span>
                </span>
                <label className="account-label account-label-nested">
                  <span className="account-sublabel">Province</span>
                  <select
                    className={`account-select ${contactLocked ? "account-input-readonly" : ""}`}
                    value={provinceId}
                    onChange={(e) => {
                      pendingDistrictNameRef.current = null;
                      setProvinceId(e.target.value);
                      setDistrictId("");
                      setDistrictListFailed(false);
                      setDistrictRetryNonce(0);
                    }}
                    disabled={contactLocked}
                    autoComplete="address-level1"
                  >
                    <option value="">Select a province</option>
                    {TURKEY_PROVINCES.map((p) => (
                      <option key={p.id} value={String(p.id)}>
                        {p.name}
                      </option>
                    ))}
                  </select>
                </label>
                <label className="account-label account-label-nested">
                  <span className="account-sublabel">District</span>
                  <select
                    className={`account-select ${contactLocked ? "account-input-readonly" : ""}`}
                    value={districtId}
                    onChange={(e) => setDistrictId(e.target.value)}
                    disabled={
                      contactLocked ||
                      !provinceId ||
                      districtLoading ||
                      districtListFailed
                    }
                    autoComplete="address-level2"
                    aria-describedby={
                      districtListFailed ? "account-district-retry-hint" : undefined
                    }
                  >
                    <option value="">
                      {!provinceId
                        ? "Select a province first"
                        : districtLoading
                          ? "Loading districts…"
                          : districtListFailed
                            ? "Could not load districts"
                            : "Select a district"}
                    </option>
                    {districts.map((d) => (
                      <option key={d.id} value={String(d.id)}>
                        {d.name}
                      </option>
                    ))}
                  </select>
                  {provinceId && districtListFailed && !districtLoading && !contactLocked && (
                    <div className="account-district-retry-wrap" id="account-district-retry-hint">
                      <p className="account-district-retry-text">
                        The district list could not be loaded. You can try again without leaving
                        this page.
                      </p>
                      <button
                        type="button"
                        className="account-district-retry-btn"
                        onClick={() => {
                          setDistrictId("");
                          setDistrictListFailed(false);
                          setDistrictRetryNonce((n) => n + 1);
                        }}
                      >
                        Retry loading districts
                      </button>
                    </div>
                  )}
                </label>
              </div>

              {isAdopter && (
                <>
                  <label className="account-label">
                    <span className="account-label-heading">
                      Street address <span className="account-req" aria-hidden="true">*</span>
                    </span>
                    <textarea
                      className={`account-textarea ${contactLocked ? "account-input-readonly" : ""}`}
                      value={addressLine}
                      onChange={(e) => setAddressLine(e.target.value)}
                      readOnly={contactLocked}
                      rows={3}
                      autoComplete="street-address"
                      placeholder="Building, street, apartment… (min. 10 characters)"
                      minLength={MIN_STREET_ADDRESS_LENGTH}
                    />
                  </label>

                  <label className="account-label">
                    <span className="account-label-heading">
                      Birth year <span className="account-req" aria-hidden="true">*</span>
                    </span>
                    <input
                      className={`account-input ${contactLocked ? "account-input-readonly" : ""}`}
                      type="number"
                      value={birthYear}
                      onChange={(e) => setBirthYear(e.target.value)}
                      readOnly={contactLocked}
                      placeholder="e.g. 1998"
                      min={1900}
                      max={new Date().getFullYear()}
                    />
                  </label>

                  <label className="account-label">
                    <span className="account-label-heading">
                      Gender <span className="account-req" aria-hidden="true">*</span>
                    </span>
                    <select
                      className={`account-select ${contactLocked ? "account-input-readonly" : ""}`}
                      value={gender}
                      onChange={(e) => setGender(e.target.value)}
                      disabled={contactLocked}
                    >
                      {GENDER_OPTIONS.map((opt) => (
                        <option key={opt.value || "empty"} value={opt.value}>
                          {opt.label}
                        </option>
                      ))}
                    </select>
                  </label>
                </>
              )}

              <div className="account-actions">
                <button
                  type="button"
                  className="account-btn account-btn-ghost"
                  onClick={() => navigate(-1)}
                  disabled={saving}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="account-btn account-btn-primary"
                  disabled={saving}
                >
                  {saving ? "Saving…" : "Save changes"}
                </button>
              </div>
            </form>
          )}

          <p className="account-required-note">
            <span className="account-required-star" aria-hidden="true">
              *
            </span>
            indicates required fields
          </p>
        </div>

        <section className="account-delete-panel" aria-label="Delete account">
          <h2 className="account-delete-panel-title">Delete your account</h2>
          <p className="account-delete-panel-lead">
            Permanently remove your account and all data stored on Pavia for this email.
          </p>
          <button
            type="button"
            className="account-delete-account-btn"
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

export default AccountProfilePage;
