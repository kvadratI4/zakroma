import type { IconName } from "../shared/ui/Icon";

export interface NavItem {
  to: string;
  labelKey: string;
  icon: IconName;
  /** The central «Добавить» action (on desktop: a button above the list). */
  primary?: true;
}

/**
 * Sections of the app. The set is provisional (operator, 2026-10-23; docs/10-design.md §6):
 * changing the navigation means editing this list.
 */
export const NAV_ITEMS: readonly NavItem[] = [
  { to: "/", labelKey: "nav.stock", icon: "stock" },
  { to: "/expiry", labelKey: "nav.expiry", icon: "clock" },
  { to: "/add", labelKey: "nav.add", icon: "plus", primary: true },
  { to: "/shopping", labelKey: "nav.shopping", icon: "bag" },
  { to: "/family", labelKey: "nav.family", icon: "family" },
];
