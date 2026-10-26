import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { useState } from "react";
import { describe, expect, it, vi } from "vitest";

import { ChoiceChips } from "./ChoiceChips";
import { RadioList } from "./RadioList";
import { SegmentedControl } from "./SegmentedControl";
import { Stepper } from "./Stepper";
import { Switch } from "./Switch";

const packets = (n: number) =>
  n === 0.5 ? "½ пакета" : `${String(n)} ${n === 1 ? "пакет" : "пакета"}`;

function MilkStepper({ step = 1 }: { step?: 0.5 | 1 }) {
  const [value, setValue] = useState(2);
  return (
    <Stepper
      label="Сколько"
      value={value}
      onChange={setValue}
      min={step}
      step={step}
      valueText={packets}
      unitText="по 930 мл"
    />
  );
}

describe("Stepper (10-design §7.1)", () => {
  it("is a spinbutton that speaks the measure, not a bare number", () => {
    render(<MilkStepper />);
    const spin = screen.getByRole("spinbutton", { name: "Сколько" });
    expect(spin).toHaveAttribute("aria-valuenow", "2");
    expect(spin).toHaveAttribute("aria-valuetext", "2 пакета");
    expect(screen.getByText("по 930 мл")).toBeInTheDocument();
  });

  it("goes up and down with the buttons and stops at the minimum", async () => {
    render(<MilkStepper />);
    const spin = screen.getByRole("spinbutton", { name: "Сколько" });
    const less = screen.getByRole("button", { name: "Меньше" });

    await userEvent.click(screen.getByRole("button", { name: "Больше" }));
    expect(spin).toHaveAttribute("aria-valuenow", "3");

    await userEvent.click(less);
    await userEvent.click(less);
    await userEvent.click(less);
    expect(spin).toHaveAttribute("aria-valuenow", "1");
    expect(less).toBeDisabled();
  });

  it("follows the arrow keys, by halves when the measure allows it", async () => {
    render(<MilkStepper step={0.5} />);
    const spin = screen.getByRole("spinbutton", { name: "Сколько" });
    spin.focus();

    await userEvent.keyboard("{ArrowDown}{ArrowDown}{ArrowDown}");
    expect(spin).toHaveAttribute("aria-valuenow", "0.5");
    expect(spin).toHaveAttribute("aria-valuetext", "½ пакета");

    await userEvent.keyboard("{ArrowUp}");
    expect(spin).toHaveAttribute("aria-valuenow", "1");
  });
});

const DATES = [
  { value: "3", label: "+3 дня" },
  { value: "7", label: "+7" },
  { value: "date", label: "Дата" },
] as const;

describe("ChoiceChips", () => {
  it("is a radio group: one chip chosen, arrows move the choice", async () => {
    const onChange = vi.fn();
    render(<ChoiceChips label="Годен до" options={DATES} value="7" onChange={onChange} />);

    const group = screen.getByRole("radiogroup", { name: "Годен до" });
    expect(group).toBeInTheDocument();
    expect(screen.getByRole("radio", { name: "+7" })).toBeChecked();

    await userEvent.click(screen.getByRole("radio", { name: "Дата" }));
    expect(onChange).toHaveBeenLastCalledWith("date");
  });

  it("may start with nothing chosen", () => {
    render(
      <ChoiceChips label="Быстрый срок" options={DATES} value={null} onChange={() => undefined} />,
    );
    expect(
      screen.getAllByRole("radio").filter((r) => (r as HTMLInputElement).checked),
    ).toHaveLength(0);
  });
});

describe("SegmentedControl", () => {
  it("switches the view; the label can be hidden but is still spoken", async () => {
    const onChange = vi.fn();
    render(
      <SegmentedControl
        label="Показать"
        hideLabel
        options={[
          { value: "places", label: "По местам" },
          { value: "kinds", label: "По видам" },
        ]}
        value="places"
        onChange={onChange}
      />,
    );
    expect(screen.getByRole("radiogroup", { name: "Показать" })).toBeInTheDocument();
    expect(screen.getByRole("radio", { name: "По местам" })).toBeChecked();

    screen.getByRole("radio", { name: "По местам" }).focus();
    await userEvent.keyboard("{ArrowRight}");
    expect(onChange).toHaveBeenLastCalledWith("kinds");
  });
});

describe("RadioList", () => {
  it("lists the options as rows, one chosen", async () => {
    const onChange = vi.fn();
    render(
      <RadioList
        label="Предлагать сверить запасы"
        options={[
          { value: "14", label: "Раз в 2 недели" },
          { value: "21", label: "Раз в 3 недели" },
          { value: "off", label: "Не предлагать" },
        ]}
        value="21"
        onChange={onChange}
      />,
    );
    expect(screen.getByRole("radio", { name: "Раз в 3 недели" })).toBeChecked();
    await userEvent.click(screen.getByText("Не предлагать"));
    expect(onChange).toHaveBeenLastCalledWith("off");
  });
});

function Norm() {
  const [on, setOn] = useState(true);
  return (
    <Switch
      label="Всегда держать дома"
      description="Когда станет меньше — появится во «Всегда дома»"
      checked={on}
      onChange={setOn}
    />
  );
}

describe("Switch", () => {
  it("is a switch named by its label and described by its explanation", () => {
    render(<Norm />);
    const sw = screen.getByRole("switch", { name: "Всегда держать дома" });
    expect(sw).toHaveAttribute("aria-checked", "true");
    expect(sw).toHaveAccessibleDescription("Когда станет меньше — появится во «Всегда дома»");
  });

  it("toggles with a click, the label and the space key", async () => {
    render(<Norm />);
    const sw = screen.getByRole("switch", { name: "Всегда держать дома" });

    await userEvent.click(sw);
    expect(sw).toHaveAttribute("aria-checked", "false");

    await userEvent.click(screen.getByText("Всегда держать дома"));
    expect(sw).toHaveAttribute("aria-checked", "true");

    sw.focus();
    await userEvent.keyboard(" ");
    expect(sw).toHaveAttribute("aria-checked", "false");
  });
});
