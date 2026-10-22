import {
  Cartesian3,
  Color,
  ImageryLayer,
  Rectangle,
  SingleTileImageryProvider,
  type Entity,
  type Viewer,
} from "cesium";

import type { GlobeOverlay } from "@/features/analysis/overlay.types";
import type { BBox, Frame } from "@/features/frames/frame.types";

export const HOVER_COLOR = Color.fromCssColorString("#e2e8f0");
export const SELECTED_COLOR = Color.fromCssColorString("#c9b48b"); // the site's gold

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

// The cards cover the left (controls, ~372 px) and right (frame panel, ~416 px) of the screen, so
// the area is centred in the free band between them, with `padding` of its size around it. On narrow
// screens the panel covers the globe anyway, so the area is simply centred.
const LEFT_CARD_PX = 372;
const RIGHT_PANEL_PX = 416;
const NARROW_PX = 768;

export const framedRectangle = (
  [west, south, east, north]: BBox,
  padding: number,
  viewportWidth: number,
): Rectangle => {
  const width = east - west;
  const padLat = (north - south) * padding;
  if (viewportWidth < NARROW_PX) {
    return Rectangle.fromDegrees(
      west - width * padding,
      south - padLat,
      east + width * padding,
      north + padLat,
    );
  }
  const free = Math.max(0.25, (viewportWidth - LEFT_CARD_PX - RIGHT_PANEL_PX) / viewportWidth);
  const fill = 1 / (1 + 2 * padding);
  const span = width / (free * fill);
  const viewWest = west - span * (LEFT_CARD_PX / viewportWidth + (free * (1 - fill)) / 2);
  return Rectangle.fromDegrees(viewWest, south - padLat, viewWest + span, north + padLat);
};

// Analysis rasters go in as an imagery layer, composited with the base map like any map tile. An
// entity rectangle is shaded by the globe's lighting and left a dark veil over the data.
export const addOverlayLayer = (viewer: Viewer, { url, bounds }: GlobeOverlay): ImageryLayer => {
  const layer = ImageryLayer.fromProviderAsync(
    SingleTileImageryProvider.fromUrl(url, { rectangle: Rectangle.fromDegrees(...bounds) }),
  );
  viewer.imageryLayers.add(layer);
  return layer;
};

export const removeLayer = (viewer: Viewer, layer: ImageryLayer): void => {
  if (!viewer.isDestroyed()) viewer.imageryLayers.remove(layer);
};
