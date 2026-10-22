import type { Acquisition } from "@/features/frames/frame.types";
import { CrossPolBadge } from "@/features/frames/FrameLabels";

const RECENT_COUNT = 6;
const UPCOMING_COUNT = 3;

type PassListProps = { acquisitions: Acquisition[]; today: string };

const PassRows = ({ items }: { items: Acquisition[] }) => (
  <ul className="mt-1 divide-y divide-white/5">
    {items.map(({ date, hasCrossPol }) => (
      <li key={date} className="flex items-center justify-between py-1.5 text-sm">
        <time dateTime={date}>{date}</time>
        <CrossPolBadge hasCrossPol={hasCrossPol} />
      </li>
    ))}
  </ul>
);

export const PassList = ({ acquisitions, today }: PassListProps) => {
  const past = acquisitions.filter((a) => a.date <= today);
  const upcoming = acquisitions.filter((a) => a.date > today);
  const crossPolCount = acquisitions.filter((a) => a.hasCrossPol).length;

  return (
    <section data-testid="pass-list">
      <h3 className="text-sm text-slate-300">Satellite passes</h3>
      <p className="mt-1 text-xs text-slate-400">
        {acquisitions.length} passes in the plan · {crossPolCount} with HH+HV
      </p>

      <h4 className="mt-3 text-xs tracking-wide text-slate-500 uppercase">Recent</h4>
      <PassRows items={past.slice(-RECENT_COUNT).reverse()} />

      {upcoming.length > 0 && (
        <>
          <h4 className="mt-3 text-xs tracking-wide text-slate-500 uppercase">Upcoming</h4>
          <PassRows items={upcoming.slice(0, UPCOMING_COUNT)} />
        </>
      )}

      <p className="mt-3 text-xs text-slate-500">
        Source: NASA NISAR Observation Plan. The plan says when the satellite looks, not whether the
        data is already processed; the pipeline confirms that.
      </p>
    </section>
  );
};
