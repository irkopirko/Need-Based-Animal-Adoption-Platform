import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import "./RegisterPage.css";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import ProvinceDistrictFields from "../components/ProvinceDistrictFields";
import {
  getApiBaseUrl,
  getMissingPasswordRequirements,
  isPasswordValid,
  isValidEmail,
  isValidTurkishMobileInput
} from "../utils/auth";
import { usePopup } from "../components/PopupProvider";
import { buildLocationFromIdsAsync } from "../utils/turkeyLocation";

function AdopterRoleIcon() {
  return (
    <svg
      className="register-role-svg"
      viewBox="0 0 24 24"
      width="28"
      height="28"
      aria-hidden="true"
      focusable="false"
    >
      <path
        fill="currentColor"
        d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"
      />
    </svg>
  );
}

function OwnerRoleIcon() {
  return (
    <svg
      className="register-role-svg"
      viewBox="0 0 24 24"
      width="28"
      height="28"
      aria-hidden="true"
      focusable="false"
    >
      <path fill="currentColor" d="M10 20v-6h4v6h5v-8h3L12 3 2 12h3v8h5z" />
    </svg>
  );
}

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
    phone: "",
    confirmOver18: false,
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
    confirmOver18: false,
    agreeToTerms: false
  });

  const missingPasswordRequirements = getMissingPasswordRequirements(formData.password);

  const formatPhoneBody = (value) => {
    let digits = value.replace(/\D/g, "");

    if (digits.startsWith("90")) digits = digits.slice(2);
    if (digits.startsWith("0")) digits = digits.slice(1);

    digits = digits.slice(0, 10);

    let formatted = "";
    if (digits.length > 0) formatted += digits.slice(0, 3);
    if (digits.length > 3) formatted += " " + digits.slice(3, 6);
    if (digits.length > 6) formatted += " " + digits.slice(6, 8);
    if (digits.length > 8) formatted += " " + digits.slice(8, 10);

    return formatted;
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;

    if (name === "phone") {
      const formatted = formatPhoneBody(value);

      setFormData({
        ...formData,
        phone: formatted
      });

      setErrors({
        ...errors,
        phone: false
      });

      return;
    }

    if (name === "provinceId" || name === "districtId") {
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
      confirmOver18: false,
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

    if (!formData.districtId) {
      newErrors.district = true;
      hasError = true;
    }

    const phoneDigits = formData.phone.replace(/\D/g, "");

    if (!/^5\d{9}$/.test(phoneDigits) || !isValidTurkishMobileInput(formData.phone)) {
      newErrors.phone = true;
      hasError = true;
    }

    if (!formData.confirmOver18) {
      newErrors.confirmOver18 = true;
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

    const location = await buildLocationFromIdsAsync(
      formData.provinceId,
      formData.districtId
    );
    if (!location) {
      setErrors((prev) => ({ ...prev, province: true, district: true }));
      showPopup({
        type: "warning",
        title: "District list unavailable",
        message:
          "Could not load districts for your province. Use “Retry loading districts” below the district field, then select from the list."
      });
      return;
    }

    const fullName = `${formData.firstName.trim()} ${formData.lastName.trim()}`.trim();

    const userData = {
      role,
      fullName,
      email: formData.email.trim(),
      password: formData.password,
      location,
      phone: "+90" + phoneDigits
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
        showPopup({
          type: "error",
          title: "Email Error",
          message: result.error
        });
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
            <div className="register-role-icon register-role-icon-green" aria-hidden="true">
              <AdopterRoleIcon />
            </div>
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
            <div className="register-role-icon register-role-icon-gray" aria-hidden="true">
              <OwnerRoleIcon />
            </div>
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

                <div className={`phone-input ${errors.phone ? "input-error" : ""}`}>
                  <span className="phone-prefix">+90</span>

                  <input
                    id="phone"
                    type="text"
                    name="phone"
                    placeholder="555 555 55 55"
                    value={formData.phone}
                    onChange={handleChange}
                    maxLength={13}
                    autoComplete="tel"
                  />
                </div>
              </div>

              <ProvinceDistrictFields
                provinceId={formData.provinceId}
                districtId={formData.districtId}
                onProvinceChange={(id) => {
                  setFormData((prev) => ({
                    ...prev,
                    provinceId: id,
                    districtId: ""
                  }));
                  setErrors((prev) => ({ ...prev, province: false, district: false }));
                }}
                onDistrictChange={(id) => {
                  setFormData((prev) => ({ ...prev, districtId: id }));
                  setErrors((prev) => ({ ...prev, district: false }));
                }}
                selectClassName="register-select"
                errorProvince={errors.province}
                errorDistrict={errors.district}
              />
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
                name="confirmOver18"
                checked={formData.confirmOver18}
                onChange={handleChange}
              />
              <span className={errors.confirmOver18 ? "checkbox-text-error" : ""}>
                I confirm that I am at least 18 years old.
              </span>
            </label>

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

            <button
              type="submit"
              className="register-submit-btn"
              disabled={!formData.confirmOver18 || !formData.agreeToTerms}
            >
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