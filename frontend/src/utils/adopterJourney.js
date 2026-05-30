import { getApiBaseUrl } from "./auth";

/**
 * Strong match cutoff (inclusive): animals with compatibility score >= this value
 * count as matches everywhere in the adopter flow (saved list, messages unlock, etc.).
 */
export const STRONG_MATCH_THRESHOLD = 75;
const COMPATIBLE_CACHE_MS = 60_000;
const REQUESTS_CACHE_MS = 45_000;
const SAVED_ENTRIES_CACHE_MS = 45_000;

/** Display label for type filters (DOG → Dog, etc.). */
export function normalizeAnimalTypeLabel(animalType) {
  const u = String(animalType || "").toUpperCase();
  if (u === "DOG") {
    return "Dog";
  }
  if (u === "CAT") {
    return "Cat";
  }
  if (u === "RABBIT") {
    return "Rabbit";
  }
  if (!animalType) {
    return "";
  }
  const lower = String(animalType).toLowerCase().replace(/_/g, " ");
  return lower.charAt(0).toUpperCase() + lower.slice(1);
}

export async function fetchUserAdoptionRequests(userId) {
  if (!userId) {
    return [];
  }
  const key = `paviaAdoptionRequests:${userId}`;
  if (typeof window !== "undefined") {
    try {
      const raw = sessionStorage.getItem(key);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (parsed?.at && Date.now() - parsed.at < REQUESTS_CACHE_MS && Array.isArray(parsed.data)) {
          return parsed.data;
        }
      }
    } catch {
      // ignore cache parsing issues
    }
  }
  const api = getApiBaseUrl();
  try {
    const res = await fetch(`${api}/api/adoption-requests/user/${userId}`);
    if (!res.ok) {
      return [];
    }
    const data = await res.json();
    const list = Array.isArray(data) ? data : [];
    if (typeof window !== "undefined") {
      try {
        sessionStorage.setItem(key, JSON.stringify({ at: Date.now(), data: list }));
      } catch {
        // ignore cache write issues
      }
    }
    return list;
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
  const resolvedCover = resolveMediaUrl(rawUrl, apiBaseUrl) || rawUrl || null;
  const reasons = Array.isArray(row.matchReasons) ? row.matchReasons : [];
  const pct = Math.round(Number(row.matchPercentage) || 0);
  const desc =
    (typeof row.description === "string" && row.description.trim()) ||
    (reasons.length ? reasons.slice(0, 3).join(" · ") : "");

  let images = [];
  if (Array.isArray(row.listingImageUrls) && row.listingImageUrls.length > 0) {
    images = row.listingImageUrls
      .map((u) => resolveMediaUrl(u, apiBaseUrl) || u)
      .filter(Boolean);
  }
  if (images.length === 0 && resolvedCover) {
    images = [resolvedCover];
  }

  return {
    id: row.animalId,
    name: row.name,
    animalType: row.animalType,
    breed: row.breed,
    ageGroup: row.ageGroup,
    size: row.size,
    energyLevel: row.energyLevel,
    housingLocation: row.housingLocation,
    gender: row.gender,
    groomingNeed: row.groomingNeed,
    specialNeeds: row.specialNeeds,
    goodWithChildren: row.goodWithChildren,
    goodWithPets: row.goodWithPets,
    description: desc,
    compatibilityScore: pct,
    images,
    matchReasons: reasons,
    isSaved: row.saved === true || row.isSaved === true
  };
}

/**
 * Strong matches for adopters: overlap-based score from {@code /api/match} (listing fields vs the
 * submitted adoption request; ≥ {@code STRONG_MATCH_THRESHOLD}% inclusive). When {@code userId} is
 * omitted, falls back to DB {@code /api/animals/compatible} (legacy / non-adopter callers).
 *
 * @param {number|string|null|undefined} userId
 * @param {number|string|null|undefined} [requestId] optional adoption_requests.id to score against
 */
