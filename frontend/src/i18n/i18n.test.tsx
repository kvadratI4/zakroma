import { screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";

import { renderApp } from "../test/renderApp";
import i18n, { DEFAULT_LANGUAGE } from ".";

const CYRILLIC = /[а-яё]/i;

afterEach(async () => {
  await i18n.changeLanguage(DEFAULT_LANGUAGE);
});

describe("interface texts come from i18n resources (AC-4)", () => {
  it.each(["/", "/always", "/add", "/expiry", "/settings", "/missing"])(
    "%s has no Cyrillic outside the resources",
    async (path) => {
      await i18n.changeLanguage("cimode"); // t() returns keys instead of texts
      renderApp(path);

      expect(screen.getByRole("main")).toBeInTheDocument();
      expect(document.body.textContent).not.toMatch(CYRILLIC);
      const labelled = document.body.querySelectorAll("[aria-label], [title], [alt]");
      for (const element of labelled) {
        for (const name of ["aria-label", "title", "alt"]) {
          expect(element.getAttribute(name) ?? "").not.toMatch(CYRILLIC);
        }
      }
    },
  );
});

describe("Russian plurals", () => {
  it.each([
    [1, "1 день"],
    [2, "2 дня"],
    [5, "5 дней"],
    [11, "11 дней"],
    [21, "21 день"],
    [24, "24 дня"],
  ])("%d → %s", (count, expected) => {
    expect(i18n.t("common.days", { count })).toBe(expected);
  });
});
