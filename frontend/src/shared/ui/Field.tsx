import type { ReactNode } from "react";

import { Icon } from "./Icon";

interface FieldProps {
  id: string;
  label: string;
  hint?: string | undefined;
  error?: string | undefined;
  children: ReactNode;
}

/** Label above, the control, then an error in words and a hint (docs/10-design.md §7.1). */
export function Field({ id, label, hint, error, children }: FieldProps) {
  return (
    <div className="grid gap-1.5">
      <label htmlFor={id} className="text-[15px] font-medium text-ink">
        {label}
      </label>
      {children}
      {error && (
        <p
          id={`${id}-error`}
          className="flex items-start gap-1.5 text-sm font-medium text-negative"
        >
          <Icon name="alert" className="mt-px size-[18px] shrink-0" />
          {error}
        </p>
      )}
      {hint && (
        <p id={`${id}-hint`} className="text-sm text-muted">
          {hint}
        </p>
      )}
    </div>
  );
}
