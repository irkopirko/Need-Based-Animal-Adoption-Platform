import { getApiBaseUrl } from "./auth";
import {
  fetchStrongMatchAnimals,
  resolveMediaUrl,
  STRONG_MATCH_THRESHOLD
} from "./adopterJourney";
import { fetchOwnerInquiries } from "./platformApi";
import {
  filterInquiriesForOpenDashboardListings,
  filterOpenDashboardListings
} from "./listingDisplay";

const INQUIRIES_KEY = "paviaOwnerInquiries";
const THREADS_KEY = "paviaOwnerMessageThreads";

export const PAVIA_OWNER_ENGAGEMENT_UPDATED = "paviaOwnerEngagementUpdated";

/** Same-origin safe when {@code getApiBaseUrl()} is {@code ""} (CRA {@code setupProxy}). */
function apiUrl(apiBase, path) {
  const p = path.startsWith("/") ? path : `/${path}`;
  const b = (apiBase || "").replace(/\/$/, "");
  return b ? `${b}${p}` : p;
}

/**
 * Owner listings and dashboards expect {@code animal.images} as string URLs.
 * Normalizes alternate JSON shapes (nested rows, snake_case) from APIs.
 */
export function normalizeAnimalFromApi(animal) {
  if (!animal || typeof animal !== "object") {
    return animal;
  }
  let images = animal.images;
  if (Array.isArray(images) && images.some(Boolean)) {
    return {
      ...animal,
      images: images.map((x) => String(x).trim()).filter(Boolean)
    };
  }
  if (Array.isArray(animal.imageUrls) && animal.imageUrls.some(Boolean)) {
    return {
      ...animal,
      images: animal.imageUrls.map((x) => String(x).trim()).filter(Boolean)
    };
  }
  if (Array.isArray(animal.image_urls) && animal.image_urls.some(Boolean)) {
    return {
      ...animal,
      images: animal.image_urls.map((x) => String(x).trim()).filter(Boolean)
    };
  }
  if (Array.isArray(animal.animalImages) && animal.animalImages.length > 0) {
    const urls = animal.animalImages
      .map((row) => row?.imageUrl ?? row?.image_url ?? row?.url)
      .filter((x) => x != null && String(x).trim() !== "");
    if (urls.length > 0) {
      return { ...animal, images: urls.map((x) => String(x).trim()) };
    }
  }
  return {
    ...animal,
    images: Array.isArray(images) ? images.filter(Boolean) : []
  };
}

/** Ordered image URL strings for an owner listing card or dashboard row. */
export function ownerListingImageUrls(animal) {
  const n = normalizeAnimalFromApi(animal);
  if (!n || typeof n !== "object") {
    return [];
  }
  const arr = n.images;
  return Array.isArray(arr) ? arr.map((x) => String(x).trim()).filter(Boolean) : [];
}

/** Resolve one stored path/URL for an img src (same rules as adopter flow + CRA proxy). */
export function resolveOwnerListingImageUrl(path, apiBaseUrl) {
  return resolveMediaUrl(path, apiBaseUrl);
}

export function notifyOwnerEngagementUpdated() {
  if (typeof window !== "undefined") {
    window.dispatchEvent(new CustomEvent(PAVIA_OWNER_ENGAGEMENT_UPDATED));
  }
}

export async function fetchAllAnimals() {
  const api = getApiBaseUrl();
  try {
    const res = await fetch(apiUrl(api, "/api/animals"));
    if (!res.ok) {
      return [];
    }
    const data = await res.json();
    const raw = Array.isArray(data) ? data : [];
    return raw.map(normalizeAnimalFromApi);
  } catch {
    return [];
  }
}

/**
 * Animals listed by this owner (DB {@code animals.owner_id}). Requires {@code viewerId === ownerId}.
 * @throws {Error} when the HTTP response is not OK (so callers can show the server message).
 */
export async function fetchOwnerListings(ownerId) {
  const oid = Number(ownerId);
  if (!Number.isFinite(oid)) {
    throw new Error("Missing or invalid owner id.");
  }
  const api = getApiBaseUrl();
  const res = await fetch(
    apiUrl(api, `/api/animals/owner/${oid}?viewerId=${oid}`)
  );
  if (!res.ok) {
    const text = await res.text();
    let msg = `Listings request failed (${res.status}).`;
    try {
      const body = JSON.parse(text);
      if (body && typeof body.error === "string") {
        msg = body.error;
      }
    } catch {
      if (text && text.trim()) {
        msg = text.trim().slice(0, 200);
      }
    }
    throw new Error(msg);
  }
  const data = await res.json();
  const raw = Array.isArray(data) ? data : [];
  return raw.map(normalizeAnimalFromApi);
}

export function normalizeListingStatusKey(status) {
  const s = String(status || "ACTIVE").trim().toUpperCase();
  if (s.startsWith("ARCHIV")) {
    return "ARCHIVED";
  }
  return s;
}

