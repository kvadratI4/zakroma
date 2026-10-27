import { screen, within } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { renderApp } from "../test/renderApp";

const SECTIONS = [
  { link: "Запасы", path: "/", heading: /добр(ое|ый|ой)/i },
  { link: "Всегда дома", path: "/always", heading: "Всегда дома" },
  { link: "Добавить", path: "/add", heading: "Добавить продукт" },
  { link: "Сроки", path: "/expiry", heading: "Сроки" },
  { link: "Настройки", path: "/settings", heading: "Настройки" },
];

function sectionsNav() {
  return screen.getByRole("navigation", { name: "Разделы" });
}

describe("app shell (AC-3; T-009, AC-7)", () => {
  it("shows five sections with «Добавить» in the middle (10-design §6)", () => {
    renderApp("/");

    const names = within(sectionsNav())
      .getAllByRole("link")
      .map((link) => link.textContent);

    expect(names).toEqual(["Запасы", "Всегда дома", "Добавить", "Сроки", "Настройки"]);
  });

  it("shows the product name and the household in the header", () => {
    renderApp("/");

    const header = screen.getByRole("banner");
    expect(within(header).getByText("Закрома")).toBeInTheDocument();
    expect(within(header).getByText("Мой дом")).toBeInTheDocument();
  });

  it.each(SECTIONS)("opens «$link» and marks it as current", async ({ link, heading }) => {
    const { user } = renderApp("/settings");

    await user.click(within(sectionsNav()).getByRole("link", { name: link }));

    expect(screen.getByRole("heading", { level: 1, name: heading })).toBeInTheDocument();
    for (const other of SECTIONS) {
      const item = within(sectionsNav()).getByRole("link", { name: other.link });
      if (other.link === link) expect(item).toHaveAttribute("aria-current", "page");
      else expect(item).not.toHaveAttribute("aria-current");
    }
  });

  it.each(SECTIONS)("opens $path directly", ({ path, heading }) => {
    renderApp(path);

    expect(screen.getByRole("heading", { level: 1, name: heading })).toBeInTheDocument();
  });

  it("shows «not found» with a way back for an unknown path", async () => {
    const { user } = renderApp("/no-such-page");

    expect(
      screen.getByRole("heading", { level: 1, name: "Такой страницы нет" }),
    ).toBeInTheDocument();
    await user.click(screen.getByRole("link", { name: "К запасам" }));
    expect(screen.getByRole("heading", { level: 1, name: /добр(ое|ый|ой)/i })).toBeInTheDocument();
  });

  it("offers the first action right where the stock will appear", async () => {
    const { user } = renderApp("/");

    await user.click(screen.getByRole("link", { name: "Добавить продукт" }));

    expect(screen.getByRole("heading", { level: 1, name: "Добавить продукт" })).toBeInTheDocument();
  });

  it("gives every icon-only control an accessible name (AC-7)", () => {
    renderApp("/");

    for (const control of [...screen.getAllByRole("link"), ...screen.queryAllByRole("button")]) {
      expect(control).toHaveAccessibleName();
    }
  });
});
