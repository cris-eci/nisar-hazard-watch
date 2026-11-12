import { describe, expect, it } from "vitest";

import { CASES, formatPercent, percent } from "@/features/cases/cases";
import { bandOf, demoBandPasses, isOutside, verdictOf } from "@/features/cases/demoBand";

// Every file under public/cases, as Vite sees it ("/public/cases/x.png").
const SHIPPED = new Set(Object.keys(import.meta.glob("/public/cases/**/*.png")));

describe("measured cases", () => {
  it("only publish shares that match the backend's counts", () => {
    // The panel headline must agree with the bars it summarises: 332/516 is the 64.3% in the stat.
    const qadirabad = CASES.find((item) => item.id === "qadirabad");
    const rows = qadirabad?.groups?.[0]?.rows ?? [];
    expect(rows.map((row) => formatPercent(percent(row.k, row.n)))).toEqual([
      "64.3%",
      "17.0%",
      "1.0%",
    ]);
  });

  it("point every image at a file that ships with the app", () => {
    for (const item of CASES) {
      const paths = [item.figure, ...Object.values(item.crops ?? {})].filter(
        (path): path is string => path !== undefined,
      );
      for (const path of paths) expect(SHIPPED.has(`/public${path}`), path).toBe(true);
    }
  });

  it("give every insufficient case a reason", () => {
    for (const item of CASES.filter((entry) => entry.verdict === "insufficient")) {
      expect(item.reason, item.id).toBeTruthy();
    }
  });

  it("keep timeline passes in date order, planned ones last", () => {
    for (const item of CASES) {
      const dates = item.timeline?.passes.map((entry) => entry.date) ?? [];
      expect(dates, item.id).toEqual([...dates].sort());
      const kinds = item.timeline?.passes.map((entry) => entry.kind) ?? [];
      const firstPlanned = kinds.indexOf("plan");
      if (firstPlanned >= 0)
        expect(kinds.slice(firstPlanned).every((k) => k === "plan")).toBe(true);
    }
  });
});

describe("the normal-range band", () => {
  it("uses the backend's 3 dB floor when the passes barely vary", () => {
    const band = bandOf([-9.8, -10.4, -9.6, -10.9, -10.1]);
    expect(band?.median).toBeCloseTo(-10.1);
    expect((band?.high ?? 0) - (band?.median ?? 0)).toBeCloseTo(3);
  });

  it("widens with the spread of earlier passes", () => {
    const band = bandOf([-4, -10, -16, -10, -22]);
    expect((band?.high ?? 0) - (band?.median ?? 0)).toBeGreaterThan(3);
  });

  it("needs at least three earlier passes", () => {
    expect(bandOf([-10.4, -10.9])).toBeUndefined();
  });

  it("treats a missing pass as a gap, never as a value", () => {
    expect(isOutside(null, { median: -10, low: -13, high: -7 })).toBe(false);
  });

  it("reproduces the three demo verdicts from the target pass", () => {
    expect(verdictOf(demoBandPasses("departure"))).toBe("departure");
    expect(verdictOf(demoBandPasses("within"))).toBe("within");
    expect(verdictOf(demoBandPasses("insufficient"))).toBe("insufficient");
  });
});
