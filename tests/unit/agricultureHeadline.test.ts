// The real Texas agriculture answer, as the app's JSON download saved it ({ source, exploration }).
import saved from "../fixtures/exploration-texas-agriculture.json";
import { describe, expect, it } from "vitest";

import {
  explorationSchema,
  lensEvaluationOf,
  type LensEvaluation,
  type Neighbours,
} from "@/features/explore/exploreSchemas";
import {
  agricultureHeadline,
  neighboursBlockOf,
  neighboursLayerOf,
} from "@/features/lenses/agriculture";
import { surroundingsRow } from "@/features/lenses/surroundings";

const result = explorationSchema.parse(saved.exploration).result;
if (result === null) throw new Error("fixture has a result");
const EVALUATION = lensEvaluationOf(result);

const with_ = (near: Partial<Neighbours>): LensEvaluation | undefined =>
  EVALUATION?.neighbours && { ...EVALUATION, neighbours: { ...EVALUATION.neighbours, ...near } };

describe("lensEvaluationOf (agriculture)", () => {
  it("reads the Texas patch, its matched cells and one contrast per channel", () => {
    const near = EVALUATION?.neighbours;
    expect(near).toMatchObject({
      status: "evaluated",
      radiusM: 60,
      annulusM: [120, 300],
      focalCells: 112,
      comparisonCells: 2379,
      matchedControlCells: 112,
      minimumCells: 5,
      materialContrastDb: 1,
    });
    expect(near?.contrasts.map((c) => [c.channel, c.state])).toEqual([
      ["HH", "absent_on_sampled_support"],
      ["HV", "insufficient_data"],
      ["HV_over_HH", "insufficient_data"],
    ]);
  });

  it("leaves the flood surroundings row out: agriculture sends no surrounding_comparison", () => {
    expect(surroundingsRow(EVALUATION)).toBeUndefined();
  });
});

describe("agricultureHeadline", () => {
  it("says no clear difference when one channel is flat and the others too uncertain (Texas)", () => {
    expect(agricultureHeadline(EVALUATION)).toBe(
      "No clear difference between this field and its neighbours on 28 Oct 2026.",
    );
  });

  it("says the field changed like its neighbours when every channel is flat", () => {
    const flat = EVALUATION?.neighbours?.contrasts.map((c) => ({
      ...c,
      state: "absent_on_sampled_support",
    }));
    expect(agricultureHeadline(with_({ contrasts: flat ?? [] }))).toBe(
      "This field changed like its neighbours on 28 Oct 2026.",
    );
  });

  it("uses the design's sentence when the patch has too few cells", () => {
    expect(agricultureHeadline(with_({ status: "insufficient_data", focalCells: 1 }))).toBe(
      "The 60 m patch has too few cells on this grid to compare with its neighbours.",
    );
  });

  it("writes nothing for a state it has no words for, rather than inventing one", () => {
    const other = EVALUATION?.neighbours?.contrasts.map((c) => ({ ...c, state: "supports" }));
    expect(agricultureHeadline(with_({ contrasts: other ?? [] }))).toBeUndefined();
    expect(agricultureHeadline(undefined)).toBeUndefined();
  });
});

describe("neighboursBlockOf", () => {
  it("gives the counts, one row per channel in dB with its interval, and the pair caption", () => {
    const block = neighboursBlockOf(EVALUATION);
    expect(block?.counts).toBe(
      "112 cells in the patch, compared with 112 matched cells out of 2,379 around it.",
    );
    expect(block?.tooSmall).toBeUndefined();
    expect(block?.rows.map((row) => [row.label, row.value, row.interval, row.state])).toEqual([
      ["HH", "+0.3 dB", "−0.5 … +1.0 dB", "No difference beyond ±1 dB"],
      ["HV", "−0.9 dB", "−1.6 … −0.4 dB", "Too uncertain to say"],
      ["HV − HH", "−1.2 dB", "−2.1 … −0.4 dB", "Too uncertain to say"],
    ]);
    expect(block?.band?.[0]).toBeCloseTo(100 / 3, 6);
    expect(block?.band?.[1]).toBeCloseTo(200 / 3, 6);
    expect(block?.caption).toBe(
      "Patch cells minus matched cells, 112 pairs · 95% spatial interval",
    );
  });

  it("lists why when the patch is too small, and shows no contrasts", () => {
    const block = neighboursBlockOf(with_({ status: "insufficient_data", focalCells: 1 }));
    expect(block?.tooSmall).toBe("1 cell in the 60 m patch; needs 5");
    expect(block?.rows).toEqual([]);
    expect(block?.caption).toBeUndefined();
  });

  it("finds the matched control cells layer for the thumbnail and the toggle", () => {
    expect(neighboursLayerOf(result.layers)?.id).toBe(
      "display_agriculture_populations_matched_control",
    );
  });
});
