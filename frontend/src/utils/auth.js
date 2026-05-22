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
    (compactRole.includes("OWNER") && !compactRole.includes("ADOPTER"))
  ) {
    return "OWNER";
  }

  if (compactRole === "ADMIN" || compactRole === "ROLE_ADMIN") {
    return "ADMIN";
  }

  return normalizedRole;
};

export const ADMIN_EMAIL = "21soft1087@isik.edu.tr";

/** Emails that receive ADMIN on login and cannot delete their account via the app. */
export const ADMIN_EMAILS = [ADMIN_EMAIL, "iremcliik2@gmail.com"];

export const isAdminEmail = (email) => {
  if (email == null) {
    return false;
  }
  const normalized = String(email).trim().toLowerCase();
  return ADMIN_EMAILS.some((a) => a.toLowerCase() === normalized);
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

export const isOwnerProfileComplete = (user) => {
  if (normalizeRole(user?.role) !== "OWNER") {
    return true;
  }
  return user?.ownerProfileCompleted === true || user?.ownerProfileCompleted === "true";
};

export const isOwnerProfileIncomplete = (user) => !isOwnerProfileComplete(user);

export const getOwnerHomePath = (user) => {
  if (isOwnerProfileIncomplete(user)) {
    return "/complete-owner-profile";
  }
  return "/ownerhomepage";
};

export const getHomePathByRole = (role) => {
  const normalizedRole = normalizeRole(role);

  if (normalizedRole === "ADOPTER") {
    return "/adopterhomepage";
  }

  if (normalizedRole === "OWNER") {
    return "/ownerhomepage";
  }

  if (normalizedRole === "ADMIN") {
    return "/adminhomepage";
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

/** Numeric account id from stored session (supports several JSON shapes from the API). */
export const getResolvedUserId = (user) => {
  if (!user) {
    return null;
  }
  const raw =
    user.userId ??
    user.user_id ??
    user.id ??
    user.userID ??
    user?.user?.id ??
    user?.user?.userId;
  if (raw == null || raw === "") {
    return null;
  }
  const s = typeof raw === "string" ? raw.trim() : raw;
  const n = Number(s);
  return Number.isFinite(n) ? n : null;
};

/**
 * When unset, use same-origin URLs on loopback during `npm start` so CRA `setupProxy.js` can forward
 * `/api` and `/uploads` to Spring Boot. Set `REACT_APP_API_URL` explicitly for production or remote APIs.
 */
export const getApiBaseUrl = () => {
  const fromEnv = process.env.REACT_APP_API_URL?.trim();
  if (fromEnv) {
    return fromEnv;
  }
  if (typeof window !== "undefined") {
    const h = window.location.hostname;
    if (h === "localhost" || h === "127.0.0.1" || h === "[::1]") {
      return "";
    }
  }
  return "http://localhost:8080";
};

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

/** Minimum age for profile birth year (complete profile, account). */
export const MIN_PROFILE_AGE_YEARS = 18;

/**
 * Latest birth year that satisfies minimum age as of {@code referenceDate}
 * (e.g. in 2026 → 2008 for 18+).
 */
export function getLatestAllowedBirthYear(
  minAgeYears = MIN_PROFILE_AGE_YEARS,
  referenceDate = new Date()
) {
  return referenceDate.getFullYear() - minAgeYears;
}

/** Descending birth years from latest allowed down to 1900 (for &lt;select&gt;). */
export function getBirthYearSelectOptions(
  minAgeYears = MIN_PROFILE_AGE_YEARS,
  referenceDate = new Date()
) {
  const latest = getLatestAllowedBirthYear(minAgeYears, referenceDate);
  const earliest = 1900;
  const options = [];
  for (let y = latest; y >= earliest; y -= 1) {
    options.push(y);
  }
  return options;
}

export function isBirthYearValidForMinAge(
  year,
  minAgeYears = MIN_PROFILE_AGE_YEARS,
  referenceDate = new Date()
) {
  const y = Number(year);
  if (!Number.isFinite(y)) {
    return false;
  }
  const latest = getLatestAllowedBirthYear(minAgeYears, referenceDate);
  return y >= 1900 && y <= latest;
}