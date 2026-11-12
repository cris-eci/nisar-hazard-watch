import { describe, expect, it } from "vitest";

import type { LonLat } from "@/features/frames/frame.types";
import { splitAntimeridian } from "@/features/geo/antimeridian";
import { boundsOf, continueLon, normalizeLon, unwrapRing, wrapBox } from "@/features/geo/longitude";
import { areaKm2Of, centreOf, ringAreaKm2 } from "@/features/geo/measure";
import { squareAround, squareBounds } from "@/features/geo/square";
import { formatKm2, levelOf } from "@/features/geo/limits";

const QADIRABAD: LonLat = [73.713, 32.329];

describe("longitude helpers", () => {
  it.each([
    [190, -170],
    [-190, 170],
    [0, 0],
    [540, -180],
  ])("normalizes %f to %f", (lon, expected) => {
    expect(normalizeLon(lon)).toBeCloseTo(expected, 9);
  });

  it("keeps a step across ±180° short instead of jumping the whole globe", () => {
    expect(continueLon(179.9, -179.9)).toBeCloseTo(180.1, 9);
    expect(continueLon(-179.9, 179.9)).toBeCloseTo(-180.1, 9);
  });

  it("unwraps a ring drawn across the antimeridian into continuous longitudes", () => {
    const ring = unwrapRing([
      [179.9, 10],
      [-179.9, 10],
      [-179.9, 11],
      [179.9, 11],
    ]);
    expect(ring.map(([lon]) => lon)).toEqual([179.9, 180.1, 180.1, 179.9]);
  });

  it("wraps a box for Cesium, marking a crossing by west above east", () => {
    expect(wrapBox([179.9, 10, 180.1, 11])).toEqual([179.9, 10, -179.9, 11]);
    expect(wrapBox([10, 0, 20, 1])).toEqual([10, 0, 20, 1]);
    expect(wrapBox([-200, 0, 200, 1])).toEqual([-180, 0, 180, 1]);
  });

  it("gives the box of a ring", () => {
    expect(
      boundsOf([
        [1, 5],
        [3, 2],
        [2, 9],
      ]),
    ).toEqual([1, 2, 3, 9]);
  });
});

describe("splitAntimeridian", () => {
  it("leaves a ring that stays on one side as it is", () => {
    const ring: LonLat[] = [
      [10, 0],
      [11, 0],
      [11, 1],
      [10, 1],
    ];
    expect(splitAntimeridian(ring)).toEqual([ring]);
  });

  it("cuts a rectangle across +180° into two rings that each stay inside ±180°", () => {
    const parts = splitAntimeridian([
      [179.9, 10],
      [180.1, 10],
      [180.1, 11],
      [179.9, 11],
    ]);
    expect(parts).toHaveLength(2);
    for (const part of parts)
      for (const [lon] of part) expect(Math.abs(lon)).toBeLessThanOrEqual(180);
    const [west, east] = parts as [LonLat[], LonLat[]];
    expect(Math.max(...west.map(([lon]) => lon))).toBeCloseTo(-179.9, 9);
    expect(Math.min(...west.map(([lon]) => lon))).toBeCloseTo(-180, 9);
    expect(Math.min(...east.map(([lon]) => lon))).toBeCloseTo(179.9, 9);
    expect(Math.max(...east.map(([lon]) => lon))).toBeCloseTo(180, 9);
  });

  it("gives the same two rings whichever way the rectangle was dragged", () => {
    const eastToWest = splitAntimeridian([
      [-179.9, 10],
      [179.9, 10],
      [179.9, 11],
      [-179.9, 11],
    ]);
    const westToEast = splitAntimeridian([
      [179.9, 10],
      [-179.9, 10],
      [-179.9, 11],
      [179.9, 11],
    ]);
    expect(eastToWest.map((part) => boundsOf(part))).toEqual(
      westToEast.map((part) => boundsOf(part)),
    );
  });

  it("splits a ring unwrapped past -180° the same way", () => {
    const parts = splitAntimeridian([
      [-179.9, 10],
      [-180.1, 10],
      [-180.1, 11],
      [-179.9, 11],
    ]);
    expect(parts).toHaveLength(2);
    expect(boundsOf(parts[0] as LonLat[])[0]).toBeCloseTo(-180, 9);
  });

  it("keeps the area of both parts equal to the area of the whole", () => {
    const whole = [
      [179.9, 10],
      [180.1, 10],
      [180.1, 11],
      [179.9, 11],
    ] satisfies LonLat[];
    const parts = splitAntimeridian(whole);
    const total = parts.reduce((sum, part) => sum + ringAreaKm2(part), 0);
    expect(total).toBeCloseTo(ringAreaKm2(whole), 3);
  });
});

describe("area measures", () => {
  it("measures a one-degree square at the equator close to 12,364 km²", () => {
    const area = ringAreaKm2([
      [0, 0],
      [1, 0],
      [1, 1],
      [0, 1],
    ]);
    expect(area).toBeGreaterThan(12_300);
    expect(area).toBeLessThan(12_450);
  });

  it("measures the same ring the same whichever way round it runs", () => {
    const ring: LonLat[] = [
      [0, 0],
      [1, 0],
      [1, 1],
      [0, 1],
    ];
    expect(ringAreaKm2([...ring].reverse())).toBeCloseTo(ringAreaKm2(ring), 6);
  });

  it("measures a point as the 10.24 km contract square", () => {
    expect(areaKm2Of({ kind: "point", point: QADIRABAD })).toBeCloseTo(10.24 * 10.24, 0);
  });

  it("puts a drawn area's centre inside ±180° even when it was drawn across the antimeridian", () => {
    const [lon] = centreOf({
      kind: "rectangle",
      ring: [
        [179.9, 10],
        [180.1, 10],
        [180.1, 11],
        [179.9, 11],
      ],
    });
    expect(Math.abs(Math.abs(lon) - 180)).toBeLessThan(1e-9);
  });
});

describe("squareBounds", () => {
  it("spans the chip size in km in both directions", () => {
    const [west, south, east, north] = squareBounds(QADIRABAD, 5.12);
    expect((north - south) * 111.32).toBeCloseTo(5.12, 2);
    // Longitude degrees shrink with latitude, so the east-west span in degrees is wider.
    expect(east - west).toBeGreaterThan(north - south);
  });

  it("runs past 180° instead of folding back when the point sits on the antimeridian", () => {
    const [west, , east] = squareBounds([179.99, 0], 10.24);
    expect(east).toBeGreaterThan(180);
    expect(west).toBeLessThan(180);
  });

  it("stays on the globe near the poles", () => {
    const [west, south, east, north] = squareBounds([10, 89.99], 10.24);
    expect(north).toBeLessThanOrEqual(90);
    expect(south).toBeGreaterThanOrEqual(-90);
    expect(east - west).toBeLessThanOrEqual(360);
  });

  it("has a ring with the same corners as its box", () => {
    const [west, south, east, north] = squareBounds(QADIRABAD, 10.24);
    expect(squareAround(QADIRABAD, 10.24)).toEqual([
      [west, south],
      [east, south],
      [east, north],
      [west, north],
    ]);
  });
});

describe("size levels", () => {
  it.each([
    [100, "ideal"],
    [110, "ideal"],
    [110.5, "large"],
    [400, "large"],
    [400.5, "tooLarge"],
  ])("calls %f km² %s", (km2, level) => {
    expect(levelOf(km2)).toBe(level);
  });

  it("formats small and large areas", () => {
    expect(formatKm2(4.26)).toBe("4.3 km²");
    expect(formatKm2(1234.4)).toBe("1,234 km²");
  });
});
