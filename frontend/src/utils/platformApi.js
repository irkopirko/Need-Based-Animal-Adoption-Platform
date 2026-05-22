import { getApiBaseUrl } from "./auth";

function apiUrl(path) {
  const base = (getApiBaseUrl() || "").replace(/\/$/, "");
  const p = path.startsWith("/") ? path : `/${path}`;
  return base ? `${base}${p}` : p;
}

async function parseJson(res) {
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    const msg = data?.error || data?.message || `Request failed (${res.status})`;
    throw new Error(msg);
  }
  return data;
}

export async function submitListingReport({
  reporterUserId,
  animalId,
  title,
  description
}) {
  const res = await fetch(apiUrl("/api/reports"), {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ reporterUserId, animalId, title, description })
  });
  return parseJson(res);
}

export async function fetchPendingReports(adminEmail) {
  const res = await fetch(
    apiUrl(`/api/admin/moderation/reports?adminEmail=${encodeURIComponent(adminEmail)}`)
  );
  return parseJson(res);
}

export async function adminArchiveListing(animalId, adminEmail, reason) {
  const res = await fetch(apiUrl(`/api/admin/moderation/listings/${animalId}/archive`), {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ adminEmail, reason })
  });
  return parseJson(res);
}

export async function adminDeleteListing(animalId, adminEmail, reason) {
  const res = await fetch(apiUrl(`/api/admin/moderation/listings/${animalId}/delete`), {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ adminEmail, reason })
  });
  return parseJson(res);
}

export async function resolveReport(reportId, adminEmail) {
  const res = await fetch(
    apiUrl(
      `/api/admin/moderation/reports/${reportId}/resolve?adminEmail=${encodeURIComponent(adminEmail)}`
    ),
    { method: "POST" }
  );
  return parseJson(res);
}

export async function saveAnimalForUser(userId, animalId, adoptionRequestId = null) {
  const params = new URLSearchParams();
  params.set("userId", String(userId));
  params.set("animalId", String(animalId));
  if (adoptionRequestId != null && Number(adoptionRequestId) > 0) {
    params.set("adoptionRequestId", String(adoptionRequestId));
  }
  const res = await fetch(apiUrl(`/api/saved?${params.toString()}`), { method: "POST" });
  if (res.ok) {
    return res.text();
  }
  const body = await res.text();
  if (res.status === 400 && body.includes("Already saved")) {
    return body;
  }
  throw new Error(body || `Save failed (${res.status})`);
}

export async function unsaveAnimalForUser(userId, animalId) {
  const res = await fetch(
    apiUrl(`/api/saved?userId=${userId}&animalId=${animalId}`),
    { method: "DELETE" }
  );
  if (res.ok) {
    return res.text();
  }
  const body = await res.text();
  if (res.status === 400 && body.includes("Not saved")) {
    return body;
  }
  throw new Error(body || `Remove failed (${res.status})`);
}

export async function fetchSavedAnimalIds(userId) {
  if (!userId) {
    return [];
  }
  const res = await fetch(apiUrl(`/api/saved/${userId}`));
  if (!res.ok) {
    return [];
  }
  const data = await res.json().catch(() => []);
  if (!Array.isArray(data)) {
    return [];
  }
  return data
    .map((row) => Number(row.animalId ?? row.animal?.id ?? row.id))
    .filter((id) => Number.isFinite(id) && id > 0);
}

export async function createListingInquiry({ adopterUserId, animalId, message }) {
  const res = await fetch(apiUrl("/api/inquiries"), {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ adopterUserId, animalId, message })
  });
  return parseJson(res);
}

export async function fetchOwnerInquiries(ownerId) {
  const res = await fetch(apiUrl(`/api/inquiries/owner/${ownerId}`));
  return parseJson(res);
}

export async function fetchAdopterInquiries(adopterId) {
  const res = await fetch(apiUrl(`/api/inquiries/adopter/${adopterId}`));
  return parseJson(res);
}

