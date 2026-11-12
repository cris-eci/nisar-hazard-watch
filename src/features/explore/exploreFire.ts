import type { FireContextView } from "@/features/case-panel/subject";
import type { ExplorationResult, FireContext } from "@/features/explore/exploreSchemas";
import { formatDay } from "@/features/timeline/timelineLayout";

const SATELLITE: Record<string, string> = { N: "Suomi NPP", N20: "NOAA-20", N21: "NOAA-21" };
const DATE_LENGTH = 10;

const day = (iso: string | null): string =>
  iso === null ? "—" : formatDay(iso.slice(0, DATE_LENGTH));

const plural = (count: number, noun: string): string => `${count} ${noun}${count === 1 ? "" : "s"}`;

const headlineOf = (context: FireContext): string => {
  if (context.status === "unavailable") return "Fire context unavailable";
  if (context.status === "notConfigured") return "Fire context not configured";
  return context.detections
    ? `${plural(context.detections, "active-fire detection")} between the two passes`
    : "No active-fire detections between the two passes";
};

const factsOf = (context: FireContext): FireContextView["facts"] => {
  if (context.status !== "available" || context.detections === null) return [];
  const facts = [{ k: "Window", v: `${day(context.windowStart)} – ${day(context.windowEnd)}` }];
  if (context.detections > 0) {
    facts.push(
      { k: "First detection", v: day(context.firstDetection) },
      { k: "Last detection", v: day(context.lastDetection) },
    );
    if (context.peakFrpMw !== null)
      facts.push({ k: "Brightest", v: `${context.peakFrpMw.toFixed(1)} MW` });
    facts.push({
      k: "Satellites",
      v: context.satellites.map((code) => SATELLITE[code] ?? code).join(" · "),
    });
  }
  if (context.lowConfidenceExcluded)
    facts.push({ k: "Low confidence, not counted", v: String(context.lowConfidenceExcluded) });
  return facts;
};

export const fireContextOf = (result: ExplorationResult): FireContextView | undefined => {
  const context = result.fireContext;
  if (context === null || context === undefined) return undefined;
  return {
    status: context.status,
    headline: headlineOf(context),
    facts: factsOf(context),
    note: context.note,
  };
};
