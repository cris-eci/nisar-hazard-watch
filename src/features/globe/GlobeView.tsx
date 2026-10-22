import {
  Cartesian2,
  Cartesian3,
  Color,
  EasingFunction,
  HorizontalOrigin,
  LabelStyle,
  ScreenSpaceEventHandler,
  ScreenSpaceEventType,
  type Entity,
  type Viewer,
} from "cesium";
import { useEffect, useRef, useState } from "react";

import type { GlobeOverlay } from "@/features/analysis/overlay.types";
import type { FeaturedEvent } from "@/features/events/events";
import type { Frame, PassDirection } from "@/features/frames/frame.types";
import { findFrameAt } from "@/features/frames/frames";
import { createViewer, pickLonLat } from "@/features/globe/cesium";
import {
  addFrameEntities,
  addOverlayLayer,
  framedRectangle,
  HOVER_COLOR,
  removeEntities,
  removeLayer,
  SELECTED_COLOR,
} from "@/features/globe/frameEntities";
import { FrameTooltip } from "@/features/globe/FrameTooltip";

const START_POSITION = Cartesian3.fromDegrees(-74, 4, 20_000_000); // over Colombia
const ARRIVAL_POSITION = Cartesian3.fromDegrees(-74, 4, 32_000_000);
const ARRIVAL_SECONDS = 2.4;
const SPIN_RADIANS_PER_TICK = -0.0006;
const FLY_SECONDS = 1.8;
const INK = Color.fromCssColorString("#ebe9e4");
const SPACE = Color.fromCssColorString("#04070e");

type Hover = { frame: Frame; x: number; y: number };

type GlobeViewProps = {
  frames: Frame[];
  pass: PassDirection;
  selectedFrame: Frame | undefined;
  overlay: GlobeOverlay | undefined;
  // Frames answer the pointer and event markers show only while exploring freely.
  interactive: boolean;
  events: FeaturedEvent[];
  // Bumped by the "Whole globe" button: fly home even when no frame is open.
  homeRequest: number;
  onSelect: (frame: Frame) => void;
  onOpenEvent: (event: FeaturedEvent) => void;
};

const prefersReducedMotion = (): boolean =>
  window.matchMedia("(prefers-reduced-motion: reduce)").matches;

const flyDuration = (): number => (prefersReducedMotion() ? 0 : FLY_SECONDS);

const flyHome = (viewer: Viewer): void =>
  viewer.camera.flyTo({ destination: START_POSITION, duration: flyDuration() });

// "Catia La Mar, Venezuela" is labelled "Venezuela": the country reads at globe scale.
const markerLabel = (event: FeaturedEvent): string => event.place.split(",").at(-1)?.trim() ?? "";

