import { AGRICULTURE_CARD, LENS_CARD } from "@/content/copyV8";
import type { ChannelContrast, LensEvaluation } from "@/features/explore/exploreSchemas";
import { formatDay } from "@/features/timeline/timelineLayout";

const ABSENT = "absent_on_sampled_support";
const INSUFFICIENT = "insufficient_data";

// The whiskers sit on one fixed axis, so channels and answers compare at a glance.
export const AXIS_DB = 3;

// "HV_over_HH" is the polarization balance, written HV − HH elsewhere in the app.
const CHANNEL_LABEL: Record<string, string> = { HV_over_HH: "HV − HH" };

// Only the states the backend sent so far have words; any other state gets no headline.
export const agricultureHeadline = (evaluation: LensEvaluation | undefined): string | undefined => {
  const near = evaluation?.neighbours;
  if (near === undefined) return undefined;
  if (near.status === INSUFFICIENT) return AGRICULTURE_CARD.insufficientLine;
  const date = evaluation?.targetDate;
  const states = near.contrasts.map((contrast) => contrast.state);
  if (near.status !== "evaluated" || date === undefined || states.length === 0) return undefined;
  if (states.every((state) => state === ABSENT))
    return AGRICULTURE_CARD.likeNeighbours(formatDay(date));
  if (states.every((state) => state === ABSENT || state === INSUFFICIENT))
    return AGRICULTURE_CARD.unclear(formatDay(date));
  return undefined;
};

const signed = (db: number): string =>
  `${db < 0 ? "−" : db > 0 ? "+" : ""}${Math.abs(db).toFixed(1)}`;

const clamp = (db: number): number => Math.max(-AXIS_DB, Math.min(AXIS_DB, db));

// Position on the fixed −3…+3 dB axis, in percent.
const at = (db: number): number => ((clamp(db) + AXIS_DB) / (2 * AXIS_DB)) * 100;

export type ContrastRow = {
  channel: string;
  label: string;
  value: string;
  interval: string | undefined;
  state: string | undefined;
  mean: number;
  low: number | undefined;
  high: number | undefined;
};

export const contrastRowsOf = (
  contrasts: ChannelContrast[],
  materialDb: number | undefined,
): ContrastRow[] =>
  contrasts.map((contrast) => {
    const interval = contrast.interval95Db;
    return {
      channel: contrast.channel,
      label: CHANNEL_LABEL[contrast.channel] ?? contrast.channel,
      value: `${signed(contrast.meanDb)} dB`,
      interval: interval && `${signed(interval[0])} … ${signed(interval[1])} dB`,
      state:
        contrast.state === ABSENT && materialDb !== undefined
          ? AGRICULTURE_CARD.stateAbsent(String(materialDb))
          : contrast.state === INSUFFICIENT
            ? AGRICULTURE_CARD.stateInsufficient
            : undefined,
      mean: at(contrast.meanDb),
      low: interval && at(interval[0]),
      high: interval && at(interval[1]),
    };
  });

export type NeighboursBlock = {
  counts: string | undefined;
  tooSmall: string | undefined;
  rows: ContrastRow[];
  // The "no difference" band (± material contrast) on the axis, in percent.
  band: [number, number] | undefined;
  caption: string | undefined;
};

export const neighboursBlockOf = (
  evaluation: LensEvaluation | undefined,
): NeighboursBlock | undefined => {
  const near = evaluation?.neighbours;
  if (near === undefined) return undefined;
  const { focalCells, matchedControlCells, comparisonCells, radiusM, minimumCells } = near;
  const material = near.materialContrastDb;
  const rows = near.status === "evaluated" ? contrastRowsOf(near.contrasts, material) : [];
  return {
    counts:
      focalCells === undefined || matchedControlCells === undefined || comparisonCells === undefined
        ? undefined
        : LENS_CARD.surroundingsCounts(focalCells, matchedControlCells, comparisonCells),
    tooSmall:
      near.status === INSUFFICIENT &&
      focalCells !== undefined &&
      radiusM !== undefined &&
      minimumCells !== undefined
        ? AGRICULTURE_CARD.patchTooSmall(focalCells, radiusM, minimumCells)
        : undefined,
    rows,
    band: material === undefined ? undefined : [at(-material), at(material)],
    caption:
      rows.length > 0 && matchedControlCells !== undefined
        ? AGRICULTURE_CARD.whiskerCaption(matchedControlCells)
        : undefined,
  };
};

// The matched control cells: where the patch's neighbours are, for the thumbnail and the globe.
export const neighboursLayerOf = <T extends { id: string }>(layers: T[]): T | undefined =>
  layers.find((layer) => layer.id.includes("agriculture_populations_matched_control"));
