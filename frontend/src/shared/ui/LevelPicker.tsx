import { useId, type ReactNode } from "react";
import { useTranslation } from "react-i18next";

import { LEVELS, type Level } from "../theme/tokens";
import { FOCUS_RING_WITHIN } from "./classes";
import { Icon } from "./Icon";
import { LEVEL_TONE } from "./levelTone";

interface LevelPickerProps {
  /** «Сколько осталось: Чай в пакетиках». */
  label: string;
  value: Level;
  onChange: (level: Level) => void;
  /** How much that is in the product's measure: «≈ 5 пакетиков» (docs/05-domain-rules.md §1.2). */
  hint?: string;
  /** The product's quick actions under the levels: «−1 пакетик», «Закончился», «Выбросить». */
  children?: ReactNode;
  id?: string;
}

const NEUTRAL = "border border-line-control bg-surface text-ink";

/**
 * Six levels, 2 × 3, as native radios. Only the chosen level carries its colour and a tick;
 * the others are neutral (operator, round 2 of T-008a: otherwise «мешанина»).
 */
export function LevelPicker({ label, value, onChange, hint, children, id }: LevelPickerProps) {
  const { t } = useTranslation();
  const name = useId();
  return (
    <div id={id} className="grid gap-2.5">
      <div role="radiogroup" aria-label={label} className="grid grid-cols-2 gap-2">
        {LEVELS.map((level) => {
          const chosen = level === value;
          return (
            <label
              key={level}
              className={[
                "flex min-h-12 cursor-pointer items-center justify-center gap-1.5 rounded-[14px] text-[15px]",
                chosen
                  ? `border-2 border-current font-semibold ${LEVEL_TONE[level]}`
                  : `font-medium ${NEUTRAL}`,
                FOCUS_RING_WITHIN,
              ].join(" ")}
            >
              <input
                type="radio"
                name={name}
                value={level}
                checked={chosen}
                onChange={() => onChange(level)}
                className="sr-only"
              />
              {chosen && <Icon name="check" className="size-[18px]" />}
              {t(`levels.${level}`)}
            </label>
          );
        })}
      </div>
      {hint && <p className="text-sm text-muted">{hint}</p>}
      {children && <div className="flex flex-wrap gap-2">{children}</div>}
    </div>
  );
}
