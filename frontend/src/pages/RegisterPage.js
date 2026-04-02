import React, { useState } from "react";
import "./RegisterPage.css";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";

function RegisterPage() {
  const [role, setRole] = useState("adopter");
  const [showPassword, setShowPassword] = useState(false);

  const [formData, setFormData] = useState({
    fullName: "",
    email: "",
    password: "",
    location: "",
    phone: "",
    agreeToTerms: false,
  });

  const [errors, setErrors] = useState({
    fullName: false,
    email: false,
    password: false,
    location: false,
    phone: false,
    agreeToTerms: false,
  });

  const [showToast, setShowToast] = useState(false);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;

    setFormData({
      ...formData,
      [name]: type === "checkbox" ? checked : value,
    });

    setErrors({
      ...errors,
      [name]: false,
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
      agreeToTerms: false,
    };

    let hasError = false;

    if (formData.fullName.trim() === "") {
      newErrors.fullName = true;
      hasError = true;
    }

    if (formData.email.trim() === "") {
      newErrors.email = true;
      hasError = true;
    }

    if (formData.password.trim() === "") {
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
      setShowToast(true);

      setTimeout(() => {
        setShowToast(false);
      }, 3000);

      return;
    }

    const userData = {
      role: role,
      fullName: formData.fullName,
      email: formData.email,
      password: formData.password,
      location: formData.location,
      phone: formData.phone,
    };

    try {
      const response = await fetch("http://localhost:8080/api/auth/register", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(userData),
      });

      if (!response.ok) {
        throw new Error("Request failed");
      }

      const result = await response.json();

      console.log("Backend response:", result);
      alert("Account created successfully!");

      setFormData({
        fullName: "",
        email: "",
        password: "",
        location: "",
        phone: "",
        agreeToTerms: false,
      });

      setErrors({
        fullName: false,
        email: false,
        password: false,
        location: false,
        phone: false,
        agreeToTerms: false,
      });
    } catch (error) {
      console.error("Error while sending register request:", error);
      alert("Could not connect to backend.");
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
              role === "adopter" ? "register-role-card-active" : ""

            }`}
            onClick={() => setRole("adopter")}
          >
            <div className="register-role-icon register-role-icon-green">👤</div>
            <h3>I Want to Adopt</h3>
            <p>
              Browse animals, fill out your profile, and find pets that match
              your lifestyle.
            </p>
          </button>

          <button
            type="button"
            className={`register-role-card ${
              role === "owner" ? "register-role-card-active" : ""
            }`}
            onClick={() => setRole("owner")}
          >
            <div className="register-role-icon register-role-icon-gray">📋</div>
            <h3>I am a Shelter / Owner</h3>
            <p>
              Register animals, manage adoption requests, and help them find
              suitable homes.
            </p>
          </button>
        </section>

        <section className="register-form-card">
          <h2 className="register-form-title">
            {role === "adopter" ? "Adopter Sign Up" : "Owner / Shelter Sign Up"}
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
                  onChange= {handleChange}
                  className= {errors.fullName ? "input-error" : ""}
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

      {showToast && (
        <div className ="toast">
          The required fields must be completed.
        </div>
      )}
    </div>
  );
}

export default RegisterPage;