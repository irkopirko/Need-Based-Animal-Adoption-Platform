import { normalizeInquiryStatus } from "./inquiryStatus";
import { formatAnimalGenderLabel } from "./textFormat";

export { formatAnimalGenderLabel };

/** Format {@code animals.registerTime} from API (ISO string or [y,m,d,...] array). */
export function formatListedDate(value) {
  if (value == null || value === "") {
    return "—";
  }
  let d;
  if (Array.isArray(value) && value.length >= 3) {
    const [y, mo = 1, day = 1] = value;
    d = new Date(Number(y), Number(mo) - 1, Number(day));
  } else if (typeof value === "string") {
    d = new Date(value);
  } else {
    return "—";
  }
  if (Number.isNaN(d.getTime())) {
    return "—";
  }
  return d.toLocaleDateString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric"
  });
}

export function listingLifecycleKey(status) {
  return String(status || "ACTIVE").trim().toUpperCase();
}

export function isListingAdopted(listingOrStatus) {
  const status =
    listingOrStatus != null && typeof listingOrStatus === "object"
      ? listingOrStatus.listingStatus
      : listingOrStatus;
  return listingLifecycleKey(status) === "ADOPTED";
}

export function isListingArchived(listingOrStatus) {
  const status =
    listingOrStatus != null && typeof listingOrStatus === "object"
      ? listingOrStatus.listingStatus
      : listingOrStatus;
  return listingLifecycleKey(status) === "ARCHIVED";
}

/** Active dashboard listings (not adopted, not archived). */
export function isListingOpenOnDashboard(listing) {
  return !isListingAdopted(listing) && !isListingArchived(listing);
}

/** Set of listing ids hidden from owner dashboard (adopted or archived). */
export function closedDashboardListingIdSet(listings) {
  return new Set(
    (listings || [])
      .filter((a) => !isListingOpenOnDashboard(a))
      .map((a) => Number(a.id))
      .filter(Number.isFinite)
  );
}

export function filterOpenDashboardListings(listings) {
  return (listings || []).filter(isListingOpenOnDashboard);
}

export function filterInquiriesForOpenDashboardListings(inquiries, allListings) {
  const closedIds = closedDashboardListingIdSet(allListings);
  return (inquiries || []).filter((inq) => !closedIds.has(Number(inq.animalId)));
}

/** @deprecated use {@link filterOpenDashboardListings} */
export function filterListingsExcludingAdopted(listings) {
  return filterOpenDashboardListings(listings);
}

/** @deprecated use {@link filterInquiriesForOpenDashboardListings} */
export function filterInquiriesExcludingAdoptedListings(inquiries, allListings) {
  return filterInquiriesForOpenDashboardListings(inquiries, allListings);
}

/** Per-animal inquiry counts for owner listing cards. */
export function buildInquiryStatsByAnimalId(inquiries) {
  const map = new Map();
  for (const inq of inquiries || []) {
    const aid = Number(inq.animalId);
    if (!Number.isFinite(aid)) {
      continue;
    }
    const cur = map.get(aid) || { total: 0, pending: 0 };
    cur.total += 1;
    if (normalizeInquiryStatus(inq.status) === "PENDING") {
      cur.pending += 1;
    }
    map.set(aid, cur);
  }
  return map;
}

/** Popup-aligned badge tones (see PopupProvider.css). */
export const LISTING_BADGE_VARIANTS = [
  "success",
  "info",
  "warning",
  "neutral"
];

/** One-word labels for owner listing cards (never raw DB "ACTIVE"). */
export const LISTING_STATUS_WORD = {
  LISTED: "Listed",
  MATCHED: "Matched",
  INQUIRED: "Inquired",
  ENGAGED: "Engaged",
  PENDING: "Pending",
  ARCHIVED: "Archived",
  ADOPTED: "Adopted",
  RESERVED: "Reserved"
};

/**
 * Owner listing card badge — lifecycle first, then engagement.
 * @returns {{ label: string, variant: 'success'|'info'|'warning'|'neutral', hint: string }}
 */
export function resolveListingCardStatus(animal, { inquiryStats, hasStrongMatch } = {}) {
  const lifecycle = listingLifecycleKey(animal?.listingStatus);
  if (lifecycle === "ARCHIVED") {
    return {
      label: LISTING_STATUS_WORD.ARCHIVED,
      variant: "neutral",
      hint: "Listing is archived and hidden from matching."
    };
  }
  if (lifecycle === "ADOPTED") {
    return {
      label: LISTING_STATUS_WORD.ADOPTED,
      variant: "info",
      hint: "This animal has been marked as adopted."
    };
  }
  if (lifecycle === "RESERVED") {
    return {
      label: LISTING_STATUS_WORD.RESERVED,
      variant: "warning",
      hint: "Listing is reserved for an adoption in progress."
    };
  }

  const pending = inquiryStats?.pending ?? 0;
  const total = inquiryStats?.total ?? 0;
  const matching = hasStrongMatch === true;

  if (pending > 0) {
    return {
      label: LISTING_STATUS_WORD.PENDING,
      variant: "warning",
      hint: matching
        ? "Strong matches and message requests awaiting your review."
        : "Message requests awaiting your review."
    };
  }
  if (total > 0 && matching) {
    return {
      label: LISTING_STATUS_WORD.ENGAGED,
      variant: "info",
      hint: "In strong matches and has adopter message activity."
    };
  }
  if (total > 0) {
    return {
      label: LISTING_STATUS_WORD.INQUIRED,
      variant: "info",
      hint: "Adopters have sent message requests for this listing."
    };
  }
  if (matching) {
    return {
      label: LISTING_STATUS_WORD.MATCHED,
      variant: "success",
      hint: "Visible in strong compatibility matches; no requests yet."
    };
  }
  return {
    label: LISTING_STATUS_WORD.LISTED,
    variant: "success",
    hint: "Published and open for compatibility matching."
  };
}
