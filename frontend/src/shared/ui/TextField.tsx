import { useId, useState, type InputHTMLAttributes } from "react";
import { useTranslation } from "react-i18next";

import { FOCUS_RING } from "./classes";
import { Field } from "./Field";
import { describedBy, FIELD_BOX } from "./fieldParts";

interface TextFieldProps extends Omit<InputHTMLAttributes<HTMLInputElement>, "id"> {
  label: string;
  hint?: string;
  /** What is wrong and how to fix it, in words (docs/07-ui-ux.md §3.1). */
  error?: string;
  /** A password with a «Показать / Скрыть» button. */
  revealable?: boolean;
}

/** A labelled input with an optional hint and error. */
export function TextField({
  label,
  hint,
  error,
  revealable = false,
  type = "text",
  className,
  ...rest
}: TextFieldProps) {
  const id = useId();
  const { t } = useTranslation();
  const [shown, setShown] = useState(false);
  return (
    <Field id={id} label={label} hint={hint} error={error}>
      <div
        className={[
          FIELD_BOX,
          error ? "border-negative" : "border-line-control",
          className ?? "",
        ].join(" ")}
      >
        <input
          {...rest}
          id={id}
          type={revealable && shown ? "text" : type}
          aria-invalid={error ? true : undefined}
          aria-describedby={describedBy(id, hint, error)}
          className="min-w-0 flex-1 bg-transparent py-3 outline-none placeholder:text-muted"
        />
        {revealable && (
          <button
            type="button"
            onClick={() => setShown((value) => !value)}
            className={`-mr-2 min-h-11 rounded-full px-2.5 text-[15px] font-semibold text-accent ${FOCUS_RING}`}
          >
            {shown ? t("ui.hide") : t("ui.show")}
          </button>
        )}
      </div>
    </Field>
  );
}
