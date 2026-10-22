import type { BBox, Frame, LonLat } from "@/features/frames/frame.types";

export const SIMULATED_LATENCY_MS = 1400; // a believable processing wait for the demo
const KM_PER_DEGREE = 111.32;
const ANALYSIS_SIDE_KM = 120; // about half a NISAR frame

const clamp = (value: number, min: number, max: number): number =>
  Math.min(max, Math.max(min, value));

// A fixed-size square around `focus` (an epicentre) or the frame centre, kept inside the middle of
// the frame's bounding box so it stays within the (rotated) outline. Polar frames have huge boxes,
// hence the fixed size. The real pipeline will send its own bounds.
export const analysisBounds = ([west, south, east, north]: BBox, focus?: LonLat): BBox => {
  const [focusLon, focusLat] = focus ?? [(west + east) / 2, (south + north) / 2];
  const halfKm = ANALYSIS_SIDE_KM / 2;
  const cosLat = Math.cos(focusLat * (Math.PI / 180));
  const halfLat = Math.min(halfKm / KM_PER_DEGREE, (north - south) / 4);
  const halfLon = Math.min(halfKm / (KM_PER_DEGREE * cosLat), (east - west) / 4);
  const centerLon = clamp(focusLon, west + halfLon, east - halfLon);
  const centerLat = clamp(focusLat, south + halfLat, north - halfLat);
  return [centerLon - halfLon, centerLat - halfLat, centerLon + halfLon, centerLat + halfLat];
};

export const areaKm2 = ([west, south, east, north]: BBox): number => {
  const midLat = ((south + north) / 2) * (Math.PI / 180);
  return (east - west) * KM_PER_DEGREE * Math.cos(midLat) * (north - south) * KM_PER_DEGREE;
};

const pad3 = (n: number): string => String(n).padStart(3, "0");

export const demoGranuleId = (frame: Frame, product: string, dates: string): string =>
  `NISAR_L2_PR_${product}_${pad3(frame.track)}_${frame.pass}_${pad3(frame.frame)}_` +
  `${dates.replaceAll("-", "")}_DEMO`;

export const wait = (ms: number, signal: AbortSignal): Promise<void> =>
  new Promise((resolve, reject) => {
    const timer = setTimeout(resolve, ms);
    signal.addEventListener("abort", () => {
      clearTimeout(timer);
      reject(signal.reason);
    });
  });
