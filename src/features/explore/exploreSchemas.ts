import { z } from "zod";

import type { BBox } from "@/features/frames/frame.types";

/*
 * The backend's ExplorationView, checked at the boundary. Nested science blocks (`lens`,
 * `aoiSummary`) keep the ML service's snake_case keys; only the fields the UI reads are listed and
 * the rest passes through. tests/fixtures/exploration-qadirabad.json is a real answer.
 */

const box = z.tuple([z.number(), z.number(), z.number(), z.number()]);
const perChannel = z.record(z.string(), z.number().nullable());

export const FINAL_STATUSES = ["succeeded", "partial", "noData", "failed", "cancelled"] as const;
export const ACTIVE_STATUSES = ["queued", "running"] as const;

const stageSchema = z.object({
  name: z.enum(["planning", "processing", "reading", "analysing", "rendering"]),
  state: z.enum(["done", "running", "pending"]),
  seconds: z.number().nullable(),
  budgetSeconds: z.number().nullable(),
});

const layerSchema = z.object({
  id: z.string(),
  title: z.string(),
  kind: z.string(),
  units: z.string(),
  colormap: z.string(),
  bounds: box,
  url: z.string(),
  legend: z.record(z.string(), z.string()).nullable(),
  valueRange: z.tuple([z.number(), z.number()]).nullable(),
});

const sceneSchema = z.object({
  granuleId: z.string(),
  acquiredAt: z.string(),
  track: z.number(),
  direction: z.string(),
  frame: z.number(),
  mode: z.string(),
  maturity: z.string(),
  configuration: z.string(),
});

const lensSchema = z.looseObject({
  status: z.string(),
  reason: z.string().nullable().optional(),
  target_date: z.string().optional(),
  baseline_dates: z.array(z.string()).optional(),
  assessment_dates: z.array(z.string()).optional(),
  point: z
    .looseObject({
      status: z.string(),
      target_minus_baseline_db: perChannel,
      diagnostic_half_width_db: perChannel,
    })
    .nullable()
    .optional(),
  radar: z
    .looseObject({
      polarizations: z.array(z.string()),
      posting_m: z.number(),
    })
    .nullable()
    .optional(),
  evidence: z.looseObject({ status: z.string() }).optional(),
});

const aoiSummarySchema = z.looseObject({
  cells_in_area: z.number(),
  cells_with_measurement: z.number(),
  cells_departing_from_baseline: z.number(),
  departing_fraction: z.number().nullable(),
  area_covered_fraction: z.number().nullable().optional(),
  median_target_minus_baseline_db: perChannel.nullable().optional(),
});

const observationSchema = z.looseObject({
  date: z.string(),
  status: z.string(),
  reason: z.string().optional(),
  granule_id: z.string().optional(),
});

const resultSchema = z.object({
  geometry: z.record(z.string(), z.unknown()),
  areaKm2: z.number(),
  windowStart: z.string(),
  windowEnd: z.string(),
  scenes: z.array(sceneSchema),
  observations: z.array(observationSchema),
  lens: lensSchema.nullable(),
  aoiSummary: aoiSummarySchema.nullable(),
  layers: z.array(layerSchema),
  quality: z.record(z.string(), z.unknown()),
  limitations: z.array(z.string()),
  scientificStatus: z.string(),
  timings: z.record(z.string(), z.number()),
  isDemo: z.boolean(),
});

export const explorationSchema = z.object({
  id: z.string(),
  status: z.enum([...ACTIVE_STATUSES, ...FINAL_STATUSES]),
  stage: z.string(),
  lens: z.string(),
  source: z.string(),
  cache: z.enum(["miss", "hit"]),
  etaSeconds: z.number().nullable(),
  etaRemainingSeconds: z.number().nullable(),
  elapsedSeconds: z.number(),
  stages: z.array(stageSchema),
  progress: z.object({ scenesRead: z.number().nullable(), scenesTotal: z.number() }).nullable(),
  plan: z
    .object({
      status: z.string(),
      seriesKey: z.string().nullable(),
      dates: z.array(z.string()),
      maturityMixed: z.boolean(),
      notes: z.array(z.string()),
    })
    .nullable(),
  result: resultSchema.nullable(),
  error: z.object({ reasonCode: z.string(), detail: z.string() }).nullable(),
});

export type ExplorationView = z.infer<typeof explorationSchema>;
export type ExplorationResult = NonNullable<ExplorationView["result"]>;
export type ExplorationLayer = ExplorationResult["layers"][number];
export type ExplorationStage = ExplorationView["stages"][number];

export const isFinal = (status: ExplorationView["status"]): boolean =>
  (FINAL_STATUSES as readonly string[]).includes(status);

export const layerBox = (layer: ExplorationLayer): BBox => layer.bounds;
