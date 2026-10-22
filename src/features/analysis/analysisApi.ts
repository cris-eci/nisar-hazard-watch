import type { AnalysisRequest, HazardAnalysis } from "@/features/analysis/analysis.types";
import { HAZARDS } from "@/features/analysis/hazards";
import type { Frame } from "@/features/frames/frame.types";

// Set VITE_ANALYSIS_API_URL to call the real pipeline; without it the app runs on demo data.
const ANALYSIS_API_URL: string | undefined = import.meta.env.VITE_ANALYSIS_API_URL;

export const isAnalysisLive = ANALYSIS_API_URL !== undefined && ANALYSIS_API_URL !== "";

export const fetchAnalysis = async (
  frame: Frame,
  request: AnalysisRequest,
  signal: AbortSignal,
): Promise<HazardAnalysis> => {
  if (!isAnalysisLive) return HAZARDS[request.hazard].runDemo(frame, request, signal);

  const params = new URLSearchParams({
    hazard: request.hazard,
    before: request.beforeDate,
    after: request.afterDate,
  });
  const response = await fetch(
    `${ANALYSIS_API_URL}/frames/${request.track}-${request.frame}/analysis?${params}`,
    { signal },
  );
  if (!response.ok) throw new Error(`Analysis service returned HTTP ${response.status}`);
  return (await response.json()) as HazardAnalysis;
};
