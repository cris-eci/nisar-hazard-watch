import type { LonLat } from "@/features/frames/frame.types";
import type { Area, DrawTool, Ring } from "@/features/geo/geo.types";
import { AOI_SIDE_KM, MAX_VERTICES, MIN_DRAW_PX, MIN_VERTICES } from "@/features/geo/limits";
import { continueLon } from "@/features/geo/longitude";
import { squareAround } from "@/features/geo/square";

/*
 * The drawing tools as a pure state machine: the globe turns mouse and touch into events, this
 * decides what they mean. Point: click. Rectangle: press, drag, release. Polygon: click each
 * corner, then double-click or Finish. Without a tool nothing fires, which is how the guided
 * tour keeps the globe still.
 */

export type Pointer = { lonLat: LonLat; px: [x: number, y: number] };

export type DrawState = {
  tool: DrawTool | undefined;
  // Rectangle: where the drag began.
  anchor: Pointer | undefined;
  // Polygon: the corners clicked so far, with continuous longitudes.
  corners: Pointer[];
  cursor: LonLat | undefined;
};

export type DrawEvent =
  | { type: "move"; pointer: Pointer }
  | { type: "down"; pointer: Pointer }
  | { type: "up"; pointer: Pointer }
  | { type: "click"; pointer: Pointer }
  | { type: "finish" }
  | { type: "cancel" };

export type DrawRejection = "too-small" | "too-few-corners" | "too-many-corners";

export type DrawStep = { state: DrawState; area?: Area; rejected?: DrawRejection };

export const startTool = (tool: DrawTool | undefined): DrawState => ({
  tool,
  anchor: undefined,
  corners: [],
  cursor: undefined,
});

export const isDrawing = ({ anchor, corners }: DrawState): boolean =>
  anchor !== undefined || corners.length > 0;

const pixelsApart = ([x1, y1]: Pointer["px"], [x2, y2]: Pointer["px"]): number =>
  Math.hypot(x2 - x1, y2 - y1);

const rectangleRing = (from: LonLat, to: LonLat): Ring => {
  const east = continueLon(from[0], to[0]);
  return [
    [from[0], from[1]],
    [east, from[1]],
    [east, to[1]],
    [from[0], to[1]],
  ];
};

const reset = (state: DrawState, extra: Omit<DrawStep, "state"> = {}): DrawStep => ({
  state: startTool(state.tool),
  ...extra,
});

const lastLonLat = (state: DrawState): LonLat | undefined =>
  state.corners.at(-1)?.lonLat ?? state.anchor?.lonLat;

const move = (state: DrawState, { lonLat: [lon, lat] }: Pointer): DrawStep => {
  const previous = lastLonLat(state);
  const cursor: LonLat = [previous === undefined ? lon : continueLon(previous[0], lon), lat];
  return { state: { ...state, cursor } };
};

const clickPolygon = (state: DrawState, pointer: Pointer): DrawStep => {
  const previous = state.corners.at(-1);
  if (previous !== undefined && pixelsApart(previous.px, pointer.px) < MIN_DRAW_PX)
    return { state };
  if (state.corners.length >= MAX_VERTICES) return { state, rejected: "too-many-corners" };
  const [lon, lat] = pointer.lonLat;
  const corner: Pointer = {
    px: pointer.px,
    lonLat: [previous === undefined ? lon : continueLon(previous.lonLat[0], lon), lat],
  };
  return { state: { ...state, corners: [...state.corners, corner], cursor: corner.lonLat } };
};

const finishPolygon = (state: DrawState): DrawStep =>
  state.corners.length < MIN_VERTICES
    ? reset(state, { rejected: "too-few-corners" })
    : reset(state, {
        area: { kind: "polygon", ring: state.corners.map(({ lonLat }) => lonLat) },
      });

const releaseRectangle = (state: DrawState, pointer: Pointer): DrawStep => {
  const { anchor } = state;
  if (anchor === undefined) return { state };
  if (pixelsApart(anchor.px, pointer.px) < MIN_DRAW_PX)
    return reset(state, { rejected: "too-small" });
  return reset(state, {
    area: { kind: "rectangle", ring: rectangleRing(anchor.lonLat, pointer.lonLat) },
  });
};

export const reduceDraw = (state: DrawState, event: DrawEvent): DrawStep => {
  if (state.tool === undefined) return { state };
  if (event.type === "cancel") return reset(state);
  if (event.type === "move") return move(state, event.pointer);
  switch (state.tool) {
    case "point":
      return event.type === "click"
        ? reset(state, { area: { kind: "point", point: event.pointer.lonLat } })
        : { state };
    case "rectangle":
      if (event.type === "down")
        return { state: { ...state, anchor: event.pointer, cursor: event.pointer.lonLat } };
      return event.type === "up" ? releaseRectangle(state, event.pointer) : { state };
    case "polygon":
      if (event.type === "click") return clickPolygon(state, event.pointer);
      return event.type === "finish" ? finishPolygon(state) : { state };
  }
};

// What the globe shows while drawing: the square under a point cursor, the rubber-band rectangle,
// or the corners so far with the cursor as the next one.
export type Draft = { tool: DrawTool; ring: Ring; closed: boolean };

export const draftOf = (state: DrawState): Draft | undefined => {
  const { tool, anchor, corners, cursor } = state;
  if (tool === "point")
    return cursor && { tool, ring: squareAround(cursor, AOI_SIDE_KM), closed: true };
  if (tool === "rectangle")
    return anchor && cursor && { tool, ring: rectangleRing(anchor.lonLat, cursor), closed: true };
  if (tool === "polygon" && corners.length > 0) {
    const ring = [...corners.map(({ lonLat }) => lonLat), ...(cursor ? [cursor] : [])];
    return { tool, ring, closed: ring.length >= MIN_VERTICES };
  }
  return undefined;
};
