/**
 * A grey bar in place of a value while it loads: the size of the real value, no shimmer.
 * The block that loads carries `aria-busy`; the bar itself is hidden.
 */
export function Skeleton({ className = "h-4 w-24" }: { className?: string }) {
  return <span aria-hidden="true" className={`block rounded-md bg-line ${className}`} />;
}
