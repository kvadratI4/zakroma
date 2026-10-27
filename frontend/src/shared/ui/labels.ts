/**
 * A write-off says how much and of what: a minus sign, a number (or ½) and a measure —
 * «−1 стакан», «−½ пачки», «−4 пакетика на всех». Other actions are a word: «Закончился», «Купили»
 * (docs/05-domain-rules.md §5.2).
 */
const WRITE_OFF = /^−(\d+|½) \S/u;

export function isActionLabel(label: string): boolean {
  if (label.startsWith("−")) return WRITE_OFF.test(label);
  return label.length > 0 && !label.startsWith("-");
}
