import { describe, expect, it } from "vitest";

import { CASES } from "@/features/cases/cases";
import { coordinatePlace, parseLatLon } from "@/features/search/coordinates";
import type { Place } from "@/features/search/placesApi";
import { caseHits, searchRows } from "@/features/search/searchRows";

const BARH: Place = {
  id: "osm:1",
  name: "Barh",
  displayName: "Barh, Patna, Bihar, India",
  kind: "town",
  point: [85.7, 25.49],
  bbox: null,
  importance: 0.5,
};

describe("parseLatLon", () => {
  it("reads lat, lon as people paste it and returns [lon, lat]", () => {
    expect(parseLatLon("25.49, 85.70")).toEqual([85.7, 25.49]);
    expect(parseLatLon(" 25.49 85.70 ")).toEqual([85.7, 25.49]);
    expect(parseLatLon("-25.4,-60")).toEqual([-60, -25.4]);
  });

  it("refuses place names and points off the globe", () => {
    expect(parseLatLon("Qadirabad")).toBeUndefined();
    expect(parseLatLon("Route 66")).toBeUndefined();
    expect(parseLatLon("95, 10")).toBeUndefined();
    expect(parseLatLon("10, 190")).toBeUndefined();
  });
});

describe("coordinatePlace", () => {
  it("names a pasted point by its own numbers, with the right hemispheres", () => {
    expect(coordinatePlace([85.7, 25.49])).toMatchObject({
      name: "25.49° N, 85.70° E",
      kind: "coordinates",
      bbox: null,
    });
    expect(coordinatePlace([-60, -25.4]).name).toBe("25.40° S, 60.00° W");
  });
});

describe("caseHits", () => {
  it("finds a known case by name, ignoring accents and case", () => {
    expect(caseHits("chokwe", CASES).map(({ id }) => id)).toEqual(["chokwe"]);
    expect(caseHits("Qadirabad Pakistan", CASES).map(({ id }) => id)).toEqual(["qadirabad"]);
    expect(caseHits("Chenab", CASES).map(({ id }) => id)).toEqual(["qadirabad"]);
  });

  it("finds nothing for a place that isn't a case", () => {
    expect(caseHits("Barh", CASES)).toEqual([]);
  });
});

describe("searchRows", () => {
  it("tags geocoder hits 1–4 MIN with their coordinates and known cases INSTANT", () => {
    const rows = searchRows([BARH], caseHits("Qadirabad", CASES));
    expect(rows.map(({ name, sub, tag }) => ({ name, sub, tag }))).toEqual([
      { name: "Barh", sub: "25.49° N, 85.70° E · live analysis", tag: "1–4 MIN" },
      { name: "Qadirabad, Pakistan", sub: "Known case · flood · Jul 2026", tag: "INSTANT" },
    ]);
  });
});
