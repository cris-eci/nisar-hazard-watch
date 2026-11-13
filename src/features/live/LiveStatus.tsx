import { explorationProblem, type ExplorationProblem } from "@/features/explore/exploreProblems";
import type { ExplorationView } from "@/features/explore/exploreSchemas";
import { countdown, formatSeconds } from "@/features/explore/exploreTiming";
import { useNow } from "@/lib/useNow";

type ProgressProps = {
  view: ExplorationView | undefined;
  receivedAt: number;
  onDetails: () => void;
  onCancel: () => void;
};

// In the panel while the modal is closed: where the job is, and the way back to the details.
export const LiveProgress = ({ view, receivedAt, onDetails, onCancel }: ProgressProps) => {
  const now = useNow(true);
  const timer = view === undefined ? undefined : countdown(view, receivedAt, now);
  return (
    <div className="x-job" role="status" data-testid="job-progress">
      <p className="x-kicker x-job__title">Asking the radar…</p>
      <p className="x-job__foot">
        {timer?.overdue
          ? "Taking longer than expected. The answer will appear here when it is ready."
          : timer?.remainingSeconds != null
            ? `About ${formatSeconds(timer.remainingSeconds)} left. You can keep exploring.`
            : "Choosing the passes. You can keep exploring."}
      </p>
      <div className="x-problem__actions">
        <button
          type="button"
          className="x-primary x-primary--small"
          onClick={onDetails}
          data-testid="job-details"
        >
          Show details
        </button>
        <button type="button" className="x-ghost" onClick={onCancel}>
          Cancel request
        </button>
      </div>
    </div>
  );
};

type ProblemProps = {
  reasonCode: string;
  detail: string;
  onRetry: () => void;
  onPickCase: () => void;
  // Notes from the plan (why no series was found, which scenes were chosen).
  notes?: string[];
};

export const LiveProblem = ({
  reasonCode,
  detail,
  onRetry,
  onPickCase,
  notes = [],
}: ProblemProps) => {
  const copy: ExplorationProblem = explorationProblem({ reasonCode, detail });
  return (
    <div className="x-problem" role="alert" data-testid="job-error" data-reason={reasonCode}>
      <p className="x-problem__title">{copy.title}</p>
      <p>{copy.body}</p>
      {notes.map((note) => (
        <p key={note} className="x-plan__count">
          {note}
        </p>
      ))}
      <div className="x-problem__actions">
        {copy.retry && (
          <button type="button" className="x-primary x-primary--small" onClick={onRetry}>
            Try again
          </button>
        )}
        <button type="button" className="x-ghost" onClick={onPickCase}>
          Pick a measured case
        </button>
      </div>
    </div>
  );
};
