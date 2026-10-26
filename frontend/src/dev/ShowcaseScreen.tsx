import { useState, type ReactNode } from "react";
import { useTranslation } from "react-i18next";

import i18n from "../i18n";
import type { Level, ThemeName } from "../shared/theme/tokens";
import { LEVELS } from "../shared/theme/tokens";
import { ActionPill } from "../shared/ui/ActionPill";
import { Avatar } from "../shared/ui/Avatar";
import { Badge } from "../shared/ui/Badge";
import { Button } from "../shared/ui/Button";
import { ChoiceChips } from "../shared/ui/ChoiceChips";
import { DateField } from "../shared/ui/DateField";
import { IconButton } from "../shared/ui/IconButton";
import { LevelButton } from "../shared/ui/LevelButton";
import { LevelChip } from "../shared/ui/LevelChip";
import { LevelPicker } from "../shared/ui/LevelPicker";
import { Emblem, type PlaceKind } from "../shared/ui/ornament/Emblem";
import { Izba } from "../shared/ui/ornament/Izba";
import { Kayma } from "../shared/ui/ornament/Kayma";
import { Spray } from "../shared/ui/ornament/Spray";
import { Window } from "../shared/ui/ornament/Window";
import { ProgressBar } from "../shared/ui/ProgressBar";
import { RadioList } from "../shared/ui/RadioList";
import { SearchField } from "../shared/ui/SearchField";
import { SegmentedControl } from "../shared/ui/SegmentedControl";
import { Select } from "../shared/ui/Select";
import { Skeleton } from "../shared/ui/Skeleton";
import { Stepper } from "../shared/ui/Stepper";
import { Switch } from "../shared/ui/Switch";
import { TextField } from "../shared/ui/TextField";
import showcase from "./showcase.ru.json";

// The showcase's own texts stay out of the production bundle: this module is imported only in dev.
i18n.addResourceBundle("ru", "translation", { dev: showcase }, true, true);

/** Marker the build checks look for: it must never appear in the production bundle (T-008b, AC-5). */
const MARKER = "zakroma-dev-showcase";

const PLACES: PlaceKind[] = ["fridge", "freezer", "pantry", "balcony", "cellar", "other"];

function Group({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="grid gap-4 rounded-[20px] bg-surface p-5">
      <h2 className="text-xl font-semibold text-ink">{title}</h2>
      {children}
    </section>
  );
}

function Row({ children }: { children: ReactNode }) {
  return <div className="flex flex-wrap items-center gap-3">{children}</div>;
}

