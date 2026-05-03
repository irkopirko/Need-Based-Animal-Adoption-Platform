import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import "./RegisterPage.css";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import {
  formatTurkishPhoneInput,
  getApiBaseUrl,
  getMissingPasswordRequirements,
  isPasswordValid,
  isValidEmail,
  isValidTurkishMobileInput,
  normalizeTurkishMobileToE164
} from "../utils/auth";
import { usePopup } from "../components/PopupProvider";
import { TURKEY_PROVINCES } from "../data/turkeyProvinces";
import { fetchDistrictsForProvince } from "../data/turkeyGeoApi";

function RegisterPage() {
  const navigate = useNavigate();
  const { showPopup } = usePopup();
  const [role, setRole] = useState("ADOPTER");
  const [showPassword, setShowPassword] = useState(false);

  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    password: "",
    provinceId: "",
    districtId: "",
    districtManual: "",
    phone: "",
    agreeToTerms: false
  });

  const [errors, setErrors] = useState({
    firstName: false,
    lastName: false,
    email: false,
    password: false,
    province: false,
    district: false,
    phone: false,
    agreeToTerms: false
  });

  const [districts, setDistricts] = useState([]);
  const [districtLoading, setDistrictLoading] = useState(false);
  const [districtLoadError, setDistrictLoadError] = useState(false);

  const missingPasswordRequirements = getMissingPasswordRequirements(formData.password);

  useEffect(() => {
    const pid = formData.provinceId;
    if (!pid) {
      setDistricts([]);
      setDistrictLoadError(false);
      return;
    }

    let cancelled = false;
    setDistrictLoading(true);
    setDistrictLoadError(false);

    fetchDistrictsForProvince(Number(pid))
      .then((list) => {
        if (!cancelled) {
          setDistricts(list);
        }
      })
      .catch(() => {
        if (!cancelled) {
          setDistricts([]);
          setDistrictLoadError(true);
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
  }, [formData.provinceId]);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;

    if (name === "phone") {
      setFormData({
        ...formData,
        phone: formatTurkishPhoneInput(value)
      });

      setErrors({
        ...errors,
        phone: false
      });

      return;
    }

    if (name === "provinceId") {
      setFormData({
        ...formData,
        provinceId: value,
        districtId: "",
        districtManual: ""
      });
      setErrors({
        ...errors,
        province: false,
        district: false
      });
      return;
    }

    if (name === "districtId" || name === "districtManual") {
      setFormData({
        ...formData,
        [name]: value
      });
      setErrors({
        ...errors,
        district: false
      });
      return;
    }

    setFormData({
      ...formData,
      [name]: type === "checkbox" ? checked : value
    });

    setErrors({
      ...errors,
      [name]: false
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const newErrors = {
      firstName: false,
      lastName: false,
      email: false,
      password: false,
      province: false,
      district: false,
      phone: false,
      agreeToTerms: false
    };

    let hasError = false;

    if (formData.firstName.trim() === "") {
      newErrors.firstName = true;
      hasError = true;
    }

    if (formData.lastName.trim() === "") {
      newErrors.lastName = true;
      hasError = true;
    }

    if (!isValidEmail(formData.email)) {
      newErrors.email = true;
      hasError = true;
      showPopup({
        type: "warning",
        title: "Invalid Email",
        message: "Invalid email format. Please check your email address."
      });
    }

    if (formData.password.trim() === "" || !isPasswordValid(formData.password)) {
      newErrors.password = true;
      hasError = true;
    }

    if (!formData.provinceId) {
      newErrors.province = true;
      hasError = true;
    }

    let districtOk = false;
    if (districtLoadError) {
      districtOk = formData.districtManual.trim().length > 0;
    } else {
      districtOk = Boolean(formData.districtId);
    }
    if (!districtOk) {
      newErrors.district = true;
      hasError = true;
    }

    if (formData.phone.trim() === "") {
      newErrors.phone = true;
      hasError = true;
    }

    if (!isValidTurkishMobileInput(formData.phone)) {
      newErrors.phone = true;
      hasError = true;
    }

    if (!formData.agreeToTerms) {
      newErrors.agreeToTerms = true;
      hasError = true;
    }

    setErrors(newErrors);

    if (hasError) {
      showPopup({
        type: "warning",
        title: "Form Incomplete",
        message: "Please complete all required fields with valid values."
      });
      return;
    }

    const provinceName =
      TURKEY_PROVINCES.find((p) => String(p.id) === String(formData.provinceId))?.name ||
      "";
    let districtName = "";
    if (districtLoadError) {
      districtName = formData.districtManual.trim();
    } else {
      districtName =
        districts.find((d) => String(d.id) === String(formData.districtId))?.name || "";
    }

    const fullName = `${formData.firstName.trim()} ${formData.lastName.trim()}`.trim();
    const location = `${provinceName} / ${districtName}`;

    const userData = {
      role,
      fullName,
      email: formData.email,
      password: formData.password,
      location,
      phone: normalizeTurkishMobileToE164(formData.phone)
    };

    const apiBaseUrl = getApiBaseUrl();

    try {
      const response = await fetch(`${apiBaseUrl}/api/auth/register`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify(userData)
      });

      const result = await response.json();

      if (result.error === "Invalid email format" || result.error === "Invalid email domain") {
        showPopup({
          type: "warning",
          title: "Invalid Email",
          message: "Invalid email format. Please check your email address."
        });
        return;
      }

      if (result.error === "Email is already registered") {
        showPopup({
          type: "info",
          title: "Account Exists",
          message: "An account with this email already exists. Please log in."
        });
        navigate("/login", { replace: true });
        return;
      }

      if (result.error === "Could not send verification email. Please try again.") {
        showPopup({ type: "error", title: "Email Error", message: result.error });
        return;
      }

      if (!response.ok) {
        showPopup({
          type: "error",
          title: "Registration Failed",
          message: result.error || "Registration failed."
        });
        return;
      }

      navigate("/verify-email", {
        state: { email: formData.email.trim() },
        replace: true
      });
    } catch (error) {
      console.error("Error while sending register request:", error);
      showPopup({
        type: "error",
        title: "Connection Error",
        message: `Could not connect to backend at ${apiBaseUrl}. Check backend status/CORS/API URL.`
      });
    }
  };

  return (
    <div className="register-page">
      <Navbar />

      <main className="register-main">
        <section className="register-hero">
          <h1 className="register-title">Join the Pavia Community</h1>
          <p className="register-description">
            Find your perfect companion or help animals find their forever homes
            based on lifestyle compatibility.
          </p>
        </section>

        <section className="register-role-cards">
          <button
            type="button"
            className={`register-role-card ${
              role === "ADOPTER" ? "register-role-card-active" : ""
            }`}
            onClick={() => setRole("ADOPTER")}
          >
            <div className="register-role-icon register-role-icon-green"></div>
            <h3>I Want to Adopt</h3>
            <p>
              Browse animals, fill out your profile, and find pets that match
              your lifestyle.
            </p>
          </button>

          <button
            type="button"
            className={`register-role-card ${
              role === "OWNER" ? "register-role-card-active" : ""
            }`}
            onClick={() => setRole("OWNER")}
          >
            <div className="register-role-icon register-role-icon-gray"></div>
            <h3>I am a Shelter / Owner</h3>
            <p>
              Register animals, manage adoption requests, and help them find
              suitable homes.
            </p>
          </button>
        </section>

        <section className="register-form-card">
          <h2 className="register-form-title">
            {role === "ADOPTER" ? "Adopter Sign Up" : "Owner / Shelter Sign Up"}
          </h2>

          <p className="register-form-subtitle">
            Tell us a bit about yourself to get started.
          </p>

          <form onSubmit={handleSubmit}>
            <div className="register-form-grid">
              <div className="register-input-group">
                <label htmlFor="firstName">First name</label>
                <input
                  id="firstName"
                  type="text"
                  name="firstName"
                  placeholder="Your first name"
                  value={formData.firstName}
                  onChange={handleChange}
                  className={errors.firstName ? "input-error" : ""}
                  autoComplete="given-name"
                />
              </div>

              <div className="register-input-group">
                <label htmlFor="lastName">Last name</label>
                <input
                  id="lastName"
                  type="text"
                  name="lastName"
                  placeholder="Your last name"
                  value={formData.lastName}
                  onChange={handleChange}
                  className={errors.lastName ? "input-error" : ""}
                  autoComplete="family-name"
                />
              </div>

              <div className="register-input-group">
                <label htmlFor="email">Email Address</label>
                <input
                  id="email"
                  type="email"
                  name="email"
                  placeholder="email@example.com"
                  value={formData.email}
                  onChange={handleChange}
                  className={errors.email ? "input-error" : ""}
                  autoComplete="email"
                />
              </div>

              <div className="register-input-group">
                <label htmlFor="phone">Phone Number</label>
                <input
                  id="phone"
                  type="text"
                  name="phone"
                  placeholder="0554 xxx xx xx"
                  value={formData.phone}
                  onChange={handleChange}
                  maxLength={15}
                  className={errors.phone ? "input-error" : ""}
                  autoComplete="tel"
                />
              </div>

              <div className="register-input-group">
                <label htmlFor="provinceId">Province</label>
                <select
                  id="provinceId"
                  name="provinceId"
                  value={formData.provinceId}
                  onChange={handleChange}
                  className={`register-select ${errors.province ? "input-error" : ""}`}
                >
                  <option value="">Select a province</option>
                  {TURKEY_PROVINCES.map((p) => (
                    <option key={p.id} value={String(p.id)}>
                      {p.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="register-input-group">
                <label htmlFor="districtId">District</label>
                {districtLoadError ? (
                  <input
                    id="districtManual"
                    type="text"
                    name="districtManual"
                    placeholder="Type your district (list could not be loaded)"
                    value={formData.districtManual}
                    onChange={handleChange}
                    className={errors.district ? "input-error" : ""}
                    autoComplete="address-level3"
                  />
                ) : (
                  <select
                    id="districtId"
                    name="districtId"
                    value={formData.districtId}
                    onChange={handleChange}
                    disabled={!formData.provinceId || districtLoading}
                    className={`register-select ${errors.district ? "input-error" : ""}`}
                  >
                    <option value="">
                      {districtLoading ? "Loading…" : "Select a district"}
                    </option>
                    {districts.map((d) => (
                      <option key={d.id} value={String(d.id)}>
                        {d.name}
                      </option>
                    ))}
                  </select>
                )}
              </div>
            </div>

            <div className="register-input-group register-full-width-group register-password-block">
              <label htmlFor="password">Password</label>
              <div className="password-wrapper">
                <input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  name="password"
                  placeholder="••••••••"
                  value={formData.password}
                  onChange={handleChange}
                  className={errors.password ? "input-error" : ""}
                  autoComplete="new-password"
                />
                <button
                  type="button"
                  className="toggle-password-btn"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? "Hide" : "Show"}
                </button>
              </div>
              {missingPasswordRequirements.length > 0 && formData.password.length > 0 && (
                <div className="password-requirements-box">
                  {missingPasswordRequirements.map((requirement) => (
                    <p key={requirement} className="password-requirement-item">
                      {requirement}
                    </p>
                  ))}
                </div>
              )}
            </div>

            <label className="register-checkbox-row">
              <input
                type="checkbox"
                name="agreeToTerms"
                checked={formData.agreeToTerms}
                onChange={handleChange}
              />
              <span className={errors.agreeToTerms ? "checkbox-text-error" : ""}>
                I agree to the <a href="/">Terms of Service</a> and{" "}
                <a href="/">Privacy Policy</a>
              </span>
            </label>

            <button type="submit" className="register-submit-btn">
              Create Account
              <span className="register-arrow">→</span>
            </button>
          </form>

          <div className="register-divider"></div>

          <p className="register-login-text">
            Already have an account? <a href="/login">Log in here</a>
          </p>
        </section>
      </main>

      <Footer />
    </div>
  );
}

export default RegisterPage;
