import { describe, expect, it } from "vitest";

import { bandSentence } from "@/features/case-panel/verdicts";
import { demoBandPasses, verdictOf } from "@/features/cases/demoBand";
import {
  archiveError,
  gridMetres,
  jobSteps,
  liveAnswer,
  pickDemoVerdict,
  splitPlan,
} from "@/features/live/liveQuestion";
import { framedBox, viewInsets } from "@/features/globe/framing";

const ids = Array.from({ length: 400 }, (_, i) => `${i % 173}-${i}`);

describe("live question (demo answer on a real frame)", () => {
  it("gives the same frame the same answer every time", () => {
    for (const id of ids.slice(0, 20)) expect(pickDemoVerdict(id)).toBe(pickDemoVerdict(id));
  });

  it("spreads frames over all three outcomes", () => {
    const seen = new Set(ids.map(pickDemoVerdict));
    expect(seen).toEqual(new Set(["departure", "within", "insufficient"]));
  });

  it("computes the verdict from the series with the band rule, not from the pick", () => {
    for (const id of ids.slice(0, 50)) {
      const answer = liveAnswer(id);
      expect(answer.verdict).toBe(verdictOf(answer.passes));
      expect(answer.quality).toHaveLength(3);
    }
  });

  it("names the optical step after the lens", () => {
    expect(jobSteps("flood_wetland")[5]?.label).toBe("Looking for optical water");
    expect(jobSteps("wildfire")[5]?.label).toBe("Looking for optical vegetation loss");
    expect(jobSteps("flood_wetland")).toHaveLength(6);
  });

  it("splits the plan at today", () => {
    const plan = [
      { date: "2026-11-01", hasCrossPol: true },
      { date: "2026-11-08", hasCrossPol: true },
      { date: "2026-11-20", hasCrossPol: false },
    ];
    const { past, upcoming } = splitPlan(plan, "2026-11-08");
    expect(past.map((item) => item.date)).toEqual(["2026-11-01", "2026-11-08"]);
    expect(upcoming.map((item) => item.date)).toEqual(["2026-11-20"]);
  });

  it("says 80 m and 40 m grids for the two chip sizes", () => {
    expect(gridMetres(10.24)).toBe(80);
    expect(gridMetres(5.12)).toBe(40);
  });

  it("maps a full queue apart from an archive that didn't answer", () => {
    expect(archiveError(new Error("Observation Plan API returned HTTP 503")).body).toContain(
      "Lots of people",
    );
    expect(archiveError(new Error("Observation Plan API returned HTTP 502")).title).toBe(
      "We couldn't reach the radar archive",
    );
    expect(archiveError(new Error("Failed to fetch")).title).toBe(
      "We couldn't reach the radar archive",
    );
  });

  it("describes each demo series the way the chart draws it", () => {
    expect(bandSentence(demoBandPasses("departure"))).toContain(
      "both radar channels came back darker",
    );
    expect(bandSentence(demoBandPasses("within"))).toContain("stayed inside");
    expect(bandSentence(demoBandPasses("insufficient"))).toContain("no verdict");
  });
});

describe("camera framing", () => {
  it("centres the box in the free area right of the panel", () => {
    const width = 1440;
    const height = 900;
    const insets = viewInsets("panel", width, height);
    const [west, south, east, north] = framedBox([10, 10, 11, 11], insets, width, height, 3.2);
    const freeCentreX = (insets.left + (width - insets.left - insets.right) / 2) / width;
    expect(west + (east - west) * freeCentreX).toBeCloseTo(10.5);
    const freeCentreY = (insets.bottom + (height - insets.top - insets.bottom) / 2) / height;
    expect(south + (north - south) * freeCentreY).toBeCloseTo(10.5);
  });

  it("uses the lower half on phones and the left strip with the sheet open", () => {
    expect(viewInsets("panel", 390, 844)).toMatchObject({ left: 0, right: 0, bottom: 422 });
    expect(viewInsets("sheet", 1440, 900).right).toBe(1440 - 345.6);
  });
});
