import axe from "axe-core";

/**
 * Rules that judge a whole page, not a component rendered on its own; colour contrast is
 * checked for both themes by tokens.test.ts, because jsdom computes no colours (T-008b).
 */
const OFF_FOR_COMPONENTS = [
  "color-contrast",
  "region",
  "landmark-one-main",
  "page-has-heading-one",
];

/** Runs axe-core on rendered markup and fails with every violation and its element. */
export async function expectAccessible(container: Element): Promise<void> {
  const rules = Object.fromEntries(OFF_FOR_COMPONENTS.map((id) => [id, { enabled: false }]));
  const { violations } = await axe.run(container, { rules });
  if (violations.length > 0) {
    const report = violations
      .map((v) => `${v.id}: ${v.help} — ${v.nodes.map((n) => n.target.join(" ")).join(", ")}`)
      .join("\n");
    throw new Error(`Accessibility violations:\n${report}`);
  }
}
