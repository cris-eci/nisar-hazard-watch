import type { BurnAnalysis, BurnAnalysisRequest } from "@/features/analysis/analysis.types";
import { mockBurnAnalysis } from "@/features/analysis/mock/mockAnalysis";
import type { Frame } from "@/features/frames/frame.types";

// Set VITE_ANALYSIS_API_URL to call the real pipeline; without it the app runs on demo data.
const ANALYSIS_API_URL: string | undefined = import.meta.env.VITE_ANALYSIS_API_URL;

export const isAnalysisLive = ANALYSIS_API_URL !== undefined && ANALYSIS_API_URL !== "";

export const fetchBurnAnalysis = async (
  frame: Frame,
  request: BurnAnalysisRequest,
  signal: AbortSignal,
): Promise<BurnAnalysis> => {
  if (!isAnalysisLive) return mockBurnAnalysis(frame, request, signal);

  const params = new URLSearchParams({ before: request.beforeDate, after: request.afterDate });
  const response = await fetch(
    `${ANALYSIS_API_URL}/frames/${request.track}-${request.frame}/burn-analysis?${params}`,
    { signal },
  );
  if (!response.ok) throw new Error(`Analysis service returned HTTP ${response.status}`);
  return (await response.json()) as BurnAnalysis;
};
