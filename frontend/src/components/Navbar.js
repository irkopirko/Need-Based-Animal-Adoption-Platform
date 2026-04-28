import React, { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import "./Navbar.css";
import { getHomePathByRole, getStoredUser, normalizeRole } from "../utils/auth";

function Navbar() {
  const navigate = useNavigate();
  const [showMenu, setShowMenu] = useState(false);
  const [user, setUser] = useState(null);
  const menuRef = useRef(null);

  useEffect(() => {
    setUser(getStoredUser());
  }, []);

  const isLoggedIn = !!user;
  const normalizedRole = normalizeRole(user?.role);

  const goHome = () => {
    const activeUser = getStoredUser();
    setUser(activeUser);
    navigate(getHomePathByRole(activeUser?.role));
  };

  const goRegister = () => navigate("/register");
  const goLogin = () => navigate("/login");
  const goToAbout = () => navigate("/about");
  const goGuestAdopt = () => navigate("/adopt");
  const goAdopterAdoptHub = () => navigate("/adoption-request");
  const goOwnerManageRequests = () => navigate("/owner-requests");

  const handleLogout = () => {
    localStorage.removeItem("paviaUser");
    setUser(null);
    setShowMenu(false);
    navigate("/");
    window.location.reload();
  };

  const closeMenuAndNavigate = (path) => {
    setShowMenu(false);
    navigate(path);
  };

  const getMenuItems = () => {
    if (!user) return [];

    if (normalizedRole === "OWNER") {
      return [
        { label: "Owner Homepage", path: "/ownerhomepage" },
        { label: "Register Animal", path: "/register-animal" },
        { label: "Manage Requests", path: "/owner-requests" },
        { label: "Messages", path: "/owner-messages" },
        { label: "My Animal Listings", path: "/ownerhomepage" }
      ];
    }

    return [
      { label: "Adopter Homepage", path: "/adopterhomepage" },
      { label: "Create Adoption Request", path: "/adoption-request" },
      { label: "Compatible Animals", path: "/matches" },
      { label: "Saved Animals", path: "/saved-animals" },
      { label: "Messages", path: "/adopter-messages" }
    ];
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

  const menuItems = getMenuItems();

  return (
    <header className="navbar">
      <div className="navbar-brand" onClick={goHome}>
        <div className="navbar-logo">❤</div>
        <span className="navbar-brand-text">Pavia</span>
      </div>

      <nav className="navbar-links">
        <button
          type="button"
          className="navbar-link-btn"
          onClick={goToAbout}
        >
          About Us
        </button>

        {!isLoggedIn && (
          <button
            type="button"
            className="navbar-link-btn"
            onClick={goGuestAdopt}
          >
            Adopt
          </button>
        )}

        {isLoggedIn && normalizedRole === "ADOPTER" && (
          <button
            type="button"
            className="navbar-link-btn"
            onClick={goAdopterAdoptHub}
          >
            Adopt
          </button>
        )}

        {isLoggedIn && normalizedRole === "OWNER" && (
          <button
            type="button"
            className="navbar-link-btn"
            onClick={goOwnerManageRequests}
          >
            Manage Requests
          </button>
        )}
      </nav>

      <div className="navbar-actions">
        {!isLoggedIn ? (
          <>
            <button
              type="button"
              className="navbar-login-btn"
              onClick={goLogin}
            >
              Log In
            </button>

            <button
              type="button"
              className="navbar-start-btn"
              onClick={goRegister}
            >
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
              <span className="nav-profile-avatar">
                <span className="nav-avatar-head"></span>
                <span className="nav-avatar-body"></span>
              </span>
            </button>

            {showMenu && (
              <div className="nav-profile-menu">
                <div className="nav-profile-menu-head">
                  <p className="nav-profile-name">My Account</p>
                  <p className="nav-profile-role">
                    {normalizedRole === "OWNER" ? "Owner" : "Adopter"}
                  </p>
                </div>

                {menuItems.map((item) => (
                  <button
                    key={item.label}
                    type="button"
                    className="nav-profile-item"
                    onClick={() => closeMenuAndNavigate(item.path)}
                  >
                    <span className="nav-profile-item-icon"></span>
                    <span>{item.label}</span>
                  </button>
                ))}

                <button
                  type="button"
                  className="nav-profile-item nav-profile-item-logout"
                  onClick={handleLogout}
                >
                  <span className="nav-profile-item-icon nav-profile-item-icon-logout"></span>
                  <span>Log Out</span>
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