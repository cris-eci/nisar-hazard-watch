import type { LensId } from "@/features/cases/cases";
import type { AreaGeometry } from "@/features/geo/geo.types";
import { explorationSchema, type ExplorationView } from "@/features/explore/exploreSchemas";
import { apiRequest } from "@/lib/api/apiClient";

// The backend's lenses; InSAR needs a pair and arrives with its own flow.
export const LIVE_LENSES: readonly LensId[] = [
  "flood_wetland",
  "vegetation_disturbance",
  "wildfire",
  "agriculture",
];

export const isLiveLens = (lens: LensId): boolean => LIVE_LENSES.includes(lens);

// S-band is a precomputed layer for a short list of areas later; today only L-band is on demand.
export type ExplorationRequest = {
  lens: LensId;
  geometry: AreaGeometry;
  source: "L";
  opticalEvidence?: boolean;
};

export const startExploration = (
  request: ExplorationRequest,
  signal: AbortSignal,
): Promise<ExplorationView> =>
  apiRequest("/explorations", explorationSchema, { method: "POST", body: request, signal });

export const getExploration = (id: string, signal: AbortSignal): Promise<ExplorationView> =>
  apiRequest(`/explorations/${encodeURIComponent(id)}`, explorationSchema, { signal });

export const cancelExploration = (id: string, signal: AbortSignal): Promise<ExplorationView> =>
  apiRequest(`/explorations/${encodeURIComponent(id)}`, explorationSchema, {
    method: "DELETE",
    signal,
  });
