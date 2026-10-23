/**
 * Design tokens of the «Фарфор» style — the single source of colours (docs/10-design.md).
 * Light theme follows Gzhel (porcelain and cobalt), dark theme Khokhloma (lacquer, gold, vermilion).
 */
export type ThemeName = "light" | "dark";

export interface ThemeTokens {
  ground: string;
  surface: string;
  raised: string;
  border: string;
  text: string;
  muted: string;
  accent: string;
  onAccent: string;
  ornament: string;
  ornamentFill: string;
  negative: string;
  warning: string;
}

export const THEMES: Record<ThemeName, ThemeTokens> = {
  light: {
    ground: "#ffffff",
    surface: "#f0f3f9",
    raised: "#ffffff",
    border: "#dde3ee",
    text: "#111a30",
    muted: "#4b556e",
    accent: "#1d4ea6",
    onAccent: "#ffffff",
    ornament: "#1d4ea6",
    ornamentFill: "#c3d2ee",
    negative: "#b3261e",
    warning: "#8f4a07",
  },
  dark: {
    ground: "#110d0a",
    surface: "#1b1510",
    raised: "#241b15",
    border: "#34291f",
    text: "#f4ecdf",
    muted: "#b9aa95",
    accent: "#d9a441",
    onAccent: "#1a120b",
    ornament: "#d9a441",
    ornamentFill: "#c8432b",
    negative: "#ff8a78",
    warning: "#f2b46a",
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
    out: { ink: "#b8afa3", bg: "#2a241e" },
    critical: { ink: "#ff9283", bg: "#3b1a15" },
    low: { ink: "#f2b46a", bg: "#3a2812" },
    normal: { ink: "#86d4a6", bg: "#16301f" },
    plenty: { ink: "#9ab9f3", bg: "#182644" },
    excess: { ink: "#dfa9dd", bg: "#351b37" },
  },
};
