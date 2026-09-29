/**
 * CareerForge theme (dark / light mode) utility.
 *
 * - Persists the choice in localStorage ("cf-theme").
 * - Applies the theme by setting `data-theme` on <html>.
 * - Dark mode is driven entirely by CSS variable overrides in App.css
 *   ([data-theme="dark"] { ... }).
 */

export const THEMES = {
  LIGHT: "light",
  DARK: "dark",
};

const STORAGE_KEY = "cf-theme";

export function getStoredTheme() {
  try {
    const t = localStorage.getItem(STORAGE_KEY);
    if (t === THEMES.DARK || t === THEMES.LIGHT) return t;
  } catch (e) {
    /* localStorage unavailable */
  }
  return null;
}

/** Apply a theme to the document. Returns the applied theme. */
export function applyTheme(theme) {
  const next = theme === THEMES.DARK ? THEMES.DARK : THEMES.LIGHT;
  document.documentElement.setAttribute("data-theme", next);
  try {
    localStorage.setItem(STORAGE_KEY, next);
  } catch (e) {
    /* ignore */
  }
  return next;
}

/** Initialise the theme before first paint (call once at app startup). */
export function initTheme() {
  return applyTheme(getStoredTheme() || THEMES.LIGHT);
}

/** Toggle between light and dark. Returns the new theme. */
export function toggleTheme() {
  const current =
    document.documentElement.getAttribute("data-theme") === THEMES.DARK
      ? THEMES.DARK
      : THEMES.LIGHT;
  return applyTheme(current === THEMES.DARK ? THEMES.LIGHT : THEMES.DARK);
}
