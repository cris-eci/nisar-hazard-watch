import { describe, expect, it } from "vitest";

import { CASES, type TimelinePass } from "@/features/cases/cases";
import {
  alignDemoBand,
  caseBandPasses,
  demoBandPasses,
  verdictOf,
} from "@/features/cases/demoBand";

const pass = (date: string, kind: TimelinePass["kind"]): TimelinePass => ({ date, kind });

// Regression: the band chart used fixed Aug–Oct demo dates for every case, so Qadirabad's chart put
// its target on 14 Oct while its Pass Timeline (and verdict line) say 26 Jul.
describe("case band chart dates", () => {
  it("uses each banded case's own pass dates and target", () => {
    for (const item of CASES.filter((entry) => entry.band !== undefined)) {
      const passes = caseBandPasses(item) ?? [];
      const timelineDates = new Set(item.timeline?.passes.map((entry) => entry.date));
      expect(passes.length).toBeGreaterThan(0);
      for (const entry of passes) expect(timelineDates.has(entry.date)).toBe(true);
      expect(passes.find((entry) => entry.role === "target")?.date).toBe(item.target);
      expect(passes.at(-1)?.role).toBe("target");
    }
  });

  it("puts Qadirabad's target on 26 Jul after its three baseline passes", () => {
    const qadirabad = CASES.find((item) => item.id === "qadirabad");
    const passes = qadirabad === undefined ? [] : (caseBandPasses(qadirabad) ?? []);
    expect(passes.map((entry) => [entry.date, entry.role])).toEqual([
      ["2026-06-20", "baseline"],
      ["2026-07-02", "baseline"],
      ["2026-07-14", "baseline"],
      ["2026-07-26", "target"],
    ]);
  });

  it("keeps each case's demo series verdict after the dates move", () => {
    for (const item of CASES) {
      if (item.band === undefined) continue;
      expect(verdictOf(caseBandPasses(item) ?? [])).toBe(item.band);
    }
  });

  it("fills baselines from the end and leaves gaps where the demo has no value", () => {
    const timeline = [
      ...["2026-01-01", "2026-01-13", "2026-01-25", "2026-02-06", "2026-02-18", "2026-03-02"].map(
        (date) => pass(date, "base"),
      ),
      pass("2026-03-14", "meas"),
      pass("2026-03-26", "target"),
      pass("2026-04-07", "meas"),
      pass("2026-05-01", "plan"),
    ];
    const demo = demoBandPasses("departure");
    const passes = alignDemoBand("departure", timeline) ?? [];
    // Six case baselines, five demo ones: the earliest is a gap, the rest are the demo values.
    expect(passes.slice(0, 6).map((entry) => entry.hh)).toEqual([
      null,
      ...demo.filter((entry) => entry.role === "baseline").map((entry) => entry.hh),
    ]);
    expect(passes[6]).toEqual({ date: "2026-03-14", role: "excluded", hh: null, hv: null });
    expect(passes.at(-1)).toEqual({
      date: "2026-03-26",
      role: "target",
      hh: demo.at(-1)?.hh,
      hv: demo.at(-1)?.hv,
    });
    expect(passes).toHaveLength(8);
  });

  it("gives up when the timeline has no target pass", () => {
    expect(alignDemoBand("within", [pass("2026-01-01", "base")])).toBeUndefined();
  });

  it("returns no series for a lens without a band", () => {
    const insar = CASES.find((item) => item.band === undefined);
    expect(insar === undefined ? undefined : caseBandPasses(insar)).toBeUndefined();
  });
});
