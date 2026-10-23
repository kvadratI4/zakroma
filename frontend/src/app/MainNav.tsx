import { useTranslation } from "react-i18next";
import { NavLink } from "react-router";

import { Icon } from "../shared/ui/Icon";
import { NAV_ITEMS } from "./navigation";

const BASE =
  "relative flex min-h-14 flex-col items-center justify-end gap-1 text-xs lg:min-h-11 lg:flex-row lg:justify-start lg:gap-3 lg:rounded-[10px] lg:px-3 lg:text-[15px]";

const ACTIVE =
  "font-semibold text-ink before:absolute before:-top-2 before:h-[3px] before:w-5 before:rounded-full before:bg-ink lg:bg-surface lg:before:hidden";

export function MainNav() {
  const { t } = useTranslation();
  return (
    <nav
      aria-label={t("nav.label")}
      className="fixed inset-x-0 bottom-0 z-10 border-t border-line bg-ground px-1.5 pt-2 pb-[max(12px,env(safe-area-inset-bottom))] lg:static lg:border-0 lg:px-4 lg:pt-0 lg:pb-6"
    >
      <ul className="grid grid-cols-5 items-end lg:flex lg:flex-col lg:items-stretch lg:gap-0.5">
        {NAV_ITEMS.map((item) =>
          item.primary ? (
            <li key={item.to} className="lg:order-first lg:mb-4">
              <NavLink
                to={item.to}
                className={({ isActive }) =>
                  [
                    BASE,
                    "font-semibold text-ink lg:min-h-12 lg:justify-center lg:rounded-full lg:bg-accent lg:text-on-accent",
                    isActive ? "lg:ring-2 lg:ring-ink lg:ring-offset-2 lg:ring-offset-ground" : "",
                  ].join(" ")
                }
              >
                <span className="-mt-7 grid size-14 place-items-center rounded-full bg-accent text-on-accent ring-[6px] ring-ground lg:m-0 lg:size-auto lg:bg-transparent lg:ring-0">
                  <Icon name={item.icon} className="size-7 lg:size-5" />
                </span>
                {t(item.labelKey)}
              </NavLink>
            </li>
          ) : (
            <li key={item.to}>
              <NavLink
                to={item.to}
                end={item.to === "/"}
                className={({ isActive }) => [BASE, isActive ? ACTIVE : "text-muted"].join(" ")}
              >
                <Icon name={item.icon} className="size-6 lg:size-5" />
                {t(item.labelKey)}
              </NavLink>
            </li>
          ),
        )}
      </ul>
    </nav>
  );
}
