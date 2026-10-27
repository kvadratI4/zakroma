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
      /:root\[data-theme="dark"\]\s*\{[^}]*--zk-ground:\s*#1f2226;[^}]*color-scheme:\s*dark;/,
    );
  });

  it("follows a dark system setting before any script runs, unless light is chosen (T-009)", () => {
    expect(css).toMatch(
      /@media \(prefers-color-scheme: dark\)\s*\{\s*:root:not\(\[data-theme="light"\]\)\s*\{[^}]*--zk-ground:\s*#1f2226;[^}]*color-scheme:\s*dark;[^}]*\}\s*\}/,
    );
  });

  it("declares the control outline and leaf roles in both themes (T-008b)", () => {
    expect(css).toMatch(/:root\s*\{[^}]*--zk-border-control:\s*#8a96ae;/);
    expect(css).toMatch(/:root\[data-theme="dark"\][^}]*--zk-border-control:\s*#767d86;/);
    expect(css).toMatch(/:root\[data-theme="dark"\][^}]*--zk-ornament-leaf:\s*#5fae69;/);
  });

  it("includes level colours", () => {
    expect(css).toMatch(/--zk-level-excess-ink:\s*#6d2b6b;/);
    expect(css).toMatch(/:root\[data-theme="dark"\][^}]*--zk-level-excess-ink:\s*#ecb3e9;/);
  });
});
