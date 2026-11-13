import type { BBox } from "@/features/frames/frame.types";
import { AOI_SIDE_KM } from "@/features/geo/limits";
import { squareBounds } from "@/features/geo/square";
import type { Place } from "@/features/search/placesApi";

const KM_PER_DEGREE = 111.32;
// Below one square the camera frames the square itself; a larger place is shown whole.
const CHIP_ZOOM = 3.2;
const PLACE_ZOOM = 1.15;

export type PlaceFraming = { box: BBox; zoom: number };

// The box has continuous longitudes (east past 180° when the place crosses the antimeridian).
const continuous = ([west, south, east, north]: BBox): BBox => [
  west,
  south,
  east < west ? east + 360 : east,
  north,
];

export const placeFraming = ({ point, bbox }: Place): PlaceFraming => {
  if (bbox === null) return { box: squareBounds(point, AOI_SIDE_KM), zoom: CHIP_ZOOM };
  const [west, south, east, north] = continuous(bbox);
  const smallest = Math.min((north - south) * KM_PER_DEGREE, (east - west) * KM_PER_DEGREE);
  if (smallest < AOI_SIDE_KM) return { box: squareBounds(point, AOI_SIDE_KM), zoom: CHIP_ZOOM };
  return { box: [west, south, east, north], zoom: PLACE_ZOOM };
};
