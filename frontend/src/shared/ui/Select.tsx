import { useId, type ReactNode } from "react";

import { Field } from "./Field";
import { describedBy, FIELD_BOX } from "./fieldParts";
import { Icon } from "./Icon";

export interface SelectOption<V extends string> {
  value: V;
  label: string;
}

interface SelectProps<V extends string> {
  label: string;
  value: V;
  onChange: (value: V) => void;
  options: readonly SelectOption<V>[];
  hint?: string;
  /** An emblem or icon before the value, e.g. the place's flower. */
  leading?: ReactNode;
}

/**
 * A native list: on a phone it opens the system picker, large and familiar to older people;
 * Radix Select would break the strict CSP (T-008b, experiment).
 */
export function Select<V extends string>({
  label,
  value,
  onChange,
  options,
  hint,
  leading,
}: SelectProps<V>) {
  const id = useId();
  return (
    <Field id={id} label={label} hint={hint}>
      <div className={`${FIELD_BOX} relative border-line-control pr-10`}>
        {leading}
        <select
          id={id}
          value={value}
          aria-describedby={describedBy(id, hint)}
          onChange={(event) => {
            const chosen = options.find((option) => option.value === event.target.value);
            if (chosen) onChange(chosen.value);
          }}
          className="min-w-0 flex-1 cursor-pointer appearance-none bg-transparent py-3 outline-none"
        >
          {options.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
        <Icon
          name="chevronDown"
          className="pointer-events-none absolute right-3 size-5 text-muted"
        />
      </div>
    </Field>
  );
}