/** One request: listing + match score for adopter detail page. */
export async function fetchAdopterAnimalView(userId, animalId, requestId = null) {
  const api = getApiBaseUrl();
  const uid = Number(userId);
  const aid = Number(animalId);
  if (!Number.isFinite(uid) || !Number.isFinite(aid)) {
    return null;
  }
  const params = new URLSearchParams();
  params.set("adopterUserId", String(uid));
  const rid = requestId != null ? Number(requestId) : NaN;
  if (Number.isFinite(rid) && rid > 0) {
    params.set("requestId", String(rid));
  }
  try {
    const res = await fetch(
      `${api}/api/animals/${aid}/adopter-view?${params.toString()}`
    );
    if (!res.ok) {
      return null;
    }
    return res.json();
  } catch {
    return null;
  }
}

const ANIMAL_DETAIL_CACHE_MS = 120_000;
const ANIMAL_DETAIL_CACHE_VERSION = 1;

function animalDetailCacheKey(animalId) {
  return `paviaAnimalDetail:v${ANIMAL_DETAIL_CACHE_VERSION}:${animalId}`;
}

function normalizeDetailAnimal(data) {
  if (!data || typeof data !== "object") {
    return data;
  }
  let images = data.images;
  if (Array.isArray(images) && images.some(Boolean)) {
    return { ...data, images: images.map((x) => String(x).trim()).filter(Boolean) };
  }
  if (Array.isArray(data.imageUrls) && data.imageUrls.some(Boolean)) {
    return {
      ...data,
      images: data.imageUrls.map((x) => String(x).trim()).filter(Boolean)
    };
  }
  return { ...data, images: Array.isArray(images) ? images.filter(Boolean) : [] };
}

/** Find animal in adopter browse / match list session caches (instant detail seed). */
export function findAnimalInBrowseCaches(animalId, adopterUserId = null) {
  const aid = Number(animalId);
  if (!Number.isFinite(aid) || typeof window === "undefined") {
    return null;
  }
  const uid =
    adopterUserId != null && Number.isFinite(Number(adopterUserId))
      ? Number(adopterUserId)
      : null;
  try {
    for (let i = 0; i < sessionStorage.length; i += 1) {
      const key = sessionStorage.key(i);
      if (!key || !key.startsWith("paviaCompatibleMatches:")) {
        continue;
      }
      if (uid != null && !key.startsWith(`paviaCompatibleMatches:${uid}:`)) {
        continue;
      }
      const raw = sessionStorage.getItem(key);
      if (!raw) {
        continue;
      }
      const parsed = JSON.parse(raw);
      if (!Array.isArray(parsed?.data) || Date.now() - (parsed.at || 0) > COMPATIBLE_CACHE_MS) {
        continue;
      }
      const hit = parsed.data.find((a) => Number(a?.id) === aid);
      if (hit) {
        return normalizeDetailAnimal(hit);
      }
    }
  } catch {
    /* ignore */
  }
  return null;
}

export function readAnimalDetailCache(animalId) {
  const aid = Number(animalId);
  if (!Number.isFinite(aid) || typeof window === "undefined") {
    return null;
  }
  try {
    const raw = sessionStorage.getItem(animalDetailCacheKey(aid));
    if (!raw) {
      return null;
    }
    const parsed = JSON.parse(raw);
    if (!parsed?.data || Date.now() - (parsed.at || 0) > ANIMAL_DETAIL_CACHE_MS) {
      return null;
    }
    return normalizeDetailAnimal(parsed.data);
  } catch {
    return null;
  }
}

export function writeAnimalDetailCache(animalId, animal) {
  const aid = Number(animalId);
  if (!Number.isFinite(aid) || typeof window === "undefined" || !animal) {
    return;
  }
  try {
    sessionStorage.setItem(
      animalDetailCacheKey(aid),
      JSON.stringify({ at: Date.now(), data: normalizeDetailAnimal(animal) })
    );
  } catch {
    /* ignore */
  }
}

