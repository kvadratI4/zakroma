import { useCallback, useEffect, useSyncExternalStore } from "react";

import { THEME_STORAGE_KEY } from "./themeBoot";
import type { ThemeName } from "./tokens";
import { useSystemTheme } from "./useSystemTheme";

/** «Как на устройстве», «Светлое», «Тёмное» (T-009). */
export type ThemeChoice = "system" | ThemeName;

const isTheme = (value: unknown): value is ThemeName => value === "light" || value === "dark";

// Without device storage (a private window) the choice lives until the page is closed (AC-3).
let unsavedChoice: ThemeChoice = "system";
const listeners = new Set<() => void>();

/** The choice kept on this device, not in the account (AC-3); anything unknown means the system theme. */
export function readThemeChoice(): ThemeChoice {
  try {
    const stored = localStorage.getItem(THEME_STORAGE_KEY);
    return isTheme(stored) ? stored : "system";
  } catch {
    return unsavedChoice;
  }
}

export function saveThemeChoice(choice: ThemeChoice): void {
  unsavedChoice = choice;
  try {
    if (choice === "system") localStorage.removeItem(THEME_STORAGE_KEY);
    else localStorage.setItem(THEME_STORAGE_KEY, choice);
  } catch {
    // Storage is not available: the choice still applies to this visit.
  }
  listeners.forEach((listener) => listener());
}

function subscribe(onChange: () => void): () => void {
  listeners.add(onChange);
  // Another tab of the app changed the choice.
  const onStorage = (event: StorageEvent) => {
    if (event.key === THEME_STORAGE_KEY || event.key === null) onChange();
  };
  window.addEventListener("storage", onStorage);
  return () => {
    listeners.delete(onChange);
    window.removeEventListener("storage", onStorage);
  };
}

/**
 * The chosen and the applied theme (NFR-UX-05, T-009). The applied one is mirrored to
 * `<html data-theme>`: before the app starts, the boot script and the stylesheet do the same.
 */
export function useThemeChoice(): {
  choice: ThemeChoice;
  theme: ThemeName;
  setChoice: (choice: ThemeChoice) => void;
} {
  const choice = useSyncExternalStore(subscribe, readThemeChoice, () => "system" as const);
  const system = useSystemTheme();
  const theme = choice === "system" ? system : choice;
  useEffect(() => {
    document.documentElement.dataset.theme = theme;
  }, [theme]);
  const setChoice = useCallback((next: ThemeChoice) => saveThemeChoice(next), []);
  return { choice, theme, setChoice };
}
