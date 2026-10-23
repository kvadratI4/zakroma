import { screen, within } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { renderApp } from "../test/renderApp";

const SECTIONS = [
  { link: "Запасы", path: "/", heading: /добр(ое|ый|ой)/i },
  { link: "Сроки", path: "/expiry", heading: "Сроки" },
  { link: "Добавить", path: "/add", heading: "Добавить продукт" },
  { link: "Покупки", path: "/shopping", heading: "Покупки" },
  { link: "Семья", path: "/family", heading: "Семья" },
];

function sectionsNav() {
  return screen.getByRole("navigation", { name: "Разделы" });
}

describe("app shell (AC-3)", () => {
  it("shows five sections with «Добавить» in the middle", () => {
    renderApp("/");

    const names = within(sectionsNav())
      .getAllByRole("link")
      .map((link) => link.textContent);

    expect(names).toEqual(["Запасы", "Сроки", "Добавить", "Покупки", "Семья"]);
  });

  it("shows the product name and the household in the header", () => {
    renderApp("/");

    const header = screen.getByRole("banner");
    expect(within(header).getByText("Закрома")).toBeInTheDocument();
    expect(within(header).getByText("Мой дом")).toBeInTheDocument();
  });

  it.each(SECTIONS)("opens «$link» and marks it as current", async ({ link, heading }) => {
    const { user } = renderApp("/family");

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

  it("gives every icon-only control an accessible name (AC-7)", () => {
    renderApp("/");

    for (const control of [...screen.getAllByRole("link"), ...screen.queryAllByRole("button")]) {
      expect(control).toHaveAccessibleName();
    }
  });
});
