const TURKIYE_API = "https://turkiyeapi.dev/api/v1";

/**
 * @param {number} provinceId
 * @returns {Promise<{ id: number, name: string }[]>}
 */
export async function fetchDistrictsForProvince(provinceId) {
  const response = await fetch(
    `${TURKIYE_API}/provinces/${provinceId}?fields=name,districts`
  );
  if (!response.ok) {
    throw new Error("districts_fetch_failed");
  }
  const json = await response.json();
  const list = json?.data?.districts || [];
  return list.map((d) => ({ id: d.id, name: d.name }));
}
