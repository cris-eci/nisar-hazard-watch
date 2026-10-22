import { describe, expect, it } from "vitest";

import { analysisBounds } from "@/features/analysis/mock/mockAnalysis";
import {
  classifySeverity,
  generateScarField,
  summarizeField,
} from "@/features/analysis/mock/scarField";

const SIZE = 64;

describe("classifySeverity", () => {
  it("uses the -2 dB threshold of the data pipeline", () => {
    expect(classifySeverity(-1.9)).toBe(0);
    expect(classifySeverity(-2.1)).toBe(1);
    expect(classifySeverity(-5)).toBe(2);
    expect(classifySeverity(-7)).toBe(3);
  });
});

describe("generateScarField", () => {
  it("is deterministic per seed, so a frame always shows the same scar", () => {
    const a = generateScarField("47-3:2026-10-03:2026-10-15", SIZE);
    const b = generateScarField("47-3:2026-10-03:2026-10-15", SIZE);
    expect(a.changeDb).toEqual(b.changeDb);
  });

  it("produces a scar that covers part of the area, not none or all of it", () => {
    const { severity } = generateScarField("47-3:2026-10-03:2026-10-15", SIZE);
    const burned = severity.filter((level) => level > 0).length / severity.length;
    expect(burned).toBeGreaterThan(0.01);
    expect(burned).toBeLessThan(0.6);
  });
});

describe("summarizeField", () => {
  // The panel numbers and the map come from the same field, so they must agree.
  it("adds severity classes up to the burned area and reports a loss", () => {
    const field = generateScarField("83-86:2026-09-01:2026-09-13", SIZE);
    const { burnedAreaHa, meanHvChangeDb, severityHa } = summarizeField(field, 10);
    const sum = severityHa.low + severityHa.moderate + severityHa.high;
    expect(Math.abs(sum - burnedAreaHa)).toBeLessThanOrEqual(2);
    expect(meanHvChangeDb).toBeLessThan(-2);
  });
});

describe("analysisBounds", () => {
  it("is a ~120 km square centred on the frame", () => {
    const [west, south, east, north] = analysisBounds([-76, 2, -72, 6]);
    expect((west + east) / 2).toBeCloseTo(-74);
    expect((south + north) / 2).toBeCloseTo(4);
    expect((north - south) * 111.32).toBeCloseTo(120, 0);
  });

  it("stays inside the middle half of small frames", () => {
    const bounds = analysisBounds([0, 0, 0.8, 0.8]);
    [0.2, 0.2, 0.6, 0.6].forEach((expected, i) => expect(bounds[i]).toBeCloseTo(expected));
  });
});
