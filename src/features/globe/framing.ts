import type { BBox } from "@/features/frames/frame.types";

/*
 * Where the camera should look so a small box sits in the part of the screen nothing covers: right
 * of the panel and above the timeline, or in the left strip while the sheet is open.
 */

export type GlobeView = "panel" | "sheet" | "story";
export type Insets = { left: number; right: number; top: number; bottom: number };

// Below this width the panel sits over the lower half of the screen instead of the left side.
export const NARROW_PX = 760;
const PANEL_PX = 392;
const DOCK_PX = 288;
const TOP_PX = 72;
const TIMELINE_PX = 200;
const SHEET_STRIP_PX = 440;
// The story card sits on the right and the caption bar along the bottom (SPECS §5).
const STORY_CARD_PX = 488;
const STORY_CAPTION_PX = 220;

export const viewInsets = (view: GlobeView, width: number, height: number): Insets => {
  if (width < NARROW_PX) return { left: 0, right: 0, top: TOP_PX, bottom: height * 0.5 };
  if (view === "sheet")
    return {
      left: 0,
      right: width - Math.min(SHEET_STRIP_PX, width * 0.24),
      top: TOP_PX,
      bottom: TOP_PX,
    };
  if (view === "story")
    return { left: 0, right: STORY_CARD_PX, top: TOP_PX, bottom: STORY_CAPTION_PX };
  return { left: PANEL_PX, right: DOCK_PX, top: TOP_PX, bottom: TIMELINE_PX };
};

// `zoom` is how many box widths the free area spans (3.2 shows the chip with context around it).
export const framedBox = (
  [west, south, east, north]: BBox,
  insets: Insets,
  width: number,
  height: number,
  zoom: number,
): BBox => {
  const { left, right, top, bottom } = insets;
  const freeW = Math.max(0.2, (width - left - right) / width);
  const freeH = Math.max(0.25, (height - top - bottom) / height);
  const cx = (west + east) / 2;
  const cy = (south + north) / 2;
  const span = Math.max(
    ((east - west) * zoom) / freeW,
    (((north - south) * zoom) / freeH) * (width / height),
  );
  const spanX = span;
  const spanY = span * (height / width);
  const viewWest = cx - spanX * ((left + (width - left - right) / 2) / width);
  const viewSouth = cy - spanY * ((bottom + (height - top - bottom) / 2) / height);
  return [viewWest, viewSouth, viewWest + spanX, viewSouth + spanY];
};
