import React, { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import "./Navbar.css";

function Navbar() {
  const navigate = useNavigate();
  const [showMenu, setShowMenu] = useState(false);
  const [user, setUser] = useState(null);
  const menuRef = useRef(null);

  useEffect(() => {
    const storedUser = localStorage.getItem("paviaUser");

    if (storedUser) {
      setUser(JSON.parse(storedUser));
    } else {
      setUser(null);
    }
  }, []);

  const isLoggedIn = !!user;

  const goHome = () => {
    if (!user) {
      navigate("/");
      return;
    }

    if (user.role === "adopter") {
      navigate("/adopter-home");
      return;
    }

    if (user.role === "owner") {
      navigate("/owner-home");
      return;
    }

    navigate("/");
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

    if (user.role === "owner") {
      return [
        { label: "My Animal Listings", path: "/owner-home" },
        { label: "Messages", path: "/owner-messages" },
        { label: "Adoption Inquiries", path: "/owner-inquiries" },
        { label: "Account Settings", path: "/owner-profile" }
      ];
    }

    return [
      { label: "Saved Animals", path: "/saved-animals" },
      { label: "My Adoption Requests", path: "/adoption-request" },
      { label: "Messages", path: "/adopter-messages" },
      { label: "Account Settings", path: "/adopter-profile" }
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

        {isLoggedIn && user?.role === "adopter" && (
          <button
            type="button"
            className="navbar-link-btn"
            onClick={goAdopterAdoptHub}
          >
            Adopt
          </button>
        )}

        {isLoggedIn && user?.role === "owner" && (
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
                    {user?.role === "owner" ? "Owner" : "Adopter"}
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