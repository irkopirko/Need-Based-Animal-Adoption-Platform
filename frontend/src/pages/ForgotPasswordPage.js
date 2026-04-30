import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import "./LoginPage.css";
import "./ForgotPasswordPage.css";
import { getApiBaseUrl, isValidEmail } from "../utils/auth";
import { usePopup } from "../components/PopupProvider";

function ForgotPasswordPage() {
  const navigate = useNavigate();
  const { showPopup } = usePopup();
  const [email, setEmail] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!isValidEmail(email)) {
      showPopup({
        type: "warning",
        title: "Invalid Email",
        message: "Please enter a valid email address."
      });
      return;
    }

    const apiBaseUrl = getApiBaseUrl();
    try {
      const response = await fetch(`${apiBaseUrl}/api/auth/forgot-password/request`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim() })
      });

      const data = await response.json();
      if (!response.ok) {
        showPopup({
          type: "error",
          title: "Request Failed",
          message: data.error || "Could not send reset code."
        });
        return;
      }

      navigate("/verify-email", {
        state: { email: email.trim(), mode: "forgotPassword" },
        replace: true
      });
    } catch (error) {
      console.error(error);
      showPopup({
        type: "error",
        title: "Connection Error",
        message: "Could not connect to backend."
      });
    }
  };

  return (
    <div className="login-page forgot-password-page">
      <Navbar />
      <main className="login-main">
        <div className="login-card">
          <div className="login-left">
            <div className="login-left-overlay"></div>
            <div className="login-left-text">
              <p className="login-left-tag">Password Reset</p>
              <h2>Reset your password</h2>
              <p className="login-left-desc">
                We will send a 6-digit verification code to your email.
              </p>
            </div>
          </div>
          <div className="login-right">
            <div className="login-box">
              <p className="login-form-tag">Account Recovery</p>
              <h1>Forgot Password</h1>
              <p className="login-subtitle">Enter your account email to continue.</p>
              <form onSubmit={handleSubmit}>
                <label className="login-label">
                  Email
                  <input
                    type="email"
                    className="login-input"
                    placeholder="example@mail.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                  />
                </label>
                <button type="submit" className="login-submit-btn">
                  Send Verification Code
                </button>
              </form>
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}

export default ForgotPasswordPage;
