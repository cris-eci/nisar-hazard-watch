import { Prov } from "@/features/case-panel/Prov";
import { SOURCE } from "@/features/case-panel/verdicts";
import type { Acquisition } from "@/features/frames/frame.types";
import { nextPlannedPass } from "@/features/frames/nextPlannedPass";
import { archiveError, splitPlan } from "@/features/live/liveQuestion";
import type { FramePlan } from "@/features/live/useFramePlan";
import { formatDay } from "@/features/timeline/timelineLayout";

const SHOWN_PAST = 3;
const SHOWN_UPCOMING = 2;

type PassListProps = { passes: Acquisition[]; today: string };

// The frame's real schedule, so the answer above always sits next to something checkable.
export const PlanPasses = ({ passes, today }: PassListProps) => {
  // The plan promises no order: sort so "last few, then next few" reads right.
  const sorted = passes.toSorted((a, b) => a.date.localeCompare(b.date));
  const { past, upcoming } = splitPlan(sorted, today);
  const next = nextPlannedPass(passes, today);
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
          <li
            key={item.date}
            data-planned={item.planned}
            data-next={item.date === next?.date || undefined}
          >
            <span>{formatDay(item.date)}</span>
            <span className="x-plan__meta">
              {item.hasCrossPol ? "HH+HV" : "HH only"} ·{" "}
              {item.date === next?.date ? "next pass" : item.planned ? "planned" : "in the plan"}
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
};

type PlanStateProps = { framePlan: FramePlan; today: string };

// The Observation Plan is supplementary here: its failure never hides the exploration's answer.
export const PlanState = ({ framePlan: { plan, retry }, today }: PlanStateProps) => {
  if (plan?.status === "error") {
    const copy = archiveError(plan.error);
    return (
      <div className="x-panel__block" role="status" data-testid="plan-error">
        <p className="x-kicker">Passes over this frame</p>
        <p className="x-plan__count">{copy.title}.</p>
        <button type="button" className="x-text" onClick={retry}>
          Try again
        </button>
      </div>
    );
  }
  if (plan?.status !== "success") return null;
  if (plan.data.length === 0)
    return (
      <div className="x-panel__block" role="status" data-testid="plan-empty">
        <p className="x-kicker">Passes over this frame</p>
        <p className="x-plan__count">The Observation Plan lists no passes for this frame.</p>
      </div>
    );
  return <PlanPasses passes={plan.data} today={today} />;
};
