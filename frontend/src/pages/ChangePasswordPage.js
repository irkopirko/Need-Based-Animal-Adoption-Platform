import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import { usePopup } from "../components/PopupProvider";
import { getApiBaseUrl, getResolvedUserId, getStoredUser } from "../utils/auth";
import "./ChangePasswordPage.css";

function ChangePasswordPage() {
  const navigate = useNavigate();
  const { showPopup } = usePopup();
  const user = getStoredUser();
  const userId = getResolvedUserId(user);

  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [saving, setSaving] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (userId == null) {
      showPopup({
        type: "warning",
        title: "Sign in required",
        message: "Please sign in first."
      });
      navigate("/login", { replace: true });
      return;
    }

    if (!currentPassword || !newPassword || !confirmPassword) {
      showPopup({
        type: "warning",
        title: "Missing fields",
        message: "Please fill all password fields."
      });
      return;
    }

    setSaving(true);
    try {
      const apiBaseUrl = getApiBaseUrl();
      const response = await fetch(`${apiBaseUrl}/api/auth/change-password`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId,
          currentPassword,
          newPassword,
          confirmPassword
        })
      });

      const data = await response.json().catch(() => ({}));
      if (!response.ok) {
        showPopup({
          type: "error",
          title: "Could not change password",
          message: data.error || "Password update failed."
        });
        return;
      }

      showPopup({
        type: "success",
        title: "Password updated",
        message: "Your new password has been saved."
      });
      navigate("/account", { replace: true });
    } catch (error) {
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
    <div className="change-password-page">
      <Navbar />
      <main className="change-password-main">
        <section className="change-password-card">
          <h1>Change Password</h1>
          <p>Enter your current password, then choose and confirm a new one.</p>
          <form onSubmit={handleSubmit}>
            <label className="change-password-label">
              Current password
              <input
                type="password"
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                autoComplete="current-password"
              />
            </label>
            <label className="change-password-label">
              New password
              <input
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                autoComplete="new-password"
              />
            </label>
            <label className="change-password-label">
              Confirm new password
              <input
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                autoComplete="new-password"
              />
            </label>
            <div className="change-password-actions">
              <button
                type="button"
                className="change-password-cancel"
                onClick={() => navigate("/account")}
                disabled={saving}
              >
                Cancel
              </button>
              <button type="submit" className="change-password-save" disabled={saving}>
                {saving ? "Saving..." : "Update password"}
              </button>
            </div>
          </form>
        </section>
      </main>
      <Footer />
    </div>
  );
}

export default ChangePasswordPage;
