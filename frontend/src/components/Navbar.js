import React, { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import "./Navbar.css";

function Navbar() {
  const navigate = useNavigate();
  const [showMenu, setShowMenu] = useState(false);
  const menuRef = useRef(null);

  const isLoggedIn = true;

  const goHome = () => {
    navigate("/");
  };

  const goRegister = () => {
    navigate("/register");
  };

  const goLogin = () => {
    navigate("/login");
  };

  const handleLogout = () => {
    setShowMenu(false);
    navigate("/login");
  };

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setShowMenu(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

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
        {!isLoggedIn ? (
          <>
            <button type="button" className="navbar-login-btn" onClick={goLogin}>
              Log in
            </button>
            <button type="button" className="navbar-start-btn" onClick={goRegister}>
              Get Started
            </button>
          </>
        ) : (
          <div className="nav-profile-area" ref={menuRef}>
            <button
              type="button"
              className={`nav-profile-btn ${showMenu ? "nav-profile-btn-open" : ""}`}
              onClick={() => setShowMenu(!showMenu)}
            >
              <span className="nav-profile-avatar">👤</span>
            </button>

            {showMenu && (
              <div className="nav-profile-menu">
                <div className="nav-profile-menu-head">
                  <p className="nav-profile-name">My Account</p>
                  <p className="nav-profile-role">Signed in user</p>
                </div>

                <button
                  type="button"
                  className="nav-profile-item"
                  onClick={() => {
                    setShowMenu(false);
                    navigate("/profile");
                  }}
                >
                  <span className="nav-profile-item-icon">👤</span>
                  <span>View My Profile</span>
                </button>

                <button
                  type="button"
                  className="nav-profile-item"
                  onClick={handleLogout}
                >
                  <span className="nav-profile-item-icon">↪</span>
                  <span>Logout</span>
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </header>
  );
}

export default Navbar;