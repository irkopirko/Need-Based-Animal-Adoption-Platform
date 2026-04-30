import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import "./LoginPage.css";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import { getHomePathByRole, isValidEmail, normalizeRole } from "../utils/auth";

function LoginPage() {
  const navigate = useNavigate();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [message, setMessage] = useState("");

  const goSignup = () => {
    navigate("/register");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage("");

    if (email.trim() === "" || password.trim() === "") {
      setMessage("Email and password cannot be empty.");
      return;
    }

    if (!isValidEmail(email)) {
      const invalidEmailMessage =
        "Invalid email format. Please check your email address.";
      setMessage(invalidEmailMessage);
      window.alert(invalidEmailMessage);
      return;
    }

    try {
      const response = await fetch("http://localhost:8080/api/auth/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          email,
          password
        })
      });

      const data = await response.json();

      if (data.error === "Invalid email format" || data.error === "Invalid email domain") {
        const invalidEmailMessage =
          "Invalid email format. Please check your email address.";
        setMessage(invalidEmailMessage);
        window.alert(invalidEmailMessage);
        return;
      }

      if (data.error === "User not found") {
        const userNotFoundMessage =
          "Account not found. Please create an account first.";
        setMessage(userNotFoundMessage);
        window.alert(userNotFoundMessage);
        return;
      }

      if (data.error === "Please verify your email before logging in.") {
        window.alert("Please verify your email before logging in.");
        navigate("/verify-email", {
          state: { email: email.trim() },
          replace: true
        });
        return;
      }

      if (!response.ok) {
        setMessage(data.error || "User not found or password is incorrect.");
        return;
      }

      const resolvedRole = normalizeRole(data.role);

      if (!resolvedRole) {
        setMessage("User role could not be determined. Please try again.");
        return;
      }

      localStorage.setItem(
        "paviaUser",
        JSON.stringify({
          email: email.trim(),
          role: data.role,
          userId:Number(data.userId)
        })
      );

      navigate(getHomePathByRole(resolvedRole), { replace: true });
    } catch (error) {
      console.error(error);
      setMessage("Could not connect to backend.");
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

              {message !== "" && (
                <div className="login-message">{message}</div>
              )}

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