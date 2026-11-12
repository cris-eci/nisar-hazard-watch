import { describe, expect, it } from "vitest";

import type { LonLat } from "@/features/frames/frame.types";
import { areaFromParams, areaToParams } from "@/features/geo/areaLink";
import type { Area, AreaGeometry } from "@/features/geo/geo.types";
import { MAX_VERTICES } from "@/features/geo/limits";
import { parseWkt, toBbox, toGeoJson, toWkt } from "@/features/geo/serialize";

const ACROSS_180: Area = {
  kind: "rectangle",
  ring: [
    [179.9, 10],
    [180.1, 10],
    [180.1, 11],
    [179.9, 11],
  ],
};
const SMALL_POLYGON: Area = {
  kind: "polygon",
  ring: [
    [73.7, 32.3],
    [73.75, 32.3],
    [73.75, 32.34],
    [73.7, 32.34],
  ],
};

const signedArea = (ring: LonLat[]): number =>
  ring.reduce((sum, [lon, lat], index) => {
    const [nextLon, nextLat] = ring[(index + 1) % ring.length] as LonLat;
    return sum + (lon * nextLat - nextLon * lat);
  }, 0);

describe("toGeoJson", () => {
  it("sends a point as a Point rounded to the backend's precision", () => {
    expect(toGeoJson({ kind: "point", point: [73.7130049, 32.3290049] })).toEqual({
      type: "Point",
      coordinates: [73.713, 32.329],
    });
  });

  it("wraps a point drawn past 180° back into range", () => {
    expect(toGeoJson({ kind: "point", point: [190, 10] })).toEqual({
      type: "Point",
      coordinates: [-170, 10],
    });
  });

  it("closes the ring and runs it counter-clockwise whichever way it was drawn", () => {
    const clockwise = toGeoJson({ kind: "polygon", ring: [...SMALL_POLYGON.ring].reverse() });
    expect(clockwise.type).toBe("Polygon");
    if (clockwise.type !== "Polygon") return;
    const [ring] = clockwise.coordinates as [LonLat[]];
    expect(ring[0]).toEqual(ring.at(-1));
    expect(signedArea(ring)).toBeGreaterThan(0);
    expect(ring).toHaveLength(5);
  });

  it("turns a rectangle across ±180° into a MultiPolygon of two valid polygons", () => {
    const geometry = toGeoJson(ACROSS_180);
    expect(geometry.type).toBe("MultiPolygon");
    if (geometry.type !== "MultiPolygon") return;
    expect(geometry.coordinates).toHaveLength(2);
    for (const [ring] of geometry.coordinates as [LonLat[]][]) {
      expect(ring[0]).toEqual(ring.at(-1));
      expect(signedArea(ring)).toBeGreaterThan(0);
      for (const [lon, lat] of ring) {
        expect(Math.abs(lon)).toBeLessThanOrEqual(180);
        expect(lat).toBeGreaterThanOrEqual(10);
        expect(lat).toBeLessThanOrEqual(11);
      }
    }
  });
});

describe("WKT and GeoJSON round trips", () => {
  const geometries: [string, AreaGeometry][] = [
    ["a point", toGeoJson({ kind: "point", point: [73.713, 32.329] })],
    ["a polygon", toGeoJson(SMALL_POLYGON)],
    ["a rectangle across ±180°", toGeoJson(ACROSS_180)],
  ];

  it.each(geometries)("keeps %s through WKT", (_, geometry) => {
    expect(parseWkt(toWkt(geometry))).toEqual(geometry);
  });

  it.each(geometries)("keeps %s through JSON", (_, geometry) => {
    expect(JSON.parse(JSON.stringify(geometry))).toEqual(geometry);
  });

  it("writes the shapes the backend reads", () => {
    expect(toWkt({ type: "Point", coordinates: [73.713, 32.329] })).toBe("POINT (73.713 32.329)");
    expect(toWkt(toGeoJson(SMALL_POLYGON))).toBe(
      "POLYGON ((73.7 32.3, 73.75 32.3, 73.75 32.34, 73.7 32.34, 73.7 32.3))",
    );
  });

  it("refuses text that is not a supported WKT shape", () => {
    expect(parseWkt("LINESTRING (0 0, 1 1)")).toBeUndefined();
    expect(parseWkt("POINT (a b)")).toBeUndefined();
    expect(parseWkt("POLYGON ((0 0, 1 1")).toBeUndefined();
    expect(parseWkt("")).toBeUndefined();
  });
});

describe("toBbox", () => {
  it("keeps longitudes continuous across the antimeridian", () => {
    expect(toBbox(ACROSS_180)).toEqual([179.9, 10, 180.1, 11]);
  });

  it("is the point itself for a point", () => {
    expect(toBbox({ kind: "point", point: [1, 2] })).toEqual([1, 2, 1, 2]);
  });
});

describe("shared links", () => {
  const roundTrip = (area: Area): Area | undefined => {
    const params = areaToParams(area);
    return params && areaFromParams(new URLSearchParams(params));
  };

  it("has no area link for a point: its frame link already says it", () => {
    expect(areaToParams({ kind: "point", point: [1, 2] })).toBeUndefined();
  });

  it("writes a rectangle as ?bbox= and reads it back", () => {
    const rectangle: Area = {
      kind: "rectangle",
      ring: [
        [73.7, 32.3],
        [73.75, 32.3],
        [73.75, 32.34],
        [73.7, 32.34],
      ],
    };
    expect(areaToParams(rectangle)).toEqual({ bbox: "73.7,32.3,73.75,32.34" });
    expect(roundTrip(rectangle)).toEqual(rectangle);
  });

  it("reads a rectangle across ±180° back as the same continuous ring", () => {
    expect(areaToParams(ACROSS_180)).toEqual({ bbox: "179.9,10,-179.9,11" });
    expect(roundTrip(ACROSS_180)).toEqual(ACROSS_180);
  });

  it("writes a polygon as ?geo= and reads it back", () => {
    expect(areaToParams(SMALL_POLYGON)).toEqual({
      geo: "73.7,32.3_73.75,32.3_73.75,32.34_73.7,32.34",
    });
    expect(roundTrip(SMALL_POLYGON)).toEqual(SMALL_POLYGON);
  });

  it("reads a polygon across ±180° back with continuous longitudes", () => {
    const polygon: Area = {
      kind: "polygon",
      ring: [
        [179.9, 10],
        [180.1, 10],
        [180.05, 11],
      ],
    };
    expect(roundTrip(polygon)).toEqual(polygon);
  });

  it.each([
    ["bbox", "1,2,3"],
    ["bbox", "a,b,c,d"],
    ["bbox", "10,20,30,10"],
    ["bbox", "10,0,10,5"],
    ["bbox", "10,-95,20,5"],
    ["bbox", "200,0,210,5"],
    ["geo", "1,2_3,4"],
    ["geo", "1,2_3,4_x,y"],
    ["geo", "1,2,9_3,4_5,6"],
    ["geo", "1,95_3,4_5,6"],
    ["geo", Array.from({ length: MAX_VERTICES + 1 }, (_, i) => `${i % 100},${i % 80}`).join("_")],
  ])("ignores a broken ?%s=%s", (key, value) => {
    expect(areaFromParams(new URLSearchParams({ [key]: value }))).toBeUndefined();
  });

  it("finds nothing when the link has no area", () => {
    expect(areaFromParams(new URLSearchParams("case=qadirabad"))).toBeUndefined();
  });
});
