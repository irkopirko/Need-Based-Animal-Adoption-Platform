import { getApiBaseUrl } from "./auth";
import { fetchStrongMatchAnimals, STRONG_MATCH_THRESHOLD } from "./adopterJourney";

const INQUIRIES_KEY = "paviaOwnerInquiries";
const THREADS_KEY = "paviaOwnerMessageThreads";

export const PAVIA_OWNER_ENGAGEMENT_UPDATED = "paviaOwnerEngagementUpdated";

export function notifyOwnerEngagementUpdated() {
  if (typeof window !== "undefined") {
    window.dispatchEvent(new CustomEvent(PAVIA_OWNER_ENGAGEMENT_UPDATED));
  }
}

export async function fetchAllAnimals() {
  const api = getApiBaseUrl();
  try {
    const res = await fetch(`${api}/api/animals`);
    if (!res.ok) {
      return [];
    }
    const data = await res.json();
    return Array.isArray(data) ? data : [];
  } catch {
    return [];
  }
}

export function filterListingsForOwner(animals, ownerId) {
  const oid = Number(ownerId);
  return (animals || []).filter((a) => Number(a.ownerId) === oid);
}

export function ownerListingsInStrongMatches(listings, strongMatches) {
  const ids = new Set((strongMatches || []).map((a) => Number(a.id)));
  return (listings || []).filter((l) => ids.has(Number(l.id)));
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
  if (!state.hasStrongMatchOnListings) {
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
  const listings = filterListingsForOwner(animals, ownerId);
  const strongMatches = await fetchStrongMatchAnimals();
  const matchedListings = ownerListingsInStrongMatches(listings, strongMatches);
  const inquiries = readOwnerInquiries(ownerId);
  const threads = readOwnerThreads(ownerId);

  return {
    listings,
    strongMatches,
    matchedListings,
    inquiries,
    threads,
    hasListings: listings.length > 0,
    hasStrongMatchOnListings: matchedListings.length > 0,
    hasInquiries: inquiries.length > 0,
    hasAnyMessages: hasAnyThreadMessages(threads)
  };
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
export function getInquiryPreview(threads, inquiryId) {
  const arr = threads?.[inquiryId];
  if (!Array.isArray(arr) || arr.length === 0) {
    return "No messages yet — get in contact to start.";
  }
  const last = arr[arr.length - 1];
  return last?.text || "";
}

export { STRONG_MATCH_THRESHOLD };
