import { describe, expect, it } from "vitest";

import { initials, TEAM } from "@/content/team";
import { esriImageryUrl } from "@/pages/landing/eventImagery";
import { stepBlend, TEARDOWN_STEPS } from "@/pages/method/teardownSteps";
import { mapOffset } from "@/pages/site/footerMap";

describe("mapOffset", () => {
  it("puts lon 0, lat 0 at the centre of the 4096×2048 map", () => {
    expect(mapOffset(0, 0)).toEqual({ x: 2048, y: 1024 });
  });

  // The prototype passed lon and lat as strings and the Earth disappeared off screen.
  it("places Chía inside the map", () => {
    const { x, y } = mapOffset(-74.05, 4.86);
    expect(x).toBe(1205);
    expect(y).toBe(969);
  });
});

describe("esriImageryUrl", () => {
  it("frames the point with more ground below it, so it lands near the top of the card", () => {
    const url = new URL(esriImageryUrl([-67.221, 10.595]));
    const [west, south, east, north] = (url.searchParams.get("bbox") ?? "").split(",").map(Number);
    expect(west).toBeCloseTo(-67.541);
    expect(east).toBeCloseTo(-66.901);
    expect(south).toBeCloseTo(10.035);
    expect(north).toBeCloseTo(10.835);
    // 0.24° above and 0.56° below: the point sits 30% from the top.
    expect((north ?? 0) - 10.595).toBeCloseTo(0.3 * ((north ?? 0) - (south ?? 0)));
    expect(url.searchParams.get("size")).toBe("680,850");
  });
});

describe("initials", () => {
  it("uses the first name and the first surname", () => {
    expect(initials("Cristian Santiago Pedraza Rodríguez")).toBe("CP");
  });

  it("uses the second word when the name has two", () => {
    expect(initials("Ada Lovelace")).toBe("AL");
  });

  it("gives every member two letters", () => {
    for (const { name } of TEAM) expect(initials(name)).toMatch(/^\p{Lu}{2}$/u);
  });
});

describe("teardown steps", () => {
  it("holds still at both ends of a step and eases in between", () => {
    expect(stepBlend(0)).toBe(0);
    expect(stepBlend(0.3)).toBe(0);
    expect(stepBlend(0.6)).toBeCloseTo(0.5);
    expect(stepBlend(0.9)).toBe(1);
  });

  it("gives every step with a callout a tag to show", () => {
    for (const step of TEARDOWN_STEPS) {
      if (step.callout !== undefined) expect(step.tag).not.toBe("");
    }
  });
});
