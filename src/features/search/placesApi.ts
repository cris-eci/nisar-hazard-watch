import { z } from "zod";

import type { BBox, LonLat } from "@/features/frames/frame.types";
import { ApiError, apiRequest } from "@/lib/api/apiClient";

const lonLat = z.tuple([z.number(), z.number()]);

const placeSchema = z.object({
  id: z.string(),
  name: z.string(),
  displayName: z.string(),
  kind: z.string(),
  point: lonLat,
  bbox: z.tuple([z.number(), z.number(), z.number(), z.number()]).nullable(),
  importance: z.number(),
});

const placesSchema = z.object({ places: z.array(placeSchema), attribution: z.string() });

export type Place = Omit<z.infer<typeof placeSchema>, "point" | "bbox"> & {
  point: LonLat;
  bbox: BBox | null;
};
export type PlaceResults = { places: Place[]; attribution: string };

export const PLACE_LIMIT = 6;
export const MIN_QUERY_LENGTH = 2;

// The provider forbids type-ahead, so this runs once per submitted text.
export const searchPlaces = (text: string, signal: AbortSignal): Promise<PlaceResults> =>
  apiRequest("/places", placesSchema, { query: { q: text, limit: PLACE_LIMIT }, signal });

export const placeSearchMessage = (error: Error): string => {
  if (error instanceof ApiError && error.status === 429)
    return "Too many searches. Try again in a minute.";
  if (error instanceof ApiError && error.status === 503)
    return "Place search is busy. Try again in a few seconds.";
  return "We couldn't reach the place search. The globe still works.";
};
