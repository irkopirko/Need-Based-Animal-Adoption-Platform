import { TURKEY_PROVINCES } from "../data/turkeyProvinces";
import { fetchDistrictsForProvince } from "../data/turkeyGeoApi";

/** Same separator as RegisterPage / AccountProfile when saving `users.location`. */
export const LOCATION_SEP = " / ";

export function splitSavedLocation(raw) {
  if (!raw || typeof raw !== "string") {
    return { provinceName: "", districtName: "" };
  }
  const t = raw.trim();
  const i = t.indexOf(LOCATION_SEP);
  if (i === -1) {
    return { provinceName: "", districtName: t };
  }
  return {
    provinceName: t.slice(0, i).trim(),
    districtName: t.slice(i + LOCATION_SEP.length).trim()
  };
}

export function provinceIdFromName(provinceName) {
  if (!provinceName) {
    return "";
  }
  const p = TURKEY_PROVINCES.find((x) => x.name === provinceName);
  return p ? String(p.id) : "";
}

/**
 * @param {string|number} provinceId
 * @param {string|number} districtId
 * @param {{ id: number, name: string }[]} districts
 */
export function buildLocationFromIds(provinceId, districtId, districts) {
  const provinceName =
    TURKEY_PROVINCES.find((p) => String(p.id) === String(provinceId))?.name || "";
  const districtName =
    (districts || []).find((d) => String(d.id) === String(districtId))?.name || "";
  if (!provinceName || !districtName) {
    return null;
  }
  return `${provinceName}${LOCATION_SEP}${districtName}`;
}

/** Resolves district names from the API before building {@code users.location}. */
export async function buildLocationFromIdsAsync(provinceId, districtId) {
  if (!provinceId || !districtId) {
    return null;
  }
  try {
    const districts = await fetchDistrictsForProvince(Number(provinceId));
    return buildLocationFromIds(provinceId, districtId, districts);
  } catch {
    return null;
  }
}
