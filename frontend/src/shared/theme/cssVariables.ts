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

/** CSS custom properties generated from tokens.ts; index.css maps them into Tailwind's theme. */
export function themeCss(): string {
  return `:root { ${declarations("light")} }\n:root[data-theme="dark"] { ${declarations("dark")} }`;
}
