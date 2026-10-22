import "@/pages/site/site.css";
import "@/pages/explorer/explorer.css";

import { useCallback, useEffect, useMemo, useState } from "react";

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
import { IntroCard } from "@/features/onboarding/IntroCard";
import { rememberIntroSeen, wasIntroSeen } from "@/features/onboarding/introSeen";
import { TourCard } from "@/features/onboarding/TourCard";
import { APP_NAME } from "@/lib/appName";
import { Link } from "@/lib/Link";
import { SegmentedControl } from "@/lib/SegmentedControl";
import { useAsync, type AsyncState } from "@/lib/useAsync";

const NO_FRAMES: Frame[] = [];
const today = new Date().toISOString().slice(0, 10);

const enabledIds = new Set<HazardId>(ENABLED_HAZARDS.map(({ id }) => id));
const VISIBLE_EVENTS = FEATURED_EVENTS.filter(({ hazard }) => enabledIds.has(hazard));

const DEFAULT_HAZARD = ENABLED_HAZARDS[0].id;
const isEnabledHazard = (id: string | null): id is HazardId =>
  id !== null && enabledIds.has(id as HazardId);

// Intro on a first visit; a guided tour of the featured events; or free exploration.
type Mode = "intro" | "tour" | "explore";

const MODE_OPTIONS: Array<{ value: Exclude<Mode, "intro">; label: string }> = [
  { value: "tour", label: "Guided tour" },
  { value: "explore", label: "Explore" },
];

// The view lives in the URL (?event=id, or ?frame=track-frame&hazard=id) so it can be shared.
// A shared link skips the intro and opens straight on what it points at.
const readParams = () => {
  const params = new URLSearchParams(window.location.search);
  const event = findEvent(params.get("event"));
  if (event !== undefined && enabledIds.has(event.hazard)) {
    return { event, frameId: event.frameId, hazard: event.hazard, mode: "explore" as Mode };
  }
  const hazard = params.get("hazard");
  const frameId = params.get("frame");
  return {
    event: undefined,
    frameId,
    hazard: isEnabledHazard(hazard) ? hazard : DEFAULT_HAZARD,
    mode: (frameId !== null || wasIntroSeen() ? "explore" : "intro") as Mode,
  };
};

// An event implies its frame and hazard; the default hazard is left out to keep links short.
const viewParams = (
  event: FeaturedEvent | undefined,
  frameId: string | null,
  hazard: HazardId,
): Record<string, string> => {
  if (event !== undefined) return { event: event.id };
  return {
    ...(frameId !== null && { frame: frameId }),
    ...(hazard !== DEFAULT_HAZARD && { hazard }),
  };
};

