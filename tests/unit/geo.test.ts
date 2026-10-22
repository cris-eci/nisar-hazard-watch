import { Euler } from "three";
import { describe, expect, it } from "vitest";

import { facingRotation, lonLatToVec } from "@/pages/landing/geo";

describe("facingRotation", () => {
  // The landing story turns the planet so the epicentre faces the camera; a wrong angle puts the
  // callout on the far side of the Earth.
  it.each([
    [-67.221, 10.595],
    [-74, 4],
    [130.66, 32.618],
    [0, -60],
  ])("turns %f, %f to face a camera on +Z", (lon, lat) => {
    const { x, y } = facingRotation(lon, lat);
    const point = lonLatToVec(lon, lat).applyEuler(new Euler(x, y, 0, "XYZ"));
    expect(point.x).toBeCloseTo(0, 6);
    expect(point.y).toBeCloseTo(0, 6);
    expect(point.z).toBeCloseTo(1, 6);
  });
});
