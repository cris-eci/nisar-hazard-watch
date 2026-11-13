// The real Seattle wildfire answer, as the app's JSON download saved it ({ source, exploration }).
import saved from "../fixtures/exploration-Seattle-wildfire.json";
import { describe, expect, it } from "vitest";

import {
  crossPolHistoryOf,
  explorationSchema,
  type CrossPolHistory,
} from "@/features/explore/exploreSchemas";
import {
  declineLayerOf,
  declineRowsOf,
  pixelLineOf,
  wildfireHeadline,
} from "@/features/lenses/wildfire";

const VIEW = explorationSchema.parse(saved.exploration);
const result = VIEW.result;
if (result === null) throw new Error("fixture has a result");
const HISTORY = crossPolHistoryOf(result);

const twoPasses = (history: CrossPolHistory): CrossPolHistory => ({
  ...history,
  status: "evaluated",
  samples: [...history.samples, { date: "2026-11-17", declineCells: 1200 }],
});

describe("crossPolHistoryOf", () => {
  it("reads the HV history from lens.radar and lens.point of the Seattle answer", () => {
    expect(HISTORY).toEqual({
      status: "insufficient_assessment_dates",
      polarization: "HV",
      commonCells: 1048312,
      samples: [{ date: "2026-10-24", declineCells: 96043 }],
      pixelDeclinePasses: 0,
      pixelAssessedPasses: 1,
    });
  });

  it("has nothing for a lens without the history (the flood answer)", () => {
    expect(crossPolHistoryOf({ ...result, lens: null })).toBeUndefined();
  });
});

describe("wildfireHeadline", () => {
  it("uses the design's sentence when the spot has one pass after the baseline", () => {
    expect(wildfireHeadline(HISTORY)).toBe(
      "This lens needs at least two passes after the baseline. This spot has one.",
    );
  });

  it("writes no sentence for a state the design has none for, rather than inventing one", () => {
    if (HISTORY === undefined) throw new Error("history");
    expect(wildfireHeadline(twoPasses(HISTORY))).toBeUndefined();
    expect(wildfireHeadline(undefined)).toBeUndefined();
  });
});

describe("declineRowsOf", () => {
  it("gives one row per assessed pass against the common cells, never a constant", () => {
    const [row, ...rest] = declineRowsOf(HISTORY);
    expect(rest).toHaveLength(0);
    expect(row?.text).toBe("96,043 of 1,048,312 cells");
    expect(row?.label).toBe("with HV below its band on 24 Oct 2026");
    expect(row?.percent).toBeCloseTo(9.16, 2);
  });

  it("has no rows without the common-cell count", () => {
    if (HISTORY === undefined) throw new Error("history");
    expect(declineRowsOf({ ...HISTORY, commonCells: undefined })).toEqual([]);
  });
});

describe("pixelLineOf", () => {
  it("says how many passes after the baseline put the clicked pixel below its band", () => {
    expect(pixelLineOf(HISTORY)).toBe(
      "At your pixel: HV below its band on 0 of 1 pass after the baseline.",
    );
  });
});

describe("declineLayerOf", () => {
  it("finds the Seattle answer's decline-count layer for the thumbnail and the toggle", () => {
    expect(declineLayerOf(result.layers)?.id).toBe(
      "display_cross_pol_decline_count_cross_pol_decline_count",
    );
  });
});
