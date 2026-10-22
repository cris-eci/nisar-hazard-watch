import type { Acquisition } from "@/features/frames/frame.types";

const RECENT_COUNT = 6;
const UPCOMING_COUNT = 3;

type PassListProps = { acquisitions: Acquisition[]; today: string };

// Oldest first, so the grid reads like a timeline that runs into the upcoming (gold) passes.
export const PassList = ({ acquisitions, today }: PassListProps) => {
  const past = acquisitions.filter((a) => a.date <= today).slice(-RECENT_COUNT);
  const upcoming = acquisitions.filter((a) => a.date > today).slice(0, UPCOMING_COUNT);
  const crossPolCount = acquisitions.filter((a) => a.hasCrossPol).length;
  const allCrossPol = crossPolCount === acquisitions.length;

  return (
    <details data-testid="pass-list" className="x-panel__section x-passes">
      <summary>
        <span className="x-panel__section-title">Satellite passes</span>
        <span className="x-mono x-passes__count">{acquisitions.length} passes in the plan</span>
      </summary>
      <ul className="x-passes__grid">
        {[...past, ...upcoming].map(({ date, hasCrossPol }) => (
          <li key={date} data-upcoming={date > today} data-cross-pol={hasCrossPol}>
            <time dateTime={date}>{date}</time>
          </li>
        ))}
      </ul>
      <p className="x-passes__note">
        {allCrossPol
          ? "All HH+HV."
          : `${crossPolCount} of ${acquisitions.length} with HH+HV; dimmed dates are HH only.`}{" "}
        Gold dates are upcoming. Source: NASA NISAR Observation Plan, which says when the satellite
        looks, not whether the data is processed yet.
      </p>
    </details>
  );
};
