const LOCALE = "tr-TR";

/** First letter upper (rest unchanged). */
export function capitalizeFirstChar(value) {
  if (value == null || !String(value).trim()) {
    return "";
  }
  const t = String(value).trim();
  return t.charAt(0).toLocaleUpperCase(LOCALE) + t.slice(1);
}

/** Each word: first letter upper, rest lower (names, breeds). */
export function capitalizeWords(value) {
  if (value == null || !String(value).trim()) {
    return "";
  }
  return String(value)
    .trim()
    .split(/\s+/)
    .map((word) => {
      if (!word) {
        return word;
      }
      const lower = word.toLocaleLowerCase(LOCALE);
      return lower.charAt(0).toLocaleUpperCase(LOCALE) + lower.slice(1);
    })
    .join(" ");
}

/** First letter of each sentence upper (after . ! ?). */
export function capitalizeDescription(value) {
  if (value == null || !String(value).trim()) {
    return "";
  }
  const t = String(value).trim();
  return t.replace(/(^\s*|[.!?]\s+)(\S)/g, (_, sep, ch) => sep + ch.toLocaleUpperCase(LOCALE));
}

export function formatAnimalGenderLabel(gender) {
  const raw = String(gender ?? "").trim();
  if (!raw) {
    return "";
  }
  const upper = raw.toUpperCase();
  if (upper === "MALE" || upper === "M" || upper.startsWith("MALE")) {
    return "Male";
  }
  if (upper === "FEMALE" || upper === "F" || upper.startsWith("FEMALE")) {
    return "Female";
  }
  const lower = raw.toLocaleLowerCase(LOCALE);
  if (lower === "male") {
    return "Male";
  }
  if (lower === "female") {
    return "Female";
  }
  return "";
}
