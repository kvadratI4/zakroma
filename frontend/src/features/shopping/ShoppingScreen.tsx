import { useTranslation } from "react-i18next";

import { EmptyState } from "../../shared/ui/EmptyState";
import { ScreenTitle } from "../../shared/ui/ScreenTitle";

/** «Покупки»: out of stock, low and excess arrive in T-038. */
export function ShoppingScreen() {
  const { t } = useTranslation();
  return (
    <div className="grid gap-5">
      <ScreenTitle>{t("shopping.title")}</ScreenTitle>
      <EmptyState title={t("shopping.empty.title")}>{t("shopping.empty.text")}</EmptyState>
    </div>
  );
}
