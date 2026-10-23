import { useTranslation } from "react-i18next";

import { greetingKey } from "../../shared/format/greeting";
import { EmptyState } from "../../shared/ui/EmptyState";
import { ScreenTitle } from "../../shared/ui/ScreenTitle";

/** «Запасы»: opens with the greeting; the stock list arrives in T-035. */
export function StockScreen() {
  const { t } = useTranslation();
  return (
    <div className="grid gap-5">
      <ScreenTitle>{t(`greeting.${greetingKey(new Date())}`)}</ScreenTitle>
      <EmptyState title={t("stock.empty.title")}>{t("stock.empty.text")}</EmptyState>
    </div>
  );
}
