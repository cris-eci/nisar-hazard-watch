import type { Acquisition } from "@/features/frames/frame.types.ts";

// Draft contract with the data pipeline (NISAC_Data_Lab). Values are mocked until the backend exists.
export type BurnAnalysis = {
  beforeDate: string;
  afterDate: string;
  burnedAreaHa: number;
  meanHvDropDb: number; // mean HV backscatter change inside the burn scar (negative = loss)
  severityHa: { low: number; moderate: number; high: number };
  isMock: true;
};

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

// Deterministic per frame so the mock does not change between renders or reloads.
const seededRandom = (seed: string): number => {
  let hash = 0;
  for (const char of seed) hash = (hash * 31 + char.charCodeAt(0)) >>> 0;
  return (hash % 1000) / 1000;
};

export const mockBurnAnalysis = (
  frameId: string,
  [before, after]: [Acquisition, Acquisition],
): BurnAnalysis => {
  const r = seededRandom(frameId);
  const burnedAreaHa = Math.round(500 + r * 12_000);
  return {
    beforeDate: before.date,
    afterDate: after.date,
    burnedAreaHa,
    meanHvDropDb: -Number((2 + r * 4).toFixed(1)),
    severityHa: {
      low: Math.round(burnedAreaHa * 0.5),
      moderate: Math.round(burnedAreaHa * 0.3),
      high: Math.round(burnedAreaHa * 0.2),
    },
    isMock: true,
  };
};
