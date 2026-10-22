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

export const removeEntities = (viewer: Viewer, entities: Entity[]): void => {
  for (const entity of entities) viewer.entities.remove(entity);
};

// Padding keeps the area off the screen edges. Extra room on the east side keeps it clear of the
// details panel, which covers the right of the screen.
export const paddedRectangle = ([west, south, east, north]: BBox, padding = 0.4): Rectangle => {
  const padLon = (east - west) * padding;
  const padLat = (north - south) * padding;
  const panelRoom = (east - west) * 0.6;
  return Rectangle.fromDegrees(
    west - padLon,
    south - padLat,
    east + padLon + panelRoom,
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
