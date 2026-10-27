import { useId } from "react";

import { FOCUS_RING } from "./classes";

interface SwitchProps {
  label: string;
  /** What switching on does, in words: «Когда станет меньше — появится во „Всегда дома“». */
  description?: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
  disabled?: boolean;
}

/** An on/off switch with its label and explanation on the left (10-design §7.1). */
export function Switch({ label, description, checked, onChange, disabled = false }: SwitchProps) {
  const id = useId();
  return (
    <div className="flex min-h-[52px] items-center gap-3">
      <div className="grid flex-1">
        <label htmlFor={id} className="cursor-pointer text-base text-ink">
          {label}
        </label>
        {description && (
          <span id={`${id}-description`} className="text-sm text-muted">
            {description}
          </span>
        )}
      </div>
      <button
        id={id}
        type="button"
        role="switch"
        aria-checked={checked}
        aria-describedby={description ? `${id}-description` : undefined}
        disabled={disabled}
        onClick={() => onChange(!checked)}
        className={[
          "relative h-8 w-[52px] shrink-0 rounded-full transition-colors disabled:cursor-not-allowed disabled:opacity-50",
          checked ? "bg-accent" : "bg-line-control",
          FOCUS_RING,
        ].join(" ")}
      >
        <span
          aria-hidden="true"
          className={[
            "absolute top-[3px] size-[26px] rounded-full transition-[left]",
            checked ? "left-[23px] bg-on-accent" : "left-[3px] bg-ground",
          ].join(" ")}
        />
      </button>
    </div>
  );
}
