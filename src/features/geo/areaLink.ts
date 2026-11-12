import type { LonLat } from "@/features/frames/frame.types";
import type { Area, Ring } from "@/features/geo/geo.types";
import { MAX_VERTICES, MIN_VERTICES } from "@/features/geo/limits";
import { boundsOf, normalizeLon, unwrapRing } from "@/features/geo/longitude";

// Shared links: ?bbox=west,south,east,north for a rectangle (east below west crosses ±180°) and
// ?geo=lon,lat_lon,lat_… for a polygon. A point is already a ?frame= link.
export const BBOX_PARAM = "bbox";
export const GEO_PARAM = "geo";

const DECIMALS = 5;
const VERTEX_SEPARATOR = "_";
const FULL_TURN = 360;

const trimmed = (value: number): string => String(Number(value.toFixed(DECIMALS)));

const pairOf = ([lon, lat]: LonLat): string => `${trimmed(normalizeLon(lon))},${trimmed(lat)}`;

export const areaToParams = (area: Area): Record<string, string> | undefined => {
  if (area.kind === "point") return undefined;
  if (area.kind === "polygon") return { [GEO_PARAM]: area.ring.map(pairOf).join(VERTEX_SEPARATOR) };
  const [west, south, east, north] = boundsOf(area.ring);
  return {
    [BBOX_PARAM]: [normalizeLon(west), south, normalizeLon(east), north].map(trimmed).join(","),
  };
};

const isLon = (value: number): boolean => Number.isFinite(value) && Math.abs(value) <= 180;
const isLat = (value: number): boolean => Number.isFinite(value) && Math.abs(value) <= 90;

const parseBbox = (text: string): Area | undefined => {
  const values = text.split(",").map(Number);
  if (values.length !== 4) return undefined;
  const [west, south, rawEast, north] = values as [number, number, number, number];
  if (![west, rawEast].every(isLon) || ![south, north].every(isLat) || south >= north)
    return undefined;
  if (west === rawEast) return undefined;
  const east = rawEast < west ? rawEast + FULL_TURN : rawEast;
  return {
    kind: "rectangle",
    ring: [
      [west, south],
      [east, south],
      [east, north],
      [west, north],
    ],
  };
};

const parseGeo = (text: string): Area | undefined => {
  const vertices = text.split(VERTEX_SEPARATOR).map((pair): LonLat | undefined => {
    const [lon, lat, ...extra] = pair.split(",").map(Number);
    return lon !== undefined && lat !== undefined && extra.length === 0 && isLon(lon) && isLat(lat)
      ? [lon, lat]
      : undefined;
  });
  if (vertices.length < MIN_VERTICES || vertices.length > MAX_VERTICES) return undefined;
  if (!vertices.every((vertex) => vertex !== undefined)) return undefined;
  const ring: Ring = unwrapRing(vertices as Ring);
  return { kind: "polygon", ring };
};

export const areaFromParams = (params: URLSearchParams): Area | undefined => {
  const bbox = params.get(BBOX_PARAM);
  if (bbox !== null) return parseBbox(bbox);
  const geo = params.get(GEO_PARAM);
  return geo === null ? undefined : parseGeo(geo);
};
