/** Thin running border of small flowers under the header; purely decorative. */
export function Kayma({ className }: { className?: string }) {
  return <div aria-hidden="true" className={`kayma h-3 ${className ?? ""}`} />;
}
