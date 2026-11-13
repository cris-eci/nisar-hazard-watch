import { describe, expect, it } from "vitest";

import real from "../fixtures/exploration-qadirabad.json";
import { fireContextOf } from "@/features/explore/exploreFire";
import {
  explorationSchema,
  type ExplorationResult,
  type FireContext,
} from "@/features/explore/exploreSchemas";
import { exploreSubject } from "@/features/explore/exploreSubject";

const VIEW = explorationSchema.parse(real);
const CONTEXT = {
  name: "32.33° N, 73.71° E",
  frameLabel: "Track 84 · Frame 18",
  point: [73.713, 32.329] as [number, number],
};

// The shape the backend documents for result.fireContext (backend PR: independent FIRMS context).
const AVAILABLE: FireContext = {
  status: "available",
  source: "NASA FIRMS · VIIRS 375 m active-fire detections",
  windowStart: "2026-10-30T02:00:00Z",
  windowEnd: "2026-11-11T02:00:00Z",
  detections: 3,
  lowConfidenceExcluded: 1,
  firstDetection: "2026-11-02T08:41:00Z",
  lastDetection: "2026-11-09T20:12:00Z",
  peakFrpMw: 9.54,
  satellites: ["N", "N20"],
  products: ["VIIRS_NOAA20_SP", "VIIRS_SNPP_SP"],
  note: "Independent thermal evidence, separate from the radar.",
};

const withContext = (fireContext: FireContext | null | undefined): ExplorationResult => {
  const result = structuredClone(VIEW.result);
  if (result === null) throw new Error("the real answer has a result");
  if (fireContext === undefined) delete result.fireContext;
  else result.fireContext = fireContext;
  return result;
};

describe("fireContextOf", () => {
  it("summarises detections with dates, the brightest reading and satellite names", () => {
    const view = fireContextOf(withContext(AVAILABLE));

    expect(view?.status).toBe("available");
    expect(view?.headline).toBe("3 active-fire detections between the two passes");
    expect(view?.facts).toEqual([
      { k: "Window", v: "30 Oct 2026 – 11 Nov 2026" },
      { k: "First detection", v: "2 Nov 2026" },
      { k: "Last detection", v: "9 Nov 2026" },
      { k: "Brightest", v: "9.5 MW" },
      { k: "Satellites", v: "Suomi NPP · NOAA-20" },
      { k: "Low confidence, not counted", v: "1" },
    ]);
    expect(view?.note).toBe(AVAILABLE.note);
  });

  it("says no detections without implying that no fire happened", () => {
    const view = fireContextOf(
      withContext({
        ...AVAILABLE,
        detections: 0,
        lowConfidenceExcluded: 0,
        firstDetection: null,
        lastDetection: null,
        peakFrpMw: null,
        satellites: [],
      }),
    );

    expect(view?.headline).toBe("No active-fire detections between the two passes");
    expect(view?.facts.map((fact) => fact.k)).toEqual(["Window"]);
  });

  it("uses the singular for one detection and keeps an unknown satellite code", () => {
    const view = fireContextOf(withContext({ ...AVAILABLE, detections: 1, satellites: ["X9"] }));

    expect(view?.headline).toBe("1 active-fire detection between the two passes");
    expect(view?.facts.find((fact) => fact.k === "Satellites")?.v).toBe("X9");
  });

  it.each([
    ["unavailable", "Fire context unavailable"],
    ["notConfigured", "Fire context not configured"],
  ] as const)("a %s context shows its status and no numbers", (status, headline) => {
    const view = fireContextOf(
      withContext({ ...AVAILABLE, status, detections: null, lowConfidenceExcluded: null }),
    );

    expect(view?.headline).toBe(headline);
    expect(view?.facts).toEqual([]);
  });

  it("is absent when the answer has no fire context", () => {
    expect(fireContextOf(withContext(undefined))).toBeUndefined();
    expect(fireContextOf(withContext(null))).toBeUndefined();
  });
});

describe("exploreSubject with a fire context", () => {
  it("keeps the fire context apart from the radar verdict and cites FIRMS", () => {
    const view = structuredClone(VIEW);
    view.result = withContext(AVAILABLE);

    const subject = exploreSubject(view, CONTEXT);

    expect(subject?.verdict).toBe("within");
    expect(subject?.fireContext?.headline).toContain("3 active-fire detections");
    expect(subject?.sources.at(-1)?.href).toBe("https://firms.modaps.eosdis.nasa.gov/");
  });

  it("adds no FIRMS source to an answer without fire context", () => {
    const subject = exploreSubject(VIEW, CONTEXT);

    expect(subject?.fireContext).toBeUndefined();
    expect(subject?.sources.map((source) => source.href)).not.toContain(
      "https://firms.modaps.eosdis.nasa.gov/",
    );
  });
});
