import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { useState } from "react";
import { describe, expect, it, vi } from "vitest";

import { LEVELS, type Level } from "../theme/tokens";
import { LevelButton } from "./LevelButton";
import { LevelChip } from "./LevelChip";
import { LevelPicker } from "./LevelPicker";

const WORDS: Record<Level, string> = {
  out: "Нет",
  critical: "Почти нет",
  low: "Мало",
  normal: "Нормально",
  plenty: "Много",
  excess: "Избыток",
};

describe("LevelChip (10-design §2, «Уровни запаса»)", () => {
  it.each(LEVELS)("%s: the word is always shown, with the level's tone and a dot", (level) => {
    render(<LevelChip level={level} />);
    const chip = screen.getByText(WORDS[level]);
    expect(chip.className).toContain(`bg-level-${level}-bg`);
    expect(chip.className).toContain(`text-level-${level}-ink`);
    expect(chip.querySelector("[aria-hidden='true']")).not.toBeNull();
  });
});

describe("LevelButton", () => {
  it("is named «Уровень: Мало. Изменить» and reports whether the picker is open", async () => {
    const onClick = vi.fn();
    const { rerender } = render(
      <LevelButton level="low" expanded={false} controls="p1" onClick={onClick} />,
    );
    const button = screen.getByRole("button", { name: "Уровень: Мало. Изменить" });
    expect(button).toHaveAttribute("aria-expanded", "false");
    expect(button).toHaveAttribute("aria-controls", "p1");
    expect(within(button).getByText("Мало")).toBeInTheDocument();

    await userEvent.click(button);
    expect(onClick).toHaveBeenCalledOnce();

    rerender(<LevelButton level="low" expanded controls="p1" onClick={onClick} />);
    expect(button).toHaveAttribute("aria-expanded", "true");
  });
});

function TeaPicker() {
  const [level, setLevel] = useState<Level>("critical");
  return (
    <LevelPicker
      label="Сколько осталось: Чай в пакетиках"
      value={level}
      onChange={setLevel}
      hint="≈ 5 пакетиков"
    />
  );
}

describe("LevelPicker (07-ui-ux §3.4)", () => {
  it("offers the six levels in order as radios, the current one chosen", () => {
    render(<TeaPicker />);
    const group = screen.getByRole("radiogroup", { name: "Сколько осталось: Чай в пакетиках" });
    const names = within(group)
      .getAllByRole("radio")
      .map((radio) => radio.closest("label")?.textContent);
    expect(names).toEqual(LEVELS.map((level) => WORDS[level]));
    expect(screen.getByRole("radio", { name: "Почти нет" })).toBeChecked();
    expect(screen.getByText("≈ 5 пакетиков")).toBeInTheDocument();
  });

  it("colours only the chosen level; the others are neutral, without a dot (round 2 of T-008a)", () => {
    render(<TeaPicker />);
    const chosen = screen.getByRole("radio", { name: "Почти нет" }).closest("label");
    const other = screen.getByRole("radio", { name: "Мало" }).closest("label");

    expect(chosen?.className).toContain("bg-level-critical-bg");
    expect(chosen?.querySelector("svg")).not.toBeNull();
    expect(other?.className).not.toMatch(/bg-level-/);
    expect(other?.querySelector("svg, [data-dot]")).toBeNull();
  });

  it("changes with a click and with the arrow keys", async () => {
    render(<TeaPicker />);
    await userEvent.click(screen.getByText("Нормально"));
    expect(screen.getByRole("radio", { name: "Нормально" })).toBeChecked();

    await userEvent.keyboard("{ArrowRight}");
    expect(screen.getByRole("radio", { name: "Много" })).toBeChecked();
  });
});
