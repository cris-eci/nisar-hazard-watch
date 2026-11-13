import { describe, expect, it } from "vitest";

import { LIVE_REASON } from "@/features/live/liveQuestion";
import { lensReasons } from "@/features/lenses/reasons";

describe("lensReasons", () => {
  it("puts a known code in plain words, never the code itself", () => {
    const reasons = lensReasons("pixel_masked");
    expect(reasons).toEqual([
      "The clicked pixel has no usable value on at least one pass.",
      LIVE_REASON,
    ]);
    expect(reasons.join(" ")).not.toMatch(/_/);
  });

  it("falls back to the general advice for an unknown or missing code", () => {
    expect(lensReasons("weird_backend_text")).toEqual([LIVE_REASON]);
    expect(lensReasons(null)).toEqual([LIVE_REASON]);
  });
});
