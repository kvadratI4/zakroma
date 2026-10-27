import { OptionGroup, type OptionGroupProps } from "./OptionGroup";

/** Options as rows with a round mark: «Предлагать сверить запасы». */
export function RadioList<V extends string>(props: OptionGroupProps<V>) {
  return <OptionGroup {...props} look="rows" />;
}
