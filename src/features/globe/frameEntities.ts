import {
  Cartesian3,
  Color,
  ImageMaterialProperty,
  Rectangle,
  type Entity,
  type Viewer,
} from "cesium";

import type { GlobeOverlay } from "@/features/analysis/overlay.types";
import type { BBox, Frame } from "@/features/frames/frame.types";

export const HOVER_COLOR = Color.fromCssColorString("#e2e8f0");
export const SELECTED_COLOR = Color.fromCssColorString("#f97316");

// One entity per ring: antimeridian frames have two.
// A light fill marks the frame without hiding the analysis layer draped inside it.
export const addFrameEntities = (viewer: Viewer, frame: Frame, color: Color): Entity[] =>
  frame.rings.map((ring) => {
    const positions = Cartesian3.fromDegreesArray(ring.flat());
    return viewer.entities.add({
      polygon: { hierarchy: positions, material: color.withAlpha(0.08) },
      polyline: { positions, width: 2, material: color },
    });
  });

// On unmount the viewer is destroyed before the other effects clean up, and a destroyed viewer has
// no entity collection left: leaving the explorer with an analysis open used to crash the app.
export const removeEntities = (viewer: Viewer, entities: Entity[]): void => {
  if (viewer.isDestroyed()) return;
  for (const entity of entities) viewer.entities.remove(entity);
};

// Padding keeps the area off the screen edges, plus room on both sides for the cards that cover
// the left (controls) and right (details panel) of the screen.
export const paddedRectangle = ([west, south, east, north]: BBox, padding = 0.4): Rectangle => {
  const width = east - west;
  const padLat = (north - south) * padding;
  return Rectangle.fromDegrees(
    west - width * (padding + 0.5),
    south - padLat,
    east + width * (padding + 0.6),
    north + padLat,
  );
};

export const addOverlayEntity = (viewer: Viewer, { url, bounds }: GlobeOverlay): Entity =>
  viewer.entities.add({
    rectangle: {
      coordinates: Rectangle.fromDegrees(...bounds),
      material: new ImageMaterialProperty({ image: url, transparent: true }),
    },
  });
