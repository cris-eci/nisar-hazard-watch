import type {
  AnalysisRequest,
  ChangeAnalysis,
  Polarization,
  SeverityHa,
} from "@/features/analysis/analysis.types";
import {
  analysisBounds,
  areaKm2,
  demoGranuleId,
  SIMULATED_LATENCY_MS,
  wait,
} from "@/features/analysis/mock/demoCommon";
import { renderLayers } from "@/features/analysis/mock/renderLayers";
import {
  CHANGE_THRESHOLD_DB,
  generateScarField,
  GRID_SIZE,
  summarizeField,
} from "@/features/analysis/mock/scarField";
import type { Frame } from "@/features/frames/frame.types";

export type DemoSettings = {
  polarization: Polarization;
  colors: Record<keyof SeverityHa, string>;
};

// Demo for any surface-change hazard: a seeded scene pair with one irregular patch of change. Real
// hazards differ in physics, not in what the UI needs to show, so one simulation serves them all.
export const mockChangeAnalysis = async (
  frame: Frame,
  request: AnalysisRequest,
  signal: AbortSignal,
  { polarization, colors }: DemoSettings,
): Promise<ChangeAnalysis> => {
  await wait(SIMULATED_LATENCY_MS, signal);

  const bounds = analysisBounds(frame.bbox, request.focus);
  const field = generateScarField(
    `${request.hazard}:${frame.id}:${request.beforeDate}:${request.afterDate}`,
  );
  const pixelAreaHa = (areaKm2(bounds) * 100) / GRID_SIZE ** 2;
  const scene = polarization === "HVHV" ? "GCOV_DHDH" : "GCOV_SHSH";

  return {
    kind: "change",
    hazard: request.hazard,
    track: frame.track,
    frame: frame.frame,
    pass: frame.pass,
    before: {
      date: request.beforeDate,
      granuleId: demoGranuleId(frame, scene, request.beforeDate),
    },
    after: { date: request.afterDate, granuleId: demoGranuleId(frame, scene, request.afterDate) },
    method: {
      polarization,
      changeThresholdDb: CHANGE_THRESHOLD_DB,
      multilook: 2,
      pixelSizeM: Math.round(Math.sqrt(pixelAreaHa * 10_000)),
    },
    ...summarizeField(field, pixelAreaHa),
    layers: { bounds, ...renderLayers(field, GRID_SIZE, colors) },
    generatedAt: new Date().toISOString(),
    isDemo: true,
  };
};
