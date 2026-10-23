import { useEffect, useSyncExternalStore } from "react";

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

/** The system light/dark setting (NFR-UX-05), mirrored to `<html data-theme>` for the CSS tokens. */
export function useSystemTheme(): ThemeName {
  const theme = useSyncExternalStore(subscribe, snapshot, () => "light" as const);
  useEffect(() => {
    document.documentElement.dataset.theme = theme;
  }, [theme]);
  return theme;
}
