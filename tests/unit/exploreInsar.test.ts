import { describe, expect, it } from "vitest";

import kumamoto from "../fixtures/exploration-kumamoto-insar.json";
import { defaultLayerId, layerTitle, liveLayers } from "@/features/explore/exploreLayers";
import { NO_DISPLACEMENT } from "@/features/explore/exploreInsar";
import { explorationSchema, type ExplorationView } from "@/features/explore/exploreSchemas";
import { exploreSubject } from "@/features/explore/exploreSubject";

const VIEW: ExplorationView = explorationSchema.parse(kumamoto);
const CONTEXT = {
  name: "32.65° N, 130.65° E",
  frameLabel: "Track 24 · Frame 18",
  point: [130.65, 32.65] as [number, number],
};

const withInsar = (changes: object): ExplorationView => {
  const view = structuredClone(VIEW);
  if (view.result?.insar) Object.assign(view.result.insar, changes);
  return view;
};

describe("a real InSAR answer", () => {
  it("passes the schema, with no displacement and two layers of its own kinds", () => {
    expect(VIEW.lens).toBe("insar");
    expect(VIEW.result?.insar?.losDisplacementCm).toBeNull();
    expect(VIEW.result?.layers.map((layer) => layer.kind)).toEqual(["coherence", "phase"]);
  });

  it("is a measurement with no verdict and says displacement is not reported", () => {
    const subject = exploreSubject(VIEW, CONTEXT);

    expect(subject).toMatchObject({
      kind: "live",
      lens: "insar",
      verdict: "measured",
      demo: false,
      target: "2026-08-14",
      when: "Pair 21 Jul → 14 Aug 2026",
    });
    expect(subject?.insar?.displacement).toBe(NO_DISPLACEMENT);
    expect(subject?.normalRange).toBeUndefined();
    expect(subject?.verdictLine).toContain("No displacement is reported");
  });

  it("states the pair's own numbers: baseline, median coherence and the point", () => {
    const facts = Object.fromEntries(
      (exploreSubject(VIEW, CONTEXT)?.insar?.facts ?? []).map((fact) => [fact.k, fact.v]),
    );

    expect(facts).toEqual({
      Pair: "21 Jul → 14 Aug 2026",
      "Temporal baseline": "24 days",
      "Median coherence": "0.43",
      "Coherence at the point": "0.25",
      "Wrapped phase at the point": "none above 0.35",
    });
  });

  it("reports the share of cells that kept enough coherence, with its bars", () => {
    const subject = exploreSubject(VIEW, CONTEXT);

    expect(subject?.stat).toBe("63.3%");
    expect(subject?.statLine).toContain("62,500 cells");
    expect(subject?.groups[0]?.rows.map((row) => [row.k, row.n])).toEqual([
      [62500, 62500],
      [39584, 62500],
    ]);
  });

  it("lists the pair, the corrections and the grid as quality, and cites the GUNW archive", () => {
    const subject = exploreSubject(VIEW, CONTEXT);

    expect(subject?.quality.map((entry) => entry.k)).toEqual([
      "Status",
      "Pair",
      "Baseline",
      "Polarization",
      "Grid",
      "Corrections",
      "Answered",
    ]);
    expect(subject?.quality.find((entry) => entry.k === "Corrections")?.v).toBe("None");
    expect(subject?.sources[0]?.label).toContain("GUNW");
  });

  it("shows a pair without phase as partial, with the threshold named", () => {
    const subject = exploreSubject(
      withInsar({ status: "partial", phaseCells: 0, pointWrappedPhaseRad: null }),
      CONTEXT,
    );

    expect(subject?.verdictLine).toContain("no cell reaches the phase threshold");
    expect(subject?.stat).toBe("0.0%");
  });

  it.each([
    ["pair_unavailable", "no longer lists this pair"],
    ["outside_quantitative_grid", "outside the pair's valid grid"],
    ["no_focused_coherence", "no focused coherence"],
    ["something_new", "no usable measurement"],
  ])("explains a no-data pair (%s) in plain words", (reason, expected) => {
    const subject = exploreSubject(
      withInsar({
        status: "no_data",
        reason,
        coherentCells: null,
        phaseCells: null,
        windowCells: null,
      }),
      CONTEXT,
    );

    expect(subject?.verdictLine).toContain("No usable coherence");
    expect(subject?.reason).toContain(expected);
    expect(subject?.groups).toEqual([]);
    expect(subject?.stat).toBeUndefined();
  });
});

describe("InSAR layers", () => {
  const layers = liveLayers(VIEW);

  it("opens on the coherence and keeps the phase a click away", () => {
    expect(layers.map(layerTitle)).toEqual(["Interferometric coherence", "Wrapped phase"]);
    expect(defaultLayerId(layers)).toBe("display_coherence_coherence");
  });

  it("keeps the cyclic palette and the radian range of the phase", () => {
    const phase = layers.find((layer) => layer.kind === "phase");

    expect(phase?.colormap).toBe("twilight");
    expect(phase?.valueRange).toEqual([-3.1415926536, 3.1415926536]);
  });
});
