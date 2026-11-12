import type { LonLat } from "@/features/frames/frame.types";
import type { Ring } from "@/features/geo/geo.types";
import { unwrapRing } from "@/features/geo/longitude";

const HALF_TURN = 180;
const FULL_TURN = 360;
const MIN_VERTICES = 3;

const crossing = ([lon1, lat1]: LonLat, [lon2, lat2]: LonLat, edge: number): LonLat => {
  const along = (edge - lon1) / (lon2 - lon1);
  return [edge, lat1 + along * (lat2 - lat1)];
};

// Sutherland–Hodgman against one meridian: keeps the side of the ring on `keepEast`'s half-plane.
const clipAt = (ring: Ring, edge: number, keepEast: boolean): Ring => {
  const keeps = (lon: number) => (keepEast ? lon >= edge : lon <= edge);
  const out: Ring = [];
  ring.forEach((current, index) => {
    const previous = ring[(index + ring.length - 1) % ring.length] as LonLat;
    const currentKept = keeps(current[0]);
    if (currentKept !== keeps(previous[0])) out.push(crossing(previous, current, edge));
    if (currentKept) out.push(current);
  });
  return out;
};

const shifted = (ring: Ring, degrees: number): Ring =>
  ring.map(([lon, lat]): LonLat => [lon + degrees, lat]);

const meanLon = (ring: Ring): number => ring.reduce((sum, [lon]) => sum + lon, 0) / ring.length;

// A ring whose longitudes run past ±180° becomes one ring per side of the antimeridian, ordered
// west to east; a ring that stays inside comes back as it is (made continuous).
export const splitAntimeridian = (ring: Ring): Ring[] => {
  const continuous = unwrapRing(ring);
  const turns = Math.floor((meanLon(continuous) + HALF_TURN) / FULL_TURN);
  const inRange = shifted(continuous, -turns * FULL_TURN);
  const lons = inRange.map(([lon]) => lon);
  const parts =
    Math.max(...lons) > HALF_TURN
      ? [clipAt(inRange, HALF_TURN, false), shifted(clipAt(inRange, HALF_TURN, true), -FULL_TURN)]
      : Math.min(...lons) < -HALF_TURN
        ? [
            shifted(clipAt(inRange, -HALF_TURN, false), FULL_TURN),
            clipAt(inRange, -HALF_TURN, true),
          ]
        : [inRange];
  return parts
    .filter((part) => part.length >= MIN_VERTICES)
    .sort((a, b) => Math.min(...a.map(([lon]) => lon)) - Math.min(...b.map(([lon]) => lon)));
};
