import type { ButtonHTMLAttributes } from "react";

import { CONTROL_BORDER, FOCUS_RING } from "./classes";
import { Icon, type IconName } from "./Icon";
import { isActionLabel } from "./labels";

interface ActionPillProps extends Omit<ButtonHTMLAttributes<HTMLButtonElement>, "children"> {
  label: string;
  icon?: IconName;
}

/** A quick action in a row, a card or a list: «−1 стакан», «Закончился», «Купили». */
export function ActionPill({ label, icon, type = "button", className, ...rest }: ActionPillProps) {
  if (!isActionLabel(label)) {
    throw new Error(
      `ActionPill «${label}»: a write-off names a number and a measure, e.g. «−1 стакан»`,
    );
  }
  return (
    <button
      {...rest}
      type={type}
      className={[
        "inline-flex min-h-11 items-center gap-1.5 rounded-full bg-surface px-4 text-base font-medium text-ink active:brightness-95",
        CONTROL_BORDER,
        FOCUS_RING,
        "disabled:cursor-not-allowed disabled:opacity-50",
        className ?? "",
      ].join(" ")}
    >
      {icon && <Icon name={icon} className="size-5" />}
      {label}
    </button>
  );
}
