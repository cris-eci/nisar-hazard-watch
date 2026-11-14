import { describe, expect, it } from "vitest";

import { CASES, type TimelineData } from "@/features/cases/cases";
import {
  axisPct,
  barHeight,
  BAR_MAX_PX,
  formatDay,
  layoutTimeline,
  monthTicks,
  readoutOf,
} from "@/features/timeline/timelineLayout";

const data: TimelineData = {
  passes: [
    { date: "2026-07-01", kind: "base" },
    { date: "2026-07-13", kind: "base" },
    { date: "2026-07-25", kind: "target", outsidePct: 20 },
    { date: "2026-08-06", kind: "meas", outsidePct: 5 },
    { date: "2026-09-30", kind: "plan" },
  ],
  start: "2026-06-25",
  end: "2026-10-05",
  today: "2026-09-01",
  optical: [{ date: "2026-07-27", label: "OPERA · post" }],
  opticalNote: "Optical check",
};

describe("pass timeline layout", () => {
  it("places dates on the axis and clamps the ones outside it", () => {
    expect(axisPct("2026-06-25", data.start, data.end)).toBe(0);
    expect(axisPct("2026-10-05", data.start, data.end)).toBe(100);
    expect(axisPct("2027-01-01", data.start, data.end)).toBe(100);
    expect(axisPct("2026-08-15", "2026-08-15", "2026-08-15")).toBe(0);
  });

  it("never lets a planned pass be clicked or counted as measured", () => {
    const layout = layoutTimeline(data);
    const planned = layout.passes.filter((item) => item.kind === "plan");
    expect(planned.every((item) => !item.clickable)).toBe(true);
    expect(layout.measured).toEqual([0, 1, 2, 3]);
    expect(layout.next).toEqual({ left: planned[0]?.left, date: "2026-09-30" });
  });

  it("marks only the earliest planned pass after today as next", () => {
    const layout = layoutTimeline({
      ...data,
      passes: [
        ...data.passes,
        { date: "2026-10-20", kind: "plan" },
        { date: "2026-09-18", kind: "plan" },
      ],
    });
    const next = layout.passes.filter((item) => item.next);
    expect(next.map((item) => item.date)).toEqual(["2026-09-18"]);
    expect(layout.next?.date).toBe("2026-09-18");
    expect(layout.passes.filter((item) => item.kind !== "plan").some((item) => item.next)).toBe(
      false,
    );
  });

  it("brackets the baseline and finds the target", () => {
    const layout = layoutTimeline(data);
    expect(layout.targetIndex).toBe(2);
    expect(layout.baseline).toMatchObject({ count: 2, first: "2026-07-01", last: "2026-07-13" });
  });

  it("scales bars against a 10% floor so a tiny share stays tiny", () => {
    expect(barHeight("meas", 20, 20)).toBe(BAR_MAX_PX);
    expect(barHeight("meas", 0.4, 10)).toBe(2);
    expect(barHeight("base", undefined, 10)).toBe(1);
    expect(barHeight("plan", undefined, 10)).toBe(0);
  });

  it("ticks the first of every month after the start", () => {
    expect(monthTicks("2026-06-25", "2026-09-10")).toEqual([
      "2026-07-01",
      "2026-08-01",
      "2026-09-01",
    ]);
  });

  it("reads the comparison, or the pass in focus", () => {
    const layout = layoutTimeline(data);
    expect(readoutOf(data, layout, true, 2).line).toBe(
      "Baseline (2 passes, 1 Jul – 13 Jul) ↔ Target 25 Jul 2026",
    );
    expect(readoutOf(data, layout, false, 3)).toEqual({
      line: "6 Aug 2026 · measured pass",
      sub: "5.0% of supported cells outside the normal range",
    });
  });

  // Regression: Kumamoto has one baseline pass and read "1 passes, 21 Jul – 21 Jul".
  it("names a single baseline pass once", () => {
    const kumamoto = CASES.find((item) => item.id === "kumamoto")?.timeline;
    if (kumamoto === undefined) throw new Error("Kumamoto has a timeline");
    const layout = layoutTimeline(kumamoto);
    expect(readoutOf(kumamoto, layout, true, layout.targetIndex).line).toBe(
      "Baseline (1 pass, 21 Jul) ↔ Target 14 Aug 2026",
    );
  });
});

describe("formatDay", () => {
  // Regression (#20): newer ICU prints "12 Sept 2026" in en-GB; COPY-v8 writes "12 Sep 2026".
  it("writes September with three letters, like every other month", () => {
    expect(formatDay("2026-09-12")).toBe("12 Sep 2026");
    expect(formatDay("2026-09-12", false)).toBe("12 Sep");
  });
});
