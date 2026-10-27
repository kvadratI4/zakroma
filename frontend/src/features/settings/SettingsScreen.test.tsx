import { screen, within } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";

import { THEME_STORAGE_KEY } from "../../shared/theme/themeBoot";
import { expectAccessible } from "../../test/a11y";
import { renderApp } from "../../test/renderApp";

afterEach(() => {
  localStorage.clear();
  delete document.documentElement.dataset.theme;
});

function appearance() {
  const mine = screen.getByRole("region", { name: "Мои настройки" });
  return within(mine).getByRole("radiogroup", { name: "Оформление" });
}

describe("«Настройки → Мои настройки → Оформление» (T-009, AC-1…AC-3, AC-7)", () => {
  it("offers three visible options, «as on the device» by default", () => {
    renderApp("/settings");

    const options = within(appearance()).getAllByRole("radio");

    expect(options.map((option) => option.closest("label")?.textContent)).toEqual([
      "Как на устройстве",
      "Светлое",
      "Тёмное",
    ]);
    expect(within(appearance()).getByRole("radio", { name: "Как на устройстве" })).toBeChecked();
  });

  it("switches the theme at once and keeps it on the device", async () => {
    const { user } = renderApp("/settings");

    await user.click(within(appearance()).getByRole("radio", { name: "Тёмное" }));

    expect(within(appearance()).getByRole("radio", { name: "Тёмное" })).toBeChecked();
    expect(document.documentElement.dataset.theme).toBe("dark");
    expect(localStorage.getItem(THEME_STORAGE_KEY)).toBe("dark");
  });

  it("can be changed from the keyboard", async () => {
    const { user } = renderApp("/settings");
    await user.click(within(appearance()).getByRole("radio", { name: "Как на устройстве" }));

    await user.keyboard("{ArrowRight}");

    expect(within(appearance()).getByRole("radio", { name: "Светлое" })).toBeChecked();
    expect(document.documentElement.dataset.theme).toBe("light");
    expect(localStorage.getItem(THEME_STORAGE_KEY)).toBe("light");
  });

  it("shows the kept choice when the app is opened again", () => {
    localStorage.setItem(THEME_STORAGE_KEY, "light");

    renderApp("/settings");

    expect(within(appearance()).getByRole("radio", { name: "Светлое" })).toBeChecked();
  });

  it("has no accessibility violations", async () => {
    const { container } = renderApp("/settings");

    await expectAccessible(container);
  });
});
