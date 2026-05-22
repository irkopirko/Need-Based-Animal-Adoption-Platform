import React, { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import "./Navbar.css";
import {
  getHomePathByRole,
  getStoredUser,
  getUserInitials,
  normalizeRole,
  PAVIA_USER_UPDATED_EVENT
} from "../utils/auth";

function Navbar() {
  const navigate = useNavigate();
  const [showMenu, setShowMenu] = useState(false);
  const [user, setUser] = useState(null);
  const menuRef = useRef(null);

  useEffect(() => {
    const syncUser = () => setUser(getStoredUser());
    syncUser();
    window.addEventListener(PAVIA_USER_UPDATED_EVENT, syncUser);
    return () => window.removeEventListener(PAVIA_USER_UPDATED_EVENT, syncUser);
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
  const goAdopterMyRequests = () => navigate("/my-adoption-requests");
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

    if (normalizedRole === "ADMIN") {
      return [{ label: "Moderation dashboard", path: "/adminhomepage" }];
    }

    if (normalizedRole === "OWNER") {
      const items = [];
      if (user.ownerProfileCompleted === false) {
        items.push({ label: "Complete profile", path: "/complete-owner-profile" });
      }
      items.push(
        { label: "Dashboard", path: "/ownerhomepage" },
        { label: "Listed animals", path: "/owner-listings" },
        { label: "Register an animal", path: "/register-animal" },
        { label: "Adoption requests", path: "/owner-requests" },
        { label: "Adoption pipeline", path: "/owner-adoptions" },
        { label: "Inquiries", path: "/owner-messages" }
      );
      return items;
    }

    const adopterItems = [];
    if (user.adopterProfileCompleted === false) {
      adopterItems.push({ label: "Complete profile", path: "/complete-adopter-profile" });
    }
    adopterItems.push(
      { label: "Home", path: "/adopterhomepage" },
      { label: "Adoption request", path: "/adoption-request" },
      { label: "My adoption requests", path: "/my-adoption-requests" },
      { label: "Matching animals", path: "/matches" },
      { label: "Saved animals", path: "/saved-animals" },
      { label: "My adoptions", path: "/my-adoptions" },
      { label: "Messages", path: "/adopter-messages" }
    );
    return adopterItems;
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
          <div className="navbar-adopter-adopt-group">
            <button
              type="button"
              className="navbar-link-btn"
              onClick={goAdopterAdoptHub}
            >
              Adopt
            </button>
            <button
              type="button"
              className="navbar-adopter-requests-link"
              onClick={goAdopterMyRequests}
            >
              View my requests
            </button>
          </div>
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
              aria-haspopup="true"
              aria-expanded={showMenu}
              aria-label="Account menu"
            >
              <span className="nav-profile-avatar nav-profile-avatar-initials" aria-hidden>
                {getUserInitials(user)}
              </span>
            </button>

            {showMenu && (
              <div className="nav-profile-menu">
                <div className="nav-profile-menu-head">
                  <div className="nav-profile-menu-identity">
                    <span className="nav-profile-menu-avatar" aria-hidden>
                      {getUserInitials(user)}
                    </span>
                    <div>
                      <p className="nav-profile-name">
                        {(user?.fullName && String(user.fullName).trim()) ||
                          user?.email ||
                          "Signed in"}
                      </p>
                      <p className="nav-profile-role">
                        {normalizedRole === "ADMIN"
                          ? "Administrator"
                          : normalizedRole === "OWNER"
                            ? user?.ownerListingType === "SHELTER"
                              ? "Shelter"
                              : "Owner"
                            : "Adopter"}
                      </p>
                    </div>
                  </div>
                </div>

                {menuItems.map((item) => (
                  <button
                    key={item.label}
                    type="button"
                    className="nav-profile-item"
                    onClick={() => closeMenuAndNavigate(item.path)}
                  >
                    <span className="nav-profile-item-icon" aria-hidden />
                    <span>{item.label}</span>
                  </button>
                ))}

                <div className="nav-profile-divider" role="presentation" />

                <button
                  type="button"
                  className="nav-profile-item"
                  onClick={() => closeMenuAndNavigate("/account")}
                >
                  <span className="nav-profile-item-icon nav-profile-item-icon-account" aria-hidden />
                  <span>Edit profile</span>
                </button>

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