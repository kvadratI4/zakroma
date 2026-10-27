import type { IconName } from "../shared/ui/Icon";

export interface NavItem {
  to: string;
  labelKey: string;
  icon: IconName;
  /** The central «Добавить» action (on desktop: a button above the list). */
  primary?: true;
}

/**
 * Sections of the app. The set is provisional (operator, 2026-10-23; docs/10-design.md §6;
 * «Всегда дома» and «Настройки» — 2026-10-26, in code since T-009): changing the navigation means
 * editing this list.
 */
export const NAV_ITEMS: readonly NavItem[] = [
  { to: "/", labelKey: "nav.stock", icon: "stock" },
  { to: "/always", labelKey: "nav.always", icon: "bag" },
  { to: "/add", labelKey: "nav.add", icon: "plus", primary: true },
  { to: "/expiry", labelKey: "nav.expiry", icon: "clock" },
  { to: "/settings", labelKey: "nav.settings", icon: "gear" },
];
