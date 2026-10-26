import { OptionGroup, type OptionGroupProps } from "./OptionGroup";

/** Two or three views or modes: «По местам / По видам», «Оформление». */
export function SegmentedControl<V extends string>(props: OptionGroupProps<V>) {
  return <OptionGroup {...props} look="segments" />;
}