export async function fetchAnimalById(animalId) {
  const aid = Number(animalId);
  if (!Number.isFinite(aid)) {
    throw new Error("Invalid animal id.");
  }
  const api = getApiBaseUrl();
  const res = await fetch(`${api}/api/animals/${aid}`);
  if (!res.ok) {
    throw new Error(`Animal not found (${res.status}).`);
  }
  const data = normalizeDetailAnimal(await res.json());
  writeAnimalDetailCache(aid, data);
  return data;
}

/** Cache-first animal detail; refreshes in background when cache hit. */
export async function loadAnimalDetail(animalId, options = {}) {
  const aid = Number(animalId);
  const force = options.force === true;
  if (!force) {
    const cached = readAnimalDetailCache(aid);
    if (cached) {
      fetchAnimalById(aid).catch(() => {});
      return cached;
    }
  }
  return fetchAnimalById(aid);
}

/** Single-animal compatibility (detail page; avoids loading the full match list). */
export async function fetchMatchScoreForAnimal(userId, animalId, requestId = null) {
  const api = getApiBaseUrl();
  const uid = Number(userId);
  const aid = Number(animalId);
  if (!Number.isFinite(uid) || !Number.isFinite(aid)) {
    return null;
  }
  const params = new URLSearchParams();
  const rid = requestId != null ? Number(requestId) : NaN;
  if (Number.isFinite(rid) && rid > 0) {
    params.set("requestId", String(rid));
  }
  const qs = params.toString();
  try {
    const res = await fetch(
      `${api}/api/match/${uid}/animal/${aid}${qs ? `?${qs}` : ""}`,
      { cache: "no-store" }
    );
    if (!res.ok) {
      return null;
    }
    return res.json();
  } catch {
    return null;
  }
}

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
    const cacheKey =
      Number.isFinite(uid) && uid > 0
        ? `paviaCompatibleMatches:${uid}:${Number.isFinite(rid) && rid > 0 ? rid : "default"}`
        : null;
    if (cacheKey && typeof window !== "undefined") {
      try {
        const raw = sessionStorage.getItem(cacheKey);
        if (raw) {
          const parsed = JSON.parse(raw);
          if (parsed?.at && Date.now() - parsed.at < COMPATIBLE_CACHE_MS && Array.isArray(parsed.data)) {
            return parsed.data;
          }
        }
      } catch {
        // ignore malformed cache
      }
    }
    const params = new URLSearchParams();
    params.set("minOverlap", String(STRONG_MATCH_THRESHOLD));
    if (Number.isFinite(rid) && rid > 0) {
      params.set("requestId", String(rid));
    }
    const res = await fetch(`${api}/api/match/${uid}?${params.toString()}`);
    if (!res.ok) {
      const text = await res.text();
      let msg = `Could not load compatibility matches (HTTP ${res.status}).`;
      try {
        const body = JSON.parse(text);
        if (body && typeof body.error === "string" && body.error.trim()) {
          msg = body.error.trim();
        }
      } catch {
        if (text && text.trim()) {
          msg = text.trim().slice(0, 200);
        }
      }
      throw new Error(msg);
    }
    const data = await res.json();
    const list = Array.isArray(data) ? data : [];
    const mapped = list.map((row) => mapMatchResultToCompatibleAnimal(row, api));
    if (cacheKey && typeof window !== "undefined") {
      try {
        sessionStorage.setItem(cacheKey, JSON.stringify({ at: Date.now(), data: mapped }));
      } catch {
        // ignore cache write errors
      }
    }
    return mapped;
  } catch (e) {
    if (e instanceof Error) {
      throw e;
    }
    throw new Error("Could not load compatibility matches.");
  }
}

