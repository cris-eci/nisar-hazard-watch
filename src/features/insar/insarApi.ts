import { z } from "zod";

import type { LonLat } from "@/features/frames/frame.types";
import { apiRequest } from "@/lib/api/apiClient";

const pairSchema = z.object({
  pairId: z.string(),
  seriesKey: z.string(),
  track: z.number(),
  direction: z.enum(["A", "D"]),
  frame: z.number(),
  referenceDate: z.string(),
  secondaryDate: z.string(),
  temporalBaselineDays: z.number(),
});

const pairsSchema = z.object({
  windowStart: z.string(),
  windowEnd: z.string(),
  pairs: z.array(pairSchema),
});

export type InsarPair = z.infer<typeof pairSchema>;
export type InsarPairs = z.infer<typeof pairsSchema>;
export type InsarChoice = { pairId: string; threshold: number };

// The backend's bounds for the coherence threshold, below which a cell shows no phase.
export const DEFAULT_COHERENCE = 0.35;
export const MIN_COHERENCE = 0.1;
export const MAX_COHERENCE = 0.9;
export const COHERENCE_STEP = 0.05;

// Snapped to the slider's step, with two decimals so the value reads cleanly in a link.
export const clampCoherence = (value: number): number =>
  Number.isFinite(value)
    ? Number(
        Math.min(
          MAX_COHERENCE,
          Math.max(MIN_COHERENCE, Math.round(value / COHERENCE_STEP) * COHERENCE_STEP),
        ).toFixed(2),
      )
    : DEFAULT_COHERENCE;

export const listInsarPairs = (point: LonLat, signal: AbortSignal): Promise<InsarPairs> =>
  apiRequest("/insar/pairs", pairsSchema, { query: { lon: point[0], lat: point[1] }, signal });
