import { describe, expect, it } from "vitest";

import { keepDatesWhole } from "@/features/case-panel/keepDatesWhole";

describe("keepDatesWhole", () => {
  // Regression: Kumamoto's "21 Jul → 14 Aug" wrapped as "21 Jul → 14" / "Aug" at 360 px.
  it("glues each day to its month, leaving the space around the arrow breakable", () => {
    expect(keepDatesWhole("21 Jul → 14 Aug")).toBe("21\u00a0Jul → 14\u00a0Aug");
  });

  it("leaves values without dates alone", () => {
    expect(keepDatesWhole("0.15% flagged")).toBe("0.15% flagged");
    expect(keepDatesWhole("3 + 5")).toBe("3 + 5");
    expect(keepDatesWhole("7,609 cells")).toBe("7,609 cells");
  });
});
