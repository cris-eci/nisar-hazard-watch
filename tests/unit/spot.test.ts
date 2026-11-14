import land from "../e2e/mocks/coverage-qadirabad.json";
import ocean from "../e2e/mocks/coverage-open-ocean.json";
import { describe, expect, it } from "vitest";

import { CASES } from "@/features/cases/cases";
import { greatCircleKm } from "@/features/geo/measure";
import type { Coverage } from "@/features/spot/coverageApi";
import { aboutKm, directionOf, longestGap, nearestCase, spotView } from "@/features/spot/spot";
import { formatDay } from "@/features/timeline/timelineLayout";

// Real answers of GET /api/v1/coverage (Nov 2026), at Qadirabad and over the South Atlantic.
const LAND = land as Coverage;
const OCEAN = ocean as Coverage;

describe("directionOf", () => {
  it("reads the direction letter of the backend's series key", () => {
    expect(directionOf("084_A_018_4005_DHDH")).toBe("ASCENDING");
    expect(directionOf("129_D_042_4005_DHDH")).toBe("DESCENDING");
  });

  it("says nothing when the key doesn't carry it", () => {
    expect(directionOf(null)).toBeUndefined();
    expect(directionOf("series-7")).toBeUndefined();
  });
});

describe("longestGap", () => {
  it("finds the real 36-day gap after 14 Jul at Qadirabad", () => {
    expect(longestGap(LAND.plan.dates)).toEqual({ days: 36, after: "2026-07-14" });
  });

  it("stays quiet at 24 days or less", () => {
    expect(longestGap(["2026-07-14", "2026-08-07", "2026-08-31"])).toBeUndefined();
  });
});

describe("greatCircleKm and nearestCase", () => {
  it("measures a quarter of the equator as about 10,008 km", () => {
    expect(greatCircleKm([0, 0], [90, 0])).toBeCloseTo(10_007.6, 0);
  });

  it("finds the closest known case to a click", () => {
    const nearest = nearestCase([73.5, 32.3], CASES);
    expect(nearest?.item.id).toBe("qadirabad");
  });

  it("rounds far distances to tens of kilometres", () => {
    expect(aboutKm(274.6)).toBe("270");
    expect(aboutKm(1_234)).toBe("1,230");
    expect(aboutKm(42.4)).toBe("42");
  });
});

describe("spotView", () => {
  it("builds the Qadirabad card from the coverage answer only", () => {
    const view = spotView(LAND);
    if (view.state === "noCoverage") throw new Error("ready");
    expect(view.sideKm).toBe("10.24");
    expect(view.direction).toBe("ASCENDING");
    expect(view.chips).toEqual(LAND.plan.dates.map((date) => formatDay(date, false)));
    expect(view.gapNote).toBe(
      `Only dates NISAR actually measured. The 36-day gap after ${formatDay("2026-07-14", false)} is real.`,
    );
  });

  it("turns the ocean answer into the no-data state", () => {
    expect(spotView(OCEAN)).toEqual({ state: "noCoverage" });
  });
});
