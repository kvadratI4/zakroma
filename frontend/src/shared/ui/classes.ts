/** Shared class strings of «Фарфор» controls (docs/10-design.md §7). */

/** Keyboard focus: a 3px accent ring outside the control. */
export const FOCUS_RING =
  "focus-visible:outline focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-accent";

/** Outline of chips, small buttons and fields: one step stronger than panel borders. */
export const CONTROL_BORDER = "border border-line-control";

/** The same ring for a label that wraps a visually hidden input (chips, segments, rows). */
export const FOCUS_RING_WITHIN =
  "has-[:focus-visible]:outline has-[:focus-visible]:outline-3 has-[:focus-visible]:outline-offset-2 has-[:focus-visible]:outline-accent";
