import { useEffect, useState } from "react";
import { MoonIcon, SunIcon } from "./Icons.jsx";

const STORAGE_KEY = "habitflow-theme";
const THEME_COLORS = { dark: "#141E25", light: "#F7F0E7" };

function readStoredTheme() {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    return stored === "light" || stored === "dark" ? stored : null;
  } catch {
    return null;
  }
}

function applyTheme(theme) {
  document.documentElement.dataset.theme = theme;
  document.querySelector('meta[name="theme-color"]')?.setAttribute("content", THEME_COLORS[theme]);
}

// index.html sets data-theme before first paint; this button reads it and
// switches between the two themes, remembering the choice.
export default function ThemeToggle({ className = "" }) {
  const [theme, setTheme] = useState(() =>
    document.documentElement.dataset.theme === "light" ? "light" : "dark",
  );

  useEffect(() => {
    applyTheme(theme);
  }, [theme]);

  // Until the user picks a theme, follow the system setting as it changes.
  useEffect(() => {
    if (readStoredTheme() || !window.matchMedia) {
      return undefined;
    }
    const query = window.matchMedia("(prefers-color-scheme: light)");
    const onChange = (event) => {
      if (!readStoredTheme()) {
        setTheme(event.matches ? "light" : "dark");
      }
    };
    query.addEventListener("change", onChange);
    return () => query.removeEventListener("change", onChange);
  }, []);

  function toggle() {
    const next = theme === "dark" ? "light" : "dark";
    try {
      localStorage.setItem(STORAGE_KEY, next);
    } catch {
      // Storage can be unavailable (private mode); the toggle still works for this visit.
    }
    setTheme(next);
  }

  const isDark = theme === "dark";

  return (
    <button
      type="button"
      className={`icon-button theme-toggle ${className}`.trim()}
      onClick={toggle}
      aria-label="Dark theme"
      aria-pressed={isDark}
      title={isDark ? "Switch to light theme" : "Switch to dark theme"}
    >
      {isDark ? <MoonIcon size={18} /> : <SunIcon size={18} />}
    </button>
  );
}
