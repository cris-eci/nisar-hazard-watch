import type { BBox, LonLat } from "@/features/frames/frame.types";
import type { Area, AreaGeometry, Ring } from "@/features/geo/geo.types";
import { splitAntimeridian } from "@/features/geo/antimeridian";
import { boundsOf, normalizeLon } from "@/features/geo/longitude";

// The backend rounds to 5 decimals (about a metre), so the client sends no more than that.
const DECIMALS = 5;
const SCALE = 10 ** DECIMALS;

const rounded = (value: number): number => Math.round(value * SCALE) / SCALE;

const roundedPoint = ([lon, lat]: LonLat): LonLat => [rounded(lon), rounded(lat)];

const isClosed = (ring: Ring): boolean => {
  const first = ring[0];
  const last = ring.at(-1);
  return first !== undefined && last !== undefined && first[0] === last[0] && first[1] === last[1];
};

const closeRing = (ring: Ring): Ring => {
  const first = ring[0];
  return first === undefined || isClosed(ring) ? ring : [...ring, first];
};

// Positive when the ring runs counter-clockwise, the way GeoJSON wants exterior rings.
const signedArea = (ring: Ring): number =>
  ring.reduce((sum, [lon, lat], index) => {
    const [nextLon, nextLat] = ring[(index + 1) % ring.length] as LonLat;
    return sum + (lon * nextLat - nextLon * lat);
  }, 0);

const exterior = (ring: Ring): Ring => {
  const counterClockwise = signedArea(ring) >= 0 ? ring : [...ring].reverse();
  return closeRing(counterClockwise.map(roundedPoint));
};

// A drawn area as the API takes it: a Point, a Polygon, or a MultiPolygon when it crosses ±180°.
export const toGeoJson = (area: Area): AreaGeometry => {
  if (area.kind === "point") {
    const [lon, lat] = area.point;
    return { type: "Point", coordinates: roundedPoint([normalizeLon(lon), lat]) };
  }
  const [first, ...rest] = splitAntimeridian(area.ring).map(exterior);
  if (first === undefined) return { type: "Polygon", coordinates: [exterior(area.ring)] };
  if (rest.length === 0) return { type: "Polygon", coordinates: [first] };
  return { type: "MultiPolygon", coordinates: [[first], ...rest.map((ring) => [ring])] };
};

const coordinates = (ring: Ring): string => ring.map(([lon, lat]) => `${lon} ${lat}`).join(", ");

const polygonText = (rings: Ring[]): string =>
  `(${rings.map((ring) => `(${coordinates(ring)})`).join(", ")})`;

export const toWkt = (geometry: AreaGeometry): string => {
  if (geometry.type === "Point") return `POINT (${geometry.coordinates.join(" ")})`;
  if (geometry.type === "Polygon") return `POLYGON ${polygonText(geometry.coordinates)}`;
  return `MULTIPOLYGON (${geometry.coordinates.map(polygonText).join(", ")})`;
};

const parsePair = (text: string): LonLat | undefined => {
  const [lon, lat, ...extra] = text.trim().split(/\s+/).map(Number);
  if (lon === undefined || lat === undefined || extra.length > 0) return undefined;
  return Number.isFinite(lon) && Number.isFinite(lat) ? [lon, lat] : undefined;
};

const parseRing = (text: string): Ring | undefined => {
  const pairs = text.split(",").map(parsePair);
  return pairs.every((pair) => pair !== undefined) ? (pairs as Ring) : undefined;
};

// Commas inside parentheses belong to a ring, so only the ones at depth zero split.
const splitTopLevel = (text: string): string[] => {
  const parts: string[] = [];
  let depth = 0;
  let start = 0;
  [...text].forEach((character, index) => {
    if (character === "(") depth += 1;
    if (character === ")") depth -= 1;
    if (character === "," && depth === 0) {
      parts.push(text.slice(start, index));
      start = index + 1;
    }
  });
  return [...parts, text.slice(start)];
};

const insideParens = (text: string): string | undefined => {
  const trimmed = text.trim();
  return trimmed.startsWith("(") && trimmed.endsWith(")") ? trimmed.slice(1, -1) : undefined;
};

const allDefined = <T>(items: (T | undefined)[]): items is T[] =>
  items.every((item) => item !== undefined);

// "(ring), (ring)": the rings of one polygon.
const parseRings = (text: string): Ring[] | undefined => {
  const rings = splitTopLevel(text).map((part) => {
    const inner = insideParens(part);
    return inner === undefined ? undefined : parseRing(inner);
  });
  return allDefined(rings) ? rings : undefined;
};

export const parseWkt = (wkt: string): AreaGeometry | undefined => {
  const match = /^(POINT|POLYGON|MULTIPOLYGON)\s*(\(.*\))$/is.exec(wkt.trim());
  const [, tag, parenthesised] = match ?? [];
  const body = parenthesised === undefined ? undefined : insideParens(parenthesised);
  if (tag === undefined || body === undefined) return undefined;
  const kind = tag.toUpperCase();
  if (kind === "POINT") {
    const point = parsePair(body);
    return point && { type: "Point", coordinates: point };
  }
  if (kind === "POLYGON") {
    const rings = parseRings(body);
    return rings && { type: "Polygon", coordinates: rings };
  }
  const polygons = splitTopLevel(body).map((part) => {
    const inner = insideParens(part);
    return inner === undefined ? undefined : parseRings(inner);
  });
  return allDefined(polygons) ? { type: "MultiPolygon", coordinates: polygons } : undefined;
};

// The area's box with longitudes continuous: east can pass 180 when the area crosses the antimeridian.
export const toBbox = (area: Area): BBox =>
  boundsOf(area.kind === "point" ? [area.point] : area.ring);
