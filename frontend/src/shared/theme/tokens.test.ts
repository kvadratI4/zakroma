import { describe, expect, it } from "vitest";

import { contrastRatio } from "./contrast";
import { LEVEL_COLOURS, LEVELS, THEMES, type ThemeName, type ThemeTokens } from "./tokens";

const TEXT_MIN = 4.5; // WCAG AA, normal text
const UI_MIN = 3; // WCAG AA, large text and control fills
// Outlines of buttons, chips and fields; their text names the control (docs/10-design.md §2, T-008b).
const CONTROL_BORDER_MIN = 2.5;

type Role = keyof ThemeTokens;
// Text roles and every surface they are drawn on in the app (docs/10-design.md §2).
const TEXT_PAIRS: [Role, Role][] = [
  ["text", "ground"],
  ["text", "surface"],
  ["text", "raised"],
  ["muted", "ground"],
  ["muted", "surface"],
  ["muted", "raised"],
  ["accent", "ground"],
  ["accent", "raised"],
  ["onAccent", "accent"],
  ["negative", "raised"],
  ["negative", "surface"],
  ["warning", "raised"],
  ["warning", "surface"],
];

const themes = Object.keys(THEMES) as ThemeName[];

describe.each(themes)("theme %s", (theme) => {
  const t = THEMES[theme];

  it.each(TEXT_PAIRS)("%s on %s reaches 4.5:1", (fg, bg) => {
    expect(contrastRatio(t[fg], t[bg])).toBeGreaterThanOrEqual(TEXT_MIN);
  });

  it("the add button stands out from the ground (3:1)", () => {
    expect(contrastRatio(t.accent, t.ground)).toBeGreaterThanOrEqual(UI_MIN);
  });

  it.each(["surface", "raised"] as const)("control outlines stand out on %s (2.5:1)", (bg) => {
    expect(contrastRatio(t.borderControl, t[bg])).toBeGreaterThanOrEqual(CONTROL_BORDER_MIN);
  });

  it("ornament strokes and leaves stand out from the ground in the dark theme (3:1)", () => {
    expect(contrastRatio(t.ornament, t.ground)).toBeGreaterThanOrEqual(UI_MIN);
    if (theme === "dark") {
      expect(contrastRatio(t.ornamentLeaf, t.ground)).toBeGreaterThanOrEqual(UI_MIN);
    }
  });

  it.each(LEVELS)("level %s chip text reaches 4.5:1 on its tint", (level) => {
    const { ink, bg } = LEVEL_COLOURS[theme][level];
    expect(contrastRatio(ink, bg)).toBeGreaterThanOrEqual(TEXT_MIN);
  });
});
