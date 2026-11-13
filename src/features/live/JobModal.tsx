import { useEffect, useId, useRef } from "react";

import { FactsCarousel } from "@/features/facts/FactsCarousel";
import { Icon } from "@/features/case-panel/icons";
import { countdown, formatSeconds } from "@/features/explore/exploreTiming";
import type { ExplorationStage, ExplorationView } from "@/features/explore/exploreSchemas";
import { useNow } from "@/lib/useNow";

const PERCENT = 100;

const STAGE_COPY: Record<ExplorationStage["name"], string> = {
  planning: "Choosing the passes",
  processing: "Reading the passes and measuring",
  reading: "Reading the passes",
  analysing: "Measuring against the normal range",
  rendering: "Drawing the layers",
};

// Before the first answer only the planning is under way.
const STARTING: ExplorationStage[] = [
  { name: "planning", state: "running", seconds: null, budgetSeconds: null },
];

type JobModalProps = {
  lensChip: string;
  placeName: string;
  // Undefined until the backend has answered the first request.
  view: ExplorationView | undefined;
  receivedAt: number;
  reduceMotion: boolean;
  onKeepExploring: () => void;
  onCancel: () => void;
};

// The wait, made honest: the backend's estimate and stages, a bar that never claims to be done,
// and a sourced fact. It doesn't block the globe; closing it leaves the job running in the panel.
export const JobModal = ({
  lensChip,
  placeName,
  view,
  receivedAt,
  reduceMotion,
  onKeepExploring,
  onCancel,
}: JobModalProps) => {
  const titleId = useId();
  const keepRef = useRef<HTMLButtonElement>(null);
  const now = useNow(true);

  useEffect(() => {
    const previous = document.activeElement;
    keepRef.current?.focus();
    return () => {
      if (previous instanceof HTMLElement) previous.focus();
    };
  }, []);

  const timer = view === undefined ? undefined : countdown(view, receivedAt, now);
  const stages = view === undefined || view.stages.length === 0 ? STARTING : view.stages;
  const overdue = timer?.overdue === true;
  return (
    <section
      className="x-jobmodal x-glass"
      role="dialog"
      aria-labelledby={titleId}
      data-testid="job-modal"
    >
      <p className="x-kicker">Asking the radar · {lensChip}</p>
      <h2 id={titleId} className="x-jobmodal__title">
        Reading the passes over {placeName}
      </h2>

      <div className="x-jobmodal__timer" role="status" data-testid="job-timer">
        <span className="x-jobmodal__left" data-testid="job-remaining">
          {overdue
            ? "Taking longer than expected"
            : timer?.remainingSeconds != null
              ? `About ${formatSeconds(timer.remainingSeconds)} left`
              : "Starting…"}
        </span>
        {timer?.etaSeconds != null && (
          <span className="x-jobmodal__meta">
            Estimated {formatSeconds(timer.etaSeconds)} · elapsed{" "}
            {formatSeconds(timer.elapsedSeconds)}
          </span>
        )}
      </div>
      <div
        className="x-jobmodal__bar"
        role="progressbar"
        aria-label="Estimated progress"
        aria-valuemin={0}
        aria-valuemax={PERCENT}
        aria-valuenow={Math.round((timer?.fraction ?? 0) * PERCENT)}
        data-overdue={overdue}
        data-reduce={reduceMotion}
      >
        <span style={{ width: `${(timer?.fraction ?? 0) * PERCENT}%` }} />
      </div>
      {overdue && (
        <p className="x-jobmodal__late" data-testid="job-late">
          The radar archive can be slow. Your answer will appear here as soon as it is ready.
        </p>
      )}

      <ol className="x-steps" data-testid="job-stages">
        {stages.map((stage) => (
          <li
            key={stage.name}
            className="x-step"
            data-state={stage.state === "pending" ? "waiting" : stage.state}
          >
            <span className="x-step__dot">
              <Icon name="tick" size={10} />
            </span>
            <span className="x-step__text">
              {STAGE_COPY[stage.name]}
              {stage.seconds !== null && (
                <span className="x-step__sub">{stage.seconds.toFixed(1)} s</span>
              )}
            </span>
          </li>
        ))}
      </ol>

      <FactsCarousel reduceMotion={reduceMotion} />

      <div className="x-jobmodal__actions">
        <button
          ref={keepRef}
          type="button"
          className="x-primary x-primary--small"
          onClick={onKeepExploring}
          data-testid="job-keep"
        >
          Keep exploring
        </button>
        <button type="button" className="x-ghost" onClick={onCancel} data-testid="job-cancel">
          Cancel request
        </button>
      </div>
    </section>
  );
};
