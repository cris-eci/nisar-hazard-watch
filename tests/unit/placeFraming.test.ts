import { describe, expect, it } from "vitest";

import { placeFraming } from "@/features/search/placeFraming";
import type { Place } from "@/features/search/placesApi";

const place = (overrides: Partial<Place>): Place => ({
  id: "n1",
  name: "Somewhere",
  displayName: "Somewhere",
  kind: "town",
  point: [73.5, 32.3],
  bbox: null,
  importance: 0.1,
  ...overrides,
});

describe("placeFraming", () => {
  it("frames the 10.24 km square when the place has no box", () => {
    const { box, zoom } = placeFraming(place({}));
    expect((box[3] - box[1]) * 111.32).toBeCloseTo(10.24, 2);
    expect(zoom).toBeCloseTo(3.2);
  });

  it("frames the square when the place is smaller than the square", () => {
    const { box } = placeFraming(place({ bbox: [73.49, 32.29, 73.51, 32.31] }));
    expect((box[3] - box[1]) * 111.32).toBeCloseTo(10.24, 2);
  });

  it("shows a place larger than the square whole", () => {
    const { box, zoom } = placeFraming(place({ bbox: [73, 32, 74, 33] }));
    expect(box).toEqual([73, 32, 74, 33]);
    expect(zoom).toBeLessThan(2);
  });

  it("keeps longitudes continuous for a place across the antimeridian", () => {
    const { box } = placeFraming(place({ point: [180, -17], bbox: [177, -19, -178, -16] }));
    expect(box).toEqual([177, -19, 182, -16]);
  });
});
