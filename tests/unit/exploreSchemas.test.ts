import real from "../fixtures/exploration-qadirabad.json";
import { describe, expect, it } from "vitest";

import { explorationSchema, isFinal, lensEvaluationOf } from "@/features/explore/exploreSchemas";

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

describe("lensEvaluationOf", () => {
  const evaluationOf = (view: unknown) => {
    const result = explorationSchema.parse(view).result;
    return result === null ? undefined : lensEvaluationOf(result);
  };

  it("reads the real evaluation in camelCase", () => {
    expect(evaluationOf(REAL)).toEqual({
      targetDate: "2026-11-11",
      baselinePasses: 4,
      pixelSpacingM: 10,
      pixelDualDarkening: "absent_on_sampled_support",
      dualDarkening: {
        state: "supports",
        fraction: expect.closeTo(0.1987, 4),
        signatureCells: 208344,
        supportedCells: 1048576,
      },
      coPolBrightening: {
        state: "supports",
        fraction: expect.closeTo(0.1229, 4),
        signatureCells: 128837,
        supportedCells: 1048576,
      },
      dualDarkeningMaxChangeDb: { co: -3, cross: -1.5 },
      surroundings: {
        status: "evaluated",
        differentialState: "absent_on_sampled_support",
        focalCells: 115,
        minimumCells: 5,
        surroundingCells: 2376,
        matchedControlCells: 115,
        focalRadiusM: 60,
        annulusM: [120, 300],
      },
    });
  });

  it("drops a block it can't read and keeps the rest of the answer", () => {
    const result = REAL["result"] as Record<string, unknown>;
    const lens = result["lens"] as Record<string, unknown>;
    const evaluation = lens["evaluation"] as Record<string, unknown>;
    const broken = {
      ...REAL,
      result: {
        ...result,
        lens: {
          ...lens,
          evaluation: {
            ...evaluation,
            grid_signatures: { dual_darkening: { state: 3 } },
            surrounding_comparison: "not an object",
          },
        },
      },
    };
    const parsed = evaluationOf(broken);
    expect(parsed?.dualDarkening).toBeUndefined();
    expect(parsed?.coPolBrightening).toBeUndefined();
    expect(parsed?.surroundings).toBeUndefined();
    expect(parsed?.pixelDualDarkening).toBe("absent_on_sampled_support");
  });

  it("has no evaluation when the lens has none", () => {
    const result = REAL["result"] as Record<string, unknown>;
    const lens = { ...(result["lens"] as Record<string, unknown>), evaluation: undefined };
    expect(evaluationOf({ ...REAL, result: { ...result, lens } })).toBeUndefined();
  });
});
