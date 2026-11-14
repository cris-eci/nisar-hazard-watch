import { TOP_BAR } from "@/content/copyV8";
import type { LonLat } from "@/features/frames/frame.types";
import { formatLonLat } from "@/features/live/liveQuestion";
import type { Place } from "@/features/search/placesApi";

// "25.49, 85.70", "25.49 85.70" or "-25.4,-60": latitude first, as people paste from maps.
const LAT_LON = /^\s*(-?\d{1,2}(?:\.\d+)?)\s*[,\s]\s*(-?\d{1,3}(?:\.\d+)?)\s*$/;
const MAX_LAT = 90;
const MAX_LON = 180;

// The pasted point as [lon, lat], or undefined when the text isn't a valid `lat, lon`.
export const parseLatLon = (text: string): LonLat | undefined => {
  const match = LAT_LON.exec(text);
  if (match === null) return undefined;
  const lat = Number(match[1]);
  const lon = Number(match[2]);
  if (Math.abs(lat) > MAX_LAT || Math.abs(lon) > MAX_LON) return undefined;
  return [lon, lat];
};

export const pointLabel = formatLonLat;

// A pasted point resolves without the geocoder: the user's own numbers, no name invented for it.
export const coordinatePlace = (point: LonLat): Place => {
  const label = pointLabel(point);
  return {
    id: `point:${point[1]},${point[0]}`,
    name: label,
    displayName: label,
    kind: TOP_BAR.coordinatesKind,
    point,
    bbox: null,
    importance: 0,
  };
};
