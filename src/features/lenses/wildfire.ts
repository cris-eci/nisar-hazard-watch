import { cellsOf, WILDFIRE_CARD } from "@/content/copyV8";
import type { CrossPolHistory } from "@/features/explore/exploreSchemas";
import { formatDay } from "@/features/timeline/timelineLayout";

const PERCENT = 100;

// Only the state the design wrote a sentence for; any other state has no headline until it does.
export const wildfireHeadline = (history: CrossPolHistory | undefined): string | undefined =>
  history?.status === "insufficient_assessment_dates" && history.samples.length === 1
    ? WILDFIRE_CARD.oneAssessmentLine
    : undefined;

export type DeclineRow = {
  date: string;
  count: number;
  total: number;
  text: string;
  label: string;
  percent: number;
};

// One row per assessed pass: cells whose HV fell below their band, of the cells measured on all passes.
export const declineRowsOf = (history: CrossPolHistory | undefined): DeclineRow[] => {
  const total = history?.commonCells;
  if (history === undefined || total === undefined || total <= 0) return [];
  return history.samples.map(({ date, declineCells }) => ({
    date,
    count: declineCells,
    total,
    text: cellsOf(declineCells, total),
    label: WILDFIRE_CARD.declineRow(formatDay(date)),
    percent: (declineCells / total) * PERCENT,
  }));
};

export const pixelLineOf = (history: CrossPolHistory | undefined): string | undefined => {
  const n = history?.pixelDeclinePasses;
  const m = history?.pixelAssessedPasses;
  return n === undefined || m === undefined || m <= 0 ? undefined : WILDFIRE_CARD.pixelLine(n, m);
};

export const declineLayerOf = <T extends { id: string }>(layers: T[]): T | undefined =>
  layers.find((layer) => layer.id.includes("cross_pol_decline_count"));
