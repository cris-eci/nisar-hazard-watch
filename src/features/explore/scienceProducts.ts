import { z } from "zod";

export const boundsSchema = z.tuple([z.number(), z.number(), z.number(), z.number()]);
const spacing = z.tuple([z.number().positive(), z.number().positive()]);

export const nativeGridSchema = z.object({
  epsg: z.number().int(),
  bounds_native: boundsSchema,
  pixel_spacing_m: spacing,
  width: z.number().int().positive(),
  height: z.number().int().positive(),
});

const visualizationGrid = z.object({
  crs: z.string(),
  bounds: boundsSchema,
  shape: z.tuple([z.number().int().positive(), z.number().int().positive()]),
  posting_m: spacing,
});

const capability = z.looseObject({
  status: z.string(),
  reason: z.string().nullish(),
});

const table = z.array(z.record(z.string(), z.union([z.string(), z.number(), z.null()])));

export const regionalAnalysisSchema = z.object({
  point: z.tuple([z.number(), z.number()]).nullable(),
  observations: z.looseObject({
    dates: z.array(z.string()).optional(),
    polarizations: z.array(z.string()).optional(),
    grid: nativeGridSchema.nullable().optional().catch(undefined),
    regional_aggregation: z
      .object({
        supported_pixels: z.number(),
        support_scope: z.string(),
        interval_type: z.string(),
      })
      .optional()
      .catch(undefined),
  }),
  capabilities: z.record(z.string(), capability),
  series: z.object({
    regional_timeseries: table.optional(),
    spectral_series: table.optional(),
    gp_historical_series: table.optional(),
  }),
  limitations: z.array(z.string()),
});

export const scienceProductsSchema = z.object({
  visualizations: z.array(
    z.object({
      id: z.string(),
      recipe: z.string(),
      title: z.string(),
      dates: z.array(z.string()),
      interpretation: z.string(),
      components: z.array(
        z.object({
          band: z.string(),
          label: z.string(),
          polarizations: z.array(z.string()),
          displayDb: z.tuple([z.number(), z.number()]),
        }),
      ),
      colormap: z.string(),
      supportedCells: z.number(),
      totalCells: z.number(),
      grid: visualizationGrid,
      bounds: boundsSchema,
      crs: z.string(),
      png: z.string(),
      cog: z.string().nullish(),
    }),
  ),
  assets: z.array(
    z.object({
      name: z.string(),
      url: z.string().regex(/^\/api\/v1\/explorations\/exp_[0-9a-f]{16}\/assets\/[\w.-]+$/),
      mediaType: z.string(),
      bytes: z.number(),
      sha256: z.string().regex(/^[0-9a-f]{64}$/),
    }),
  ),
  previews: z.array(
    z.object({
      name: z.string(),
      title: z.string(),
      interpretation: z.string(),
      legend: z.record(z.string(), z.unknown()).nullish(),
    }),
  ),
  analysis: regionalAnalysisSchema.nullish(),
});

export type NativeGrid = z.infer<typeof nativeGridSchema>;
export type ScienceProducts = z.infer<typeof scienceProductsSchema>;
export type RegionalAnalysis = z.infer<typeof regionalAnalysisSchema>;
