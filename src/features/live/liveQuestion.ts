import type { LensId, Source, Verdict } from "@/features/cases/cases";
import type { Acquisition, LonLat } from "@/features/frames/frame.types";
import { OBSERVATION_PLAN_QUERY_URL } from "@/features/frames/observationPlanApi";

// The lens API reads a 128 × 128 grid at 80 m posting.
export const LIVE_CHIP_KM = 10.24;
export const GRID_CELLS = 128;

export const gridMetres = (chipKm: number): number => Math.round((chipKm * 1000) / GRID_CELLS);

export const LIVE_LINE: Record<Verdict, string> = {
  departure: "At least one channel left this spot's normal range on the latest pass.",
  within: "Both channels stayed inside this spot's normal range.",
  insufficient:
    "No usable pixels on these dates. We tried one alternative series; it had the same gap.",
};

export const LIVE_REASON =
  "Try a longer date window, or a point a little away from steep terrain and open water.";

// What else changes radar the way each lens looks for (NISAR-Modeling exploration lenses).
export const LENS_ALTERNATIVES: Record<LensId, string[]> = {
  flood_wetland: [
    "Existing water",
    "Wind-roughened water",
    "Soil moisture",
    "Crops",
    "Terrain shadow",
  ],
  vegetation_disturbance: [
    "Phenology",
    "Harvest or clearing",
    "Soil moisture",
    "Storm damage",
    "Viewing and terrain effects",
  ],
  wildfire: [
    "Harvest or clearing",
    "Seasonal vegetation change",
    "Moisture",
    "Storm damage",
    "Terrain shadow",
  ],
  agriculture: ["Soil moisture", "Irrigation", "Tillage", "Mixed fields", "Viewing geometry"],
  insar: ["Troposphere", "Ionosphere", "Vegetation decorrelation", "Soil moisture"],
};

// Left empty on purpose: the API reports none of these (see its `limitations`).
export const LIVE_EMPTIES = ["Cause", "Probability", "Area in hectares", "Displacement"];

const MODELING = "https://github.com/nisar-hazard-watch/NISAR-Modeling/blob/main/docs";

export const LIVE_SOURCES: Source[] = [
  {
    label: "ASF DAAC · NISAR L2 GCOV scenes",
    href: "https://asf.alaska.edu/data-sets/sar-data-sets/nisar/",
  },
  { label: "NISAR-Modeling · exploration lenses", href: `${MODELING}/EXPLORATION_LENSES.md` },
  { label: "NASA · NISAR Observation Plan (feature service)", href: OBSERVATION_PLAN_QUERY_URL },
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
