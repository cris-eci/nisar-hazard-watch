import { cellsOf, LENS_CARD, STEP_6 } from "@/content/copyV8";
import type { LensEvaluation } from "@/features/explore/exploreSchemas";
import { formatDay } from "@/features/timeline/timelineLayout";

const PERCENT = 100;

// SPECS-v8 §6: under 10 % "a few cells", then tenth, quarter, third, half, most (≥ 60 %).
const WORDS: [number, string][] = [
  [0.1, LENS_CARD.fewCells],
  [0.2, LENS_CARD.aboutATenth],
  [0.3, LENS_CARD.aQuarter],
  [0.4, LENS_CARD.aThird],
  [0.6, LENS_CARD.aboutHalf],
];

export const fractionInWords = (fraction: number): string =>
  WORDS.find(([below]) => fraction < below)?.[1] ?? LENS_CARD.most;

// "New water" only when the backend says the clicked pixel itself carries the dual-darkening
// signature; the share around it comes from the grid signature, not from aoiSummary (any channel).
export const floodHeadline = (evaluation: LensEvaluation | undefined): string | undefined => {
  const pixel = evaluation?.pixelDualDarkening;
  const fraction = evaluation?.dualDarkening?.fraction;
  if (pixel === undefined || fraction === undefined) return undefined;
  return STEP_6.floodHeadline(pixel === "supports", fractionInWords(fraction));
};

// The backend has no dual-darkening flags layer yet; when it ships, the thumbnail and toggle show.
export const ruleLayerOf = <T extends { id: string }>(layers: T[]): T | undefined =>
  layers.find((layer) => layer.id.includes("dual_darkening"));

// "-3" → "3", "-1.5" → "1.5": the caption says "fell 3 dB or more".
const drop = (db: number): string => String(Math.abs(db));

export type RuleBlock = {
  count: number;
  total: number;
  text: string;
  percent: number;
  caption: string | undefined;
};

export const ruleBlockOf = (
  evaluation: LensEvaluation | undefined,
  withThumb: boolean,
): RuleBlock | undefined => {
  const signature = evaluation?.dualDarkening;
  if (signature === undefined || signature.supportedCells <= 0) return undefined;
  const { signatureCells: count, supportedCells: total } = signature;
  const fraction = signature.fraction ?? count / total;
  const policy = evaluation?.dualDarkeningMaxChangeDb;
  const date = evaluation?.targetDate;
  const passes = evaluation?.baselinePasses;
  const brightened = evaluation?.coPolBrightening?.signatureCells;
  const caption =
    policy === undefined || date === undefined || !passes || brightened === undefined
      ? undefined
      : LENS_CARD.ruleCaption(
          withThumb,
          drop(policy.co),
          drop(policy.cross),
          formatDay(date),
          passes,
          brightened,
        );
  return { count, total, text: cellsOf(count, total), percent: fraction * PERCENT, caption };
};
