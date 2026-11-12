import {
  Cartesian2,
  Cartesian3,
  Color,
  HorizontalOrigin,
  ImageryLayer,
  LabelStyle,
  PolylineDashMaterialProperty,
  Rectangle,
  SingleTileImageryProvider,
  VerticalOrigin,
  type Entity,
  type Viewer,
} from "cesium";

import type { BBox, Frame, LonLat } from "@/features/frames/frame.types";
import type { Ring } from "@/features/geo/geo.types";
import { boundsOf } from "@/features/geo/longitude";

export const HOVER_COLOR = Color.fromCssColorString("#e2e8f0");
export const GOLD = Color.fromCssColorString("#c9b48b");
export const INK = Color.fromCssColorString("#ebe9e4");
export const SPACE = Color.fromCssColorString("#04070e");

// An image the globe drapes over a lon/lat rectangle.
export type Drape = { url: string; bounds: BBox };

// One entity per ring: antimeridian frames have two. The fill stays faint so it never hides the map.
export const addFrameEntities = (
  viewer: Viewer,
  frame: Frame,
  color: Color,
  { width = 1.5, alpha = 0.85, fill = 0.06 } = {},
): Entity[] =>
  frame.rings.map((ring) => {
    const positions = Cartesian3.fromDegreesArray(ring.flat());
    return viewer.entities.add({
      polygon: { hierarchy: positions, material: color.withAlpha(fill) },
      polyline: { positions, width, material: color.withAlpha(alpha) },
    });
  });

export type ChipOutline = { ring: Ring; label: string; processing: boolean };

// The processed area: solid gold once measured, a gold dash while the radar job runs (SPECS §2.6).
// A square chip is four corners; a drawn polygon has as many as it was given.
export const addChipOutline = (
  viewer: Viewer,
  { ring, label, processing }: ChipOutline,
): Entity[] => {
  const [west, , , north] = boundsOf(ring);
  const first = ring[0];
  const positions = Cartesian3.fromDegreesArray((first ? [...ring, first] : ring).flat());
  return [
    viewer.entities.add({
      polyline: {
        positions,
        width: processing ? 2.5 : 3,
        material: processing
          ? new PolylineDashMaterialProperty({ color: GOLD, dashLength: 12 })
          : GOLD,
      },
    }),
    viewer.entities.add({
      position: Cartesian3.fromDegrees(west, north),
      label: {
        text: processing ? "PROCESSING RADAR FOR THIS AREA…" : label,
        font: "500 11px JetBrains Mono, monospace",
        fillColor: processing ? GOLD : INK,
        outlineColor: SPACE,
        outlineWidth: 3,
        style: LabelStyle.FILL_AND_OUTLINE,
        pixelOffset: new Cartesian2(0, -10),
        horizontalOrigin: HorizontalOrigin.LEFT,
        verticalOrigin: VerticalOrigin.BOTTOM,
        disableDepthTestDistance: Number.POSITIVE_INFINITY,
      },
    }),
  ];
};

export const addPointEntity = (viewer: Viewer, [lon, lat]: LonLat): Entity =>
  viewer.entities.add({
    position: Cartesian3.fromDegrees(lon, lat),
    point: {
      pixelSize: 9,
      color: INK,
      outlineColor: SPACE,
      outlineWidth: 2,
      disableDepthTestDistance: Number.POSITIVE_INFINITY,
    },
  });

// On unmount the viewer is destroyed before the other effects clean up, and a destroyed viewer has
// no entity collection left: leaving the explorer with an analysis open used to crash the app.
export const removeEntities = (viewer: Viewer, entities: Entity[]): void => {
  if (viewer.isDestroyed()) return;
  for (const entity of entities) viewer.entities.remove(entity);
};

// Rasters go in as an imagery layer, composited with the base map like any map tile. An entity
// rectangle is shaded by the globe's lighting and left a dark veil over the data.
export const addDrapeLayer = (
  viewer: Viewer,
  { url, bounds }: Drape,
  alpha: number,
): ImageryLayer => {
  const layer = ImageryLayer.fromProviderAsync(
    SingleTileImageryProvider.fromUrl(url, { rectangle: Rectangle.fromDegrees(...bounds) }),
  );
  layer.alpha = alpha;
  viewer.imageryLayers.add(layer);
  return layer;
};

export const removeLayer = (viewer: Viewer, layer: ImageryLayer): void => {
  if (!viewer.isDestroyed()) viewer.imageryLayers.remove(layer);
};
