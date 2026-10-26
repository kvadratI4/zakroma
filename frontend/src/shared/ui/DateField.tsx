import { useId } from "react";
import { useTranslation } from "react-i18next";

import { Field } from "./Field";
import { describedBy, FIELD_BOX } from "./fieldParts";

interface DateFieldProps {
  label: string;
  /** `YYYY-MM-DD`. */
  value: string;
  onChange: (value: string) => void;
  /** The date is calculated from the usual shelf life: shown with «≈» and said aloud. */
  estimated?: boolean;
  hint?: string;
}

/** A native date input: the system calendar, no extra library (T-008a, 10-design §7.1). */
export function DateField({ label, value, onChange, estimated = false, hint }: DateFieldProps) {
  const id = useId();
  const { t } = useTranslation();
  const description = [estimated ? t("ui.estimated") : "", hint ?? ""].filter(Boolean).join(" ");
  return (
    <Field id={id} label={label} hint={description || undefined}>
      <div className={`${FIELD_BOX} border-line-control`}>
        {estimated && (
          <span aria-hidden="true" className="text-muted">
            ≈
          </span>
        )}
        <input
          id={id}
          type="date"
          value={value}
          aria-describedby={describedBy(id, description || undefined)}
          onChange={(event) => onChange(event.target.value)}
          className="min-w-0 flex-1 bg-transparent py-3 outline-none"
        />
      </div>
    </Field>
  );
}
