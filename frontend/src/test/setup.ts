import "@testing-library/jest-dom/vitest";
import "../i18n";

import { cleanup } from "@testing-library/react";
import { afterAll, afterEach, beforeAll, beforeEach } from "vitest";

import { server } from "./server";

// jsdom has no matchMedia. A plain function (not vi.fn) so `restoreMocks` does not reset it;
// tests that need a dark system theme stub their own with vi.stubGlobal.
function lightSystemTheme(media: string) {
  return {
    matches: false,
    media,
    addEventListener: () => undefined,
    removeEventListener: () => undefined,
  };
}

beforeEach(() => {
  Object.defineProperty(window, "matchMedia", {
    value: lightSystemTheme,
    configurable: true,
    writable: true,
  });
});

// Any request without a handler fails the test: no real network in tests.
beforeAll(() => server.listen({ onUnhandledFrame: "error" }));
afterEach(() => {
  cleanup();
  server.resetHandlers();
});
afterAll(() => server.close());
