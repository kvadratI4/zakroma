import { createHash } from "node:crypto";

import type { HtmlTagDescriptor, Plugin } from "vite";

import { themeCss } from "../src/shared/theme/cssVariables";
import { THEME_BOOT_SCRIPT } from "../src/shared/theme/themeBoot";

/** Imported once by src/main.tsx: the theme tokens as a stylesheet in <head>. */
export const THEME_CSS_ID = "virtual:theme.css";
const RESOLVED_CSS_ID = `\0${THEME_CSS_ID}`;

// A hashed name under /assets: cached for a year by Caddy, renamed when the script changes.
const BOOT_FILE = `assets/theme-boot-${createHash("sha256").update(THEME_BOOT_SCRIPT).digest("hex").slice(0, 8)}.js`;

/**
 * Theme before JS (T-009, AC-4) under the strict CSP (ADR-0012): the tokens become a stylesheet and
 * the boot script a classic same-origin file first in <head> — no inline script or style in the build.
 * Vite neither bundles nor copies a classic <script src>, so the plugin emits the file itself.
 */
export function themePlugin(): Plugin {
  let command: "build" | "serve" = "serve";
  let base = "/";
  return {
    name: "zakroma-theme",
    configResolved(config) {
      command = config.command;
      base = config.base;
    },
    resolveId(id) {
      return id === THEME_CSS_ID ? RESOLVED_CSS_ID : undefined;
    },
    load(id) {
      return id === RESOLVED_CSS_ID ? themeCss() : undefined;
    },
    generateBundle() {
      this.emitFile({ type: "asset", fileName: BOOT_FILE, source: THEME_BOOT_SCRIPT });
    },
    transformIndexHtml(): HtmlTagDescriptor[] {
      // The dev server has no CSP: the same script inline, without a build step.
      return command === "build"
        ? [{ tag: "script", attrs: { src: `${base}${BOOT_FILE}` }, injectTo: "head-prepend" }]
        : [{ tag: "script", children: THEME_BOOT_SCRIPT, injectTo: "head-prepend" }];
    },
  };
}
