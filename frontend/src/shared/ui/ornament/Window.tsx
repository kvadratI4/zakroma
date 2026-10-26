import { Kupavka } from "./Kupavka";

/** Downward scallops along the bottom of the kokoshnik: eight arcs of 19px. */
const SCALLOPS = `M24 74${"a9.5 9.5 0 0 0 19 0".repeat(8)}Z`;

/**
 * An izba window with a carved frame — kokoshnik with scallops, side boards, sill and a hanging
 * towel board — and a kupavka inside; for empty states only (docs/10-design.md §5).
 */
export function Window({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 200 240"
      aria-hidden="true"
      focusable="false"
      data-motif="window"
      className={className}
    >
      <g strokeWidth={2.4} strokeLinejoin="round" className="fill-ornament-fill stroke-ornament">
        <path d="M24 74C24 44 70 36 100 14C130 36 176 44 176 74Z" className="fill-none" />
        <path d={SCALLOPS} />
        <rect x={30} y={86} width={14} height={112} />
        <rect x={156} y={86} width={14} height={112} />
        <rect x={20} y={198} width={160} height={10} />
        <path d="M74 208H126V222L117.3 232L108.7 222L100 232L91.3 222L82.7 232L74 222Z" />
      </g>
      <g className="fill-ornament">
        <circle cx={100} cy={8} r={4} />
        <circle cx={100} cy={52} r={5} />
        <circle cx={74} cy={60} r={3} />
        <circle cx={126} cy={60} r={3} />
      </g>
      <rect
        x={48}
        y={86}
        width={104}
        height={108}
        rx={3}
        strokeWidth={2.4}
        className="fill-ground stroke-ornament"
      />
      <svg x={64} y={104} width={72} height={72} viewBox="0 0 64 64">
        <Kupavka />
      </svg>
    </svg>
  );
}
