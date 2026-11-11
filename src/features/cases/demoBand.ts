import type { Verdict } from "@/features/cases/cases";

/*
 * DEMO per-pass HH/HV values at the clicked point, from the design handoff. They stay demo until the
 * backend serves `observations` per pass; the chart around them (band rule, gaps) is the real one.
 */

export type PassRole = "baseline" | "excluded" | "target";

export type BandPass = { date: string; role: PassRole; hh: number | null; hv: number | null };

const DATES = [
  "2026-08-03",
  "2026-08-15",
  "2026-08-27",
  "2026-09-08",
  "2026-09-20",
  "2026-10-02",
  "2026-10-14",
];
const ROLES: PassRole[] = [
  "baseline",
  "baseline",
  "baseline",
  "baseline",
  "baseline",
  "excluded",
  "target",
];

const SERIES: Record<Verdict, { hh: Array<number | null>; hv: Array<number | null> }> = {
  departure: {
    hh: [-9.8, -10.4, -9.6, -10.9, -10.1, null, -16.2],
    hv: [-17.1, -17.6, -16.8, -17.9, -17.3, null, -21.0],
  },
  within: {
    hh: [-9.8, -10.4, -9.6, -10.9, -10.1, null, -11.2],
    hv: [-17.1, -17.6, -16.8, -17.9, -17.3, null, -17.0],
  },
  insufficient: {
    hh: [null, -10.4, null, -10.9, null, null, null],
    hv: [null, -17.6, null, -17.9, null, null, null],
  },
};

export const demoBandPasses = (verdict: Verdict): BandPass[] =>
  DATES.map((date, i) => ({
    date,
    role: ROLES[i] ?? "baseline",
    hh: SERIES[verdict].hh[i] ?? null,
    hv: SERIES[verdict].hv[i] ?? null,
  }));

// The backend's diagnostic band is median ± max(3, 3·max(1.4826·MAD, 1)) dB. With these few demo
// passes the MAD term never exceeds the floor, so the half-width is the 3 dB minimum.
export const MIN_HALF_WIDTH_DB = 3;
// At least three earlier passes are needed before a band means anything.
export const MIN_BASELINE_PASSES = 3;

const median = (values: number[]): number | undefined => {
  const sorted = [...values].sort((a, b) => a - b);
  if (sorted.length === 0) return undefined;
  const mid = Math.floor(sorted.length / 2);
  const upper = sorted[mid];
  const lower = sorted[mid - 1];
  if (upper === undefined) return undefined;
  return sorted.length % 2 === 1 || lower === undefined ? upper : (upper + lower) / 2;
};

const mad = (values: number[], centre: number): number =>
  median(values.map((value) => Math.abs(value - centre))) ?? 0;

export type Band = { median: number; low: number; high: number };

export const bandOf = (values: Array<number | null>): Band | undefined => {
  const measured = values.filter((value): value is number => value !== null);
  if (measured.length < MIN_BASELINE_PASSES) return undefined;
  const centre = median(measured);
  if (centre === undefined) return undefined;
  const half = Math.max(MIN_HALF_WIDTH_DB, 3 * Math.max(1.4826 * mad(measured, centre), 1));
  return { median: centre, low: centre - half, high: centre + half };
};

export const isOutside = (value: number | null, band: Band | undefined): boolean =>
  value !== null && band !== undefined && (value < band.low || value > band.high);

export type ChannelBands = { hh: Band | undefined; hv: Band | undefined };

export const bandsFor = (passes: BandPass[]): ChannelBands => {
  const baseline = passes.filter((item) => item.role === "baseline");
  return {
    hh: bandOf(baseline.map((item) => item.hh)),
    hv: bandOf(baseline.map((item) => item.hv)),
  };
};

// The verdict follows from the target pass against both bands, as in the lens worker.
export const verdictOf = (passes: BandPass[]): Verdict => {
  const bands = bandsFor(passes);
  const target = passes.find((item) => item.role === "target");
  if (bands.hh === undefined || bands.hv === undefined || target === undefined)
    return "insufficient";
  if (target.hh === null && target.hv === null) return "insufficient";
  return isOutside(target.hh, bands.hh) || isOutside(target.hv, bands.hv) ? "departure" : "within";
};
