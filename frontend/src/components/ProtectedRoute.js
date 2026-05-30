import React from "react";
import { Navigate, useLocation } from "react-router-dom";
import {
  getHomePathByRole,
  getStoredUser,
  isAdminEmail,
  normalizeRole
} from "../utils/auth";

/**
 * @param {{ children: React.ReactNode, roles?: string[], requireAdminEmail?: boolean }} props
 */
function ProtectedRoute({ children, roles = [], requireAdminEmail = false }) {
  const location = useLocation();
  const user = getStoredUser();
  const role = normalizeRole(user?.role);

  if (!user) {
    return <Navigate to="/login" replace state={{ from: location.pathname }} />;
  }

  if (roles.length > 0 && !roles.includes(role)) {
    return <Navigate to={getHomePathByRole(role)} replace />;
  }

  if (requireAdminEmail && (role !== "ADMIN" || !isAdminEmail(user.email))) {
    return <Navigate to="/login" replace />;
  }

  return children;
}

export default ProtectedRoute;
