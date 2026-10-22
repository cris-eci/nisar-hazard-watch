import { describe, expect, it } from "vitest";

import { analysisBounds } from "@/features/analysis/mock/demoCommon";
import {
  DEFORMED_THRESHOLD_CM,
  generateDeformationField,
  summarizeDeformation,
} from "@/features/analysis/mock/deformationField";
import { FEATURED_EVENTS } from "@/features/events/events";

const SIZE = 64;

describe("generateDeformationField", () => {
  it("is deterministic per seed", () => {
    const a = generateDeformationField("earthquake:162-7:2026-06-13:2026-06-25", SIZE);
    const b = generateDeformationField("earthquake:162-7:2026-06-13:2026-06-25", SIZE);
    expect(a.losCm).toEqual(b.losCm);
  });

  // A coseismic interferogram has lobes of both signs; one sign only would look like subsidence.
  it("has motion both toward and away from the satellite", () => {
    const field = generateDeformationField("earthquake:24-18:2026-07-21:2026-08-14", SIZE);
    const { maxTowardCm, maxAwayCm, deformedAreaKm2, colorScaleCm } = summarizeDeformation(
      field,
      1,
    );
    expect(maxTowardCm).toBeGreaterThan(DEFORMED_THRESHOLD_CM);
    expect(maxAwayCm).toBeGreaterThan(DEFORMED_THRESHOLD_CM);
    expect(deformedAreaKm2).toBeGreaterThan(0);
    expect(colorScaleCm % 5).toBe(0);
    expect(colorScaleCm).toBeGreaterThanOrEqual(Math.max(maxTowardCm, maxAwayCm));
  });
});

describe("analysisBounds with a focus point", () => {
  it("centres on the focus when it is well inside the frame", () => {
    const [west, south, east, north] = analysisBounds([-76, 2, -72, 6], [-74.5, 4.5]);
    expect((west + east) / 2).toBeCloseTo(-74.5);
    expect((south + north) / 2).toBeCloseTo(4.5);
  });

  it("slides back inside the frame when the focus is near an edge", () => {
    const frame: [number, number, number, number] = [-69.64, 9.54, -66.91, 12.17];
    const [, , east] = analysisBounds(frame, [-66.95, 10.6]);
    expect(east).toBeLessThanOrEqual(-66.91);
  });
});

describe("featured events", () => {
  // The globe can only open an event whose pair brackets the event date.
  it("earthquake pairs bracket the event date", () => {
    for (const event of FEATURED_EVENTS.filter(({ hazard }) => hazard === "earthquake")) {
      const [before, after] = event.pair ?? ["", ""];
      expect(before < event.date && event.date < after).toBe(true);
    }
  });
});
