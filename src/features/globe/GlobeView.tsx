import {
  Cartesian3,
  EasingFunction,
  Rectangle,
  SceneTransforms,
  ScreenSpaceEventHandler,
  ScreenSpaceEventType,
  type Cartesian2,
  type Entity,
  type ImageryLayer,
  type Viewer,
} from "cesium";
import { useEffect, useRef, useState } from "react";

import { findLens, type Case } from "@/features/cases/cases";
import type { BBox, Frame, LonLat } from "@/features/frames/frame.types";
import { findFrameAt } from "@/features/frames/frames";
import type { DrawEvent, Pointer } from "@/features/geo/drawMachine";
import type { DrawTool } from "@/features/geo/geo.types";
import { wrapBox } from "@/features/geo/longitude";
import { addCaseMarker, MARKER_PREFIX } from "@/features/globe/caseMarkers";
import { createViewer, pickLonLat } from "@/features/globe/cesium";
import {
  addDraftEntities,
  pointerAt,
  setCameraFollowsDrag,
  type DraftView,
} from "@/features/globe/drawTools";
import {
  addChipOutline,
  addDrapeLayer,
  addFrameEntities,
  addPointEntity,
  crossfadeLayers,
  HOVER_COLOR,
  INK,
  removeEntities,
  removeLayer,
  type ChipOutline,
  type Drape,
} from "@/features/globe/frameEntities";
import { framedBox, viewInsets, type GlobeView as View } from "@/features/globe/framing";
import { GlobeTooltip, type TooltipContent } from "@/features/globe/GlobeTooltip";
import { formatLonLat } from "@/features/live/liveQuestion";

const HOME = Cartesian3.fromDegrees(-20, 18, 21_000_000); // the Atlantic: four of the five cases
const ARRIVAL = Cartesian3.fromDegrees(-20, 18, 32_000_000);
const ARRIVAL_SECONDS = 2.4;
const FLY_SECONDS = 1.8;
const HOME_SECONDS = 1.6;
const SPIN_RADIANS_PER_TICK = -0.0005;

// Where the camera should look; `key` changes when the subject changes, not on every render.
// `seconds` overrides the flight time (the story's region view flies a little slower).
export type CameraTarget = { key: string; box: BBox; zoom: number; seconds?: number };

// The time-lapse stamp under the footprint (SPECS-v8 §4), shown while it plays.
export type GlobeStamp = { date: string; pass: string; target: boolean; box: BBox };

export type GlobeScene = {
  target: CameraTarget | undefined;
  outline: ChipOutline | undefined;
  point: LonLat | undefined;
  frame: Frame | undefined;
  selectedCaseId: string | undefined;
  drape: Drape | undefined;
  drapeAlpha: number;
  stamp: GlobeStamp | undefined;
};

type GlobeViewProps = {
  frames: Frame[];
  cases: Case[];
  scene: GlobeScene;
  view: View;
  reduceMotion: boolean;
  // Bumped by the "Whole globe" button: fly home even when nothing is open.
  homeRequest: number;
  onOpenCase: (item: Case) => void;
  // Any clicked point on the globe; frame is undefined where no NISAR frame lies (v8 no-data).
  onAsk: (point: LonLat, frame: Frame | undefined) => void;
  // While a tool is on, the globe draws instead of asking; undefined hands the clicks back.
  drawTool: DrawTool | undefined;
  draft: DraftView | undefined;
  onDraw: (event: DrawEvent) => void;
  onUnavailable: () => void;
  // Hands the viewer out for the PNG download; undefined once it is destroyed.
  onViewer?: (viewer: Viewer | undefined) => void;
};

type Hover = { content: TooltipContent; x: number; y: number; frame?: Frame };

// Ascending frames first, as the mission plans most science passes; descending fills the gaps.
const frameUnder = (frames: Frame[], point: LonLat): Frame | undefined =>
  findFrameAt(frames, point, "A") ?? findFrameAt(frames, point, "D");

