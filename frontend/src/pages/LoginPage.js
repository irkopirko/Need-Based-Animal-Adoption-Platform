import React, { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import "./LoginPage.css";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import { getApiBaseUrl, isValidEmail } from "../utils/auth";
import { usePopup } from "../components/PopupProvider";

function LoginPage() {
  const navigate = useNavigate();
  const location = useLocation();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const { showPopup } = usePopup();

  const goSignup = () => {
    navigate("/register");
  };

  useEffect(() => {
    const prefill = location.state?.email;
    if (prefill && typeof prefill === "string") {
      setEmail(prefill.trim());
    }
  }, [location.state]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    const trimmedEmail = email.trim();
    if (trimmedEmail === "" || password.trim() === "") {
      showPopup({
        type: "warning",
        title: "Missing Fields",
        message: "Email and password cannot be empty."
      });
      return;
    }

    if (!isValidEmail(trimmedEmail)) {
      showPopup({
        type: "warning",
        title: "Invalid Email",
        message: "Invalid email format. Please check your email address."
      });
      return;
    }

    try {
      const apiBaseUrl = getApiBaseUrl();
      const response = await fetch(`${apiBaseUrl}/api/auth/login`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          email: trimmedEmail,
          password
        })
      });

      const data = await response.json();

      if (data.error === "Invalid email format" || data.error === "Invalid email domain") {
        showPopup({
          type: "warning",
          title: "Invalid Email",
          message: "Invalid email format. Please check your email address."
        });
        return;
      }

      if (data.error === "User not found") {
        let message =
          "No account exists for this email. Please check the spelling or sign up first.";
        try {
          const infoRes = await fetch(`${apiBaseUrl}/api/auth/server-info`);
          if (infoRes.ok) {
            const info = await infoRes.json();
            if (info.database === "local") {
              message =
                "The backend is using a local database. Restart BackendApplication and confirm the console shows \"Railway MySQL connection OK\", then try again.";
            }
          }
        } catch {
          /* keep default message */
        }
        showPopup({ type: "error", title: "Account Not Found", message });
        return;
      }

      if (data.error === "Please verify your email before logging in.") {
        showPopup({
          type: "info",
          title: "Email Verification Required",
          message: "Please verify your email before logging in."
        });
        navigate("/verify-email", {
          state: { email: trimmedEmail, mode: "register" },
          replace: true
        });
        return;
      }

      if (data.error === "Wrong password") {
        showPopup({
          type: "error",
          title: "Wrong Password",
          message: "Incorrect password. Please try again or reset your password."
        });
        return;
      }

      if (!response.ok) {
        showPopup({
          type: "error",
          title: "Login Failed",
          message: data.error || "Login failed. Please check your email and password."
        });
        return;
      }

      navigate("/verify-email", {
        state: { email: trimmedEmail, mode: "login" },
        replace: true
      });
    } catch (error) {
      console.error(error);
      showPopup({
        type: "error",
        title: "Connection Error",
        message: "Could not connect to the backend. Make sure it is running on port 8080."
      });
    }
  };

  return (
    <div className="login-page">
      <Navbar />

      <main className="login-main">
        <div className="login-card">
          <div className="login-left">
            <div className="login-left-overlay"></div>
            <div className="login-left-text">
              <p className="login-left-tag">Welcome Back</p>
              <h2>
                Continue your
                <br />
                adoption journey
                <br />
                with Pavia.
              </h2>
              <p className="login-left-desc">
                Access your adopter or owner account, continue your request flow,
                and manage your experience from one place.
              </p>
            </div>
          </div>

          <div className="login-right">
            <div className="login-box">
              <p className="login-form-tag">Account Access</p>
              <h1>Log In</h1>
              <p className="login-subtitle">
                Enter your email and password to continue.
              </p>

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

                <label className="login-label">
                  Password
                  <div className="login-password-wrap">
                    <input
                      type={showPassword ? "text" : "password"}
                      className="login-input"
                      placeholder="••••••••"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                    />
                    <button
                      type="button"
                      className="login-show-btn"
                      onClick={() => setShowPassword(!showPassword)}
                    >
                      {showPassword ? "Hide" : "Show"}
                    </button>
                  </div>
                </label>

                <div className="login-forgot-row">
                  <span className="login-forgot-label">Forgot password?</span>{" "}
                  <span
                    className="login-forgot-link"
                    onClick={() => navigate("/forgot-password")}
                    role="button"
                    tabIndex={0}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" || e.key === " ") {
                        navigate("/forgot-password");
                      }
                    }}
                  >
                    Reset your password.
                  </span>
                </div>

                <button type="submit" className="login-submit-btn">
                  Log In
                </button>
              </form>

              <p className="login-bottom-text">
                Don&apos;t have an account?{" "}
                <button
                  type="button"
                  className="login-inline-link"
                  onClick={goSignup}
                >
                  Sign Up
                </button>
              </p>
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}

export default LoginPage;
