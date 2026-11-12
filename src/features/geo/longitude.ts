import type { BBox } from "@/features/frames/frame.types";
import type { Ring } from "@/features/geo/geo.types";

const HALF_TURN = 180;
const FULL_TURN = 360;

const MICRO_DEGREE = 1e9;

const withoutDust = (value: number): number => Math.round(value * MICRO_DEGREE) / MICRO_DEGREE;

// Longitudes already inside [-180, 180) come back untouched; the rest are cleaned of float dust.
export const normalizeLon = (lon: number): number =>
  lon >= -HALF_TURN && lon < HALF_TURN
    ? lon
    : withoutDust(((((lon + HALF_TURN) % FULL_TURN) + FULL_TURN) % FULL_TURN) - HALF_TURN);

// The next longitude on the shortest way round, so a drag across ±180° stays continuous. A longitude
// that already is continuous comes back untouched; a shifted one is cleaned of float dust.
export const continueLon = (previous: number, lon: number): number => {
  const turns = Math.round((previous - lon) / FULL_TURN);
  return turns === 0 ? lon : withoutDust(lon + turns * FULL_TURN);
};

export const unwrapRing = (ring: Ring): Ring => {
  const out: Ring = [];
  for (const [lon, lat] of ring) {
    const previous = out.at(-1);
    out.push([previous === undefined ? lon : continueLon(previous[0], lon), lat]);
  }
  return out;
};

export const boundsOf = (ring: Ring): BBox => {
  const lons = ring.map(([lon]) => lon);
  const lats = ring.map(([, lat]) => lat);
  return [Math.min(...lons), Math.min(...lats), Math.max(...lons), Math.max(...lats)];
};

// Cesium rectangles want longitudes inside ±180° and mark an antimeridian crossing by west > east.
export const wrapBox = ([west, south, east, north]: BBox): BBox =>
  east - west >= FULL_TURN
    ? [-HALF_TURN, south, HALF_TURN, north]
    : [normalizeLon(west), south, normalizeLon(east), north];
