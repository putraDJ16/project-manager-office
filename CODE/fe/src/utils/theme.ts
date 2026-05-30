export type ThemeMode = "light" | "dark";

const THEME_STORAGE_KEY = "pmo-theme-mode";

export function getStoredTheme(): ThemeMode {
  if (typeof window === "undefined") return "light";
  
  const stored = localStorage.getItem(THEME_STORAGE_KEY);
  if (stored === "dark" || stored === "light") return stored;
  
  // Check system preference
  if (window.matchMedia && window.matchMedia("(prefers-color-scheme: dark)").matches) {
    return "dark";
  }
  
  return "light";
}

export function applyTheme(mode: ThemeMode): void {
  if (typeof window === "undefined") return;
  
  const root = document.documentElement;
  
  if (mode === "dark") {
    root.classList.add("dark");
    root.setAttribute("data-theme", "dark");
  } else {
    root.classList.remove("dark");
    root.setAttribute("data-theme", "light");
  }
  
  localStorage.setItem(THEME_STORAGE_KEY, mode);
}