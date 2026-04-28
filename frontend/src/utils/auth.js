export const normalizeRole = (role) => {
  if (!role) {
    return null;
  }

  const normalizedRole = role.toString().trim().toUpperCase();
  const compactRole = normalizedRole.replace(/[\s-]/g, "_");

  if (
    compactRole === "ADOPTER" ||
    compactRole === "ROLE_ADOPTER" ||
    compactRole.includes("ADOPTER")
  ) {
    return "ADOPTER";
  }

  if (
    compactRole === "OWNER" ||
    compactRole === "SHELTER_OWNER" ||
    compactRole === "ROLE_OWNER" ||
    compactRole.includes("OWNER")
  ) {
    return "OWNER";
  }

  return normalizedRole;
};

export const isValidEmail = (email) => {
  if (!email) {
    return false;
  }

  return /^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$/.test(
    email.trim()
  );
};

export const getHomePathByRole = (role) => {
  const normalizedRole = normalizeRole(role);

  if (normalizedRole === "ADOPTER") {
    return "/adopterhomepage";
  }

  if (normalizedRole === "OWNER") {
    return "/ownerhomepage";
  }

  return "/";
};

export const getStoredUser = () => {
  const storedUser = localStorage.getItem("paviaUser");

  if (!storedUser) {
    return null;
  }

  try {
    const parsedUser = JSON.parse(storedUser);

    return {
      ...parsedUser,
      role: normalizeRole(parsedUser.role)
    };
  } catch (error) {
    return null;
  }
};
export const getApiBaseUrl = () =>
  process.env.REACT_APP_API_URL?.trim() || "http://localhost:8080";
