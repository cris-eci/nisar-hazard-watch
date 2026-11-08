import type { LensId, QualityItem, Source, Verdict } from "@/features/cases/cases";
import { demoBandPasses, verdictOf, type BandPass } from "@/features/cases/demoBand";
import type { Acquisition, LonLat } from "@/features/frames/frame.types";
import { OBSERVATION_PLAN_QUERY_URL } from "@/features/frames/observationPlanApi";

/*
 * A live question on any land: the frame and its passes are real (frames.json and the Observation
 * Plan); the radar answer is DEMO until POST /v1/explore exists. The demo series is picked from the
 * frame id so the same frame always gives the same answer, and the verdict is computed from it with
 * the backend's own band rule instead of being typed in.
 */

// The lens API reads a 128 × 128 grid at 80 m posting.
export const LIVE_CHIP_KM = 10.24;
export const GRID_CELLS = 128;

export const gridMetres = (chipKm: number): number => Math.round((chipKm * 1000) / GRID_CELLS);

// FNV-1a: tiny, stable across browsers, good enough to spread frame ids.
export const hashString = (text: string): number => {
  let hash = 0x811c9dc5;
  for (let i = 0; i < text.length; i++) {
    hash ^= text.charCodeAt(i);
    hash = Math.imul(hash, 0x01000193);
  }
  return hash >>> 0;
};

// Same mix as the prototype: 12 in 20 departures, 4 within, 4 with not enough radar.
export const pickDemoVerdict = (frameId: string): Verdict => {
  const bucket = hashString(frameId) % 20;
  if (bucket < 12) return "departure";
  if (bucket < 16) return "within";
  return "insufficient";
};

export type LiveAnswer = { passes: BandPass[]; verdict: Verdict; quality: QualityItem[] };

const QUALITY: Record<Verdict, QualityItem[]> = {
  departure: [
    { k: "Status", v: "Complete", why: "All selected passes usable." },
    { k: "Passes", v: "5 + 1", why: "Five baseline passes and the latest one." },
    { k: "Optical", v: "Pending", why: "The optical stage returns after the radar." },
  ],
  within: [
    { k: "Status", v: "Partial", why: "One selected pass was masked." },
    { k: "Passes", v: "5 + 1", why: "Five baseline passes and the latest one." },
    { k: "Optical", v: "Withheld", why: "Too little joint optical coverage." },
  ],
  insufficient: [
    { k: "Status", v: "No data", why: "Zero usable pixels at the point." },
    { k: "Series", v: "2 tried", why: "At most one alternative is tried." },
    { k: "Passes", v: "2 of 3+", why: "The band needs three earlier passes." },
  ],
};

export const liveAnswer = (frameId: string): LiveAnswer => {
  const passes = demoBandPasses(pickDemoVerdict(frameId));
  const verdict = verdictOf(passes);
  return { passes, verdict, quality: QUALITY[verdict] };
};

export const LIVE_LINE: Record<Verdict, string> = {
  departure: "At least one channel left this spot's normal range on the latest pass.",
  within: "Both channels stayed inside this spot's normal range.",
  insufficient:
    "No usable pixels on these dates. We tried one alternative series; it had the same gap.",
};

export const LIVE_REASON =
  "Try a longer date window, or a point a little away from steep terrain and open water.";

export const LIVE_LIMITS = {
  plain:
    "A change in the echo can come from water, soil moisture, crops or terrain. The radar doesn't say which.",
  tech: "Diagnostic band only; within bounds is not verified normal conditions. Point pixel support is checked separately from the chip.",
  alternatives: ["Soil moisture", "Crops", "Terrain shadow", "Stable water"],
  empties: ["Cause", "Probability", "Class"],
};

export const LIVE_SOURCES: Source[] = [
  { label: "NASA · NISAR Observation Plan (feature service)", href: OBSERVATION_PLAN_QUERY_URL },
  {
    label: "NISAR-Modeling · point exploration API",
    href: "https://github.com/Ch0comilo/NISAR-Modeling/blob/main/docs/EXPLORE_API.md",
  },
];

export type JobStep = { label: string; sub: string };

// SPECS §3: the six steps of the backend job, in order.
export const jobSteps = (lens: LensId): JobStep[] => [
  { label: "Finding NISAR passes over this point", sub: "catalog · compatible series" },
  { label: "Choosing one radar series", sub: "same track, frame, polarisations" },
  { label: "Reading up to 6 passes", sub: "GCOV · HH and HV · 80 m" },
  { label: "Building this spot's normal range", sub: "median ± MAD of earlier passes" },
  { label: "Comparing the target pass", sub: "signed dB, common cells" },
  {
    label:
      lens === "flood_wetland"
        ? "Looking for optical water"
        : lens === "vegetation_disturbance" || lens === "wildfire"
          ? "Looking for optical vegetation loss"
          : "Checking for independent evidence",
    sub: "OPERA · within 4 days",
  },
];

export const JOB_STEP_COUNT = 6;

// The Observation Plan lists past and future dates alike; today splits them.
export const splitPlan = (
  acquisitions: Acquisition[],
  today: string,
): { past: Acquisition[]; upcoming: Acquisition[] } => ({
  past: acquisitions.filter((item) => item.date <= today),
  upcoming: acquisitions.filter((item) => item.date > today),
});

export type ArchiveError = { title: string; body: string };

const ARCHIVE_DOWN: ArchiveError = {
  title: "We couldn't reach the radar archive",
  body: "The NASA archive didn't answer. Nothing is wrong with this place.",
};

// SPECS §3: a full queue (503) asks for patience; any other failure means the archive didn't answer.
export const archiveError = (error: Error): ArchiveError => {
  const status = /HTTP (\d{3})/.exec(error.message)?.[1];
  if (status === "503")
    return {
      title: "The radar queue is full",
      body: "Lots of people are asking right now. Try again in a minute.",
    };
  return ARCHIVE_DOWN;
};

export const formatLonLat = ([lon, lat]: LonLat): string =>
  `${Math.abs(lat).toFixed(2)}° ${lat >= 0 ? "N" : "S"}, ${Math.abs(lon).toFixed(2)}° ${lon >= 0 ? "E" : "W"}`;
