// The backend's own numbers (constants/sar.py): a point becomes the 10.24 km contract square, an
// area is measured in 10 m pixels, ideal up to 1.1 M of them and refused above 4 M.
export const AOI_SIDE_KM = 10.24;
export const IDEAL_AREA_KM2 = 110;
export const MAX_AREA_KM2 = 400;
export const MIN_VERTICES = 3;
export const MAX_VERTICES = 100;
// A drag or a click closer than this to the last one is a slip of the hand, not a new corner.
export const MIN_DRAW_PX = 6;

export const SIZE_GUIDE = "10 × 10 km ideal · max 20 × 20 km";

export type AreaLevel = "ideal" | "large" | "tooLarge";

export const levelOf = (areaKm2: number): AreaLevel =>
  areaKm2 > MAX_AREA_KM2 ? "tooLarge" : areaKm2 > IDEAL_AREA_KM2 ? "large" : "ideal";

export const formatKm2 = (areaKm2: number): string =>
  `${areaKm2 >= 10 ? Math.round(areaKm2).toLocaleString("en-US") : areaKm2.toFixed(1)} km²`;