/** Counts for owner dashboard and navbar (archived / adopted listings). */
export function countOwnerListingStatuses(listings) {
  let archived = 0;
  let adopted = 0;
  for (const item of listings || []) {
    const key = normalizeListingStatusKey(item?.listingStatus);
    if (key === "ARCHIVED") {
      archived += 1;
    } else if (key === "ADOPTED") {
      adopted += 1;
    }
  }
  return { archived, adopted };
}

export function filterListingsForOwner(animals, ownerId) {
  const oid = Number(ownerId);
  return (animals || []).filter((a) => Number(a.ownerId) === oid);
}

export function ownerListingsInStrongMatches(listings, strongMatches) {
  const ids = new Set((strongMatches || []).map((a) => Number(a.id)));
  return (listings || []).filter((l) => ids.has(Number(l.id)));
}

/** Listings that already received at least one adopter message request. */
export function listingsWithInquiries(listings, inquiries) {
  const ids = new Set(
    (inquiries || []).map((i) => Number(i.animalId)).filter(Number.isFinite)
  );
  return (listings || []).filter((l) => ids.has(Number(l.id)));
}

export function mergeOwnerListingsById(...groups) {
  const map = new Map();
  for (const group of groups) {
    for (const listing of group || []) {
      if (listing?.id != null) {
        map.set(Number(listing.id), listing);
      }
    }
  }
  return [...map.values()];
}

/**
 * Strong matches for an owner's listings via persisted match snapshots (≥ threshold).
 */
export async function fetchOwnerStrongMatchListings(ownerId, listings) {
  const oid = Number(ownerId);
  if (!Number.isFinite(oid) || !Array.isArray(listings) || listings.length === 0) {
    return [];
  }
  const api = getApiBaseUrl();
  const matchedById = new Map();

  await Promise.all(
    listings.map(async (listing) => {
      const aid = Number(listing.id);
      if (!Number.isFinite(aid)) {
        return;
      }
      try {
        const res = await fetch(
          apiUrl(api, `/api/adoptions/animals/${aid}/matches?ownerId=${oid}`)
        );
        if (!res.ok) {
          return;
        }
        const data = await res.json();
        const rows = Array.isArray(data) ? data : [];
        const hasStrong = rows.some(
          (s) => Number(s.matchPercentage) >= STRONG_MATCH_THRESHOLD
        );
        if (hasStrong) {
          matchedById.set(aid, listing);
        }
      } catch {
        /* per-listing failure is non-fatal */
      }
    })
  );

  return [...matchedById.values()];
}

export function readOwnerInquiries(ownerId) {
  const oid = Number(ownerId);
  try {
    const raw = localStorage.getItem(INQUIRIES_KEY);
    const all = raw ? JSON.parse(raw) : [];
    if (!Array.isArray(all)) {
      return [];
    }
    return all.filter((x) => Number(x.ownerId) === oid);
  } catch {
    return [];
  }
}

/** Inquiries stored for this owner that reference a specific listing ({@code animalId}). */
export function readInquiriesForAnimal(ownerId, animalId) {
  const aid = Number(animalId);
  if (!Number.isFinite(aid)) {
    return [];
  }
  return readOwnerInquiries(ownerId).filter((x) => Number(x.animalId) === aid);
}

export function readOwnerThreads(ownerId) {
  try {
    const raw = localStorage.getItem(THREADS_KEY);
    const all = raw ? JSON.parse(raw) : {};
    const bucket = all[String(ownerId)] || {};
    return typeof bucket === "object" && bucket !== null ? bucket : {};
  } catch {
    return {};
  }
}

export function threadHasMessages(threadMap, inquiryId) {
  const arr = threadMap?.[inquiryId];
  return Array.isArray(arr) && arr.length > 0;
}

export function hasAnyThreadMessages(threadMap) {
  return Object.values(threadMap || {}).some(
    (arr) => Array.isArray(arr) && arr.length > 0
  );
}

/**
 * @returns {'NO_LISTINGS'|'LISTINGS_NO_STRONG_MATCH'|'STRONG_MATCH_NO_INQUIRY'|'INQUIRY_NO_MESSAGES'|'FULL'}
 */
export function resolveOwnerScenario(state) {
  if (!state.hasListings) {
    return "NO_LISTINGS";
  }
  if (!state.hasStrongMatchOnListings && !state.hasInquiries) {
    return "LISTINGS_NO_STRONG_MATCH";
  }
  if (!state.hasInquiries) {
    return "STRONG_MATCH_NO_INQUIRY";
  }
  if (!state.hasAnyMessages) {
    return "INQUIRY_NO_MESSAGES";
  }
  return "FULL";
}

