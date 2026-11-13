import { describe, expect, it } from "vitest";

import { formatClock } from "@/features/explore/exploreTiming";

describe("formatClock", () => {
  it.each([
    [75, "1:15"],
    [5, "0:05"],
    [75.9, "1:15"],
    [600, "10:00"],
    [-3, "0:00"],
  ])("writes %s s as %s", (seconds, text) => {
    expect(formatClock(seconds)).toBe(text);
  });
});
