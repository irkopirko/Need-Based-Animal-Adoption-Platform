import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import "./RegisterPage.css";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import {
  getApiBaseUrl,
  getMissingPasswordRequirements,
  isPasswordValid,
  isValidEmail
} from "../utils/auth";
import { usePopup } from "../components/PopupProvider";

function RegisterPage() {
  const navigate = useNavigate();
  const { showPopup } = usePopup();
  const [role, setRole] = useState("ADOPTER");
  const [showPassword, setShowPassword] = useState(false);

  const [formData, setFormData] = useState({
    fullName: "",
    email: "",
    password: "",
    location: "",
    phone: "",
    agreeToTerms: false
  });

  const [errors, setErrors] = useState({
    fullName: false,
    email: false,
    password: false,
    location: false,
    phone: false,
    agreeToTerms: false
  });

  const missingPasswordRequirements = getMissingPasswordRequirements(formData.password);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;

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
      fullName: false,
      email: false,
      password: false,
      location: false,
      phone: false,
      agreeToTerms: false
    };

    let hasError = false;

    if (formData.fullName.trim() === "") {
      newErrors.fullName = true;
      hasError = true;
    }

    if (!isValidEmail(formData.email)) {
      newErrors.email = true;
      hasError = true;
      const invalidEmailMessage =
        "Invalid email format. Please check your email address.";
      showPopup({ type: "warning", title: "Invalid Email", message: invalidEmailMessage });
    }

    if (formData.password.trim() === "" || !isPasswordValid(formData.password)) {
      newErrors.password = true;
      hasError = true;
    }

    if (formData.location.trim() === "") {
      newErrors.location = true;
      hasError = true;
    }

    if (formData.phone.trim() === "") {
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

    const userData = {
      role,
      fullName: formData.fullName,
      email: formData.email,
      password: formData.password,
      location: formData.location,
      phone: formData.phone
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
        const invalidEmailMessage =
          "Invalid email format. Please check your email address.";
        showPopup({ type: "warning", title: "Invalid Email", message: invalidEmailMessage });
        return;
      }

      if (result.error === "Email is already registered") {
        const duplicateEmailMessage =
          "An account with this email already exists. Please log in.";
        showPopup({ type: "info", title: "Account Exists", message: duplicateEmailMessage });
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

      // Account is NOT created here. Users must verify email first.
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
                <label htmlFor="fullName">Full Name</label>
                <input
                  id="fullName"
                  type="text"
                  name="fullName"
                  placeholder="Your full name"
                  value={formData.fullName}
                  onChange={handleChange}
                  className={errors.fullName ? "input-error" : ""}
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
                />
              </div>

              <div className="register-input-group">
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

              <div className="register-input-group">
                <label htmlFor="location">Location</label>
                <input
                  id="location"
                  type="text"
                  name="location"
                  placeholder="City / District"
                  value={formData.location}
                  onChange={handleChange}
                  className={errors.location ? "input-error" : ""}
                />
              </div>
            </div>

            <div className="register-input-group register-full-width-group">
              <label htmlFor="phone">Phone Number</label>
              <input
                id="phone"
                type="text"
                name="phone"
                placeholder="+90 (555) 000-00-00"
                value={formData.phone}
                onChange={handleChange}
                className={errors.phone ? "input-error" : ""}
              />
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