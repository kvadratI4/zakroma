interface ProgressBarProps {
  label: string;
  value: number;
  max: number;
  /** Where we are, in words: «Холодильник, 1 из 4». */
  valueText: string;
}

/** A thin accent bar with its place in words, e.g. the places of a revision (docs/05-domain-rules.md §9). */
export function ProgressBar({ label, value, max, valueText }: ProgressBarProps) {
  const percent = max > 0 ? Math.round((Math.min(value, max) / max) * 100) : 0;
  return (
    <div className="flex items-center gap-2.5 text-[15px] text-muted">
      <span aria-hidden="true">{valueText}</span>
      <div
        role="progressbar"
        aria-label={label}
        aria-valuemin={0}
        aria-valuemax={max}
        aria-valuenow={value}
        aria-valuetext={valueText}
        className="h-1.5 flex-1 overflow-hidden rounded-full bg-line"
      >
        <div className="h-full rounded-full bg-accent" style={{ width: `${String(percent)}%` }} />
      </div>
    </div>
  );
}
