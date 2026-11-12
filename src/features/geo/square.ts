import type { BBox, LonLat } from "@/features/frames/frame.types";
import type { Ring } from "@/features/geo/geo.types";

const KM_PER_DEGREE = 111.32;
const POLE_COS = 1e-6;
const HALF_TURN = 180;

// The square a point stands for, `km` on a side, as a box. Longitudes are not wrapped, so a square
// over the antimeridian comes back as [179.97, …, 180.03, …]; `wrapBox` adapts it for Cesium.
export const squareBounds = ([lon, lat]: LonLat, km: number): BBox => {
  const halfLat = km / 2 / KM_PER_DEGREE;
  const cosLat = Math.max(Math.cos((lat * Math.PI) / 180), POLE_COS);
  const halfLon = Math.min(HALF_TURN, km / 2 / (KM_PER_DEGREE * cosLat));
  return [lon - halfLon, Math.max(-90, lat - halfLat), lon + halfLon, Math.min(90, lat + halfLat)];
};

export const ringOfBox = ([west, south, east, north]: BBox): Ring => [
  [west, south],
  [east, south],
  [east, north],
  [west, north],
];

export const squareAround = (point: LonLat, km: number): Ring => ringOfBox(squareBounds(point, km));
