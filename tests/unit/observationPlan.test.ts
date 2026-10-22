import { describe, expect, it } from "vitest";

import { mockBurnAnalysis, pickComparisonPair } from "@/features/analysis/burnAnalysis";
import { parseAcquisitions } from "@/features/frames/observationPlanApi";
import { hasCrossPol } from "@/features/frames/radarMode";

describe("hasCrossPol", () => {
  it("detects L-band dual-pol (HH+HV)", () => {
    expect(hasCrossPol("L:SCI:DH:20M+05N:FS:B4:D09")).toBe(true);
  });

  it("ignores single-pol and S-band-only cross-pol", () => {
    expect(hasCrossPol("L:SCI:SH:77M+---:HS:B4:D02")).toBe(false);
    expect(hasCrossPol("L:SCI:SH:40M+05N:FS:B4:D02  S:DB:DH:37W:B4")).toBe(false);
  });
});

describe("parseAcquisitions", () => {
  it("maps each pass to the cross-pol flag of its mode code", () => {
    const acquisitions = parseAcquisitions({
      date_mode_popup: "2026-01-01 | 150\n2026-01-13 | 151",
      unique_radar_mode_list: "150, 151",
      unique_radar_mode_mnemonic_list: "L:SCI:DH:20M+05N:FS:B4:D09, L:SCI:SH:20M+05N:FS:B4:D09",
    });
    expect(acquisitions).toEqual([
      { date: "2026-01-01", hasCrossPol: true },
      { date: "2026-01-13", hasCrossPol: false },
    ]);
  });

  // Regression: frame 47-3 lists "148,212,156" per pass and was reported as HH only.
  it("handles passes that use several modes at once", () => {
    const [acquisition] = parseAcquisitions({
      date_mode_popup: "2026-01-12 | 148,212,156",
      unique_radar_mode_list: "148, 156, 212",
      unique_radar_mode_mnemonic_list:
        "L:SCI:SH:20M+05N:FS:B4:D09, L:SCI:SH:20M+05N:FS:B4:D09, L:SCI:DH:40M+05N:FS:B4:D02",
    });
    expect(acquisition).toEqual({ date: "2026-01-12", hasCrossPol: true });
  });
});

describe("pickComparisonPair", () => {
  const passes = [
    { date: "2026-09-01", hasCrossPol: true },
    { date: "2026-09-13", hasCrossPol: false },
    { date: "2026-09-25", hasCrossPol: true },
    { date: "2026-10-07", hasCrossPol: true },
  ];

  it("picks the two latest cross-pol passes up to today, skipping HH-only ones", () => {
    const pair = pickComparisonPair(passes, "2026-10-01");
    expect(pair?.map((a) => a.date)).toEqual(["2026-09-01", "2026-09-25"]);
  });

  it("returns undefined with fewer than two usable passes", () => {
    expect(pickComparisonPair(passes, "2026-09-10")).toBeUndefined();
  });

  it("mock analysis is stable per frame", () => {
    const pair = pickComparisonPair(passes, "2026-10-31");
    if (pair === undefined) throw new Error("expected a pair");
    expect(mockBurnAnalysis("47-3", pair)).toEqual(mockBurnAnalysis("47-3", pair));
  });
});
