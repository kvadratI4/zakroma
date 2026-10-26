import { useTranslation } from "react-i18next";

import type { Level } from "../theme/tokens";
import { FOCUS_RING } from "./classes";
import { Icon } from "./Icon";
import { LEVEL_TONE } from "./levelTone";

interface LevelButtonProps {
  level: Level;
  /** Whether the level picker under the row is open. */
  expanded: boolean;
  /** Id of the picker it opens. */
  controls: string;
  onClick: () => void;
}

/** The level in a product row is a button: it opens the six levels and the product's actions. */
export function LevelButton({ level, expanded, controls, onClick }: LevelButtonProps) {
  const { t } = useTranslation();
  const word = t(`levels.${level}`);
  return (
    <button
      type="button"
      aria-label={t("ui.levelChange", { level: word })}
      aria-expanded={expanded}
      aria-controls={controls}
      onClick={onClick}
      // 44px target around a 28px chip (docs/10-design.md §7).
      className={`-my-2 inline-flex min-h-11 min-w-11 items-center justify-end rounded-full ${FOCUS_RING}`}
    >
      <span
        className={[
          "inline-flex h-7 items-center gap-1 rounded-full pr-1.5 pl-2.5 text-sm font-medium",
          LEVEL_TONE[level],
          expanded ? "ring-2 ring-current" : "",
        ].join(" ")}
      >
        {word}
        <Icon name="chevronDown" className="size-4" />
      </span>
    </button>
  );
}
