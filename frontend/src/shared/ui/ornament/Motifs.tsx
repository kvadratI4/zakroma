/** Emblems of the places (docs/10-design.md §5): drawn for «Закрома» from simple shapes. */

interface MotifProps {
  className?: string;
}

/** Snowflower: the freezer. */
export function Snowflake({ className }: MotifProps) {
  return (
    <svg
      viewBox="0 0 64 64"
      aria-hidden="true"
      focusable="false"
      data-motif="snowflake"
      className={className}
    >
      <g className="stroke-ornament" strokeWidth={2.4} strokeLinecap="round" fill="none">
        <path d="M32 6V58M9.5 19L54.5 45M9.5 45L54.5 19" />
        <path d="M32 14l-5-5M32 14l5-5M32 50l-5 5M32 50l5 5" />
      </g>
      <circle
        cx={32}
        cy={32}
        r={7}
        strokeWidth={2}
        className="fill-ornament-fill stroke-ornament"
      />
      <g className="fill-ornament">
        <circle cx={16} cy={23} r={2.4} />
        <circle cx={48} cy={23} r={2.4} />
        <circle cx={16} cy={41} r={2.4} />
        <circle cx={48} cy={41} r={2.4} />
      </g>
    </svg>
  );
}

const GRAINS: [number, number, number][] = [
  [25, 22, -30],
  [39, 22, 30],
  [25, 34, -30],
  [39, 34, 30],
  [25, 46, -30],
  [39, 46, 30],
];

/** Ear of grain: the cupboard. */
export function Ear({ className }: MotifProps) {
  return (
    <svg
      viewBox="0 0 64 64"
      aria-hidden="true"
      focusable="false"
      data-motif="ear"
      className={className}
    >
      <path d="M32 60V14" strokeWidth={2.4} strokeLinecap="round" className="stroke-ornament" />
      <g strokeWidth={2} className="fill-ornament-fill stroke-ornament">
        <ellipse cx={32} cy={10} rx={4.5} ry={7} />
        {GRAINS.map(([cx, cy, angle]) => (
          <ellipse
            key={`${cx}-${cy}`}
            cx={cx}
            cy={cy}
            rx={4.5}
            ry={7.5}
            transform={`rotate(${angle} ${cx} ${cy})`}
          />
        ))}
      </g>
    </svg>
  );
}

/** Rowan berries on a twig: the balcony. */
export function Rowan({ className }: MotifProps) {
  return (
    <svg
      viewBox="0 0 64 64"
      aria-hidden="true"
      focusable="false"
      data-motif="rowan"
      className={className}
    >
      <path
        d="M14 50C22 40 30 30 46 18"
        strokeWidth={2.4}
        fill="none"
        strokeLinecap="round"
        className="stroke-ornament"
      />
      <path
        d="M46 18C50 10 58 8 60 6C58 14 54 20 46 18Z"
        strokeWidth={2}
        className="fill-ornament-leaf stroke-ornament"
      />
      <g strokeWidth={2} className="fill-ornament-fill stroke-ornament">
        <circle cx={22} cy={44} r={7} />
        <circle cx={33} cy={42} r={6} />
        <circle cx={26} cy={33} r={6} />
        <circle cx={14} cy={34} r={5} />
      </g>
      <g className="fill-ornament">
        <circle cx={22} cy={44} r={1.6} />
        <circle cx={33} cy={42} r={1.4} />
        <circle cx={26} cy={33} r={1.4} />
      </g>
    </svg>
  );
}
