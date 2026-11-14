import { formatCount, STEP_2, TOP_BAR } from "@/content/copyV8";
import type { Case } from "@/features/cases/cases";
import type { LonLat } from "@/features/frames/frame.types";
import { greatCircleKm } from "@/features/geo/measure";
import type { Coverage } from "@/features/spot/coverageApi";
import { formatDay } from "@/features/timeline/timelineLayout";

const DAY_MS = 86_400_000;
// COPY-v8 §2: the gap note shows only for a gap longer than this.
const GAP_NOTE_DAYS = 24;

// The backend's series key reads `{track}_{A|D}_{frame}_…` ("084_A_018_4005_DHDH").
const DIRECTION_IN_KEY = /^\d+_([AD])_\d+/;

export const directionOf = (seriesKey: string | null | undefined): string | undefined => {
  const letter =
    seriesKey === null || seriesKey === undefined
      ? undefined
      : DIRECTION_IN_KEY.exec(seriesKey)?.[1];
  if (letter === "A") return TOP_BAR.ascending.toUpperCase();
  if (letter === "D") return TOP_BAR.descending.toUpperCase();
  return undefined;
};

export type Gap = { days: number; after: string };

// The longest wait between two measured dates, when it is longer than 24 days.
export const longestGap = (dates: readonly string[]): Gap | undefined => {
  const sorted = [...dates].sort();
  let longest: Gap | undefined;
  for (let index = 1; index < sorted.length; index += 1) {
    const before = sorted[index - 1];
    const after = sorted[index];
    if (before === undefined || after === undefined) continue;
    const days = Math.round((Date.parse(after) - Date.parse(before)) / DAY_MS);
    if (days > GAP_NOTE_DAYS && (longest === undefined || days > longest.days))
      longest = { days, after: before };
  }
  return longest;
};

// The backend answers the square's area; its side is what the card and the footprint show.
export const squareSideKm = (areaKm2: number): number => Math.sqrt(areaKm2);

export type Nearest = { item: Case; km: number };

export const nearestCase = (point: LonLat, cases: readonly Case[]): Nearest | undefined =>
  cases.reduce<Nearest | undefined>((best, item) => {
    const km = greatCircleKm(point, item.focus);
    return best === undefined || km < best.km ? { item, km } : best;
  }, undefined);

// "about 275 km": tens of kilometres are enough for a distance to another continent's case.
export const aboutKm = (km: number): string =>
  formatCount(km < 100 ? Math.max(1, Math.round(km)) : Math.round(km / 10) * 10);

export type SpotView =
  | {
      state: "ready" | "insufficientHistory";
      sideKm: string;
      direction: string | undefined;
      chips: string[];
      gapNote: string | undefined;
    }
  | { state: "noCoverage" };

// Everything the card says comes from the coverage answer; nothing is filled in for it.
export const spotView = (coverage: Coverage): SpotView => {
  const { status, seriesKey, dates } = coverage.plan;
  if (status === "noCoverage") return { state: "noCoverage" };
  const gap = longestGap(dates);
  return {
    state: status,
    sideKm: squareSideKm(coverage.areaKm2).toFixed(2),
    direction: directionOf(seriesKey),
    chips: [...dates].sort().map((date) => formatDay(date, false)),
    gapNote: gap === undefined ? undefined : STEP_2.gapNote(gap.days, formatDay(gap.after, false)),
  };
};
