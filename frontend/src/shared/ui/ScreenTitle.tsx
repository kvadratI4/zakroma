import type { ReactNode } from "react";

/** The screen's h1, set in the display face (docs/10-design.md §3). */
export function ScreenTitle({ children }: { children: ReactNode }) {
  return (
    <h1 className="font-display text-[36px] leading-[1.02] text-ink lg:text-5xl">{children}</h1>
  );
}
