import { getApiBaseUrl } from "./auth";

/**
 * Strong match cutoff (inclusive): animals with compatibility score >= this value
 * count as matches everywhere in the adopter flow (saved list, messages unlock, etc.).
 */
export const STRONG_MATCH_THRESHOLD = 75;

export async function fetchUserAdoptionRequests(userId) {
  if (!userId) {
    return [];
  }
  const api = getApiBaseUrl();
  try {
    const res = await fetch(`${api}/api/adoption-requests/user/${userId}`);
    if (!res.ok) {
      return [];
    }
    const data = await res.json();
    return Array.isArray(data) ? data : [];
  } catch {
    return [];
  }
}

export function summarizeAdoptionRequests(requests) {
  const list = Array.isArray(requests) ? requests : [];
  const hasSubmitted = list.some(
    (r) => String(r.requestPhase || "").toUpperCase() === "SUBMITTED"
  );
  const hasDraft = list.some((r) => {
    const p = String(r.requestPhase || "").toUpperCase();
    return !p || p === "DRAFT";
  });
  return {
    hasAny: list.length > 0,
    hasSubmitted,
    hasDraft
  };
}

/**
 * Maps {@code /api/match/{userId}} rows into the same animal-like shape used by compatible / saved UIs.
 */
export function mapMatchResultToCompatibleAnimal(row, apiBaseUrl) {
  if (!row || typeof row !== "object") {
    return row;
  }
  const rawUrl = row.coverImageUrl;
  const resolved = resolveMediaUrl(rawUrl, apiBaseUrl) || rawUrl || null;
  const reasons = Array.isArray(row.matchReasons) ? row.matchReasons : [];
  const pct = Math.round(Number(row.matchPercentage) || 0);
  const desc =
    (typeof row.description === "string" && row.description.trim()) ||
    (reasons.length ? reasons.slice(0, 3).join(" · ") : "");

  return {
    id: row.animalId,
    name: row.name,
    animalType: row.animalType,
    breed: row.breed,
    ageGroup: row.ageGroup,
    size: row.size,
    energyLevel: row.energyLevel,
    housingLocation: row.housingLocation,
    description: desc,
    compatibilityScore: pct,
    images: resolved ? [resolved] : [],
    matchReasons: reasons,
    isSaved: row.saved === true || row.isSaved === true
  };
}

/**
 * Strong matches for adopters: computed from the saved adoption request via {@code /api/match}.
 * When {@code userId} is omitted, falls back to DB {@code /api/animals/compatible} (owner dashboard / legacy).
 *
 * @param {number|string|null|undefined} userId
 * @param {number|string|null|undefined} [requestId] optional adoption_requests.id to score against
 */
export async function fetchStrongMatchAnimals(userId, requestId = null) {
  const api = getApiBaseUrl();
  const uid = userId != null ? Number(userId) : NaN;
  if (!Number.isFinite(uid) || uid <= 0) {
    try {
      const res = await fetch(
        `${api}/api/animals/compatible?threshold=${STRONG_MATCH_THRESHOLD}`
      );
      if (!res.ok) {
        return [];
      }
      const data = await res.json();
      return Array.isArray(data) ? data : [];
    } catch {
      return [];
    }
  }

  try {
    const rid = requestId != null ? Number(requestId) : NaN;
    const q =
      Number.isFinite(rid) && rid > 0
        ? `?requestId=${encodeURIComponent(String(rid))}`
        : "";
    const res = await fetch(`${api}/api/match/${uid}${q}`);
    if (!res.ok) {
      return [];
    }
    const data = await res.json();
    const list = Array.isArray(data) ? data : [];
    return list
      .filter((row) => (Number(row.matchPercentage) || 0) >= STRONG_MATCH_THRESHOLD)
      .map((row) => mapMatchResultToCompatibleAnimal(row, api));
  } catch {
    return [];
  }
}

export async function fetchSavedAnimalsForUser(userId) {
  if (!userId) {
    return [];
  }
  const api = getApiBaseUrl();
  try {
    const res = await fetch(`${api}/api/saved/${userId}`);
    if (!res.ok) {
      return [];
    }
    const data = await res.json();
    return Array.isArray(data) ? data : [];
  } catch {
    return [];
  }
}

/**
 * Default Spring Boot API port when the SPA runs on localhost (CRA/Vite) but uploads are served by the backend.
 */
const DEFAULT_LOCAL_API = "http://localhost:8080";

