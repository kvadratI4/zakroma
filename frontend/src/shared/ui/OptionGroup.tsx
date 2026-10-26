import { useId } from "react";

import { FOCUS_RING_WITHIN } from "./classes";

export interface Option<V extends string> {
  value: V;
  label: string;
}

export interface OptionGroupProps<V extends string> {
  label: string;
  /** The label stays for screen readers, but is not shown (e.g. «По местам / По видам»). */
  hideLabel?: boolean;
  options: readonly Option<V>[];
  /** `null` — nothing chosen yet. */
  value: V | null;
  onChange: (value: V) => void;
}

type Look = "chips" | "segments" | "rows";

const GROUP: Record<Look, string> = {
  chips: "flex flex-wrap gap-2",
  segments: "inline-flex gap-1 rounded-full bg-surface p-[3px]",
  rows: "grid overflow-hidden rounded-2xl border border-line bg-raised",
};

const OPTION: Record<Look, string> = {
  chips:
    "min-h-11 rounded-full border border-line-control bg-raised px-3.5 text-base text-ink has-[:checked]:border-ink has-[:checked]:bg-ink has-[:checked]:font-medium has-[:checked]:text-ground",
  segments:
    "min-h-11 rounded-full px-4 text-[15px] text-muted has-[:checked]:bg-ink has-[:checked]:font-medium has-[:checked]:text-ground",
  rows: "min-h-[52px] gap-3 border-t border-line px-3.5 text-base text-ink first:border-t-0",
};

/**
 * Native radio buttons dressed as chips, segments or rows: the browser gives arrow keys and
 * «выбрано, 2 из 3» for free (T-008b: no Radix in base components).
 */
export function OptionGroup<V extends string>({
  label,
  hideLabel = false,
  options,
  value,
  onChange,
  look,
}: OptionGroupProps<V> & { look: Look }) {
  const name = useId();
  const labelId = `${name}-label`;
  return (
    <div className="grid gap-1.5">
      <span id={labelId} className={hideLabel ? "sr-only" : "text-[15px] font-medium text-ink"}>
        {label}
      </span>
      <div role="radiogroup" aria-labelledby={labelId} className={GROUP[look]}>
        {options.map((option) => (
          <label
            key={option.value}
            className={`flex cursor-pointer items-center ${OPTION[look]} ${FOCUS_RING_WITHIN}`}
          >
            <input
              type="radio"
              name={name}
              value={option.value}
              checked={value === option.value}
              onChange={() => onChange(option.value)}
              className={look === "rows" ? "peer sr-only" : "sr-only"}
            />
            {look === "rows" && (
              <span
                aria-hidden="true"
                className="size-[22px] shrink-0 rounded-full border-2 border-line-control peer-checked:border-[7px] peer-checked:border-accent"
              />
            )}
            {option.label}
          </label>
        ))}
      </div>
    </div>
  );
}
