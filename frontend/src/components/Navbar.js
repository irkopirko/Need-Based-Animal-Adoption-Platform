import React from "react";
import "./Navbar.css";

function Navbar() {
  const goHome = () => {
    window.location.pathname = "/";
  };

  const goRegister = () => {
    window.location.pathname = "/register";
  };

  const goLogin = () => {
    window.location.pathname = "/login";
  };

  return (
    <header className="navbar">
      <div className="navbar-brand" onClick={goHome}>
        <div className="navbar-logo">❤</div>
        <span className="navbar-brand-text">Pavia</span>
      </div>

      <nav className="navbar-links">
        <button type="button" className="navbar-link-btn">
          How it works
        </button>
        <button type="button" className="navbar-link-btn">
          Adopt
        </button>
        <button type="button" className="navbar-link-btn">
          Register Animal
        </button>
      </nav>

      <div className="navbar-actions">
        <button type="button" className="navbar-login-btn" onClick={goLogin}>
          Log in
        </button>
        <button type="button" className="navbar-start-btn" onClick={goRegister}>
          Get Started
        </button>
      </div>
    </header>
  );
}

export default Navbar;