import type { AnalysisRequest, DeformationAnalysis } from "@/features/analysis/analysis.types";
import {
  analysisBounds,
  areaKm2,
  demoGranuleId,
  SIMULATED_LATENCY_MS,
  wait,
} from "@/features/analysis/mock/demoCommon";
import {
  DEFORMED_THRESHOLD_CM,
  generateDeformationField,
  NISAR_L_BAND_WAVELENGTH_CM,
  summarizeDeformation,
} from "@/features/analysis/mock/deformationField";
import { toPngUrl, type Rgba } from "@/features/analysis/mock/png";
import { GRID_SIZE } from "@/features/analysis/mock/scarField";
import type { Frame } from "@/features/frames/frame.types";

const TOWARD: Rgba = [220, 38, 38, 0]; // red: ground moved toward the satellite
const AWAY: Rgba = [37, 99, 235, 0]; // blue: away from it

// Fades from transparent to red or blue. Motion under 10 % of the scale is atmospheric noise; painting
// it washed a whitish veil over the whole area. Alpha stays >= 2 so the colour survives the canvas.
const NOISE_FLOOR = 0.1;

const diverging = (valueCm: number, scaleCm: number): Rgba => {
  const t = Math.max(-1, Math.min(1, valueCm / scaleCm));
  const [r, g, b] = t >= 0 ? TOWARD : AWAY;
  const k = Math.abs(t);
  const mix = (end: number): number => Math.round(255 + (end - 255) * k);
  const visible = Math.max(0, (k - NOISE_FLOOR) / (1 - NOISE_FLOOR));
  return [mix(r), mix(g), mix(b), Math.max(2, Math.round(235 * visible))];
};

// Wrapped phase as a hue wheel: each full colour cycle is half a wavelength of LOS motion.
const fringe = (valueCm: number): Rgba => {
  const cycle = NISAR_L_BAND_WAVELENGTH_CM / 2;
  const hue = ((((valueCm % cycle) + cycle) % cycle) / cycle) * 6;
  const x = 1 - Math.abs((hue % 2) - 1);
  const [r, g, b] =
    hue < 1
      ? [1, x, 0]
      : hue < 2
        ? [x, 1, 0]
        : hue < 3
          ? [0, 1, x]
          : hue < 4
            ? [0, x, 1]
            : hue < 5
              ? [x, 0, 1]
              : [1, 0, x];
  return [Math.round(r * 255), Math.round(g * 255), Math.round(b * 255), 210];
};

export const mockDeformationAnalysis = async (
  frame: Frame,
  request: AnalysisRequest,
  signal: AbortSignal,
): Promise<DeformationAnalysis> => {
  await wait(SIMULATED_LATENCY_MS, signal);

  const bounds = analysisBounds(frame.bbox, request.focus);
  const field = generateDeformationField(
    `${request.hazard}:${frame.id}:${request.beforeDate}:${request.afterDate}`,
    GRID_SIZE,
  );
  const pixelAreaKm2 = areaKm2(bounds) / GRID_SIZE ** 2;
  const { colorScaleCm, ...summary } = summarizeDeformation(field, pixelAreaKm2);
  const pair = `${request.beforeDate}_${request.afterDate}`;

  return {
    kind: "deformation",
    hazard: request.hazard,
    track: frame.track,
    frame: frame.frame,
    pass: frame.pass,
    before: { date: request.beforeDate, granuleId: demoGranuleId(frame, "GUNW", pair) },
    after: { date: request.afterDate, granuleId: demoGranuleId(frame, "GUNW", pair) },
    method: {
      product: "GUNW",
      wavelengthCm: NISAR_L_BAND_WAVELENGTH_CM,
      ionosphereCorrected: true,
      pixelSizeM: Math.round(Math.sqrt(pixelAreaKm2) * 1000),
    },
    ...summary,
    deformedThresholdCm: DEFORMED_THRESHOLD_CM,
    layers: {
      bounds,
      displacementUrl: toPngUrl(GRID_SIZE, (i) => diverging(field.losCm[i] ?? 0, colorScaleCm)),
      fringesUrl: toPngUrl(GRID_SIZE, (i) => fringe(field.losCm[i] ?? 0)),
      colorScaleCm,
    },
    generatedAt: new Date().toISOString(),
    isDemo: true,
  };
};
