import { describe, expect, it } from "vitest";

import { chipTitle, CHIPS, isChipHidden, type Provenance } from "@/lib/provenanceChips";

const KINDS = Object.keys(CHIPS) as Provenance[];

describe("CHIPS", () => {
  it("has the v8 text and testid for every kind", () => {
    expect(
      Object.fromEntries(KINDS.map((kind) => [kind, [CHIPS[kind].text, CHIPS[kind].testId]])),
    ).toEqual({
      real: ["REAL", "prov-real"],
      realDates: ["REAL DATES", "prov-real-dates"],
      demo: ["DEMO DATA", "prov-demo"],
      demoDates: ["DEMO DATES", "prov-demo-dates"],
      todo: ["TO FILL", "prov-todo"],
      pending: ["PENDING", "prov-pending"],
      unavailable: ["UNAVAILABLE", "prov-unavailable"],
      experimental: ["EXPERIMENTAL", "prov-experimental"],
      hypothesis: ["HYPOTHESIS · NOT A RESULT", "prov-hypothesis"],
      instant: ["INSTANT", "prov-instant"],
    });
  });

  it("dated variants look like their plain kind", () => {
    expect(CHIPS.realDates.look).toBe(CHIPS.real.look);
    expect(CHIPS.demoDates.look).toBe(CHIPS.demo.look);
  });
});

describe("chipTitle", () => {
  it("uses the design's tooltip when no source is given", () => {
    expect(chipTitle("hypothesis")).toBe("Interpretation, not a measurement");
    expect(chipTitle("realDates")).toBe("Dates and values from the job manifest");
    expect(chipTitle("real")).toBeUndefined();
  });

  it("prefers the caller's source", () => {
    expect(chipTitle("realDates", "Job 42 manifest")).toBe("Job 42 manifest");
  });
});

describe("isChipHidden", () => {
  it("Show REAL labels off hides only REAL", () => {
    expect(KINDS.filter((kind) => isChipHidden(kind, true))).toEqual(["real"]);
  });

  it("hides nothing when REAL labels are shown", () => {
    expect(KINDS.filter((kind) => isChipHidden(kind, false))).toEqual([]);
  });
});
