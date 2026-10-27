import { screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { expectAccessible } from "../test/a11y";
import { renderApp } from "../test/renderApp";

describe("component showcase /dev/ui (T-008b, AC-5)", () => {
  it("is served in the dev build with every group of components", async () => {
    renderApp("/dev/ui");

    expect(
      await screen.findByRole("heading", { level: 1, name: "Витрина компонентов" }),
    ).toBeInTheDocument();
    for (const group of ["Кнопки", "Поля", "Выбор", "Уровни", "Значки и роспись"]) {
      expect(screen.getByRole("heading", { level: 2, name: group })).toBeInTheDocument();
    }
  });

  it("switches its own preview between the light and the dark theme", async () => {
    const { user } = renderApp("/dev/ui");
    await screen.findByRole("heading", { level: 1, name: "Витрина компонентов" });

    await user.click(screen.getByRole("radio", { name: "Тёмная" }));
    expect(document.documentElement.dataset.theme).toBe("dark");

    await user.click(screen.getByRole("radio", { name: "Светлая" }));
    expect(document.documentElement.dataset.theme).toBe("light");
  });

  it("passes axe-core as a whole page of components", async () => {
    const { container } = renderApp("/dev/ui");
    await screen.findByRole("heading", { level: 1, name: "Витрина компонентов" });
    await expectAccessible(container);
  });
});
