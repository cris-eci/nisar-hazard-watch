import { useEffect } from "react";

import type { HazardDefinition } from "@/features/analysis/hazards";
import type { GlobeOverlay } from "@/features/analysis/overlay.types";
import type { FeaturedEvent } from "@/features/events/events";
import { AnalysisCard } from "@/features/frame-panel/AnalysisCard";
import { PassList } from "@/features/frame-panel/PassList";
import type { Frame } from "@/features/frames/frame.types";
import { PASS_LABEL } from "@/features/frames/passLabel";
import { fetchAcquisitions } from "@/features/frames/observationPlanApi";
import { useAsync } from "@/lib/useAsync";

type FramePanelProps = {
  hazard: HazardDefinition;
  frame: Frame;
  event: FeaturedEvent | undefined;
  today: string;
  onClose: () => void;
  onOverlayChange: (overlay: GlobeOverlay | undefined) => void;
};

// "Wildfire (demo site)" reads as "Wildfire, Colombian Andes": the summary says it is a demo site.
const eventTitle = ({ title, place }: FeaturedEvent): string =>
  `${title.replace(" (demo site)", "")}, ${place}`;

export const FramePanel = ({
  hazard,
  frame,
  event,
  today,
  onClose,
  onOverlayChange,
}: FramePanelProps) => {
  const { state, retry } = useAsync(
    (signal) => fetchAcquisitions(frame.track, frame.frame, signal),
    frame.id,
  );

  useEffect(() => {
    const closeOnEscape = (keyEvent: KeyboardEvent) => {
      if (keyEvent.key === "Escape") onClose();
    };
    window.addEventListener("keydown", closeOnEscape);
    return () => window.removeEventListener("keydown", closeOnEscape);
  }, [onClose]);

  const polarization = frame.hasCrossPol ? "HH+HV" : "HH only";

  return (
    <aside
      data-testid="frame-panel"
      aria-labelledby="frame-panel-title"
      className="x-panel x-glass"
    >
      <div className="x-panel__scroll">
        <div className="x-panel__head">
          <p data-testid="frame-panel-meta" className="x-mono x-panel__meta">
            {event === undefined ? (
              `${PASS_LABEL[frame.pass]} pass · ${polarization}`
            ) : (
              <>
                Track {frame.track} {frame.pass} · Frame {frame.frame} · {polarization}
                <br />
                {event.date}
              </>
            )}
          </p>
          <button
            type="button"
            data-testid="frame-panel-close"
            aria-label="Close frame details"
            onClick={onClose}
            className="x-panel__close"
          >
            ✕
          </button>
        </div>
        <h2 id="frame-panel-title" data-testid="frame-panel-title" className="x-panel__title">
          {event === undefined ? `Track ${frame.track} · Frame ${frame.frame}` : eventTitle(event)}
        </h2>
        {event !== undefined && (
          <p data-testid="event-banner" className="x-panel__summary">
            {event.summary}
          </p>
        )}

        <section data-testid="analysis-card" className="x-panel__section">
          {state?.status === "loading" && (
            <p className="x-panel__note" role="status">
              Loading the observation plan…
            </p>
          )}
          {state?.status === "error" && (
            <div role="alert" className="x-panel__error">
              <p>Could not load the observation plan for this frame.</p>
              <p className="x-panel__error-detail">{state.error.message}</p>
              <button type="button" onClick={retry} className="x-panel__retry">
                Try again
              </button>
            </div>
          )}
          {state?.status === "success" && (
            <AnalysisCard
              hazard={hazard}
              event={event}
              frame={frame}
              acquisitions={state.data}
              today={today}
              onOverlayChange={onOverlayChange}
            />
          )}
        </section>

        {state?.status === "success" && <PassList acquisitions={state.data} today={today} />}
      </div>
    </aside>
  );
};