/** Loopback browser host: use relative `/uploads/...` so CRA dev proxy can reach Spring Boot. */
function isLoopbackPage() {
  if (typeof window === "undefined") {
    return false;
  }
  const h = window.location.hostname;
  return h === "localhost" || h === "127.0.0.1" || h === "[::1]";
}

function loopbackUploadsPathname(urlString) {
  try {
    const u = new URL(urlString);
    if (!u.pathname.startsWith("/uploads/")) {
      return null;
    }
    const h = u.hostname;
    if (h !== "localhost" && h !== "127.0.0.1" && h !== "[::1]") {
      return null;
    }
    return `${u.pathname}${u.search}${u.hash}`;
  } catch {
    return null;
  }
}

function uploadBaseForBrowser(apiBaseUrl, relativePath) {
  const base = (apiBaseUrl || "").replace(/\/$/, "");
  if (!relativePath.startsWith("/uploads/")) {
    return base;
  }
  if (typeof window === "undefined") {
    return base || DEFAULT_LOCAL_API;
  }
  let pageOrigin = "";
  try {
    pageOrigin = window.location.origin.replace(/\/$/, "");
  } catch {
    return base || DEFAULT_LOCAL_API;
  }
  let host = "";
  try {
    host = new URL(pageOrigin).hostname;
  } catch {
    return base || DEFAULT_LOCAL_API;
  }
  const isLocalPage = host === "localhost" || host === "127.0.0.1";
  if (isLocalPage && (!base || base === pageOrigin)) {
    return DEFAULT_LOCAL_API;
  }
  return base || pageOrigin || DEFAULT_LOCAL_API;
}

export function resolveMediaUrl(path, apiBaseUrl) {
  if (path == null || path === "") {
    return null;
  }
  const s = typeof path === "string" ? path.trim() : String(path).trim();
  if (!s) {
    return null;
  }
  if (/^https?:\/\//i.test(s)) {
    if (isLoopbackPage()) {
      const rel = loopbackUploadsPathname(s);
      if (rel) {
        return rel;
      }
    }
    return s;
  }
  const p = s.startsWith("/") ? s : `/${s}`;
  if (isLoopbackPage() && p.startsWith("/uploads/")) {
    return p;
  }
  let base = uploadBaseForBrowser(apiBaseUrl, p).replace(/\/$/, "");
  if (!base) {
    return p;
  }
  return `${base}${p}`;
}

export function resolveAnimalImageUrl(animal, apiBaseUrl) {
  return resolveMediaUrl(animal?.images?.[0], apiBaseUrl);
}

/**
 * @returns {Promise<{ submitted: boolean, draftOnly: boolean, noRequest: boolean, strongMatches: any[], savedAnimals: any[] }>}
 */
export async function loadAdopterJourneyState(userId) {
  const apiBaseUrl = getApiBaseUrl();
  const localSubmitted =
    typeof window !== "undefined" &&
    localStorage.getItem("adoptionRequestCompleted") === "true";

  const requests = await fetchUserAdoptionRequests(userId);
  const { hasAny, hasSubmitted, hasDraft } = summarizeAdoptionRequests(requests);

  const submitted = hasSubmitted || (!hasAny && localSubmitted);

  const noRequest = !hasAny && !localSubmitted;
  const draftOnly = hasAny && hasDraft && !hasSubmitted && !localSubmitted;

  let strongMatches = [];
  if (submitted) {
    strongMatches = await fetchStrongMatchAnimals(userId);
  }

  let savedAnimals = [];
  if (submitted) {
    savedAnimals = await fetchSavedAnimalsForUser(userId);
  }

  return {
    submitted,
    draftOnly,
    noRequest,
    strongMatches,
    savedAnimals,
    apiBaseUrl
  };
}

export function mergeSavedWithCompatibility(savedAnimals, strongMatches, apiBaseUrl) {
  const byId = new Map(
    (strongMatches || []).map((a) => [Number(a.id), a])
  );
  return (savedAnimals || []).map((animal) => {
    const m = byId.get(Number(animal.id));
    const score = Math.round(
      (m && m.compatibilityScore != null
        ? m.compatibilityScore
        : animal.compatibilityScore) ?? 0
    );
    return {
      id: animal.id,
      name: animal.name,
      type: animal.animalType || "",
      breed: animal.breed || "",
      age: animal.ageGroup || "",
      size: animal.size || "",
      energy: animal.energyLevel || "",
      compatibility: score,
      image: resolveAnimalImageUrl(animal, apiBaseUrl),
      raw: animal
    };
  });
}
