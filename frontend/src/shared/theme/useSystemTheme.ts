import { useSyncExternalStore } from "react";

import type { ThemeName } from "./tokens";

const DARK_QUERY = "(prefers-color-scheme: dark)";

function subscribe(onChange: () => void): () => void {
  const query = window.matchMedia(DARK_QUERY);
  query.addEventListener("change", onChange);
  return () => query.removeEventListener("change", onChange);
}

function snapshot(): ThemeName {
  return window.matchMedia(DARK_QUERY).matches ? "dark" : "light";
}

/** The system light/dark setting (NFR-UX-05); useThemeChoice applies it when nothing is chosen. */
export function useSystemTheme(): ThemeName {
  return useSyncExternalStore(subscribe, snapshot, () => "light" as const);
}
