import real from "../fixtures/exploration-qadirabad.json";
import { describe, expect, it } from "vitest";

import { explorationSchema, isFinal } from "@/features/explore/exploreSchemas";

const REAL = real as Record<string, unknown>;

describe("explorationSchema", () => {
  it("accepts a real answer of the backend and keeps its science blocks", () => {
    const view = explorationSchema.parse(REAL);

    expect(view.status).toBe("succeeded");
    expect(view.result?.lens?.point?.status).toBe("within_observed_baseline");
    expect(view.result?.lens?.point?.target_minus_baseline_db["HH"]).toBeCloseTo(-1.159, 2);
    expect(view.result?.aoiSummary?.cells_departing_from_baseline).toBe(344013);
    expect(view.result?.layers).toHaveLength(6);
    expect(view.result?.isDemo).toBe(false);
  });

  it("accepts a queued job that has no result, ETA breakdown or error yet", () => {
    const queued = {
      ...REAL,
      status: "queued",
      result: null,
      error: null,
      etaRemainingSeconds: 60,
      stages: [],
    };
    expect(explorationSchema.parse(queued).result).toBeNull();
  });

  it.each([
    ["an unknown status", { status: "teleported" }],
    ["a layer without four bounds", { result: { ...(REAL["result"] as object), layers: [{}] } }],
    ["a missing id", { id: undefined }],
    ["a cache value we don't know", { cache: "warm" }],
  ])("rejects %s", (_, change) => {
    expect(explorationSchema.safeParse({ ...REAL, ...change }).success).toBe(false);
  });
});

describe("isFinal", () => {
  it.each([
    ["queued", false],
    ["running", false],
    ["succeeded", true],
    ["partial", true],
    ["noData", true],
    ["failed", true],
    ["cancelled", true],
  ] as const)("says %s is final: %s", (status, expected) => {
    expect(isFinal(status)).toBe(expected);
  });
});
