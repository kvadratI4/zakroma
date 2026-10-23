import { Kupavka } from "./Kupavka";

const LEAVES = [
  "M120 172C100 160 74 162 60 180C76 190 100 188 120 172Z",
  "M120 172C140 160 166 162 180 180C164 190 140 188 120 172Z",
  "M120 204C106 196 90 199 80 210C92 217 108 216 120 204Z",
  "M120 204C134 196 150 199 160 210C148 217 132 216 120 204Z",
];
const BERRIES: [number, number, number][] = [
  [52, 196, 8],
  [66, 204, 6],
  [188, 196, 8],
  [174, 204, 6],
];

/** Large composition for the first screen and empty states: a flower on a sprig with berries. */
export function Spray({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 240 240" aria-hidden="true" focusable="false" className={className}>
      <path
        d="M120 140C118 172 122 200 120 232"
        className="stroke-ornament"
        strokeWidth={3}
        fill="none"
        strokeLinecap="round"
      />
      <g className="fill-ornament-fill stroke-ornament" strokeWidth={2.6} strokeLinejoin="round">
        {LEAVES.map((d) => (
          <path key={d} d={d} />
        ))}
        {BERRIES.map(([cx, cy, r]) => (
          <circle key={`${cx}-${cy}`} cx={cx} cy={cy} r={r} />
        ))}
      </g>
      <svg x={64} y={20} width={112} height={112} viewBox="0 0 64 64">
        <Kupavka />
      </svg>
    </svg>
  );
}
