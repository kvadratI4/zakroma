import type { Level } from "../theme/tokens";

/** Tone of a level: its ink on its tint. Full class names, so Tailwind finds them in the source. */
export const LEVEL_TONE: Record<Level, string> = {
  out: "bg-level-out-bg text-level-out-ink",
  critical: "bg-level-critical-bg text-level-critical-ink",
  low: "bg-level-low-bg text-level-low-ink",
  normal: "bg-level-normal-bg text-level-normal-ink",
  plenty: "bg-level-plenty-bg text-level-plenty-ink",
  excess: "bg-level-excess-bg text-level-excess-ink",
};
