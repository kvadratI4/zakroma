import { useId, type KeyboardEvent } from "react";
import { useTranslation } from "react-i18next";

import { CONTROL_BORDER, FOCUS_RING } from "./classes";
import { Icon } from "./Icon";

interface StepperProps {
  label: string;
  value: number;
  onChange: (value: number) => void;
  min?: number;
  max?: number;
  /** 1, or ½ for measures that can be halved (docs/05-domain-rules.md §1.1). */
  step?: 0.5 | 1;
  /** How the value is said and shown: «2 пакета», «½ пачки». */
  valueText: (value: number) => string;
  /** A second line under the value: «по 930 мл». */
  unitText?: string;
}

/** «−  2 пакета  +»: a spinbutton that speaks the household measure (10-design §7.1). */
export function Stepper({
  label,
  value,
  onChange,
  min = 0,
  max,
  step = 1,
  valueText,
  unitText,
}: StepperProps) {
  const { t } = useTranslation();
  const labelId = useId();
  const clamp = (next: number) => Math.min(max ?? Number.POSITIVE_INFINITY, Math.max(min, next));
  const change = (delta: number) => onChange(clamp(value + delta));
  const onKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    const moves: Record<string, () => void> = {
      ArrowUp: () => change(step),
      ArrowRight: () => change(step),
      ArrowDown: () => change(-step),
      ArrowLeft: () => change(-step),
      Home: () => onChange(min),
      ...(max === undefined ? {} : { End: () => onChange(max) }),
    };
    const move = moves[event.key];
    if (move) {
      event.preventDefault();
      move();
    }
  };
  const round = `grid size-[52px] shrink-0 place-items-center rounded-full bg-raised text-ink active:bg-surface disabled:cursor-not-allowed disabled:opacity-40 ${CONTROL_BORDER} ${FOCUS_RING}`;
  return (
    <div className="grid gap-1.5">
      <span id={labelId} className="text-[15px] font-medium text-ink">
        {label}
      </span>
      <div className="flex items-center gap-3">
        <button
          type="button"
          aria-label={t("ui.decrease")}
          className={round}
          disabled={value <= min}
          onClick={() => change(-step)}
        >
          <Icon name="minus" className="size-6" />
        </button>
        <div
          role="spinbutton"
          tabIndex={0}
          aria-labelledby={labelId}
          aria-valuenow={value}
          aria-valuemin={min}
          aria-valuemax={max}
          aria-valuetext={valueText(value)}
          onKeyDown={onKeyDown}
          className={`grid flex-1 justify-items-center rounded-xl py-1 text-center ${FOCUS_RING}`}
        >
          <b className="text-[22px] leading-tight font-semibold text-ink">{valueText(value)}</b>
          {unitText && <span className="text-sm text-muted">{unitText}</span>}
        </div>
        <button
          type="button"
          aria-label={t("ui.increase")}
          className={round}
          disabled={max !== undefined && value >= max}
          onClick={() => change(step)}
        >
          <Icon name="plus" className="size-6" />
        </button>
      </div>
    </div>
  );
}
