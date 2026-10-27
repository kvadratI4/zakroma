import type { ButtonHTMLAttributes, MouseEvent, ReactNode } from "react";

import { FOCUS_RING } from "./classes";
import { Icon, type IconName } from "./Icon";

export type ButtonVariant = "primary" | "secondary" | "quiet" | "danger";

const VARIANTS: Record<ButtonVariant, string> = {
  primary: "bg-accent text-on-accent active:brightness-90",
  secondary: "bg-surface text-ink active:brightness-95",
  quiet: "bg-transparent text-accent active:bg-surface",
  danger: "bg-transparent text-negative active:bg-surface",
};

interface ButtonProps extends Omit<ButtonHTMLAttributes<HTMLButtonElement>, "children"> {
  children: ReactNode;
  variant?: ButtonVariant;
  /** `main` — the screen's one main action (54px), `regular` — inside cards (48px). */
  size?: "main" | "regular";
  /** Stretches to the width of its container (the bottom dock). */
  full?: boolean;
  icon?: IconName;
  /** Saving: stays focusable and keeps its width, ignores clicks (10-design §7). */
  loading?: boolean;
}

/** A button with words on it; the label is its accessible name. */
export function Button({
  children,
  variant = "primary",
  size = "main",
  full = false,
  icon,
  loading = false,
  type = "button",
  className,
  onClick,
  ...rest
}: ButtonProps) {
  const handleClick = (event: MouseEvent<HTMLButtonElement>) => {
    if (loading) {
      event.preventDefault();
      return;
    }
    onClick?.(event);
  };
  return (
    <button
      {...rest}
      type={type}
      aria-busy={loading || undefined}
      aria-disabled={loading || undefined}
      onClick={handleClick}
      className={[
        "inline-flex items-center justify-center gap-2 rounded-full px-5 font-semibold transition-[filter,background-color]",
        size === "main" ? "min-h-[54px] text-[17px]" : "min-h-12 text-base",
        full ? "w-full" : "",
        VARIANTS[variant],
        FOCUS_RING,
        "disabled:cursor-not-allowed disabled:opacity-50 aria-busy:cursor-progress",
        className ?? "",
      ].join(" ")}
    >
      {loading ? (
        <span
          aria-hidden="true"
          className="size-5 animate-spin rounded-full border-2 border-current border-r-transparent"
        />
      ) : (
        icon && <Icon name={icon} className="size-5" />
      )}
      {children}
    </button>
  );
}