/** /dev/ui: every base component in every state, in both themes (dev build only). */
export function ShowcaseScreen() {
  const { t } = useTranslation();
  const s = (key: string, options: Record<string, unknown> = {}) =>
    t(`dev.samples.${key}`, options);
  const [theme, setTheme] = useState<ThemeName>(
    document.documentElement.dataset.theme === "dark" ? "dark" : "light",
  );
  const [query, setQuery] = useState("мол");
  const [place, setPlace] = useState<PlaceKind>("fridge");
  const [until, setUntil] = useState("2026-11-02");
  const [packs, setPacks] = useState(2);
  const [curd, setCurd] = useState(0.5);
  const [quick, setQuick] = useState<string | null>("7");
  const [view, setView] = useState("places");
  const [period, setPeriod] = useState("21");
  const [norm, setNorm] = useState(true);
  const [level, setLevel] = useState<Level>("critical");
  const [open, setOpen] = useState(true);

  const chooseTheme = (next: ThemeName) => {
    setTheme(next);
    document.documentElement.dataset.theme = next;
  };

  return (
    <main id={MARKER} className="mx-auto grid max-w-5xl gap-6 bg-ground px-4 py-8 text-ink lg:px-8">
      <header className="grid gap-3">
        <h1 className="font-display text-[36px] leading-none">{t("dev.title")}</h1>
        <p>{t("dev.intro")}</p>
        <SegmentedControl
          label={t("dev.theme.label")}
          options={[
            { value: "light", label: t("dev.theme.light") },
            { value: "dark", label: t("dev.theme.dark") },
          ]}
          value={theme}
          onChange={chooseTheme}
        />
      </header>
      <Kayma />

      <Group title={t("dev.groups.buttons")}>
        <Row>
          <Button>{s("start")}</Button>
          <Button variant="secondary">{s("notNow")}</Button>
          <Button variant="quiet" size="regular">
            {s("done")}
          </Button>
          <Button variant="danger">{s("logOut")}</Button>
        </Row>
        <Row>
          <Button icon="plus">{s("addMilk")}</Button>
          <Button loading>{s("save")}</Button>
          <Button disabled>{s("start")}</Button>
        </Row>
        <Row>
          <IconButton icon="search" label={s("search")} />
          <IconButton icon="filter" label={s("filter")} bordered />
          <IconButton icon="more" label={s("more")} />
          <IconButton icon="close" label={s("close")} bordered />
        </Row>
        <Row>
          <ActionPill label={s("glass")} />
          <ActionPill label={s("halfPack")} />
          <ActionPill label={s("forAll")} />
          <ActionPill label={s("outTea")} />
          <ActionPill label={s("bought")} />
          <ActionPill label={s("add")} icon="plus" />
          <ActionPill label={s("glass")} disabled />
        </Row>
      </Group>

      <Group title={t("dev.groups.fields")}>
        <div className="grid gap-4 lg:grid-cols-2">
          <TextField label={s("email")} type="email" hint={s("emailHint")} />
          <TextField
            label={s("email")}
            type="email"
            error={s("emailError")}
            defaultValue="nina.petrovna.mail.ru"
          />
          <TextField label={s("password")} type="password" revealable defaultValue="zakroma" />
          <SearchField
            label={s("findProduct")}
            placeholder={s("searchExample")}
            value={query}
            onChange={setQuery}
          />
          <Select
            label={s("where")}
            value={place}
            onChange={setPlace}
            leading={<Emblem kind={place} className="size-7" />}
            options={[
              { value: "fridge", label: s("fridge") },
              { value: "freezer", label: s("freezer") },
              { value: "pantry", label: s("pantry") },
              { value: "balcony", label: s("balcony") },
            ]}
          />
          <DateField
            label={s("until")}
            value={until}
            onChange={setUntil}
            estimated
            hint={s("usualWeek")}
          />
        </div>
      </Group>

      <Group title={t("dev.groups.choice")}>
        <div className="grid gap-5 lg:grid-cols-2">
          <Stepper
            label={s("howMany")}
            value={packs}
            onChange={setPacks}
            min={1}
            valueText={(n) => s("packs", { count: n })}
            unitText={s("perPack")}
          />
          <Stepper
            label={s("curd")}
            value={curd}
            onChange={setCurd}
            min={0.5}
            step={0.5}
            valueText={(n) => (n === 0.5 ? s("halfOfPack") : s("packOfCurd", { count: n }))}
          />
          <ChoiceChips
            label={s("until")}
            options={[
              { value: "3", label: s("plus3") },
              { value: "7", label: s("plus7") },
              { value: "14", label: s("plus14") },
              { value: "30", label: s("plus30") },
              { value: "date", label: s("date") },
            ]}
            value={quick}
            onChange={setQuick}
          />
          <SegmentedControl
            label={s("show")}
            hideLabel
            options={[
              { value: "places", label: s("byPlaces") },
              { value: "kinds", label: s("byKinds") },
            ]}
            value={view}
            onChange={setView}
          />
          <RadioList
            label={s("revision")}
            options={[
              { value: "7", label: s("weekly") },
              { value: "14", label: s("every2") },
              { value: "21", label: s("every3") },
              { value: "28", label: s("monthly") },
              { value: "off", label: s("never") },
            ]}
            value={period}
            onChange={setPeriod}
          />
          <Switch label={s("norm")} description={s("normHint")} checked={norm} onChange={setNorm} />
        </div>
      </Group>

      <Group title={t("dev.groups.levels")}>
        <Row>
          {LEVELS.map((l) => (
            <LevelChip key={l} level={l} />
          ))}
        </Row>
        <div className="grid max-w-sm gap-2 rounded-xl bg-raised p-3">
          <div className="flex justify-end">
            <LevelButton
              level={level}
              expanded={open}
              controls="showcase-tea"
              onClick={() => setOpen((v) => !v)}
            />
          </div>
          {open && (
            <LevelPicker
              id="showcase-tea"
              label={s("teaLeft")}
              value={level}
              onChange={setLevel}
              hint={s("teaHint")}
            >
              <ActionPill label={s("packet")} />
              <ActionPill label={s("forAll")} />
              <ActionPill label={s("outTea")} />
              <ActionPill label={s("throwAway")} />
            </LevelPicker>
          )}
        </div>
      </Group>

      <Group title={t("dev.groups.misc")}>
        <Row>
          <span className="inline-flex items-center gap-2">
            {s("expiry")}
            <Badge count={3} label={s("badgeLabel")} />
          </span>
          <span className="inline-flex items-center gap-2">
            <Avatar name={s("member")} />
            {s("member")}
          </span>
        </Row>
        <div
          role="group"
          aria-busy="true"
          aria-label={s("loading")}
          className="grid max-w-sm gap-2 rounded-xl bg-raised p-3"
        >
          <Skeleton className="h-[18px] w-40" />
          <Skeleton className="h-3.5 w-24" />
        </div>
        <ProgressBar
          label={s("revisionProgress")}
          value={1}
          max={4}
          valueText={s("revisionStep")}
        />
        <Row>
          {PLACES.map((kind) => (
            <Emblem key={kind} kind={kind} className="size-14" />
          ))}
        </Row>
        <Row>
          <Spray className="size-36" />
          <Window className="h-40 w-36" />
          <Izba className="h-36 w-44" />
        </Row>
      </Group>
    </main>
  );
}
