import React, { useEffect, useState } from "react";
import { Moon, Sun } from "lucide-react";
import { THEMES, toggleTheme, getStoredTheme } from "../../utils/theme";

/**
 * Floating dark/light mode toggle button.
 * Used inside the dashboard banner (dash-hero / search-hero-band).
 */
export default function ThemeToggle() {
  const [theme, setTheme] = useState(getStoredTheme() || THEMES.LIGHT);

  useEffect(() => {
    const observer = new MutationObserver(() => {
      setTheme(document.documentElement.getAttribute("data-theme") || THEMES.LIGHT);
    });
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ["data-theme"],
    });
    return () => observer.disconnect();
  }, []);

  const isDark = theme === THEMES.DARK;

  return (
    <button
      type="button"
      className={`dashboard-icon-btn theme-toggle-btn${isDark ? " is-dark" : ""}`}
      onClick={() => setTheme(toggleTheme())}
      aria-label={isDark ? "Switch to light mode" : "Switch to dark mode"}
      title={isDark ? "Switch to light mode" : "Switch to dark mode"}
    >
      {isDark ? <Sun size={20} /> : <Moon size={20} />}
    </button>
  );
}