export async function fetchAdopterProfile(adopterUserId) {
  const res = await fetch(apiUrl(`/api/auth/profile/${adopterUserId}`));
  return parseJson(res);
}

export async function fetchInquiryThread(inquiryId, viewerId) {
  const res = await fetch(
    apiUrl(`/api/inquiries/${inquiryId}?viewerId=${viewerId}`)
  );
  return parseJson(res);
}

export async function acceptInquiry(inquiryId, ownerId) {
  const res = await fetch(
    apiUrl(`/api/inquiries/${inquiryId}/accept?ownerId=${ownerId}`),
    { method: "POST" }
  );
  return parseJson(res);
}

export async function rejectInquiry(inquiryId, ownerId) {
  const res = await fetch(
    apiUrl(`/api/inquiries/${inquiryId}/reject?ownerId=${ownerId}`),
    { method: "POST" }
  );
  return parseJson(res);
}

export async function sendInquiryMessage(inquiryId, { userId, senderRole, body }) {
  const res = await fetch(apiUrl(`/api/inquiries/${inquiryId}/messages`), {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ userId, senderRole, body })
  });
  return parseJson(res);
}

export async function fetchAdopterRequestForInquiry(inquiryId, ownerId) {
  const res = await fetch(
    apiUrl(`/api/inquiries/${inquiryId}/adopter-request?ownerId=${ownerId}`)
  );
  return parseJson(res);
}

export async function fetchAdoptionCaseByInquiry(inquiryId, viewerId) {
  const res = await fetch(
    apiUrl(`/api/adoptions/inquiry/${inquiryId}?viewerId=${viewerId}`)
  );
  return parseJson(res);
}

export async function fetchOwnerAdoptionCases(ownerId) {
  const res = await fetch(apiUrl(`/api/adoptions/owner/${ownerId}`));
  return parseJson(res);
}

export async function fetchAdopterAdoptionCases(adopterId) {
  const res = await fetch(apiUrl(`/api/adoptions/adopter/${adopterId}`));
  return parseJson(res);
}

export async function fetchListingMatchSnapshots(animalId, ownerId) {
  const res = await fetch(
    apiUrl(`/api/adoptions/animals/${animalId}/matches?ownerId=${ownerId}`)
  );
  return parseJson(res);
}

export async function reserveAdoptionCase(caseId, ownerId) {
  const res = await fetch(
    apiUrl(`/api/adoptions/${caseId}/reserve?ownerId=${ownerId}`),
    { method: "POST" }
  );
  return parseJson(res);
}

export async function completeAdoptionCase(caseId, ownerId) {
  const res = await fetch(
    apiUrl(`/api/adoptions/${caseId}/complete?ownerId=${ownerId}`),
    { method: "POST" }
  );
  return parseJson(res);
}

export async function archiveOwnerListing(animalId, viewerId) {
  const res = await fetch(
    apiUrl(`/api/animals/${animalId}/archive?viewerId=${viewerId}`),
    { method: "POST" }
  );
  return parseJson(res);
}

export async function unarchiveOwnerListing(animalId, viewerId) {
  const res = await fetch(
    apiUrl(`/api/animals/${animalId}/unarchive?viewerId=${viewerId}`),
    { method: "POST" }
  );
  return parseJson(res);
}

export async function deleteOwnerListing(animalId, viewerId) {
  const res = await fetch(
    apiUrl(`/api/animals/${animalId}?viewerId=${viewerId}`),
    { method: "DELETE" }
  );
  if (!res.ok) {
    const text = await res.text();
    let msg = "The listing could not be deleted.";
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
}

export function formatListingCode(animal) {
  if (animal?.listingCode) {
    return animal.listingCode;
  }
  if (animal?.id != null) {
    return `^PAV${String(animal.id).padStart(6, "0")}`;
  }
  return "";
}
