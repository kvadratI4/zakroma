import { OptionGroup, type OptionGroupProps } from "./OptionGroup";

/** Quick choices: «+3 дня · +7 · +14 · Дата», «1 сетка · 3 кг» (10-design §7.1). */
export function ChoiceChips<V extends string>(props: OptionGroupProps<V>) {
  return <OptionGroup {...props} look="chips" />;
}
