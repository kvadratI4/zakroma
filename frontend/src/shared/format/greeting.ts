export type GreetingKey = "morning" | "day" | "evening" | "night";

/** Part of the day for the greeting, by the device's local time. */
export function greetingKey(now: Date): GreetingKey {
  const hour = now.getHours();
  if (hour >= 5 && hour < 12) return "morning";
  if (hour >= 12 && hour < 17) return "day";
  if (hour >= 17 && hour < 23) return "evening";
  return "night";
}
