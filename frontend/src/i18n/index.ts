import i18n from "i18next";
import { initReactI18next } from "react-i18next";

import add from "./ru/add.json";
import always from "./ru/always.json";
import common from "./ru/common.json";
import expiry from "./ru/expiry.json";
import settings from "./ru/settings.json";
import stock from "./ru/stock.json";

export const DEFAULT_LANGUAGE = "ru";

// One namespace; keys follow `<feature>.<area>.<name>` (docs/agent/CONVENTIONS.md).
export const resources = {
  ru: { translation: { ...common, stock, always, add, expiry, settings } },
} as const;

void i18n.use(initReactI18next).init({
  lng: DEFAULT_LANGUAGE,
  fallbackLng: DEFAULT_LANGUAGE,
  resources,
  interpolation: { escapeValue: false },
  initAsync: false,
});

export default i18n;
