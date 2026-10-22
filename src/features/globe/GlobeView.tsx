import {
  Cartesian3,
  ScreenSpaceEventHandler,
  ScreenSpaceEventType,
  type Cartesian2,
  type Viewer,
} from "cesium";
import { useEffect, useRef, useState, type ReactNode } from "react";

import type { Frame, PassDirection } from "@/features/frames/frame.types";
import { findFrameAt } from "@/features/frames/frames";
import { createViewer, pickLonLat, zoomByStep } from "@/features/globe/cesium";
import {
  addFrameEntities,
  HOVER_COLOR,
  paddedRectangle,
  removeEntities,
  SELECTED_COLOR,
} from "@/features/globe/frameEntities";
import { FrameTooltip } from "@/features/globe/FrameTooltip";

const START_POSITION = Cartesian3.fromDegrees(-74, 4, 20_000_000); // over Colombia
const SPIN_RADIANS_PER_TICK = -0.0008;
const FLY_SECONDS = 1.6;

type Hover = { frame: Frame; x: number; y: number };

type GlobeViewProps = {
  frames: Frame[];
  pass: PassDirection;
  selectedFrame: Frame | undefined;
  onSelect: (frame: Frame) => void;
  onShowWholeGlobe: () => void;
};

const prefersReducedMotion = (): boolean =>
  window.matchMedia("(prefers-reduced-motion: reduce)").matches;

const flyDuration = (): number => (prefersReducedMotion() ? 0 : FLY_SECONDS);

const flyHome = (viewer: Viewer): void =>
  viewer.camera.flyTo({ destination: START_POSITION, duration: flyDuration() });

export const GlobeView = ({
  frames,
  pass,
  selectedFrame,
  onSelect,
  onShowWholeGlobe,
}: GlobeViewProps) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [viewer, setViewer] = useState<Viewer>();
  const [hover, setHover] = useState<Hover>();
  const [isSpinning, setIsSpinning] = useState(() => !prefersReducedMotion());
  const isZoomedOnFrame = useRef(false);

  // Cesium handlers are registered once, so they read the latest props through a ref.
  const latest = useRef({ frames, pass, onSelect });
  useEffect(() => {
    latest.current = { frames, pass, onSelect };
  });

  useEffect(() => {
    if (containerRef.current === null) return;
    const instance = createViewer(containerRef.current);
    instance.camera.setView({ destination: START_POSITION });
    setViewer(instance);
    return () => instance.destroy();
  }, []);

  useEffect(() => {
    if (viewer === undefined) return;
    const frameAt = (position: Cartesian2): Frame | undefined => {
      const point = pickLonLat(viewer, position);
      return point && findFrameAt(latest.current.frames, point, latest.current.pass);
    };

    const handler = new ScreenSpaceEventHandler(viewer.scene.canvas);
    handler.setInputAction(({ endPosition }: ScreenSpaceEventHandler.MotionEvent) => {
      const frame = frameAt(endPosition);
      setHover(frame && { frame, x: endPosition.x, y: endPosition.y });
    }, ScreenSpaceEventType.MOUSE_MOVE);
    handler.setInputAction(({ position }: ScreenSpaceEventHandler.PositionedEvent) => {
      const frame = frameAt(position);
      if (frame !== undefined) latest.current.onSelect(frame);
    }, ScreenSpaceEventType.LEFT_CLICK);
    // Any manual navigation stops the idle spin for good.
    handler.setInputAction(() => setIsSpinning(false), ScreenSpaceEventType.LEFT_DOWN);
    handler.setInputAction(() => setIsSpinning(false), ScreenSpaceEventType.WHEEL);
    return () => handler.destroy();
  }, [viewer]);

  useEffect(() => {
    if (viewer === undefined || !isSpinning || selectedFrame !== undefined) return;
    return viewer.clock.onTick.addEventListener(() =>
      viewer.camera.rotate(Cartesian3.UNIT_Z, SPIN_RADIANS_PER_TICK),
    );
  }, [viewer, isSpinning, selectedFrame]);

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
      destination: paddedRectangle(selectedFrame.bbox),
      duration: flyDuration(),
    });
    return () => removeEntities(viewer, entities);
  }, [viewer, selectedFrame]);

  const showWholeGlobe = (): void => {
    if (viewer !== undefined) flyHome(viewer);
    onShowWholeGlobe();
  };

  return (
    <div className="absolute inset-0" data-testid="globe">
      <div ref={containerRef} className="h-full w-full" />
      {hover !== undefined && <FrameTooltip frame={hover.frame} x={hover.x} y={hover.y} />}
      <div className="absolute bottom-8 left-4 flex gap-2">
        <MapButton
          testId="zoom-in"
          label="Zoom in"
          onClick={() => viewer && zoomByStep(viewer, "in")}
        >
          +
        </MapButton>
        <MapButton
          testId="zoom-out"
          label="Zoom out"
          onClick={() => viewer && zoomByStep(viewer, "out")}
        >
          −
        </MapButton>
        <MapButton testId="whole-globe" onClick={showWholeGlobe}>
          ⤢ Whole globe
        </MapButton>
      </div>
    </div>
  );
};

type MapButtonProps = {
  testId: string;
  label?: string;
  onClick: () => void;
  children: ReactNode;
};

const MapButton = ({ testId, label, onClick, children }: MapButtonProps) => (
  <button
    type="button"
    data-testid={testId}
    aria-label={label}
    title={label}
    onClick={onClick}
    className="min-w-10 rounded-lg border border-white/10 bg-slate-950/85 px-3 py-2 text-sm text-slate-100 shadow-lg backdrop-blur hover:border-white/30 focus-visible:outline-2 focus-visible:outline-sky-400"
  >
    {children}
  </button>
);
