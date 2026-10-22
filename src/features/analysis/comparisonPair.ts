import type { Acquisition } from "@/features/frames/frame.types";

// Burn mapping relies on HV, so only cross-pol passes can be compared.
// Picks the two most recent cross-pol passes on or before `today`.
export const pickComparisonPair = (
  acquisitions: Acquisition[],
  today: string,
): [before: Acquisition, after: Acquisition] | undefined => {
  const usable = acquisitions.filter((a) => a.hasCrossPol && a.date <= today);
  const after = usable.at(-1);
  const before = usable.at(-2);
  return before !== undefined && after !== undefined ? [before, after] : undefined;
};
