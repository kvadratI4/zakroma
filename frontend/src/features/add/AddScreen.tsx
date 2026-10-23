import { useTranslation } from "react-i18next";

import { ScreenTitle } from "../../shared/ui/ScreenTitle";

/** «Добавить»: search and frequent products arrive in T-036. */
export function AddScreen() {
  const { t } = useTranslation();
  return (
    <div className="grid gap-5">
      <ScreenTitle>{t("add.title")}</ScreenTitle>
      <p className="max-w-[60ch] text-base">{t("add.soon")}</p>
    </div>
  );
}
