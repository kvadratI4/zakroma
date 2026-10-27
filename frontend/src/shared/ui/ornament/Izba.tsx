import { Kupavka } from "./Kupavka";

const LOGS = [112, 128, 144, 160, 176];
const ROOF_DOTS: [number, number][] = [
  [60, 86],
  [76, 74],
  [92, 62],
  [180, 86],
  [164, 74],
  [148, 62],
];

/**
 * An izba front: roof boards with a ridge curl and a towel board, log ends, one carved window;
 * the large picture of the sign-in screen only (docs/10-design.md §5).
 */
export function Izba({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 240 200"
      aria-hidden="true"
      focusable="false"
      data-motif="izba"
      className={className}
    >
      <g strokeWidth={2.4} strokeLinejoin="round" className="fill-ornament-fill stroke-ornament">
        <path d="M12 100L120 20L228 100L214 100L120 34L26 100Z" />
        <path d="M113 36H127V60L120 68L113 60Z" />
      </g>
      <path
        d="M120 20C124 8 136 4 144 10C138 11 133 15 131 22C128 20 124 20 120 20Z"
        className="fill-ornament"
      />
      <g strokeWidth={2.2} strokeLinecap="round" fill="none" className="stroke-ornament">
        {LOGS.map((y) => (
          <path key={y} d={`M44 ${y}H196`} />
        ))}
        <path d="M24 192H216" />
      </g>
      <g strokeWidth={2} className="fill-ornament-fill stroke-ornament">
        {LOGS.flatMap((y) => [
          <circle key={`l${y}`} cx={38} cy={y} r={6} />,
          <circle key={`r${y}`} cx={202} cy={y} r={6} />,
        ])}
      </g>
      <g strokeWidth={2.2} strokeLinejoin="round" className="fill-ornament-fill stroke-ornament">
        <path d="M92 116C92 104 108 100 120 92C132 100 148 104 148 116Z" />
        <rect x={88} y={160} width={64} height={8} />
      </g>
      <rect
        x={96}
        y={118}
        width={48}
        height={42}
        rx={2}
        strokeWidth={2.2}
        className="fill-ground stroke-ornament"
      />
      <svg x={106} y={125} width={28} height={28} viewBox="0 0 64 64">
        <Kupavka />
      </svg>
      <g className="fill-ornament">
        <circle cx={120} cy={106} r={3} />
        {ROOF_DOTS.map(([cx, cy]) => (
          <circle key={`${cx}-${cy}`} cx={cx} cy={cy} r={2.6} />
        ))}
      </g>
    </svg>
  );
}
