import {
  Cartesian2,
  Cartesian3,
  DistanceDisplayCondition,
  HorizontalOrigin,
  LabelStyle,
  type Entity,
  type Viewer,
} from "cesium";

import { ICON_PATHS } from "@/features/cases/HazardIcon";
import type { Case } from "@/features/cases/cases";
import { INK, SPACE } from "@/features/globe/frameEntities";

export const MARKER_PREFIX = "case:";

// Icon in a dark disc (icons/marker.svg): solid ring when measured, dashed while pending, gold when open.
export const markerImage = (item: Case, selected: boolean): string => {
  const ring = selected ? "#c9b48b" : "rgba(235,233,228,0.6)";
  const dash = item.pending === true ? "stroke-dasharray='4 3'" : "";
  const halo = selected ? "<circle cx='34' cy='34' r='33' fill='rgba(201,180,139,0.22)'/>" : "";
  const svg = `<svg xmlns='http://www.w3.org/2000/svg' width='68' height='68' viewBox='0 0 68 68'>${halo}<circle cx='34' cy='34' r='25' fill='#08101f' fill-opacity='0.94' stroke='${ring}' stroke-width='${selected ? 3 : 1.75}' ${dash}/><g transform='translate(20 20) scale(1.1667)' fill='none' stroke='#ebe9e4' stroke-width='1.75' stroke-linecap='round' stroke-linejoin='round'><path d='${ICON_PATHS[item.hazard]}'/></g></svg>`;
  return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;
};

// Markers on the far side of the planet stay hidden; near ones are lifted toward the camera so the
// ground never clips them, and close up the depth test is dropped altogether.
const LIFT = new Cartesian3(0, 0, -3_000);
const NO_DEPTH_TEST_BELOW_M = 1e7;

export const addCaseMarker = (viewer: Viewer, item: Case, selected: boolean): Entity =>
  viewer.entities.add({
    id: `${MARKER_PREFIX}${item.id}`,
    position: Cartesian3.fromDegrees(...item.focus),
    billboard: {
      image: markerImage(item, selected),
      width: 34,
      height: 34,
      eyeOffset: LIFT,
      disableDepthTestDistance: NO_DEPTH_TEST_BELOW_M,
    },
    label: {
      text: item.name,
      font: "500 13px Albert Sans, system-ui, sans-serif",
      fillColor: INK,
      outlineColor: SPACE,
      outlineWidth: 3,
      style: LabelStyle.FILL_AND_OUTLINE,
      pixelOffset: new Cartesian2(22, 0),
      horizontalOrigin: HorizontalOrigin.LEFT,
      eyeOffset: LIFT,
      disableDepthTestDistance: NO_DEPTH_TEST_BELOW_M,
      distanceDisplayCondition: new DistanceDisplayCondition(0, 2.6e7),
    },
  });