/** @returns {Promise<Array<{ animalId: number, adoptionRequestId: number|null, savedAt: string|null, animal: object }>>} */
export async function fetchSavedAnimalEntries(userId) {
  if (!userId) {
    return [];
  }
  const key = `paviaSavedEntries:${userId}`;
  if (typeof window !== "undefined") {
    try {
      const raw = sessionStorage.getItem(key);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (parsed?.at && Date.now() - parsed.at < SAVED_ENTRIES_CACHE_MS && Array.isArray(parsed.data)) {
          return parsed.data;
        }
      }
    } catch {
      // ignore cache parsing issues
    }
  }
  const api = getApiBaseUrl();
  try {
    const res = await fetch(`${api}/api/saved/${userId}`);
    if (!res.ok) {
      return [];
    }
    const data = await res.json();
    if (!Array.isArray(data)) {
      return [];
    }
    const mapped = data.map((row) => ({
      animalId: Number(row.animalId ?? row.animal?.id),
      adoptionRequestId:
        row.adoptionRequestId != null ? Number(row.adoptionRequestId) : null,
      savedAt: row.savedAt ?? null,
      animal: row.animal ?? row
    }));
    if (typeof window !== "undefined") {
      try {
        sessionStorage.setItem(key, JSON.stringify({ at: Date.now(), data: mapped }));
      } catch {
        // ignore cache write issues
      }
    }
    return mapped;
  } catch {
    return [];
  }
}

export async function fetchSavedAnimalsForUser(userId) {
  const entries = await fetchSavedAnimalEntries(userId);
  return entries.map((e) => e.animal).filter(Boolean);
}

