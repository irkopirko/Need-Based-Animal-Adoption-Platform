import React, { useCallback, useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import "./Navbar.css";
import {
  getHomePathByRole,
  getOwnerHomePath,
  getResolvedUserId,
  getStoredUser,
  getUserInitials,
  normalizeRole,
  PAVIA_USER_UPDATED_EVENT
} from "../utils/auth";
import {
  readOwnerHomeSummaryCache
} from "../utils/ownerJourney";
import { getNavbarConfig } from "./navbar/menuConfig";
import {
  clearNavbarStateForUser,
  getNavbarStateForUser,
  PAVIA_NAVBAR_STATE_UPDATED
} from "../utils/navbarState";

function Navbar() {
  const navigate = useNavigate();
  const [showMenu, setShowMenu] = useState(false);
  const [user, setUser] = useState(null);
  const [ownerListingCounts, setOwnerListingCounts] = useState({
    archived: 0,
    adopted: 0
  });
  const [badgeState, setBadgeState] = useState({
    ownerPendingRequests: 0,
    ownerUnreadMessages: 0,
    adopterUnreadMessages: 0
  });
  const menuRef = useRef(null);

  useEffect(() => {
    const syncUser = () => setUser(getStoredUser());
    syncUser();
    window.addEventListener(PAVIA_USER_UPDATED_EVENT, syncUser);
    return () => window.removeEventListener(PAVIA_USER_UPDATED_EVENT, syncUser);
  }, []);

  const isLoggedIn = !!user;
  const normalizedRole = normalizeRole(user?.role);
  const resolvedUserId = getResolvedUserId(user);

  const refreshOwnerListingCounts = useCallback(() => {
    if (normalizedRole !== "OWNER") {
      return;
    }
    const uid = getResolvedUserId(user);
    if (uid == null) {
      return;
    }
    const cached = readOwnerHomeSummaryCache(uid);
    if (cached) {
      setOwnerListingCounts({
        archived: cached.archivedCount,
        adopted: cached.adoptedCount
      });
    } else {
      setOwnerListingCounts({ archived: 0, adopted: 0 });
    }
  }, [normalizedRole, user]);

  useEffect(() => {
    if (!resolvedUserId) {
      setBadgeState({
        ownerPendingRequests: 0,
        ownerUnreadMessages: 0,
        adopterUnreadMessages: 0
      });
      return;
    }
    setBadgeState(getNavbarStateForUser(resolvedUserId));
    const onState = (event) => {
      const eventUid = Number(event?.detail?.userId);
      if (eventUid === Number(resolvedUserId)) {
        setBadgeState(getNavbarStateForUser(resolvedUserId));
      }
    };
    window.addEventListener(PAVIA_NAVBAR_STATE_UPDATED, onState);
    return () => window.removeEventListener(PAVIA_NAVBAR_STATE_UPDATED, onState);
  }, [resolvedUserId]);

  useEffect(() => {
    if (normalizedRole !== "OWNER") {
      setOwnerListingCounts({ archived: 0, adopted: 0 });
      return;
    }
    refreshOwnerListingCounts();
  }, [normalizedRole, refreshOwnerListingCounts]);

  useEffect(() => {
    if (!showMenu || normalizedRole !== "OWNER") {
      return;
    }
    refreshOwnerListingCounts();
  }, [showMenu, normalizedRole, refreshOwnerListingCounts]);

  const goHome = () => {
    const activeUser = getStoredUser();
    setUser(activeUser);
    if (normalizeRole(activeUser?.role) === "OWNER") {
      navigate(getOwnerHomePath(activeUser));
      return;
    }
    navigate(getHomePathByRole(activeUser?.role));
  };

  const goRegister = () => navigate("/register");
  const goLogin = () => navigate("/login");
  const handleLogout = () => {
    if (resolvedUserId) {
      clearNavbarStateForUser(resolvedUserId);
    }
    localStorage.removeItem("paviaUser");
    setUser(null);
    setShowMenu(false);
    navigate("/", { replace: true });
  };

  const closeMenuAndNavigate = (path) => {
    setShowMenu(false);
    navigate(path);
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

  const navbarConfig = getNavbarConfig({
    user,
    role: normalizedRole,
    ownerListingCounts,
    badgeState
  });
  const directItems = navbarConfig.direct || [];
  const menuItems = navbarConfig.menu || [];

  return (
    <header className="navbar">
      <div className="navbar-brand" onClick={goHome}>
        <div className="navbar-logo">❤</div>
        <span className="navbar-brand-text">Pavia</span>
      </div>

      <nav className="navbar-links">
        {directItems.map((item) => (
          <button
            key={item.label}
            type="button"
            className="navbar-link-btn navbar-link-btn-with-badge"
            onClick={() => navigate(item.path)}
          >
            {item.label}
            {item.attentionCount > 0 && (
              <span className="navbar-link-attention-badge">{item.attentionCount}</span>
            )}
          </button>
        ))}
      </nav>

      <div className="navbar-actions">
        {!isLoggedIn ? (
          <>
            <button type="button" className="navbar-login-btn" onClick={goLogin}>
              Log In
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
                    <span className="nav-profile-item-label">{item.label}</span>
                    {item.count != null && (
                      <span
                        className="nav-profile-item-count"
                        aria-label={`${item.count} ${item.label.toLowerCase()}`}
                      >
                        {item.count}
                      </span>
                    )}
                  </button>
                ))}

                <div className="nav-profile-divider" role="presentation" />

                <button
                  type="button"
                  className="nav-profile-item nav-profile-item-logout"
                  onClick={handleLogout}
                >
                  <span className="nav-profile-item-icon nav-profile-item-icon-logout" />
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
