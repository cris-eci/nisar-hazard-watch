type CrossPolBadgeProps = { hasCrossPol: boolean };

// HV is what reveals burned vegetation, so its presence is the one mode detail worth showing.
export const CrossPolBadge = ({ hasCrossPol }: CrossPolBadgeProps) =>
  hasCrossPol ? (
    <span className="rounded bg-sky-500/20 px-1.5 py-0.5 text-xs text-sky-300">HH+HV</span>
  ) : (
    <span className="rounded bg-slate-500/20 px-1.5 py-0.5 text-xs text-slate-400">HH only</span>
  );
