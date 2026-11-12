import {
  Cartesian3,
  Color,
  PolylineDashMaterialProperty,
  type Cartesian2,
  type Entity,
  type Viewer,
} from "cesium";

import type { Draft, Pointer } from "@/features/geo/drawMachine";
import type { AreaLevel } from "@/features/geo/limits";
import { pickLonLat } from "@/features/globe/cesium";
import { GOLD, INK, SPACE } from "@/features/globe/frameEntities";

const OVER_COLOR = Color.fromCssColorString("#f87171");
const LEVEL_COLOR: Record<AreaLevel, Color> = { ideal: GOLD, large: GOLD, tooLarge: OVER_COLOR };
const DASH_PX = 10;
const CORNER_PX = 7;

export type DraftView = Draft & { level: AreaLevel };

// Where the pointer is on the globe and on the screen; undefined off the planet.
export const pointerAt = (viewer: Viewer, position: Cartesian2): Pointer | undefined => {
  const lonLat = pickLonLat(viewer, position);
  return lonLat && { lonLat, px: [position.x, position.y] };
};

// While a tool is on, a drag draws instead of spinning the globe; the wheel still zooms.
export const setCameraFollowsDrag = (viewer: Viewer, follows: boolean): void => {
  const controls = viewer.scene.screenSpaceCameraController;
  controls.enableRotate = follows;
  controls.enableTranslate = follows;
  controls.enableTilt = follows;
  viewer.canvas.style.cursor = follows ? "" : "crosshair";
};

// The shape being drawn: a dashed outline, a faint fill once it closes, and a dot per corner.
export const addDraftEntities = (
  viewer: Viewer,
  { tool, ring, closed, level }: DraftView,
): Entity[] => {
  const color = LEVEL_COLOR[level];
  const first = ring[0];
  const positions = Cartesian3.fromDegreesArray((closed && first ? [...ring, first] : ring).flat());
  const outline = viewer.entities.add({
    polyline: {
      positions,
      width: 2.5,
      material: new PolylineDashMaterialProperty({ color, dashLength: DASH_PX }),
    },
    ...(closed && { polygon: { hierarchy: positions, material: color.withAlpha(0.12) } }),
  });
  // The point tool previews a square under the cursor: its four corners are not choices.
  const corners = (tool === "point" ? [] : ring).map(([lon, lat]) =>
    viewer.entities.add({
      position: Cartesian3.fromDegrees(lon, lat),
      point: {
        pixelSize: CORNER_PX,
        color: INK,
        outlineColor: SPACE,
        outlineWidth: 2,
        disableDepthTestDistance: Number.POSITIVE_INFINITY,
      },
    }),
  );
  return [outline, ...corners];
};
