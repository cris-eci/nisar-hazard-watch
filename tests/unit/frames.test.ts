import { describe, expect, it } from "vitest";

import type { LonLat } from "@/features/frames/frame.types";
import { findFrameAt, toFrame } from "@/features/frames/frames";

const square = (west: number, south: number, size: number): LonLat[] => [
  [west, south],
  [west + size, south],
  [west + size, south + size],
  [west, south + size],
  [west, south],
];

const ascending = toFrame({ t: 47, f: 3, p: "A", x: 1, r: [square(-76, 2, 4)] });
const descending = toFrame({ t: 83, f: 86, p: "D", x: 0, r: [square(-76, 2, 4)] });
// Antimeridian frames arrive as two rings, one on each side of ±180°.
const splitFrame = toFrame({
  t: 14,
  f: 126,
  p: "A",
  x: 1,
  r: [square(178, 10, 2), square(-180, 10, 1)],
});
const frames = [ascending, descending, splitFrame];

describe("findFrameAt", () => {
  it("returns the frame of the requested pass under the point", () => {
    expect(findFrameAt(frames, [-74, 4], "A")?.id).toBe("47-3");
    expect(findFrameAt(frames, [-74, 4], "D")?.id).toBe("83-86");
  });

  it("returns undefined over areas without frames", () => {
    expect(findFrameAt(frames, [0, 0], "A")).toBeUndefined();
  });

  it("finds frames split across the antimeridian on either side", () => {
    expect(findFrameAt(frames, [179, 11], "A")?.id).toBe("14-126");
    expect(findFrameAt(frames, [-179.5, 10.5], "A")?.id).toBe("14-126");
  });
});
