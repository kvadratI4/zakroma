import type { ButtonHTMLAttributes } from "react";

import { CONTROL_BORDER, FOCUS_RING } from "./classes";
import { Icon, type IconName } from "./Icon";

interface IconButtonProps extends Omit<ButtonHTMLAttributes<HTMLButtonElement>, "children"> {
  icon: IconName;
  /** Required: an icon alone tells a screen reader nothing (10-design §7.1). */
  label: string;
  /** A thin outline for buttons that sit on the page ground (filter, close). */
  bordered?: boolean;
}

/** A 44px round button with an icon and a spoken name. */
export function IconButton({
  icon,
  label,
  bordered = false,
  type = "button",
  className,
  ...rest
}: IconButtonProps) {
  return (
    <button
      {...rest}
      type={type}
      aria-label={label}
      className={[
        "inline-grid size-11 shrink-0 place-items-center rounded-full text-ink active:bg-surface",
        bordered ? CONTROL_BORDER : "",
        FOCUS_RING,
        "disabled:cursor-not-allowed disabled:opacity-50",
        className ?? "",
      ].join(" ")}
    >
      <Icon name={icon} className="size-6" />
    </button>
  );
}
