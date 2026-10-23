import type { ReactNode } from "react";

import { Spray } from "./ornament/Spray";

/** An empty section: a small sprig, a title in the display face and one plain sentence. */
export function EmptyState({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="grid justify-items-start gap-3 rounded-[20px] bg-surface px-5 pt-4 pb-6 lg:grid-cols-[160px_1fr] lg:items-center lg:gap-6">
      <Spray className="size-28 lg:size-40" />
      <div className="grid gap-2">
        <h2 className="font-display text-2xl leading-tight text-ink">{title}</h2>
        <p className="max-w-[60ch] text-base text-ink">{children}</p>
      </div>
    </section>
  );
}
