import { describe, expect, it } from "vitest";

import { clampCoherence } from "@/features/insar/insarApi";
import { insarFromParams } from "@/features/insar/insarLink";

const PAIR =
  "NISAR_L2_PR_GUNW_026_024_A_018_028_4000_SH_20260721T202900_20260721T202934_20260814T202858_20260814T202933_P05023_N_F_J_001";

const params = (query: string): URLSearchParams => new URLSearchParams(query);

describe("insarFromParams", () => {
  it("reads the pair and the threshold of a shared link", () => {
    expect(insarFromParams(params(`pair=${PAIR}&coherence=0.5`))).toEqual({
      pairId: PAIR,
      threshold: 0.5,
    });
  });

  it("defaults the threshold and clamps a wild one", () => {
    expect(insarFromParams(params(`pair=${PAIR}`))?.threshold).toBe(0.35);
    expect(insarFromParams(params(`pair=${PAIR}&coherence=7`))?.threshold).toBe(0.9);
    expect(insarFromParams(params(`pair=${PAIR}&coherence=-1`))?.threshold).toBe(0.1);
    expect(insarFromParams(params(`pair=${PAIR}&coherence=soon`))?.threshold).toBe(0.35);
  });

  it.each(["", "pair=", "pair=not-a-gunw-name", "pair=NISAR_L2_ has spaces", "coherence=0.5"])(
    "ignores a link without a usable pair (%s)",
    (query) => {
      expect(insarFromParams(params(query))).toBeUndefined();
    },
  );
});

describe("clampCoherence", () => {
  it("snaps to the slider step and reads cleanly", () => {
    expect(clampCoherence(0.37)).toBe(0.35);
    expect(clampCoherence(0.375)).toBe(0.4);
    expect(String(clampCoherence(0.3))).toBe("0.3");
  });

  it("stays inside the backend's bounds", () => {
    expect(clampCoherence(0.01)).toBe(0.1);
    expect(clampCoherence(2)).toBe(0.9);
    expect(clampCoherence(Number.NaN)).toBe(0.35);
  });
});
