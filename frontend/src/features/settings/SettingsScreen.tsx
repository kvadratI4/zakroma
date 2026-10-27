import { useId } from "react";
import { useTranslation } from "react-i18next";

import type { ThemeChoice } from "../../shared/theme/themeChoice";
import { useThemeChoice } from "../../shared/theme/themeChoice";
import { ScreenTitle } from "../../shared/ui/ScreenTitle";
import { SegmentedControl } from "../../shared/ui/SegmentedControl";

const CHOICES: readonly ThemeChoice[] = ["system", "light", "dark"];

/**
 * «Настройки». For now only «Мои настройки → Оформление» (T-009, as on the mockup);
 * members, places and the household settings arrive in T-015, the revision period in T-039.
 */
export function SettingsScreen() {
  const { t } = useTranslation();
  const { choice, setChoice } = useThemeChoice();
  const mineId = useId();
  return (
    <div className="grid gap-5">
      <ScreenTitle>{t("settings.title")}</ScreenTitle>
      <section aria-labelledby={mineId} className="grid gap-4">
        <h2 id={mineId} className="px-1 text-[15px] font-semibold text-muted">
          {t("settings.mine.title")}
        </h2>
        <SegmentedControl
          label={t("settings.appearance.label")}
          options={CHOICES.map((value) => ({ value, label: t(`settings.appearance.${value}`) }))}
          value={choice}
          onChange={setChoice}
        />
      </section>
      <p className="max-w-[60ch] text-base text-muted">{t("settings.soon")}</p>
    </div>
  );
}
