import { describe, expect, it } from "vitest";

import { ringAreaKm2 } from "@/features/geo/measure";
import {
  draftOf,
  isDrawing,
  reduceDraw,
  startTool,
  type DrawEvent,
  type DrawState,
  type DrawStep,
  type Pointer,
} from "@/features/geo/drawMachine";
import type { DrawTool } from "@/features/geo/geo.types";
import { MAX_VERTICES } from "@/features/geo/limits";

const at = (lon: number, lat: number, x = 0, y = 0): Pointer => ({
  lonLat: [lon, lat],
  px: [x, y],
});

const run = (tool: DrawTool | undefined, events: DrawEvent[]): DrawStep =>
  events.reduce<DrawStep>((step, event) => reduceDraw(step.state, event), {
    state: startTool(tool),
  });

describe("without a tool", () => {
  it("fires nothing, so the guided tour keeps the globe still", () => {
    const events: DrawEvent[] = [
      { type: "down", pointer: at(1, 1) },
      { type: "move", pointer: at(2, 2, 50, 50) },
      { type: "up", pointer: at(2, 2, 50, 50) },
      { type: "click", pointer: at(2, 2) },
      { type: "finish" },
    ];
    const step = run(undefined, events);
    expect(step.area).toBeUndefined();
    expect(step.state).toEqual(startTool(undefined));
  });
});

describe("point tool", () => {
  it("follows the cursor with the 10.24 km square and asks on click", () => {
    const hovering = run("point", [{ type: "move", pointer: at(73.7, 32.3) }]);
    expect(ringAreaKm2(draftOf(hovering.state)?.ring ?? [])).toBeCloseTo(10.24 * 10.24, 0);

    const clicked = reduceDraw(hovering.state, { type: "click", pointer: at(73.7, 32.3) });
    expect(clicked.area).toEqual({ kind: "point", point: [73.7, 32.3] });
    expect(draftOf(clicked.state)).toBeUndefined();
  });
});

describe("rectangle tool", () => {
  it("draws from press to release", () => {
    const step = run("rectangle", [
      { type: "down", pointer: at(10, 20, 100, 100) },
      { type: "move", pointer: at(11, 21, 140, 60) },
      { type: "up", pointer: at(11, 21, 140, 60) },
    ]);
    expect(step.area).toEqual({
      kind: "rectangle",
      ring: [
        [10, 20],
        [11, 20],
        [11, 21],
        [10, 21],
      ],
    });
    expect(isDrawing(step.state)).toBe(false);
  });

  it("shows the rubber band while the button is down", () => {
    const step = run("rectangle", [
      { type: "down", pointer: at(10, 20, 100, 100) },
      { type: "move", pointer: at(11, 21, 140, 60) },
    ]);
    expect(isDrawing(step.state)).toBe(true);
    expect(draftOf(step.state)).toEqual({
      tool: "rectangle",
      ring: [
        [10, 20],
        [11, 20],
        [11, 21],
        [10, 21],
      ],
      closed: true,
    });
  });

  it("drags across the antimeridian without jumping round the globe", () => {
    const step = run("rectangle", [
      { type: "down", pointer: at(179.9, 10, 100, 100) },
      { type: "move", pointer: at(-179.9, 11, 140, 60) },
      { type: "up", pointer: at(-179.9, 11, 140, 60) },
    ]);
    expect(step.area?.kind === "rectangle" && step.area.ring.map(([lon]) => lon)).toEqual([
      179.9, 180.1, 180.1, 179.9,
    ]);
  });

  it("drops a drag shorter than 6 px", () => {
    const step = run("rectangle", [
      { type: "down", pointer: at(10, 20, 100, 100) },
      { type: "up", pointer: at(10.001, 20.001, 103, 104) },
    ]);
    expect(step.area).toBeUndefined();
    expect(step.rejected).toBe("too-small");
    expect(isDrawing(step.state)).toBe(false);
  });

  it("ignores a release that never had a press", () => {
    const step = run("rectangle", [{ type: "up", pointer: at(1, 1, 50, 50) }]);
    expect(step.area).toBeUndefined();
    expect(step.rejected).toBeUndefined();
  });
});

describe("polygon tool", () => {
  const corners: DrawEvent[] = [
    { type: "click", pointer: at(10, 20, 100, 100) },
    { type: "click", pointer: at(11, 20, 200, 100) },
    { type: "click", pointer: at(11, 21, 200, 40) },
  ];

  it("collects corners and finishes with a double-click or the Finish button", () => {
    const step = run("polygon", [...corners, { type: "finish" }]);
    expect(step.area).toEqual({
      kind: "polygon",
      ring: [
        [10, 20],
        [11, 20],
        [11, 21],
      ],
    });
    expect(isDrawing(step.state)).toBe(false);
  });

  it("ignores the second click of a double-click, which lands on the same pixel", () => {
    const step = run("polygon", [
      ...corners,
      { type: "click", pointer: at(11.0001, 21.0001, 202, 42) },
    ]);
    expect(step.state.corners).toHaveLength(3);
  });

  it("needs three corners", () => {
    const step = run("polygon", [...corners.slice(0, 2), { type: "finish" }]);
    expect(step.area).toBeUndefined();
    expect(step.rejected).toBe("too-few-corners");
    expect(isDrawing(step.state)).toBe(false);
  });

  it("stops at the backend's vertex limit", () => {
    const clicks: DrawEvent[] = Array.from({ length: MAX_VERTICES + 1 }, (_, index) => ({
      type: "click",
      pointer: at(index * 0.001, 10 + (index % 2) * 0.001, index * 10, (index % 2) * 10),
    }));
    const step = run("polygon", clicks);
    expect(step.state.corners).toHaveLength(MAX_VERTICES);
    expect(step.rejected).toBe("too-many-corners");
  });

  it("shows the corners so far with the cursor as the next one", () => {
    const step = run("polygon", [
      corners[0] as DrawEvent,
      { type: "move", pointer: at(10.5, 20.5, 150, 80) },
    ]);
    expect(draftOf(step.state)).toEqual({
      tool: "polygon",
      ring: [
        [10, 20],
        [10.5, 20.5],
      ],
      closed: false,
    });
  });

  it("keeps longitudes continuous when the corners cross the antimeridian", () => {
    const step = run("polygon", [
      { type: "click", pointer: at(179.9, 10, 100, 100) },
      { type: "click", pointer: at(-179.9, 10, 200, 100) },
      { type: "click", pointer: at(-179.9, 11, 200, 40) },
      { type: "finish" },
    ]);
    expect(step.area?.kind === "polygon" && step.area.ring.map(([lon]) => lon)).toEqual([
      179.9, 180.1, 180.1,
    ]);
  });
});

describe("cancel", () => {
  it("drops what is in progress but keeps the tool", () => {
    const drawing = run("polygon", [{ type: "click", pointer: at(10, 20, 100, 100) }]);
    const step = reduceDraw(drawing.state, { type: "cancel" });
    expect(step.state).toEqual(startTool("polygon"));
    expect(isDrawing(step.state)).toBe(false);
  });
});

describe("a state is never mutated", () => {
  it("returns a new state for every event", () => {
    const before: DrawState = startTool("polygon");
    reduceDraw(before, { type: "click", pointer: at(1, 1, 10, 10) });
    expect(before).toEqual(startTool("polygon"));
  });
});
