import { z } from "zod";

import type { LonLat } from "@/features/frames/frame.types";
import { apiRequest } from "@/lib/api/apiClient";

// The backend's CoverageView (/openapi.json), checked at the boundary. Free: it reads the catalog
// only, never the quota. tests/e2e/mocks/coverage-*.json are real answers.
const coverageSchema = z.object({
  plan: z.object({
    status: z.enum(["ready", "insufficientHistory", "noCoverage"]),
    seriesKey: z.string().nullable().optional(),
    dates: z.array(z.string()).default([]),
    maturityMixed: z.boolean().default(false),
    notes: z.array(z.string()).default([]),
  }),
  areaKm2: z.number(),
  warnings: z.array(z.string()).default([]),
  precomputedCase: z.string().nullable().optional(),
});

export type Coverage = z.infer<typeof coverageSchema>;

// The backend owns the catalog window (SPECS-v8 §2: the last five months); it takes no dates.
export const fetchCoverage = ([lon, lat]: LonLat, signal: AbortSignal): Promise<Coverage> =>
  apiRequest("/coverage", coverageSchema, { query: { lon, lat }, signal });
