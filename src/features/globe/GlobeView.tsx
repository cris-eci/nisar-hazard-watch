import {
  Cartesian3,
  EasingFunction,
  Rectangle,
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
import { addCaseMarker, MARKER_PREFIX } from "@/features/globe/caseMarkers";
import { createViewer, pickLonLat } from "@/features/globe/cesium";
import {
  addChipOutline,
  addDrapeLayer,
  addFrameEntities,
  addPointEntity,
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
export type CameraTarget = { key: string; box: BBox; zoom: number };

export type GlobeScene = {
  target: CameraTarget | undefined;
  outline: ChipOutline | undefined;
  point: LonLat | undefined;
  frame: Frame | undefined;
  selectedCaseId: string | undefined;
  drape: Drape | undefined;
  drapeAlpha: number;
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
  onAsk: (frame: Frame, point: LonLat) => void;
  onUnavailable: () => void;
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
  onUnavailable,
}: GlobeViewProps) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [viewer, setViewer] = useState<Viewer>();
  const [hover, setHover] = useState<Hover>();
  const [isSpinning, setIsSpinning] = useState(true);
  const hadTarget = useRef(false);

  // Cesium handlers are registered once, so they read the latest props through a ref.
  const latest = useRef({ frames, cases, onOpenCase, onAsk, reduceMotion });
  useEffect(() => {
    latest.current = { frames, cases, onOpenCase, onAsk, reduceMotion };
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
    return () => {
      lost();
      instance.destroy();
    };
    // onUnavailable only flips a flag; the viewer must be created once.
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

    const handler = new ScreenSpaceEventHandler(viewer.scene.canvas);
    handler.setInputAction(({ endPosition }: ScreenSpaceEventHandler.MotionEvent) => {
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
      const item = caseAt(position);
      if (item !== undefined) {
        latest.current.onOpenCase(item);
        return;
      }
      const point = pickLonLat(viewer, position);
      const frame = point && frameUnder(latest.current.frames, point);
      if (point !== undefined && frame !== undefined) latest.current.onAsk(frame, point);
    }, ScreenSpaceEventType.LEFT_CLICK);
    // Any manual navigation stops the idle spin for good.
    handler.setInputAction(() => setIsSpinning(false), ScreenSpaceEventType.LEFT_DOWN);
    handler.setInputAction(() => setIsSpinning(false), ScreenSpaceEventType.WHEEL);
    return () => handler.destroy();
  }, [viewer]);

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

  const outlineKey = outline && `${outline.box.join(",")}|${outline.label}|${outline.processing}`;
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
  const drapeKey = scene.drape && `${scene.drape.url}|${scene.drape.bounds.join(",")}`;
  const alphaRef = useRef(scene.drapeAlpha);
  alphaRef.current = scene.drapeAlpha;
  useEffect(() => {
    if (viewer === undefined || scene.drape === undefined) return;
    const layer = addDrapeLayer(viewer, scene.drape, alphaRef.current);
    layerRef.current = layer;
    return () => {
      layerRef.current = undefined;
      removeLayer(viewer, layer);
    };
    // drapeKey stands in for the drape object, which is rebuilt on every render.
    // oxlint-disable-next-line react/exhaustive-deps
  }, [viewer, drapeKey]);

  // The slider only changes alpha: re-adding the layer would flash the base map.
  useEffect(() => {
    if (layerRef.current !== undefined) layerRef.current.alpha = scene.drapeAlpha;
  }, [scene.drapeAlpha]);

  const { target } = scene;
  const targetKey = target && `${target.key}|${view}`;
  useEffect(() => {
    if (viewer === undefined) return;
    const duration = reduceMotion ? 0 : FLY_SECONDS;
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
      destination: Rectangle.fromDegrees(...box),
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
    <div className="x-globe" data-testid="globe" onMouseLeave={() => setHover(undefined)}>
      <div ref={containerRef} className="x-globe" />
      {hover !== undefined && <GlobeTooltip content={hover.content} x={hover.x} y={hover.y} />}
    </div>
  );
};
