import { useTranslation } from "react-i18next";

import { ScreenTitle } from "../../shared/ui/ScreenTitle";

/** «Семья»: members, invites and settings arrive in T-015. */
export function FamilyScreen() {
  const { t } = useTranslation();
  return (
    <div className="grid gap-5">
      <ScreenTitle>{t("family.title")}</ScreenTitle>
      <p className="max-w-[60ch] text-base">{t("family.soon")}</p>
    </div>
  );
}
