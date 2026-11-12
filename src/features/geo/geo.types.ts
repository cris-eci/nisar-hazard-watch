import type { LonLat } from "@/features/frames/frame.types";

export type Ring = LonLat[];

export type PointGeometry = { type: "Point"; coordinates: LonLat };
export type PolygonGeometry = { type: "Polygon"; coordinates: Ring[] };
export type MultiPolygonGeometry = { type: "MultiPolygon"; coordinates: Ring[][] };
export type AreaGeometry = PointGeometry | PolygonGeometry | MultiPolygonGeometry;

export type DrawTool = "point" | "rectangle" | "polygon";

// A drawn ring stays continuous (longitudes may run past ±180°) so it measures and draws right;
// it is split at the antimeridian only when it leaves for the API.
export type Area = { kind: "point"; point: LonLat } | { kind: "rectangle" | "polygon"; ring: Ring };
