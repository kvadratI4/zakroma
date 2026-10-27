import { act, renderHook } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import { useSystemTheme } from "./useSystemTheme";

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

afterEach(() => {
  vi.unstubAllGlobals();
  delete document.documentElement.dataset.theme;
});

describe("useSystemTheme (NFR-UX-05)", () => {
  it("follows a dark system setting", () => {
    mockColourScheme(true);

    const { result } = renderHook(() => useSystemTheme());

    expect(result.current).toBe("dark");
  });

  it("leaves <html data-theme> to the theme choice (T-009)", () => {
    mockColourScheme(true);

    renderHook(() => useSystemTheme());

    expect(document.documentElement.dataset.theme).toBeUndefined();
  });

  it("switches when the system setting changes", () => {
    const system = mockColourScheme(false);
    const { result } = renderHook(() => useSystemTheme());
    expect(result.current).toBe("light");

    act(() => system.setDark(true));

    expect(result.current).toBe("dark");
  });
});
