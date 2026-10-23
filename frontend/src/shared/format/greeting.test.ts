import { describe, expect, it } from "vitest";

import { greetingKey } from "./greeting";

describe("greetingKey", () => {
  it.each([
    ["2026-10-24T04:59:00", "night"],
    ["2026-10-24T05:00:00", "morning"],
    ["2026-10-24T11:59:00", "morning"],
    ["2026-10-24T12:00:00", "day"],
    ["2026-10-24T16:59:00", "day"],
    ["2026-10-24T17:00:00", "evening"],
    ["2026-10-24T22:59:00", "evening"],
    ["2026-10-24T23:00:00", "night"],
  ])("%s → %s", (iso, expected) => {
    expect(greetingKey(new Date(iso))).toBe(expected);
  });
});
