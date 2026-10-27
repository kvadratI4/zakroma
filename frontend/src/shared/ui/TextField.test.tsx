import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { useState } from "react";
import { describe, expect, it, vi } from "vitest";

import { DateField } from "./DateField";
import { SearchField } from "./SearchField";
import { Select } from "./Select";
import { TextField } from "./TextField";

describe("TextField (10-design §7.1)", () => {
  it("is found by its label and describes itself with the hint", () => {
    render(<TextField label="Почта" hint="На неё ничего не придёт" type="email" />);
    const field = screen.getByLabelText("Почта");
    expect(field).toHaveAttribute("type", "email");
    expect(field).toHaveAccessibleDescription("На неё ничего не придёт");
    expect(field).not.toHaveAttribute("aria-invalid");
  });

  it("shows an error in words, marks the field invalid and reads the error first", () => {
    render(
      <TextField
        label="Почта"
        hint="Например, nina@mail.ru"
        error="В адресе нет «@»."
        defaultValue="nina.mail.ru"
      />,
    );
    const field = screen.getByLabelText("Почта");
    expect(field).toHaveAttribute("aria-invalid", "true");
    expect(field).toHaveAccessibleDescription("В адресе нет «@». Например, nina@mail.ru");
  });

  it("lets the person show and hide a password", async () => {
    render(<TextField label="Пароль" type="password" revealable defaultValue="x" />);
    const field = screen.getByLabelText("Пароль");
    expect(field).toHaveAttribute("type", "password");

    await userEvent.click(screen.getByRole("button", { name: "Показать" }));
    expect(field).toHaveAttribute("type", "text");

    await userEvent.click(screen.getByRole("button", { name: "Скрыть" }));
    expect(field).toHaveAttribute("type", "password");
  });
});

function ControlledSearch() {
  const [q, setQ] = useState("");
  return (
    <SearchField label="Найти продукт" placeholder="Молоко, хлеб…" value={q} onChange={setQ} />
  );
}

describe("SearchField", () => {
  it("is a search box; «Очистить» appears while typing, clears and keeps the focus", async () => {
    render(<ControlledSearch />);
    const box = screen.getByRole("searchbox", { name: "Найти продукт" });
    expect(screen.queryByRole("button", { name: "Очистить" })).not.toBeInTheDocument();

    await userEvent.type(box, "мол");
    await userEvent.click(screen.getByRole("button", { name: "Очистить" }));

    expect(box).toHaveValue("");
    expect(box).toHaveFocus();
    expect(screen.queryByRole("button", { name: "Очистить" })).not.toBeInTheDocument();
  });
});

describe("Select", () => {
  it("is a native list named by its label and reports the choice", async () => {
    const onChange = vi.fn();
    render(
      <Select
        label="Куда"
        value="fridge"
        onChange={onChange}
        options={[
          { value: "fridge", label: "Холодильник" },
          { value: "balcony", label: "Балкон" },
        ]}
      />,
    );
    const list = screen.getByRole("combobox", { name: "Куда" });
    expect(list).toHaveValue("fridge");

    await userEvent.selectOptions(list, "Балкон");

    expect(onChange).toHaveBeenCalledWith("balcony");
  });
});

describe("DateField", () => {
  it("is a native date input; an estimated date says so in its description", () => {
    render(
      <DateField
        label="Годен до"
        value="2026-11-02"
        onChange={() => undefined}
        estimated
        hint="Обычно хранится неделю."
      />,
    );
    const field = screen.getByLabelText("Годен до");
    expect(field).toHaveAttribute("type", "date");
    expect(field).toHaveValue("2026-11-02");
    expect(field).toHaveAccessibleDescription(
      "Примерно, по обычному сроку. Обычно хранится неделю.",
    );
  });
});
