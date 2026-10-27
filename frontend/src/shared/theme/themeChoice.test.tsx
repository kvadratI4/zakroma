import { act, renderHook } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import { THEME_STORAGE_KEY } from "./themeBoot";
import { readThemeChoice, saveThemeChoice, useThemeChoice } from "./themeChoice";

type Listener = (event: { matches: boolean }) => void;

function mockColourScheme(initialDark: boolean) {
  const listeners = new Set<Listener>();
  const query = {
    matches: initialDark,
    media: "(prefers-color-scheme: dark)",
    addEventListener: (_type: string, listener: Listener) => listeners.add(listener),
    removeEventListener: (_type: string, listener: Listener) => listeners.delete(listener),
  };
  vi.stubGlobal(
    "matchMedia",
    vi.fn(() => query),
  );
  return {
    setDark(dark: boolean) {
      query.matches = dark;
      listeners.forEach((listener) => listener({ matches: dark }));
    },
  };
}

function storageDenied() {
  const denied = () => {
    throw new DOMException("denied", "SecurityError");
  };
  vi.spyOn(Storage.prototype, "getItem").mockImplementation(denied);
  vi.spyOn(Storage.prototype, "setItem").mockImplementation(denied);
  vi.spyOn(Storage.prototype, "removeItem").mockImplementation(denied);
}

afterEach(() => {
  vi.unstubAllGlobals();
  localStorage.clear();
  delete document.documentElement.dataset.theme;
});

describe("theme choice on the device (T-009, AC-1, AC-3)", () => {
  it("is «as on the device» until something is chosen", () => {
    expect(readThemeChoice()).toBe("system");
  });

  it.each(["light", "dark"] as const)("keeps a chosen %s theme", (choice) => {
    saveThemeChoice(choice);

    expect(localStorage.getItem(THEME_STORAGE_KEY)).toBe(choice);
    expect(readThemeChoice()).toBe(choice);
  });

  it("forgets the choice when «as on the device» is chosen again", () => {
    saveThemeChoice("dark");
    saveThemeChoice("system");

    expect(localStorage.getItem(THEME_STORAGE_KEY)).toBeNull();
    expect(readThemeChoice()).toBe("system");
  });

  it("ignores a value it does not know", () => {
    localStorage.setItem(THEME_STORAGE_KEY, "purple");

    expect(readThemeChoice()).toBe("system");
  });

  it("falls back to «as on the device» without errors when the storage is not available", () => {
    storageDenied();

    expect(readThemeChoice()).toBe("system");
    expect(() => saveThemeChoice("dark")).not.toThrow();
  });
});

describe("useThemeChoice (T-009, AC-1, AC-3)", () => {
  it("follows the system setting, also when it changes while the app is open", () => {
    const system = mockColourScheme(false);
    const { result } = renderHook(() => useThemeChoice());
    expect(result.current).toMatchObject({ choice: "system", theme: "light" });
    expect(document.documentElement.dataset.theme).toBe("light");

    act(() => system.setDark(true));

    expect(result.current.theme).toBe("dark");
    expect(document.documentElement.dataset.theme).toBe("dark");
  });

  it("applies and keeps a chosen theme whatever the system says", () => {
    const system = mockColourScheme(false);
    const { result } = renderHook(() => useThemeChoice());

    act(() => result.current.setChoice("dark"));

    expect(result.current).toMatchObject({ choice: "dark", theme: "dark" });
    expect(document.documentElement.dataset.theme).toBe("dark");
    expect(localStorage.getItem(THEME_STORAGE_KEY)).toBe("dark");

    act(() => system.setDark(false));
    expect(document.documentElement.dataset.theme).toBe("dark");
  });

  it("returns to the system theme when «as on the device» is chosen", () => {
    mockColourScheme(true);
    localStorage.setItem(THEME_STORAGE_KEY, "light");
    const { result } = renderHook(() => useThemeChoice());
    expect(document.documentElement.dataset.theme).toBe("light");

    act(() => result.current.setChoice("system"));

    expect(result.current).toMatchObject({ choice: "system", theme: "dark" });
    expect(document.documentElement.dataset.theme).toBe("dark");
  });

  it("picks up a choice made in another tab", () => {
    mockColourScheme(false);
    const { result } = renderHook(() => useThemeChoice());

    act(() => {
      localStorage.setItem(THEME_STORAGE_KEY, "dark");
      window.dispatchEvent(new StorageEvent("storage", { key: THEME_STORAGE_KEY }));
    });

    expect(result.current.choice).toBe("dark");
    expect(document.documentElement.dataset.theme).toBe("dark");
  });

  it("still switches for this visit when the choice cannot be stored", () => {
    mockColourScheme(false);
    storageDenied();
    const { result } = renderHook(() => useThemeChoice());

    act(() => result.current.setChoice("dark"));

    expect(result.current.theme).toBe("dark");
    expect(document.documentElement.dataset.theme).toBe("dark");
  });
});
