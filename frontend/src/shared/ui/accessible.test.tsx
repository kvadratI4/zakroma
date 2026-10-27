import { render } from "@testing-library/react";
import type { ReactElement } from "react";
import { describe, it } from "vitest";

import { expectAccessible } from "../../test/a11y";
import { ActionPill } from "./ActionPill";
import { Avatar } from "./Avatar";
import { Badge } from "./Badge";
import { Button } from "./Button";
import { ChoiceChips } from "./ChoiceChips";
import { DateField } from "./DateField";
import { IconButton } from "./IconButton";
import { LevelButton } from "./LevelButton";
import { LevelChip } from "./LevelChip";
import { LevelPicker } from "./LevelPicker";
import { Emblem } from "./ornament/Emblem";
import { Izba } from "./ornament/Izba";
import { Window } from "./ornament/Window";
import { ProgressBar } from "./ProgressBar";
import { RadioList } from "./RadioList";
import { SearchField } from "./SearchField";
import { SegmentedControl } from "./SegmentedControl";
import { Select } from "./Select";
import { Skeleton } from "./Skeleton";
import { Stepper } from "./Stepper";
import { Switch } from "./Switch";
import { TextField } from "./TextField";

const noop = () => undefined;
const OPTIONS = [
  { value: "a", label: "По местам" },
  { value: "b", label: "По видам" },
] as const;

/**
 * Every shared component in all its variants passes axe-core (T-008b, AC-4). Structure only:
 * colour contrast of both themes is checked by tokens.test.ts. `a11y.test.tsx` proves the check fails
 * on broken markup.
 */
const SAMPLES: [string, ReactElement][] = [
  ["Button primary", <Button key="b1">Начать</Button>],
  [
    "Button secondary with icon",
    <Button key="b2" variant="secondary" icon="plus">
      Добавить
    </Button>,
  ],
  [
    "Button quiet",
    <Button key="b3" variant="quiet" size="regular">
      Готово
    </Button>,
  ],
  [
    "Button danger",
    <Button key="b4" variant="danger">
      Выйти
    </Button>,
  ],
  [
    "Button loading",
    <Button key="b5" loading>
      Сохранить
    </Button>,
  ],
  [
    "Button disabled",
    <Button key="b6" disabled>
      Начать
    </Button>,
  ],
  ["IconButton", <IconButton key="i1" icon="more" label="Ещё" />],
  ["IconButton bordered", <IconButton key="i2" icon="filter" label="Фильтр" bordered />],
  ["ActionPill", <ActionPill key="a1" label="−1 стакан" />],
  ["ActionPill disabled", <ActionPill key="a2" label="Закончился" disabled />],
  ["TextField", <TextField key="t1" label="Почта" type="email" hint="Например, nina@mail.ru" />],
  [
    "TextField error",
    <TextField key="t2" label="Почта" error="В адресе нет «@»." defaultValue="x" />,
  ],
  ["TextField password", <TextField key="t3" label="Пароль" type="password" revealable />],
  ["SearchField", <SearchField key="s1" label="Найти продукт" value="мол" onChange={noop} />],
  [
    "Select",
    <Select
      key="se"
      label="Куда"
      value="fridge"
      onChange={noop}
      options={[{ value: "fridge", label: "Холодильник" }]}
    />,
  ],
  [
    "DateField",
    <DateField key="d1" label="Годен до" value="2026-11-02" onChange={noop} estimated />,
  ],
  [
    "Stepper",
    <Stepper
      key="st"
      label="Сколько"
      value={2}
      onChange={noop}
      min={1}
      valueText={(n) => `${String(n)} пакета`}
      unitText="по 930 мл"
    />,
  ],
  [
    "ChoiceChips",
    <ChoiceChips key="cc" label="Годен до" options={OPTIONS} value="a" onChange={noop} />,
  ],
  [
    "ChoiceChips empty",
    <ChoiceChips key="ce" label="Годен до" options={OPTIONS} value={null} onChange={noop} />,
  ],
  [
    "SegmentedControl",
    <SegmentedControl
      key="sc"
      label="Показать"
      hideLabel
      options={OPTIONS}
      value="b"
      onChange={noop}
    />,
  ],
  [
    "RadioList",
    <RadioList key="rl" label="Предлагать" options={OPTIONS} value="a" onChange={noop} />,
  ],
  [
    "Switch on",
    <Switch
      key="sw1"
      label="Всегда держать дома"
      description="Появится во «Всегда дома»"
      checked
      onChange={noop}
    />,
  ],
  [
    "Switch off disabled",
    <Switch key="sw2" label="Всегда держать дома" checked={false} onChange={noop} disabled />,
  ],
  ["LevelChip", <LevelChip key="lc" level="critical" />],
  [
    "LevelButton with its picker",
    <div key="lb">
      <LevelButton level="critical" expanded controls="tea-levels" onClick={noop} />
      <LevelPicker
        id="tea-levels"
        label="Сколько осталось: Чай"
        value="critical"
        onChange={noop}
        hint="≈ 5 пакетиков"
      >
        <ActionPill label="−1 пакетик" />
        <ActionPill label="Закончился" />
      </LevelPicker>
    </div>,
  ],
  [
    "Badge",
    <a key="bd" href="/expiry">
      Сроки
      <Badge count={3} label="3 требуют внимания" />
    </a>,
  ],
  [
    "Avatar with the name next to it",
    <span key="av">
      <Avatar name="Ольга" /> Ольга
    </span>,
  ],
  [
    "Skeleton in a busy block",
    <div key="sk" aria-busy="true">
      <Skeleton />
    </div>,
  ],
  [
    "ProgressBar",
    <ProgressBar key="pb" label="Ревизия" value={1} max={4} valueText="Холодильник, 1 из 4" />,
  ],
  [
    "Emblems, window and izba",
    <div key="or">
      <Emblem kind="freezer" />
      <Window />
      <Izba />
    </div>,
  ],
];

describe("shared components pass axe-core", () => {
  it.each(SAMPLES)("%s", async (_name, element) => {
    const { container } = render(element);
    await expectAccessible(container);
  });
});