export const GlobeView = ({
  frames,
  cases,
  scene,
  view,
  reduceMotion,
  homeRequest,
  onOpenCase,
  onAsk,
  drawTool,
  draft,
  onDraw,
  onUnavailable,
  onViewer,
}: GlobeViewProps) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [viewer, setViewer] = useState<Viewer>();
  const [hover, setHover] = useState<Hover>();
  const [isSpinning, setIsSpinning] = useState(true);
  const hadTarget = useRef(false);

  // Cesium handlers are registered once, so they read the latest props through a ref.
  const latest = useRef({ frames, cases, onOpenCase, onAsk, reduceMotion, drawTool, onDraw });
  useEffect(() => {
    latest.current = { frames, cases, onOpenCase, onAsk, reduceMotion, drawTool, onDraw };
  });

  useEffect(() => {
    if (containerRef.current === null) return;
    let instance: Viewer;
    try {
      instance = createViewer(containerRef.current);
    } catch {
      onUnavailable();
      return;
    }
    const lost = instance.scene.renderError.addEventListener(() => onUnavailable());
    // The planet arrives from deep space, unless motion is reduced.
    if (latest.current.reduceMotion) instance.camera.setView({ destination: HOME });
    else {
      instance.camera.setView({ destination: ARRIVAL });
      instance.camera.flyTo({
        destination: HOME,
        duration: ARRIVAL_SECONDS,
        easingFunction: EasingFunction.QUARTIC_OUT,
      });
    }
    setViewer(instance);
    onViewer?.(instance);
    return () => {
      onViewer?.(undefined);
      lost();
      instance.destroy();
    };
    // onUnavailable and onViewer only store a flag or a ref; the viewer must be created once.
    // oxlint-disable-next-line react/exhaustive-deps
  }, []);

  useEffect(() => {
    if (viewer === undefined) return;
    const caseAt = (position: Cartesian2): Case | undefined => {
      const picked: unknown = viewer.scene.pick(position);
      const id = (picked as { id?: Entity } | undefined)?.id?.id;
      if (typeof id !== "string" || !id.startsWith(MARKER_PREFIX)) return undefined;
      return latest.current.cases.find((item) => `${MARKER_PREFIX}${item.id}` === id);
    };

    // With a tool on, the pointer draws: nothing below (hover, cases, asking) fires. Moves are
    // sent once per frame, because every one re-renders the explorer; the rest go straight through.
    let moveFrame = 0;
    let lastMove: Pointer | undefined;
    const draw = (type: "move" | "down" | "up" | "click", position: Cartesian2): void => {
      const pointer = pointerAt(viewer, position);
      if (type === "move") {
        lastMove = pointer;
        if (moveFrame === 0)
          moveFrame = requestAnimationFrame(() => {
            moveFrame = 0;
            if (lastMove !== undefined) latest.current.onDraw({ type: "move", pointer: lastMove });
          });
        return;
      }
      cancelAnimationFrame(moveFrame);
      moveFrame = 0;
      if (pointer !== undefined) latest.current.onDraw({ type, pointer });
      // A release off the planet would leave a drag hanging.
      else if (type === "up") latest.current.onDraw({ type: "cancel" });
    };

    const handler = new ScreenSpaceEventHandler(viewer.scene.canvas);
    handler.setInputAction(({ endPosition }: ScreenSpaceEventHandler.MotionEvent) => {
      if (latest.current.drawTool !== undefined) {
        setHover(undefined);
        draw("move", endPosition);
        return;
      }
      const { x, y } = endPosition;
      const item = caseAt(endPosition);
      if (item !== undefined) {
        const what =
          item.pending === true
            ? "Event context · no measurement yet"
            : `Measured case · ${findLens(item.lens)?.chip ?? ""}`;
        setHover({ content: { title: item.name, sub: what }, x, y });
        return;
      }
      const point = pickLonLat(viewer, endPosition);
      const frame = point && frameUnder(latest.current.frames, point);
      if (point === undefined || frame === undefined) {
        setHover(undefined);
        return;
      }
      setHover({
        content: {
          title: `Track ${frame.track} · Frame ${frame.frame} · ${frame.hasCrossPol ? "HH+HV" : "HH only"}`,
          sub: `${formatLonLat(point)} · NISAR frame ~240 km · click to ask the radar`,
        },
        x,
        y,
        frame,
      });
    }, ScreenSpaceEventType.MOUSE_MOVE);
    handler.setInputAction(({ position }: ScreenSpaceEventHandler.PositionedEvent) => {
      if (latest.current.drawTool !== undefined) {
        draw("click", position);
        return;
      }
      const item = caseAt(position);
      if (item !== undefined) {
        latest.current.onOpenCase(item);
        return;
      }
      const point = pickLonLat(viewer, position);
      const frame = point && frameUnder(latest.current.frames, point);
      if (point !== undefined) latest.current.onAsk(point, frame);
    }, ScreenSpaceEventType.LEFT_CLICK);
    handler.setInputAction(
      () => latest.current.drawTool !== undefined && latest.current.onDraw({ type: "finish" }),
      ScreenSpaceEventType.LEFT_DOUBLE_CLICK,
    );
    handler.setInputAction(({ position }: ScreenSpaceEventHandler.PositionedEvent) => {
      if (latest.current.drawTool !== undefined) draw("up", position);
    }, ScreenSpaceEventType.LEFT_UP);
    // Any manual navigation stops the idle spin for good.
    handler.setInputAction(({ position }: ScreenSpaceEventHandler.PositionedEvent) => {
      if (latest.current.drawTool !== undefined) draw("down", position);
      else setIsSpinning(false);
    }, ScreenSpaceEventType.LEFT_DOWN);
    handler.setInputAction(() => setIsSpinning(false), ScreenSpaceEventType.WHEEL);
    return () => {
      cancelAnimationFrame(moveFrame);
      handler.destroy();
    };
  }, [viewer]);

  const drawing = drawTool !== undefined;
  useEffect(() => {
    if (viewer === undefined) return;
    // A tool needs a still globe under the hand.
    if (drawing) setIsSpinning(false);
    setCameraFollowsDrag(viewer, !drawing);
    return () => {
      if (!viewer.isDestroyed()) setCameraFollowsDrag(viewer, true);
    };
  }, [viewer, drawing]);

  const draftKey = draft && `${draft.tool}|${draft.closed}|${draft.level}|${draft.ring.join(";")}`;
  useEffect(() => {
    if (viewer === undefined || draft === undefined) return;
    const entities = addDraftEntities(viewer, draft);
    return () => removeEntities(viewer, entities);
    // draftKey stands in for the draft object, which is rebuilt on every render.
    // oxlint-disable-next-line react/exhaustive-deps
  }, [viewer, draftKey]);

  const hasTarget = scene.target !== undefined;
  useEffect(() => {
    if (viewer === undefined || !isSpinning || reduceMotion || hasTarget) return;
    return viewer.clock.onTick.addEventListener(() =>
      viewer.camera.rotate(Cartesian3.UNIT_Z, SPIN_RADIANS_PER_TICK),
    );
  }, [viewer, isSpinning, reduceMotion, hasTarget]);

  useEffect(() => {
    if (viewer === undefined) return;
    const markers = cases.map((item) =>
      addCaseMarker(viewer, item, item.id === scene.selectedCaseId),
    );
    return () => removeEntities(viewer, markers);
  }, [viewer, cases, scene.selectedCaseId]);

  const hoveredFrame = hover?.frame;
  useEffect(() => {
    if (viewer === undefined || hoveredFrame === undefined) return;
    const entities = addFrameEntities(viewer, hoveredFrame, HOVER_COLOR);
    return () => removeEntities(viewer, entities);
  }, [viewer, hoveredFrame]);

  const { frame, outline, point } = scene;
  useEffect(() => {
    if (viewer === undefined || frame === undefined) return;
    const entities = addFrameEntities(viewer, frame, INK, { width: 1, alpha: 0.45, fill: 0.03 });
    return () => removeEntities(viewer, entities);
  }, [viewer, frame]);

  const outlineKey =
    outline &&
    `${outline.ring.join(";")}|${outline.label}|${outline.processing}|${outline.spot === true}`;
  useEffect(() => {
    if (viewer === undefined || outline === undefined) return;
    const entities = addChipOutline(viewer, outline);
    return () => removeEntities(viewer, entities);
    // outlineKey stands in for the outline object, which is rebuilt on every render.
    // oxlint-disable-next-line react/exhaustive-deps
  }, [viewer, outlineKey]);

  const pointKey = point?.join(",");
  useEffect(() => {
    if (viewer === undefined || point === undefined) return;
    const entity = addPointEntity(viewer, point);
    return () => removeEntities(viewer, [entity]);
    // oxlint-disable-next-line react/exhaustive-deps
  }, [viewer, pointKey]);

  const layerRef = useRef<ImageryLayer>(undefined);
  const [fading, setFading] = useState(false);
  const drapeKey = scene.drape && `${scene.drape.url}|${scene.drape.bounds.join(",")}`;
  const alphaRef = useRef(scene.drapeAlpha);
  alphaRef.current = scene.drapeAlpha;
  // One drape at a time; a change crossfades from the previous one (instant under reduced motion).
  useEffect(() => {
    if (viewer === undefined) return;
    const previous = layerRef.current;
    const alpha = alphaRef.current;
    const instant = previous === undefined || latest.current.reduceMotion;
    const next =
      scene.drape === undefined
        ? undefined
        : addDrapeLayer(viewer, scene.drape, instant ? alpha : 0);
    layerRef.current = next;
    if (instant) {
      if (previous !== undefined) removeLayer(viewer, previous);
      return;
    }
    setFading(true);
    return crossfadeLayers(viewer, previous, next, alpha, () => setFading(false));
    // drapeKey stands in for the drape object, which is rebuilt on every render.
    // oxlint-disable-next-line react/exhaustive-deps
  }, [viewer, drapeKey]);

  useEffect(
    () => () => {
      if (viewer !== undefined && layerRef.current !== undefined)
        removeLayer(viewer, layerRef.current);
      layerRef.current = undefined;
    },
    [viewer],
  );

  // The stamp follows the footprint's south edge as the camera moves, without a React render per frame.
  const stampRef = useRef<HTMLParagraphElement>(null);
  const stampKey = scene.stamp?.box.join(",");
  useEffect(() => {
    const box = scene.stamp?.box;
    if (viewer === undefined || box === undefined) return;
    const [west, south, east] = box;
    const anchor = Cartesian3.fromDegrees((west + east) / 2, south);
    const place = () => {
      const element = stampRef.current;
      const at = SceneTransforms.worldToWindowCoordinates(viewer.scene, anchor);
      if (element === null) return;
      element.style.visibility = at === undefined ? "hidden" : "visible";
      if (at !== undefined)
        element.style.transform = `translate(${at.x}px, ${at.y}px) translateX(-50%)`;
    };
    place();
    return viewer.scene.postRender.addEventListener(place);
    // stampKey stands in for the box, which is rebuilt on every render.
    // oxlint-disable-next-line react/exhaustive-deps
  }, [viewer, stampKey]);

  // The slider only changes alpha: re-adding the layer would flash the base map.
  useEffect(() => {
    if (layerRef.current !== undefined) layerRef.current.alpha = scene.drapeAlpha;
  }, [scene.drapeAlpha]);

  const { target } = scene;
  const targetKey = target && `${target.key}|${view}`;
  useEffect(() => {
    if (viewer === undefined) return;
    const duration = reduceMotion ? 0 : (target?.seconds ?? FLY_SECONDS);
    // Closing the selection flies back out, so nobody is stranded close to the ground.
    if (target === undefined) {
      if (hadTarget.current)
        viewer.camera.flyTo({ destination: HOME, duration: reduceMotion ? 0 : HOME_SECONDS });
      hadTarget.current = false;
      return;
    }
    hadTarget.current = true;
    const { clientWidth: width, clientHeight: height } = viewer.canvas;
    const box = framedBox(target.box, viewInsets(view, width, height), width, height, target.zoom);
    viewer.camera.flyTo({
      destination: Rectangle.fromDegrees(...wrapBox(box)),
      duration,
      easingFunction: EasingFunction.QUADRATIC_IN_OUT,
    });
    // targetKey stands in for the target object; motion settings don't re-fly the camera.
    // oxlint-disable-next-line react/exhaustive-deps
  }, [viewer, targetKey]);

  useEffect(() => {
    if (viewer === undefined || homeRequest === 0) return;
    viewer.camera.flyTo({
      destination: HOME,
      duration: latest.current.reduceMotion ? 0 : HOME_SECONDS,
    });
  }, [viewer, homeRequest]);

  return (
    <div
      className="x-globe"
      data-testid="globe"
      data-crossfade={fading ? "on" : undefined}
      onMouseLeave={() => setHover(undefined)}
    >
      <div ref={containerRef} className="x-globe" />
      {scene.stamp !== undefined && (
        <p className="x-stamp" ref={stampRef} data-testid="timelapse-stamp">
          <span className="x-stamp__date">{scene.stamp.date}</span>
          <span className="x-stamp__pass" data-target={scene.stamp.target}>
            {scene.stamp.pass}
          </span>
        </p>
      )}
      {hover !== undefined && <GlobeTooltip content={hover.content} x={hover.x} y={hover.y} />}
    </div>
  );
};
