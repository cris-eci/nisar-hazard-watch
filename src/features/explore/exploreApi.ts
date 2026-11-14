import type { LensId } from "@/features/cases/cases";
import type { AreaGeometry } from "@/features/geo/geo.types";
import { explorationSchema, type ExplorationView } from "@/features/explore/exploreSchemas";
import { apiRequest } from "@/lib/api/apiClient";

// The backend's lenses. InSAR needs a pair chosen first, so its question starts from the picker.
export const LIVE_LENSES: readonly LensId[] = [
  "flood_wetland",
  "vegetation_disturbance",
  "wildfire",
  "agriculture",
  "insar",
];

export const isLiveLens = (lens: LensId): boolean => LIVE_LENSES.includes(lens);

export type Direction = "ascending" | "descending";

// The backend picks the radar series itself until it accepts a direction (B2). Until then the
// top bar's Ascending / Descending switch stays hidden: a choice that isn't sent would mislead.
export const DIRECTION_CHOICE_READY = false;

// S-band is a precomputed layer for a short list of areas later; today only L-band is on demand.
export type ExplorationRequest = {
  lens: LensId;
  geometry: AreaGeometry;
  source: "L";
  opticalEvidence?: boolean;
  // The insar lens only: a GUNW pair from the pair list and the coherence below which no phase shows.
  pairId?: string;
  coherenceThreshold?: number;
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
