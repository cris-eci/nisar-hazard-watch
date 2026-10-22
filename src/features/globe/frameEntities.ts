import { Cartesian3, Color, Rectangle, type Entity, type Viewer } from "cesium";

import type { BBox, Frame } from "@/features/frames/frame.types";

export const HOVER_COLOR = Color.fromCssColorString("#e2e8f0");
export const SELECTED_COLOR = Color.fromCssColorString("#f97316");

// One entity per ring: antimeridian frames have two.
export const addFrameEntities = (viewer: Viewer, frame: Frame, color: Color): Entity[] =>
  frame.rings.map((ring) => {
    const positions = Cartesian3.fromDegreesArray(ring.flat());
    return viewer.entities.add({
      polygon: { hierarchy: positions, material: color.withAlpha(0.2) },
      polyline: { positions, width: 2, material: color },
    });
  });

export const removeEntities = (viewer: Viewer, entities: Entity[]): void => {
  for (const entity of entities) viewer.entities.remove(entity);
};

// Padding keeps the whole frame visible instead of touching the screen edges.
export const paddedRectangle = ([west, south, east, north]: BBox, padding = 0.4): Rectangle => {
  const padLon = (east - west) * padding;
  const padLat = (north - south) * padding;
  return Rectangle.fromDegrees(west - padLon, south - padLat, east + padLon, north + padLat);
};
