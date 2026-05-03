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

export async function fetchStrongMatchAnimals() {
  const api = getApiBaseUrl();
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

export function resolveAnimalImageUrl(animal, apiBaseUrl) {
  const path = animal?.images?.[0];
  if (!path) {
    return null;
  }
  if (path.startsWith("http")) {
    return path;
  }
  const base = (apiBaseUrl || "").replace(/\/$/, "");
  const p = path.startsWith("/") ? path : `/${path}`;
  return `${base}${p}`;
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
    strongMatches = await fetchStrongMatchAnimals();
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
