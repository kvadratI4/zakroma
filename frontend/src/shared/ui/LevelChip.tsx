import { useTranslation } from "react-i18next";

import type { Level } from "../theme/tokens";
import { LEVEL_TONE } from "./levelTone";

/** A level shown in words and colour, never colour alone (docs/07-ui-ux.md §1). */
export function LevelChip({ level }: { level: Level }) {
  const { t } = useTranslation();
  return (
    <span
      className={`inline-flex h-6 w-max items-center gap-1.5 rounded-full px-2.5 text-sm font-medium ${LEVEL_TONE[level]}`}
    >
      <span aria-hidden="true" className="size-2 rounded-full bg-current" />
      {t(`levels.${level}`)}
    </span>
  );
}