export const GlobeView = ({
  frames,
  pass,
  selectedFrame,
  overlay,
  interactive,
  events,
  homeRequest,
  onSelect,
  onOpenEvent,
}: GlobeViewProps) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [viewer, setViewer] = useState<Viewer>();
  const [hover, setHover] = useState<Hover>();
  const [isSpinning, setIsSpinning] = useState(() => !prefersReducedMotion());
  const isZoomedOnFrame = useRef(false);

  // Cesium handlers are registered once, so they read the latest props through a ref.
  const latest = useRef({ frames, pass, interactive, events, onSelect, onOpenEvent });
  useEffect(() => {
    latest.current = { frames, pass, interactive, events, onSelect, onOpenEvent };
  });

  useEffect(() => {
    if (containerRef.current === null) return;
    const instance = createViewer(containerRef.current);
    // The planet arrives from deep space, unless motion is reduced.
    if (prefersReducedMotion()) instance.camera.setView({ destination: START_POSITION });
    else {
      instance.camera.setView({ destination: ARRIVAL_POSITION });
      instance.camera.flyTo({
        destination: START_POSITION,
        duration: ARRIVAL_SECONDS,
        easingFunction: EasingFunction.QUARTIC_OUT,
      });
    }
    setViewer(instance);
    return () => instance.destroy();
  }, []);

  useEffect(() => {
    if (viewer === undefined) return;
    const frameAt = (position: Cartesian2): Frame | undefined => {
      const point = pickLonLat(viewer, position);
      return point && findFrameAt(latest.current.frames, point, latest.current.pass);
    };
    const eventAt = (position: Cartesian2): FeaturedEvent | undefined => {
      const picked: unknown = viewer.scene.pick(position);
      const id = (picked as { id?: Entity } | undefined)?.id?.id;
      return latest.current.events.find((event) => `event:${event.id}` === id);
    };

    const handler = new ScreenSpaceEventHandler(viewer.scene.canvas);
    handler.setInputAction(({ endPosition }: ScreenSpaceEventHandler.MotionEvent) => {
      const frame = latest.current.interactive ? frameAt(endPosition) : undefined;
      setHover(frame && { frame, x: endPosition.x, y: endPosition.y });
    }, ScreenSpaceEventType.MOUSE_MOVE);
    handler.setInputAction(({ position }: ScreenSpaceEventHandler.PositionedEvent) => {
      if (!latest.current.interactive) return;
      const event = eventAt(position);
      if (event !== undefined) {
        latest.current.onOpenEvent(event);
        return;
      }
      const frame = frameAt(position);
      if (frame !== undefined) latest.current.onSelect(frame);
    }, ScreenSpaceEventType.LEFT_CLICK);
    // Any manual navigation stops the idle spin for good.
    handler.setInputAction(() => setIsSpinning(false), ScreenSpaceEventType.LEFT_DOWN);
    handler.setInputAction(() => setIsSpinning(false), ScreenSpaceEventType.WHEEL);
    return () => handler.destroy();
  }, [viewer]);

  useEffect(() => {
    if (!interactive) setHover(undefined);
  }, [interactive]);

  useEffect(() => {
    if (viewer === undefined || !isSpinning || selectedFrame !== undefined) return;
    return viewer.clock.onTick.addEventListener(() =>
      viewer.camera.rotate(Cartesian3.UNIT_Z, SPIN_RADIANS_PER_TICK),
    );
  }, [viewer, isSpinning, selectedFrame]);

  useEffect(() => {
    if (viewer === undefined || !interactive) return;
    const markers = events.map((event) =>
      viewer.entities.add({
        id: `event:${event.id}`,
        position: Cartesian3.fromDegrees(...event.focus),
        point: { pixelSize: 10, color: SELECTED_COLOR, outlineColor: SPACE, outlineWidth: 2 },
        label: {
          text: markerLabel(event),
          font: "500 13px Albert Sans, system-ui, sans-serif",
          fillColor: INK,
          outlineColor: SPACE,
          outlineWidth: 3,
          style: LabelStyle.FILL_AND_OUTLINE,
          pixelOffset: new Cartesian2(12, 0),
          horizontalOrigin: HorizontalOrigin.LEFT,
        },
      }),
    );
    return () => removeEntities(viewer, markers);
  }, [viewer, interactive, events]);

  useEffect(() => {
    if (viewer !== undefined && homeRequest > 0) flyHome(viewer);
  }, [viewer, homeRequest]);

  const hoveredFrame = hover?.frame;
  useEffect(() => {
    if (viewer === undefined || hoveredFrame === undefined || hoveredFrame === selectedFrame)
      return;
    const entities = addFrameEntities(viewer, hoveredFrame, HOVER_COLOR);
    return () => removeEntities(viewer, entities);
  }, [viewer, hoveredFrame, selectedFrame]);

  useEffect(() => {
    if (viewer === undefined) return;
    // Closing the panel zooms back out, so the user is never stranded close to the ground.
    if (selectedFrame === undefined) {
      if (isZoomedOnFrame.current) flyHome(viewer);
      isZoomedOnFrame.current = false;
      return;
    }
    isZoomedOnFrame.current = true;
    const entities = addFrameEntities(viewer, selectedFrame, SELECTED_COLOR);
    viewer.camera.flyTo({
      destination: framedRectangle(selectedFrame.bbox, 0.35, viewer.canvas.clientWidth),
      duration: flyDuration(),
      easingFunction: EasingFunction.QUADRATIC_IN_OUT,
    });
    return () => removeEntities(viewer, entities);
  }, [viewer, selectedFrame]);

  useEffect(() => {
    if (viewer === undefined || overlay === undefined) return;
    const layer = addOverlayLayer(viewer, overlay);
    return () => removeLayer(viewer, layer);
  }, [viewer, overlay]);

  // A new analysis area pulls the camera closer, so the burn scar fills the view.
  // Switching layers keeps the same bounds and does not move the camera.
  const overlayBounds = overlay?.bounds;
  const overlayKey = overlayBounds?.join(",");
  useEffect(() => {
    if (viewer === undefined || overlayBounds === undefined) return;
    viewer.camera.flyTo({
      destination: framedRectangle(overlayBounds, 0.15, viewer.canvas.clientWidth),
      duration: flyDuration(),
      easingFunction: EasingFunction.QUADRATIC_IN_OUT,
    });
    // overlayKey stands in for the bounds array, which is a new object on every layer switch.
    // oxlint-disable-next-line react/exhaustive-deps
  }, [viewer, overlayKey]);

  return (
    <div className="x-globe" data-testid="globe">
      <div ref={containerRef} className="x-globe" />
      {hover !== undefined && <FrameTooltip frame={hover.frame} x={hover.x} y={hover.y} />}
    </div>
  );
};
