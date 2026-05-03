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

/**
 * Turkish GSM: 10 digits starting with 5 after optional +90 / 90 / 0 prefixes.
 * @returns {string|null} E.164 like +905551112233 or null if incomplete/invalid
 */
export const normalizeTurkishMobileToE164 = (input) => {
  let digits = String(input || "").replace(/\D/g, "");
  if (digits.startsWith("90")) {
    digits = digits.slice(2);
  }
  if (digits.startsWith("0")) {
    digits = digits.slice(1);
  }
  if (digits.length !== 10 || !/^5\d{9}$/.test(digits)) {
    return null;
  }
  return `+90${digits}`;
};

export const isValidTurkishMobileInput = (input) =>
  normalizeTurkishMobileToE164(input) != null;

/** Display as 0554 123 45 67 (same national form users type). */
export const formatTurkishPhoneInput = (value) => {
  let digits = String(value || "").replace(/\D/g, "");
  if (digits.startsWith("90")) {
    digits = digits.slice(2);
  }
  if (digits.startsWith("0")) {
    digits = digits.slice(1);
  }
  digits = digits.slice(0, 10);
  if (digits.length === 0) {
    return "";
  }
  let formatted = "0";
  if (digits.length > 0) {
    formatted += digits.slice(0, 3);
  }
  if (digits.length > 3) {
    formatted += ` ${digits.slice(3, 6)}`;
  }
  if (digits.length > 6) {
    formatted += ` ${digits.slice(6, 8)}`;
  }
  if (digits.length > 8) {
    formatted += ` ${digits.slice(8, 10)}`;
  }
  return formatted;
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

export const PAVIA_USER_UPDATED_EVENT = "paviaUserUpdated";

export const broadcastStoredUserRefresh = () => {
  if (typeof window !== "undefined") {
    window.dispatchEvent(new Event(PAVIA_USER_UPDATED_EVENT));
  }
};

export const isAdopterProfileComplete = (user) => {
  if (!user || normalizeRole(user.role) !== "ADOPTER") {
    return true;
  }
  if (user.adopterProfileCompleted === false) {
    return false;
  }
  if (user.adopterProfileCompleted === true) {
    return true;
  }
  return true;
};

export const getUserInitials = (user) => {
  if (!user) {
    return "?";
  }
  const name = (user.fullName || "").trim();
  if (name.length > 0) {
    const parts = name.split(/\s+/).filter(Boolean);
    if (parts.length >= 2) {
      return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
    }
    return name.slice(0, 2).toUpperCase();
  }
  const email = (user.email || "").trim();
  if (email.length > 0) {
    return email.slice(0, 2).toUpperCase();
  }
  return "?";
};

const PASSWORD_RULES = [
  {
    id: "length",
    message: "At least 8 characters",
    test: (password) => password.length >= 8
  },
  {
    id: "uppercase",
    message: "At least 1 uppercase letter",
    test: (password)=> /[A-Z]/.test(password)
  },
  {
    id: "lowercase",
    message: "At least 1 lowercase letter",
    test: (password) => /[a-z]/.test(password)
  },
  {
    id: "number",
    message: "At least 1 number",
    test: (password) => /\d/.test(password)
  },
  {
    id: "special",
    message: "At least 1 special character",
    test: (password) => /[^A-Za-z0-9]/.test(password)
  }
];

export const getMissingPasswordRequirements = (rawPassword) => {
  const password = rawPassword || "";
  return PASSWORD_RULES.filter((rule) => !rule.test(password)).map((rule) => rule.message);
};

export const isPasswordValid = (rawPassword) =>
  getMissingPasswordRequirements(rawPassword).length === 0;