import type { BurnAnalysis, BurnAnalysisRequest } from "@/features/analysis/analysis.types";
import { renderLayers } from "@/features/analysis/mock/renderLayers";
import {
  CHANGE_THRESHOLD_DB,
  generateScarField,
  GRID_SIZE,
  summarizeField,
} from "@/features/analysis/mock/scarField";
import type { BBox, Frame } from "@/features/frames/frame.types";

const SIMULATED_LATENCY_MS = 1400; // a believable processing wait for the demo
const KM_PER_DEGREE = 111.32;

const ANALYSIS_SIDE_KM = 120; // about half a NISAR frame

// A fixed-size square at the frame centre, clamped to the middle half of its bounding box so it
// stays inside the (rotated) frame outline. Polar frames have huge boxes, hence the fixed size.
// The real pipeline will send its own bounds.
export const analysisBounds = ([west, south, east, north]: BBox): BBox => {
  const centerLon = (west + east) / 2;
  const centerLat = (south + north) / 2;
  const halfKm = ANALYSIS_SIDE_KM / 2;
  const cosLat = Math.cos(centerLat * (Math.PI / 180));
  const halfLat = Math.min(halfKm / KM_PER_DEGREE, (north - south) / 4);
  const halfLon = Math.min(halfKm / (KM_PER_DEGREE * cosLat), (east - west) / 4);
  return [centerLon - halfLon, centerLat - halfLat, centerLon + halfLon, centerLat + halfLat];
};

const areaHa = ([west, south, east, north]: BBox): number => {
  const midLat = ((south + north) / 2) * (Math.PI / 180);
  const widthKm = (east - west) * KM_PER_DEGREE * Math.cos(midLat);
  const heightKm = (north - south) * KM_PER_DEGREE;
  return widthKm * heightKm * 100;
};

const demoGranuleId = (frame: Frame, date: string): string =>
  `NISAR_L2_PR_GCOV_${String(frame.track).padStart(3, "0")}_${frame.pass}_` +
  `${String(frame.frame).padStart(3, "0")}_DHDH_${date.replaceAll("-", "")}_DEMO`;

const wait = (ms: number, signal: AbortSignal): Promise<void> =>
  new Promise((resolve, reject) => {
    const timer = setTimeout(resolve, ms);
    signal.addEventListener("abort", () => {
      clearTimeout(timer);
      reject(signal.reason);
    });
  });

export const mockBurnAnalysis = async (
  frame: Frame,
  request: BurnAnalysisRequest,
  signal: AbortSignal,
): Promise<BurnAnalysis> => {
  await wait(SIMULATED_LATENCY_MS, signal);

  const bounds = analysisBounds(frame.bbox);
  const field = generateScarField(`${frame.id}:${request.beforeDate}:${request.afterDate}`);
  const pixelAreaHa = areaHa(bounds) / GRID_SIZE ** 2;

  return {
    track: frame.track,
    frame: frame.frame,
    pass: frame.pass,
    before: { date: request.beforeDate, granuleId: demoGranuleId(frame, request.beforeDate) },
    after: { date: request.afterDate, granuleId: demoGranuleId(frame, request.afterDate) },
    method: {
      polarization: "HVHV",
      changeThresholdDb: CHANGE_THRESHOLD_DB,
      multilook: 2,
      pixelSizeM: Math.round(Math.sqrt(pixelAreaHa * 10_000)),
    },
    ...summarizeField(field, pixelAreaHa),
    layers: { bounds, ...renderLayers(field, GRID_SIZE) },
    generatedAt: new Date().toISOString(),
    isDemo: true,
  };
};
