import { describe, expect, it } from "vitest";

import real from "../fixtures/exploration-qadirabad.json";
import { defaultLayerId, layerTitle, liveLayers } from "@/features/explore/exploreLayers";
import { explorationCsv, explorationJson } from "@/features/explore/exploreExport";
import { explorationSchema, type ExplorationView } from "@/features/explore/exploreSchemas";
import { exploreSubject, verdictOfResult } from "@/features/explore/exploreSubject";
import { exploreTimeline } from "@/features/explore/exploreTimeline";
import { countdown, formatSeconds } from "@/features/explore/exploreTiming";

const VIEW: ExplorationView = explorationSchema.parse(real);
const CONTEXT = {
  name: "32.33° N, 73.71° E",
  frameLabel: "Track 84 · Frame 18",
  point: [73.713, 32.329] as [number, number],
};

const withLens = (point: object | null, extra: object = {}): ExplorationView => {
  const view = structuredClone(VIEW);
  if (view.result?.lens) Object.assign(view.result.lens, { point }, extra);
  return view;
};

describe("exploreSubject", () => {
  it("turns a real answer into a subject without a single demo flag", () => {
    const subject = exploreSubject(VIEW, CONTEXT);

    expect(subject).toMatchObject({
      kind: "live",
      verdict: "within",
      demo: false,
      place: "Track 84 · Frame 18",
      target: "2026-11-11",
      chipKm: 10.24,
    });
    expect(subject?.passes).toBeUndefined();
    expect(subject?.when).toBe("Target pass 11 Nov 2026");
  });

  it("carries the target-minus-baseline numbers against the normal range", () => {
    const range = exploreSubject(VIEW, CONTEXT)?.normalRange;

    expect(range?.baselinePasses).toBe(4);
    expect(range?.channels.map((item) => item.channel)).toEqual(["HH", "HV"]);
    expect(range?.channels[0]).toMatchObject({ halfWidth: 3 });
    expect(range?.channels[0]?.delta).toBeCloseTo(-1.159, 2);
  });

  it("reports the share of cells that left their range with the real counts", () => {
    const subject = exploreSubject(VIEW, CONTEXT);
    const [group] = subject?.groups ?? [];

    expect(subject?.stat).toBe("32.9%");
    expect(group?.rows.map((row) => [row.label, row.k, row.n])).toEqual([
      ["Measured", 1046529, 1046529],
      ["Left the normal range", 344013, 1046529],
    ]);
  });

  it("says what the service measured: status, passes, coverage, series, maturity", () => {
    const quality = Object.fromEntries(
      (exploreSubject(VIEW, CONTEXT)?.quality ?? []).map((item) => [item.k, item.v]),
    );

    expect(quality).toMatchObject({
      Status: "Complete",
      Passes: "4 + 1",
      Series: "084_A_018_4005_DHDH",
      Maturity: "Mixed",
      Optical: "Not used",
      Grid: "10 m",
    });
    expect(quality["Coverage"]).toBe("99.8%");
  });

  it("keeps the API's limitations and leaves the unreported things empty", () => {
    const subject = exploreSubject(VIEW, CONTEXT);

    expect(subject?.plainLimit).toContain("not a validated classifier");
    expect(subject?.techLimit).toContain("No forecast, probability, cause");
    expect(subject?.empties).toContain("Displacement");
    expect(subject?.alternatives).toContain("Existing water");
  });

  it("lists the stages the service timed", () => {
    expect(exploreSubject(VIEW, CONTEXT)?.compute?.map((step) => step.label)).toEqual([
      "Choosing the passes",
      "Reading the passes",
      "Measuring against the normal range",
      "Drawing the layers",
    ]);
  });

  it("is a demo only when the service says its result is synthetic", () => {
    const synthetic = structuredClone(VIEW);
    if (synthetic.result) synthetic.result.isDemo = true;

    expect(exploreSubject(synthetic, CONTEXT)?.demo).toBe(true);
  });

  it("has no subject while there is no result", () => {
    expect(exploreSubject({ ...VIEW, result: null }, CONTEXT)).toBeUndefined();
  });

  it.each([
    ["observed_departure", "departure"],
    ["within_observed_baseline", "within"],
    ["insufficient_data", "insufficient"],
    ["something_new", "insufficient"],
  ])("reads the lens state %s as %s", (state, verdict) => {
    const view = withLens({
      status: state,
      target_minus_baseline_db: {},
      diagnostic_half_width_db: {},
    });
    expect(view.result && verdictOfResult(view.result)).toBe(verdict);
  });

  it("is insufficient with the service's reason when the lens had no point", () => {
    const view = withLens(null, { status: "insufficient_data", reason: "pixel_masked" });
    const subject = exploreSubject(view, CONTEXT);

    expect(subject?.verdict).toBe("insufficient");
    expect(subject?.reason).toContain("pixel masked");
    expect(subject?.normalRange).toBeUndefined();
  });
});

