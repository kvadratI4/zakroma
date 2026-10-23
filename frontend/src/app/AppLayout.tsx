import { useTranslation } from "react-i18next";
import { Outlet } from "react-router";

import { Icon } from "../shared/ui/Icon";
import { Kayma } from "../shared/ui/ornament/Kayma";
import { MainNav } from "./MainNav";

/**
 * Phone: header, kayma, content, bottom navigation. Desktop (lg): a 248px column with the
 * header and the navigation, content on the right (docs/10-design.md §4).
 */
export function AppLayout() {
  const { t } = useTranslation();
  return (
    <div className="min-h-dvh bg-ground text-ink lg:grid lg:grid-cols-[248px_minmax(0,1fr)] lg:grid-rows-[auto_1fr]">
      <header className="flex items-center gap-2 px-4 pt-[max(8px,env(safe-area-inset-top))] pb-2.5 lg:flex-col lg:items-stretch lg:gap-4 lg:border-r lg:border-line lg:px-4 lg:pt-7 lg:pb-5">
        <span className="font-display text-2xl leading-none lg:px-2.5 lg:text-[30px]">
          {t("app.name")}
        </span>
        <span className="ml-auto inline-flex h-11 items-center gap-1.5 rounded-full bg-surface px-4 text-[15px] font-medium lg:ml-0 lg:justify-between">
          {t("household.placeholder")}
          <Icon name="chevronDown" className="size-5" />
        </span>
      </header>
      <Kayma className="lg:col-start-2 lg:row-start-1 lg:self-start" />
      <main className="mx-auto w-full max-w-[1100px] px-4 pt-4 pb-32 lg:col-start-2 lg:row-span-2 lg:row-start-1 lg:px-10 lg:pt-12 lg:pb-12">
        <Outlet />
      </main>
      <div className="lg:col-start-1 lg:row-start-2 lg:border-r lg:border-line">
        <MainNav />
      </div>
    </div>
  );
}
