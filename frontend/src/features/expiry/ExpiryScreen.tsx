import { useTranslation } from "react-i18next";

import { EmptyState } from "../../shared/ui/EmptyState";
import { ScreenTitle } from "../../shared/ui/ScreenTitle";

/** «Сроки»: expired and expiring items arrive in T-038. */
export function ExpiryScreen() {
  const { t } = useTranslation();
  return (
    <div className="grid gap-5">
      <ScreenTitle>{t("expiry.title")}</ScreenTitle>
      <EmptyState title={t("expiry.empty.title")}>{t("expiry.empty.text")}</EmptyState>
    </div>
  );
}
