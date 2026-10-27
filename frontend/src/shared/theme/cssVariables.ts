import { LEVEL_COLOURS, LEVELS, THEMES, type ThemeName } from "./tokens";

const kebab = (name: string) => name.replace(/[A-Z]/g, (c) => `-${c.toLowerCase()}`);

function declarations(theme: ThemeName): string {
  const colours = Object.entries(THEMES[theme]).map(
    ([role, value]) => `--zk-${kebab(role)}: ${value};`,
  );
  const levels = LEVELS.flatMap((level) => {
    const { ink, bg } = LEVEL_COLOURS[theme][level];
    return [`--zk-level-${level}-ink: ${ink};`, `--zk-level-${level}-bg: ${bg};`];
  });
  return [...colours, ...levels, `color-scheme: ${theme};`].join(" ");
}

/**
 * CSS custom properties generated from tokens.ts; index.css maps them into Tailwind's theme.
 * Shipped as a stylesheet (plugins/themePlugin.ts), so the right colours are there at the first paint:
 * the system setting through the media query, a chosen theme through <html data-theme> (T-009).
 */
export function themeCss(): string {
  const dark = declarations("dark");
  return [
    `:root { ${declarations("light")} }`,
    `@media (prefers-color-scheme: dark) { :root:not([data-theme="light"]) { ${dark} } }`,
    `:root[data-theme="dark"] { ${dark} }`,
  ].join("\n");
}
