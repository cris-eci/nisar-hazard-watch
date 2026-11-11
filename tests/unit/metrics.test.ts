import { describe, expect, it } from "vitest";

import { formatMetric, MODEL_SCORES, visibleMetrics } from "@/features/charts/metrics";

describe("visibleMetrics", () => {
  it("shows only F1 in Plain when the card reports it", () => {
    expect(visibleMetrics({ precision: 0.9, recall: 0.9, f1: 0.9, iou: null }, "plain")).toEqual([
      "f1",
    ]);
  });

  // The water model's development set has no F1: Plain must not drop the test.
  it("falls back to precision and recall in Plain when F1 is not reported", () => {
    expect(visibleMetrics({ precision: 0.58, recall: 0.71, f1: null, iou: null }, "plain")).toEqual(
      ["precision", "recall"],
    );
  });

  it("shows all four in Technical, missing ones included", () => {
    expect(
      visibleMetrics({ precision: 0.58, recall: 0.71, f1: null, iou: null }, "technical"),
    ).toEqual(["precision", "recall", "f1", "iou"]);
  });
});

describe("formatMetric", () => {
  it("keeps a near-perfect score from rounding up to 1.00", () => {
    expect(formatMetric(0.9973)).toBe("0.997");
    expect(formatMetric(1)).toBe("1.00");
    expect(formatMetric(0.8889)).toBe("0.89");
  });
});

describe("MODEL_SCORES", () => {
  it("keeps every score on the 0–1 axis and flags the disturbance model as reused dev data", () => {
    const values = MODEL_SCORES.flatMap((model) =>
      model.tests.flatMap((test) => Object.values(test.values)),
    );
    expect(values.every((v) => v === null || (v >= 0 && v <= 1))).toBe(true);
    const disturbance = MODEL_SCORES.find((model) => model.name === "Tree-cover disturbance");
    expect(disturbance?.tests.every((test) => test.warn === true)).toBe(true);
  });
});