describe("live layers", () => {
  it("makes every layer fetchable from this origin and picks the diagnostic one first", () => {
    const layers = liveLayers(VIEW);

    expect(layers).toHaveLength(6);
    expect(layers[0]?.href).toBe(`/api/v1/explorations/${VIEW.id}/layers/display_2026-07-14_HH`);
    expect(defaultLayerId(layers)).toBe("display_flood_signature_flags_co_pol_brightening");
    const last = layers.at(-1);
    expect(last && layerTitle(last)).toBe("flood signature flags co pol brightening");
  });

  it("falls back to the newest measured pass without a change or diagnostic layer", () => {
    const layers = liveLayers(VIEW).filter((layer) => layer.kind === "observed");
    expect(defaultLayerId(layers)).toBe("display_2026-09-12_HH");
    expect(defaultLayerId([])).toBeUndefined();
  });
});

describe("exploreTimeline", () => {
  it("draws the scenes read as baseline and target and the plan's next passes as planned", () => {
    const data = exploreTimeline(
      VIEW,
      [
        { date: "2026-11-11", hasCrossPol: true },
        { date: "2026-11-20", hasCrossPol: true },
        { date: "2026-12-02", hasCrossPol: false },
      ],
      "2026-11-12",
    );

    expect(data?.passes.map((pass) => [pass.date, pass.kind])).toEqual([
      ["2026-07-14", "base"],
      ["2026-08-19", "base"],
      ["2026-09-12", "base"],
      ["2026-10-18", "base"],
      ["2026-11-11", "target"],
      ["2026-11-20", "plan"],
      ["2026-12-02", "plan"],
    ]);
    expect(data?.optical).toEqual([]);
    expect(data?.passes.every((pass) => pass.outsidePct === undefined)).toBe(true);
  });

  it("never draws a scene the service could not read as measured", () => {
    const view = structuredClone(VIEW);
    const masked = view.result?.observations[0];
    if (masked) masked.status = "masked";

    expect(
      exploreTimeline(view, undefined, "2026-11-12")?.passes.map((pass) => pass.date),
    ).not.toContain("2026-07-14");
  });

  it("has no timeline without a result", () => {
    expect(exploreTimeline({ ...VIEW, result: null }, undefined, "2026-11-12")).toBeUndefined();
  });
});

describe("countdown", () => {
  const running: ExplorationView = {
    ...VIEW,
    status: "running",
    result: null,
    etaSeconds: 60,
    elapsedSeconds: 20,
  };

  it("counts down from the estimate between polls", () => {
    const timer = countdown(running, 1_000_000, 1_016_000);

    expect(timer.elapsedSeconds).toBeCloseTo(36);
    expect(timer.remainingSeconds).toBeCloseTo(24);
    expect(timer.overdue).toBe(false);
    expect(timer.fraction).toBeCloseTo(0.6);
  });

  it("shows remaining time ≈ estimate − elapsed once 60 % has passed", () => {
    const timer = countdown({ ...running, elapsedSeconds: 36 }, 5_000, 5_000);

    expect(timer.fraction).toBeCloseTo(0.6);
    expect(timer.remainingSeconds).toBeCloseTo(24);
  });

  it("stops promising past the estimate and keeps the bar short of full", () => {
    const timer = countdown({ ...running, elapsedSeconds: 90 }, 0, 0);

    expect(timer.overdue).toBe(true);
    expect(timer.remainingSeconds).toBe(0);
    expect(timer.fraction).toBeLessThan(1);
  });

  it("has no countdown without an estimate", () => {
    expect(countdown({ ...running, etaSeconds: null }, 0, 0)).toMatchObject({
      remainingSeconds: null,
      overdue: false,
      fraction: 0,
    });
  });

  it.each([
    [0, "0 s"],
    [41.4, "41 s"],
    [60, "1 min 00 s"],
    [125, "2 min 05 s"],
  ])("writes %f seconds as %s", (seconds, text) => {
    expect(formatSeconds(seconds)).toBe(text);
  });
});

describe("exploration exports", () => {
  it("keeps the whole answer in the JSON with its honest source line", () => {
    const parsed = JSON.parse(explorationJson(VIEW)) as {
      source: string;
      exploration: { id: string };
    };

    expect(parsed.exploration.id).toBe(VIEW.id);
    expect(parsed.source).toContain("not a validated classifier");
  });

  it("writes one CSV row per scene with its role", () => {
    const lines = explorationCsv(VIEW).trim().split("\n");

    expect(lines[0]).toContain("not a validated classifier");
    expect(lines[2]).toBe("date,role,status,granule_id");
    expect(lines).toHaveLength(8);
    expect(lines.find((line) => line.startsWith("2026-11-11"))).toContain(",target,observed,");
    expect(lines.find((line) => line.startsWith("2026-07-14"))).toContain(",baseline,observed,");
  });
});
