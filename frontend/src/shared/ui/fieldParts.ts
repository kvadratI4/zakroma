/** Ids of the texts that describe a field: the error first, then the hint. */
export function describedBy(id: string, hint?: string, error?: string): string | undefined {
  const ids = [error ? `${id}-error` : "", hint ? `${id}-hint` : ""].filter(Boolean);
  return ids.length > 0 ? ids.join(" ") : undefined;
}

/** The box around an input: 52px, rounded, a stronger outline; red when the value is wrong. */
export const FIELD_BOX =
  "flex min-h-[52px] items-center gap-2 rounded-[14px] border-[1.5px] bg-raised px-3.5 text-[17px] text-ink focus-within:border-accent";
