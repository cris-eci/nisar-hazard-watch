import { useCallback, useMemo, useState } from "react";

import type { HazardId } from "@/features/analysis/analysis.types";
import { ENABLED_HAZARDS, HAZARDS } from "@/features/analysis/hazards";
import type { GlobeOverlay } from "@/features/analysis/overlay.types";
import { HazardPicker } from "@/features/controls/HazardPicker";
import { PassToggle } from "@/features/controls/PassToggle";
import { EventsList } from "@/features/events/EventsList";
import { FEATURED_EVENTS, findEvent, type FeaturedEvent } from "@/features/events/events";
import { FramePanel } from "@/features/frame-panel/FramePanel";
import type { Frame, PassDirection } from "@/features/frames/frame.types";
import { loadFrames } from "@/features/frames/frames";
import { GlobeView } from "@/features/globe/GlobeView";
import { DidYouKnow } from "@/features/onboarding/DidYouKnow";
import { WelcomeDialog } from "@/features/onboarding/WelcomeDialog";
import { APP_NAME } from "@/lib/appName";
import { Link } from "@/lib/Link";
import { useAsync, type AsyncState } from "@/lib/useAsync";

const NO_FRAMES: Frame[] = [];
const today = new Date().toISOString().slice(0, 10);

const enabledIds = new Set<HazardId>(ENABLED_HAZARDS.map(({ id }) => id));
const VISIBLE_EVENTS = FEATURED_EVENTS.filter(({ hazard }) => enabledIds.has(hazard));

// The view lives in the URL (?event=id or ?frame=track-frame) so it can be shared.
const readParams = () => {
  const params = new URLSearchParams(window.location.search);
  const event = findEvent(params.get("event"));
  return event !== undefined && enabledIds.has(event.hazard)
    ? { event, frameId: event.frameId }
    : { event: undefined, frameId: params.get("frame") };
};

const writeParams = (params: { event?: string; frame?: string }): void => {
  const url = new URL(window.location.href);
  url.search = new URLSearchParams(params).toString();
  window.history.replaceState(null, "", url);
};

export const ExplorerPage = () => {
  const [initial] = useState(readParams);
  const { state: framesState, retry } = useAsync(loadFrames, "frames");
  // Undefined until the user picks one, so a shared link opens on the linked frame's pass.
  const [chosenPass, setChosenPass] = useState<PassDirection>();
  const [selectedId, setSelectedId] = useState(initial.frameId);
  const [event, setEvent] = useState<FeaturedEvent | undefined>(initial.event);
  const [overlay, setOverlay] = useState<GlobeOverlay>();
  const [hazardId, setHazardId] = useState<HazardId>(
    initial.event?.hazard ?? ENABLED_HAZARDS[0].id,
  );

  const frames = framesState?.status === "success" ? framesState.data : NO_FRAMES;
  const selectedFrame = useMemo(
    () => frames.find((frame) => frame.id === selectedId),
    [frames, selectedId],
  );
  const pass = chosenPass ?? selectedFrame?.pass ?? "A";

  const select = useCallback((frame: Frame | undefined) => {
    setSelectedId(frame?.id ?? null);
    setEvent(undefined);
    writeParams(frame === undefined ? {} : { frame: frame.id });
  }, []);
  const closePanel = useCallback(() => select(undefined), [select]);

  const openEvent = useCallback((next: FeaturedEvent) => {
    setEvent(next);
    setHazardId(next.hazard);
    setChosenPass(undefined);
    setSelectedId(next.frameId);
    writeParams({ event: next.id });
  }, []);

  const changeHazard = (next: HazardId) => {
    setHazardId(next);
    // An event belongs to one hazard; keep the frame but drop the event context.
    if (event !== undefined && event.hazard !== next) {
      setEvent(undefined);
      if (selectedId !== null) writeParams({ frame: selectedId });
    }
  };

  const startTour = () => {
    const [first] = VISIBLE_EVENTS;
    if (first !== undefined) openEvent(first);
  };

  return (
    <main className="relative h-dvh w-screen overflow-hidden bg-slate-950">
      <GlobeView
        frames={frames}
        pass={pass}
        selectedFrame={selectedFrame}
        overlay={overlay}
        onSelect={select}
        onShowWholeGlobe={closePanel}
      />

      <div className="absolute top-4 bottom-24 left-4 w-80 [scrollbar-width:thin] overflow-y-auto rounded-xl border border-white/10 bg-slate-950/85 p-4 text-slate-100 shadow-2xl backdrop-blur">
        <div className="flex items-baseline justify-between">
          <h1 className="text-lg">
            <Link to="/" className="hover:text-sky-300">
              {APP_NAME}
            </Link>
          </h1>
          <Link to="/method" className="text-xs text-sky-300 hover:underline">
            Method
          </Link>
        </div>
        <p className="mt-1 text-sm text-slate-400">
          Hover the globe to find a NISAR radar frame. Click one to see its passes and{" "}
          {HAZARDS[hazardId].analysisTitle.toLowerCase()}.
        </p>
        <p className="mt-2 text-xs text-slate-500">
          Scroll or pinch to zoom · drag to rotate · Esc closes the panel and zooms out
        </p>
        <div className="mt-3 space-y-2">
          <HazardPicker hazards={ENABLED_HAZARDS} value={hazardId} onChange={changeHazard} />
          <PassToggle value={pass} onChange={setChosenPass} />
        </div>
        <FramesStatus state={framesState} count={frames.length} onRetry={retry} />
        <EventsList events={VISIBLE_EVENTS} activeId={event?.id} onOpen={openEvent} />
      </div>

      {selectedFrame !== undefined ? (
        <FramePanel
          key={`${selectedFrame.id}:${event?.id ?? ""}:${hazardId}`}
          hazard={HAZARDS[hazardId]}
          frame={selectedFrame}
          event={event}
          today={today}
          onClose={closePanel}
          onOverlayChange={setOverlay}
        />
      ) : (
        <DidYouKnow />
      )}

      <WelcomeDialog appName={APP_NAME} onStartTour={startTour} />
    </main>
  );
};

type FramesStatusProps = {
  state: AsyncState<Frame[]> | undefined;
  count: number;
  onRetry: () => void;
};

const FramesStatus = ({ state, count, onRetry }: FramesStatusProps) => {
  if (state?.status === "error") {
    return (
      <div role="alert" data-testid="frames-status" className="mt-3 text-sm text-red-300">
        Could not load NISAR frames.{" "}
        <button type="button" onClick={onRetry} className="underline">
          Try again
        </button>
      </div>
    );
  }
  return (
    <p role="status" data-testid="frames-status" className="mt-3 text-xs text-slate-500">
      {state?.status === "success"
        ? `${count.toLocaleString("en-US")} frames from the NISAR Observation Plan`
        : "Loading NISAR frames…"}
    </p>
  );
};
