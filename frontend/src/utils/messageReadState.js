const KEY = "paviaMessageReadState";

function readAll() {
  if (typeof window === "undefined") {
    return {};
  }
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) {
      return {};
    }
    const parsed = JSON.parse(raw);
    return parsed && typeof parsed === "object" ? parsed : {};
  } catch {
    return {};
  }
}

function writeAll(data) {
  if (typeof window === "undefined") {
    return;
  }
  try {
    localStorage.setItem(KEY, JSON.stringify(data));
  } catch {
    // ignore
  }
}

function threadKey(role, userId, inquiryId) {
  return `${role}:${userId}:${inquiryId}`;
}

export function markThreadRead(role, userId, inquiryId, updatedAt) {
  const uid = Number(userId);
  const iid = Number(inquiryId);
  if (!role || !Number.isFinite(uid) || !Number.isFinite(iid)) {
    return;
  }
  const stamp = updatedAt ? String(updatedAt) : "";
  const all = readAll();
  all[threadKey(role, uid, iid)] = stamp || "__read__";
  writeAll(all);
}

function isThreadUnread(role, userId, inquiry) {
  const uid = Number(userId);
  const iid = Number(inquiry?.id);
  if (!role || !Number.isFinite(uid) || !Number.isFinite(iid)) {
    return false;
  }
  if (inquiry?.hasMessages !== true) {
    return false;
  }
  const key = threadKey(role, uid, iid);
  const seen = readAll()[key];
  const updatedAt = inquiry?.updatedAt ? String(inquiry.updatedAt) : "";
  if (!seen) {
    return true;
  }
  if (!updatedAt) {
    return false;
  }
  return seen !== updatedAt;
}

export function countUnreadThreads(role, userId, inquiries) {
  const list = Array.isArray(inquiries) ? inquiries : [];
  return list.filter((inq) => isThreadUnread(role, userId, inq)).length;
}

export function hasUnreadInThread(role, userId, inquiry) {
  return isThreadUnread(role, userId, inquiry);
}