export async function loadOwnerEngagementState(ownerId) {
  const animals = await fetchAllAnimals();
  const allListings = filterListingsForOwner(animals, ownerId);
  const listings = filterOpenDashboardListings(allListings);
  let inquiries = [];
  try {
    const fromApi = await fetchOwnerInquiries(ownerId);
    inquiries = Array.isArray(fromApi) ? fromApi : [];
  } catch {
    inquiries = [];
  }
  const openInquiries = filterInquiriesForOpenDashboardListings(inquiries, allListings);

  const fromInquiries = listingsWithInquiries(listings, openInquiries);
  let fromSnapshots = [];
  try {
    fromSnapshots = await fetchOwnerStrongMatchListings(ownerId, listings);
  } catch {
    fromSnapshots = [];
  }

  let matchedListings = mergeOwnerListingsById(fromInquiries, fromSnapshots);
  matchedListings = filterOpenDashboardListings(matchedListings);
  let strongMatches = [];

  if (matchedListings.length === 0) {
    strongMatches = await fetchStrongMatchAnimals();
    matchedListings = ownerListingsInStrongMatches(listings, strongMatches);
  }

  const hasAnyMessages = openInquiries.some(
    (inq) => Array.isArray(inq.messages) && inq.messages.length > 0
  );

  return {
    listings,
    allListings,
    strongMatches,
    matchedListings,
    inquiries: openInquiries,
    hasListings: listings.length > 0,
    hasStrongMatchOnListings:
      matchedListings.length > 0 || openInquiries.length > 0,
    hasInquiries: openInquiries.length > 0,
    hasAnyMessages
  };
}

/** Inquiries for one listing from the database (owner/shelter ↔ adopter threads). */
export async function fetchInquiriesForAnimal(ownerId, animalId) {
  const oid = Number(ownerId);
  const aid = Number(animalId);
  try {
    const all = await fetchOwnerInquiries(oid);
    return (Array.isArray(all) ? all : []).filter((i) => Number(i.animalId) === aid);
  } catch {
    return [];
  }
}

export function getInquiryPreviewFromMessages(inquiry) {
  const msgs = inquiry?.messages;
  if (Array.isArray(msgs) && msgs.length > 0) {
    return msgs[msgs.length - 1].body || "";
  }
  return inquiry?.initialMessage || "No messages yet";
}

export function recordOwnerInquiry({
  ownerId,
  adopterUserId,
  adopterName,
  animalId,
  animalName,
  summary = "I would like to get in touch about adopting this animal."
}) {
  if (!ownerId || !animalId) {
    return { ok: false, error: "Missing owner or animal." };
  }
  const all = readOwnerInquiriesFlat();
  const dup = all.some(
    (x) =>
      Number(x.ownerId) === Number(ownerId) &&
      Number(x.animalId) === Number(animalId) &&
      (adopterUserId == null ||
        Number(x.adopterUserId) === Number(adopterUserId))
  );
  if (dup) {
    return { ok: false, error: "duplicate" };
  }
  const id = `inq-${Date.now()}`;
  all.push({
    id,
    ownerId: Number(ownerId),
    adopterUserId: adopterUserId != null ? Number(adopterUserId) : null,
    adopterName: adopterName || "Adopter",
    animalId: Number(animalId),
    animalName: animalName || "Animal",
    summary,
    status: "NEW",
    createdAt: new Date().toISOString()
  });
  localStorage.setItem(INQUIRIES_KEY, JSON.stringify(all));
  notifyOwnerEngagementUpdated();
  return { ok: true, id };
}

function readOwnerInquiriesFlat() {
  try {
    const raw = localStorage.getItem(INQUIRIES_KEY);
    const all = raw ? JSON.parse(raw) : [];
    return Array.isArray(all) ? all : [];
  } catch {
    return [];
  }
}

export function appendOwnerThreadMessage(ownerId, inquiryId, { sender, text }) {
  if (!ownerId || !inquiryId || !text?.trim()) {
    return;
  }
  const raw = localStorage.getItem(THREADS_KEY);
  let all = {};
  try {
    all = raw ? JSON.parse(raw) : {};
  } catch {
    all = {};
  }
  const key = String(ownerId);
  if (!all[key] || typeof all[key] !== "object") {
    all[key] = {};
  }
  if (!Array.isArray(all[key][inquiryId])) {
    all[key][inquiryId] = [];
  }
  const time = new Date().toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit"
  });
  all[key][inquiryId].push({
    id: `m-${Date.now()}`,
    sender: sender === "owner" ? "owner" : "adopter",
    text: text.trim(),
    time
  });
  localStorage.setItem(THREADS_KEY, JSON.stringify(all));
  notifyOwnerEngagementUpdated();
}

export function formatInquiryDate(iso) {
  if (!iso) {
    return "";
  }
  try {
    const d = new Date(iso);
    const now = new Date();
    const sameDay =
      d.getDate() === now.getDate() &&
      d.getMonth() === now.getMonth() &&
      d.getFullYear() === now.getFullYear();
    if (sameDay) {
      return "Today";
    }
    return d.toLocaleDateString(undefined, { month: "short", day: "numeric" });
  } catch {
    return "";
  }
}
/** @deprecated use {@link getInquiryPreviewFromMessages} with API inquiry rows */
export function getInquiryPreview(threads, inquiryId) {
  const arr = threads?.[inquiryId];
  if (!Array.isArray(arr) || arr.length === 0) {
    return "No messages yet — get in contact to start.";
  }
  const last = arr[arr.length - 1];
  return last?.text || "";
}

export { STRONG_MATCH_THRESHOLD };
