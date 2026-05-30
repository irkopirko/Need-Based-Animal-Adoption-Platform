export const PAVIA_NAVBAR_STATE_UPDATED = "paviaNavbarStateUpdated";

const CACHE_KEY = "paviaNavbarState";

function readCache() {
  if (typeof window === "undefined") {
    return {};
  }
  try {
    const raw = localStorage.getItem(CACHE_KEY);
    if (!raw) {
      return {};
    }
    const parsed = JSON.parse(raw);
    return parsed && typeof parsed === "object" ? parsed : {};
  } catch {
    return {};
  }
}

function writeCache(next) {
  if (typeof window === "undefined") {
    return;
  }
  try {
    localStorage.setItem(CACHE_KEY, JSON.stringify(next));
  } catch {
    // ignore quota/private mode errors
  }
}

function normalizeCount(value) {
  const n = Number(value);
  return Number.isFinite(n) && n > 0 ? Math.floor(n) : 0;
}

export function getNavbarStateForUser(userId) {
  const uid = Number(userId);
  if (!Number.isFinite(uid)) {
    return {
      ownerPendingRequests: 0,
      ownerUnreadMessages: 0,
      adopterUnreadMessages: 0
    };
  }
  const all = readCache();
  const row = all[String(uid)];
  return {
    ownerPendingRequests: normalizeCount(row?.ownerPendingRequests),
    ownerUnreadMessages: normalizeCount(row?.ownerUnreadMessages),
    adopterUnreadMessages: normalizeCount(row?.adopterUnreadMessages)
  };
}

export function updateNavbarStateForUser(userId, partial) {
  const uid = Number(userId);
  if (!Number.isFinite(uid) || !partial || typeof partial !== "object") {
    return;
  }
  const all = readCache();
  const key = String(uid);
  const prev = getNavbarStateForUser(uid);
  const nextRow = {
    ownerPendingRequests:
      partial.ownerPendingRequests == null
        ? prev.ownerPendingRequests
        : normalizeCount(partial.ownerPendingRequests),
    ownerUnreadMessages:
      partial.ownerUnreadMessages == null
        ? prev.ownerUnreadMessages
        : normalizeCount(partial.ownerUnreadMessages),
    adopterUnreadMessages:
      partial.adopterUnreadMessages == null
        ? prev.adopterUnreadMessages
        : normalizeCount(partial.adopterUnreadMessages)
  };
  all[key] = nextRow;
  writeCache(all);
  if (typeof window !== "undefined") {
    window.dispatchEvent(
      new CustomEvent(PAVIA_NAVBAR_STATE_UPDATED, {
        detail: { userId: uid, state: nextRow }
      })
    );
  }
}

export function clearNavbarStateForUser(userId) {
  const uid = Number(userId);
  if (!Number.isFinite(uid)) {
    return;
  }
  const all = readCache();
  delete all[String(uid)];
  writeCache(all);
  if (typeof window !== "undefined") {
    window.dispatchEvent(
      new CustomEvent(PAVIA_NAVBAR_STATE_UPDATED, {
        detail: {
          userId: uid,
          state: {
            ownerPendingRequests: 0,
            ownerUnreadMessages: 0,
            adopterUnreadMessages: 0
          }
        }
      })
    );
  }
}