export function formatAdoptionRequestSummary(request) {
  if (!request) {
    return "";
  }
  const parts = [];
  if (request.preferredAnimalTypes) {
    parts.push(`Types: ${request.preferredAnimalTypes}`);
  }
  if (request.livingSpace) {
    parts.push(`Home: ${request.livingSpace}`);
  }
  if (request.activityLevel) {
    parts.push(`Activity: ${request.activityLevel}`);
  }
  return parts.join(" · ") || "Submitted adoption request";
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

function isApiAnimalImagePath(pathname) {
  return /^\/api\/animals\/\d+\/images\/\d+/.test(pathname);
}

function loopbackRelativeMediaPathname(urlString) {
  try {
    const u = new URL(urlString);
    if (!u.pathname.startsWith("/uploads/") && !isApiAnimalImagePath(u.pathname)) {
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
      const rel = loopbackRelativeMediaPathname(s);
      if (rel) {
        return rel;
      }
    }
    return s;
  }
  const p = s.startsWith("/") ? s : `/${s}`;
  if (isLoopbackPage() && (p.startsWith("/uploads/") || isApiAnimalImagePath(p))) {
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

const ADOPTER_HOME_CACHE_MS = 120_000;
const ADOPTER_HOME_CACHE_VERSION = 4;

export const PAVIA_ADOPTER_HOME_SUMMARY_UPDATED = "paviaAdopterHomeSummaryUpdated";

function adopterHomeCacheKey(userId) {
  return `paviaAdopterHomeSummary:v${ADOPTER_HOME_CACHE_VERSION}:${userId}`;
}

function normalizeHomeSummaryPayload(data) {
  const requests = Array.isArray(data?.requests) ? data.requests : [];
  const submitted = requests.filter(
    (r) => String(r.requestPhase || "").toUpperCase() === "SUBMITTED"
  );
  return {
    requests,
    submittedRequestCount:
      Number(data?.submittedRequestCount) >= 0
        ? Number(data.submittedRequestCount)
        : submitted.length,
    strongMatchCount: Number(data?.strongMatchCount) || 0,
    savedCount: Number(data?.savedCount) || 0,
    primarySubmittedRequestId:
      data?.primarySubmittedRequestId != null
        ? Number(data.primarySubmittedRequestId)
        : submitted.length === 1
          ? Number(submitted[0].id)
          : null
  };
}

/** Instant read for adopter home (sessionStorage). */
export function readAdopterHomeSummaryCache(userId) {
  if (userId == null || typeof window === "undefined") {
    return null;
  }
  try {
    const raw = sessionStorage.getItem(adopterHomeCacheKey(userId));
    if (!raw) {
      return null;
    }
    const parsed = JSON.parse(raw);
    if (!parsed?.data || Date.now() - (parsed.at || 0) > ADOPTER_HOME_CACHE_MS) {
      return null;
    }
    return normalizeHomeSummaryPayload(parsed.data);
  } catch {
    return null;
  }
}

export function writeAdopterHomeSummaryCache(userId, data) {
  if (userId == null || typeof window === "undefined" || !data) {
    return;
  }
  try {
    sessionStorage.setItem(
      adopterHomeCacheKey(userId),
      JSON.stringify({ at: Date.now(), data: normalizeHomeSummaryPayload(data) })
    );
  } catch {
    /* ignore quota */
  }
}

export function invalidateAdopterHomeSummaryCache(userId) {
  if (userId == null || typeof window === "undefined") {
    return;
  }
  try {
    sessionStorage.removeItem(adopterHomeCacheKey(userId));
  } catch {
    /* ignore */
  }
}

export function invalidateUserRequestCache(userId) {
  if (userId == null || typeof window === "undefined") {
    return;
  }
  try {
    sessionStorage.removeItem(`paviaAdoptionRequests:${userId}`);
  } catch {
    // ignore
  }
}

export function invalidateSavedAnimalEntriesCache(userId) {
  if (userId == null || typeof window === "undefined") {
    return;
  }
  try {
    sessionStorage.removeItem(`paviaSavedEntries:${userId}`);
  } catch {
    // ignore
  }
}

/**
 * Lightweight dashboard counts for adopter home (single API call).
 * @returns {Promise<{ requests: any[], submittedRequestCount: number, strongMatchCount: number, savedCount: number, primarySubmittedRequestId: number|null }>}
 */
export async function loadAdopterHomeSummary(userId, options = {}) {
  const uid = Number(userId);
  if (!Number.isFinite(uid)) {
    return normalizeHomeSummaryPayload({});
  }

  const cached = !options.force ? readAdopterHomeSummaryCache(uid) : null;
  if (cached && options.background !== true) {
    refreshAdopterHomeSummaryInBackground(uid);
    return cached;
  }

  const api = getApiBaseUrl();
  try {
    const res = await fetch(`${api}/api/adopters/${uid}/home-summary`, {
      cache: "no-store"
    });
    if (!res.ok) {
      return loadAdopterHomeSummaryFallback(uid, cached);
    }
    const data = normalizeHomeSummaryPayload(await res.json());
    writeAdopterHomeSummaryCache(uid, data);
    return data;
  } catch {
    return loadAdopterHomeSummaryFallback(uid, cached);
  }
}

function refreshAdopterHomeSummaryInBackground(userId) {
  loadAdopterHomeSummary(userId, { force: true, background: true })
    .then((data) => {
      if (typeof window !== "undefined") {
        window.dispatchEvent(
          new CustomEvent(PAVIA_ADOPTER_HOME_SUMMARY_UPDATED, {
            detail: { userId, data }
          })
        );
      }
    })
    .catch(() => {});
}

async function loadAdopterHomeSummaryFallback(userId, staleCache) {
  if (staleCache) {
    return staleCache;
  }
  const requests = await fetchUserAdoptionRequests(userId);
  const submitted = requests.filter(
    (r) => String(r.requestPhase || "").toUpperCase() === "SUBMITTED"
  );
  const minimal = requests.map((r) => ({
    id: r.id,
    requestPhase: r.requestPhase
  }));
  const data = normalizeHomeSummaryPayload({
    requests: minimal,
    submittedRequestCount: submitted.length,
    strongMatchCount: 0,
    savedCount: 0,
    primarySubmittedRequestId: submitted.length === 1 ? submitted[0].id : null
  });
  writeAdopterHomeSummaryCache(userId, data);
  return data;
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
  let savedEntries = [];
  if (submitted) {
    savedEntries = await fetchSavedAnimalEntries(userId);
    savedAnimals = savedEntries.map((e) => e.animal).filter(Boolean);
  }

  return {
    submitted,
    draftOnly,
    noRequest,
    strongMatches,
    savedAnimals,
    savedEntries,
    requests,
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
      type: normalizeAnimalTypeLabel(animal.animalType),
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
