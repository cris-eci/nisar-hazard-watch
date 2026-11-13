import real from "../fixtures/exploration-qadirabad.json";
import { describe, expect, it } from "vitest";

import {
  explorationSchema,
  lensEvaluationOf,
  type LensEvaluation,
} from "@/features/explore/exploreSchemas";
import { floodHeadline, fractionInWords, ruleBlockOf, ruleLayerOf } from "@/features/lenses/flood";

const VIEW = explorationSchema.parse(real);
const result = VIEW.result;
if (result === null) throw new Error("fixture has a result");
const EVALUATION = lensEvaluationOf(result);

const withPixel = (state: string | undefined, fraction?: number): LensEvaluation | undefined =>
  EVALUATION && {
    ...EVALUATION,
    pixelDualDarkening: state,
    dualDarkening:
      EVALUATION.dualDarkening && fraction !== undefined
        ? { ...EVALUATION.dualDarkening, fraction }
        : EVALUATION.dualDarkening,
  };

describe("floodHeadline", () => {
  it("says no new water at Qadirabad and about a tenth around it", () => {
    expect(floodHeadline(EVALUATION)).toBe(
      "No new water at the exact spot you clicked. Around it, about a tenth of the area darkened the way calm new water does.",
    );
  });

  it("says new water only when the backend marks the clicked pixel with the signature", () => {
    expect(floodHeadline(withPixel("supports", 0.42))).toBe(
      "New water at the exact spot you clicked. Around it, about half of the area darkened the way calm new water does.",
    );
    expect(floodHeadline(withPixel("insufficient_data"))).toMatch(/^No new water/);
  });

  it("has no headline when the pixel state or the fraction is missing", () => {
    expect(floodHeadline(withPixel(undefined))).toBeUndefined();
    expect(
      floodHeadline(EVALUATION && { ...EVALUATION, dualDarkening: undefined }),
    ).toBeUndefined();
    expect(floodHeadline(undefined)).toBeUndefined();
  });
});

describe("fractionInWords", () => {
  it.each([
    [0, "a few cells"],
    [0.0999, "a few cells"],
    [0.1, "about a tenth"],
    [0.1987, "about a tenth"],
    [0.2, "a quarter"],
    [0.3, "a third"],
    [0.4, "about half"],
    [0.5999, "about half"],
    [0.6, "most"],
    [1, "most"],
  ])("reads %s as %s", (fraction, words) => {
    expect(fractionInWords(fraction)).toBe(words);
  });
});

describe("ruleBlockOf", () => {
  it("counts the dual-darkening cells of the grid and writes the caption from the answer", () => {
    const block = ruleBlockOf(EVALUATION, false);

    expect(block?.text).toBe("208,344 of 1,048,576 cells");
    expect(block?.percent.toFixed(1)).toBe("19.9");
    expect(block?.caption).toBe(
      "HH fell 3 dB or more and HV 1.5 dB or more on 11 Nov 2026, against each cell's own median of 4 earlier passes. Another 128,837 cells brightened. Cells meeting a rule, not flooded area.",
    );
  });

  it("names the dark navy cells only when the rule thumbnail is on screen", () => {
    expect(ruleBlockOf(EVALUATION, true)?.caption).toMatch(/^Dark navy cells: HH fell 3 dB/);
  });

  it("takes the thresholds from the policy, not from constants", () => {
    const block = ruleBlockOf(
      EVALUATION && { ...EVALUATION, dualDarkeningMaxChangeDb: { co: -2.5, cross: -1 } },
      false,
    );
    expect(block?.caption).toMatch(/^HH fell 2.5 dB or more and HV 1 dB or more/);
  });

  it("hides without the signature and drops only the caption without its fields", () => {
    expect(ruleBlockOf(EVALUATION && { ...EVALUATION, dualDarkening: undefined }, false)).toBe(
      undefined,
    );
    const block = ruleBlockOf(EVALUATION && { ...EVALUATION, coPolBrightening: undefined }, false);
    expect(block?.text).toBe("208,344 of 1,048,576 cells");
    expect(block?.caption).toBeUndefined();
  });

  it("never takes the brightening layer for the rule layer", () => {
    expect(ruleLayerOf(result.layers)).toBeUndefined();
    expect(ruleLayerOf([{ id: "display_flood_signature_flags_dual_darkening" }])?.id).toBe(
      "display_flood_signature_flags_dual_darkening",
    );
  });
});
