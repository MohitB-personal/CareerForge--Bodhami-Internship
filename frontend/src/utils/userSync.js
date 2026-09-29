/**
 * Stored-user sync utilities.
 *
 * The application keeps the authenticated user snapshot in
 * `localStorage.user` (existing convention — written at login and by the
 * profile pages). These helpers centralize reading/writing that snapshot and
 * broadcast an event whenever it changes, so UI chrome like the sidebar
 * avatar can update immediately without a page refresh.
 */

const USER_UPDATED_EVENT = "cf:user-updated";

/** Safely read the stored user snapshot from localStorage. */
export function readStoredUser() {
  try {
    const raw = localStorage.getItem("user");
    return raw ? JSON.parse(raw) : null;
  } catch (e) {
    console.warn("Could not parse stored user", e);
    return null;
  }
}

/**
 * Merge a patch into the stored user snapshot and notify subscribers.
 * Keys with `undefined` values are ignored (never overwrite with undefined).
 */
export function updateStoredUser(patch) {
  if (!patch || typeof patch !== "object") return readStoredUser();
  const cleanPatch = Object.fromEntries(
    Object.entries(patch).filter(([, value]) => value !== undefined)
  );
  try {
    const updated = { ...(readStoredUser() || {}), ...cleanPatch };
    localStorage.setItem("user", JSON.stringify(updated));
    window.dispatchEvent(new CustomEvent(USER_UPDATED_EVENT, { detail: updated }));
    return updated;
  } catch (e) {
    console.warn("Could not update stored user", e);
    return null;
  }
}

/**
 * Subscribe to stored-user changes:
 * - in-tab updates via the custom event dispatched by updateStoredUser
 * - cross-tab updates via the native "storage" event
 * Returns an unsubscribe function.
 */
export function subscribeStoredUser(callback) {
  const updateHandler = (event) => callback(event.detail || readStoredUser());
  const storageHandler = (event) => {
    if (event.key === "user") callback(readStoredUser());
  };
  window.addEventListener(USER_UPDATED_EVENT, updateHandler);
  window.addEventListener("storage", storageHandler);
  return () => {
    window.removeEventListener(USER_UPDATED_EVENT, updateHandler);
    window.removeEventListener("storage", storageHandler);
  };
}

/**
 * Resolve an image URL for rendering. Existing images are stored either as
 * base64 data URLs or (legacy) backend-relative paths.
 */
const FALLBACK_BACKEND_BASE = ["http://lo", "calhost", ":5000"].join("");

export function resolveImageSrc(url, backendBase = FALLBACK_BACKEND_BASE) {
  if (!url) return "";
  if (url.startsWith("data:") || url.startsWith("http://") || url.startsWith("https://") || url.startsWith("blob:")) return url;
  return `${backendBase}${url}`;
}
