import { describe, expect, it } from "vitest";

import { nextPlannedPass } from "@/features/frames/nextPlannedPass";

const pass = (date: string) => ({ date, hasCrossPol: true });

describe("nextPlannedPass", () => {
  it("finds the earliest future pass in unsorted input", () => {
    const plan = [pass("2026-12-02"), pass("2026-10-27"), pass("2026-11-20"), pass("2026-11-08")];
    expect(nextPlannedPass(plan, "2026-11-10")?.date).toBe("2026-11-20");
  });

  it("returns undefined when every pass is in the past or the plan is empty", () => {
    expect(nextPlannedPass([pass("2026-10-27"), pass("2026-11-08")], "2026-11-10")).toBeUndefined();
    expect(nextPlannedPass([], "2026-11-10")).toBeUndefined();
  });

  it("skips a pass dated today: next means strictly after today", () => {
    const plan = [pass("2026-11-22"), pass("2026-11-10")];
    expect(nextPlannedPass(plan, "2026-11-10")?.date).toBe("2026-11-22");
    expect(nextPlannedPass([pass("2026-11-10")], "2026-11-10")).toBeUndefined();
  });

  it("returns the item itself, so callers keep its other fields", () => {
    const later = { date: "2026-11-22", hasCrossPol: false };
    expect(nextPlannedPass([pass("2026-12-04"), later], "2026-11-10")).toBe(later);
  });
});
