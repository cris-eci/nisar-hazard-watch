import type { HazardId } from "@/features/analysis/analysis.types";
import type { LonLat } from "@/features/frames/frame.types";

// Curated cases for the guided demo. Earthquake pairs are real NISAR GUNW pairs on ASF that bracket
// the event (checked 2026-10-21); the analysis on top of them is demo data until the pipeline runs.
export type FeaturedEvent = {
  id: string;
  hazard: HazardId;
  title: string;
  place: string;
  date: string; // YYYY-MM-DD, when the event happened
  frameId: string; // NISAR track-frame
  pair?: [before: string, after: string]; // fixed pair; otherwise the latest usable pair
  focus: LonLat;
  summary: string;
  source: string;
};

export const FEATURED_EVENTS: FeaturedEvent[] = [
  {
    id: "venezuela-2026",
    hazard: "earthquake",
    title: "M7.5 earthquake",
    place: "Catia La Mar, Venezuela",
    date: "2026-06-24",
    frameId: "162-7",
    pair: ["2026-06-13", "2026-06-25"],
    focus: [-67.221, 10.595],
    summary: "Shallow (10 km) quake on the Caribbean coast. NISAR passed one day after it.",
    source: "USGS + NISAR GUNW track 162 A, frame 7",
  },
  {
    id: "kumamoto-2026",
    hazard: "earthquake",
    title: "M6.8 earthquake",
    place: "Kumamoto, Japan",
    date: "2026-07-28",
    frameId: "24-18",
    pair: ["2026-07-21", "2026-08-14"],
    focus: [130.66, 32.618],
    summary: "8 km deep. Ascending and descending pairs exist, so motion can be split in 2D.",
    source: "USGS + NISAR GUNW track 24 A, frame 18",
  },
  {
    id: "panama-2026",
    hazard: "earthquake",
    title: "M7.7 earthquake",
    place: "Pitaloza Arriba, Panama",
    date: "2026-10-09",
    frameId: "76-5",
    pair: ["2026-10-05", "2026-10-17"],
    focus: [-80.769, 7.587],
    summary: "The strongest of the three, 13 km deep. NISAR imaged it eight days later.",
    source: "USGS + NISAR GUNW track 76 A, frame 5",
  },
  {
    id: "andes-fire-demo",
    hazard: "wildfire",
    title: "Wildfire (demo site)",
    place: "Colombian Andes",
    date: "2026-10-15",
    frameId: "47-3",
    focus: [-74.75, 2.89],
    summary: "Placeholder until the team picks a real fire with FIRMS detections in the window.",
    source: "NISAR GCOV HH+HV passes, demo burn scar",
  },
];

export const findEvent = (id: string | null): FeaturedEvent | undefined =>
  FEATURED_EVENTS.find((event) => event.id === id);
