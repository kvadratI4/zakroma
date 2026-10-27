const PATHS = {
  stock: "M4 4h16v16H4zM4 10h16M4 15h16M8 7h2M8 12.5h3M8 17.5h2",
  clock: "M12 3.5a8.5 8.5 0 1 1 0 17 8.5 8.5 0 0 1 0-17zM12 7v5l3.5 2",
  plus: "M12 5v14M5 12h14",
  minus: "M5 12h14",
  bag: "M5 8h14l-1 12H6zM9 8V6.5a3 3 0 0 1 6 0V8",
  family:
    "M9 5a3 3 0 1 1 0 6 3 3 0 0 1 0-6zM17 7.2a2.3 2.3 0 1 1 0 4.6 2.3 2.3 0 0 1 0-4.6zM3.5 19c.6-3.3 2.8-5 5.5-5s4.9 1.7 5.5 5M15 14.2c2.6-.4 4.6 1 5.2 4",
  chevronDown: "M7 10l5 5 5-5",
  chevronLeft: "M14.5 6l-6 6 6 6",
  chevronRight: "M10 7l5 5-5 5",
  search: "M11 4.5a6.5 6.5 0 1 1 0 13 6.5 6.5 0 0 1 0-13zM16 16l4 4",
  filter: "M4 7h16M7 12h10M10 17h4",
  more: "M5.5 12h.01M12 12h.01M18.5 12h.01",
  close: "M6.5 6.5l11 11M17.5 6.5l-11 11",
  check: "M5 12.5l4.5 4.5L19 7.5",
  alert: "M12 3.5a8.5 8.5 0 1 1 0 17 8.5 8.5 0 0 1 0-17zM12 7.5V13M12 16.3v.2",
  calendar:
    "M6 5.5h12a2 2 0 0 1 2 2v10a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2v-10a2 2 0 0 1 2-2zM4 10h16M8.5 3.5v4M15.5 3.5v4",
  gear: "M12 9a3 3 0 1 1 0 6 3 3 0 0 1 0-6zM12 3.5l1.6 2.2 2.7-.5.8 2.6 2.5 1.2-.8 2.6.8 2.6-2.5 1.2-.8 2.6-2.7-.5L12 20.5l-1.6-2.2-2.7.5-.8-2.6-2.5-1.2.8-2.6-.8-2.6 2.5-1.2.8-2.6 2.7.5z",
  invite:
    "M10 4.8a3.2 3.2 0 1 1 0 6.4 3.2 3.2 0 0 1 0-6.4zM4 19c.6-3.4 3-5.2 6-5.2s5.4 1.8 6 5.2M18.5 7v6M15.5 10h6",
  offline: "M3 9.5a13 13 0 0 1 18 0M6.5 13a8 8 0 0 1 11 0M10 16.5a3 3 0 0 1 4 0M4 4l16 16",
} as const;

export type IconName = keyof typeof PATHS;

/** Thicker strokes: the plus of «Добавить», ticks and dots must read at a glance. */
const STROKE: Partial<Record<IconName, number>> = { plus: 2.2, minus: 2.2, check: 2.2, more: 3.2 };

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
      strokeWidth={STROKE[name] ?? 1.7}
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d={PATHS[name]} />
    </svg>
  );
}
