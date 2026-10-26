import { render } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { expectAccessible } from "./a11y";

describe("expectAccessible", () => {
  it("passes a named button, a labelled field, a native radio group and a switch", async () => {
    const { container } = render(
      <div>
        <button type="button">Добавить молоко</button>
        <label htmlFor="q">Найти продукт</label>
        <input id="q" type="search" />
        <fieldset>
          <legend>Уровень</legend>
          <label>
            <input type="radio" name="level" value="low" defaultChecked /> Мало
          </label>
          <label>
            <input type="radio" name="level" value="normal" /> Нормально
          </label>
        </fieldset>
        <button type="button" role="switch" aria-checked="true">
          Всегда держать дома
        </button>
      </div>,
    );
    await expectAccessible(container);
  });

  it("fails on an icon button without a name and a field without a label", async () => {
    const { container } = render(
      <div>
        <button type="button">
          <svg aria-hidden="true" />
        </button>
        <input type="text" />
      </div>,
    );
    await expect(expectAccessible(container)).rejects.toThrow(
      /button-name[\s\S]*label|label[\s\S]*button-name/,
    );
  });

  it("fails on a switch without its state", async () => {
    const { container } = render(
      // eslint-disable-next-line jsx-a11y/role-has-required-aria-props -- the broken markup is the point of this test
      <button type="button" role="switch">
        Норма дома
      </button>,
    );
    await expect(expectAccessible(container)).rejects.toThrow(/aria-required-attr/);
  });
});
