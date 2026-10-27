import { afterEach, describe, expect, it, vi } from "vitest";

import { THEME_BOOT_SCRIPT, THEME_STORAGE_KEY } from "./themeBoot";

// The script runs in <head> before the app (T-009, AC-4): here it runs the same way, as plain text.
// eslint-disable-next-line @typescript-eslint/no-implied-eval -- the script is shipped as text
const bootScript = new Function(THEME_BOOT_SCRIPT) as () => void;
const runBootScript = () => bootScript();

afterEach(() => {
  localStorage.clear();
  delete document.documentElement.dataset.theme;
});

describe("theme boot script (T-009, AC-4)", () => {
  it.each(["light", "dark"])("applies a chosen %s theme before the app starts", (choice) => {
    localStorage.setItem(THEME_STORAGE_KEY, choice);

    runBootScript();

    expect(document.documentElement.dataset.theme).toBe(choice);
  });

  it.each([null, "system", "purple"])("leaves the system theme to CSS for %s", (stored) => {
    if (stored !== null) localStorage.setItem(THEME_STORAGE_KEY, stored);

    runBootScript();

    expect(document.documentElement.dataset.theme).toBeUndefined();
  });

  it("keeps quiet when the device storage is not available", () => {
    vi.spyOn(Storage.prototype, "getItem").mockImplementation(() => {
      throw new DOMException("denied", "SecurityError");
    });

    expect(runBootScript).not.toThrow();
    expect(document.documentElement.dataset.theme).toBeUndefined();
  });

  it("is tiny and has no imports: it is shipped as a classic script", () => {
    expect(THEME_BOOT_SCRIPT).toContain(THEME_STORAGE_KEY);
    expect(THEME_BOOT_SCRIPT.length).toBeLessThan(300);
    expect(THEME_BOOT_SCRIPT).not.toMatch(/\bimport\b|\bexport\b/);
  });
});
