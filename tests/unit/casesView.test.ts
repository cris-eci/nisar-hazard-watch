import { describe, expect, it } from "vitest";

import { CASES, LENSES } from "@/features/cases/cases";
import {
  caseCountry,
  caseHref,
  caseSummary,
  filterCases,
  filterOptions,
  HAZARD_ROW,
} from "@/pages/cases/casesView";

describe("cases page filter", () => {
  it("keeps only the cases that ask the chosen question", () => {
    const floods = filterCases(CASES, "flood_wetland");
    expect(floods.map(({ id }) => id)).toEqual(["qadirabad", "chokwe", "richmond"]);
    expect(filterCases(CASES, "all")).toHaveLength(CASES.length);
  });

  it("lists every lens, even one with no case yet, with its count", () => {
    const options = filterOptions();
    expect(options.map(({ id }) => id)).toEqual(["all", ...LENSES.map(({ id }) => id)]);
    expect(options.find(({ id }) => id === "all")?.count).toBe(CASES.length);
    expect(options.find(({ id }) => id === "wildfire")?.count).toBe(0);
    const total = options.filter(({ id }) => id !== "all").reduce((sum, o) => sum + o.count, 0);
    expect(total).toBe(CASES.length);
  });
});

describe("case card copy", () => {
  it("links every case to the explorer", () => {
    for (const item of CASES) expect(caseHref(item)).toBe(`/explore?case=${item.id}`);
  });

  it("names the country after the place", () => {
    const qadirabad = CASES.find(({ id }) => id === "qadirabad");
    expect(qadirabad && caseCountry(qadirabad)).toBe("Pakistan");
  });

  // A pending case has no measurement, so it must never read like a number.
  it("explains a pending case instead of showing a stat", () => {
    const choco = CASES.find(({ id }) => id === "choco");
    expect(choco && caseSummary(choco)).not.toMatch(/^Pending/);
    expect(choco && caseSummary(choco)).toBe(choco?.verdictLine);
  });
});

describe("five-hazard row", () => {
  it("marks landslides as the one hazard with no lens yet", () => {
    expect(HAZARD_ROW.filter(({ hasLens }) => !hasLens).map(({ id }) => id)).toEqual(["landslide"]);
  });
});
