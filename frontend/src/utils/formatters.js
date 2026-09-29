export function labelFromKey(key) {
  return key
    .replace(/([A-Z])/g, " $1")
    .replace(/^./, (letter) => letter.toUpperCase())
    .trim();
}

/**
 * Format a byte count as a human readable size string (e.g. 245.3 KB).
 * Returns an empty string for null/undefined/invalid input.
 */
export function formatFileSize(bytes) {
  if (bytes === null || bytes === undefined || Number.isNaN(Number(bytes))) return "";
  const size = Number(bytes);
  if (size <= 0) return "0 B";
  const units = ["B", "KB", "MB", "GB"];
  const exponent = Math.min(Math.floor(Math.log(size) / Math.log(1024)), units.length - 1);
  const value = size / Math.pow(1024, exponent);
  return `${exponent === 0 ? Math.round(value) : value.toFixed(1)} ${units[exponent]}`;
}

export function formatExternalUrl(url) {
  if (!url || typeof url !== "string") return "";
  const trimmed = url.trim();
  if (!trimmed) return "";
  if (/^(?:https?:\/\/|\/\/)/i.test(trimmed)) {
    return trimmed;
  }
  return `https://${trimmed}`;
}
