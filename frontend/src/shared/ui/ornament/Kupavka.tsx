const PETAL = "M32 30C22 22 22 8 32 4C42 8 42 22 32 30Z";

/** Gzhel-style kupavka flower: the fridge emblem and the default one (docs/10-design.md §5). */
export function Kupavka({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 64 64"
      aria-hidden="true"
      focusable="false"
      data-motif="kupavka"
      className={className}
    >
      <g className="fill-ornament-fill stroke-ornament" strokeWidth={2.2} strokeLinejoin="round">
        {[0, 72, 144, 216, 288].map((angle) => (
          <path key={angle} d={PETAL} transform={`rotate(${angle} 32 32)`} />
        ))}
      </g>
      <circle cx={32} cy={32} r={5} className="fill-ornament" />
    </svg>
  );
}
