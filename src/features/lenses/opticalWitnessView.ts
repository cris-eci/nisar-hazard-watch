import { STEP_6, WITNESS } from "@/content/copyV8";
import { OPTICAL, type ContrastGroup, type Matched } from "@/features/cases/cases";
import type { LensEvaluation, OpticalGroup } from "@/features/explore/exploreSchemas";
import { formatDay } from "@/features/timeline/timelineLayout";

// `water_comparison.groups[].id` → the four OPERA classes the UI knows.
export const GROUP = {
  newWater: "new_water",
  stableWater: "stable_water",
  stayedDry: "stable_dry",
  mixed: "mixed",
} as const;

const ROWS = [
  { id: GROUP.newWater, label: WITNESS.groupNewWater, color: OPTICAL.newWater },
  { id: GROUP.stableWater, label: WITNESS.groupStableWater, color: OPTICAL.stableWater },
  { id: GROUP.stayedDry, label: WITNESS.groupStayedDry, color: OPTICAL.dry },
  { id: GROUP.mixed, label: WITNESS.groupMixed, color: OPTICAL.mixed },
] as const;

// Statuses the backend uses for a finished comparison and for one still looking for snapshots.
const READY = "evaluated";
const PENDING = new Set(["pending", "running", "queued"]);
const NO_OPTICAL = "optical_evidence_unavailable";

// "Cells that stayed dry almost never do" only holds at or under the FITS BEST dry ceiling (§6.5).
const DRY_ALMOST_NEVER = 0.05;
const AGREE_FROM = 5;
const TENTHS = 10;

export const groupOf = (
  groups: readonly OpticalGroup[] | undefined,
  id: string,
): OpticalGroup | undefined => groups?.find((group) => group.id === id && group.cells > 0);

// Share of a group's cells that meet the radar rule; undefined for an empty or missing group.
export const shareOf = (group: OpticalGroup | undefined): number | undefined =>
  group === undefined ? undefined : group.signatureCells / group.cells;

export type WitnessView =
  | { state: "pending"; text: string | undefined }
  | { state: "unavailable"; text: string }
  | {
      state: "ready";
      lead: string;
      snapshots: string | undefined;
      bars: ContrastGroup;
      whisker: Matched | undefined;
      point: string | undefined;
    };

const leadOf = (groups: readonly OpticalGroup[]): string | undefined => {
  const share = shareOf(groupOf(groups, GROUP.newWater));
  if (share === undefined) return undefined;
  const inTen = Math.round(share * TENTHS);
  const dry = shareOf(groupOf(groups, GROUP.stayedDry));
  const agrees = inTen >= AGREE_FROM && dry !== undefined && dry <= DRY_ALMOST_NEVER;
  return agrees ? STEP_6.opticalAgree(inTen) : STEP_6.opticalPartly(inTen);
};

// −8.39, with a true minus sign like the rest of the card.
const db = (value: number): string => `${value < 0 ? "−" : ""}${Math.abs(value).toFixed(2)}`;

const whiskerOf = (water: NonNullable<LensEvaluation["water"]>): Matched | undefined => {
  const contrast = water.coPolContrast;
  const pairs = water.matchedPairs;
  if (contrast === undefined || pairs === undefined || pairs <= 0) return undefined;
  const [low, high] = contrast.intervalDb;
  return {
    title: WITNESS.whiskerTitle,
    n: STEP_6.whiskerCaption(pairs),
    v: contrast.medianDb,
    ci: contrast.intervalDb,
    line: WITNESS.whiskerInterval(db(low), db(high)),
  };
};

/*
 * SECOND WITNESS · OPERA OPTICAL: PENDING → READY → UNAVAILABLE (SPECS-v8 §6.4). Every number comes
 * from `water_comparison`; a status or shape we have no words for returns undefined (hidden), so
 * the card never claims an optical result the backend didn't give.
 */
export const witnessOf = (
  evaluation: LensEvaluation | undefined,
  jobActive: boolean,
): WitnessView | undefined => {
  const water = evaluation?.water;
  const d1 = evaluation?.lastBaselineDate;
  const d2 = evaluation?.targetDate;
  const pendingText =
    d1 === undefined || d2 === undefined
      ? undefined
      : STEP_6.opticalPendingText(formatDay(d1), formatDay(d2));

  if (water === undefined) return jobActive ? { state: "pending", text: pendingText } : undefined;
  if (PENDING.has(water.status)) return { state: "pending", text: pendingText };
  if (water.reason === NO_OPTICAL)
    return { state: "unavailable", text: STEP_6.opticalUnavailableText };
  if (water.status !== READY || water.groups === undefined) return undefined;

  const lead = leadOf(water.groups);
  if (lead === undefined) return undefined;
  const { pre, post, groups, pointState } = water;
  const words = pointState === undefined ? undefined : WITNESS.pointState[pointState];
  return {
    state: "ready",
    lead,
    snapshots:
      pre === undefined || post === undefined
        ? undefined
        : WITNESS.snapshots(pre.sensor, formatDay(pre.date), post.sensor, formatDay(post.date)),
    bars: {
      title: STEP_6.opticalTitle,
      sub: "",
      rows: ROWS.flatMap(({ id, label, color }) => {
        const group = groupOf(groups, id);
        return group === undefined
          ? []
          : [{ label, k: group.signatureCells, n: group.cells, color }];
      }),
    },
    whisker: whiskerOf(water),
    point: words === undefined ? undefined : STEP_6.opticalPoint(words),
  };
};
