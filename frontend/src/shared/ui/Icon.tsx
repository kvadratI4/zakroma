const PATHS = {
  stock: "M4 4h16v16H4zM4 10h16M4 15h16M8 7h2M8 12.5h3M8 17.5h2",
  clock: "M12 3.5a8.5 8.5 0 1 1 0 17 8.5 8.5 0 0 1 0-17zM12 7v5l3.5 2",
  plus: "M12 5v14M5 12h14",
  bag: "M5 8h14l-1 12H6zM9 8V6.5a3 3 0 0 1 6 0V8",
  family:
    "M9 5a3 3 0 1 1 0 6 3 3 0 0 1 0-6zM17 7.2a2.3 2.3 0 1 1 0 4.6 2.3 2.3 0 0 1 0-4.6zM3.5 19c.6-3.3 2.8-5 5.5-5s4.9 1.7 5.5 5M15 14.2c2.6-.4 4.6 1 5.2 4",
  chevronDown: "M7 10l5 5 5-5",
} as const;

export type IconName = keyof typeof PATHS;

/** Decorative 24px outline icon; the control it sits in carries the accessible name. */
export function Icon({ name, className }: { name: IconName; className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      aria-hidden="true"
      focusable="false"
      className={className ?? "size-6"}
      fill="none"
      stroke="currentColor"
      strokeWidth={name === "plus" ? 2.2 : 1.7}
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d={PATHS[name]} />
    </svg>
  );
}
