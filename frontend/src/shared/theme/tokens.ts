/**
 * Design tokens of the «Фарфор» style — the single source of colours (docs/10-design.md).
 * Light theme follows Gzhel (porcelain and cobalt), dark theme Khokhloma «Графит» (graphite, gold, cinnabar, green).
 */
export type ThemeName = "light" | "dark";

export interface ThemeTokens {
  ground: string;
  surface: string;
  raised: string;
  border: string;
  /** Outline of buttons, chips and fields: one step stronger than panel borders (T-008a). */
  borderControl: string;
  text: string;
  muted: string;
  accent: string;
  onAccent: string;
  ornament: string;
  ornamentFill: string;
  /** Leaves of the ornament: Khokhloma green in the dark theme, the pale fill in Gzhel (T-008a). */
  ornamentLeaf: string;
  negative: string;
  warning: string;
}

export const THEMES: Record<ThemeName, ThemeTokens> = {
  light: {
    ground: "#ffffff",
    surface: "#f0f3f9",
    raised: "#ffffff",
    border: "#dde3ee",
    borderControl: "#8a96ae",
    text: "#111a30",
    muted: "#4b556e",
    accent: "#1d4ea6",
    onAccent: "#ffffff",
    ornament: "#1d4ea6",
    ornamentFill: "#c3d2ee",
    ornamentLeaf: "#c3d2ee",
    negative: "#b3261e",
    warning: "#8f4a07",
  },
  dark: {
    // «Графит» (operator, 2026-10-26, T-008a round 3): graphite, not black; Khokhloma gold,
    // cinnabar and green in the ornament.
    ground: "#1f2226",
    surface: "#2a2e33",
    raised: "#363b41",
    border: "#4a5058",
    borderControl: "#767d86",
    text: "#f5f6f8",
    muted: "#c0c6ce",
    accent: "#f2b234",
    onAccent: "#1b1405",
    ornament: "#f2b234",
    ornamentFill: "#e4432d",
    ornamentLeaf: "#5fae69",
    negative: "#ff8f7d",
    warning: "#f6b452",
  },
};

/** Stock levels 0..5 (docs/05-domain-rules.md): out, critical, low, normal, plenty, excess. */
export const LEVELS = ["out", "critical", "low", "normal", "plenty", "excess"] as const;
export type Level = (typeof LEVELS)[number];

export interface LevelColour {
  ink: string;
  bg: string;
}

export const LEVEL_COLOURS: Record<ThemeName, Record<Level, LevelColour>> = {
  light: {
    out: { ink: "#5c5c5c", bg: "#ececec" },
    critical: { ink: "#a3241a", bg: "#fde9e6" },
    low: { ink: "#8f4a07", bg: "#fdefdc" },
    normal: { ink: "#23704a", bg: "#e2f3e9" },
    plenty: { ink: "#1d4ea6", bg: "#e6edfb" },
    excess: { ink: "#6d2b6b", bg: "#f4e7f3" },
  },
  dark: {
    // 26 % of the level hue over `raised` (docs/10-design.md §2).
    out: { ink: "#ddd8d1", bg: "#4c4e51" },
    critical: { ink: "#ffaa9a", bg: "#633d3c" },
    low: { ink: "#ffcd80", bg: "#625438" },
    normal: { ink: "#93dc9e", bg: "#385445" },
    plenty: { ink: "#a3c4ff", bg: "#384966" },
    excess: { ink: "#ecb3e9", bg: "#523f59" },
  },
};
