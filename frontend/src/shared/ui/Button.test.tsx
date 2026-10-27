import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";

import { ActionPill } from "./ActionPill";
import { Button } from "./Button";
import { IconButton } from "./IconButton";

describe("Button (10-design §7.1)", () => {
  it("is a button named by its text and calls onClick", async () => {
    const onClick = vi.fn();
    render(<Button onClick={onClick}>Добавить молоко</Button>);

    await userEvent.click(screen.getByRole("button", { name: "Добавить молоко" }));

    expect(onClick).toHaveBeenCalledOnce();
  });

  it("is type=button unless told otherwise, so it never submits a form by accident", () => {
    render(<Button>Начать</Button>);
    expect(screen.getByRole("button")).toHaveAttribute("type", "button");
  });

  it("while loading stays focusable, reports busy and ignores clicks", async () => {
    const onClick = vi.fn();
    render(
      <Button loading onClick={onClick}>
        Сохранить 3 продукта
      </Button>,
    );
    const button = screen.getByRole("button", { name: "Сохранить 3 продукта" });

    await userEvent.click(button);

    expect(button).toHaveAttribute("aria-busy", "true");
    expect(button).toHaveAttribute("aria-disabled", "true");
    expect(button).not.toBeDisabled();
    expect(onClick).not.toHaveBeenCalled();
  });

  it("when disabled does not react", async () => {
    const onClick = vi.fn();
    render(
      <Button disabled onClick={onClick}>
        Начать
      </Button>,
    );
    await userEvent.click(screen.getByRole("button"));
    expect(onClick).not.toHaveBeenCalled();
  });

  it.each(["primary", "secondary", "quiet", "danger"] as const)(
    "variant %s keeps a 44px target and a visible focus ring",
    (variant) => {
      render(<Button variant={variant}>Начать</Button>);
      const button = screen.getByRole("button");
      expect(button.className).toMatch(/(^|\s)min-h-(11|12|\[54px\])(\s|$)/);
      expect(button.className).toMatch(/focus-visible:outline/);
    },
  );
});

describe("IconButton", () => {
  it("is named by its label, the icon itself is hidden", () => {
    render(<IconButton icon="search" label="Поиск" />);
    const button = screen.getByRole("button", { name: "Поиск" });
    expect(button.querySelector("svg")).toHaveAttribute("aria-hidden", "true");
    expect(button.className).toMatch(/\bsize-11\b/);
  });
});

describe("ActionPill", () => {
  it.each(["−1 стакан", "−½ пачки", "−4 пакетика на всех", "Закончился", "Купили", "Добавить"])(
    "accepts the label «%s»",
    (label) => {
      render(<ActionPill label={label} />);
      expect(screen.getByRole("button", { name: label })).toBeInTheDocument();
    },
  );

  it.each(["−½", "−", "-1 стакан", "−1"])(
    "rejects «%s»: a write-off names a number and a measure",
    (label) => {
      vi.spyOn(console, "error").mockImplementation(() => undefined);
      expect(() => render(<ActionPill label={label} />)).toThrow(/measure/);
    },
  );

  it("is disabled offline with the reason given elsewhere on the screen", () => {
    render(<ActionPill label="−1 стакан" disabled />);
    expect(screen.getByRole("button", { name: "−1 стакан" })).toBeDisabled();
  });
});
