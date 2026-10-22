import { describe, expect, it } from "vitest";

import { parseEnabledHazards } from "@/features/analysis/hazards";

const ids = (value: string | undefined): string[] => parseEnabledHazards(value).map((h) => h.id);

describe("parseEnabledHazards (VITE_ENABLED_HAZARDS feature flag)", () => {
  it("enables the listed hazards", () => {
    expect(ids("wildfire")).toEqual(["wildfire"]);
  });

  it("ignores unknown ids, spaces and duplicates", () => {
    expect(ids(" wildfire , flood,wildfire")).toEqual(["wildfire"]);
  });

  // A typo in the deploy config must not leave the demo without any hazard.
  it("falls back to wildfire when unset, empty or all unknown", () => {
    expect(ids(undefined)).toEqual(["wildfire"]);
    expect(ids("")).toEqual(["wildfire"]);
    expect(ids("volcano")).toEqual(["wildfire"]);
  });
});
