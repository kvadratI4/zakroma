/**
 * The first letter of a member's name in a circle; the name itself is written next to it, so the
 * avatar is hidden from screen readers. One neutral tone: there are no member colours in tokens.ts.
 */
export function Avatar({ name }: { name: string }) {
  return (
    <span
      aria-hidden="true"
      className="grid size-9 shrink-0 place-items-center rounded-full border border-line-control bg-surface text-[15px] font-semibold text-ink"
    >
      {name.trim().charAt(0).toUpperCase()}
    </span>
  );
}
