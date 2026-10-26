interface BadgeProps {
  count: number;
  /** What the number means, said instead of it: «3 требуют внимания». */
  label: string;
}

/** A red number on a menu item; only for a queue that needs action, so zero shows nothing. */
export function Badge({ count, label }: BadgeProps) {
  if (count <= 0) return null;
  return (
    <>
      <span
        aria-hidden="true"
        className="grid h-5 min-w-5 place-items-center rounded-full bg-negative px-1.5 text-xs font-semibold text-ground"
      >
        {count}
      </span>
      <span className="sr-only">{label}</span>
    </>
  );
}
