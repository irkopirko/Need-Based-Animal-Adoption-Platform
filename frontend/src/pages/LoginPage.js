import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import "./LoginPage.css";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";

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

    if (!email.includes("@")) {
      setMessage("Please enter a valid email.");
      return;
    }

    try {
      const response = await fetch("http://localhost:8080/api/auth/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          email: email.trim(),
          password: password
        })
      });

      if (response.ok) {
        const data = await response.json();

        if (data.role === "adopter") {
          navigate("/adopter-home");
          return;
        }

        if (data.role === "owner") {
          navigate("/owner-home");
          return;
        }

        navigate("/");
        return;
      }

      setMessage("User not found or password is incorrect.");
    } catch (error) {
      console.log(error);
      setMessage("Backend may not be running yet.");
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