export const ExplorerPage = () => {
  const [initial] = useState(readParams);
  const { state: framesState, retry } = useAsync(loadFrames, "frames");
  // Undefined until the user picks one, so a shared link opens on the linked frame's pass.
  const [chosenPass, setChosenPass] = useState<PassDirection>();
  const [selectedId, setSelectedId] = useState(initial.frameId);
  const [event, setEvent] = useState<FeaturedEvent | undefined>(initial.event);
  const [overlay, setOverlay] = useState<GlobeOverlay>();
  const [hazardId, setHazardId] = useState<HazardId>(initial.hazard);
  const [mode, setMode] = useState<Mode>(initial.mode);
  const [tourIndex, setTourIndex] = useState(0);
  const [homeRequest, setHomeRequest] = useState(0);

  useEffect(() => {
    const url = new URL(window.location.href);
    url.search = new URLSearchParams(viewParams(event, selectedId, hazardId)).toString();
    window.history.replaceState(null, "", url);
  }, [event, selectedId, hazardId]);

  const frames = framesState?.status === "success" ? framesState.data : NO_FRAMES;
  const selectedFrame = useMemo(
    () => frames.find((frame) => frame.id === selectedId),
    [frames, selectedId],
  );
  const pass = chosenPass ?? selectedFrame?.pass ?? "A";

  const select = useCallback((frame: Frame | undefined) => {
    setSelectedId(frame?.id ?? null);
    setEvent(undefined);
  }, []);
  const closePanel = useCallback(() => select(undefined), [select]);

  const openEvent = useCallback((next: FeaturedEvent) => {
    setEvent(next);
    setHazardId(next.hazard);
    setChosenPass(undefined);
    setSelectedId(next.frameId);
  }, []);

  const changeHazard = (next: HazardId) => {
    setHazardId(next);
    // An event belongs to one hazard; keep the frame but drop the event context.
    if (event !== undefined && event.hazard !== next) setEvent(undefined);
  };

  const explore = useCallback(() => {
    rememberIntroSeen();
    setMode("explore");
  }, []);

  // Past the last event the tour hands over to free exploration, on that event.
  const goTour = useCallback(
    (index: number) => {
      const next = VISIBLE_EVENTS[index];
      if (next === undefined) {
        explore();
        return;
      }
      rememberIntroSeen();
      setMode("tour");
      setTourIndex(index);
      openEvent(next);
    },
    [explore, openEvent],
  );

  const showWholeGlobe = () => {
    closePanel();
    setHomeRequest((n) => n + 1);
  };

  return (
    <main className="site explorer">
      <GlobeView
        frames={frames}
        pass={pass}
        selectedFrame={selectedFrame}
        overlay={overlay}
        interactive={mode === "explore"}
        events={VISIBLE_EVENTS}
        homeRequest={homeRequest}
        onSelect={select}
        onOpenEvent={openEvent}
      />

      <header className="x-top">
        <Link to="/" className="x-pill x-pill--mark">
          {APP_NAME}
        </Link>
        {mode !== "intro" && (
          <SegmentedControl
            label="Mode"
            options={MODE_OPTIONS}
            value={mode}
            onChange={(next) => (next === "tour" ? goTour(0) : explore())}
            testIdPrefix="mode"
            variant="bar"
          />
        )}
        <nav className="x-top__actions" aria-label="Main">
          <button
            type="button"
            data-testid="whole-globe"
            onClick={showWholeGlobe}
            className="x-pill"
          >
            Whole globe
          </button>
          <Link to="/method" className="x-pill">
            Method
          </Link>
        </nav>
      </header>

      {mode === "intro" && (
        <IntroCard
          frameCount={framesState?.status === "success" ? frames.length : undefined}
          eventCount={VISIBLE_EVENTS.length}
          onStartTour={() => goTour(0)}
          onExplore={explore}
        />
      )}

      {mode === "tour" && (
        <TourCard events={VISIBLE_EVENTS} index={tourIndex} onGo={goTour} onExit={explore} />
      )}

      {mode === "explore" && (
        <section aria-label="Explore" className="x-dock x-explore x-glass">
          <h1 className="x-explore__help">
            Point at any land to see a NISAR frame. Click it to compare its latest two passes.
          </h1>
          <HazardPicker hazards={ENABLED_HAZARDS} value={hazardId} onChange={changeHazard} />
          <div className="x-explore__row">
            <PassToggle value={pass} onChange={setChosenPass} />
            {VISIBLE_EVENTS.length > 0 && (
              <button
                type="button"
                onClick={() => goTour(0)}
                className="x-text-button x-text-button--gold"
              >
                Back to tour
              </button>
            )}
          </div>
          <FramesStatus state={framesState} count={frames.length} onRetry={retry} />
          <EventsList events={VISIBLE_EVENTS} activeId={event?.id} onOpen={openEvent} />
        </section>
      )}

      {selectedFrame !== undefined && (
        <FramePanel
          key={`${selectedFrame.id}:${event?.id ?? ""}:${hazardId}`}
          hazard={HAZARDS[hazardId]}
          frame={selectedFrame}
          event={event}
          today={today}
          onClose={closePanel}
          onOverlayChange={setOverlay}
        />
      )}
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
      <div role="alert" data-testid="frames-status" className="x-mono x-explore__status">
        Could not load NISAR frames.{" "}
        <button type="button" onClick={onRetry} className="x-text-button x-text-button--gold">
          Try again
        </button>
      </div>
    );
  }
  return (
    <p role="status" data-testid="frames-status" className="x-mono x-explore__status">
      {state?.status === "success"
        ? `${count.toLocaleString("en-US")} frames from the NISAR Observation Plan`
        : "Loading NISAR frames…"}
    </p>
  );
};
