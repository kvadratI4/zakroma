import type { HtmlTagDescriptor, Plugin, ResolvedConfig } from "vite";
import { describe, expect, it } from "vitest";

import { themeCss } from "../src/shared/theme/cssVariables";
import { THEME_BOOT_SCRIPT } from "../src/shared/theme/themeBoot";
import { THEME_CSS_ID, themePlugin } from "./themePlugin";

type Hook = (...args: never[]) => unknown;

// Vite hooks are either functions or { handler } objects; the tests call the handler directly.
function hook(plugin: Plugin, name: keyof Plugin): Hook {
  const value = plugin[name] as Hook | { handler: Hook } | undefined;
  if (!value) throw new Error(`the plugin has no ${String(name)} hook`);
  return typeof value === "function" ? value : value.handler;
}

function configured(command: "build" | "serve"): Plugin {
  const plugin = themePlugin();
  (hook(plugin, "configResolved") as (config: Partial<ResolvedConfig>) => void)({
    command,
    base: "/",
  });
  return plugin;
}

function headTags(plugin: Plugin): HtmlTagDescriptor[] {
  return (hook(plugin, "transformIndexHtml") as (html: string) => HtmlTagDescriptor[])("");
}

describe("theme build plugin (T-009, AC-4, AC-5)", () => {
  it("serves the tokens of tokens.ts as a CSS module", () => {
    const plugin = configured("build");
    const resolved = (hook(plugin, "resolveId") as (id: string) => string | undefined)(
      THEME_CSS_ID,
    );

    expect(resolved).toMatch(/\.css$/);
    expect((hook(plugin, "load") as (id: string) => string | undefined)(resolved ?? "")).toBe(
      themeCss(),
    );
    expect((hook(plugin, "resolveId") as (id: string) => unknown)("./other.css")).toBeUndefined();
  });

  it("puts the boot script first in <head> as a hashed /assets file in the build", () => {
    const plugin = configured("build");
    const emitted: { fileName: string; source: string }[] = [];
    hook(plugin, "generateBundle").call({
      emitFile: (file: { fileName: string; source: string }) => emitted.push(file),
    });

    const [tag] = headTags(plugin);

    expect(emitted).toHaveLength(1);
    expect(emitted[0]?.fileName).toMatch(/^assets\/theme-boot-[0-9a-f]{8}\.js$/);
    expect(emitted[0]?.source).toBe(THEME_BOOT_SCRIPT);
    expect(tag).toEqual({
      tag: "script",
      attrs: { src: `/${emitted[0]?.fileName}` },
      injectTo: "head-prepend",
    });
  });

  it("inlines the same script on the dev server, which has no CSP", () => {
    const [tag] = headTags(configured("serve"));

    expect(tag).toEqual({ tag: "script", children: THEME_BOOT_SCRIPT, injectTo: "head-prepend" });
  });
});
