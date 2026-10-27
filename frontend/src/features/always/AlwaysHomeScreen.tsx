import { useTranslation } from "react-i18next";

import { EmptyState } from "../../shared/ui/EmptyState";
import { ScreenTitle } from "../../shared/ui/ScreenTitle";

/** «Всегда дома»: out of stock, almost none, low and excess of products with a norm arrive in T-038. */
export function AlwaysHomeScreen() {
  const { t } = useTranslation();
  return (
    <div className="grid gap-5">
      <ScreenTitle>{t("always.title")}</ScreenTitle>
      <EmptyState title={t("always.empty.title")}>{t("always.empty.text")}</EmptyState>
    </div>
  );
}
