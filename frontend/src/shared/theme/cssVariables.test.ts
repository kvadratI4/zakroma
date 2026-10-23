import { describe, expect, it } from "vitest";

import { themeCss } from "./cssVariables";

describe("themeCss", () => {
  const css = themeCss();

  it("declares light tokens on :root, so the page is styled before the theme is known", () => {
    expect(css).toMatch(/:root\s*\{[^}]*--zk-ground:\s*#ffffff;/);
    expect(css).toMatch(/:root\s*\{[^}]*--zk-on-accent:\s*#ffffff;/);
  });

  it("redefines tokens for the dark theme", () => {
    expect(css).toMatch(
      /:root\[data-theme="dark"\]\s*\{[^}]*--zk-ground:\s*#110d0a;[^}]*color-scheme:\s*dark;/,
    );
  });

  it("includes level colours", () => {
    expect(css).toMatch(/--zk-level-excess-ink:\s*#6d2b6b;/);
    expect(css).toMatch(/:root\[data-theme="dark"\][^}]*--zk-level-excess-ink:\s*#dfa9dd;/);
  });
});
