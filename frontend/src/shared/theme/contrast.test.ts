import { describe, expect, it } from "vitest";

import { contrastRatio } from "./contrast";

describe("contrastRatio (WCAG 2.x)", () => {
  it.each([
    ["#000000", "#ffffff", 21],
    ["#ffffff", "#ffffff", 1],
    ["#777777", "#ffffff", 4.48],
    ["#1d4ea6", "#ffffff", 7.83],
  ])("%s on %s is %d:1", (fg, bg, expected) => {
    expect(contrastRatio(fg, bg)).toBeCloseTo(expected, 1);
  });

  it("is symmetric", () => {
    expect(contrastRatio("#111a30", "#f0f3f9")).toBeCloseTo(contrastRatio("#f0f3f9", "#111a30"), 6);
  });

  it("rejects colours that are not #rrggbb", () => {
    expect(() => contrastRatio("blue", "#ffffff")).toThrow(/#rrggbb/);
  });
});
