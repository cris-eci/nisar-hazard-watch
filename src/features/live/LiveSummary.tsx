import { Icon } from "@/features/case-panel/icons";
import { Prov } from "@/features/case-panel/Prov";
import { SOURCE } from "@/features/case-panel/verdicts";
import type { LensId } from "@/features/cases/cases";
import type { Acquisition } from "@/features/frames/frame.types";
import { archiveError, jobSteps, JOB_STEP_COUNT, splitPlan } from "@/features/live/liveQuestion";
import type { LiveJob } from "@/features/live/useLiveJob";
import { formatDay } from "@/features/timeline/timelineLayout";

type ChecklistProps = { lens: LensId; done: number };

// SPECS §3: the six backend steps, the running one pulsing.
export const JobChecklist = ({ lens, done }: ChecklistProps) => (
  <div className="x-job" role="status" data-testid="job-checklist">
    <p className="x-kicker x-kicker--split x-job__title">
      <span>
        Processing radar · step {Math.min(done + 1, JOB_STEP_COUNT)} of {JOB_STEP_COUNT}
      </span>
      <Prov kind="demo" source={SOURCE.liveTiming} />
    </p>
    <ol className="x-steps">
      {jobSteps(lens).map((step, index) => {
        const state = index < done ? "done" : index === done ? "running" : "waiting";
        return (
          <li key={step.label} className="x-step" data-state={state}>
            <span className="x-step__dot">
              <Icon name="tick" size={10} />
            </span>
            {step.label}
          </li>
        );
      })}
    </ol>
    <p className="x-job__foot">
      We read real radar for this exact spot, so it takes about a minute. You can keep exploring.
    </p>
  </div>
);

type JobProblemProps = { job: LiveJob; onPickCase: () => void };

// Loading lives in the checklist; this covers the archive failing and a frame with no passes.
export const JobProblem = ({ job, onPickCase }: JobProblemProps) => {
  if (job.plan?.status === "error") {
    const copy = archiveError(job.plan.error);
    return (
      <div className="x-problem" role="alert" data-testid="job-error">
        <p className="x-problem__title">{copy.title}</p>
        <p>{copy.body}</p>
        <div className="x-problem__actions">
          <button type="button" className="x-primary x-primary--small" onClick={job.retry}>
            Try again
          </button>
          <button type="button" className="x-ghost" onClick={onPickCase}>
            Pick a measured case
          </button>
        </div>
      </div>
    );
  }
  return (
    <div className="x-problem" role="status" data-testid="job-empty">
      <p className="x-problem__title">No NISAR passes planned here yet</p>
      <p>The Observation Plan lists no passes for this frame, so there is nothing to compare.</p>
      <div className="x-problem__actions">
        <button type="button" className="x-ghost" onClick={onPickCase}>
          Pick a measured case
        </button>
      </div>
    </div>
  );
};

const SHOWN_PAST = 3;
const SHOWN_UPCOMING = 2;

type PassListProps = { passes: Acquisition[]; today: string };

// The frame's real schedule, so the demo answer above always sits next to something checkable.
export const PlanPasses = ({ passes, today }: PassListProps) => {
  const { past, upcoming } = splitPlan(passes, today);
  const rows = [
    ...past.slice(-SHOWN_PAST).map((item) => ({ ...item, planned: false })),
    ...upcoming.slice(0, SHOWN_UPCOMING).map((item) => ({ ...item, planned: true })),
  ];
  return (
    <div className="x-panel__block" data-testid="plan-passes">
      <p className="x-kicker x-kicker--split">
        <span>Passes over this frame</span>
        <Prov kind="real" source={SOURCE.plan} />
      </p>
      <p className="x-plan__count">
        {passes.length} passes in the plan · {upcoming.length} still to come
      </p>
      <ul className="x-plan">
        {rows.map((item) => (
          <li key={item.date} data-planned={item.planned}>
            <span>{formatDay(item.date)}</span>
            <span className="x-plan__meta">
              {item.hasCrossPol ? "HH+HV" : "HH only"} · {item.planned ? "planned" : "in the plan"}
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
};
