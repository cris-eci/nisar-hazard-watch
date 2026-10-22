import type { Acquisition } from "@/features/frames/frame.types";

// Picks the two most recent passes on or before `today`. Hazards read from HV (like burn mapping)
// can only compare cross-pol passes.
export const pickComparisonPair = (
  acquisitions: Acquisition[],
  today: string,
  requiresCrossPol: boolean,
): [before: Acquisition, after: Acquisition] | undefined => {
  const usable = acquisitions.filter(
    (a) => (a.hasCrossPol || !requiresCrossPol) && a.date <= today,
  );
  const after = usable.at(-1);
  const before = usable.at(-2);
  return before !== undefined && after !== undefined ? [before, after] : undefined;
};
