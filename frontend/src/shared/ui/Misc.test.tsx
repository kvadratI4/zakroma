import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { Avatar } from "./Avatar";
import { Badge } from "./Badge";
import { Emblem } from "./ornament/Emblem";
import { Izba } from "./ornament/Izba";
import { Spray } from "./ornament/Spray";
import { Window } from "./ornament/Window";
import { ProgressBar } from "./ProgressBar";
import { Skeleton } from "./Skeleton";

describe("Badge", () => {
  it("shows the number and says what it counts", () => {
    render(<Badge count={3} label="3 требуют внимания" />);
    expect(screen.getByText("3")).toHaveAttribute("aria-hidden", "true");
    expect(screen.getByText("3 требуют внимания")).toHaveClass("sr-only");
  });

  it("shows nothing for zero: a badge is only for a queue that needs action", () => {
    const { container } = render(<Badge count={0} label="0 требуют внимания" />);
    expect(container).toBeEmptyDOMElement();
  });
});

describe("Avatar", () => {
  it("shows the first letter and stays out of the spoken text (the name is next to it)", () => {
    render(<Avatar name="Нина Петровна" />);
    expect(screen.getByText("Н")).toHaveAttribute("aria-hidden", "true");
  });
});

describe("Skeleton", () => {
  it("is a grey bar hidden from screen readers", () => {
    const { container } = render(<Skeleton className="h-4 w-40" />);
    const bar = container.firstElementChild;
    expect(bar).toHaveAttribute("aria-hidden", "true");
    expect(bar?.className).toContain("bg-line");
  });
});

describe("ProgressBar", () => {
  it("is a progressbar that says where we are in words", () => {
    render(<ProgressBar label="Ревизия" value={1} max={4} valueText="Холодильник, 1 из 4" />);
    const bar = screen.getByRole("progressbar", { name: "Ревизия" });
    expect(bar).toHaveAttribute("aria-valuenow", "1");
    expect(bar).toHaveAttribute("aria-valuemax", "4");
    expect(bar).toHaveAttribute("aria-valuetext", "Холодильник, 1 из 4");
  });
});

describe("ornament (10-design §5)", () => {
  it.each([
    ["fridge", "kupavka"],
    ["freezer", "snowflake"],
    ["pantry", "ear"],
    ["balcony", "rowan"],
    ["cellar", "kupavka"],
    ["other", "kupavka"],
  ] as const)("the %s emblem is the %s", (kind, motif) => {
    const { container } = render(<Emblem kind={kind} />);
    const svg = container.querySelector("svg");
    expect(svg).toHaveAttribute("data-motif", motif);
    expect(svg).toHaveAttribute("aria-hidden", "true");
  });

  it.each([
    ["Window", <Window key="w" />],
    ["Izba", <Izba key="i" />],
    ["Spray", <Spray key="s" />],
  ])("%s is decorative and drawn in ornament colours only", (_name, element) => {
    const { container } = render(element);
    const svg = container.querySelector("svg");
    expect(svg).toHaveAttribute("aria-hidden", "true");
    expect(svg).toHaveAttribute("focusable", "false");
    const classes = [...container.querySelectorAll("[class]")].map(
      (node) => node.getAttribute("class") ?? "",
    );
    expect(classes.join(" ")).toMatch(/(fill|stroke)-ornament/);
    expect(container.innerHTML).not.toMatch(/#[0-9a-f]{3,6}/i);
  });

  it("draws the leaves of the sprig in the leaf colour (Khokhloma green in the dark theme)", () => {
    const { container } = render(<Spray />);
    expect(container.querySelector(".fill-ornament-leaf")).not.toBeNull();
  });
});
