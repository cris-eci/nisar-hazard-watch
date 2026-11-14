import real from "../fixtures/exploration-qadirabad.json";
import { describe, expect, it } from "vitest";

import {
  explorationSchema,
  lensEvaluationOf,
  type LensEvaluation,
  type WaterComparison,
} from "@/features/explore/exploreSchemas";
import { floodDrivers } from "@/features/lenses/drivers";
import { witnessOf } from "@/features/lenses/opticalWitnessView";
import { formatDay } from "@/features/timeline/timelineLayout";

const result = explorationSchema.parse(real).result;
if (result === null) throw new Error("fixture has a result");
const EVALUATION = lensEvaluationOf(result);
if (EVALUATION === undefined) throw new Error("fixture has an evaluation");

// Barh optical groups from docs/design/v8/DATA_PROVENANCE-v8.md (REAL job water_comparison).
const BARH: WaterComparison = {
  status: "evaluated",
  reason: undefined,
  pre: { date: "2026-07-26", sensor: "Landsat 8" },
  post: { date: "2026-09-13", sensor: "Sentinel-2B" },
  groups: [
    { id: "new_water", cells: 2702, signatureCells: 2468 },
    { id: "stable_water", cells: 506, signatureCells: 232 },
    { id: "stable_dry", cells: 1226, signatureCells: 1 },
    { id: "mixed", cells: 995, signatureCells: 299 },
  ],
  matchedPairs: 171,
  coPolContrast: { medianDb: -8.39, intervalDb: [-9.1, -7.58] },
  pointState: "insufficient_data",
};

const withWater = (water: Partial<WaterComparison> | undefined): LensEvaluation => ({
  ...EVALUATION,
  water: water && { ...BARH, ...water },
});

describe("lensEvaluationOf · water_comparison", () => {
  it("reads the real unavailable answer and the confounders", () => {
    expect(EVALUATION.water).toMatchObject({
      status: "insufficient_data",
      reason: "optical_evidence_unavailable",
      groups: undefined,
    });
    expect(EVALUATION.confounders.map(({ id }) => id)).toContain("wind");
  });
});

describe("witnessOf", () => {
  it("is UNAVAILABLE on the real Qadirabad answer, with the COPY sentence", () => {
    expect(witnessOf(EVALUATION, false)).toEqual({
      state: "unavailable",
      text: "No OPERA snapshot with enough clear cells within 4 days of the radar dates. The radar result stands on its own.",
    });
  });

  it("is PENDING while the backend still looks for snapshots", () => {
    expect(witnessOf(withWater({ status: "pending" }), true)?.state).toBe("pending");
  });

  it("is PENDING with no comparison yet only while the job runs", () => {
    expect(witnessOf(withWater(undefined), true)?.state).toBe("pending");
    expect(witnessOf(withWater(undefined), false)).toBeUndefined();
  });

  it("is READY on Barh: 9 in 10 agree and the dry group stays under 5 %", () => {
    const witness = witnessOf(withWater({}), false);
    if (witness?.state !== "ready") throw new Error("ready");
    expect(witness.lead).toBe(
      "Optical images agree: 9 in 10 cells that turned to water also meet the radar rule. Cells that stayed dry almost never do.",
    );
    expect(witness.bars.rows.map(({ k, n }) => [k, n])).toEqual([
      [2468, 2702],
      [232, 506],
      [1, 1226],
      [299, 995],
    ]);
    expect(witness.whisker?.n).toBe(
      "New-water cells minus matched dry cells, 171 pairs · 95% spatial interval",
    );
    expect(witness.point).toBe("At your pixel's optical cell: not enough clear view.");
  });

  it("says 'partly agree' under 5 in 10", () => {
    const witness = witnessOf(
      withWater({ groups: [{ id: "new_water", cells: 100, signatureCells: 30 }] }),
      false,
    );
    expect(witness?.state === "ready" && witness.lead).toBe(
      "Optical images partly agree: 3 in 10 cells that turned to water also meet the radar rule.",
    );
  });

  it("hides a status it has no words for", () => {
    expect(witnessOf(withWater({ status: "something_new" }), false)).toBeUndefined();
  });
});

describe("floodDrivers", () => {
  it("gives Barh FITS BEST, PARTLY and WEAK from the groups alone", () => {
    const view = floodDrivers(withWater({}));
    expect(view?.drivers.map(({ id, fit }) => [id, fit])).toEqual([
      ["flooding", "fitsBest"],
      ["existingWater", "partly"],
      ["wetSoil", "weak"],
    ]);
    expect(view?.drivers[0]?.for).toBe(
      // formatDay's en-GB month ("Sep" or "Sept") depends on the runtime's ICU.
      `Optical shows 2,702 cells turned to open water between 26 Jul and ${formatDay("2026-09-13", false)}; 91% of them meet the radar rule.`,
    );
    expect(view?.drivers[2]?.against).toBe(
      "Of 1,226 cells that stayed dry in the optical images, 1 meets the rule.",
    );
  });

  it("lists the unchecked confounders in the footer, not the ones the cards cover", () => {
    expect(floodDrivers(withWater({}))?.footer).toBe(
      "A river gauge, rain record or field report would settle it. Not checked here: freeze and thaw, wind on water, look angle, speckle, terrain shadow.",
    );
  });

  it("drops FITS BEST when too many stayed-dry cells meet the rule", () => {
    const view = floodDrivers(
      withWater({
        groups: [
          { id: "new_water", cells: 100, signatureCells: 90 },
          { id: "stable_dry", cells: 100, signatureCells: 10 },
        ],
      }),
    );
    expect(view).toBeUndefined();
  });

  it("shows nothing without a ready comparison (the real fixture)", () => {
    expect(floodDrivers(EVALUATION)).toBeUndefined();
  });
});
