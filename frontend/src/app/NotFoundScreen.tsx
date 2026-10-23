import { useTranslation } from "react-i18next";
import { Link } from "react-router";

import { ScreenTitle } from "../shared/ui/ScreenTitle";

export function NotFoundScreen() {
  const { t } = useTranslation();
  return (
    <div className="grid justify-items-start gap-4">
      <ScreenTitle>{t("notFound.title")}</ScreenTitle>
      <p className="text-base">{t("notFound.text")}</p>
      <Link
        to="/"
        className="inline-flex h-12 items-center rounded-full bg-accent px-6 font-semibold text-on-accent"
      >
        {t("notFound.back")}
      </Link>
    </div>
  );
}
