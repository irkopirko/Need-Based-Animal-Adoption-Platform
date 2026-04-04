import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import "./LoginPage.css";

function LoginPage() {
  const navigate = useNavigate();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [message, setMessage] = useState("");

  const goHome = () => {
    navigate("/");
  };
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
        console.log("login success:", data);

        // 👉 login başarılıysa homepage'e gönder
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
      <header className="login-topbar">
        <button type="button" className="login-brand-btn" onClick={goHome}>
          <span className="login-logo">❤</span>
          <span className="login-brand-name">Pavia</span>
        </button>

        <div className="login-topbar-right">
          <button type="button" className="login-link-btn" onClick={goHome}>
            Home
          </button>
          <button type="button" className="login-signup-btn" onClick={goSignup}>
            Sign Up
          </button>
        </div>
      </header>

      <main className="login-main">
        <div className="login-box">
          <h1>Log In</h1>
          <p className="login-subtitle">
            Log in to continue where you left off.
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
                  placeholder="******"
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
      </main>
    </div>
  );
}

export default LoginPage;