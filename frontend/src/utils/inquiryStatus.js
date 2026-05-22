export function normalizeInquiryStatus(status) {
  return String(status || "PENDING")
    .trim()
    .toUpperCase();
}

export function isInquiryRejected(status) {
  const s = normalizeInquiryStatus(status);
  return s === "REJECTED" || s === "DECLINED";
}

/** Adopter cannot send after owner declines the message request. */
export function isInquiryClosedForAdopter(status) {
  return isInquiryRejected(status);
}

export function countAdopterMessages(messages) {
  return (messages || []).filter(
    (m) => normalizeInquiryStatus(m?.senderRole) === "ADOPTER"
  ).length;
}

/**
 * Whether the adopter compose box should be shown (must match backend InquiryService rules).
 */
export function canAdopterComposeInThread(thread) {
  if (!thread) {
    return false;
  }
  const status = normalizeInquiryStatus(thread.status);
  if (isInquiryClosedForAdopter(status)) {
    return false;
  }
  if (status === "ACCEPTED") {
    return true;
  }
  if (status === "PENDING") {
    return countAdopterMessages(thread.messages) < 1;
  }
  return false;
}

export function adopterComposeBlockedReason(thread) {
  if (!thread) {
    return null;
  }
  const status = normalizeInquiryStatus(thread.status);
  if (isInquiryClosedForAdopter(status)) {
    return "This message request was declined by the owner. You cannot send more messages.";
  }
  if (status === "PENDING" && countAdopterMessages(thread.messages) >= 1) {
    return "Your message request is pending. The owner must accept before you can send more messages.";
  }
  return null;
}
