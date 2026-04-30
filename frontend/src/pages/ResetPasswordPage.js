import React, { useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import "./LoginPage.css";
import "./ResetPasswordPage.css";
import { getApiBaseUrl, getMissingPasswordRequirements } from "../utils/auth";
import { usePopup } from "../components/PopupProvider";

function ResetPasswordPage() {
  const navigate = useNavigate();
  const { showPopup } = usePopup();
  const location = useLocation();
  const email = location.state?.email || "";
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const missingRequirements = getMissingPasswordRequirements(newPassword);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email) {
      showPopup({
        type: "warning",
        title: "Session Expired",
        message: "Session expired. Please start password reset again."
      });
      return;
    }

    if (missingRequirements.length > 0) {
      showPopup({
        type: "warning",
        title: "Weak Password",
        message: "Please satisfy all password requirements."
      });
      return;
    }

    if (newPassword !== confirmPassword) {
      showPopup({
        type: "warning",
        title: "Password Mismatch",
        message: "Passwords do not match."
      });
      return;
    }

    const apiBaseUrl = getApiBaseUrl();
    try {
      const response = await fetch(`${apiBaseUrl}/api/auth/forgot-password/reset`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email,
          newPassword,
          confirmPassword
        })
      });
      const data = await response.json();
      if (!response.ok) {
        showPopup({
          type: "error",
          title: "Reset Failed",
          message: data.error || "Password reset failed."
        });
        return;
      }

      showPopup({
        type: "success",
        title: "Password Updated",
        message: "Your password has been updated successfully."
      });
      navigate("/login", { replace: true });
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
    <div className="login-page reset-password-page">
      <Navbar />
      <main className="login-main">
        <div className="login-card">
          <div className="login-left">
            <div className="login-left-overlay"></div>
            <div className="login-left-text">
              <p className="login-left-tag">Password Reset</p>
              <h2>Create new password</h2>
              <p className="login-left-desc">
                Your new password will replace the old one in the database.
              </p>
            </div>
          </div>
          <div className="login-right">
            <div className="login-box">
              <p className="login-form-tag">Account Recovery</p>
              <h1>Set New Password</h1>
              <p className="login-subtitle">{email ? `Account: ${email}` : "Session expired."}</p>

              <form onSubmit={handleSubmit}>
                <label className="login-label">
                  New Password
                  <div className="login-password-wrap">
                    <input
                      type={showNewPassword ? "text" : "password"}
                      className="login-input"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                    />
                    <button
                      type="button"
                      className="login-show-btn"
                      onClick={() => setShowNewPassword((prev) => !prev)}
                    >
                      {showNewPassword ? "Hide" : "Show"}
                    </button>
                  </div>
                </label>

                <label className="login-label">
                  Confirm New Password
                  <div className="login-password-wrap">
                    <input
                      type={showConfirmPassword ? "text" : "password"}
                      className="login-input"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                    />
                    <button
                      type="button"
                      className="login-show-btn"
                      onClick={() => setShowConfirmPassword((prev) => !prev)}
                    >
                      {showConfirmPassword ? "Hide" : "Show"}
                    </button>
                  </div>
                </label>

                {newPassword.length > 0 && missingRequirements.length > 0 && (
                  <div className="password-requirements-box">
                    {missingRequirements.map((requirement) => (
                      <p key={requirement} className="password-requirement-item">
                        {requirement}
                      </p>
                    ))}
                  </div>
                )}

                <button type="submit" className="login-submit-btn">
                  Update Password
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

export default ResetPasswordPage;
